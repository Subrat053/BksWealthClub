export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-2xl">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-[#111827]">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="
              rounded-xl
              border
              border-[#E5E7EB]
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-[#374151]
              transition-all
              duration-300
              hover:bg-[#FFF4E5]
              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-[#F4B860]/20
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="
              rounded-xl
              bg-[#EF4444]
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition-all
              duration-300
              hover:bg-red-600
              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-red-200
            "
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}