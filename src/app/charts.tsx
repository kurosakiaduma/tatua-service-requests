"use client";

// Client-only Plotly analytics for primary requests and their recent status trends.
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
const FALLBACK_COLORS = {
  text: "#102a2e",
  grid: "#cbdad8",
  primary: "#087f78",
  info: "#155e92",
  success: "#16704b",
  warning: "#8a5a00",
  danger: "#b42318",
};

/** Renders administrator charts while deriving colors from the active theme. */
export function AdminCharts({
  requests,
}: {
  requests: {
    category: string;
    status: string;
    created_at: string;
    updated_at: string;
    duplicate_of: string | null;
  }[];
}) {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState(FALLBACK_COLORS);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const style = getComputedStyle(document.documentElement);
      const read = (name: string, fallbackValue: string) =>
        style.getPropertyValue(name).trim() || fallbackValue;
      setColors({
        text: read("--foreground", FALLBACK_COLORS.text),
        grid: read("--border", FALLBACK_COLORS.grid),
        primary: read("--primary", FALLBACK_COLORS.primary),
        info: read("--info", FALLBACK_COLORS.info),
        success: read("--success", FALLBACK_COLORS.success),
        warning: read("--warning", FALLBACK_COLORS.warning),
        danger: read("--destructive", FALLBACK_COLORS.danger),
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [resolvedTheme]);
  const primary = requests.filter((request) => !request.duplicate_of);
  const categories = [...new Set(primary.map((request) => request.category))];
  const categoryCounts = categories.map(
    (category) => requests.filter((request) => request.category === category).length,
  );
  const open = primary.filter(
    (request) => request.status === "pending" || request.status === "in_progress",
  ).length;
  const resolved = primary.filter((request) => request.status === "resolved").length;
  const rejected = primary.filter((request) => request.status === "rejected").length;
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    return date.toISOString().slice(0, 10);
  });
  const traces = ["pending", "in_progress", "resolved", "rejected"].map((status) => ({
    x: days,
    y: days.map(
      (day) =>
        primary.filter(
          (request) => request.status === status && request.created_at.slice(0, 10) === day,
        ).length,
    ),
    type: "scatter",
    mode: "lines+markers",
    name: status.replace("_", " "),
    line: {
      color:
        status === "resolved"
          ? colors.success
          : status === "rejected"
            ? colors.danger
            : status === "in_progress"
              ? colors.info
              : colors.warning,
    },
  }));
  const layout = {
    autosize: true,
    margin: { t: 20, r: 15, b: 45, l: 40 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: colors.text, family: "Arial" },
    xaxis: { gridcolor: colors.grid },
    yaxis: { gridcolor: colors.grid, dtick: 1 },
    legend: { orientation: "h" },
  };
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Chart
        title="Primary request outcomes"
        summary={`${open} open, ${resolved} resolved and ${rejected} rejected primary requests.`}
      >
        <Suspense fallback={<Skeleton height={260} className="w-full" />}>
          <Plot
            data={[
              {
                values: [open, resolved, rejected],
                labels: ["Open", "Resolved", "Rejected"],
                type: "pie",
                hole: 0.62,
                marker: { colors: [colors.warning, colors.success, colors.danger] },
                textinfo: "label+value",
                hovertemplate: "%{label}: %{value}<extra></extra>",
              },
            ]}
            layout={{ ...layout, showlegend: false }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%", height: "260px" }}
          />
        </Suspense>
      </Chart>
      <Chart
        title="Most reported issues"
        summary={`${categories.map((category, index) => `${category}: ${categoryCounts[index]}`).join(", ")}.`}
      >
        <Suspense fallback={<Skeleton height={260} className="w-full" />}>
          <Plot
            data={[
              {
                x: categories,
                y: categoryCounts,
                type: "bar",
                marker: { color: colors.primary },
                text: categoryCounts.map(String),
                textposition: "auto",
              },
            ]}
            layout={{ ...layout, yaxis: { ...layout.yaxis, dtick: 1 } }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%", height: "260px" }}
          />
        </Suspense>
      </Chart>
      <div className="xl:col-span-2">
        <Chart
          title="Primary requests over the last 14 days"
          summary="A status split line chart for recent primary submissions."
        >
          <Suspense fallback={<Skeleton height={280} className="w-full" />}>
            <Plot
              data={traces}
              layout={layout}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: "100%", height: "280px" }}
            />
          </Suspense>
        </Chart>
      </div>
    </div>
  );
}

function Chart({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <h3 className="px-2 text-base font-bold text-card-foreground">{title}</h3>
      <p className="sr-only">{summary}</p>
      {children}
    </section>
  );
}
