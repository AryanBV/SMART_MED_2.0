// File: client/src/hooks/useHealthMetrics.ts

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DocumentProcessingService } from '@/services/documentProcessing';
import { DashboardService } from '@/services/dashboard';
import type { ProcessedDocument, HealthMetric } from '@/interfaces/dashboard';

export const useHealthMetrics = (documentId: number, profileId: number) => {
  const [processedData, setProcessedData] = useState<ProcessedDocument | null>(null);
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['health-metrics', documentId],
    queryFn: async () => {
      const extractedData = await DocumentProcessingService.getExtractedData(documentId);
      const healthData = await DashboardService.getFamilyMemberHealth(profileId);
      return {
        extracted: extractedData,
        current: healthData
      };
    },
    enabled: !!documentId && !!profileId,
  });

  return {
    processedData,
    isLoading,
    metrics
  };
};