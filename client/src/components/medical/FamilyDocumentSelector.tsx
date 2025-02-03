import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';

interface FamilyDocumentSelectorProps {
  selectedProfileId: number | null;
  onProfileSelect: (profileId: number) => void;
}

const FamilyDocumentSelector: React.FC<FamilyDocumentSelectorProps> = ({
  selectedProfileId,
  onProfileSelect
}) => {
  const { profiles, isLoading } = useProfile();

  if (isLoading || !profiles?.length) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Family Member
        </label>
        <Select
          value={selectedProfileId?.toString()}
          onValueChange={(value) => onProfileSelect(parseInt(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select family member" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id.toString()}>
                {profile.full_name} 
                {profile.relationship && ` (${profile.relationship})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default FamilyDocumentSelector;