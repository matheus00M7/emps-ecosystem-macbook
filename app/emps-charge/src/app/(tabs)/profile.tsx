import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  CircleHelp,
  History,
  LogOut,
  MapPin,
  Moon,
  ScanLine,
  Settings2,
  ShieldCheck,
  Sun,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppSheet } from '@/components/ui/app-sheet';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Colors, Fonts, MaxContentWidth } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { usePreferences } from '@/context/preferences-context';

function MenuRow({
  icon: Icon,
  title,
  subtitle,
  onPress,
  danger = false,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, danger && styles.dangerIcon]}>
        <Icon color={danger ? Colors.coralText : Colors.textMuted} size={21} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, danger && styles.danger]}>{title}</Text>
        {subtitle && <Text style={styles.muted}>{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color={Colors.textFaint} />
    </Pressable>
  );
}

type Sheet = 'account' | 'settings' | 'help' | 'logout' | null;
const sheetTitles = {
  account: 'Minha conta',
  settings: 'Preferências',
  help: 'Ajuda com a recarga',
  logout: 'Sair da conta?',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, activeSession, isDemoMode } = useApp();
  const { preferences, update, ready, error } = usePreferences();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);
  const initials = user?.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const questions = [
    [
      'Como iniciar uma recarga?',
      'Escolha um eletroposto, confira os conectores e escaneie o QR da vaga. A tarifa e as opções de pagamento são apresentadas antes da confirmação.',
    ],
    [
      'O QR não foi reconhecido. E agora?',
      'Confira se o código pertence à EMPS. Você também pode digitar o código ou colar o link do QR na opção Código do leitor.',
    ],
    [
      'Onde encontro minhas recargas?',
      'Na aba Recargas, selecione o período e encontre o registro pelo eletroposto ou ID. Abra a recarga para consultar seus detalhes e recibo, quando disponível.',
    ],
    [
      'A localização ou a câmera não abre.',
      'Verifique a permissão do aplicativo nos ajustes do aparelho. No navegador, confira as permissões do site. A busca por endereço e a entrada manual continuam disponíveis.',
    ],
  ];

  async function signOut() {
    setLoggingOut(true);
    setLogoutError('');
    try {
      await logout();
    } catch {
      setLogoutError('Não foi possível sair agora. Tente novamente.');
      setLoggingOut(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        role="main"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.content}>
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>EMPS CHARGE</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Meu perfil
            </Text>
          </View>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials || 'EM'}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <View style={styles.accountTag}>
                <ShieldCheck color={Colors.green} size={14} />
                <Text style={styles.accountText}>Conta EMPS</Text>
              </View>
            </View>
          </View>
          <Text style={styles.section}>Minha atividade</Text>
          <MenuRow
            icon={History}
            title="Recargas e recibos"
            subtitle="Histórico, consumo e valores"
            onPress={() => router.push('/history')}
          />
          <MenuRow
            icon={activeSession ? ScanLine : MapPin}
            title={activeSession ? 'Acompanhar recarga' : 'Encontrar eletropostos'}
            onPress={() => router.push(activeSession ? '/charging' : '/')}
          />
          <Text style={styles.section}>Conta e preferências</Text>
          <MenuRow
            icon={UserRound}
            title="Dados da conta"
            subtitle="Nome, e-mail e identificação"
            onPress={() => setSheet('account')}
          />
          <MenuRow
            icon={Settings2}
            title="Preferências"
            subtitle="Mapa e experiência no aparelho"
            onPress={() => setSheet('settings')}
          />
          <MenuRow
            icon={CircleHelp}
            title="Central de ajuda"
            subtitle="Dúvidas sobre sua recarga"
            onPress={() => setSheet('help')}
          />
          <View style={styles.logout}>
            <MenuRow
              icon={LogOut}
              title="Sair da conta"
              danger
              onPress={() => {
                setLogoutError('');
                setSheet('logout');
              }}
            />
          </View>
          <Text style={styles.version}>
            EMPS Charge · {Constants.expoConfig?.version ?? '1.0.0'}
            {isDemoMode ? ' · Demonstração' : ''}
          </Text>
        </View>
      </ScrollView>
      <AppSheet
        visible={sheet !== null}
        title={sheet ? sheetTitles[sheet] : ''}
        onClose={() => {
          if (!loggingOut) setSheet(null);
        }}
      >
        {sheet === 'account' && (
          <>
            <View style={styles.detail}>
              <Text style={styles.muted}>Nome</Text>
              <Text selectable style={styles.detailValue}>
                {user?.name}
              </Text>
            </View>
            <View style={styles.detail}>
              <Text style={styles.muted}>E-mail</Text>
              <Text selectable style={styles.detailValue}>
                {user?.email}
              </Text>
            </View>
            <View style={styles.detail}>
              <Text style={styles.muted}>Identificação da conta</Text>
              <Text selectable style={styles.detailValue}>
                {user?.id}
              </Text>
            </View>
          </>
        )}
        {sheet === 'settings' && (
          <>
            <Text style={styles.rowTitle}>Aparência do mapa</Text>
            {ready && (
              <SegmentedControl
                label="Tema do mapa"
                value={preferences.mapTheme}
                onChange={(mapTheme) => update({ mapTheme })}
                options={[
                  {
                    value: 'dark',
                    label: 'Escuro',
                    icon: <Moon size={16} color={Colors.textMuted} />,
                  },
                  {
                    value: 'light',
                    label: 'Claro',
                    icon: <Sun size={16} color={Colors.textMuted} />,
                  },
                ]}
              />
            )}
            {Platform.OS !== 'web' && (
              <View style={styles.preferenceRow}>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>Vibração do leitor</Text>
                  <Text style={styles.muted}>Ao reconhecer um código</Text>
                </View>
                <Switch
                  accessibilityLabel="Vibração do leitor"
                  disabled={!ready}
                  value={preferences.vibration}
                  onValueChange={(vibration) => update({ vibration })}
                  trackColor={{ false: Colors.border, true: Colors.coralAction }}
                />
              </View>
            )}
            {!!error && (
              <Text accessibilityRole="alert" style={styles.danger}>
                {error}
              </Text>
            )}
          </>
        )}
        {sheet === 'help' &&
          questions.map(([question, answer], index) => (
            <View key={question} style={styles.faq}>
              <Pressable
                accessibilityRole="button"
                aria-expanded={openQuestion === index}
                accessibilityState={{ expanded: openQuestion === index }}
                onPress={() => setOpenQuestion(openQuestion === index ? null : index)}
                style={styles.question}
              >
                <Text style={[styles.rowTitle, styles.flex]}>{question}</Text>
                <ChevronRight
                  size={18}
                  color={Colors.textMuted}
                  style={{ transform: [{ rotate: openQuestion === index ? '90deg' : '0deg' }] }}
                />
              </Pressable>
              {openQuestion === index && <Text style={styles.answer}>{answer}</Text>}
            </View>
          ))}
        {sheet === 'logout' && (
          <>
            <Text style={styles.answer}>
              {activeSession
                ? 'Sair da conta não encerra a recarga em andamento.'
                : 'Você precisará entrar novamente para acessar sua conta.'}
            </Text>
            {!!logoutError && (
              <Text accessibilityRole="alert" style={styles.danger}>
                {logoutError}
              </Text>
            )}
            <AppButton title="Sair da conta" loading={loggingOut} onPress={signOut} />
            <AppButton
              title="Continuar no aplicativo"
              variant="secondary"
              disabled={loggingOut}
              onPress={() => setSheet(null)}
            />
          </>
        )}
      </AppSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 32 },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 20 },
  heading: { paddingTop: 26, paddingBottom: 26 },
  eyebrow: { color: Colors.coralText, fontFamily: Fonts.semiBold, fontSize: 10 },
  title: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 27, marginTop: 5 },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 16,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.coralAction,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: { color: Colors.white, fontFamily: Fonts.semiBold, fontSize: 23 },
  flex: { flex: 1, minWidth: 0 },
  name: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 18 },
  email: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 13, marginTop: 4 },
  accountTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  accountText: { color: Colors.green, fontFamily: Fonts.medium, fontSize: 11 },
  section: {
    color: Colors.textFaint,
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginTop: 26,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 76,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTitle: { color: Colors.text, fontFamily: Fonts.medium, fontSize: 14 },
  muted: {
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 19,
  },
  pressed: { backgroundColor: Colors.surface },
  danger: { color: Colors.coralText, fontFamily: Fonts.medium, fontSize: 13 },
  dangerIcon: { backgroundColor: Colors.coralSoft },
  logout: { marginTop: 24 },
  version: {
    color: Colors.textFaint,
    fontSize: 11,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 28,
  },
  detail: { gap: 6, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailValue: { color: Colors.text, fontFamily: Fonts.medium, fontSize: 15 },
  preferenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faq: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 12 },
  question: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  answer: {
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 22,
    paddingVertical: 8,
  },
});
