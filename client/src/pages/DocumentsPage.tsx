// Path: C:\Project\SMART_MED_2.0\client\src\pages\DocumentsPage.tsx

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Loader2, 
  AlertTriangle, 
  RefreshCcw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { FamilyMemberDocument } from '@/interfaces/documentTypes';
import { DocumentUploadDialog } from '@/components/medical/DocumentUploadDialog';
import DocumentList from '@/components/medical/DocumentList';
import DocumentFilters from '@/components/medical/DocumentFilters';
import DocumentPreview from '@/components/medical/DocumentPreview';
import ExtractedData from '@/components/medical/ExtractedData';
import { useAuth } from '@/contexts/AuthContext';
import { useDocuments } from '@/hooks/useDocuments';
import { useFamilyDocuments } from '@/hooks/useFamilyDocuments';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import type { ExtractedMedicine } from '@/interfaces/documentTypes';
import DocumentShareDialog from '@/components/medical/DocumentShareDialog';

interface ExtractedDataState {
  medicines: ExtractedMedicine[];
  rawText?: string;
}

const DocumentsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(
    user?.profileId || null
  );
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedDataState | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<FamilyMemberDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [documentToShare, setDocumentToShare] = useState<FamilyMemberDocument | null>(null);

  // Hooks
  const { data: familyMembers, isLoading: isFamilyLoading } = useFamilyMembers();
  const { 
    documents,
    isLoading,
    filters,
    setFilters,
    uploadDocument,
    deleteDocument,
    retryProcessing,
    updateAccess
  } = useDocuments(selectedProfileId);

  const {
    documents: familyDocuments,
    sharedDocuments,
    shareDocument
  } = useFamilyDocuments(selectedProfileId);

  // Handlers
  const handleUpload = async (file: File, profileId: number, documentType: string) => {
    try {
      setUploadProgress(0);
      const response = await uploadDocument({ 
        file, 
        documentType, 
        targetProfileId: profileId 
      });
      
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

  const handleDeleteDocument = async (documentId: number) => {
    try {
      await deleteDocument(documentId);
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Delete failed",
        variant: "destructive",
      });
    }
  };

  const handleRetryProcessing = async (documentId: number) => {
    try {
      const response = await retryProcessing(documentId);
      
      if (response.extractedData) {
        setExtractedData({
          medicines: response.extractedData.medicines,
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
        description: error.response?.data?.message || "Retry failed",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (document: FamilyMemberDocument) => {
    setDocumentToShare(document);
  };
  
  const handleShareSubmit = async (documentId: number, profileIds: number[]) => {
    try {
      await shareDocument(documentId, profileIds);
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
          familyMembers={familyMembers || []}
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
              setSelectedDocument(doc);
              setIsPreviewOpen(true);
            }}
            onShare={handleShare}
            showOwner={false}
          />
        </div>

        {/* Family Documents */}
        {familyDocuments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Family Documents</h2>
            <DocumentList
              documents={familyDocuments}
              isLoading={isLoading}
              onDelete={handleDeleteDocument}
              onRetryProcessing={handleRetryProcessing}
              onView={(doc) => {
                setSelectedDocument(doc);
                setIsPreviewOpen(true);
              }}
              onShare={handleShare}
            />
          </div>
        )}

        {/* Shared Documents */}
        {sharedDocuments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Shared With Me</h2>
            <DocumentList
              documents={sharedDocuments}
              isLoading={isLoading}
              onDelete={handleDeleteDocument}
              onRetryProcessing={handleRetryProcessing}
              onView={(doc) => {
                setSelectedDocument(doc);
                setIsPreviewOpen(true);
              }}
              onShare={handleShare}
            />
          </div>
        )}
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
        
      <DocumentPreview
        document={selectedDocument}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedDocument(null);
        }}
      />
    </div>
  );
};

export default DocumentsPage;