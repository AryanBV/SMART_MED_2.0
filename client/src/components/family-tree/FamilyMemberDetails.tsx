// src/components/family-tree/FamilyMemberDetails.tsx
import { User2, Users, Baby, Heart, UserPlus, Pencil, Trash2, X, UserIcon, HeartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FamilyMember } from '@/interfaces/family';
import { Badge } from '../../components/ui/badge';

interface FamilyMemberDetailsProps {
  member: FamilyMember;
  parents: FamilyMember[];
  children: FamilyMember[];
  siblings: FamilyMember[];
  spouses: FamilyMember[];
  onClose: () => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
  onAddRelative: (member: FamilyMember) => void;
  onMemberClick: (member: FamilyMember) => void;
}

export function FamilyMemberDetails({
  member,
  parents,
  children,
  siblings,
  spouses,
  onClose,
  onEdit,
  onDelete,
  onAddRelative,
  onMemberClick,
}: FamilyMemberDetailsProps) {
  return (
    <Card className="w-80 shadow-lg border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
        <CardTitle className="text-xl font-bold">Profile Details</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 rounded-full hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="divide-y">
            {/* Profile Section */}
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <User2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{member.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="capitalize">
                      {member.gender}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(member.date_of_birth).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(member)}
                  className="flex-1"
                >
                  <Pencil className="h-3 w-3 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddRelative(member)}
                  className="flex-1"
                >
                  <UserPlus className="h-3 w-3 mr-2" />
                  Add Relative
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(member)}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Parents Section */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Parents</h4>
              </div>
              <div className="space-y-2">
                {parents.length > 0 ? (
                  parents.map((parent) => (
                    <RelationCard
                      key={parent.id}
                      member={parent}
                      onClick={() => onMemberClick(parent)}
                    />
                  ))
                ) : (
                  <EmptyState text="No parents added" />
                )}
              </div>
            </div>

            {/* Siblings Section */}
            {siblings.length > 0 && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Siblings</h4>
                </div>
                <div className="space-y-2">
                  {siblings.map((sibling) => (
                    <RelationCard
                      key={sibling.id}
                      member={sibling}
                      onClick={() => onMemberClick(sibling)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Children Section */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Baby className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Children</h4>
              </div>
              <div className="space-y-2">
                {children.length > 0 ? (
                  children.map((child) => (
                    <RelationCard
                      key={child.id}
                      member={child}
                      onClick={() => onMemberClick(child)}
                    />
                  ))
                ) : (
                  <EmptyState text="No children added" />
                )}
              </div>

              {/* Add Spouse section */}
              <div className="mt-4">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <HeartIcon className="w-4 h-4" />
                  Spouse
                </h3>
                {spouses && spouses.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {spouses.map(spouse => (
                      <button
                        key={spouse.id}
                        onClick={() => onMemberClick(spouse)}
                        className="flex items-center gap-2 text-sm hover:text-primary"
                      >
                        <UserIcon className="w-4 h-4" />
                        {spouse.full_name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">No spouse added</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function RelationCard({ member, onClick }: { member: FamilyMember; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3"
    >
      <div className="p-2 rounded-full bg-primary/10">
        <User2 className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="font-medium text-sm">{member.full_name}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(member.date_of_birth).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-sm text-muted-foreground text-center py-2">
      {text}
    </div>
  );
}
