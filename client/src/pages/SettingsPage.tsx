// Path: client/src/pages/SettingsPage.tsx

import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import SettingsLayout from '@/components/settings/layouts/SettingsLayout';
import ProfileSettings from '@/components/settings/sections/ProfileSettings';
import AccountSettings from '@/components/settings/sections/AccountSettings';
import DocumentSettings from '@/components/settings/sections/DocumentSettings';
import FamilySettings from '@/components/settings/sections/FamilySettings';
import AppSettings from '@/components/settings/sections/AppSettings';

const SettingsPage: React.FC = () => {
  const location = useLocation();
  
  const renderSettingsSection = () => {
    const path = location.pathname.split('/').pop();
    
    switch (path) {
      case 'profile':
        return <ProfileSettings />;
      case 'account':
        return <AccountSettings />;
      case 'documents':
        return <DocumentSettings />;
      case 'family':
        return <FamilySettings />;
      case 'app':
        return <AppSettings />;
      case 'settings':
        return <Navigate to="/dashboard/settings/profile" replace />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <SettingsLayout>
      {renderSettingsSection()}
    </SettingsLayout>
  );
};

export default SettingsPage;