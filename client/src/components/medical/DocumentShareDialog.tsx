// Path: C:\Project\SMART_MED_2.0\client\src\components\medical\DocumentShareDialog.tsx

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfile } from '@/hooks/useProfile';
import { FamilyMemberDocument } from '@/interfaces/types';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Share2, AlertTriangle } from 'lucide-react';

interface DocumentShareDialogProps {
  document: FamilyMemberDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onShare: (documentId: number, profileIds: number[]) => Promise<void>;
}

const DocumentShareDialog = ({
  document,
  isOpen,
  onClose,
  onShare
}: DocumentShareDialogProps) => {
  const { profile, loading } = useProfile();
  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  if (!document) return null;

  const handleShare = async () => {
    try {
      setIsSharing(true);
      await onShare(document.id, selectedProfiles);
      onClose();
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const toggleProfile = (profileId: number) => {
    setSelectedProfiles(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Document
          </DialogTitle>
          <DialogDescription>
            Share "{document.file_name}" with family members
          </DialogDescription>
        </DialogHeader>

        {/* Document Info */}
        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{document.file_name}</span>
            <Badge variant={document.document_type as any}>
              {document.document_type.replace('_', ' ')}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Uploaded on {new Date(document.created_at!).toLocaleDateString()}
          </div>
        </div>

        {/* Family Members List */}
        {loading ? (
          <div className="text-center py-4">Loading family members...</div>
        ) : profile ? (
          <ScrollArea className="h-[200px] rounded-md border p-4">
            <div className="space-y-4">
              {[profile]
                .filter(p => p.id !== document.profile_id.toString())
                .map((familyProfile: any) => (
                  <div key={familyProfile.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`profile-${familyProfile.id}`}
                      checked={selectedProfiles.includes(parseInt(familyProfile.id))}
                      onCheckedChange={() => toggleProfile(parseInt(familyProfile.id))}
                    />
                    <Label
                      htmlFor={`profile-${familyProfile.id}`}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      {familyProfile.full_name}
                      {familyProfile.relationship && (
                        <Badge variant="outline" className="text-xs">
                          {familyProfile.relationship}
                        </Badge>
                      )}
                    </Label>
                  </div>
                ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-4 space-y-2">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto" />
            <p className="text-sm text-muted-foreground">
              No family members available to share with
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSharing}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing || !selectedProfiles.length}
          >
            {isSharing ? 'Sharing...' : 'Share Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentShareDialog;