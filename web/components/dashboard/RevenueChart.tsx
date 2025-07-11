"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { day: "Mon", revenue: 7000 },
  { day: "Tue", revenue: 7200 },
  { day: "Wed", revenue: 6800 },
  { day: "Thu", revenue: 8500 },
  { day: "Fri", revenue: 9800 },
  { day: "Sat", revenue: 12500 },
  { day: "Sun", revenue: 10500 },
];

export default function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
        <Tooltip
          contentStyle={{ backgroundColor: "#1e1e2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13 }}
          formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="revenue" fill="#00D4FF" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
