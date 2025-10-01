import { NextRequest, NextResponse } from "next/server";

type SubscriptionPayload = {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
};

const subscribers = new Set<string>();

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as SubscriptionPayload;
  subscribers.add(payload.endpoint);
  return NextResponse.json({ ok: true, subscribers: subscribers.size });
}
