export default function Drawer({ title, open, onClose, children }) {
  if (!open) return null;

  return (
    <>
      <button className="fixed inset-0 z-40 bg-black/60" onClick={onClose} aria-label="Close drawer" />
      <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-md border-l border-white/10 bg-[#0a1540] p-5 text-white">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sm text-slate-300">Close</button>
        </div>
        {children}
      </aside>
    </>
  );
}
