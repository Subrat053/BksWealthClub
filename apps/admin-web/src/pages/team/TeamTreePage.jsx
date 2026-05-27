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
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? 'bg-emerald-50 text-[#10B981] border border-[#10B981]/25' : 'bg-amber-50 text-[#F59E0B] border border-[#F59E0B]/25'}`}>
              <User size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111827]">{node.fullName || "Anonymous Member"}</h4>
              <p className="text-[10px] font-mono text-[#6B7280]">{node.memberId}</p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold">Status</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`text-[11px] font-bold capitalize ${isActive ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                  {node.status || "Pending"}
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold">Level</p>
              <p className="mt-1 text-[11px] font-bold text-[#3B82F6]">Level {node.level || 0}</p>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold">Directs</p>
              <p className="mt-1 text-[11px] font-bold text-[#111827]">{node.children?.length || 0} Members</p>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold">Total Team</p>
              <p className="mt-1 text-[11px] font-bold text-[#111827]">{totalDownline} Members</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-[#10B981]/20 px-3 py-1.5">
            <Users size={12} className="text-[#10B981]" />
            <span className="text-[10px] text-[#10B981] font-semibold">
              <strong className="text-[#10B981]">{activeDownline}</strong> active in team
            </span>
          </div>
        </div>
        {/* Arrow */}
        <div className="mx-auto h-2 w-4 bg-white [clip-path:polygon(0_0,100%_0,50%_100%)] border-x border-[#E5E7EB]" />
      </div>

      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative min-w-[200px] cursor-pointer rounded-2xl border px-5 py-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-md ${
          isRoot
            ? "border-[#F4B860] bg-[#FFF4E5] shadow-sm"
            : "border-[#E5E7EB] bg-white shadow-sm"
        }`}
      >
        <div className="relative">
          <h3 className="text-sm font-bold tracking-tight text-[#111827] group-hover:text-[#F4B860] transition-colors duration-200">
            {node.memberId}
          </h3>
        </div>
      </div>

      {hasChildren && (
        <>
          <div className="h-10 w-px bg-[#F4B860]/40" />

          <div className="relative flex gap-8 px-4 pb-8">
            <div className="absolute left-10 right-10 top-0 h-px bg-[#F4B860]/40" />

            {node.children.map((child) => (
              <div key={child._id} className="relative pt-10">
                <div className="absolute left-1/2 top-0 h-10 w-px -translate-x-1/2 bg-[#F4B860]/40" />
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
    <div className="space-y-6 text-[#111827]">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#6B7280]">
              Network Genealogy
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[#111827]">Referral Tree</h1>
            <p className="mt-2 text-sm text-[#6B7280]">
              View users referred under admin and their downline structure.
            </p>
          </div>

          <button
            onClick={loadTree}
            className="rounded-xl border border-[#E5E7EB] bg-[#111827] text-white hover:bg-[#1F2937] px-5 py-3 text-sm font-semibold shadow-sm transition-all duration-300 active:scale-[0.98] hover:scale-[1.01]"
          >
            Refresh Tree
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-sm font-medium text-[#6B7280]">Total Referrals</p>
          <h2 className="mt-2 text-3xl font-bold text-[#111827]">{totalReferrals}</h2>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-sm font-medium text-[#6B7280]">Active Members</p>
          <h2 className="mt-2 text-3xl font-bold text-[#111827]">{activeMembers}</h2>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <p className="text-sm font-medium text-[#6B7280]">Direct Referrals</p>
          <h2 className="mt-2 text-3xl font-bold text-[#111827]">{directMembers}</h2>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-[#EF4444]/25 bg-red-50 p-4 text-sm text-[#EF4444] font-medium">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#111827]">Tree Visualization</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#F8FAFC] px-1.5 py-1.5 rounded-xl border border-[#E5E7EB] shadow-sm">
              <button
                onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))}
                className="w-7 h-7 rounded-lg hover:bg-[#FFF4E5] flex items-center justify-center text-[#111827] font-bold transition-all cursor-pointer"
                title="Zoom Out"
              >
                —
              </button>
              <span className="text-[10px] font-bold text-[#F4B860] min-w-[36px] text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
                className="w-7 h-7 rounded-lg hover:bg-[#FFF4E5] flex items-center justify-center text-[#111827] font-bold transition-all cursor-pointer"
                title="Zoom In"
              >
                ＋
              </button>
              <div className="w-px h-4 bg-[#E5E7EB] mx-1" />
              <button
                onClick={() => setZoom(1)}
                className="px-2 py-1 text-[9px] font-bold text-[#6B7280] hover:text-[#111827] hover:bg-[#FFF4E5] rounded-lg transition-all cursor-pointer"
                title="Reset Zoom"
              >
                RESET
              </button>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-[#10B981]">
              Live Data
            </span>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="overflow-auto max-h-[calc(100vh-250px)] rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-8 pt-48 relative shadow-inner"
        >
          {loading ? (
            <p className="text-[#9CA3AF] text-center py-12">Loading referral tree...</p>
          ) : tree ? (
            <div 
              className="min-w-max pb-12 flex justify-center"
              style={{ zoom: zoom }}
            >
              <TreeNode node={tree} />
            </div>
          ) : (
            <p className="text-[#9CA3AF] text-center py-12">No referral data found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
