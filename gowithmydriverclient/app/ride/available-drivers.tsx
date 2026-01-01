import { View, Text, StyleSheet, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { requestRide } from '@/services/rideService';
import { MapPin, Navigation, Radio } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

export default function AvailableDriversScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchingMessage, setSearchingMessage] = useState('Recherche de conducteurs disponibles...');
  const [rideId, setRideId] = useState<string | null>(params.rideId as string || null);
  const [activeDots, setActiveDots] = useState(0);

  const pickupLat = parseFloat(params.pickupLat as string);
  const pickupLon = parseFloat(params.pickupLon as string);
  const dropoffLat = parseFloat(params.dropoffLat as string);
  const dropoffLon = parseFloat(params.dropoffLon as string);
  const pickupAddress = params.pickupAddress as string;
  const dropoffAddress = params.dropoffAddress as string;
  const vehicleType = params.vehicleType as string;
  const paymentMethodId = params.paymentMethodId as string;

  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);
  const wave3 = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    wave1.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    wave2.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
    );
    wave3.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 600 }),
        withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    const dotsInterval = setInterval(() => {
      setActiveDots((prev) => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  useEffect(() => {
    if (!rideId) {
      createRideRequest();
    }
  }, []);

  useEffect(() => {
    if (rideId) {
      const messages = [
        'Recherche de conducteurs disponibles...',
        'Connexion avec les chauffeurs à proximité...',
        'Nous avons trouvé un chauffeur pour vous...',
      ];

      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setSearchingMessage(messages[messageIndex]);
      }, 10000);

      const redirectTimer = setTimeout(() => {
        clearInterval(messageInterval);
        router.replace({
          pathname: '/ride/tracking',
          params: { rideId },
        });
      }, 30000);

      return () => {
        clearInterval(messageInterval);
        clearTimeout(redirectTimer);
      };
    }
  }, [rideId]);

  const createRideRequest = async () => {
    try {
      const result = await requestRide({
        pickupLatitude: pickupLat,
        pickupLongitude: pickupLon,
        pickupAddress: pickupAddress,
        dropoffLatitude: dropoffLat,
        dropoffLongitude: dropoffLon,
        dropoffAddress: dropoffAddress,
        vehicleType: vehicleType,
        paymentMethodId: paymentMethodId,
      });

      if (result.ride && result.ride.id) {
        setRideId(result.ride.id);
      } else {

        Alert.alert(
          'Service temporairement indisponible',
          'Aucun chauffeur n\'est actuellement disponible dans votre zone. Veuillez réessayer dans quelques instants.',
          [
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error creating ride:', error);
      Alert.alert(
        'Erreur',
        'Impossible de créer la demande de course',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    }
  };

  const waveStyle1 = useAnimatedStyle(() => {
    const scale = interpolate(wave1.value, [0, 1], [1, 2.5]);
    const opacity = interpolate(wave1.value, [0, 0.7, 1], [0.6, 0.3, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const waveStyle2 = useAnimatedStyle(() => {
    const scale = interpolate(wave2.value, [0, 1], [1, 2.5]);
    const opacity = interpolate(wave2.value, [0, 0.7, 1], [0.5, 0.25, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const waveStyle3 = useAnimatedStyle(() => {
    const scale = interpolate(wave3.value, [0, 1], [1, 2.5]);
    const opacity = interpolate(wave3.value, [0, 0.7, 1], [0.4, 0.2, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.radarContainer}>
          <Animated.View style={[styles.wave, waveStyle1]} />
          <Animated.View style={[styles.wave, waveStyle2]} />
          <Animated.View style={[styles.wave, waveStyle3]} />

          <Animated.View style={[styles.iconContainer, pulseStyle]}>
            <Radio size={64} color="#FFFFFF" />
          </Animated.View>
        </View>

        <Text style={styles.title}>{searchingMessage}</Text>
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, activeDots >= 1 && styles.dotActive]} />
          <View style={[styles.dot, activeDots >= 2 && styles.dotActive]} />
          <View style={[styles.dot, activeDots >= 3 && styles.dotActive]} />
        </View>

        <Text style={styles.subtitle}>Nous analysons votre zone...</Text>

        <View style={styles.routeInfo}>
          <View style={styles.routeItem}>
            <View style={styles.iconBadge}>
              <MapPin size={18} color="#10B981" />
            </View>
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>Départ</Text>
              <Text style={styles.routeText} numberOfLines={2}>{pickupAddress}</Text>
            </View>
          </View>

          <View style={styles.routeDivider} />

          <View style={styles.routeItem}>
            <View style={styles.iconBadge}>
              <Navigation size={18} color="#EF4444" />
            </View>
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>Arrivée</Text>
              <Text style={styles.routeText} numberOfLines={2}>{dropoffAddress}</Text>
            </View>
          </View>
        </View>

        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleLabel}>Recherche de</Text>
          <Text style={styles.vehicleValue}>{vehicleType}</Text>
        </View>

        <View style={styles.statusBar}>
          <View style={styles.statusIndicator} />
          <Text style={styles.statusText}>Connexion en cours avec les chauffeurs proches...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  radarContainer: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  wave: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3B82F6',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    backgroundColor: '#3B82F6',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  routeInfo: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  routeText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 20,
  },
  routeDivider: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginLeft: 17,
    marginVertical: 12,
  },
  vehicleInfo: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  vehicleLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  vehicleValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  statusText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '500',
  },
});
