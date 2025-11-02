/**
 * 🎯 ACTION MENU COMPONENT
 * 
 * Reusable three-dot menu component for table rows and cards
 * Provides context-aware actions for different record types
 */

import React, { useState, useRef, useEffect } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  DocumentDuplicateIcon,
  PhoneIcon,
  ClockIcon,
  StarIcon,
  ArrowTopRightOnSquareIcon,
  UserPlusIcon,
  ChartBarIcon,
  BoltIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Bars3Icon,
  CheckIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'warning' | 'complete';
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
}

export interface ActionMenuProps {
  record: any;
  recordType: 'lead' | 'opportunity' | 'prospect' | 'speedrun' | 'person' | 'company';
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
  onView?: (record: any) => void;
  onDuplicate?: (record: any) => void;
  onCall?: (record: any) => void;
  onSchedule?: (record: any) => void;
  onFavorite?: (record: any) => void;
  onOpenExternal?: (record: any) => void;
  onConvert?: (record: any) => void;
  onAnalyze?: (record: any) => void;
  onQuickAction?: (record: any, actionType: string) => void;
  onMoveUp?: (record: any) => void;
  onMoveDown?: (record: any) => void;
  onMoveToTop?: (record: any) => void;
  onMoveToBottom?: (record: any) => void;
  onAddAction?: (record: any) => void;
  onMarkComplete?: (record: any) => void;
  customActions?: ActionMenuItem[];
  className?: string;
  isFirst?: boolean;
  isLast?: boolean;
  currentIndex?: number;
  totalCount?: number;
}

