"use client";

/**
 * Ship Button Component
 * 
 * Button that shows release notes modal when there are items in the shipped column
 */

import React, { useState, useEffect } from 'react';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { ReleaseNotesModal } from './ReleaseNotesModal';

export function ShipButton() {
  const { ui } = useRevenueOS();
  const [shippedCount, setShippedCount] = useState(0);
  const [shippedItems, setShippedItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchShippedItems = async () => {
      if (!ui.activeWorkspace?.id) {
        setShippedCount(0);
        setShippedItems([]);
        return;
      }

      try {
        const response = await fetch(`/api/v1/stacks/stories?workspaceId=${ui.activeWorkspace.id}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const allStories = data.stories || [];
          // Filter for shipped items
          const shipped = allStories.filter((story: any) => story.status === 'shipped');
          setShippedCount(shipped.length);
          setShippedItems(shipped);
        }
      } catch (error) {
        console.error('Failed to fetch shipped items:', error);
      }
    };

    fetchShippedItems();
    // Poll every 30 seconds to check for new shipped items
    const interval = setInterval(fetchShippedItems, 30000);
    return () => clearInterval(interval);
  }, [ui.activeWorkspace?.id]);

  const handleShip = () => {
    if (shippedCount > 0) {
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleShipComplete = async (releaseNotes: {
    title: string;
    version: string;
    notes: string;
    items: string[];
  }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/stacks/releases', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: ui.activeWorkspace?.id,
          releaseNotes,
          shippedItemIds: shippedItems.map(item => item.id)
        }),
      });

      if (response.ok) {
        // Clear shipped items by moving them to archive or deleting
        // Refresh the shipped count
        setShippedCount(0);
        setShippedItems([]);
        setShowModal(false);
        // Refresh the page or trigger a refetch
        window.location.reload();
      } else {
        console.error('Failed to save release notes');
        alert('Failed to save release notes. Please try again.');
      }
    } catch (error) {
      console.error('Error saving release notes:', error);
      alert('Error saving release notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (shippedCount === 0) {
    return null; // Don't show button if no shipped items
  }

  return (
    <>
      <button
        onClick={handleShip}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white border border-blue-700 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RocketLaunchIcon className="h-4 w-4" />
        Ship ({shippedCount})
      </button>
      
      {showModal && (
        <ReleaseNotesModal
          isOpen={showModal}
          onClose={handleModalClose}
          onSave={handleShipComplete}
          shippedItems={shippedItems}
        />
      )}
    </>
  );
}

