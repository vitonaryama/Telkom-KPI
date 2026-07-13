import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function StorageDonut({ usedPct }) {
  const data = [{ name: "used", value: usedPct }, { name: "free", value: 100 - usedPct }];
  return (
    <div className="relative w-32 h-32 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={44} outerRadius={58} startAngle={90} endAngle={-270} stroke="none">
            <Cell fill="#dc2626" />
            <Cell fill="#f1f5f9" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{usedPct}%</span>
        <span className="text-[10px] text-gray-400">USED</span>
      </div>
    </div>
  );
}
