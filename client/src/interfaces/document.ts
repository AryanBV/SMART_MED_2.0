// src/interfaces/document.ts
export interface Document {
    id: number;
    profile_id: number;
    file_name: string;
    file_type: string;
    file_size: number;
    document_type: 'prescription' | 'lab_report' | 'discharge_summary' | 'other';
    processed_status: 'pending' | 'processing' | 'completed' | 'failed';
    extraction_data?: any;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface DocumentUploadResponse {
    document: Document;
    message: string;
  }