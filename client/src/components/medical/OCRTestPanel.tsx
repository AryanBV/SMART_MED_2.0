// client/src/components/medical/OCRTestPanel.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import DocumentUpload from './DocumentUpload';
import ExtractedData from './ExtractedData';
import ProcessingStatus from './ProcessingStatus';
import { ExtractedMedicine } from '@/interfaces/documentTypes';

const OCRTestPanel: React.FC = () => {
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<{
    medicines: ExtractedMedicine[];
    rawText?: string;
  } | null>(null);
  const { toast } = useToast();

  const handleUploadComplete = async (file: File) => {
    try {
      setProcessingStatus('processing');
      setProgress(0);

      const formData = new FormData();
      formData.append('document', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/documents/test-ocr', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Failed to process document');
      }

      const data = await response.json();
      setProgress(100);
      setProcessingStatus('completed');
      setExtractedData(data.extractedData);

    } catch (error) {
      setProcessingStatus('failed');
      toast({
        title: "Error",
        description: "Failed to process document",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>OCR Testing Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DocumentUpload
          onUploadComplete={handleUploadComplete}
          onProgress={setProgress}
          uploadProgress={progress}
        />

        {processingStatus !== 'idle' && (
          <ProcessingStatus
            status={processingStatus}
            progress={progress}
          />
        )}

        {extractedData && (
          <ExtractedData
            medicines={extractedData.medicines}
            rawText={extractedData.rawText}
            showRawText={true}
            processingStatus={processingStatus === 'completed' ? 'completed' : 'failed'}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default OCRTestPanel;