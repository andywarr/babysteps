"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  ClockIcon as ClockIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from "@heroicons/react/24/solid";

const tabs = [
  {
    name: "Home",
    href: "/",
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    name: "Feed",
    href: "/feed",
    icon: ClockIcon,
    activeIcon: ClockIconSolid,
  },
  {
    name: "Stats",
    href: "/stats",
    icon: ChartBarIcon,
    activeIcon: ChartBarIconSolid,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Cog6ToothIcon,
    activeIcon: Cog6ToothIconSolid,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-700 dark:bg-slate-900/95 dark:supports-[backdrop-filter]:bg-slate-900/80 safe-area-inset-bottom">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-4">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== "/" && pathname.startsWith(tab.href));
            const Icon = isActive ? tab.activeIcon : tab.icon;

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-3 text-xs font-medium transition-colors ${
                  isActive
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
