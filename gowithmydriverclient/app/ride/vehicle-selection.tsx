import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Car, Truck, Bike, Leaf, Users, Luggage, Clock } from 'lucide-react-native';
import { requestRide } from '@/services/rideService';

interface VehicleType {
  id: string;
  name: string;
  description: string;
  icon: any;
  iconColor: string;
  backgroundColor: string;
  maxPassengers: number;
  maxLuggage: number;
  estimatedTime: string;
  priceMultiplier: number;
  features: string[];
}

const vehicleTypes: VehicleType[] = [
  {
    id: 'economy',
    name: 'Économique',
    description: 'Option abordable pour vos trajets quotidiens',
    icon: Car,
    iconColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    maxPassengers: 4,
    maxLuggage: 2,
    estimatedTime: '5-10 min',
    priceMultiplier: 1.0,
    features: ['Climatisation', 'Véhicule récent', 'Chauffeur professionnel'],
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Confort optimal pour tous vos déplacements',
    icon: Car,
    iconColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
    maxPassengers: 4,
    maxLuggage: 3,
    estimatedTime: '5-10 min',
    priceMultiplier: 1.2,
    features: ['Climatisation', 'WiFi gratuit', 'Chargeur téléphone', 'Eau offerte'],
  },
  {
    id: 'green',
    name: 'Écologique',
    description: 'Véhicule électrique ou hybride',
    icon: Leaf,
    iconColor: '#10B981',
    backgroundColor: '#ECFDF5',
    maxPassengers: 4,
    maxLuggage: 2,
    estimatedTime: '5-12 min',
    priceMultiplier: 1.1,
    features: ['100% électrique', 'Écologique', 'Silencieux', 'Confortable'],
  },
  {
    id: 'van',
    name: 'Van',
    description: 'Idéal pour groupes et bagages volumineux',
    icon: Truck,
    iconColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
    maxPassengers: 6,
    maxLuggage: 6,
    estimatedTime: '8-15 min',
    priceMultiplier: 1.8,
    features: ['Espace XXL', 'Coffre spacieux', 'Parfait pour groupes', 'Climatisation'],
  },
  {
    id: 'moto',
    name: 'Moto',
    description: 'Rapide et économique, sans bagages',
    icon: Bike,
    iconColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    maxPassengers: 1,
    maxLuggage: 0,
    estimatedTime: '3-8 min',
    priceMultiplier: 0.7,
    features: ['Ultra rapide', 'Évite les embouteillages', 'Casque fourni', 'Sans bagages'],
  },
];

export default function VehicleSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
  };

  const handleConfirm = async () => {
    if (!selectedVehicle) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await requestRide({
        pickupLatitude: parseFloat(params.pickupLat as string),
        pickupLongitude: parseFloat(params.pickupLon as string),
        pickupAddress: params.pickupAddress as string,
        dropoffLatitude: parseFloat(params.dropoffLat as string),
        dropoffLongitude: parseFloat(params.dropoffLon as string),
        dropoffAddress: params.dropoffAddress as string,
        vehicleType: selectedVehicle,
        paymentMethodId: params.paymentMethodId as string,
      });

      if (result.ride) {
        router.push({
          pathname: '/ride/available-drivers',
          params: {
            ...params,
            vehicleType: selectedVehicle,
            rideId: result.ride.id,
          },
        });
      } else {
        router.push({
          pathname: '/ride/available-drivers',
          params: {
            ...params,
            vehicleType: selectedVehicle,
          },
        });
      }
    } catch (err) {
      setError('Erreur lors de la création de la course. Veuillez réessayer.');
      console.error('Error creating ride:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVehicleCard = (vehicle: VehicleType) => {
    const Icon = vehicle.icon;
    const isSelected = selectedVehicle === vehicle.id;

    return (
      <TouchableOpacity
        key={vehicle.id}
        style={[
          styles.vehicleCard,
          isSelected && styles.vehicleCardSelected,
        ]}
        onPress={() => handleSelectVehicle(vehicle.id)}
      >
        <View style={styles.vehicleHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: vehicle.backgroundColor },
            ]}
          >
            <Icon size={32} color={vehicle.iconColor} />
          </View>
          <View style={styles.vehicleHeaderText}>
            <Text style={styles.vehicleName}>{vehicle.name}</Text>
            <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
          </View>
        </View>

        <View style={styles.vehicleStats}>
          <View style={styles.stat}>
            <Users size={18} color="#6B7280" />
            <Text style={styles.statText}>{vehicle.maxPassengers} passagers</Text>
          </View>
          <View style={styles.stat}>
            <Luggage size={18} color="#6B7280" />
            <Text style={styles.statText}>{vehicle.maxLuggage} bagages</Text>
          </View>
          <View style={styles.stat}>
            <Clock size={18} color="#6B7280" />
            <Text style={styles.statText}>{vehicle.estimatedTime}</Text>
          </View>
        </View>

        <View style={styles.features}>
          {vehicle.features.map((feature, index) => (
            <View key={index} style={styles.featureBadge}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Prix estimé</Text>
          <Text style={styles.priceValue}>
            {vehicle.priceMultiplier === 1.0
              ? 'Standard'
              : `${Math.round(vehicle.priceMultiplier * 100)}%`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choisir un véhicule</Text>
        <Text style={styles.subtitle}>
          Sélectionnez le type de véhicule qui correspond à vos besoins
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {vehicleTypes.map((vehicle) => renderVehicleCard(vehicle))}
      </ScrollView>

      <View style={styles.footer}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedVehicle || isLoading) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedVehicle || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              style={[
                styles.confirmButtonText,
                !selectedVehicle && styles.confirmButtonTextDisabled,
              ]}
            >
              Rechercher un chauffeur
            </Text>
          )}
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
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  vehicleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  vehicleCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  vehicleHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vehicleHeaderText: {
    flex: 1,
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  vehicleDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  vehicleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  featureBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
