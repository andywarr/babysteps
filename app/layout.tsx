import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PropsWithChildren } from "react";
import Link from "next/link";
import { ToastProvider } from "@/components/ui/toast-provider";
import { EventsProvider } from "@/components/ui/events-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Babysteps",
  description:
    "Offline-friendly baby care tracker for logging feeds, diapers, sleep, pumps, meds, and notes.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body
        className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100`}
      >
        <ToastProvider>
          <EventsProvider>
            <div className="flex min-h-screen flex-col">
              <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
                <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
                  <Link
                    href="/"
                    className="text-xl font-semibold text-brand-600 dark:text-brand-300"
                  >
                    Babysteps
                  </Link>
                  <nav className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Link
                      href="/history"
                      className="hover:text-brand-600 dark:hover:text-brand-200"
                    >
                      History
                    </Link>
                    <Link
                      href="/stats"
                      className="hover:text-brand-600 dark:hover:text-brand-200"
                    >
                      Stats
                    </Link>
                    <Link
                      href="/settings"
                      className="hover:text-brand-600 dark:hover:text-brand-200"
                    >
                      Settings
                    </Link>
                  </nav>
                </div>
              </header>
              <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
                {children}
              </main>
              <footer className="border-t border-slate-200 bg-white/80 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400">
                Built for sleepy caregivers with ❤️
              </footer>
            </div>
          </EventsProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
