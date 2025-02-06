// File: client/src/hooks/useDashboardData.ts

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardService } from '@/services/dashboard';
import { DocumentProcessingService } from '@/services/documentProcessing';
import { useToast } from '@/components/ui/use-toast';
import { DashboardFilters, ProcessedDocument, FamilyMemberHealth } from '@/interfaces/dashboard';

export const useDashboardData = (initialFilters?: DashboardFilters) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters || {});

  const { 
    data: dashboardData,
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ['dashboard', filters],
    queryFn: async () => {
      const response = await DashboardService.getDashboardData(filters);
      
      if (!response.success) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = response.data;
      
      // Process members with documents
      const membersWithExtractedData = await Promise.all(
        data.familyMembers.map(async (member: FamilyMemberHealth) => {
          if (member.documentCount && member.documentCount > 0) {
            try {
              // Get the latest document for this member
              const documents = await DocumentProcessingService.getMemberDocuments(member.id);
              const latestDoc = documents[0]; // Assuming sorted by date

              if (latestDoc && latestDoc.id) {
                const extractedData = await DocumentProcessingService.getExtractedData(latestDoc.id);
                
                return {
                  ...member,
                  metrics: {
                    bloodPressure: extractedData.vitals?.bloodPressure || member.metrics.bloodPressure,
                    bloodGlucose: extractedData.vitals?.bloodGlucose || member.metrics.bloodGlucose,
                    hbA1c: extractedData.vitals?.hbA1c || member.metrics.hbA1c
                  },
                  medications: extractedData.medicines || member.medications || [],
                  lastDocument: {
                    ...latestDoc,
                    extractedText: extractedData.rawText,
                    processedData: extractedData
                  }
                };
              }
            } catch (error) {
              console.error(`Error processing data for member ${member.id}:`, error);
              return member; // Return original member data if processing fails
            }
          }
          return member;
        })
      );

      return {
        ...data,
        familyMembers: membersWithExtractedData
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update metrics mutation
  const updateMetricsMutation = useMutation({
    mutationFn: ({ memberId, metrics }) => 
      DashboardService.updateHealthMetrics(memberId, metrics),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: "Success",
        description: "Health metrics updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update health metrics",
        variant: "destructive",
      });
    }
  });

  // Process document mutation with automatic extraction
  const processDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const processedDoc = await DocumentProcessingService.processDocument(documentId);
      const extractedData = await DocumentProcessingService.getExtractedData(documentId);
      return { ...processedDoc, extractedData };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Success",
        description: `Document processed and data extracted successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to process document",
        variant: "destructive",
      });
    }
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: number) => 
      DashboardService.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const refreshDashboard = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    await refetch();
  };

  return {
    dashboardData,
    isLoading,
    error,
    filters,
    setFilters,
    refetch: refreshDashboard,
    updateMetrics: updateMetricsMutation.mutateAsync,
    processDocument: processDocumentMutation.mutateAsync,
    acknowledgeAlert: acknowledgeAlertMutation.mutateAsync,
    isProcessing: processDocumentMutation.isLoading,
    isUpdating: updateMetricsMutation.isLoading
  };
};

export default useDashboardData;