const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../apps/user-web/src/pages/member/AutopoolTreePage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF for search
const normalizedContent = content.replace(/\r\n/g, '\n');

// 1. Redesign TreeNode
const oldTreeNode = `/* ── Compact Node ─────────────────────────────────────────────────────────── */
const TreeNode = ({
  node,
  visualChildrenMap,
  treeDepth = 0,
  expandedNodes,
  onToggleExpand,
}) => {
  const children = visualChildrenMap.get(node._id.toString()) || [];
  const childCount = node.autopoolChildrenCount || 0;
  const isCompleted = node.status === "COMPLETED";
  const ownerName =
    node.linkedRebirthNodeId?.ownerUserId?.fullName || "Operational Admin";
  const ownerMemberId =
    node.linkedRebirthNodeId?.ownerUserId?.memberId || node.poolNodeId;
  const isExpanded = expandedNodes.has(node._id.toString());
  const isDepth9 = treeDepth === 9;
  const hasChildren = children.length > 0;
  const showExpandBtn = isDepth9 && hasChildren;
  const renderChildren = hasChildren && (!isDepth9 || isExpanded);

  return (
    <div className="flex flex-col items-center relative hover:z-50 flex-shrink-0">
      <div
        className={\`group relative px-2 py-2 rounded-lg border transition-all duration-200 hover:scale-[1.04] \${
          treeDepth === 0
            ? "bg-gradient-to-br from-amber-500/20 via-yellow-500/5 to-[#091a39]/95 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
            : isCompleted
            ? "bg-linear-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30"
            : "bg-[#091a39]/95 border-amber-500/20"
        } w-[90px] text-center z-20 hover:z-50 hover:border-amber-500/40 flex-shrink-0\`}
      >
        {treeDepth > 0 && (
          <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-500/50 border border-[#08142f] z-30" />
        )}

        <div
          className={\`absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-px rounded-full text-[7px] font-bold uppercase tracking-wider \${
            treeDepth > 0
              ? "bg-amber-600 text-white"
              : "bg-linear-to-r from-amber-400 to-yellow-600 text-white"
          }\`}
        >
          {treeDepth > 0 ? \`D\${treeDepth}\` : "ROOT"}
        </div>

        {isCompleted && (
          <div className="absolute -top-1.5 -right-1 px-1 py-px rounded text-[6px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-500/30">
            ✓
          </div>
        )}

        <div className="mt-2 mx-auto flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-amber-400/80 bg-[#08142f]">
          <svg
            className="w-3.5 h-3.5 text-amber-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <p className="text-[7px] font-mono font-semibold text-amber-200/45 mt-1 truncate leading-none">
          {ownerMemberId}
        </p>
        <p className="text-[8px] font-bold text-amber-100/90 mt-0.5 truncate leading-tight">
          {ownerName}
        </p>
        <span className="inline-block text-[6.5px] text-amber-400 font-mono font-bold bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 mt-1 scale-95">
          Q-Serial: {node.queueSerialNo || "N/A"}
        </span>

        <div className="mt-1.5 flex justify-center gap-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={\`w-2 h-2 rounded-full transition-all \${
                i <= childCount
                  ? "bg-linear-to-tr from-emerald-400 to-teal-500"
                  : "bg-white/8 border border-white/10"
              }\`}
              title={\`\${i <= childCount ? "Filled" : "Empty"}\`}
            />
          ))}
        </div>

        {/* Hover tooltip — high z-index to stay above siblings */}
        <div className="pointer-events-none absolute left-full top-1/2 ml-2 hidden w-[160px] -translate-y-1/2 rounded-xl border border-amber-500/20 bg-[#101d40]/95 p-2 text-left shadow-lg backdrop-blur-md group-hover:block z-[100]">
          <h5 className="text-[10px] font-bold text-white truncate">
            {ownerName}
          </h5>
          <div className="mt-1 space-y-0.5 text-[8px]">
            <div className="flex justify-between">
              <span className="text-amber-100/40">ID</span>
              <span className="text-amber-100/80 font-mono">
                {ownerMemberId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-100/40">Q-Serial</span>
              <span className="text-amber-100/80 font-mono">
                {node.queueSerialNo || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-100/40">Status</span>
              <span
                className={isCompleted ? "text-emerald-300" : "text-amber-300"}
              >
                {node.status || "PENDING"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-100/40">Children</span>
              <span className="text-amber-100/80">{childCount}/3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-100/40">Depth</span>
              <span className="text-amber-100/80">{treeDepth}</span>
            </div>
          </div>
        </div>

        {(renderChildren || showExpandBtn) && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-500 border border-[#08142f] z-30" />
        )}
      </div>

      {showExpandBtn && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(node._id.toString());
          }}
          className="mt-1.5 px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-wider border cursor-pointer bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 z-30"
        >
          {isExpanded ? "▲ Hide" : "▼ Expand"}
        </button>
      )}

      {renderChildren && (
        <div className="flex flex-col items-center w-full mt-6 relative">
          <div className="w-px h-6 bg-amber-500/30 absolute -top-6" />
          <div className="flex justify-center gap-3 md:gap-5 relative w-full pt-3 flex-nowrap">
            {children.length > 1 && (
              <div
                className="absolute top-0 h-px bg-amber-500/20"
                style={{
                  left: \`\${100 / (children.length * 2)}%\`,
                  right: \`\${100 / (children.length * 2)}%\`,
                }}
              />
            )}
            {children.map((child) => (
              <div key={child.node._id} className="relative flex-shrink-0">
                <div className="w-px h-3 bg-amber-500/20 absolute -top-3 left-1/2 -translate-x-1/2" />
                <TreeNode
                  node={child.node}
                  visualChildrenMap={visualChildrenMap}
                  treeDepth={child.depth}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};`;

