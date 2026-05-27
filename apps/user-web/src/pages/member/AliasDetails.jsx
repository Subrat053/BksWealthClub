import Card from "../../components/common/Card";
import AliasAutopoolSummaryCards from "./AliasAutopoolSummaryCards";
import AliasLevelWiseStatus from "./AliasLevelWiseStatus";
import AliasRebirthTable from "./AliasRebirthTable";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function AliasDetails({ alias, details, tree = [] }) {
  if (!alias) return null;

  const summary = details?.summary || details?.aliasSummary || alias;
  const fundSummary = details?.fundSummary || details?.fund || null;
  const levelWiseStatus = details?.levelWiseStatus || [];
  const rebirths = details?.rebirths || [];
  const originalMainUser = details?.originalMainUser || null;

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#E8A13F] font-bold">Alias Details</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">{alias.aliasMemberId}</h2>
            <p className="mt-2 text-sm text-slate-500">
              Independent alias identity owned by the logged-in main account.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-500">Main User</span>
              <span className="font-mono text-[#E8A13F] font-semibold">{originalMainUser?.memberId || alias.originalMainUserId || "-"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-6">
              <span className="text-slate-500">Created</span>
              <span className="text-slate-700">{formatDate(alias.createdAt)}</span>
            </div>
          </div>
        </div>
      </Card>

      <AliasAutopoolSummaryCards alias={alias} summary={summary} />

      <div className="grid gap-6 xl:grid-cols-2">
        <AliasLevelWiseStatus levelWiseStatus={levelWiseStatus} />
        <Card className="border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-bold text-slate-900">Alias Fund Summary</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pool Fund</p>
              <p className="mt-2 text-lg font-bold text-blue-600">{formatCurrency(fundSummary?.poolFundTotal ?? alias.poolFundTotal ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reinvestment Fund</p>
              <p className="mt-2 text-lg font-bold text-[#E8A13F]">{formatCurrency(fundSummary?.reinvestmentFundTotal ?? alias.reinvestmentFundTotal ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Withdrawable Autopool Fund</p>
              <p className="mt-2 text-lg font-bold text-emerald-600">{formatCurrency(fundSummary?.withdrawableAutopoolFund ?? alias.withdrawableAutopoolFund ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Upgrade Deduction Status</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{(alias.status || "ACTIVE").toUpperCase()}</p>
            </div>
          </div>
        </Card>
      </div>

      <AliasRebirthTable rebirths={rebirths} />

      <Card className="border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Optional Subtree Visualizer</h3>
            <p className="mt-1 text-sm text-slate-500">
              This preview shows the first few alias-owned placement nodes only.
            </p>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Depth preview</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(tree || []).slice(0, 8).map((node) => (
            <div key={node._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-mono text-sm font-bold text-[#E8A13F]">{node.poolNodeId || node.nodeCode}</p>
              <p className="mt-2 text-xs text-slate-500">Parent: {node.parentPoolNodeId?.poolNodeId || node.parentPoolNodeId?.nodeCode || "ROOT"}</p>
              <p className="mt-1 text-xs text-slate-500">Children: {node.autopoolChildrenCount ?? 0}</p>
              <p className="mt-1 text-xs text-slate-500">Status: {node.status}</p>
              <p className="mt-1 text-xs text-slate-500">Q-Serial: {node.queueSerialNo || "N/A"}</p>
            </div>
          ))}
          {(tree || []).length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400 md:col-span-2 xl:col-span-4">
              No subtree data available for this alias.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}