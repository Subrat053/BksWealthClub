export default function StatusBadge({ status }) {
  const classes =
    {
      active: "border border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
      blocked: "border border-red-400/20 bg-red-500/15 text-red-300",
      pending: "border border-amber-400/20 bg-amber-500/15 text-amber-300",
      published: "border border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
      draft: "border border-slate-400/20 bg-slate-500/15 text-slate-300",
      new: "border border-sky-400/20 bg-sky-500/15 text-sky-300",
      contacted: "border border-violet-400/20 bg-violet-500/15 text-violet-300",
      closed: "border border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
      success: "border border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
      failed: "border border-red-400/20 bg-red-500/15 text-red-300",
      sent: "border border-sky-400/20 bg-sky-500/15 text-sky-300",
      inactive: "border border-slate-400/20 bg-slate-500/15 text-slate-300",
    }[status] || "border border-slate-400/20 bg-slate-500/15 text-slate-300";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${classes}`}>
      {status}
    </span>
  );
}