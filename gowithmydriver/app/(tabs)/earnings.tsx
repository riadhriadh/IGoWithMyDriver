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
import { DollarSign, TrendingUp, Calendar, Check, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { driverService } from '@/services/driverService';
import { apiClient } from '@/lib/apiClient';

interface Payment {
  id: string;
  amount: number;
  type: string;
  status: string;
  paymentDate: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
}

export default function EarningsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { user } = useAuth();

  useEffect(() => {
    loadPayments();
  }, [selectedPeriod]);

  const loadPayments = async () => {
    setLoading(true);
    if (!user) return;

    try {
      // Calculate date range based on period
      let startDate: string | undefined;
      
      if (selectedPeriod === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        startDate = oneWeekAgo.toISOString();
      } else if (selectedPeriod === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        startDate = oneMonthAgo.toISOString();
      }

      // Fetch payments from backend
      const params: Record<string, string> = {};
      if (startDate) {
        params.startDate = startDate;
      }

      const response = await apiClient.get<{ payments: Payment[] }>(
        '/payments/history',
        { params }
      );

      setPayments(response.payments || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
    }
    
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  const getTotalEarnings = () => {
    return payments
      .filter((p) => p.status === 'completed')
      .reduce((total, payment) => total + payment.amount, 0);
  };

  const getPendingEarnings = () => {
    return payments
      .filter((p) => p.status === 'pending')
      .reduce((total, payment) => total + payment.amount, 0);
  };

  const getAveragePerRide = () => {
    const completedRides = payments.filter(
      (p) => p.status === 'completed' && p.type === 'ride_payment'
    );
    if (completedRides.length === 0) return 0;
    return completedRides.reduce((sum, p) => sum + p.amount, 0) / completedRides.length;
  };

  const getTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      ride_payment: 'Course',
      adjustment: 'Ajustement',
      bonus: 'Bonus',
    };
    return typeMap[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: '#FF9500',
      completed: '#34C759',
      failed: '#FF3B30',
    };
    return colorMap[status] || '#8E8E93';
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'En attente',
      completed: 'Payé',
      failed: 'Échoué',
    };
    return statusMap[status] || status;
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => {
    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentHeaderLeft}>
            <View
              style={[
                styles.typeIcon,
                { backgroundColor: item.type === 'bonus' ? '#34C759' : '#007AFF' },
              ]}
            >
              <DollarSign size={16} color="#fff" />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentType}>{getTypeText(item.type)}</Text>
              <Text style={styles.paymentDate}>
                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
          <View style={styles.paymentRight}>
            <Text style={styles.paymentAmount}>{item.amount.toFixed(2)} €</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
        </View>

        {item.periodStart && item.periodEnd && (
          <View style={styles.periodInfo}>
            <Calendar size={12} color="#8E8E93" />
            <Text style={styles.periodText}>
              Période: {new Date(item.periodStart).toLocaleDateString('fr-FR')} -{' '}
              {new Date(item.periodEnd).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}

        {item.paymentDate && item.status === 'completed' && (
          <View style={styles.paidInfo}>
            <Check size={12} color="#34C759" />
            <Text style={styles.paidText}>
              Payé le {new Date(item.paymentDate).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
      </View>
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
        <Text style={styles.headerTitle}>Mes Gains</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardLarge]}>
          <DollarSign size={24} color="#007AFF" />
          <Text style={styles.statValueLarge}>{getTotalEarnings().toFixed(2)} €</Text>
          <Text style={styles.statLabel}>Total gagné</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCardSmall}>
            <Clock size={16} color="#FF9500" />
            <Text style={styles.statValue}>{getPendingEarnings().toFixed(2)} €</Text>
            <Text style={styles.statLabelSmall}>En attente</Text>
          </View>

          <View style={styles.statCardSmall}>
            <TrendingUp size={16} color="#34C759" />
            <Text style={styles.statValue}>{getAveragePerRide().toFixed(2)} €</Text>
            <Text style={styles.statLabelSmall}>Moy. / course</Text>
          </View>
        </View>
      </View>

      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === 'week' && styles.periodButtonTextActive,
            ]}
          >
            Semaine
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === 'month' && styles.periodButtonTextActive,
            ]}
          >
            Mois
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'all' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('all')}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === 'all' && styles.periodButtonTextActive,
            ]}
          >
            Tout
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Calendar size={16} color="#007AFF" />
        <Text style={styles.infoText}>Paiements tous les 15 jours par virement bancaire</Text>
      </View>

      <FlatList
        data={payments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <DollarSign size={48} color="#8E8E93" />
            <Text style={styles.emptyText}>Aucun paiement</Text>
            <Text style={styles.emptySubtext}>Vos gains apparaîtront ici</Text>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statsContainer: {
    padding: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardLarge: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 24,
  },
  statValueLarge: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardSmall: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginVertical: 4,
  },
  statLabelSmall: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#007AFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentHeaderLeft: {
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
  paymentInfo: {
    flex: 1,
  },
  paymentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  periodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  periodText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  paidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  paidText: {
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
