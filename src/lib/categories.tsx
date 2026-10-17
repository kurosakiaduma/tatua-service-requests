import { CircleHelp, Droplets, Lightbulb, TrafficCone, Trash2, Waves } from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { categories } from "@/lib/validations";

export type Category = (typeof categories)[number];
type CategoryConfig = { label: string; Icon: ComponentType<LucideProps> };

export const categoryConfig: Record<Category, CategoryConfig> = {
  streetlight: { label: "Streetlight", Icon: Lightbulb },
  water: { label: "Water", Icon: Droplets },
  garbage: { label: "Garbage", Icon: Trash2 },
  roads: { label: "Roads", Icon: TrafficCone },
  sewage: { label: "Sewage", Icon: Waves },
  other: { label: "Other", Icon: CircleHelp },
};

export function CategoryIcon({ category, size = 17, ...props }: { category: Category; size?: number } & Omit<LucideProps, "size">) {
  const Icon = categoryConfig[category].Icon;
  return <Icon size={size} aria-hidden="true" {...props} />;
}

export function CategoryBadge({ category }: { category: Category }) {
  return <span className="inline-flex items-center gap-2 font-semibold"><CategoryIcon category={category} /><span>{categoryConfig[category].label}</span></span>;
}
