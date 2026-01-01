/**
 * Document Service - Backend API version (no Supabase)
 */

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '@/lib/apiClient';

export interface Document {
  id: string;
  driverId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  expiryDate: string | null;
  status: DocumentStatus;
  rejectionReason: string | null;
  uploadedAt: string;
  validatedAt: string | null;
  version: number;
  previousVersionId: string | null;
}

export type DocumentType =
  | 'license'
  | 'insurance'
  | 'professional_card'
  | 'vehicle_registration'
  | 'other';

export type DocumentStatus = 'pending' | 'validated' | 'rejected' | 'expired';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  license: 'Permis de conduire',
  insurance: 'Assurance',
  professional_card: 'Carte professionnelle',
  vehicle_registration: 'Carte grise',
  other: 'Autre document',
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: 'En attente',
  validated: 'Validé',
  rejected: 'Rejeté',
  expired: 'Expiré',
};

export const documentService = {
  async pickDocument(): Promise<DocumentPicker.DocumentPickerResult> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    return result;
  },

  async pickImage(): Promise<ImagePicker.ImagePickerResult> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Permission refusée pour accéder à la galerie');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    return result;
  },

  async takePhoto(): Promise<ImagePicker.ImagePickerResult> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Permission refusée pour accéder à la caméra');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    return result;
  },

  /**
   * Upload document via backend API
   */
  async uploadDocument(
    driverId: string,
    file: { uri: string; name: string; type: string; size?: number },
    documentType: DocumentType,
    expiryDate?: string
  ): Promise<Document | null> {
    try {
      const formData = new FormData();
      
      // Add file to form data
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
      
      formData.append('type', documentType);
      if (expiryDate) {
        formData.append('expiryDate', expiryDate);
      }

      const response = await apiClient.upload<{ document: Document }>(
        '/drivers/documents',
        formData
      );

      return response.document;
    } catch (error) {
      console.error('Error uploading document:', error);
      return null;
    }
  },

  /**
   * Get all documents for driver
   */
  async getDocuments(driverId: string): Promise<Document[]> {
    try {
      const response = await apiClient.get<{ documents: Document[] }>(
        '/drivers/documents'
      );
      return response.documents || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  },

  /**
   * Get documents by type
   */
  async getDocumentsByType(driverId: string, type: DocumentType): Promise<Document[]> {
    try {
      const response = await apiClient.get<{ documents: Document[] }>(
        `/drivers/documents?type=${type}`
      );
      return response.documents || [];
    } catch (error) {
      console.error('Error fetching documents by type:', error);
      return [];
    }
  },

  /**
   * Get documents by status
   */
  async getDocumentsByStatus(driverId: string, status: DocumentStatus): Promise<Document[]> {
    try {
      const response = await apiClient.get<{ documents: Document[] }>(
        `/drivers/documents?status=${status}`
      );
      return response.documents || [];
    } catch (error) {
      console.error('Error fetching documents by status:', error);
      return [];
    }
  },

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, fileUrl: string): Promise<boolean> {
    try {
      await apiClient.delete(`/drivers/documents/${documentId}`);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  },

  /**
   * Get expiring documents
   */
  async getExpiringDocuments(driverId: string, daysThreshold: number = 30): Promise<Document[]> {
    try {
      const response = await apiClient.get<{ documents: Document[] }>(
        `/drivers/documents/expiring?days=${daysThreshold}`
      );
      return response.documents || [];
    } catch (error) {
      console.error('Error fetching expiring documents:', error);
      return [];
    }
  },

  /**
   * Check expired documents
   */
  async checkExpiredDocuments(driverId: string): Promise<Document[]> {
    try {
      const response = await apiClient.get<{ documents: Document[] }>(
        '/drivers/documents/expired'
      );
      return response.documents || [];
    } catch (error) {
      console.error('Error checking expired documents:', error);
      return [];
    }
  },

  isExpiringSoon(expiryDate: string | null, daysThreshold: number = 30): boolean {
    if (!expiryDate) return false;

    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 && diffDays <= daysThreshold;
  },

  isExpired(expiryDate: string | null): boolean {
    if (!expiryDate) return false;

    const expiry = new Date(expiryDate);
    const today = new Date();

    return expiry < today;
  },

  getDaysUntilExpiry(expiryDate: string | null): number | null {
    if (!expiryDate) return null;

    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },
};
