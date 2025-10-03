export type EventType =
  | "feed"
  | "diaper"
  | "sleep"
  | "pump"
  | "med"
  | "note"
  | "misc";

export type FeedingMethod = "breast" | "bottle" | "formula" | "solid";
export type DiaperType = "wet" | "dirty" | "mixed";

export interface BaseEvent {
  id: string;
  type: EventType;
  babyId: string;
  caregiverId: string;
  timestamp: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  source: "local" | "synced";
}

export interface FeedEvent extends BaseEvent {
  type: "feed";
  method: FeedingMethod;
  side?: "left" | "right" | "both";
  durationMinutes?: number;
  amountOz?: number;
  amountTsp?: number;
}

export interface DiaperEvent extends BaseEvent {
  type: "diaper";
  diaperType: DiaperType;
}

export interface SleepEvent extends BaseEvent {
  type: "sleep";
  durationMinutes: number;
}

export interface PumpEvent extends BaseEvent {
  type: "pump";
  durationMinutes?: number;
  amountOz?: number;
}

export interface MedEvent extends BaseEvent {
  type: "med";
  medication: string;
  dose: string;
}

export interface NoteEvent extends BaseEvent {
  type: "note";
  title?: string;
}

export interface MiscEvent extends BaseEvent {
  type: "misc";
  description: string;
}

export type BabyEvent =
  | FeedEvent
  | DiaperEvent
  | SleepEvent
  | PumpEvent
  | MedEvent
  | NoteEvent
  | MiscEvent;

export type TimerType = "feed" | "sleep";

export interface ActiveTimer {
  id: string;
  babyId: string;
  caregiverId: string;
  type: TimerType;
  startedAt: string;
  metadata?: Record<string, unknown>;
}

export interface Caregiver {
  id: string;
  name: string;
  role: "admin" | "member" | "viewer";
  email: string;
}

export interface BabyProfile {
  id: string;
  name: string;
  birthday?: string;
  timezone: string;
}

export interface InviteRequest {
  id: string;
  email: string;
  role: "admin" | "member" | "viewer";
  createdAt: string;
  status: "pending" | "accepted" | "revoked";
}
