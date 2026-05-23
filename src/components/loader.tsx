"use client";

import { Diamond } from "lucide-react";

export default function WarungLoader({ message = "Memuat data..." }: { message?: string }) {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-10 select-none">
      {/* ── Logo mark ─────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
        {/* Outer ring — slow CW dashes */}
        <svg className="warung-ring-cw absolute inset-0" width="180" height="180" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r="84"
            fill="none"
            stroke="#2563eb"
            strokeWidth="1"
            strokeDasharray="14 8"
            strokeLinecap="round"
            opacity="0.35"
          />
        </svg>

        {/* Middle ring — faster CCW solid arcs */}
        <svg className="warung-ring-ccw absolute inset-0" width="180" height="180" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r="74"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeDasharray="55 180"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>

        {/* Inner accent ring — subtle CW */}
        <svg
          className="warung-ring-cw absolute inset-0"
          style={{ animationDuration: "10s" }}
          width="180"
          height="180"
          viewBox="0 0 180 180"
        >
          <circle
            cx="90"
            cy="90"
            r="63"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="0.75"
            strokeDasharray="4 12"
            opacity="0.2"
          />
        </svg>

        {/* Core badge */}
        <div
          className="relative z-10 flex flex-col items-center justify-center rounded-full shadow-lg"
          style={{
            width: 118,
            height: 118,
            background: "radial-gradient(circle at 40% 35%, #1e293b, #0f172a)",
          }}
        >
          {/* Diamond SVG mark */}
          <div className="warung-glow mb-2 flex items-center justify-center text-blue-400">
            <Diamond className="w-6 h-6 stroke-[1.5]" />
          </div>

          {/* Brand name */}
          <span
            className="warung-title block text-center font-black uppercase tracking-widest text-blue-100"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 10,
              letterSpacing: "0.25em",
              textShadow: "0 0 12px rgba(59,130,246,0.6)",
            }}
          >
            WARUNG
          </span>
          <span
            className="warung-title block text-center font-black uppercase tracking-widest text-blue-400"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 10,
              letterSpacing: "0.25em",
              textShadow: "0 0 12px rgba(59,130,246,0.6)",
            }}
          >
            KITA
          </span>

          {/* Subtitle */}
          <span
            className="mt-1 block text-center font-bold uppercase text-slate-500"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 7,
              letterSpacing: "0.15em",
            }}
          >
            POS & STOK
          </span>
        </div>
      </div>

      {/* ── Shimmer bar ───────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-full"
        style={{ width: 160, height: 2, backgroundColor: "rgba(59,130,246,0.15)" }}
      >
        <div
          className="warung-shimmer absolute inset-y-0 left-0 rounded-full"
          style={{
            width: "35%",
            background: "linear-gradient(90deg, transparent, #3b82f6, transparent)",
          }}
        />
      </div>

      {/* ── Dot indicators ────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={["warung-dot-1", "warung-dot-2", "warung-dot-3"][i]}
            style={{
              display: "inline-block",
              width: 5,
              height: 5,
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
            }}
          />
        ))}
      </div>

      {/* ── Message ───────────────────────────────────────────────── */}
      <p
        className="text-xs font-semibold tracking-widest uppercase text-slate-500"
        style={{ letterSpacing: "0.15em" }}
      >
        {message}
      </p>
    </div>
  );
}
