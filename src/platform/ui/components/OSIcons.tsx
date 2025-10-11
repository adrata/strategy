/**
 * OS-specific icon components
 * Using react-icons Font Awesome icons for better quality and recognition
 */

import React from 'react';
import { FaWindows, FaApple, FaLinux } from 'react-icons/fa';

interface IconProps {
  className?: string;
}

export const WindowsIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <FaWindows className={className} />
);

export const AppleIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <FaApple className={className} />
);

export const LinuxIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <FaLinux className={className} />
);
