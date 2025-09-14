"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PhoneIcon,
  SparklesIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  IntelligentCallScriptGenerator,
  CallScript,
  CallScriptContext,
} from "@/platform/services/intelligent-call-script-generator";

interface CallScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadData: {
    name: string;
    title: string;
    company: string;
    phone: string;
    email?: string;
    linkedin?: string;
    bio?: string;
    companySize?: string;
    recentActivity?: string;
  };
  callPurpose: "discovery" | "demo" | "follow-up" | "closing";
  voiceProfile?: any;
}

export function CallScriptModal({
  isOpen,
  onClose,
  leadData,
  callPurpose,
  voiceProfile,
}: CallScriptModalProps) {
  const [callScript, setCallScript] = useState<CallScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("opening");

  const generateCallScript = useCallback(async () => {
    setIsGenerating(true);
    try {
      const context: CallScriptContext = {
        leadName: leadData.name,
        leadTitle: leadData.title,
        leadCompany: leadData.company,
        leadPhone: leadData.phone,
        callPurpose,
        ...(leadData['companySize'] && { companySize: leadData.companySize }),
        ...(leadData['recentActivity'] && {
          recentActivity: leadData.recentActivity,
        }),
      };

      const script = await IntelligentCallScriptGenerator.generateCallScript(
        context,
        voiceProfile || { tone: "Professional", style: "Clear and concise" },
      );

      setCallScript(script);
    } catch (error) {
      console.error("Error generating call script:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [leadData, callPurpose, voiceProfile]);

  // Generate call script when modal opens
  useEffect(() => {
    if (isOpen && !callScript) {
      generateCallScript();
    }
  }, [isOpen, callScript, generateCallScript]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderScriptSection = (section: any, title: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{section.duration}</span>
          <button
            onClick={() => copyToClipboard(section.content)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ClipboardDocumentIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
          {section.content}
        </pre>
      </div>

      {section['keyPoints'] && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Key Points:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {section.keyPoints.map((point: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-[900px] max-w-[95vw] max-h-[95vh] overflow-hidden border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <PhoneIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Call Script Generator
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {callPurpose.charAt(0).toUpperCase() + callPurpose.slice(1)}{" "}
                call with {leadData.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[70vh]">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r bg-gray-50 dark:bg-gray-900 p-4">
            <div className="space-y-2">
              {callScript &&
                [
                  {
                    id: "opening",
                    label: "Opening",
                    duration: callScript.opening.duration,
                  },
                  {
                    id: "rapport",
                    label: "Rapport Building",
                    duration: callScript.rapport.duration,
                  },
                  {
                    id: "discovery",
                    label: "Discovery",
                    duration: callScript.discovery.duration,
                  },
                  {
                    id: "presentation",
                    label: "Presentation",
                    duration: callScript.presentation.duration,
                  },
                  {
                    id: "objections",
                    label: "Objections",
                    duration: callScript.objections.duration,
                  },
                  {
                    id: "closing",
                    label: "Closing",
                    duration: callScript.closing.duration,
                  },
                ].map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left p-3 rounded-lg text-sm ${
                      activeSection === section.id
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="font-medium">{section.label}</div>
                    <div className="text-xs text-gray-500">
                      {section.duration}
                    </div>
                  </button>
                ))}
            </div>

            {callScript && (
              <div className="mt-6 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Call Info
                </h4>
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>Duration: {callScript.estimatedDuration}</div>
                  <div>
                    Confidence: {Math.round(callScript.confidence * 100)}%
                  </div>
                  <div>Purpose: {callScript.callPurpose}</div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Generating personalized call script...
                  </p>
                </div>
              </div>
            ) : callScript ? (
              <div className="space-y-6">
                {activeSection === "opening" &&
                  renderScriptSection(
                    callScript.opening,
                    "Opening & Introduction",
                  )}
                {activeSection === "rapport" &&
                  renderScriptSection(callScript.rapport, "Building Rapport")}
                {activeSection === "discovery" &&
                  renderScriptSection(
                    callScript.discovery,
                    "Discovery Questions",
                  )}
                {activeSection === "presentation" &&
                  renderScriptSection(
                    callScript.presentation,
                    "Solution Presentation",
                  )}
                {activeSection === "objections" &&
                  renderScriptSection(
                    callScript.objections,
                    "Objection Handling",
                  )}
                {activeSection === "closing" &&
                  renderScriptSection(callScript.closing, "Call Closing")}

                {/* Additional Resources */}
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3">
                    Additional Resources
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                        Talking Points
                      </h5>
                      <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                        {callScript.talkingPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                        Next Steps
                      </h5>
                      <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                        {callScript.nextSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Generated using your voice profile and real Pipeline data
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Close
            </button>
            {callScript && (
              <button
                onClick={() =>
                  copyToClipboard(`
CALL SCRIPT: ${callScript.leadName} - ${callScript.callPurpose}

${callScript.opening.title}
${callScript.opening.content}

${callScript.rapport.title}
${callScript.rapport.content}

${callScript.discovery.title}
${callScript.discovery.content}

${callScript.presentation.title}
${callScript.presentation.content}

${callScript.objections.title}
${callScript.objections.content}

${callScript.closing.title}
${callScript.closing.content}
                `)
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
                Copy Full Script
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
