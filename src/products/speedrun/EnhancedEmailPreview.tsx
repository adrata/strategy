// Enhanced Email Preview with Pre-Generated Intelligent Emails
// Shows personalized emails automatically generated in the user's voice

import React, { useState, useEffect, useCallback } from "react";
import {
  SparklesIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import IntelligentEmailGenerator, {
  EmailContext,
  PreGeneratedEmail,
  EmailSequence,
} from "@/platform/ai/services/intelligent-email-generator";
import { VoiceProfile, analyzeLinkedInVoice } from "./VoiceAnalysisService";

interface EnhancedEmailPreviewProps {
  leadName: string;
  leadCompany: string;
  leadTitle?: string;
  leadEmail: string;
  leadBio?: string;
  leadIndustry?: string;
  companySize?: string;
  companyWebsite?: string;
  onSendEmail: (subject: string, body: string) => Promise<boolean>;
  onClose: () => void;
  workspaceId: string;
}

export function EnhancedEmailPreview({
  leadName,
  leadCompany,
  leadTitle,
  leadEmail,
  leadBio,
  leadIndustry,
  companySize,
  companyWebsite,
  onSendEmail,
  onClose,
  workspaceId,
}: EnhancedEmailPreviewProps) {
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [preGeneratedEmails, setPreGeneratedEmails] = useState<
    PreGeneratedEmail[]
  >([]);
  const [emailSequence, setEmailSequence] = useState<EmailSequence | null>(
    null,
  );
  const [selectedEmail, setSelectedEmail] = useState<PreGeneratedEmail | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const loadVoiceProfileAndGenerateEmails = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Load or create voice profile
      const stored = localStorage.getItem("adrata-voice-profile");
      let profile: VoiceProfile;

      if (stored) {
        const existingProfile = JSON.parse(stored) as VoiceProfile;
        const profileAge =
          Date.now() - new Date(existingProfile.lastUpdated).getTime();

        if (profileAge < 30 * 24 * 60 * 60 * 1000) {
          // 30 days
          profile = existingProfile;
        } else {
          profile = await analyzeLinkedInVoice();
          localStorage.setItem("adrata-voice-profile", JSON.stringify(profile));
        }
      } else {
        profile = await analyzeLinkedInVoice();
        localStorage.setItem("adrata-voice-profile", JSON.stringify(profile));
      }

      setVoiceProfile(profile);

      // Create email context
      const emailContext: EmailContext = {
        leadName,
        leadCompany,
        leadTitle,
        leadEmail,
        leadBio,
        leadIndustry,
        companySize,
        companyWebsite,
        connectionReason: "speedrun_outreach",
      };

      // Generate all emails and sequence
      const [emails, sequence] = await Promise.all([
        IntelligentEmailGenerator.preGenerateAllEmails(
          emailContext,
          profile,
          workspaceId,
        ),
        IntelligentEmailGenerator.generateEmailSequence(
          emailContext,
          profile,
          "cold-outreach",
          workspaceId,
        ),
      ]);

      setPreGeneratedEmails(emails);
      setEmailSequence(sequence);

      // Select the first email by default
      if (emails.length > 0) {
        const firstEmail = emails[0] || null;
        setSelectedEmail(firstEmail);
        if (firstEmail) {
          setEditedSubject(firstEmail.subject);
          setEditedBody(firstEmail.body);
        }
      }

      console.log(
        `✅ Generated ${emails.length} personalized emails for ${leadName} with ${Math.round(profile.confidenceScore * 100)}% voice confidence`,
      );
    } catch (error) {
      console.error("❌ Failed to generate emails:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [
    leadName,
    leadCompany,
    leadTitle,
    leadEmail,
    leadBio,
    leadIndustry,
    companySize,
    companyWebsite,
    workspaceId,
  ]);

  // Load voice profile and generate emails on mount
  useEffect(() => {
    loadVoiceProfileAndGenerateEmails();
  }, [loadVoiceProfileAndGenerateEmails]);

  const handleEmailSelect = (email: PreGeneratedEmail) => {
    setSelectedEmail(email);
    setEditedSubject(email.subject);
    setEditedBody(email.body);
    setIsEditing(false);
  };

  const handleSendEmail = async () => {
    if (!editedSubject.trim() || !editedBody.trim()) return;

    setIsSending(true);
    try {
      const success = await onSendEmail(editedSubject, editedBody);
      if (success) {
        console.log("📧 Pre-generated email sent successfully");
        onClose();
      }
    } catch (error) {
      console.error("❌ Error sending email:", error);
    } finally {
      setIsSending(false);
    }
  };

  const getEmailTypeColor = (emailType: string) => {
    switch (emailType) {
      case "introduction":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "follow-up":
        return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "meeting-request":
        return "text-purple-600 bg-purple-100 dark:bg-purple-900/30";
      case "breakup":
        return "text-red-600 bg-red-100 dark:bg-red-900/30";
      default:
        return "text-[var(--muted)] bg-[var(--hover)] dark:bg-[var(--foreground)]/30";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-[var(--background)] rounded-xl w-[1200px] max-w-[95vw] max-h-[95vh] overflow-y-auto border border-[var(--border)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Intelligent Email Preview
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                Pre-generated emails for {leadName} at {leadCompany} • Powered
                by your voice profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Voice Profile Status */}
        {voiceProfile && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckBadgeIcon className="w-5 h-5 text-green-600" />
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
              {emailSequence && (
                <div className="text-right">
                  <div className="text-sm font-medium text-green-900 dark:text-green-200">
                    {emailSequence.totalEmails} emails •{" "}
                    {emailSequence.expectedDuration}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300">
                    {Math.round(emailSequence.completionRate * 100)}% industry
                    benchmark
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex h-[600px]">
          {/* Email List */}
          <div className="w-1/3 border-r border-[var(--border)] overflow-y-auto">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                Pre-Generated Emails
              </h3>
              {isGenerating ? (
                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">
                    Generating personalized emails...
                  </span>
                </div>
              ) : (
                <div className="text-sm text-[var(--muted)]">
                  {preGeneratedEmails.length} emails ready
                </div>
              )}
            </div>

            <div className="p-2">
              {preGeneratedEmails.map((email, index) => (
                <button
                  key={email.id}
                  onClick={() => handleEmailSelect(email)}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                    selectedEmail?.id === email.id
                      ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                      : "hover:bg-[var(--hover-bg)] border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${getEmailTypeColor(email.emailType)}`}
                    >
                      {email.emailType.replace("-", " ")}
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs font-medium ${getConfidenceColor(email.confidence)}`}
                      >
                        {Math.round(email.confidence * 100)}%
                      </span>
                      <ChartBarIcon className="w-3 h-3 text-[var(--muted)]" />
                    </div>
                  </div>

                  <div className="font-medium text-sm text-[var(--foreground)] mb-1 truncate">
                    {email.subject}
                  </div>

                  <div className="text-xs text-[var(--muted)] mb-2 line-clamp-2">
                    {email.body.split("\n")[2] || email.body.split("\n")[0]}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--muted)]">
                      {Math.round(email.estimatedReplyProbability * 100)}% reply
                      rate
                    </span>
                    {email['suggestedSendTime'] && (
                      <div className="flex items-center gap-1 text-[var(--muted)]">
                        <ClockIcon className="w-3 h-3" />
                        <span>
                          {email.suggestedSendTime.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Email Preview/Edit */}
          <div className="flex-1 flex flex-col">
            {selectedEmail ? (
              <>
                {/* Email Header */}
                <div className="p-4 border-b border-[var(--border)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[var(--foreground)]">
                      {selectedEmail.emailType.replace("-", " ").toUpperCase()}{" "}
                      EMAIL
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-[var(--hover)] hover:bg-[var(--loading-bg)] rounded-lg transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                        {isEditing ? "Preview" : "Edit"}
                      </button>
                    </div>
                  </div>

                  {/* Personalization Insights */}
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="font-medium text-[var(--foreground)] mb-1">
                        Personalizations
                      </div>
                      <div className="space-y-1">
                        {selectedEmail.personalizations.map((p, i) => (
                          <div key={i} className="text-[var(--muted)]">
                            • {p}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-[var(--foreground)] mb-1">
                        Industry Insights
                      </div>
                      <div className="space-y-1">
                        {selectedEmail.industryInsights.map((insight, i) => (
                          <div key={i} className="text-[var(--muted)]">
                            • {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-[var(--foreground)] mb-1">
                        Voice Elements
                      </div>
                      <div className="space-y-1">
                        {selectedEmail.voiceElements.map((element, i) => (
                          <div key={i} className="text-[var(--muted)]">
                            • {element}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Content */}
                <div className="flex-1 p-4">
                  {isEditing ? (
                    <div className="h-full flex flex-col gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Subject Line
                        </label>
                        <input
                          type="text"
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Email Body
                        </label>
                        <textarea
                          value={editedBody}
                          onChange={(e) => setEditedBody(e.target.value)}
                          className="w-full h-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-full">
                      <div className="mb-4">
                        <div className="text-sm font-medium text-[var(--muted)] mb-1">
                          Subject:
                        </div>
                        <div className="font-medium text-[var(--foreground)]">
                          {editedSubject}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--muted)] mb-1">
                          Body:
                        </div>
                        <div className="bg-[var(--panel-background)] dark:bg-[var(--foreground)] rounded-lg p-4 h-full">
                          <pre className="whitespace-pre-wrap text-[var(--foreground)] font-sans">
                            {editedBody}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                    <div className="flex items-center gap-1">
                      <ChartBarIcon className="w-4 h-4" />
                      <span>
                        {Math.round(selectedEmail.confidence * 100)}% confidence
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowRightIcon className="w-4 h-4" />
                      <span>
                        {Math.round(
                          selectedEmail.estimatedReplyProbability * 100,
                        )}
                        % reply rate
                      </span>
                    </div>
                    {selectedEmail['suggestedSendTime'] && (
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>
                          Best time:{" "}
                          {selectedEmail.suggestedSendTime.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSendEmail}
                    disabled={
                      isSending || !editedSubject.trim() || !editedBody.trim()
                    }
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <ArrowRightIcon className="w-4 h-4" />
                    )}
                    {isSending ? "Sending..." : "Send Email"}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-[var(--muted)]">
                  <SparklesIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <div>Select an email to preview</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedEmailPreview;
