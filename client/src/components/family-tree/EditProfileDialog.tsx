// src/components/family-tree/EditProfileDialog.tsx
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { ProfileForm } from "@/components/profile/ProfileForm";
  import { FamilyMember } from "@/interfaces/family";
  import { ProfileFormData } from "@/interfaces/profile";
  import { useToast } from "@/components/ui/use-toast";
  
  interface EditProfileDialogProps {
    profile: FamilyMember | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (profileId: number, data: ProfileFormData) => Promise<void>;
  }
  
  export function EditProfileDialog({
    profile,
    isOpen,
    onClose,
    onSave,
  }: EditProfileDialogProps) {
    const { toast } = useToast();
  
    if (!profile) return null;
  
    const handleSubmit = async (data: ProfileFormData) => {
      try {
        await onSave(profile.id!, data);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        onClose();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
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
              is_parent: profile.is_parent,
            }}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    );
  }