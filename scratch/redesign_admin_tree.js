const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../apps/admin-web/src/pages/autopool/AutoPoolTreePage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF
const normalizedContent = content.replace(/\r\n/g, '\n');

// 1. Redesign TreeNode
const oldTreeNode = `const TreeNode = ({ node, childrenMap, depth = 0, maxDepth = 3 }) => {
  const children = childrenMap.get(node._id.toString()) || [];

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        className={\`group relative p-2 rounded-2xl border transition-all duration-300 hover:scale-105 \${
          node.status === "COMPLETED"
            ? "bg-linear-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-emerald-100"
            : "bg-white border-slate-200 shadow-slate-100"
        } shadow-xl min-w-50 text-center z-20 hover:shadow-2xl hover:border-indigo-300\`}
      >
        {/* Connection Dot - Top */}
        {depth > 0 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-300 border-2 border-white z-30" />
        )}

        {/* Badge */}
        <div
          className={\`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm \${
            node.parentNodeId
              ? "bg-indigo-600 text-white"
              : "bg-amber-500 text-white"
          }\`}
        >
          {node.parentNodeId ? \`LEVEL \${depth}\` : "ROOT NODE"}
        </div>

        {/* Content */}
        <div className="mt-2">
          <h4 className="font-black text-slate-900 text-lg leading-tight tracking-tight">
            {node.poolNodeId}
          </h4>
          <div className="flex flex-col items-center justify-center gap-1 mt-1">
            <p className="text-xs text-slate-600 font-semibold truncate max-w-30">
              {node.linkedRebirthNodeId?.ownerUserId?.fullName || "Anonymous"}
            </p>
            <span className="text-[9px] text-indigo-600 font-mono font-bold bg-indigo-50/80 px-2 py-0.5 rounded-full border border-indigo-100/50">
              Q-Serial: {node.queueSerialNo || "N/A"}
            </span>
          </div>
        </div>

        {/* Children Status Dots */}
        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={\`w-3 h-3 rounded-full border-2 border-white shadow-sm transition-all duration-500 \${
                i <= (node.autopoolChildrenCount || 0)
                  ? "bg-linear-to-tr from-emerald-400 to-teal-500 scale-110"
                  : "bg-slate-100"
              }\`}
              title={\`Position \${i}: \${i <= (node.autopoolChildrenCount || 0) ? "Filled" : "Empty"}\`}
            />
          ))}
        </div>

        {/* Connection Dot - Bottom */}
        {children.length > 0 && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white z-30 group-hover:scale-125 transition-transform" />
        )}
      </div>

      {/* Recursive Children Rendering */}
      {children.length > 0 && depth < maxDepth && (
        <div className="flex flex-col items-center w-full mt-12 relative">
          {/* Vertical line from parent to horizontal bar */}
          <div className="w-0.5 h-12 bg-linear-to-b from-indigo-500 to-slate-300 absolute -top-12" />

          <div className="flex justify-center gap-24 relative w-full pt-6">
            {/* Horizontal connection bar */}
            {children.length > 1 && (
              <div
                className="absolute top-0 h-0.5 bg-slate-300 rounded-full"
                style={{
                  left: \`\${150 / (children.length * 2)}%\`,
                  right: \`\${150 / (children.length * 2)}%\`,
                }}
              />
            )}

            {children.map((child) => (
              <div key={child._id} className="relative">
                {/* Vertical line from horizontal bar to child */}
                <div className="w-0.5 h-6 bg-slate-300 absolute -top-6 left-1/2 -translate-x-1/2" />
                <TreeNode
                  node={child}
                  childrenMap={childrenMap}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};`;

