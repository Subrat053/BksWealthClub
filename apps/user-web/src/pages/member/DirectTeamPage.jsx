import { useEffect, useMemo, useState } from "react";
import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import SectionTitle from "../../components/common/SectionTitle";
import Button from "../../components/common/Button";
import { apiClient } from "../../services/apiClient";

const directTeamColumns = [
  { key: "serial", label: "S No." },
  { key: "username", label: "Username" },
  { key: "userId", label: "User ID" },
  { key: "mobileNumber", label: "Mobile Number" },
  { key: "investedAmount", label: "Invested Amount" },
  { key: "status", label: "Status" },
];

export default function DirectTeamPage() {
  const [directs, setDirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDirects();
  }, []);

  const loadDirects = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await apiClient("/referrals/my-referrals");
      const rows = (res.data || []).map((item, index) => ({
        serial: index + 1,
        username: item.fullName || "-",
        userId: item.memberId || "-",
        mobileNumber: item.phone || "-",
        investedAmount: "₹0",
        status:
          item.status === "active" || item.isActivated ? "Active" : "Inactive",
      }));

      setDirects(rows);
    } catch (err) {
      setError(err.message || "Failed to load direct referrals.");
    } finally {
      setLoading(false);
    }
  };

  const directCount = useMemo(() => directs.length, [directs]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Direct Team"
        subtitle={`Live direct referrals from your sponsor tree (${directCount})`}
      />
      <Card title="Filter">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            className="h-12 rounded-xl border border-white/10 bg-[#2d3440] px-4 text-sm text-white outline-none focus:border-cyan-300/70"
            placeholder="Name"
          />
          <input
            className="h-12 rounded-xl border border-white/10 bg-[#2d3440] px-4 text-sm text-white outline-none focus:border-cyan-300/70"
            placeholder="Username"
          />
          <select className="h-12 rounded-xl border border-white/10 bg-[#2d3440] px-4 text-sm text-white outline-none focus:border-cyan-300/70">
            <option>Select Status</option>
          </select>
          <Button className="w-full">Search</Button>
        </div>
      </Card>
      <Card>
        {loading ? (
          <p className="p-4 text-slate-300">Loading direct referrals...</p>
        ) : error ? (
          <p className="p-4 text-red-300">{error}</p>
        ) : (
          <DataTable
            columns={directTeamColumns}
            rows={directs}
            emptyText="No Direct Referrals Found"
          />
        )}
      </Card>
    </div>
  );
}
