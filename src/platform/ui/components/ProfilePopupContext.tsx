"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

interface ProfilePopupContextType {
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  profileAnchor: HTMLElement | null;
  setProfileAnchor: (anchor: HTMLElement | null) => void;
  profilePopupRef: React.RefObject<HTMLDivElement | null>;
  closeAllPopups: () => void;
  openProfilePopup: (anchor: HTMLElement) => void;
}

const ProfilePopupContext = createContext<ProfilePopupContextType | undefined>(
  undefined,
);

export function ProfilePopupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const profilePopupRef = useRef<HTMLDivElement>(null);

  const closeAllPopups = () => {
    console.log("🔒 ProfilePopup: Closing all profile popups");
    setIsProfileOpen(false);
    setProfileAnchor(null);
  };

  const openProfilePopup = (anchor: HTMLElement) => {
    console.log("🔓 ProfilePopup: Opening profile popup");
    setProfileAnchor(anchor);
    setIsProfileOpen(true);
  };

  // Click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isProfileOpen &&
        profilePopupRef['current'] &&
        !profilePopupRef.current.contains(event.target as Node) &&
        profileAnchor &&
        !profileAnchor.contains(event.target as Node)
      ) {
        console.log("🔒 ProfilePopup: Clicked outside, closing popup");
        closeAllPopups();
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen, profileAnchor]);

  // Escape key to close popup
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event['key'] === "Escape" && isProfileOpen) {
        console.log("🔒 ProfilePopup: Escape pressed, closing popup");
        closeAllPopups();
      }
    };

    if (isProfileOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isProfileOpen]);

  const value = {
    isProfileOpen,
    setIsProfileOpen,
    profileAnchor,
    setProfileAnchor,
    profilePopupRef,
    closeAllPopups,
    openProfilePopup,
  };

  return (
    <ProfilePopupContext.Provider value={value}>
      {children}
    </ProfilePopupContext.Provider>
  );
}

export function useProfilePopup() {
  const context = useContext(ProfilePopupContext);
  if (!context) {
    throw new Error(
      "useProfilePopup must be used within a ProfilePopupProvider",
    );
  }
  return context;
}
