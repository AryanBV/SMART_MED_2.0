// File: client/src/components/dashboard/DocumentUpload.tsx

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDashboardData } from '@/hooks/useDashboardData';
import { FileText, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const DocumentUpload = () => {
  const { toast } = useToast();
  const { processDocument } = useDashboardData();
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setIsUploading(true);
      for (const file of acceptedFiles) {
        await processDocument(file);
      }
      toast({
        title: 'Success',
        description: 'Documents uploaded and processed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process documents',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [processDocument, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10485760, // 10MB
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        <Upload className="w-12 h-12 mx-auto text-gray-400" />
        {isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <>
            <p className="text-lg">Drag & drop medical documents here</p>
            <p className="text-sm text-gray-500">
              or click to select files (PDF, JPG, PNG)
            </p>
          </>
        )}
        {isUploading && (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
};