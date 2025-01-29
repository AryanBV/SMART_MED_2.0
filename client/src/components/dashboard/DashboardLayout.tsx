// src/components/dashboard/DashboardLayout.tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <div className="flex h-screen">
        <Sidebar />
        <main className="dashboard-content flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};