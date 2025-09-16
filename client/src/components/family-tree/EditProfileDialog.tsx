// src/components/family-tree/EditProfileDialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { FamilyMember } from "@/interfaces/family";
import { useToast } from "@/components/ui/use-toast";

interface EditProfileDialogProps {
  profile: FamilyMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profileId: number, data: { full_name: string; date_of_birth: string; gender: 'male' | 'female' | 'other' }) => Promise<void>;
}

export function EditProfileDialog({
  profile,
  isOpen,
  onClose,
  onSave,
}: EditProfileDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!profile) return null;

  const handleSubmit = async (data: { full_name: string; date_of_birth: string; gender: 'male' | 'female' | 'other' }) => {
    try {
      setIsLoading(true);
      await onSave(profile.id!, data);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <ProfileForm
          initialData={{
            full_name: profile.full_name,
            date_of_birth: profile.date_of_birth,
            gender: profile.gender,
          }}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}