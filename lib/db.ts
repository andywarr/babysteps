import Dexie, { Table } from "dexie";
import type { ActiveTimer, BabyEvent, InviteRequest } from "@/lib/types/events";

type OutboxItem = {
  id: string;
  eventId: string;
  payload: BabyEvent;
  createdAt: string;
};

export class BabystepsDatabase extends Dexie {
  events!: Table<BabyEvent, string>;
  timers!: Table<ActiveTimer, string>;
  outbox!: Table<OutboxItem, string>;
  invites!: Table<InviteRequest, string>;

  constructor() {
    super("babysteps");

    // Version 1: Initial schema
    this.version(1).stores({
      events: "id, timestamp, type, babyId",
      timers: "id, babyId, caregiverId",
      outbox: "id, eventId",
      invites: "id, email, status",
    });

    // Version 2: Add createdAt index to invites table
    this.version(2).stores({
      events: "id, timestamp, type, babyId",
      timers: "id, babyId, caregiverId",
      outbox: "id, eventId",
      invites: "id, email, status, createdAt",
    });
  }
}

export const db = new BabystepsDatabase();

export type { OutboxItem };
