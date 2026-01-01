import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Navigation as NavigationIcon, Phone, Clock, MapPinned } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import { useNotifications } from '@/hooks/useNotifications';
import { locationService } from '@/services/locationService';
import { notificationService } from '@/services/notificationService';
import { rideService, Ride } from '@/services/rideService';
import { driverService } from '@/services/driverService';
import { LocationTracker } from '@/components/LocationTracker';

export default function CoursesScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useLocation();
  const { preferences } = useNotifications();

  useEffect(() => {
    loadRides();
    loadDriverStatus();
  }, []);

  // Poll for new rides when online (WebSocket can be implemented later)
  useEffect(() => {
    if (!user || !isOnline) return;

    const interval = setInterval(() => {
      loadRides();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [user, isOnline]);

  const loadDriverStatus = async () => {
    if (!user) return;

    try {
      const profile = await driverService.getProfile();
      setIsOnline(profile.status !== 'offline');
    } catch (error) {
      console.error('Error loading driver status:', error);
    }
  };

  const loadRides = async () => {
    setLoading(true);
    try {
      // Get available rides and active ride
      const [availableRides, activeRide] = await Promise.all([
        rideService.getAvailableRides(location ? {
          latitude: location.latitude,
          longitude: location.longitude,
        } : undefined),
        rideService.getActiveRide(),
      ]);

      const allRides: Ride[] = [];
      
      if (activeRide) {
        allRides.push(activeRide);
      }
      
      // Add available rides that aren't the active ride
      availableRides.forEach(ride => {
        if (!activeRide || ride.id !== activeRide.id) {
          allRides.push(ride);
        }
      });

      setRides(allRides);
    } catch (error) {
      console.error('Error loading rides:', error);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };

  const toggleOnlineStatus = async (value: boolean) => {
    if (!user) return;

    setIsOnline(value);
    try {
      await driverService.updateStatus(value ? 'available' : 'offline');
    } catch (error) {
      console.error('Error updating status:', error);
      setIsOnline(!value); // Revert on error
    }
  };

  const acceptRide = async (rideId: string) => {
    if (!user) return;

    try {
      await rideService.acceptRide(rideId, {
        estimatedArrivalTime: 5,
      });
      loadRides();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'accepter la course');
    }
  };

  const updateRideStatus = async (rideId: string, newStatus: string) => {
    try {
      switch (newStatus) {
        case 'in_progress':
          await rideService.startRide(rideId);
          break;
        case 'completed':
          await rideService.completeRide(rideId, {
            finalPrice: 0, // Will be calculated by backend
            actualDistance: 0,
            actualDuration: 0,
          });
          break;
        default:
          // For other statuses, we'll need to implement specific endpoints
          break;
      }
      loadRides();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour la course');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Disponible',
      accepted: 'Acceptée',
      arrived: 'Arrivé',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: '#34C759',
      accepted: '#007AFF',
      arrived: '#FF9500',
      in_progress: '#FF3B30',
      completed: '#8E8E93',
      cancelled: '#8E8E93',
    };
    return colorMap[status] || '#8E8E93';
  };

  const getNextAction = (status: string) => {
    const actionMap: { [key: string]: { text: string; nextStatus: string } } = {
      accepted: { text: 'Arrivé', nextStatus: 'arrived' },
      arrived: { text: 'Démarrer', nextStatus: 'in_progress' },
      in_progress: { text: 'Terminer', nextStatus: 'completed' },
    };
    return actionMap[status];
  };

  const calculateDistance = (ride: Ride): string | null => {
    if (!location || !ride.pickupLocation) return null;

    const distance = locationService.calculateDistance(
      location.latitude,
      location.longitude,
      ride.pickupLocation.latitude,
      ride.pickupLocation.longitude
    );

    return locationService.formatDistance(distance);
  };

  const calculateETA = (ride: Ride): string | null => {
    if (!location || !ride.pickupLocation) return null;

    const distance = locationService.calculateDistance(
      location.latitude,
      location.longitude,
      ride.pickupLocation.latitude,
      ride.pickupLocation.longitude
    );

    const eta = locationService.estimateArrivalTime(distance);
    return locationService.formatETA(eta);
  };

  const openNavigation = (ride: Ride) => {
    if (!ride.pickupLocation) return;

    Alert.alert(
      'Navigation',
      'Choisissez votre application de navigation',
      [
        {
          text: 'Waze',
          onPress: () =>
            locationService.openNavigationApp(
              {
                latitude: ride.pickupLocation.latitude,
                longitude: ride.pickupLocation.longitude,
              },
              'waze'
            ),
        },
        {
          text: 'Google Maps',
          onPress: () =>
            locationService.openNavigationApp(
              {
                latitude: ride.pickupLocation.latitude,
                longitude: ride.pickupLocation.longitude,
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

  const renderRideItem = ({ item }: { item: Ride }) => {
    const isAvailable = item.status === 'pending' && !item.driverId;
    const isMyRide = item.driverId === user?.id;
    const nextAction = getNextAction(item.status);
    const showNavigation = isMyRide && ['accepted', 'arrived', 'in_progress'].includes(item.status);

    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() => router.push(`/rides/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.rideHeader}>
          <View style={styles.rideHeaderLeft}>
            <Text style={styles.ridePrice}>{(item.estimatedPrice || 0).toFixed(2)} €</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rideDetail}>
          <MapPin size={16} color="#007AFF" />
          <Text style={styles.rideAddress} numberOfLines={1}>
            {item.pickupLocation?.address || 'Adresse de prise en charge'}
          </Text>
        </View>

        <View style={styles.rideDetail}>
          <NavigationIcon size={16} color="#FF3B30" />
          <Text style={styles.rideAddress} numberOfLines={1}>
            {item.dropoffLocation?.address || 'Destination'}
          </Text>
        </View>

        {location && (isAvailable || isMyRide) && item.pickupLocation && (
          <View style={styles.distanceInfo}>
            <MapPinned size={14} color="#007AFF" />
            <Text style={styles.distanceText}>
              Distance: {calculateDistance(item)}
              {isMyRide && ` • ETA: ${calculateETA(item)}`}
            </Text>
          </View>
        )}

        {showNavigation && (
          <TouchableOpacity style={styles.navigationButton} onPress={() => openNavigation(item)}>
            <MapPinned size={16} color="#fff" />
            <Text style={styles.navigationButtonText}>Ouvrir la navigation</Text>
          </TouchableOpacity>
        )}

        {isMyRide && item.passenger && (
          <View style={styles.passengerInfo}>
            <View style={styles.passengerDetail}>
              <Text style={styles.passengerName}>{item.passenger.fullName}</Text>
              <Phone size={14} color="#8E8E93" />
              <Text style={styles.passengerPhone}>{item.passenger.phone}</Text>
            </View>
          </View>
        )}

        {isAvailable && !isMyRide && (
          <TouchableOpacity style={styles.acceptButton} onPress={() => acceptRide(item.id)}>
            <Text style={styles.acceptButtonText}>Accepter la course</Text>
          </TouchableOpacity>
        )}

        {isMyRide && nextAction && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => updateRideStatus(item.id, nextAction.nextStatus)}
          >
            <Text style={styles.actionButtonText}>{nextAction.text}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LocationTracker />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Courses</Text>
        <View style={styles.onlineToggle}>
          <Text style={styles.onlineLabel}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <FlatList
        data={rides}
        renderItem={renderRideItem}
        keyExtractor={(item) => item.id || item._id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune course disponible</Text>
            <Text style={styles.emptySubtext}>
              {isOnline
                ? 'Les nouvelles courses apparaîtront ici'
                : 'Passez en ligne pour recevoir des courses'}
            </Text>
          </View>
        }
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  listContent: {
    padding: 16,
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rideHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ridePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rideDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rideAddress: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },
  passengerInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  passengerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passengerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  passengerPhone: {
    fontSize: 14,
    color: '#007AFF',
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#5856D6',
    borderRadius: 8,
    padding: 12,
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    marginTop: 12,
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

