import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Star,
  Award,
  LogOut,
  ChevronRight,
  Settings,
  FileText,
  HelpCircle,
  Shield,
  Bell,
  FolderOpen,
  Edit,
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { driverService, DriverStats } from '@/services/driverService';

export default function ProfileScreen() {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { signOut, user, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    if (!user) return;

    try {
      const driverStats = await driverService.getStats();
      setStats(driverStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    setLoading(false);
  };

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      {
        text: 'Annuler',
        style: 'cancel',
      },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Profil introuvable</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.profileHeader}>
            <TouchableOpacity style={styles.avatar} onPress={() => router.push('/profile/edit')}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={40} color="#007AFF" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.fullName}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{user.status}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => router.push('/profile/edit')}>
              <Edit size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Star size={24} color="#FFD700" />
            <Text style={styles.statValue}>{user.rating?.toFixed(1) || '-'}</Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>

          <View style={styles.statBox}>
            <Award size={24} color="#007AFF" />
            <Text style={styles.statValue}>{stats?.totalRides || user.totalRides || 0}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>

          <View style={styles.statBox}>
            <Car size={24} color="#34C759" />
            <Text style={styles.statValue}>{stats?.acceptanceRate?.toFixed(0) || '-'}%</Text>
            <Text style={styles.statLabel}>Acceptation</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoLeft}>
                <Mail size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoLeft}>
                <Phone size={20} color="#007AFF" />
                <Text style={styles.infoLabel}>Téléphone</Text>
              </View>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>

            {user.vehicleInfo && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoItem}>
                  <View style={styles.infoLeft}>
                    <Car size={20} color="#007AFF" />
                    <Text style={styles.infoLabel}>Véhicule</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {user.vehicleInfo.make} {user.vehicleInfo.model}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>

          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/history')}>
              <View style={styles.menuLeft}>
                <FileText size={20} color="#8E8E93" />
                <Text style={styles.menuText}>Historique des courses</Text>
              </View>
              <ChevronRight size={20} color="#8E8E93" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/vehicles')}>
              <View style={styles.menuLeft}>
                <Car size={20} color="#8E8E93" />
                <Text style={styles.menuText}>Mes véhicules</Text>
              </View>
              <ChevronRight size={20} color="#8E8E93" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/documents')}>
              <View style={styles.menuLeft}>
                <FolderOpen size={20} color="#8E8E93" />
                <Text style={styles.menuText}>Mes documents</Text>
              </View>
              <ChevronRight size={20} color="#8E8E93" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/notifications')}>
              <View style={styles.menuLeft}>
                <Bell size={20} color="#8E8E93" />
                <Text style={styles.menuText}>Notifications</Text>
              </View>
              <ChevronRight size={20} color="#8E8E93" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Settings size={20} color="#8E8E93" />
                <Text style={styles.menuText}>Paramètres du compte</Text>
              </View>
              <ChevronRight size={20} color="#8E8E93" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <HelpCircle size={20} color="#8E8E93" />
                <Text style={styles.menuText}>Aide et support</Text>
              </View>
              <ChevronRight size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>GoWithMyDriver</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'right',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
});
