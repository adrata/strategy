/**
 * ProfilePanelContext
 * 
 * Context for managing profile panel visibility across the application
 */

import React, { createContext, useContext, useState } from 'react';

interface ProfilePanelContextType {
  isProfilePanelVisible: boolean;
  setIsProfilePanelVisible: (visible: boolean) => void;
}

const ProfilePanelContext = createContext<ProfilePanelContextType | undefined>(undefined);

export function ProfilePanelProvider({ children }: { children: React.ReactNode }) {
  const [isProfilePanelVisible, setIsProfilePanelVisible] = useState(false);

  return (
    <ProfilePanelContext.Provider value={{
      isProfilePanelVisible,
      setIsProfilePanelVisible,
    }}>
      {children}
    </ProfilePanelContext.Provider>
  );
}

export function useProfilePanel() {
  const context = useContext(ProfilePanelContext);
  if (context === undefined) {
    throw new Error('useProfilePanel must be used within a ProfilePanelProvider');
  }
  return context;
}
