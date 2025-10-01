"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useEvents } from "@/components/ui/events-provider";
import type { BabyEvent } from "@/lib/types/events";

export default function StatsPage() {
  const { events } = useEvents();
  const data = useMemo(() => buildStats(events), [events]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Insights</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Keep an eye on feeding cadence, diaper changes, and sleep totals at a glance.
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Time since feed" value={data.timeSinceFeed} helper={data.lastFeedDetail} />
          <Stat label="Feeds / 24h" value={String(data.feedCount24h)} helper={`${data.feedCount7d} in 7d`} />
          <Stat label="Sleep / 24h" value={`${data.sleepMinutes24h} min`} helper={`${data.sleepMinutes7d} min in 7d`} />
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Last 7 days</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Daily totals across feeds, diapers, and sleep minutes.</p>
        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dailySeries}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="day" stroke="currentColor" />
              <YAxis yAxisId="left" orientation="left" stroke="currentColor" allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" stroke="currentColor" allowDecimals={false} />
              <Tooltip wrapperClassName="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-lg" />
              <Legend />
              <Bar yAxisId="left" dataKey="feeds" fill="#4d71ff" name="Feeds" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="left" dataKey="diapers" fill="#f97316" name="Diapers" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="right" dataKey="sleep" fill="#0ea5e9" name="Sleep (min)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

type StatProps = {
  label: string;
  value: string;
  helper?: string;
};

function Stat({ label, value, helper }: StatProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{value}</dd>
      {helper ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{helper}</p> : null}
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
  dailySeries: { day: string; feeds: number; diapers: number; sleep: number }[];
};

function buildStats(events: BabyEvent[]): ComputedStats {
  const now = dayjs();
  const lastFeed = events.find((event) => event.type === "feed");
  const timeSinceFeed = lastFeed ? now.to(lastFeed.timestamp, true) + " ago" : "—";
  const lastFeedDetail = lastFeed ? `${lastFeed.method ?? ""} ${lastFeed.amountOz ? `• ${lastFeed.amountOz} oz` : ""}`.trim() : undefined;

  const since24h = now.subtract(24, "hour");
  const since7d = now.subtract(7, "day");

  const feedCount24h = events.filter((event) => event.type === "feed" && dayjs(event.timestamp).isAfter(since24h)).length;
  const feedCount7d = events.filter((event) => event.type === "feed" && dayjs(event.timestamp).isAfter(since7d)).length;

  const sleepMinutes24h = Math.round(
    events
      .filter((event) => event.type === "sleep" && dayjs(event.timestamp).isAfter(since24h))
      .reduce((total, event) => total + (event.durationMinutes ?? 0), 0)
  );
  const sleepMinutes7d = Math.round(
    events
      .filter((event) => event.type === "sleep" && dayjs(event.timestamp).isAfter(since7d))
      .reduce((total, event) => total + (event.durationMinutes ?? 0), 0)
  );

  const days = Array.from({ length: 7 }).map((_, index) => now.subtract(index, "day"));
  const dailySeries = days
    .map((day) => {
      const dayEvents = events.filter((event) => dayjs(event.timestamp).isSame(day, "day"));
      return {
        day: day.format("ddd"),
        feeds: dayEvents.filter((event) => event.type === "feed").length,
        diapers: dayEvents.filter((event) => event.type === "diaper").length,
        sleep: Math.round(
          dayEvents.filter((event) => event.type === "sleep").reduce((total, event) => total + (event.durationMinutes ?? 0), 0)
        )
      };
    })
    .reverse();

  return {
    timeSinceFeed,
    lastFeedDetail,
    feedCount24h,
    feedCount7d,
    sleepMinutes24h,
    sleepMinutes7d,
    dailySeries
  };
}
