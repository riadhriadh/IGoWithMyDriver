import { Platform, View, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';

interface MapProps {
  latitude: number;
  longitude: number;
  markers?: Array<{
    latitude: number;
    longitude: number;
    title: string;
    color?: string;
  }>;
  onMapPress?: (coords: { latitude: number; longitude: number }) => void;
}

let MapView: any = null;
let Marker: any = null;
let mapsAvailable = false;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    mapsAvailable = true;
  } catch (error) {
    console.log('react-native-maps non disponible, utilisation de la carte web');
    mapsAvailable = false;
  }
}

export default function Map({ latitude, longitude, markers = [], onMapPress }: MapProps) {
  if (Platform.OS === 'web' || !mapsAvailable) {
    return <WebMap latitude={latitude} longitude={longitude} markers={markers} onMapPress={onMapPress} />;
  }

  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      onPress={(e: any) => {
        if (onMapPress) {
          onMapPress(e.nativeEvent.coordinate);
        }
      }}
    >
      {markers.map((marker, index) => (
        <Marker
          key={index}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.title}
          pinColor={marker.color}
        />
      ))}
    </MapView>
  );
}

function WebMap({ latitude, longitude, markers, onMapPress }: MapProps) {
  const iframeRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'mapClick' && onMapPress) {
        onMapPress({
          latitude: event.data.lat,
          longitude: event.data.lng,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onMapPress]);

  const createMapHTML = () => {
    const markersList = (markers || [])
      .map(
        (m) => `
      {
        lat: ${m.latitude},
        lng: ${m.longitude},
        title: "${m.title}",
        color: "${m.color || 'red'}"
      }`
      )
      .join(',');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map').setView([${latitude}, ${longitude}], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const markers = [${markersList}];

    const iconColors = {
      green: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      red: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      blue: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
    };

    markers.forEach(markerData => {
      const iconUrl = iconColors[markerData.color] || iconColors.red;
      const customIcon = L.icon({
        iconUrl: iconUrl,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      L.marker([markerData.lat, markerData.lng], { icon: customIcon })
        .bindPopup(markerData.title)
        .addTo(map);
    });

    map.on('click', function(e) {
      window.parent.postMessage({
        type: 'mapClick',
        lat: e.latlng.lat,
        lng: e.latlng.lng
      }, '*');
    });
  </script>
</body>
</html>
    `;
  };

  if (Platform.OS === 'web') {
    return (
      <iframe
        ref={iframeRef}
        srcDoc={createMapHTML()}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="Map"
      />
    );
  }

  return <View style={StyleSheet.absoluteFillObject} />;
}
