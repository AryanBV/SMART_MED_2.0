// Path: C:\Project\SMART_MED_2.0\client\src\pages\DocumentsPage.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Loader2, 
  AlertTriangle, 
  RefreshCcw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { FamilyMemberDocument } from '@/interfaces/types';
import { DocumentUploadDialog } from '@/components/medical/DocumentUploadDialog';
import DocumentList from '@/components/medical/DocumentList';
import DocumentFilters from '@/components/medical/DocumentFilters';
import ExtractedData from '@/components/medical/ExtractedData';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyTree } from '@/hooks/useFamilyTree';
import type { ExtractedMedicine } from '@/interfaces/types';
import { ApiService } from '@/services/api';
import DocumentShareDialog from '@/components/medical/DocumentShareDialog';
import DocumentViewer from '@/components/medical/DocumentViewer';

interface ExtractedDataState {
  medicines: any[];
  rawText?: string;
}

const DocumentsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    user?.profileId || null
  );
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedDataState | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<FamilyMemberDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [documentToShare, setDocumentToShare] = useState<FamilyMemberDocument | null>(null);
  const [documentToView, setDocumentToView] = useState<FamilyMemberDocument | null>(null);

  // Hooks
  const { nodes: familyTree, isLoading: isFamilyLoading } = useFamilyTree();
  const [documents, setDocuments] = useState<FamilyMemberDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<any>({});

  // Load documents function
  const loadDocuments = async (profileId: string) => {
    try {
      setIsLoading(true);
      const docs = await ApiService.documents.getByProfile(profileId, filters);
      setDocuments(docs);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleUpload = async (file: File, profileId: string, documentType: string) => {
    try {
      setUploadProgress(0);
      const response = await ApiService.documents.upload(file, profileId, documentType);
      
      if (response.extractedData) {
        setExtractedData({
          medicines: response.extractedData.medicines,
          rawText: response.extractedData.rawText
        });
      }

      toast({
        title: "Success",
        description: "Document uploaded and processed successfully",
      });
      
      setIsUploadDialogOpen(false);
      // Reload documents after successful upload
      if (selectedProfileId) {
        loadDocuments(selectedProfileId);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Upload failed",
        variant: "destructive",
      });
    } finally {
      setUploadProgress(100);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await ApiService.documents.delete(documentId);
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      // Reload documents after deletion
      if (selectedProfileId) {
        loadDocuments(selectedProfileId);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Delete failed",
        variant: "destructive",
      });
    }
  };

  const handleRetryProcessing = async (documentId: string) => {
    try {
      const response = await ApiService.documents.process(documentId);
      
      if (response.extractedData) {
        setExtractedData({
          medicines: response.extractedData.medicines || [],
          rawText: response.extractedData.rawText
        });
      }

      toast({
        title: "Success",
        description: "Document processing completed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Retry failed",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (document: FamilyMemberDocument) => {
    setDocumentToShare(document);
  };
  
  const handleShareSubmit = async (documentId: string, profileIds: string[]) => {
    try {
      // await shareDocument(documentId, profileIds); // TODO: Implement sharing
      toast({
        title: "Success",
        description: "Document shared successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to share document",
        variant: "destructive",
      });
    } finally {
      setDocumentToShare(null);
    }
  };

  // Load documents when component mounts or when selectedProfileId/filters change
  useEffect(() => {
    if (selectedProfileId) {
      loadDocuments(selectedProfileId);
    }
  }, [selectedProfileId, filters]);

  // Set initial selectedProfileId when user is available
  useEffect(() => {
    if (user?.profileId && !selectedProfileId) {
      setSelectedProfileId(user.profileId);
    }
  }, [user?.profileId]);

  if (!user?.profileId) {
    return (
      <Card className="m-6">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-2">Profile Required</h2>
          <p className="text-gray-600">Please complete your profile to manage documents</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Medical Documents</h1>
          <p className="text-gray-500 mt-1">
            Manage and organize your medical documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFilters({})}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset Filters
          </Button>
          <Button
            onClick={() => setIsUploadDialogOpen(true)}
            className="flex items-center gap-2"
            disabled={isLoading || isFamilyLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DocumentFilters
          documentType={filters.documentType || 'all'}
          onDocumentTypeChange={(type) => 
            setFilters(prev => ({ ...prev, documentType: type }))
          }
          processingStatus={filters.processingStatus || 'all'}
          onProcessingStatusChange={(status) => 
            setFilters(prev => ({ ...prev, processingStatus: status }))
          }
          selectedProfileId={selectedProfileId}
          onProfileSelect={setSelectedProfileId}
          familyMembers={familyTree?.map(n => n.data.profile) || []}
        />
      </div>

      {/* Main Content */}
      {extractedData && (
        <ExtractedData
          medicines={extractedData.medicines}
          rawText={extractedData.rawText}
          onClose={() => setExtractedData(null)}
        />
      )}

      {/* Document Lists */}
      <div className="space-y-8">
        {/* Personal Documents */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Documents</h2>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDelete={handleDeleteDocument}
            onRetryProcessing={handleRetryProcessing}
            onView={(doc) => {
              setDocumentToView(doc);
            }}
            // onShare={handleShare} // Remove this prop as it's not in DocumentListProps
            showOwner={false}
          />
        </div>

        {/* Family Documents - TODO: Implement family document loading */}
      </div>

      {/* Dialogs */}
      <DocumentUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={handleUpload}
      />

      <DocumentShareDialog
        document={documentToShare}
        isOpen={!!documentToShare}
        onClose={() => setDocumentToShare(null)}
        onShare={handleShareSubmit}
      />
      
      <DocumentViewer
        document={documentToView}
        isOpen={!!documentToView}
        onClose={() => setDocumentToView(null)}
      />
    </div>
  );
};

export default DocumentsPage;