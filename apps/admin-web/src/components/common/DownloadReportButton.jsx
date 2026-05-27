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

  const isBtnDisabled =
    disabled || loading || !data || data.length === 0;

  return (
    <button
      onClick={handleDownload}
      disabled={isBtnDisabled}
      className={`
        inline-flex
        items-center
        gap-2
        rounded-xl
        border
        border-[#E5E7EB]
        bg-white
        px-4
        py-2.5
        text-sm
        font-semibold
        text-[#111827]
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:border-[#F4B860]/50
        hover:bg-[#FFF4E5]
        focus-visible:outline-none
        focus-visible:ring-4
        focus-visible:ring-[#F4B860]/20
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${className}
      `}
    >
      <div
        className="
          flex
          h-7
          w-7
          items-center
          justify-center
          rounded-lg
          bg-[#FFF4E5]
          text-[#E8A13F]
        "
      >
        <Download size={16} />
      </div>

      <span>
        {loading ? "Generating..." : label}
      </span>
    </button>
  );
}