import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowRight,
  Camera,
  Flashlight,
  Keyboard,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Colors, Fonts } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { usePreferences } from '@/context/preferences-context';

export default function ScanScreen() {
  const router = useRouter();
  const { activeSession, resolveQrCode } = useApp();
  const { preferences } = usePreferences();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [nativeOpening, setNativeOpening] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const scanLock = useRef(false);
  const focused = useRef(true);
  const generation = useRef(0);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      scanLock.current = false;
      setBusy(false);
      setError('');
      setIsFocused(true);
      return () => {
        focused.current = false;
        generation.current += 1;
        setIsFocused(false);
        setTorch(false);
        setCameraReady(false);
      };
    }, []),
  );

  const processCode = useCallback(
    async (value: string) => {
      if (!focused.current || scanLock.current || !value.trim()) return;
      const current = ++generation.current;
      scanLock.current = true;
      setBusy(true);
      setError('');
      try {
        const resolution = await resolveQrCode(value.trim());
        if (!focused.current || current !== generation.current) return;
        if (preferences.vibration && Platform.OS !== 'web')
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.replace({ pathname: '/charger/[id]', params: { id: resolution.charger.id } });
      } catch (failure) {
        if (!focused.current || current !== generation.current) return;
        setError(
          failure instanceof Error
            ? failure.message
            : 'Não foi possível confirmar este código. Tente novamente.',
        );
        if (preferences.vibration && Platform.OS !== 'web')
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } finally {
        if (focused.current && current === generation.current) setBusy(false);
      }
    },
    [preferences.vibration, resolveQrCode, router],
  );

  useEffect(() => {
    if (Platform.OS !== 'android' || mode !== 'camera' || !isFocused) return;
    const subscription = CameraView.onModernBarcodeScanned((result) => {
      void processCode(result.data);
    });
    return () => subscription.remove();
  }, [isFocused, mode, processCode]);

  function resetReader() {
    generation.current += 1;
    scanLock.current = false;
    setBusy(false);
    setError('');
  }
  function switchMode(next: 'camera' | 'manual') {
    resetReader();
    setTorch(false);
    setCameraReady(false);
    setMode(next);
  }
  async function allowCamera() {
    setError('');
    try {
      if (permission && !permission.granted && !permission.canAskAgain) {
        if (Platform.OS === 'web') {
          setError(
            'Permita a câmera nas configurações deste site no navegador e abra o leitor novamente.',
          );
          return;
        }
        await Linking.openSettings();
      } else {
        const result = await requestPermission();
        if (!result.granted)
          setError('Câmera não autorizada. Você pode continuar pela opção Código.');
      }
    } catch {
      setError('Não conseguimos acessar a câmera. Use a opção Código para continuar.');
    }
  }
  async function openNativeScanner() {
    resetReader();
    setNativeOpening(true);
    try {
      if (!CameraView.isModernBarcodeScannerAvailable) {
        setError('O leitor do Android não está disponível. Use a câmera ou a opção Código.');
        return;
      }
      await CameraView.launchScanner({ barcodeTypes: ['qr'] });
    } catch (failure) {
      if (focused.current && !(failure instanceof Error && /cancel/i.test(failure.message)))
        setError('Não foi possível abrir o leitor do Android.');
    } finally {
      if (focused.current) setNativeOpening(false);
    }
  }

  if (activeSession) return <Redirect href="/charging" />;
  const granted = Boolean(permission?.granted);
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          role="main"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.flex}>
                <Text style={styles.eyebrow}>NOVA RECARGA</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  Conectar ao carregador
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar leitor"
                onPress={() => router.replace('/')}
                style={styles.iconButton}
              >
                <X size={22} color={Colors.textMuted} />
              </Pressable>
            </View>
            <SegmentedControl
              label="Método de leitura"
              value={mode}
              onChange={switchMode}
              options={[
                {
                  value: 'camera',
                  label: 'Câmera',
                  icon: <Camera size={18} color={Colors.textMuted} />,
                },
                {
                  value: 'manual',
                  label: 'Código',
                  icon: <Keyboard size={18} color={Colors.textMuted} />,
                },
              ]}
            />
            {mode === 'camera' ? (
              <>
                <View style={styles.cameraShell}>
                  {granted && isFocused && !nativeOpening ? (
                    <CameraView
                      facing="back"
                      enableTorch={torch}
                      style={StyleSheet.absoluteFill}
                      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      onBarcodeScanned={
                        busy || !!error
                          ? undefined
                          : (result: BarcodeScanningResult) => {
                              void processCode(result.data);
                            }
                      }
                      onCameraReady={() => setCameraReady(true)}
                      onMountError={() => {
                        setCameraReady(false);
                        setError(
                          'A câmera não iniciou. Verifique as permissões ou use a opção Código.',
                        );
                      }}
                    />
                  ) : (
                    <View style={styles.permission}>
                      <View style={styles.cameraIcon}>
                        <ScanLine size={42} color={Colors.coral} />
                      </View>
                      <Text style={styles.permissionTitle}>Leia o QR da vaga</Text>
                      <Text style={styles.copy}>
                        A câmera identifica o carregador. Você confere a tarifa antes de iniciar.
                      </Text>
                      <AppButton
                        title="Ativar câmera"
                        icon={<Camera size={18} color={Colors.white} />}
                        onPress={allowCamera}
                        style={styles.cameraButton}
                      />
                    </View>
                  )}
                  {granted && isFocused && !nativeOpening && (
                    <>
                      <View pointerEvents="none" style={styles.frame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                      </View>
                      <View pointerEvents="none" style={styles.cameraHint}>
                        <Text style={styles.hint}>
                          {busy
                            ? 'Verificando carregador...'
                            : error
                              ? 'Leitura pausada'
                              : cameraReady
                                ? 'Centralize o QR da vaga'
                                : 'Iniciando câmera...'}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
                {Platform.OS !== 'web' && (
                  <View style={styles.cameraTools}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={torch ? 'Desligar lanterna' : 'Ligar lanterna'}
                      accessibilityState={{ selected: torch }}
                      disabled={!granted || !cameraReady}
                      onPress={() => setTorch((value) => !value)}
                      style={[styles.iconButton, torch && styles.selected]}
                    >
                      <Flashlight size={20} color={torch ? Colors.coral : Colors.textMuted} />
                    </Pressable>
                    {Platform.OS === 'android' && (
                      <AppButton
                        title="Leitor do Android"
                        variant="secondary"
                        onPress={openNativeScanner}
                        loading={nativeOpening}
                      />
                    )}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.manual}>
                <View style={styles.manualIcon}>
                  <Keyboard size={28} color={Colors.cyan} />
                </View>
                <Text style={styles.manualTitle}>Código do carregador</Text>
                <Text style={styles.copy}>Digite o código da vaga ou cole o link do QR.</Text>
                <TextInput
                  accessibilityLabel="Código ou link do carregador"
                  value={manualCode}
                  onChangeText={(value) => {
                    setManualCode(value);
                    if (!busy) resetReader();
                  }}
                  editable={!busy}
                  placeholder="Código ou link do QR"
                  placeholderTextColor={Colors.textFaint}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  maxLength={2048}
                  onSubmitEditing={() => {
                    if (!busy) {
                      scanLock.current = false;
                      void processCode(manualCode);
                    }
                  }}
                  style={styles.input}
                />
                <AppButton
                  title="Verificar carregador"
                  disabled={!manualCode.trim()}
                  loading={busy}
                  icon={<ArrowRight size={19} color={Colors.white} />}
                  onPress={() => {
                    scanLock.current = false;
                    void processCode(manualCode);
                  }}
                />
              </View>
            )}
            {!!error && (
              <View accessibilityRole="alert" style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                {mode === 'camera' && (
                  <AppButton
                    title="Tentar novamente"
                    variant="secondary"
                    icon={<RotateCcw size={16} color={Colors.text} />}
                    onPress={resetReader}
                  />
                )}
              </View>
            )}
            <View style={styles.security}>
              <ShieldCheck size={20} color={Colors.green} />
              <Text style={styles.securityText}>Nenhuma cobrança é feita ao ler o código.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 28 },
  content: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 24 },
  eyebrow: { color: Colors.coralText, fontFamily: Fonts.semiBold, fontSize: 10, marginBottom: 5 },
  title: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 22 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  selected: { backgroundColor: Colors.coralSoft },
  cameraShell: {
    marginTop: 18,
    width: '100%',
    aspectRatio: 1.1,
    maxHeight: 400,
    minHeight: 280,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22, gap: 12 },
  cameraIcon: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: Colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 18 },
  copy: {
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
  },
  cameraButton: { minWidth: 200, marginTop: 4 },
  frame: {
    width: 210,
    height: 210,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -115,
    marginLeft: -105,
  },
  corner: { position: 'absolute', borderColor: Colors.coral, width: 32, height: 32 },
  topLeft: { left: 0, top: 0, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 12 },
  topRight: { right: 0, top: 0, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 12 },
  bottomLeft: {
    left: 0,
    bottom: 0,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderBottomRightRadius: 12,
  },
  cameraHint: { position: 'absolute', bottom: 16, left: 12, right: 12, alignItems: 'center' },
  hint: {
    backgroundColor: '#000000CC',
    color: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  cameraTools: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
  },
  manual: { paddingVertical: 32, gap: 18 },
  manualIcon: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    backgroundColor: '#36C9DC18',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualTitle: {
    color: Colors.text,
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    minHeight: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  errorBox: {
    backgroundColor: Colors.coralSoft,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF323A55',
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  errorText: { fontFamily: Fonts.medium, color: Colors.coralText, fontSize: 13, lineHeight: 20 },
  security: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  securityText: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 12, flexShrink: 1 },
});
