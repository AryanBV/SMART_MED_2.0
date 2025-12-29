// client/src/utils/treeLayout.ts
import { FamilyTreeNode, FamilyTreeEdge } from '@/interfaces/family';

// Layout constants
export const VERTICAL_SPACING = 150;     
export const HORIZONTAL_SPACING = 250;   
export const CHILD_VERTICAL_OFFSET = 100; 
export const MIN_NODE_WIDTH = 300;      
export const SPOUSE_GAP = 150;          
export const SIBLING_GAP = 100;            // Gap between different family units 
export const FAMILY_UNIT_GAP = 200;     


interface LayoutNode extends FamilyTreeNode {
  width?: number;
  spouseId?: string;
  childIds?: string[];
  parentIds?: string[];
  level?: number;
  processed?: boolean; // New flag to track processed nodes
}

export const calculateTreeLayout = (
  nodes: FamilyTreeNode[],
  edges: FamilyTreeEdge[]
): FamilyTreeNode[] => {
  if (!nodes.length) return [];

  // Convert nodes to layout nodes with additional properties
  const layoutNodes: Map<string, LayoutNode> = new Map(
    nodes.map(node => [node.id, { ...node, width: MIN_NODE_WIDTH, processed: false }])
  );

  // Build relationship maps
  edges.forEach(edge => {
    const sourceNode = layoutNodes.get(edge.source);
    const targetNode = layoutNodes.get(edge.target);
    
    if (!sourceNode || !targetNode) return;

    if (edge.data?.relationship === 'husband' || edge.data?.relationship === 'wife') {
      // Handle spouse relationships
      sourceNode.spouseId = edge.target;
      targetNode.spouseId = edge.source;
    } else {
      // Handle parent-child relationships
      if (!sourceNode.childIds) sourceNode.childIds = [];
      if (!targetNode.parentIds) targetNode.parentIds = [];
      
      sourceNode.childIds.push(edge.target);
      targetNode.parentIds.push(edge.source);
    }
  });

  // Find root nodes (nodes without parents)
  const rootNodes = Array.from(layoutNodes.values())
    .filter(node => !node.parentIds?.length)
    .map(node => node.id);

  // Enhanced level assignment with proper spouse handling
  const assignLevels = (nodeId: string, level: number = 0, visited: Set<string> = new Set()) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = layoutNodes.get(nodeId);
    if (!node) return;

    node.level = level;

  // Handle spouse level assignment without positioning as currentX is not available here
  if (node.spouseId) {
    const spouse = layoutNodes.get(node.spouseId);
    if (spouse && spouse.level == null) {
        spouse.level = level;
    }
  }

    // Process children at next level
    if (node.childIds) {
      node.childIds.forEach(childId => {
        assignLevels(childId, level + 1, visited);
      });
    }
  };

  rootNodes.forEach(rootId => assignLevels(rootId));

  // Enhanced positioning algorithm
  const positionNodes = () => {
    const nodesByLevel = new Map<number, string[]>();
    
    // Group nodes by level
    layoutNodes.forEach((node, id) => {
      if (typeof node.level !== 'number') return;
      
      if (!nodesByLevel.has(node.level)) {
        nodesByLevel.set(node.level, []);
      }
      nodesByLevel.get(node.level)?.push(id);
    });

    // Position nodes level by level
    nodesByLevel.forEach((levelNodes, level) => {
      let currentX = HORIZONTAL_SPACING; // Start with initial offset
      
      // Sort nodes to keep family units together
      levelNodes.sort((a, b) => {
        const nodeA = layoutNodes.get(a);
        const nodeB = layoutNodes.get(b);
        if (!nodeA || !nodeB) return 0;
        
        // Keep spouses together
        if (nodeA.spouseId === b) return -1;
        if (nodeB.spouseId === a) return 1;
        
        // Group siblings together
        const parentA = nodeA.parentIds?.[0];
        const parentB = nodeB.parentIds?.[0];
        if (parentA === parentB) return 0;
        
        return 0;
      });

      // Position each node in the level
      levelNodes.forEach(nodeId => {
        const node = layoutNodes.get(nodeId);
        if (!node || node.processed) return;
        
        // Calculate family unit width
        const familyUnitWidth = node.spouseId ? 
          (MIN_NODE_WIDTH * 2 + SPOUSE_GAP) : MIN_NODE_WIDTH;

        // Position current node
        node.position = {
          x: currentX,
          y: level * (VERTICAL_SPACING + CHILD_VERTICAL_OFFSET)
        };
        node.processed = true;

        // Position spouse if exists
        if (node.spouseId) {
          const spouse = layoutNodes.get(node.spouseId);
          if (spouse) {
            spouse.position = {
              x: currentX + MIN_NODE_WIDTH + SPOUSE_GAP,
              y: level * (VERTICAL_SPACING + CHILD_VERTICAL_OFFSET)
            };
            spouse.processed = true;
          }
        }

        // Position children
        if (node.childIds?.length) {
          const children = node.childIds
            .map(id => layoutNodes.get(id))
            .filter((child): child is LayoutNode => !!child);

          if (children.length) {
            const totalChildrenWidth = (children.length - 1) * (MIN_NODE_WIDTH + SIBLING_GAP);
            let childStartX = currentX + (familyUnitWidth - totalChildrenWidth) / 2;

            children.forEach((child, index) => {
              child.position = {
                x: childStartX + index * (MIN_NODE_WIDTH + SIBLING_GAP),
                y: (level + 1) * (VERTICAL_SPACING + CHILD_VERTICAL_OFFSET)
              };
            });
          }
        }

        currentX += familyUnitWidth + FAMILY_UNIT_GAP;
      });
    });
  };

  // Run the positioning algorithm
  positionNodes();

  // Reset processed flags and return positioned nodes
  layoutNodes.forEach(node => delete node.processed);
  return Array.from(layoutNodes.values());
};