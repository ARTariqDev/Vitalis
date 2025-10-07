"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import PaperClient from "./PaperClient";

export default function Page() {
  const router = useRouter();

  return (
    <Suspense fallback={<div>Loading paper...</div>}>
      <div className="pt-16">
        <PaperClient />
      </div>
    </Suspense>
  );
}
