import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getRideById, rateRide } from '@/services/rideService';
import { Star, User, Heart } from 'lucide-react-native';

export default function RateRideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rideId = params.rideId as string;

  const [ride, setRide] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tip, setTip] = useState(0);

  const tipOptions = [0, 2, 5, 10];

  useEffect(() => {
    loadRide();
  }, []);

  const loadRide = async () => {
    try {
      const data = await getRideById(rideId);
      setRide(data);
    } catch (error) {
      console.error('Error loading ride:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Note requise', 'Veuillez donner une note avant de continuer');
      return;
    }

    setSubmitting(true);
    try {
      await rateRide(rideId, ride.driver.id, rating, comment, tip);

      const messages = [
        'Votre avis a été enregistré',
        tip > 0 ? `Merci pour votre générosité ! Le chauffeur a reçu un pourboire de ${tip} €` : '',
      ].filter(Boolean);

      Alert.alert('Merci !', messages.join('\n'), [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'enregistrer votre avis');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!ride) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Comment était votre course ?</Text>
        <Text style={styles.subtitle}>Donnez votre avis sur le conducteur</Text>

        <View style={styles.driverCard}>
          <View style={styles.avatarContainer}>
            <User size={40} color="#6B7280" />
          </View>
          <Text style={styles.driverName}>{ride.driver.full_name}</Text>
          <Text style={styles.vehicleInfo}>
            {ride.driver.vehicle_make} {ride.driver.vehicle_model}
          </Text>
        </View>

        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Star
                size={48}
                color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                fill={star <= rating ? '#F59E0B' : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Partagez votre expérience (optionnel)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.tipSection}>
          <View style={styles.tipHeader}>
            <Heart size={20} color="#EF4444" fill="#EF4444" />
            <Text style={styles.tipTitle}>Donner un pourboire</Text>
          </View>
          <Text style={styles.tipSubtitle}>Montrez votre appréciation au conducteur</Text>

          <View style={styles.tipOptions}>
            {tipOptions.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[styles.tipButton, tip === amount && styles.tipButtonSelected]}
                onPress={() => setTip(amount)}
              >
                <Text style={[styles.tipButtonText, tip === amount && styles.tipButtonTextSelected]}>
                  {amount === 0 ? 'Pas de pourboire' : `${amount} €`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Prix de la course</Text>
            <Text style={styles.detailValue}>{ride.price.toFixed(2)} €</Text>
          </View>
          {tip > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pourboire</Text>
              <Text style={styles.detailValue}>{tip.toFixed(2)} €</Text>
            </View>
          )}
          {ride.distance_km && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Distance</Text>
              <Text style={styles.detailValue}>{ride.distance_km.toFixed(1)} km</Text>
            </View>
          )}
          {tip > 0 && (
            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{(ride.price + tip).toFixed(2)} €</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || rating === 0}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Envoyer</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Passer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  driverCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tripDetails: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  tipSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  tipSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  tipOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipButton: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  tipButtonSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  tipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tipButtonTextSelected: {
    color: '#4F46E5',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
