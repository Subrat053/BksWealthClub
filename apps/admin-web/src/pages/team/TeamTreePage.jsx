import { useEffect, useMemo, useState } from "react";
import { referralService } from "../../services/referal.service.js";

function countTotal(node) {
  if (!node?.children?.length) return 0;
  return node.children.reduce((sum, child) => sum + 1 + countTotal(child), 0);
}

function countActive(node) {
  if (!node?.children?.length) return 0;
  return node.children.reduce((sum, child) => {
    const active = child.status === "active" || child.isActivated;
    return sum + (active ? 1 : 0) + countActive(child);
  }, 0);
}

function TreeNode({ node }) {
  const hasChildren = node.children?.length > 0;
  const isRoot = !node.level;

  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`relative min-w-[190px] rounded-[22px] border px-5 py-4 text-center shadow-[0_20px_45px_rgba(0,0,0,0.35)] ${
          isRoot
            ? "border-cyan-300/40 bg-[linear-gradient(145deg,#133c8f,#081b4d)]"
            : "border-white/10 bg-[linear-gradient(145deg,#0b225f,#07163e)]"
        }`}
      >
        <div className="absolute inset-0 rounded-[22px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%)]" />

        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-100/70">
            {isRoot ? "Root User" : `Level ${node.level}`}
          </p>

          <h3 className="mt-2 text-lg font-extrabold text-white">
            {node.memberId || "N/A"}
          </h3>

          <p className="mt-1 text-xs font-medium text-blue-100/75">
            {node.fullName || "No Name"}
          </p>

          {!isRoot && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  node.status === "active" || node.isActivated
                    ? "bg-emerald-300"
                    : "bg-amber-300"
                }`}
              />
              <span className="text-xs font-semibold capitalize text-blue-100/80">
                {node.status || "pending"}
              </span>
            </div>
          )}

          {hasChildren && (
            <p className="mt-2 text-[11px] text-cyan-100/65">
              {node.children.length} direct downline
            </p>
          )}
        </div>
      </div>

      {hasChildren && (
        <>
          <div className="h-8 w-px bg-cyan-300/30" />

          <div className="relative flex gap-6 overflow-x-auto px-4 pb-4">
            <div className="absolute left-8 right-8 top-0 h-px bg-cyan-300/30" />

            {node.children.map((child) => (
              <div key={child._id} className="relative pt-8">
                <div className="absolute left-1/2 top-0 h-8 w-px -translate-x-1/2 bg-cyan-300/30" />
                <TreeNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function TeamTreePage() {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalReferrals = useMemo(() => countTotal(tree), [tree]);
  const activeMembers = useMemo(() => countActive(tree), [tree]);
  const directMembers = tree?.children?.length || 0;

  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await referralService.getAdminReferralTree();
      setTree(data?.data?.root || null);
    } catch (err) {
      setError(err.message || "Failed to load referral tree");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_left,#173c91_0%,#07122d_42%,#040817_100%)] p-6 text-white">
      <div className="rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-200/70">
              Network Genealogy
            </p>
            <h1 className="mt-2 text-3xl font-black">Referral Tree</h1>
            <p className="mt-2 text-sm text-blue-100/70">
              View users referred under admin and their downline structure.
            </p>
          </div>

          <button
            onClick={loadTree}
            className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-100 shadow-lg hover:bg-cyan-400/20"
          >
            Refresh Tree
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-white/10 bg-[#0c1f57]/80 p-5 shadow-xl">
          <p className="text-sm text-blue-100/65">Total Referrals</p>
          <h2 className="mt-2 text-3xl font-black">{totalReferrals}</h2>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[#0c1f57]/80 p-5 shadow-xl">
          <p className="text-sm text-blue-100/65">Active Members</p>
          <h2 className="mt-2 text-3xl font-black">{activeMembers}</h2>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[#0c1f57]/80 p-5 shadow-xl">
          <p className="text-sm text-blue-100/65">Direct Referrals</p>
          <h2 className="mt-2 text-3xl font-black">{directMembers}</h2>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-[30px] border border-white/10 bg-[#061333]/85 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold">Tree Visualization</h2>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-200">
            Live Data
          </span>
        </div>

        <div className="overflow-x-auto rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,#0b1d52,#07122d)] p-8">
          {loading ? (
            <p className="text-blue-100/70">Loading referral tree...</p>
          ) : tree ? (
            <div className="min-w-max">
              <TreeNode node={tree} />
            </div>
          ) : (
            <p className="text-blue-100/70">No referral data found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
