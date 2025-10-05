"use client";

import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { useState, useCallback, useEffect } from "react";
import "@xyflow/react/dist/style.css";
import paperNode from "../components/articleNode";
import categoryNode from "../components/categoryNode";

const nodeTypes = {
  paperNode,
  categoryNode,
};

const categories = ["favourites", "informative", "amusing"];

function getInitialNodes(categoryNodes) {
  return [
    {
      id: "n1",
      position: { x: 150, y: 120 },
      data: { label: "Spaceflight Effects on Muscle" },
      type: "paperNode",
    },
    {
      id: "n2",
      position: { x: 400, y: 180 },
      data: { label: "Mice in Bion-M 1: Training & Selection" },
      type: paperNode,
    },
    {
      id: "n3",
      position: { x: 650, y: 100 },
      data: { label: "Microgravity & Bone Loss" },
      type: "paperNode",
    },
    {
      id: "n4",
      position: { x: 300, y: 350 },
      data: { label: "Immune System in Space" },
      type: paperNode,
    },
    {
      id: "n5",
      position: { x: 600, y: 320 },
      data: { label: "Radiation Response Genes" },
      type: "paperNode",
    },
    {
      id: "n6",
      position: { x: 800, y: 200 },
      data: { label: "Plant Growth in Microgravity" },
      type: paperNode,
    },
    ...categoryNodes,
  ];
}

const initialEdges = [
  {
    id: "n1-n2",
    source: "amusing",
    target: "n1",
    type: "step",
  },
  {
    id: "f1",
    source: "favourites",
    target: "n2",
    type: "step",
  },
  {
    id: "f2",
    source: "informative",
    target: "n3",
    type: "step",
  },
  {
    id: "f3",
    source: "amusing",
    target: "n4",
    type: "step",
  },
];

export default function journal() {
  const [categoryNodes, setCategoryNodes] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState(initialEdges);

  useEffect(() => {
    // Only run on client
    if (typeof window !== "undefined") {
      const cats = categories.map((cat, idx) => ({
        id: cat,
        position: { x: idx * 400 + 100, y: window.innerHeight / 2 - 50 },
        data: { label: cat[0].toUpperCase() + cat.slice(1) },
      }));
      setCategoryNodes(cats);
      setNodes(getInitialNodes(cats));
    }
  }, []);
  const onNodeDragStop = useCallback((_, node) => {
    console.log(node.position);
    setNodes((nds) =>
      nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))
    );
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
