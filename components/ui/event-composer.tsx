"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { X } from "lucide-react";

import { useEvents } from "@/components/ui/events-provider";
import type { EventType } from "@/lib/types/events";

const feedingMethods = [
  { value: "breast", label: "Breast" },
  { value: "bottle", label: "Bottle" },
  { value: "formula", label: "Formula" },
  { value: "solid", label: "Solid" },
] as const;

const diaperTypes = [
  { value: "wet", label: "Wet" },
  { value: "dirty", label: "Dirty" },
  { value: "mixed", label: "Mixed" },
] as const;

type EventComposerProps = {
  activeType: EventType | null;
  onClose: () => void;
};

export function EventComposer({ activeType, onClose }: EventComposerProps) {
  const [timestamp, setTimestamp] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [note, setNote] = useState("");
  const [feedFields, setFeedFields] = useState({
    method: "breast",
    side: "left",
    amountOz: 0,
  });
  const [diaperField, setDiaperField] = useState("wet");
  const [sleepDuration, setSleepDuration] = useState(30);
  const [pumpFields, setPumpFields] = useState({
    durationMinutes: 20,
    amountOz: 4,
  });
  const [medFields, setMedFields] = useState({ medication: "", dose: "" });
  const [noteTitle, setNoteTitle] = useState("");
  const [miscDescription, setMiscDescription] = useState("");
  const { logEvent, startTimer } = useEvents();

  useEffect(() => {
    if (!activeType) return;
    setTimestamp(new Date().toISOString().slice(0, 16));
    setNote("");
    setFeedFields({
      method: "breast",
      side: "left",
      amountOz: 0,
    });
    setDiaperField("wet");
    setSleepDuration(30);
    setPumpFields({ durationMinutes: 20, amountOz: 4 });
    setMedFields({ medication: "", dose: "" });
    setNoteTitle("");
    setMiscDescription("");
  }, [activeType]);

  const heading = useMemo(() => {
    switch (activeType) {
      case "feed":
        return "Log a feed";
      case "diaper":
        return "Log a diaper";
      case "sleep":
        return "Log sleep";
      case "pump":
        return "Log a pump";
      case "med":
        return "Log medication";
      case "note":
        return "Add note";
      case "misc":
        return "Log event";
      default:
        return null;
    }
  }, [activeType]);

  if (!activeType || !heading) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isoTimestamp = dayjs(timestamp).toISOString();
    switch (activeType) {
      case "feed":
        await logEvent({
          type: "feed",
          timestamp: isoTimestamp,
          note,
          method: feedFields.method as any,
          side: feedFields.side as any,
          amountOz: feedFields.amountOz || undefined,
        });
        break;
      case "diaper":
        await logEvent({
          type: "diaper",
          timestamp: isoTimestamp,
          note,
          diaperType: diaperField as any,
        });
        break;
      case "sleep":
        await logEvent({
          type: "sleep",
          timestamp: isoTimestamp,
          note,
          durationMinutes: sleepDuration,
        } as any);
        break;
      case "pump":
        await logEvent({
          type: "pump",
          timestamp: isoTimestamp,
          note,
          durationMinutes: pumpFields.durationMinutes,
          amountOz: pumpFields.amountOz,
        } as any);
        break;
      case "med":
        await logEvent({
          type: "med",
          timestamp: isoTimestamp,
          note,
          medication: medFields.medication,
          dose: medFields.dose,
        } as any);
        break;
      case "note":
        await logEvent({
          type: "note",
          timestamp: isoTimestamp,
          note,
          title: noteTitle,
        } as any);
        break;
      case "misc":
        await logEvent({
          type: "misc",
          description: miscDescription,
        } as any);
        break;
    }
    onClose();
  };

  const startTimerAndClose = async () => {
    if (!activeType) return;
    if (activeType === "sleep") {
      await startTimer("sleep", { plannedDuration: sleepDuration, note });
    } else if (activeType === "feed") {
      await startTimer("feed", {
        method: feedFields.method,
        side: feedFields.side,
        note,
      });
    } else {
      await startTimer("feed");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 px-4 py-10 backdrop-blur-sm sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              {heading}
            </h2>
            {activeType !== "misc" && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Timestamp defaults to now. Adjust if you forgot to log in the
                moment.
              </p>
            )}
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {activeType !== "misc" && (
          <label className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Logged at
            <input
              type="datetime-local"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={timestamp}
              onChange={(event) => setTimestamp(event.target.value)}
            />
          </label>
        )}

        {activeType === "feed" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Method
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={feedFields.method}
                onChange={(event) =>
                  setFeedFields((current) => ({
                    ...current,
                    method: event.target.value,
                  }))
                }
              >
                {feedingMethods.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Side
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={feedFields.side}
                onChange={(event) =>
                  setFeedFields((current) => ({
                    ...current,
                    side: event.target.value,
                  }))
                }
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="both">Both</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Amount (oz)
              <input
                type="number"
                min={0}
                step="0.5"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={feedFields.amountOz}
                onChange={(event) =>
                  setFeedFields((current) => ({
                    ...current,
                    amountOz: Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>
        ) : null}

        {activeType === "diaper" ? (
          <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Diaper type
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={diaperField}
              onChange={(event) => setDiaperField(event.target.value)}
            >
              {diaperTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {activeType === "sleep" ? (
          <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Duration (minutes)
            <input
              type="number"
              min={1}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={sleepDuration}
              onChange={(event) => setSleepDuration(Number(event.target.value))}
            />
          </label>
        ) : null}

        {activeType === "pump" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Duration (minutes)
              <input
                type="number"
                min={1}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={pumpFields.durationMinutes}
                onChange={(event) =>
                  setPumpFields((current) => ({
                    ...current,
                    durationMinutes: Number(event.target.value),
                  }))
                }
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Output (oz)
              <input
                type="number"
                min={0}
                step="0.5"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={pumpFields.amountOz}
                onChange={(event) =>
                  setPumpFields((current) => ({
                    ...current,
                    amountOz: Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>
        ) : null}

        {activeType === "med" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Medication
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={medFields.medication}
                onChange={(event) =>
                  setMedFields((current) => ({
                    ...current,
                    medication: event.target.value,
                  }))
                }
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Dose
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={medFields.dose}
                onChange={(event) =>
                  setMedFields((current) => ({
                    ...current,
                    dose: event.target.value,
                  }))
                }
              />
            </label>
          </div>
        ) : null}

        {activeType === "note" ? (
          <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Title
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
            />
          </label>
        ) : null}

        {activeType === "misc" ? (
          <label className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-200">
            What happened?
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={miscDescription}
              onChange={(event) => setMiscDescription(event.target.value)}
              placeholder="e.g., Temperature check, Bath time, Doctor visit"
              required
              autoFocus
            />
          </label>
        ) : null}

        {activeType !== "misc" && (
          <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Notes
            <textarea
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {(activeType === "feed" || activeType === "sleep") && (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
              onClick={startTimerAndClose}
            >
              Start timer instead
            </button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Save event
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
