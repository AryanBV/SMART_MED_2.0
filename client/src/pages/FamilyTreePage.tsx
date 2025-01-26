// File: src/pages/FamilyTreePage.tsx
import { Card, CardContent } from '@/components/ui/card';

const FamilyTreePage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Family Tree</h1>
        <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
          Add Family Member
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="h-[600px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            {/* Family Tree Visualization will go here */}
            <p className="text-gray-500">Family Tree Visualization Coming Soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyTreePage;