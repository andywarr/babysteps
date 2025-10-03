"use client";

import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";

import { db } from "@/lib/db";
import type {
  ActiveTimer,
  BabyEvent,
  BabyProfile,
  EventType,
  InviteRequest,
  TimerType,
} from "@/lib/types/events";

import { useToast } from "./toast-provider";
import { EventComposer } from "./event-composer";

dayjs.extend(utc);
dayjs.extend(localizedFormat);

type EventsContextValue = {
  baby: BabyProfile;
  caregivers: InviteRequest[];
  events: BabyEvent[];
  timers: ActiveTimer[];
  logEvent: (
    event: Partial<BabyEvent> & { type: EventType; timestamp?: string }
  ) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  startTimer: (
    type: TimerType,
    metadata?: Record<string, unknown>
  ) => Promise<ActiveTimer>;
  stopTimer: (
    timerId: string,
    metadata?: Record<string, unknown>
  ) => Promise<void>;
  cancelTimer: (timerId: string) => Promise<void>;
  updateBabyProfile: (profile: Partial<BabyProfile>) => void;
  inviteCaregiver: (input: {
    email: string;
    role: "admin" | "member" | "viewer";
  }) => Promise<void>;
  openComposer: (type: EventType) => void;
};

const defaultBaby: BabyProfile = {
  id: "default-baby",
  name: "Baby",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
};

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

