"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { month: "Dec", members: 980 },
  { month: "Jan", members: 1050 },
  { month: "Feb", members: 1100 },
  { month: "Mar", members: 1150 },
  { month: "Apr", members: 1200 },
  { month: "May", members: 1247 },
];

export default function MemberGrowthChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: "#1e1e2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13 }} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
        <Line type="monotone" dataKey="members" stroke="#00C896" strokeWidth={2.5} dot={{ fill: "#00C896", r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
