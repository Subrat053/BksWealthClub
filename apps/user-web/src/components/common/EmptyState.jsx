export default function EmptyState({ text = "No Data Found" }) {
  return <div className="py-10 text-center text-lg font-medium text-white/80">{text}</div>;
}
