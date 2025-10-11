import { Metadata } from "next";
import { ChronicleSharedView } from "@/frontend/components/pipeline/ChronicleSharedView";

export const metadata: Metadata = {
  title: "Shared Chronicle Report",
  description: "View shared Chronicle report",
};

interface ChronicleSharedPageProps {
  params: {
    token: string;
  };
}

export default function ChronicleSharedPage({ params }: ChronicleSharedPageProps) {
  return <ChronicleSharedView token={params.token} />;
}
