export default function AdminPageHeader({
  title,
  subtitle,
  primaryActionText,
  secondaryActionText,
  onPrimaryClick,
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#091a4a]/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.22)] backdrop-blur-md md:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
          <p className="mt-1 text-sm text-blue-100/75">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {secondaryActionText && (
            <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-blue-50 transition hover:bg-white/10">
              {secondaryActionText}
            </button>
          )}

          {primaryActionText && (
            <button
            onClick={onPrimaryClick} 
            className="rounded-xl bg-[#1e327d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2944a8]"
            >
              {primaryActionText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}