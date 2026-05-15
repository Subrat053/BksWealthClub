import React, { useState, useEffect } from "react";
import Card from "../../components/common/Card";
import { autopoolService } from "../../services/autopool.service";

const formatDate = (dateStr) => {
  if (!dateStr) return "Pending";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AutopoolTreePage() {
  const [data, setData] = useState({ entries: [], completions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAutoPool();
  }, []);

  const fetchMyAutoPool = async () => {
    setLoading(true);
    const result = await autopoolService.getMyAutoPool();
    setData(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 rounded-[28px] border border-amber-500/15 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_34%),linear-gradient(180deg,#08142f_0%,#091938_48%,#050b1d_100%)] p-4 shadow-[0_24px_60px_rgba(5,10,35,0.38)] md:p-6">
      <div className="space-y-2">
        <div className="h-1 w-24 rounded-full bg-linear-to-r from-amber-300 via-amber-500 to-yellow-200" />
        <h1 className="text-3xl font-bold leading-none text-white md:text-4xl">My Auto Pool</h1>
        <p className="max-w-2xl text-sm text-amber-100/70 md:text-base">
          Track your rebirth nodes and level completions in the 3x3 global matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="px-2 text-lg font-bold text-amber-100">Active Rebirth Nodes</h3>
          {loading ? (
            <Card className="border-amber-500/20! bg-[#081730]/95! flex justify-center py-10 text-amber-100!">
              Loading...
            </Card>
          ) : data.entries.length === 0 ? (
            <Card className="border-amber-500/20! bg-[#081730]/95! text-center py-10 text-amber-200/70! italic">
              No active rebirth nodes found.
            </Card>
          ) : (
            data.entries.map((entry) => (
              <Card key={entry._id} className="border-amber-500/20! bg-[#091a39]/95! relative overflow-hidden group">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${entry.status === "COMPLETED" ? "bg-emerald-500" : "bg-linear-to-b from-amber-300 via-amber-500 to-yellow-300"}`} />
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-white">{entry.displayId}</h4>
                    <p className="text-xs text-amber-200/70">Joined: {formatDate(entry.queueTimestamp)}</p>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                      entry.status === "COMPLETED"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : entry.status === "PLACED"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-yellow-500/20 text-yellow-300"
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-amber-500/10 bg-white/5 p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase text-amber-200/50">Level</p>
                    <p className="text-sm font-bold text-white">AutoPool {entry.levelNumber + 1}</p>
                  </div>
                  <div className="rounded-lg border border-amber-500/10 bg-white/5 p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase text-amber-200/50">Sequence</p>
                    <p className="text-sm font-bold text-white">{entry.levelSequence}</p>
                  </div>
                </div>

                {entry.matrixParentEntryId && (
                  <div className="mt-4 flex items-center justify-between border-t border-amber-500/10 pt-3 text-xs">
                    <span className="font-semibold uppercase tracking-wider text-amber-200/50">Matrix Parent</span>
                    <span className="font-mono text-white">{entry.matrixParentEntryId.displayId}</span>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h3 className="px-2 text-lg font-bold text-amber-100">Level Completion Status</h3>
          <Card className="border-amber-500/20! bg-[#081730]/95!">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-amber-500/10">
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-amber-300">Level</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-amber-300">Progress</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-amber-300">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-amber-300">Completed On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-10 text-center text-amber-200/40">Loading...</td>
                    </tr>
                  ) : data.completions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-10 text-center italic text-amber-200/40">No completions recorded yet.</td>
                    </tr>
                  ) : (
                    data.completions.map((comp) => (
                      <tr key={comp._id} className="transition-colors hover:bg-white/5">
                        <td className="px-4 py-3 text-sm font-bold text-white">AutoPool {comp.autoPoolNumber}</td>
                        <td className="px-4 py-3 text-sm text-amber-100">
                          {comp.completedNodeCount} / {comp.expectedNodeCount}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${comp.isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/15 text-amber-300"}`}>
                            {comp.isCompleted ? "COMPLETED" : "IN PROGRESS"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-amber-100/70">
                          {comp.completedAt ? formatDate(comp.completedAt).split(",")[0] : "---"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
