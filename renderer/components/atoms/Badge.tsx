import type { ReactNode } from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: "success" | "warning" | "info" | "neutral";
};

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200",
  info: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200",
  neutral: "bg-slate-200 dark:bg-slate-700/70 text-slate-900 dark:text-slate-100",
};

export default function Badge({ children, tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