const newTreeNode = `/* ── Compact Node ─────────────────────────────────────────────────────────── */
const TreeNode = ({
  node,
  visualChildrenMap,
  treeDepth = 0,
  expandedNodes,
  onToggleExpand,
}) => {
  const children = visualChildrenMap.get(node._id.toString()) || [];
  const childCount = node.autopoolChildrenCount || 0;
  const isCompleted = node.status === "COMPLETED";
  const ownerName =
    node.linkedRebirthNodeId?.ownerUserId?.fullName || "Operational Admin";
  const ownerMemberId =
    node.linkedRebirthNodeId?.ownerUserId?.memberId || node.poolNodeId;
  const isExpanded = expandedNodes.has(node._id.toString());
  const isDepth9 = treeDepth === 9;
  const hasChildren = children.length > 0;
  const showExpandBtn = isDepth9 && hasChildren;
  const renderChildren = hasChildren && (!isDepth9 || isExpanded);

  return (
    <div className="flex flex-col items-center relative hover:z-50 flex-shrink-0">
      <div
        className={\`group relative px-2 py-2 rounded-lg border transition-all duration-200 hover:scale-[1.04] \${
          treeDepth === 0
            ? "bg-[#FFF4E5] border-[#F4B860] shadow-[0_0_15px_rgba(244,184,96,0.25)] text-[#111827]"
            : isCompleted
            ? "bg-emerald-50 border-emerald-500/30 text-[#10B981]"
            : "bg-white border-[#E5E7EB] text-[#111827]"
        } w-[90px] text-center z-20 hover:z-50 hover:border-[#F4B860]/40 flex-shrink-0\`}
      >
        {treeDepth > 0 && (
          <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#F4B860] border border-white z-30" />
        )}

        <div
          className={\`absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-px rounded-full text-[7px] font-bold uppercase tracking-wider \${
            treeDepth > 0
              ? "bg-[#111827] text-white"
              : "bg-[#F4B860] text-[#111827] font-bold"
          }\`}
        >
          {treeDepth > 0 ? \`D\${treeDepth}\` : "ROOT"}
        </div>

        {isCompleted && (
          <div className="absolute -top-1.5 -right-1 px-1 py-px rounded text-[6px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-500/20">
            ✓
          </div>
        )}

        <div className="mt-2 mx-auto flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-[#F4B860]/80 bg-[#F8FAFC]">
          <svg
            className="w-3.5 h-3.5 text-[#F4B860]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <p className="text-[7px] font-mono font-semibold text-[#6B7280] mt-1 truncate leading-none">
          {ownerMemberId}
        </p>
        <p className="text-[8px] font-bold text-[#111827] mt-0.5 truncate leading-tight">
          {ownerName}
        </p>
        <span className="inline-block text-[6.5px] text-[#E8A13F] font-mono font-bold bg-[#FFF4E5] px-1 py-0.5 rounded border border-[#F4B860]/20 mt-1 scale-95">
          Q-Serial: {node.queueSerialNo || "N/A"}
        </span>

        <div className="mt-1.5 flex justify-center gap-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={\`w-2 h-2 rounded-full transition-all \${
                i <= childCount
                  ? "bg-linear-to-tr from-emerald-400 to-teal-500"
                  : "bg-[#F3F4F6] border border-[#E5E7EB]"
              }\`}
              title={\`\${i <= childCount ? "Filled" : "Empty"}\`}
            />
          ))}
        </div>

        {/* Hover tooltip — high z-index to stay above siblings */}
        <div className="pointer-events-none absolute left-full top-1/2 ml-2 hidden w-[160px] -translate-y-1/2 rounded-xl border border-[#E5E7EB] bg-white p-2.5 text-left shadow-lg group-hover:block z-[100] text-[#111827]">
          <h5 className="text-[10px] font-bold text-[#111827] truncate">
            {ownerName}
          </h5>
          <div className="mt-1 space-y-0.5 text-[8px]">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">ID</span>
              <span className="text-[#111827] font-mono font-semibold">
                {ownerMemberId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Q-Serial</span>
              <span className="text-[#111827] font-mono font-semibold">
                {node.queueSerialNo || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Status</span>
              <span
                className={isCompleted ? "text-[#10B981] font-bold" : "text-[#F59E0B] font-bold"}
              >
                {node.status || "PENDING"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Children</span>
              <span className="text-[#111827] font-bold">{childCount}/3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Depth</span>
              <span className="text-[#111827] font-bold">{treeDepth}</span>
            </div>
          </div>
        </div>

        {(renderChildren || showExpandBtn) && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#F4B860] border border-white z-30" />
        )}
      </div>

      {showExpandBtn && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(node._id.toString());
          }}
          className="mt-1.5 px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-wider border cursor-pointer bg-[#FFF4E5] text-[#E8A13F] border border-[#F4B860]/20 hover:bg-[#FFF4E5]/80 z-30"
        >
          {isExpanded ? "▲ Hide" : "▼ Expand"}
        </button>
      )}

      {renderChildren && (
        <div className="flex flex-col items-center w-full mt-6 relative">
          <div className="w-px h-6 bg-[#E5E7EB] absolute -top-6" />
          <div className="flex justify-center gap-3 md:gap-5 relative w-full pt-3 flex-nowrap">
            {children.length > 1 && (
              <div
                className="absolute top-0 h-px bg-[#E5E7EB]"
                style={{
                  left: \`\${100 / (children.length * 2)}%\`,
                  right: \`\${100 / (children.length * 2)}%\`,
                }}
              />
            )}
            {children.map((child) => (
              <div key={child.node._id} className="relative flex-shrink-0">
                <div className="w-px h-3 bg-[#E5E7EB] absolute -top-3 left-1/2 -translate-x-1/2" />
                <TreeNode
                  node={child.node}
                  visualChildrenMap={visualChildrenMap}
                  treeDepth={child.depth}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};`;

