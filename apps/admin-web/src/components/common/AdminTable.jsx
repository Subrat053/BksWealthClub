export default function AdminTable({ columns = [], rows = [], emptyText = "No Data Found" }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-collapse">
          <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#6B7280]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3.5 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {rows.length ? (
              rows.map((row, idx) => (
                <tr key={`${row.id || idx}-${idx}`} className="transition-colors duration-200 hover:bg-[#FFF4E5]">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5 text-sm text-[#111827]">
                      {row[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length || 1} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">
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
