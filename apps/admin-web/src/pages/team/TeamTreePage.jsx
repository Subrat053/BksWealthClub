import { useEffect, useMemo, useState, useRef } from "react";
import { User, Users, CheckCircle2, XCircle, Calendar, ChevronRight, Info } from "lucide-react";
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
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = node.children?.length > 0;
  const isRoot = !node.level;
  const totalDownline = useMemo(() => countTotal(node), [node]);
  const activeDownline = useMemo(() => countActive(node), [node]);

  const isActive = node.status === "active" || node.isActivated;

  return (
    <div className="relative flex flex-col items-center">
      {/* Detail Card (Shown on Hover) */}
      <div 
        className={`absolute bottom-full left-1/2 mb-4 w-72 -translate-x-1/2 transition-all duration-300 ${
          isHovered ? "visible opacity-100 translate-y-0 scale-100" : "invisible opacity-0 translate-y-4 scale-95"
        } pointer-events-none z-50`}
      >
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-[#0a1b4d]/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <User size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{node.fullName || "Anonymous Member"}</h4>
              <p className="text-[10px] font-mono text-blue-200/60">{node.memberId}</p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-blue-200/50">Status</p>
              <div className="mt-1 flex items-center gap-1.5">
                {isActive ? (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                ) : (
                  <XCircle size={12} className="text-amber-400" />
                )}
                <span className={`text-[11px] font-bold capitalize ${isActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {node.status || "Pending"}
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-blue-200/50">Level</p>
              <p className="mt-1 text-[11px] font-bold text-cyan-400">Level {node.level || 0}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-blue-200/50">Directs</p>
              <p className="mt-1 text-[11px] font-bold text-white">{node.children?.length || 0} Members</p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-blue-200/50">Total Team</p>
              <p className="mt-1 text-[11px] font-bold text-white">{totalDownline} Members</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5">
            <Users size={12} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-200/80">
              <strong className="text-emerald-400">{activeDownline}</strong> active in team
            </span>
          </div>
        </div>
        {/* Arrow */}
        <div className="mx-auto h-2 w-4 bg-[#0a1b4d]/95 [clip-path:polygon(0_0,100%_0,50%_100%)] border-x border-white/10" />
      </div>

      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative min-w-[200px] cursor-pointer rounded-[22px] border px-5 py-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/20 ${
          isRoot
            ? "border-cyan-300/40 bg-[linear-gradient(145deg,#133c8f,#081b4d)] shadow-[0_20px_45px_rgba(6,182,212,0.15)]"
            : "border-white/10 bg-[linear-gradient(145deg,#0b225f,#07163e)] shadow-[0_20px_45px_rgba(0,0,0,0.35)]"
        }`}
      >
        <div className="absolute inset-0 rounded-[22px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%)] opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="relative">
          {/* <div className="mb-2 flex items-center justify-center gap-2">
            <span className={`h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${isActive ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-amber-400 shadow-amber-400/50'}`} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100/60">
              {isRoot ? "Root Admin" : `Level ${node.level}`}
            </p>
          </div> */}

          <h3 className="text-sm font-black tracking-tight text-white group-hover:text-cyan-200">
            {node.memberId}
          </h3>

          {/* <p className="mt-1 text-xs font-medium text-blue-100/70 truncate max-w-[160px] mx-auto">
            {node.fullName || "—"}
          </p> */}

          {/* <div className="mt-3 flex items-center justify-center gap-3 border-t border-white/5 pt-3">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-blue-200/40">Direct</span>
              <span className="text-[11px] font-bold text-white">{node.children?.length || 0}</span>
            </div>
            <div className="h-6 w-px bg-white/5" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-blue-200/40">Total</span>
              <span className="text-[11px] font-bold text-cyan-400">{totalDownline}</span>
            </div>
          </div> */}
        </div>
      </div>

      {hasChildren && (
        <>
          <div className="h-10 w-px bg-cyan-300/20" />

          <div className="relative flex gap-8 px-4 pb-8">
            <div className="absolute left-10 right-10 top-0 h-px bg-cyan-300/20" />

            {node.children.map((child) => (
              <div key={child._id} className="relative pt-10">
                <div className="absolute left-1/2 top-0 h-10 w-px -translate-x-1/2 bg-cyan-300/20" />
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
  const [zoom, setZoom] = useState(1);
  const scrollContainerRef = useRef(null);

  const totalReferrals = useMemo(() => countTotal(tree), [tree]);
  const activeMembers = useMemo(() => countActive(tree), [tree]);
  const directMembers = tree?.children?.length || 0;

  useEffect(() => {
    loadTree();
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Allow zooming only when Ctrl or Cmd is pressed
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomChange = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prevZoom) => Math.min(Math.max(0.1, prevZoom + zoomChange), 2));
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/5 px-1.5 py-1.5 rounded-lg border border-white/10 shadow-sm">
              <button
                onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))}
                className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-blue-200 font-bold transition-all cursor-pointer"
                title="Zoom Out"
              >
                —
              </button>
              <span className="text-[10px] font-bold text-cyan-400 min-w-[36px] text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
                className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-blue-200 font-bold transition-all cursor-pointer"
                title="Zoom In"
              >
                ＋
              </button>
              <div className="w-px h-4 bg-white/20 mx-1" />
              <button
                onClick={() => setZoom(1)}
                className="px-2 py-1 text-[9px] font-bold text-cyan-400 hover:bg-white/10 rounded transition-all cursor-pointer"
                title="Reset Zoom"
              >
                RESET
              </button>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-200">
              Live Data
            </span>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="overflow-auto max-h-[calc(100vh-250px)] rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,#0b1d52,#07122d)] p-8 pt-48 relative"
        >
          {loading ? (
            <p className="text-blue-100/70">Loading referral tree...</p>
          ) : tree ? (
            <div 
              className="min-w-max pb-12 flex justify-center"
              style={{ zoom: zoom }}
            >
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
