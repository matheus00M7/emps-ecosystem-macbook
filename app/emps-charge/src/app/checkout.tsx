import * as Haptics from 'expo-haptics';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronDown, CreditCard, Info, QrCode, ShieldCheck, WalletCards, Zap } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { PageHeader } from '@/components/ui/page-header';
import { Colors, Fonts } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { usePreferences } from '@/context/preferences-context';
import { availablePayment, checkoutAmount, demoPayment } from '@/domain/checkout';
import type { PaymentMethod } from '@/domain/models';
import { connectorLabel } from '@/domain/station-filters';
import { formatCurrency } from '@/utils/formatters';

const METHODS = [
  { id: 'pix' as const, title: 'Pix', Icon: QrCode },
  { id: 'card' as const, title: 'Cartão', Icon: CreditCard },
  { id: 'wallet' as const, title: Platform.OS === 'ios' ? 'Apple Pay' : Platform.OS === 'android' ? 'Google Pay' : 'Apple Pay / Google Pay', Icon: WalletCards },
];
const LIMITS = [10, 20, 30];

export default function CheckoutScreen() {
  const { chargerId } = useLocalSearchParams<{ chargerId: string }>();
  const router = useRouter();
  const { activeSession, getCharger, getStation, hasQrBinding, isDemoMode, loadCharger, authorizeSession, cancelSessionAuthorization, startSession } = useApp();
  const { preferences } = usePreferences();
  const charger = getCharger(chargerId);
  const station = charger ? getStation(charger.stationId) : undefined;
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [limit, setLimit] = useState<number | null>(20);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('');
  const [error, setError] = useState('');
  const [entityLoading, setEntityLoading] = useState(!charger || !station);
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    void loadCharger(chargerId).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : 'Carregador não encontrado.');
    }).finally(() => { if (active) setEntityLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, [chargerId, loadCharger]);

  const paymentOptions = charger?.paymentOptions;
  const method = selectedMethod && availablePayment(paymentOptions, selectedMethod, isDemoMode)
    ? selectedMethod : METHODS.find(item => availablePayment(paymentOptions, item.id, isDemoMode))?.id ?? 'card';
  const simulated = demoPayment(paymentOptions, method, isDemoMode);

  function vibrate(type: Haptics.NotificationFeedbackType) {
    if (Platform.OS !== 'web' && preferences.vibration) {
      void Haptics.notificationAsync(type).catch(() => {});
    }
  }

  async function changeSelection(apply: () => void) {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setLoadingLabel('Atualizando pagamento…');
    try {
      await cancelSessionAuthorization();
      if (!mounted.current) return;
      setAuthorized(false);
      setError('');
      apply();
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Não foi possível alterar o pagamento. Tente novamente.');
    } finally {
      submitting.current = false;
      if (mounted.current) setLoading(false);
    }
  }

  async function confirmPayment() {
    if (!charger || submitting.current) return;
    if (limit === null || !Number.isFinite(limit) || limit < 1 || limit > 10000) {
      setError('Informe um valor entre R$ 1,00 e R$ 10.000,00, com até duas casas decimais.');
      return;
    }
    submitting.current = true;
    setLoading(true);
    setError('');
    try {
      if (!authorized) {
        setLoadingLabel(simulated ? 'Confirmando teste…' : 'Autorizando cartão…');
        await authorizeSession({ chargerId: charger.id, paymentMethod: method, spendingLimit: limit });
        if (!mounted.current) return;
        setAuthorized(true);
        if (!simulated) return;
      }
      setLoadingLabel('Iniciando recarga…');
      await startSession({ chargerId: charger.id, paymentMethod: method, spendingLimit: limit });
      if (mounted.current) {
        vibrate(Haptics.NotificationFeedbackType.Success);
        router.replace('/charging');
      }
    } catch (cause) {
      if (mounted.current) {
        setAuthorized(false);
        setError(cause instanceof Error ? cause.message : 'Não foi possível confirmar a recarga. Tente novamente.');
        vibrate(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      submitting.current = false;
      if (mounted.current) setLoading(false);
    }
  }

  if (activeSession) return <Redirect href="/charging" />;
  if ((!charger || !station) && entityLoading) return (
    <SafeAreaView style={styles.safeArea}><View style={styles.missing}><ActivityIndicator color={Colors.coral} /><Text style={styles.missingTitle}>Preparando pagamento…</Text></View></SafeAreaView>
  );
  if (!charger || !station) return (
    <SafeAreaView style={styles.safeArea}><View style={styles.missing}><Text style={styles.missingTitle}>{error || 'Não foi possível carregar o pagamento.'}</Text><AppButton title="Voltar ao início" onPress={() => router.replace('/')} /></View></SafeAreaView>
  );
  if (!isDemoMode && !hasQrBinding(charger.id)) return (
    <SafeAreaView style={styles.safeArea}><View style={styles.missing}><Text style={styles.missingTitle}>Escaneie o QR da vaga antes de continuar.</Text><AppButton title="Abrir leitor de QR" onPress={() => router.replace('/scan')} /></View></SafeAreaView>
  );

  const estimatedEnergy = limit && Number.isFinite(charger.pricePerKwh) && charger.pricePerKwh > 0 ? limit / charger.pricePerKwh : null;
  const buttonTitle = simulated ? 'Confirmar teste e iniciar' : authorized ? 'Iniciar recarga' : 'Autorizar cartão';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} role="main">
          <View style={styles.content}>
            <PageHeader title="Pagamento" subtitle={station.name} />
            <View style={styles.location}><Zap size={17} color={Colors.coral} /><Text style={styles.locationText}>{charger.bay} · {connectorLabel(charger.connectorType)} · {charger.powerKw} kW</Text></View>

            <View style={styles.notice} accessibilityRole="text">
              <Info color={simulated ? Colors.yellow : Colors.textMuted} size={19} />
              <View style={styles.noticeCopy}>
                <Text style={styles.noticeTitle}>{simulated ? 'Pagamento de demonstração' : 'Autorização pelo cartão'}</Text>
                <Text style={styles.body}>{simulated ? 'Confirme para registrar o teste e iniciar a recarga. Nenhum dinheiro será cobrado.' : 'O valor é autorizado antes de iniciar. O acerto acontece conforme o consumo da recarga.'}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Forma de pagamento</Text>
            <View style={styles.methods} accessibilityRole="radiogroup" accessibilityLabel="Forma de pagamento">
              {METHODS.map(({ id, title, Icon }) => {
                const selected = method === id;
                const available = availablePayment(paymentOptions, id, isDemoMode);
                const demo = demoPayment(paymentOptions, id, isDemoMode);
                return (
                  <Pressable key={id} accessibilityRole="radio" accessibilityLabel={`${title}${demo ? ' Demo' : ''}`} accessibilityState={{ checked: selected, disabled: loading || !available }} aria-checked={selected}
                    disabled={loading || !available}
                    onPress={() => { if (!selected) void changeSelection(() => setSelectedMethod(id)); }}
                    style={({ pressed }) => [styles.method, selected && styles.methodSelected, !available && styles.unavailable, pressed && styles.pressed]}>
                    <View style={[styles.methodIcon, selected && styles.methodIconSelected]}><Icon size={22} color={selected ? Colors.coral : Colors.textMuted} /></View>
                    <View style={styles.methodCopy}>
                      <View style={styles.methodHeading}><Text style={styles.methodTitle}>{title}</Text>{demo && <Text style={styles.demoTag}>DEMO</Text>}</View>
                      <Text style={styles.caption}>{!available ? 'Indisponível na configuração atual' : demo ? 'Confirmação fictícia, sem cobrança' : 'Cartão de teste · Stripe Sandbox'}</Text>
                    </View>
                    <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <Check color={Colors.white} size={12} strokeWidth={3} />}</View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Limite da recarga</Text><Text style={styles.caption}>{simulated ? 'Valor de teste' : 'Valor máximo'}</Text></View>
            <View style={styles.amounts} accessibilityRole="radiogroup" accessibilityLabel="Limite da recarga">
              {LIMITS.map(amount => {
                const selected = limit === amount && !customAmount;
                return <Pressable key={amount} accessibilityRole="radio" accessibilityLabel={formatCurrency(amount)} accessibilityState={{ checked: selected, disabled: loading }} aria-checked={selected} disabled={loading}
                  onPress={() => void changeSelection(() => { setLimit(amount); setCustomAmount(''); })}
                  style={({ pressed }) => [styles.amount, selected && styles.amountSelected, pressed && styles.pressed]}>
                  <Text style={[styles.amountText, selected && styles.amountSelectedText]}>{formatCurrency(amount)}</Text>
                </Pressable>;
              })}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Outro valor</Text>
              <View style={[styles.inputWrap, authorized && styles.unavailable]}><Text style={styles.currency}>R$</Text>
                <TextInput accessibilityLabel="Outro valor em reais" keyboardType="decimal-pad" editable={!loading && !authorized} maxLength={9} placeholder="Ex.: 12,50" placeholderTextColor={Colors.textFaint} value={customAmount}
                  onChangeText={value => { setCustomAmount(value); setLimit(checkoutAmount(value)); setError(''); }} style={styles.input} />
              </View>
            </View>

            <View style={styles.summary}>
              <View style={styles.summaryRow}><Text style={styles.body}>Tarifa</Text><Text style={styles.summaryValue}>{formatCurrency(charger.pricePerKwh)}/kWh</Text></View>
              <View style={styles.summaryRow}><Text style={styles.body}>Limite escolhido</Text><Text style={styles.summaryStrong}>{limit === null ? 'Informe um valor' : formatCurrency(limit)}</Text></View>
              {estimatedEnergy !== null && <View style={styles.summaryRow}><Text style={styles.body}>Energia estimada</Text><Text style={styles.summaryValue}>até {estimatedEnergy.toFixed(1).replace('.', ',')} kWh</Text></View>}
              <Pressable accessibilityRole="button" accessibilityLabel="Condições da recarga" accessibilityState={{ expanded: conditionsOpen }} aria-expanded={conditionsOpen} onPress={() => setConditionsOpen(value => !value)} style={styles.conditionsButton}>
                <Text style={styles.conditionsLabel}>Condições da recarga</Text><ChevronDown size={17} color={Colors.textMuted} style={conditionsOpen ? styles.rotated : undefined} />
              </Pressable>
              {conditionsOpen && <Text style={styles.conditionsText}>
                {charger.chargePolicyVersion ? 'A energia é interrompida ao atingir o limite. Após a parada confirmada, há 10 minutos para retirar o conector. A permanência é contabilizada separadamente; a tarifa de permanência ainda não foi definida.' : charger.tariff ? `A tarifa varia de ${formatCurrency(Number(charger.tariff.minimum_tariff_per_kwh))} a ${formatCurrency(Number(charger.tariff.maximum_tariff_per_kwh))}/kWh. Carência para retirada: ${charger.tariff.overstay_grace_minutes} minutos. Permanência: ${charger.tariff.overstay_fee_per_minute == null ? 'não informada' : formatCurrency(Number(charger.tariff.overstay_fee_per_minute)) + '/minuto iniciado'}, limitada a ${charger.tariff.overstay_fee_cap == null ? 'valor não informado' : formatCurrency(Number(charger.tariff.overstay_fee_cap))}. O acerto segue o consumo e as condições registradas pelo servidor.` : 'O valor final depende da energia consumida. O saldo não utilizado segue as condições do meio de pagamento escolhido.'}
              </Text>}
            </View>

            {authorized && <View style={styles.authorized}><Check size={17} color={Colors.green} /><Text style={styles.authorizedText}>Autorização confirmada</Text><Pressable accessibilityRole="button" accessibilityLabel="Alterar valor ou pagamento" disabled={loading} onPress={() => void changeSelection(() => {})}><Text style={styles.changeText}>Alterar</Text></Pressable></View>}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <AppButton title={loading ? loadingLabel : buttonTitle} icon={!loading ? <ShieldCheck size={19} color={Colors.white} /> : undefined} loading={loading} onPress={() => void confirmPayment()} />
            <Text style={styles.footer}>{simulated ? 'Demonstração sem transferência bancária.' : 'Ao confirmar, você aceita a tarifa e as condições desta recarga.'}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { backgroundColor: Colors.background, flex: 1 },
  scroll: { paddingBottom: 30 },
  content: { alignSelf: 'center', maxWidth: 560, paddingHorizontal: 20, width: '100%', gap: 14 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { color: Colors.textMuted, fontFamily: Fonts.medium, fontSize: 12, flexShrink: 1 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.borderSoft },
  noticeCopy: { flex: 1, gap: 5 },
  noticeTitle: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 14 },
  body: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 13, lineHeight: 20 },
  sectionTitle: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 15 },
  methods: { gap: 9 },
  method: { flexDirection: 'row', alignItems: 'center', minHeight: 82, padding: 12, gap: 12, backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1, borderRadius: 8 },
  methodSelected: { borderColor: Colors.coral, backgroundColor: '#FF323A0D' },
  unavailable: { opacity: 0.48 },
  pressed: { opacity: 0.75 },
  methodIcon: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceSoft },
  methodIconSelected: { backgroundColor: Colors.coralSoft },
  methodCopy: { flex: 1, minWidth: 0, gap: 4 },
  methodHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  methodTitle: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 14, flexShrink: 1 },
  demoTag: { color: Colors.yellow, fontFamily: Fonts.semiBold, fontSize: 10 },
  caption: { color: Colors.textFaint, fontFamily: Fonts.regular, fontSize: 11, lineHeight: 17 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: Colors.textFaint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioSelected: { borderColor: Colors.coralAction, backgroundColor: Colors.coralAction },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginTop: 9 },
  amounts: { flexDirection: 'row', gap: 8 },
  amount: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: 4 },
  amountSelected: { borderColor: Colors.coral, backgroundColor: Colors.coralSoft },
  amountText: { color: Colors.textMuted, fontFamily: Fonts.semiBold, fontSize: 13 },
  amountSelectedText: { color: Colors.white },
  inputGroup: { gap: 8 },
  inputLabel: { color: Colors.textMuted, fontFamily: Fonts.medium, fontSize: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, gap: 10 },
  currency: { color: Colors.textMuted, fontFamily: Fonts.medium, fontSize: 15 },
  input: { flex: 1, minWidth: 0, color: Colors.text, fontFamily: Fonts.medium, fontSize: 16, paddingVertical: 12 },
  summary: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.borderSoft, paddingVertical: 16, gap: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  summaryValue: { color: Colors.text, fontFamily: Fonts.medium, fontSize: 13 },
  summaryStrong: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 16 },
  conditionsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 36, gap: 10 },
  conditionsLabel: { color: Colors.textMuted, fontFamily: Fonts.medium, fontSize: 12 },
  rotated: { transform: [{ rotate: '180deg' }] },
  conditionsText: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 12, lineHeight: 20 },
  authorized: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorizedText: { color: Colors.green, fontFamily: Fonts.medium, fontSize: 12, flex: 1 },
  changeText: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 12, paddingVertical: 10 },
  error: { color: Colors.danger, backgroundColor: '#FF4D5712', fontFamily: Fonts.medium, fontSize: 12, lineHeight: 19, borderRadius: 8, padding: 12 },
  footer: { color: Colors.textFaint, fontFamily: Fonts.regular, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  missing: { flex: 1, justifyContent: 'center', gap: 20, padding: 24 },
  missingTitle: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 19, textAlign: 'center' },
});
