import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import * as React from 'react';
import ts from 'typescript';
import type { Charger, PaymentMethod } from '../src/domain/models';
import { availablePayment, checkoutAmount, demoPayment } from '../src/domain/checkout';
import { connectorLabel } from '../src/domain/station-filters';

type Node = React.ReactElement<Record<string, unknown>>;
function elements(tree: unknown): Node[] {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!React.isValidElement(tree)) return [];
  const node = tree as Node;
  return [node, ...elements(node.props.children)];
}
const flush = () => new Promise<void>(resolve => setImmediate(resolve));

function screen(demoEnabled = true) {
  const values: unknown[] = [];
  const calls: string[] = [];
  let cursor = 0;
  let cancelError = false;
  let authorizeBarrier: Promise<void> | undefined;
  const context = {
    activeSession: null, isDemoMode: false, hasQrBinding: () => true,
    getCharger: (): Charger => ({
      id: '67', publicCode: 'TEST-67', qrToken: 'test-token', stationId: '39',
      label: 'Carregador de teste', bay: 'Vaga 1', connectorType: 'Tipo 2',
      powerKw: 7.4, pricePerKwh: 1.99, status: 'available',
      lastUpdatedAt: '2026-10-16T15:00:00.000Z',
      paymentOptions: { paymentProvider: 'stripe', demoPayments: demoEnabled },
    }),
    getStation: () => ({ id: '39', name: 'Instalacao de teste' }),
    loadCharger: async () => {},
    authorizeSession: async ({ paymentMethod }: { paymentMethod: PaymentMethod }) => { calls.push('authorize:' + paymentMethod); await authorizeBarrier; },
    cancelSessionAuthorization: async () => { calls.push('cancel'); if (cancelError) throw new Error('Cancelamento indisponivel'); },
    startSession: async ({ paymentMethod }: { paymentMethod: PaymentMethod }) => { calls.push('start:' + paymentMethod); },
  };
  const hooks = {
    ...React,
    useState: (initial: unknown) => {
      const slot = cursor++;
      if (!(slot in values)) values[slot] = typeof initial === 'function' ? initial() : initial;
      return [values[slot], (next: unknown) => { values[slot] = typeof next === 'function' ? next(values[slot]) : next; }];
    },
    useRef: (initial: unknown) => {
      const slot = cursor++;
      if (!(slot in values)) values[slot] = { current: initial };
      return values[slot];
    },
    useEffect: () => {},
  };
  const colors = new Proxy({}, { get: () => '#111111' });
  const dependencies: Record<string, unknown> = {
    react: hooks,
    'expo-router': { useLocalSearchParams: () => ({ chargerId: '67' }), useRouter: () => ({ replace: (route: string) => calls.push('navigate:' + route) }), Redirect: 'Redirect' },
    'expo-haptics': { NotificationFeedbackType: { Success: 'success', Error: 'error' }, notificationAsync: async () => { throw new Error('vibracao indisponivel'); } },
    'lucide-react-native': new Proxy({}, { get: (_, name) => String(name) }),
    'react-native': { Platform: { OS: 'ios' }, StyleSheet: { create: (styles: unknown) => styles }, ...Object.fromEntries(['ActivityIndicator', 'KeyboardAvoidingView', 'Pressable', 'ScrollView', 'Text', 'TextInput', 'View'].map(name => [name, name])) },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '@/components/ui/app-button': { AppButton: 'AppButton' },
    '@/components/ui/page-header': { PageHeader: 'PageHeader' },
    '@/constants/theme': { Colors: colors, Fonts: {} },
    '@/context/app-context': { useApp: () => context },
    '@/context/preferences-context': { usePreferences: () => ({ preferences: { vibration: true } }) },
    '@/domain/checkout': { availablePayment, checkoutAmount, demoPayment },
    '@/domain/station-filters': { connectorLabel },
    '@/utils/formatters': { formatCurrency: (value: number) => 'R$ ' + value.toFixed(2).replace('.', ',') },
  };
  const output = { exports: {} as { default: () => unknown } };
  const require = createRequire(path.resolve('package.json'));
  const code = ts.transpileModule(readFileSync('src/app/checkout.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)((name: string) => name in dependencies ? dependencies[name] : require(name), output, output.exports);
  const render = () => { cursor = 0; return output.exports.default(); };
  return {
    calls, render,
    radio: (label: string) => elements(render()).find(node => node.props.accessibilityRole === 'radio' && node.props.accessibilityLabel === label)!,
    button: () => elements(render()).find(node => node.type === 'AppButton')!,
    press: (node: Node) => (node.props.onPress as () => void)(),
    failCancellation: () => { cancelError = true; },
    holdAuthorization: () => { let resolve!: () => void; authorizeBarrier = new Promise<void>(done => { resolve = done; }); return resolve; },
  };
}

test('tela alterna entre Pix, carteira e cartao sem prender a selecao apos autorizar', async () => {
  const s = screen();
  assert.equal(s.radio('Pix Demo').props['aria-checked'], true);
  s.press(s.radio('Cartão')); await flush();
  s.press(s.button()); await flush();
  assert.equal(s.button().props.title, 'Iniciar recarga');
  s.press(s.radio('Apple Pay Demo')); await flush();
  assert.equal(s.radio('Apple Pay Demo').props['aria-checked'], true);
  assert.equal(s.button().props.title, 'Confirmar teste e iniciar');
  s.press(s.button()); await flush();
  assert.deepEqual(s.calls, ['cancel', 'authorize:card', 'cancel', 'authorize:wallet', 'start:wallet', 'navigate:/charging']);
});

test('toque repetido confirma e inicia Pix uma unica vez; vibracao nao interrompe o sucesso', async () => {
  const s = screen();
  const release = s.holdAuthorization();
  const button = s.button();
  s.press(button); s.press(button);
  assert.deepEqual(s.calls, ['authorize:pix']);
  release(); await flush();
  assert.deepEqual(s.calls, ['authorize:pix', 'start:pix', 'navigate:/charging']);
});

test('cancelamento recusado mantem a escolha anterior em vez de fingir troca', async () => {
  const s = screen();
  s.failCancellation();
  s.press(s.radio('Apple Pay Demo')); await flush();
  assert.equal(s.radio('Pix Demo').props['aria-checked'], true);
  assert.equal(s.radio('Apple Pay Demo').props['aria-checked'], false);
  assert.ok(elements(s.render()).some(node => node.props.accessibilityRole === 'alert'));
});

test('API sem Demo nao e substituida por uma confirmacao ficticia local', () => {
  const s = screen(false);
  assert.equal(s.radio('Pix').props.disabled, true);
  assert.equal(s.radio('Apple Pay').props.disabled, true);
  assert.equal(s.radio('Cartão').props['aria-checked'], true);
});
