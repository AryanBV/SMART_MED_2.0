// client/src/pages/DocumentsPage.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Upload, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DocumentService, Document, ExtractedMedicine } from '@/services/documents';
import DocumentUpload from '@/components/medical/DocumentUpload';
import ExtractedData from '@/components/medical/ExtractedData';
import { useAuth } from '@/contexts/AuthContext';

interface ExtractedDataState {
  medicines: ExtractedMedicine[];
  rawText?: string;
}

const DocumentsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedDataState | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingDocument, setProcessingDocument] = useState(false);

  const fetchDocuments = async () => {
    if (!user?.profileId) return;
    
    try {
      setIsLoading(true);
      const fetchedDocuments = await DocumentService.getDocuments();
      setDocuments(fetchedDocuments);
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
    if (user?.profileId) {
      fetchDocuments();
    }
  }, [user?.profileId]);

  const handleUploadComplete = async (file: File) => {
    if (!user?.profileId) return;

    try {
      setProcessingDocument(true);
      setUploadProgress(0);
      
      const response = await DocumentService.uploadDocument(file);
      
      if (response.extractedData) {
        setExtractedData({
          medicines: response.extractedData.medicines,
          rawText: response.extractedData.rawText
        });
      }
      
      // Refresh documents list
      await fetchDocuments();
      
      toast({
        title: "Success",
        description: response.message || "Document uploaded successfully",
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

      await fetchDocuments(); // Refresh the list to get updated status
      
      toast({
        title: "Success",
        description: response.message || "Document reprocessed successfully",
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
      <div className="flex justify-between items-center">
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

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
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
          ) : documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((document) => (
                <Card key={document.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{document.file_name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(document.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(document.id)}
                      >
                        Delete
                      </Button>
                    </div>
                    {document.processed_status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleRetryProcessing(document.id)}
                      >
                        Retry Processing
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">No documents yet</h3>
                  <p className="mt-2 text-gray-500">
                    Upload your medical documents to start managing them
                  </p>
                  <Button
                    onClick={() => setShowUpload(true)}
                    className="mt-4 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload your first document
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentsPage;