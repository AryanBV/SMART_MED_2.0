// src/components/family-tree/CustomConnectionLine.tsx
import { 
  ConnectionLineComponentProps, 
  getStraightPath, 
  getSmoothStepPath,
  Position,
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
  let edgePath = '';
  const isSpouseRelationship = data?.relationship === 'wife' || data?.relationship === 'husband';

  if (isSpouseRelationship) {
    // Use straight lines for spouse relationships
    [edgePath] = getStraightPath({
      sourceX: fromX,
      sourceY: fromY,
      targetX: toX,
      targetY: toY,
    });
  } else {
    // Use smooth step for parent-child relationships
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
              : '#2563eb' // Blue for parent-child relationships
            : connectionStatus === 'invalid'
            ? '#ef4444' // Red for invalid connections
            : '#94a3b8', // Gray for connecting state
          strokeDasharray: isSpouseRelationship ? '5,5' : 'none',
          transition: 'stroke 0.2s ease',
        }}
        d={edgePath}
        markerEnd={connectionStatus === 'valid' ? `url(#${MarkerType.Arrow})` : undefined}
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