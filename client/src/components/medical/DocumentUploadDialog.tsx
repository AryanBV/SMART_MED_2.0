// Path: C:\Project\SMART_MED_2.0\client\src\components\medical\DocumentUploadDialog.tsx

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DocumentProcessingStatus from './DocumentProcessingStatus';

interface DocumentUploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File, profileId: number, documentType: string) => Promise<void>;
}

interface FamilyMember {
    id: number;
    full_name: string;
    relationship?: string;
}

const documentTypes = [
    { value: 'prescription', label: 'Prescription' },
    { value: 'lab_report', label: 'Lab Report' },
    { value: 'discharge_summary', label: 'Discharge Summary' },
    { value: 'other', label: 'Other' }
];

export const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
    isOpen,
    onClose,
    onUpload
}) => {
    const { toast } = useToast();
    const [selectedMember, setSelectedMember] = useState<string>('');
    const [documentType, setDocumentType] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const { data: familyMembers, isLoading, error } = useFamilyMembers();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        },
        maxSize: 10485760, // 10MB
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setFile(acceptedFiles[0]);
                setUploadStatus('idle');
            }
        },
        onDropRejected: (rejectedFiles) => {
            const error = rejectedFiles[0]?.errors[0];
            toast({
                title: "File Error",
                description: error?.message || "Invalid file",
                variant: "destructive",
            });
        }
    });

    const handleUpload = async () => {
        if (!file || !selectedMember || !documentType) {
            toast({
                title: "Validation Error",
                description: "Please select a family member, document type, and file",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsUploading(true);
            setUploadStatus('uploading');
            setUploadProgress(0);

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            // Convert selectedMember to number and verify it's valid
            const profileId = parseInt(selectedMember);
            if (isNaN(profileId)) {
                throw new Error("Invalid family member selected");
            }

            await onUpload(file, profileId, documentType);
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            setUploadStatus('completed');

            toast({
                title: "Success",
                description: "Document uploaded successfully",
            });

            // Reset form after successful upload
            setTimeout(() => {
                onClose();
                setFile(null);
                setSelectedMember('');
                setDocumentType('');
                setUploadStatus('idle');
                setUploadProgress(0);
            }, 1000);

        } catch (error: any) {
            setUploadStatus('failed');
            console.error('Upload failed:', error);
            toast({
                title: "Upload Failed",
                description: error.message || "Failed to upload document",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        if (!isUploading) {
            onClose();
            setFile(null);
            setSelectedMember('');
            setDocumentType('');
            setUploadStatus('idle');
            setUploadProgress(0);
        }
    };

    if (error) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent>
                    <Alert variant="destructive">
                        <AlertDescription>
                            Failed to load family members. Please try again later.
                        </AlertDescription>
                    </Alert>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Family Member Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Family Member</label>
                        <Select 
                            value={selectedMember} 
                            onValueChange={setSelectedMember}
                            disabled={isLoading || isUploading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select family member" />
                            </SelectTrigger>
                            <SelectContent>
                                {familyMembers?.map((member: FamilyMember) => (
                                    <SelectItem key={member.id} value={member.id.toString()}>
                                        {member.full_name}
                                        {member.relationship && ` (${member.relationship})`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Document Type Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Document Type</label>
                        <Select 
                            value={documentType} 
                            onValueChange={setDocumentType}
                            disabled={isUploading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent>
                                {documentTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* File Upload Area */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
                            ${file ? 'bg-gray-50' : ''}
                            ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
                    >
                        <input {...getInputProps()} disabled={isUploading} />
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        {file ? (
                            <p className="text-sm text-gray-600">{file.name}</p>
                        ) : (
                            <div>
                                <p className="text-sm text-gray-600">
                                    Drag & drop your document here, or click to select
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Supports PDF, JPEG, and PNG (max 10MB)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Upload Status */}
                    {uploadStatus !== 'idle' && (
                        <DocumentProcessingStatus
                            status={uploadStatus}
                            progress={uploadProgress}
                            error={uploadStatus === 'failed' ? "Upload failed. Please try again." : undefined}
                        />
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                        <Button 
                            variant="outline" 
                            onClick={handleClose}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!file || !selectedMember || !documentType || isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                'Upload'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentUploadDialog;