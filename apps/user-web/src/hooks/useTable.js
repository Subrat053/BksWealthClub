import { useMemo, useState } from "react";

export function useTable(initialRows = []) {
  const [query, setQuery] = useState("");
  const [rows] = useState(initialRows);

  const filteredRows = useMemo(() => {
    if (!query.trim()) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  }, [query, rows]);

  return {
    query,
    setQuery,
    rows: filteredRows,
  };
}
