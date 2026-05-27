import { useMemo, useState, useEffect } from "react";
import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import Button from "../../components/common/Button";
import { useClipboard } from "../../hooks/useClipboard";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { incomeService } from "../../services/income.service";

function StatCard({ title, value, color = "text-slate-900" }) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <h3 className={`mt-2 text-4xl font-bold ${color}`}>$ {value}</h3>
    </Card>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const referralLink = useMemo(() => {
    // Generate the base URL dynamically based on the current domain
    const baseUrl = typeof window !== "undefined"
      ? `${window.location.origin}/register`
      : "https://bkswealthclub.com/register";

    const mid = user?.memberId || "USER";
    return `${baseUrl}?ref=${mid}`;
  }, [user?.memberId]);
  const { copied, copy } = useClipboard();
  const memberId = user?.memberId || user?.username || "MEMBER";
  const memberStatus = user?.status || "Inactive";

  const [wallet, setWallet] = useState(null);
  const [rebirths, setRebirths] = useState([]);
  const [incomeLogs, setIncomeLogs] = useState([]);

  useEffect(() => {
    incomeService.getMyWallet()
      .then((res) => setWallet(res?.data || null))
      .catch(() => {});
    incomeService.getMyRebirthIds()
      .then((res) => setRebirths(res?.data || []))
      .catch(() => {});
    incomeService.getMyIncomeLogs({ page: 1, limit: 10 })
      .then((res) => setIncomeLogs(res?.data?.logs || []))
      .catch(() => {});
  }, []);

  const w = wallet || {};
  const totalWallet = (w.mainWallet || 0) + (w.fundWallet || 0) + (w.holdingWallet || 0);

  const totalIncome = (w.withdrawableFund || 0);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Member Dashboard"
        subtitle="Welcome to BksWealthClub"
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#E8A13F] font-semibold">
                Profile Snapshot
              </p>
              <h2 className="mt-2 text-4xl font-bold text-slate-900">{memberId}</h2>
              <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white uppercase ${
                memberStatus === "active" ? "bg-emerald-500" : "bg-amber-500"
              }`}>
                {user?.activationStatus ? user.activationStatus.replace("_", " ") : memberStatus}
              </p>
              
              {user?.activationStatus === "PENDING_DEPOSIT" && (
                <div className="mt-4 rounded-xl border border-[#F4B860]/40 bg-[#FFF4E5] px-4 py-3 text-sm text-[#9A6A1F] shadow-inner">
                  <span className="font-bold">Notice:</span> Email verified. Please complete your deposit to activate your account and start earning.
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => navigate("/member/account")}>
                  Edit Profile
                </Button>
                <Button
                  variant="muted"
                  onClick={() => navigate("/member/deposit")}
                >
                  Deposit
                </Button>
                <Button variant="muted" onClick={() => navigate("/member/aliases") }>
                  Open Alias Page
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-[#F4B860]/30 bg-[#FFF4E5] p-5 text-center">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Total Wallet
              </p>
              <p className="mt-2 text-4xl font-bold text-slate-900">$ {totalWallet.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card
          title="Income Overview"
          className="border border-slate-200 bg-white"
        >
          <p className="text-sm text-slate-500">
            Sponsor + Level + Rebirth Income
          </p>
          <div className="mt-6 grid place-items-center">
            <div className="grid h-32 w-32 place-items-center rounded-full border-2 border-[#E8A13F] text-2xl font-bold text-[#E8A13F] shadow-[0_0_24px_rgba(232,161,63,0.2)]">
              $ {totalIncome.toFixed(2)}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Pool Fund" value={(w.poolFundTotal || 0).toFixed(2)} color="text-blue-600" />
        <StatCard title="ReInvestment Fund" value={(w.reinvestmentFundTotal || 0).toFixed(2)} color="text-[#E8A13F]" />
        <StatCard title="Withdrawal Fund of Autopool" value={(w.autopoolWithdrawableFund || 0).toFixed(2)} color="text-emerald-600" />
        <StatCard title="Direct referral" value={(w.directReferralIncome || 0).toFixed(2)} color="text-[#E8A13F]" />
        <StatCard title="Level Income" value={(w.levelIncome || 0).toFixed(2)} color="text-purple-600" />
      </div>

      {/* ── Rebirth IDs ────────────────────────────────────────────────────── */}
      {rebirths.length > 0 && (
        <Card title="My Rebirth IDs">
          <div className="grid gap-4 sm:grid-cols-2">
            {rebirths.map((rb) => (
              <div
                key={rb._id}
                className="rounded-xl border border-slate-200 bg-[#FFF9F5] p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold text-[#E8A13F]">
                    {rb.rebirthCode}
                  </span>
                  <span className="rounded-full bg-[#FFF4E5] border border-[#F4B860]/30 px-2 py-0.5 text-xs text-[#9A6A1F] font-semibold">
                    RB{rb.sequenceNo}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Wallet Balance</span>
                  <span className="text-lg font-bold text-emerald-600">
                    ${rb.walletBalance?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Referral Link">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            readOnly
            value={referralLink}
            className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
          />
          <Button onClick={() => copy(referralLink)}>
            {copied ? "Copied" : "Copy Link"}
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="My Wallets">
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Main Wallet</span>
              <span className="font-semibold text-emerald-600">$ {(w.mainWallet || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Fund Wallet</span>
              <span className="font-semibold text-emerald-600">$ {(w.fundWallet || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Holding Wallet</span>
              <span className="font-semibold text-emerald-600">$ {(w.holdingWallet || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-900">Withdrawable Fund</span>
              <span className="text-emerald-600 font-bold">$ {(w.withdrawableFund || 0).toFixed(2)}</span>
            </div>
            {(w.rebirthWallets || []).map((rb) => (
              <div key={rb.rebirthCode} className="flex justify-between">
                <span className="text-[#E8A13F] font-medium">{rb.rebirthCode}</span>
                <span className="font-semibold text-[#E8A13F]">$ {rb.walletBalance?.toFixed(2) || "0.00"}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Withdrawal Data">
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Total Withdrawal</span>
              <span className="font-semibold text-emerald-600">$ 0</span>
            </div>
            <div className="flex justify-between">
              <span>Total Deposit</span>
              <span className="font-semibold text-emerald-600">$ {(w.fundWallet || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Rebirth Balance</span>
              <span className="font-semibold text-[#E8A13F]">$ {(w.totalRebirthBalance || 0).toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Recent Income History ─────────────────────────────────────────── */}
      {incomeLogs.length > 0 && (
        <Card title="Recent Income History">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr>
                  {["Date", "Type", "Amount", "Remarks"].map((h) => (
                    <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomeLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2 text-xs text-slate-400">{formatDate(log.createdAt)}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{log.type?.replace(/_/g, " ")}</td>
                    <td className="px-3 py-2 text-sm font-semibold text-emerald-600">${log.amount}</td>
                    <td className="px-3 py-2 text-xs text-slate-400 max-w-[180px] truncate">{log.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-center">
            <button
              onClick={() => navigate("/member/income/wallet")}
              className="text-xs font-medium text-[#E8A13F] hover:text-[#C8861F] transition"
            >
              View All Income History →
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
