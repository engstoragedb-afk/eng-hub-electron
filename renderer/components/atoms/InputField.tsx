import type { InputHTMLAttributes } from "react";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function InputField({
  label,
  error,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <label className="block text-sm text-slate-800 dark:text-slate-200">
      {label && (
        <span className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
      <input
        className={`mt-1 block w-full rounded-2xl border bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition ${
          error
            ? "border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            : "border-slate-300 dark:border-white/10 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="mt-1 block text-xs text-rose-500">{error}</span>
      )}
    </label>
  );
}
