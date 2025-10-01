import { NextRequest, NextResponse } from "next/server";

import { getStore } from "@/lib/server/store";
import type { BabyEvent } from "@/lib/types/events";

export async function GET() {
  const store = getStore();
  const events = Array.from(store.events.values()).sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as BabyEvent;
  const store = getStore();
  store.events.set(payload.id, payload);
  return NextResponse.json({ ok: true, event: payload }, { status: 201 });
}
