export default function SuccessModal({ open, onClose, title = "Success!", message }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#091a4a] p-8 shadow-2xl flex flex-col items-center text-center">
        
        {/* Icon */}
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 border border-green-400/30">
          <svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        {message && (
          <p className="text-sm text-blue-200/60 mb-6">{message}</p>
        )}

        {/* Button */}
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-[#1e327d] px-4 py-3 font-semibold text-white hover:bg-[#2944a8] transition"
        >
          Done
        </button>
      </div>
    </div>
  );
}