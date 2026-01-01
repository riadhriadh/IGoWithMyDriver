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
import { ArrowLeft, Plus, Car, Calendar, CheckCircle, XCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { Alert } from 'react-native';

interface Vehicle {
  id: string;
  type: string;
  brand: string;
  model: string;
  year: number | null;
  plate_number: string;
  color: string | null;
  seats: number;
  insurance_expiry: string;
  is_active: boolean;
  created_at: string;
}

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    if (!user) return;

    try {
      const response = await apiClient.get<{ vehicles: Vehicle[] }>('/drivers/vehicles');
      setVehicles(response.vehicles || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setVehicles([]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  const toggleVehicleStatus = async (vehicleId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/drivers/vehicles/${vehicleId}`, {
        isActive: !currentStatus
      });
      loadVehicles();
    } catch (error) {
      console.error('Error toggling vehicle status:', error);
      Alert.alert('Erreur', 'Impossible de modifier le statut du véhicule');
    }
  };

  const isInsuranceExpiringSoon = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isInsuranceExpired = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  const getVehicleTypeIcon = (type: string) => {
    return <Car size={24} color="#007AFF" />;
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => {
    const expired = isInsuranceExpired(item.insurance_expiry);
    const expiringSoon = isInsuranceExpiringSoon(item.insurance_expiry);

    return (
      <TouchableOpacity
        style={styles.vehicleCard}
        onPress={() => router.push(`/vehicles/${item.id}`)}
      >
        <View style={styles.vehicleHeader}>
          <View style={styles.vehicleHeaderLeft}>
            <View style={styles.vehicleIcon}>{getVehicleTypeIcon(item.type)}</View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {item.brand} {item.model}
              </Text>
              <Text style={styles.vehicleDetails}>
                {item.plate_number} • {item.type}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => toggleVehicleStatus(item.id, item.is_active)}
          >
            {item.is_active ? (
              <CheckCircle size={24} color="#34C759" />
            ) : (
              <XCircle size={24} color="#8E8E93" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.vehicleSpecs}>
          {item.year && (
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Année</Text>
              <Text style={styles.specValue}>{item.year}</Text>
            </View>
          )}

          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Places</Text>
            <Text style={styles.specValue}>{item.seats}</Text>
          </View>

          {item.color && (
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Couleur</Text>
              <Text style={[styles.specValue, { textTransform: 'capitalize' }]}>
                {item.color}
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.insuranceInfo,
            expired && styles.insuranceExpired,
            expiringSoon && styles.insuranceExpiring,
          ]}
        >
          <Calendar size={14} color={expired ? '#FF3B30' : expiringSoon ? '#FF9500' : '#8E8E93'} />
          <Text
            style={[
              styles.insuranceText,
              expired && styles.insuranceTextExpired,
              expiringSoon && styles.insuranceTextExpiring,
            ]}
          >
            {expired
              ? 'Assurance expirée'
              : expiringSoon
              ? 'Assurance expire bientôt'
              : `Assurance valide jusqu'au ${new Date(item.insurance_expiry).toLocaleDateString('fr-FR')}`}
          </Text>
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Véhicules</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/vehicles/add')}>
          <Plus size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={vehicles}
        renderItem={renderVehicleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Car size={48} color="#8E8E93" />
            <Text style={styles.emptyText}>Aucun véhicule</Text>
            <Text style={styles.emptySubtext}>Ajoutez votre premier véhicule</Text>
            <TouchableOpacity
              style={styles.addVehicleButton}
              onPress={() => router.push('/vehicles/add')}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addVehicleButtonText}>Ajouter un véhicule</Text>
            </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  listContent: {
    padding: 16,
  },
  vehicleCard: {
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
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  statusButton: {
    padding: 4,
  },
  vehicleSpecs: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  specItem: {
    flex: 1,
  },
  specLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  insuranceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  insuranceExpired: {
    backgroundColor: '#FFEBEE',
  },
  insuranceExpiring: {
    backgroundColor: '#FFF9E6',
  },
  insuranceText: {
    flex: 1,
    fontSize: 12,
    color: '#8E8E93',
  },
  insuranceTextExpired: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  insuranceTextExpiring: {
    color: '#FF9500',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addVehicleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
