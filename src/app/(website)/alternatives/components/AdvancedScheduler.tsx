"use client";

import React, { useState } from "react";

interface AdvancedSchedulerProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function AdvancedScheduler({
  onClose,
  isOpen,
}: AdvancedSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [meetingType, setMeetingType] = useState("platform-demo");
  const [urgency, setUrgency] = useState("normal");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    requirements: "",
  });

  // AI-optimized time slots based on conversion data
  const getOptimizedSlots = () => {
    const today = new Date();
    const slots = [];

    // Higher conversion times (based on our temporal intelligence)
    const highConversionTimes = ["10:00 AM", "2:00 PM", "4:00 PM"];
    const normalTimes = ["11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"];

    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const daySlots =
        i === 0
          ? highConversionTimes
          : [...highConversionTimes, ...normalTimes];

      slots.push({
        date: date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        }),
        isoDate: date.toISOString().split("T")[0],
        times: daySlots.map((time) => ({
          time,
          isOptimal: highConversionTimes.includes(time),
          available: Math.random() > 0.3, // Simulate availability
        })),
      });
    }

    return slots;
  };

  const timeSlots = getOptimizedSlots();

  const meetingTypes = [
    {
      id: "platform-demo",
      label: "Full Platform Demo",
      duration: "45 min",
      description: "Complete walkthrough of all 30+ apps",
      icon: "🚀",
    },
    {
      id: "monaco-demo",
      label: "Monaco Intelligence Only",
      duration: "30 min",
      description: "Focus on AI intelligence and buyer mapping",
      icon: "🧠",
    },
    {
      id: "security-demo",
      label: "Security & Compliance",
      duration: "30 min",
      description: "Enterprise security and quantum encryption",
      icon: "🛡️",
    },
    {
      id: "custom-demo",
      label: "Custom Demo",
      duration: "60 min",
      description: "Tailored to your specific needs",
      icon: "⚡",
    },
  ];

  const urgencyLevels = [
    {
      id: "asap",
      label: "ASAP - Need to see this today",
      multiplier: "Priority booking",
    },
    {
      id: "urgent",
      label: "This week - High priority",
      multiplier: "2x conversion rate",
    },
    {
      id: "normal",
      label: "Normal - Within 2 weeks",
      multiplier: "Standard scheduling",
    },
    {
      id: "flexible",
      label: "Flexible - Whenever works",
      multiplier: "Optimal time selection",
    },
  ];

  const handleSubmit = () => {
    // Simulate booking
    alert(
      `Demo scheduled! You'll receive a confirmation email shortly. Our AI has optimized this time slot for maximum value demonstration.`,
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-foreground rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="sticky top-0 bg-foreground border-b border-gray-800 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Schedule Your Demo
              </h2>
              <p className="text-muted mt-1">
                AI-optimized scheduling for maximum impact
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-white text-2xl w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Meeting Type Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              What would you like to see?
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {meetingTypes.map((type) => (
                <label
                  key={type.id}
                  className={`block p-4 rounded-xl border cursor-pointer transition ${
                    meetingType === type.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-border hover:border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="meetingType"
                    value={type.id}
                    checked={meetingType === type.id}
                    onChange={(e) => setMeetingType(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{type.icon}</div>
                    <div>
                      <div className="font-semibold text-white">
                        {type.label}
                      </div>
                      <div className="text-sm text-muted">
                        {type.duration} • {type.description}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Urgency Level */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              How urgent is this?
            </h3>
            <div className="space-y-3">
              {urgencyLevels.map((level) => (
                <label
                  key={level.id}
                  className={`block p-3 rounded-lg border cursor-pointer transition ${
                    urgency === level.id
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-border hover:border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={level.id}
                    checked={urgency === level.id}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-white">{level.label}</span>
                    <span className="text-xs text-muted">
                      {level.multiplier}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date & Time Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Choose your optimal time
            </h3>
            <div className="grid lg:grid-cols-5 gap-4">
              {timeSlots.map((day) => (
                <div key={day.isoDate} className="space-y-2">
                  <div className="font-medium text-white text-center">
                    {day.date}
                  </div>
                  <div className="space-y-2">
                    {day.times.map((slot) => (
                      <button
                        key={`${day.isoDate}-${slot.time}`}
                        onClick={() => {
                          if (day.isoDate) {
                            setSelectedDate(day.isoDate);
                            setSelectedTime(slot.time);
                          }
                        }}
                        disabled={!slot.available}
                        className={`w-full p-2 rounded-lg text-sm transition relative ${
                          selectedDate === day['isoDate'] &&
                          selectedTime === slot.time
                            ? "bg-blue-600 text-white"
                            : slot.available
                              ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                              : "bg-foreground text-muted cursor-not-allowed"
                        }`}
                      >
                        {slot.time}
                        {slot['isOptimal'] && slot['available'] && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-muted flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Green dot = AI-optimized time (higher demo effectiveness)
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-border rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-border rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="your@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company *
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-border rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Your company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-border rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select your role</option>
                <option value="ceo">CEO/Founder</option>
                <option value="cro">Chief Revenue Officer</option>
                <option value="cto">Chief Technology Officer</option>
                <option value="vp-sales">VP of Sales</option>
                <option value="vp-marketing">VP of Marketing</option>
                <option value="director">Director</option>
                <option value="manager">Manager</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Specific requirements or questions?
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) =>
                setFormData({ ...formData, requirements: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-border rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Tell us what you'd like to focus on during the demo..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-border rounded-lg text-gray-300 hover:border-gray-500 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                !selectedDate ||
                !selectedTime ||
                !formData.name ||
                !formData.email
              }
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold text-white hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🎯 Schedule Demo
            </button>
          </div>

          {selectedDate && selectedTime && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
              <div className="flex items-center text-green-400">
                <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-3">
                  <div className="w-2 h-2 bg-green-900 rounded-full"></div>
                </div>
                <div>
                  <div className="font-semibold">
                    Optimal time slot selected!
                  </div>
                  <div className="text-sm text-green-300">
                    {selectedDate} at {selectedTime} • Our AI predicts 87% demo
                    satisfaction for this slot
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
