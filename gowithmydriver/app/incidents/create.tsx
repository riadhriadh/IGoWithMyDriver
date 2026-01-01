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

export default function CreateIncidentScreen() {
  const [type, setType] = useState<'passenger_issue' | 'vehicle_breakdown' | 'accident' | 'other'>('other');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Veuillez décrire l\'incident');
      return;
    }

    if (!user) return;

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/drivers/incidents', {
        type,
        description: description.trim(),
        status: 'open',
      });
      router.back();
    } catch (error: any) {
      console.error('Error creating incident:', error);
      setError(error.message || 'Erreur lors du signalement de l\'incident');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signaler un incident</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type d'incident</Text>
            <View style={styles.typeGrid}>
              <TouchableOpacity
                style={[
                  styles.typeCard,
                  type === 'passenger_issue' && styles.typeCardActive,
                ]}
                onPress={() => setType('passenger_issue')}
              >
                <Text style={styles.typeCardTitle}>Problème passager</Text>
                <Text style={styles.typeCardDescription}>
                  Comportement inapproprié, annulation, etc.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeCard,
                  type === 'vehicle_breakdown' && styles.typeCardActive,
                ]}
                onPress={() => setType('vehicle_breakdown')}
              >
                <Text style={styles.typeCardTitle}>Panne véhicule</Text>
                <Text style={styles.typeCardDescription}>
                  Problème mécanique, crevaison, etc.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeCard,
                  type === 'accident' && styles.typeCardActive,
                ]}
                onPress={() => setType('accident')}
              >
                <Text style={styles.typeCardTitle}>Accident</Text>
                <Text style={styles.typeCardDescription}>
                  Collision, dommages matériels, etc.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeCard,
                  type === 'other' && styles.typeCardActive,
                ]}
                onPress={() => setType('other')}
              >
                <Text style={styles.typeCardTitle}>Autre</Text>
                <Text style={styles.typeCardDescription}>
                  Autre type d'incident
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description de l'incident</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Décrivez ce qui s'est passé en détail..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              editable={!loading}
            />
            <Text style={styles.hint}>
              Soyez aussi précis que possible : date, heure, lieu, personnes impliquées, etc.
            </Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Notre équipe de support sera notifiée et vous contactera dans les plus brefs délais.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Signaler l'incident</Text>
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
  typeGrid: {
    gap: 12,
  },
  typeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  typeCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  typeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  typeCardDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 160,
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    lineHeight: 16,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 18,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#FF3B30',
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
