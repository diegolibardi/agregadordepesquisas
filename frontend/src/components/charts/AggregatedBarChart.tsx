"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import type { AggregatedStanding } from "@/types/api";

interface Props {
  standings: AggregatedStanding[];
}

export default function AggregatedBarChart({ standings }: Props) {
  const data = [...standings]
    .sort((a, b) => b.aggregated_pct - a.aggregated_pct)
    .map((s) => ({
      name: s.candidate_name,
      party: s.party,
      pct: s.aggregated_pct,
      color: s.color_hex ?? "#3b82f6",
    }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 60)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 48, left: 120, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={112}
          tick={{ fontSize: 13, fontWeight: 600 }}
        />
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(1)}%`, "Agregado"]}
          labelFormatter={(label) => {
            const entry = data.find((d) => d.name === label);
            return `${label} (${entry?.party ?? ""})`;
          }}
        />
        <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
          <LabelList
            dataKey="pct"
            position="right"
            formatter={(v: number) => `${v.toFixed(1)}%`}
            style={{ fontSize: 13, fontWeight: 700 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
