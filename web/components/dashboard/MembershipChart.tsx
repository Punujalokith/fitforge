"use client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "Premium", value: 450, color: "#00D4FF" },
  { name: "Standard", value: 620, color: "#00C896" },
  { name: "Basic", value: 177, color: "#A855F7" },
];

export default function MembershipChart() {
  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" strokeWidth={0}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 mt-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-white/60 text-sm">{d.name}</span>
            </div>
            <span className="text-white font-semibold text-sm">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
