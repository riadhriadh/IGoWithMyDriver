import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  User,
  Phone,
  Calendar,
  Clock,
  DollarSign,
  Star,
  MessageCircle,
} from 'lucide-react-native';
import { rideService, Ride } from '@/services/rideService';

// Using Ride type from rideService

export default function RideDetailScreen() {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  useEffect(() => {
    loadRideDetails();
  }, [id]);

  const loadRideDetails = async () => {
    try {
      const rideData = await rideService.getRideById(id as string);
      setRide(rideData);
    } catch (error) {
      console.error('Error loading ride:', error);
    }
    setLoading(false);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = () => {
    if (!ride?.startedAt || !ride?.completedAt) return ride?.duration || null;
    const start = new Date(ride.startedAt);
    const end = new Date(ride.completedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Course introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const duration = calculateDuration();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la course</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: ride.status === 'completed' ? '#34C759' : '#FF3B30' },
            ]}
          >
            <Text style={styles.statusText}>
              {ride.status === 'completed' ? 'Terminée' : 'Annulée'}
            </Text>
          </View>
          <Text style={styles.priceText}>{(ride.finalPrice || ride.estimatedPrice || 0).toFixed(2)} €</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trajet</Text>
          <View style={styles.card}>
            <View style={styles.routeItem}>
              <View style={styles.routeIcon}>
                <MapPin size={20} color="#007AFF" />
              </View>
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Départ</Text>
                <Text style={styles.routeAddress}>{ride.pickupLocation?.address || 'Départ'}</Text>
              </View>
            </View>

            <View style={styles.routeDivider} />

            <View style={styles.routeItem}>
              <View style={styles.routeIcon}>
                <Navigation size={20} color="#FF3B30" />
              </View>
              <View style={styles.routeContent}>
                <Text style={styles.routeLabel}>Arrivée</Text>
                <Text style={styles.routeAddress}>{ride.dropoffLocation?.address || 'Destination'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passager</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <User size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Nom</Text>
              </View>
                <Text style={styles.infoValue}>{ride.passenger?.fullName || 'Passager'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Phone size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Téléphone</Text>
              </View>
                <Text style={styles.infoValue}>{ride.passenger?.phone || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Calendar size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Date</Text>
              </View>
              <Text style={styles.infoValue}>
                {ride.completedAt
                  ? formatDateTime(ride.completedAt)
                  : formatDateTime(ride.createdAt)}
              </Text>
            </View>

            {duration && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Clock size={20} color="#007AFF" />
                    <Text style={styles.infoLabel}>Durée</Text>
                  </View>
                  <Text style={styles.infoValue}>{duration} min</Text>
                </View>
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <DollarSign size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Véhicule</Text>
              </View>
                <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                Véhicule standard
              </Text>
            </View>
          </View>
        </View>

        {false && ride && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.card}>
              <Text style={styles.instructionsText}>{ride.special_instructions}</Text>
            </View>
          </View>
        )}

        {false && ride && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Évaluation</Text>
            <View style={styles.card}>
              <View style={styles.ratingContainer}>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={24}
                      color="#FFD700"
                      fill={star <= ride.rating! ? '#FFD700' : 'transparent'}
                    />
                  ))}
                </View>
                <Text style={styles.ratingValue}>{ride.rating.toFixed(1)}/5</Text>
              </View>

              {ride.passenger_comment && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.commentContainer}>
                    <MessageCircle size={16} color="#8E8E93" />
                    <Text style={styles.commentText}>{ride.passenger_comment}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  scrollContent: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
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
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeContent: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  routeDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E5EA',
    marginLeft: 19,
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 12,
  },
  commentText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
});
