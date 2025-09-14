"use client";

import React, { useState, useEffect } from "react";
import {
  PaperAirplaneIcon,
  SparklesIcon,
  MicrophoneIcon,
  DocumentTextIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  analyzeLinkedInVoice,
  generatePersonalizedEmail,
  type VoiceProfile,
} from "./VoiceAnalysisService";

interface AIEmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  leadName: string;
  leadCompany: string;
  leadTitle: string;
  leadEmail: string;
  leadLinkedIn?: string;
  leadBio?: string;
  leadRecentActivity?: string;
  onSendEmail: (subject: string, body: string) => Promise<boolean>;
}

export function AIEmailComposer({
  isOpen,
  onClose,
  leadName,
  leadCompany,
  leadTitle,
  leadEmail,
  leadLinkedIn,
  leadBio,
  leadRecentActivity,
  onSendEmail,
}: AIEmailComposerProps) {
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [emailTone, setEmailTone] = useState<
    "professional" | "friendly" | "casual"
  >("professional");
  const [emailPurpose, setEmailPurpose] = useState<
    "introduction" | "follow-up" | "meeting-request" | "proposal"
  >("introduction");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isVoiceAnalyzing, setIsVoiceAnalyzing] = useState(false);

  // Load or create voice profile on mount
  useEffect(() => {
    const loadVoiceProfile = async () => {
      setIsVoiceAnalyzing(true);
      try {
        // Try to load existing voice profile from localStorage
        const stored = localStorage.getItem("adrata-voice-profile");
        if (stored) {
          const profile = JSON.parse(stored) as VoiceProfile;
          // Check if profile is recent (within 30 days)
          const profileAge =
            Date.now() - new Date(profile.lastUpdated).getTime();
          if (profileAge < 30 * 24 * 60 * 60 * 1000) {
            // 30 days
            setVoiceProfile(profile);
            console.log("📝 Loaded existing voice profile:", profile);
            setIsVoiceAnalyzing(false);
            return;
          }
        }

        // Create new voice profile by analyzing user's LinkedIn
        console.log("🧠 Creating new voice profile from LinkedIn analysis...");
        const newProfile = await analyzeLinkedInVoice();
        setVoiceProfile(newProfile);

        // Store for future use
        localStorage.setItem(
          "adrata-voice-profile",
          JSON.stringify(newProfile),
        );
        console.log("✅ Voice profile created and stored:", newProfile);
      } catch (error) {
        console.error("❌ Error creating voice profile:", error);
        // Create a basic fallback profile
        const fallbackProfile: VoiceProfile = {
          tone: "Professional and approachable",
          style: "Clear and concise",
          vocabulary: [
            "passionate",
            "excited",
            "opportunity",
            "value",
            "growth",
          ],
          writingPatterns: [
            "Uses bullet points",
            "Asks engaging questions",
            "Includes specific examples",
          ],
          personalityTraits: ["Professional", "Helpful", "Results-oriented"],
          signatureElements: ["Best regards", "Looking forward to connecting"],
          confidenceScore: 0.7,
          lastUpdated: new Date().toISOString(),
        };
        setVoiceProfile(fallbackProfile);
      } finally {
        setIsVoiceAnalyzing(false);
      }
    };

    if (isOpen) {
      loadVoiceProfile();
    }
  }, [isOpen]);

  const handleGenerateEmail = async () => {
    if (!voiceProfile) return;

    setIsGenerating(true);
    try {
      const emailData = await generatePersonalizedEmail({
        voiceProfile,
        leadName,
        leadCompany,
        leadTitle,
        leadBio: leadBio || "",
        leadRecentActivity: leadRecentActivity || "",
        emailTone,
        emailPurpose,
        customInstructions,
      });

      setEmailSubject(emailData.subject);
      setEmailBody(emailData.body);
      console.log("✨ Generated personalized email:", emailData);
    } catch (error) {
      console.error("❌ Error generating email:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateEmail = async (updateInstruction: string) => {
    if (!voiceProfile || !emailBody) return;

    setIsGenerating(true);
    try {
      const updatedEmail = await generatePersonalizedEmail({
        voiceProfile,
        leadName,
        leadCompany,
        leadTitle,
        leadBio: leadBio || "",
        leadRecentActivity: leadRecentActivity || "",
        emailTone,
        emailPurpose,
        customInstructions: updateInstruction,
        existingEmail: emailBody,
      });

      setEmailSubject(updatedEmail.subject);
      setEmailBody(updatedEmail.body);
      console.log("🔄 Updated email with instruction:", updateInstruction);
    } catch (error) {
      console.error("❌ Error updating email:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) return;

    setIsSending(true);
    try {
      const success = await onSendEmail(emailSubject, emailBody);
      if (success) {
        console.log("📧 Email sent successfully");
        onClose();
      }
    } catch (error) {
      console.error("❌ Error sending email:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-xl w-[800px] max-w-[95vw] max-h-[95vh] overflow-y-auto border border-[var(--border)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                AI Email Composer
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                Powered by your unique voice profile • Writing to {leadName} at{" "}
                {leadCompany}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Voice Profile Status */}
        {isVoiceAnalyzing ? (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-200">
                  Analyzing your communication style...
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Reading your LinkedIn profile to understand your voice and
                  tone
                </div>
              </div>
            </div>
          </div>
        ) : (
          voiceProfile && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <MicrophoneIcon className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900 dark:text-green-200">
                    Voice Profile Active (
                    {Math.round(voiceProfile.confidenceScore * 100)}%
                    confidence)
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    {voiceProfile.tone} • {voiceProfile.style}
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* Email Configuration */}
        <div className="p-6 border-b border-[var(--border)]">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Email Purpose
              </label>
              <select
                value={emailPurpose}
                onChange={(e) => setEmailPurpose(e.target.value as any)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="introduction">Introduction</option>
                <option value="follow-up">Follow-up</option>
                <option value="meeting-request">Meeting Request</option>
                <option value="proposal">Proposal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Tone Override
              </label>
              <select
                value={emailTone}
                onChange={(e) => setEmailTone(e.target.value as any)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Custom Instructions (optional)
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., Mention our recent product launch, Keep it under 100 words"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleGenerateEmail}
            disabled={isGenerating || !voiceProfile}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Generating your perfect email...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Generate Personalized Email
              </>
            )}
          </button>
        </div>

        {/* Email Preview/Editor */}
        {(emailSubject || emailBody) && (
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Subject Line
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email subject..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Email Body
              </label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Email content will appear here..."
              />
            </div>

            {/* Quick Update Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Quick Updates
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Make it shorter",
                  "Add more personality",
                  "More professional",
                  "Include a clear CTA",
                  "Mention specific value prop",
                  "Add urgency",
                ].map((instruction) => (
                  <button
                    key={instruction}
                    onClick={() => handleUpdateEmail(instruction)}
                    disabled={isGenerating}
                    className="px-3 py-1 text-xs border border-blue-300 text-blue-600 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                  >
                    {instruction}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Update */}
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tell me how to update this email..."
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e['key'] === "Enter") {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        handleUpdateEmail(input.value);
                        input['value'] = "";
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector(
                      'input[placeholder*="Tell me how"]',
                    ) as HTMLInputElement;
                    if (input?.value.trim()) {
                      handleUpdateEmail(input.value);
                      input['value'] = "";
                    }
                  }}
                  disabled={isGenerating}
                  className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--hover-bg)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={
                  isSending || !emailSubject.trim() || !emailBody.trim()
                }
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
