import { getScoreCategory, getScoreLabel } from "@/lib/types";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export default function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const cat = getScoreCategory(score);
  const label = getScoreLabel(score);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5 font-semibold",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses[size]} score-badge-${cat}`}>
      <span className={`h-2 w-2 rounded-full ${
        cat === "good" ? "bg-score-good" : cat === "limited" ? "bg-score-limited" : "bg-score-severe"
      }`} />
      {score.toFixed(2)} — {label}
    </span>
  );
}
