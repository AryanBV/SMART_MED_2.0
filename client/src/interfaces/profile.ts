// src/interfaces/profile.ts
export interface Profile {
    id?: number;
    user_id?: number;
    full_name: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other';
    is_parent: boolean;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface ProfileFormData {
    full_name: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other';
    is_parent: boolean;
  }