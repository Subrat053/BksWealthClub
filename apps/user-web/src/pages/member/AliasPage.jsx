import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, RefreshCw } from "lucide-react";
import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import { autopoolService } from "../../services/autopool.service";
import AliasDetails from "./AliasDetails";

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

function SkeletonCard() {
  return <div className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />;
}

export default function AliasPage() {
  const navigate = useNavigate();
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [aliases, setAliases] = useState([]);
  const [selectedAliasId, setSelectedAliasId] = useState("");
  const [aliasDetails, setAliasDetails] = useState(null);
  const [aliasTree, setAliasTree] = useState([]);

  const selectedAlias = useMemo(
    () => aliases.find((alias) => (alias.aliasMemberId || alias.aliasId) === selectedAliasId) || null,
    [aliases, selectedAliasId],
  );

  const loadAliases = async () => {
    setLoadingList(true);
    try {
      const response = await autopoolService.getMyAliases();
      const aliasList = Array.isArray(response) ? response : response?.aliases || [];
      setAliases(aliasList);
      setSelectedAliasId((current) => current || aliasList[0]?.aliasMemberId || aliasList[0]?.aliasId || "");
    } catch (error) {
      console.error("Failed to load aliases:", error);
      setAliases([]);
    } finally {
      setLoadingList(false);
    }
  };

  const loadAliasDetails = async (aliasMemberId) => {
    if (!aliasMemberId) return;
    setLoadingDetails(true);
    try {
      const [autopoolRes, treeRes] = await Promise.all([
        autopoolService.getAliasStatus(aliasMemberId),
        autopoolService.getAliasTree(aliasMemberId, 4),
      ]);

      setAliasDetails(autopoolRes || null);
      setAliasTree(treeRes?.tree || []);
    } catch (error) {
      console.error("Failed to load alias details:", error);
      setAliasDetails(null);
      setAliasTree([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadAliases();
  }, []);

  useEffect(() => {
    if (!selectedAliasId) return;
    loadAliasDetails(selectedAliasId);
  }, [selectedAliasId]);

  const aliasSummary = useMemo(() => {
    return {
      total: aliases.length,
      active: aliases.filter((alias) => (alias.status || "ACTIVE").toUpperCase() === "ACTIVE").length,
      completed: aliases.filter((alias) => (alias.status || "").toUpperCase() === "COMPLETED").length,
      withdrawable: aliases.reduce((sum, alias) => sum + Number(alias.withdrawableAutopoolFund || 0), 0),
    };
  }, [aliases]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionTitle
          title="Alias / Upgrade IDs"
          subtitle="Dedicated autopool identities owned by your main account."
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={loadAliases}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate("/member/team/autopool")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#F4B860]/30 bg-[#FFF4E5] px-4 py-2.5 text-sm font-semibold text-[#9A6A1F] transition hover:bg-[#FFE8C0]"
          >
            <ChevronLeft size={16} /> Back to My Autopool
          </button>
        </div>
      </div>

      {loadingList ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : aliases.length === 0 ? (
        <Card className="border border-slate-200 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">No alias/upgrade IDs created yet.</p>
          <p className="mt-2 text-sm text-slate-500">
            When an alias is created, it will appear here with its own autopool summary.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border border-slate-200 bg-white">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Aliases</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{aliasSummary.total}</p>
            </Card>
            <Card className="border border-slate-200 bg-white">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active</p>
              <p className="mt-2 text-3xl font-black text-[#E8A13F]">{aliasSummary.active}</p>
            </Card>
            <Card className="border border-slate-200 bg-white">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completed</p>
              <p className="mt-2 text-3xl font-black text-emerald-600">{aliasSummary.completed}</p>
            </Card>
            <Card className="border border-[#F4B860]/30 bg-[#FFF4E5]">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Withdrawable Fund</p>
              <p className="mt-2 text-3xl font-black text-[#E8A13F]">$ {aliasSummary.withdrawable.toFixed(2)}</p>
            </Card>
          </div>

          <Card className="border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Select Alias</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Each alias is a separate member identity with its own rebirth queue.
                </p>
              </div>
              <div className="w-full max-w-md">
                <div className="relative">
                  <select
                    value={selectedAliasId}
                    onChange={(e) => setSelectedAliasId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none focus:border-[#E8A13F] focus:ring-2 focus:ring-[#E8A13F]/20"
                  >
                    {aliases.map((alias) => {
                      const aliasMemberId = alias.aliasMemberId || alias.aliasId;
                      return (
                        <option key={alias._id || aliasMemberId} value={aliasMemberId}>
                          {aliasMemberId} - Level {alias.createdFromAutopoolLevel ?? 0}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {aliases.map((alias) => {
                const aliasMemberId = alias.aliasMemberId || alias.aliasId;
                const isSelected = aliasMemberId === selectedAliasId;
                return (
                  <button
                    key={alias._id || aliasMemberId}
                    type="button"
                    onClick={() => setSelectedAliasId(aliasMemberId)}
                    className={`rounded-2xl border p-4 text-left transition ${isSelected ? "border-[#F4B860]/40 bg-[#FFF4E5]" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-lg font-bold text-slate-900">{aliasMemberId}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                          Original/Main: {alias.originalMainUserId || "-"}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#F4B860]/40 bg-[#FFF4E5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#9A6A1F]">
                        {String(alias.status || "ACTIVE").toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      <p className="text-xs text-slate-400">Sponsor: <span className="text-slate-200">{alias.sponsorId || "-"}</span></p>
                      <p className="text-xs text-slate-400">Level: <span className="text-slate-200">{alias.createdFromAutopoolLevel ?? 0}</span></p>
                      <p className="text-xs text-slate-400">Created: <span className="text-slate-200">{formatDate(alias.createdAt)}</span></p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {selectedAlias && loadingDetails ? (
            <div className="grid gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : selectedAlias ? (
            <AliasDetails
              alias={selectedAlias}
              details={aliasDetails}
              tree={aliasTree}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}