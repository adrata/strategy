import React, { useState, useEffect } from "react";
import type { Lead } from "@/platform/data-service";

interface ConvertLeadConfirmationProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// Confetti animation component
const Confetti = ({ isActive }: { isActive: boolean }) => {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      color: string;
      size: number;
      velocityX: number;
      velocityY: number;
      rotation: number;
      rotationSpeed: number;
    }>
  >([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    // Create confetti particles
    const colors = [
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#f59e0b",
      "#ef4444",
      "#06b6d4",
      "#84cc16",
    ];
    const newParticles = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)] || "#10b981",
      size: Math.random() * 12 + 8, // Bigger particles: 8-20px
      velocityX: (Math.random() - 0.5) * 6,
      velocityY: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    }));

    setParticles(newParticles);

    // Animate particles
    const animateParticles = () => {
      setParticles((prevParticles) =>
        prevParticles
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.velocityX,
            y: particle.y + particle.velocityY,
            rotation: particle.rotation + particle.rotationSpeed,
            velocityY: particle.velocityY + 0.1, // Gravity
          }))
          .filter((particle) => particle.y < window.innerHeight + 20),
      );
    };

    const interval = setInterval(animateParticles, 16); // 60fps

    // Clear after 4 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setParticles([]);
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
};

export const ConvertLeadConfirmation: React.FC<
  ConvertLeadConfirmationProps
> = ({ lead, isOpen, onClose, onConfirm }) => {
  const [isConverting, setIsConverting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const getNextStage = (currentStage: string) => {
    // Updated pipeline stages: Generate → Initiate → Educate → Opportunity
    const stageMap: Record<string, string> = {
      Generate: "Initiate",
      Initiate: "Educate", 
      Educate: "Opportunity",
      Opportunity: "Customer",
    };
    return stageMap[currentStage] || "Opportunity"; // Default to Opportunity for leads
  };

  // Get current stage from lead, defaulting to Generate if not set
  const currentStage = lead.currentStage || "Generate";
  const nextStage = getNextStage(currentStage);
  const isFinalConversion = nextStage === "Customer";

  const handleConfirm = async () => {
    setIsConverting(true);

    try {
      // ✅ FIX: Actually call the real conversion logic instead of fake simulation
      console.log("🔄 [CONVERT_MODAL] Starting real conversion process...", {
        leadId: lead.id,
        currentStage: currentStage,
        nextStage: nextStage,
        isFinalConversion: isFinalConversion,
      });

      // Call the real conversion function passed from LeadDetails
      await onConfirm();

      console.log("✅ [CONVERT_MODAL] Conversion completed successfully");

      // Show confetti for final conversion only
      if (isFinalConversion) {
        setShowConfetti(true);
        // Let confetti run for a bit
        setTimeout(() => {
          setIsConverting(false);
        }, 2000);
      } else {
        setIsConverting(false);
      }
    } catch (error) {
      console.error("❌ [CONVERT_MODAL] Conversion failed:", error);
      setIsConverting(false);

      // Show error to user
      alert(
        `Conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const getConversionMessage = () => {
    if (isFinalConversion) {
      return {
        title: "🎉 Final Conversion!",
        subtitle: `Converting ${lead.name} to Customer - Creating Contact & Account records`,
        benefits: [
          "• Lead converted to Contact record",
          "• Company converted to Account record",
          "• All team members converted to Contacts",
          "• Full Pipeline history preserved",
          "• Sales cycle completed successfully",
        ],
      };
    } else if (nextStage === "Opportunity") {
      return {
        title: "Create Opportunity!",
        subtitle: `Creating an Opportunity for ${lead.name}`,
        benefits: [
          `• Lead converted to Opportunity`,
          "• Full pipeline tracking activated",
          "• Revenue forecasting enabled",
          "• Team notifications sent for next actions",
        ],
      };
    } else {
      return {
        title: "Ready to Advance!",
        subtitle: `Move ${lead.name} to the next pipeline stage`,
        benefits: [
          `• Lead progresses to ${nextStage} stage`,
          "• Automated follow-up sequences activated",
          "• Pipeline data updated with stage progression",
          "• Team notifications sent for next actions",
        ],
      };
    }
  };

  const conversionMsg = getConversionMessage();

  if (!isOpen) return null;

  return (
    <>
      <Confetti isActive={showConfetti} />
      <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden">
          {/* Header with gradient */}
          <div
            className={`${isFinalConversion ? "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" : "bg-gradient-to-r from-emerald-500 to-blue-600"} px-6 py-8 text-center`}
          >
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
              {isFinalConversion ? (
                <svg
                  className="w-8 h-8 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {conversionMsg.title}
            </h2>
            <p
              className={`${isFinalConversion ? "text-purple-100" : "text-emerald-100"}`}
            >
              {conversionMsg.subtitle}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Current vs Next Stage */}
            <div className="bg-panel-background rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="text-sm font-medium text-muted mb-1">
                    Current Stage
                  </div>
                  <div
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                      currentStage === "Generate"
                        ? "bg-yellow-100 text-yellow-800"
                        : currentStage === "Initiate"
                          ? "bg-blue-100 text-blue-800"
                          : currentStage === "Educate"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {currentStage}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 mx-4">
                  <svg
                    className="w-6 h-6 text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5-5 5M6 12h12"
                    />
                  </svg>
                </div>

                <div className="text-center flex-1">
                  <div className="text-sm font-medium text-muted mb-1">
                    Next Stage
                  </div>
                  <div
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                      isFinalConversion
                        ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700"
                        : "bg-gradient-to-r from-emerald-100 to-blue-100 text-emerald-700"
                    }`}
                  >
                    {nextStage}
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-muted">Name</span>
                <span className="text-sm text-foreground">{lead.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-muted">
                  Company
                </span>
                <span className="text-sm text-foreground">
                  {lead.company || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-muted">Role</span>
                <span className="text-sm text-foreground">
                  {lead.buyerGroupRole || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-muted">Email</span>
                <span className="text-sm text-foreground">
                  {lead.email || "-"}
                </span>
              </div>
            </div>

            {/* Conversion Benefits */}
            <div
              className={`${isFinalConversion ? "bg-gradient-to-r from-purple-50 to-pink-50" : "bg-gradient-to-r from-emerald-50 to-blue-50"} rounded-lg p-4 mb-6`}
            >
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                {isFinalConversion
                  ? "🎉 Final conversion creates:"
                  : "✨ What happens after conversion:"}
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                {conversionMsg.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-panel-background flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isConverting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-background border border-border rounded-lg hover:bg-panel-background focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConverting}
              className={`px-6 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2 ${
                isFinalConversion
                  ? "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600"
                  : "bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
              }`}
            >
              {isConverting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>
                    {isFinalConversion
                      ? "Converting to Customer..."
                      : "Converting..."}
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5-5 5M6 12h12"
                    />
                  </svg>
                  <span>
                    {isFinalConversion ? "Convert to Customer" : "Convert Lead"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