const newTreeNode = `const TreeNode = ({ node, childrenMap, depth = 0, maxDepth = 3 }) => {
  const children = childrenMap.get(node._id.toString()) || [];

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        className={\`group relative p-2.5 rounded-2xl border transition-all duration-300 hover:scale-105 \${
          node.status === "COMPLETED"
            ? "bg-emerald-50 border-emerald-500/30 text-[#10B981]"
            : "bg-white border-[#E5E7EB] text-[#111827]"
        } shadow-sm min-w-50 text-center z-20 hover:border-[#F4B860]/45\`}
      >
        {/* Connection Dot - Top */}
        {depth > 0 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#F4B860] border-2 border-white z-30" />
        )}

        {/* Badge */}
        <div
          className={\`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm \${
            node.parentNodeId
              ? "bg-[#111827] text-white"
              : "bg-[#F4B860] text-[#111827] font-bold"
          }\`}
        >
          {node.parentNodeId ? \`LEVEL \${depth}\` : "ROOT NODE"}
        </div>

        {/* Content */}
        <div className="mt-2">
          <h4 className="font-black text-[#111827] text-lg leading-tight tracking-tight">
            {node.poolNodeId}
          </h4>
          <div className="flex flex-col items-center justify-center gap-1 mt-1">
            <p className="text-xs text-[#6B7280] font-semibold truncate max-w-30">
              {node.linkedRebirthNodeId?.ownerUserId?.fullName || "Anonymous"}
            </p>
            <span className="text-[9px] text-[#E8A13F] font-mono font-bold bg-[#FFF4E5] px-2 py-0.5 rounded-full border border-[#F4B860]/20">
              Q-Serial: {node.queueSerialNo || "N/A"}
            </span>
          </div>
        </div>

        {/* Children Status Dots */}
        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={\`w-3 h-3 rounded-full border-2 border-white shadow-sm transition-all duration-500 \${
                i <= (node.autopoolChildrenCount || 0)
                  ? "bg-linear-to-tr from-emerald-400 to-teal-500 scale-110"
                  : "bg-[#F3F4F6]"
              }\`}
              title={\`Position \${i}: \${i <= (node.autopoolChildrenCount || 0) ? "Filled" : "Empty"}\`}
            />
          ))}
        </div>

        {/* Connection Dot - Bottom */}
        {children.length > 0 && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#F4B860] border-2 border-white z-30 group-hover:scale-125 transition-transform" />
        )}
      </div>

      {/* Recursive Children Rendering */}
      {children.length > 0 && depth < maxDepth && (
        <div className="flex flex-col items-center w-full mt-12 relative">
          {/* Vertical line from parent to horizontal bar */}
          <div className="w-0.5 h-12 bg-[#E5E7EB] absolute -top-12" />

          <div className="flex justify-center gap-24 relative w-full pt-6">
            {/* Horizontal connection bar */}
            {children.length > 1 && (
              <div
                className="absolute top-0 h-0.5 bg-[#E5E7EB] rounded-full"
                style={{
                  left: \`\${150 / (children.length * 2)}%\`,
                  right: \`\${150 / (children.length * 2)}%\`,
                }}
              />
            )}

            {children.map((child) => (
              <div key={child._id} className="relative">
                {/* Vertical line from horizontal bar to child */}
                <div className="w-0.5 h-6 bg-[#E5E7EB] absolute -top-6 left-1/2 -translate-x-1/2" />
                <TreeNode
                  node={child}
                  childrenMap={childrenMap}
                  depth={depth + 1}
                  maxDepth={maxDepth}
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
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AdminPageHeader
          title={
            admin?.role && admin.role.toLowerCase() !== "superadmin"
              ? "Operational Admin Auto Pool Tree"
              : "Auto Pool Visualizer"
          }
          subtitle={
            admin?.role && admin.role.toLowerCase() !== "superadmin"
              ? "Your scoped rebirth matrix and connected placement tree"
              : "Interactive 3x3 global matrix hierarchy tracking"
          }
        />
        <div className="flex items-center gap-3">
          {admin?.role && admin.role.toLowerCase() === "superadmin" && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Root:</span>
              <input
                value={rootCode}
                onChange={(e) => setRootCode(e.target.value.trim())}
                className="w-40 text-xs font-bold text-indigo-700 bg-transparent outline-none"
                placeholder="BKS000000-0.1"
              />
            </div>
          )}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Depth:</span>
            <select 
              value={maxDepth} 
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="text-xs font-bold text-indigo-700 bg-transparent outline-none cursor-pointer"
            >
              <option value={1}>1 Level</option>
              <option value={2}>2 Levels</option>
              <option value={3}>3 Levels</option>
              <option value={4}>4 Levels</option>
              <option value={5}>5 Levels</option>
              <option value={6}>6 Levels</option>
              <option value={9}>9 Levels</option>
              <option value={15}>15 Levels</option>
              <option value={999}>All Levels</option>
            </select>
          </div>
          <div className="flex items-center gap-1 bg-white px-1.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))}
              className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold transition-all cursor-pointer"
              title="Zoom Out"
            >
              —
            </button>
            <span className="text-[10px] font-bold text-slate-500 min-w-9 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
              className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold transition-all cursor-pointer"
              title="Zoom In"
            >
              ＋
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
              onClick={() => setZoom(1)}
              className="px-2 py-1 text-[9px] font-bold text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer"
              title="Reset Zoom"
            >
              RESET
            </button>
          </div>
          <div className="hidden md:flex items-center px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] text-indigo-600 font-medium uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
            Drag to Navigate
          </div>
          <button
            onClick={() => fetchTree()}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold text-sm flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            Refresh Matrix
          </button>
        </div>
      </div>



      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        className={\`relative flex-1 bg-[#f8fafc] rounded-3xl border border-slate-200 overflow-auto h-[calc(100vh-220px)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)] cursor-\${isDragging ? "grabbing" : "grab"} selection:bg-none\`}
      >
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#4f46e5 0.5px, transparent 0.5px)",
            backgroundSize: "24px 24px",
          }}
        ></div>

        {/* This wrapper ensures the content is at least as wide as the container, but can grow. 
            Using inline-block on children and text-center on parent centers the tree without clipping on the left. */}
        <div 
          className="min-w-full min-h-full py-24 px-40 text-center"
          style={{ zoom: zoom }}
        >
          {loading && nodes.length === 0 ? (
            <div className="inline-flex flex-col items-center justify-center py-40 text-slate-400">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full scale-75 animate-pulse opacity-20"></div>
                </div>
              </div>
              <p className="mt-6 font-bold text-slate-500 tracking-wide">
                MAPPING THE MATRIX...
              </p>
            </div>
          ) : roots.length === 0 ? (
            <div className="inline-flex flex-col items-center justify-center py-40 text-center max-w-lg mx-auto">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-5xl mb-8 border border-slate-100">
                🧬
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">
                {admin?.role && admin.role.toLowerCase() !== "superadmin"
                  ? "No Operational Tree Nodes"
                  : "No Active Matrix Nodes"}
              </h3>
              <p className="text-slate-500 leading-relaxed">
                {admin?.role && admin.role.toLowerCase() !== "superadmin"
                  ? "Your scoped operational admin tree has no placed nodes yet. Once your rebirths are placed, the tree will appear here."
                  : "The global 3x3 matrix hasn't started yet. Once the first rebirth node is processed, the tree visualization will appear here."}
              </p>
              <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-white shrink-0 flex items-center justify-center text-indigo-600 shadow-sm font-bold text-lg">
                  !
                </div>
                <p className="text-sm text-indigo-900/70 font-medium">
                  {admin?.role && admin.role.toLowerCase() !== "superadmin" ? (
                    "Once your operational admin rebirths are placed, this tree will show only your own branch."
                  ) : (
                    <>
                      Go to the{" "}
                      <span className="font-bold text-indigo-600">
                        Pool Queue
                      </span>{" "}
                      and process any pending entries to see them appear in this
                      tree.
                    </>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="inline-flex flex-col gap-32 items-center text-left">
              {roots.map((root, index) => (
                <div key={root._id} className="flex flex-col items-center">
                  {index > 0 && (
                    <div className="w-full h-px bg-linear-to-r from-transparent via-slate-200 to-transparent my-16" />
                  )}
                  <TreeNode node={root} childrenMap={childrenMap} maxDepth={maxDepth} />
                </div>
              ))}
            </div>
          )}
        </div>


      </div>


      {/* Stats overlay or footer if needed */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {admin?.role && admin.role.toLowerCase() !== "superadmin"
                ? "Admin Root / Rebirth Node"
                : "Root Node"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Filled Position
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Empty Position
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Total Nodes Loaded:{" "}
          <span className="text-slate-900 font-bold">
            {treeMeta.summary?.totalNodes ?? nodes.length}
          </span>
        </div>
      </div>
    </div>
  );`;

