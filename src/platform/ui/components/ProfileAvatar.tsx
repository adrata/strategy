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
}

export function ProfileAvatar({
  name,
  firstName,
  lastName,
  email,
  profilePictureUrl,
  size = 'md',
  className = '',
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
    const seed = name || email || 'default';
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ];
    
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`${config.container} ${className} relative`}>
      {profilePictureUrl && profilePictureUrl !== '' ? (
        <div className={`${config.container} rounded-full overflow-hidden bg-gray-200`}>
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
                parent.innerHTML = `
                  <div class="${config.container} ${getBackgroundColor()} rounded-full flex items-center justify-center text-white ${config.text} font-semibold">
                    ${initials}
                  </div>
                `;
              }
            }}
          />
        </div>
      ) : (
        <div className={`${config.container} ${getBackgroundColor()} rounded-full flex items-center justify-center text-white ${config.text} font-semibold`}>
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
  }>;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProfileAvatarGroup({
  users,
  maxVisible = 3,
  size = 'sm',
  className = '',
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
              className="ring-2 ring-white"
            />
          </div>
        ))}
      </div>
      {remainingCount > 0 && (
        <div className={`ml-2 text-xs text-gray-500 font-medium`}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
