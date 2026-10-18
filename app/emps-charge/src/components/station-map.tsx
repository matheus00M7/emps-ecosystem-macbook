import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Colors, Fonts, Radius } from '@/constants/theme';
import type { Charger, Coordinate, Station } from '@/domain/models';

type StationMapProps = {
  stations: Station[];
  chargers: Charger[];
  userCoordinate: Coordinate;
  selectedStationId?: string;
  theme?: 'dark' | 'light';
  showUserLocation?: boolean;
  height?: number;
  onSelectStation: (stationId: string) => void;
};

function buildMapHtml(
  stations: Station[],
  chargers: Charger[],
  user: Coordinate,
  selectedStationId?: string,
  theme: 'dark' | 'light' = 'dark',
  showUserLocation = false,
) {
  const points = stations.map((station) => ({
    id: station.id,
    name: station.name,
    latitude: station.coordinates.latitude,
    longitude: station.coordinates.longitude,
    available:
      station.availableNow === false
        ? 0
        : chargers.filter(
            (charger) => charger.stationId === station.id && charger.status === 'available',
          ).length,
    selected: station.id === selectedStationId,
  }));

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link href="https://unpkg.com/maplibre-gl@5.19.0/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; background: #17191d; }
    .osm-attribution { position: fixed; z-index: 5; right: 4px; bottom: 3px; padding: 2px 5px; border-radius: 3px; background: rgba(255,255,255,.88); color: #222; font: 9px system-ui, sans-serif; }
    .osm-attribution a { color: #222; text-decoration: none; }
    .station-marker { width: 38px; height: 38px; border-radius: 19px; background: #202224; border: 3px solid #ff323a; box-shadow: 0 8px 18px rgba(0,0,0,.38); display: flex; align-items: center; justify-content: center; color: #fff; font: 700 12px system-ui, sans-serif; }
    .station-marker.selected { width: 46px; height: 46px; border-radius: 23px; background: #ff323a; border-color: #fff; }
    .station-marker.empty { border-color: #727981; color: #a7adb5; }
    .user-marker { width: 18px; height: 18px; border-radius: 9px; background: #4d91ff; border: 3px solid white; box-shadow: 0 4px 14px rgba(77,145,255,.65); }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="osm-attribution"><a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a></div>
  <script src="https://unpkg.com/maplibre-gl@5.19.0/dist/maplibre-gl.js" onerror="window.ReactNativeWebView.postMessage('map-error')"></script>
  <script>
    const points = ${JSON.stringify(points).replace(/</g, '\\u003c')};
    const user = ${JSON.stringify(user).replace(/</g, '\\u003c')};
    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://tiles.openfreemap.org/styles/${theme === 'dark' ? 'dark' : 'liberty'}',
      center: [user.longitude, user.latitude],
      zoom: 11.8,
      attributionControl: false
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    const bounds = new maplibregl.LngLatBounds();
    points.forEach((point) => {
      const marker = document.createElement('button');
      marker.className = 'station-marker' + (point.selected ? ' selected' : '') + (point.available === 0 ? ' empty' : '');
      marker.textContent = String(point.available);
      marker.setAttribute('aria-label', point.name + ', ' + point.available + ' disponíveis');
      marker.onclick = () => window.ReactNativeWebView.postMessage('station:' + point.id);
      new maplibregl.Marker({ element: marker }).setLngLat([point.longitude, point.latitude]).addTo(map);
      bounds.extend([point.longitude, point.latitude]);
    });
    if (${showUserLocation}) {
      const userMarker = document.createElement('div');
    userMarker.className = 'user-marker';
    new maplibregl.Marker({ element: userMarker }).setLngLat([user.longitude, user.latitude]).addTo(map);
    bounds.extend([user.longitude, user.latitude]);
      }
    const loadTimeout = setTimeout(() => window.ReactNativeWebView.postMessage('map-error'), 18000);
    map.on('load', () => {
      clearTimeout(loadTimeout);
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 54, maxZoom: 13, duration: 0 });
      window.ReactNativeWebView.postMessage('ready');
    });
    map.on('error', (event) => console.warn('OpenStreetMap tile error', event && event.error));
  </script>
</body>
</html>`;
}

export function StationMap({
  stations,
  chargers,
  userCoordinate,
  selectedStationId,
  onSelectStation,
  theme = 'dark',
  showUserLocation = false,
  height = 310,
}: StationMapProps) {
  const [loadedHtml, setLoadedHtml] = useState('');
  const [failedHtml, setFailedHtml] = useState('');
  const html = useMemo(
    () =>
      buildMapHtml(stations, chargers, userCoordinate, selectedStationId, theme, showUserLocation),
    [chargers, selectedStationId, stations, userCoordinate, theme, showUserLocation],
  );

  if (failedHtml === html) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Mapa temporariamente indisponível</Text>
        <Text style={styles.fallbackCopy}>
          A lista de eletropostos continua disponível logo abaixo.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setFailedHtml('');
            setLoadedHtml('');
          }}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>Recarregar mapa</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      {loadedHtml !== html ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.coral} />
          <Text style={styles.loadingText}>Carregando mapa…</Text>
        </View>
      ) : null}
      <WebView
        allowFileAccess={false}
        applicationNameForUserAgent="EMPSCharge/1.0 (+https://app.emps.com.br)"
        cacheEnabled
        javaScriptEnabled
        onError={() => setFailedHtml(html)}
        onMessage={(event) => {
          const message = event.nativeEvent.data;
          if (message === 'ready') setLoadedHtml(html);
          if (message === 'map-error') setFailedHtml(html);
          if (message.startsWith('station:')) {
            const id = message.slice('station:'.length);
            if (stations.some((station) => station.id === id)) onSelectStation(id);
          }
        }}
        originWhitelist={['https://*']}
        source={{ html, baseUrl: 'https://app.emps.com.br' }}
        style={styles.webview}
      />
      <View pointerEvents="none" style={styles.legend}>
        <View style={styles.legendDot} />
        <Text style={styles.legendText}>número de vagas livres</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  retryButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  retryText: { color: Colors.coralText, fontFamily: Fonts.semiBold, fontSize: 12 },
  container: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 310,
    overflow: 'hidden',
  },
  webview: { backgroundColor: Colors.surface, flex: 1 },
  loading: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    bottom: 0,
    gap: 9,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  loadingText: { color: Colors.textMuted, fontFamily: Fonts.medium, fontSize: 11 },
  legend: {
    alignItems: 'center',
    backgroundColor: '#111318E8',
    borderRadius: Radius.pill,
    top: 12,
    flexDirection: 'row',
    gap: 6,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    position: 'absolute',
  },
  legendDot: { backgroundColor: Colors.coral, borderRadius: 4, height: 7, width: 7 },
  legendText: { color: Colors.textMuted, fontFamily: Fonts.medium, fontSize: 10 },
  fallback: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    height: 230,
    justifyContent: 'center',
    padding: 24,
  },
  fallbackTitle: { color: Colors.text, fontFamily: Fonts.semiBold, fontSize: 14 },
  fallbackCopy: {
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    fontSize: 11,
    textAlign: 'center',
  },
});
