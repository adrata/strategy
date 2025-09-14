const handleLinkedInClick = async (linkedinUrl: string, leadName: string) => {
  try {
    console.log("🔗 [LINKEDIN] Opening LinkedIn profile for:", leadName);

    // Open in default browser
    if (typeof window !== "undefined" && window.open) {
      window.open(linkedinUrl, "_blank");
      console.log("✅ [LINKEDIN] Opened in default browser");
    }
  } catch (error) {
    console.error("❌ [LINKEDIN] Failed to open LinkedIn profile:", error);
  }
};
