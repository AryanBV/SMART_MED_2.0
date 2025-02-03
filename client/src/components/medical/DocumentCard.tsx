// Path: /client/src/components/medical/DocumentCard.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Eye, Download, Trash2, RefreshCw, Clock } from 'lucide-react';
import type { FamilyMemberDocument } from '@/interfaces/documentTypes';

interface DocumentCardProps {
  document: FamilyMemberDocument;
  onDelete: (id: number) => Promise<void>;
  onRetryProcessing: (id: number) => Promise<void>;
  onView: (document: FamilyMemberDocument) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onDelete,
  onRetryProcessing,
  onView
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
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

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            {getDocumentTypeIcon()}
            <div>
              <h3 className="font-medium truncate max-w-[200px]">
                {document.file_name}
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
              {new Date(document.created_at!).toLocaleDateString()}
            </span>
          </div>
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
              onClick={() => onView(document)}
            >
              <Eye className="w-4 h-4" />
              View
            </Button>

          {document.access_level !== 'read' && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-red-600 hover:text-red-700"
              onClick={() => onDelete(document.id)}
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
              onClick={() => onRetryProcessing(document.id)}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
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
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentCard;