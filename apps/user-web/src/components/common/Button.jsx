export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary:
      "bg-[#111827] text-white hover:bg-[#1F2937] shadow-sm",

    secondary:
      "bg-[#F4B860] text-[#111827] hover:bg-[#E8A13F] shadow-sm",

    outline:
      "border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#FFF4E5]",

    danger:
      "bg-[#EF4444] text-white hover:bg-red-600 shadow-sm",

    muted:
      "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]",
  };

  return (
    <button
      type={type}
      className={`
        h-12
        rounded-xl
        px-5
        text-sm
        font-semibold
        tracking-wide
        transition-all
        duration-300
        hover:-translate-y-0.5
        focus-visible:outline-none
        focus-visible:ring-4
        focus-visible:ring-[#F4B860]/20
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}