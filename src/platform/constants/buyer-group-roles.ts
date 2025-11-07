/**
 * Buyer Group Role Constants
 * Based on enterprise sales research and industry best practices
 */

export type BuyerGroupRoleValue = 'decision' | 'champion' | 'stakeholder' | 'blocker' | 'introducer';

export interface BuyerGroupRole {
  value: BuyerGroupRoleValue;
  label: string;
  description: string;
  color: {
    bg: string;
    text: string;
    border: string;
  };
}

/**
 * Buyer Group Role Definitions
 * Matches the BuyerGroupRole enum in Prisma schema
 */
export const BUYER_GROUP_ROLES: readonly BuyerGroupRole[] = [
  {
    value: 'decision',
    label: 'Decision Maker',
    description: 'Has budget authority and final approval power for the purchase',
    color: {
      bg: 'bg-error/10',
      text: 'text-error',
      border: 'border-error',
    },
  },
  {
    value: 'champion',
    label: 'Champion',
    description: 'Internal advocate who actively promotes your solution within the company',
    color: {
      bg: 'bg-success/10',
      text: 'text-success',
      border: 'border-success',
    },
  },
  {
    value: 'stakeholder',
    label: 'Stakeholder',
    description: 'Affected by or influences the purchase decision but lacks final authority',
    color: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      border: 'border-primary',
    },
  },
  {
    value: 'blocker',
    label: 'Blocker',
    description: 'Can prevent or significantly delay the purchase through policy/process control',
    color: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      border: 'border-warning',
    },
  },
  {
    value: 'introducer',
    label: 'Introducer',
    description: 'Has relationships and can facilitate access to decision makers and champions',
    color: {
      bg: 'bg-hover',
      text: 'text-foreground',
      border: 'border-border',
    },
  },
] as const;

/**
 * Get role display label from database value
 */
export function getRoleLabel(roleValue: string | null | undefined): string {
  if (!roleValue) return 'Unknown';
  const role = BUYER_GROUP_ROLES.find(r => r.value === roleValue || r.label === roleValue);
  return role?.label || roleValue;
}

/**
 * Get role database value from display label
 */
export function getRoleValue(roleLabel: string | null | undefined): BuyerGroupRoleValue {
  if (!roleLabel) return 'stakeholder'; // Default to stakeholder
  const role = BUYER_GROUP_ROLES.find(r => r.label === roleLabel || r.value === roleLabel);
  return (role?.value || 'stakeholder') as BuyerGroupRoleValue;
}

/**
 * Get role color classes for badges/pills
 */
export function getRoleColorClasses(roleValue: string | null | undefined): string {
  const role = BUYER_GROUP_ROLES.find(r => r.value === roleValue || r.label === roleValue);
  if (!role) {
    return 'bg-hover text-foreground border border-border';
  }
  return `${role.color.bg} ${role.color.text} border ${role.color.border}`;
}

/**
 * Get role description
 */
export function getRoleDescription(roleValue: string | null | undefined): string {
  const role = BUYER_GROUP_ROLES.find(r => r.value === roleValue || r.label === roleValue);
  return role?.description || 'No description available';
}

/**
 * Role priority for sorting (higher priority = more important)
 */
export const ROLE_PRIORITY: Record<BuyerGroupRoleValue, number> = {
  decision: 1,    // Highest priority
  champion: 2,
  blocker: 3,
  stakeholder: 4,
  introducer: 5,  // Lowest priority
};

/**
 * Get role priority for sorting
 */
export function getRolePriority(roleValue: string | null | undefined): number {
  const value = getRoleValue(roleValue);
  return ROLE_PRIORITY[value] || 999;
}