export function ActionMenu({
  record,
  recordType,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onCall,
  onSchedule,
  onFavorite,
  onOpenExternal,
  onConvert,
  onAnalyze,
  onQuickAction,
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  onMoveToBottom,
  onAddAction,
  onMarkComplete,
  customActions = [],
  className = '',
  isFirst = false,
  isLast = false,
  currentIndex = 0,
  totalCount = 0
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef['current'] && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Generate context-aware actions based on record type
  const generateActions = (): ActionMenuItem[] => {
    const actions: ActionMenuItem[] = [];

    // Common actions for all record types
    if (onView) {
      actions.push({
        id: 'view',
        label: 'View Full Record',
        icon: EyeIcon,
        action: () => {
          // Always use the onView callback - let the parent component handle navigation
          // This ensures consistent behavior and proper Next.js routing
          onView(record);
          setIsOpen(false);
        },
        shortcut: undefined
      });
    }

    // Edit functionality removed per user request

    // Communication actions for people
    if (['lead', 'prospect', 'speedrun', 'person'].includes(recordType)) {
      if (record['phone'] && onCall) {
        actions.push({
          id: 'call',
          label: 'Call',
          icon: PhoneIcon,
          action: () => {
            onCall(record);
            setIsOpen(false);
          },
          variant: 'primary',
          shortcut: '⌘D'
        });
      }



      if (onSchedule) {
        actions.push({
          id: 'schedule',
          label: 'Schedule Follow-up',
          icon: ClockIcon,
          action: () => {
            onSchedule(record);
            setIsOpen(false);
          }
        });
      }

      // Add Action functionality
      if (onAddAction) {
        actions.push({
          id: 'add_action',
          label: 'Add Action',
          icon: PlusIcon,
          action: () => {
            onAddAction(record);
            setIsOpen(false);
          },
          variant: 'primary'
        });
      }

      // Mark as Complete functionality removed - using green Complete button in header instead
    }

    // Record type specific actions
    switch (recordType) {
      case 'lead':
        if (onConvert) {
          actions.push({
            id: 'convert',
            label: 'Create Opportunity',
            icon: ArrowTopRightOnSquareIcon,
            action: () => {
              onConvert(record);
              setIsOpen(false);
            },
            variant: 'primary'
          });
        }
        
        if (onQuickAction) {
          actions.push({
            id: 'qualify',
            label: 'Mark as Qualified',
            icon: StarIcon,
            action: () => {
              onQuickAction(record, 'qualify');
              setIsOpen(false);
            }
          });
        }
        break;

      case 'prospect':
        if (onConvert) {
          actions.push({
            id: 'convert_to_lead',
            label: 'Convert to Lead',
            icon: ArrowTopRightOnSquareIcon,
            action: () => {
              onConvert(record);
              setIsOpen(false);
            },
            variant: 'primary'
          });
        }

        if (onQuickAction) {
          actions.push({
            id: 'complete',
            label: 'Mark as Complete',
            icon: CheckIcon,
            action: () => {
              onQuickAction(record, 'complete');
              setIsOpen(false);
            },
            variant: 'complete'
          });

          actions.push({
            id: 'snooze',
            label: 'Snooze',
            icon: ClockIcon,
            action: () => {
              onQuickAction(record, 'snooze');
              setIsOpen(false);
            },
            variant: 'warning'
          });
        }
        break;

      case 'speedrun':
        // Custom order for speedrun: Mark as Complete, Snooze, Update
        
        // 1. Mark as Done first (regular color)
        if (onQuickAction) {
          actions.push({
            id: 'complete',
            label: 'Mark as Done',
            icon: CheckIcon,
            action: () => {
              onQuickAction(record, 'complete');
              setIsOpen(false);
            }
            // No variant = default gray color (not green)
          });
        }

        // 2. Add Note (new action)
        if (onAddAction) {
          actions.push({
            id: 'add_note',
            label: 'Add Note',
            icon: PencilIcon,
            action: () => {
              onAddAction(record);
              setIsOpen(false);
            }
            // No variant = default gray color
          });
        }

        // 3. Edit (regular gray color)
        if (onEdit) {
          actions.push({
            id: 'edit',
            label: 'Edit',
            icon: PencilIcon,
            action: () => {
              onEdit(record);
              setIsOpen(false);
            }
            // No variant = default gray color
          });
        }
        break;

      case 'opportunity':
        if (onAnalyze) {
          actions.push({
            id: 'analyze',
            label: 'Analyze Opportunity',
            icon: ChartBarIcon,
            action: () => {
              onAnalyze(record);
              setIsOpen(false);
            }
          });
        }

        if (onQuickAction) {
          actions.push({
            id: 'advance_stage',
            label: 'Advance Stage',
            icon: ArrowTopRightOnSquareIcon,
            action: () => {
              onQuickAction(record, 'advance_stage');
              setIsOpen(false);
            },
            variant: 'primary'
          });
        }
        break;
    }

    // Add move actions for reordering (only if handlers are provided)
    if (onMoveUp || onMoveDown || onMoveToTop || onMoveToBottom) {
      // Add separator before move actions
      if (actions.length > 0) {
        actions.push({
          id: 'separator-move',
          label: '',
          icon: () => null,
          action: () => {},
          separator: true
        });
      }

      // Move to top (only if not first)
      if (onMoveToTop && !isFirst && totalCount > 2) {
        actions.push({
          id: 'move_to_top',
          label: 'Move to Top',
          icon: ArrowUpIcon,
          action: () => {
            onMoveToTop(record);
            setIsOpen(false);
          }
        });
      }

      // Move up (only if not first)
      if (onMoveUp && !isFirst) {
        actions.push({
          id: 'move_up',
          label: 'Move Up',
          icon: ArrowUpIcon,
          action: () => {
            onMoveUp(record);
            setIsOpen(false);
          }
        });
      }

      // Move down (only if not last)
      if (onMoveDown && !isLast) {
        actions.push({
          id: 'move_down',
          label: 'Move Down',
          icon: ArrowDownIcon,
          action: () => {
            onMoveDown(record);
            setIsOpen(false);
          }
        });
      }

      // Move to bottom (only if not last)
      if (onMoveToBottom && !isLast && totalCount > 2) {
        actions.push({
          id: 'move_to_bottom',
          label: 'Move to Bottom',
          icon: ArrowDownIcon,
          action: () => {
            onMoveToBottom(record);
            setIsOpen(false);
          }
        });
      }
    }

    // Separator before utility actions
    if (actions.length > 0) {
      actions.push({
        id: 'separator-1',
        label: '',
        icon: () => null,
        action: () => {},
        separator: true
      });
    }

    // Utility actions
    if (onDuplicate) {
      actions.push({
        id: 'duplicate',
        label: 'Duplicate',
        icon: DocumentDuplicateIcon,
        action: () => {
          onDuplicate(record);
          setIsOpen(false);
        }
      });
    }

    if (onFavorite) {
      actions.push({
        id: 'favorite',
        label: record.isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
        icon: StarIcon,
        action: () => {
          onFavorite(record);
          setIsOpen(false);
        }
      });
    }

    if (record['linkedin'] && onOpenExternal) {
      actions.push({
        id: 'linkedin',
        label: 'Open LinkedIn',
        icon: ArrowTopRightOnSquareIcon,
        action: () => {
          onOpenExternal(record);
          setIsOpen(false);
        }
      });
    }

    // Add custom actions
    if (customActions.length > 0) {
      actions.push({
        id: 'separator-2',
        label: '',
        icon: () => null,
        action: () => {},
        separator: true
      });
      actions.push(...customActions);
    }

    // Separator before delete
    if (onDelete) {
      actions.push({
        id: 'separator-3',
        label: '',
        icon: () => null,
        action: () => {},
        separator: true
      });

      actions.push({
        id: 'delete',
        label: 'Delete',
        icon: TrashIcon,
        action: () => {
          onDelete(record);
          setIsOpen(false);
        },
        variant: 'danger'
      });
    }

    return actions;
  };

  const actions = generateActions();

  const getActionVariantClasses = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'text-red-600 hover:bg-red-50 hover:text-red-700';
      case 'danger':
        return 'text-red-600 hover:bg-red-50 hover:text-red-700';
      case 'warning':
        return 'text-orange-600 hover:bg-orange-50 hover:text-orange-700';
      case 'complete':
        return 'text-green-600 hover:bg-green-50 hover:text-green-700';
      default:
        return 'text-gray-700 hover:bg-panel-background hover:text-foreground';
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative z-10 ${className}`} ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={handleMenuClick}
        className="p-1 rounded-md hover:bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 cursor-pointer"
        title="More actions"
      >
        <EllipsisVerticalIcon className="w-5 h-5 text-muted" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-background rounded-md shadow-lg border border-border z-[9999] py-1 opacity-100">
          {actions.map((action) => {
            if (action.separator) {
              return (
                <div
                  key={action.id}
                  className="border-t border-border my-1"
                />
              );
            }

            const IconComponent = action.icon;
            
            return (
              <button
                key={action.id}
                onClick={action.action}
                disabled={action.disabled}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
                  action.disabled 
                    ? 'text-muted cursor-not-allowed' 
                    : getActionVariantClasses(action.variant)
                }`}
              >
                <IconComponent className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{action.label}</span>
                {action['shortcut'] && (
                  <span className="text-xs text-muted font-mono">
                    {action.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
