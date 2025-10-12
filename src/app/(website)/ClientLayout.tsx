"use client";
import React, { useEffect } from "react";
import { applySafariFixes, loadSafariPolyfills } from "@/platform/utils/safari-fixes";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Apply Safari compatibility fixes with error handling
    try {
      loadSafariPolyfills();
      applySafariFixes();
    } catch (error) {
      console.warn('🚨 [SAFARI COMPAT] Failed to apply Safari fixes:', error);
    }
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden overflow-y-auto transition-colors duration-300">
      {children}
    </div>
  );
}