export default function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-5">
      <div className="mb-2 h-1 w-20 rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" />
      <h1 className="text-3xl font-bold leading-none text-white md:text-4xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-slate-300">{subtitle}</p> : null}
    </div>
  );
}
