import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine, Label, Brush
} from "recharts";
import TrendTooltip from "./TrendTooltip.jsx";
import TrendLegend from "./TrendLegend.jsx";
import { EmptyState } from "./shared.jsx";

// Custom label untuk ujung garis (titik terakhir)
const EndLabel = (props) => {
  const { x, y, value, index, dataLength, stroke } = props;
  if (index !== dataLength - 1 || value == null) return null;
  return (
    <text
      x={x + 10}
      y={y}
      dy={4}
      fill={stroke}
      fontSize={11}
      fontWeight="bold"
      textAnchor="start"
    >
      {value.toFixed(1)}%
    </text>
  );
};

export default function TrendChart({ data, lines, target, hiddenLines, onToggleLine, kpiLabel, avg }) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Siapkan map untuk warna series buat tooltip
  const seriesColors = lines.reduce((acc, line) => {
    acc[line.key] = line.color;
    return acc;
  }, {});

  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 20, right: 60, bottom: 10, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
          dy={10}
        />
        
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          dx={-10}
        />
        
        <Tooltip
          content={<TrendTooltip kpiLabel={kpiLabel} seriesColors={seriesColors} />}
          cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        
        <Legend
          content={<TrendLegend hiddenLines={hiddenLines} onToggle={onToggleLine} />}
          verticalAlign="bottom"
        />
        
        {/* Reference Lines */}
        <ReferenceLine y={target} stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" isFront={false}>
          <Label value={`TARGET ${target}%`} position="insideTopRight" fill="#10b981" fontSize={10} fontWeight="bold" />
        </ReferenceLine>
        
        {avg !== undefined && (
          <ReferenceLine y={avg} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" isFront={false}>
            <Label value={`AVERAGE ${avg.toFixed(1)}%`} position="insideBottomRight" fill="#f59e0b" fontSize={10} fontWeight="bold" />
          </ReferenceLine>
        )}

        {/* Garis-garis data (Entity) */}
        {lines.map((line) => {
          if (hiddenLines.has(line.key)) return null;
          return (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              <LabelList
                dataKey={line.key}
                content={(props) => <EndLabel {...props} dataLength={data.length} stroke={line.color} />}
              />
            </Line>
          );
        })}
        {/* Zoom Brush */}
        <Brush dataKey="date" height={30} stroke="#cbd5e1" fill="#f8fafc" />
      </LineChart>
    </ResponsiveContainer>
  );
}
