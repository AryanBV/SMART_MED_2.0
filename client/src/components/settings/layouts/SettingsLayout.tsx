// Path: client/src/components/settings/layouts/SettingsLayout.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Settings, User, FileText, Users, Palette } from 'lucide-react';

const settingsNavItems = [
  {
    title: 'Profile Settings',
    href: '/dashboard/settings/profile',
    icon: User,
  },
  {
    title: 'Account Settings',
    href: '/dashboard/settings/account',
    icon: Settings,
  },
  {
    title: 'Document Settings',
    href: '/dashboard/settings/documents',
    icon: FileText,
  },
  {
    title: 'Family Settings',
    href: '/dashboard/settings/family',
    icon: Users,
  },
  {
    title: 'App Settings',
    href: '/dashboard/settings/app',
    icon: Palette,
  },
];

export const SettingsLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="container mx-auto py-6 flex">
      <aside className="w-[250px] shrink-0 mr-6">
        <div className="sticky top-6 space-y-1 bg-white rounded-lg">
          {settingsNavItems.map((item) => (
            <div key={item.href} className="relative group">
              <Link
                to={item.href}
                className="block"
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 relative transition-all duration-200",
                    location.pathname === item.href 
                      ? "bg-primary/10 text-primary hover:bg-primary/20" 
                      : "hover:bg-accent/10 hover:text-accent"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-colors",
                    location.pathname === item.href 
                      ? "text-primary"
                      : "group-hover:text-accent"
                  )} />
                  <span>{item.title}</span>
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <div className="bg-white rounded-lg p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SettingsLayout;