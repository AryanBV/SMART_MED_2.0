// src/utils/relationshipValidator.ts
import { FamilyTreeNode, FamilyTreeEdge, RelationshipType } from '@/interfaces/family';

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export const validateRelationship = (
  sourceId: string,
  targetId: string,
  nodes: FamilyTreeNode[],
  edges: FamilyTreeEdge[],
  relationshipType?: RelationshipType
): ValidationResult => {
  // Can't connect to self
  if (sourceId === targetId) {
    return {
      isValid: false,
      message: "Cannot create a relationship with self"
    };
  }

  // Check if same relationship already exists
  const relationshipExists = edges.some(
    edge => 
      edge.source === sourceId && 
      edge.target === targetId &&
      edge.data?.relationship === relationshipType
  );

  if (relationshipExists) {
    return {
      isValid: false,
      message: "This relationship already exists"
    };
  }

  // Special handling for spouse relationships
  if (relationshipType === 'wife' || relationshipType === 'husband') {
    // Check if either person already has a spouse
    const hasSpouse = edges.some(edge => {
      const edgeData = edge.data as unknown as { relationship: RelationshipType };
      return (
        (edge.source === sourceId || edge.target === sourceId || 
         edge.source === targetId || edge.target === targetId) &&
        (edgeData?.relationship === 'wife' || edgeData?.relationship === 'husband')
      );
    });

    if (hasSpouse) {
      return {
        isValid: false,
        message: "One of the members already has a spouse"
      };
    }

    // Validate gender compatibility if available
    const sourceNode = nodes.find(node => node.id === sourceId);
    const targetNode = nodes.find(node => node.id === targetId);

    if (sourceNode?.data.profile.gender && targetNode?.data.profile.gender) {
      if (relationshipType === 'wife' && targetNode.data.profile.gender !== 'female') {
        return {
          isValid: false,
          message: "Wife must be female"
        };
      }
      if (relationshipType === 'husband' && targetNode.data.profile.gender !== 'male') {
        return {
          isValid: false,
          message: "Husband must be male"
        };
      }
    }

    return {
      isValid: true,
      message: "Valid spouse relationship"
    };
  }

  // Handle parent-child relationships
  if (relationshipType === 'son' || relationshipType === 'daughter') {
    // Check if target already has maximum parents
    const existingParents = edges.filter(edge => {
      const edgeData = edge.data as unknown as { relationship: RelationshipType };
      return (
        edge.target === targetId && 
        (edgeData?.relationship === 'son' || edgeData?.relationship === 'daughter')
      );
    });

    if (existingParents.length >= 2) {
      return {
        isValid: false,
        message: "A person cannot have more than two parents"
      };
    }

    // Validate child's gender
    const targetNode = nodes.find(node => node.id === targetId);
    if (targetNode?.data.profile.gender) {
      if (relationshipType === 'son' && targetNode.data.profile.gender !== 'male') {
        return {
          isValid: false,
          message: "Son must be male"
        };
      }
      if (relationshipType === 'daughter' && targetNode.data.profile.gender !== 'female') {
        return {
          isValid: false,
          message: "Daughter must be female"
        };
      }
    }

    // Check for cycles
    if (checkForCycle(sourceId, targetId, edges)) {
      return {
        isValid: false,
        message: "This would create a circular relationship"
      };
    }
  }

  return {
    isValid: true,
    message: "Valid relationship"
  };
};

// Helper function to check for cycles in the graph
const checkForCycle = (
  sourceId: string,
  targetId: string,
  edges: FamilyTreeEdge[],
  visited: Set<string> = new Set()
): boolean => {
  if (visited.has(targetId)) {
    return true;
  }

  visited.add(targetId);

  const childEdges = edges.filter(edge => edge.source === targetId);
  for (const edge of childEdges) {
    if (edge.target === sourceId || checkForCycle(sourceId, edge.target, edges, visited)) {
      return true;
    }
  }

  visited.delete(targetId);
  return false;
};

export const getAncestors = (
  nodeId: string,
  edges: FamilyTreeEdge[],
  visited: Set<string> = new Set()
): Set<string> => {
  const parents = edges
    .filter(edge => edge.target === nodeId)
    .map(edge => edge.source);

  parents.forEach(parentId => {
    if (!visited.has(parentId)) {
      visited.add(parentId);
      getAncestors(parentId, edges, visited);
    }
  });

  return visited;
};

export const getDescendants = (
  nodeId: string,
  edges: FamilyTreeEdge[],
  visited: Set<string> = new Set()
): Set<string> => {
  const children = edges
    .filter(edge => edge.source === nodeId)
    .map(edge => edge.target);

  children.forEach(childId => {
    if (!visited.has(childId)) {
      visited.add(childId);
      getDescendants(childId, edges, visited);
    }
  });

  return visited;
};