// 2. Redesign Page layout
const oldReturn = `  return (
    <div className="flex flex-col space-y-3 md:space-y-4 h-full">
      <div className="space-y-1 px-4 md:px-0">
        <div className="h-0.5 w-16 rounded-full bg-linear-to-r from-amber-300 via-amber-500 to-yellow-200" />
        <h1 className="text-xl font-bold leading-none text-white md:text-2xl">
          Operational Admin Auto Pool Tree
        </h1>
        <p className="max-w-2xl text-xs text-amber-100/70">
          Visualize your own rebirth matrix, placed nodes, completed nodes, and
          children under your admin tree.
        </p>
        <div className="flex items-center gap-2 mt-1">
          {data.admin?.name && (
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-200/40">
              {data.admin.name} • {data.admin.adminId}
            </span>
          )}
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-200/30 bg-[#091a39] px-2 py-0.5 rounded border border-amber-500/10">
            D0 · D3 · D9
          </span>
        </div>
      </div>

      {/* Rebirth stats at top */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 px-4 md:px-0">
        <div className="bg-[#091a39]/95 p-2.5 md:p-3 rounded-xl border border-amber-500/10">
          <p className="text-[8px] font-bold text-amber-200/50 uppercase tracking-widest">
            Total Nodes
          </p>
          <p className="text-sm font-black text-white mt-0.5">
            {data.summary.totalNodes ?? data.nodes.length}
          </p>
        </div>
        <div className="bg-[#091a39]/95 p-2.5 md:p-3 rounded-xl border border-amber-500/10">
          <p className="text-[8px] font-bold text-amber-200/50 uppercase tracking-widest">
            Completed
          </p>
          <p className="text-sm font-black text-emerald-400 mt-0.5">
            {data.summary.completedNodes ??
              data.nodes.filter((n) => n.status === "COMPLETED").length}
          </p>
        </div>
        <div className="bg-[#091a39]/95 p-2.5 md:p-3 rounded-xl border border-amber-500/10">
          <p className="text-[8px] font-bold text-amber-200/50 uppercase tracking-widest">
            Pending/Placed
          </p>
          <p className="text-sm font-black text-amber-400 mt-0.5">
            {data.summary.pendingPlacedNodes ??
              data.nodes.filter(
                (n) => n.status === "PENDING" || n.status === "PLACED",
              ).length}
          </p>
        </div>
        <div className="bg-[#091a39]/95 p-2.5 md:p-3 rounded-xl border border-amber-500/10">
          <p className="text-[8px] font-bold text-amber-200/50 uppercase tracking-widest">
            Rebirths
          </p>
          <p className="text-sm font-black text-indigo-400 mt-0.5">
            {data.summary.activeRebirths ?? data.completions.length}
          </p>
        </div>
      </div>

      {/* 4 Isolated Fund Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-4 md:px-0">
        {/* Card 1: Withdrawable Autopool Fund */}
        <div className="relative bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-[#091a39]/95 p-4 rounded-2xl border border-emerald-500/20 shadow-lg backdrop-blur-md overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-[10px] text-emerald-200/50 uppercase tracking-widest font-bold">Withdrawable Autopool</p>
              <p className="text-xl font-black text-emerald-400 mt-0.5">
                \${(isolatedFunds?.withdrawableAutopoolFund || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Pool Fund */}
        <div className="relative bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-[#091a39]/95 p-4 rounded-2xl border border-amber-500/20 shadow-lg backdrop-blur-md overflow-hidden group flex items-center justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Award size={20} />
            </div>
            <div>
              <p className="text-[10px] text-amber-200/50 uppercase tracking-widest font-bold">Pool Fund Total</p>
              <p className="text-xl font-black text-amber-300 mt-0.5">
                \${(isolatedFunds?.poolFundTotal || 0).toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenPoolFund}
            className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 font-bold transition text-[9px] z-10 cursor-pointer"
          >
            History
          </button>
        </div>

        {/* Card 3: Reinvestment Fund */}
        <div className="relative bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-[#091a39]/95 p-4 rounded-2xl border border-blue-500/20 shadow-lg backdrop-blur-md overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/>
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-blue-200/50 uppercase tracking-widest font-bold">Reinvestment Fund</p>
              <p className="text-xl font-black text-blue-300 mt-0.5">
                \${(isolatedFunds?.reinvestmentFundTotal || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Sponsor + Level Income */}
        <div className="relative bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-[#091a39]/95 p-4 rounded-2xl border border-fuchsia-500/20 shadow-lg backdrop-blur-md overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
              <svg className="w-5 h-5 text-fuchsia-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.25z"/>
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-fuchsia-200/50 uppercase tracking-widest font-bold">Sponsor + Level Income</p>
              <p className="text-xl font-black text-fuchsia-400 mt-0.5">
                \${(wallet?.withdrawableFund || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Level Progress & Upgrade IDs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 px-4 md:px-0">
        {/* Progress Bar Column */}
        <div className="lg:col-span-2 bg-[#091a39]/95 p-4 rounded-2xl border border-amber-500/10 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200/60">Active Autopool Level Progress</h3>
            <p className="text-[10px] text-amber-100/40 mt-0.5">Track your progress toward completing your active autopool levels.</p>
            <p className="text-[10px] text-cyan-200/60 mt-1 font-semibold">
              Latest completed level: {isolatedFunds.completedAutopoolLevel !== null ? \`Level \${isolatedFunds.completedAutopoolLevel}\` : "None"}
            </p>
          </div>
          
          <div className="mt-4 space-y-3">
            {data.completions && data.completions.length > 0 ? (
              data.completions.slice(0, 3).map((comp) => {
                const percent = Math.min(Math.round((comp.completedNodeCount / comp.expectedNodeCount) * 100), 100);
                return (
                  <div key={comp._id || comp.autoPoolNumber} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-amber-200/90">Autopool Level {comp.autoPoolNumber}</span>
                      <span className="font-mono text-amber-400">{comp.completedNodeCount}/{comp.expectedNodeCount} Rebirths ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#050b1d] overflow-hidden p-px border border-white/5">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500" 
                        style={{ width: \`\${percent}%\` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-amber-100/30">
                No active level progress available. Complete standard deposits to begin.
              </div>
            )}
          </div>
        </div>

        {/* Upgrade/Alias IDs Column */}
        <div className="bg-[#091a39]/95 p-4 rounded-2xl border border-amber-500/10 shadow-lg backdrop-blur-md flex flex-col">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-200/60">My Alias / Upgrade IDs</h3>
              <p className="text-[9px] text-amber-100/40 mt-0.5">Created automatically from Level 4+ completion</p>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
              Total: {upgradeIds.length}
            </span>
          </div>

          <div className="mt-3 flex-1 max-h-[120px] overflow-auto pr-1 space-y-1.5 scrollbar-thin">
            {upgradeIds && upgradeIds.length > 0 ? (
              upgradeIds.map((item) => (
                <div key={item._id} className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-black/20 border border-white/5">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">{item.aliasMemberId || item.aliasId}</span>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Level {item.createdFromAutopoolLevel ?? item.sourceAutopoolLevel} Complete
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center py-6 text-center text-[10px] text-amber-100/30 font-medium">
                No upgrade/alias IDs generated yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onMouseDown={onDown}
        onMouseLeave={onUp}
        onMouseUp={onUp}
        onMouseMove={onMove}
        className={\`relative bg-[#050b1d] rounded-2xl border border-amber-500/10 overflow-auto h-[400px] md:h-[calc(100vh-240px)] shadow-[inset_0_1px_6px_rgba(0,0,0,0.2)] \${drag.active ? "cursor-grabbing" : "cursor-grab"} select-none scroll-smooth\`}
      >
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#f59e0b 0.5px, transparent 0.5px)",
            backgroundSize: "20px 20px",
          }}
        ></div>

        {/* Large Scrollable Canvas Wrapper */}
        <div 
          className="w-[2400px] h-[1600px] py-16 px-12 text-center flex flex-col items-center justify-start relative"
          style={{ zoom: zoom }}
        >
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-200/40">
              <div className="w-10 h-10 rounded-full border-[3px] border-amber-500/10 border-t-amber-500 animate-spin"></div>
              <p className="mt-3 font-bold tracking-wide uppercase text-[10px]">
                Mapping matrix…
              </p>
            </div>
          ) : roots.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center max-w-sm mx-auto px-4">
              <div className="w-12 h-12 bg-[#091a39] rounded-xl shadow-lg flex items-center justify-center text-2xl mb-3 border border-amber-500/10">
                🧬
              </div>
              <h3 className="text-base font-black text-white mb-1">
                No Operational Tree Nodes
              </h3>
              <p className="text-[11px] text-amber-100/50 leading-relaxed">
                Your scoped rebirth tree has no placed nodes yet.
              </p>
            </div>
          ) : (
            <div className="inline-flex flex-col gap-6 items-center text-left">
              {roots.map((r, i) => (
                <div key={r.node._id} className="flex flex-col items-center">
                  {i > 0 && (
                    <div className="w-full h-px bg-linear-to-r from-transparent via-amber-500/10 to-transparent my-3" />
                  )}
                  <TreeNode
                    node={r.node}
                    visualChildrenMap={visualChildrenMap}
                    treeDepth={r.depth}
                    expandedNodes={expandedNodes}
                    onToggleExpand={onToggleExpand}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Zoom Control Panel */}
        {!loading && roots.length > 0 && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute top-4 left-4 z-30 flex items-center gap-1 bg-[#091a39]/95 backdrop-blur-xs p-1.5 rounded-xl border border-amber-500/20 shadow-lg"
          >
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 rounded-lg hover:bg-amber-500/10 flex items-center justify-center text-amber-200 font-bold transition-all cursor-pointer"
              title="Zoom Out"
            >
              —
            </button>
            <span className="text-[10px] font-bold text-amber-200/80 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-lg hover:bg-amber-500/10 flex items-center justify-center text-amber-200 font-bold transition-all cursor-pointer"
              title="Zoom In"
            >
              ＋
            </button>
            <div className="w-px h-4 bg-amber-500/20 mx-1" />
            <button
              onClick={handleZoomReset}
              className="px-2 py-1 text-[9px] font-bold text-amber-400 hover:bg-amber-500/20 rounded transition-all cursor-pointer"
              title="Reset Zoom"
            >
              RESET
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center md:justify-between items-center gap-3 px-3 py-2 bg-[#091a39]/95 border border-amber-500/10 rounded-xl">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-[8px] font-bold text-amber-200/50 uppercase">
              Root
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-[8px] font-bold text-amber-200/50 uppercase">
              Filled
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white/8 border border-white/10"></div>
            <span className="text-[8px] font-bold text-amber-200/50 uppercase">
              Empty
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-bold text-emerald-400">✓</span>
            <span className="text-[8px] font-bold text-amber-200/50 uppercase">
              Done
            </span>
          </div>
        </div>
        <div className="text-[8px] text-amber-200/30 font-bold uppercase tracking-widest">
          Nodes: {data.summary.totalNodes ?? data.nodes.length} • Drag to pan •
          Click D9 to expand
        </div>
      </div>

      {/* Pool Fund History Modal */}
      {showPoolFundModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#091a39] w-full max-w-4xl h-[80vh] rounded-3xl border border-amber-500/20 shadow-2xl flex flex-col overflow-hidden relative">
            <div className="px-6 py-4 border-b border-amber-500/10 flex items-center justify-between bg-black/20">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  My Pool Fund Ledger
                </h3>
                <p className="text-xs text-amber-200/50 mt-0.5">
                  Complete transaction history for your Autopool reinvestments
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPoolFundModal(false);
                  setPoolFundHistory([]);
                }}
                className="p-2 text-amber-200/50 hover:text-amber-400 bg-white/5 hover:bg-white/10 rounded-xl transition shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-black/10 p-6">
              {poolFundLoading ? (
                <div className="h-full flex items-center justify-center text-amber-200/50 font-medium text-sm">
                  Loading transaction history...
                </div>
              ) : poolFundHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-amber-200/50 font-medium text-sm">
                  No pool fund transactions found yet.
                </div>
              ) : (
                <div className="bg-[#091a39] rounded-2xl border border-amber-500/10 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/20 border-b border-amber-500/10">
                        <th className="px-4 py-3 text-[10px] font-bold text-amber-200/40 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-amber-200/40 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-amber-200/40 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-amber-200/40 uppercase tracking-wider">Rebirth Node</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-amber-200/40 uppercase tracking-wider">Level</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-amber-200/40 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-500/5">
                      {poolFundHistory.map((txn) => (
                        <tr key={txn._id} className="hover:bg-white/5 transition">
                          <td className="px-4 py-3 text-xs text-amber-100/60">
                            {formatDate(txn.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/20 text-amber-100/80 border border-amber-500/10">
                              {txn.type.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-black text-amber-400">
                            \${txn.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-cyan-400 font-bold">
                            {txn.completedRebirthId?.nodeCode || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-amber-100/90 font-bold">
                            {txn.level !== undefined ? \`Level \${txn.level}\` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={\`text-[10px] font-bold uppercase px-2 py-0.5 rounded \${
                              txn.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }\`}>
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
  );`;

