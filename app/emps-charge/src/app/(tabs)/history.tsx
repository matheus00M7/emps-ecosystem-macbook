import { useFocusEffect, useRouter } from 'expo-router';
import {
  History as HistoryIcon,
  MapPin,
  RefreshCw,
  Search,
  TriangleAlert,
  X,
  Zap,
} from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionCard } from '@/components/session-card';
import { AppButton } from '@/components/ui/app-button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Colors, Fonts, MaxContentWidth } from '@/constants/theme';
import { filterHistory, type HistoryPeriod, type HistoryStatus } from '@/domain/history-filters';
import { useApp } from '@/context/app-context';
import { formatCurrency, formatEnergy } from '@/utils/formatters';

export default function HistoryScreen() {
  const router = useRouter();
  const { activeSession, history, refreshHistory, getStation } = useApp();
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<HistoryPeriod>('all');
  const [status, setStatus] = useState<HistoryStatus>('all');
  const [refreshing, setRefreshing] = useState(true);
  const [refreshError, setRefreshError] = useState('');
  const focused = useRef(false);
  const request = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++request.current;
    setRefreshing(true);
    setRefreshError('');
    try {
      await refreshHistory();
    } catch {
      if (focused.current && request.current === currentRequest) {
        setRefreshError('Não foi possível atualizar o histórico.');
      }
    } finally {
      if (focused.current && request.current === currentRequest) setRefreshing(false);
    }
  }, [refreshHistory]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void refresh();
      return () => {
        focused.current = false;
        request.current += 1;
      };
    }, [refresh]),
  );
  const filtered = filterHistory(
    history,
    { query, period, status },
    (id) => getStation(id)?.name ?? id,
  );
  const totalEnergy = filtered.reduce((sum, item) => sum + item.energyKwh, 0);
  const totalSpent = filtered.reduce((sum, item) => sum + item.totalCost, 0);
  const clearFilters = () => {
    setQuery('');
    setPeriod('all');
    setStatus('all');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[Colors.coral]}
            onRefresh={refresh}
            refreshing={refreshing}
            tintColor={Colors.coral}
          />
        }
        role="main"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>EMPS CHARGE</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Minhas recargas
            </Text>
          </View>

          <SegmentedControl
            label="Período das recargas"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'month', label: 'Este mês' },
              { value: 'week', label: '7 dias' },
            ]}
          />

          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <HistoryIcon color={Colors.cyan} size={18} />
              </View>
              <Text style={styles.summaryValue}>{filtered.length}</Text>
              <Text style={styles.summaryLabel}>recargas</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Zap color={Colors.yellow} size={18} />
              </View>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                numberOfLines={1}
                style={styles.summaryValue}
              >
                {formatEnergy(totalEnergy)}
              </Text>
              <Text style={styles.summaryLabel}>consumidos</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Text style={styles.currencyIcon}>R$</Text>
              </View>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                numberOfLines={1}
                style={styles.summaryValue}
              >
                {formatCurrency(totalSpent)}
              </Text>
              <Text style={styles.summaryLabel}>valor das recargas</Text>
            </View>
          </View>

          {activeSession ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sessão atual</Text>
              <SessionCard onPress={() => router.push('/charging')} session={activeSession} />
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Histórico</Text>
              <Pressable
                accessibilityLabel="Atualizar histórico"
                accessibilityRole="button"
                disabled={refreshing}
                onPress={refresh}
                style={styles.refreshButton}
              >
                <RefreshCw color={refreshing ? Colors.textFaint : Colors.textMuted} size={16} />
              </Pressable>
            </View>
            <View style={styles.search}>
              <Search color={Colors.textFaint} size={18} />
              <TextInput
                accessibilityLabel="Buscar recargas"
                placeholder="Eletroposto ou ID da recarga"
                placeholderTextColor={Colors.textFaint}
                value={query}
                onChangeText={setQuery}
                style={styles.input}
                autoCorrect={false}
              />
              {!!query && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Limpar busca de recargas"
                  onPress={() => setQuery('')}
                  style={styles.refreshButton}
                >
                  <X size={18} color={Colors.textMuted} />
                </Pressable>
              )}
            </View>
            <SegmentedControl
              label="Situação das recargas"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'Todas' },
                { value: 'completed', label: 'Finalizadas' },
                { value: 'pending', label: 'Pendentes' },
              ]}
            />
            {refreshError ? (
              <View accessibilityRole="alert" style={styles.error}>
                <TriangleAlert color={Colors.yellow} size={18} />
                <Text style={styles.errorText}>
                  {refreshError}{' '}
                  {history.length ? 'Os registros anteriores continuam disponíveis.' : ''}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={refreshing}
                  onPress={refresh}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Tentar novamente</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.list}>
              {filtered.map((session) => (
                <SessionCard
                  key={session.id}
                  onPress={() => router.push(`/receipt?sessionId=${session.id}`)}
                  session={session}
                />
              ))}
              {history.length === 0 && refreshing ? (
                <View accessibilityLabel="Atualizando histórico" style={styles.empty}>
                  <ActivityIndicator color={Colors.coral} />
                  <Text style={styles.emptyText}>Atualizando histórico...</Text>
                </View>
              ) : filtered.length === 0 && !refreshError ? (
                <View style={styles.empty}>
                  <HistoryIcon color={Colors.textMuted} size={28} />
                  <Text style={styles.emptyTitle}>
                    {history.length
                      ? 'Nenhuma recarga neste filtro'
                      : 'Sua primeira recarga começa aqui'}
                  </Text>
                  <Text style={styles.emptyText}>
                    {history.length
                      ? 'Altere o período, a busca ou a situação.'
                      : 'Seus registros aparecerão aqui depois da recarga.'}
                  </Text>
                  <AppButton
                    icon={<MapPin color={Colors.text} size={17} />}
                    onPress={history.length ? clearFilters : () => router.push('/')}
                    title={history.length ? 'Limpar filtros' : 'Buscar eletropostos'}
                    variant="secondary"
                  />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.background, flex: 1 },
  scroll: { paddingBottom: 34 },
  content: { alignSelf: 'center', maxWidth: MaxContentWidth, paddingHorizontal: 18, width: '100%' },
  header: { paddingBottom: 24, paddingTop: 26 },
  eyebrow: { color: Colors.coralText, fontFamily: Fonts.semiBold, fontSize: 9, letterSpacing: 0 },
  title: {
    color: Colors.text,
    fontFamily: Fonts.bold,
    fontSize: 27,
    letterSpacing: 0,
    marginTop: 5,
  },
  subtitle: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 12, marginTop: 6 },
  summary: {
    borderColor: Colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: 24,
    paddingHorizontal: 4,
    paddingVertical: 24,
  },
  summaryItem: { alignItems: 'center', flex: 1, minWidth: 0 },
  summaryIcon: { alignItems: 'center', height: 24, justifyContent: 'center' },
  summaryValue: {
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    marginTop: 8,
    maxWidth: '100%',
  },
  summaryLabel: {
    color: Colors.textFaint,
    fontFamily: Fonts.medium,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  summaryDivider: { backgroundColor: Colors.border, width: 1 },
  currencyIcon: { color: Colors.green, fontFamily: Fonts.bold, fontSize: 13 },
  section: { gap: 12, marginBottom: 28 },
  sectionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 16 },
  refreshButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  error: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  errorText: {
    color: Colors.textMuted,
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 12,
    minWidth: 160,
  },
  retryButton: { justifyContent: 'center', minHeight: 44, paddingHorizontal: 4 },
  retryText: { color: Colors.coralText, fontFamily: Fonts.semiBold, fontSize: 12 },
  empty: { alignItems: 'center', gap: 14, paddingVertical: 28 },
  emptyTitle: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 14, textAlign: 'center' },
  emptyText: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 12 },
  list: { gap: 11 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 12,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
});
