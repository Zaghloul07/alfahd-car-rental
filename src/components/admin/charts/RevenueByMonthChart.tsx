"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyRevenue } from "@/lib/reports/queries";
import { formatEGP } from "@/lib/format";

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export default function RevenueByMonthChart({ data }: { data: MonthlyRevenue[] }) {
  const chartData = data.map((d) => ({ ...d, label: formatMonthLabel(d.month) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey="label" tick={{ fill: "var(--chart-axis)", fontSize: 12 }} axisLine={{ stroke: "var(--chart-grid)" }} tickLine={false} />
        <YAxis
          tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v: number) => formatEGP(v)}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          formatter={(value) => formatEGP(Number(value))}
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={48} fill="var(--chart-series-1)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
