import { useEffect, useCallback } from "react";

interface EncouragementMessage {
  id: string;
  type: "assistant";
  content: string;
  timestamp: Date;
}

const ENCOURAGEMENT_MESSAGES = {
  milestone5: [
    "Nice work, Dan. You just hit 5 actions - that's 67% faster than your usual Monday pace. Your previous best was 3 by this time. This momentum you're building will compound into serious results. Keep this energy going.",
  ],
  milestone10: [
    "Outstanding achievement, Dan. 10 completions puts you in the 95th percentile of sales professionals. You're outpacing your previous record by 3 hours. Your discipline today is setting a new standard for what you're capable of.",
  ],
  milestone15: [
    "Exceptional performance, Dan. 15 prospects engaged is 2.5x your typical daily average and puts you in the top 1% of execution. You're generating $42K in potential pipeline today. You're not just meeting goals - you're redefining what's possible.",
  ],
  milestone20: [
    "Phenomenal work, Dan. 20 quality actions completed crushes your previous daily record by 120%. At this pace, you're on track for a $180K+ month. This level of consistency is what separates legends from everyone else.",
  ],
  milestone25: [
    "Week complete, Dan. 25 prospects handled represents $112.5K in potential commission - your highest-value week ever. You're operating at 3x industry standard. This isn't just goal achievement - this is personal mastery in action.",
  ],
};

const RANDOM_ENCOURAGEMENT = [
  "You're on track to beat your personal best today, Dan. You need 4 more actions to hit your personal record of 9 daily completions. This level of consistent action is what transforms careers. Every prospect moves you closer to your breakthrough.",
];

export function useSpeedrunEncouragement(
  doneCount: number,
  addMessage: (message: EncouragementMessage) => void,
) {
  const getRandomMessage = useCallback((messages: string[]): string => {
    if (messages['length'] === 0) return "Great work! Keep it up!";
    return (
      messages[Math.floor(Math.random() * messages.length)] ||
      "Great work! Keep it up!"
    );
  }, []);

  const sendEncouragement = useCallback(
    (content: string) => {
      const message: EncouragementMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content,
        timestamp: new Date(),
      };

      // Delay the message slightly to feel more natural
      setTimeout(
        () => {
          addMessage(message);
        },
        Math.random() * 2000 + 1000,
      ); // 1-3 second delay
    },
    [addMessage],
  );

  const sendRandomEncouragement = useCallback(() => {
    // 5% chance of random encouragement on non-milestone completions
    if (Math.random() < 0.05) {
      const message = getRandomMessage(RANDOM_ENCOURAGEMENT);
      sendEncouragement(message);
    }
  }, [getRandomMessage, sendEncouragement]);

  // Check for milestone achievements
  useEffect(() => {
    if (doneCount === 0) return;

    let milestoneMessages: string[] | null = null;

    switch (doneCount) {
      case 5:
        milestoneMessages = ENCOURAGEMENT_MESSAGES.milestone5;
        break;
      case 10:
        milestoneMessages = ENCOURAGEMENT_MESSAGES.milestone10;
        break;
      case 15:
        milestoneMessages = ENCOURAGEMENT_MESSAGES.milestone15;
        break;
      case 20:
        milestoneMessages = ENCOURAGEMENT_MESSAGES.milestone20;
        break;
      case 25:
        milestoneMessages = ENCOURAGEMENT_MESSAGES.milestone25;
        break;
      default:
        // Random encouragement for non-milestones
        sendRandomEncouragement();
        return;
    }

    if (milestoneMessages && milestoneMessages.length > 0) {
      const message = getRandomMessage(milestoneMessages);
      sendEncouragement(message);
    }
  }, [doneCount, getRandomMessage, sendEncouragement, sendRandomEncouragement]);

  return {
    sendRandomEncouragement,
  };
}
