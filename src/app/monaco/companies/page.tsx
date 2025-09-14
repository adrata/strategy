"use client";

import React from "react";
import { ZoomProvider } from "@/platform/ui/components/ZoomProvider";
import { MonacoApp } from "@/products/monaco/components/MonacoApp";

export default function MonacoCompaniesPage() {
  return (
    <ZoomProvider>
      <MonacoApp />
    </ZoomProvider>
  );
} 