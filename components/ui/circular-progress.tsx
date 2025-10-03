"use client";

import { useEffect, useRef, useState } from "react";

type CircularProgressProps = {
  isActive: boolean;
  startTime?: number;
  duration: number; // Duration in milliseconds
  children: React.ReactNode;
};

export function CircularProgress({
  isActive,
  startTime,
  duration,
  children,
}: CircularProgressProps) {
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 100, height: 100 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!isActive || !startTime) {
      setProgress(0);
      return;
    }

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      }
    };

    const animationFrame = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isActive, startTime, duration]);

  const strokeWidth = 3;
  const radius = 12; // border radius in pixels (matches rounded-xl)

  // Create a rounded rectangle path that starts from top center
  // The path traces counter-clockwise around the button perimeter for clockwise countdown
  const createRoundedRectPath = (width: number, height: number, r: number) => {
    const offset = strokeWidth / 2;
    const w = width - strokeWidth;
    const h = height - strokeWidth;

    return `
      M ${width / 2} ${offset}
      L ${r + offset} ${offset}
      Q ${offset} ${offset} ${offset} ${r + offset}
      L ${offset} ${h - r + offset}
      Q ${offset} ${h + offset} ${r + offset} ${h + offset}
      L ${w - r + offset} ${h + offset}
      Q ${w + offset} ${h + offset} ${w + offset} ${h - r + offset}
      L ${w + offset} ${r + offset}
      Q ${w + offset} ${offset} ${w - r + offset} ${offset}
      L ${width / 2} ${offset}
    `.trim();
  };

  return (
    <div className="relative" ref={containerRef}>
      {children}
      {isActive && (
        <svg
          key={startTime}
          className="absolute inset-0 z-10 pointer-events-none animate-in fade-in duration-200"
          style={{
            width: "100%",
            height: "100%",
          }}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d={createRoundedRectPath(
              dimensions.width,
              dimensions.height,
              radius
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-brand-600 dark:text-brand-400"
            strokeDasharray="1"
            strokeDashoffset={progress / 100}
            pathLength="1"
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.1s linear",
            }}
          />
        </svg>
      )}
    </div>
  );
}
