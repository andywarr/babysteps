"use client";

import { useState } from "react";
import { useEvents } from "@/components/ui/events-provider";
import type { ActiveTimer } from "@/lib/types/events";
import { useInterval } from "@/lib/hooks/use-interval";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ActiveTimerList() {
  const { timers, stopTimer, cancelTimer } = useEvents();
  const [now, setNow] = useState(() => Date.now());

  useInterval(() => setNow(Date.now()), 1000);

  if (!timers.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-700/40 dark:bg-amber-900/20">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
        Active timers
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {timers.map((timer) => (
          <TimerCard
            key={timer.id}
            timer={timer}
            now={now}
            onStop={stopTimer}
            onCancel={cancelTimer}
          />
        ))}
      </div>
    </section>
  );
}

type TimerCardProps = {
  timer: ActiveTimer;
  now: number;
  onStop: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
};

function TimerCard({ timer, now, onStop, onCancel }: TimerCardProps) {
  const elapsedMinutes = Math.max(
    0,
    Math.round((now - new Date(timer.startedAt).getTime()) / 60000)
  );

  const getTimerDetails = () => {
    if (timer.type === "feed") {
      const metadata = timer.metadata as
        | { method?: string; side?: string }
        | undefined;
      const method = metadata?.method ? capitalize(metadata.method) : "";
      const side = metadata?.side ? capitalize(metadata.side) : "";
      return method && side
        ? `${method} • ${side}`
        : method || side || "Feeding";
    }
    return "Sleep";
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-amber-200 bg-white/90 p-4 shadow-sm dark:border-amber-700/60 dark:bg-amber-900/30">
      <div>
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
          {getTimerDetails()} timer
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-200/80">
          Started{" "}
          {new Date(timer.startedAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}{" "}
          • {elapsedMinutes} min elapsed
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          className="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          onClick={() => onStop(timer.id)}
        >
          Stop & log
        </button>
        <button
          className="rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-amber-700 hover:border-amber-600 hover:bg-amber-100 dark:text-amber-200"
          onClick={() => onCancel(timer.id)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
