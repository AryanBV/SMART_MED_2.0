// Path: client/src/hooks/useDashboardData.ts

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
      try {
        const response = await DashboardService.getDashboardData(filters);
        
        if (!response?.success) {
          console.error('Dashboard data fetch failed:', response);
          throw new Error('Failed to fetch dashboard data');
        }

        const data = response.data;
        
        // Process members with documents
        const membersWithExtractedData = await Promise.all(
          data.familyMembers.map(async (member: FamilyMemberHealth) => {
            try {
              const documents = await DocumentProcessingService.getMemberDocuments(member.id);
              console.log(`Documents for member ${member.id}:`, documents);
              // Rest of the code...
            } catch (error) {
              console.error(`Error fetching documents for member ${member.id}:`, error);
              throw error;
            }
            
            try {
              // Get all documents for this member
              const documents = await DocumentProcessingService.getMemberDocuments(member.id);
              console.log(`Documents for member ${member.id}:`, documents);

              if (!documents?.length) {
                console.log(`No documents found for member ${member.id}`);
                return {
                  ...member,
                  metrics: {
                    bloodPressure: 'N/A',
                    bloodGlucose: 'N/A',
                    hbA1c: 'N/A'
                  },
                  medications: [],
                  lastDocument: null,
                  documentCount: 0
                };
              }

              // Get the latest document
              const latestDoc = documents[0];
              console.log(`Latest document for member ${member.id}:`, latestDoc);

              // If document is pending or processing
              if (['pending', 'processing'].includes(latestDoc.processed_status)) {
                // Start processing if pending
                if (latestDoc.processed_status === 'pending') {
                  try {
                    await DocumentProcessingService.processDocument(latestDoc.id);
                  } catch (processError) {
                    console.error(`Error processing document ${latestDoc.id}:`, processError);
                  }
                }

                return {
                  ...member,
                  metrics: {
                    bloodPressure: 'N/A',
                    bloodGlucose: 'N/A',
                    hbA1c: 'N/A'
                  },
                  medications: [],
                  lastDocument: {
                    ...latestDoc,
                    extractedText: '',
                    processedData: null
                  },
                  documentCount: documents.length
                };
              }

              // Get extracted data for completed documents
              let extractedData = null;
              if (latestDoc.processed_status === 'completed') {
                try {
                  extractedData = await DocumentProcessingService.getExtractedData(latestDoc.id);
                  console.log(`Extracted data for document ${latestDoc.id}:`, extractedData);
                } catch (extractError) {
                  console.error(`Error getting extracted data for document ${latestDoc.id}:`, extractError);
                }
              }

              return {
                ...member,
                metrics: {
                  bloodPressure: extractedData?.vitals?.bloodPressure || 'N/A',
                  bloodGlucose: extractedData?.vitals?.bloodGlucose || 'N/A',
                  hbA1c: extractedData?.vitals?.hbA1c || 'N/A'
                },
                medications: extractedData?.medicines || [],
                lastDocument: {
                  ...latestDoc,
                  extractedText: extractedData?.rawText || '',
                  processedData: extractedData
                },
                documentCount: documents.length,
                lastUpdate: latestDoc.updated_at || new Date().toISOString()
              };

            } catch (error) {
              console.error(`Error processing data for member ${member.id}:`, error);
              toast({
                title: "Error",
                description: `Failed to process data for ${member.name}`,
                variant: "destructive",
              });
              return {
                ...member,
                metrics: {
                  bloodPressure: 'N/A',
                  bloodGlucose: 'N/A',
                  hbA1c: 'N/A'
                },
                medications: [],
                lastDocument: null,
                documentCount: 0
              };
            }
          })
        );

        return {
          ...data,
          familyMembers: membersWithExtractedData
        };

      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        throw error;
      }
    },
    refetchInterval: 15000, // Refresh every 15 seconds
    retry: 3, // Retry failed requests 3 times
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Process document mutation with automatic extraction
  const processDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      try {
        // Start processing
        const processedDoc = await DocumentProcessingService.processDocument(documentId);
        
        if (processedDoc.processed_status === 'completed') {
          const extractedData = await DocumentProcessingService.getExtractedData(documentId);
          return { ...processedDoc, extractedData };
        }
        
        throw new Error(processedDoc.error || 'Document processing failed');
      } catch (error: any) {
        console.error('Document processing error:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Success",
        description: "Document processed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process document",
        variant: "destructive",
      });
    }
  });

  // Update metrics mutation
  const updateMetricsMutation = useMutation({
    mutationFn: async ({ memberId, metrics }) => {
      const response = await DashboardService.updateHealthMetrics(memberId, metrics);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update health metrics');
      }
      return response.data;
    },
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
        description: error.message || "Failed to update health metrics",
        variant: "destructive",
      });
    }
  });

  const refreshDashboard = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      return await refetch();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast({
        title: "Refresh Error",
        description: "Failed to refresh dashboard data",
        variant: "destructive",
      });
    }
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
    isProcessing: processDocumentMutation.isLoading,
    isUpdating: updateMetricsMutation.isLoading
  };
};

export default useDashboardData;