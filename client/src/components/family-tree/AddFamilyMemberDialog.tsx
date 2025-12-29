// C:\Project\SMART_MED_2.0\client\src\components\family-tree\AddFamilyMemberDialog.tsx

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProfileFormData, Gender } from "@/interfaces/profile";
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
  onRelationshipChange: (type: RelationshipType) => void;
}

export function AddFamilyMemberDialog({
  isOpen,
  onClose,
  onAdd,
  existingMembers,
  onRelationshipChange,
}: AddFamilyMemberDialogProps) {
  const { toast } = useToast();
  const [primaryParentId, setPrimaryParentId] = useState<string | undefined>(undefined);
  const [secondaryParentId, setSecondaryParentId] = useState<string | undefined>(undefined);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('son');
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "male",
  });

  const isChildRelation = relationshipType === 'son' || relationshipType === 'daughter';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.full_name.trim() || !formData.date_of_birth) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const profileData: ProfileFormData = {
        ...formData,
        is_parent: false,
        gender: formData.gender as Gender,
      };

      const relationshipData = primaryParentId ? {
        primaryParentId: parseInt(primaryParentId),
        secondaryParentId: secondaryParentId ? parseInt(secondaryParentId) : undefined,
        relationshipType: relationshipType
      } : undefined;

      await onAdd(profileData, relationshipData);
      
      // Reset form
      setFormData({
        full_name: "",
        date_of_birth: "",
        gender: "male",
      });
      setPrimaryParentId(undefined);
      setSecondaryParentId(undefined);
      
      onClose();
      
      toast({
        title: "Success",
        description: "Family member added successfully",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to add family member",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Add a new family member and define their relationship.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Relationship Section */}
          {existingMembers.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
                            <div>
                <Label htmlFor="relationship-type">Relationship Type</Label>
                <Select
                  value={relationshipType}
                  onValueChange={(value: RelationshipType) => {
                    setRelationshipType(value);
                    setSecondaryParentId(undefined);
                    // Automatically update the gender based on relationship type
                    if (value === 'wife') {
                      setFormData(prev => ({ ...prev, gender: 'female' }));
                    } else if (value === 'husband') {
                      setFormData(prev => ({ ...prev, gender: 'male' }));
                    }
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

          <div className="flex justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="mr-2"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit">Add Member</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}