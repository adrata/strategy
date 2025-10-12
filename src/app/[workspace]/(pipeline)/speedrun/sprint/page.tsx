"use client";

import { useEffect } from "react";
import { SpeedrunSprintView } from "@/frontend/components/pipeline/SpeedrunSprintView";

export default function SpeedrunSprintPage() {
  // Set the page title to "Sprint" when this component mounts
  useEffect(() => {
    document.title = "Sprint";
  }, []);

  return <SpeedrunSprintView />;
}
