import React from "react";

export default function PremiumButton({
  children,
  onClick,
  type = "button",
  variant = "primary", // 'primary' | 'secondary' | 'outline'
  disabled = false,
  isLoading = false,
  className = "",
  icon: Icon,
  iconPosition = "left",
  ...props
}) {
  const baseStyle =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02]";

  const variants = {
    primary:
      "bg-[#111827] text-white hover:bg-[#1F2937] focus:ring-[#111827]/50",
    secondary:
      "bg-[#F4B860] text-[#111827] hover:bg-[#E8A13F] focus:ring-[#F4B860]/50",
    outline:
      "border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F8FAFC] focus:ring-[#E5E7EB]/50 shadow-sm",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : Icon && iconPosition === "left" ? (
        <Icon size={16} className="shrink-0" />
      ) : null}

      <span>{children}</span>

      {!isLoading && Icon && iconPosition === "right" ? (
        <Icon size={16} className="shrink-0" />
      ) : null}
    </button>
  );
}
