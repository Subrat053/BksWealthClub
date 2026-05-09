import React, { useState, useEffect } from "react";
import { autopoolService } from "../../services/autopool.service";
import AdminPageHeader from "../../components/layout/AdminPageHeader";

const TreeNode = ({ node, allNodes, depth = 0 }) => {
  const children = allNodes.filter(n => 
    (n.matrixParentEntryId?._id === node._id) || (n.matrixParentEntryId === node._id)
  );
  
  return (
    <div className="flex flex-col items-center">
      <div className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
        node.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-indigo-200'
      } shadow-lg min-w-[180px] text-center relative z-10`}>
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
          node.sourceType === 'MAIN' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
        }`}>
          {node.sourceType}
        </div>
        <p className="font-extrabold text-slate-900 text-sm mt-1">{node.displayId}</p>
        <p className="text-[10px] text-slate-500 font-medium">{node.ownerUserId?.fullName || "Owner"}</p>
        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{node.ownerUserId?.memberId || "N/A"}</p>
        
        <div className="mt-3 flex justify-center gap-1.5">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-2.5 h-2.5 rounded-full border border-slate-200 shadow-inner ${
                i <= node.directChildrenCount ? 'bg-gradient-to-tr from-emerald-400 to-emerald-600' : 'bg-slate-100'
              }`} 
              title={`Child ${i}`}
            />
          ))}
        </div>
      </div>

      {children.length > 0 && (
        <div className="flex flex-col items-center w-full mt-8 relative">
          <div className="w-0.5 h-8 bg-slate-300 absolute -top-8" />
          
          <div className="flex justify-center gap-12 relative w-full pt-4">
            {/* Horizontal connection line */}
            {children.length > 1 && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-300 mx-auto" 
                style={{ 
                  width: `calc(100% - ${100/children.length}%)`,
                  left: `${50/children.length}%`
                }} 
              />
            )}
            
            {children.map((child, idx) => (
              <div key={child._id} className="relative pt-4">
                <div className="w-0.5 h-4 bg-slate-300 absolute -top-4 left-1/2 -translate-x-1/2" />
                <TreeNode node={child} allNodes={allNodes} depth={depth + 1} />
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
  const [loading, setLoading] = useState(true);
  const [rootNode, setRootNode] = useState(null);

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const data = await autopoolService.getTree();
      setNodes(data);
      
      // Find the root (node with no parent in the current data set)
      const root = data.find(n => !n.matrixParentEntryId);
      setRootNode(root);
    } catch (err) {
      console.error("Failed to fetch tree:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AdminPageHeader 
          title="Auto Pool Matrix Tree" 
          subtitle="Real-time visual hierarchy of the 3x3 global matrix"
        />
        <button 
          onClick={fetchTree}
          className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm"
        >
          Refresh Tree
        </button>
      </div>

      <div className="bg-slate-50 p-12 rounded-[2rem] shadow-inner border border-slate-200 overflow-auto min-h-[700px] flex justify-center items-start">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className="italic">Generating matrix visualization...</p>
          </div>
        ) : !rootNode ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center max-w-md">
            <div className="text-4xl mb-4">🌳</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Placed Nodes Yet</h3>
            <p className="text-sm">The matrix tree is currently empty because no entries have been moved from the pending queue to the matrix.</p>
            <p className="text-xs mt-4 text-indigo-600 font-semibold px-4 py-2 bg-indigo-50 rounded-lg">
              Go to the "Pool Queue" page and click "Process Queue Now" to start placement.
            </p>
          </div>
        ) : (
          <div className="inline-block py-10 px-20">
            <TreeNode node={rootNode} allNodes={nodes} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoPoolTreePage;
