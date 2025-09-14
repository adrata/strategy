"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a QueryClient instance for Monaco components
const monacoQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

interface MonacoQueryProviderProps {
  children: React.ReactNode;
}

export function MonacoQueryProvider({ children }: MonacoQueryProviderProps) {
  return (
    <QueryClientProvider client={monacoQueryClient}>
      {children}
    </QueryClientProvider>
  );
}
