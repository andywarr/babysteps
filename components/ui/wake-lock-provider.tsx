"use client";

import { useWakeLock } from "@/lib/hooks/use-wake-lock";

/**
 * Provider component that keeps the screen awake
 * Place this high in the component tree (e.g., in the root layout)
 */
export function WakeLockProvider({ children }: { children: React.ReactNode }) {
  useWakeLock();
  return <>{children}</>;
}
