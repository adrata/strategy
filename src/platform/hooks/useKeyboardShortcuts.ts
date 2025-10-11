"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceNavigation } from "./useWorkspaceNavigation";
import {
  ALL_SHORTCUTS,
  type KeyboardShortcut,
} from "@/platform/keyboard-shortcuts/shortcuts";

interface UseKeyboardShortcutsOptions {
  onToggleRightPanel?: () => void;
  onToggleLeftPanel?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenQuickSearch?: () => void;
  onToggleAI?: () => void;
  context?:
    | "global"
    | "text-editor"
    | "dashboard"
    | "modal"
    | "command-palette"
    | "chat"
    | "canvas";
}

export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions = {},
) {
  const router = useRouter();
  const { navigateToAOS, navigateToMonaco } = useWorkspaceNavigation();
  const {
    onToggleRightPanel,
    onToggleLeftPanel,
    onOpenCommandPalette,
    onOpenQuickSearch,
    onToggleAI,
    context = "global",
  } = options;

  const handleShortcut = useCallback(
    (shortcut: KeyboardShortcut) => {
      // Track usage
      if (typeof window !== "undefined") {
        const used = JSON.parse(
          localStorage.getItem("adrata-used-shortcuts") || "[]",
        );
        if (!used.includes(shortcut.id)) {
          used.push(shortcut.id);
          localStorage.setItem("adrata-used-shortcuts", JSON.stringify(used));
        }
      }

      // Execute action
      switch (shortcut.action) {
        case "open-command-palette":
          onOpenCommandPalette?.();
          break;
        case "open-quick-search":
          onOpenQuickSearch?.();
          break;
        case "toggle-ai-assistant":
          onToggleAI?.();
          break;
        case "toggle-left-panel":
          onToggleLeftPanel?.();
          break;
        case "toggle-right-panel":
          onToggleRightPanel?.();
          break;
        case "zoom-in":
          // Handled by ZoomProvider
          break;
        case "zoom-out":
          // Handled by ZoomProvider
          break;
        case "zoom-reset":
          // Handled by ZoomProvider
          break;
        case "navigate-to-aos":
          navigateToAOS();
          break;
        case "navigate-to-monaco":
          navigateToMonaco();
          break;
        case "navigate-to-oasis":
          router.push("/oasis");
          break;
        case "navigate-to-speedrun":
          router.push("/speedrun");
          break;
        case "navigate-to-briefcase":
          router.push("/briefcase");
          break;
        case "navigate-to-tower":
          router.push("/tower");
          break;
        case "navigate-to-navigate":
          router.push("/navigate");
          break;
        case "navigate-to-battleground":
          router.push("/battleground");
          break;
        case "navigate-to-chessboard":
          router.push("/chessboard");
          break;
        case "navigate-to-olympus":
          router.push("./olympus");
          break;
        case "navigate-to-grand-central":
          router.push("./grand-central");
          break;
        case "navigate-to-store":
          router.push("/store");
          break;
        case "show-shortcuts-help":
          router.push("/shortcuts");
          break;
        case "open-user-manual":
          window.open("/docs", "_blank");
          break;
        case "open-preferences":
          router.push("./grand-central/profile");
          break;
        default:
          console.log(`Shortcut action not implemented: ${shortcut.action}`);
      }
    },
    [
      router,
      onToggleRightPanel,
      onToggleLeftPanel,
      onOpenCommandPalette,
      onOpenQuickSearch,
      onToggleAI,
    ],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is in an input field (unless it's a global shortcut)
      const target = event.target as HTMLElement;
      const isInput =
        target['tagName'] === "INPUT" ||
        target['tagName'] === "TEXTAREA" ||
        target.isContentEditable;

      // Build key combination string
      const keys = [];
      if (event.metaKey) keys.push("⌘");
      if (event['ctrlKey'] && !event.metaKey) keys.push("Ctrl");
      if (event.altKey) keys.push(event.metaKey ? "⌥" : "Alt");
      if (event.shiftKey) keys.push(event.metaKey ? "⇧" : "Shift");
      keys.push(event.key);

      const keyCombo = keys.join("+");

      // Find matching shortcut
      const matchingShortcut = ALL_SHORTCUTS.find(
        (shortcut: KeyboardShortcut) => {
          if (
            !shortcut.context?.includes(context) &&
            !shortcut.context?.includes("global")
          ) {
            return false;
          }

          return shortcut.keys.some((key: string) => {
            // Handle platform differences
            const normalizedKey = key
              .replace("⌘", event.metaKey ? "⌘" : "Ctrl")
              .replace("⌥", "Alt")
              .replace("⇧", "Shift");

            return normalizedKey === keyCombo;
          });
        },
      );

      if (matchingShortcut) {
        // Don't intercept standard browser shortcuts
        const isStandardBrowserShortcut =
          keyCombo === "⌘+V" ||
          keyCombo === "Ctrl+V" || // Paste
          keyCombo === "⌘+C" ||
          keyCombo === "Ctrl+C" || // Copy
          keyCombo === "⌘+X" ||
          keyCombo === "Ctrl+X" || // Cut
          keyCombo === "⌘+A" ||
          keyCombo === "Ctrl+A" || // Select All
          keyCombo === "⌘+Z" ||
          keyCombo === "Ctrl+Z" || // Undo
          keyCombo === "⌘+Y" ||
          keyCombo === "Ctrl+Y" || // Redo
          keyCombo === "⌘+⇧+Z" ||
          keyCombo === "Ctrl+Shift+Z" || // Redo (alternative)
          keyCombo === "⌘+B" ||
          keyCombo === "Ctrl+B" || // Bold (should not be intercepted)
          keyCombo === "⌘+I" ||
          keyCombo === "Ctrl+I" || // Italic (should not be intercepted)
          keyCombo === "⌘+U" ||
          keyCombo === "Ctrl+U" || // Underline (should not be intercepted)
          keyCombo === "⌘+F" ||
          keyCombo === "Ctrl+F" || // Find (should not be intercepted)
          keyCombo === "⌘+R" ||
          keyCombo === "Ctrl+R" || // Reload (should not be intercepted)
          keyCombo === "⌘+T" ||
          keyCombo === "Ctrl+T" || // New tab (should not be intercepted)
          keyCombo === "⌘+W" ||
          keyCombo === "Ctrl+W"; // Close tab (should not be intercepted)

        if (!isStandardBrowserShortcut) {
          // For global shortcuts or when not in input field
          if (matchingShortcut.context?.includes("global") || !isInput) {
            event.preventDefault();
            handleShortcut(matchingShortcut);
          }
        }
      }
    };

    // Handle sequence shortcuts (like G then T)
    let sequenceBuffer: string[] = [];
    let sequenceTimeout: NodeJS.Timeout;

    const handleSequence = (event: KeyboardEvent) => {
      // Only handle single key presses for sequences
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }

      sequenceBuffer.push(event.key.toUpperCase());

      // Clear sequence after 2 seconds
      clearTimeout(sequenceTimeout);
      sequenceTimeout = setTimeout(() => {
        sequenceBuffer = [];
      }, 2000);

      // Check for sequence matches
      const sequenceShortcuts = ALL_SHORTCUTS.filter(
        (s: KeyboardShortcut) => s.sequence,
      );
      for (const shortcut of sequenceShortcuts) {
        if (shortcut['keys']['length'] === sequenceBuffer.length) {
          const matches = shortcut.keys.every(
            (key: string, index: number) =>
              key.toUpperCase() === sequenceBuffer[index],
          );

          if (
            matches &&
            (shortcut.context?.includes(context) ||
              shortcut.context?.includes("global"))
          ) {
            event.preventDefault();
            handleShortcut(shortcut);
            sequenceBuffer = [];
            clearTimeout(sequenceTimeout);
            break;
          }
        }
      }

      // Clear buffer if it gets too long
      if (sequenceBuffer.length > 2) {
        sequenceBuffer = [];
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleSequence);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleSequence);
      clearTimeout(sequenceTimeout);
    };
  }, [context, handleShortcut]);

  return {
    shortcuts: ALL_SHORTCUTS.filter(
      (s: KeyboardShortcut) =>
        s.context?.includes(context) || s.context?.includes("global"),
    ),
  };
}
