// Path: C:\Project\SMART_MED_2.0\client\src\services\documents.ts

import axios from '@/config/axios';
import { 
  FamilyMemberDocument, 
  DocumentUploadResponse, 
  DocumentFilter,
  ExtractedMedicine 
} from '@/interfaces/documentTypes';
import { DocumentProcessingService } from '@/services/documentProcessing';

export class DocumentService {
  static async uploadDocument(
    file: File, 
    profileId: number, 
    documentType: string
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('profileId', profileId.toString());
    formData.append('documentType', documentType);

    try {
      // Upload document
      const response = await axios.post<DocumentUploadResponse>(
        '/api/documents/upload', 
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000,
        }
      );

      // Process document after successful upload
      if (response.data.document?.id) {
        try {
          // Start OCR processing
          await DocumentProcessingService.processDocument(response.data.document.id);
          
          // Get extracted data after processing
          const extractedData = await DocumentProcessingService.getExtractedData(response.data.document.id);
          
          if (extractedData?.medicines?.length) {
            // Update family member medications if medicines were extracted
            await DocumentProcessingService.updateFamilyMemberMedications(
              profileId,
              extractedData.medicines.map((med: ExtractedMedicine) => ({
                name: med.medicine_name,
                dosage: med.dosage || '',
                frequency: med.frequency || '',
                duration: med.duration || '',
                instructions: med.instructions || '',
                startDate: new Date().toISOString()
              }))
            );
          }
        } catch (processingError) {
          console.error('Document processing error:', processingError);
          // Don't throw here - we still want to return the upload response
          // The processing status will be handled by the processing service
        }
      }

      return response.data;
    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async getDocuments(profileId?: number): Promise<FamilyMemberDocument[]> {
    try {
        const params = profileId ? { profileId } : {};
        const response = await axios.get<FamilyMemberDocument[]>(
            '/api/documents',
            { params }
        );
        return response.data;
    } catch (error) {
        console.error('Get documents error:', error);
        throw error;
    }
  }

  static async getDocument(id: number): Promise<FamilyMemberDocument> {
    try {
      const response = await axios.get<FamilyMemberDocument>(
        `/api/documents/${id}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Get document error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async deleteDocument(id: number): Promise<void> {
    try {
      await axios.delete(`/api/documents/${id}`);
    } catch (error: any) {
      console.error('Delete document error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async retryProcessing(id: number): Promise<DocumentUploadResponse> {
    try {
      const response = await axios.post<DocumentUploadResponse>(
        `/api/documents/${id}/process`
      );
      return response.data;
    } catch (error: any) {
      console.error('Retry processing error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async getExtractedData(id: number) {
    try {
      const response = await axios.get(`/api/documents/${id}/extracted-data`);
      return response.data;
    } catch (error: any) {
      console.error('Get extracted data error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async updateDocumentAccess(
    id: number, 
    access_level: string
  ): Promise<void> {
    try {
      await axios.patch(`/api/documents/${id}/access`, { access_level });
    } catch (error: any) {
      console.error('Update access error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async shareDocument(id: number, profileIds: number[]): Promise<void> {
    try {
      await axios.post(`/api/documents/${id}/share`, { profileIds });
    } catch (error: any) {
      console.error('Share document error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async getFamilyDocuments(familyProfileId: number): Promise<FamilyMemberDocument[]> {
    try {
      const response = await axios.get<FamilyMemberDocument[]>(
        `/api/documents/family/${familyProfileId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Get family documents error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async getSharedDocuments(): Promise<FamilyMemberDocument[]> {
    try {
      const response = await axios.get<FamilyMemberDocument[]>(
        '/api/documents/shared-with-me'
      );
      return response.data;
    } catch (error: any) {
      console.error('Get shared documents error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default DocumentService;