import { CircleHelp, Droplets, Lightbulb, TrafficCone, Trash2, Waves } from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { categories } from "@/lib/validations";

// Shared category vocabulary and icon mapping used by forms, badges, and reports.
/** Union of categories accepted by the request schema. */
export type Category = (typeof categories)[number];
type CategoryConfig = { label: string; Icon: ComponentType<LucideProps> };

/** Presentation metadata for each request category. */
export const categoryConfig: Record<Category, CategoryConfig> = {
  streetlight: { label: "Streetlight", Icon: Lightbulb },
  water: { label: "Water", Icon: Droplets },
  garbage: { label: "Garbage", Icon: Trash2 },
  roads: { label: "Roads", Icon: TrafficCone },
  sewage: { label: "Sewage", Icon: Waves },
  other: { label: "Other", Icon: CircleHelp },
};

/** Resolves a category to its accessible Lucide icon. */
export function CategoryIcon({ category, size = 17, ...props }: { category: Category; size?: number } & Omit<LucideProps, "size">) {
  const Icon = categoryConfig[category].Icon;
  return <Icon size={size} aria-hidden="true" {...props} />;
}

/** Renders the category icon and human-readable label. */
export function CategoryBadge({ category }: { category: Category }) {
  return <span className="inline-flex items-center gap-2 font-semibold"><CategoryIcon category={category} /><span>{categoryConfig[category].label}</span></span>;
}
