import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, Plus, Check, X, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';

interface Schedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  status: string;
  notes: string | null;
  validatedAt: string | null;
}

export default function PlanningScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [notes, setNotes] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    if (!user) return;

    try {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const params = {
        startDate: today.toISOString().split('T')[0],
        endDate: nextMonth.toISOString().split('T')[0],
      };

      const response = await apiClient.get<{ schedules: Schedule[] }>(
        '/drivers/schedules',
        { params }
      );

      setSchedules(response.schedules || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setSchedules([]);
    }
    
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedules();
    setRefreshing(false);
  };

  const openAddModal = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    setSelectedDate(today.toISOString().split('T')[0]);
    setStartTime('08:00');
    setEndTime('18:00');
    setNotes('');
    setModalVisible(true);
  };

  const addSchedule = async () => {
    if (!user || !selectedDate || !startTime || !endTime) return;

    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const duration = endHour - startHour;

    if (duration < 7) {
      Alert.alert('Erreur', 'La durée minimale est de 7 heures');
      return;
    }

    try {
      await apiClient.post('/drivers/schedules', {
        date: selectedDate,
        startTime: startTime,
        endTime: endTime,
        isAvailable: true,
        status: 'pending',
        notes: notes || null,
      });

      setModalVisible(false);
      loadSchedules();
    } catch (error: any) {
      console.error('Schedule insert error:', error);
      if (error.statusCode === 409) {
        Alert.alert('Erreur', 'Vous avez déjà un planning pour cette date');
      } else {
        Alert.alert('Erreur', error.message || 'Impossible d\'ajouter le planning');
      }
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    try {
      await apiClient.delete(`/drivers/schedules/${scheduleId}`);
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      Alert.alert('Erreur', 'Impossible de supprimer le planning');
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      pending: '#FF9500',
      validated: '#34C759',
      rejected: '#FF3B30',
    };
    return colorMap[status] || '#8E8E93';
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'En attente',
      validated: 'Validé',
      rejected: 'Refusé',
    };
    return statusMap[status] || status;
  };

  const calculateWorkingHours = (start: string, end: string) => {
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    return endHour - startHour;
  };

  const renderScheduleItem = ({ item }: { item: Schedule }) => {
    const workingHours = calculateWorkingHours(item.startTime, item.endTime);
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    return (
      <View style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <View style={styles.scheduleHeaderLeft}>
            <Calendar size={20} color="#007AFF" />
            <Text style={styles.scheduleDate}>{formattedDate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.timeInfo}>
          <View style={styles.timeDetail}>
            <Clock size={16} color="#8E8E93" />
            <Text style={styles.timeText}>
              {item.startTime} - {item.endTime}
            </Text>
          </View>
          <Text style={styles.hoursText}>{workingHours}h de travail</Text>
        </View>

        {item.notes && <Text style={styles.notes}>Note: {item.notes}</Text>}

        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteSchedule(item.id)}
          >
            <X size={16} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        )}

        {item.status === 'validated' && item.validatedAt && (
          <View style={styles.validatedInfo}>
            <Check size={14} color="#34C759" />
            <Text style={styles.validatedText}>
              Validé le {new Date(item.validatedAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const getTotalHours = () => {
    return schedules
      .filter((s) => s.status === 'validated')
      .reduce((total, schedule) => {
        return total + calculateWorkingHours(schedule.startTime, schedule.endTime);
      }, 0);
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
        <Text style={styles.headerTitle}>Mon Planning</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{getTotalHours()}h</Text>
          <Text style={styles.statLabel}>Heures validées</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{schedules.filter((s) => s.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <AlertCircle size={16} color="#007AFF" />
        <Text style={styles.infoText}>
          Minimum 7 heures par jour requis. Validation sous 72h.
        </Text>
      </View>

      <FlatList
        data={schedules}
        renderItem={renderScheduleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar size={48} color="#8E8E93" />
            <Text style={styles.emptyText}>Aucun planning</Text>
            <Text style={styles.emptySubtext}>Ajoutez vos disponibilités</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajouter une disponibilité</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color="#1a1a1a" />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    style={styles.input}
                    value={selectedDate}
                    onChangeText={setSelectedDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                <View style={styles.timeRow}>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.label}>Heure de début</Text>
                    <TextInput
                      style={styles.input}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="08:00"
                    />
                  </View>

                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.label}>Heure de fin</Text>
                    <TextInput
                      style={styles.input}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="18:00"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Notes (optionnel)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Ajoutez une note..."
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={addSchedule}>
                  <Text style={styles.submitButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E3F2FD',
    margin: 16,
    marginTop: 0,
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
    paddingTop: 0,
  },
  scheduleCard: {
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
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  scheduleDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  hoursText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  validatedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  validatedText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
