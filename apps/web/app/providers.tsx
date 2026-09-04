"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

import { MotionProvider } from "@/components/MotionProvider";

export function Providers({
  children,
  initialReducedMotion,
}: {
  children: React.ReactNode;
  initialReducedMotion: boolean;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <MotionProvider initialReducedMotion={initialReducedMotion}>
          {children}
        </MotionProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
