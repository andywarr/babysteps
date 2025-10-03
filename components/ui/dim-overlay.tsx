"use client";

import { useInactivity } from "@/lib/hooks/use-inactivity";

/**
 * Component that displays a dim overlay after 1 minute of user inactivity
 * Tapping anywhere on the overlay will dismiss it and reset the inactivity timer
 */
export function DimOverlay() {
  const isInactive = useInactivity(60000); // 1 minute

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 bg-black transition-opacity duration-1000 ${
        isInactive ? "opacity-60" : "opacity-0"
      }`}
      style={{
        pointerEvents: isInactive ? "auto" : "none",
      }}
      onClick={(e) => {
        // Click will be handled by the inactivity hook's event listeners
        // This just provides a clickable surface
        e.stopPropagation();
      }}
    />
  );
}
