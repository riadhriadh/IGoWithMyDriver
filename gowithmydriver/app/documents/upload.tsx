import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, Image as ImageIcon, FileText, Upload, Calendar } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  documentService,
  DocumentType,
  DOCUMENT_TYPE_LABELS,
} from '@/services/documentService';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function UploadDocumentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<DocumentType>('license');
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  const documentTypes: DocumentType[] = [
    'license',
    'insurance',
    'professional_card',
    'vehicle_registration',
    'other',
  ];

  const handleTakePhoto = async () => {
    try {
      const result = await documentService.takePhoto();

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'accéder à la caméra');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await documentService.pickImage();

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'accéder à la galerie');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await documentService.pickDocument();

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/pdf',
        });
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de sélectionner le fichier');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);

    try {
      const result = await documentService.uploadDocument(
        user.id,
        selectedFile,
        selectedType,
        expiryDate?.toISOString().split('T')[0]
      );

      if (result) {
        Alert.alert('Succès', 'Document téléchargé avec succès', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Erreur', 'Échec du téléchargement du document');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un document</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de document</Text>
          <View style={styles.typeGrid}>
            {documentTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeCard, selectedType === type && styles.typeCardActive]}
                onPress={() => setSelectedType(type)}
              >
                <FileText
                  size={24}
                  color={selectedType === type ? '#007AFF' : '#8E8E93'}
                />
                <Text
                  style={[
                    styles.typeText,
                    selectedType === type && styles.typeTextActive,
                  ]}
                >
                  {DOCUMENT_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fichier</Text>

          {selectedFile ? (
            <View style={styles.selectedFileCard}>
              <FileText size={32} color="#007AFF" />
              <View style={styles.selectedFileInfo}>
                <Text style={styles.selectedFileName} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text style={styles.selectedFileType}>{selectedFile.type}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <Text style={styles.removeButton}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={handleTakePhoto}>
                <Camera size={24} color="#007AFF" />
                <Text style={styles.uploadButtonText}>Prendre une photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
                <ImageIcon size={24} color="#007AFF" />
                <Text style={styles.uploadButtonText}>Galerie photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument}>
                <FileText size={24} color="#007AFF" />
                <Text style={styles.uploadButtonText}>Fichier PDF</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date d'expiration (optionnel)</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color="#8E8E93" />
            <Text style={[styles.dateText, !expiryDate && styles.datePlaceholder]}>
              {expiryDate
                ? expiryDate.toLocaleDateString('fr-FR')
                : 'Sélectionner une date'}
            </Text>
          </TouchableOpacity>

          {expiryDate && (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => setExpiryDate(null)}
            >
              <Text style={styles.clearDateText}>Supprimer la date</Text>
            </TouchableOpacity>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={expiryDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) {
                  setExpiryDate(date);
                }
              }}
            />
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Formats acceptés</Text>
          <Text style={styles.infoText}>
            • Images : JPG, PNG, HEIC{'\n'}
            • Documents : PDF{'\n'}
            • Taille maximale : 10 MB
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (!selectedFile || uploading) && styles.submitButtonDisabled]}
          onPress={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Upload size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Télécharger le document</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  typeText: {
    fontSize: 12,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  typeTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  uploadButtons: {
    gap: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  selectedFileInfo: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  selectedFileType: {
    fontSize: 12,
    color: '#8E8E93',
  },
  removeButton: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dateText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  datePlaceholder: {
    color: '#8E8E93',
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearDateText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
