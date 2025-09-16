// Hook for dashboard data management
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { DashboardData } from '@/interfaces/types';

interface UseDashboardDataOptions {
  dateRange?: {
    start?: string;
    end?: string;
  };
  refreshInterval?: number;
}

export const useDashboardData = (options: UseDashboardDataOptions = {}) => {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard-data', options.dateRange],
    queryFn: () => ApiService.dashboard.getData(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: options.refreshInterval,
    retry: 2,
  });

  // Process document function placeholder
  const processDocument = async (documentId: number) => {
    // This would trigger OCR processing for a specific document
    // For now, it's a placeholder
    console.log('Processing document:', documentId);
  };

  return {
    dashboardData: data?.data as DashboardData | undefined,
    isLoading,
    error,
    refetch,
    processDocument,
    familyMembers: data?.data?.familyMembers || [],
    recentActivity: data?.data?.recentActivity || [],
    upcomingAppointments: data?.data?.upcomingAppointments || [],
    alerts: data?.data?.alerts || [],
    statistics: data?.data?.statistics || {
      totalFamilyMembers: 0,
      totalDocuments: 0,
      recentPrescriptions: 0,
      activeMedications: 0,
      pendingAppointments: 0
    }
  };
};