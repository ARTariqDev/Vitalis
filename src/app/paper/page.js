"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";

import PaperClient from "./PaperClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading paper...</div>}>
      <PaperClient />
    </Suspense>
  );
}
