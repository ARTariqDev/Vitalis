import { Position, Handle } from "@xyflow/react";

export function categoryNode({ data }) {
  return (
    <div
      href="/journal"
      className="paperNode border-1 inline-block max-w-[200px] text-sm text-center px-4 py-2 rounded-sm"
    >
      <div className="font-semibold">{data?.label}</div>
      <Handle type="source" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
export default categoryNode;
