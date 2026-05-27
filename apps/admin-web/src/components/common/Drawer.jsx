export default function Drawer({
  title,
  open,
  onClose,
  children,
}) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <button
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close drawer"
      />

      {/* Drawer */}
      <aside
        className="
          fixed
          right-0
          top-0
          z-50
          flex
          h-screen
          w-full
          max-w-md
          flex-col
          border-l
          border-[#E5E7EB]
          bg-white
          p-6
          shadow-2xl
        "
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="text-xl font-semibold text-[#111827]">
              {title}
            </h3>

            <p className="mt-1 text-sm text-[#6B7280]">
              Manage and review details.
            </p>
          </div>

          <button
            onClick={onClose}
            className="
              rounded-xl
              border
              border-[#E5E7EB]
              bg-white
              px-3
              py-2
              text-sm
              font-medium
              text-[#6B7280]
              transition-all
              duration-300
              hover:bg-[#FFF4E5]
              hover:text-[#111827]
            "
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {children}
        </div>
      </aside>
    </>
  );
}