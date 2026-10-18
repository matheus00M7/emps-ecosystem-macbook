import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { allowedRoute, createPreviewServer } = require('../scripts/web-readonly-preview.cjs');

test('previa permite autenticacao e consultas, nunca operacoes financeiras ou cadastro', () => {
  for (const path of ['/mobile/v1/auth/login', '/mobile/v1/auth/refresh', '/mobile/v1/auth/logout']) {
    assert.equal(allowedRoute('POST', path), true);
  }
  for (const path of ['/mobile/v1/auth/register', '/mobile/v1/payment-intents',
    '/mobile/v1/charging-sessions/start', '/mobile/v1/charging-sessions/1/stop',
    '/mobile/v1/charging-sessions/1/payment', '/mobile/v1/charging-sessions/1/disconnect',
    '/mobile/v1/reservations', '/auth/login', '/admin/commands']) {
    assert.equal(allowedRoute('POST', path), false, path);
  }
  assert.equal(allowedRoute('GET', '/mobile/v1/charging-sessions'), true);
  assert.equal(allowedRoute('GET', '/v2/station-photos/ab-123'), true);
});

test('ponte autentica no destino HTTPS fixo sem transmitir cookies ou origem local', async () => {
  const calls: { url: string; options: RequestInit }[] = [];
  const server = createPreviewServer({ fetchImpl: async (url: URL, options: RequestInit) => {
    calls.push({ url: String(url), options });
    return Response.json({ data: { ok: true } }, { headers: { 'Set-Cookie': 'not-forwarded=1' } });
  } });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const result = await send((server.address() as AddressInfo).port, '/mobile/v1/auth/login', {
      Origin: 'http://localhost:8081', Cookie: 'not-sent=1', 'Content-Type': 'application/json',
    }, 'POST', JSON.stringify({ email: 'fixture@example.invalid', password: 'fixture-only' }));
    assert.equal(result.status, 200);
    assert.equal(result.headers['access-control-allow-origin'], 'http://localhost:8081');
    assert.equal(result.headers['cache-control'], 'no-store');
    assert.equal(result.headers['set-cookie'], undefined);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.emps-charge.tech/mobile/v1/auth/login');
    assert.equal(calls[0].options.redirect, 'manual');
    assert.deepEqual(calls[0].options.headers, { Accept: 'application/json', 'Content-Type': 'application/json' });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('origem, host, caminho e mutacoes invalidas sao recusados antes de consultar a API', async () => {
  let calls = 0;
  const server = createPreviewServer({ fetchImpl: async () => { calls++; return Response.json({}); } });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    for (const [path, headers, method, expected] of [
      ['/mobile/v1/auth/login', { Origin: 'https://untrusted.example' }, 'POST', 403],
      ['/mobile/v1/auth/login', {}, 'POST', 403],
      ['/mobile/v1/charging-sessions', { Host: 'untrusted.example' }, 'GET', 403],
      ['/mobile/v1/charging-sessions', {}, 'GET', 401],
      ['/mobile/v1/charging-sessions', { 'Sec-Fetch-Site': 'cross-site' }, 'GET', 403],
      ['//untrusted.example/mobile/v1/auth/login', {}, 'POST', 400],
      ['/mobile/v1/%61uth/login', {}, 'POST', 400],
      ['/mobile/v1/auth/register', { Origin: 'http://localhost:8081' }, 'POST', 403],
      ['/mobile/v1/charging-sessions/start', { Origin: 'http://localhost:8081' }, 'POST', 403],
    ] as const) {
      const result = await send(port, path, headers, method);
      assert.equal(result.status, expected, path);
    }
    assert.equal(calls, 0);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('consultas preservam bearer e query; preflight nao acessa a API', async () => {
  let calls = 0;
  const server = createPreviewServer({ fetchImpl: async (url: URL, options: RequestInit) => {
    calls++;
    assert.equal(String(url), 'https://api.emps-charge.tech/mobile/v1/stations/nearby?lat=-23&lng=-46');
    assert.equal((options.headers as Record<string, string>).Authorization, 'Bearer fixture-token');
    return new Response(null, { status: 204 });
  } });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    const preflight = await send(port, '/mobile/v1/auth/login', {
      Origin: 'http://localhost:8081', 'Access-Control-Request-Method': 'POST',
      'Sec-Fetch-Site': 'cross-site',
    }, 'OPTIONS');
    assert.equal(preflight.status, 204);
    assert.equal(calls, 0);
    const result = await send(port, '/mobile/v1/stations/nearby?lat=-23&lng=-46', { Authorization: 'Bearer fixture-token' });
    assert.equal(result.status, 204);
    assert.equal(calls, 1);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('redirecionamentos, falhas e corpos excessivos nao vazam dados nem repetem POST', async () => {
  for (const failure of ['redirect', 'network', 'oversize']) {
    let calls = 0;
    const server = createPreviewServer({ fetchImpl: async () => {
      calls++;
      if (failure === 'network') throw new Error('private upstream detail');
      return new Response(null, { status: 302, headers: { Location: 'https://untrusted.example' } });
    } });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const result = await send((server.address() as AddressInfo).port, '/mobile/v1/auth/login', {
        Origin: 'http://localhost:8081', 'Content-Type': 'application/json',
      }, 'POST', failure === 'oversize' ? 'x'.repeat(16_385) : '{}');
      assert.equal(result.status, failure === 'oversize' ? 413 : 502);
      assert.equal(calls, failure === 'oversize' ? 0 : 1);
      assert.ok(!result.body.includes('private upstream detail'));
      assert.equal(result.headers.location, undefined);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }
});

function send(port: number, path: string, headers: Record<string, string> = {}, method = 'GET', body?: string) {
  return new Promise<{ status: number; headers: import('node:http').IncomingHttpHeaders; body: string }>((resolve, reject) => {
    const request = httpRequest({ host: '127.0.0.1', port, path, method,
      headers: { Host: '127.0.0.1:8082', ...headers } }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode!, headers: response.headers, body: Buffer.concat(chunks).toString() }));
      response.on('error', reject);
    });
    request.on('error', reject);
    request.end(body);
  });
}
