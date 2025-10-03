"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect user inactivity
 * @param timeout - Time in milliseconds before considered inactive
 * @returns boolean indicating if the user is currently inactive
 */
export function useInactivity(timeout: number = 60000) {
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      setIsInactive(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsInactive(true);
      }, timeout);
    };

    // Events that indicate user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Add event listeners for all activity events
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, true);
    });

    // Start the initial timer
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [timeout]);

  return isInactive;
}
