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

  // Create virtual connection points for parent couples
  const createConnectionPoint = (parentIds: string[]) => {
    if (parentIds.length === 2) {
      return `connection_${parentIds.sort().join('_')}`;
    }
    return parentIds[0];
  };

  // Build relationship maps and track relationship types
  const relationshipMap = new Map<string, { spouseId: string; isHusband: boolean }>();
  
  edges.forEach(edge => {
    const sourceNode = layoutNodes.get(edge.source);
    const targetNode = layoutNodes.get(edge.target);
    
    if (!sourceNode || !targetNode) return;

    if (edge.data?.relationship === 'husband' || edge.data?.relationship === 'wife') {
      // Handle spouse relationships with proper role tracking
      if (edge.data.relationship === 'wife') {
        // Source is wife, target is husband
        relationshipMap.set(edge.source, { spouseId: edge.target, isHusband: false });
        relationshipMap.set(edge.target, { spouseId: edge.source, isHusband: true });
      } else {
        // Source is husband, target is wife
        relationshipMap.set(edge.source, { spouseId: edge.target, isHusband: true });
        relationshipMap.set(edge.target, { spouseId: edge.source, isHusband: false });
      }
      
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

    // Only assign level if not already assigned or if the new level is higher (closer to root)
    if (node.level == null || node.level > level) {
      node.level = level;
    }

    // Handle spouse level assignment
    if (node.spouseId) {
      const spouse = layoutNodes.get(node.spouseId);
      if (spouse && (spouse.level == null || spouse.level > level)) {
        spouse.level = level;
      }
    }

    // Process children at next level - but only if we're assigning this level or deeper
    if (node.childIds && (node.level === level)) {
      // Get all unique children (combining children from both spouses if applicable)
      const allChildren = new Set(node.childIds);
      
      if (node.spouseId) {
        const spouse = layoutNodes.get(node.spouseId);
        if (spouse?.childIds) {
          spouse.childIds.forEach(childId => allChildren.add(childId));
        }
      }

      allChildren.forEach(childId => {
        assignLevels(childId, level + 1, visited);
      });
    }
  };

  rootNodes.forEach(rootId => assignLevels(rootId));

  // Enhanced positioning algorithm with age-based sorting
  const positionNodes = () => {
    // Helper function to calculate age
    const calculateAge = (dateOfBirth: string) => {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

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
      
      // Sort nodes by age (oldest first) and keep family units together
      levelNodes.sort((a, b) => {
        const nodeA = layoutNodes.get(a);
        const nodeB = layoutNodes.get(b);
        if (!nodeA || !nodeB) return 0;
        
        // Keep spouses together - husband (older spouse) on left
        if (nodeA.spouseId === b) {
          const nodeAAge = calculateAge(nodeA.data?.profile?.date_of_birth || '');
          const nodeBAge = calculateAge(nodeB.data?.profile?.date_of_birth || '');
          return nodeBAge - nodeAAge; // Older spouse (husband) should come first (left)
        }
        if (nodeB.spouseId === a) {
          const nodeAAge = calculateAge(nodeA.data?.profile?.date_of_birth || '');
          const nodeBAge = calculateAge(nodeB.data?.profile?.date_of_birth || '');
          return nodeBAge - nodeAAge; // Older spouse (husband) should come first (left)
        }
        
        // For siblings or separate family units, sort by age (oldest first)
        const nodeAAge = calculateAge(nodeA.data?.profile?.date_of_birth || '');
        const nodeBAge = calculateAge(nodeB.data?.profile?.date_of_birth || '');
        
        // Group siblings together first
        const parentA = nodeA.parentIds?.[0];
        const parentB = nodeB.parentIds?.[0];
        if (parentA === parentB && parentA) {
          // Same parents - sort by age (oldest first)
          return nodeBAge - nodeAAge;
        }
        
        // Different families - sort by age (oldest first)  
        return nodeBAge - nodeAAge;
      });

      // Position each node in the level
      levelNodes.forEach(nodeId => {
        const node = layoutNodes.get(nodeId);
        if (!node || node.processed) return;
        
        // Calculate family unit width
        const familyUnitWidth = node.spouseId ? 
          (MIN_NODE_WIDTH * 2 + SPOUSE_GAP) : MIN_NODE_WIDTH;

        // Determine positioning for spouse pairs (older spouse/husband on left, younger spouse/wife on right)
        if (node.spouseId) {
          const spouse = layoutNodes.get(node.spouseId);
          if (spouse && !spouse.processed) {
            const nodeRelation = relationshipMap.get(nodeId);
            const spouseRelation = relationshipMap.get(node.spouseId);
            
            // Calculate ages to determine positioning
            const nodeAge = node.data?.profile?.date_of_birth ? 
              calculateAge(node.data.profile.date_of_birth) : 0;
            const spouseAge = spouse.data?.profile?.date_of_birth ? 
              calculateAge(spouse.data.profile.date_of_birth) : 0;
            
            // Determine who should be on the left based on gender (male left, female right)
            let leftNode = node;
            let rightNode = spouse;
            
            const nodeGender = node.data?.profile?.gender;
            const spouseGender = spouse.data?.profile?.gender;
            
            // Primary rule: Male (husband) on left, Female (wife) on right
            if (nodeGender === 'male' && spouseGender === 'female') {
              leftNode = node;    // Male node goes to left
              rightNode = spouse; // Female spouse goes to right
            } else if (nodeGender === 'female' && spouseGender === 'male') {
              leftNode = spouse;  // Male spouse goes to left
              rightNode = node;   // Female node goes to right
            }
            // Fallback rule: Use relationship type if available
            else if (nodeRelation?.isHusband === false || spouseRelation?.isHusband === true) {
              leftNode = spouse;
              rightNode = node;
            } 
            // Final fallback: Older person on left if we can't determine gender/role
            else if (!nodeGender && !spouseGender && spouseAge > nodeAge) {
              leftNode = spouse;
              rightNode = node;
            }
            
            // Position husband on the left, wife on the right
            leftNode.position = {
              x: currentX,
              y: level * (VERTICAL_SPACING + CHILD_VERTICAL_OFFSET)
            };
            leftNode.processed = true;
            
            rightNode.position = {
              x: currentX + MIN_NODE_WIDTH + SPOUSE_GAP,
              y: level * (VERTICAL_SPACING + CHILD_VERTICAL_OFFSET)
            };
            rightNode.processed = true;
          }
        } else {
          // Position single node
          node.position = {
            x: currentX,
            y: level * (VERTICAL_SPACING + CHILD_VERTICAL_OFFSET)
          };
          node.processed = true;
        }

        // Position children (sorted by age - oldest on left)
        // Only position children once per family unit by checking if this is the male/husband or single parent
        const shouldPositionChildren = !node.spouseId || 
          (node.spouseId && node.data?.profile?.gender === 'male');
          
        if (node.childIds?.length && shouldPositionChildren) {
          // Get all children from both parents if it's a spouse pair
          let allChildrenIds = new Set(node.childIds);
          if (node.spouseId) {
            const spouse = layoutNodes.get(node.spouseId);
            if (spouse?.childIds) {
              spouse.childIds.forEach(childId => allChildrenIds.add(childId));
            }
          }

          const children = Array.from(allChildrenIds)
            .map(id => layoutNodes.get(id))
            .filter((child): child is LayoutNode => !!child && !child.processed) // Skip already processed children
            .sort((a, b) => {
              // Sort children by age (oldest first - leftmost position)
              const ageA = a.data?.profile?.date_of_birth ? 
                calculateAge(a.data.profile.date_of_birth) : 0;
              const ageB = b.data?.profile?.date_of_birth ? 
                calculateAge(b.data.profile.date_of_birth) : 0;
              return ageB - ageA; // Oldest first (higher age = leftmost)
            });

          if (children.length) {
            const totalChildrenWidth = children.length > 1 ? 
              (children.length - 1) * (MIN_NODE_WIDTH + SIBLING_GAP) : 0;
            // Calculate center point of parent unit (whether single parent or couple)
            const parentCenterX = currentX + familyUnitWidth / 2;
            let childStartX = parentCenterX - totalChildrenWidth / 2;

            children.forEach((child, index) => {
              child.position = {
                x: childStartX + index * (MIN_NODE_WIDTH + SIBLING_GAP),
                y: (level + 1) * (VERTICAL_SPACING + CHILD_VERTICAL_OFFSET)
              };
              child.processed = true;
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