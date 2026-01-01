import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { searchAddress, type AddressSuggestion } from '@/services/geocodingService';
import { X, MapPin } from 'lucide-react-native';

interface AddressInputProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: string, latitude: number, longitude: number) => void;
  title: string;
}

export default function AddressInput({ visible, onClose, onSelectAddress, title }: AddressInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchAddress(query);
        setSuggestions(results);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (suggestion: AddressSuggestion) => {
    onSelectAddress(
      suggestion.display_name,
      parseFloat(suggestion.lat),
      parseFloat(suggestion.lon)
    );
    setQuery('');
    setSuggestions([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            placeholder="Rechercher une adresse..."
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {loading && <ActivityIndicator style={styles.loader} />}
        </View>

        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleSelect(item)}
            >
              <MapPin size={20} color="#6B7280" style={styles.suggestionIcon} />
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            query.length >= 3 && !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucune adresse trouvée</Text>
              </View>
            ) : query.length < 3 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Saisissez au moins 3 caractères</Text>
              </View>
            ) : null
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#111827',
  },
  loader: {
    position: 'absolute',
    right: 36,
  },
  list: {
    paddingHorizontal: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
