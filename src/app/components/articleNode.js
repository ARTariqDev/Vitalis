import { Position, Handle } from "@xyflow/react";

export function paperNode({ data }) {
  return (
    <div
      href="/journal"
      className="paperNode border-1 inline-block max-w-[200px] text-xs text-center px-4 py-2 rounded-sm"
    >
      <div>{data?.label}</div>
      <a className="bg-teal-500 text-white px-3 py-1 mt-2 text-xs rounded-sm inline-block">
        View Paper
      </a>
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
export default paperNode;
