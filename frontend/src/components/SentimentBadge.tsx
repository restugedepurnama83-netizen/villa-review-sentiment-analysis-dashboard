import { Sentiment } from "../types";

interface Props {
  sentiment: Sentiment;
  size?: "sm" | "md" | "lg";
}

const config: Record<Sentiment, { label: string; classes: string }> = {
  POSITIF: { label: "POSITIF", classes: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  NEGATIF: { label: "NEGATIF", classes: "bg-red-100 text-red-700 border border-red-200" },
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5 rounded-md font-semibold",
  md: "text-sm px-3 py-1 rounded-lg font-semibold",
  lg: "text-base px-4 py-1.5 rounded-xl font-bold",
};

export function SentimentBadge({ sentiment, size = "md" }: Props) {
  const { label, classes } = config[sentiment];
  return <span className={`${classes} ${sizeClasses[size]}`}>{label}</span>;
}
