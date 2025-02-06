// Path: C:\Project\SMART_MED_2.0\client\src\components\medical\DocumentUpload.tsx

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile } from '@/hooks/useProfile';
import type { DocumentType } from '@/interfaces/documentTypes';

interface DocumentUploadProps {
  onUploadComplete: (file: File, documentType: string, profileId: number) => Promise<void>;
  onProgress: (progress: number) => void;
  uploadProgress: number;
  selectedProfileId?: number;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadComplete,
  onProgress,
  uploadProgress,
  selectedProfileId
}) => {
  const { toast } = useToast();
  const { profiles } = useProfile();
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('other');
  const [uploadProfileId, setUploadProfileId] = useState<number | undefined>(selectedProfileId);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      if (acceptedFiles[0].size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size should not exceed 10MB",
          variant: "destructive",
        });
        return;
      }
      setFile(acceptedFiles[0]);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  });

  const handleUpload = async () => {
    if (!file || !uploadProfileId) {
      toast({
        title: "Error",
        description: "Please select both a file and a family member",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      await onUploadComplete(file, documentType, uploadProfileId);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setFile(null);
      setDocumentType('other');
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Profile Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Family Member
            </label>
            <Select
              value={uploadProfileId?.toString()}
              onValueChange={(value) => setUploadProfileId(Number(value))}
              disabled={isProcessing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select family member" />
              </SelectTrigger>
              <SelectContent>
                {profiles?.map((profile) => (
                  <SelectItem 
                    key={profile.id} 
                    value={profile.id.toString()}
                  >
                    {profile.full_name}
                    {profile.relationship && ` (${profile.relationship})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Document Type
            </label>
            <Select
              value={documentType}
              onValueChange={(value) => setDocumentType(value as DocumentType)}
              disabled={isProcessing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prescription">Prescription</SelectItem>
                <SelectItem value="lab_report">Lab Report</SelectItem>
                <SelectItem value="discharge_summary">Discharge Summary</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
              ${file ? 'bg-gray-50' : ''}`}
          >
            <input {...getInputProps()} disabled={isProcessing} />
            
            {file ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-gray-400" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                {!isProcessing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 text-sm font-medium">
                  Drag & drop your document here, or click to select
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Supports PDF, JPEG, and PNG (max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-center text-gray-500">
                {uploadProgress < 100 
                  ? `Uploading: ${uploadProgress}%`
                  : 'Processing document...'}
              </p>
            </div>
          )}

          {/* Upload Button */}
          {file && !isProcessing && (
            <Button
              className="w-full flex items-center justify-center gap-2"
              onClick={handleUpload}
              disabled={isProcessing || !uploadProfileId}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Document
                </>
              )}
            </Button>
          )}

          {/* Information Alert */}
          <Alert>
            <AlertDescription className="text-xs text-gray-500">
              Your document will be processed to extract medical information. 
              This may take a few moments.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;