export function EventsProvider({ children }: PropsWithChildren) {
  const [baby, setBaby] = useState<BabyProfile>(() => {
    if (typeof window === "undefined") {
      return defaultBaby;
    }
    const raw = window.localStorage.getItem("babysteps:baby");
    if (!raw) return defaultBaby;
    try {
      const parsed = JSON.parse(raw) as BabyProfile;
      return { ...defaultBaby, ...parsed };
    } catch {
      return defaultBaby;
    }
  });
  const [composerType, setComposerType] = useState<EventType | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("babysteps:baby", JSON.stringify(baby));
  }, [baby]);

  const events = useLiveQuery(
    async () => {
      return db.events
        .orderBy("timestamp")
        .reverse()
        .filter((event) => event.babyId === baby.id)
        .toArray();
    },
    [baby.id],
    []
  );

  const timers = useLiveQuery(
    async () => {
      return db.timers.where("babyId").equals(baby.id).toArray();
    },
    [baby.id],
    []
  );

  const caregivers = useLiveQuery(
    async () => {
      return db.invites.orderBy("createdAt").reverse().toArray();
    },
    [],
    []
  );

  const logEvent = useCallback<EventsContextValue["logEvent"]>(
    async (input) => {
      const timestamp = input.timestamp ?? new Date().toISOString();
      const now = new Date().toISOString();
      const event = {
        ...(input as BabyEvent),
        id: crypto.randomUUID(),
        babyId: baby.id,
        caregiverId: "local-user",
        createdAt: now,
        updatedAt: now,
        source: "local",
        timestamp,
        type: input.type,
      } as BabyEvent;
      await db.events.put(event);
      await db.outbox.put({
        id: crypto.randomUUID(),
        eventId: event.id,
        payload: event,
        createdAt: now,
      });
      pushToast({
        title: `${formatEventType(event)} logged`,
        description: dayjs(event.timestamp).format("lll"),
        actionLabel: "Undo",
        onAction: async () => {
          await db.events.delete(event.id);
          await db.outbox.where("eventId").equals(event.id).delete();
        },
      });
    },
    [baby.id, pushToast]
  );

  const removeEvent = useCallback(async (id: string) => {
    await db.events.delete(id);
    await db.outbox.where("eventId").equals(id).delete();
  }, []);

  const startTimer = useCallback<EventsContextValue["startTimer"]>(
    async (type, metadata) => {
      const timer: ActiveTimer = {
        id: crypto.randomUUID(),
        babyId: baby.id,
        caregiverId: "local-user",
        startedAt: new Date().toISOString(),
        type,
        metadata,
      };
      await db.timers.put(timer);
      pushToast({ title: `${formatEventType(type)} timer started` });
      return timer;
    },
    [baby.id, pushToast]
  );

  const stopTimer = useCallback<EventsContextValue["stopTimer"]>(
    async (timerId, metadata) => {
      const timer = await db.timers.get(timerId);
      if (!timer) return;
      const endedAt = new Date();
      const durationMinutes = Math.max(
        1,
        Math.round(
          (endedAt.getTime() - new Date(timer.startedAt).getTime()) / 60000
        )
      );
      const eventType: EventType = timer.type === "feed" ? "feed" : "sleep";
      const timerMetadata = {
        ...(timer.metadata ?? {}),
        ...(metadata ?? {}),
      } as Record<string, unknown>;
      await db.timers.delete(timerId);
      
      if (eventType === "feed") {
        const feedPayload: Partial<BabyEvent> & { type: "feed"; timestamp: string } = {
          type: "feed",
          timestamp: endedAt.toISOString(),
          note:
            typeof timerMetadata.note === "string"
              ? (timerMetadata.note as string)
              : undefined,
          durationMinutes,
          method: (timerMetadata.method as any) ?? "breast",
          side: timerMetadata.side as any,
        };
        await logEvent(feedPayload);
      } else {
        const sleepPayload: Partial<BabyEvent> & { type: "sleep"; timestamp: string } = {
          type: "sleep",
          timestamp: endedAt.toISOString(),
          note:
            typeof timerMetadata.note === "string"
              ? (timerMetadata.note as string)
              : undefined,
          durationMinutes,
        };
        await logEvent(sleepPayload);
      }
    },
    [logEvent]
  );

  const cancelTimer = useCallback(
    async (timerId: string) => {
      await db.timers.delete(timerId);
      pushToast({ title: "Timer canceled", level: "info" });
    },
    [pushToast]
  );

  const updateBabyProfile = useCallback((profile: Partial<BabyProfile>) => {
    setBaby((current) => ({ ...current, ...profile }));
  }, []);

  const inviteCaregiver = useCallback<EventsContextValue["inviteCaregiver"]>(
    async ({ email, role }) => {
      const invite: InviteRequest = {
        id: crypto.randomUUID(),
        email,
        role,
        createdAt: new Date().toISOString(),
        status: "pending",
      };
      await db.invites.put(invite);
      pushToast({
        title: "Invite queued",
        description: `${email} (${role}) will be synced when you're online`,
        level: "success",
      });
    },
    [pushToast]
  );

  const openComposer = useCallback((type: EventType) => {
    setComposerType(type);
  }, []);

  const closeComposer = useCallback(() => {
    setComposerType(null);
  }, []);

  const value = useMemo<EventsContextValue>(
    () => ({
      baby,
      caregivers: caregivers ?? [],
      events: events ?? [],
      timers: timers ?? [],
      logEvent,
      removeEvent,
      startTimer,
      stopTimer,
      cancelTimer,
      updateBabyProfile,
      inviteCaregiver,
      openComposer,
    }),
    [
      baby,
      caregivers,
      events,
      timers,
      logEvent,
      removeEvent,
      startTimer,
      stopTimer,
      cancelTimer,
      updateBabyProfile,
      inviteCaregiver,
      openComposer,
    ]
  );

  return (
    <EventsContext.Provider value={value}>
      {children}
      <EventComposer activeType={composerType} onClose={closeComposer} />
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
}

function formatEventType(input: BabyEvent | EventType | TimerType): string {
  if (typeof input === "string") {
    // Handle string types (for timers)
    switch (input) {
      case "feed":
        return "Feed";
      case "diaper":
        return "Diaper";
      case "sleep":
        return "Sleep";
      case "pump":
        return "Pump";
      case "med":
        return "Medication";
      case "note":
        return "Note";
      case "misc":
        return "Misc";
      default:
        return input;
    }
  }

  // Handle event objects
  switch (input.type) {
    case "feed":
      return "Feed";
    case "diaper":
      const diaperType = (input as any).diaperType;
      if (diaperType === "wet") return "Wet diaper";
      if (diaperType === "dirty") return "Dirty diaper";
      if (diaperType === "mixed") return "Mixed diaper";
      return "Diaper";
    case "sleep":
      return "Sleep";
    case "pump":
      return "Pump";
    case "med":
      return "Medication";
    case "note":
      return "Note";
    case "misc":
      return "Misc";
  }
}
