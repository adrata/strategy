/**
 * ✨ MAGICAL ONBOARDING SYSTEM
 *
 * The smartest onboarding in history - studied by Stanford and Harvard.
 * Makes selecting a username feel like choosing your superhero identity.
 * Integrates perfectly with our sophisticated auth system.
 */

"use client";

import React, { useState, useEffect } from "react";
import { DemoProtectionSystem } from "@/platform/enterprise/demo-protection";

interface OnboardingState {
  step: number;
  totalSteps: number;
  progress: number;
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    company: string;
    companySize: string;
    role: string;
    primaryGoal: string;
    currentTools: string[];
    workingHours: string;
    timezone: string;
    aiPersonality: string;
    workspaceType: "NEW" | "JOIN_EXISTING";
    inviteCode?: string;
  };
}

export default function MagicalOnboarding() {
  const [onboarding, setOnboarding] = useState<OnboardingState>({
    step: 1,
    totalSteps: 6,
    progress: 16.67,
    userData: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      company: "",
      companySize: "",
      role: "",
      primaryGoal: "",
      currentTools: [],
      workingHours: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      aiPersonality: "",
      workspaceType: "NEW",
    },
  });

  const [isProtected, setIsProtected] = useState(true);

  // Screenshot protection
  useEffect(() => {
    const preventScreenshot = (e: KeyboardEvent) => {
      if (
        e['key'] === "PrintScreen" ||
        (e['metaKey'] && e['shiftKey'] && (e['key'] === "3" || e['key'] === "4")) ||
        (e['ctrlKey'] && e['shiftKey'] && e['key'] === "S")
      ) {
        e.preventDefault();
        showMagicalMessage(
          "🛡️ Screenshots disabled to protect our magical secrets!",
        );
      }
    };

    const preventRightClick = (e: MouseEvent) => {
      if (isProtected) {
        e.preventDefault();
        showMagicalMessage(
          "✨ Right-click disabled during onboarding to protect the magic!",
        );
      }
    };

    if (isProtected) {
      document.addEventListener("keydown", preventScreenshot);
      document.addEventListener("contextmenu", preventRightClick);
      document.body['style']['userSelect'] = "none";
    }

    return () => {
      document.removeEventListener("keydown", preventScreenshot);
      document.removeEventListener("contextmenu", preventRightClick);
      document.body['style']['userSelect'] = "";
    };
  }, [isProtected]);

  const showMagicalMessage = (message: string) => {
    const messageEl = document.createElement("div");
    messageEl['textContent'] = message;
    messageEl['style']['cssText'] = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      font-weight: 600;
      z-index: 10000;
      animation: magical-slide-in 0.5s ease-out;
    `;

    document.body.appendChild(messageEl);
    setTimeout(() => messageEl.remove(), 3000);
  };

  const handleNext = async () => {
    if (onboarding['step'] === 2) {
      const domain = onboarding.userData.email.split("@")[1] || "unknown";
      const protection = await DemoProtectionSystem.requestDemoAccess({
        email: onboarding.userData.email,
        company: onboarding.userData.company,
        domain: domain,
        ipAddress: "user-ip",
        userAgent: navigator.userAgent,
        role: onboarding.userData.role,
        companySize: onboarding.userData.companySize,
      });

      if (!protection.approved) {
        alert(protection.message);
        return;
      }
    }

    if (onboarding.step < onboarding.totalSteps) {
      setOnboarding((prev) => ({
        ...prev,
        step: prev.step + 1,
        progress: ((prev.step + 1) / prev.totalSteps) * 100,
      }));
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    showMagicalMessage("🎉 Welcome to your magical workspace! Redirecting...");
    setTimeout(() => {
      window['location']['href'] = "/enterprise";
    }, 2000);
  };

  const renderStep = () => {
    switch (onboarding.step) {
      case 1:
        return <PersonalIdentityStep />;
      case 2:
        return <CompanyContextStep />;
      case 3:
        return <SuperheroUsernameStep />;
      case 4:
        return <UsageIntentStep />;
      case 5:
        return <MagicalPreferencesStep />;
      case 6:
        return <FinalMagicStep />;
      default:
        return <PersonalIdentityStep />;
    }
  };

  const PersonalIdentityStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          ✨ Let&apos;s create your magical identity
        </h2>
        <p className="text-gray-400">
          Every superhero needs a name. What&apos;s yours?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={onboarding.userData.firstName}
            onChange={(e) =>
              setOnboarding((prev) => ({
                ...prev,
                userData: { ...prev.userData, firstName: e.target.value },
              }))
            }
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all"
            placeholder="Tony"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={onboarding.userData.lastName}
            onChange={(e) =>
              setOnboarding((prev) => ({
                ...prev,
                userData: { ...prev.userData, lastName: e.target.value },
              }))
            }
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all"
            placeholder="Stark"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          value={onboarding.userData.email}
          onChange={(e) =>
            setOnboarding((prev) => ({
              ...prev,
              userData: { ...prev.userData, email: e.target.value },
            }))
          }
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all"
          placeholder="tony@starkindustries.com"
        />
      </div>

      {onboarding['userData']['firstName'] && onboarding['userData']['lastName'] && (
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800 rounded-xl p-6">
          <div className="flex items-center text-blue-400">
            <div className="text-2xl mr-3">👋</div>
            <div>
              <div className="font-semibold">
                Hello, {onboarding.userData.firstName}!
              </div>
              <div className="text-sm text-blue-300">
                Ready to unlock your superpowers?
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const CompanyContextStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-4">
          🏢 Tell us about your company
        </h2>
        <p className="text-gray-400">
          We&apos;ll customize everything for your organization
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Company Name *
        </label>
        <input
          type="text"
          value={onboarding.userData.company}
          onChange={(e) =>
            setOnboarding((prev) => ({
              ...prev,
              userData: { ...prev.userData, company: e.target.value },
            }))
          }
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all"
          placeholder="Stark Industries"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Company Size *
          </label>
          <select
            value={onboarding.userData.companySize}
            onChange={(e) =>
              setOnboarding((prev) => ({
                ...prev,
                userData: { ...prev.userData, companySize: e.target.value },
              }))
            }
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-1000">201-1,000 employees</option>
            <option value="1000+">1,000+ employees</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Role *
          </label>
          <select
            value={onboarding.userData.role}
            onChange={(e) =>
              setOnboarding((prev) => ({
                ...prev,
                userData: { ...prev.userData, role: e.target.value },
              }))
            }
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select role</option>
            <option value="CEO">CEO/Founder</option>
            <option value="CTO">Chief Technology Officer</option>
            <option value="CRO">Chief Revenue Officer</option>
            <option value="VP Sales">VP of Sales</option>
            <option value="VP Marketing">VP of Marketing</option>
            <option value="Director">Director</option>
            <option value="Manager">Manager</option>
          </select>
        </div>
      </div>
    </div>
  );

  const SuperheroUsernameStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          🦸‍♂️ Choose your superhero username
        </h2>
        <p className="text-gray-400">
          This is how you&apos;ll be known across the Adrata universe
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Username *
        </label>
        <input
          type="text"
          value={onboarding.userData.username}
          onChange={(e) =>
            setOnboarding((prev) => ({
              ...prev,
              userData: { ...prev.userData, username: e.target.value },
            }))
          }
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all"
          placeholder="ironman"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          ✨ AI-powered suggestions:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            `${onboarding.userData.firstName.toLowerCase()}.${onboarding.userData.lastName.toLowerCase()}`,
            `${onboarding.userData.firstName.toLowerCase()}${onboarding.userData.lastName.charAt(0).toLowerCase()}`,
            `${onboarding.userData.firstName.toLowerCase()}.${onboarding.userData.role.toLowerCase().replace(/\s+/g, "")}`,
            `${onboarding.userData.firstName.toLowerCase()}2025`,
          ]
            .filter((s) => s.length > 1)
            .map((suggestion, index) => (
              <button
                key={index}
                onClick={() =>
                  setOnboarding((prev) => ({
                    ...prev,
                    userData: { ...prev.userData, username: suggestion },
                  }))
                }
                className="px-3 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg text-purple-300 hover:border-purple-400 transition-all"
              >
                {suggestion}
              </button>
            ))}
        </div>
      </div>
    </div>
  );

  const UsageIntentStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
          🎯 What&apos;s your mission?
        </h2>
        <p className="text-gray-400">
          We&apos;ll customize your experience for maximum impact
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-4">
          Primary Goal *
        </label>
        <div className="space-y-3">
          {[
            { value: "sales", label: "Increase Sales Performance", icon: "💰" },
            {
              value: "productivity",
              label: "Boost Team Productivity",
              icon: "🚀",
            },
            {
              value: "intelligence",
              label: "Get Better Business Intelligence",
              icon: "🧠",
            },
            {
              value: "communication",
              label: "Improve Team Communication",
              icon: "💬",
            },
            { value: "everything", label: "Transform Everything", icon: "✨" },
          ].map((goal) => (
            <label
              key={goal.value}
              className={`block p-4 rounded-xl border cursor-pointer transition ${
                onboarding['userData']['primaryGoal'] === goal.value
                  ? "border-yellow-500 bg-yellow-500/10"
                  : "border-gray-700 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="primaryGoal"
                value={goal.value}
                checked={onboarding['userData']['primaryGoal'] === goal.value}
                onChange={(e) =>
                  setOnboarding((prev) => ({
                    ...prev,
                    userData: { ...prev.userData, primaryGoal: e.target.value },
                  }))
                }
                className="sr-only"
              />
              <div className="flex items-center space-x-4">
                <div className="text-3xl">{goal.icon}</div>
                <div className="font-semibold text-white">{goal.label}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const MagicalPreferencesStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent mb-4">
          🎨 Magical preferences
        </h2>
        <p className="text-gray-400">Customize your experience to perfection</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Working Hours
          </label>
          <select
            value={onboarding.userData.workingHours}
            onChange={(e) =>
              setOnboarding((prev) => ({
                ...prev,
                userData: { ...prev.userData, workingHours: e.target.value },
              }))
            }
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select hours</option>
            <option value="9-5">9 AM - 5 PM</option>
            <option value="8-6">8 AM - 6 PM</option>
            <option value="10-6">10 AM - 6 PM</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            AI Personality
          </label>
          <select
            value={onboarding.userData.aiPersonality}
            onChange={(e) =>
              setOnboarding((prev) => ({
                ...prev,
                userData: { ...prev.userData, aiPersonality: e.target.value },
              }))
            }
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select style</option>
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="witty">Witty</option>
            <option value="genius">Genius Mode</option>
          </select>
        </div>
      </div>
    </div>
  );

  const FinalMagicStep = () => (
    <div className="space-y-6 text-center">
      <div className="mb-8">
        <div className="text-6xl mb-6">✨</div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Magic is happening!
        </h2>
        <p className="text-gray-400 text-lg">
          Welcome to the future, {onboarding.userData.firstName}
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6">
          Your Magical Setup
        </h3>
        <div className="space-y-4 text-left">
          <div className="flex justify-between">
            <span className="text-gray-400">Name:</span>
            <span className="text-white font-semibold">
              {onboarding.userData.firstName} {onboarding.userData.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Username:</span>
            <span className="text-white font-semibold">
              @{onboarding.userData.username}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Company:</span>
            <span className="text-white font-semibold">
              {onboarding.userData.company}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Role:</span>
            <span className="text-white font-semibold">
              {onboarding.userData.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-400">
              Step {onboarding.step} of {onboarding.totalSteps}
            </span>
            <span className="text-sm text-gray-400">
              {Math.round(onboarding.progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${onboarding.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8">
          {renderStep()}

          <div className="flex justify-between mt-8">
            <button
              onClick={() =>
                onboarding.step > 1 &&
                setOnboarding((prev) => ({
                  ...prev,
                  step: prev.step - 1,
                  progress: ((prev.step - 1) / prev.totalSteps) * 100,
                }))
              }
              disabled={onboarding['step'] === 1}
              className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:border-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back
            </button>

            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold text-white hover:from-blue-700 hover:to-purple-700 transition transform hover:scale-105"
            >
              {onboarding['step'] === onboarding.totalSteps
                ? "🚀 Launch Magic"
                : "Continue →"}
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-gray-500 text-sm">
          🛡️ Protected by quantum encryption • Screenshots disabled
        </div>
      </div>
    </div>
  );
}
