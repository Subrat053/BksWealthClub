import React, { useState, useEffect } from "react";
import { autopoolService } from "../../services/autopool.service";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import { Download } from "lucide-react";
import { exportToExcel } from "../../utils/exportToExcel";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const AutoPoolQueuePage = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchQueue(1, searchQuery);
  }, [searchQuery]);

  const fetchQueue = async (page = 1, search = searchQuery) => {
    setLoading(true);
    const { data, meta } = await autopoolService.getQueue(page, 100, search);
    setQueue(data);
    setCurrentPage(meta.page);
    setTotalPages(meta.totalPages);
    setTotalEntries(meta.total);
    setLoading(false);
  };

  const [downloading, setDownloading] = useState(false);

  const handleProcessQueue = async () => {
    try {
      setLoading(true);
      await autopoolService.processQueue();
      alert("Queue processing triggered successfully!");
      fetchQueue(currentPage);
    } catch (error) {
      alert("Failed to process queue: " + error.message);
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      // Fetch all entries in the queue matching the active search query (using limit = 0)
      const { data } = await autopoolService.getQueue(1, 0, searchQuery);
      if (!data || data.length === 0) {
        alert("No entries in queue to download.");
        return;
      }

      // Map rows with type text
      const formattedRows = data.map((entry) => ({
        ...entry,
        generationText: entry.generation === 0 ? "ROOT" : `GEN ${entry.generation}`,
      }));

      // Define columns to export
      const columns = [
        { header: "Pool ID", key: "rebirthCode" },
        { header: "Owner Name", key: "ownerUserId.fullName" },
        { header: "Owner Member ID", key: "ownerUserId.memberId" },
        { header: "Type", key: "generationText" },
        { header: "Generation / Level", key: "generation" },
        { header: "Timestamp", key: "queueTimestamp", format: "date" },
        { header: "Status", key: "status" },
        { header: "Matrix Parent", key: "parentPoolNodeId.poolNodeId" },
        { header: "Children Count", key: "rebirthChildrenCount" },
        { header: "Completed At", key: "completedAt", format: "date" },
      ];

      exportToExcel({
        rows: formattedRows,
        columns,
        fileName: "autopool-queue-report",
        sheetName: "Queue",
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export queue: " + error.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AdminPageHeader 
          title="Auto Pool Queue" 
          subtitle="Manage and monitor the Auto Pool FIFO queue"
        />
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadExcel}
            disabled={downloading || loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 font-semibold cursor-pointer"
          >
            <Download size={18} />
            {downloading ? "Exporting..." : "Download Excel"}
          </button>
          <button 
            onClick={handleProcessQueue}
            disabled={loading || downloading}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 font-semibold"
          >
            Process Queue Now
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="w-full max-w-sm">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, member ID or pool ID..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Serial No.</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pool ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gen / Level</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Matrix Parent</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Children</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-10 text-center text-slate-400">Loading queue...</td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-10 text-center text-slate-400">No entries in queue</td>
                </tr>
              ) : (
                queue.map((entry, index) => (
                  <tr key={entry._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">{(currentPage - 1) * 100 + index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{entry.rebirthCode}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div>{entry.ownerUserId?.fullName || "N/A"}</div>
                      <div className="text-xs text-slate-400">{entry.ownerUserId?.memberId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.generation === 0 ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                        {entry.generation === 0 ? "ROOT" : `GEN ${entry.generation}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{entry.generation}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(entry.queueTimestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${entry.status === "PENDING" ? "bg-amber-100 text-amber-700" : 
                          entry.status === "PLACED" ? "bg-indigo-100 text-indigo-700" : 
                          "bg-emerald-100 text-emerald-700"}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{entry.parentPoolNodeId?.poolNodeId || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{entry.rebirthChildrenCount ?? 0} / 3</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {entry.completedAt ? formatDate(entry.completedAt).split(",")[0] : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && queue.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * 100 + 1}</span> to{" "}
              <span className="text-slate-900 font-bold">
                {Math.min(currentPage * 100, totalEntries)}
              </span>{" "}
              of <span className="text-slate-900 font-bold">{totalEntries}</span> entries
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchQueue(1)}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                title="First Page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7M17 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => fetchQueue(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>

              {/* Visual Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = currentPage;
                if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                if (pageNum <= 0 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchQueue(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => fetchQueue(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all flex items-center gap-1"
              >
                Next
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => fetchQueue(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                title="Last Page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M7 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoPoolQueuePage;
