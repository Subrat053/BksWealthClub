export default function Card({ title, children, className = "" }) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(165deg,rgba(16,37,103,0.88)_0%,rgba(12,28,76,0.94)_100%)] p-5 shadow-[0_16px_36px_rgba(5,10,35,0.45)] backdrop-blur-sm ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent" />
      {title ? <h2 className="relative mb-4 text-xl font-bold text-white">{title}</h2> : null}
      {children}
    </section>
  );
}
