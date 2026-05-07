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
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">My Referrals</h1>

      <div className="bg-[#07122d] rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-[#0b1d52]">
            <tr>
              <th className="p-3">Member ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {data.map((u) => (
              <tr key={u._id} className="border-t border-white/10">
                <td className="p-3">{u.memberId}</td>
                <td className="p-3">{u.fullName}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.status}</td>
                <td className="p-3">
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
