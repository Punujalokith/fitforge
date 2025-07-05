"use client";
import { useEffect, useState } from "react";
import { getDashboardStatsRealTime, getRecentAttendance, getRecentPaymentsRealTime } from "@/lib/firestore";
import RevenueChart from "@/components/dashboard/RevenueChart";
import MembershipChart from "@/components/dashboard/MembershipChart";

const planColor: Record<string, string> = {
  Premium: "bg-[#00D4FF]/10 text-[#00D4FF]",
  Standard: "bg-[#00C896]/10 text-[#00C896]",
  Basic: "bg-[#A855F7]/10 text-[#A855F7]",
};

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalMembers: 0, todayCheckins: 0, monthlyRevenue: 0, activePlans: 0 });
  const [checkins, setCheckins] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const unsub1 = getDashboardStatsRealTime(setStats);
    const unsub2 = getRecentAttendance(setCheckins);
    const unsub3 = getRecentPaymentsRealTime(setPayments);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const formatTime = (ts: any) => {
    if (!ts) return "Just now";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  const kpis = [
    { label: "Total Members", value: stats.totalMembers.toLocaleString(), change: "+12.5%", up: true, icon: "👥", border: "border-b-[#00D4FF]", iconBg: "bg-[#00D4FF]/10" },
    { label: "Today's Check-ins", value: stats.todayCheckins.toLocaleString(), change: "+8.2%", up: true, icon: "🏃", border: "border-b-[#00C896]", iconBg: "bg-[#00C896]/10" },
    { label: "Monthly Revenue", value: `$${stats.monthlyRevenue.toLocaleString()}`, change: "+15.3%", up: true, icon: "💲", border: "border-b-[#A855F7]", iconBg: "bg-[#A855F7]/10" },
    { label: "Active Plans", value: stats.activePlans.toLocaleString(), change: "-2.1%", up: false, icon: "📈", border: "border-b-[#F59E0B]", iconBg: "bg-[#F59E0B]/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-0.5">Welcome back! Here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`bg-[#16161f] border border-white/5 border-b-2 ${k.border} rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/50 text-sm">{k.label}</p>
              <div className={`w-9 h-9 rounded-lg ${k.iconBg} flex items-center justify-center text-base`}>{k.icon}</div>
            </div>
            <p className="text-2xl font-bold text-white">{k.value}</p>
            <p className={`text-xs mt-1 font-medium ${k.up ? "text-[#00C896]" : "text-red-400"}`}>
              {k.up ? "↑" : "↓"} {k.change}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-[#16161f] border border-white/5 rounded-xl p-5">
          <h2 className="text-white font-semibold text-base mb-4">Revenue (Last 7 Days)</h2>
          <RevenueChart />
        </div>
        <div className="bg-[#16161f] border border-white/5 rounded-xl p-5">
          <h2 className="text-white font-semibold text-base mb-2">Membership Distribution</h2>
          <MembershipChart />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Live Attendance Feed */}
        <div className="bg-[#16161f] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-base">Live Attendance Feed</h2>
            <span className="flex items-center gap-1.5 text-xs text-[#00C896]">
              <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse" /> Live
            </span>
          </div>
          {checkins.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-8">No check-ins yet today</p>
          ) : (
            <div className="space-y-2">
              {checkins.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-[#1e1e2a] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00C896] to-[#00D4FF] flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
                      {c.memberInitials}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{c.memberName}</p>
                      <p className="text-white/40 text-xs">{formatTime(c.checkInTime)}</p>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C896] flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-[#16161f] border border-white/5 rounded-xl p-5">
          <h2 className="text-white font-semibold text-base mb-4">Recent Payments</h2>
          {payments.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-8">No payments yet</p>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-4 text-white/30 text-xs px-2 pb-2">
                <span className="col-span-2">Member</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {payments.map((p) => (
                <div key={p.id} className="grid grid-cols-4 items-center px-2 py-2.5 rounded-lg hover:bg-white/5 transition-all">
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00C896] to-[#00D4FF] flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
                      {p.memberName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-white text-sm truncate">{p.memberName}</span>
                  </div>
                  <span className="text-white font-semibold text-sm">${p.amount}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md w-fit ${
                    p.status === "Paid" ? "bg-[#00C896]/10 text-[#00C896]" :
                    p.status === "Pending" ? "bg-yellow-500/10 text-yellow-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
