import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Check,
  LocateFixed,
  MapPin,
  RefreshCw,
  ScanLine,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
  Zap,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/components/brand';
import { StationCard } from '@/components/station-card';
import { StationMap } from '@/components/station-map';
import { AppSheet } from '@/components/ui/app-sheet';
import { Colors, Fonts } from '@/constants/theme';
import { getLiveSessionMetrics, useApp } from '@/context/app-context';
import { usePreferences } from '@/context/preferences-context';
import type { Coordinate } from '@/domain/models';
import { getSessionPresentation } from '@/domain/session-presentation';
import { filterStations } from '@/domain/station-filters';
import { distanceInKm, formatCurrency, formatEnergy } from '@/utils/formatters';

const DEFAULT_COORDINATE: Coordinate = { latitude: -23.5733, longitude: -46.6417 };
const connectors = ['Todos', 'CCS2', 'Tipo 2', 'CHAdeMO'];

export default function HomeScreen() {
  const router = useRouter();
  const wide = useWindowDimensions().width >= 900;
  const {
    user,
    activeSession,
    chargers,
    getCharger,
    getStation,
    isDemoMode,
    isStationsLoading,
    loadNearbyStations,
    stations,
  } = useApp();
  const { preferences } = usePreferences();
  const [query, setQuery] = useState('');
  const [coordinate, setCoordinate] = useState<Coordinate>(DEFAULT_COORDINATE);
  const [hasLocation, setHasLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [stationsError, setStationsError] = useState('');
  const [refreshing, setRefreshing] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [connector, setConnector] = useState('Todos');
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    let active = true;
    loadNearbyStations(coordinate)
      .catch((error) => {
        if (active)
          setStationsError(
            error instanceof Error ? error.message : 'Não foi possível carregar os eletropostos.',
          );
      })
      .finally(() => {
        if (active) setRefreshing(false);
      });
    return () => {
      active = false;
    };
  }, [coordinate, loadNearbyStations, refreshVersion]);

  const matchingStations = useMemo(
    () =>
      filterStations(stations, chargers, {
        query,
        connector,
        availableOnly,
      }).sort(
        (a, b) => distanceInKm(coordinate, a.coordinates) - distanceInKm(coordinate, b.coordinates),
      ),
    [availableOnly, chargers, connector, coordinate, query, stations],
  );
  const availableCount = chargers.filter(
    (charger) =>
      charger.status === 'available' &&
      stations.some(
        (station) => station.id === charger.stationId && station.availableNow !== false,
      ),
  ).length;
  const isRefreshing = refreshing || isStationsLoading;
  const activeCharger = activeSession ? getCharger(activeSession.chargerId) : null;
  const metrics = activeSession
    ? getLiveSessionMetrics(
        activeSession,
        isDemoMode ? (activeCharger?.pricePerKwh ?? 0) : undefined,
      )
    : null;
  const filterCount = Number(availableOnly) + Number(connector !== 'Todos');
  const refreshStations = () => {
    setRefreshing(true);
    setStationsError('');
    setRefreshVersion((value) => value + 1);
  };
  const clearFilters = () => {
    setQuery('');
    setAvailableOnly(false);
    setConnector('Todos');
  };

  async function locate() {
    setLocating(true);
    setLocationError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError(
          'Localização não autorizada. Você pode continuar buscando pelo nome ou endereço.',
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setRefreshing(true);
      setStationsError('');
      setHasLocation(true);
      setCoordinate({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch {
      setLocationError(
        'Não conseguimos localizar você. Confira a permissão de localização ou busque pelo endereço.',
      );
    } finally {
      setLocating(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        role="main"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshStations}
            tintColor={Colors.coral}
            colors={[Colors.coral]}
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Brand compact />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir meu perfil"
              onPress={() => router.push('/profile')}
              style={styles.avatar}
            >
              <UserRound color={Colors.text} size={20} />
            </Pressable>
          </View>
          <View style={[styles.intro, wide && styles.introWide]}>
            <View style={styles.headingRow}>
              <View style={styles.flex}>
                <Text style={styles.muted}>Olá, {user?.name.split(' ')[0]}</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  Sua próxima recarga
                </Text>
              </View>
            </View>
            {activeSession && metrics ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Acompanhar sessão atual"
                onPress={() => router.push('/charging')}
                style={[styles.active, wide && styles.scanWide]}
              >
                <Zap size={24} color={Colors.green} />
                <View style={styles.flex}>
                  <Text style={styles.actionTitle}>
                    {getSessionPresentation(activeSession).label}
                  </Text>
                  <Text style={styles.muted}>
                    {getStation(activeSession.stationId)?.name ?? 'Eletroposto EMPS'}
                  </Text>
                  <Text style={styles.value}>
                    {formatEnergy(metrics.energyKwh)} · {formatCurrency(metrics.totalCost)}
                  </Text>
                </View>
                <ArrowRight size={20} color={Colors.text} />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Escanear QR code do carregador"
                onPress={() => router.push('/scan')}
                style={({ pressed }) => [
                  styles.scan,
                  wide && styles.scanWide,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.scanIcon}>
                  <ScanLine size={26} color={Colors.white} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.actionTitle}>Iniciar uma recarga</Text>
                  <Text style={styles.scanSubtitle}>Escanear QR do carregador</Text>
                </View>
                <ArrowRight color={Colors.white} size={22} />
              </Pressable>
            )}
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <MapPin size={18} color={Colors.cyan} />
              <Text style={styles.statValue}>
                {isRefreshing && !stations.length ? '—' : stations.length}
              </Text>
              <Text style={styles.statLabel}>eletropostos</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Zap size={18} color={Colors.green} />
              <Text style={styles.statValue}>
                {isRefreshing && !chargers.length ? '—' : availableCount}
              </Text>
              <Text style={styles.statLabel}>livres agora</Text>
            </View>
          </View>
          <View style={styles.sectionHeader}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {hasLocation ? 'Perto de você' : 'Encontre um eletroposto'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Usar minha localização"
              disabled={locating}
              onPress={locate}
              style={styles.iconButton}
            >
              {locating ? (
                <ActivityIndicator color={Colors.coral} size="small" />
              ) : (
                <LocateFixed color={hasLocation ? Colors.coral : Colors.textMuted} size={21} />
              )}
            </Pressable>
          </View>
          <View style={styles.searchRow}>
            <View style={styles.search}>
              <Search color={Colors.textFaint} size={20} />
              <TextInput
                accessibilityLabel="Buscar eletropostos"
                placeholder="Nome, bairro ou endereço"
                placeholderTextColor={Colors.textFaint}
                value={query}
                onChangeText={setQuery}
                style={styles.input}
                autoCorrect={false}
                returnKeyType="search"
              />
              {!!query && (
                <Pressable
                  accessibilityLabel="Limpar busca"
                  accessibilityRole="button"
                  onPress={() => setQuery('')}
                  style={styles.iconButton}
                >
                  <X color={Colors.textMuted} size={18} />
                </Pressable>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Filtros de eletropostos, ' + filterCount + ' ativos'}
              onPress={() => setFiltersOpen(true)}
              style={[styles.filterButton, !!filterCount && styles.filterActive]}
            >
              <SlidersHorizontal size={20} color={filterCount ? Colors.coral : Colors.text} />
              {!!filterCount && <Text style={styles.link}>{filterCount}</Text>}
            </Pressable>
          </View>
          <View style={styles.filterRow}>
            <Pressable
              accessibilityRole="checkbox"
              aria-checked={availableOnly}
              accessibilityState={{ checked: availableOnly }}
              onPress={() => setAvailableOnly((value) => !value)}
              style={[styles.chip, availableOnly && styles.filterActive]}
            >
              {availableOnly && <Check size={14} color={Colors.green} />}
              <Text style={styles.chipText}>Disponíveis agora</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setFiltersOpen(true)}
              style={styles.chip}
            >
              <Text style={styles.chipText}>
                {connector === 'Todos' ? 'Conectores' : connector}
              </Text>
            </Pressable>
          </View>
          {!!locationError && (
            <Text accessibilityRole="alert" style={styles.error}>
              {locationError}
            </Text>
          )}
          {!!stationsError && (
            <View style={styles.errorRow}>
              <Text accessibilityRole="alert" style={[styles.error, styles.flex]}>
                {stationsError}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={refreshStations}
                disabled={isRefreshing}
                style={styles.textButton}
              >
                <Text style={styles.link}>Tentar novamente</Text>
              </Pressable>
            </View>
          )}
          <View style={[styles.results, wide && styles.resultsWide]}>
            <View style={[styles.mapColumn, wide && styles.mapWide]}>
              <StationMap
                chargers={chargers}
                stations={matchingStations}
                userCoordinate={coordinate}
                showUserLocation={hasLocation}
                theme={preferences.mapTheme}
                height={wide ? 488 : 300}
                onSelectStation={(id) => router.push({ pathname: '/station/[id]', params: { id } })}
              />
            </View>
            <View style={styles.listColumn}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>
                  {matchingStations.length}{' '}
                  {matchingStations.length === 1 ? 'eletroposto' : 'eletropostos'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Atualizar eletropostos"
                  disabled={isRefreshing}
                  onPress={refreshStations}
                  style={styles.iconButton}
                >
                  {isRefreshing ? (
                    <ActivityIndicator color={Colors.coral} size="small" />
                  ) : (
                    <RefreshCw size={17} color={Colors.textMuted} />
                  )}
                </Pressable>
              </View>
              <View style={styles.stationList}>
                {matchingStations.map((station) => (
                  <StationCard
                    key={station.id}
                    station={station}
                    distanceKm={
                      hasLocation ? distanceInKm(coordinate, station.coordinates) : undefined
                    }
                    onPress={() =>
                      router.push({ pathname: '/station/[id]', params: { id: station.id } })
                    }
                  />
                ))}
                {!matchingStations.length && !isRefreshing && !stationsError && (
                  <View style={styles.empty}>
                    <MapPin color={Colors.textFaint} size={32} />
                    <Text style={styles.listTitle}>Nenhum resultado</Text>
                    <Text style={styles.muted}>Tente outro endereço ou ajuste os filtros.</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={clearFilters}
                      style={styles.textButton}
                    >
                      <Text style={styles.link}>Limpar filtros</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <AppSheet
        visible={filtersOpen}
        title="Filtrar eletropostos"
        onClose={() => setFiltersOpen(false)}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.listTitle}>Disponíveis agora</Text>
          <Switch
            accessibilityLabel="Somente disponíveis agora"
            value={availableOnly}
            onValueChange={setAvailableOnly}
            trackColor={{ false: Colors.border, true: Colors.coralAction }}
          />
        </View>
        <Text style={styles.listTitle}>Tipo de conector</Text>
        <View role="radiogroup" accessibilityLabel="Tipo de conector">
          {connectors.map((value) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              aria-checked={connector === value}
              accessibilityState={{ checked: connector === value }}
              onPress={() => setConnector(value)}
              style={styles.filterOption}
            >
              <Text style={styles.optionText}>{value}</Text>
              {connector === value && <Check size={20} color={Colors.coral} />}
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setFiltersOpen(false)}
          style={styles.applyButton}
        >
          <Text style={styles.actionTitle}>Ver {matchingStations.length} resultados</Text>
        </Pressable>
      </AppSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 30 },
  content: { width: '100%', maxWidth: 1120, paddingHorizontal: 20, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, flex: 1 },
  intro: { paddingVertical: 8 },
  introWide: { flexDirection: 'row', alignItems: 'center', gap: 24, paddingVertical: 24 },
  scanWide: { width: 340 },
  flex: { flex: 1, minWidth: 0 },
  muted: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 12, lineHeight: 19 },
  title: { fontFamily: Fonts.semiBold, fontSize: 25, color: Colors.text, marginTop: 4 },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  link: { color: Colors.coralText, fontFamily: Fonts.semiBold, fontSize: 12 },
  scan: {
    backgroundColor: Colors.coralAction,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  scanIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF18',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { color: Colors.white, fontFamily: Fonts.semiBold, fontSize: 16 },
  scanSubtitle: { color: '#FFFFFFDD', fontFamily: Fonts.regular, fontSize: 12, marginTop: 3 },
  active: {
    borderColor: '#2CD28A66',
    borderWidth: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  value: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 15, marginTop: 8 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: Colors.borderSoft,
    borderBottomWidth: 1,
    paddingVertical: 22,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 20 },
  statLabel: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 11 },
  divider: { backgroundColor: Colors.border, width: 1, height: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  sectionTitle: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 18, flex: 1 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', gap: 10 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    gap: 10,
    borderRadius: 8,
    borderColor: Colors.border,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    color: Colors.text,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: 10,
  },
  filterButton: {
    minWidth: 50,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderColor: Colors.border,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  filterActive: { borderColor: Colors.coral, backgroundColor: Colors.coralSoft },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 18 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { color: Colors.textMuted, fontFamily: Fonts.medium, fontSize: 12 },
  error: {
    color: Colors.yellow,
    fontSize: 12,
    lineHeight: 20,
    fontFamily: Fonts.regular,
    paddingVertical: 10,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  results: { gap: 16 },
  resultsWide: { flexDirection: 'row', alignItems: 'flex-start' },
  mapColumn: { width: '100%' },
  mapWide: { flex: 1.15, width: 'auto', paddingTop: 50 },
  listColumn: { flex: 1, minWidth: 0 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },
  listTitle: { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.text },
  stationList: { gap: 10 },
  empty: { alignItems: 'center', paddingVertical: 30, gap: 12 },
  filterOption: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  optionText: { color: Colors.text, fontSize: 14, fontFamily: Fonts.medium },
  applyButton: {
    minHeight: 50,
    backgroundColor: Colors.coralAction,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
