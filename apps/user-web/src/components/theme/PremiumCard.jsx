import React from "react";

export default function PremiumCard({
  title,
  subtitle,
  children,
  className = "",
  hoverEffect = true,
  headerAction,
  variant = "default", // 'default' | 'highlight' (soft orange background)
}) {
  const baseCard =
    "rounded-2xl border border-[#E5E7EB] p-5 transition-all duration-300";

  const shadowHover = hoverEffect ? "shadow-sm hover:shadow-lg hover:-translate-y-[2px]" : "shadow-sm";

  const cardColors =
    variant === "highlight"
      ? "bg-[#FFF4E5] text-[#111827]"
      : "bg-white text-[#111827]";

  return (
    <section className={`${baseCard} ${shadowHover} ${cardColors} ${className}`}>
      {title || subtitle || headerAction ? (
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-lg font-bold text-[#111827]">{title}</h3>}
            {subtitle && <p className="text-sm text-[#6B7280] mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      ) : null}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
