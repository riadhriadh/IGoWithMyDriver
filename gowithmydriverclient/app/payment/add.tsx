import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
  addPaymentMethod,
  validateCardNumber,
  detectCardProvider,
} from '@/services/paymentService';
import { ArrowLeft, CreditCard, Smartphone, Banknote } from 'lucide-react-native';

type PaymentType = 'card' | 'apple_pay' | 'google_pay' | 'cash';

export default function AddPaymentMethodScreen() {
  const { passenger } = useAuth();
  const router = useRouter();

  const [selectedType, setSelectedType] = useState<PaymentType>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const paymentTypes = [
    { type: 'card' as PaymentType, label: 'Carte bancaire', icon: CreditCard },
    { type: 'apple_pay' as PaymentType, label: 'Apple Pay', icon: Smartphone },
    { type: 'google_pay' as PaymentType, label: 'Google Pay', icon: Smartphone },
    { type: 'cash' as PaymentType, label: 'Espèces', icon: Banknote },
  ];

  const formatCardNumberInput = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted;
  };

  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    if (cleaned.length <= 16) {
      setCardNumber(formatCardNumberInput(cleaned));
    }
  };

  const handleExpiryMonthChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2) {
      const month = parseInt(cleaned);
      if (cleaned === '' || (month >= 1 && month <= 12)) {
        setExpiryMonth(cleaned);
      }
    }
  };

  const handleExpiryYearChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setExpiryYear(cleaned);
    }
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      setCvv(cleaned);
    }
  };

  const validateForm = () => {
    if (selectedType === 'card') {
      if (!cardNumber.trim()) {
        Alert.alert('Erreur', 'Veuillez saisir le numéro de carte');
        return false;
      }

      const cleanedNumber = cardNumber.replace(/\s/g, '');
      if (!validateCardNumber(cleanedNumber)) {
        Alert.alert('Erreur', 'Numéro de carte invalide');
        return false;
      }

      if (!cardholderName.trim()) {
        Alert.alert('Erreur', 'Veuillez saisir le nom du titulaire');
        return false;
      }

      if (!expiryMonth || !expiryYear) {
        Alert.alert('Erreur', 'Veuillez saisir la date d\'expiration');
        return false;
      }

      const month = parseInt(expiryMonth);
      const year = parseInt(expiryYear);

      if (month < 1 || month > 12) {
        Alert.alert('Erreur', 'Mois d\'expiration invalide');
        return false;
      }

      const currentYear = new Date().getFullYear();
      const fullYear = year < 100 ? 2000 + year : year;

      if (fullYear < currentYear) {
        Alert.alert('Erreur', 'La carte a expiré');
        return false;
      }

      if (!cvv || cvv.length < 3) {
        Alert.alert('Erreur', 'CVV invalide');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const cleanedNumber = cardNumber.replace(/\s/g, '');

      const paymentData: any = {
        type: selectedType,
        is_default: isDefault,
      };

      if (selectedType === 'card') {
        const provider = detectCardProvider(cleanedNumber);
        paymentData.provider = provider;
        paymentData.last_four = cleanedNumber.slice(-4);
        paymentData.expiry_month = parseInt(expiryMonth);
        paymentData.expiry_year = parseInt(expiryYear);
        paymentData.cardholder_name = cardholderName.trim();
      }

      await addPaymentMethod(passenger!.id, paymentData);

      Alert.alert('Succès', 'Moyen de paiement ajouté', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'ajouter le moyen de paiement');
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.headerTitle}>Ajouter un moyen de paiement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de paiement</Text>
          <View style={styles.typeGrid}>
            {paymentTypes.map((type) => (
              <TouchableOpacity
                key={type.type}
                style={[
                  styles.typeCard,
                  selectedType === type.type && styles.typeCardSelected,
                ]}
                onPress={() => setSelectedType(type.type)}
              >
                <type.icon
                  size={24}
                  color={selectedType === type.type ? '#4F46E5' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type.type && styles.typeLabelSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedType === 'card' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations de carte</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numéro de carte</Text>
              <TextInput
                style={styles.input}
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                keyboardType="number-pad"
                maxLength={19}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du titulaire</Text>
              <TextInput
                style={styles.input}
                value={cardholderName}
                onChangeText={setCardholderName}
                placeholder="Jean Dupont"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                <Text style={styles.label}>Mois</Text>
                <TextInput
                  style={styles.input}
                  value={expiryMonth}
                  onChangeText={handleExpiryMonthChange}
                  placeholder="MM"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                <Text style={styles.label}>Année</Text>
                <TextInput
                  style={styles.input}
                  value={expiryYear}
                  onChangeText={handleExpiryYearChange}
                  placeholder="AAAA"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={styles.input}
                value={cvv}
                onChangeText={handleCvvChange}
                placeholder="123"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>
        )}

        {selectedType !== 'card' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {selectedType === 'cash'
                ? 'Vous pourrez payer en espèces directement au conducteur à la fin de la course.'
                : `${paymentTypes.find((t) => t.type === selectedType)?.label} sera configuré lors de votre prochaine réservation.`}
            </Text>
          </View>
        )}

        <View style={styles.defaultContainer}>
          <View style={styles.defaultInfo}>
            <Text style={styles.defaultLabel}>Définir comme moyen par défaut</Text>
            <Text style={styles.defaultSubtext}>
              Ce moyen sera utilisé automatiquement pour vos courses
            </Text>
          </View>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
            thumbColor={isDefault ? '#4F46E5' : '#F3F4F6'}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Ajouter</Text>
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
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  typeCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  typeLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  infoBox: {
    margin: 20,
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4F46E5',
    lineHeight: 20,
  },
  defaultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  defaultInfo: {
    flex: 1,
    marginRight: 16,
  },
  defaultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  defaultSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
