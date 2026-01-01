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
import { ChevronLeft, Plus, FileText, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { documentService, Document, DocumentStatus } from '@/services/documentService';
import { DocumentCard } from '@/components/DocumentCard';

export default function DocumentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | DocumentStatus>('all');
  const [expiringCount, setExpiringCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, selectedFilter]);

  const loadDocuments = async () => {
    if (!user) return;

    setLoading(true);

    await documentService.checkExpiredDocuments(user.id);

    const docs = await documentService.getDocuments(user.id);
    setDocuments(docs);

    const expiring = await documentService.getExpiringDocuments(user.id, 30);
    setExpiringCount(expiring.length);

    const expired = docs.filter((doc) => doc.status === 'expired');
    setExpiredCount(expired.length);

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const filterDocuments = () => {
    if (selectedFilter === 'all') {
      setFilteredDocuments(documents);
    } else {
      setFilteredDocuments(documents.filter((doc) => doc.status === selectedFilter));
    }
  };

  const filters: Array<{ key: 'all' | DocumentStatus; label: string }> = [
    { key: 'all', label: 'Tous' },
    { key: 'validated', label: 'Validés' },
    { key: 'pending', label: 'En attente' },
    { key: 'expired', label: 'Expirés' },
    { key: 'rejected', label: 'Rejetés' },
  ];

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Documents</Text>
        <TouchableOpacity onPress={() => router.push('/documents/upload')} style={styles.addButton}>
          <Plus size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {(expiringCount > 0 || expiredCount > 0) && (
        <View style={styles.alertsContainer}>
          {expiredCount > 0 && (
            <View style={styles.alertBox}>
              <AlertCircle size={20} color="#FF3B30" />
              <Text style={styles.alertText}>
                {expiredCount} document{expiredCount > 1 ? 's' : ''} expiré{expiredCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {expiringCount > 0 && (
            <View style={[styles.alertBox, { backgroundColor: '#FFF9E6' }]}>
              <AlertCircle size={20} color="#FF9500" />
              <Text style={[styles.alertText, { color: '#FF9500' }]}>
                {expiringCount} document{expiringCount > 1 ? 's' : ''} expire{expiringCount > 1 ? 'nt' : ''} bientôt
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.filtersContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterChip, selectedFilter === filter.key && styles.filterChipActive]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter.key && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredDocuments}
        renderItem={({ item }) => (
          <DocumentCard document={item} onDelete={loadDocuments} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileText size={64} color="#E5E5EA" />
            <Text style={styles.emptyText}>Aucun document</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter === 'all'
                ? 'Ajoutez vos premiers documents'
                : 'Aucun document dans cette catégorie'}
            </Text>
            {selectedFilter === 'all' && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/documents/upload')}
              >
                <Text style={styles.emptyButtonText}>Ajouter un document</Text>
              </TouchableOpacity>
            )}
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    padding: 8,
  },
  alertsContainer: {
    padding: 16,
    gap: 12,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#FFE6E6',
    borderRadius: 8,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
