"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ApiPage() {
  const params = useParams();
  const router = useRouter();
  const workspace = params.workspace;

  useEffect(() => {
    router.replace(`/${workspace}/api/get-started`);
  }, [workspace, router]);

  return null;
}
