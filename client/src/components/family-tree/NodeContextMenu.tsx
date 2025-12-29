// src/components/family-tree/NodeContextMenu.tsx
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
  import { FamilyMember } from "@/interfaces/family";
  import { Pencil, Trash2, UserPlus } from "lucide-react";
  
  interface NodeContextMenuProps {
    children: React.ReactNode;
    profile: FamilyMember;
    onEdit: (profile: FamilyMember) => void;
    onDelete: (profile: FamilyMember) => void;
    onAddRelative: (profile: FamilyMember) => void;
  }
  
  export function NodeContextMenu({
    children,
    profile,
    onEdit,
    onDelete,
    onAddRelative,
  }: NodeContextMenuProps) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuItem
            onClick={() => onEdit(profile)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Pencil className="h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => onAddRelative(profile)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Relative</span>
          </DropdownMenuItem>
  
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => onDelete(profile)}
            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }