export default function DataTable({ columns = [], data = [], renderActions }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#091a4a]/75 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[#112766]/70">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-white"
                >
                  {col.label}
                </th>
              ))}
              {renderActions && (
                <th className="px-5 py-4 text-sm font-semibold text-white">Actions</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {data.map((row, index) => (
              <tr key={row.id || index} className="transition hover:bg-white/5">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-5 py-4 text-sm text-blue-100/85"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {renderActions && <td className="px-5 py-4">{renderActions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}