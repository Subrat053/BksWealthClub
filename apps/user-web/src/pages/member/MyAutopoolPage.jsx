import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { autopoolService } from "../../services/autopool.service";
import { incomeService } from "../../services/income.service";
import Card from "../../components/common/Card";
import SectionTitle from "../../components/common/SectionTitle";
import {
  Award,
  ChevronDown,
  ChevronUp,
  User,
  Wallet,
  Network,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  HelpCircle,
  X,
  Coins,
  CreditCard,
  BadgeIndianRupee
} from "lucide-react";

// Local TreeNode component for individual subtree rendering in glassmorphic dark theme
const TreeCanvasNode = ({ node, childrenMap, depth = 0 }) => {
  const children = childrenMap.get(node._id.toString()) || [];

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        className={`group relative p-5 rounded-2xl border transition-all duration-300 hover:scale-105 ${
          node.status === "COMPLETED"
            ? "border-emerald-500/30 bg-emerald-500/10 shadow-[0_8px_32px_rgba(16,185,129,0.15)] text-white"
            : "border-white/10 bg-white/5 text-white shadow-lg"
        } min-w-52 text-center z-20 hover:shadow-2xl hover:border-cyan-400/50`}
      >
        {/* Connection Dot - Top */}
        {depth > 0 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-white/20 z-30" />
        )}

        {/* Badge */}
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
            node.parentPoolNodeId
              ? "bg-indigo-600/90 text-white border border-indigo-400/30"
              : "bg-amber-500/90 text-white border border-amber-400/30"
          }`}
        >
          {node.parentPoolNodeId ? `LEVEL ${node.levelNumber || depth}` : "ROOT NODE"}
        </div>

        {/* Content */}
        <div className="mt-2 space-y-1">
          <h4 className="font-black text-white text-lg leading-tight tracking-tight">
            {node.poolNodeId || node.nodeCode}
          </h4>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] text-cyan-300 font-bold border border-cyan-500/30">
              {node.linkedRebirthNodeId?.ownerUserId?.fullName?.charAt(0) || "M"}
            </div>
            <p className="text-[11px] text-slate-200 font-semibold truncate max-w-28">
              {node.linkedRebirthNodeId?.ownerUserId?.fullName || "Member"}
            </p>
          </div>
          <p className="text-[9px] text-cyan-300 font-mono mt-1 font-bold bg-cyan-500/10 inline-block px-2 py-0.5 rounded border border-cyan-500/20">
            {node.linkedRebirthNodeId?.ownerUserId?.memberId || "N/A"}
          </p>
        </div>

        {/* Children Status Dots */}
        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border border-white/25 shadow-sm transition-all duration-500 ${
                i <= (node.autopoolChildrenCount || 0)
                  ? "bg-gradient-to-tr from-emerald-400 to-teal-500 scale-110"
                  : "bg-white/10"
              }`}
              title={`Position ${i}: ${i <= (node.autopoolChildrenCount || 0) ? "Filled" : "Empty"}`}
            />
          ))}
        </div>

        {/* Connection Dot - Bottom */}
        {children.length > 0 && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-cyan-500 border border-white/20 z-30 group-hover:scale-125 transition-transform" />
        )}
      </div>

      {/* Recursive Children Rendering */}
      {children.length > 0 && (
        <div className="flex flex-col items-center w-full mt-12 relative">
          <div className="w-0.5 h-12 bg-gradient-to-b from-cyan-500 to-white/5 absolute -top-12" />

          <div className="flex justify-center gap-16 relative w-full pt-6">
            {children.length > 1 && (
              <div
                className="absolute top-0 h-0.5 bg-white/10 rounded-full"
                style={{
                  left: `${150 / (children.length * 2)}%`,
                  right: `${150 / (children.length * 2)}%`,
                }}
              />
            )}

            {children.map((child) => (
              <div key={child._id} className="relative">
                <div className="w-0.5 h-6 bg-white/10 absolute -top-6 left-1/2 -translate-x-1/2" />
                <TreeCanvasNode
                  node={child}
                  childrenMap={childrenMap}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statCardClass =
  "rounded-2xl border border-white/15 bg-[linear-gradient(165deg,rgba(16,37,103,0.88)_0%,rgba(12,28,76,0.94)_100%)] p-4 shadow-[0_16px_36px_rgba(5,10,35,0.45)] backdrop-blur-sm";

export default function MyAutopoolPage() {
  const { user } = useContext(AuthContext) || {};
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [wallet, setWallet] = useState(null);

  // Subtree Modal State
  const [treeNodes, setTreeNodes] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);

  // Pool Fund ledger state
  const [poolFundHistory, setPoolFundHistory] = useState([]);
  const [showPoolFundModal, setShowPoolFundModal] = useState(false);
  const [poolFundLoading, setPoolFundLoading] = useState(false);

  // Isolated Fund Ledger state
  const [isolatedLedger, setIsolatedLedger] = useState([]);
  const [showIsolatedLedgerModal, setShowIsolatedLedgerModal] = useState(false);
  const [isolatedLedgerLoading, setIsolatedLedgerLoading] = useState(false);

  // Upgrade IDs state
  const [upgradeIds, setUpgradeIds] = useState([]);
  const [showUpgradeIdsModal, setShowUpgradeIdsModal] = useState(false);
  const [upgradeIdsLoading, setUpgradeIdsLoading] = useState(false);

  // Expanded levels state
  const [expandedLevels, setExpandedLevels] = useState({ 0: true });

  // Tree drag-to-scroll refs
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [detailsRes, walletRes] = await Promise.all([
        autopoolService.getMyAutoPoolDetails(),
        incomeService.getMyWallet(),
      ]);

      setDetails(detailsRes);
      setWallet(walletRes?.data || walletRes || null);
    } catch (error) {
      console.error("Failed to load self detailed autopool data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTree = async () => {
    setTreeLoading(true);
    setShowTreeModal(true);
    try {
      const response = await autopoolService.getMyAutoPoolTree();
      setTreeNodes(response || []);
    } catch (error) {
      console.error("Failed to load self subtree nodes:", error);
    } finally {
      setTreeLoading(false);
    }
  };

  const handleOpenPoolFund = async () => {
    setPoolFundLoading(true);
    setShowPoolFundModal(true);
    try {
      const response = await autopoolService.getMyPoolFundLedger();
      setPoolFundHistory(response || []);
    } catch (error) {
      console.error("Failed to load self pool fund ledger:", error);
    } finally {
      setPoolFundLoading(false);
    }
  };

  const handleOpenIsolatedLedger = async () => {
    setIsolatedLedgerLoading(true);
    setShowIsolatedLedgerModal(true);
    try {
      const response = await autopoolService.getMyFundTransactions();
      setIsolatedLedger(response || []);
    } catch (error) {
      console.error("Failed to load self isolated fund transactions:", error);
    } finally {
      setIsolatedLedgerLoading(false);
    }
  };

  const handleOpenUpgradeIds = async () => {
    setUpgradeIdsLoading(true);
    setShowUpgradeIdsModal(true);
    try {
      const response = await autopoolService.getMyUpgradeIds();
      setUpgradeIds(response || []);
    } catch (error) {
      console.error("Failed to load self upgrade alias IDs:", error);
    } finally {
      setUpgradeIdsLoading(false);
    }
  };

  const toggleLevel = (lIndex) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [lIndex]: !prev[lIndex],
    }));
  };

  // Build the tree hierarchy from flat list of nodes
  const { roots, childrenMap } = useMemo(() => {
    const map = new Map();
    const possibleRoots = [];

    treeNodes.forEach((node) => {
      const parentId = node.parentPoolNodeId?._id || node.parentPoolNodeId;
      if (!parentId) {
        possibleRoots.push(node);
      } else {
        const pid = parentId.toString();
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid).push(node);
      }
    });

    return { roots: possibleRoots, childrenMap: map };
  }, [treeNodes]);

  // Drag to scroll handlers for visual tree container
  const handleMouseDown = (e) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setStartY(e.pageY - scrollContainerRef.current.offsetTop);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    setScrollTop(scrollContainerRef.current.scrollTop);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const y = e.pageY - scrollContainerRef.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walkX;
    scrollContainerRef.current.scrollTop = scrollTop - walkY;
  };

  const getStatusBadge = (statusValue) => {
    switch (statusValue) {
      case "Completed":
      case "COMPLETED":
        return (
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit">
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      case "In Progress":
      case "Active":
        return (
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit">
            <Clock size={12} /> In Progress
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-white/5 text-slate-400 border border-white/10 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit">
            <HelpCircle size={12} /> Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionTitle
          title="My Autopool"
          subtitle="Loading your personalized autopool records..."
        />
        <div className="py-24 text-center text-sm text-slate-300 bg-white/5 rounded-2xl border border-white/10">
          Loading detailed autopool report...
        </div>
      </div>
    );
  }

  const uSummary = details?.userSummary || {};
  const levelWiseStatus = details?.levelWiseStatus || [];
  const rebirthDetails = details?.rebirthDetails || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionTitle
          title="My Autopool"
          subtitle={`Detailed real-time autopool tracking for ${user?.fullName || "member"}.`}
        />
        <button
          onClick={handleOpenTree}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-bold transition duration-300 text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 border border-indigo-500/20"
        >
          <Network size={16} /> View Subtree Visualizer
        </button>
      </div>

      {/* User Summary Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* User ID Card */}
        <div className="rounded-2xl border border-white/15 bg-[linear-gradient(165deg,rgba(16,37,103,0.88)_0%,rgba(12,28,76,0.94)_100%)] p-5 shadow-[0_16px_36px_rgba(5,10,35,0.45)] backdrop-blur-sm flex flex-col justify-between h-full relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Account ID</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {uSummary.memberId || user?.memberId}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300 font-semibold relative z-10">
            <span>Sponsor:</span>
            <span className="text-cyan-300 font-bold">{uSummary.sponsorId || "N/A"}</span>
          </div>
        </div>

        {/* Sponsor/Level Primary Wallet Card */}
        <div className="rounded-2xl border border-white/15 bg-[linear-gradient(165deg,rgba(16,37,103,0.88)_0%,rgba(12,28,76,0.94)_100%)] p-5 shadow-[0_16px_36px_rgba(5,10,35,0.45)] backdrop-blur-sm flex flex-col justify-between h-full relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-200 border border-white/10">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Primary Wallet</p>
              <p className="text-sm font-black text-white mt-0.5">
                {formatCurrency(wallet?.withdrawableFund || uSummary.withdrawableWalletAmount)}
              </p>
            </div>
          </div>
          <span className="mt-4 text-[10px] text-slate-400 font-semibold relative z-10">Sponsor/Level Income Balance</span>
        </div>

        {/* Isolated Autopool Withdrawable Wallet Card */}
        <div className="rounded-2xl border border-emerald-500/25 bg-[linear-gradient(165deg,rgba(6,78,59,0.4)_0%,rgba(4,47,38,0.5)_100%)] p-5 shadow-[0_16px_36px_rgba(4,47,38,0.25)] backdrop-blur-sm flex flex-col justify-between h-full relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-emerald-500/10 to-transparent" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Autopool Wallet</p>
              <p className="text-sm font-black text-emerald-300 mt-0.5">
                {formatCurrency(uSummary.withdrawableAutopoolFund)}
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenIsolatedLedger}
            className="mt-4 w-full px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg font-bold transition text-[10px] text-center shadow-lg shadow-emerald-950/40 relative z-10 border border-emerald-500/35"
          >
            View Ledger
          </button>
        </div>

        {/* Isolated Pool Fund Card */}
        <div className="rounded-2xl border border-white/15 bg-[linear-gradient(165deg,rgba(16,37,103,0.88)_0%,rgba(12,28,76,0.94)_100%)] p-5 shadow-[0_16px_36px_rgba(5,10,35,0.45)] backdrop-blur-sm flex flex-col justify-between h-full relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Coins size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Pool Fund</p>
              <p className="text-sm font-black text-white mt-0.5">
                {formatCurrency(uSummary.poolFundTotal)}
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenPoolFund}
            className="mt-4 w-full px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg font-bold transition text-[10px] text-center border border-blue-500/30 relative z-10"
          >
            View Pool History
          </button>
        </div>

        {/* Reinvestment Fund Card */}
        <div className="rounded-2xl border border-white/15 bg-[linear-gradient(165deg,rgba(16,37,103,0.88)_0%,rgba(12,28,76,0.94)_100%)] p-5 shadow-[0_16px_36px_rgba(5,10,35,0.45)] backdrop-blur-sm flex flex-col justify-between h-full relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Reinvest Fund</p>
              <p className="text-sm font-black text-white mt-0.5">
                {formatCurrency(uSummary.reinvestmentFundTotal)}
              </p>
            </div>
          </div>
          <span className="mt-4 text-[10px] text-slate-400 font-semibold relative z-10">Rebirth reserved balance</span>
        </div>

        {/* Upgrade / Alias IDs count Card */}
        <div className="rounded-2xl border border-white/15 bg-[linear-gradient(165deg,rgba(16,37,103,0.88)_0%,rgba(12,28,76,0.94)_100%)] p-5 shadow-[0_16px_36px_rgba(5,10,35,0.45)] backdrop-blur-sm flex flex-col justify-between h-full relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <BadgeIndianRupee size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Upgrade IDs</p>
              <p className="text-sm font-black text-white mt-0.5">
                {uSummary.upgradeIdCount || 0} IDs
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenUpgradeIds}
            className="mt-4 w-full px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-lg font-bold transition text-[10px] text-center border border-cyan-500/30 relative z-10"
          >
            List Upgrade IDs
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center shadow-inner">
          <p className="text-xs text-slate-400 font-medium">Current Active Level</p>
          <p className="text-xl font-bold text-white mt-1">Level {uSummary.currentActiveLevel ?? 0}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center shadow-inner">
          <p className="text-xs text-slate-400 font-medium">Latest Completed Level</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">
            {uSummary.completedAutopoolLevel !== null && uSummary.completedAutopoolLevel !== undefined
              ? `Level ${uSummary.completedAutopoolLevel}`
              : "None"}
          </p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center shadow-inner">
          <p className="text-xs text-slate-400 font-medium">Total Rebirths</p>
          <p className="text-xl font-bold text-indigo-400 mt-1">{uSummary.totalRebirthsCreated ?? 0}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center shadow-inner">
          <p className="text-xs text-slate-400 font-medium">Completed Rebirths</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{uSummary.totalCompletedRebirths ?? 0}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center shadow-inner col-span-2 md:col-span-1">
          <p className="text-xs text-slate-400 font-medium">Pending Rebirths</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{uSummary.totalPendingRebirths ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Level-wise Autopool Accordion */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Layers size={18} className="text-indigo-400" /> Level-wise Status
          </h3>

          <div className="space-y-3">
            {levelWiseStatus.map((lws, idx) => {
              const isExpanded = !!expandedLevels[idx];
              const hasNodes = lws.rebirths && lws.rebirths.length > 0;

              return (
                <div
                  key={idx}
                  className={`rounded-xl border transition-all duration-300 overflow-hidden bg-white/5 ${
                    isExpanded ? "border-indigo-500/40 shadow-[0_8px_24px_rgba(99,102,241,0.1)]" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Level Header */}
                  <button
                    onClick={() => toggleLevel(idx)}
                    className="w-full flex items-center justify-between px-4 py-3.5"
                  >
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Level {lws.level}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Rebirths: {lws.generatedCount} / {lws.requiredCount}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(lws.status)}
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </button>

                  {/* Level Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3 bg-[#0a153b]/40">
                      {lws.completionDate && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-semibold bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg w-fit">
                          <Calendar size={12} className="text-emerald-400" /> Completed On: {formatDate(lws.completionDate).split(",")[0]}
                        </div>
                      )}

                      {!hasNodes ? (
                        <p className="text-xs text-slate-400 italic">No rebirths placed in this level yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {lws.rebirths.map((node) => (
                            <div
                              key={node._id}
                              className="bg-white/5 p-2.5 rounded-lg border border-white/10 flex flex-col gap-1.5 shadow-sm"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-mono font-bold text-cyan-300">
                                  {node.rebirthCode}
                                </span>
                                <span
                                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                    node.status === "Completed"
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : node.status === "Active"
                                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  }`}
                                >
                                  {node.status}
                                </span>
                              </div>

                              <div className="flex justify-between text-[10px] text-slate-300 font-medium">
                                <span>Children Filled:</span>
                                <span className="font-bold text-white">{node.childrenCount} / 3</span>
                              </div>

                              {node.childCodes && node.childCodes.length > 0 && (
                                <div className="text-[10px] text-slate-400">
                                  Children Codes: <span className="font-mono font-semibold text-slate-300">{node.childCodes.join(", ")}</span>
                                </div>
                              )}

                              {node.newRebirthCodes && node.newRebirthCodes.length > 0 && (
                                <div className="text-[10px] text-slate-300 bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20 mt-1">
                                  Successors: <span className="font-mono font-semibold text-emerald-400">{node.newRebirthCodes.join(", ")}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Flat Rebirth Details Table */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Network size={18} className="text-indigo-400" /> Rebirth Details Table
          </h3>

          <Card className="p-0 border border-white/15 overflow-hidden">
            <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-4 py-3 text-xs font-bold text-slate-300 uppercase tracking-wider">Rebirth ID</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-300 uppercase tracking-wider">Level</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-300 uppercase tracking-wider">Parent Node</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-300 uppercase tracking-wider">Children</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-300 uppercase tracking-wider">Completed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-200">
                  {rebirthDetails.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-400 italic">
                        No rebirths generated in your autopool yet.
                      </td>
                    </tr>
                  ) : (
                    rebirthDetails.map((node) => (
                      <tr key={node._id} className="hover:bg-white/5 transition duration-200">
                        <td className="px-4 py-3.5 font-bold font-mono text-cyan-300">{node.rebirthCode}</td>
                        <td className="px-4 py-3.5 font-semibold text-white">Level {node.level}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-400">{node.parentCode || "—"}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{node.childrenCount} / 3</span>
                            <div className="w-16 bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${(node.childrenCount / 3) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              node.status === "Completed"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : node.status === "Active"
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {node.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 font-medium">
                          {node.completedAt ? formatDate(node.completedAt).split(",")[0] : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Visual Subtree Modal Panel */}
      {showTreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#020d2e] w-full max-w-6xl h-[85vh] rounded-3xl border border-white/15 shadow-2xl flex flex-col overflow-hidden relative">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Network size={20} className="text-cyan-400" />
                  Subtree Visualizer: {user?.fullName || "My Pool"} ({uSummary.memberId || user?.memberId})
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Drag to pan. Showing only your own rebirth nodes and sub-branches chronologically.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTreeModal(false);
                  setTreeNodes([]);
                }}
                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tree Canvas Container */}
            <div className="flex-1 relative overflow-hidden bg-[#010924]">
              {treeLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-medium">
                  Loading subtree map...
                </div>
              ) : roots.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">
                  No active placed rebirth nodes found in the matrix yet.
                </div>
              ) : (
                <div
                  ref={scrollContainerRef}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  className="w-full h-full overflow-auto cursor-grab active:cursor-grabbing p-12 flex flex-col items-center select-none"
                  style={{ scrollBehavior: isDragging ? "auto" : "smooth" }}
                >
                  <div className="flex flex-col gap-24 items-center">
                    {roots.map((rootNode) => (
                      <div key={rootNode._id} className="border border-indigo-500/20 bg-indigo-950/20 p-8 rounded-3xl relative shadow-[0_8px_32px_rgba(99,102,241,0.05)]">
                        <div className="absolute -top-3 left-6 px-3 py-0.5 rounded bg-indigo-900 border border-indigo-700/50 text-[9px] text-indigo-300 font-bold uppercase tracking-wider">
                          Subtree Root
                        </div>
                        <TreeCanvasNode
                          node={rootNode}
                          childrenMap={childrenMap}
                          depth={0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-[#020b29] flex justify-between items-center text-xs text-slate-400 font-medium">
              <span>Total Rebirth Nodes Rendered: <strong className="text-white">{treeNodes.length}</strong></span>
              <span>Click and drag to navigate canvas</span>
            </div>
          </div>
        </div>
      )}

      {/* Pool Fund History Modal */}
      {showPoolFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#020d2e] w-full max-w-4xl h-[80vh] rounded-3xl border border-white/15 shadow-2xl flex flex-col overflow-hidden relative">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  Pool Fund Ledger History
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed allocations list for pool fund credits
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPoolFundModal(false);
                  setPoolFundHistory([]);
                }}
                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-[#010924]">
              {poolFundLoading ? (
                <div className="h-full flex items-center justify-center text-slate-300 font-medium text-sm">
                  Loading ledger entries...
                </div>
              ) : poolFundHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm italic">
                  No pool fund history found yet.
                </div>
              ) : (
                <div className="rounded-2xl border border-white/15 shadow-lg overflow-hidden bg-white/5">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider">Rebirth Node</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider">Level</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {poolFundHistory.map((txn) => (
                        <tr key={txn._id} className="hover:bg-white/5 transition duration-150">
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {formatDate(txn.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                              {txn.type?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-black text-amber-300">
                            {formatCurrency(txn.amount)}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-cyan-300 font-bold">
                            {txn.sourceRebirthId || txn.completedRebirthId?.nodeCode || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-white font-bold">
                            {txn.level !== undefined ? `Level ${txn.level}` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              txn.status === "COMPLETED" || txn.entryType === "credit"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}>
                              {txn.status || "COMPLETED"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Isolated Fund Ledger Modal */}
      {showIsolatedLedgerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#020d2e] w-full max-w-5xl h-[80vh] rounded-3xl border border-white/15 shadow-2xl flex flex-col overflow-hidden relative">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wallet size={18} className="text-emerald-400" />
                  Isolated Autopool Ledger
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed transactions log for withdrawable autopool, pool and reinvestment funds
                </p>
              </div>
              <button
                onClick={() => {
                  setShowIsolatedLedgerModal(false);
                  setIsolatedLedger([]);
                }}
                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-[#010924]">
              {isolatedLedgerLoading ? (
                <div className="h-full flex items-center justify-center text-slate-300 font-medium text-sm">
                  Loading ledger transactions...
                </div>
              ) : isolatedLedger.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm italic">
                  No isolated fund transactions found yet.
                </div>
              ) : (
                <div className="rounded-2xl border border-white/15 shadow-lg overflow-hidden bg-white/5">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-center">Source Rebirth</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-right">Amount</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-right">Balance After</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider pl-6">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-200">
                      {isolatedLedger.map((txn) => (
                        <tr key={txn._id} className="hover:bg-white/5 transition duration-150">
                          <td className="px-4 py-3 text-slate-400">
                            {formatDate(txn.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                              txn.type === "POOL_FUND_CREDIT" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                              txn.type === "REINVESTMENT_FUND_CREDIT" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                              txn.type === "WITHDRAWABLE_AUTOPOOL_CREDIT" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                              "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            }`}>
                              {txn.type?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-white">{txn.sourceRebirthId || "—"}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Level {txn.completedLevel}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-black ${txn.type === "UPGRADE_ID_DEDUCTION" ? "text-rose-400" : "text-emerald-400"}`}>
                              {txn.type === "UPGRADE_ID_DEDUCTION" ? "-" : "+"}{formatCurrency(txn.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-300">
                            {formatCurrency(txn.balanceAfter)}
                          </td>
                          <td className="px-4 py-3 pl-6 text-slate-300 font-medium">
                            {txn.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Alias IDs Modal */}
      {showUpgradeIdsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#020d2e] w-full max-w-3xl h-[70vh] rounded-3xl border border-white/15 shadow-2xl flex flex-col overflow-hidden relative">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Network size={18} className="text-cyan-400" />
                  Upgrade & Alias Accounts
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  List of generated alias IDs triggered by matrix cycle completions
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUpgradeIdsModal(false);
                  setUpgradeIds([]);
                }}
                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-[#010924]">
              {upgradeIdsLoading ? (
                <div className="h-full flex items-center justify-center text-slate-300 font-medium text-sm">
                  Loading upgrade accounts...
                </div>
              ) : upgradeIds.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm italic">
                  No upgrade alias accounts created for your pool yet.
                </div>
              ) : (
                <div className="rounded-2xl border border-white/15 shadow-lg overflow-hidden bg-white/5">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider">Date Created</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider">Alias ID</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-center">Source Level</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-right">Deduction Amount</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-slate-200">
                      {upgradeIds.map((item) => (
                        <tr key={item._id} className="hover:bg-white/5 transition duration-150">
                          <td className="px-4 py-3 text-slate-400">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-cyan-300">
                            {item.aliasId}
                          </td>
                          <td className="px-4 py-3 text-center text-white font-bold">
                            Level {item.sourceAutopoolLevel}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-rose-400">
                            -{formatCurrency(item.deductionAmount || 75)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {item.status || "ACTIVE"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
