export default function FormField({ label, children }) {
  return (
    <div>
      {label ? (
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100/90">{label}</label>
      ) : null}
      {children}
    </div>
  );
}
