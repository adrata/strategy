/**
 * VS Code-Style Theme Picker Modal
 * 
 * Full-featured theme picker with search, real-time preview,
 * keyboard navigation, and comprehensive branding capabilities.
 */

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Search, 
  X, 
  Check, 
  Sun, 
  Moon, 
  Eye,
  Palette,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useTheme } from '@/platform/ui/components/ThemeProvider';
import { allThemes, getThemeById, getThemesByCategory, searchThemes, type Theme, type ThemeCategory } from '@/platform/ui/themes/theme-definitions';
import { getPlatform } from '@/platform/platform-detection';

// ==================== TYPES ====================

interface ThemePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeSelect?: (theme: Theme) => void;
}

interface ThemePreviewCardProps {
  theme: Theme;
  isSelected: boolean;
  isActive: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

// ==================== THEME PREVIEW CARD ====================

const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({
  theme,
  isSelected,
  isActive,
  onClick,
  onKeyDown,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.focus();
    }
  }, [isSelected]);

  const colorSwatches = useMemo(() => [
    theme.colors.background,
    theme.colors.foreground,
    theme.colors.accent,
    theme.colors.border,
    theme.colors.muted,
  ], [theme.colors]);

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      role="button"
      aria-label={`Select ${theme.displayName} theme`}
      aria-pressed={isActive}
      className={`
        relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isActive 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
          : isSelected 
            ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
        }
      `}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Theme name */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          {theme.displayName}
        </h3>
        {theme.metadata.accessibility === 'AAA' && (
          <Sparkles className="w-4 h-4 text-green-500" title="WCAG AAA Accessible" />
        )}
      </div>

      {/* Color swatches */}
      <div className="flex gap-1 mb-3">
        {colorSwatches.map((color, index) => (
          <div
            key={index}
            className="w-6 h-6 rounded border border-gray-200 dark:border-gray-600"
            style={{ backgroundColor: color }}
            title={`Color ${index + 1}: ${color}`}
          />
        ))}
      </div>

      {/* Theme metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="capitalize">{theme.category}</span>
        <span>{theme.metadata.contrastRatio}:1</span>
      </div>

      {/* Description */}
      {theme.metadata.description && (
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
          {theme.metadata.description}
        </p>
      )}

      {/* Tags */}
      {theme.metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {theme.metadata.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== MAIN MODAL COMPONENT ====================

export const ThemePickerModal: React.FC<ThemePickerModalProps> = ({
  isOpen,
  onClose,
  onThemeSelect,
}) => {
  console.log('🎨 ThemePickerModal props - isOpen:', isOpen);
  const { themeMode, setThemeMode, setLightTheme, setDarkTheme, currentTheme, isDarkMode } = useTheme();
  
  // Local state for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory | 'all'>('all');
  const [filteredThemes, setFilteredThemes] = useState<Theme[]>(allThemes);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const themeGridRef = useRef<HTMLDivElement>(null);

  const platform = getPlatform();

  // ==================== SEARCH AND FILTERING ====================

  // Update filtered themes when search or category changes
  useEffect(() => {
    let filtered = allThemes;
    
    if (searchQuery.trim()) {
      filtered = searchThemes(searchQuery);
    } else if (selectedCategory !== 'all') {
      filtered = getThemesByCategory(selectedCategory);
    }
    
    setFilteredThemes(filtered);
  }, [searchQuery, selectedCategory]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
  }, []);

  // ==================== THEME APPLICATION ====================

  const applyTheme = useCallback(async (themeId: string) => {
    try {
      const theme = getThemeById(themeId);
      if (!theme) {
        console.error(`Theme not found: ${themeId}`);
        return;
      }

      // Apply theme based on category
      if (theme.category === 'light') {
        setLightTheme(themeId);
      } else if (theme.category === 'dark') {
        setDarkTheme(themeId);
      }

      onThemeSelect?.(theme);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }, [setLightTheme, setDarkTheme, onThemeSelect]);

  // ==================== KEYBOARD NAVIGATION ====================

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        setIsKeyboardNavigating(true);
        setSelectedIndex(prev => Math.min(prev + 1, filteredThemes.length - 1));
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setIsKeyboardNavigating(true);
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      
      case 'Enter':
        e.preventDefault();
        if (filteredThemes[selectedIndex]) {
          handleThemeSelect(filteredThemes[selectedIndex]);
        }
        break;
      
      case '/':
        if (e.target !== searchInputRef.current) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
        break;
      
      case '1':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          setSelectedCategory('light');
        }
        break;
      
      case '2':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          setSelectedCategory('dark');
        }
        break;
      
      case '3':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          setSelectedCategory('high-contrast');
        }
        break;
      
      case '0':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          setSelectedCategory('all');
        }
        break;
    }
  }, [isOpen, filteredThemes, selectedIndex, onClose, setSelectedCategory]);

  // ==================== THEME SELECTION ====================

      const handleThemeSelect = useCallback(async (theme: Theme) => {
        try {
          await applyTheme(theme.id);
          // Don't close modal automatically - let user browse themes
          console.log(`🎨 Theme applied: ${theme.displayName}`);
        } catch (error) {
          console.error('Failed to apply theme:', error);
        }
      }, [applyTheme]);

  // ==================== SEARCH AND FILTERING ====================

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(0); // Reset selection when searching
  }, []);

      const handleCategoryChange = useCallback(async (category: ThemeCategory | 'all') => {
        setSelectedCategory(category);
        setSelectedIndex(0); // Reset selection when changing category
        
        // If selecting a specific category (not 'all'), apply the first theme in that category
        if (category !== 'all') {
          const categoryThemes = getThemesByCategory(category);
          if (categoryThemes.length > 0) {
            const firstTheme = categoryThemes[0];
            console.log(`🎨 Auto-applying first ${category} theme: ${firstTheme.displayName}`);
            await applyTheme(firstTheme.id);
          }
        }
      }, [applyTheme]);

  // ==================== EFFECTS ====================

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Reset state when modal closes
      setSelectedIndex(0);
      setIsKeyboardNavigating(false);
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  // Keyboard event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown as any);
      return () => document.removeEventListener('keydown', handleKeyDown as any);
    }
  }, [isOpen, handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    if (isKeyboardNavigating && themeGridRef.current) {
      const selectedElement = themeGridRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex, isKeyboardNavigating]);

  // ==================== RENDER ====================

  if (!isOpen) return null;

  console.log('🎨 ThemePickerModal rendering with isOpen:', isOpen);

  const categories = [
    { id: 'all', label: 'All Themes', icon: Palette, count: filteredThemes.length },
    { id: 'light', label: 'Light', icon: Sun, count: filteredThemes.filter(t => t.category === 'light').length },
    { id: 'dark', label: 'Dark', icon: Moon, count: filteredThemes.filter(t => t.category === 'dark').length },
    { id: 'high-contrast', label: 'High Contrast', icon: Eye, count: filteredThemes.filter(t => t.category === 'high-contrast').length },
  ] as const;

      return (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
        <div
          ref={modalRef}
          className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          role="dialog"
          aria-labelledby="theme-picker-title"
          aria-describedby="theme-picker-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 id="theme-picker-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Choose Theme
              </h2>
              <p id="theme-picker-description" className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select a theme to customize your workspace appearance
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close theme picker"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search and Categories */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search themes..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                aria-label="Search themes"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id as ThemeCategory | 'all')}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                      ${isActive 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {category.label}
                    <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
                      {category.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Grid */}
          <div className="p-6">
            {filteredThemes.length === 0 ? (
              <div className="text-center py-12">
                <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No themes found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or category filter
                </p>
              </div>
            ) : (
              <div
                ref={themeGridRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto"
              >
                {filteredThemes.map((theme, index) => (
                  <ThemePreviewCard
                    key={theme.id}
                    theme={theme}
                    isSelected={index === selectedIndex && isKeyboardNavigating}
                    isActive={currentTheme === theme.id}
                    onClick={() => handleThemeSelect(theme)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleThemeSelect(theme);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>Use ↑↓ to navigate</span>
                <span>Press Enter to select</span>
                <span>Press Esc to close</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Current: {getThemeById(currentTheme)?.displayName || 'Default'}</span>
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                  {themeMode}
                </span>
              </div>
            </div>
              </div>
            </div>
        </div>
      );
};

export default ThemePickerModal;
