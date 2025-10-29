import React from 'react';
import { Button } from '@/platform/ui/components/button';
import { X } from 'lucide-react';

interface CompletionBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptBonus: () => void;
  onDeclineBonus: () => void;
  completedCount: number;
}

export function CompletionBonusModal({
  isOpen,
  onClose,
  onAcceptBonus,
  onDeclineBonus,
  completedCount
}: CompletionBonusModalProps) {
  if (!isOpen) return null;

  const handleAccept = () => {
    onAcceptBonus();
    onClose();
  };

  const handleDecline = () => {
    onDeclineBonus();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Celebration emoji */}
          <div className="text-6xl mb-4">🎉</div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Congratulations!
          </h2>
          
          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-6">
            You completed your Speedrun!
          </p>
          
          {/* Stats */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold">
              You contacted {completedCount} people today!
            </p>
            <p className="text-green-600 text-sm mt-1">
              That's an amazing achievement! 🚀
            </p>
          </div>
          
          {/* Question */}
          <p className="text-gray-700 mb-6">
            Want to keep the momentum going with 10 more?
          </p>
          
          {/* Action buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleDecline}
              variant="outline"
              className="px-6 py-2"
            >
              No, I'm done for today
            </Button>
            <Button
              onClick={handleAccept}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white"
            >
              Yes, load 10 more!
            </Button>
          </div>
          
          {/* Bonus round info */}
          <p className="text-xs text-gray-500 mt-4">
            Bonus round will load your next 10 highest priority people
          </p>
        </div>
      </div>
    </div>
  );
}
