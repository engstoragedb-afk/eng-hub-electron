type AplCardProps = {
  name: string;
  input: number;
  chartMax: number;
  onEdit?: () => void;
};


export default function AplCard({ name, input, chartMax, onEdit }: AplCardProps) {
  let tone = "bg-emerald-400"; // Default green
  if (input >= 50) {
    tone = "bg-amber-400"; // Yellow if 50 or more
  }

  const barWidth = chartMax > 0 ? Math.min(100, Math.max(0, (input / chartMax) * 100)) : 0;

  return (
    <div 
      onDoubleClick={onEdit}
      className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl border border-slate-300 dark:border-white/5 bg-white dark:bg-slate-900/40 p-4 transition ${onEdit ? "cursor-pointer hover:border-sky-400/60 hover:bg-slate-50 dark:hover:bg-slate-800 select-none" : ""}`}
    >
      <div className="sm:w-1/3 xl:w-1/4 shrink-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide truncate" title={name}>{name}</p>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
            <div className={`${tone} h-full transition-all duration-500 absolute left-0 top-0`} style={{ width: `${barWidth}%` }} />
          </div>
          <div className="flex items-center gap-2 shrink-0 justify-end w-20">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {input} Jam
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
