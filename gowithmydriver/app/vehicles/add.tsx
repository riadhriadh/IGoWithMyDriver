import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { Alert } from 'react-native';

export default function AddVehicleScreen() {
  const [type, setType] = useState<'berline' | 'van' | 'moto'>('berline');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [color, setColor] = useState('');
  const [seats, setSeats] = useState('4');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!brand || !model || !plateNumber || !insuranceExpiry) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!user) return;

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/drivers/vehicles', {
        type,
        brand,
        model,
        year: year ? parseInt(year) : null,
        plateNumber,
        color: color || null,
        seats: parseInt(seats) || 4,
        insuranceExpiry,
        isActive: true,
      });
      router.back();
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      setError(error.message || 'Erreur lors de l\'ajout du véhicule');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un véhicule</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type de véhicule</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'berline' && styles.typeButtonActive]}
                onPress={() => setType('berline')}
              >
                <Text
                  style={[styles.typeButtonText, type === 'berline' && styles.typeButtonTextActive]}
                >
                  Berline
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, type === 'van' && styles.typeButtonActive]}
                onPress={() => setType('van')}
              >
                <Text
                  style={[styles.typeButtonText, type === 'van' && styles.typeButtonTextActive]}
                >
                  Van
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, type === 'moto' && styles.typeButtonActive]}
                onPress={() => setType('moto')}
              >
                <Text
                  style={[styles.typeButtonText, type === 'moto' && styles.typeButtonTextActive]}
                >
                  Moto
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations du véhicule</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Marque <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Mercedes, BMW, etc."
                value={brand}
                onChangeText={setBrand}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Modèle <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Classe E, Série 5, etc."
                value={model}
                onChangeText={setModel}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Année</Text>
              <TextInput
                style={styles.input}
                placeholder="2023"
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
                maxLength={4}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Plaque d'immatriculation <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="AB-123-CD"
                value={plateNumber}
                onChangeText={setPlateNumber}
                autoCapitalize="characters"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Couleur</Text>
              <TextInput
                style={styles.input}
                placeholder="Noir, Blanc, etc."
                value={color}
                onChangeText={setColor}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombre de places</Text>
              <TextInput
                style={styles.input}
                placeholder="4"
                value={seats}
                onChangeText={setSeats}
                keyboardType="numeric"
                maxLength={2}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assurance</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Date d'expiration <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (ex: 2024-12-31)"
                value={insuranceExpiry}
                onChangeText={setInsuranceExpiry}
                editable={!loading}
              />
              <Text style={styles.hint}>Format: AAAA-MM-JJ</Text>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Ajouter le véhicule</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  flex: {
    flex: 1,
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
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
