import React from "react";

interface ChartData {
  label: string;
  value: number;
}

interface ChartProps {
  type: "pie" | "bar" | "line";
  data: ChartData[];
}

export const Chart = ({ type, data }: ChartProps) => (
  <div className="w-full h-32 bg-[var(--background-secondary)] flex items-center justify-center text-[var(--muted)]">
    [Chart: {type}]
    <pre className="text-xs mt-2">{JSON.stringify(data, null, 2)}</pre>
  </div>
);

export default Chart;
