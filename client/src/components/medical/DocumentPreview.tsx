// /client/src/components/medical/DocumentPreview.tsx

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import ExtractedData from './ExtractedData';
import { DocumentService } from '@/services/documents';
import { DocumentProcessingService } from '@/services/documentProcessing';
import type { FamilyMemberDocument, ExtractedMedicine } from '@/interfaces/documentTypes';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentPreviewProps {
  document: FamilyMemberDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ErrorState {
  message: string;
  type: 'error' | 'warning';
}

interface ExtractedDataResponse {
  medicines: ExtractedMedicine[];
  vitals?: {
    bloodPressure?: string;
    bloodGlucose?: string;
    hbA1c?: string;
  };
  rawText?: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<ExtractedMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const {
    isProcessing,
    progress,
    processDocument
  } = useDocumentProcessing();
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchExtractedData = async () => {
      if (!document?.id || !isOpen) return;
      
      try {
        setLoading(true);
        setError(null);

        // First check if document needs processing
        if (document.processed_status === 'pending') {
          await DocumentProcessingService.processDocument(document.id);
        }

        // Get extracted data
        const data = await DocumentService.getExtractedData(document.id);
        console.log('Extracted data:', data); // Debug log

        if (!data?.medicines || data.medicines.length === 0) {
          console.log('No medicines found in data'); // Debug log
          setError({
            message: 'No medicines were detected in this document',
            type: 'warning'
          });
          setMedicines([]);
        } else {
          setMedicines(data.medicines);
        }
      } catch (error: any) {
        console.error('Document data fetch error:', error);
        setError({
          message: error.response?.data?.message || error.message || 'Failed to load document data',
          type: 'error'
        });
        toast({
          title: "Error",
          description: error.message || 'Failed to load document data',
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && document) {
      fetchExtractedData();
    } else {
      // Reset states when dialog closes
      setMedicines([]);
      setError(null);
      setIframeError(false);
      setLoading(true);
    }
  }, [document?.id, isOpen, document?.processed_status]);

  const handleRetryProcessing = async () => {
    if (!document?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      // Process the document
      await DocumentProcessingService.processDocument(document.id);
      
      // Get the updated data
      const data = await DocumentService.getExtractedData(document.id);
      
      if (!data?.medicines || data.medicines.length === 0) {
        setError({
          message: 'No medicines were detected in this document',
          type: 'warning'
        });
        setMedicines([]);
      } else {
        setMedicines(data.medicines);
        toast({
          title: "Success",
          description: "Document processed successfully",
        });
      }

      setIframeError(false);
    } catch (error: any) {
      console.error('Processing error:', error);
      setError({
        message: error.response?.data?.message || error.message || 'Failed to process document',
        type: 'error'
      });
      toast({
        title: "Error",
        description: "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIframeError = () => {
    setIframeError(true);
    toast({
      title: "Error",
      description: "Failed to load document preview",
      variant: "destructive",
    });
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={() => {
        onClose();
        setMedicines([]);
        setError(null);
        setIframeError(false);
      }}
    >
      <DialogContent className="max-w-4xl h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{document?.file_name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-4rem)] overflow-hidden">
          {/* PDF Viewer */}
          <div className="h-full w-full overflow-hidden bg-gray-100 rounded-lg relative">
            {document && !iframeError ? (
              <object
                data={`${window.location.origin}/api/documents/${document.id}/view?token=${token}`}
                type="application/pdf"
                className="w-full h-full"
                onError={handleIframeError}
              >
                <iframe
                  src={`${window.location.origin}/api/documents/${document.id}/view?token=${token}`}
                  className="w-full h-full border-0"
                  title="Document Preview"
                  sandbox="allow-same-origin allow-scripts"
                  referrerPolicy="no-referrer"
                  onError={handleIframeError}
                >
                  This browser does not support PDFs. Please download the PDF to view it.
                </iframe>
              </object>
            ) : iframeError ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <AlertCircle className="h-12 w-12 text-destructive mb-2" />
                <p className="text-sm text-gray-500 text-center">
                  Failed to load document preview
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIframeError(false)}
                  className="mt-4"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Loading
                </Button>
              </div>
            ) : null}
          </div>

          {/* Extracted Data */}
          <div className="h-full overflow-y-auto px-2">
            {isProcessing ? (
              <div className="p-4">
                <h3 className="mb-2">Processing Document...</h3>
                <Progress value={progress} className="w-full" />
              </div>
            ) : document?.processed_status === 'failed' ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  Document processing failed
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryProcessing}
                    className="ml-2"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <Progress value={undefined} className="w-1/2" />
              </div>
            ) : error ? (
              <Alert variant={error.type === 'warning' ? 'default' : 'destructive'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  {error.message}
                  {document && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryProcessing}
                      className="ml-2"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Processing
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <ExtractedData
                medicines={medicines}
                processingStatus={document?.processed_status}
                onRetry={handleRetryProcessing}
                showRawText={false}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreview;