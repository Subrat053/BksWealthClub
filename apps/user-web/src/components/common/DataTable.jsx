import EmptyState from "./EmptyState";

export default function DataTable({ columns = [], rows = [], emptyText = "No Data Found" }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-collapse">
          <thead className="bg-[#F8FAFC] text-xs uppercase tracking-[0.12em] text-[#6B7280]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-5 py-4 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {rows.length > 0 ? (
              rows.map((row, idx) => (
                <tr
                  key={`${row.id || idx}-${idx}`}
                  className="border-t border-[#F3F4F6] transition-colors duration-200 hover:bg-[#FFF4E5]"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4 text-sm text-[#111827]">
                      {col.render ? col.render(row[col.key], row, idx) : row[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="border-t border-[#F3F4F6]">
                <td colSpan={columns.length || 1} className="py-8">
                  <EmptyState text={emptyText} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
