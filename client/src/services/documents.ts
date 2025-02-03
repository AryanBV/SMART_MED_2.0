// client/src/services/documents.ts
import axios from '@/config/axios';
import { FamilyMemberDocument, DocumentUploadResponse, DocumentFilter } from '@/interfaces/documentTypes';

export class DocumentService {
  static async uploadDocument(file: File, profileId: number, documentType: string): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('profileId', profileId.toString());
    formData.append('documentType', documentType);

    try {
      console.log('Uploading document:', { fileName: file.name, type: documentType, size: file.size });
      
      const response = await axios.post<DocumentUploadResponse>('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Add timeout and onUploadProgress
        timeout: 30000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          console.log('Upload progress:', percentCompleted);
        },
      });

      console.log('Upload response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async getDocuments(profileId?: number, filters?: DocumentFilter): Promise<FamilyMemberDocument[]> {
    const params = {
      ...filters,
      profileId
    };
    
    const response = await axios.get<FamilyMemberDocument[]>('/api/documents', { params });
    return response.data;
  }

  static async getDocument(id: number): Promise<FamilyMemberDocument> {
    const response = await axios.get<FamilyMemberDocument>(`/api/documents/${id}`);
    return response.data;
  }

  static async deleteDocument(id: number): Promise<void> {
    await axios.delete(`/api/documents/${id}`);
  }

  static async retryProcessing(id: number): Promise<DocumentUploadResponse> {
    const response = await axios.post<DocumentUploadResponse>(`/api/documents/${id}/process`);
    return response.data;
  }

  static async getExtractedData(id: number) {
    const response = await axios.get(`/api/documents/${id}/extracted-data`);
    return response.data;
  }

  static async updateDocumentAccess(id: number, access_level: string): Promise<void> {
    await axios.patch(`/api/documents/${id}/access`, { access_level });
  }

  static async shareDocument(id: number, profileIds: number[]): Promise<void> {
    await axios.post(`/api/documents/${id}/share`, { profileIds });
  }
  
}