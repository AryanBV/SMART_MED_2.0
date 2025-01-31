import * as z from 'zod';

export const accountSettingsSchema = z.object({
  // Email Settings
  email: z.string().email('Please enter a valid email address'),
  emailNotifications: z.boolean(),
  
  // Security Settings
  currentPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters')
    .optional(),
  confirmNewPassword: z.string().optional(),
  twoFactorAuth: z.boolean(),
}).refine((data) => {
  // If newPassword is provided, currentPassword must be provided
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required to set a new password",
  path: ["currentPassword"]
}).refine((data) => {
  // If newPassword is provided, it must match confirmNewPassword
  if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"]
});

export type AccountSettingsFormType = z.infer<typeof accountSettingsSchema>;

// Additional settings schemas can be added here
export const documentSettingsSchema = z.object({
  autoOcrProcessing: z.boolean(),
  compressionLevel: z.number().min(0).max(100),
});

export const familySettingsSchema = z.object({
  autoDocumentSharing: z.boolean(),
  defaultAccessLevel: z.enum(['view_only', 'edit', 'full_access']),
});

export const appSettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
  language: z.enum(['en', 'es', 'fr']),
  pushNotifications: z.boolean(),
});

export type DocumentSettingsFormType = z.infer<typeof documentSettingsSchema>;
export type FamilySettingsFormType = z.infer<typeof familySettingsSchema>;
export type AppSettingsFormType = z.infer<typeof appSettingsSchema>;