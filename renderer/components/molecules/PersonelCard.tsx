import Badge from "@/components/atoms/Badge";
import { FaEnvelope, FaPen } from "react-icons/fa";

type PersonelCardProps = {
  id?: string;
  name: string;
  role: string;
  status: "Aktif" | "Nonaktif";
  phone: string;
  email: string;
  onEdit?: () => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default function PersonelCard({
  id,
  name,
  role,
  status,
  phone,
  email,
  onEdit,
}: PersonelCardProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/60 p-4 transition hover:border-sky-400/60 hover:bg-slate-100 dark:hover:bg-slate-800">
      <div className="flex items-center gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-950 text-lg font-bold text-sky-400 shadow-inner">
          {getInitials(name)}
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 dark:text-slate-400">
            {role} {id ? `• ${id}` : ""}
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{name}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">
            <FaEnvelope className="text-xs opacity-70" />
            <span>{email}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 self-end sm:self-auto">
        <Badge tone={status === "Aktif" ? "success" : "warning"}>
          {status}
        </Badge>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition hover:bg-sky-500 hover:text-white"
            title="Edit Personel"
          >
            <FaPen className="text-[10px]" />
          </button>
        )}
      </div>
    </div>
  );
}
