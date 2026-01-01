import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPaymentMethods,
  formatCardNumber,
  type PaymentMethod,
} from '@/services/paymentService';
import { CreditCard, X, Check, Smartphone, Banknote, Plus } from 'lucide-react-native';

interface PaymentMethodSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
  selectedMethodId?: string;
}

export default function PaymentMethodSelector({
  visible,
  onClose,
  onSelect,
  selectedMethodId,
}: PaymentMethodSelectorProps) {
  const router = useRouter();
  const { passenger } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && passenger) {
      loadPaymentMethods();
    }
  }, [visible, passenger]);

  const loadPaymentMethods = async () => {
    try {
      const data = await getPaymentMethods(passenger!.id);
      setPaymentMethods(data);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
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

  const handleSelect = (method: PaymentMethod) => {
    onSelect(method);
    onClose();
  };

  const handleAddPaymentMethod = () => {
    onClose();
    router.push('/payment/add');
  };

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => (
    <TouchableOpacity
      style={[
        styles.methodCard,
        selectedMethodId === item.id && styles.methodCardSelected,
      ]}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.methodIcon}>{getPaymentIcon(item)}</View>

      <View style={styles.methodInfo}>
        <Text style={styles.methodLabel}>{getPaymentLabel(item)}</Text>
        {item.cardholder_name && (
          <Text style={styles.methodSubtext}>{item.cardholder_name}</Text>
        )}
        {item.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Par défaut</Text>
          </View>
        )}
      </View>

      {selectedMethodId === item.id && (
        <View style={styles.checkIcon}>
          <Check size={20} color="#4F46E5" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Moyen de paiement</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : (
          <>
            <View style={styles.addButtonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={handleAddPaymentMethod}>
                <View style={styles.addIconContainer}>
                  <Plus size={24} color="#4F46E5" />
                </View>
                <Text style={styles.addButtonText}>Ajouter un moyen de paiement</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={paymentMethods}
              renderItem={renderPaymentMethod}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <CreditCard size={64} color="#D1D5DB" />
                  <Text style={styles.emptyText}>Aucun moyen de paiement</Text>
                  <Text style={styles.emptySubtext}>
                    Cliquez sur le bouton ci-dessus pour ajouter votre première carte
                  </Text>
                </View>
              }
            />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
  },
  addIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  methodCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  methodSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  defaultText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
