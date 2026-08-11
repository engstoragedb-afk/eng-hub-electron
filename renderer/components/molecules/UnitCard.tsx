import Badge from "@/components/atoms/Badge";

type UnitCardProps = {
  code: string;
  category: string;
  status: "Siap" | "Perbaikan";
  hm: number;
  hours: number;
  imageUrl?: string;
  onClick?: () => void;
};

export default function UnitCard({
  code,
  category,
  status,
  hm,
  hours,
  imageUrl,
  onClick,
}: UnitCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/70 p-4 text-left transition hover:border-sky-400/60 hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <div className="flex items-center gap-6">
        <div
          className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950/60 p-3 bg-no-repeat bg-center"
          style={{
            backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
            backgroundSize: "80px 80px",
          }}
          role="img"
          aria-label={category}
        >
          {!imageUrl && <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800" />}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 dark:text-slate-400">
                {category}
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {code}
              </div>
            </div>
            <Badge tone={status === "Siap" ? "success" : "warning"}>
              {status}
            </Badge>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span>HM</span>
              <span>{hm}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hours</span>
              <span>{hours}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
