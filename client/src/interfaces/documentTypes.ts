import { Document } from './document';

// Extended document interface with family context
export interface FamilyMemberDocument extends Document {
  owner_name: string;
  relationship?: string;
  access_level: 'admin' | 'write' | 'read';
}

// Document filter types
export interface DocumentFilter {
  profileId?: number;
  documentType?: 'prescription' | 'lab_report' | 'discharge_summary' | 'other' | 'all';
  startDate?: Date;
  endDate?: Date;
}

// Medicine extraction types
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

// Document processing status
export interface ProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

// Document upload response
export interface DocumentUploadResponse {
  message: string;
  document: FamilyMemberDocument;
  extractedData?: {
    medicines: ExtractedMedicine[];
    rawText?: string;
  };
}

// Document access permissions
export interface DocumentAccess {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

export interface DocumentUploadProps {
  onUploadComplete: (file: File, documentType: string) => Promise<void>;
  onProgress: (progress: number) => void;
  uploadProgress: number;
}