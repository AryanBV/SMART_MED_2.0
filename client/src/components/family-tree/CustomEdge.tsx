import { EdgeProps, getBezierPath } from 'reactflow';
import { RelationshipType } from '@/interfaces/types';

interface CustomEdgeData {
  relationship: RelationshipType;
}

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<CustomEdgeData>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getEdgeStyle = (relationship: RelationshipType) => {
    switch (relationship) {
      case 'parent':
        return { stroke: '#10b981', strokeWidth: 2 };
      case 'child':
        return { stroke: '#3b82f6', strokeWidth: 2 };
      case 'spouse':
        return { stroke: '#ef4444', strokeWidth: 3 };
      case 'sibling':
        return { stroke: '#f59e0b', strokeWidth: 2 };
      default:
        return { stroke: '#6b7280', strokeWidth: 1 };
    }
  };

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      style={getEdgeStyle(data?.relationship || 'sibling')}
      fill="none"
    />
  );
}