import { useEffect, useState } from "react";
import { apiClient } from "../../services/apiClient";
import { formatDate } from "../../utils/formatDate";

function ReportTable({ title, rows = [], showJoiningDate = false }) {
  return (
    <div className="mt-8">
      <h3 className="mb-3 text-lg font-bold text-[#111827]">{title}</h3>

      <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <table className="w-full min-w-max border-collapse text-sm text-[#111827]">
          <thead>
            <tr className="bg-[#F8FAFC]">
              <th className="border-b border-[#E5E7EB] p-4 text-center font-semibold text-[#6B7280] text-xs uppercase tracking-wider">S.No.</th>
              {showJoiningDate && (
                <th className="border-b border-[#E5E7EB] p-4 text-left font-semibold text-[#6B7280] text-xs uppercase tracking-wider">
                  Joining Date
                </th>
              )}
              <th className="border-b border-[#E5E7EB] p-4 text-left font-semibold text-[#6B7280] text-xs uppercase tracking-wider">Username</th>
              <th className="border-b border-[#E5E7EB] p-4 text-center font-semibold text-[#6B7280] text-xs uppercase tracking-wider">
                User ID
              </th>
              <th className="border-b border-[#E5E7EB] p-4 text-center font-semibold text-[#6B7280] text-xs uppercase tracking-wider">
                Mobile Number
              </th>
              <th className="border-b border-[#E5E7EB] p-4 text-right font-semibold text-[#6B7280] text-xs uppercase tracking-wider">
                {showJoiningDate ? "Business Volume" : "Invested Amount"}
              </th>
              <th className="border-b border-[#E5E7EB] p-4 text-center font-semibold text-[#6B7280] text-xs uppercase tracking-wider">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F3F4F6]">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={showJoiningDate ? 7 : 6}
                  className="p-8 text-center text-[#9CA3AF]"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((item, index) => {
                const isActive = item.status === "active" || item.isActivated;
                return (
                  <tr key={item._id} className="transition duration-200 hover:bg-[#FFF4E5]">
                    <td className="p-4 text-center text-[#6B7280]">
                      {index + 1}
                    </td>

                    {showJoiningDate && (
                      <td className="p-4 text-[#6B7280]">
                        {formatDate(item.joinedAt || item.createdAt)}
                      </td>
                    )}

                    <td className="p-4 text-left text-[#111827] font-semibold">
                      {item.fullName}
                    </td>

                    <td className="p-4 text-center text-[#6B7280]">
                      {item.memberId}
                    </td>

                    <td className="p-4 text-center text-[#6B7280]">
                      {item.phone || "-"}
                    </td>

                    <td className="p-4 text-right font-medium text-[#111827]">₹0</td>

                    <td className="p-4 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                        isActive
                          ? "border border-[#10B981]/25 bg-emerald-50 text-[#10B981]"
                          : "border border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]"
                      }`}>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })
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
    <div className="p-6 text-[#111827]">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-[#111827]">Level Report</h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B7280]">
          This view shows your team hierarchy level by level, starting from your
          direct downline and extending through deeper generations.
        </p>
      </div>

      {loading ? (
        <p className="mt-6 text-[#9CA3AF]">Loading report...</p>
      ) : error ? (
        <p className="mt-6 text-[#EF4444] font-medium">{error}</p>
      ) : (
        <>
          <div className="mt-8">
            <h2 className="text-xl font-bold text-[#111827]">My Team</h2>
          </div>

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
