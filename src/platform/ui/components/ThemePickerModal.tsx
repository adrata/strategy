/**
 * VS Code-Style Theme Picker Modal
 * 
 * Full-featured theme picker with search, real-time preview,
 * keyboard navigation, and comprehensive branding capabilities.
 */

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  X, 
  Check, 
  Sun, 
  Moon, 
  Eye,
  Palette,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/platform/ui/components/ThemeProvider';
import { allThemes, getThemeById, getThemesByCategory, type Theme, type ThemeCategory } from '@/platform/ui/themes/theme-definitions';
import { themeApplier } from '@/platform/ui/themes/theme-applier-2025';
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
        group relative p-4 rounded-lg border cursor-pointer transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2
        ${isActive 
          ? 'border-[var(--accent)]/60 bg-[var(--accent)]/3 shadow-sm' 
          : isSelected 
            ? 'border-[var(--border)] bg-[var(--panel-background)] shadow-sm' 
            : 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--hover)] hover:shadow-sm'
        }
      `}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent)] rounded-full flex items-center justify-center shadow-sm">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Theme name and accessibility badge */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm text-[var(--foreground)]">
          {theme.displayName}
        </h3>
        {theme.metadata.accessibility === 'AAA' && (
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" title="WCAG AAA Accessible" />
        )}
      </div>

      {/* Color swatches */}
      <div className="flex gap-1.5 mb-3">
        {colorSwatches.map((color, index) => (
          <div
            key={index}
            className="w-5 h-5 rounded-sm shadow-sm"
            style={{ backgroundColor: color }}
            title={`Color ${index + 1}: ${color}`}
          />
        ))}
      </div>

      {/* Theme metadata */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-2">
        <span className="capitalize font-medium">{theme.category}</span>
        <span className="text-[var(--muted)]">{theme.metadata.contrastRatio}:1</span>
      </div>

      {/* Description */}
      {theme.metadata.description && (
        <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-2">
          {theme.metadata.description}
        </p>
      )}

      {/* Tags */}
      {theme.metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {theme.metadata.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-[var(--hover)] text-[var(--muted)] rounded-md font-medium"
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
  
  // Local state for filtering
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory | 'all'>('all');
  const [filteredThemes, setFilteredThemes] = useState<Theme[]>(allThemes);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const themeGridRef = useRef<HTMLDivElement>(null);

  const platform = getPlatform();

  // ==================== FILTERING ====================

  // Update filtered themes when category changes
  useEffect(() => {
    let filtered = allThemes;
    
    if (selectedCategory !== 'all') {
      filtered = getThemesByCategory(selectedCategory);
    }
    
    setFilteredThemes(filtered);
  }, [selectedCategory]);

  // ==================== THEME APPLICATION ====================

  const applyTheme = useCallback(async (themeId: string) => {
    try {
      const theme = getThemeById(themeId);
      if (!theme) {
        console.error(`Theme not found: ${themeId}`);
        return;
      }

      // Apply theme using 2025 theme applier
      const success = await themeApplier.applyTheme(themeId, {
        enableTransitions: true,
        transitionDuration: 200,
        persistToStorage: false, // ThemeProvider handles persistence
        updateSystemTheme: true
      });

      if (success) {
        // Update ThemeProvider state
        if (theme.category === 'light') {
          setLightTheme(themeId);
        } else if (theme.category === 'dark') {
          setDarkTheme(themeId);
        }

        onThemeSelect?.(theme);
        console.log(`🎨 Theme applied successfully: ${theme.displayName}`);
      } else {
        console.error('Failed to apply theme using theme applier');
      }
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

  // ==================== FILTERING ====================

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
      // Focus modal when it opens
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      // Reset state when modal closes
      setSelectedIndex(0);
      setIsKeyboardNavigating(false);
      setSelectedCategory('all');
    }
  }, [isOpen]);

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
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="w-full max-w-5xl bg-[var(--background)] rounded-lg shadow-lg border border-[var(--border)] overflow-hidden"
          role="dialog"
          aria-labelledby="theme-picker-title"
          aria-describedby="theme-picker-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
            <div>
              <h2 id="theme-picker-title" className="text-lg font-semibold text-[var(--foreground)]">
                Choose Theme
              </h2>
              <p id="theme-picker-description" className="text-sm text-[var(--muted)] mt-1">
                Select a theme to customize your workspace appearance
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--hover)] rounded-md transition-colors"
              aria-label="Close theme picker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Categories */}
          <div className="px-6 py-4 border-b border-[var(--border)]">
            {/* Category Tabs */}
            <div className="flex gap-1 overflow-x-auto">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id as ThemeCategory | 'all')}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors
                      ${isActive 
                        ? 'bg-[var(--accent)] text-white' 
                        : 'text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--foreground)]'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {category.label}
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-[var(--loading-bg)] text-[var(--muted)]'
                    }`}>
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
                <Palette className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                  No themes found
                </h3>
                <p className="text-[var(--muted)]">
                  Try adjusting your search or category filter
                </p>
              </div>
            ) : (
              <div
                ref={themeGridRef}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[32rem] overflow-y-auto pr-2"
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
          <div className="px-6 py-4 bg-[var(--panel-background)] border-t border-[var(--border)]">
            <div className="flex items-center justify-between text-sm text-[var(--muted)]">
              <div className="flex items-center gap-4">
                <span>Use ↑↓ to navigate</span>
                <span>Press Enter to select</span>
                <span>Press Esc to close</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Current: {getThemeById(currentTheme)?.displayName || 'Default'}</span>
                <span className="px-2 py-1 bg-[var(--loading-bg)] rounded text-xs">
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
