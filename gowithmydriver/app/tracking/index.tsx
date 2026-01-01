import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocationTracking } from '@/contexts/LocationContext';
import TrackingControlContext from '@/components/TrackingControlContext';
import { useState, useEffect } from 'react';
import { MapPin, Clock, Battery, Navigation } from 'lucide-react-native';
import { apiClient } from '@/lib/apiClient';

export default function TrackingScreen() {
  const { location, isBackgroundTracking, setCurrentRide, updateDriverStatus, setActiveVehicle } = useLocationTracking();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const response = await apiClient.get<{ vehicles: any[] }>('/drivers/vehicles?isActive=true');
      const data = response.vehicles || [];
      
      if (data && data.length > 0) {
        setVehicles(data);
        setSelectedVehicleId(data[0].id);
        await setActiveVehicle(data[0].id);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const selectVehicle = async (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    await setActiveVehicle(vehicleId);
  };

  const simulateRideStart = async () => {
    const fakeRideId = 'ride-' + Date.now();
    await setCurrentRide(fakeRideId);
    await updateDriverStatus(true, false);
    alert('Course simulée démarrée avec ID: ' + fakeRideId);
  };

  const simulateRideEnd = async () => {
    await setCurrentRide(null);
    await updateDriverStatus(true, true);
    alert('Course terminée');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contrôle du Tracking</Text>
        <TrackingControlContext />
      </View>

      {location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Position Actuelle</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <MapPin size={20} color="#4F46E5" />
              <Text style={styles.infoText}>
                Lat: {location.coords.latitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MapPin size={20} color="#4F46E5" />
              <Text style={styles.infoText}>
                Lng: {location.coords.longitude.toFixed(6)}
              </Text>
            </View>
            {location.coords.speed !== null && (
              <View style={styles.infoRow}>
                <Navigation size={20} color="#10B981" />
                <Text style={styles.infoText}>
                  Vitesse: {(location.coords.speed * 3.6).toFixed(1)} km/h
                </Text>
              </View>
            )}
            {location.coords.heading !== null && (
              <View style={styles.infoRow}>
                <Navigation size={20} color="#F59E0B" />
                <Text style={styles.infoText}>
                  Direction: {location.coords.heading.toFixed(0)}°
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Clock size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                {new Date(location.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {vehicles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Véhicule Actif</Text>
          <View style={styles.card}>
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleItem,
                  selectedVehicleId === vehicle.id && styles.vehicleItemActive,
                ]}
                onPress={() => selectVehicle(vehicle.id)}
              >
                <Text style={[
                  styles.vehicleText,
                  selectedVehicleId === vehicle.id && styles.vehicleTextActive,
                ]}>
                  {vehicle.brand} {vehicle.model} - {vehicle.plate_number}
                </Text>
                <Text style={styles.vehicleType}>{vehicle.type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {isBackgroundTracking && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Simulation de Course</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.button} onPress={simulateRideStart}>
              <Text style={styles.buttonText}>Démarrer une course</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={simulateRideEnd}
            >
              <Text style={styles.buttonText}>Terminer la course</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.card}>
          <Text style={styles.infoDescription}>
            Le tracking GPS enregistre automatiquement votre position dans le backend avec:
          </Text>
          <Text style={styles.bulletPoint}>• Votre position GPS</Text>
          <Text style={styles.bulletPoint}>• Le véhicule actif</Text>
          <Text style={styles.bulletPoint}>• La course en cours (si applicable)</Text>
          <Text style={styles.bulletPoint}>• Le niveau de batterie</Text>
          <Text style={styles.bulletPoint}>• Votre statut (online/disponible)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  vehicleItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#4F46E5',
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  vehicleTextActive: {
    color: '#4F46E5',
  },
  vehicleType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonSecondary: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginBottom: 4,
  },
});
