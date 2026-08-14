"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import type { StatusBreakdown } from "@/lib/reports/queries";

const SERIES = [
  "var(--chart-series-1)",
  "var(--chart-series-2)",
  "var(--chart-series-3)",
  "var(--chart-series-4)",
  "var(--chart-series-5)",
  "var(--chart-series-6)",
  "var(--chart-series-7)",
];

export default function ReservationsByStatusChart({ data }: { data: StatusBreakdown[] }) {
  const t = useTranslations("ReservationStatus");

  const chartData = data.map((d) => ({ ...d, label: t(d.status) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="label" tick={{ fill: "var(--chart-axis)", fontSize: 12 }} axisLine={{ stroke: "var(--chart-grid)" }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: "var(--chart-axis)", fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {chartData.map((entry, i) => (
            <Cell key={entry.status} fill={SERIES[i % SERIES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
