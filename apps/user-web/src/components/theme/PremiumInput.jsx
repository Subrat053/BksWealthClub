import React from "react";

export default function PremiumInput({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  error = "",
  helperText = "",
  className = "",
  icon: Icon,
  ...props
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-[#6B7280]"
        >
          {label}
          {required && <span className="text-[#EF4444] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
            <Icon size={18} />
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full bg-white border ${
            error ? "border-[#EF4444]" : "border-[#E5E7EB]"
          } rounded-xl h-11 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-all duration-300 outline-none ${
            Icon ? "pl-10 pr-4" : "px-4"
          } focus:border-[#F4B860] focus:ring-4 focus:ring-[#F4B860]/20 disabled:bg-[#F8FAFC] disabled:text-[#9CA3AF]`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-[#EF4444] font-medium mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#9CA3AF] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
