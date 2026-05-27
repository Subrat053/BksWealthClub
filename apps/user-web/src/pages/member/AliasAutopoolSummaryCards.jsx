const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function SummaryCard({ label, value, accent = "text-slate-900", mono = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className={`mt-2 text-sm font-bold ${accent} ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

export default function AliasAutopoolSummaryCards({ alias, summary }) {
  if (!alias && !summary) return null;

  const resolved = summary || {};

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Alias Member ID"
        value={resolved.aliasMemberId || alias?.aliasMemberId || "-"}
        accent="text-[#E8A13F]"
        mono
      />
      <SummaryCard
        label="Original / Main User ID"
        value={resolved.originalMainUserId || alias?.originalMainUserId || "-"}
        accent="text-slate-900"
        mono
      />
      <SummaryCard
        label="Sponsor ID"
        value={resolved.sponsorId || alias?.sponsorId || "-"}
        accent="text-[#E8A13F]"
        mono
      />
      <SummaryCard
        label="Created From Autopool Level"
        value={resolved.createdFromAutopoolLevel ?? alias?.createdFromAutopoolLevel ?? "-"}
        accent="text-slate-700"
      />
      <SummaryCard
        label="Created Date"
        value={resolved.createdAt || alias?.createdAt ? new Date(resolved.createdAt || alias?.createdAt).toLocaleString("en-IN") : "-"}
      />
      <SummaryCard
        label="Auto Deposit Amount"
        value={formatCurrency(resolved.autoDepositAmount ?? alias?.autoDepositAmount ?? 75)}
        accent="text-emerald-600"
      />
      <SummaryCard
        label="Current Active Level"
        value={resolved.activeLevel ?? 0}
        accent="text-[#E8A13F]"
      />
      <SummaryCard
        label="Latest Completed Level"
        value={resolved.latestCompletedLevel ?? 0}
        accent="text-emerald-600"
      />
      <SummaryCard
        label="Total Rebirths"
        value={resolved.totalRebirths ?? 0}
        accent="text-slate-700"
      />
      <SummaryCard
        label="Completed Rebirths"
        value={resolved.completedRebirths ?? 0}
        accent="text-emerald-600"
      />
      <SummaryCard
        label="Pending Rebirths"
        value={resolved.pendingRebirths ?? 0}
        accent="text-[#E8A13F]"
      />
      <SummaryCard
        label="Status"
        value={(resolved.status || alias?.status || "ACTIVE").toUpperCase()}
        accent="text-[#E8A13F]"
      />
      <SummaryCard
        label="Pool Fund"
        value={formatCurrency(resolved.poolFundTotal ?? 0)}
        accent="text-blue-600"
      />
      <SummaryCard
        label="Reinvestment Fund"
        value={formatCurrency(resolved.reinvestmentFundTotal ?? 0)}
        accent="text-[#E8A13F]"
      />
      <SummaryCard
        label="Autopool Withdrawable Fund"
        value={formatCurrency(resolved.withdrawableAutopoolFund ?? 0)}
        accent="text-emerald-600"
      />
      <SummaryCard
        label="Upgrade Deduction Status"
        value={resolved.status || alias?.status || "ACTIVE"}
        accent="text-slate-700"
      />
    </div>
  );
}