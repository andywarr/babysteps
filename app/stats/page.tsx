"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

import { useEvents } from "@/components/ui/events-provider";
import type { BabyEvent, EventType, FeedEvent } from "@/lib/types/events";

const EVENT_COLORS: Record<EventType | "other", string> = {
  feed: "#4d71ff",
  diaper: "#f97316",
  sleep: "#0ea5e9",
  pump: "#8b5cf6",
  med: "#ec4899",
  note: "#10b981",
  misc: "#64748b",
  other: "#94a3b8",
};

export default function StatsPage() {
  const { events } = useEvents();
  const data = useMemo(() => buildStats(events), [events]);

  // Debug logging
  console.log("Total events:", events.length);
  console.log("Flattened events for chart:", data.flattenedEvents.length);
  console.log("Timeline data:", data.timelineData);
  console.log("Sample flattened events:", data.flattenedEvents.slice(0, 5));

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <dl className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Time since feed"
            value={data.timeSinceFeed}
            helper={data.lastFeedDetail}
          />
          <Stat
            label="Feeds / 24h"
            value={String(data.feedCount24h)}
            helper={`${data.feedCount7d} in 7d`}
          />
          <Stat
            label="Sleep / 24h"
            value={`${data.sleepMinutes24h} min`}
            helper={`${data.sleepMinutes7d} min in 7d`}
          />
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Last 7 days
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Daily activity timeline showing when events occurred throughout the
          day.
        </p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <XAxis
                type="number"
                dataKey="hour"
                domain={[0, 24]}
                ticks={[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]}
                tickFormatter={(value) => {
                  const hour =
                    value === 0 ? 12 : value > 12 ? value - 12 : value;
                  const period = value < 12 ? "a" : "p";
                  return `${hour}${period}`;
                }}
                stroke="currentColor"
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Time of day",
                  position: "insideBottom",
                  offset: -10,
                }}
              />
              <YAxis
                type="category"
                dataKey="day"
                stroke="currentColor"
                width={60}
                axisLine={false}
                tickLine={false}
                allowDuplicatedCategory={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                wrapperClassName="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-lg"
              />
              <Scatter
                data={data.flattenedEvents}
                shape="circle"
                fill="#8884d8"
              >
                {data.flattenedEvents.map((event, index) => (
                  <Cell key={`cell-${index}`} fill={EVENT_COLORS[event.type]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: EVENT_COLORS.feed }}
            />
            <span className="text-slate-600 dark:text-slate-300">Feed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: EVENT_COLORS.diaper }}
            />
            <span className="text-slate-600 dark:text-slate-300">Diaper</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: EVENT_COLORS.sleep }}
            />
            <span className="text-slate-600 dark:text-slate-300">Sleep</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: EVENT_COLORS.other }}
            />
            <span className="text-slate-600 dark:text-slate-300">Other</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <p className="font-semibold text-slate-900 dark:text-slate-100">
          {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
        </p>
        <p className="text-slate-600 dark:text-slate-300">{data.time}</p>
        {data.details && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {data.details}
          </p>
        )}
      </div>
    );
  }
  return null;
}

type StatProps = {
  label: string;
  value: string;
  helper?: string;
};

function Stat({ label, value, helper }: StatProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
        {value}
      </dd>
      {helper ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

type ComputedStats = {
  timeSinceFeed: string;
  lastFeedDetail?: string;
  feedCount24h: number;
  feedCount7d: number;
  sleepMinutes24h: number;
  sleepMinutes7d: number;
  timelineData: Array<{
    day: string;
    events: Array<{
      type: EventType;
      hour: number;
      day: string;
      time: string;
      details?: string;
    }>;
  }>;
  flattenedEvents: Array<{
    type: EventType;
    hour: number;
    day: string;
    time: string;
    details?: string;
  }>;
};

function buildStats(events: BabyEvent[]): ComputedStats {
  const now = dayjs();
  const lastFeed = events.find((event): event is FeedEvent => event.type === "feed");
  const timeSinceFeed = lastFeed
    ? now.to(lastFeed.timestamp, true) + " ago"
    : "—";
  const lastFeedDetail = lastFeed
    ? `${lastFeed.method ?? ""} ${
        lastFeed.method === "solid" && lastFeed.amountTsp
          ? `• ${lastFeed.amountTsp} tsp`
          : lastFeed.amountOz
          ? `• ${lastFeed.amountOz} oz`
          : ""
      }`.trim()
    : undefined;

  const since24h = now.subtract(24, "hour");
  const since7d = now.subtract(7, "day");

  const feedCount24h = events.filter(
    (event) => event.type === "feed" && dayjs(event.timestamp).isAfter(since24h)
  ).length;
  const feedCount7d = events.filter(
    (event) => event.type === "feed" && dayjs(event.timestamp).isAfter(since7d)
  ).length;

  const sleepMinutes24h = Math.round(
    events
      .filter(
        (event) =>
          event.type === "sleep" && dayjs(event.timestamp).isAfter(since24h)
      )
      .reduce(
        (total, event) => total + ((event as any).durationMinutes ?? 0),
        0
      )
  );
  const sleepMinutes7d = Math.round(
    events
      .filter(
        (event) =>
          event.type === "sleep" && dayjs(event.timestamp).isAfter(since7d)
      )
      .reduce(
        (total, event) => total + ((event as any).durationMinutes ?? 0),
        0
      )
  );

  const days = Array.from({ length: 7 }).map((_, index) =>
    now.subtract(index, "day")
  );

  const timelineData = days
    .map((day) => {
      const dayEvents = events.filter((event) =>
        dayjs(event.timestamp).isSame(day, "day")
      );
      const dayLabel = day.format("MM/DD");

      return {
        day: dayLabel,
        events: dayEvents.map((event) => {
          const eventTime = dayjs(event.timestamp);
          const hour = eventTime.hour() + eventTime.minute() / 60;

          let details = "";
          if (event.type === "feed") {
            const feedEvent = event as any;
            details = `${feedEvent.method ?? ""} ${
              feedEvent.method === "solid" && feedEvent.amountTsp
                ? `• ${feedEvent.amountTsp} tsp`
                : feedEvent.amountOz
                ? `• ${feedEvent.amountOz} oz`
                : ""
            }`.trim();
          } else if (event.type === "sleep") {
            const sleepEvent = event as any;
            details = sleepEvent.durationMinutes
              ? `${sleepEvent.durationMinutes} min`
              : "";
          } else if (event.type === "diaper") {
            const diaperEvent = event as any;
            details = diaperEvent.diaperType ?? "";
          }

          return {
            type: event.type,
            hour,
            day: dayLabel,
            time: eventTime.format("h:mm A"),
            details: details || undefined,
          };
        }),
      };
    })
    .reverse();

  // Flatten events and ensure all days are represented
  const allDayLabels = timelineData.map((d) => d.day);
  const flattenedEvents = timelineData.flatMap((dayData) => {
    // If a day has no events, add a hidden placeholder to ensure the category exists
    if (dayData.events.length === 0) {
      return [
        {
          type: "other" as EventType,
          hour: -1, // Place it off the chart
          day: dayData.day,
          time: "",
          details: undefined,
        },
      ];
    }
    return dayData.events;
  });

  return {
    timeSinceFeed,
    lastFeedDetail,
    feedCount24h,
    feedCount7d,
    sleepMinutes24h,
    sleepMinutes7d,
    timelineData,
    flattenedEvents,
  };
}
