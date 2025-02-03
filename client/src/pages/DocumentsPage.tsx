// client/src/pages/DocumentsPage.tsx
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Upload, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DocumentService } from '@/services/documents';
import { FamilyMemberDocument, ExtractedMedicine } from '@/interfaces/documentTypes';
import DocumentUpload from '@/components/medical/DocumentUpload';
import DocumentList from '@/components/medical/DocumentList';
import FamilyDocumentSelector from '@/components/medical/FamilyDocumentSelector';
import DocumentFilters from '@/components/medical/DocumentFilters';
import ExtractedData from '@/components/medical/ExtractedData';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthContextType } from '@/interfaces/auth';  // Changed this line
import DocumentPreview from '@/components/medical/DocumentPreview';

interface ExtractedDataState {
  medicines: ExtractedMedicine[];
  rawText?: string;
}

const DocumentsPage = () => {
  const { user } = useAuth() as AuthContextType;  // Added type assertion here
  const { toast } = useToast();
  const [documents, setDocuments] = useState<FamilyMemberDocument[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [documentType, setDocumentType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedDataState | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingDocument, setProcessingDocument] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<FamilyMemberDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (user && user.profileId && !selectedProfileId) {
      setSelectedProfileId(user.profileId);
    }
  }, [user, selectedProfileId]);


  const fetchDocuments = async () => {
    if (!selectedProfileId) return;
    
    try {
      setIsLoading(true);
      const fetchedDocuments = await DocumentService.getDocuments(selectedProfileId);
      
      // Apply document type filter
      const filteredDocuments = documentType === 'all'
        ? fetchedDocuments
        : fetchedDocuments.filter(doc => doc.document_type === documentType);
      
      setDocuments(filteredDocuments);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProfileId) {
      fetchDocuments();
    }
  }, [selectedProfileId, documentType]);

  const handleUploadComplete = async (file: File, docType: string) => {
    if (!selectedProfileId) return;

    try {
      setProcessingDocument(true);
      setUploadProgress(0);
      
      const response = await DocumentService.uploadDocument(file, selectedProfileId, docType);
      
      if (response.extractedData) {
        setExtractedData({
          medicines: response.extractedData.medicines,
          rawText: response.extractedData.rawText
        });
      }
      
      await fetchDocuments();
      
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setProcessingDocument(false);
      setShowUpload(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      await DocumentService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleRetryProcessing = async (documentId: number) => {
    try {
      setProcessingDocument(true);
      const response = await DocumentService.retryProcessing(documentId);
      
      if (response.extractedData) {
        setExtractedData({
          medicines: response.extractedData.medicines,
          rawText: response.extractedData.rawText
        });
      }

      await fetchDocuments();
      
      toast({
        title: "Success",
        description: "Document reprocessed successfully",
      });
    } catch (error: any) {
      console.error('Retry processing error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reprocess document",
        variant: "destructive",
      });
    } finally {
      setProcessingDocument(false);
    }
  };

  const handleViewDocument = (document: FamilyMemberDocument) => {
    setSelectedDocument(document);
    setIsPreviewOpen(true);
  };

  if (!user?.profileId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="p-6">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-center text-lg font-medium">Please complete your profile first</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Medical Documents</h1>
        <Button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2"
          disabled={isLoading || processingDocument}
        >
          {processingDocument ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FamilyDocumentSelector
          selectedProfileId={selectedProfileId}
          onProfileSelect={setSelectedProfileId}
        />
        <DocumentFilters
          documentType={documentType}
          onDocumentTypeChange={setDocumentType}
        />
      </div>

      {showUpload ? (
        <DocumentUpload 
          onUploadComplete={handleUploadComplete}
          onProgress={setUploadProgress}
          uploadProgress={uploadProgress}
        />
      ) : extractedData ? (
        <ExtractedData 
          medicines={extractedData.medicines}
          rawText={extractedData.rawText}
          onClose={() => setExtractedData(null)}
        />
      ) : (
        <>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDelete={handleDeleteDocument}
            onRetryProcessing={handleRetryProcessing}
            onView={handleViewDocument}
          />
          <DocumentPreview
            document={selectedDocument}
            isOpen={isPreviewOpen}
            onClose={() => {
              setIsPreviewOpen(false);
              setSelectedDocument(null);
            }}
          />
        </>
      )}
    </div>
  );
};

export default DocumentsPage;