"use client";

import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "@xyflow/react/dist/style.css";
import paperNode from "../components/paperNode";
import categoryNode from "../components/categoryNode";

const nodeTypes = {
  paperNode,
  categoryNode,
};

const categories = ["favourites", "informative", "amusing"];

export default function journal() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const hasLoaded = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cats = categories.map((cat, idx) => ({
        id: cat,
        position: { x: idx * 400 + 100, y: window.innerHeight / 2 - 50 },
        data: { title: cat[0].toUpperCase() + cat.slice(1) },
        type: "categoryNode",
      }));
      async function getInitialData(categoryNodes) {
        const res = await fetch("/api/getNodes");
        if (!res.ok) {
          console.log("no nodes available");
          setNodes([...categoryNodes]);
          return;
        }
        const { paperNodes, edges } = await res.json();
        setNodes([...paperNodes, ...categoryNodes]);
        setEdges([...edges]);
      }
      getInitialData(cats);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) {
      return;
    }
    let timer = setTimeout(() => {
      const pNodes = nodes.filter((n) => !categories.includes(n.id));
      fetch("/api/updateNodes", {
        method: "POST",
        body: JSON.stringify({ paperNodes: pNodes || [], edges: edges || [] }),
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [nodes, edges]);

  const onNodesChange = useCallback((changes) => {
    setNodes((prevNodes) => applyNodeChanges(changes, prevNodes));
    hasLoaded.current = true;
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((prevEdges) => applyEdgeChanges(changes, prevEdges));
    hasLoaded.current = true;
  }, []);

  const onConnect = useCallback((changes) => {
    setEdges((prevEdges) => addEdge(changes, prevEdges));
    hasLoaded.current = true;
  }, []);

  return (
    <div className="" style={{ height: "100vh", width: "100%" }}>
      <nav className="fixed top-0 left-0 right-0 bg-blue/80 backdrop-blur-sm border-b border-slate-200 z-50 px-4 py-3">
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
              xmlns="http://www.w3.org/2000/svg"
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
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
