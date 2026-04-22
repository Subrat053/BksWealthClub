export default function StatusBadge({ status = "pending" }) {
  const normalized = status.toLowerCase();
  const styles = {
    active: "bg-[#1fce6d]",
    inactive: "bg-[#ff2a5f]",
    pending: "bg-[#f5b942] text-black",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${styles[normalized] || styles.pending}`}>
      {status}
    </span>
  );
}
