import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocationTracking } from '@/contexts/LocationContext';
import { MapPin, MapPinOff, Info, Activity } from 'lucide-react-native';

export default function TrackingControlContext() {
  const {
    location,
    isTracking,
    isBackgroundTracking,
    error,
    toggleBackgroundTracking,
  } = useLocationTracking();

  const showInfo = () => {
    alert(
      'Le tracking GPS en arrière-plan permet de suivre votre position en temps réel. ' +
      'Vos données sont sécurisées et stockées dans Supabase.\n\n' +
      '• Fréquence: Toutes les 30 secondes ou tous les 50 mètres\n' +
      '• Stockage: 30 jours d\'historique\n' +
      '• Sécurité: RLS activé'
    );
  };

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
          <View style={[styles.statusBadge, isBackgroundTracking && styles.statusBadgeActive]}>
            <View style={[styles.statusDot, isBackgroundTracking && styles.statusDotActive]} />
            <Text style={[styles.statusText, isBackgroundTracking && styles.statusTextActive]}>
              {isBackgroundTracking ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>

        {location && (
          <View style={styles.locationInfo}>
            <Activity size={16} color="#6B7280" />
            <Text style={styles.locationText}>
              Position: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
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
            isBackgroundTracking ? styles.buttonStop : styles.buttonStart,
          ]}
          onPress={toggleBackgroundTracking}
        >
          {isBackgroundTracking ? (
            <MapPinOff size={20} color="#FFFFFF" />
          ) : (
            <MapPin size={20} color="#FFFFFF" />
          )}
          <Text style={styles.buttonText}>
            {isBackgroundTracking ? 'Arrêter le tracking' : 'Démarrer le tracking'}
          </Text>
        </TouchableOpacity>

        {isBackgroundTracking && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Votre position est suivie automatiquement et sauvegardée dans Supabase.
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
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
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
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
