import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
            ? "border-[#10B981] bg-emerald-50 shadow-sm text-[#111827]"
            : "border-[#E5E7EB] bg-white text-[#111827] shadow-sm"
        } min-w-52 text-center z-20 hover:shadow-lg hover:border-[#F4B860]`}
      >
        {/* Connection Dot - Top */}
        {depth > 0 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#E5E7EB] z-30" />
        )}

        {/* Badge */}
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
            node.parentPoolNodeId
              ? "bg-[#F4B860] text-[#111827] border border-[#F4B860]/20"
              : "bg-[#111827] text-white border border-[#111827]/20"
          }`}
        >
          {node.parentPoolNodeId ? `LEVEL ${node.levelNumber || depth}` : "ROOT NODE"}
        </div>

        {/* Content */}
        <div className="mt-2 space-y-1.5">
          <h4 className="font-bold text-[#111827] text-lg leading-tight tracking-tight">
            {node.poolNodeId || node.nodeCode}
          </h4>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <div className="w-5 h-5 rounded-full bg-[#FFF4E5] flex items-center justify-center text-[10px] text-[#F4B860] font-bold border border-[#F4B860]/20">
              {node.linkedRebirthNodeId?.ownerUserId?.fullName?.charAt(0) || "M"}
            </div>
            <p className="text-[11px] text-[#6B7280] font-semibold truncate max-w-28">
              {node.linkedRebirthNodeId?.ownerUserId?.fullName || "Member"}
            </p>
          </div>
          <div className="flex flex-col gap-1 mt-1 items-center justify-center">
            <p className="text-[9px] text-[#111827] font-mono font-bold bg-[#F8FAFC] inline-block px-2 py-0.5 rounded border border-[#E5E7EB]">
              {node.linkedRebirthNodeId?.ownerUserId?.memberId || "N/A"}
            </p>
            <span className="text-[9px] text-[#111827] font-mono font-bold bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E5E7EB]">
              Q-Serial: {node.queueSerialNo || "N/A"}
            </span>
          </div>
        </div>

        {/* Children Status Dots */}
        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border border-[#E5E7EB] shadow-sm transition-all duration-500 ${
                i <= (node.autopoolChildrenCount || 0)
                  ? "bg-[#10B981] scale-110"
                  : "bg-[#F3F4F6]"
              }`}
              title={`Position ${i}: ${i <= (node.autopoolChildrenCount || 0) ? "Filled" : "Empty"}`}
            />
          ))}
        </div>

        {/* Connection Dot - Bottom */}
        {children.length > 0 && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#F4B860] border border-white z-30 group-hover:scale-125 transition-transform" />
        )}
      </div>

      {/* Recursive Children Rendering */}
      {children.length > 0 && (
        <div className="flex flex-col items-center w-full mt-12 relative">
          <div className="w-0.5 h-12 bg-gradient-to-b from-[#F4B860] to-[#E5E7EB] absolute -top-12" />

          <div className="flex justify-center gap-16 relative w-full pt-6">
            {children.length > 1 && (
              <div
                className="absolute top-0 h-0.5 bg-[#E5E7EB] rounded-full"
                style={{
                  left: `${150 / (children.length * 2)}%`,
                  right: `${150 / (children.length * 2)}%`,
                }}
              />
            )}

            {children.map((child) => (
              <div key={child._id} className="relative">
                <div className="w-0.5 h-6 bg-[#E5E7EB] absolute -top-6 left-1/2 -translate-x-1/2" />
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
  const navigate = useNavigate();
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
        <div className="py-24 text-center text-sm text-[#9CA3AF] bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
          Loading detailed autopool report...
        </div>
      </div>
    );
  }

  const uSummary = details?.userSummary || {};
  const levelWiseStatus = details?.levelWiseStatus || [];
  const rebirthDetails = details?.rebirthDetails || [];

  return (
    <div className="space-y-6 pb-12 text-[#111827]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionTitle
          title="My Autopool"
          subtitle={`Detailed real-time autopool tracking for ${user?.fullName || "member"}.`}
        />
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleOpenTree}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#111827] text-white hover:bg-[#1F2937] rounded-xl font-bold transition duration-300 text-sm flex items-center justify-center gap-2 shadow-sm border border-[#E5E7EB] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Network size={16} /> View Subtree Visualizer
          </button>
          <button
            onClick={() => navigate("/member/aliases")}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#F4B860] text-[#111827] hover:bg-[#E8A13F] rounded-xl font-bold transition duration-300 text-sm flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <BadgeIndianRupee size={16} /> Open Alias Page
          </button>
        </div>
      </div>

      {/* User Summary Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* User ID Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] flex items-center justify-center text-[#F4B860] border border-[#F4B860]/20">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Account ID</p>
              <p className="text-sm font-bold text-[#111827] mt-0.5">
                {uSummary.memberId || user?.memberId}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280] font-semibold relative z-10">
            <span>Sponsor:</span>
            <span className="text-[#F4B860] font-bold">{uSummary.sponsorId || "N/A"}</span>
          </div>
        </div>

        {/* Sponsor/Level Primary Wallet Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] flex items-center justify-center text-[#F4B860] border border-[#F4B860]/20">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Primary Wallet</p>
              <p className="text-sm font-black text-[#111827] mt-0.5">
                {formatCurrency(wallet?.withdrawableFund || uSummary.withdrawableWalletAmount)}
              </p>
            </div>
          </div>
          <span className="mt-4 text-[10px] text-[#6B7280] font-semibold relative z-10">Sponsor/Level Income Balance</span>
        </div>

        {/* Isolated Autopool Withdrawable Wallet Card */}
        <div className="rounded-2xl border border-[#F4B860]/20 bg-[#FFF4E5]/40 p-5 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] flex items-center justify-center text-[#F4B860] border border-[#F4B860]/30">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[#F4B860] font-bold uppercase tracking-wider">Autopool Wallet</p>
              <p className="text-sm font-black text-[#111827] mt-0.5">
                {formatCurrency(uSummary.withdrawableAutopoolFund)}
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenIsolatedLedger}
            className="mt-4 w-full px-3 py-1.5 bg-[#111827] hover:bg-[#1F2937] text-white rounded-lg font-bold transition text-[10px] text-center shadow-sm relative z-10 hover:scale-[1.02]"
          >
            View Ledger
          </button>
        </div>

        {/* Isolated Pool Fund Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-200">
              <Coins size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Pool Fund</p>
              <p className="text-sm font-black text-[#111827] mt-0.5">
                {formatCurrency(uSummary.poolFundTotal)}
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenPoolFund}
            className="mt-4 w-full px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#111827] rounded-lg font-bold transition text-[10px] text-center border border-[#E5E7EB] shadow-sm relative z-10 hover:scale-[1.02]"
          >
            View Pool History
          </button>
        </div>

        {/* Reinvestment Fund Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Reinvest Fund</p>
              <p className="text-sm font-black text-[#111827] mt-0.5">
                {formatCurrency(uSummary.reinvestmentFundTotal)}
              </p>
            </div>
          </div>
          <span className="mt-4 text-[10px] text-[#6B7280] font-semibold relative z-10">Rebirth reserved balance</span>
        </div>

        {/* Alias Page CTA Card */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] flex items-center justify-center text-[#F4B860] border border-[#F4B860]/20">
              <BadgeIndianRupee size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Alias / Upgrade IDs</p>
              <p className="text-sm font-bold text-[#111827] mt-0.5">Open dedicated view</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/member/aliases")}
            className="mt-4 w-full px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#111827] rounded-lg font-bold transition text-[10px] text-center border border-[#E5E7EB] shadow-sm relative z-10 hover:scale-[1.02]"
          >
            Open Alias Page
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] text-center shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-[#6B7280] font-medium">Current Active Level</p>
          <p className="text-xl font-bold text-[#111827] mt-1">Level {uSummary.currentActiveLevel ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] text-center shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-[#6B7280] font-medium">Latest Completed Level</p>
          <p className="text-xl font-bold text-[#10B981] mt-1">
            {uSummary.completedAutopoolLevel !== null && uSummary.completedAutopoolLevel !== undefined
              ? `Level ${uSummary.completedAutopoolLevel}`
              : "None"}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] text-center shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-[#6B7280] font-medium">Total Rebirths</p>
          <p className="text-xl font-bold text-[#3B82F6] mt-1">{uSummary.totalRebirthsCreated ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] text-center shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-[#6B7280] font-medium">Completed Rebirths</p>
          <p className="text-xl font-bold text-[#10B981] mt-1">{uSummary.totalCompletedRebirths ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] text-center shadow-sm hover:shadow-md transition-all col-span-2 md:col-span-1">
          <p className="text-xs text-[#6B7280] font-medium">Pending Rebirths</p>
          <p className="text-xl font-bold text-[#F59E0B] mt-1">{uSummary.totalPendingRebirths ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Level-wise Autopool Accordion */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
            <Layers size={18} className="text-[#F4B860]" /> Level-wise Status
          </h3>

          <div className="space-y-3">
            {levelWiseStatus.map((lws, idx) => {
              const isExpanded = !!expandedLevels[idx];
              const hasNodes = lws.rebirths && lws.rebirths.length > 0;

              return (
                <div
                  key={idx}
                  className={`rounded-xl border transition-all duration-300 overflow-hidden bg-white ${
                    isExpanded ? "border-[#F4B860] shadow-md" : "border-[#E5E7EB] hover:border-[#F4B860]/50"
                  }`}
                >
                  {/* Level Header */}
                  <button
                    onClick={() => toggleLevel(idx)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FFF4E5]/10"
                  >
                    <div className="text-left">
                      <p className="text-sm font-bold text-[#111827]">Level {lws.level}</p>
                      <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">
                        Rebirths: {lws.generatedCount} / {lws.requiredCount}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(lws.status)}
                      {isExpanded ? <ChevronUp size={16} className="text-[#6B7280]" /> : <ChevronDown size={16} className="text-[#6B7280]" />}
                    </div>
                  </button>

                  {/* Level Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[#E5E7EB] pt-3 space-y-3 bg-[#F8FAFC]">
                      {lws.completionDate && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#10B981] font-semibold bg-emerald-50 border border-[#10B981]/20 p-2 rounded-lg w-fit">
                          <Calendar size={12} className="text-[#10B981]" /> Completed On: {formatDate(lws.completionDate).split(",")[0]}
                        </div>
                      )}

                      {!hasNodes ? (
                        <p className="text-xs text-[#9CA3AF] italic">No rebirths placed in this level yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {lws.rebirths.map((node) => (
                            <div
                              key={node._id}
                              className="bg-white p-2.5 rounded-lg border border-[#E5E7EB] flex flex-col gap-1.5 shadow-sm"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-mono font-bold text-[#F4B860]">
                                  {node.rebirthCode}
                                </span>
                                <span
                                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                    node.status === "Completed"
                                      ? "bg-emerald-50 text-[#10B981] border border-[#10B981]/25"
                                      : node.status === "Active"
                                      ? "bg-blue-50 text-[#3B82F6] border border-[#3B82F6]/25"
                                      : "bg-amber-50 text-[#F59E0B] border border-[#F59E0B]/25"
                                  }`}
                                >
                                  {node.status}
                                </span>
                              </div>

                              <div className="flex justify-between text-[10px] text-[#6B7280] font-medium">
                                <span>Children Filled:</span>
                                <span className="font-bold text-[#111827]">{node.childrenCount} / 3</span>
                              </div>

                              {node.childCodes && node.childCodes.length > 0 && (
                                <div className="text-[10px] text-[#6B7280]">
                                  Children Codes: <span className="font-mono font-semibold text-[#111827]">{node.childCodes.join(", ")}</span>
                                </div>
                              )}

                              {node.newRebirthCodes && node.newRebirthCodes.length > 0 && (
                                <div className="text-[10px] text-[#10B981] bg-emerald-50 p-1.5 rounded border border-[#10B981]/20 mt-1 font-medium">
                                  Successors: <span className="font-mono font-bold text-[#10B981]">{node.newRebirthCodes.join(", ")}</span>
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
          <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
            <Network size={18} className="text-[#F4B860]" /> Rebirth Details Table
          </h3>

          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm overflow-x-auto max-h-[580px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                  <th className="px-5 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Rebirth ID</th>
                  <th className="px-5 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Level</th>
                  <th className="px-5 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Parent Node</th>
                  <th className="px-5 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Children</th>
                  <th className="px-5 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-xs text-[#111827]">
                {rebirthDetails.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-[#9CA3AF] italic bg-white">
                      No rebirths generated in your autopool yet.
                    </td>
                  </tr>
                ) : (
                  rebirthDetails.map((node) => (
                    <tr key={node._id} className="hover:bg-[#FFF4E5] transition-colors duration-200">
                      <td className="px-5 py-4.5 font-bold font-mono text-[#F4B860]">{node.rebirthCode}</td>
                      <td className="px-5 py-4.5 font-semibold text-[#111827]">Level {node.level}</td>
                      <td className="px-5 py-4.5 font-mono text-[#6B7280]">{node.parentCode || "—"}</td>
                      <td className="px-5 py-4.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#111827]">{node.childrenCount} / 3</span>
                          <div className="w-16 bg-[#F3F4F6] h-1.5 rounded-full overflow-hidden border border-[#E5E7EB]">
                            <div
                              className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                              style={{ width: `${(node.childrenCount / 3) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            node.status === "Completed"
                              ? "bg-emerald-50 text-[#10B981] border border-[#10B981]/25"
                              : node.status === "Active"
                              ? "bg-blue-50 text-[#3B82F6] border border-[#3B82F6]/25"
                              : "bg-amber-50 text-[#F59E0B] border border-[#F59E0B]/25"
                          }`}
                        >
                          {node.status}
                        </span>
                      </td>
                      <td className="px-5 py-4.5 text-[#6B7280] font-medium">
                        {node.completedAt ? formatDate(node.completedAt).split(",")[0] : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Visual Subtree Modal Panel */}
      {showTreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-6xl h-[85vh] rounded-3xl border border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden relative">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#111827] flex items-center gap-2">
                  <Network size={20} className="text-[#F4B860]" />
                  Subtree Visualizer: {user?.fullName || "My Pool"} ({uSummary.memberId || user?.memberId})
                </h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Drag to pan. Showing only your own rebirth nodes and sub-branches chronologically.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTreeModal(false);
                  setTreeNodes([]);
                }}
                className="p-2 text-[#6B7280] hover:text-[#111827] bg-[#F8FAFC] hover:bg-[#F3F4F6] rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tree Canvas Container */}
            <div className="flex-1 relative overflow-hidden bg-[#F8FAFC]">
              {treeLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-[#6B7280] font-medium">
                  Loading subtree map...
                </div>
              ) : roots.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF] font-medium">
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
                      <div key={rootNode._id} className="border border-[#F4B860]/20 bg-[#FFF4E5]/50 p-8 rounded-3xl relative shadow-sm">
                        <div className="absolute -top-3 left-6 px-3 py-0.5 rounded bg-[#F4B860] border border-[#E8A13F]/50 text-[9px] text-white font-bold uppercase tracking-wider">
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
            <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center text-xs text-[#6B7280] font-medium">
              <span>Total Rebirth Nodes Rendered: <strong className="text-[#111827]">{treeNodes.length}</strong></span>
              <span>Click and drag to navigate canvas</span>
            </div>
          </div>
        </div>
      )}

      {/* Pool Fund History Modal */}
      {showPoolFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl border border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden relative">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                  <Award size={18} className="text-[#F4B860]" />
                  Pool Fund Ledger History
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Detailed allocations list for pool fund credits
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPoolFundModal(false);
                  setPoolFundHistory([]);
                }}
                className="p-2 text-[#6B7280] hover:text-[#111827] bg-[#F8FAFC] hover:bg-[#F3F4F6] rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-[#F8FAFC]">
              {poolFundLoading ? (
                <div className="h-full flex items-center justify-center text-[#6B7280] font-medium text-sm">
                  Loading ledger entries...
                </div>
              ) : poolFundHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#9CA3AF] font-medium text-sm italic">
                  No pool fund history found yet.
                </div>
              ) : (
                <div className="rounded-2xl border border-[#E5E7EB] shadow-md overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                        <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Rebirth Node</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Level</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6] text-[#111827]">
                      {poolFundHistory.map((txn) => (
                        <tr key={txn._id} className="hover:bg-[#FFF4E5] transition duration-150">
                          <td className="px-4 py-3 text-xs text-[#6B7280]">
                            {formatDate(txn.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F8FAFC] text-[#6B7280] border border-[#E5E7EB]">
                              {txn.type?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-black text-[#E8A13F]">
                            {formatCurrency(txn.amount)}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-[#F4B860] font-bold">
                            {txn.sourceRebirthId || txn.completedRebirthId?.nodeCode || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#111827] font-bold">
                            {txn.level !== undefined ? `Level ${txn.level}` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              txn.status === "COMPLETED" || txn.entryType === "credit"
                                ? "bg-emerald-50 text-[#10B981] border border-[#10B981]/25"
                                : "bg-amber-50 text-[#F59E0B] border border-[#F59E0B]/25"
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
          <div className="bg-white w-full max-w-5xl h-[80vh] rounded-3xl border border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden relative">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                  <Wallet size={18} className="text-emerald-500" />
                  Isolated Autopool Ledger
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Detailed transactions log for withdrawable autopool, pool and reinvestment funds
                </p>
              </div>
              <button
                onClick={() => {
                  setShowIsolatedLedgerModal(false);
                  setIsolatedLedger([]);
                }}
                className="p-2 text-[#6B7280] hover:text-[#111827] bg-[#F8FAFC] hover:bg-[#F3F4F6] rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-[#F8FAFC]">
              {isolatedLedgerLoading ? (
                <div className="h-full flex items-center justify-center text-[#6B7280] font-medium text-sm">
                  Loading ledger transactions...
                </div>
              ) : isolatedLedger.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#9CA3AF] font-medium text-sm italic">
                  No isolated fund transactions found yet.
                </div>
              ) : (
                <div className="rounded-2xl border border-[#E5E7EB] shadow-md overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                        <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-center">Source Rebirth</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Amount</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Balance After</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider pl-6">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6] text-xs text-[#111827]">
                      {isolatedLedger.map((txn) => (
                        <tr key={txn._id} className="hover:bg-[#FFF4E5] transition duration-150">
                          <td className="px-4 py-3 text-[#6B7280]">
                            {formatDate(txn.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                              txn.type === "POOL_FUND_CREDIT" ? "bg-blue-50 text-blue-600 border-blue-200" :
                              txn.type === "REINVESTMENT_FUND_CREDIT" ? "bg-amber-50 text-[#F59E0B] border-amber-200" :
                              txn.type === "WITHDRAWABLE_AUTOPOOL_CREDIT" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                              "bg-rose-50 text-rose-600 border-rose-200"
                            }`}>
                              {txn.type?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-[#111827]">{txn.sourceRebirthId || "—"}</span>
                              <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-tighter">Level {txn.completedLevel}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-black ${txn.type === "UPGRADE_ID_DEDUCTION" ? "text-rose-600" : "text-emerald-600"}`}>
                              {txn.type === "UPGRADE_ID_DEDUCTION" ? "-" : "+"}{formatCurrency(txn.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-[#111827]">
                            {formatCurrency(txn.balanceAfter)}
                          </td>
                          <td className="px-4 py-3 pl-6 text-[#6B7280] font-medium">
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

    </div>
  );
}