const newReturn = `  return (
    <div className="flex flex-col space-y-3 md:space-y-4 h-full">
      <div className="space-y-1 px-4 md:px-0">
        <div className="h-0.5 w-16 rounded-full bg-gradient-to-r from-[#F4B860] to-[#E8A13F]" />
        <h1 className="text-xl font-bold leading-none text-[#111827] md:text-2xl">
          Operational Admin Auto Pool Tree
        </h1>
        <p className="max-w-2xl text-xs text-[#6B7280]">
          Visualize your own rebirth matrix, placed nodes, completed nodes, and
          children under your admin tree.
        </p>
        <div className="flex items-center gap-2 mt-1">
          {data.admin?.name && (
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#6B7280]">
              {data.admin.name} • {data.admin.adminId}
            </span>
          )}
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#E8A13F] bg-[#FFF4E5] px-2 py-0.5 rounded border border-[#F4B860]/20">
            D0 · D3 · D9
          </span>
        </div>
      </div>

      {/* Rebirth stats at top */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 px-4 md:px-0">
        <div className="bg-white p-2.5 md:p-3 rounded-xl border border-[#E5E7EB] shadow-sm">
          <p className="text-[8px] font-bold text-[#6B7280] uppercase tracking-widest">
            Total Nodes
          </p>
          <p className="text-sm font-black text-[#111827] mt-0.5">
            {data.summary.totalNodes ?? data.nodes.length}
          </p>
        </div>
        <div className="bg-white p-2.5 md:p-3 rounded-xl border border-[#E5E7EB] shadow-sm">
          <p className="text-[8px] font-bold text-[#6B7280] uppercase tracking-widest">
            Completed
          </p>
          <p className="text-sm font-black text-[#10B981] mt-0.5">
            {data.summary.completedNodes ??
              data.nodes.filter((n) => n.status === "COMPLETED").length}
          </p>
        </div>
        <div className="bg-white p-2.5 md:p-3 rounded-xl border border-[#E5E7EB] shadow-sm">
          <p className="text-[8px] font-bold text-[#6B7280] uppercase tracking-widest">
            Pending/Placed
          </p>
          <p className="text-sm font-black text-[#F59E0B] mt-0.5">
            {data.summary.pendingPlacedNodes ??
              data.nodes.filter(
                (n) => n.status === "PENDING" || n.status === "PLACED",
              ).length}
          </p>
        </div>
        <div className="bg-white p-2.5 md:p-3 rounded-xl border border-[#E5E7EB] shadow-sm">
          <p className="text-[8px] font-bold text-[#6B7280] uppercase tracking-widest">
            Rebirths
          </p>
          <p className="text-sm font-black text-[#F4B860] mt-0.5">
            {data.summary.activeRebirths ?? data.completions.length}
          </p>
        </div>
      </div>

      {/* 4 Isolated Fund Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-4 md:px-0">
        {/* Card 1: Withdrawable Autopool Fund */}
        <div className="relative bg-emerald-50 border border-emerald-200/60 p-4 rounded-2xl shadow-sm overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-[10px] text-emerald-700 uppercase tracking-widest font-bold">Withdrawable Autopool</p>
              <p className="text-xl font-black text-emerald-800 mt-0.5">
                \${(isolatedFunds?.withdrawableAutopoolFund || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Pool Fund */}
        <div className="relative bg-[#FFF4E5] border border-[#F4B860]/30 p-4 rounded-2xl shadow-sm overflow-hidden group flex items-center justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4B860]/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] flex items-center justify-center text-[#E8A13F]">
              <Award size={20} />
            </div>
            <div>
              <p className="text-[10px] text-[#E8A13F] uppercase tracking-widest font-bold">Pool Fund Total</p>
              <p className="text-xl font-black text-[#111827] mt-0.5">
                \${(isolatedFunds?.poolFundTotal || 0).toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenPoolFund}
            className="px-2.5 py-1 bg-[#F4B860] hover:bg-[#E8A13F] text-white rounded-lg border border-[#E8A13F]/50 shadow-sm font-bold transition text-[9px] z-10 cursor-pointer"
          >
            History
          </button>
        </div>

        {/* Card 3: Reinvestment Fund */}
        <div className="relative bg-blue-50 border border-blue-200/60 p-4 rounded-2xl shadow-sm overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/>
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-blue-700 uppercase tracking-widest font-bold">Reinvestment Fund</p>
              <p className="text-xl font-black text-blue-800 mt-0.5">
                \${(isolatedFunds?.reinvestmentFundTotal || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Sponsor + Level Income */}
        <div className="relative bg-purple-50 border border-purple-200/60 p-4 rounded-2xl shadow-sm overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.25z"/>
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-purple-700 uppercase tracking-widest font-bold">Sponsor + Level Income</p>
              <p className="text-xl font-black text-purple-800 mt-0.5">
                \${(wallet?.withdrawableFund || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Level Progress & Upgrade IDs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 px-4 md:px-0">
        {/* Progress Bar Column */}
        <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">Active Autopool Level Progress</h3>
            <p className="text-[10px] text-[#6B7280] mt-0.5">Track your progress toward completing your active autopool levels.</p>
            <p className="text-[10px] text-[#F4B860] mt-1 font-bold">
              Latest completed level: {isolatedFunds.completedAutopoolLevel !== null ? \`Level \${isolatedFunds.completedAutopoolLevel}\` : "None"}
            </p>
          </div>
          
          <div className="mt-4 space-y-3">
            {data.completions && data.completions.length > 0 ? (
              data.completions.slice(0, 3).map((comp) => {
                const percent = Math.min(Math.round((comp.completedNodeCount / comp.expectedNodeCount) * 100), 100);
                return (
                  <div key={comp._id || comp.autoPoolNumber} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-[#111827]">Autopool Level {comp.autoPoolNumber}</span>
                      <span className="font-mono text-[#F4B860] font-bold">{comp.completedNodeCount}/{comp.expectedNodeCount} Rebirths ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F3F4F6] overflow-hidden p-px border border-[#E5E7EB]">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-[#F4B860] to-[#E8A13F] transition-all duration-500" 
                        style={{ width: \`\${percent}%\` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-[#9CA3AF]">
                No active level progress available. Complete standard deposits to begin.
              </div>
            )}
          </div>
        </div>

        {/* Upgrade/Alias IDs Column */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">My Alias / Upgrade IDs</h3>
              <p className="text-[9px] text-[#6B7280] mt-0.5">Created automatically from Level 4+ completion</p>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-bold bg-[#FFF4E5] text-[#E8A13F] rounded-full border border-[#F4B860]/20">
              Total: {upgradeIds.length}
            </span>
          </div>

          <div className="mt-3 flex-1 max-h-[120px] overflow-auto pr-1 space-y-1.5 scrollbar-thin">
            {upgradeIds && upgradeIds.length > 0 ? (
              upgradeIds.map((item) => (
                <div key={item._id} className="flex justify-between items-center px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB]">
                  <span className="text-[10px] font-mono text-[#111827] font-bold">{item.aliasMemberId || item.aliasId}</span>
                  <span className="text-[9px] font-bold text-[#10B981] uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-[#10B981]/25">
                    Level {item.createdFromAutopoolLevel ?? item.sourceAutopoolLevel} Complete
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center py-6 text-center text-[10px] text-[#9CA3AF] font-medium">
                No upgrade/alias IDs generated yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onMouseDown={onDown}
        onMouseLeave={onUp}
        onMouseUp={onUp}
        onMouseMove={onMove}
        className={\`relative bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB] overflow-auto h-[400px] md:h-[calc(100vh-240px)] shadow-inner \${drag.active ? "cursor-grabbing" : "cursor-grab"} select-none scroll-smooth\`}
      >
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#F4B860 0.5px, transparent 0.5px)",
            backgroundSize: "20px 20px",
          }}
        ></div>

        {/* Large Scrollable Canvas Wrapper */}
        <div 
          className="w-[2400px] h-[1600px] py-16 px-12 text-center flex flex-col items-center justify-start relative"
          style={{ zoom: zoom }}
        >
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6B7280]">
              <div className="w-10 h-10 rounded-full border-[3px] border-[#F4B860]/10 border-t-[#F4B860] animate-spin"></div>
              <p className="mt-3 font-bold tracking-wide uppercase text-[10px]">
                Mapping matrix…
              </p>
            </div>
          ) : roots.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center max-w-sm mx-auto px-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center text-2xl mb-3 border border-[#E5E7EB]">
                🧬
              </div>
              <h3 className="text-base font-black text-[#111827] mb-1">
                No Operational Tree Nodes
              </h3>
              <p className="text-[11px] text-[#6B7280] leading-relaxed">
                Your scoped rebirth tree has no placed nodes yet.
              </p>
            </div>
          ) : (
            <div className="inline-flex flex-col gap-6 items-center text-left">
              {roots.map((r, i) => (
                <div key={r.node._id} className="flex flex-col items-center">
                  {i > 0 && (
                    <div className="w-full h-px bg-linear-to-r from-transparent via-[#E5E7EB] to-transparent my-3" />
                  )}
                  <TreeNode
                    node={r.node}
                    visualChildrenMap={visualChildrenMap}
                    treeDepth={r.depth}
                    expandedNodes={expandedNodes}
                    onToggleExpand={onToggleExpand}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Zoom Control Panel */}
        {!loading && roots.length > 0 && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute top-4 left-4 z-30 flex items-center gap-1 bg-white p-1.5 rounded-xl border border-[#E5E7EB] shadow-md"
          >
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 rounded-lg hover:bg-[#FFF4E5] flex items-center justify-center text-[#6B7280] hover:text-[#111827] font-bold transition-all cursor-pointer"
              title="Zoom Out"
            >
              —
            </button>
            <span className="text-[10px] font-bold text-[#111827] min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-lg hover:bg-[#FFF4E5] flex items-center justify-center text-[#6B7280] hover:text-[#111827] font-bold transition-all cursor-pointer"
              title="Zoom In"
            >
              ＋
            </button>
            <div className="w-px h-4 bg-[#E5E7EB] mx-1" />
            <button
              onClick={handleZoomReset}
              className="px-2 py-1 text-[9px] font-bold text-[#F4B860] hover:bg-[#FFF4E5] rounded transition-all cursor-pointer"
              title="Reset Zoom"
            >
              RESET
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center md:justify-between items-center gap-3 px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#F4B860]"></div>
            <span className="text-[8px] font-bold text-[#6B7280] uppercase">
              Root
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-[8px] font-bold text-[#6B7280] uppercase">
              Filled
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#F3F4F6] border border-[#E5E7EB]"></div>
            <span className="text-[8px] font-bold text-[#6B7280] uppercase">
              Empty
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-bold text-emerald-500">✓</span>
            <span className="text-[8px] font-bold text-[#6B7280] uppercase">
              Done
            </span>
          </div>
        </div>
        <div className="text-[8px] text-[#9CA3AF] font-bold uppercase tracking-widest">
          Nodes: {data.summary.totalNodes ?? data.nodes.length} • Drag to pan •
          Click D9 to expand
        </div>
      </div>

      {/* Pool Fund History Modal */}
      {showPoolFundModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl border border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden relative">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                  <Award size={18} className="text-[#F4B860]" />
                  My Pool Fund Ledger
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Complete transaction history for your Autopool reinvestments
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPoolFundModal(false);
                  setPoolFundHistory([]);
                }}
                className="p-2 text-[#6B7280] hover:text-[#111827] bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl transition shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-[#F8FAFC] p-6">
              {poolFundLoading ? (
                <div className="h-full flex items-center justify-center text-[#6B7280] font-medium text-sm">
                  Loading transaction history...
                </div>
              ) : poolFundHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#6B7280] font-medium text-sm">
                  No pool fund transactions found yet.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
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
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {poolFundHistory.map((txn) => (
                        <tr key={txn._id} className="hover:bg-[#FFF4E5] transition">
                          <td className="px-4 py-3 text-xs text-[#6B7280]">
                            {formatDate(txn.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB]">
                              {txn.type.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-black text-[#E8A13F]">
                            \${txn.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-[#F4B860] font-bold">
                            {txn.completedRebirthId?.nodeCode || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#111827] font-bold">
                            {txn.level !== undefined ? \`Level \${txn.level}\` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={\`text-[10px] font-bold uppercase px-2 py-0.5 rounded \${
                                txn.status === "COMPLETED"
                                  ? "bg-emerald-50 text-[#10B981] border border-[#10B981]/25"
                                  : "bg-amber-50 text-[#F59E0B] border border-[#F59E0B]/25"
                              }\`}>
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
  );`;

// Exact replace
content = normalizedContent.replace(oldTreeNode, newTreeNode);
content = content.replace(oldReturn, newReturn);

// Save back
fs.writeFileSync(filePath, content, 'utf8');
console.log("Success! Normalized CRLF and replaced tree content programmatically.");
