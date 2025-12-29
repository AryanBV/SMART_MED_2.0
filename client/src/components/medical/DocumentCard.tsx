// Path: C:\Project\SMART_MED_2.0\client\src\components\medical\DocumentCard.tsx

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMedicationUpdates } from '@/hooks/useMedicationUpdates';
import { useToast } from '@/components/ui/use-toast';
import DocumentViewer from './DocumentViewer';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import {
  AlertTriangle,
  FileText,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  User,
  Lock,
  Share2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FamilyMemberDocument } from '@/interfaces/documentTypes';

interface DocumentCardProps {
  document: FamilyMemberDocument;
  onDelete: (id: number) => Promise<void>;
  onRetryProcessing: (id: number) => Promise<void>;
  onView: (document: FamilyMemberDocument) => void;
  onShare?: (document: FamilyMemberDocument) => void;
  showOwner?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onDelete,
  onRetryProcessing,
  onView,
  onShare,
  showOwner = true
}) => {
  const { toast } = useToast();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const { updateMedications, isUpdating } = useMedicationUpdates(document.profile_id);
  const { processedData, isProcessing, processDocument } = useDocumentProcessing(document.id);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getDocumentTypeIcon = () => {
    switch (document.document_type) {
      case 'prescription':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'lab_report':
        return <FileText className="w-5 h-5 text-indigo-500" />;
      case 'discharge_summary':
        return <FileText className="w-5 h-5 text-teal-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleProcessing = async () => {
    try {
      if (document.document_type === 'prescription') {
        await updateMedications(document.id);
      }
      await processDocument();
      await onRetryProcessing(document.id);
      toast({
        title: "Success",
        description: "Document processed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process document",
        variant: "destructive"
      });
    }
  };

  const handleView = () => {
    setIsViewerOpen(true);
    onView(document);
  };

  const handleDelete = async () => {
    try {
      await onDelete(document.id);
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    {getDocumentTypeIcon()}
                  </TooltipTrigger>
                  <TooltipContent>
                    {document.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div>
                <h3 className="font-medium truncate max-w-[200px] flex items-center gap-2">
                  {document.file_name}
                  {document.access_level === 'read' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Lock className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>Read-only access</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </h3>
                <p className="text-xs text-gray-500">
                  {formatFileSize(document.file_size)}
                </p>
              </div>
            </div>
            <Badge variant={document.document_type === 'other' ? 'default' : document.document_type}>
              {document.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>

          {/* Status and Info */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {formatDate(document.created_at!)}
              </span>
            </div>

            {showOwner && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {document.owner_name}
                  {document.relationship && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {document.relationship}
                    </Badge>
                  )}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge variant={document.access_level}>
                {document.access_level.charAt(0).toUpperCase() + document.access_level.slice(1)} Access
              </Badge>
              <Badge variant={document.processed_status}>
                {document.processed_status.charAt(0).toUpperCase() + document.processed_status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Processing Warning */}
          {document.processed_status === 'failed' && (
            <div className="mb-3 p-2 bg-red-50 rounded-md flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">Processing failed</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleView}
            >
              <Eye className="w-4 h-4" />
              View
            </Button>

            {document.access_level !== 'read' && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}

            {document.processed_status === 'failed' && document.access_level !== 'read' && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={handleProcessing}
                disabled={isUpdating || isProcessing}
              >
                <RefreshCw className={`w-4 h-4 ${(isUpdating || isProcessing) ? 'animate-spin' : ''}`} />
                {isUpdating || isProcessing ? 'Processing...' : 'Retry'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => window.open(`/api/documents/${document.id}/download`, '_blank')}
            >
              <Download className="w-4 h-4" />
              Download
            </Button>

            {onShare && document.access_level !== 'read' && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => onShare(document)}
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <DocumentViewer
        document={document}
        processedData={processedData}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onRetryProcessing={handleProcessing}
        isProcessing={isProcessing || isUpdating}
      />
    </>
  );
};

export default DocumentCard;