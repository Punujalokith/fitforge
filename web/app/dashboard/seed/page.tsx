"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection, addDoc, setDoc, doc, getDocs,
  deleteDoc, query, where, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Database, CheckCircle, Loader2, AlertCircle, Trash2 } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ts(daysAgo = 0, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return Timestamp.fromDate(d);
}
function dateStr(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}
function monthLabel(monthsAgo = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function shortDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function runSeed(log: (msg: string) => void) {

  // Settings
  log("⚙️  Writing gym settings...");
  await setDoc(doc(db, "settings", "gym"), {
    gymName: "PowerZone Fitness", email: "info@powerzonefitness.com",
    phone: "+1 (555) 247-8800", address: "42 Ironworks Ave, Fitness District, CA 90210",
    currency: "USD", openTime: "05:30", closeTime: "22:00", isDemo: true,
  }, { merge: true });

  // Fetch members
  log("👥  Reading existing members...");
  const membersSnap = await getDocs(collection(db, "members"));
  const members = membersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  log(`   Found ${members.length} members`);
  const m = (name: string) =>
    members.find((x) => x.name?.toLowerCase().includes(name.toLowerCase())) ?? members[0];

  // Payments
  log("💳  Adding payments...");
  const planFee: Record<string, number> = { Premium: 89, Standard: 59, Basic: 39 };
  type PayRow = { member: any; plan: string; status: string; daysAgo: number; monthsAgo: number; method: string };
  const payments: PayRow[] = [
    { member: m("Punuja"),  plan: "Premium",  status: "Paid",    daysAgo: 2,  monthsAgo: 0, method: "Credit Card"   },
    { member: m("Chris"),   plan: "Standard", status: "Paid",    daysAgo: 3,  monthsAgo: 0, method: "Cash"          },
    { member: m("James W"), plan: "Premium",  status: "Paid",    daysAgo: 5,  monthsAgo: 0, method: "Bank Transfer" },
    { member: m("Tom"),     plan: "Premium",  status: "Pending", daysAgo: 1,  monthsAgo: 0, method: "Credit Card"   },
    { member: m("Lisa A"),  plan: "Standard", status: "Paid",    daysAgo: 8,  monthsAgo: 0, method: "Cash"          },
    { member: m("Nina"),    plan: "Basic",    status: "Paid",    daysAgo: 10, monthsAgo: 0, method: "Credit Card"   },
    { member: m("Mike C"),  plan: "Standard", status: "Failed",  daysAgo: 6,  monthsAgo: 0, method: "Credit Card"   },
    { member: m("Emily"),   plan: "Basic",    status: "Paid",    daysAgo: 35, monthsAgo: 1, method: "Cash"          },
    { member: m("Punuja"),  plan: "Premium",  status: "Paid",    daysAgo: 33, monthsAgo: 1, method: "Credit Card"   },
    { member: m("Chris"),   plan: "Standard", status: "Paid",    daysAgo: 32, monthsAgo: 1, method: "Bank Transfer" },
    { member: m("James W"), plan: "Premium",  status: "Paid",    daysAgo: 38, monthsAgo: 1, method: "Credit Card"   },
    { member: m("Lisa A"),  plan: "Standard", status: "Paid",    daysAgo: 40, monthsAgo: 1, method: "Cash"          },
    { member: m("Tom"),     plan: "Premium",  status: "Paid",    daysAgo: 36, monthsAgo: 1, method: "Credit Card"   },
    { member: m("Punuja"),  plan: "Premium",  status: "Paid",    daysAgo: 65, monthsAgo: 2, method: "Credit Card"   },
    { member: m("Chris"),   plan: "Standard", status: "Paid",    daysAgo: 67, monthsAgo: 2, method: "Cash"          },
  ];
  for (const p of payments) {
    if (!p.member) continue;
    await addDoc(collection(db, "payments"), {
      memberDocId: p.member.id, memberName: p.member.name ?? "Unknown",
      memberId: p.member.memberId ?? "", plan: p.plan,
      amount: planFee[p.plan] ?? 59, status: p.status, method: p.method,
      month: monthLabel(p.monthsAgo), date: shortDate(p.daysAgo),
      createdAt: ts(p.daysAgo, 10), isDemo: true,
    });
  }
  log(`   Added ${payments.length} payment records`);

  // Attendance
  log("📅  Adding attendance records...");
  type AttRow = { member: any; daysAgo: number; checkIn: [number, number]; checkOut: [number, number] };
  const attendance: AttRow[] = [
    { member: m("Punuja"),  daysAgo: 0,  checkIn: [7,  15], checkOut: [8,  45] },
    { member: m("James W"), daysAgo: 0,  checkIn: [6,  30], checkOut: [8,   0] },
    { member: m("Tom"),     daysAgo: 0,  checkIn: [8,   0], checkOut: [9,  30] },
    { member: m("Lisa A"),  daysAgo: 0,  checkIn: [9,   0], checkOut: [10, 15] },
    { member: m("Chris"),   daysAgo: 1,  checkIn: [7,   0], checkOut: [8,  30] },
    { member: m("Nina"),    daysAgo: 1,  checkIn: [6,  45], checkOut: [8,   0] },
    { member: m("Mike C"),  daysAgo: 1,  checkIn: [17, 30], checkOut: [19,  0] },
    { member: m("Punuja"),  daysAgo: 2,  checkIn: [7,   0], checkOut: [8,  30] },
    { member: m("James W"), daysAgo: 2,  checkIn: [6,   0], checkOut: [7,  45] },
    { member: m("Tom"),     daysAgo: 2,  checkIn: [18,  0], checkOut: [19, 30] },
    { member: m("Chris"),   daysAgo: 3,  checkIn: [7,  30], checkOut: [9,   0] },
    { member: m("Lisa A"),  daysAgo: 3,  checkIn: [8,  30], checkOut: [10,  0] },
    { member: m("Nina"),    daysAgo: 3,  checkIn: [17,  0], checkOut: [18, 30] },
    { member: m("Punuja"),  daysAgo: 4,  checkIn: [7,   0], checkOut: [8,  45] },
    { member: m("Mike C"),  daysAgo: 4,  checkIn: [6,  30], checkOut: [8,   0] },
    { member: m("Tom"),     daysAgo: 5,  checkIn: [8,   0], checkOut: [9,  30] },
    { member: m("James W"), daysAgo: 5,  checkIn: [6,   0], checkOut: [7,  30] },
    { member: m("Punuja"),  daysAgo: 7,  checkIn: [7,  15], checkOut: [8,  45] },
    { member: m("Chris"),   daysAgo: 8,  checkIn: [7,   0], checkOut: [8,  30] },
    { member: m("Lisa A"),  daysAgo: 10, checkIn: [9,   0], checkOut: [10,  0] },
  ];
  for (const a of attendance) {
    if (!a.member) continue;
    const initials = (a.member.name as string)
      ?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "??";
    await addDoc(collection(db, "attendance"), {
      memberId: a.member.memberId ?? "", memberDocId: a.member.id,
      memberName: a.member.name ?? "Unknown", memberInitials: initials,
      checkInTime: ts(a.daysAgo, a.checkIn[0], a.checkIn[1]),
      checkOutTime: ts(a.daysAgo, a.checkOut[0], a.checkOut[1]),
      date: dateStr(a.daysAgo), isDemo: true,
    });
  }
  log(`   Added ${attendance.length} attendance records`);

  // Classes
  log("🏋️  Adding classes...");
  const classes = [
    { name: "Morning Yoga",          trainer: "Lisa Ray",     schedule: "Mon / Wed / Fri", time: "08:00 AM", duration: "60 min", capacity: 20, enrolled: 14, status: "Active",   color: "#00C896" },
    { name: "HIIT Blast",            trainer: "James Carter", schedule: "Tue / Thu",        time: "06:00 PM", duration: "45 min", capacity: 15, enrolled: 12, status: "Active",   color: "#00D4FF" },
    { name: "Strength & Power",      trainer: "Mike Torres",  schedule: "Mon – Fri",        time: "07:00 AM", duration: "60 min", capacity: 10, enrolled: 8,  status: "Active",   color: "#A855F7" },
    { name: "Spinning Fury",         trainer: "James Carter", schedule: "Mon / Wed / Fri",  time: "05:30 PM", duration: "45 min", capacity: 20, enrolled: 16, status: "Active",   color: "#F59E0B" },
    { name: "Evening Pilates",       trainer: "Lisa Ray",     schedule: "Wed / Fri",        time: "06:30 PM", duration: "50 min", capacity: 12, enrolled: 9,  status: "Active",   color: "#EC4899" },
    { name: "CrossFit Conditioning", trainer: "Mike Torres",  schedule: "Sat / Sun",        time: "09:00 AM", duration: "75 min", capacity: 12, enrolled: 5,  status: "Inactive", color: "#6366F1" },
  ];
  for (const c of classes) {
    await addDoc(collection(db, "classes"), { ...c, createdAt: ts(14), isDemo: true });
  }
  log(`   Added ${classes.length} classes`);

  // Renewals
  log("🔄  Adding renewal requests...");
  const renewals = [
    { member: m("Emily"),  plan: "Basic",    message: "My membership expired. I want to renew for 3 more months.",      daysAgo: 2 },
    { member: m("Mike C"), plan: "Standard", message: "Please renew — had a payment issue last month, can pay cash.",    daysAgo: 4 },
    { member: m("Nina"),   plan: "Premium",  message: "Upgrading from Basic to Premium. I'm ready to make the payment.", daysAgo: 6 },
  ];
  for (const r of renewals) {
    if (!r.member) continue;
    await addDoc(collection(db, "renewals"), {
      memberDocId: r.member.id, memberName: r.member.name ?? "Unknown",
      memberId: r.member.memberId ?? "", currentPlan: r.member.plan ?? "Basic",
      requestedPlan: r.plan, message: r.message, status: "Pending",
      createdAt: ts(r.daysAgo), isDemo: true,
    });
  }
  log(`   Added ${renewals.length} renewal requests`);

  // Announcements
  log("📣  Adding announcements...");
  const announcements = [
    { title: "🎉 New HIIT Classes Starting June!", message: "We're thrilled to announce our new HIIT Blast classes every Tuesday and Thursday at 6 PM, led by Coach James Carter. Spots are limited — sign up at the front desk!", tag: "Class Update", sentAt: ts(1) },
    { title: "🔧 Gym Maintenance — Sunday Closure", message: "PowerZone Fitness will be closed this Sunday for scheduled equipment maintenance and deep cleaning. We reopen Monday at 5:30 AM. Apologies for the inconvenience!", tag: "Notice", sentAt: ts(3) },
    { title: "🏆 Member of the Month: James Wilson", message: "Congratulations to James Wilson — 24 gym visits this month, a new personal best on the bench press, and a constant source of motivation for everyone around him. You earned it!", tag: "Achievement", sentAt: ts(7) },
    { title: "☀️ Summer Membership — 20% Off!", message: "Get ready for summer! All new memberships and renewals in June get 20% off. Premium drops from $89 to $71. Offer ends June 30th. Talk to the front desk to claim your discount.", tag: "Promotion", sentAt: ts(10) },
    { title: "🏋️ New Equipment Has Arrived!", message: "We've upgraded the free weights section with new adjustable dumbbells up to 100 lbs, 3 new squat racks, and a full cable machine. Come check them out!", tag: "Facility Update", sentAt: ts(14) },
  ];
  for (const a of announcements) {
    await addDoc(collection(db, "announcements"), { ...a, isDemo: true });
  }
  log(`   Added ${announcements.length} announcements`);

  log("✅  All demo data seeded successfully!");
}

// ─── Clear demo data ──────────────────────────────────────────────────────────
async function runClear(log: (msg: string) => void) {
  const cols = ["payments", "attendance", "classes", "renewals", "announcements"];
  let total = 0;
  for (const col of cols) {
    log(`🗑️  Clearing ${col}...`);
    const snap = await getDocs(query(collection(db, col), where("isDemo", "==", true)));
    for (const d of snap.docs) await deleteDoc(d.ref);
    log(`   Deleted ${snap.size} demo records from ${col}`);
    total += snap.size;
  }
  log(`✅  Cleared ${total} demo records. Your real data is untouched.`);
}

// ─── Page UI ──────────────────────────────────────────────────────────────────
type Mode = "seed" | "clear";
type Status = "idle" | "running" | "done" | "error";

export default function SeedPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("seed");
  const [status, setStatus] = useState<Status>("idle");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs((p) => [...p, msg]);

  const handleRun = async (m: Mode) => {
    setMode(m);
    setStatus("running");
    setLogs([]);
    try {
      if (m === "seed") await runSeed(addLog);
      else await runClear(addLog);
      setStatus("done");
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
      setStatus("error");
    }
  };

  const isRunning = status === "running";

  return (
    <div className="max-w-xl mx-auto py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Demo Data Manager</h1>
        <p className="text-white/40 text-sm mt-1">
          Add or remove sample data for PowerZone Fitness.
        </p>
      </div>

      {/* Seed card */}
      <div className="bg-[#16161f] border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-[#00C896]" />
          <h2 className="text-white font-semibold">Seed Demo Data</h2>
        </div>
        <div className="space-y-1.5">
          {[
            "⚙️  Gym settings — PowerZone Fitness",
            "💳  15 payment records across 3 months",
            "📅  20 attendance check-in / check-out records",
            "🏋️  6 fitness classes with assigned trainers",
            "🔄  3 membership renewal requests",
            "📣  5 gym announcements",
          ].map((item) => (
            <p key={item} className="text-sm text-white/50">{item}</p>
          ))}
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-300 text-xs">
          ⚠️ Run once only. Running again will add duplicate records.
        </div>
        <button
          onClick={() => handleRun("seed")}
          disabled={isRunning}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00C896] hover:bg-[#00b085] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm transition-all"
        >
          {isRunning && mode === "seed"
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Seeding...</>
            : <><Database className="w-4 h-4" /> Seed Demo Data</>}
        </button>
      </div>

      {/* Clear card */}
      <div className="bg-[#16161f] border border-red-500/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Trash2 className="w-4 h-4 text-red-400" />
          <h2 className="text-white font-semibold">Clear Demo Data</h2>
        </div>
        <p className="text-sm text-white/50">
          Removes only the records tagged <code className="text-white/70 bg-white/5 px-1.5 py-0.5 rounded text-xs">isDemo: true</code>.
          Your real members, trainers, and any data you entered manually are <span className="text-[#00C896]">never touched</span>.
        </p>
        <button
          onClick={() => handleRun("clear")}
          disabled={isRunning}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 font-bold text-sm transition-all"
        >
          {isRunning && mode === "clear"
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Clearing...</>
            : <><Trash2 className="w-4 h-4" /> Clear Demo Data</>}
        </button>
      </div>

      {/* Log output */}
      {logs.length > 0 && (
        <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4 space-y-1 font-mono text-xs text-white/60 max-h-64 overflow-y-auto">
          {logs.map((l, i) => (
            <div key={i} className={
              l.startsWith("✅") ? "text-[#00C896]" :
              l.startsWith("❌") ? "text-red-400" : ""
            }>
              {l}
            </div>
          ))}
          {status === "done" && (
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-3 w-full py-2 rounded-xl bg-[#00D4FF] text-black font-bold text-xs hover:bg-[#00bde0] transition-all"
            >
              Go to Dashboard →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
