import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
  getPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  formatCardNumber,
  isCardExpired,
  type PaymentMethod,
} from '@/services/paymentService';
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Check,
  Trash2,
  Smartphone,
  Banknote,
} from 'lucide-react-native';

export default function PaymentMethodsScreen() {
  const { passenger } = useAuth();
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (passenger) {
      loadPaymentMethods();
    }
  }, [passenger]);

  const loadPaymentMethods = async () => {
    try {
      const data = await getPaymentMethods(passenger!.id);
      setPaymentMethods(data);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert('Erreur', 'Impossible de charger les moyens de paiement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPaymentMethods();
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await setDefaultPaymentMethod(passenger!.id, paymentMethodId);
      loadPaymentMethods();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de définir le moyen de paiement par défaut');
    }
  };

  const handleDelete = (paymentMethod: PaymentMethod) => {
    if (paymentMethod.is_default && paymentMethods.length > 1) {
      Alert.alert(
        'Attention',
        'Veuillez d\'abord définir un autre moyen de paiement par défaut'
      );
      return;
    }

    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer ce moyen de paiement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePaymentMethod(paymentMethod.id);
              loadPaymentMethods();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le moyen de paiement');
            }
          },
        },
      ]
    );
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return <CreditCard size={24} color="#4F46E5" />;
      case 'apple_pay':
      case 'google_pay':
        return <Smartphone size={24} color="#4F46E5" />;
      case 'cash':
        return <Banknote size={24} color="#4F46E5" />;
      default:
        return <CreditCard size={24} color="#4F46E5" />;
    }
  };

  const getPaymentLabel = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return `${method.provider || 'Carte'} ${formatCardNumber(method.last_four)}`;
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      case 'paypal':
        return 'PayPal';
      case 'cash':
        return 'Espèces';
      default:
        return method.type;
    }
  };

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => {
    const expired = item.type === 'card' && isCardExpired(item.expiry_month, item.expiry_year);

    return (
      <View style={styles.paymentCard}>
        <TouchableOpacity
          style={styles.paymentContent}
          onPress={() => !item.is_default && handleSetDefault(item.id)}
        >
          <View style={styles.paymentIcon}>{getPaymentIcon(item)}</View>

          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>{getPaymentLabel(item)}</Text>
            {item.cardholder_name && (
              <Text style={styles.paymentSubtext}>{item.cardholder_name}</Text>
            )}
            {item.type === 'card' && item.expiry_month && item.expiry_year && (
              <Text style={[styles.paymentSubtext, expired && styles.expiredText]}>
                Expire {String(item.expiry_month).padStart(2, '0')}/{item.expiry_year}
                {expired && ' (Expirée)'}
              </Text>
            )}
            {item.is_default && (
              <View style={styles.defaultBadge}>
                <Check size={12} color="#10B981" />
                <Text style={styles.defaultText}>Par défaut</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  if (!passenger) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moyens de paiement</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <>
          <FlatList
            data={paymentMethods}
            renderItem={renderPaymentMethod}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <CreditCard size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>Aucun moyen de paiement</Text>
                <Text style={styles.emptyText}>
                  Ajoutez un moyen de paiement pour faciliter vos réservations
                </Text>
              </View>
            }
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/payment/add')}
            >
              <Plus size={20} color="white" />
              <Text style={styles.addButtonText}>Ajouter un moyen de paiement</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  paymentSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  expiredText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  defaultText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
