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
