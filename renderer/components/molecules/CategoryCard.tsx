type CategoryCardProps = {
  category: string;
  count: number;
  imageUrl?: string;
  onSelect: () => void;
};

export default function CategoryCard({
  category,
  count,
  imageUrl,
  onSelect,
}: CategoryCardProps) {
  return (
    <button
      onClick={onSelect}
      className="group flex w-full flex-col overflow-hidden rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/60 text-left transition-all hover:-translate-y-1 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-xl dark:hover:shadow-black/50"
    >
      <div className="relative flex h-48 w-full items-center justify-center bg-slate-50 dark:bg-slate-950/50 p-6">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={category}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {category}
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Total {count} Unit
        </p>
      </div>
    </button>
  );
}
