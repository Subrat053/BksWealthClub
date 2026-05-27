export default function DataTable({ columns = [], data = [], renderActions }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left border-collapse">
          <thead className="bg-[#F8FAFC]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#6B7280]"
                >
                  {col.label}
                </th>
              ))}
              {renderActions && (
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Actions</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F3F4F6]">
            {data.map((row, index) => (
              <tr key={row.id || index} className="transition-colors duration-200 hover:bg-[#FFF4E5]">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-6 py-4 text-sm text-[#111827]"
                  >
                    {col.render ? col.render(row[col.key], row, index) : row[col.key]}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-6 py-4 text-sm text-[#6B7280]">
                    {renderActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}