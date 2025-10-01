"use client";

import { useMemo, useState } from "react";
import { useEvents } from "@/components/ui/events-provider";
import { EventType } from "@/lib/types/events";
import { QuickStats } from "@/components/ui/quick-stats";
import { ActiveTimerList } from "@/components/ui/timer-list";
import { EventComposer } from "@/components/ui/event-composer";

const eventTypes: { type: EventType; label: string; description: string }[] = [
  { type: "feed", label: "Log Feed", description: "Track nursing, bottles, or formula" },
  { type: "diaper", label: "Log Diaper", description: "Wet, dirty, or mixed" },
  { type: "sleep", label: "Log Sleep", description: "Track naps and overnight sleep" },
  { type: "pump", label: "Log Pump", description: "Record pumping sessions" },
  { type: "med", label: "Log Med", description: "Track meds and supplements" },
  { type: "note", label: "Add Note", description: "Capture milestones or reminders" }
];

export default function HomePage() {
  const { events, baby } = useEvents();
  const [activeType, setActiveType] = useState<EventType | null>(null);

  const lastEventByType = useMemo(() => {
    const result: Partial<Record<EventType, string>> = {};
    for (const event of events) {
      if (!result[event.type]) {
        result[event.type] = event.timestamp;
      }
    }
    return result;
  }, [events]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Hello, {baby.name}&apos;s crew</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              One-tap logging keeps everyone in sync. Start by choosing an activity below.
            </p>
          </div>
          <QuickStats events={events} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {eventTypes.map((eventType) => (
            <button
              key={eventType.type}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-brand-400 hover:bg-white focus-visible:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-300"
              onClick={() => setActiveType(eventType.type)}
            >
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{eventType.label}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{eventType.description}</p>
              {lastEventByType[eventType.type] ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Last logged {new Date(lastEventByType[eventType.type]!).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      </section>
      <ActiveTimerList />
      <EventComposer activeType={activeType} onClose={() => setActiveType(null)} />
    </div>
  );
}
