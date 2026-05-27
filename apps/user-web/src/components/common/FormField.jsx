export default function FormField({ label, children }) {
  return (
    <div>
      {label ? (
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-orange-300">{label}</label>
      ) : null}
      {children}
    </div>
  );
}
