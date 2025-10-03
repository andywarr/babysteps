"use client";

import { FormEvent, useState } from "react";

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
