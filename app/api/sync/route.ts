import { NextRequest, NextResponse } from "next/server";

import { getStore } from "@/lib/server/store";
import type { BabyEvent } from "@/lib/types/events";

type SyncPayload = {
  events: BabyEvent[];
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SyncPayload;
  const store = getStore();
  body.events.forEach((event) => {
    store.events.set(event.id, event);
  });
  return NextResponse.json({ ok: true, count: body.events.length });
}
