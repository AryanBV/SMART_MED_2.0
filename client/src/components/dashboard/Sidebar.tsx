// src/components/dashboard/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  UserCircle,
  Users,
  FileText,
  LogOut
} from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const navigationItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard'
    },
    {
      title: 'Profile',
      icon: UserCircle,
      href: '/dashboard/profile'
    },
    {
      title: 'Family Tree',
      icon: Users,
      href: '/dashboard/family-tree'
    },
    {
      title: 'Documents',
      icon: FileText,
      href: '/dashboard/documents'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen w-64 bg-white border-r border-gray-200 p-4">
      {/* User Info */}
      <div className="mb-8 p-4">
        <h2 className="text-lg font-semibold">{user?.email}</h2>
        <p className="text-sm text-gray-500">Welcome back!</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="block"
          >
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                location.pathname === item.href && "bg-gray-100"
              )}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.title}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-4 w-56">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};