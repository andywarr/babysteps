"use client";

import { FormEvent, useState } from "react";

import { db } from "@/lib/db";
import { useEvents } from "@/components/ui/events-provider";
import { useToast } from "@/components/ui/toast-provider";

export default function SettingsPage() {
  const { baby, updateBabyProfile, caregivers, inviteCaregiver } = useEvents();
  const { pushToast } = useToast();
  const [name, setName] = useState(baby.name);
  const [timezone, setTimezone] = useState(baby.timezone);
  const [birthday, setBirthday] = useState(baby.birthday ?? "");
  const [quietHours, setQuietHours] = useState({
    start: "22:00",
    end: "06:00",
  });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    isProcessing: boolean;
    message?: string;
    level?: "success" | "error" | "info";
  }>({ isProcessing: false });

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateBabyProfile({ name, timezone, birthday });
    pushToast({
      title: "Profile saved",
      description: "Baby profile updated successfully",
      level: "success",
    });
  };

  const submitInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    await inviteCaregiver({ email, role });
    setEmail("");
    setRole("member");
  };

  const handleClearAllData = async () => {
    try {
      // Clear all IndexedDB tables
      await db.events.clear();
      await db.timers.clear();
      await db.outbox.clear();
      await db.invites.clear();

      // Clear localStorage
      window.localStorage.removeItem("babysteps:baby");

      pushToast({
        title: "All data cleared",
        description: "Your local data has been deleted. The page will reload.",
        level: "success",
      });

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      pushToast({
        title: "Error clearing data",
        description:
          "There was a problem clearing your data. Please try again.",
        level: "error",
      });
    }
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input for future uploads
    event.target.value = "";

    setImportStatus({ isProcessing: true, message: "Processing file..." });

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        throw new Error("File appears to be empty");
      }

      // Parse CSV header
      const header = lines[0]
        .split(",")
        .map((col) => col.replace(/^"|"$/g, "").trim());

      // Expected headers
      const expectedHeaders = [
        "id",
        "type",
        "timestamp",
        "caregiverId",
        "note",
        "metadata",
      ];
      const headerValid = expectedHeaders.every((h) => header.includes(h));

      if (!headerValid) {
        throw new Error(
          "Invalid file format. Expected columns: id, type, timestamp, caregiverId, note, metadata"
        );
      }

      const events = [];
      let successCount = 0;
      let errorCount = 0;

      // Parse each row
      for (let i = 1; i < lines.length; i++) {
        try {
          // Parse CSV row handling quoted values
          const row: string[] = [];
          let current = "";
          let inQuotes = false;

          for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            const nextChar = lines[i][j + 1];

            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                j++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === "," && !inQuotes) {
              row.push(current);
              current = "";
            } else {
              current += char;
            }
          }
          row.push(current); // Add last field

          if (row.length !== header.length) {
            console.warn(
              `Row ${i} has ${row.length} columns, expected ${header.length}`
            );
            errorCount++;
            continue;
          }

          // Create object from row
          const rowData: Record<string, string> = {};
          header.forEach((col, idx) => {
            rowData[col] = row[idx];
          });

          // Parse metadata JSON
          const metadata = JSON.parse(rowData.metadata);
          events.push(metadata);
          successCount++;
        } catch (err) {
          console.warn(`Error parsing row ${i}:`, err);
          errorCount++;
        }
      }

      if (events.length === 0) {
        throw new Error("No valid events found in file");
      }

      // Import events into database
      await db.events.bulkPut(events);

      setImportStatus({ isProcessing: false });
      pushToast({
        title: "Import complete",
        description: `Successfully imported ${successCount} events${
          errorCount > 0 ? `. ${errorCount} rows had errors.` : "."
        }`,
        level: "success",
      });

      // Reload the page to reflect new data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus({ isProcessing: false });
      pushToast({
        title: "Import failed",
        description:
          error instanceof Error
            ? error.message
            : "There was a problem importing your data.",
        level: "error",
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Baby profile
        </h1>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={submitProfile}
        >
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Name
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Timezone
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Birthday (optional)
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={birthday}
              onChange={(event) => setBirthday(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Quiet hours
            <div className="mt-1 flex items-center gap-2">
              <input
                type="time"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={quietHours.start}
                onChange={(event) =>
                  setQuietHours((current) => ({
                    ...current,
                    start: event.target.value,
                  }))
                }
              />
              <span className="text-xs text-slate-500">to</span>
              <input
                type="time"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                value={quietHours.end}
                onChange={(event) =>
                  setQuietHours((current) => ({
                    ...current,
                    end: event.target.value,
                  }))
                }
              />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              Notifications pause overnight during quiet hours.
            </p>
          </label>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Save profile
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Import Data
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Upload a previously exported CSV file to restore your events. The file
          should be in the same format as exported from the History page.
        </p>

        <div className="mt-4">
          <label
            htmlFor="import-file"
            className={`inline-block cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold ${
              importStatus.isProcessing
                ? "bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400"
                : "bg-brand-600 text-white hover:bg-brand-700"
            }`}
          >
            {importStatus.isProcessing
              ? "Processing..."
              : "Choose file to import"}
          </label>
          <input
            id="import-file"
            type="file"
            accept=".csv"
            onChange={handleImportFile}
            disabled={importStatus.isProcessing}
            className="hidden"
          />
        </div>
        {importStatus.message && (
          <p
            className={`mt-2 text-sm ${
              importStatus.level === "error"
                ? "text-red-600 dark:text-red-400"
                : importStatus.level === "success"
                ? "text-green-600 dark:text-green-400"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            {importStatus.message}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/50 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-400">
          Reset
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Permanently delete all local data including events, timers, and
          settings. This action cannot be undone.
        </p>

        {!showClearConfirmation ? (
          <button
            onClick={() => setShowClearConfirmation(true)}
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Clear all data
          </button>
        ) : (
          <div className="mt-4 flex items-center gap-3">
            <p className="text-sm font-medium text-red-900 dark:text-red-400">
              Are you sure? This cannot be undone.
            </p>
            <button
              onClick={handleClearAllData}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Yes, delete everything
            </button>
            <button
              onClick={() => setShowClearConfirmation(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* Caregiver invites section - hidden for now */}
      {/* 
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Caregiver invites
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Invite partners, nannies, or grandparents to log together.
            </p>
          </div>
        </div>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-[2fr,1fr,auto]"
          onSubmit={submitInvite}
        >
          <input
            type="email"
            required
            placeholder="caregiver@email.com"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={role}
            onChange={(event) => setRole(event.target.value as typeof role)}
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Send invite
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {caregivers.map((invite) => (
            <li
              key={invite.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {invite.email}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  {invite.role} • {invite.status}
                </p>
              </div>
              <span className="text-xs text-slate-400">Queued</span>
            </li>
          ))}
          {caregivers.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-300">
              No invites yet.
            </p>
          ) : null}
        </ul>
      </section>
      */}
    </div>
  );
}
