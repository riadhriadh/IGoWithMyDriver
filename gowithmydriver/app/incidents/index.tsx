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
import { ArrowLeft, Plus, AlertCircle, Clock, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';

interface Incident {
  id: string;
  type: string;
  description: string;
  status: string;
  resolved_at: string | null;
  created_at: string;
}

export default function IncidentsScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadIncidents();
  }, [filter]);

  const loadIncidents = async () => {
    setLoading(true);
    if (!user) return;

    try {
      const params: Record<string, string> = {};
      if (filter === 'open') {
        params.status = 'open,in_progress';
      } else if (filter === 'resolved') {
        params.status = 'resolved';
      }

      const response = await apiClient.get<{ incidents: Incident[] }>(
        '/drivers/incidents',
        { params }
      );
      setIncidents(response.incidents || []);
    } catch (error) {
      console.error('Error loading incidents:', error);
      setIncidents([]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncidents();
    setRefreshing(false);
  };

  const getTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      passenger_issue: 'Problème passager',
      vehicle_breakdown: 'Panne véhicule',
      accident: 'Accident',
      other: 'Autre',
    };
    return typeMap[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      open: '#FF3B30',
      in_progress: '#FF9500',
      resolved: '#34C759',
    };
    return colorMap[status] || '#8E8E93';
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      open: 'Ouvert',
      in_progress: 'En cours',
      resolved: 'Résolu',
    };
    return statusMap[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={16} color="#FF3B30" />;
      case 'in_progress':
        return <Clock size={16} color="#FF9500" />;
      case 'resolved':
        return <CheckCircle size={16} color="#34C759" />;
      default:
        return <AlertCircle size={16} color="#8E8E93" />;
    }
  };

  const renderIncidentItem = ({ item }: { item: Incident }) => {
    return (
      <TouchableOpacity
        style={styles.incidentCard}
        onPress={() => router.push(`/incidents/${item.id}`)}
      >
        <View style={styles.incidentHeader}>
          <View style={styles.incidentHeaderLeft}>
            <View style={[styles.typeIcon, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
              {getStatusIcon(item.status)}
            </View>
            <View style={styles.incidentInfo}>
              <Text style={styles.incidentType}>{getTypeText(item.type)}</Text>
              <Text style={styles.incidentDate}>
                {new Date(item.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <Text style={styles.incidentDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {item.resolved_at && (
          <View style={styles.resolvedInfo}>
            <CheckCircle size={12} color="#34C759" />
            <Text style={styles.resolvedText}>
              Résolu le {new Date(item.resolved_at).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
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
        <Text style={styles.headerTitle}>Incidents</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/incidents/create')}>
          <Plus size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Tous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'open' && styles.filterButtonActive]}
          onPress={() => setFilter('open')}
        >
          <Text style={[styles.filterText, filter === 'open' && styles.filterTextActive]}>
            Ouverts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'resolved' && styles.filterButtonActive]}
          onPress={() => setFilter('resolved')}
        >
          <Text style={[styles.filterText, filter === 'resolved' && styles.filterTextActive]}>
            Résolus
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={incidents}
        renderItem={renderIncidentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertCircle size={48} color="#8E8E93" />
            <Text style={styles.emptyText}>Aucun incident</Text>
            <Text style={styles.emptySubtext}>Les incidents signalés apparaîtront ici</Text>
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
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  incidentCard: {
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
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  incidentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incidentInfo: {
    flex: 1,
  },
  incidentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  incidentDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  incidentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  resolvedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  resolvedText: {
    fontSize: 12,
    color: '#34C759',
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
  },
});
