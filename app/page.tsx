"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEvents } from "@/components/ui/events-provider";
import { QuickStats } from "@/components/ui/quick-stats";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useInterval } from "@/lib/hooks/use-interval";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type QuickActionType =
  | "bottle"
  | "food"
  | "wet"
  | "dirty"
  | "sleep"
  | "nursing"
  | "pumping"
  | "misc";

type VolumeTracker = {
  type: QuickActionType;
  amountOz: number;
  amountTsp: number;
  startTime: number;
  timeoutId: NodeJS.Timeout;
};

const VOLUME_TRACKING_DURATION = 10000; // 10 seconds

function formatLastEventTime(timestamp: string): string {
  const eventDate = dayjs(timestamp);
  const today = dayjs().startOf("day");
  const diffDays = today.diff(eventDate.startOf("day"), "day");
  const timeStr = eventDate.format("h:mm A");

  if (diffDays === 0) {
    return `Today ${timeStr}`;
  } else if (diffDays === 1) {
    return `Yesterday ${timeStr}`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago ${timeStr}`;
  } else {
    const weeks = Math.floor(diffDays / 7);
    if (weeks === 1) {
      return `1 week ago ${timeStr}`;
    } else {
      return `${weeks} weeks ago ${timeStr}`;
    }
  }
}

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
  const [now, setNow] = useState(() => Date.now());

  useInterval(() => setNow(Date.now()), 1000);

  // Sync ref with state
  useEffect(() => {
    volumeTrackerRef.current = volumeTracker;
  }, [volumeTracker]);

  const sleepTimer = useMemo(() => {
    return timers.find((t) => t.type === "sleep");
  }, [timers]);

  const nursingTimer = useMemo(() => {
    return timers.find((t) => t.type === "feed");
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
      } else if (event.type === "misc" && !result.misc) {
        result.misc = event.timestamp;
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
          amountTsp: tracker.amountTsp,
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
    async (action: QuickActionType) => {
      // Handle misc event (opens composer)
      if (action === "misc") {
        openComposer("misc");
        return;
      }

      const now = Date.now();

      // Handle volume-tracked actions (bottle, food, pumping)
      if (action === "bottle" || action === "food" || action === "pumping") {
        const currentTracker = volumeTrackerRef.current;

        // If there's an active tracker for the same action type
        if (currentTracker && currentTracker.type === action) {
          const timeSinceStart = now - currentTracker.startTime;

          if (timeSinceStart < VOLUME_TRACKING_DURATION) {
            // Increment volume and reset timeout with new startTime to restart animation
            clearTimeout(currentTracker.timeoutId);
            const newAmountOz =
              action === "food"
                ? currentTracker.amountOz
                : currentTracker.amountOz + 1;
            const newAmountTsp =
              action === "food"
                ? currentTracker.amountTsp + 1
                : currentTracker.amountTsp;
            const timeoutId = setTimeout(() => {
              if (volumeTrackerRef.current) {
                finalizeVolumeTracking(volumeTrackerRef.current);
              }
            }, VOLUME_TRACKING_DURATION);

            setVolumeTracker({
              type: action,
              amountOz: newAmountOz,
              amountTsp: newAmountTsp,
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
          amountOz: action === "food" ? 0 : 1,
          amountTsp: action === "food" ? 1 : 0,
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

      // Handle nursing (toggle timer)
      if (action === "nursing") {
        if (nursingTimer) {
          // Stop the timer
          await stopTimer(nursingTimer.id);
        } else {
          // Start the timer
          await startTimer("feed");
        }
        return;
      }
    },
    [
      logEvent,
      sleepTimer,
      nursingTimer,
      stopTimer,
      startTimer,
      finalizeVolumeTracking,
      openComposer,
    ]
  );

  const quickActions: {
    type: QuickActionType;
    label: string;
    emoji: string;
  }[] = [
    { type: "bottle", label: "Bottle", emoji: "🍼" },
    {
      type: "nursing",
      label: nursingTimer ? "End Nursing" : "Nursing",
      emoji: "🤱",
    },
    { type: "pumping", label: "Pumping", emoji: "🫙" },
    { type: "food", label: "Food", emoji: "🥄" },
    { type: "dirty", label: "Dirty Diaper", emoji: "💩" },
    { type: "wet", label: "Wet Diaper", emoji: "💧" },
    { type: "sleep", label: sleepTimer ? "End Sleep" : "Sleep", emoji: "😴" },
    { type: "misc", label: "Log", emoji: "📝" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <QuickStats events={events} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickActions.map((action) => {
            const isActive =
              (action.type === "sleep" && sleepTimer) ||
              (action.type === "nursing" && nursingTimer) ||
              (volumeTracker && volumeTracker.type === action.type);
            const volumeDisplay =
              volumeTracker && volumeTracker.type === action.type
                ? action.type === "food"
                  ? `${volumeTracker.amountTsp}tsp`
                  : `${volumeTracker.amountOz}oz`
                : null;

            // Determine if this action type supports volume tracking (shows countdown)
            const isVolumeTrackedAction =
              action.type === "bottle" ||
              action.type === "food" ||
              action.type === "pumping";

            const buttonContent = (
              <button
                key={action.type}
                className={`rounded-xl p-4 transition focus-visible:ring-2 w-full aspect-square flex flex-col items-center relative ${
                  isActive && isVolumeTrackedAction
                    ? "border-2 border-transparent bg-brand-50 dark:bg-brand-900/20"
                    : isActive
                    ? "border border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/20"
                    : "border border-slate-200 bg-slate-50 hover:border-brand-400 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-600 dark:hover:bg-slate-700"
                }`}
                onClick={() => handleQuickAction(action.type)}
              >
                {/* Emoji and label at 1/3 down */}
                <div className="absolute top-[33.33%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  <span className="text-5xl">{action.emoji}</span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 text-center whitespace-nowrap">
                    {action.label}
                  </p>
                </div>

                {/* Secondary content at 75% down */}
                <div className="absolute top-[75%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  {volumeDisplay && (
                    <span className="rounded-full bg-brand-500 px-2 py-1 text-xs font-bold text-white">
                      {volumeDisplay}
                    </span>
                  )}
                  {action.type === "sleep" && sleepTimer && (
                    <span className="rounded-full bg-brand-500 px-2 py-1 text-xs font-bold text-white">
                      {Math.max(
                        0,
                        Math.round(
                          (now - new Date(sleepTimer.startedAt).getTime()) /
                            60000
                        )
                      )}{" "}
                      min
                    </span>
                  )}
                  {action.type === "nursing" && nursingTimer && (
                    <span className="rounded-full bg-brand-500 px-2 py-1 text-xs font-bold text-white">
                      {Math.max(
                        0,
                        Math.round(
                          (now - new Date(nursingTimer.startedAt).getTime()) /
                            60000
                        )
                      )}{" "}
                      min
                    </span>
                  )}
                  {lastEventByAction[action.type] && !isActive ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatLastEventTime(lastEventByAction[action.type]!)}
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
    </div>
  );
}
