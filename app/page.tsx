"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEvents } from "@/components/ui/events-provider";
import { QuickStats } from "@/components/ui/quick-stats";
import { ActiveTimerList } from "@/components/ui/timer-list";
import { CircularProgress } from "@/components/ui/circular-progress";

type QuickActionType =
  | "bottle"
  | "food"
  | "wet"
  | "dirty"
  | "sleep"
  | "nursing"
  | "pumping";

type VolumeTracker = {
  type: QuickActionType;
  amountOz: number;
  startTime: number;
  timeoutId: NodeJS.Timeout;
};

const VOLUME_TRACKING_DURATION = 10000; // 10 seconds

export default function HomePage() {
  const {
    events,
    baby,
    logEvent,
    timers,
    stopTimer,
    startTimer,
    openComposer,
  } = useEvents();
  const [volumeTracker, setVolumeTracker] = useState<VolumeTracker | null>(
    null
  );
  const volumeTrackerRef = useRef<VolumeTracker | null>(null);

  // Sync ref with state
  useEffect(() => {
    volumeTrackerRef.current = volumeTracker;
  }, [volumeTracker]);

  const sleepTimer = useMemo(() => {
    return timers.find((t) => t.type === "sleep");
  }, [timers]);

  const lastEventByAction = useMemo(() => {
    const result: Partial<Record<QuickActionType, string>> = {};
    for (const event of events) {
      if (event.type === "feed") {
        const feedEvent = event as any;
        if (feedEvent.method === "bottle" && !result.bottle) {
          result.bottle = event.timestamp;
        } else if (feedEvent.method === "solid" && !result.food) {
          result.food = event.timestamp;
        } else if (feedEvent.method === "breast" && !result.nursing) {
          result.nursing = event.timestamp;
        }
      } else if (event.type === "diaper") {
        const diaperEvent = event as any;
        if (diaperEvent.diaperType === "wet" && !result.wet) {
          result.wet = event.timestamp;
        } else if (diaperEvent.diaperType === "dirty" && !result.dirty) {
          result.dirty = event.timestamp;
        }
      } else if (event.type === "sleep" && !result.sleep) {
        result.sleep = event.timestamp;
      } else if (event.type === "pump" && !result.pumping) {
        result.pumping = event.timestamp;
      }
    }
    return result;
  }, [events]);

  const finalizeVolumeTracking = useCallback(
    async (tracker: VolumeTracker) => {
      clearTimeout(tracker.timeoutId);

      // Log the event with accumulated volume
      if (tracker.type === "bottle") {
        await logEvent({
          type: "feed",
          method: "bottle",
          amountOz: tracker.amountOz,
        });
      } else if (tracker.type === "food") {
        await logEvent({
          type: "feed",
          method: "solid",
          amountOz: tracker.amountOz,
        });
      } else if (tracker.type === "nursing") {
        await logEvent({
          type: "feed",
          method: "breast",
          amountOz: tracker.amountOz,
        });
      } else if (tracker.type === "pumping") {
        await logEvent({
          type: "pump",
          amountOz: tracker.amountOz,
        });
      }

      setVolumeTracker(null);
    },
    [logEvent]
  );

  const handleQuickAction = useCallback(
    async (action: QuickActionType | "misc") => {
      // Handle misc event (opens composer)
      if (action === "misc") {
        openComposer("misc");
        return;
      }

      const now = Date.now();

      // Handle volume-tracked actions (bottle, food, nursing, pumping)
      if (
        action === "bottle" ||
        action === "food" ||
        action === "nursing" ||
        action === "pumping"
      ) {
        const currentTracker = volumeTrackerRef.current;

        // If there's an active tracker for the same action type
        if (currentTracker && currentTracker.type === action) {
          const timeSinceStart = now - currentTracker.startTime;

          if (timeSinceStart < VOLUME_TRACKING_DURATION) {
            // Increment volume and reset timeout with new startTime to restart animation
            clearTimeout(currentTracker.timeoutId);
            const newAmount = currentTracker.amountOz + 1;
            const timeoutId = setTimeout(() => {
              if (volumeTrackerRef.current) {
                finalizeVolumeTracking(volumeTrackerRef.current);
              }
            }, VOLUME_TRACKING_DURATION);

            setVolumeTracker({
              type: action,
              amountOz: newAmount,
              startTime: now, // Reset startTime to restart animation
              timeoutId,
            });
            return;
          } else {
            // Time expired, finalize old tracker and start new one
            await finalizeVolumeTracking(currentTracker);
          }
        } else if (currentTracker) {
          // Different action type, finalize old tracker first
          await finalizeVolumeTracking(currentTracker);
        }

        // Start new volume tracking
        const timeoutId = setTimeout(() => {
          if (volumeTrackerRef.current) {
            finalizeVolumeTracking(volumeTrackerRef.current);
          }
        }, VOLUME_TRACKING_DURATION);

        setVolumeTracker({
          type: action,
          amountOz: 1,
          startTime: now,
          timeoutId,
        });
        return;
      }

      // Handle diaper actions (immediate logging)
      if (action === "wet") {
        await logEvent({
          type: "diaper",
          diaperType: "wet",
        });
        return;
      }

      if (action === "dirty") {
        await logEvent({
          type: "diaper",
          diaperType: "dirty",
        });
        return;
      }

      // Handle sleep (toggle timer)
      if (action === "sleep") {
        if (sleepTimer) {
          // Stop the timer
          await stopTimer(sleepTimer.id);
        } else {
          // Start the timer
          await startTimer("sleep");
        }
        return;
      }
    },
    [
      logEvent,
      sleepTimer,
      stopTimer,
      startTimer,
      finalizeVolumeTracking,
      openComposer,
    ]
  );

  const quickActions: {
    type: QuickActionType | "misc";
    label: string;
    emoji: string;
  }[] = [
    { type: "bottle", label: "Bottle", emoji: "🍼" },
    { type: "food", label: "Food", emoji: "🥄" },
    { type: "wet", label: "Wet Diaper", emoji: "💧" },
    { type: "dirty", label: "Dirty Diaper", emoji: "💩" },
    { type: "sleep", label: sleepTimer ? "End Sleep" : "Sleep", emoji: "😴" },
    { type: "nursing", label: "Nursing", emoji: "🤱" },
    { type: "pumping", label: "Pumping", emoji: "🫙" },
    { type: "misc", label: "Misc", emoji: "📝" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="w-full max-w-4xl space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Hello, {baby.name}&apos;s crew
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Quick tap to log. Multiple taps within 30 seconds for
                feeding/pumping to track volume.
              </p>
            </div>
            <QuickStats events={events} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {quickActions.map((action) => {
              const isActive =
                (action.type === "sleep" && sleepTimer) ||
                (volumeTracker && volumeTracker.type === action.type);
              const volumeDisplay =
                volumeTracker && volumeTracker.type === action.type
                  ? `${volumeTracker.amountOz}oz`
                  : null;

              // Determine if this action type supports volume tracking (shows countdown)
              const isVolumeTrackedAction =
                action.type === "bottle" ||
                action.type === "food" ||
                action.type === "nursing" ||
                action.type === "pumping";

              const buttonContent = (
                <button
                  key={action.type}
                  className={`rounded-xl p-4 transition focus-visible:ring-2 w-full aspect-square flex flex-col items-center justify-between ${
                    isActive && isVolumeTrackedAction
                      ? "border-2 border-transparent bg-brand-50 dark:bg-brand-900/20"
                      : isActive
                      ? "border border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/20"
                      : "border border-slate-200 bg-slate-50 hover:border-brand-400 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-300"
                  }`}
                  onClick={() => handleQuickAction(action.type)}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-5xl">{action.emoji}</span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 text-center">
                      {action.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full justify-center h-6">
                    {volumeDisplay && (
                      <span className="rounded-full bg-brand-500 px-2 py-1 text-xs font-bold text-white">
                        {volumeDisplay}
                      </span>
                    )}
                    {action.type === "sleep" && sleepTimer && (
                      <span className="rounded-full bg-brand-500 px-2 py-1 text-xs font-bold text-white animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="h-5 flex items-center justify-center">
                    {action.type !== "misc" &&
                    lastEventByAction[action.type] &&
                    !isActive ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(
                          lastEventByAction[action.type]!
                        ).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    ) : null}
                  </div>
                </button>
              );

              // Wrap volume-tracked actions with CircularProgress
              if (isVolumeTrackedAction) {
                return (
                  <CircularProgress
                    key={action.type}
                    isActive={volumeTracker?.type === action.type}
                    startTime={volumeTracker?.startTime}
                    duration={VOLUME_TRACKING_DURATION}
                  >
                    {buttonContent}
                  </CircularProgress>
                );
              }

              return buttonContent;
            })}
          </div>
        </section>
        <ActiveTimerList />
      </div>
    </div>
  );
}
