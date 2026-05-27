export default function StatusPill({ status = "pending" }) {
  const normalized = status.toLowerCase();

  const styles = {
    active:
      "bg-green-100 text-[#10B981] border border-green-200",

    inactive:
      "bg-red-100 text-[#EF4444] border border-red-200",

    pending:
      "bg-[#FFF4E5] text-[#E8A13F] border border-[#F4B860]/40",

    approved:
      "bg-green-100 text-[#10B981] border border-green-200",

    rejected:
      "bg-red-100 text-[#EF4444] border border-red-200",

    processing:
      "bg-blue-100 text-[#3B82F6] border border-blue-200",

    completed:
      "bg-green-100 text-[#10B981] border border-green-200",

    cancelled:
      "bg-gray-100 text-[#6B7280] border border-gray-200",
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-3
        py-1
        text-xs
        font-semibold
        uppercase
        tracking-wide
        shadow-sm
        ${styles[normalized] || styles.pending}
      `}
    >
      {status}
    </span>
  );
}