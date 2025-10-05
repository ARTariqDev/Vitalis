"use client";

import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { useState, useCallback } from "react";
import "@xyflow/react/dist/style.css";
import paperNode from "../components/articleNode";
import categoryNode from "../components/categoryNode";

const nodeTypes = {
  paperNode,
  categoryNode,
};

const categories = ["favourites", "informative", "amusing"];

export default function journal() {
  const categoryNodes = categories.map((cat, idx) => {
    return {
      id: cat,
      position: { x: idx * 400 + 100, y: window.innerHeight / 2 - 50 },
      data: { label: cat[0].toUpperCase() + cat.slice(1) },
    };
  });
  const initialNodes = [
    {
      id: "n1",
      position: { x: 200, y: 200 },
      data: { label: "Node 1" },
      type: "paperNode",
    },
    {
      id: "n2",
      position: { x: 100, y: 100 },
      data: { label: "Node 2" },
      type: paperNode,
    },
    {
      id: "n3",
      position: { x: 200, y: 200 },
      data: { label: "Node 1" },
      type: "paperNode",
    },
    {
      id: "n4",
      position: { x: 100, y: 100 },
      data: { label: "Node 2" },
      type: paperNode,
    },
    {
      id: "n5",
      position: { x: 200, y: 200 },
      data: { label: "Node 1" },
      type: "paperNode",
    },
    {
      id: "n6",
      position: { x: 100, y: 100 },
      data: { label: "Node 2" },
      type: paperNode,
    },
    ...categoryNodes,
  ];

  const initialEdges = [
    {
      id: "n1-n2",
      source: "amusing",
      target: "n1",
      type: "step",
    },
    {
      id: "n1-n2",
      source: "favourites",
      target: "n1",
      type: "step",
    },
    {
      id: "n1-n2",
      source: "informative",
      target: "n1",
      type: "step",
    },
    {
      id: "n1-n2",
      source: "amusing",
      target: "n1",
      type: "step",
    },
  ];
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const onNodeDragStop = useCallback((_, node) => {
    console.log(node.position);
    setNodes((nds) =>
      nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))
    );

    fetch("/api/updateNodePosition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: node.id,
        position: node.position,
      }),
    });
  }, []);

  const onNodesChange = useCallback(
    (changes) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgeClick={onEdgesChange}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
