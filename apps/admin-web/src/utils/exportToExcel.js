import * as XLSX from "xlsx";

/**
 * Reusable utility to export JSON data to Excel (.xlsx)
 * 
 * @param {Array} rows - Array of data objects
 * @param {Array} columns - Array of column config { header: string, key: string, format: string }
 * @param {string} fileName - Name of the file to be downloaded
 * @param {string} sheetName - Name of the worksheet
 */
export function exportToExcel({
  rows = [],
  columns = [],
  fileName = "report.xlsx",
  sheetName = "Report",
}) {
  if (!rows || rows.length === 0) {
    console.warn("No data available to export");
    return;
  }

  // 1. Prepare data based on columns
  const excelData = rows.map((row) => {
    const formattedRow = {};
    columns.forEach((col) => {
      let value = getNestedValue(row, col.key);

      // Handle formatting
      if (col.format === "date" && value) {
        value = new Date(value).toLocaleString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } else if (col.format === "currency" && typeof value === "number") {
        value = `₹${value.toLocaleString("en-IN")}`;
      } else if (col.format === "capitalize" && typeof value === "string") {
        value = value.charAt(0).toUpperCase() + value.slice(1);
      }

      formattedRow[col.header] = value ?? "-";
    });
    return formattedRow;
  });

  // 2. Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // 3. Auto-size columns
  const colWidths = columns.map((col) => {
    const headerLen = col.header.length;
    const maxDataLen = excelData.reduce((max, row) => {
      const val = String(row[col.header] || "");
      return Math.max(max, val.length);
    }, headerLen);
    return { wch: maxDataLen + 2 };
  });
  worksheet["!cols"] = colWidths;

  // 4. Create workbook and write file
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Append current date to filename if not present
  const finalFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`;
  
  XLSX.writeFile(workbook, finalFileName);
}

// Helper to access nested properties like "user.username"
function getNestedValue(obj, path) {
  if (!path) return obj;
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}
