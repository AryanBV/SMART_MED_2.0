// src/components/family-tree/TreeNode.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FamilyMember } from '@/interfaces/family';
import { NodeContextMenu } from './NodeContextMenu';
import { User2 } from 'lucide-react';

interface TreeNodeData {
  profile: FamilyMember;
  isNew?: boolean;
  isSelected?: boolean;
  onEdit: (profile: FamilyMember) => void;
  onDelete: (profile: FamilyMember) => void;
  onAddRelative: (profile: FamilyMember) => void;
  onSelect: (profile: FamilyMember) => void;
}

type TreeNodeProps = NodeProps<TreeNodeData>;

const formatDateString = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'No date';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};


const TreeNode = memo(({ data, isConnectable }: TreeNodeProps) => {
  const { profile, isNew, isSelected, onEdit, onDelete, onAddRelative, onSelect } = data;
  
  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(profile);
  };
  
  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-primary/50 transition-all group-hover:!bg-primary -translate-y-1"
      />
      
      <NodeContextMenu
        profile={profile}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddRelative={onAddRelative}
      >
        <div 
          onClick={handleNodeClick}
          className="transition-all duration-200 group-hover:scale-102 group-hover:-translate-y-0.5"
          role="button"
          tabIndex={0}
          aria-label={`Family member: ${profile.full_name}`}
        >
          <Card 
            className={`
              w-56 cursor-pointer transition-all
              ${isNew ? 'border-dashed border-2' : 'shadow-md hover:shadow-xl'}
              ${isSelected ? 'ring-2 ring-primary shadow-xl bg-primary/5' : ''}
              group-hover:border-primary/50 overflow-hidden
            `}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-full bg-primary/10 mt-1
                  ${isSelected ? 'bg-primary/20' : ''}
                  transition-colors duration-200
                `}>
                  <User2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate text-base text-gray-900">
                    {profile.full_name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`px-2 py-0 text-xs capitalize
                        ${profile.gender === 'male' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                        ${profile.gender === 'female' ? 'bg-pink-50 text-pink-700 border-pink-200' : ''}
                      `}
                    >
                      {profile.gender}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateString(profile.date_of_birth)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </NodeContextMenu>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-primary/50 transition-all group-hover:!bg-primary translate-y-1"
      />
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

export default TreeNode;