"use client";

import React from 'react';
import { ActionCard } from './ActionCard';

interface EntityActionsProps {
  entityType: 'buyer-group' | 'company' | 'person' | 'role';
  onActionSelect: (action: string) => void;
  activeAction?: string;
}

export const EntityActions: React.FC<EntityActionsProps> = ({
  entityType,
  onActionSelect,
  activeAction
}) => {
  const getActions = () => {
    switch (entityType) {
      case 'buyer-group':
        return [
          {
            id: 'find',
            title: 'Find a Buyer Group',
            description: 'Discover new buying committees you don\'t know about',
            color: 'bg-blue-500'
          },
          {
            id: 'enrich',
            title: 'Enrich a Buyer Group',
            description: 'Add intelligence layers to existing buyer groups',
            color: 'bg-green-500'
          },
          {
            id: 'update',
            title: 'Update a Buyer Group',
            description: 'Keep buyer group data current and accurate',
            color: 'bg-orange-500'
          },
          {
            id: 'enlighten',
            title: 'Enlighten Buyer Group',
            description: 'Complete buyer group intelligence workflow - discover, enrich, and monitor',
            color: 'bg-purple-500'
          },
          {
            id: 'monitor',
            title: 'Monitor Buyer Groups',
            description: 'Continuous real-time tracking of buyer groups',
            color: 'bg-cyan-500'
          }
        ];
      
      case 'company':
        return [
          {
            id: 'find',
            title: 'Find a Company',
            description: 'Discover new companies you don\'t know about',
            color: 'bg-blue-500'
          },
          {
            id: 'enrich',
            title: 'Enrich a Company',
            description: 'Add intelligence layers to existing companies',
            color: 'bg-green-500'
          },
          {
            id: 'update',
            title: 'Update a Company',
            description: 'Keep company data current and accurate',
            color: 'bg-orange-500'
          },
          {
            id: 'enlighten',
            title: 'Enlighten Company',
            description: 'Complete company intelligence workflow - discover, enrich, and monitor',
            color: 'bg-purple-500'
          },
          {
            id: 'monitor',
            title: 'Monitor Companies',
            description: 'Continuous real-time tracking of companies',
            color: 'bg-cyan-500'
          }
        ];
      
      case 'person':
        return [
          {
            id: 'find',
            title: 'Find a Person',
            description: 'Discover new contacts you don\'t know about',
            color: 'bg-blue-500'
          },
          {
            id: 'enrich',
            title: 'Enrich a Person',
            description: 'Add intelligence layers to existing contacts',
            color: 'bg-green-500'
          },
          {
            id: 'update',
            title: 'Update a Person',
            description: 'Keep contact data current and accurate',
            color: 'bg-orange-500'
          },
          {
            id: 'enlighten',
            title: 'Enlighten Person',
            description: 'Complete person intelligence workflow - discover, enrich, and monitor',
            color: 'bg-purple-500'
          },
          {
            id: 'monitor',
            title: 'Monitor People',
            description: 'Continuous real-time tracking of people',
            color: 'bg-cyan-500'
          }
        ];
      
      case 'role':
        return [
          {
            id: 'find',
            title: 'Find a Role',
            description: 'Discover new roles you don\'t know about',
            color: 'bg-blue-500'
          },
          {
            id: 'enrich',
            title: 'Enrich a Role',
            description: 'Add intelligence layers to existing roles',
            color: 'bg-green-500'
          },
          {
            id: 'update',
            title: 'Update a Role',
            description: 'Keep role data current and accurate',
            color: 'bg-orange-500'
          },
          {
            id: 'enlighten',
            title: 'Enlighten Role',
            description: 'Complete role intelligence workflow - discover, enrich, and monitor',
            color: 'bg-purple-500'
          },
          {
            id: 'monitor',
            title: 'Monitor Roles',
            description: 'Continuous real-time tracking of roles',
            color: 'bg-cyan-500'
          }
        ];
      
      default:
        return [];
    }
  };

  const actions = getActions();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {actions.map((action) => (
        <ActionCard
          key={action.id}
          title={action.title}
          description={action.description}
          color={action.color}
          onClick={() => onActionSelect(action.id)}
          isActive={activeAction === action.id}
        />
      ))}
    </div>
  );
};
