// File: src/pages/DashboardPage.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const DashboardPage = () => {
  return (
    <div className="space-y-8">
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-700">Family Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2 space-y-1">
              <p className="text-4xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500">Total family members</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-700">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2 space-y-1">
              <p className="text-4xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500">Total documents</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-700">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;