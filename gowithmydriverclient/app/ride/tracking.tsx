import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cancelRide, getRideById, subscribeToRideUpdates, calculateDistance } from '@/services/rideService';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Phone, X, User, Car, Star, MapPin, Navigation, Bell } from 'lucide-react-native';
import Map from '@/components/Map';

export default function TrackingScreen() {
  const { passenger } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const rideId = params.rideId as string;

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDriverNearby, setIsDriverNearby] = useState(false);
  const [hasShownNearbyAlert, setHasShownNearbyAlert] = useState(false);

  useEffect(() => {
    if (rideId) {
      loadRide();

      const unsubscribe = subscribeToRideUpdates(rideId, (updatedRide) => {
        setRide((prev: any) => ({ ...prev, ...updatedRide }));

        if (updatedRide.status === 'completed') {
          router.replace({
            pathname: '/ride/rate',
            params: { rideId },
          });
        }
      });

      return unsubscribe;
    }
  }, [rideId]);

  useEffect(() => {
    if (ride?.driver?.current_latitude && ride?.driver?.current_longitude && ride?.pickup_latitude && ride?.pickup_longitude) {
      const distance = calculateDistance(
        ride.driver.current_latitude,
        ride.driver.current_longitude,
        ride.pickup_latitude,
        ride.pickup_longitude
      );

      const nearby = distance < 0.5;
      setIsDriverNearby(nearby);

      if (nearby && !hasShownNearbyAlert && ride.status === 'accepted') {
        setHasShownNearbyAlert(true);
        Alert.alert(
          'Chauffeur à proximité',
          'Votre chauffeur arrive dans quelques instants. Préparez-vous !',
          [{ text: 'OK' }]
        );
      }
    }
  }, [ride?.driver?.current_latitude, ride?.driver?.current_longitude]);

  const loadRide = async () => {
    try {
      const data = await getRideById(rideId);
      setRide(data);
    } catch (error) {
      console.error('Error loading ride:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du trajet');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = () => {
    if (!ride || !['accepted', 'arriving'].includes(ride.status)) {
      return;
    }

    Alert.alert(
      'Annuler la course',
      'Êtes-vous sûr de vouloir annuler cette course ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRide(rideId, 'Annulé par le passager');
              router.replace('/(tabs)');
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible d\'annuler la course');
            }
          },
        },
      ]
    );
  };

  const handleCallDriver = () => {
    if (ride?.driver?.phone_number) {
      Alert.alert('Appeler le chauffeur', `Voulez-vous appeler ${ride.driver.full_name} ?`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Appeler', onPress: () => {} },
      ]);
    }
  };

  const getStatusText = () => {
    if (!ride) return 'Chargement...';

    if (isDriverNearby && ride.status === 'accepted') {
      return 'Le chauffeur approche !';
    }

    switch (ride.status) {
      case 'accepted':
        return 'Chauffeur en route vers vous';
      case 'arriving':
        return 'Chauffeur à proximité';
      case 'in_progress':
        return 'Course en cours';
      case 'completed':
        return 'Course terminée';
      case 'cancelled':
        return 'Course annulée';
      default:
        return 'En attente';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingTitle}>Chargement...</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Trajet introuvable</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.cancelButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const markers = [];
  if (ride.pickup_latitude && ride.pickup_longitude) {
    markers.push({
      latitude: ride.pickup_latitude,
      longitude: ride.pickup_longitude,
      title: 'Départ',
      color: 'green',
    });
  }
  if (ride.dropoff_latitude && ride.dropoff_longitude) {
    markers.push({
      latitude: ride.dropoff_latitude,
      longitude: ride.dropoff_longitude,
      title: 'Arrivée',
      color: 'red',
    });
  }
  if (ride.driver?.current_latitude && ride.driver?.current_longitude) {
    markers.push({
      latitude: ride.driver.current_latitude,
      longitude: ride.driver.current_longitude,
      title: 'Chauffeur',
      color: 'blue',
    });
  }

  const mapCenter = ride.driver?.current_latitude
    ? { latitude: ride.driver.current_latitude, longitude: ride.driver.current_longitude }
    : { latitude: ride.pickup_latitude, longitude: ride.pickup_longitude };

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <Map
          latitude={mapCenter.latitude}
          longitude={mapCenter.longitude}
          markers={markers}
        />
      </View>

      <View style={[styles.statusBar, isDriverNearby && styles.statusBarHighlight]}>
        <View style={styles.statusContent}>
          {isDriverNearby && ride.status === 'accepted' && (
            <Bell size={20} color="#10B981" style={styles.notificationIcon} />
          )}
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusText, isDriverNearby && styles.statusTextHighlight]}>
              {getStatusText()}
            </Text>
            {ride.price && (
              <Text style={styles.priceText}>{ride.price.toFixed(2)} €</Text>
            )}
          </View>
        </View>
      </View>

      {ride.driver && (
        <View style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <View style={styles.driverAvatar}>
              <User size={32} color="white" />
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{ride.driver.full_name}</Text>
              <View style={styles.ratingContainer}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{ride.driver.rating_average.toFixed(1)}</Text>
              </View>
              <View style={styles.vehicleInfo}>
                <Car size={16} color="#6B7280" />
                <Text style={styles.vehicleText}>
                  {ride.driver.vehicle_make} {ride.driver.vehicle_model}
                </Text>
              </View>
              {ride.driver.vehicle_plate && (
                <Text style={styles.licensePlate}>{ride.driver.vehicle_plate}</Text>
              )}
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCallDriver}>
                <Phone size={20} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.addressContainer}>
            <View style={styles.addressRow}>
              <MapPin size={16} color="#10B981" />
              <Text style={styles.addressText} numberOfLines={1}>{ride.pickup_address}</Text>
            </View>
            <View style={styles.addressRow}>
              <Navigation size={16} color="#EF4444" />
              <Text style={styles.addressText} numberOfLines={1}>{ride.dropoff_address}</Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.cancelFloatingButton} onPress={handleCancelRide}>
        <X size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 40,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBar: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusBarHighlight: {
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusTextHighlight: {
    color: '#10B981',
  },
  priceText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: 'bold',
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 4,
  },
  addressContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  driverCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 16,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  licensePlate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  driverActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelFloatingButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});
