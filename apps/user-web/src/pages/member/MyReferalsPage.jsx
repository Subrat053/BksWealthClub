import { useEffect, useState } from "react";
import { apiClient } from "../../services/apiClient";

export default function MyReferralsPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await apiClient("/referrals/my-referrals");
      setData(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="p-6 text-[#111827]">
      <h1 className="text-2xl font-bold mb-6 text-[#111827]">My Referrals</h1>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wider text-[#6B7280]">
            <tr>
              <th className="p-4 font-semibold">Member ID</th>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Email</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F3F4F6]">
            {data.map((u) => (
              <tr key={u._id} className="transition hover:bg-[#FFF4E5] group">
                <td className="p-4 text-[#111827] font-medium">{u.memberId}</td>
                <td className="p-4 text-[#6B7280]">{u.fullName}</td>
                <td className="p-4 text-[#6B7280]">{u.email}</td>
                <td className="p-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${
                    u.status === "active"
                      ? "border border-[#10B981]/20 bg-[#10B981]/10 text-[#10B981]"
                      : "border border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#F59E0B]"
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-4 text-[#6B7280]">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
