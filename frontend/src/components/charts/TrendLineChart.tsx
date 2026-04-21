"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
} from "recharts";
import type { HistoryResponse } from "@/types/api";
import { formatDate } from "@/lib/utils";

interface Props {
  history: HistoryResponse;
}

export default function TrendLineChart({ history }: Props) {
  // Build a unified dataset keyed by poll_date
  const dateSet = new Set<string>();
  history.candidates.forEach((c) =>
    c.data_points.forEach((p) => dateSet.add(p.poll_date))
  );
  const sortedDates = Array.from(dateSet).sort();

  const chartData = sortedDates.map((date) => {
    const row: Record<string, string | number | null> = { date };
    history.candidates.forEach((c) => {
      const point = c.data_points.find((p) => p.poll_date === date);
      row[c.candidate_name] = point ? point.percentage : null;
    });
    return row;
  });

  const colors = history.candidates.map(
    (c) => c.color_hex ?? `hsl(${(c.candidate_id * 67) % 360}, 70%, 50%)`
  );

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11 }}
          angle={-30}
          textAnchor="end"
          height={50}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 12 }}
          width={45}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value?.toFixed(1)}%`,
            name,
          ]}
          labelFormatter={(label) => formatDate(label as string)}
        />
        <Legend />
        {history.candidates.map((cand, i) => (
          <Line
            key={cand.candidate_id}
            type="monotone"
            dataKey={cand.candidate_name}
            stroke={colors[i]}
            strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 2 }}
            connectNulls
            name={`${cand.candidate_name} (${cand.party})`}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
