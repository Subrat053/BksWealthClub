import { Download } from "lucide-react";
import { exportToExcel } from "../../utils/exportToExcel";
import { useState } from "react";

/**
 * Reusable button component for Excel exports
 */
export default function DownloadReportButton({
  data = [],
  columns = [],
  fileName = "report",
  sheetName = "Data",
  className = "",
  label = "Download Report",
  disabled = false,
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    if (!data || data.length === 0) {
      alert("No data available to download.");
      return;
    }

    setLoading(true);
    try {
      exportToExcel({
        rows: data,
        columns,
        fileName,
        sheetName,
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const isBtnDisabled = disabled || loading || !data || data.length === 0;

  return (
    <button
      onClick={handleDownload}
      disabled={isBtnDisabled}
      className={`inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Download size={16} />
      {loading ? "Generating..." : label}
    </button>
  );
}
