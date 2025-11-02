"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { CallbackForwardingService } from "@/platform/services/callback-forwarding-service";
import { useUnifiedAuth } from "@/platform/auth";

interface CallbackForwardingSetupProps {
  onClose?: () => void;
}

export function CallbackForwardingSetup({
  onClose,
}: CallbackForwardingSetupProps) {
  const { user } = useUnifiedAuth();
  const [cellPhone, setCellPhone] = useState("");
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testingCall, setTestingCall] = useState(false);
  const [forwardingStatus, setForwardingStatus] = useState<any>(null);

  const forwardingService = new CallbackForwardingService();

  useEffect(() => {
    checkExistingSetup();
    // checkExistingSetup is stable and defined below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkExistingSetup = async () => {
    if (!user?.id) return;

    try {
      const status = await forwardingService.getForwardingStatus(user.id);
      setForwardingStatus(status);
      setIsSetupComplete(status.enabled);
      if (status.cellPhone) {
        setCellPhone(status.cellPhone);
      }
    } catch (error) {
      console.error("Error checking forwarding setup:", error);
    }
  };

  const handleSetupForwarding = async () => {
    if (!user?.id || !cellPhone.trim()) return;

    setIsLoading(true);
    try {
      const profile = await forwardingService.setupCallbackForwarding(
        user.id,
        cellPhone,
      );
      setIsSetupComplete(true);
      setForwardingStatus({
        enabled: true,
        cellPhone: profile.userCellPhone,
        message: "✅ All return calls will ring your cell phone",
      });
    } catch (error) {
      console.error("Error setting up forwarding:", error);
      alert(
        "Error setting up callback forwarding. Please check your phone number and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestForwarding = async () => {
    if (!user?.id) return;

    setTestingCall(true);
    try {
      const result = await forwardingService.testForwarding(user.id);
      alert(`${result.message}\n\n${result.instructions}`);
    } catch (error) {
      console.error("Error testing forwarding:", error);
      alert("Error testing forwarding. Please try again.");
    } finally {
      setTimeout(() => setTestingCall(false), 5000);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Format as (XXX) XXX-XXXX
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return digits;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setCellPhone(formatted);
  };

  return (
    <div className="max-w-2xl mx-auto bg-background border border-border rounded-2xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <PhoneIcon className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Callback Forwarding Setup
        </h2>
        <p className="text-muted">
          Ensure all return calls from prospects ring directly to your cell
          phone
        </p>
      </div>

      {/* Current Status */}
      {forwardingStatus && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            forwardingStatus.enabled
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {forwardingStatus.enabled ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            )}
            <div>
              <div
                className={`font-medium ${
                  forwardingStatus.enabled
                    ? "text-green-800 dark:text-green-200"
                    : "text-yellow-800 dark:text-yellow-200"
                }`}
              >
                {forwardingStatus.enabled
                  ? "Callback Forwarding Active"
                  : "Callback Forwarding Needed"}
              </div>
              <div
                className={`text-sm ${
                  forwardingStatus.enabled
                    ? "text-green-700 dark:text-green-300"
                    : "text-yellow-700 dark:text-yellow-300"
                }`}
              >
                {forwardingStatus.message}
              </div>
              {forwardingStatus['cellPhone'] && (
                <div
                  className={`text-sm font-mono ${
                    forwardingStatus.enabled
                      ? "text-green-600 dark:text-green-400"
                      : "text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  Forwarding to: {forwardingStatus.cellPhone}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Setup Form */}
      {!isSetupComplete && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your Cell Phone Number *
            </label>
            <input
              type="tel"
              value={cellPhone}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              className="w-full p-4 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              maxLength={14}
            />
            <p className="text-sm text-muted mt-2">
              This is where all return calls from prospects will ring
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              How Callback Forwarding Works:
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• When you call prospects, they see a local number</li>
              <li>
                • When they call back, it automatically rings your cell phone
              </li>
              <li>• No missed calls - every callback reaches you directly</li>
              <li>• Works 24/7, including after business hours</li>
            </ul>
          </div>

          <button
            onClick={handleSetupForwarding}
            disabled={!cellPhone.trim() || isLoading}
            className="w-full px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Setting up forwarding...
              </>
            ) : (
              <>
                <PhoneIcon className="w-5 h-5" />
                Enable Callback Forwarding
              </>
            )}
          </button>
        </div>
      )}

      {/* Test & Manage */}
      {isSetupComplete && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleTestForwarding}
              disabled={testingCall}
              className="px-6 py-3 border border-green-300 bg-transparent text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {testingCall ? (
                <>
                  <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  Calling...
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5" />
                  Test Forwarding
                </>
              )}
            </button>

            <button
              onClick={() => setIsSetupComplete(false)}
              className="px-6 py-3 border border-border bg-background text-foreground hover:bg-hover rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CogIcon className="w-5 h-5" />
              Update Settings
            </button>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="mt-8 pt-6 border-t border-border">
        <h3 className="font-semibold text-foreground mb-4">
          Frequently Asked Questions
        </h3>
        <div className="space-y-3 text-sm">
          <div>
            <div className="font-medium text-foreground">
              Q: Will prospects see my personal cell phone number?
            </div>
            <div className="text-muted">
              A: No, they&apos;ll see the local business number. Only return
              calls are forwarded to your cell.
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground">
              Q: What if I don&apos;t answer the forwarded call?
            </div>
            <div className="text-muted">
              A: The call will go to a professional voicemail, and you&apos;ll
              get a notification with the recording.
            </div>
          </div>
          <div>
            <div className="font-medium text-foreground">
              Q: Can I disable forwarding for certain times?
            </div>
            <div className="text-muted">
              A: Yes, you can set business hours and after-hours rules in the
              advanced settings.
            </div>
          </div>
        </div>
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 text-muted hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
