// Path: C:\Project\SMART_MED_2.0\client\src\components\medical\DocumentViewer.tsx

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, AlertTriangle } from 'lucide-react';
import MedicationViewer from './MedicationViewer';
import ExtractedData from './ExtractedData';
import type { FamilyMemberDocument } from '@/interfaces/documentTypes';
import type { ProcessedDocument } from '@/interfaces/dashboard';

interface DocumentViewerProps {
  document: FamilyMemberDocument;
  processedData?: ProcessedDocument;
  isOpen: boolean;
  onClose: () => void;
  onRetryProcessing: () => Promise<void>;
  isProcessing: boolean;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  processedData,
  isOpen,
  onClose,
  onRetryProcessing,
  isProcessing
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {document.file_name}
          </DialogTitle>
        </DialogHeader>

        {document.processed_status === 'failed' && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="flex items-center justify-between">
              Document processing failed
              <Button
                variant="outline"
                size="sm"
                onClick={onRetryProcessing}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Retry Processing'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">Document Preview</TabsTrigger>
            {document.document_type === 'prescription' && (
              <TabsTrigger value="medications">Medications</TabsTrigger>
            )}
            <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <iframe
              src={`/api/documents/${document.id}/preview`}
              className="w-full h-[600px] border rounded-lg"
              title="Document Preview"
            />
          </TabsContent>

          {document.document_type === 'prescription' && (
            <TabsContent value="medications" className="mt-4">
              {processedData?.extractedData?.medications ? (
                <MedicationViewer 
                  medications={processedData.extractedData.medications}
                  className="max-h-[600px]"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No medications found in this document
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="extracted" className="mt-4">
            <ExtractedData
              medicines={processedData?.extractedData?.medications || []}
              rawText={processedData?.extractedData?.rawText}
              processingStatus={document.processed_status}
              onRetry={onRetryProcessing}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;