// File: client/src/services/dashboard.ts

import { api } from '@/config/axios';
import type { DashboardData, FamilyMemberHealth } from '@/interfaces/dashboard';

export const DashboardService = {
  // Get all dashboard data in one call
  getDashboardData: async (): Promise<DashboardData> => {
    const response = await api.get('/api/dashboard');
    return response.data;
  },

  // Get health metrics for a specific family member
  getFamilyMemberHealth: async (memberId: number): Promise<FamilyMemberHealth> => {
    const response = await api.get(`/api/dashboard/health/${memberId}`);
    return response.data;
  },

  // Process and extract health data from documents
  processHealthData: async (documentId: number): Promise<void> => {
    await api.post(`/api/dashboard/process-document/${documentId}`);
  },

  // Update health metrics manually
  updateHealthMetrics: async (memberId: number, metrics: Partial<FamilyMemberHealth>) => {
    const response = await api.put(`/api/dashboard/health/${memberId}`, metrics);
    return response.data;
  }
};