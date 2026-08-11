type SectionHeadingProps = {
  title: string;
  description?: string;
};

export default function SectionHeading({
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">{description}</p>
      )}
    </div>
  );
}
