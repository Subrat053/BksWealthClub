import { useMemo } from "react";
import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import Button from "../../components/common/Button";
import { useClipboard } from "../../hooks/useClipboard";
import { useAuth } from "../../hooks/useAuth";

function StatCard({ title, value }) {
  return (
    <Card className="bg-[linear-gradient(170deg,rgba(15,33,88,0.92),rgba(10,24,67,0.95))]">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{title}</p>
      <h3 className="mt-2 text-4xl font-bold text-white">$ {value}</h3>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const referralLink = useMemo(() => "https://bkswealthclub.com/register?ref=GRW328370", []);
  const { copied, copy } = useClipboard();
  const memberId = user?.memberId || user?.username || "MEMBER";
  const memberStatus = user?.status || "Inactive";

  return (
    <div className="space-y-6">
      <SectionTitle title="Member Dashboard" subtitle="Welcome to BksWealthClub" />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Profile Snapshot</p>
              <h2 className="mt-2 text-4xl font-bold text-white">{memberId}</h2>
              <p className="mt-2 inline-flex rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white">{memberStatus}</p>
              <div className="mt-5 flex gap-2">
                <Button>Edit Profile</Button>
                <Button variant="muted">Deposit</Button>
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-center">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-200">Current Wallet</p>
              <p className="mt-2 text-4xl font-bold">$ 0</p>
            </div>
          </div>
        </Card>

        <Card title="Income Overview" className="bg-[linear-gradient(170deg,rgba(14,29,80,0.9),rgba(9,21,59,0.95))]">
          <p className="text-sm text-slate-300">Sponsor + Representative + Passive</p>
          <div className="mt-6 grid place-items-center">
            <div className="grid h-32 w-32 place-items-center rounded-full border-2 border-cyan-300 text-2xl font-bold shadow-[0_0_24px_rgba(56,189,248,0.35)]">$ 0</div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <StatCard title="Sponsor Income" value="0" />
        <StatCard title="Representative Income" value="0" />
        <StatCard title="Total Income" value="0" />
      </div>

      <Card title="Referral Link">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            readOnly
            value={referralLink}
            className="h-12 flex-1 rounded-xl border border-cyan-300/35 bg-[#3048a6] px-4 text-sm text-white outline-none"
          />
          <Button onClick={() => copy(referralLink)}>{copied ? "Copied" : "Copy Link"}</Button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="My Wallets">
          <div className="space-y-3 text-sm text-white">
            <div className="flex justify-between"><span>Main Wallet</span><span className="text-green-400">$ 0</span></div>
            <div className="flex justify-between"><span>Fund Wallet</span><span className="text-green-400">$ 0</span></div>
            <div className="flex justify-between"><span>Holding Wallet</span><span className="text-green-400">$ 0</span></div>
          </div>
        </Card>
        <Card title="Withdrawal Data">
          <div className="space-y-3 text-sm text-white">
            <div className="flex justify-between"><span>Total Withdrawal</span><span className="text-green-400">$ 0</span></div>
            <div className="flex justify-between"><span>Total Deposit</span><span className="text-green-400">$ 0</span></div>
            <div className="flex justify-between"><span>Total Directs</span><span className="text-green-400">0</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
