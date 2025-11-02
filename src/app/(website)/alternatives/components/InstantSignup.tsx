"use client";

import React, { useState } from "react";

interface InstantSignupProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function InstantSignup({ onClose, isOpen }: InstantSignupProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    companySize: "",
    role: "",
    primaryGoal: "",
    password: "",
  });

  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const companySize = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-1000", label: "201-1,000 employees" },
    { value: "1000+", label: "1,000+ employees" },
  ];

  const roles = [
    { value: "ceo", label: "CEO/Founder", icon: "👑" },
    { value: "cro", label: "Chief Revenue Officer", icon: "📊" },
    { value: "cto", label: "Chief Technology Officer", icon: "⚡" },
    { value: "vp-sales", label: "VP of Sales", icon: "🎯" },
    { value: "vp-marketing", label: "VP of Marketing", icon: "📢" },
    { value: "director", label: "Director", icon: "🎪" },
    { value: "manager", label: "Manager", icon: "📋" },
    { value: "individual", label: "Individual Contributor", icon: "⚙️" },
  ];

  const primaryGoals = [
    {
      value: "sales",
      label: "Increase Sales Performance",
      icon: "💰",
      apps: ["Monaco", "Acquire", "Pipeline"],
    },
    {
      value: "productivity",
      label: "Boost Team Productivity",
      icon: "🚀",
      apps: ["Stacks", "Oasis", "Action Platform"],
    },
    {
      value: "intelligence",
      label: "Get Better Business Intelligence",
      icon: "🧠",
      apps: ["Monaco", "Reports", "Grand Central"],
    },
    {
      value: "security",
      label: "Improve Security & Compliance",
      icon: "🛡️",
      apps: ["Shield", "Vault", "Oasis"],
    },
    {
      value: "communication",
      label: "Better Team Communication",
      icon: "💬",
      apps: ["Oasis", "Social", "Pulse"],
    },
    {
      value: "everything",
      label: "Transform Everything",
      icon: "✨",
      apps: ["All 30+ Apps"],
    },
  ];

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleCreateAccount = async () => {
    setIsCreatingAccount(true);

    // Simulate account creation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Redirect to the actual platform
    window['location']['href'] = "/enterprise"; // Or wherever your main app is
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-foreground rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="sticky top-0 bg-foreground border-b border-gray-800 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {step === 1 && "Start Your Journey"}
                {step === 2 && "Tell Us About Your Company"}
                {step === 3 && "What&apos;s Your Primary Goal?"}
                {step === 4 && "Create Your Account"}
              </h2>
              <p className="text-muted mt-1">
                {step === 1 && "Get full access in under 3 minutes"}
                {step === 2 && "Help us customize your experience"}
                {step === 3 && "We&apos;ll optimize your setup"}
                {step === 4 && "Almost there! Set your credentials"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-white text-2xl w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className={`flex-1 h-2 rounded-full ${
                    num <= step ? "bg-blue-500" : "bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-border rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-border rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="your@company.com"
                />
              </div>

              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <div className="flex items-center text-blue-400">
                  <div className="text-2xl mr-3">🚀</div>
                  <div>
                    <div className="font-semibold">What happens next?</div>
                    <div className="text-sm text-blue-300">
                      • Instant access to all 30+ apps
                      <br />
                      • AI-customized setup based on your needs
                      <br />• No credit card required, cancel anytime
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={!formData.name || !formData.email}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold text-white hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Company Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-border rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Size *
                </label>
                <div className="space-y-2">
                  {companySize.map((size) => (
                    <label
                      key={size.value}
                      className={`block p-3 rounded-lg border cursor-pointer transition ${
                        formData['companySize'] === size.value
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-border hover:border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name="companySize"
                        value={size.value}
                        checked={formData['companySize'] === size.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            companySize: e.target.value,
                          })
                        }
                        className="sr-only"
                      />
                      <span className="text-white">{size.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Role *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => (
                    <label
                      key={role.value}
                      className={`block p-3 rounded-lg border cursor-pointer transition ${
                        formData['role'] === role.value
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-border hover:border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData['role'] === role.value}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{role.icon}</span>
                        <span className="text-white text-sm">{role.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={
                  !formData.company || !formData.companySize || !formData.role
                }
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 3: Primary Goal */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  What&apos;s your primary goal with Adrata? *
                </label>
                <div className="space-y-4">
                  {primaryGoals.map((goal) => (
                    <label
                      key={goal.value}
                      className={`block p-4 rounded-xl border cursor-pointer transition ${
                        formData['primaryGoal'] === goal.value
                          ? "border-green-500 bg-green-500/10"
                          : "border-border hover:border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name="primaryGoal"
                        value={goal.value}
                        checked={formData['primaryGoal'] === goal.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            primaryGoal: e.target.value,
                          })
                        }
                        className="sr-only"
                      />
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl">{goal.icon}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">
                            {goal.label}
                          </div>
                          <div className="text-sm text-muted mt-1">
                            Recommended apps: {goal.apps.join(", ")}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {formData['primaryGoal'] && (
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                  <div className="flex items-center text-green-400">
                    <div className="text-2xl mr-3">🎯</div>
                    <div>
                      <div className="font-semibold">
                        Perfect! We&apos;ll customize your setup
                      </div>
                      <div className="text-sm text-green-300">
                        Your workspace will be optimized for{" "}
                        {primaryGoals
                          .find((g) => g['value'] === formData.primaryGoal)
                          ?.label.toLowerCase()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleNext}
                disabled={!formData.primaryGoal}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg font-semibold text-white hover:from-green-700 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 4: Create Account */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Create Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-border rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Choose a secure password"
                />
                <div className="text-xs text-muted mt-1">
                  At least 8 characters with mix of letters, numbers & symbols
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">
                  Your Customized Setup:
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-2">✓</span>
                    Company: {formData.company} ({formData.companySize}{" "}
                    employees)
                  </div>
                  <div className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-2">✓</span>
                    Role: {roles.find((r) => r['value'] === formData.role)?.label}
                  </div>
                  <div className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-2">✓</span>
                    Focus:{" "}
                    {
                      primaryGoals.find((g) => g['value'] === formData.primaryGoal)
                        ?.label
                    }
                  </div>
                  <div className="flex items-center text-gray-300">
                    <span className="text-blue-400 mr-2">⚡</span>
                    AI will pre-configure your optimal workflow
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateAccount}
                disabled={
                  !formData.password ||
                  formData.password.length < 8 ||
                  isCreatingAccount
                }
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold text-lg text-white hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingAccount ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating your workspace...</span>
                  </div>
                ) : (
                  "🚀 Create Account & Start Using Adrata"
                )}
              </button>

              <div className="text-center text-xs text-muted">
                By creating an account, you agree to our Terms of Service and
                Privacy Policy.
                <br />
                No credit card required • Cancel anytime • Full enterprise
                security
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
