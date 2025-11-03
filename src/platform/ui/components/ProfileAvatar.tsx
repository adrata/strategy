import React from 'react';
import Image from 'next/image';

interface ProfileAvatarProps {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePictureUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showAsMe?: boolean;
  currentUserId?: string;
  userId?: string;
}

export function ProfileAvatar({
  name,
  firstName,
  lastName,
  email,
  profilePictureUrl,
  size = 'md',
  className = '',
  showAsMe = false,
  currentUserId,
  userId,
}: ProfileAvatarProps) {
  // Generate initials from available name data
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (name) {
      const nameParts = name.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
      }
      return name.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-6 h-6',
      text: 'text-xs',
      image: 'w-6 h-6'
    },
    md: {
      container: 'w-8 h-8',
      text: 'text-sm',
      image: 'w-8 h-8'
    },
    lg: {
      container: 'w-10 h-10',
      text: 'text-base',
      image: 'w-10 h-10'
    }
  };

  const config = sizeConfig[size];
  const initials = getInitials();

  // Generate background color based on name/email for consistency
  const getBackgroundColor = () => {
    // Check if this is the current user
    const isCurrentUser = showAsMe && currentUserId && userId && currentUserId === userId;
    
    if (isCurrentUser) {
      return 'bg-primary'; // Primary color for current user
    }
    
    // Muted background for others
    return 'bg-muted-light';
  };

  return (
    <div className={`${config.container} ${className} relative`}>
      {profilePictureUrl && profilePictureUrl !== '' ? (
        <div className={`${config.container} rounded-full overflow-hidden bg-muted-light`}>
          <Image
            src={profilePictureUrl}
            alt={name || 'Profile'}
            width={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
            height={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
            className={`${config.image} object-cover`}
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const bgColor = isCurrentUser ? 'bg-primary' : 'bg-muted-light';
                const textColor = isCurrentUser ? 'text-white' : 'text-foreground';
                parent.innerHTML = `
                  <div class="${config.container} ${bgColor} rounded-full flex items-center justify-center ${textColor} ${config.text} font-semibold">
                    ${initials}
                  </div>
                `;
              }
            }}
          />
        </div>
      ) : (
        <div className={`${config.container} ${getBackgroundColor()} rounded-full flex items-center justify-center ${showAsMe && currentUserId && userId && currentUserId === userId ? 'text-white' : 'text-foreground'} ${config.text} font-semibold`}>
          {initials}
        </div>
      )}
    </div>
  );
}

// Helper component for displaying multiple avatars (useful for co-sellers)
interface ProfileAvatarGroupProps {
  users: Array<{
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profilePictureUrl?: string;
    userId?: string;
  }>;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showAsMe?: boolean;
  currentUserId?: string;
}

export function ProfileAvatarGroup({
  users,
  maxVisible = 3,
  size = 'sm',
  className = '',
  showAsMe = false,
  currentUserId,
}: ProfileAvatarGroupProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-1">
        {visibleUsers.map((user, index) => (
          <div key={index} className="relative">
            <ProfileAvatar
              name={user.name}
              firstName={user.firstName}
              lastName={user.lastName}
              email={user.email}
              profilePictureUrl={user.profilePictureUrl}
              size={size}
              className="ring-2 ring-border"
              showAsMe={showAsMe}
              currentUserId={currentUserId}
              userId={user.userId}
            />
          </div>
        ))}
      </div>
      {remainingCount > 0 && (
        <div className={`ml-2 text-xs text-muted font-medium`}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
