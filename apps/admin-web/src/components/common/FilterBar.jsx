export default function FilterBar({ children }) {
  return (
    <div
      className="
        grid
        gap-4
        rounded-2xl
        border
        border-[#E5E7EB]
        bg-white
        p-5
        shadow-sm
        md:grid-cols-3
      "
    >
      {children}
    </div>
  );
}