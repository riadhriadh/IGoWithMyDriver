import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FileText, Trash2, Calendar, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react-native';
import {
  Document,
  documentService,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
} from '@/services/documentService';

interface DocumentCardProps {
  document: Document;
  onDelete?: () => void;
  onPress?: () => void;
}

export function DocumentCard({ document, onDelete, onPress }: DocumentCardProps) {
  const handleDelete = () => {
    Alert.alert('Supprimer le document', 'Êtes-vous sûr de vouloir supprimer ce document ?', [
      {
        text: 'Annuler',
        style: 'cancel',
      },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const success = await documentService.deleteDocument(document.id, document.file_url);
          if (success && onDelete) {
            onDelete();
          }
        },
      },
    ]);
  };

  const getStatusColor = () => {
    switch (document.status) {
      case 'validated':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'rejected':
        return '#FF3B30';
      case 'expired':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = () => {
    switch (document.status) {
      case 'validated':
        return <CheckCircle size={16} color="#34C759" />;
      case 'pending':
        return <Clock size={16} color="#FF9500" />;
      case 'rejected':
        return <XCircle size={16} color="#FF3B30" />;
      case 'expired':
        return <AlertCircle size={16} color="#8E8E93" />;
      default:
        return <Clock size={16} color="#8E8E93" />;
    }
  };

  const isExpiringSoon = documentService.isExpiringSoon(document.expiry_date);
  const isExpired = documentService.isExpired(document.expiry_date);
  const daysUntilExpiry = documentService.getDaysUntilExpiry(document.expiry_date);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FileText size={20} color="#007AFF" />
          <View style={styles.headerText}>
            <Text style={styles.documentType}>
              {DOCUMENT_TYPE_LABELS[document.type]}
            </Text>
            <Text style={styles.fileName} numberOfLines={1}>
              {document.file_name}
            </Text>
          </View>
        </View>

        {document.status === 'pending' && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Trash2 size={18} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statusRow}>
        {getStatusIcon()}
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {DOCUMENT_STATUS_LABELS[document.status]}
        </Text>
        <Text style={styles.versionText}>v{document.version}</Text>
      </View>

      {document.expiry_date && (
        <View style={styles.expiryRow}>
          <Calendar size={14} color={isExpired ? '#FF3B30' : isExpiringSoon ? '#FF9500' : '#8E8E93'} />
          <Text style={[styles.expiryText, isExpired && styles.expiredText, isExpiringSoon && styles.expiringSoonText]}>
            Expire le : {new Date(document.expiry_date).toLocaleDateString('fr-FR')}
            {daysUntilExpiry !== null && daysUntilExpiry > 0 && ` (${daysUntilExpiry}j)`}
            {isExpired && ' - EXPIRÉ'}
            {isExpiringSoon && !isExpired && ' - Expire bientôt'}
          </Text>
        </View>
      )}

      {document.rejection_reason && (
        <View style={styles.rejectionBox}>
          <AlertCircle size={14} color="#FF3B30" />
          <Text style={styles.rejectionText}>{document.rejection_reason}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.uploadDate}>
          Ajouté le {new Date(document.uploaded_at).toLocaleDateString('fr-FR')}
        </Text>
        <Text style={styles.fileSize}>
          {documentService.formatFileSize(document.file_size)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  documentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  fileName: {
    fontSize: 12,
    color: '#8E8E93',
  },
  deleteButton: {
    padding: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 'auto',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  expiryText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  expiredText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  expiringSoonText: {
    color: '#FF9500',
    fontWeight: '600',
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 8,
    backgroundColor: '#FFE6E6',
    borderRadius: 8,
    marginBottom: 8,
  },
  rejectionText: {
    flex: 1,
    fontSize: 12,
    color: '#FF3B30',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  uploadDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  fileSize: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
