"use client";

import type { Grade } from "@/lib/foodGrade";

const GRADE_STYLES: Record<Grade, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  B: { bg: "bg-lime-100", text: "text-lime-800", border: "border-lime-300" },
  C: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  D: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  F: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
};

interface GradeBadgeProps {
  grade: Grade;
  rationale?: string;
  size?: "sm" | "md";
}

export function GradeBadge({ grade, rationale, size = "sm" }: GradeBadgeProps) {
  const s = GRADE_STYLES[grade];
  const sizeCls = size === "md"
    ? "w-8 h-8 text-base font-black"
    : "w-6 h-6 text-xs font-black";

  return (
    <span
      title={rationale}
      className={`inline-flex items-center justify-center rounded-full border ${s.bg} ${s.text} ${s.border} ${sizeCls} shrink-0 cursor-default select-none`}
    >
      {grade}
    </span>
  );
}
