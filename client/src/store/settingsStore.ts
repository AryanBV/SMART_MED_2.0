// File: /client/src/store/settingsStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
  documentSettings: {
    autoOcr: boolean;
    compressionLevel: number;
  };
  familySettings: {
    autoShare: boolean;
    defaultAccess: 'view' | 'edit' | 'admin';
  };
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  setNotifications: (type: 'email' | 'push', value: boolean) => void;
  setDocumentSettings: (settings: Partial<SettingsState['documentSettings']>) => void;
  setFamilySettings: (settings: Partial<SettingsState['familySettings']>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'en',
      notifications: {
        email: true,
        push: true,
      },
      documentSettings: {
        autoOcr: true,
        compressionLevel: 70,
      },
      familySettings: {
        autoShare: false,
        defaultAccess: 'view',
      },
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setNotifications: (type, value) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [type]: value,
          },
        })),
      setDocumentSettings: (settings) =>
        set((state) => ({
          documentSettings: {
            ...state.documentSettings,
            ...settings,
          },
        })),
      setFamilySettings: (settings) =>
        set((state) => ({
          familySettings: {
            ...state.familySettings,
            ...settings,
          },
        })),
    }),
    {
      name: 'settings-storage',
    }
  )
);