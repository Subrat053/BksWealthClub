import EmptyState from "./EmptyState";

export default function DataTable({ columns = [], rows = [], emptyText = "No Data Found" }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/15 bg-[#08153f]/55">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-white">
          <thead className="bg-gradient-to-r from-[#12255f] via-[#132f72] to-[#13366f] text-xs uppercase tracking-[0.12em] text-slate-200">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-5 py-4 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, idx) => (
                <tr
                  key={`${row.id || idx}-${idx}`}
                  className="border-t border-white/10 transition hover:bg-white/5"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4 text-sm text-slate-100">
                      {row[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="border-t border-white/10">
                <td colSpan={columns.length || 1}>
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
