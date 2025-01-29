// client/src/services/documents.ts
import { api } from '@/config/axios';

// Define interfaces for better type safety
export interface Document {
  id: number;
  profile_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  document_type: 'prescription' | 'lab_report' | 'discharge_summary' | 'other';
  processed_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface ExtractedMedicine {
  id: number;
  document_id: number;
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  confidence_score?: number;
}

export interface UploadResponse {
  document: Document;
  extractedData?: {
    medicines: ExtractedMedicine[];
    rawText: string;
  };
  message: string;
}

export const DocumentService = {
  async uploadDocument(file: File, documentType: string = 'other'): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      const response = await api.post<UploadResponse>('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Add upload progress tracking
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          console.log('Upload progress:', percentCompleted);
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  async getDocuments(): Promise<Document[]> {
    try {
      const response = await api.get<Document[]>('/api/documents');
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  async getDocument(documentId: number): Promise<Document> {
    try {
      const response = await api.get<Document>(`/api/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  },

  async deleteDocument(documentId: number): Promise<void> {
    try {
      await api.delete(`/api/documents/${documentId}`);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  async getExtractedData(documentId: number): Promise<ExtractedMedicine[]> {
    try {
      const response = await api.get<ExtractedMedicine[]>(`/api/documents/${documentId}/extracted-data`);
      return response.data;
    } catch (error) {
      console.error('Error fetching extracted data:', error);
      throw error;
    }
  },

  async retryProcessing(documentId: number): Promise<UploadResponse> {
    try {
      const response = await api.post<UploadResponse>(`/api/documents/${documentId}/process`);
      return response.data;
    } catch (error) {
      console.error('Error retrying document processing:', error);
      throw error;
    }
  }
};