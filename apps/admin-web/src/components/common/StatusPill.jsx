export default function StatusPill({ status = "pending" }) {
  const normalized = status.toLowerCase();
  const styles = {
    active: "bg-[#1fce6d]",
    inactive: "bg-[#ff2a5f]",
    pending: "bg-[#f5b942] text-black",
    approved: "bg-[#1fce6d]",
    rejected: "bg-[#ff2a5f]",
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[normalized] || styles.pending}`}>{status}</span>;
}
