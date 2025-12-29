// src/interfaces/profile.ts

// Basic types
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type DiabetesType = 'type1' | 'type2' | 'gestational' | 'none';
export type Gender = 'male' | 'female' | 'other';

// Medical related interfaces
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

// Basic profile information for family member creation
export interface ProfileFormData {
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  is_parent: boolean;
}

// Complete profile interface
export interface Profile extends ProfileFormData {
  id?: string;
  user_id?: string;
  medical_info?: MedicalInformation;
  emergency_contacts?: EmergencyContact[];
  created_at?: string;
  updated_at?: string;
}

// For updating profile with medical information
export interface CreateProfileFormData extends ProfileFormData {
  diabetes_type?: DiabetesType;
  blood_group?: BloodGroup;
  height?: number;
  weight?: number;
  emergency_contacts: EmergencyContact[];
  allergies?: string[];
  medical_conditions?: string[];
  medications?: string[];
}

export interface ProfileUpdateData extends Partial<CreateProfileFormData> {
  id: string;
}