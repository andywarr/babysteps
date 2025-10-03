import dayjs from "dayjs";
import { NextResponse } from "next/server";

import { getStore } from "@/lib/server/store";
import type { SleepEvent } from "@/lib/types/events";

export async function GET() {
  const store = getStore();
  const events = Array.from(store.events.values());
  const days = Array.from({ length: 7 }).map((_, index) =>
    dayjs().subtract(index, "day")
  );
  const data = days
    .map((day) => {
      const dayEvents = events.filter((event) =>
        dayjs(event.timestamp).isSame(day, "day")
      );
      return {
        date: day.format("YYYY-MM-DD"),
        feeds: dayEvents.filter((event) => event.type === "feed").length,
        diapers: dayEvents.filter((event) => event.type === "diaper").length,
        sleepMinutes: dayEvents
          .filter((event): event is SleepEvent => event.type === "sleep")
          .reduce((total, event) => total + (event.durationMinutes ?? 0), 0),
      };
    })
    .reverse();
  return NextResponse.json({ data });
}
