export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-gradient-to-r from-[#3f63db] via-[#3e7cec] to-[#33c0d7] text-white shadow-[0_10px_30px_rgba(51,192,215,0.35)]",
    danger: "bg-gradient-to-r from-[#d4144e] to-[#ff2a5f] text-white shadow-[0_10px_30px_rgba(255,42,95,0.3)]",
    muted: "border border-white/20 bg-white/10 text-white",
  };

  return (
    <button
      type={type}
      className={`h-12 rounded-xl px-5 text-sm font-semibold tracking-wide transition duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
