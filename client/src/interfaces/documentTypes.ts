// Path: C:\Project\SMART_MED_2.0\client\src\interfaces\documentTypes.ts

import { Document } from './document';

// Keep existing FamilyMemberDocument interface but enhance it
export interface FamilyMemberDocument extends Document {
  owner_name: string;
  relationship?: string;
  access_level: 'admin' | 'write' | 'read';
}

// Update DocumentFilter with more options
export interface DocumentFilter {
  profileId?: number;
  documentType?: 'prescription' | 'lab_report' | 'discharge_summary' | 'other' | 'all';
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'all';
  startDate?: Date;
  endDate?: Date;
}

// Keep existing ExtractedMedicine interface
export interface ExtractedMedicine {
  id: number;
  document_id: number;
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  confidence_score: number;
  created_at: string;
}

// Keep existing ProcessingStatus interface
export interface ProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

// Update DocumentUploadResponse with more details
export interface DocumentUploadResponse {
  message: string;
  document: FamilyMemberDocument;
  extractedData?: {
    medicines: ExtractedMedicine[];
    rawText?: string;
  };
}

// Add new interfaces
export interface DocumentAccessPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

export interface DocumentViewProps {
  document: FamilyMemberDocument;
  onClose: () => void;
}

// Keep existing DocumentUploadProps
export interface DocumentUploadProps {
  onUploadComplete: (file: File, documentType: string) => Promise<void>;
  onProgress: (progress: number) => void;
  uploadProgress: number;
}

export interface ExtractedDocumentData {
  patientInfo: {
    name: string;
    age: string;
    gender: string;
    bloodGroup: string;
    weight: string;
  };
  vitals: {
    bloodPressure: string;
    bloodGlucose: string;
    hba1c: string;
  };
  medicines: Array<{
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration?: string;
    instructions?: string;
    refills?: number;
  }>;
  nextAppointment?: string;
}