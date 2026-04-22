export default function AdminTable({ columns = [], rows = [], emptyText = "No Data Found" }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-white">
          <thead className="bg-[#101d49] text-xs uppercase tracking-wide text-slate-200">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, idx) => (
                <tr key={`${row.id || idx}-${idx}`} className="border-t border-white/10">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-slate-100">
                      {row[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="border-t border-white/10">
                <td colSpan={columns.length || 1} className="px-4 py-8 text-center text-sm text-slate-300">
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
