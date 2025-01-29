// src/components/family-tree/CustomConnectionLine.tsx
import { ConnectionLineComponentProps as OriginalConnectionLineComponentProps, getStraightPath, getSmoothStepPath } from 'reactflow';

interface ConnectionLineComponentProps extends OriginalConnectionLineComponentProps {
  data?: {
    relationship?: string;
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
}: ConnectionLineComponentProps) {
  let edgePath = '';

  if (data?.relationship === 'wife' || data?.relationship === 'husband') {
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
    });
  }

  const isSpouseRelationship = data?.relationship === 'wife' || data?.relationship === 'husband';

  return (
    <g>
      <path
        fill="none"
        strokeWidth={2}
        className={
          connectionStatus === 'valid'
            ? isSpouseRelationship
              ? 'stroke-pink-500'
              : 'stroke-green-500'
            : connectionStatus === 'invalid'
            ? 'stroke-red-500'
            : 'stroke-gray-400'
        }
        strokeDasharray={isSpouseRelationship ? '5,5' : 'none'}
        d={edgePath}
      />
      {connectionStatus === 'invalid' && (
        <circle
          cx={toX}
          cy={toY}
          r={4}
          className="fill-red-500"
        />
      )}
    </g>
  );
}