import "./globals.css";
import type { Metadata } from "next";
import { Inter, Fredoka } from "next/font/google";
import { PropsWithChildren } from "react";
import Link from "next/link";
import { ToastProvider } from "@/components/ui/toast-provider";
import { EventsProvider } from "@/components/ui/events-provider";
import { BottomNav } from "@/components/ui/bottom-nav";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });
const fredoka = Fredoka({ subsets: ["latin"], weight: ["500"] });

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
              <header className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 pt-6 pb-2">
                <div className="flex justify-center">
                  <Image
                    src="/babysteps.svg"
                    alt="babysteps"
                    width={60}
                    height={60}
                    priority
                    className="dark:invert"
                  />
                </div>
              </header>
              <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-24">
                {children}
              </main>
              <BottomNav />
            </div>
          </EventsProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
