// src/pages/FamilyTreePage.tsx
import { useState, useCallback } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap, Panel,
  Connection, useReactFlow, ConnectionMode,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import TreeNode from '@/components/family-tree/TreeNode';
import { AddFamilyMemberDialog } from '@/components/family-tree/AddFamilyMemberDialog';
import { EditProfileDialog } from '@/components/family-tree/EditProfileDialog';
import { FamilyMemberDetails } from '@/components/family-tree/FamilyMemberDetails';
import { CustomConnectionLine } from '@/components/family-tree/CustomConnectionLine';
import { ValidationMessage } from '@/components/family-tree/ValidationMessage';
import { useFamilyTree } from '@/hooks/useFamilyTree';
import { ProfileFormData } from '@/interfaces/profile';
import { validateRelationship } from '@/utils/relationshipValidator';
import { FamilyMember } from '@/interfaces/family';
import { useToast } from '@/components/ui/use-toast';
import { RelationshipType } from '@/interfaces/family';
const nodeTypes = { familyMember: TreeNode };

const FamilyTreeContent = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<FamilyMember | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [addRelativeParentId, setAddRelativeParentId] = useState<number | null>(null);
  const [validationMessage, setValidationMessage] = useState<{ isValid: boolean; message: string } | null>(null);
  
  const { getNodes, getEdges } = useReactFlow();
  const {
    nodes, edges, isLoading, onNodesChange, onEdgesChange,
    onConnect, addFamilyMember, updateFamilyMember,
    removeFamilyMember, updateLayout, getFamilyRelations,
  } = useFamilyTree();
  
  const handleEdit = useCallback((profile: FamilyMember) => {
    setSelectedProfile(profile);
    setIsEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((profile: FamilyMember) => {
    setSelectedProfile(profile);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleAddRelative = useCallback((profile: FamilyMember) => {
    setAddRelativeParentId(profile.id || null);
    setIsAddDialogOpen(true);
  }, []);

  const handleSelectMember = useCallback((profile: FamilyMember) => {
    setSelectedProfile(profile);
  }, []);

  const handleAddFamilyMember = async (
    data: ProfileFormData,
    relationshipData?: RelationshipType
  ) => {
    try {
      console.log('Adding family member:', {
        data,
        relationshipData
      });

      if (!relationshipData) {
        await addFamilyMember(data);
      } else {
        await addFamilyMember(data, {
          primaryParentId: relationshipData.primaryParentId,
          secondaryParentId: relationshipData.secondaryParentId,
          relationshipType: relationshipData.relationshipType
        });
      }

      setIsAddDialogOpen(false);
      setAddRelativeParentId(null);
      
      toast({
        title: 'Success',
        description: 'Family member added successfully',
      });
    } catch (error) {
      console.error('Error adding family member:', error);
      toast({
        title: 'Error',
        description: 'Failed to add family member. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isValidConnection = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return false;
    const validation = validateRelationship(
      connection.source, connection.target, getNodes(), getEdges()
    );
    setValidationMessage(validation);
    return validation.isValid;
  }, [getNodes, getEdges]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading family tree...</div>
      </div>
    );
  }

  const processedNodes = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      profile: {
        ...((node.data as any).profile),
        date_of_birth: (node.data as any).profile.date_of_birth || null
      },
      isSelected: selectedProfile?.id === parseInt(node.id),
      onEdit: handleEdit,
      onDelete: handleDelete,
      onAddRelative: handleAddRelative,
      onSelect: handleSelectMember,
    },
  }));

  return (
    <div className="space-y-6 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Family Tree</h1>
        <div className="space-x-4">
          <Button onClick={updateLayout} variant="outline">Reset Layout</Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>Add Family Member</Button>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        <Card className="flex-1">
          <CardContent className="p-6 h-full">
            <div className="w-full h-full">
              <ReactFlow
                nodes={processedNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectStart={() => setValidationMessage(null)}
                onConnectEnd={() => setValidationMessage(null)}
                isValidConnection={isValidConnection}
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Strict}
                connectionLineComponent={CustomConnectionLine}
                fitView
                minZoom={0.5}
                maxZoom={1.5}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                }}
              >
                <Background />
                <Controls />
                <MiniMap nodeStrokeColor="#666" nodeColor="#fff" nodeBorderRadius={2} />
                <Panel position="top-left" className="bg-background/90 p-2 rounded-lg shadow-md">
                  <div className="text-sm space-y-1">
                    <div>• Click nodes to view details</div>
                    <div>• Right-click nodes for actions</div>
                    <div>• Drag nodes to reposition</div>
                    <div>• Connect nodes to create relationships</div>
                  </div>
                </Panel>
                {validationMessage && (
                  <ValidationMessage
                    message={validationMessage.message}
                    isValid={validationMessage.isValid}
                  />
                )}
              </ReactFlow>
            </div>
          </CardContent>
        </Card>

        {selectedProfile && (
          <div className="w-80">
            <FamilyMemberDetails
              member={selectedProfile}
              {...getFamilyRelations(selectedProfile.id!.toString())!}
              onClose={() => setSelectedProfile(null)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddRelative={handleAddRelative}
              onMemberClick={handleSelectMember}
            />
          </div>
        )}
      </div>

      <AddFamilyMemberDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setAddRelativeParentId(null);
        }}
        onAdd={handleAddFamilyMember}
        existingMembers={nodes.map(node => (node.data as any).profile)}
        onRelationshipChange={(relationshipType) => {
          console.log('Relationship type changed:', relationshipType);
        }}
      />

      <EditProfileDialog
        profile={selectedProfile}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedProfile(null);
        }}
        onSave={updateFamilyMember}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Family Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProfile?.full_name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (!selectedProfile?.id) return;
                await removeFamilyMember(selectedProfile.id);
                setIsDeleteDialogOpen(false);
                setSelectedProfile(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default function FamilyTreePage() {
  return (
    <ReactFlowProvider>
      <FamilyTreeContent />
    </ReactFlowProvider>
  );
}
