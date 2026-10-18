const http = require('node:http');
const { Buffer } = require('node:buffer');

const API_ORIGIN = 'https://api.emps-charge.tech';
const PORT = 8082;
const WEB_ORIGINS = new Set(['http://localhost:8081', 'http://127.0.0.1:8081']);
const HOSTS = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);
const AUTH_PATHS = new Set([
  '/mobile/v1/auth/login', '/mobile/v1/auth/refresh', '/mobile/v1/auth/logout',
]);
const READ_PATHS = [
  /^\/mobile\/v1\/auth\/me$/,
  /^\/mobile\/v1\/stations\/(?:nearby|[A-Za-z0-9_-]+)$/,
  /^\/mobile\/v1\/chargers\/[A-Za-z0-9_-]+$/,
  /^\/mobile\/v1\/qr\/[A-Za-z0-9_-]+$/,
  /^\/mobile\/v1\/charging-sessions(?:\/(?:[A-Za-z0-9_-]+)(?:\/billing)?)?$/,
  /^\/mobile\/v1\/payment-intents\/[A-Za-z0-9_-]+$/,
  /^\/mobile\/v1\/reservations(?:\/[A-Za-z0-9_-]+)?$/,
  /^\/(?:public|v2)\/station-photos\/[a-f0-9-]+$/,
];

function allowedRoute(method, pathname) {
  return method === 'POST' ? AUTH_PATHS.has(pathname)
    : method === 'GET' && READ_PATHS.some((pattern) => pattern.test(pathname));
}

function json(response, status, message) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify({ message }));
}

function createPreviewServer({ fetchImpl = fetch } = {}) {
  return http.createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Vary', 'Origin');
    const origin = request.headers.origin;
    if (!HOSTS.has(request.headers.host) || (origin && !WEB_ORIGINS.has(origin)) ||
      (!origin && request.headers['sec-fetch-site'] === 'cross-site')) {
      return json(response, 403, 'Origem não autorizada na prévia local.');
    }
    if (origin) response.setHeader('Access-Control-Allow-Origin', origin);
    const method = request.method === 'OPTIONS'
      ? request.headers['access-control-request-method'] : request.method;
    // No arbitrary target, credentials, database connection, or operational writes.
    if (!request.url?.startsWith('/') || request.url.startsWith('//') ||
      /[\\%#]/.test(request.url.split('?')[0])) {
      return json(response, 400, 'Caminho inválido.');
    }
    const target = new URL(request.url, API_ORIGIN);
    if (target.origin !== API_ORIGIN || !allowedRoute(method, target.pathname)) {
      return json(response, 403, 'A prévia local permite somente login e consultas.');
    }
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      });
      return response.end();
    }
    if (method === 'POST' && (!origin ||
      !request.headers['content-type']?.startsWith('application/json'))) {
      return json(response, 403, 'Autenticação deve partir da prévia do aplicativo.');
    }
    const publicRead = target.pathname.startsWith('/public/station-photos/');
    const authRead = target.pathname === '/mobile/v1/auth/login' ||
      target.pathname === '/mobile/v1/auth/refresh';
    if (!publicRead && !authRead && !/^Bearer \S+$/.test(request.headers.authorization ?? '')) {
      return json(response, 401, 'Entre com sua conta EMPS.');
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14_000);
    response.on('close', () => controller.abort());
    try {
      let body;
      if (method === 'POST') {
        const chunks = [];
        let size = 0;
        for await (const chunk of request) {
          size += chunk.length;
          if (size > 16_384) return json(response, 413, 'Solicitação muito grande.');
          chunks.push(chunk);
        }
        body = Buffer.concat(chunks);
      }
      const headers = { Accept: 'application/json' };
      if (method === 'POST') headers['Content-Type'] = 'application/json';
      if (request.headers.authorization) headers.Authorization = request.headers.authorization;
      const upstream = await fetchImpl(target, {
        method, headers, body, redirect: 'manual', signal: controller.signal,
      });
      if (upstream.status >= 300 && upstream.status < 400) {
        await upstream.body?.cancel();
        return json(response, 502, 'Redirecionamento inesperado da API.');
      }
      const chunks = [];
      let size = 0;
      if (upstream.body) {
        for await (const chunk of upstream.body) {
          size += chunk.length;
          if (size > 10 * 1024 * 1024) throw new Error('response too large');
          chunks.push(Buffer.from(chunk));
        }
      }
      response.writeHead(upstream.status, {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      });
      response.end(Buffer.concat(chunks));
    } catch {
      if (!response.headersSent && !response.destroyed) {
        json(response, 502, 'Não foi possível consultar a API oficial. Tente novamente.');
      }
    } finally {
      clearTimeout(timeout);
    }
  });
}

if (require.main === module) {
  const server = createPreviewServer();
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`EMPS: previa local de leitura em http://127.0.0.1:${PORT}`);
  });
  server.on('error', () => {
    console.error('Nao foi possivel iniciar a previa local; confira a porta 8082.');
    process.exitCode = 1;
  });
}

module.exports = { allowedRoute, createPreviewServer };
