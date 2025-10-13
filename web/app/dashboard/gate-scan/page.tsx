"use client";
import { useEffect, useRef, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMemberByCode, checkInMember, getTrainerByCoachId, startCoachShift, endCoachShift } from "@/lib/firestore";
import { CheckCircle, XCircle, QrCode, Loader2, LogIn, LogOut } from "lucide-react";

type ScanResult =
  | { type: "member-success"; memberName: string; plan: string; memberId: string }
  | { type: "coach-in";  coachName: string; coachId: string }
  | { type: "coach-out"; coachName: string; coachId: string }
  | { type: "expired";   memberName: string }
  | { type: "not-found" }
  | { type: "error" }
  | null;

export default function GateScanPage() {
  const inputRef    = useRef<HTMLInputElement>(null);
  const resetRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [buffer, setBuffer]         = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult]         = useState<ScanResult>(null);
  const [gateOpen, setGateOpen]     = useState(false);
  const [activated, setActivated]   = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "meta", "gate"), (snap) => {
      setGateOpen(snap.exists() ? (snap.data()?.isOpen ?? false) : false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activated) return;
    const focus = () => { if (!processing) inputRef.current?.focus(); };
    focus();
    document.addEventListener("click", focus);
    return () => document.removeEventListener("click", focus);
  }, [activated, processing]);

  const reset = () => {
    setResult(null);
    setBuffer("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const processCode = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || processing) return;
    setProcessing(true);
    setResult(null);

    try {
      // ── Coach QR code (FC-XXXX) ──────────────────────────
      if (trimmed.startsWith("FC-")) {
        const trainer = await getTrainerByCoachId(trimmed);
        if (!trainer) {
          setResult({ type: "not-found" });
        } else if (trainer.isOnDuty && trainer.currentShiftId) {
          await endCoachShift(trainer.id, trainer.currentShiftId);
          setResult({ type: "coach-out", coachName: trainer.name, coachId: trimmed });
        } else {
          await startCoachShift(trainer.id, trimmed, trainer.name);
          setResult({ type: "coach-in", coachName: trainer.name, coachId: trimmed });
        }
        return;
      }

      // ── Member QR code (FF-XXXX) ─────────────────────────
      const member = await getMemberByCode(trimmed);
      if (!member) {
        setResult({ type: "not-found" });
      } else if (member.status === "Expired") {
        setResult({ type: "expired", memberName: member.name });
      } else {
        const initials = (member.name as string)
          .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
        await checkInMember(member.memberId, member.name, initials, member.id);
        setResult({
          type: "member-success",
          memberName: member.name,
          plan: member.plan || "Standard",
          memberId: member.memberId || trimmed,
        });
      }
    } catch {
      setResult({ type: "error" });
    } finally {
      setProcessing(false);
      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(reset, 4000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = buffer;
      setBuffer("");
      processCode(val);
    }
  };

  const resultColor =
    result?.type === "member-success" || result?.type === "coach-in"  ? "bg-[#00C896]" :
    result?.type === "coach-out"                                        ? "bg-[#A855F7]" :
    result?.type === "expired"                                          ? "bg-red-500"   :
    "bg-yellow-500";

  return (
    <div
      className="fixed inset-0 z-[200] bg-[#0D0D12] flex flex-col items-center justify-center select-none cursor-none"
      onClick={() => { setActivated(true); inputRef.current?.focus(); }}
    >
      {/* Hidden scanner input */}
      <input
        ref={inputRef}
        value={buffer}
        onChange={(e) => setBuffer(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        className="fixed -top-40 opacity-0 w-0 h-0 pointer-events-none"
        readOnly={processing}
      />

      {/* Gate status — top right */}
      <div className="absolute top-6 right-8 flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${gateOpen ? "bg-[#00C896] animate-pulse" : "bg-red-500"}`} />
        <span className="text-white/40 text-sm font-medium">Gate {gateOpen ? "Open" : "Closed"}</span>
      </div>

      {/* Branding */}
      <div className="text-center mb-14">
        <p className="text-[#00D4FF] text-xs font-bold tracking-[0.3em] mb-3 uppercase">
          PowerZone Fitness
        </p>
        <h1 className="text-white text-4xl font-black tracking-tight">Gate Scanner</h1>
        <p className="text-white/30 text-sm mt-2">Scan member or coach QR code</p>
      </div>

      {/* ─── IDLE STATE ─── */}
      {!result && !processing && (
        <div className="flex flex-col items-center gap-6">
          <div className={`w-52 h-52 rounded-3xl border-2 border-dashed flex items-center justify-center transition-colors ${
            activated
              ? buffer.length > 0
                ? "border-[#00D4FF]/60 bg-[#00D4FF]/5"
                : "border-white/20 bg-white/[0.02]"
              : "border-white/10 bg-white/[0.01]"
          }`}>
            <QrCode className={`w-20 h-20 transition-colors ${activated ? "text-white/30" : "text-white/10"}`} />
          </div>
          {!activated ? (
            <p className="text-white/30 text-base animate-pulse">Click anywhere to activate scanner</p>
          ) : buffer.length > 0 ? (
            <p className="text-[#00D4FF] text-2xl font-mono tracking-[0.25em] font-bold">{buffer}</p>
          ) : (
            <p className="text-white/40 text-base">Ready — waiting for scan</p>
          )}
        </div>
      )}

      {/* ─── PROCESSING ─── */}
      {processing && (
        <div className="flex flex-col items-center gap-5">
          <Loader2 className="w-24 h-24 text-[#00D4FF] animate-spin" />
          <p className="text-white/60 text-xl font-medium">Processing...</p>
        </div>
      )}

      {/* ─── MEMBER CHECK-IN SUCCESS ─── */}
      {result?.type === "member-success" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-28 h-28 rounded-full bg-[#00C896]/20 border-2 border-[#00C896] flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-[#00C896]" />
          </div>
          <div>
            <p className="text-[#00C896] text-5xl font-black tracking-tight">{result.memberName}</p>
            <p className="text-white/40 text-base mt-2">{result.memberId} · {result.plan} Plan</p>
          </div>
          <div className="px-8 py-3 rounded-2xl bg-[#00C896]/10 border border-[#00C896]/20">
            <p className="text-[#00C896] text-xl font-bold">Welcome! ✓</p>
          </div>
        </div>
      )}

      {/* ─── COACH CLOCKED IN ─── */}
      {result?.type === "coach-in" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-28 h-28 rounded-full bg-[#00C896]/20 border-2 border-[#00C896] flex items-center justify-center">
            <LogIn className="w-14 h-14 text-[#00C896]" />
          </div>
          <div>
            <p className="text-[#00C896] text-5xl font-black tracking-tight">{result.coachName}</p>
            <p className="text-white/40 text-base mt-2">{result.coachId} · Coach</p>
          </div>
          <div className="px-8 py-3 rounded-2xl bg-[#00C896]/10 border border-[#00C896]/20">
            <p className="text-[#00C896] text-xl font-bold">Shift Started ✓</p>
          </div>
        </div>
      )}

      {/* ─── COACH CLOCKED OUT ─── */}
      {result?.type === "coach-out" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-28 h-28 rounded-full bg-[#A855F7]/20 border-2 border-[#A855F7] flex items-center justify-center">
            <LogOut className="w-14 h-14 text-[#A855F7]" />
          </div>
          <div>
            <p className="text-[#A855F7] text-5xl font-black tracking-tight">{result.coachName}</p>
            <p className="text-white/40 text-base mt-2">{result.coachId} · Coach</p>
          </div>
          <div className="px-8 py-3 rounded-2xl bg-[#A855F7]/10 border border-[#A855F7]/20">
            <p className="text-[#A855F7] text-xl font-bold">Shift Ended</p>
          </div>
        </div>
      )}

      {/* ─── EXPIRED ─── */}
      {result?.type === "expired" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-28 h-28 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
            <XCircle className="w-14 h-14 text-red-400" />
          </div>
          <p className="text-red-400 text-5xl font-black tracking-tight">{result.memberName}</p>
          <p className="text-red-400/80 text-xl font-bold">Membership Expired</p>
          <p className="text-white/30 text-sm">Please renew at the reception desk</p>
        </div>
      )}

      {/* ─── NOT FOUND ─── */}
      {result?.type === "not-found" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-28 h-28 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center">
            <XCircle className="w-14 h-14 text-yellow-400" />
          </div>
          <p className="text-yellow-400 text-3xl font-bold">Not Found</p>
          <p className="text-white/30 text-sm">QR code not recognized — please see staff</p>
        </div>
      )}

      {/* ─── ERROR ─── */}
      {result?.type === "error" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <XCircle className="w-20 h-20 text-red-400" />
          <p className="text-red-400 text-2xl font-bold">Connection Error</p>
          <p className="text-white/30 text-sm">Check internet and try again</p>
        </div>
      )}

      {/* Bottom hint */}
      <p className="absolute bottom-6 text-white/10 text-xs tracking-widest uppercase">
        USB Scanner Mode · FF-XXXX member · FC-XXXX coach
      </p>

      {/* Auto-reset progress bar */}
      {result && (
        <div className="absolute bottom-0 left-0 right-0 h-1">
          <div className={`h-full ${resultColor}`}
            style={{ animation: "shrink 4s linear forwards" }} />
        </div>
      )}

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
