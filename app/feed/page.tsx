"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { saveAs } from "file-saver";
import { Trash2 } from "lucide-react";

import { useEvents } from "@/components/ui/events-provider";
import type { BabyEvent, EventType } from "@/lib/types/events";

const filters: { value: EventType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "feed", label: "Feeds" },
  { value: "diaper", label: "Diapers" },
  { value: "sleep", label: "Sleep" },
  { value: "pump", label: "Pumps" },
  { value: "med", label: "Meds" },
  { value: "note", label: "Notes" },
  { value: "misc", label: "Misc" },
];

export default function HistoryPage() {
  const { events, removeEvent } = useEvents();
  const [filterType, setFilterType] = useState<EventType | "all">("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filterType !== "all" && event.type !== filterType) {
        return false;
      }
      if (dateFilter) {
        const sameDay = dayjs(event.timestamp).isSame(dayjs(dateFilter), "day");
        if (!sameDay) return false;
      }
      return true;
    });
  }, [events, filterType, dateFilter]);

  const grouped = useMemo(() => groupEvents(filteredEvents), [filteredEvents]);

  const exportCsv = () => {
    const header = [
      "id",
      "type",
      "timestamp",
      "caregiverId",
      "note",
      "metadata",
    ];
    const rows = filteredEvents.map((event) => [
      event.id,
      event.type,
      event.timestamp,
      event.caregiverId,
      event.note ?? "",
      JSON.stringify(event),
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `babysteps-history-${dayjs().format("YYYY-MM-DD-HH-mm")}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Feed
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            A reverse chronological feed of all events. Filter by type or date,
            or export a CSV for your pediatrician.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Type
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={filterType}
              onChange={(event) =>
                setFilterType(event.target.value as EventType | "all")
              }
            >
              {filters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Date
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </label>
          <button
            onClick={exportCsv}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {grouped.map(([day, dayEvents]) => (
          <div
            key={day}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {day}
            </h2>
            <ul className="mt-3 space-y-3">
              {dayEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatEventLabel(event)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {dayjs(event.timestamp).format("LT")}
                    </p>
                    {event.note ? (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {event.note}
                      </p>
                    ) : null}
                  </div>
                  <button
                    className="flex items-center text-brand-600 hover:text-brand-700 dark:text-brand-200"
                    onClick={() => removeEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {grouped.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-300">
            No events logged yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function groupEvents(events: BabyEvent[]): [string, BabyEvent[]][] {
  const map = new Map<string, { label: string; items: BabyEvent[] }>();
  for (const event of events) {
    const day = dayjs(event.timestamp).startOf("day");
    const key = day.format("YYYY-MM-DD");
    if (!map.has(key)) {
      map.set(key, { label: day.format("dddd, MMM D"), items: [] });
    }
    map.get(key)!.items.push(event);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([_, value]) => [value.label, value.items]);
}

function formatEventLabel(event: BabyEvent) {
  switch (event.type) {
    case "feed":
      return `${capitalize(event.method ?? "Feed")} • ${
        event.durationMinutes ?? "–"
      } min`;
    case "diaper":
      return `${capitalize(event.diaperType)} diaper`;
    case "sleep":
      return `Sleep • ${event.durationMinutes ?? "–"} min`;
    case "pump":
      return `Pump • ${event.amountOz ?? "–"} oz`;
    case "med":
      return `${event.medication} (${event.dose})`;
    case "note":
      return event.title ?? "Note";
    case "misc":
      return event.description || "Misc event";
    default:
      return event.type;
  }
}

function capitalize(value?: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
