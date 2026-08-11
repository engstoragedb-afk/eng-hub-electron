import type { SelectHTMLAttributes } from "react";

type FilterSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

export default function FilterSelect({
  label,
  className = "",
  children,
  ...props
}: FilterSelectProps) {
  return (
    <label className="text-xs text-slate-700 dark:text-slate-300">
      <span className="block mb-1">{label}</span>
      <select
        className={`rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
