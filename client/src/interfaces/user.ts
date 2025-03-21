export interface User {
    id: string;
    username: string;
    email: string;
    role: 'parent' | 'child' | 'admin';
    created_at: string;
    updated_at: string;
  }
  
  export interface Profile {
    id: string;
    user_id: string;
    full_name: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other';
    diabetes_type: 'type1' | 'type2' | 'gestational' | 'none';
    diagnosis_date?: string;
    blood_group?: string;
    allergies?: string[];
    medical_conditions?: string[];
    medications?: string[];
    emergency_contact?: {
      name: string;
      relationship: string;
      phone: string;
    };
  }
  
  export interface MedicalRecord {
    id: string;
    profile_id: string;
    record_type: 'prescription' | 'lab_result' | 'diagnosis' | 'other';
    record_date: string;
    details: string;
    created_by: string;
    attachments?: string[];
    status: 'active' | 'archived';
    last_updated: string;
  }
  
  export interface Relationship {
    id: string;
    user_id: string;
    related_user_id: string;
    relationship_type: 'parent' | 'child' | 'sibling';
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    updated_at: string;
  }
  
  export interface FamilyTree {
    id: string;
    owner_id: string;
    members: FamilyMember[];
  }
  
  export interface FamilyMember {
    user: User;
    profile: Profile;
    relationship: Relationship;
    children?: FamilyMember[];
  }