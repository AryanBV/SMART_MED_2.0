// client/src/hooks/useFamilyTree.ts
import { useState, useCallback, useEffect } from 'react';
import { useNodesState, useEdgesState, Connection, Node, Edge } from 'reactflow';
import { FamilyService } from '@/services/family';
import { ProfileFormData } from '@/interfaces/profile';
import { FamilyTreeNode, FamilyTreeEdge, FamilyMember, RelationshipType } from '@/interfaces/family';
import { calculateTreeLayout } from '@/utils/treeLayout';
import { useToast } from '@/components/ui/use-toast';

interface RelationshipData {
  primaryParentId: number;
  secondaryParentId?: number;
  relationshipType: RelationshipType;
}

export const useFamilyTree = () => {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyTreeNode[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FamilyTreeEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const updateLayout = useCallback(() => {
    const layoutedNodes = calculateTreeLayout(nodes, edges);
    setNodes(layoutedNodes);
  }, [nodes, edges, setNodes]);

  const loadFamilyTree = useCallback(async () => {
    try {
      setIsLoading(true);
      const treeData = await FamilyService.getFamilyTree();
      const layoutedNodes = calculateTreeLayout(treeData.nodes, treeData.edges);
      setNodes(layoutedNodes);
      setEdges(treeData.edges);
    } catch (error) {
      console.error('Error loading family tree:', error);
      toast({
        title: 'Error',
        description: 'Failed to load family tree',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges, toast]);

  const getFamilyRelations = useCallback((memberId: string) => {
    const parents = edges
      .filter(edge => 
        edge.target === memberId && 
        edge.data?.relationship !== 'wife' && 
        edge.data?.relationship !== 'husband'
      )
      .map(edge => nodes.find(node => node.id === edge.source))
      .filter((node): node is Node<{ profile: FamilyMember }> => !!node)
      .map(node => node.data.profile);

    const children = edges
      .filter(edge => 
        edge.source === memberId && 
        edge.data?.relationship !== 'wife' && 
        edge.data?.relationship !== 'husband'
      )
      .map(edge => nodes.find(node => node.id === edge.target))
      .filter((node): node is Node<{ profile: FamilyMember }> => !!node)
      .map(node => node.data.profile);

    const spouses = edges
      .filter(edge => 
        (edge.source === memberId || edge.target === memberId) &&
        (edge.data?.relationship === 'wife' || edge.data?.relationship === 'husband')
      )
      .map(edge => {
        const spouseId = edge.source === memberId ? edge.target : edge.source;
        return nodes.find(node => node.id === spouseId);
      })
      .filter((node): node is Node<{ profile: FamilyMember }> => !!node)
      .map(node => node.data.profile);

    const siblings = nodes
      .filter(node => {
        if (node.id === memberId) return false;
        const nodeParents = edges
          .filter(edge => 
            edge.target === node.id && 
            edge.data?.relationship !== 'wife' && 
            edge.data?.relationship !== 'husband'
          )
          .map(edge => edge.source);
        const memberParents = edges
          .filter(edge => 
            edge.target === memberId && 
            edge.data?.relationship !== 'wife' && 
            edge.data?.relationship !== 'husband'
          )
          .map(edge => edge.source);
        return nodeParents.some(parentId => memberParents.includes(parentId));
      })
      .map(node => node.data.profile);

    return { parents, children, siblings, spouses };
  }, [nodes, edges]);

  // In useFamilyTree.ts

  const addFamilyMember = useCallback(async (
    profileData: ProfileFormData,
    relationshipData?: RelationshipData
  ) => {
    try {
      const newMember = await FamilyService.createFamilyMember(profileData);
  
      if (!newMember?.id) {
        throw new Error('Invalid member data received');
      }
  
      const newNode: FamilyTreeNode = {
        id: newMember.id.toString(),
        type: 'familyMember',
        position: { x: 0, y: 0 },
        data: { 
          profile: newMember,
          isNew: true
        },
      };
  
      const newNodes = [...nodes, newNode];
      let newEdges = [...edges];
  
      if (relationshipData) {
        const isSpouseRelation = relationshipData.relationshipType === 'husband' || 
                                relationshipData.relationshipType === 'wife';
  
        if (isSpouseRelation) {
          const spouseEdge: FamilyTreeEdge = {
            id: `e${relationshipData.primaryParentId}-${newMember.id}-spouse`,
            source: relationshipData.primaryParentId.toString(),
            target: newMember.id.toString(),
            type: 'spouseEdge',
            data: { relationship: relationshipData.relationshipType },
            style: { 
              stroke: '#FF69B4',
              strokeWidth: 2,
              strokeDasharray: '5,5'
            }
          };
          newEdges = [...newEdges, spouseEdge];
        } else {
          const primaryEdge: FamilyTreeEdge = {
            id: `e${relationshipData.primaryParentId}-${newMember.id}`,
            source: relationshipData.primaryParentId.toString(),
            target: newMember.id.toString(),
            type: 'smoothstep',
            data: { relationship: relationshipData.relationshipType }
          };
          newEdges = [...newEdges, primaryEdge];
        }
      }
  
      const layoutedNodes = calculateTreeLayout(newNodes, newEdges);
      setNodes(layoutedNodes);
      setEdges(newEdges);
  
      await loadFamilyTree();
  
      toast({
        title: 'Success',
        description: 'Family member added successfully',
      });
  
    } catch (error) {
      console.error('Error adding family member:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add family member',
        variant: 'destructive',
      });
      throw error;
    }
  }, [nodes, edges, setNodes, setEdges, toast, loadFamilyTree]);


  const updateFamilyMember = useCallback(async (profileId: number, data: ProfileFormData) => {
    try {
      const updatedMember = await FamilyService.updateFamilyMember(profileId, data);
      
      setNodes(nds =>
        nds.map(node =>
          node.id === profileId.toString()
            ? { ...node, data: { profile: updatedMember } }
            : node
        )
      );

      toast({
        title: 'Success',
        description: 'Family member updated successfully',
      });
      
      await loadFamilyTree();
    } catch (error) {
      console.error('Error updating family member:', error);
      toast({
        title: 'Error',
        description: 'Failed to update family member',
        variant: 'destructive',
      });
      throw error;
    }
  }, [setNodes, toast, loadFamilyTree]);

  const removeFamilyMember = useCallback(async (memberId: number) => {
    try {
      await FamilyService.removeFamilyMember(memberId);
      setNodes(nds => nds.filter(node => node.id !== memberId.toString()));
      setEdges(eds => 
        eds.filter(edge => 
          edge.source !== memberId.toString() && edge.target !== memberId.toString()
        )
      );
      
      toast({
        title: 'Success',
        description: 'Family member removed successfully',
      });
    } catch (error) {
      console.error('Error removing family member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove family member',
        variant: 'destructive',
      });
      throw error;
    }
  }, [setNodes, setEdges, toast]);

  const onConnect = useCallback(async (connection: Connection) => {
    try {
      if (!connection.source || !connection.target) return;
      
      const newEdge: Edge<{ relationship: RelationshipType }> = {
        id: `e${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        type: 'smoothstep',
        data: { relationship: 'son' },
      };

      await FamilyService.addFamilyRelation(
        Number(connection.source),
        Number(connection.target),
        'son'
      );

      setEdges(eds => [...eds, newEdge]);
      updateLayout();

      toast({
        title: 'Success',
        description: 'Family relationship added successfully',
      });
    } catch (error) {
      console.error('Error connecting family members:', error);
      toast({
        title: 'Error',
        description: 'Failed to add family relationship',
        variant: 'destructive',
      });
    }
  }, [setEdges, updateLayout, toast]);

  useEffect(() => {
    loadFamilyTree();
  }, [loadFamilyTree]);

  return {
    nodes,
    edges,
    isLoading,
    onNodesChange,
    onEdgesChange,
    onConnect,
    loadFamilyTree,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    updateLayout,
    getFamilyRelations,
  };
};