const newReturn = `  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AdminPageHeader
          title={
            admin?.role && admin.role.toLowerCase() !== "superadmin"
              ? "Operational Admin Auto Pool Tree"
              : "Auto Pool Visualizer"
          }
          subtitle={
            admin?.role && admin.role.toLowerCase() !== "superadmin"
              ? "Your scoped rebirth matrix and connected placement tree"
              : "Interactive 3x3 global matrix hierarchy tracking"
          }
        />
        <div className="flex items-center gap-3">
          {admin?.role && admin.role.toLowerCase() === "superadmin" && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Root:</span>
              <input
                value={rootCode}
                onChange={(e) => setRootCode(e.target.value.trim())}
                className="w-40 text-xs font-bold text-[#E8A13F] bg-transparent outline-none"
                placeholder="BKS000000-0.1"
              />
            </div>
          )}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Depth:</span>
            <select 
              value={maxDepth} 
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="text-xs font-bold text-[#E8A13F] bg-transparent outline-none cursor-pointer"
            >
              <option value={1}>1 Level</option>
              <option value={2}>2 Levels</option>
              <option value={3}>3 Levels</option>
              <option value={4}>4 Levels</option>
              <option value={5}>5 Levels</option>
              <option value={6}>6 Levels</option>
              <option value={9}>9 Levels</option>
              <option value={15}>15 Levels</option>
              <option value={999}>All Levels</option>
            </select>
          </div>
          <div className="flex items-center gap-1 bg-white px-1.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))}
              className="w-7 h-7 rounded hover:bg-[#FFF4E5] flex items-center justify-center text-slate-600 font-bold transition-all cursor-pointer"
              title="Zoom Out"
            >
              —
            </button>
            <span className="text-[10px] font-bold text-[#111827] min-w-9 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
              className="w-7 h-7 rounded hover:bg-[#FFF4E5] flex items-center justify-center text-slate-600 font-bold transition-all cursor-pointer"
              title="Zoom In"
            >
              ＋
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
              onClick={() => setZoom(1)}
              className="px-2 py-1 text-[9px] font-bold text-[#F4B860] hover:bg-[#FFF4E5] rounded transition-all cursor-pointer"
              title="Reset Zoom"
            >
              RESET
            </button>
          </div>
          <div className="hidden md:flex items-center px-3 py-1.5 bg-[#FFF4E5] border border-[#F4B860]/20 rounded-lg text-[10px] text-[#E8A13F] font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#F4B860] mr-2 animate-pulse"></span>
            Drag to Navigate
          </div>
          <button
            onClick={() => fetchTree()}
            className="px-5 py-2 bg-[#111827] text-white rounded-xl hover:bg-[#1F2937] transition-all shadow-sm font-bold text-sm flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            Refresh Matrix
          </button>
        </div>
      </div>



      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        className={\`relative flex-1 bg-[#F8FAFC] rounded-3xl border border-[#E5E7EB] overflow-auto h-[calc(100vh-220px)] shadow-inner cursor-\${isDragging ? "grabbing" : "grab"} selection:bg-none\`}
      >
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#F4B860 0.5px, transparent 0.5px)",
            backgroundSize: "24px 24px",
          }}
        ></div>

        {/* This wrapper ensures the content is at least as wide as the container, but can grow. 
            Using inline-block on children and text-center on parent centers the tree without clipping on the left. */}
        <div 
          className="min-w-full min-h-full py-24 px-40 text-center"
          style={{ zoom: zoom }}
        >
          {loading && nodes.length === 0 ? (
            <div className="inline-flex flex-col items-center justify-center py-40 text-slate-400">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[#FFF4E5] border-t-[#F4B860] animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-[#F4B860] rounded-full scale-75 animate-pulse opacity-20"></div>
                </div>
              </div>
              <p className="mt-6 font-bold text-slate-500 tracking-wide uppercase">
                Mapping the matrix...
              </p>
            </div>
          ) : roots.length === 0 ? (
            <div className="inline-flex flex-col items-center justify-center py-40 text-center max-w-lg mx-auto">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-5xl mb-8 border border-[#E5E7EB]">
                🧬
              </div>
              <h3 className="text-2xl font-black text-[#111827] mb-3">
                {admin?.role && admin.role.toLowerCase() !== "superadmin"
                  ? "No Operational Tree Nodes"
                  : "No Active Matrix Nodes"}
              </h3>
              <p className="text-[#6B7280] leading-relaxed">
                {admin?.role && admin.role.toLowerCase() !== "superadmin"
                  ? "Your scoped operational admin tree has no placed nodes yet. Once your rebirths are placed, the tree will appear here."
                  : "The global 3x3 matrix hasn't started yet. Once the first rebirth node is processed, the tree visualization will appear here."}
              </p>
              <div className="mt-8 p-4 bg-[#FFF4E5] rounded-2xl border border-[#F4B860]/20 flex items-start gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-white shrink-0 flex items-center justify-center text-[#E8A13F] shadow-sm font-bold text-lg">
                  !
                </div>
                <p className="text-sm text-[#111827]/70 font-medium">
                  {admin?.role && admin.role.toLowerCase() !== "superadmin" ? (
                    "Once your operational admin rebirths are placed, this tree will show only your own branch."
                  ) : (
                    <>
                      Go to the{" "}
                      <span className="font-bold text-[#E8A13F]">
                        Pool Queue
                      </span>{" "}
                      and process any pending entries to see them appear in this
                      tree.
                    </>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="inline-flex flex-col gap-32 items-center text-left">
              {roots.map((root, index) => (
                <div key={root._id} className="flex flex-col items-center">
                  {index > 0 && (
                    <div className="w-full h-px bg-linear-to-r from-transparent via-[#E5E7EB] to-transparent my-16" />
                  )}
                  <TreeNode node={root} childrenMap={childrenMap} maxDepth={maxDepth} />
                </div>
              ))}
            </div>
          )}
        </div>


      </div>


      {/* Stats overlay or footer if needed */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#F4B860]"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {admin?.role && admin.role.toLowerCase() !== "superadmin"
                ? "Admin Root / Rebirth Node"
                : "Root Node"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Filled Position
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#F3F4F6] border border-[#E5E7EB]"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Empty Position
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Total Nodes Loaded:{" "}
          <span className="text-slate-900 font-bold">
            {treeMeta.summary?.totalNodes ?? nodes.length}
          </span>
        </div>
      </div>
    </div>
  );`;

let success = true;
if (normalizedContent.indexOf(oldTreeNode) === -1) {
  console.error("Error: Could not locate oldTreeNode!");
  success = false;
}
if (normalizedContent.indexOf(oldReturn) === -1) {
  console.error("Error: Could not locate oldReturn!");
  success = false;
}

if (success) {
  let output = normalizedContent.replace(oldTreeNode, newTreeNode);
  output = output.replace(oldReturn, newReturn);
  fs.writeFileSync(filePath, output, 'utf8');
  console.log("Success! Replaced theme content programmatically in admin AutoPoolTreePage.jsx.");
}
