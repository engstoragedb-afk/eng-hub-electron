import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import Breadcrumbs from "@/components/molecules/Breadcrumbs";

type MaintenanceLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function MaintenanceLayout({
  title,
  subtitle,
  children,
}: MaintenanceLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const weekdayLabel = now
    .toLocaleDateString("id-ID", { weekday: "long" })
    .toUpperCase();
  const dateLabel = now
    .toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
  const timeLabel = now.toLocaleTimeString("id-ID").replace(/:/g, ".");

  return (
    <main className="p-8 flex-1 flex flex-col">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Breadcrumbs />
          <p className="mb-1 text-sm text-slate-700 dark:text-slate-300">
            {subtitle || "Ringkasan Antrian Perbaikan"}
          </p>
          <h1 className="text-4xl font-extrabold">{title}</h1>
        </div>
        <div>
          <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 px-5 py-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600 dark:text-slate-400">
              {mounted ? `${weekdayLabel}, ${dateLabel}` : "MEMUAT..."}
            </p>
            <p className="text-xl font-bold text-amber-300">
              {mounted ? timeLabel : "--.--.--"}
            </p>
          </div>
        </div>
      </div>
      {children}
    </main>
  );
}
