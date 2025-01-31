// client/src/utils/treeLayout.ts
import { FamilyTreeNode, FamilyTreeEdge } from '@/interfaces/family';

// Layout constants
const VERTICAL_SPACING = 200;    // Space between generations
const MIN_NODE_WIDTH = 300;      // Minimum width for a node
const SPOUSE_GAP = 150;          // Gap between spouses
const SIBLING_GAP = 80;          // Gap between siblings
const FAMILY_UNIT_GAP = 200;     // Gap between different family units

interface LayoutNode extends FamilyTreeNode {
  width?: number;
  spouseId?: string;
  childIds?: string[];
  parentIds?: string[];
  level?: number;
}

export const calculateTreeLayout = (
  nodes: FamilyTreeNode[],
  edges: FamilyTreeEdge[]
): FamilyTreeNode[] => {
  if (!nodes.length) return [];

  // Convert nodes to layout nodes with additional properties
  const layoutNodes: Map<string, LayoutNode> = new Map(
    nodes.map(node => [node.id, { ...node, width: MIN_NODE_WIDTH }])
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

  // Assign levels to nodes
  const assignLevels = (nodeId: string, level: number = 0, visited: Set<string> = new Set()) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = layoutNodes.get(nodeId);
    if (!node) return;

    node.level = level;

    // Process spouse at same level
    if (node.spouseId && !visited.has(node.spouseId)) {
      const spouse = layoutNodes.get(node.spouseId);
      if (spouse) {
        spouse.level = level;
        assignLevels(node.spouseId, level, visited);
      }
    }

    // Process children at next level
    node.childIds?.forEach(childId => {
      assignLevels(childId, level + 1, visited);
    });
  };

  rootNodes.forEach(rootId => assignLevels(rootId));

  // Calculate initial positions
  const positionNodes = () => {
    // Group nodes by level
    const nodesByLevel = new Map<number, string[]>();
    layoutNodes.forEach((node, id) => {
      if (typeof node.level !== 'number') return;
      
      if (!nodesByLevel.has(node.level)) {
        nodesByLevel.set(node.level, []);
      }
      nodesByLevel.get(node.level)?.push(id);
    });

    // Position nodes level by level
    let maxY = 0;
    nodesByLevel.forEach((levelNodes, level) => {
      let currentX = 0;
      
      // Sort nodes to keep family units together
      levelNodes.sort((a, b) => {
        const nodeA = layoutNodes.get(a);
        const nodeB = layoutNodes.get(b);
        if (!nodeA || !nodeB) return 0;
        
        // Keep spouses together
        if (nodeA.spouseId === b) return -1;
        if (nodeB.spouseId === a) return 1;
        
        return 0;
      });

      levelNodes.forEach(nodeId => {
        const node = layoutNodes.get(nodeId);
        if (!node) return;
      
        // Skip if already positioned with spouse
        if (node.position && node.spouseId && layoutNodes.get(node.spouseId)?.position) return;
      
        const familyUnitWidth = node.spouseId ? (MIN_NODE_WIDTH * 2 + SPOUSE_GAP) : MIN_NODE_WIDTH;
      
        // Position current node
        node.position = {
          x: currentX + (node.spouseId ? 0 : MIN_NODE_WIDTH / 2),
          y: level * VERTICAL_SPACING
        };
      
        // Position spouse if exists
        if (node.spouseId) {
          const spouse = layoutNodes.get(node.spouseId);
          if (spouse) {
            spouse.position = {
              x: currentX + MIN_NODE_WIDTH + SPOUSE_GAP,
              y: level * VERTICAL_SPACING
            };
          }
        }
      
        currentX += familyUnitWidth + FAMILY_UNIT_GAP;
      });

      maxY = Math.max(maxY, level * VERTICAL_SPACING);
    });

    // Center children below parents
    layoutNodes.forEach((node) => {
      if (!node.childIds?.length) return;

      const children = node.childIds
        .map(id => layoutNodes.get(id))
        .filter((child): child is LayoutNode => !!child);

      if (!children.length) return;

      const leftmostChild = Math.min(...children.map(child => child.position?.x || 0));
      const rightmostChild = Math.max(...children.map(child => child.position?.x || 0));
      const centerOfChildren = (leftmostChild + rightmostChild) / 2;

      // If node has a spouse, center children below the middle of the couple
      if (node.spouseId) {
        const spouse = layoutNodes.get(node.spouseId);
        if (spouse && node.position && spouse.position) {
          const centerOfParents = (node.position.x + spouse.position.x + MIN_NODE_WIDTH) / 2;
          const offset = centerOfParents - centerOfChildren;

          children.forEach(child => {
            if (child.position) {
              child.position.x += offset;
            }
          });
        }
      }
    });
  };

  // Run the positioning algorithm
  positionNodes();

  // Return the positioned nodes
  return Array.from(layoutNodes.values());
};