import { useEffect, useState } from "react";
import { apiClient } from "../../services/apiClient";
import { formatDate } from "../../utils/formatDate";

function ReportTable({ title, rows = [], showJoiningDate = false }) {
  return (
    <div className="mt-8">
      <h3 className="mb-3 text-lg font-bold text-white">{title}</h3>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#07122d]">
        <table className="w-full min-w-max border-collapse text-sm text-white">
          <thead className="bg-[#0b1d52]">
            <tr>
              <th className="border border-white/10 p-3 text-center">S.No.</th>
              {showJoiningDate && (
                <th className="border border-white/10 p-3 text-left">
                  Joining Date
                </th>
              )}
              <th className="border border-white/10 p-3 text-left">Username</th>
              <th className="border border-white/10 p-3 text-center">
                User ID
              </th>
              <th className="border border-white/10 p-3 text-center">
                Mobile Number
              </th>
              <th className="border border-white/10 p-3 text-right">
                {showJoiningDate ? "Business Volume" : "Invested Amount"}
              </th>
              <th className="border border-white/10 p-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={showJoiningDate ? 7 : 6}
                  className="border border-white/10 p-4 text-center text-blue-100/70"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((item, index) => (
                <tr key={item._id} className="hover:bg-white/5">
                  <td className="border border-white/10 p-3 text-center">
                    {index + 1}
                  </td>

                  {showJoiningDate && (
                    <td className="border border-white/10 p-3">
                      {formatDate(item.joinedAt || item.createdAt)}
                    </td>
                  )}

                  <td className="border border-white/10 p-3 text-left">
                    {item.fullName}
                  </td>

                  <td className="border border-white/10 p-3 text-center">
                    {item.memberId}
                  </td>

                  <td className="border border-white/10 p-3 text-center">
                    {item.phone || "-"}
                  </td>

                  <td className="border border-white/10 p-3 text-right">₹0</td>

                  <td className="border border-white/10 p-3 text-center">
                    {item.status === "active" || item.isActivated
                      ? "Active"
                      : "Inactive"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MyTeamReportPage() {
  const [report, setReport] = useState({
    levels: {},
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setError("");
      const res = await apiClient("/referrals/my-tree");

      // Flatten tree into level-based structure
      const levels = {};

      const flattenTree = (nodes, level) => {
        if (!nodes || nodes.length === 0) return;

        if (!levels[level]) levels[level] = [];
        levels[level].push(...nodes);

        nodes.forEach((node) => {
          if (node.children && node.children.length > 0) {
            flattenTree(node.children, level + 1);
          }
        });
      };

      const treeData = res?.data?.root || {};
      if (treeData.children && treeData.children.length > 0) {
        flattenTree(treeData.children, 1);
      }

      setReport({ levels });
    } catch (error) {
      setError(error.message || "Failed to load level report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-[#07122d] p-6">
        <h1 className="text-2xl font-black">Level Report</h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100/75">
          This view shows your team hierarchy level by level, starting from your
          direct downline and extending through deeper generations.
        </p>
      </div>

      {loading ? (
        <p className="mt-6 text-blue-100/70">Loading report...</p>
      ) : error ? (
        <p className="mt-6 text-red-300">{error}</p>
      ) : (
        <>
          <div className="mt-8">
            <h2 className="text-xl font-black">My Team</h2>
          </div>

          {/* <div className="mt-10">
            <h2 className="text-xl font-black">2. Level Report</h2>
          </div> */}

          {Array.from({ length: 9 }, (_, i) => {
            const level = i + 1;

            return (
              <ReportTable
                key={level}
                title={`Level ${level}:`}
                rows={report.levels?.[level] || []}
                showJoiningDate
              />
            );
          })}
        </>
      )}
    </div>
  );
}
