// Path: C:\Project\SMART_MED_2.0\client\src\components\medical\DocumentList.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Loader2, 
  ExternalLink, 
  FileLock, 
  User,
  Calendar,
  Info,
  Trash2,
  Share2,
  CheckSquare,
  Square 
} from 'lucide-react';
import type { FamilyMemberDocument } from '@/interfaces/documentTypes';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

interface DocumentListProps {
  documents: FamilyMemberDocument[];
  isLoading: boolean;
  onDelete: (documentId: number) => Promise<void>;
  onRetryProcessing: (documentId: number) => Promise<void>;
  onView?: (document: FamilyMemberDocument) => void;
  showOwner?: boolean;
  onBulkDelete?: (documentIds: number[]) => Promise<void>;
  onBulkShare?: (documentIds: number[]) => Promise<void>;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  onDelete,
  onRetryProcessing,
  onView,
  showOwner = true,
  onBulkDelete,
  onBulkShare
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map(doc => doc.id));
    }
  };

  const toggleDocumentSelection = (documentId: number) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  // Memoize grouped documents to prevent unnecessary recalculations
  const groupedDocuments = useMemo(() => {
    return documents.reduce((groups, document) => {
      const date = new Date(document.created_at!).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(document);
      return groups;
    }, {} as Record<string, FamilyMemberDocument[]>);
  }, [documents]);

  // Sort dates in descending order
  const sortedDates = useMemo(() => {
    return Object.keys(groupedDocuments).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [groupedDocuments]);

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

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'prescription':
        return 'default';
      case 'lab_report':
        return 'secondary';
      case 'discharge_summary':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Actions */}
      {documents.length > 0 && (onBulkDelete || onBulkShare) && (
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center gap-2"
            >
              {selectedDocuments.length === documents.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedDocuments.length > 0 
                ? `Selected ${selectedDocuments.length} of ${documents.length}`
                : "Select All"
              }
            </Button>
          </div>
          {selectedDocuments.length > 0 && (
            <div className="flex gap-2">
              {onBulkShare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkShare(selectedDocuments)}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Selected
                </Button>
              )}
              {onBulkDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onBulkDelete(selectedDocuments)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {sortedDates.map((date) => (
        <div key={`date-group-${date}`} className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">{date}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedDocuments[date].map((document) => (
              <Card 
                key={`doc-${document.id}-${document.file_name}`} 
                className="hover:shadow-md transition-shadow relative"
              >
                {/* Selection Checkbox */}
                {(onBulkDelete || onBulkShare) && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedDocuments.includes(document.id)}
                      onCheckedChange={() => toggleDocumentSelection(document.id)}
                    />
                  </div>
                )}

                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Document Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium truncate flex items-center gap-2">
                          {document.file_name}
                          {document.access_level === 'read' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <FileLock className="w-4 h-4 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>Read-only access</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </h3>
                      </div>
                    </div>

                    {/* Document Type and Status */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getBadgeVariant(document.document_type)}>
                        {document.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(document.processed_status)}>
                        {document.processed_status.replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>

                    {/* Document Info */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(document.created_at!)}
                      </p>
                      {showOwner && document.owner_name && (
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {document.owner_name}
                          {document.relationship && (
                            <Badge variant="outline" className="text-xs">
                              {document.relationship}
                            </Badge>
                          )}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant={document.access_level}>
                          {document.access_level.charAt(0).toUpperCase() + document.access_level.slice(1)} Access
                        </Badge>
                      </div>
                    </div>

                    {/* Document Actions */}
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
                          className="text-red-600 hover:text-red-700"
                          onClick={() => onDelete(document.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
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
                          <Loader2 className="w-4 h-4 mr-1" />
                          Retry Processing
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentList;