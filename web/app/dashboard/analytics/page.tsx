"use client";
import { useState, useEffect } from "react";
import { getMembersRealTime, getPaymentsRealTime, getAllAttendanceRealTime } from "@/lib/firestore";
import RevenueChart from "@/components/dashboard/RevenueChart";
import MemberGrowthChart from "@/components/dashboard/MemberGrowthChart";
import { Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = false, p = false, a = false;
    const done = () => { if (m && p && a) setLoading(false); };

    const u1 = getMembersRealTime((d) => { setMembers(d); m = true; done(); });
    const u2 = getPaymentsRealTime((d) => { setPayments(d); p = true; done(); });
    const u3 = getAllAttendanceRealTime((d) => { setAttendance(d); a = true; done(); });
    return () => { u1(); u2(); u3(); };
  }, []);

  // ── Computed Stats ───────────────────────────────────────
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "Active").length;
  const expiredMembers = members.filter((m) => m.status === "Expired").length;
  const retention = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
  const churnRate = totalMembers > 0 ? ((expiredMembers / totalMembers) * 100).toFixed(1) : "0.0";

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const newThisMonth = members.filter((m) => {
    const d = m.createdAt?.toDate ? m.createdAt.toDate() : null;
    return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // ── Plan revenue share ───────────────────────────────────
  const paidPayments = payments.filter((p) => p.status === "Paid");
  const totalRevenue = paidPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const planRevenue: Record<string, number> = { Premium: 0, Standard: 0, Basic: 0 };
  paidPayments.forEach((p) => {
    if (planRevenue[p.plan] !== undefined) planRevenue[p.plan] += Number(p.amount || 0);
  });
  const planPct = (plan: string) =>
    totalRevenue > 0 ? Math.round((planRevenue[plan] / totalRevenue) * 100) : 0;

  // ── Plan member count ────────────────────────────────────
  const premiumCount = members.filter((m) => m.plan === "Premium").length;
  const standardCount = members.filter((m) => m.plan === "Standard").length;
  const basicCount = members.filter((m) => m.plan === "Basic").length;

  // ── Most active members ──────────────────────────────────
  const visitMap: Record<string, { name: string; initials: string; visits: number }> = {};
  attendance.forEach((a) => {
    const key = a.memberName || "Unknown";
    if (!visitMap[key]) visitMap[key] = { name: key, initials: a.memberInitials || key.slice(0, 2).toUpperCase(), visits: 0 };
    visitMap[key].visits++;
  });
  const topMembers = Object.values(visitMap)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  // ── Stats cards ──────────────────────────────────────────
  const stats = [
    { label: "Member Retention", value: `${retention}%`, change: `${activeMembers} active`, up: true, color: "text-[#00D4FF]" },
    { label: "New Members (Month)", value: newThisMonth.toString(), change: "this month", up: true, color: "text-[#00C896]" },
    { label: "Total Members", value: totalMembers.toString(), change: `${premiumCount} premium`, up: true, color: "text-[#A855F7]" },
    { label: "Churn Rate", value: `${churnRate}%`, change: `${expiredMembers} expired`, up: Number(churnRate) < 10, color: "text-yellow-400" },
  ];

  const planBars = [
    { name: "Premium", pct: planPct("Premium") || Math.round((premiumCount / (totalMembers || 1)) * 100), color: "bg-[#00D4FF]" },
    { name: "Standard", pct: planPct("Standard") || Math.round((standardCount / (totalMembers || 1)) * 100), color: "bg-[#00C896]" },
    { name: "Basic", pct: planPct("Basic") || Math.round((basicCount / (totalMembers || 1)) * 100), color: "bg-[#A855F7]" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-white/40 text-sm mt-0.5">Deep dive into your gym&apos;s performance metrics</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" /></div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#16161f] border border-white/5 rounded-xl p-5">
                <p className="text-white/40 text-sm">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                <p className={`text-xs mt-1 font-medium ${s.up ? "text-[#00C896]" : "text-red-400"}`}>
                  {s.up ? "↑" : "↓"} {s.change}
                </p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#16161f] border border-white/5 rounded-xl p-5">
              <h2 className="text-white font-semibold text-base mb-4">Revenue Trend (Last 7 Days)</h2>
              <RevenueChart />
            </div>
            <div className="bg-[#16161f] border border-white/5 rounded-xl p-5">
              <h2 className="text-white font-semibold text-base mb-4">Member Growth (Last 6 Months)</h2>
              <MemberGrowthChart />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Top Members */}
            <div className="col-span-2 bg-[#16161f] border border-white/5 rounded-xl p-5">
              <h2 className="text-white font-semibold text-base mb-4">Most Active Members</h2>
              {topMembers.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-8">No attendance data yet</p>
              ) : (
                <div className="space-y-3">
                  {topMembers.map((m, i) => (
                    <div key={m.name} className="flex items-center gap-3 bg-[#1e1e2a] rounded-xl px-4 py-3">
                      <span className="text-white/30 text-sm w-5">{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C896] to-[#00D4FF] flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
                        {m.initials}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{m.name}</p>
                        <p className="text-white/30 text-xs">Total visits recorded</p>
                      </div>
                      <span className="text-[#00D4FF] font-bold text-sm">{m.visits} visits</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plan Distribution */}
            <div className="bg-[#16161f] border border-white/5 rounded-xl p-5">
              <h2 className="text-white font-semibold text-base mb-1">Plan Distribution</h2>
              <p className="text-white/30 text-xs mb-5">By member count</p>
              <div className="space-y-4">
                {planBars.map((p) => (
                  <div key={p.name}>
                    <div className="flex justify-between text-xs text-white/50 mb-1.5">
                      <span>{p.name}</span>
                      <span>{p.pct}%</span>
                    </div>
                    <div className="h-2 bg-[#1e1e2a] rounded-full overflow-hidden">
                      <div className={`h-full ${p.color} rounded-full transition-all duration-700`} style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Member counts */}
              <div className="mt-6 space-y-2">
                {[
                  { label: "Premium", count: premiumCount, color: "text-[#00D4FF]" },
                  { label: "Standard", count: standardCount, color: "text-[#00C896]" },
                  { label: "Basic", count: basicCount, color: "text-[#A855F7]" },
                ].map((p) => (
                  <div key={p.label} className="flex justify-between items-center text-xs">
                    <span className="text-white/40">{p.label} members</span>
                    <span className={`font-bold ${p.color}`}>{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
