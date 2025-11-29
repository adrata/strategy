import React, { useEffect } from 'react';
import { getCategoryColors } from '@/platform/config/color-palette';

interface SuccessMessageProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
  section?: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  isVisible,
  onClose,
  duration = 3000,
  type = 'success',
  section,
}) => {
  useEffect(() => {
    if (isVisible) {
      console.log('🎉 [SuccessMessage] Message is visible:', { message, type, section });
      const timer = setTimeout(() => {
        console.log('🎉 [SuccessMessage] Auto-closing message after', duration, 'ms');
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose, message, type, section]);

  if (!isVisible) {
    console.log('🎉 [SuccessMessage] Message not visible, returning null');
    return null;
  }

  console.log('🎉 [SuccessMessage] Rendering message:', { message, type, section });

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
          icon: 'text-red-500 dark:text-red-400',
          closeButton: 'text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
          iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
          icon: 'text-yellow-500 dark:text-yellow-400',
          closeButton: 'text-yellow-500 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300',
          iconPath: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
        };
      case 'info':
        return {
          container: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
          icon: 'text-blue-500 dark:text-blue-400',
          closeButton: 'text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
          iconPath: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
        };
      default: // success
        if (section && type === 'success') {
          const colors = getCategoryColors(section);
          return {
            container: `bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300`,
            icon: `text-green-600 dark:text-green-400`,
            closeButton: `text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300`,
            iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
          };
        }
        return {
          container: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300',
          icon: 'text-green-600 dark:text-green-400',
          closeButton: 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300',
          iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] bg-background border border-border rounded-lg shadow-lg px-4 py-2">
      <div className={`${styles.container} border px-4 py-3 rounded-lg flex items-center justify-between`}>
        <div className="flex items-center">
          <svg className={`w-5 h-5 ${styles.icon} mr-2`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d={styles.iconPath} clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className={styles.closeButton}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};
