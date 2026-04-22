export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a1540] p-5 text-white">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-slate-300">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg bg-white/10 px-4 py-2 text-sm">Cancel</button>
          <button onClick={onConfirm} className="rounded-lg bg-[#ff2a5f] px-4 py-2 text-sm font-semibold">Confirm</button>
        </div>
      </div>
    </div>
  );
}
