export default function SuccessModal({
  open,
  onClose,
  title = "Success!",
  message,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center shadow-2xl">
        {/* Icon */}
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-green-200 bg-green-100">
          <svg
            className="h-10 w-10 text-[#10B981]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Text */}
        <h2 className="mb-2 text-2xl font-bold text-[#111827]">
          {title}
        </h2>

        {message && (
          <p className="mb-6 text-sm leading-relaxed text-[#6B7280]">
            {message}
          </p>
        )}

        {/* Button */}
        <button
          type="button"
          onClick={onClose}
          className="
            w-full
            rounded-xl
            bg-[#F4B860]
            px-4
            py-3
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
          Done
        </button>
      </div>
    </div>
  );
}