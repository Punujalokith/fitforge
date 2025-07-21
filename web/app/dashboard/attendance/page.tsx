"use client";
import { useState, useEffect } from "react";
import { QrCode, Loader2, DoorOpen, DoorClosed, Users } from "lucide-react";
import { checkInMember, getTodayAttendance, getMembers, getGateStatusRealTime, setGateStatus, getTrainersRealTime } from "@/lib/firestore";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 24 }, (_, i) => `${i}h`);

function getHeatLevel(_day: number, hour: number) {
  if (hour >= 6 && hour <= 9) return hour === 7 ? 4 : 3;
  if (hour >= 17 && hour <= 20) return hour === 18 ? 4 : 3;
  if (hour >= 10 && hour <= 16) return 2;
  if (hour >= 1 && hour <= 5) return 0;
  return 1;
}

const heatColors = ["bg-[#1e1e2a]", "bg-[#312e81]/60", "bg-[#1d4ed8]/50", "bg-[#0891b2]/70", "bg-[#00C896]"];

export default function AttendancePage() {
  const [memberId, setMemberId] = useState("");
  const [checkins, setCheckins] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [gateOpen, setGateOpen] = useState(false);
  const [gateLoading, setGateLoading] = useState(false);

  useEffect(() => { getMembers().then(setMembers); }, []);

  useEffect(() => {
    const u1 = getTodayAttendance(setCheckins);
    const u2 = getGateStatusRealTime(setGateOpen);
    const u3 = getTrainersRealTime(setTrainers);
    return () => { u1(); u2(); u3(); };
  }, []);

  const onDutyCoaches = trainers.filter((t) => t.isOnDuty);

  const handleCheckIn = async () => {
    if (!memberId.trim()) { setError("Please enter a Member ID"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const member = members.find((m) => m.id === memberId || m.memberId === memberId.toUpperCase());
      if (!member) { setError("Member not found. Please check the ID."); setLoading(false); return; }
      const alreadyIn = checkins.find((c) => c.memberId === member.id);
      if (alreadyIn) { setError(`${member.name} already checked in today!`); setLoading(false); return; }
      if (member.status === "Expired") { setError(`${member.name}'s membership has expired.`); setLoading(false); return; }
      await checkInMember(member.id, member.name, member.name.split(" ").map((n: string) => n[0]).join("").toUpperCase());
      setSuccess(`✅ ${member.name} checked in successfully!`);
      setMemberId("");
      setTimeout(() => setSuccess(""), 4000);
    } catch { setError("Check-in failed. Please try again."); }
    finally { setLoading(false); }
  };

  const handleGateToggle = async (open: boolean) => {
    setGateLoading(true);
    try { await setGateStatus(open); }
    finally { setGateLoading(false); }
  };

  const formatTime = (ts: any) => {
    if (!ts) return "Just now";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatShiftTime = (ts: any) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Attendance</h1>
        <p className="text-white/40 text-sm mt-0.5">Track member check-ins and control gate access</p>
      </div>

      {/* Gate Control + On-Duty Coaches */}
      <div className="grid grid-cols-2 gap-4">
        {/* Gate Control */}
        <div className={`rounded-xl border p-5 transition-all ${gateOpen ? "bg-[#00C896]/5 border-[#00C896]/30" : "bg-[#16161f] border-white/5"}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-base">Gate Control</h2>
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${gateOpen ? "bg-[#00C896]/20 text-[#00C896]" : "bg-red-500/10 text-red-400"}`}>
              {gateOpen ? <DoorOpen className="w-3.5 h-3.5" /> : <DoorClosed className="w-3.5 h-3.5" />}
              {gateOpen ? "GATE OPEN" : "GATE CLOSED"}
            </span>
          </div>
          <p className="text-white/40 text-xs mb-4">
            {gateOpen
              ? "Gate is currently open. Members with active memberships may enter."
              : "Gate is locked. Only members with valid memberships can check in."}
          </p>
          <div className="flex gap-3">
            <button onClick={() => handleGateToggle(true)} disabled={gateOpen || gateLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00C896] text-black font-bold text-sm hover:bg-[#00b085] transition-all disabled:opacity-40">
              {gateLoading && !gateOpen ? <Loader2 className="w-4 h-4 animate-spin" /> : <DoorOpen className="w-4 h-4" />}
              Open Gate
            </button>
            <button onClick={() => handleGateToggle(false)} disabled={!gateOpen || gateLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-sm hover:bg-red-500/20 transition-all disabled:opacity-40">
              {gateLoading && gateOpen ? <Loader2 className="w-4 h-4 animate-spin" /> : <DoorClosed className="w-4 h-4" />}
              Close Gate
            </button>
          </div>
        </div>

        {/* On-Duty Coaches */}
        <div className="bg-[#16161f] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-base">On-Duty Coaches</h2>
            <span className="bg-[#00D4FF]/10 text-[#00D4FF] text-xs font-bold px-2.5 py-1 rounded-lg">{onDutyCoaches.length} active</span>
          </div>
          {onDutyCoaches.length === 0 ? (
            <div className="flex items-center justify-center h-16 text-white/20 text-sm">
              <Users className="w-4 h-4 mr-2" /> No coaches on duty
            </div>
          ) : (
            <div className="space-y-2">
              {onDutyCoaches.map((c) => (
                <div key={c.id} className="flex items-center gap-3 bg-[#1e1e2a] rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A855F7] to-[#00D4FF] flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
                    {c.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{c.name}</p>
                    <p className="text-white/30 text-xs">{c.coachId || ""} · Since {formatShiftTime(c.shiftStarted)}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* QR Scanner Panel */}
        <div className="col-span-2 bg-[#16161f] border border-white/5 rounded-xl p-6 flex flex-col items-center">
          <h2 className="text-white font-semibold text-base mb-5 self-start">QR / Member Check-In</h2>
          <div className="w-48 h-48 border-2 border-dashed border-[#00D4FF]/40 rounded-2xl flex flex-col items-center justify-center bg-[#00D4FF]/5 mb-5">
            <QrCode className="w-16 h-16 text-[#00D4FF]" strokeWidth={1.5} />
            <p className="text-white/40 text-xs mt-3 text-center">Scan QR code<br />or enter member ID / FF-XXXX</p>
          </div>

          {error && <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-3 py-2 mb-3 text-center">{error}</div>}
          {success && <div className="w-full bg-[#00C896]/10 border border-[#00C896]/20 text-[#00C896] text-xs rounded-xl px-3 py-2 mb-3 text-center">{success}</div>}

          <input type="text" value={memberId} onChange={(e) => setMemberId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheckIn()}
            placeholder="Member ID or FF-XXXX"
            className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#00D4FF]/50 transition-all mb-3 font-mono" />

          <button onClick={handleCheckIn} disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00C896] to-[#00D4FF] text-black font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Checking in..." : "Check In"}
          </button>

          <div className="w-full mt-5 space-y-2">
            <div className="flex items-center justify-between bg-[#1e1e2a] rounded-xl px-4 py-3">
              <span className="text-white/60 text-sm">Today&apos;s Total</span>
              <span className="text-[#00D4FF] font-bold text-sm">{checkins.length}</span>
            </div>
          </div>
        </div>

        {/* Today's Check-ins */}
        <div className="col-span-3 bg-[#16161f] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-base">Today&apos;s Check-ins</h2>
            <span className="flex items-center gap-1.5 text-xs text-[#00C896]">
              <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse" /> Live
            </span>
          </div>
          {checkins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-white/20">
              <QrCode className="w-10 h-10 mb-3" />
              <p className="text-sm">No check-ins yet today</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {checkins.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-[#1e1e2a] rounded-xl px-4 py-3 hover:bg-[#252532] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00C896] to-[#00D4FF] flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
                      {c.memberInitials}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{c.memberName}</p>
                      <p className="text-white/40 text-xs">🕐 {formatTime(c.checkInTime)}</p>
                    </div>
                  </div>
                  <span className="bg-[#00C896]/10 text-[#00C896] text-xs font-semibold px-3 py-1 rounded-lg border border-[#00C896]/20">Check-in</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-[#16161f] border border-white/5 rounded-xl p-6">
        <h2 className="text-white font-semibold text-base mb-5">Attendance Heatmap (Peak Hours)</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="w-12" />
                {hours.map((h) => <th key={h} className="text-white/30 text-xs font-normal text-center w-8">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {days.map((day, di) => (
                <tr key={day}>
                  <td className="text-white/40 text-xs pr-2 text-right">{day}</td>
                  {hours.map((_, hi) => (
                    <td key={hi}>
                      <div className={`w-7 h-7 rounded-md ${heatColors[getHeatLevel(di, hi)]} transition-all hover:opacity-80`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 mt-4 justify-center">
          <span className="text-white/30 text-xs">Less</span>
          {heatColors.map((c, i) => <div key={i} className={`w-5 h-5 rounded-md ${c}`} />)}
          <span className="text-white/30 text-xs">More</span>
        </div>
      </div>
    </div>
  );
}
