import React, { useState, useEffect } from "react";
import { autopoolService } from "../../services/autopool.service";
import AdminPageHeader from "../../components/layout/AdminPageHeader";

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

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    const data = await autopoolService.getQueue();
    setQueue(data);
    setLoading(false);
  };

  const handleProcessQueue = async () => {
    try {
      setLoading(true);
      await autopoolService.processQueue();
      alert("Queue processing triggered successfully!");
      fetchQueue();
    } catch (error) {
      alert("Failed to process queue: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AdminPageHeader 
          title="Auto Pool Queue" 
          subtitle="Manage and monitor the Auto Pool FIFO queue"
        />
        <button 
          onClick={handleProcessQueue}
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 font-semibold"
        >
          Process Queue Now
        </button>
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
                    <td className="px-6 py-4 text-sm text-slate-600">{index + 1}</td>
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
                    <td className="px-6 py-4 text-sm text-slate-600">{entry.rebirthChildrenCount ?? 0} / 2</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {entry.completedAt ? formatDate(entry.completedAt).split(",")[0] : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AutoPoolQueuePage;
