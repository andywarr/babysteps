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
    this.version(1).stores({
      events: "id, timestamp, type, babyId",
      timers: "id, babyId, caregiverId",
      outbox: "id, eventId",
      invites: "id, email, status"
    });
  }
}

export const db = new BabystepsDatabase();

export type { OutboxItem };
