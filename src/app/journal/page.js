"use client";

import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position,
} from "@xyflow/react";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@xyflow/react/dist/style.css";
import { getJournalEntries, getUserCategories } from "@/lib/journalStorage";

// Custom Paper Node Component
const PaperNode = ({ data }) => {
  return (
    <div
      className="px-4 py-3 rounded-lg border-2 bg-white shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105"
      style={{
        borderColor: data.categoryColor || '#14b8a6',
        minWidth: '220px',
        maxWidth: '280px'
      }}
      onClick={() => data.onClick?.(data.paper)}
    >
      <Handle type="target" position={Position.Top} />
      <div className="font-semibold text-sm text-slate-800 mb-2 line-clamp-2">
        {data.title}
      </div>
      {data.paper?.tags && data.paper.tags !== 'Unknown' && (
        <div className="text-xs text-slate-500 mb-2 line-clamp-1">
          {data.paper.tags}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div
          className="text-xs font-medium px-2 py-1 rounded"
          style={{
            backgroundColor: data.categoryColor + '20',
            color: data.categoryColor || '#14b8a6'
          }}
        >
          {data.categoryName}
        </div>
        {data.annotationCount > 0 && (
          <div className="text-xs text-slate-400">
            {data.annotationCount} {data.annotationCount !== 1 ? 'notes' : 'note'}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// Custom Category Node Component
const CategoryNode = ({ data }) => {
  return (
    <div
      className="px-6 py-4 rounded-xl font-bold text-white shadow-xl"
      style={{
        backgroundColor: data.color,
        minWidth: '160px',
        textAlign: 'center'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="text-lg">{data.name}</div>
      <div className="text-sm opacity-90 mt-1">
        {data.count} {data.count !== 1 ? 'papers' : 'paper'}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = {
  paperNode: PaperNode,
  categoryNode: CategoryNode,
};

export default function Journal() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showEdgeModal, setShowEdgeModal] = useState(false);
  const [pendingEdge, setPendingEdge] = useState(null);
  const [edgeLabel, setEdgeLabel] = useState('');
  const [edgeType, setEdgeType] = useState('smoothstep'); // 'default', 'smoothstep', 'step', 'straight'
  const router = useRouter();

  // Load journal entries on mount
  useEffect(() => {
    loadJournalData();
  }, []);

  async function loadJournalData() {
    setIsLoading(true);
    try {
      const journalEntries = await getJournalEntries();
      
      if (journalEntries.length === 0) {
        setIsLoading(false);
        return;
      }

      setEntries(journalEntries);
      
      // Get unique categories
      const categories = getUserCategories(journalEntries);
      
      // Create category nodes in a horizontal line
      const categoryNodes = categories.map((cat, idx) => ({
        id: `category-${cat.name}`,
        type: 'categoryNode',
        position: { 
          x: idx * 250 + 100, 
          y: 100 
        },
        data: {
          name: cat.name,
          color: cat.color,
          count: journalEntries.filter(e => e.category.name === cat.name).length
        }
      }));

      // Create paper nodes grouped by category
      const paperNodes = journalEntries.map((entry, idx) => {
        const catIndex = categories.findIndex(c => c.name === entry.category.name);
        const papersInCat = journalEntries.filter(e => e.category.name === entry.category.name);
        const paperIndexInCat = papersInCat.findIndex(e => e._id === entry._id);
        
        return {
          id: entry._id.toString(),
          type: 'paperNode',
          position: entry.position || {
            x: catIndex * 250 + 100 + (Math.random() - 0.5) * 100,
            y: 300 + paperIndexInCat * 150
          },
          data: {
            title: entry.paper.title,
            categoryName: entry.category.name,
            categoryColor: entry.category.color,
            annotationCount: entry.annotations?.length || 0,
            paper: entry.paper,
            onClick: (paper) => {
              router.push(`/paper?title=${encodeURIComponent(paper.title)}`);
            }
          }
        };
      });

      // Create edges from categories to papers
      const categoryEdges = journalEntries.map(entry => ({
        id: `edge-${entry._id}`,
        source: `category-${entry.category.name}`,
        target: entry._id.toString(),
        type: 'smoothstep',
        style: { 
          stroke: entry.category.color || '#14b8a6', 
          strokeWidth: 3, 
          opacity: 0.6 
        },
        animated: false
      }));

      // Load user-created connections from database
      const userEdges = journalEntries.flatMap(entry => {
        if (!entry.connections || entry.connections.length === 0) return [];
        
        return entry.connections.map(conn => ({
          id: `user-edge-${entry._id}-${conn.targetEntryId}`,
          source: entry._id.toString(),
          target: conn.targetEntryId.toString(),
          type: conn.edgeType || 'smoothstep',
          label: conn.relationship,
          labelStyle: { fill: '#1e293b', fontWeight: 600, fontSize: 12 },
          labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
          labelBgPadding: [8, 4],
          labelBgBorderRadius: 4,
          style: { 
            stroke: '#64748b', 
            strokeWidth: 2.5,
            strokeDasharray: '5,5'
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#64748b'
          },
          data: { isUserCreated: true }
        }));
      });

      const allNodes = [...categoryNodes, ...paperNodes];
      const allEdges = [...categoryEdges, ...userEdges];

      console.log(`📊 [Journal] Loaded ${categoryEdges.length} category edges and ${userEdges.length} user connections`);

      setNodes(allNodes);
      setEdges(allEdges);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading journal:', error);
      setIsLoading(false);
    }
  }

  // Handle node changes (including drag)
  const onNodesChange = useCallback((changes) => {
    setNodes((prevNodes) => applyNodeChanges(changes, prevNodes));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((prevEdges) => applyEdgeChanges(changes, prevEdges));
  }, []);

  // Handle connection between nodes
  const onConnect = useCallback((connection) => {
    // Only allow connections between paper nodes (not categories)
    if (connection.source.startsWith('category-') || connection.target.startsWith('category-')) {
      console.log('❌ Cannot connect to/from category nodes');
      return;
    }
    
    // Don't allow self-connections
    if (connection.source === connection.target) {
      console.log('❌ Cannot connect node to itself');
      return;
    }

    // Show modal to name the edge
    setPendingEdge(connection);
    setEdgeLabel('');
    setShowEdgeModal(true);
  }, []);

  // Save the named edge
  const handleSaveEdge = useCallback(async () => {
    if (!pendingEdge || !edgeLabel.trim()) return;

    const newEdge = {
      id: `user-edge-${pendingEdge.source}-${pendingEdge.target}`,
      source: pendingEdge.source,
      target: pendingEdge.target,
      type: edgeType,
      label: edgeLabel.trim(),
      labelStyle: { fill: '#1e293b', fontWeight: 600, fontSize: 12 },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 4,
      style: { 
        stroke: '#64748b', 
        strokeWidth: 2.5,
        strokeDasharray: '5,5'
      },
      markerEnd: {
        type: 'arrowclosed',
        color: '#64748b'
      },
      data: { isUserCreated: true }
    };

    // Save to database - update the source entry's connections
    try {
      const response = await fetch('/api/journal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: pendingEdge.source,
          updates: {
            connections: [
              ...(entries.find(e => e._id.toString() === pendingEdge.source)?.connections || []),
              {
                targetEntryId: pendingEdge.target,
                relationship: edgeLabel.trim(),
                edgeType: edgeType,
                aiGenerated: false,
                createdAt: new Date()
              }
            ]
          }
        }),
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Connection saved to database');
        // Update local entries state
        setEntries(prev => prev.map(e => 
          e._id.toString() === pendingEdge.source
            ? {
                ...e,
                connections: [
                  ...(e.connections || []),
                  {
                    targetEntryId: pendingEdge.target,
                    relationship: edgeLabel.trim(),
                    edgeType: edgeType,
                    aiGenerated: false,
                    createdAt: new Date()
                  }
                ]
              }
            : e
        ));
      }
    } catch (error) {
      console.error('❌ Error saving connection:', error);
    }

    setEdges((eds) => [...eds, newEdge]);
    setShowEdgeModal(false);
    setPendingEdge(null);
    setEdgeLabel('');
  }, [pendingEdge, edgeLabel, edgeType, entries]);

  // Handle edge deletion (only user-created edges)
  const onEdgesDelete = useCallback(async (edgesToDelete) => {
    // Only allow deletion of user-created edges
    const userCreatedEdges = edgesToDelete.filter(edge => edge.data?.isUserCreated);
    
    for (const edge of userCreatedEdges) {
      try {
        // Find the source entry
        const sourceEntry = entries.find(e => e._id.toString() === edge.source);
        if (!sourceEntry) continue;

        // Remove the connection from the array
        const updatedConnections = (sourceEntry.connections || []).filter(
          conn => conn.targetEntryId !== edge.target
        );

        // Update in database
        const response = await fetch('/api/journal', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entryId: edge.source,
            updates: { connections: updatedConnections }
          }),
          credentials: 'include'
        });

        if (response.ok) {
          console.log('✅ Connection removed from database');
          // Update local entries state
          setEntries(prev => prev.map(e => 
            e._id.toString() === edge.source
              ? { ...e, connections: updatedConnections }
              : e
          ));
        }
      } catch (error) {
        console.error('❌ Error deleting connection:', error);
      }
    }

    if (userCreatedEdges.length > 0) {
      setEdges((eds) => eds.filter((e) => !userCreatedEdges.find((del) => del.id === e.id)));
    }
  }, [entries]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-700 text-xl animate-pulse">Loading your research journal...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 z-50 px-4 py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center px-4 py-2 text-slate-700 hover:text-teal-600 transition-colors duration-300"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </nav>
        
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Your Journal is Empty</h1>
            <p className="text-slate-600 mb-6">Start saving papers to see them visualized here</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-300"
            >
              Browse Papers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-slate-200 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center px-4 py-2 text-slate-700 hover:text-teal-600 transition-colors duration-300"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-slate-700 text-sm">
              <span className="font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                {entries.length}
              </span>{" "}
              {entries.length !== 1 ? 'papers' : 'paper'} saved
            </div>
            
            {/* Edge Type Selector */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">Connection style:</span>
              <select
                value={edgeType}
                onChange={(e) => setEdgeType(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="default">Curved</option>
                <option value="smoothstep">Smooth Step</option>
                <option value="step">Step</option>
                <option value="straight">Straight</option>
              </select>
            </div>
            
            <button
              onClick={loadJournalData}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </nav>
      
      <div className="bg-gradient-to-br from-slate-50 to-slate-100" style={{ height: "100%", width: "100%" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          fitView
          minZoom={0.1}
          maxZoom={2}
        >
          <Background color="#cbd5e1" gap={20} size={1} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Edge Naming Modal */}
      {showEdgeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              Name this Connection
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Describe the relationship between these papers
            </p>
            
            {/* Connection Label Input */}
            <input
              type="text"
              value={edgeLabel}
              onChange={(e) => setEdgeLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && edgeLabel.trim()) {
                  handleSaveEdge();
                } else if (e.key === 'Escape') {
                  setShowEdgeModal(false);
                  setPendingEdge(null);
                  setEdgeLabel('');
                }
              }}
              placeholder="e.g., 'builds on', 'contradicts', 'related to'"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-teal-500 focus:outline-none text-slate-800 mb-4"
              autoFocus
            />
            
            {/* Edge Style Preview */}
            <div className="mb-4">
              <label className="text-sm text-slate-600 mb-2 block">Connection Style:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'default', label: 'Curved', desc: 'Bezier curve' },
                  { value: 'smoothstep', label: 'Smooth Step', desc: 'Rounded corners' },
                  { value: 'step', label: 'Step', desc: 'Right angles' },
                  { value: 'straight', label: 'Straight', desc: 'Direct line' }
                ].map(style => (
                  <button
                    key={style.value}
                    onClick={() => setEdgeType(style.value)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all text-left ${
                      edgeType === style.value
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-slate-800">{style.label}</div>
                    <div className="text-xs text-slate-500">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEdgeModal(false);
                  setPendingEdge(null);
                  setEdgeLabel('');
                }}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdge}
                disabled={!edgeLabel.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Connection
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              Press Enter to save, Escape to cancel
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
