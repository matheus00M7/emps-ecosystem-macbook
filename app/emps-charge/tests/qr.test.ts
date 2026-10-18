import assert from 'node:assert/strict';
import test from 'node:test';

import { parseEmpsQrPublicToken, resolveEmpsQr } from '../src/utils/qr';
import { chargerQrUrl } from '../../../site/emps-site-main/frontend/domain/charger-qr';

test('QR gerado pelo painel local usa endereco publico aceito pelo app', () => {
  const token = 'test-public-token_123-ABC';
  const link = chargerQrUrl(token);
  assert.equal(link, `https://emps-charge.tech/charge/${token}`);
  assert.deepEqual(parseEmpsQrPublicToken(link), { ok: true, publicToken: token });
});

test('link publico preserva o token codificado e aceita www', () => {
  const token = 'test-token:123/ABC+value=';
  const link = chargerQrUrl(token);
  assert.equal(new URL(link).pathname, `/charge/${encodeURIComponent(token)}`);
  assert.deepEqual(parseEmpsQrPublicToken(link), { ok: true, publicToken: token });
  assert.deepEqual(parseEmpsQrPublicToken(link.replace('https://', 'https://www.')), {
    ok: true,
    publicToken: token,
  });
});

test('endereco local e variantes falsas do dominio atual nao sao links oficiais', () => {
  for (const link of [
    'http://localhost:3010/charge/test-token',
    'http://emps-charge.tech/charge/test-token',
    'https://emps-charge.tech.golpe.example/charge/test-token',
    'https://emps-charge.tech@untrusted.example/charge/test-token',
  ]) {
    assert.equal(parseEmpsQrPublicToken(link).ok, false, link);
  }
});

test('resolve um código curto de vaga', () => {
  assert.deepEqual(resolveEmpsQr('EMPS-PAULISTA-A01'), { ok: true, chargerId: 'chg_001' });
});

test('resolve um Universal Link HTTPS confiável', () => {
  assert.deepEqual(resolveEmpsQr('https://app.emps.com.br/c/paulista-a01-demo'), {
    ok: true,
    chargerId: 'chg_001',
  });
});

test('resolve um deep link interno do aplicativo', () => {
  assert.deepEqual(resolveEmpsQr('emps://charger/chg_001'), {
    ok: true,
    chargerId: 'chg_001',
  });
});

test('rejeita domínio parecido, mas não autorizado', () => {
  const result = resolveEmpsQr('https://app.emps.com.br.golpe.example/c/paulista-a01-demo');
  assert.equal(result.ok, false);
});

test('rejeita link HTTP mesmo no domínio correto', () => {
  const result = resolveEmpsQr('http://app.emps.com.br/c/paulista-a01-demo');
  assert.equal(result.ok, false);
});

test('explica que o QR do Expo não identifica um carregador', () => {
  const result = resolveEmpsQr('exp://192.168.0.10:8081');
  assert.deepEqual(result, {
    ok: false,
    message:
      'Esse é o QR do Expo, usado apenas para abrir o aplicativo. Escaneie o QR EMPS da vaga.',
  });
});

test('rejeita código desconhecido', () => {
  const result = resolveEmpsQr('EMPS-NAO-EXISTE');
  assert.equal(result.ok, false);
});
