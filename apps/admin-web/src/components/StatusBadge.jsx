export default function StatusBadge({ status }) {
  const classes =
    {
      active: "border border-[#10B981]/25 bg-emerald-50 text-[#10B981]",
      blocked: "border border-[#EF4444]/25 bg-red-50 text-[#EF4444]",
      pending: "border border-[#F59E0B]/25 bg-amber-50 text-[#F59E0B]",
      published: "border border-[#10B981]/25 bg-emerald-50 text-[#10B981]",
      draft: "border border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]",
      new: "border border-[#3B82F6]/25 bg-blue-50 text-[#3B82F6]",
      contacted: "border border-purple-200 bg-purple-50 text-purple-600",
      closed: "border border-[#10B981]/25 bg-emerald-50 text-[#10B981]",
      success: "border border-[#10B981]/25 bg-emerald-50 text-[#10B981]",
      failed: "border border-[#EF4444]/25 bg-red-50 text-[#EF4444]",
      sent: "border border-[#3B82F6]/25 bg-blue-50 text-[#3B82F6]",
      inactive: "border border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]",
    }[status] || "border border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${classes}`}>
      {status}
    </span>
  );
}