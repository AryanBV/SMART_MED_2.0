// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  token: string;
}

// Profile types
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  relation?: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  medical_conditions?: string[];
  medications?: Medication[];
  created_at: string;
  updated_at: string;
}

// Document types
export interface Document {
  id: string;
  profile_id: string;
  filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_data?: any;
  uploaded_at: string;
  processed_at?: string;
}

// Medication types
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  refills: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

// Family tree types
export interface FamilyMember {
  id: string;
  profile: Profile;
  relation: string;
  level: number;
}

export interface FamilyTreeNodeData {
  profile: Profile;
  relation?: string;
  level: number;
}

export interface FamilyTreeNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FamilyTreeNodeData;
}

export interface FamilyTreeEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: {
    relationship: RelationshipType;
  };
}

export type RelationshipType = 
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'grandparent'
  | 'grandchild'
  | 'aunt'
  | 'uncle'
  | 'cousin';

// Dashboard types
export interface DashboardData {
  profile: Profile;
  recentDocuments: Document[];
  upcomingAppointments: Appointment[];
  healthAlerts: HealthAlert[];
  familyHealthOverview: FamilyHealthData[];
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  doctor?: string;
  type?: string;
}

export interface HealthAlert {
  id: string;
  type: 'medication' | 'appointment' | 'health' | 'document';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  date: string;
}

export interface FamilyHealthData {
  member: Profile;
  healthScore: number;
  lastCheckup?: string;
  criticalConditions: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

export interface ProfileFormData {
  name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  address?: string;
  emergency_contact?: string;
}

// Additional Dashboard types
export interface DashboardAlert {
  id: string;
  type: 'warning' | 'info' | 'error';
  message: string;
  timestamp: Date;
}

export interface FamilyMemberHealth {
  id: string;
  name: string;
  healthStatus: string;
  medications: Medication[];
  lastCheckup: Date;
}

export interface DashboardUpdate {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  member?: string;
}

export interface DashboardAppointment {
  id: string;
  title: string;
  date: Date;
  doctor: string;
  type: string;
}

export interface FamilyMemberDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  size: number;
  member: string;
}

export interface DocumentType {
  value: string;
  label: string;
}

// Auth Context types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<void>;
}