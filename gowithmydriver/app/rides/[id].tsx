import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  MapPin,
  Navigation as NavigationIcon,
  Phone,
  Clock,
  User,
  Car,
  Euro,
  ChevronLeft,
  MapPinned,
  MessageCircle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import { locationService } from '@/services/locationService';
import { rideService, Ride as RideType } from '@/services/rideService';

// Using Ride type from rideService

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { location: driverLocation } = useLocation();
  const [ride, setRide] = useState<RideType | null>(null);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  
  // Swiper animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const SWIPE_THRESHOLD = 200;

  useEffect(() => {
    loadRide();
    console.log('ride--loadRide', ride);
    console.log('id--loadRide', id);
  }, [id]);

  const loadRide = async () => {
    setLoading(true);
    try {
      const rideData = await rideService.getRideById(id as string);
      setRide(rideData);
    } catch (error) {
      console.error('Error loading ride:', error);
    }
    setLoading(false);
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      requested: 'Nouvelle demande',
      accepted: 'Acceptée',
      en_route_to_pickup: 'En route vers le client',
      arrived_at_pickup: 'Arrivé sur place',
      passenger_onboard: 'Client à bord',
      arrived_at_destination: 'Arrivé à destination',
      completed: 'Terminée',
      cancelled: 'Annulée',
      no_show: 'Client absent',
      scheduled: 'Planifiée',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      requested: '#34C759',
      accepted: '#007AFF',
      en_route_to_pickup: '#5856D6',
      arrived_at_pickup: '#FF9500',
      passenger_onboard: '#FF3B30',
      arrived_at_destination: '#FF6B00',
      completed: '#8E8E93',
      cancelled: '#8E8E93',
      no_show: '#FF3B30',
      scheduled: '#5AC8FA',
    };
    return colorMap[status] || '#8E8E93';
  };

  const getNextAction = (status: string) => {
    const actionMap: { [key: string]: { text: string; nextStatus: string; timestampField?: string } } = {
      accepted: {
        text: 'En route vers le client',
        nextStatus: 'en_route_to_pickup',
        timestampField: 'pickup_started_at'
      },
      en_route_to_pickup: {
        text: 'Arrivé sur place',
        nextStatus: 'arrived_at_pickup',
        timestampField: 'arrived_at_pickup_at'
      },
      arrived_at_pickup: {
        text: 'Client à bord',
        nextStatus: 'passenger_onboard',
        timestampField: 'trip_started_at'
      },
      passenger_onboard: {
        text: 'Arrivé à destination',
        nextStatus: 'arrived_at_destination',
        timestampField: 'arrived_at_destination_at'
      },
      arrived_at_destination: {
        text: 'Terminer la course',
        nextStatus: 'completed',
        timestampField: 'completed_at'
      },
    };
    return actionMap[status];
  };

  const acceptRide = async () => {
    if (!user || !ride) return;

    try {
      await rideService.acceptRide(ride.id);
      loadRide();
    } catch (error) {
      console.error('Error accepting ride:', error);
      Alert.alert('Erreur', 'Impossible d\'accepter la course');
    }
  };

  const updateRideStatus = async (newStatus: string, timestampField?: string) => {
    if (!ride) return;

    setSwiping(true);
    try {
      if (newStatus === 'passenger_onboard' || newStatus === 'in_progress') {
        await rideService.startRide(ride.id);
      } else if (newStatus === 'completed') {
        await rideService.completeRide(ride.id, {
          finalPrice: ride.estimatedPrice || 0,
          actualDistance: 0,
          actualDuration: 0,
        });
      }
      loadRide();
    } catch (error) {
      console.error('Error updating ride:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la course');
    } finally {
      setSwiping(false);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const createSwipeHandler = (action: () => void) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setSwiping(true);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx <= SWIPE_THRESHOLD) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= SWIPE_THRESHOLD) {
          Animated.spring(slideAnim, {
            toValue: SWIPE_THRESHOLD,
            useNativeDriver: true,
          }).start(() => {
            action();
          });
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start(() => {
            setSwiping(false);
          });
        }
      },
    });
  };

  const cancelRide = async () => {
    if (!ride) return;

    Alert.alert(
      'Annuler la course',
      'Êtes-vous sûr de vouloir annuler cette course ?',
      [
        {
          text: 'Non',
          style: 'cancel',
        },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await rideService.cancelRide(ride.id, {
                reason: 'Annulé par le chauffeur',
                cancelledBy: 'driver',
              });
              loadRide();
            } catch (error) {
              console.error('Error cancelling ride:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler la course');
            }
          },
        },
      ]
    );
  };

  const markNoShow = async () => {
    if (!ride) return;

    Alert.alert(
      'Client absent',
      'Marquer cette course comme "Client absent" ?',
      [
        {
          text: 'Non',
          style: 'cancel',
        },
        {
          text: 'Oui, client absent',
          style: 'destructive',
          onPress: async () => {
            try {
              await rideService.cancelRide(ride.id, {
                reason: 'Client absent au point de rendez-vous',
                cancelledBy: 'driver',
              });
              loadRide();
            } catch (error) {
              console.error('Error marking no show:', error);
              Alert.alert('Erreur', 'Impossible de marquer le client absent');
            }
          },
        },
      ]
    );
  };

  const openNavigation = () => {
    if (!ride || !ride.pickupLocation || !ride.dropoffLocation) return;

    const isGoingToPickup = ['accepted', 'en_route_to_pickup', 'arrived_at_pickup'].includes(
      ride.status
    );
    const destination = isGoingToPickup
      ? {
          latitude: ride.pickupLocation.latitude,
          longitude: ride.pickupLocation.longitude,
          address: ride.pickupLocation.address,
        }
      : {
          latitude: ride.dropoffLocation.latitude,
          longitude: ride.dropoffLocation.longitude,
          address: ride.dropoffLocation.address,
        };

    Alert.alert(
      'Navigation',
      `Naviguer vers ${isGoingToPickup ? 'le point de prise en charge' : 'la destination'}`,
      [
        {
          text: 'Waze',
          onPress: () =>
            locationService.openNavigationApp(
              {
                latitude: destination.latitude,
                longitude: destination.longitude,
              },
              'waze'
            ),
        },
        {
          text: 'Google Maps',
          onPress: () =>
            locationService.openNavigationApp(
              {
                latitude: destination.latitude,
                longitude: destination.longitude,
              },
              'google'
            ),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const callPassenger = () => {
    if (!ride || !ride.passenger) return;
    Linking.openURL(`tel:${ride.passenger.phone}`);
  };

  const sendSMS = () => {
    if (!ride || !ride.passenger) return;
    Linking.openURL(`sms:${ride.passenger.phone}`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Course introuvable</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isMyRide = ride.driverId === user?.id;
  const isAvailable = ride.status === 'pending' && !ride.driverId;
  const nextAction = getNextAction(ride.status);
  const canShowNavigation = isMyRide && [
    'accepted',
    'en_route_to_pickup',
    'arrived_at_pickup',
    'passenger_onboard',
  ].includes(ride.status);
  const canCancel = isMyRide && !['completed', 'cancelled', 'no_show'].includes(ride.status);
  const canMarkNoShow = isMyRide && ride.status === 'arrived_at_pickup';

  // Calculate map region based on ride status
  const getMapRegion = () => {
    const points = [];
    
    // Always include driver position if available
    if (driverLocation) {
      points.push({ latitude: driverLocation.latitude, longitude: driverLocation.longitude });
    }
    
    // Determine which destination to show based on ride status
    const isGoingToPickup = ['pending', 'accepted', 'en_route_to_pickup', 'arrived_at_pickup'].includes(ride.status);
    const isGoingToDropoff = ['passenger_onboard', 'in_progress', 'arrived_at_destination'].includes(ride.status);
    
    if (isGoingToPickup && ride.pickupLocation) {
      // Show driver + pickup (going to pickup)
      points.push({ latitude: ride.pickupLocation.latitude, longitude: ride.pickupLocation.longitude });
    } else if (isGoingToDropoff && ride.dropoffLocation) {
      // Show driver + dropoff (passenger onboard, going to destination)
      points.push({ latitude: ride.dropoffLocation.latitude, longitude: ride.dropoffLocation.longitude });
    } else {
      // Show all points for completed/cancelled rides
      if (ride.pickupLocation) {
        points.push({ latitude: ride.pickupLocation.latitude, longitude: ride.pickupLocation.longitude });
      }
      if (ride.dropoffLocation) {
        points.push({ latitude: ride.dropoffLocation.latitude, longitude: ride.dropoffLocation.longitude });
      }
    }

    if (points.length === 0) {
      return {
        latitude: 48.8566,
        longitude: 2.3522,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const latitudes = points.map(p => p.latitude);
    const longitudes = points.map(p => p.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const deltaLat = (maxLat - minLat) * 1.8; // More padding for better view
    const deltaLng = (maxLng - minLng) * 1.8;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(deltaLat, 0.01),
      longitudeDelta: Math.max(deltaLng, 0.01),
    };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ChevronLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la course</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
            <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
          </View>
          <Text style={styles.priceText}>{(ride.estimatedPrice || ride.finalPrice || 0).toFixed(2)} €</Text>
        </View>

        {/* Google Maps */}
        <View style={styles.mapContainer}>
          {/* Map status indicator */}
          <View style={styles.mapStatusIndicator}>
            <Text style={styles.mapStatusText}>
              {['accepted', 'en_route_to_pickup', 'arrived_at_pickup'].includes(ride.status)
                ? '🟢 Direction: Point de prise en charge'
                : ['passenger_onboard', 'in_progress'].includes(ride.status)
                ? '🔴 Direction: Destination finale'
                : '🗺️ Vue complète du trajet'}
            </Text>
          </View>
          
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={getMapRegion()}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={true}
            zoomEnabled={true}
            scrollEnabled={true}
          >
            {/* Driver position (blue marker) */}
            {driverLocation && (
              <Marker
                coordinate={{
                  latitude: driverLocation.latitude,
                  longitude: driverLocation.longitude,
                }}
                title="Ma position"
                description="Vous êtes ici"
                pinColor="#007AFF"
              />
            )}

            {/* Pickup location (green marker) */}
            {ride.pickupLocation && (
              <Marker
                coordinate={{
                  latitude: ride.pickupLocation.latitude,
                  longitude: ride.pickupLocation.longitude,
                }}
                title="Point de prise en charge"
                description={ride.pickupLocation.address}
                pinColor="#34C759"
              />
            )}

            {/* Dropoff location (red marker) */}
            {ride.dropoffLocation && (
              <Marker
                coordinate={{
                  latitude: ride.dropoffLocation.latitude,
                  longitude: ride.dropoffLocation.longitude,
                }}
                title="Destination"
                description={ride.dropoffLocation.address}
                pinColor="#FF3B30"
              />
            )}
          </MapView>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Itinéraire</Text>

          <View style={styles.locationContainer}>
            <View style={styles.locationIcon}>
              <MapPin size={20} color="#007AFF" />
            </View>
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Départ</Text>
              <Text style={styles.locationAddress}>{ride.pickupLocation?.address || 'Adresse de prise en charge'}</Text>
            </View>
          </View>

          <View style={styles.locationDivider} />

          <View style={styles.locationContainer}>
            <View style={styles.locationIcon}>
              <NavigationIcon size={20} color="#FF3B30" />
            </View>
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Destination</Text>
              <Text style={styles.locationAddress}>{ride.dropoffLocation?.address || 'Destination'}</Text>
            </View>
          </View>
        </View>

        {isMyRide && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Passager</Text>
            <View style={styles.passengerContainer}>
              <View style={styles.passengerInfo}>
                <User size={20} color="#1a1a1a" />
                <Text style={styles.passengerName}>{ride.passenger?.fullName || 'Passager'}</Text>
              </View>
              <View style={styles.contactButtons}>
                <TouchableOpacity style={styles.contactButton} onPress={callPassenger}>
                  <Phone size={18} color="#fff" />
                  <Text style={styles.contactButtonText}>Appeler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contactButton, styles.smsButton]}
                  onPress={sendSMS}
                >
                  <MessageCircle size={18} color="#fff" />
                  <Text style={styles.contactButtonText}>SMS</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations</Text>

          <View style={styles.infoRow}>
            <Euro size={18} color="#8E8E93" />
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{ride.distance ? `${ride.distance.toFixed(1)} km` : '-'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={18} color="#8E8E93" />
            <Text style={styles.infoLabel}>Durée estimée</Text>
            <Text style={styles.infoValue}>{ride.duration ? `${ride.duration} min` : '-'}</Text>
          </View>
        </View>

        {canShowNavigation && ride.pickupLocation && ride.dropoffLocation && (
          <View style={styles.navigationContainer}>
            <Text style={styles.navigationTitle}>🗺️ Ouvrir la navigation</Text>
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[styles.navigationButton, styles.wazeButton]}
                onPress={() => {
                  const isGoingToPickup = ['accepted', 'en_route_to_pickup', 'arrived_at_pickup'].includes(ride.status);
                  const destination = isGoingToPickup ? ride.pickupLocation : ride.dropoffLocation;
                  locationService.openNavigationApp(
                    { latitude: destination.latitude, longitude: destination.longitude },
                    'waze'
                  );
                }}
              >
                <Text style={styles.navigationButtonEmoji}>🚗</Text>
                <Text style={styles.navigationButtonText}>Waze</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navigationButton, styles.googleMapsButton]}
                onPress={() => {
                  const isGoingToPickup = ['accepted', 'en_route_to_pickup', 'arrived_at_pickup'].includes(ride.status);
                  const destination = isGoingToPickup ? ride.pickupLocation : ride.dropoffLocation;
                  locationService.openNavigationApp(
                    { latitude: destination.latitude, longitude: destination.longitude },
                    'google'
                  );
                }}
              >
                <Text style={styles.navigationButtonEmoji}>📍</Text>
                <Text style={styles.navigationButtonText}>Google Maps</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navigationButton, styles.appleMapsButton]}
                onPress={() => {
                  const isGoingToPickup = ['accepted', 'en_route_to_pickup', 'arrived_at_pickup'].includes(ride.status);
                  const destination = isGoingToPickup ? ride.pickupLocation : ride.dropoffLocation;
                  locationService.openNavigationApp(
                    { latitude: destination.latitude, longitude: destination.longitude },
                    'apple'
                  );
                }}
              >
                <Text style={styles.navigationButtonEmoji}>🍎</Text>
                <Text style={styles.navigationButtonText}>Apple Maps</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.navigationHint}>
              📍 {['accepted', 'en_route_to_pickup', 'arrived_at_pickup'].includes(ride.status) 
                ? 'Navigation vers le point de prise en charge' 
                : 'Navigation vers la destination'}
            </Text>
          </View>
        )}

        {isAvailable && !isMyRide && (
          <TouchableOpacity style={styles.acceptButton} onPress={acceptRide}>
            <Text style={styles.acceptButtonText}>Accepter la course</Text>
          </TouchableOpacity>
        )}

        {isMyRide && nextAction && (
          <View style={styles.swipeContainer}>
            <Text style={styles.swipeLabel}>👉 Glissez pour continuer</Text>
            <View style={styles.swipeTrack}>
              <Text style={styles.swipeText}>{nextAction.text}</Text>
              <Animated.View
                style={[
                  styles.swipeThumb,
                  {
                    transform: [{ translateX: slideAnim }],
                  },
                ]}
                {...createSwipeHandler(() => updateRideStatus(nextAction.nextStatus, nextAction.timestampField)).panHandlers}
              >
                <Text style={styles.swipeThumbText}>→</Text>
              </Animated.View>
            </View>
          </View>
        )}

        {canMarkNoShow && (
          <TouchableOpacity style={styles.noShowButton} onPress={markNoShow}>
            <Text style={styles.noShowButtonText}>Client absent</Text>
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={cancelRide}>
            <Text style={styles.cancelButtonText}>Annuler la course</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 300,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  mapStatusIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  mapStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  locationAddress: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  locationDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
    marginLeft: 32,
  },
  passengerContainer: {
    gap: 16,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
  },
  smsButton: {
    backgroundColor: '#34C759',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textTransform: 'capitalize',
  },
  instructionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  instructionsText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  navigationContainer: {
    marginBottom: 16,
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  navigationButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wazeButton: {
    backgroundColor: '#00D4FF',
  },
  googleMapsButton: {
    backgroundColor: '#4285F4',
  },
  appleMapsButton: {
    backgroundColor: '#000000',
  },
  navigationButtonEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  navigationHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  acceptButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF3B30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  noShowButton: {
    backgroundColor: '#FF9500',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noShowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  swipeContainer: {
    marginBottom: 16,
  },
  swipeLabel: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  swipeTrack: {
    height: 70,
    backgroundColor: '#007AFF',
    borderRadius: 35,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  swipeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.7,
  },
  swipeThumb: {
    position: 'absolute',
    left: 5,
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  swipeThumbText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
