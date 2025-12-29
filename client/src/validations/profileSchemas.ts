// src/validations/profileSchemas.ts
import { z } from 'zod';
import { Gender } from '../interfaces/profile';

const genderTypes = ['male', 'female', 'other'] as const satisfies readonly Gender[];

// Basic profile schema for creating/editing profiles
export const createProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters'),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      return selectedDate <= today;
    }, 'Date of birth cannot be in the future'),
  gender: z.enum(genderTypes, {
    required_error: 'Please select a gender',
  })
});

// Schema for updating existing profiles
export const updateProfileSchema = createProfileSchema.partial().extend({
  id: z.string()
});

// Schema for extracted medical information (to be used later with OCR)
export const extractedMedicalSchema = z.object({
  diabetes_type: z.enum(['type1', 'type2', 'gestational', 'none']).optional(),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  height: z.number().min(1).max(300).optional(),
  weight: z.number().min(1).max(500).optional(),
  medications: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  medical_conditions: z.array(z.string()).optional()
});

// Export types
export type CreateProfileSchema = z.infer<typeof createProfileSchema>;
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type ExtractedMedicalSchema = z.infer<typeof extractedMedicalSchema>;