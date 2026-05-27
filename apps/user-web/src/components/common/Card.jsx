export default function Card({ title, children, className = "", variant = "default" }) {
  const cardColors = variant === "highlight" ? "bg-[#FFF4E5]" : "bg-white";
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-[#E5E7EB] ${cardColors} p-5 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300 ${className}`}
    >
      {title ? <h2 className="relative mb-4 text-lg font-bold text-[#111827]">{title}</h2> : null}
      <div className="relative text-[#6B7280]">{children}</div>
    </section>
  );
}
