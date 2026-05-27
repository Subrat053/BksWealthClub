export default function PageHeader({
  title,
  subtitle,
  actions,
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
            {subtitle}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}