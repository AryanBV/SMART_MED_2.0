// client/src/utils/treeLayout.ts

import { FamilyTreeNode, FamilyTreeEdge } from '@/interfaces/family';

const VERTICAL_SPACING = 150;
const HORIZONTAL_SPACING = 250;
const SIBLING_SPACING = 200;
const SPOUSE_OFFSET = 150;

export const calculateTreeLayout = (
  nodes: FamilyTreeNode[],
  edges: FamilyTreeEdge[]
): FamilyTreeNode[] => {
  if (!nodes.length) return [];

  // Create maps for quick lookup
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();
  const spouseMap = new Map<string, string>();

  // Helper function to check if an edge represents a spouse relationship
  const isSpouseRelationship = (edge: FamilyTreeEdge): boolean => {
    return edge.data?.relationship === 'wife' || edge.data?.relationship === 'husband';
  };

  // Build relationship maps
  edges.forEach(edge => {
    if (isSpouseRelationship(edge)) {
      // For spouse relationships, always ensure consistent source/target ordering
      const [sourceId, targetId] = [edge.source, edge.target].sort();
      spouseMap.set(sourceId, targetId);
      spouseMap.set(targetId, sourceId);
    } else {
      // Handle parent-child relationships
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap.get(edge.source)?.push(edge.target);

      if (!parentMap.has(edge.target)) {
        parentMap.set(edge.target, []);
      }
      parentMap.get(edge.target)?.push(edge.source);
    }
  });

  // Find root nodes (nodes without parents but possibly with spouses)
  const rootNodes = nodes
    .filter(node => {
      const hasParent = parentMap.has(node.id);
      const spouseId = spouseMap.get(node.id);
      const spouseHasParent = spouseId ? parentMap.has(spouseId) : false;
      return !hasParent && (!spouseHasParent || !spouseId);
    })
    .map(node => node.id);

  // Calculate subtree width including spouse relationships
  const getSubtreeWidth = (nodeId: string, visited = new Set<string>()): number => {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    const children = childrenMap.get(nodeId) || [];
    const spouse = spouseMap.get(nodeId);
    let width = 0;

    // Add width for current node and spouse
    if (spouse && !visited.has(spouse)) {
      width += 2; // One unit for each spouse
      visited.add(spouse);
    } else {
      width += 1; // Just for the current node
    }

    // Calculate children width
    const childrenWidth = children.reduce((sum, childId) => {
      if (!visited.has(childId)) {
        return sum + getSubtreeWidth(childId, visited);
      }
      return sum;
    }, 0);

    return Math.max(width, childrenWidth);
  };

  // Position nodes with enhanced spouse handling
  const positionNode = (
    nodeId: string,
    level: number,
    horizontalOffset: number,
    visited = new Set<string>()
  ): number => {
    if (visited.has(nodeId)) return horizontalOffset;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return horizontalOffset;

    const children = childrenMap.get(nodeId) || [];
    const spouse = spouseMap.get(nodeId);
    let finalPosition = horizontalOffset;

    // Handle children positioning first
    if (children.length > 0) {
      let childrenOffsets: number[] = [];
      let currentChildOffset = horizontalOffset;

      // Position all children and collect their positions
      children.forEach(childId => {
        if (!visited.has(childId)) {
          const childPosition = positionNode(childId, level + 1, currentChildOffset, visited);
          childrenOffsets.push(childPosition);
          currentChildOffset = childPosition + HORIZONTAL_SPACING;
        }
      });

      // Center parent above children
      if (childrenOffsets.length > 0) {
        finalPosition = (childrenOffsets[0] + childrenOffsets[childrenOffsets.length - 1]) / 2;
      }
    }

    // Position current node
    node.position = {
      x: finalPosition,
      y: level * VERTICAL_SPACING
    };

    // Position spouse if exists and not visited
    if (spouse && !visited.has(spouse)) {
      const spouseNode = nodeMap.get(spouse);
      if (spouseNode) {
        spouseNode.position = {
          x: finalPosition + SPOUSE_OFFSET,
          y: level * VERTICAL_SPACING
        };
        visited.add(spouse);
      }
    }

    // Return the rightmost position taken by this subtree
    return finalPosition + (spouse ? SPOUSE_OFFSET + HORIZONTAL_SPACING : HORIZONTAL_SPACING);
  };

  // Position all root nodes and their subtrees
  let currentOffset = 0;
  rootNodes.forEach(rootId => {
    currentOffset = positionNode(rootId, 0, currentOffset) + SIBLING_SPACING;
  });

  return Array.from(nodeMap.values());
};