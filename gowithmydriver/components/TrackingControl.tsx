import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useBackgroundTracking } from '@/hooks/useBackgroundTracking';
import { MapPin, MapPinOff, Info } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TrackingControl() {
  const { user } = useAuth();
  const {
    isTracking,
    hasPermission,
    loading,
    error,
    toggleTracking,
    requestPermissions,
  } = useBackgroundTracking(false, {
    accuracy: Location.Accuracy.High,
    timeInterval: 30000,
    distanceInterval: 50,
    showsBackgroundLocationIndicator: true,
  });

  useEffect(() => {
    if (user) {
      AsyncStorage.setItem('@driver_data', JSON.stringify({
        id: user.id,
        email: user.email,
      }));
    }
  }, [user]);

  const handleToggle = async () => {
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions requises',
          'L\'application a besoin des permissions de localisation pour fonctionner en arrière-plan.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    const success = await toggleTracking();

    if (success) {
      Alert.alert(
        'Tracking ' + (isTracking ? 'arrêté' : 'démarré'),
        isTracking
          ? 'Le tracking GPS a été arrêté.'
          : 'Le tracking GPS est maintenant actif en arrière-plan.',
        [{ text: 'OK' }]
      );
    }
  };

  const showInfo = () => {
    Alert.alert(
      'À propos du tracking GPS',
      'Le tracking GPS en arrière-plan permet de suivre votre position en temps réel pour les courses. ' +
      'Vos données de localisation sont sécurisées et ne sont visibles que par vous.\n\n' +
      '• Fréquence: Toutes les 30 secondes ou tous les 50 mètres\n' +
      '• Stockage: 30 jours d\'historique\n' +
      '• Sécurité: Chiffrement et RLS activés',
      [{ text: 'Compris' }]
    );
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MapPin size={24} color="#4F46E5" />
          <Text style={styles.title}>Tracking GPS</Text>
        </View>
        <TouchableOpacity onPress={showInfo} style={styles.infoButton}>
          <Info size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Statut:</Text>
          <View style={[styles.statusBadge, isTracking && styles.statusBadgeActive]}>
            <View style={[styles.statusDot, isTracking && styles.statusDotActive]} />
            <Text style={[styles.statusText, isTracking && styles.statusTextActive]}>
              {isTracking ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>

        {!hasPermission && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Les permissions de localisation sont requises
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            isTracking ? styles.buttonStop : styles.buttonStart,
            (!hasPermission || loading) && styles.buttonDisabled,
          ]}
          onPress={handleToggle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              {isTracking ? (
                <MapPinOff size={20} color="#FFFFFF" />
              ) : (
                <MapPin size={20} color="#FFFFFF" />
              )}
              <Text style={styles.buttonText}>
                {hasPermission
                  ? isTracking
                    ? 'Arrêter le tracking'
                    : 'Démarrer le tracking'
                  : 'Demander les permissions'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {isTracking && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Votre position est suivie toutes les 30 secondes ou tous les 50 mètres parcourus.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  infoButton: {
    padding: 4,
  },
  content: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  statusBadgeActive: {
    backgroundColor: '#DBEAFE',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  statusDotActive: {
    backgroundColor: '#3B82F6',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusTextActive: {
    color: '#1D4ED8',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    fontSize: 13,
    color: '#991B1B',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonStart: {
    backgroundColor: '#4F46E5',
  },
  buttonStop: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
