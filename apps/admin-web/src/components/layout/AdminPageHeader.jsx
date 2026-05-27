export default function AdminPageHeader({
  title,
  subtitle,
  primaryActionText,
  secondaryActionText,
  onPrimaryClick,
  children,
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#111827] md:text-2xl">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {secondaryActionText && (
            <button
              type="button"
              className="
                rounded-xl
                border
                border-[#E5E7EB]
                bg-white
                px-4
                py-2.5
                text-sm
                font-semibold
                text-[#111827]
                transition-all
                duration-300
                hover:bg-[#FFF4E5]
                focus-visible:outline-none
                focus-visible:ring-4
                focus-visible:ring-[#F4B860]/20
              "
            >
              {secondaryActionText}
            </button>
          )}

          {primaryActionText && (
            <button
              type="button"
              onClick={onPrimaryClick}
              className="
                rounded-xl
                bg-[#F4B860]
                px-4
                py-2.5
                text-sm
                font-semibold
                text-[#111827]
                shadow-sm
                transition-all
                duration-300
                hover:bg-[#E8A13F]
                focus-visible:outline-none
                focus-visible:ring-4
                focus-visible:ring-[#F4B860]/20
              "
            >
              {primaryActionText}
            </button>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}