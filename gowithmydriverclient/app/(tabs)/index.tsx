import { View, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { useAuth } from '@/contexts/AuthContext';
import { requestRide, calculateDistance } from '@/services/rideService';
import { reverseGeocode } from '@/services/geocodingService';
import { getDefaultPaymentMethod, type PaymentMethod } from '@/services/paymentService';
import { useRouter } from 'expo-router';
import { MapPin, Navigation, Search, CreditCard, ChevronRight } from 'lucide-react-native';
import Map from '@/components/Map';
import AddressInput from '@/components/AddressInput';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';

export default function HomeScreen() {
  const { passenger } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState<any>(null);
  const [pickupLocation, setPickupLocation] = useState<any>(null);
  const [dropoffLocation, setDropoffLocation] = useState<any>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showDropoffModal, setShowDropoffModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre position pour fonctionner');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setLocation(region);

      const pickup = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setPickupLocation(pickup);

      const address = await reverseGeocode(pickup.latitude, pickup.longitude);
      setPickupAddress(address);
    })();
  }, []);

  useEffect(() => {
    if (passenger) {
      loadDefaultPaymentMethod();
    }
  }, [passenger]);

  const loadDefaultPaymentMethod = async () => {
    try {
      const defaultMethod = await getDefaultPaymentMethod(passenger!.id);
      setSelectedPaymentMethod(defaultMethod);
    } catch (error) {
      console.error('Error loading payment method:', error);
    }
  };

  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      const distance = calculateDistance(
        pickupLocation.latitude,
        pickupLocation.longitude,
        dropoffLocation.latitude,
        dropoffLocation.longitude
      );
      const price = 2.5 + distance * 1.5;
      setEstimatedPrice(Math.max(price, 5.0));
    }
  }, [pickupLocation, dropoffLocation]);

  const handleRequestRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Information manquante', 'Veuillez sélectionner un point d\'arrivée');
      return;
    }

    if (!passenger) {
      router.push('/auth/login');
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert(
        'Moyen de paiement requis',
        'Veuillez sélectionner un moyen de paiement',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Choisir', onPress: () => setShowPaymentSelector(true) },
        ]
      );
      return;
    }

    router.push({
      pathname: '/ride/vehicle-selection',
      params: {
        pickupLat: pickupLocation.latitude,
        pickupLon: pickupLocation.longitude,
        dropoffLat: dropoffLocation.latitude,
        dropoffLon: dropoffLocation.longitude,
        pickupAddress,
        dropoffAddress,
        estimatedPrice: estimatedPrice || 0,
        paymentMethodId: selectedPaymentMethod.id,
      },
    });
  };

  const handleMapPress = async (coords: { latitude: number; longitude: number }) => {
    setDropoffLocation(coords);
    const address = await reverseGeocode(coords.latitude, coords.longitude);
    setDropoffAddress(address);
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return `${method.provider || 'Carte'} •••• ${method.last_four}`;
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      case 'cash':
        return 'Espèces';
      default:
        return method.type;
    }
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  const markers = [];
  if (pickupLocation) {
    markers.push({
      latitude: pickupLocation.latitude,
      longitude: pickupLocation.longitude,
      title: 'Départ',
      color: 'green',
    });
  }
  if (dropoffLocation) {
    markers.push({
      latitude: dropoffLocation.latitude,
      longitude: dropoffLocation.longitude,
      title: 'Arrivée',
      color: 'red',
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <Map
          latitude={location.latitude}
          longitude={location.longitude}
          markers={markers}
          onMapPress={handleMapPress}
        />
      </View>

      <View style={styles.bottomSheet}>
        <Text style={styles.title}>Où allez-vous ?</Text>

        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowPickupModal(true)}
        >
          <MapPin size={20} color="#10B981" style={styles.icon} />
          <Text style={styles.inputText} numberOfLines={1}>{pickupAddress || 'Position actuelle'}</Text>
          <Search size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowDropoffModal(true)}
        >
          <Navigation size={20} color="#EF4444" style={styles.icon} />
          <Text style={styles.inputText} numberOfLines={1}>
            {dropoffAddress || 'Rechercher une destination'}
          </Text>
          <Search size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {estimatedPrice && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Prix estimé</Text>
            <Text style={styles.priceValue}>{estimatedPrice.toFixed(2)} €</Text>
          </View>
        )}

        {dropoffLocation && (
          <>
            <TouchableOpacity
              style={styles.paymentContainer}
              onPress={() => setShowPaymentSelector(true)}
            >
              <View style={styles.paymentLeft}>
                <CreditCard size={20} color="#4F46E5" style={styles.icon} />
                <View>
                  <Text style={styles.paymentLabel}>Paiement</Text>
                  <Text style={styles.paymentValue}>
                    {selectedPaymentMethod
                      ? getPaymentMethodLabel(selectedPaymentMethod)
                      : 'Sélectionner un moyen de paiement'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRequestRide}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Réserver une course</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      <AddressInput
        visible={showPickupModal}
        onClose={() => setShowPickupModal(false)}
        title="Point de départ"
        onSelectAddress={(address, lat, lon) => {
          setPickupAddress(address);
          setPickupLocation({ latitude: lat, longitude: lon });
        }}
      />

      <AddressInput
        visible={showDropoffModal}
        onClose={() => setShowDropoffModal(false)}
        title="Destination"
        onSelectAddress={(address, lat, lon) => {
          setDropoffAddress(address);
          setDropoffLocation({ latitude: lat, longitude: lon });
        }}
      />

      <PaymentMethodSelector
        visible={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        onSelect={(method) => setSelectedPaymentMethod(method)}
        selectedMethodId={selectedPaymentMethod?.id}
      />
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  bottomSheet: {
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  paymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
