// src/validations/profileSchemas.ts
import { z } from 'zod';
import { BloodGroup, DiabetesType, Gender } from '../interfaces/profile';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const satisfies readonly BloodGroup[];
const diabetesTypes = ['type1', 'type2', 'gestational', 'none'] as const satisfies readonly DiabetesType[];
const genderTypes = ['male', 'female', 'other'] as const satisfies readonly Gender[];

export const emergencyContactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  relationship: z.string().min(2, 'Relationship is required'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email').optional(),
  is_primary: z.boolean().default(false)
});

export const medicalInformationSchema = z.object({
  diabetes_type: z.enum(diabetesTypes),
  diagnosis_date: z.string().optional(),
  blood_group: z.enum(bloodGroups).optional(),
  height: z.number().min(1).max(300).optional(),
  weight: z.number().min(1).max(500).optional(),
  allergies: z.array(z.string()).optional(),
  medical_conditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional()
});

export const createProfileSchema = z.object({
  // Basic Information
  full_name: z.string().min(2, 'Full name is required'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  gender: z.enum(genderTypes),

  // Medical Information
  diabetes_type: z.enum(diabetesTypes).optional(),
  blood_group: z.enum(bloodGroups).optional(),
  height: z.number().min(1).max(300).optional(),
  weight: z.number().min(1).max(500).optional(),

  // Emergency Contacts
  emergency_contacts: z.array(emergencyContactSchema).min(1, 'At least one emergency contact is required'),

  // Additional Information
  allergies: z.array(z.string()).optional(),
  medical_conditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional()
});

export const updateProfileSchema = createProfileSchema.partial().extend({
  id: z.string()
});

// Export types
export type CreateProfileFormSchema = z.infer<typeof createProfileSchema>;
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type EmergencyContactSchema = z.infer<typeof emergencyContactSchema>;
export type MedicalInformationSchema = z.infer<typeof medicalInformationSchema>;