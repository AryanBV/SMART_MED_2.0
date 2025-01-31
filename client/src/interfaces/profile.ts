// src/interfaces/profile.ts

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type DiabetesType = 'type1' | 'type2' | 'gestational' | 'none';
export type Gender = 'male' | 'female' | 'other';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary: boolean;
}

export interface MedicalInformation {
  diabetes_type: DiabetesType;
  diagnosis_date?: string;
  blood_group?: BloodGroup;
  height?: number; // in cm
  weight?: number; // in kg
  allergies?: string[];
  medical_conditions?: string[];
  medications?: string[];
}

export interface Profile {
  id?: string;
  user_id?: string;
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  is_parent: boolean;
  medical_info?: MedicalInformation;
  emergency_contacts?: EmergencyContact[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateProfileFormData {
  // Basic Information (Required)
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  
  // Medical Information (Optional)
  diabetes_type?: DiabetesType;
  blood_group?: BloodGroup;
  height?: number;
  weight?: number;
  
  // Emergency Contact (At least one required)
  emergency_contacts: EmergencyContact[];
  
  // Additional Information (Optional)
  allergies?: string[];
  medical_conditions?: string[];
  medications?: string[];
}

export interface ProfileUpdateData extends Partial<CreateProfileFormData> {
  id: string;
}