// Document viewer component for displaying PDF and image documents
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import type { FamilyMemberDocument } from '@/interfaces/types';

interface DocumentViewerProps {
  document: FamilyMemberDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  isOpen,
  onClose
}) => {
  if (!document) return null;

  const getDocumentUrl = () => {
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}/api/documents/${document.id}/view${token ? `?token=${token}` : ''}`;
  };

  const handleDownload = () => {
    const downloadUrl = getDocumentUrl().replace('/view', '/download');
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = document.file_name || document.fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(getDocumentUrl(), '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {document.file_name || document.fileName || 'Document'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 p-6">
          <div className="w-full h-[70vh] border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <ExternalLink className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">View Document</h3>
                <p className="text-gray-600 mb-4">
                  Click the button below to view the document in a new tab
                </p>
                <Button
                  onClick={handleOpenInNewTab}
                  className="flex items-center gap-2 mx-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Document
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Document metadata */}
        <div className="px-6 pb-6 border-t pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Type:</span>
              <p className="capitalize">{document.document_type || document.documentType || 'Unknown'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Size:</span>
              <p>{document.file_size || document.fileSize ? `${((document.file_size || document.fileSize) / 1024).toFixed(1)} KB` : 'Unknown'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Uploaded:</span>
              <p>{new Date(document.created_at || document.uploadDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Status:</span>
              <p className="capitalize">{document.processed_status || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;