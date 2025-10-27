import { Metadata } from "next";
import { ChronicleSharedView } from "@/frontend/components/pipeline/ChronicleSharedView";

export const metadata: Metadata = {
  title: "Shared Chronicle Report",
  description: "Publicly shared chronicle report",
};

// Required for static export
export async function generateStaticParams() {
  // Return empty array for dynamic routes that don't need pre-generation
  return [];
}

export default function ChronicleSharedPage() {
  return <ChronicleSharedView />;
}