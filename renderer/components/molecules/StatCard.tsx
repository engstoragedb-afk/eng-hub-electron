import type { ReactNode } from "react";

import Badge from "@/components/atoms/Badge";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  tone?: "success" | "warning" | "info" | "neutral";
  icon: ReactNode;
};

export default function StatCard({
  title,
  value,
  description,
  tone = "info",
  icon,
}: StatCardProps) {
  const gradientClass =
    tone === "success"
      ? "bg-linear-to-br from-emerald-100 via-emerald-50 to-white dark:from-emerald-900/60 dark:via-emerald-800/40 dark:to-emerald-700/30"
      : tone === "warning"
        ? "bg-linear-to-br from-amber-100 via-amber-50 to-white dark:from-amber-900/60 dark:via-amber-800/40 dark:to-amber-700/30"
        : tone === "neutral"
          ? "bg-linear-to-br from-purple-100 via-purple-50 to-white dark:from-purple-900/60 dark:via-purple-800/40 dark:to-purple-700/30"
          : "bg-linear-to-br from-sky-100 via-sky-50 to-white dark:from-sky-900/60 dark:via-sky-800/40 dark:to-sky-700/30";

  const iconClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-200"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-200"
        : tone === "neutral"
          ? "text-purple-600 dark:text-purple-200"
          : "text-sky-600 dark:text-sky-200";

  return (
    <div
      className={`rounded-3xl border border-slate-300 dark:border-white/10 ${gradientClass} p-5 shadow-sm`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</p>
          <p className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`text-3xl ${iconClass}`}>{icon}</div>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-4">
        <Badge tone={tone}>
          {tone === "success"
            ? "Stabil"
            : tone === "warning"
              ? "Perhatian"
              : "Info"}
        </Badge>
      </div>
    </div>
  );
}
