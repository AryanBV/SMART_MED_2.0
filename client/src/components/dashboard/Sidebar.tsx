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
import logo from '@/assets/logo.svg';

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

  const getUserFirstName = () => {
    return user?.name?.split(' ')[0] || 'User';
  };

  return (
    <div className="min-h-screen w-72 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-100">
        <img 
          src={logo} 
          alt="SMART_MED" 
          className="h-10 w-auto"
        />
      </div>

      {/* User Info */}
      <div className="px-6 py-4 mb-2 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          {getUserFirstName()}
        </h2>
        <p className="text-sm text-gray-500">Welcome back!</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pt-2 space-y-1">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="block"
          >
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-gray-600 hover:text-gray-900",
                location.pathname === item.href && "bg-gray-100 text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.title}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto px-4 pb-6 pt-4 border-t border-gray-100">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
};