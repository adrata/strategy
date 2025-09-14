"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/platform/shared/components/ui/card";

interface ContactProps {
  contact: {
    id: string;
    name: string;
    email: string;
    phone: string;
    title: string;
    role: string;
    company: string;
    linkedinUrl?: string;
    contactType: string;
    buyingInfluence: string;
    relationshipStrength: string;
    status: string;
    source: string;
    owner: string;
    tags: string[];
    notes: string;
    directionalIntelligence: string;
    bestRoute: string;
    socialProfiles: {
      linkedin?: string;
      twitter?: string;
      github?: string;
    };
    careerHistory: Array<{
      company: string;
      title: string;
      startDate: string;
      endDate?: string;
      isCurrent: boolean;
      description: string;
    }>;
    workplaceInfo: {
      department: string;
      location: string;
      manager: string;
      teamSize: number;
      responsibilities: string[];
    };
    createdAt: string;
    updatedAt: string;
  };
}

export function EnhancedContactView({ contact }: ContactProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "profile" | "career" | "workplace" | "timeline"
  >("overview");
  const [isEditing, setIsEditing] = useState(false);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "profile", label: "Profile" },
    { id: "career", label: "Career" },
    { id: "workplace", label: "Workplace" },
    { id: "timeline", label: "Timeline" },
  ];

  const getBuyingInfluenceColor = (influence: string) => {
    switch (influence) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case "champion":
        return "bg-purple-100 text-purple-800";
      case "decision-maker":
        return "bg-blue-100 text-blue-800";
      case "influencer":
        return "bg-indigo-100 text-indigo-800";
      case "gatekeeper":
        return "bg-orange-100 text-orange-800";
      case "end-user":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {contact.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {contact.name}
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-lg text-gray-600">{contact.title}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getContactTypeColor(contact.contactType)}`}
                >
                  {contact.contactType.replace("-", " ").toUpperCase()}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getBuyingInfluenceColor(contact.buyingInfluence)}`}
                >
                  {contact.buyingInfluence.toUpperCase()} INFLUENCE
                </span>
              </div>
              <p className="text-gray-500 mt-1">{contact.company}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isEditing ? "Save" : "Edit"}
          </button>
        </div>
      </div>

      {/* Directional Intelligence - Prominent */}
      <div className="px-8 py-6 bg-blue-50 border-b border-blue-100">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">
          🧠 Directional Intelligence
        </h3>
        <p className="text-blue-900 leading-relaxed">
          {contact.directionalIntelligence}
        </p>
      </div>

      {/* Best Route - Action-Oriented */}
      <div className="px-8 py-4 bg-green-50 border-b border-green-100">
        <h3 className="text-sm font-semibold text-green-800 mb-2">
          🎯 Best Route
        </h3>
        <p className="text-green-900">{contact.bestRoute}</p>
      </div>

      {/* Core Contact Information */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <p className="text-gray-900">{contact.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">{contact.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <p className="text-gray-900">{contact.role}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn
              </label>
              {contact.linkedinUrl ? (
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Profile
                </a>
              ) : (
                <span className="text-gray-500">Not available</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship Strength
              </label>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  contact['relationshipStrength'] === "strong"
                    ? "bg-green-100 text-green-800"
                    : contact['relationshipStrength'] === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : contact['relationshipStrength'] === "weak"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {contact.relationshipStrength.toUpperCase()}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  contact['status'] === "active"
                    ? "bg-green-100 text-green-800"
                    : contact['status'] === "inactive"
                      ? "bg-gray-100 text-gray-800"
                      : contact['status'] === "bounced"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {contact.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="px-8 py-6 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-900 whitespace-pre-wrap">{contact.notes}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-gray-400 text-gray-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-8 py-6 min-h-[400px]">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Overview
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Source
                  </h4>
                  <p className="text-gray-900">{contact.source}</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Owner</h4>
              <p className="text-gray-900">{contact.owner}</p>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Social Profiles
              </h3>
              <div className="space-y-3">
                {contact['socialProfiles']['linkedin'] && (
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-600 font-medium">LinkedIn:</span>
                    <a
                      href={contact.socialProfiles.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {contact.socialProfiles.linkedin}
                    </a>
                  </div>
                )}
                {contact['socialProfiles']['twitter'] && (
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-400 font-medium">Twitter:</span>
                    <a
                      href={`https://twitter.com/${contact.socialProfiles.twitter.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {contact.socialProfiles.twitter}
                    </a>
                  </div>
                )}
                {contact['socialProfiles']['github'] && (
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-800 font-medium">GitHub:</span>
                    <a
                      href={contact.socialProfiles.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-800 hover:underline"
                    >
                      {contact.socialProfiles.github}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "career" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Career History
            </h3>
            <div className="space-y-4">
              {contact.careerHistory.map((entry, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-200 pl-4 py-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{entry.title}</h4>
                    {entry['isCurrent'] && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p className="text-blue-600 font-medium">{entry.company}</p>
                  <p className="text-gray-500 text-sm">
                    {entry.startDate} - {entry.endDate || "Present"}
                  </p>
                  {entry['description'] && (
                    <p className="text-gray-700 mt-2">{entry.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "workplace" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Workplace Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Department
                  </h4>
                  <p className="text-gray-900">
                    {contact.workplaceInfo.department}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Location
                  </h4>
                  <p className="text-gray-900">
                    {contact.workplaceInfo.location}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Manager
                  </h4>
                  <p className="text-gray-900">
                    {contact.workplaceInfo.manager || "Not specified"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Team Size
                  </h4>
                  <p className="text-gray-900">
                    {contact.workplaceInfo.teamSize || "Not specified"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Responsibilities
                  </h4>
                  <ul className="text-gray-900 space-y-1">
                    {contact.workplaceInfo.responsibilities.map(
                      (resp, index) => (
                        <li key={index} className="text-sm">
                          • {resp}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activity History
            </h3>
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <p>Activity history will be displayed here</p>
              <p className="text-sm mt-2">
                Integration with activity tracking system coming soon
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
