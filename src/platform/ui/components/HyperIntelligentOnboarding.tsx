"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  MultiTenantWorkspaceService,
  DepartmentSuggestion,
  CompanyTenant,
} from "@/platform/enterprise/multi-tenant-workspace-service";

interface OnboardingIntent {
  type: "join_existing" | "create_new" | "unclear";
  confidence: number;
  companyMatches: CompanyMatch[];
  suggestions: string[];
}

interface CompanyMatch {
  id: string;
  name: string;
  slug: string;
  domain: string;
  confidence: number;
  workspaces: Array<{
    name: string;
    slug: string;
    department: string;
    memberCount: number;
  }>;
  inviteStatus: "pending" | "none" | "rejected";
}

interface UserProfile {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
  linkedin?: string;
  gravatar?: string;
}

export function HyperIntelligentOnboarding() {
  const [step, setStep] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile>({ email: "" });
  const [onboardingIntent, setOnboardingIntent] =
    useState<OnboardingIntent | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPath, setSelectedPath] = useState<"join" | "create" | null>(
    null,
  );
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // 🧠 AI INTENT ANALYSIS
  const analyzeOnboardingIntent = async (
    email: string,
  ): Promise<OnboardingIntent> => {
    setIsAnalyzing(true);

    try {
      // Extract domain from email
      const domain = email.split("@")[1]?.toLowerCase();
      if (!domain) throw new Error("Invalid email");

      // 1. Check for existing companies with this domain
      const companyMatches = await findExistingCompanies(domain);

      // 2. Enrich user profile with public data
      const enrichedProfile = await enrichUserProfile(email);
      setUserProfile((prev) => ({ ...prev, ...enrichedProfile }));

      // 3. Analyze intent based on findings
      const intent: OnboardingIntent = {
        type: companyMatches.length > 0 ? "join_existing" : "create_new",
        confidence: companyMatches.length > 0 ? 0.95 : 0.85,
        companyMatches,
        suggestions: generateSmartSuggestions(enrichedProfile, companyMatches),
      };

      // 4. Special cases for common domains
      if (
        ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"].includes(
          domain,
        )
      ) {
        intent['type'] = "unclear";
        intent['confidence'] = 0.5;
        intent['suggestions'] = [
          `We detected you&apos;re using a personal email. Are you setting up for yourself or joining a team?`,
          `If you&apos;re representing a company, consider using your work email for better team discovery.`,
        ];
      }

      return intent;
    } catch (error) {
      console.error("Intent analysis failed:", error);
      return {
        type: "unclear",
        confidence: 0.3,
        companyMatches: [],
        suggestions: [
          "Let us help you get started! Are you joining a team or creating a new workspace?",
        ],
      };
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 🔍 COMPANY DISCOVERY
  const findExistingCompanies = async (
    domain: string,
  ): Promise<CompanyMatch[]> => {
    // Simulate company discovery - in production, this would query your database
    console.log(`🔍 Searching for companies with domain: ${domain}`);

    // Mock data for demonstration
    const mockCompanies: CompanyMatch[] = [];

    // Example: If domain is "microsoft.com", find Microsoft's workspaces
    if (domain === "microsoft.com") {
      mockCompanies.push({
        id: "microsoft_corp",
        name: "Microsoft Corporation",
        slug: "microsoft",
        domain: "microsoft.com",
        confidence: 0.98,
        workspaces: [
          {
            name: "Enterprise Sales",
            slug: "enterprise-sales",
            department: "sales",
            memberCount: 24,
          },
          {
            name: "Customer Success",
            slug: "customer-success",
            department: "customer-success",
            memberCount: 18,
          },
          {
            name: "Engineering",
            slug: "engineering",
            department: "engineering",
            memberCount: 156,
          },
        ],
        inviteStatus: "none",
      });
    }

    return mockCompanies;
  };

  // 🌟 USER PROFILE ENRICHMENT
  const enrichUserProfile = async (
    email: string,
  ): Promise<Partial<UserProfile>> => {
    console.log(`🌟 Enriching profile for: ${email}`);

    // Simulate profile enrichment - in production, integrate with:
    // - LinkedIn API
    // - Clearbit
    // - FullContact
    // - Internal directory

    const domain = email.split("@")[1];
    const username = email.split("@")[0];

    // Smart name extraction from email
    const nameGuess = username
      ? username
          .split(/[._-]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : "";

    // Company name from domain
    const companyGuess = domain
      ?.replace(/\.(com|org|net|edu|gov)$/, "")
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    return {
      name: nameGuess,
      firstName: nameGuess.split(" ")[0],
      lastName: nameGuess.split(" ").slice(1).join(" "),
      companyName: companyGuess,
      gravatar: `https://www.gravatar.com/avatar/${btoa(email)}?d=identicon&s=200`,
    };
  };

  // 💡 SMART SUGGESTIONS
  const generateSmartSuggestions = (
    profile: Partial<UserProfile>,
    companies: CompanyMatch[],
  ): string[] => {
    const suggestions: string[] = [];

    if (companies.length > 0) {
      const company = companies[0];
      if (company) {
        suggestions.push(
          `Join ${company.name} - we found ${company.workspaces.length} active workspace${company.workspaces.length !== 1 ? "s" : ""}`,
        );

        if (company.workspaces.length > 1) {
          const popularWorkspace = company.workspaces.sort(
            (a, b) => b.memberCount - a.memberCount,
          )[0];
          if (popularWorkspace) {
            suggestions.push(
              `Most popular workspace: ${popularWorkspace.name} (${popularWorkspace.memberCount} members)`,
            );
          }
        }
      }
    } else {
      suggestions.push(
        `Create a new workspace for ${profile.companyName || "your team"}`,
      );

      if (profile.jobTitle) {
        suggestions.push(
          `Based on your role, we&apos;ll suggest the perfect workspace setup`,
        );
      }
    }

    return suggestions;
  };

  // 📧 EMAIL ANALYSIS & PROFILE SETUP
  const handleEmailSubmit = async () => {
    if (!userProfile.email) return;

    const intent = await analyzeOnboardingIntent(userProfile.email);
    setOnboardingIntent(intent);
    setStep(1);
  };

  // 🎯 PATH SELECTION
  const selectPath = (path: "join" | "create") => {
    setSelectedPath(path);
    setStep(2);
  };

  // 🔗 MAGIC LINK AUTHENTICATION
  const sendMagicLink = async () => {
    console.log(`🔗 Sending magic link to: ${userProfile.email}`);

    // Simulate magic link sending
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setMagicLinkSent(true);
      setStep(3);
    } catch (error) {
      console.error("Magic link failed:", error);
    }
  };

  // 🏢 WORKSPACE SETUP
  const createWorkspaceSetup = async () => {
    if (!userProfile.companyName || !userProfile.email) return;

    try {
      // Create company tenant
      const company = await MultiTenantWorkspaceService.createCompanyTenant({
        name: userProfile.companyName,
        slug: userProfile.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        domain: userProfile.email.split("@")[1],
        size: "enterprise",
        primaryContact: {
          name:
            userProfile.name ||
            `${userProfile.firstName} ${userProfile.lastName}`,
          email: userProfile.email,
          title: userProfile.jobTitle || "Team Lead",
        },
        subscriptionTier: "trial",
      });

      // Monaco AI suggests workspaces
      const suggestions =
        await MultiTenantWorkspaceService.analyzeCompanyDepartments({
          name: userProfile.companyName,
          domain: userProfile.email.split("@")[1],
          size: "enterprise",
        });

      // Auto-create high priority workspaces
      for (const dept of suggestions
        .filter((d) => d['priority'] === "high")
        .slice(0, 2)) {
        await MultiTenantWorkspaceService.createWorkspaceTenant({
          companyId: company.id,
          name: dept.name,
          slug: dept.slug,
          department: dept.slug,
          purpose: dept.purpose,
          visibility: "company",
          joinMode: "domain-restricted",
        });
      }

      setStep(4);
    } catch (error) {
      console.error("Workspace setup failed:", error);
    }
  };

  // 🎉 RENDER COMPONENTS
  const renderEmailCapture = () => (
    <div className="max-w-md mx-auto text-center space-y-6">
      <div className="space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Welcome to Adrata</h1>
        <p className="text-muted">
          Let&apos;s get you set up in seconds. Our AI will analyze your needs
          and create the perfect workspace.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <input
            type="email"
            value={userProfile.email}
            onChange={(e) =>
              setUserProfile((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Enter your work email"
            className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg"
            autoFocus
          />
        </div>

        <button
          onClick={handleEmailSubmit}
          disabled={!userProfile.email || isAnalyzing}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Analyzing...</span>
            </div>
          ) : (
            "Continue with Magic ✨"
          )}
        </button>
      </div>

      <p className="text-xs text-muted">
        No passwords needed. We&apos;ll send you a secure link.
      </p>
    </div>
  );

  const renderIntelligentPath = () => {
    if (!onboardingIntent) return null;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* User Profile Display */}
        <div className="bg-background rounded-lg border border-border p-6">
          <div className="flex items-center space-x-4">
            {userProfile['gravatar'] && (
              <Image
                src={userProfile.gravatar}
                alt="Profile"
                width={64}
                height={64}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Hi {userProfile.firstName || "there"}! 👋
              </h2>
              <p className="text-muted">{userProfile.email}</p>
              {userProfile['companyName'] && (
                <p className="text-sm text-muted">
                  {userProfile.companyName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Intelligent Suggestions */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">
                AI Analysis Complete (
                {Math.round(onboardingIntent.confidence * 100)}% confidence)
              </h3>
              <div className="space-y-2">
                {onboardingIntent.suggestions.map((suggestion, index) => (
                  <p key={index} className="text-gray-700 text-sm">
                    • {suggestion}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Path Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Join Existing */}
          <button
            onClick={() => selectPath("join")}
            className="p-6 bg-background border-2 border-border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground">Join Your Team</h3>
            </div>

            {onboardingIntent.companyMatches.length > 0 ? (
              <div className="space-y-2">
                {onboardingIntent.companyMatches.map((company) => (
                  <div key={company.id} className="text-sm">
                    <p className="font-medium text-foreground">{company.name}</p>
                    <p className="text-muted">
                      {company.workspaces.length} workspaces available
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">
                We&apos;ll help you find your team
              </p>
            )}
          </button>

          {/* Create New */}
          <button
            onClick={() => selectPath("create")}
            className="p-6 bg-background border-2 border-border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group text-left"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground">
                Create New Workspace
              </h3>
            </div>
            <p className="text-muted text-sm">
              Set up {userProfile.companyName || "your company"} with AI-powered
              workspace suggestions
            </p>
          </button>
        </div>
      </div>
    );
  };

  const renderMagicLink = () => (
    <div className="max-w-md mx-auto text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-foreground">Check your email!</h2>
        <p className="text-muted">
          We sent a secure link to <strong>{userProfile.email}</strong>
        </p>
        <p className="text-sm text-muted">
          Click the link to{" "}
          {selectedPath === "join" ? "join your team" : "create your workspace"}{" "}
          instantly
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          🔒 <strong>Secure & passwordless</strong> - No account required. The
          link expires in 15 minutes.
        </p>
      </div>

      <button
        onClick={
          selectedPath === "create" ? createWorkspaceSetup : sendMagicLink
        }
        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        Didn&apos;t receive it? Send another link
      </button>
    </div>
  );

  const renderSuccess = () => (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center">
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-foreground">
          🎉 Welcome to Adrata!
        </h2>
        <p className="text-xl text-muted">
          Your {selectedPath === "join" ? "team access" : "workspace"} is ready
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <h3 className="font-semibold text-foreground mb-4">
          🚀 What happens next:
        </h3>
        <div className="space-y-3 text-left">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <p className="text-gray-700">
              Explore your workspaces and discover features
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <p className="text-gray-700">
              Invite team members with one-click domain invites
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <p className="text-gray-700">
              Access AI-powered insights and recommendations
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() =>
          (window['location']['href'] =
            selectedPath === "join"
              ? "/dashboard"
              : `/${userProfile.companyName?.toLowerCase().replace(/[^a-z0-9]/g, "-")}`)
        }
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium"
      >
        Enter Your Workspace →
      </button>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Progress Indicator */}
      <div className="bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-2">
            {[0, 1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? "bg-blue-600 text-white"
                      : "bg-loading-bg text-muted"
                  }`}
                >
                  {step > stepNumber ? "✓" : stepNumber + 1}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step > stepNumber ? "bg-blue-600" : "bg-loading-bg"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 px-6">
        {step === 0 && renderEmailCapture()}
        {step === 1 && renderIntelligentPath()}
        {step === 2 && renderMagicLink()}
        {step === 3 && renderSuccess()}
      </div>
    </div>
  );
}
