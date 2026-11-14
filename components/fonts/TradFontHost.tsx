"use client";

import dynamic from "next/dynamic";

import { useScript } from "@/lib/script/useScript";

const TradFont = dynamic(() => import("./TradFont").then((m) => m.TradFont), { ssr: false });

/** Mounted in the root layout: loads the Phồn thể font only in Phồn thể mode. */
export function TradFontHost() {
  return useScript() === "trad" ? <TradFont /> : null;
}
