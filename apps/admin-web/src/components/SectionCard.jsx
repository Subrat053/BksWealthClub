export default function SectionCard({ title, children, actionText, onActionClick }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-lg transition-all duration-300">
      {title && (
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#111827]">{title}</h2>
          {actionText ? (
            <button
              onClick={onActionClick}
              className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#111827] hover:bg-[#F8FAFC] transition-all duration-300 hover:scale-[1.02] shadow-sm"
            >
              {actionText}
            </button>
          ) : null}
        </div>
      )}
      <div className="relative text-[#6B7280]">{children}</div>
    </div>
  );
}