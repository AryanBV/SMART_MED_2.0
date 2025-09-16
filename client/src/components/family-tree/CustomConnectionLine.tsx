// src/components/family-tree/CustomConnectionLine.tsx
import { 
  ConnectionLineComponentProps, 
  getStraightPath, 
  getSmoothStepPath,
  MarkerType 
} from 'reactflow';

interface CustomConnectionLineProps extends ConnectionLineComponentProps {
  data?: {
    relationship?: 'son' | 'daughter' | 'wife' | 'husband';
  };
}

export function CustomConnectionLine({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
  connectionStatus,
  data
}: CustomConnectionLineProps) {
  const isSpouseRelationship = data?.relationship === 'wife' || data?.relationship === 'husband';
  const isChildRelationship = data?.relationship === 'son' || data?.relationship === 'daughter';

  const createParentChildPath = (sourceX: number, sourceY: number, targetX: number, targetY: number) => {
    // Create a path that goes down from parent, then horizontally, then down to child
    const midY = sourceY + (targetY - sourceY) * 0.7;
    
    return `M ${sourceX} ${sourceY} 
            L ${sourceX} ${midY} 
            L ${targetX} ${midY} 
            L ${targetX} ${targetY}`;
  };

  let edgePath = '';

  if (isSpouseRelationship) {
    // Use straight lines for spouse relationships
    [edgePath] = getStraightPath({
      sourceX: fromX,
      sourceY: fromY,
      targetX: toX,
      targetY: toY,
    });
  } else if (isChildRelationship) {
    // Use custom parent-child path
    edgePath = createParentChildPath(fromX, fromY, toX, toY);
  } else {
    // Use smooth step for other relationships
    [edgePath] = getSmoothStepPath({
      sourceX: fromX,
      sourceY: fromY,
      sourcePosition: fromPosition,
      targetX: toX,
      targetY: toY,
      targetPosition: toPosition,
      borderRadius: 8
    });
  }

  return (
    <g>
      <path
        fill="none"
        strokeWidth={2}
        style={{
          stroke: connectionStatus === 'valid'
            ? isSpouseRelationship
              ? '#FF69B4' // Pink for spouse relationships
              : isChildRelationship
              ? '#2563eb' // Blue for parent-child relationships
              : '#2563eb' // Blue for other relationships
            : connectionStatus === 'invalid'
            ? '#ef4444' // Red for invalid connections
            : '#94a3b8', // Gray for connecting state
          strokeDasharray: isSpouseRelationship ? '5,5' : 'none',
          transition: 'stroke 0.2s ease',
        }}
        d={edgePath}
        markerEnd={connectionStatus === 'valid' && !isSpouseRelationship ? `url(#${MarkerType.Arrow})` : undefined}
      />
      {connectionStatus === 'invalid' && (
        <circle
          cx={toX}
          cy={toY}
          r={4}
          style={{
            fill: '#ef4444',
            filter: 'drop-shadow(0 0 2px rgb(239 68 68 / 0.5))'
          }}
        />
      )}
    </g>
  );
}