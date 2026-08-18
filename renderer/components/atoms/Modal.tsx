import { useEffect } from "react";
import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ open, title, subtitle, onClose, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950/80 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-800/60 px-6 py-5">
          <div>
            {title && (
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition hover:bg-slate-200 dark:bg-slate-700"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
