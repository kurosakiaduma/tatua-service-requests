"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return <div className="flex items-center gap-1 rounded-lg border bg-card p-1" aria-label="Theme selection">
    {[["light", Sun, "Light"], ["dark", Moon, "Dark"], ["system", Monitor, "System"]].map(([value, Icon, label]) => <button key={value as string} type="button" aria-label={label as string} aria-pressed={theme === value} onClick={() => setTheme(value as string)} className={`flex min-h-10 min-w-10 items-center justify-center rounded-md px-2 ${theme === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}><Icon size={16} aria-hidden="true" /></button>)}
  </div>;
}
