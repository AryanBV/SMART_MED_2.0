// File: /client/src/components/dashboard/Sidebar.tsx

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Settings,
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

  const settingsItems = [
    {
      title: 'Settings',
      icon: Settings,
      href: '/dashboard/settings',
      variant: 'ghost' as const,
      className: 'text-gray-600 hover:text-gray-900'
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

  const isSettingsActive = location.pathname.includes('/dashboard/settings');

  const isExactPathMatch = (path: string) => {
    return location.pathname === path;
  };

  // Add this helper function to check if settings section is active
  const isInSettingsSection = (path: string) => {
    return location.pathname.startsWith('/dashboard/settings') && path === '/dashboard/settings';
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

      {/* Main Navigation */}
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
                "w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100/80",
                isExactPathMatch(item.href) && "bg-accent text-white hover:bg-accent/90 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.title}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Settings & Logout Navigation */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2">
        {settingsItems.map((item) => (
          <Link key={item.href} to={item.href} className="block">
            <Button
              variant={item.variant}
              className={cn(
                "w-full justify-start",
                "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80",
                isInSettingsSection(item.href) && "bg-accent text-white hover:bg-accent/90 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.title}
            </Button>
          </Link>
        ))}

        {/* Logout Button */}
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