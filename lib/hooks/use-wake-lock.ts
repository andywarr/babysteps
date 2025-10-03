"use client";

import { useEffect, useRef } from "react";

/**
 * Hook to keep the screen awake using the Screen Wake Lock API
 * Automatically requests a wake lock on mount and releases it on unmount
 * Also handles visibility changes to re-acquire the lock when returning to the app
 */
export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check if the Wake Lock API is supported
    if (!("wakeLock" in navigator)) {
      console.warn("Wake Lock API is not supported in this browser");
      return;
    }

    const requestWakeLock = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        console.log("Wake Lock acquired");
      } catch (err) {
        console.error("Failed to acquire Wake Lock:", err);
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        wakeLockRef.current === null
      ) {
        requestWakeLock();
      }
    };

    // Request wake lock on mount
    requestWakeLock();

    // Re-request wake lock when user returns to the app
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup: release wake lock on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          console.log("Wake Lock released");
          wakeLockRef.current = null;
        });
      }
    };
  }, []);
}
