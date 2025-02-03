// Path: /client/src/components/medical/DocumentList.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, ExternalLink, FileLock } from 'lucide-react';
import { FamilyMemberDocument } from '@/interfaces/documentTypes';
import { Badge } from '@/components/ui/badge';

interface DocumentListProps {
  documents: FamilyMemberDocument[];
  isLoading: boolean;
  onDelete: (documentId: number) => Promise<void>;
  onRetryProcessing: (documentId: number) => Promise<void>;
  onView?: (document: FamilyMemberDocument) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  onDelete,
  onRetryProcessing,
  onView
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No documents found</h3>
            <p className="mt-2 text-gray-500">
              Upload medical documents to start managing them
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((document) => (
        <Card key={document.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Document Name and Access Level */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium truncate flex items-center gap-2">
                      {document.file_name}
                      {document.access_level === 'read' && (
                        <FileLock className="w-4 h-4 text-gray-400" />
                      )}
                    </h3>
                  </div>
                </div>

                {/* Document Type and Processing Status */}
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant={document.document_type === 'other' ? 'default' : document.document_type}>
                    {document.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  <Badge variant={document.processed_status}>
                    {document.processed_status.replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>

                {/* Document Info */}
                <div className="space-y-1 mb-3">
                  <p className="text-sm text-gray-500">
                    {new Date(document.created_at!).toLocaleDateString()} at{' '}
                    {new Date(document.created_at!).toLocaleTimeString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={document.access_level}>
                      {document.access_level.charAt(0).toUpperCase() + document.access_level.slice(1)} Access
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    Owner: {document.owner_name}
                    {document.relationship && ` (${document.relationship})`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {onView && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => onView(document)}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View
                    </Button>
                  )}
                  
                  {document.access_level !== 'read' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(document.id)}
                    >
                      Delete
                    </Button>
                  )}
                  
                  {document.processed_status === 'failed' && 
                   document.access_level !== 'read' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRetryProcessing(document.id)}
                    >
                      Retry Processing
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DocumentList;