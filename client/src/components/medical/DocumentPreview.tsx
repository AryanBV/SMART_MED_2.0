// /client/src/components/medical/DocumentPreview.tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import ExtractedData from './ExtractedData';
import { DocumentService } from '@/services/documents';
import type { FamilyMemberDocument, ExtractedMedicine } from '@/interfaces/documentTypes';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentPreviewProps {
  document: FamilyMemberDocument | null;
  isOpen: boolean;
  onClose: () => void;
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
  const {
    isProcessing,
    progress,
    processDocument
  } = useDocumentProcessing();
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      if (!document?.id || !isOpen) return;
      
      try {
        setLoading(true);
        const data = await DocumentService.getExtractedData(document.id);
        setMedicines(data || []);
      } catch (error) {
        console.error('Error fetching extracted data:', error);
        toast({
          title: "Error",
          description: "Failed to load document data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      setIframeError(false);
      fetchData();
    }
  }, [document?.id, isOpen, toast]);

  const handleRetryProcessing = async () => {
    if (!document?.id) return;
    
    try {
      await processDocument(document.id);
      // Refresh extracted data
      const data = await DocumentService.getExtractedData(document.id);
      setMedicines(data || []);
      setIframeError(false); // Reset iframe error on retry
    } catch (error) {
      console.error('Failed to process document:', error);
      toast({
        title: "Error",
        description: "Failed to process document",
        variant: "destructive",
      });
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
            >
              <iframe
                src={`${window.location.origin}/api/documents/${document.id}/view?token=${token}`}
                className="w-full h-full border-0"
                title="Document Preview"
                sandbox="allow-same-origin allow-scripts"
                referrerPolicy="no-referrer"
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
            ) : (
              <ExtractedData
                medicines={medicines}
                processingStatus={
                  document?.processed_status === 'pending' || document?.processed_status === 'processing'
                    ? undefined
                    : document?.processed_status
                }
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