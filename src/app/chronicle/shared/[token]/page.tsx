import { Metadata } from "next";
import { ChronicleSharedView } from "@/frontend/components/pipeline/ChronicleSharedView";

export const metadata: Metadata = {
  title: "Shared Chronicle Report",
  description: "Publicly shared chronicle report",
};

export default function ChronicleSharedPage() {
  return <ChronicleSharedView />;
}