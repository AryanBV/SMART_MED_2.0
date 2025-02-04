// client/src/hooks/useFamilyTree.ts

import { useState, useCallback, useEffect } from 'react';
import { 
  useNodesState, 
  useEdgesState, 
  Connection, 
  Node, 
  Edge,
  EdgeTypes, 
  NodeTypes,
  MarkerType 
} from 'reactflow';
import { FamilyService } from '@/services/family';
import { ProfileFormData } from '@/interfaces/profile';
import { FamilyTreeNode, FamilyTreeEdge, FamilyMember, RelationshipType } from '@/interfaces/family';
import { 
  calculateTreeLayout, 
  VERTICAL_SPACING, 
  HORIZONTAL_SPACING,
  SPOUSE_GAP,
  MIN_NODE_WIDTH,
  SIBLING_GAP,
  CHILD_VERTICAL_OFFSET 
} from '@/utils/treeLayout';
import { useToast } from '@/components/ui/use-toast';

interface RelationshipData {
  primaryParentId: number;
  secondaryParentId?: number;
  relationshipType: RelationshipType;
}

interface NodeData {
  profile: FamilyMember;
  isNew?: boolean;
  isSelected?: boolean;
}

export interface CustomEdgeData {
  relationship: RelationshipType;
}

const getEdgeStyle = (relationship: RelationshipType) => {
  if (relationship === 'wife' || relationship === 'husband') {
    return {
      strokeDasharray: '5,5',
      stroke: '#FF69B4',
      strokeWidth: 2,
      markerEnd: {
        type: MarkerType.Arrow,
      },
    };
  }
  return {
    stroke: '#2563eb',
    strokeWidth: 2,
    markerEnd: {
      type: MarkerType.Arrow,
    },
  };
};

export const useFamilyTree = () => {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyTreeNode[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FamilyTreeEdge>([]);
  const [isLoading, setIsLoading] = useState(true);

  const updateLayout = useCallback(() => {
    const layoutedNodes = calculateTreeLayout(nodes, edges);
    setNodes(layoutedNodes);
  }, [nodes, edges, setNodes]);

  const loadFamilyTree = useCallback(async () => {
    try {
      setIsLoading(true);
      const treeData = await FamilyService.getFamilyTree();
      
      // Add edge styles based on relationship type
      const styledEdges = treeData.edges.map(edge => ({
        ...edge,
        style: getEdgeStyle(edge.data?.relationship),
      }));

      const layoutedNodes = calculateTreeLayout(treeData.nodes, styledEdges);
      setNodes(layoutedNodes);
      setEdges(styledEdges);
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
      .filter((node): node is Node<NodeData> => !!node)
      .map(node => node.data.profile);

    const children = edges
      .filter(edge => 
        edge.source === memberId && 
        edge.data?.relationship !== 'wife' && 
        edge.data?.relationship !== 'husband'
      )
      .map(edge => nodes.find(node => node.id === edge.target))
      .filter((node): node is Node<NodeData> => !!node)
      .map(node => node.data.profile);

      const spouses = edges
      .filter(edge => {
          const isSpouseEdge = edge.data?.relationship === 'wife' || edge.data?.relationship === 'husband';
          const isInvolved = edge.source === memberId || edge.target === memberId;
          // Only include if it's a spouse edge and the current member is involved
          return isSpouseEdge && isInvolved;
      })
      .map(edge => {
          // Get the ID of the other spouse
          const spouseId = edge.source === memberId ? edge.target : edge.source;
          return nodes.find(node => node.id === spouseId);
      })
      .filter((node): node is Node<NodeData> => !!node)
      .filter((node, index, self) => 
          // Remove duplicates based on ID
          index === self.findIndex(n => n.data.profile.id === node.data.profile.id)
      )
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

  const addFamilyMember = useCallback(async (
    profileData: ProfileFormData,
    relationshipData?: RelationshipData
  ) => {
    try {
      const newMember = await FamilyService.createFamilyMember(profileData);

      if (!newMember?.id) {
        throw new Error('Invalid member data received');
      }

      let initialPosition = { x: 0, y: 0 };

      if (relationshipData) {
        const parentNode = nodes.find(
          n => n.id === relationshipData.primaryParentId.toString()
        );

        if (parentNode) {
          const isSpouseRelation = 
            relationshipData.relationshipType === 'husband' || 
            relationshipData.relationshipType === 'wife';

            if (isSpouseRelation) {
              const isWife = relationshipData.relationshipType === 'wife';
              initialPosition = {
                  x: parentNode.position.x + (isWife ? 1 : -1) * (SPOUSE_GAP + MIN_NODE_WIDTH),
                  y: parentNode.position.y
              };
          } else {
            const siblings = edges
              .filter(edge => 
                edge.source === parentNode.id &&
                edge.data?.relationship !== 'wife' &&
                edge.data?.relationship !== 'husband'
              )
              .map(edge => edge.target);

            const siblingCount = siblings.length;
            const xOffset = siblingCount * (MIN_NODE_WIDTH + SIBLING_GAP);

            initialPosition = {
              x: parentNode.position.x + xOffset,
              y: parentNode.position.y + VERTICAL_SPACING + CHILD_VERTICAL_OFFSET
            };
          }
        }
      }

      const newNode: FamilyTreeNode = {
        id: newMember.id.toString(),
        type: 'familyMember',
        position: initialPosition,
        data: { 
          profile: newMember,
          isNew: true
        },
      };

      let newEdge: FamilyTreeEdge | null = null;

      if (relationshipData) {
        const isSpouseRelation = 
          relationshipData.relationshipType === 'husband' || 
          relationshipData.relationshipType === 'wife';

        newEdge = {
          id: `e${relationshipData.primaryParentId}-${newMember.id}`,
          source: relationshipData.primaryParentId.toString(),
          target: newMember.id.toString(),
          type: isSpouseRelation ? 'spouseEdge' : 'smoothstep',
          data: { relationship: relationshipData.relationshipType },
          style: getEdgeStyle(relationshipData.relationshipType),
        };

        // Add relationship in the backend
        await FamilyService.addFamilyRelation(
          relationshipData.primaryParentId,
          newMember.id,
          relationshipData.relationshipType
        );
      }

      const newNodes = [...nodes, newNode];
      const newEdges = newEdge ? [...edges, newEdge] : edges;

      const layoutedNodes = calculateTreeLayout(newNodes, newEdges);
      setNodes(layoutedNodes);
      setEdges(newEdges);

      await loadFamilyTree();

      return newMember;
    } catch (error) {
      console.error('Error adding family member:', error);
      throw error;
    }
  }, [nodes, edges, setNodes, setEdges, loadFamilyTree]);

  const updateFamilyMember = useCallback(async (profileId: number, data: ProfileFormData) => {
    try {
      const updatedMember = await FamilyService.updateFamilyMember(profileId, data);
      
      setNodes(nds =>
        nds.map(node =>
          node.id === profileId.toString()
            ? { ...node, data: { ...node.data, profile: updatedMember } }
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

  const removeFamilyMember = useCallback(async (profileId: number) => {
    try {
      await FamilyService.removeFamilyMember(profileId);
      toast({
        title: 'Success',
        description: 'Family member removed successfully',
      });
      await loadFamilyTree();
    } catch (error) {
      console.error('Error removing family member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove family member',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast, loadFamilyTree]);

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