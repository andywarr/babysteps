"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

import type { BabyEvent, FeedEvent } from "@/lib/types/events";

dayjs.extend(relativeTime);
dayjs.extend(duration);

type QuickStatsProps = {
  events: BabyEvent[];
};

export function QuickStats({ events }: QuickStatsProps) {
  const stats = useMemo(() => buildStats(events), [events]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatPill
        title="Last feed"
        value={stats.lastFeed ?? "No activity"}
        helper={stats.lastFeedDetail}
      />
      <StatPill
        title="24h summary"
        value={stats.summary24h}
        helper={stats.summary24hDetail}
      />
      <StatPill
        title="7d summary"
        value={stats.summary7d}
        helper={stats.summary7dDetail}
      />
    </div>
  );
}

type StatPillProps = {
  title: string;
  value: string;
  helper?: string;
};

function StatPill({ title, value, helper }: StatPillProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {helper ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

type ComputedStats = {
  lastFeed: string | null;
  lastFeedDetail?: string;
  summary24h: string;
  summary24hDetail?: string;
  summary7d: string;
  summary7dDetail?: string;
};

function buildStats(events: BabyEvent[]): ComputedStats {
  const now = dayjs();
  const lastFeedEvent = events.find(
    (event): event is FeedEvent => event.type === "feed"
  );
  const lastFeed = lastFeedEvent
    ? `${dayjs(lastFeedEvent.timestamp).fromNow(true)} ago`
    : null;
  const lastFeedDetail = lastFeedEvent
    ? `${lastFeedEvent.method ?? ""}${
        lastFeedEvent.side ? ` • ${capitalize(lastFeedEvent.side)}` : ""
      }`.trim()
    : undefined;

  const since24h = now.subtract(24, "hour");
  const since7d = now.subtract(7, "day");

  const events24h = events.filter((event) =>
    dayjs(event.timestamp).isAfter(since24h)
  );
  const events7d = events.filter((event) =>
    dayjs(event.timestamp).isAfter(since7d)
  );

  const summary24h = summarize(events24h);
  const summary7d = summarize(events7d);

  return {
    lastFeed,
    lastFeedDetail,
    summary24h: summary24h.label,
    summary24hDetail: summary24h.detail,
    summary7d: summary7d.label,
    summary7dDetail: summary7d.detail,
  };
}

type Summary = {
  label: string;
  detail?: string;
};

function summarize(events: BabyEvent[]): Summary {
  if (events.length === 0) {
    return { label: "No activity" };
  }
  const feeds = events.filter((event) => event.type === "feed").length;
  const diapers = events.filter((event) => event.type === "diaper").length;
  const sleepMinutes = events
    .filter((event) => event.type === "sleep")
    .reduce(
      (total, event) =>
        total + ("durationMinutes" in event ? event.durationMinutes ?? 0 : 0),
      0
    );

  return {
    label: `${feeds} feeds • ${diapers} diapers`,
    detail: `${Math.round(sleepMinutes)} min sleep`,
  };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
