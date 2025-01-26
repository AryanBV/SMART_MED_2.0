// File: src/pages/DocumentsPage.tsx
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Upload } from 'lucide-react';

const DocumentsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Medical Documents</h1>
        <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Empty state */}
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No documents yet</h3>
            <p className="mt-2 text-gray-500">
              Upload your medical documents to start managing them
            </p>
            <button className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload your first document
            </button>
          </div>

          {/* Document list will go here */}
          <div className="hidden">
            {/* We'll implement this later */}
            <p>Document list will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsPage;