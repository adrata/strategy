"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function GrandCentralPage() {
  const router = useRouter();
  const params = useParams();
  const workspace = params.workspace;
  
  useEffect(() => {
    // Redirect to the full workspace path
    router.replace(`/${workspace}/grand-central/workshop`);
  }, [router, workspace]);
  
  return null; // Or loading state
}