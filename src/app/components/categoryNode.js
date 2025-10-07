import { Position, Handle } from "@xyflow/react";

function categoryNode({ data }) {
  return (
    <div
      href="/journal"
      className="paperNode border-1 inline-block max-w-[200px] text-sm text-center px-4 py-2 rounded-sm z-10 relative"
    >
      <div className="font-semibold">{data?.title}</div>
      <Handle type="source" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
export default categoryNode;
