import React, { useState, useEffect, useMemo, useRef } from "react";
import { autopoolService } from "../../services/autopool.service";
import AdminPageHeader from "../../components/layout/AdminPageHeader";
import { useAuth } from "../../context/useAuth";

const TreeNode = ({ node, childrenMap, depth = 0, maxDepth = 3 }) => {
  const children = childrenMap.get(node._id.toString()) || [];

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        className={`group relative p-2 rounded-2xl border transition-all duration-300 hover:scale-105 ${
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
            node.parentNodeId
              ? "bg-indigo-600 text-white"
              : "bg-amber-500 text-white"
          }`}
        >
          {node.parentNodeId ? `LEVEL ${depth}` : "ROOT NODE"}
        </div>

        {/* Content */}
        <div className="mt-2">
          <h4 className="font-black text-slate-900 text-lg leading-tight tracking-tight">
            {node.poolNodeId}
          </h4>
          <div className="flex items-center justify-center gap-2 mt-1">
            {/* <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-600 font-bold">
              {node.linkedRebirthNodeId?.ownerUserId?.fullName?.charAt(0) ||
                "U"}
            </div> */}
            <p className="text-xs text-slate-600 font-semibold truncate max-w-[120px]">
              {node.linkedRebirthNodeId?.ownerUserId?.fullName || "Anonymous"}
            </p>
          </div>
          {/* <p className="text-[10px] text-indigo-400 font-mono mt-1 font-bold bg-indigo-50 inline-block px-2 py-0.5 rounded">
            {node.linkedRebirthNodeId?.ownerUserId?.memberId || "N/A"}
          </p> */}
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
      {children.length > 0 && depth < maxDepth && (
        <div className="flex flex-col items-center w-full mt-12 relative">
          {/* Vertical line from parent to horizontal bar */}
          <div className="w-0.5 h-12 bg-gradient-to-b from-indigo-500 to-slate-300 absolute -top-12" />

          <div className="flex justify-center gap-24 relative w-full pt-6">
            {/* Horizontal connection bar */}
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
};

const AutoPoolTreePage = () => {
  const [nodes, setNodes] = useState([]);
  const [treeMeta, setTreeMeta] = useState({ admin: null, summary: {} });
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [maxDepth, setMaxDepth] = useState(3);
  const [zoom, setZoom] = useState(1);
  const { admin } = useAuth();

  useEffect(() => {
    fetchTree();
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

  const fetchTree = async () => {
    setLoading(true);
    try {
      if (admin?.role && admin.role.toLowerCase() !== "superadmin") {
        const scopedTree = await autopoolService.getOperationalAdminMyTree();
        setNodes(scopedTree.nodes || []);
        setTreeMeta(scopedTree);
      } else {
        const data = await autopoolService.getTree(0); // 0 retrieves the entire tree
        setNodes(data);
        setTreeMeta({ admin: null, summary: {} });
      }
    } catch (err) {
      console.error("Failed to fetch tree:", err);
    } finally {
      setLoading(false);
    }
  };

  // Efficiently build the tree structure
  const { roots, childrenMap } = useMemo(() => {
    const map = new Map();
    const possibleRoots = [];

    nodes.forEach((node) => {
      const parentId = node.parentNodeId?._id || node.parentNodeId || node.matrixParentId?._id || node.matrixParentId;
      if (!parentId) {
        possibleRoots.push(node);
      } else {
        const pid = parentId.toString();
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid).push(node);
      }
    });

    return { roots: possibleRoots, childrenMap: map };
  }, [nodes]);

  // Mouse drag to scroll handlers
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

  return (
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
            <span className="text-[10px] font-bold text-slate-500 min-w-[36px] text-center select-none">
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
        className={`relative flex-1 bg-[#f8fafc] rounded-3xl border border-slate-200 overflow-auto h-[calc(100vh-220px)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)] cursor-${isDragging ? "grabbing" : "grab"} selection:bg-none`}
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
                <div className="w-10 h-10 rounded-xl bg-white flex-shrink-0 flex items-center justify-center text-indigo-600 shadow-sm font-bold text-lg">
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
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-16" />
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
  );
};

export default AutoPoolTreePage;
