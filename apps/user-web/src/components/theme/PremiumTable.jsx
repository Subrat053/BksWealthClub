import React from "react";

export default function PremiumTable({
  columns = [],
  data = [],
  emptyText = "No data available",
  isLoading = false,
  className = "",
  rowKey = "id",
}) {
  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition-all duration-300 hover:shadow-md ${className}`}>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC]">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#6B7280]"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-[#9CA3AF]">
                  <div className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-[#F4B860]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Loading details...</span>
                  </div>
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr
                  key={row[rowKey] || rowIdx}
                  className="transition-colors duration-200 hover:bg-[#FFF4E5] group"
                >
                  {columns.map((col, colIdx) => {
                    const value = row[col.key];
                    const isNumeric = typeof value === "number";
                    return (
                      <td
                        key={col.key || colIdx}
                        className={`px-6 py-4.5 text-sm text-[#111827] ${
                          isNumeric ? "font-semibold text-[#111827] text-right" : "text-[#6B7280]"
                        }`}
                      >
                        {col.render ? col.render(value, row, rowIdx) : value ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-[#9CA3AF]">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
