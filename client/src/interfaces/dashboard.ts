// File: client/src/interfaces/dashboard.ts

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';
export type DocumentType = 'prescription' | 'lab_result' | 'medical_record' | 'other';

export interface HealthMetric {
  bloodPressure?: string;
  bloodGlucose?: string;
  hbA1c?: string;
  weight?: string;
  date?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  refills?: number;
  startDate?: string;
  endDate?: string;
}

export interface FamilyMemberHealth {
  id: number;
  name: string;
  age: number;
  status: string;
  bloodGroup?: string;
  metrics: {
    bloodPressure: string;
    bloodGlucose: string;
    hbA1c: string;
  };
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration?: string;
    instructions?: string;
    refills?: number;
  }>;
  documentCount?: number;
  lastUpdate: string;
  nextAppointment?: string;
  lastDocument?: {
    extractedText?: string;
    processedData?: {
      vitals?: {
        bloodPressure?: string;
        bloodGlucose?: string;
        hbA1c?: string;
      };
      medications?: Array<{
        medicine_name: string;
        dosage: string;
        frequency: string;
        duration?: string;
        instructions?: string;
        refills?: number;
      }>;
    };
  };
}

export interface DashboardUpdate {
  id: number;
  type: 'document' | 'medication' | 'appointment' | 'metric';
  memberId: number;
  memberName: string;
  description: string;
  timestamp: string;
  documentId?: number;
}

export interface DashboardAppointment {
  id: number;
  memberId: number;
  memberName: string;
  doctorName: string;
  doctorSpecialty?: string;
  date: string;
  time: string;
  type: string;
  location?: string;
}

export interface DashboardAlert {
  id: number;
  memberId: number;
  memberName: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: string;
  acknowledged?: boolean;
}

export interface ProcessedDocumentData {
  doctorName: string;
  doctorSpecialty?: string;
  visitDate: string;
  medications: Medication[];
  metrics: HealthMetric;
  specialInstructions?: string[];
  nextAppointment?: {
    date: string;
    time: string;
    type?: string;
  };
}

export interface ProcessedDocument {
  id: number;
  profileId: number;
  fileName: string;
  documentType: DocumentType;
  uploadDate: string;
  processingStatus: ProcessingStatus;
  extractedData?: ProcessedDocumentData;
  errorMessage?: string;
}

export interface ExtractedDocumentData {
  profileId: number;
  documentId: number;
  medications: Medication[];
  metrics: HealthMetric;
  visitDate?: string;
  nextAppointment?: string;
}

export interface DashboardData {
  familyMembers: FamilyMemberHealth[];
  recentUpdates: DashboardUpdate[];
  upcomingAppointments: DashboardAppointment[];
  alerts: DashboardAlert[];
  processedDocuments: ProcessedDocument[];
  statistics: {
    totalFamilyMembers: number;
    totalDocuments: number;
    pendingAppointments: number;
    activeAlerts: number;
  };
}

export interface DashboardFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  memberIds?: number[];
  documentTypes?: DocumentType[];
  updateTypes?: DashboardUpdate['type'][];
}

export interface HealthTrend {
  memberId: number;
  metric: keyof HealthMetric;
  values: {
    date: string;
    value: string;
  }[];
}