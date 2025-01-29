import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileFormData } from "@/interfaces/profile";
import { FamilyMember } from "@/interfaces/family";
import { useToast } from "@/components/ui/use-toast";
import { RelationshipType } from "@/interfaces/family";

interface RelationshipData {
  primaryParentId: number;
  secondaryParentId?: number;
  relationshipType: RelationshipType;
}


interface AddFamilyMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (profile: ProfileFormData, relationshipData?: RelationshipData) => Promise<void>;
  existingMembers: FamilyMember[];
  relationship?: RelationshipType;
  onRelationshipChange: (type: RelationshipType) => void;
}

export function AddFamilyMemberDialog({
  isOpen,
  onClose,
  onAdd,
  existingMembers,
  onRelationshipChange,
}: AddFamilyMemberDialogProps) {
  const [primaryParentId, setPrimaryParentId] = useState<string | undefined>(undefined);
  const [secondaryParentId, setSecondaryParentId] = useState<string | undefined>(undefined);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('son');

  const isChildRelation = relationshipType === 'son' || relationshipType === 'daughter';
  const isSpouseRelation = relationshipType === 'wife' || relationshipType === 'husband';

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      if (!primaryParentId) {
        // If no parent selected, just add the member
        await onAdd(data);
      } else {
        // Create relationship data object
        const relationshipData = {
          primaryParentId: parseInt(primaryParentId),
          secondaryParentId: secondaryParentId ? parseInt(secondaryParentId) : undefined,
          relationshipType: relationshipType
        };
  
        console.log('Submitting with relationship data:', relationshipData);
        await onAdd(data, relationshipData);
      }
      onClose();
    } catch (error) {
      console.error('Error:', error);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Create a new family member profile and optionally link them to a parent.
          </DialogDescription>
        </DialogHeader>
        
        {existingMembers.length > 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="relationship-type">Relationship Type</Label>
              <Select
                value={relationshipType}
                onValueChange={(value: RelationshipType) => {
                  setRelationshipType(value);
                  setSecondaryParentId(undefined);
                  onRelationshipChange(value);
                }}
              >
                <SelectTrigger id="relationship-type">
                  <SelectValue placeholder="Choose relationship type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="son">Son</SelectItem>
                  <SelectItem value="daughter">Daughter</SelectItem>
                  <SelectItem value="wife">Wife</SelectItem>
                  <SelectItem value="husband">Husband</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="primary-parent">
                {isChildRelation ? "First Parent" : "Related To"}
              </Label>
              <Select
                value={primaryParentId}
                onValueChange={setPrimaryParentId}
              >
                <SelectTrigger id="primary-parent">
                  <SelectValue placeholder={isChildRelation ? "Select first parent" : "Select member"} />
                </SelectTrigger>
                <SelectContent>
                  {existingMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id?.toString() ?? ""}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isChildRelation && primaryParentId && (
              <div>
                <Label htmlFor="secondary-parent">Second Parent (Optional)</Label>
                <Select
                  value={secondaryParentId}
                  onValueChange={setSecondaryParentId}
                >
                  <SelectTrigger id="secondary-parent">
                    <SelectValue placeholder="Select second parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingMembers
                      .filter(member => member.id?.toString() !== primaryParentId)
                      .map((member) => (
                        <SelectItem key={member.id} value={member.id?.toString() ?? ""}>
                          {member.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <ProfileForm
          onSubmit={handleSubmit}
          initialData={{
            full_name: "",
            date_of_birth: "",
            gender: "male",
            is_parent: false,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}