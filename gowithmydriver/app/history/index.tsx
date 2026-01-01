import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Navigation, Calendar, DollarSign, Star, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { rideService, Ride as RideType } from '@/services/rideService';

// Using Ride type from rideService

export default function RideHistoryScreen() {
  const [rides, setRides] = useState<RideType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadRides();
  }, [filter]);

  const loadRides = async () => {
    setLoading(true);
    if (!user) return;

    try {
      const response = await rideService.getRideHistory();
      let filteredRides = response.rides;

      // Apply filter
      if (filter !== 'all') {
        filteredRides = filteredRides.filter((r) => r.status === filter);
      }

      setRides(filteredRides);
    } catch (error) {
      console.error('Error loading rides:', error);
      setRides([]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };

  const getTotalEarnings = () => {
    return rides
      .filter((r) => r.status === 'completed')
      .reduce((sum, ride) => sum + (ride.finalPrice || ride.estimatedPrice || 0), 0);
  };

  const getAverageRating = () => {
    // Rating will come from backend in future versions
    return 0;
  };

  const renderRideItem = ({ item }: { item: RideType }) => {
    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() => router.push(`/history/${item.id}`)}
      >
        <View style={styles.rideHeader}>
          <View style={styles.rideHeaderLeft}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.status === 'completed' ? '#34C759' : '#FF3B30' },
              ]}
            />
            <Text style={styles.rideName}>{item.passenger?.fullName || 'Passager'}</Text>
          </View>
          <View style={styles.rideHeaderRight}>
            <Text style={styles.ridePrice}>{(item.finalPrice || item.estimatedPrice || 0).toFixed(2)} €</Text>
            <ChevronRight size={20} color="#8E8E93" />
          </View>
        </View>

        <View style={styles.rideRoute}>
          <View style={styles.routePoint}>
            <MapPin size={14} color="#007AFF" />
            <Text style={styles.routeAddress} numberOfLines={1}>
              {item.pickupLocation?.address || 'Départ'}
            </Text>
          </View>
          <View style={styles.routePoint}>
            <Navigation size={14} color="#FF3B30" />
            <Text style={styles.routeAddress} numberOfLines={1}>
              {item.dropoffLocation?.address || 'Destination'}
            </Text>
          </View>
        </View>

        <View style={styles.rideFooter}>
          <View style={styles.dateInfo}>
            <Calendar size={12} color="#8E8E93" />
            <Text style={styles.dateText}>
              {item.completedAt
                ? new Date(item.completedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : new Date(item.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
            </Text>
          </View>
        </View>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <DollarSign size={20} color="#34C759" />
          <Text style={styles.statValue}>{getTotalEarnings().toFixed(2)} €</Text>
          <Text style={styles.statLabel}>Total gagné</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{rides.filter((r) => r.status === 'completed').length}</Text>
          <Text style={styles.statLabel}>Courses terminées</Text>
        </View>

        <View style={styles.statCard}>
          <Star size={20} color="#FFD700" />
          <Text style={styles.statValue}>{getAverageRating().toFixed(1)}</Text>
          <Text style={styles.statLabel}>Note moyenne</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Toutes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Terminées
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'cancelled' && styles.filterButtonActive]}
          onPress={() => setFilter('cancelled')}
        >
          <Text style={[styles.filterText, filter === 'cancelled' && styles.filterTextActive]}>
            Annulées
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rides}
        renderItem={renderRideItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar size={48} color="#8E8E93" />
            <Text style={styles.emptyText}>Aucune course</Text>
            <Text style={styles.emptySubtext}>Votre historique apparaîtra ici</Text>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
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
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rideName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  rideHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ridePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  rideRoute: {
    gap: 8,
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeAddress: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
