import React, { useState, useEffect, useMemo, useRef } from "react";
import { autopoolService } from "../../services/autopool.service";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Wallet, 
  ArrowLeft, 
  Network, 
  Award,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  HelpCircle,
  X
} from "lucide-react";

// Local TreeNode component for individual subtree rendering
const TreeNode = ({ node, childrenMap, depth = 0 }) => {
  const children = childrenMap.get(node._id.toString()) || [];

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        className={`group relative p-5 rounded-2xl border transition-all duration-300 hover:scale-105 ${
          node.status === "COMPLETED"
            ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-emerald-100"
            : "bg-white border-slate-200 shadow-slate-100"
        } shadow-xl min-w-[200px] text-center z-20 hover:shadow-2xl hover:border-indigo-300`}
      >
        {/* Connection Dot - Top */}
        {depth > 0 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-300 border-2 border-white z-30" />
        )}

        {/* Badge */}
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${
            node.parentPoolNodeId
              ? "bg-indigo-600 text-white"
              : "bg-amber-500 text-white"
          }`}
        >
          {node.parentPoolNodeId ? `LEVEL ${node.levelNumber || depth}` : "ROOT NODE"}
        </div>

        {/* Content */}
        <div className="mt-2">
          <h4 className="font-black text-slate-900 text-lg leading-tight tracking-tight">
            {node.poolNodeId}
          </h4>
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-600 font-bold">
              {node.linkedRebirthNodeId?.ownerUserId?.fullName?.charAt(0) || "U"}
            </div>
            <p className="text-[11px] text-slate-600 font-semibold truncate max-w-[110px]">
              {node.linkedRebirthNodeId?.ownerUserId?.fullName || "Anonymous"}
            </p>
          </div>
          <p className="text-[9px] text-indigo-400 font-mono mt-1 font-bold bg-indigo-50 inline-block px-2 py-0.5 rounded">
            {node.linkedRebirthNodeId?.ownerUserId?.memberId || "N/A"}
          </p>
        </div>

        {/* Children Status Dots */}
        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-2 border-white shadow-sm transition-all duration-500 ${
                i <= (node.autopoolChildrenCount || 0)
                  ? "bg-gradient-to-tr from-emerald-400 to-teal-500 scale-110"
                  : "bg-slate-100"
              }`}
              title={`Position ${i}: ${i <= (node.autopoolChildrenCount || 0) ? "Filled" : "Empty"}`}
            />
          ))}
        </div>

        {/* Connection Dot - Bottom */}
        {children.length > 0 && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white z-30 group-hover:scale-125 transition-transform" />
        )}
      </div>

      {/* Recursive Children Rendering */}
      {children.length > 0 && (
        <div className="flex flex-col items-center w-full mt-12 relative">
          <div className="w-0.5 h-12 bg-gradient-to-b from-indigo-500 to-slate-300 absolute -top-12" />

          <div className="flex justify-center gap-16 relative w-full pt-6">
            {children.length > 1 && (
              <div
                className="absolute top-0 h-0.5 bg-slate-300 rounded-full"
                style={{
                  left: `${150 / (children.length * 2)}%`,
                  right: `${150 / (children.length * 2)}%`,
                }}
              />
            )}

            {children.map((child) => (
              <div key={child._id} className="relative">
                <div className="w-0.5 h-6 bg-slate-300 absolute -top-6 left-1/2 -translate-x-1/2" />
                <TreeNode
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

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function IndividualAutoPoolPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Scoped Subtree state
  const [treeNodes, setTreeNodes] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);

  // Pool Fund History state
  const [poolFundHistory, setPoolFundHistory] = useState([]);
  const [showPoolFundModal, setShowPoolFundModal] = useState(false);
  const [poolFundLoading, setPoolFundLoading] = useState(false);

  // Filters state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Expanded levels in accordion view
  const [expandedLevels, setExpandedLevels] = useState({});

  // Tree drag-to-scroll refs
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // Load summary list on filter/page change
  useEffect(() => {
    fetchUsers(page);
  }, [page, search, status, level]);

  const fetchUsers = async (targetPage = 1) => {
    setLoading(true);
    try {
      const response = await autopoolService.getIndividualSummary({
        search,
        status,
        level,
        page: targetPage,
        limit: 10,
      });
      setUsers(response.users || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalUsers(response.pagination?.total || 0);
      setPage(response.pagination?.page || 1);
    } catch (error) {
      console.error("Failed to load individual summaries", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId) => {
    setDetailsLoading(true);
    try {
      const response = await autopoolService.getIndividualDetails(userId);
      setSelectedUser(response);
      setExpandedLevels({ 0: true }); // Automatically expand level 0
    } catch (error) {
      console.error("Failed to load user details", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenTree = async () => {
    if (!selectedUser) return;
    setTreeLoading(true);
    setShowTreeModal(true);
    try {
      const response = await autopoolService.getIndividualTree(
        selectedUser.userSummary.userId
      );
      setTreeNodes(response);
    } catch (error) {
      console.error("Failed to load subtree nodes", error);
    } finally {
      setTreeLoading(false);
    }
  };

  const handleOpenPoolFund = async () => {
    if (!selectedUser) return;
    setPoolFundLoading(true);
    setShowPoolFundModal(true);
    try {
      const response = await autopoolService.getUserPoolFund(
        selectedUser.userSummary.userId
      );
      setPoolFundHistory(response);
    } catch (error) {
      console.error("Failed to load pool fund history", error);
    } finally {
      setPoolFundLoading(false);
    }
  };

  const toggleLevel = (lIndex) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [lIndex]: !prev[lIndex],
    }));
  };

  // Build the tree hierarchy from flat list of scoped nodes
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
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit">
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      case "In Progress":
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit">
            <Clock size={12} /> In Progress
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit">
            <HelpCircle size={12} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {!selectedUser ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <AdminPageHeader
              title="Individual Autopool"
              subtitle="Track and inspect level-wise progress and rebirth nodes for individual users"
            />
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search user ID, name, email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-500 font-semibold outline-none focus:border-indigo-500 focus:bg-white transition shadow-sm"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-800 font-semibold outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer shadow-sm"
              >
                <option value="" className="text-slate-800 bg-white font-medium">All Statuses</option>
                <option value="Completed" className="text-slate-800 bg-white font-medium">Completed</option>
                <option value="In Progress" className="text-slate-800 bg-white font-medium">In Progress</option>
                <option value="Pending" className="text-slate-800 bg-white font-medium">Pending</option>
              </select>
            </div>

            <div className="relative">
              <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-800 font-semibold outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer shadow-sm"
              >
                <option value="" className="text-slate-800 bg-white font-medium">All Active Levels</option>
                {[...Array(10).keys()].map((l) => (
                  <option key={l} value={l} className="text-slate-800 bg-white font-medium">
                    Level {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end text-sm text-slate-600 font-bold bg-slate-50/50 px-4 py-2 rounded-xl border border-slate-100 shadow-inner">
              Total Users: <span className="text-indigo-600 font-extrabold ml-1.5 text-base">{totalUsers}</span>
            </div>
          </div>

          {/* Users List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email / Phone</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sponsor</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Level</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rebirths (Comp / Total)</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-medium">
                        Loading autopool summaries...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-medium">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.userId} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 text-sm font-bold text-indigo-600">{u.memberId}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{u.fullName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div>{u.email}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{u.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{u.sponsorId}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">Level {u.currentLevel}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <span className="font-bold text-slate-800">{u.completedRebirthsCount}</span>
                          <span className="text-slate-400"> / {u.totalRebirths}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">{getStatusBadge(u.status)}</td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleSelectUser(u.userId)}
                            className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-bold transition text-xs"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : detailsLoading ? (
        <div className="h-[400px] flex items-center justify-center text-slate-400 font-medium">
          Loading detailed user progress...
        </div>
      ) : (
        /* Selected User Detailed View */
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedUser(null)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Individual Autopool Report</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {selectedUser.userSummary.fullName} ({selectedUser.userSummary.memberId})
              </h2>
            </div>
          </div>

          {/* User Summary Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <User size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">User ID</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedUser.userSummary.memberId}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Withdrawable Balance</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  ${selectedUser.userSummary.withdrawableWalletAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Award size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Pool Fund / Reinvested</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    ${selectedUser.userSummary.poolFundAmount.toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenPoolFund}
                className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-bold transition text-[10px]"
              >
                View History
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Network size={24} />
                </div>
                <div>
                  <p className="text-xs text-indigo-400 font-medium">Subtree Nodes</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedUser.userSummary.totalRebirthsCreated} Rebirths
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenTree}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition text-xs shadow-md shadow-indigo-100"
              >
                View Tree
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium">Current Active Level</p>
              <p className="text-xl font-bold text-slate-800 mt-1">Level {selectedUser.userSummary.currentActiveLevel}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium">Latest Completed Level</p>
              <p className="text-xl font-bold text-slate-800 mt-1">
                {selectedUser.userSummary.latestCompletedLevel !== null ? `Level ${selectedUser.userSummary.latestCompletedLevel}` : "None"}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium">Total Generated Rebirths</p>
              <p className="text-xl font-bold text-indigo-600 mt-1">{selectedUser.userSummary.totalRebirthsCreated}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium">Completed Rebirths</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{selectedUser.userSummary.totalCompletedRebirths}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center col-span-2 md:col-span-1">
              <p className="text-xs text-slate-400 font-medium">Pending Rebirths</p>
              <p className="text-xl font-bold text-slate-500 mt-1">{selectedUser.userSummary.totalPendingRebirths}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Level-wise Autopool Status Accordion */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-indigo-600" /> Level-wise Status
              </h3>
              
              <div className="space-y-3">
                {selectedUser.levelWiseStatus.map((lws, idx) => {
                  const isExpanded = !!expandedLevels[idx];
                  const hasNodes = lws.rebirths.length > 0;
                  
                  return (
                    <div
                      key={idx}
                      className={`bg-white rounded-xl border transition ${
                        isExpanded ? "border-indigo-200 shadow-sm" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Level Header */}
                      <button
                        onClick={() => toggleLevel(idx)}
                        className="w-full flex items-center justify-between px-4 py-3.5"
                      >
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-900">Level {lws.level}</p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Rebirths: {lws.generatedCount} / {lws.requiredCount} required
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(lws.status)}
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </button>

                      {/* Level Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                          {lws.completionDate && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold bg-slate-50 p-2 rounded-lg w-fit">
                              <Calendar size={12} /> Completed On: {formatDate(lws.completionDate).split(",")[0]}
                            </div>
                          )}

                          {!hasNodes ? (
                            <p className="text-xs text-slate-400 italic">No rebirths generated in this level yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {lws.rebirths.map((node) => (
                                <div
                                  key={node._id}
                                  className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col gap-1.5"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-mono font-bold text-indigo-600">
                                      {node.rebirthCode}
                                    </span>
                                    <span
                                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                        node.status === "Completed"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : node.status === "Active"
                                          ? "bg-indigo-100 text-indigo-700"
                                          : "bg-amber-100 text-amber-700"
                                      }`}
                                    >
                                      {node.status}
                                    </span>
                                  </div>

                                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                    <span>Children Filled:</span>
                                    <span className="font-bold text-slate-700">{node.childrenCount} / 3</span>
                                  </div>

                                  {node.childCodes && node.childCodes.length > 0 && (
                                    <div className="text-[10px] text-slate-400">
                                      Children Codes: <span className="font-mono font-semibold text-slate-600">{node.childCodes.join(", ")}</span>
                                    </div>
                                  )}

                                  {node.newRebirthCodes && node.newRebirthCodes.length > 0 && (
                                    <div className="text-[10px] text-slate-400 bg-emerald-50/50 p-1.5 rounded border border-emerald-100/50 mt-1">
                                      Successors: <span className="font-mono font-semibold text-emerald-600">{node.newRebirthCodes.join(", ")}</span>
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

            {/* Flat Rebirth Details Table */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Network size={18} className="text-indigo-600" /> Rebirth Details Table
              </h3>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Rebirth ID</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Level</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Parent</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Children</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Completed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {selectedUser.rebirthDetails.map((node) => (
                        <tr key={node._id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3.5 font-bold font-mono text-indigo-600">{node.rebirthCode}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-700">Level {node.level}</td>
                          <td className="px-4 py-3.5 font-mono text-slate-500">{node.parentCode}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{node.childrenCount} / 3</span>
                              <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
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
                                  ? "bg-emerald-100 text-emerald-700"
                                  : node.status === "Active"
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {node.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 font-medium">
                            {node.completedAt ? formatDate(node.completedAt).split(",")[0] : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Subtree Modal Panel */}
      {showTreeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#020d2e] w-full max-w-6xl h-[85vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Network size={20} className="text-indigo-400" /> 
                  Subtree Visualizer: {selectedUser?.userSummary.fullName} ({selectedUser?.userSummary.memberId})
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Drag to pan, scroll to view their isolated matrix branches. Showing only this user's rebirth nodes.
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
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">
                  Loading individual subtree map...
                </div>
              ) : roots.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">
                  No placed nodes found for this user in the tree.
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
                      <div key={rootNode._id} className="border border-indigo-900/30 bg-indigo-950/20 p-8 rounded-3xl relative">
                        <div className="absolute -top-3 left-6 px-3 py-0.5 rounded bg-indigo-900 border border-indigo-700/50 text-[9px] text-indigo-300 font-bold uppercase tracking-wider">
                          Subtree Root
                        </div>
                        <TreeNode
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
              <span>Click drag to navigate canvas</span>
            </div>
          </div>
        </div>
      )}

      {/* Pool Fund History Modal */}
      {showPoolFundModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden relative">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award size={18} className="text-amber-500" />
                  Pool Fund Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transaction history for {selectedUser?.userSummary.fullName} ({selectedUser?.userSummary.memberId})
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPoolFundModal(false);
                  setPoolFundHistory([]);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded-xl transition shadow-sm border border-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50 p-6">
              {poolFundLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
                  Loading transaction history...
                </div>
              ) : poolFundHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
                  No pool fund transactions found for this user.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rebirth Node</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Level</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {poolFundHistory.map((txn) => (
                        <tr key={txn._id} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {formatDate(txn.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {txn.type.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-black text-amber-600">
                            ${txn.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-indigo-600 font-bold">
                            {txn.completedRebirthId?.nodeCode || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-700 font-bold">
                            {txn.level !== undefined ? `Level ${txn.level}` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              txn.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {txn.status}
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
