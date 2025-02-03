// Path: /client/src/components/medical/DocumentFilters.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';

interface DocumentFiltersProps {
  documentType: string;
  onDocumentTypeChange: (type: string) => void;
  processingStatus?: string;
  onProcessingStatusChange?: (status: string) => void;
}

const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  documentType,
  onDocumentTypeChange,
  processingStatus,
  onProcessingStatusChange
}) => {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Document Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Document Type
          </label>
          <Select
            value={documentType}
            onValueChange={onDocumentTypeChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <span>All Documents</span>
                  <Badge variant="secondary">All</Badge>
                </div>
              </SelectItem>
              <SelectItem value="prescription">
                <div className="flex items-center gap-2">
                  <span>Prescriptions</span>
                  <Badge variant="prescription">Rx</Badge>
                </div>
              </SelectItem>
              <SelectItem value="lab_report">
                <div className="flex items-center gap-2">
                  <span>Lab Reports</span>
                  <Badge variant="lab_report">Lab</Badge>
                </div>
              </SelectItem>
              <SelectItem value="discharge_summary">
                <div className="flex items-center gap-2">
                  <span>Discharge Summaries</span>
                  <Badge variant="discharge_summary">DC</Badge>
                </div>
              </SelectItem>
              <SelectItem value="other">
                <div className="flex items-center gap-2">
                  <span>Other Documents</span>
                  <Badge variant="outline">Other</Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Processing Status Filter */}
        {onProcessingStatusChange && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Processing Status
            </label>
            <Select
              value={processingStatus}
              onValueChange={onProcessingStatusChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <span>All Status</span>
                    <Badge variant="secondary">All</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <span>Pending</span>
                    <Badge variant="pending">Pending</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="processing">
                  <div className="flex items-center gap-2">
                    <span>Processing</span>
                    <Badge variant="processing">Processing</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <span>Completed</span>
                    <Badge variant="completed">Complete</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="failed">
                  <div className="flex items-center gap-2">
                    <span>Failed</span>
                    <Badge variant="failed">Failed</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Current Filters Display */}
        <div className="flex flex-wrap gap-2 pt-2">
          {documentType !== 'all' && (
            <Badge 
              variant={documentType as any} 
              className="flex items-center gap-1"
            >
              Type: {documentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          )}
          {processingStatus && processingStatus !== 'all' && (
            <Badge 
              variant={processingStatus as any}
              className="flex items-center gap-1"
            >
              Status: {processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentFilters;