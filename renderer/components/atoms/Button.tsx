import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-sky-500 text-slate-950 hover:bg-sky-400 focus:ring-sky-400",
  secondary:
    "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:bg-slate-700 focus:ring-slate-500",
  ghost: "bg-transparent text-slate-900 dark:text-slate-100 hover:bg-slate-300/50 dark:bg-white/10 focus:ring-slate-400",
  danger: "bg-rose-500 text-white hover:bg-rose-400 focus:ring-rose-400",
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
