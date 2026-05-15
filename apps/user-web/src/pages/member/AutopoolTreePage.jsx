import React, { useState, useEffect, useMemo, useRef } from "react";
import { autopoolService } from "../../services/autopool.service";
import Card from "../../components/common/Card";

const TreeNode = ({ node, childrenMap, depth = 0 }) => {
  const children = childrenMap.get(node._id.toString()) || [];
  
  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className={`group relative p-5 rounded-2xl border transition-all duration-300 hover:scale-105 ${
        node.status === 'COMPLETED' 
          ? 'bg-linear-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
          : 'bg-[#091a39]/95 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]'
      } min-w-[200px] text-center z-20 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:border-amber-500/40`}>
        
        {/* Connection Dot - Top */}
        {depth > 0 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-500/50 border-2 border-[#08142f] z-30" />
        )}

        {/* Badge */}
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${
          node.parentPoolNodeId ? 'bg-amber-600 text-white' : 'bg-linear-to-r from-amber-400 to-yellow-600 text-white'
        }`}>
          {node.parentPoolNodeId ? `LEVEL ${depth}` : 'ROOT NODE'}
        </div>

        {/* Content */}
        <div className="mt-2">
          <h4 className="font-black text-amber-100 text-lg leading-tight tracking-tight">{node.poolNodeId}</h4>
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] text-amber-400 font-bold border border-amber-500/20">
              {node.linkedRebirthNodeId?.ownerUserId?.fullName?.charAt(0) || "U"}
            </div>
            <p className="text-xs text-amber-100/70 font-semibold truncate max-w-[120px]">
              {node.linkedRebirthNodeId?.ownerUserId?.fullName || "Anonymous"}
            </p>
          </div>
        </div>
        
        {/* Children Status Dots */}
        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-3 h-3 rounded-full border-2 border-[#08142f] shadow-sm transition-all duration-500 ${
                i <= (node.autopoolChildrenCount || 0) 
                  ? 'bg-linear-to-tr from-emerald-400 to-teal-500 scale-110' 
                  : 'bg-white/5'
              }`} 
              title={`Position ${i}: ${i <= (node.autopoolChildrenCount || 0) ? 'Filled' : 'Empty'}`}
            />
          ))}
        </div>

        {/* Connection Dot - Bottom */}
        {children.length > 0 && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-500 border-2 border-[#08142f] z-30 group-hover:scale-125 transition-transform" />
        )}
      </div>

      {/* Recursive Children Rendering */}
      {children.length > 0 && (
        <div className="flex flex-col items-center w-full mt-12 relative">
          {/* Vertical line from parent to horizontal bar */}
          <div className="w-0.5 h-12 bg-linear-to-b from-amber-500/50 to-amber-500/10 absolute -top-12" />
          
          <div className="flex justify-center gap-24 relative w-full pt-6">
            {/* Horizontal connection bar */}
            {children.length > 1 && (
              <div className="absolute top-0 h-0.5 bg-amber-500/20 rounded-full" 
                style={{ 
                  left: `${150 / (children.length * 2)}%`,
                  right: `${150 / (children.length * 2)}%`
                }} 
              />
            )}
            
            {children.map((child) => (
              <div key={child._id} className="relative">
                {/* Vertical line from horizontal bar to child */}
                <div className="w-0.5 h-6 bg-amber-500/20 absolute -top-6 left-1/2 -translate-x-1/2" />
                <TreeNode node={child} childrenMap={childrenMap} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AutopoolTreePage() {
  const [data, setData] = useState({ nodes: [], completions: [] });
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    fetchMyAutoPool();
  }, []);

  const fetchMyAutoPool = async () => {
    setLoading(true);
    try {
      const result = await autopoolService.getMyAutoPool();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch my autopool:", err);
    } finally {
      setLoading(false);
    }
  };

  // Efficiently build the tree structure
  const { roots, childrenMap } = useMemo(() => {
    const map = new Map();
    const possibleRoots = [];
    const nodeIds = new Set(data.nodes.map(n => n._id.toString()));

    data.nodes.forEach(node => {
      const parentId = node.parentPoolNodeId?._id || node.parentPoolNodeId;
      const pidStr = parentId?.toString();
      
      // A node is a root if it has no parent OR its parent is not in the set of nodes we're displaying
      if (!parentId || !nodeIds.has(pidStr)) {
        possibleRoots.push(node);
      } else {
        if (!map.has(pidStr)) map.set(pidStr, []);
        map.get(pidStr).push(node);
      }
    });

    return { roots: possibleRoots, childrenMap: map };
  }, [data.nodes]);

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
    <div className="flex flex-col space-y-6 h-full">
      <div className="space-y-2 px-4 md:px-0">
        <div className="h-1 w-24 rounded-full bg-linear-to-r from-amber-300 via-amber-500 to-yellow-200" />
        <h1 className="text-3xl font-bold leading-none text-white md:text-4xl">Auto Pool Visualizer</h1>
        <p className="max-w-2xl text-sm text-amber-100/70 md:text-base">
          Interactive global matrix hierarchy tracking for your rebirth nodes.
        </p>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 md:px-0">
        <div className="bg-[#091a39]/95 p-4 rounded-2xl border border-amber-500/10 shadow-lg">
          <p className="text-[10px] font-bold text-amber-200/50 uppercase tracking-widest">Total Nodes</p>
          <p className="text-2xl font-black text-white mt-1">{data.nodes.length}</p>
        </div>
        <div className="bg-[#091a39]/95 p-4 rounded-2xl border border-amber-500/10 shadow-lg">
          <p className="text-[10px] font-bold text-amber-200/50 uppercase tracking-widest">Completed</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{data.nodes.filter(n => n.status === 'COMPLETED').length}</p>
        </div>
        <div className="bg-[#091a39]/95 p-4 rounded-2xl border border-amber-500/10 shadow-lg">
          <p className="text-[10px] font-bold text-amber-200/50 uppercase tracking-widest">Pending</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{data.nodes.filter(n => n.status === 'PENDING' || n.status === 'PLACED').length}</p>
        </div>
        <div className="bg-[#091a39]/95 p-4 rounded-2xl border border-amber-500/10 shadow-lg">
          <p className="text-[10px] font-bold text-amber-200/50 uppercase tracking-widest">Active Rebirths</p>
          <p className="text-2xl font-black text-indigo-400 mt-1">{data.completions.length}</p>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`relative flex-1 bg-[#050b1d] rounded-3xl border border-amber-500/10 overflow-auto min-h-[600px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] cursor-${isDragging ? 'grabbing' : 'grab'} selection:bg-none`}
      >
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f59e0b 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

        <div className="min-w-full min-h-full py-24 px-40 text-center">
          {loading ? (
            <div className="inline-flex flex-col items-center justify-center py-40 text-amber-200/40">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-amber-500/10 border-t-amber-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-amber-500 rounded-full scale-75 animate-pulse opacity-20"></div>
                </div>
              </div>
              <p className="mt-6 font-bold tracking-wide uppercase text-xs">Mapping your matrix...</p>
            </div>
          ) : roots.length === 0 ? (
            <div className="inline-flex flex-col items-center justify-center py-40 text-center max-w-lg mx-auto">
              <div className="w-24 h-24 bg-[#091a39] rounded-3xl shadow-xl flex items-center justify-center text-5xl mb-8 border border-amber-500/10">
                🧬
              </div>
              <h3 className="text-2xl font-black text-white mb-3">No Active Matrix Nodes</h3>
              <p className="text-amber-100/50 leading-relaxed">Your nodes haven't been placed in the global matrix yet. Once they enter the queue and get placed, your visual tree will appear here.</p>
            </div>
          ) : (
            <div className="inline-flex flex-col gap-32 items-center text-left">
              {roots.map((root, index) => (
                <div key={root._id} className="flex flex-col items-center">
                  {index > 0 && (
                    <div className="w-full h-px bg-linear-to-r from-transparent via-amber-500/10 to-transparent my-16" />
                  )}
                  <TreeNode node={root} childrenMap={childrenMap} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center md:justify-between items-center gap-4 px-6 py-4 bg-[#091a39]/95 border border-amber-500/10 rounded-2xl shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-[10px] font-bold text-amber-200/50 uppercase tracking-wider">Your Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            <span className="text-[10px] font-bold text-amber-200/50 uppercase tracking-wider">Filled Position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white/10 border border-white/5"></div>
            <span className="text-[10px] font-bold text-amber-200/50 uppercase tracking-wider">Empty Position</span>
          </div>
        </div>
        <div className="text-[10px] text-amber-200/30 font-bold uppercase tracking-widest">
          Drag to Navigate • Use refresh to update status
        </div>
      </div>
    </div>
  );
}
