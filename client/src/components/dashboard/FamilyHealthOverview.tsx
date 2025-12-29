// Path: C:\Project\SMART_MED_2.0\client\src\components\dashboard\FamilyHealthOverview.tsx

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HealthCard } from './HealthCard';
import ExtractedData from '@/components/medical/ExtractedData';
import type { FamilyMemberHealth } from '@/interfaces/dashboard';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FamilyHealthOverviewProps {
  members: FamilyMemberHealth[];
  onMemberSelect?: (member: FamilyMemberHealth) => void;
}

export const FamilyHealthOverview: React.FC<FamilyHealthOverviewProps> = ({ 
  members,
  onMemberSelect 
}) => {
  const [selectedMember, setSelectedMember] = useState<FamilyMemberHealth | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleMemberClick = (member: FamilyMemberHealth) => {
    setSelectedMember(member);
    setShowDetails(true);
    onMemberSelect?.(member);
  };

  const handleCloseDialog = () => {
    setShowDetails(false);
    setSelectedMember(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Family Health Overview</h2>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
          {members.map((member) => (
            <HealthCard 
              key={member.id} 
              member={member}
              onClick={() => handleMemberClick(member)}
            />
          ))}
          {members.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-500">
              No family members found
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={showDetails} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl">
              {selectedMember?.name}'s Health Details
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={handleCloseDialog}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {selectedMember && (
            <ExtractedData
            medicines={selectedMember.medications || []}
            rawText={selectedMember.lastDocument?.extractedText}
            showRawText={false}
            processingStatus="completed"
          />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyHealthOverview;