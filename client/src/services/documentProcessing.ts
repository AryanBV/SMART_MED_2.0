// Path: C:\Project\SMART_MED_2.0\client\src\services\documentProcessing.ts

import { api } from '@/config/axios';
import type { 
  ProcessedDocument, 
  DocumentProcessingResult,
  Medication,
  HealthMetric 
} from '@/interfaces/dashboard';
import type { ProcessingStatus } from '@/interfaces/documentTypes';

interface ExtractedMedicationResult {
  medicines: Array<{
    medicine_name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    confidence_score: number;
  }>;
  metrics: HealthMetric;
  visitDate?: string;
  nextAppointment?: string;
}

// Helper function for polling status
const pollStatus = async (documentId: number): Promise<ProcessingStatus> => {
  const maxAttempts = 30; // 30 seconds timeout
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await api.get(`/api/documents/${documentId}/status`);
    const status = response.data;
    
    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }

  throw new Error('Processing timeout');
};

export const DocumentProcessingService = {
  // Add new getMemberDocuments method
  getMemberDocuments: async (profileId: number): Promise<ProcessedDocument[]> => {
    try {
      const response = await api.get(`/api/documents/profile/${profileId}`);
      return response.data.documents;
    } catch (error: any) {
      console.error('Error fetching member documents:', error);
      return [];
    }
  },

  getProcessingStatus: async (documentId: number): Promise<ProcessingStatus> => {
    try {
      const response = await api.get(`/api/documents/${documentId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error getting processing status:', error);
      throw error;
    }
  },
  
  processDocument: async (documentId: number): Promise<ProcessedDocument> => {
    try {
      // Start processing
      await api.post(`/api/documents/${documentId}/process`);
      
      // Poll for status
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      
      while (attempts < maxAttempts) {
        const status = await this.getProcessingStatus(documentId);
        
        if (status.status === 'completed' || status.status === 'failed') {
          return status;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      throw new Error('Document processing timeout');
    } catch (error: any) {
      console.error('Document processing error:', error);
      throw new Error(error.response?.data?.message || 'Failed to process document');
    }
  },

  getExtractedData: async (documentId: number): Promise<DocumentProcessingResult> => {
    try {
      const response = await api.get(`/api/documents/${documentId}/extracted-data`);
      const data = response.data;

      // Transform the data to match the expected format
      return {
        vitals: {
          bloodPressure: data.vitals?.blood_pressure || 'N/A',
          bloodGlucose: data.vitals?.blood_glucose || 'N/A',
          hbA1c: data.vitals?.hba1c || 'N/A'
        },
        medicines: data.medicines?.map((med: any) => ({
          name: med.medicine_name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions,
          refills: med.refills
        })) || [],
        rawText: data.ocr_text || data.rawText || '',
        visitDate: data.visitDate,
        nextAppointment: data.nextAppointment
      };
    } catch (error: any) {
      console.error('Error getting extracted data:', error);
      throw new Error(error.response?.data?.message || 'Failed to get extracted data');
    }
  },

  updateProcessingStatus: async (
    documentId: number, 
    status: ProcessingStatus,
    errorMessage?: string
  ): Promise<void> => {
    try {
      await api.put(`/api/documents/${documentId}/status`, { 
        status,
        errorMessage 
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update processing status');
    }
  },

  processMedications: async (documentId: number): Promise<ExtractedMedicationResult> => {
    try {
      const response = await api.get(`/api/documents/${documentId}/medications`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to process medications');
    }
  },

  updateFamilyMemberMedications: async (
    profileId: number,
    medications: Medication[]
  ): Promise<void> => {
    try {
      await api.post(`/api/family-members/${profileId}/medications`, { medications });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update medications');
    }
  },

  validateExtractedData: async (documentId: number): Promise<{
    isValid: boolean;
    errors?: string[];
  }> => {
    try {
      const response = await api.get(`/api/documents/${documentId}/validate`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate data');
    }
  },

  retryProcessing: async (documentId: number): Promise<ProcessedDocument> => {
    try {
      const response = await api.post(`/api/documents/${documentId}/retry`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to retry processing');
    }
  },

  getMemberMedications: async (profileId: number): Promise<Medication[]> => {
    try {
      const response = await api.get(`/api/family-members/${profileId}/medications`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get medications');
    }
  },

  

  // Add method to get document metadata
  getDocumentMetadata: async (documentId: number): Promise<any> => {
    try {
      const response = await api.get(`/api/documents/${documentId}/metadata`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching document metadata:', error);
      return null;
    }
  }
};

export default DocumentProcessingService;