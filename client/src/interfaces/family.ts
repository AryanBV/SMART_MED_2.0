import { Node, Edge } from 'reactflow';
import { Profile } from './profile';

export interface FamilyMember extends Profile {
  id: number;
  parentIds?: number[];
  childrenIds?: number[];
}

export type RelationshipType = 'father' | 'mother' | 'son' | 'daughter' | 'husband' | 'wife';

export interface FamilyTreeNodeData {
  profile: FamilyMember;
  isNew?: boolean;
  isSelected?: boolean;
  onEdit?: (profile: FamilyMember) => void;
  onDelete?: (profile: FamilyMember) => void;
  onAddRelative?: (profile: FamilyMember) => void;
  onSelect?: (profile: FamilyMember) => void;
}

export type FamilyTreeNode = Node<FamilyTreeNodeData>;
export type FamilyTreeEdge = Edge<{ relationship: RelationshipType }>;

export interface FamilyTreeData {
  nodes: FamilyTreeNode[];
  edges: FamilyTreeEdge[];
}

export interface RelationshipData {
  primaryParentId: number;
  secondaryParentId?: number;
  relationshipType: RelationshipType;
}

export interface FamilyRelation {
  id: number;
  parent_id: number;
  child_id: number;
  relation_type: 'biological' | 'adopted' | 'guardian' | 'spouse';
  relationship_type: RelationshipType;
  is_spouse?: boolean;
}