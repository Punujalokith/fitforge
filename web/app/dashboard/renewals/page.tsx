"use client";
import { useState, useEffect } from "react";
import { Plus, X, Loader2, CheckCircle, XCircle, RefreshCw, Clock } from "lucide-react";
import { getRenewalsRealTime, addRenewalRequest, approveRenewal, rejectRenewal, getMemberByCode } from "@/lib/firestore";

const statusStyle: Record<string, string> = {
  Pending: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  Approved: "bg-[#00C896]/10 text-[#00C896] border border-[#00C896]/20",
  Rejected: "bg-red-500/10 text-red-400 border border-red-500/20",
};

const planColor: Record<string, string> = {
  Premium: "bg-[#00D4FF]/10 text-[#00D4FF]",
  Standard: "bg-[#00C896]/10 text-[#00C896]",
  Basic: "bg-[#A855F7]/10 text-[#A855F7]",
};

export default function RenewalsPage() {
  const [renewals, setRenewals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [memberCode, setMemberCode] = useState("");
  const [foundMember, setFoundMember] = useState<any>(null);
  const [plan, setPlan] = useState("Standard");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsub = getRenewalsRealTime((data) => { setRenewals(data); setLoading(false); });
    return () => unsub();
  }, []);

  const filtered = filter === "All" ? renewals : renewals.filter((r) => r.status === filter);
  const pendingCount = renewals.filter((r) => r.status === "Pending").length;

  const handleLookup = async () => {
    if (!memberCode.trim()) return;
    setLookingUp(true); setLookupError(""); setFoundMember(null);
    const member = await getMemberByCode(memberCode.trim());
    if (member) {
      setFoundMember(member);
      setPlan(member.plan || "Standard");
    } else {
      setLookupError("Member not found. Please check the ID.");
    }
    setLookingUp(false);
  };

  const handleAddRenewal = async () => {
    if (!foundMember) return;
    setSaving(true);
    try {
      await addRenewalRequest({
        memberDocId: foundMember.id,
        memberId: foundMember.memberId,
        memberName: foundMember.name,
        plan,
        currentStatus: foundMember.status,
        requestedBy: "owner",
      });
      setShowModal(false);
      setMemberCode(""); setFoundMember(null); setLookupError("");
    } finally { setSaving(false); }
  };

  const handleApprove = async (r: any) => {
    setActionLoading(r.id);
    try { await approveRenewal(r.id, r.memberDocId); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (r: any) => {
    setActionLoading(r.id);
    try { await rejectRenewal(r.id); }
    finally { setActionLoading(null); }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Renewals</h1>
          <p className="text-white/40 text-sm mt-0.5">Manage membership renewal requests</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#00C896] hover:bg-[#00b085] text-black font-semibold px-4 py-2.5 rounded-xl transition-all text-sm">
          <Plus className="w-4 h-4" /> New Renewal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: renewals.length.toString(), color: "text-[#00D4FF]" },
          { label: "Pending", value: pendingCount.toString(), color: "text-yellow-400" },
          { label: "Approved", value: renewals.filter(r => r.status === "Approved").length.toString(), color: "text-[#00C896]" },
          { label: "Rejected", value: renewals.filter(r => r.status === "Rejected").length.toString(), color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[#16161f] border border-white/5 rounded-xl p-5">
            <p className="text-white/40 text-sm">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {["All", "Pending", "Approved", "Rejected"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f ? "bg-[#00D4FF] text-black" : "bg-[#16161f] border border-white/5 text-white/50 hover:text-white"}`}>
            {f}
            {f === "Pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-black text-xs font-bold w-4 h-4 rounded-full inline-flex items-center justify-center">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" /></div>}

      {!loading && (
        <div className="bg-[#16161f] border border-white/5 rounded-xl">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-white/20">
              <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No {filter !== "All" ? filter.toLowerCase() : ""} renewal requests</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-all">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00C896] to-[#00D4FF] flex items-center justify-center text-black text-sm font-bold flex-shrink-0">
                    {r.memberName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "??"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{r.memberName}</p>
                      {r.memberId && <span className="text-xs font-mono text-[#00D4FF] bg-[#00D4FF]/10 px-1.5 py-0.5 rounded">{r.memberId}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${planColor[r.plan] || "bg-white/10 text-white"}`}>{r.plan}</span>
                      <span className="text-white/30 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(r.createdAt)}</span>
                      {r.requestedBy === "owner" && <span className="text-white/20 text-xs">by owner</span>}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg flex-shrink-0 ${statusStyle[r.status] || ""}`}>{r.status}</span>
                  {r.status === "Pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleApprove(r)} disabled={actionLoading === r.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00C896]/10 text-[#00C896] hover:bg-[#00C896]/20 text-xs font-medium transition-all disabled:opacity-50">
                        {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button onClick={() => handleReject(r)} disabled={actionLoading === r.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all disabled:opacity-50">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                  {r.status === "Approved" && <span className="text-white/20 text-xs flex-shrink-0">{formatDate(r.approvedAt)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Renewal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">New Renewal Request</h2>
              <button onClick={() => { setShowModal(false); setMemberCode(""); setFoundMember(null); setLookupError(""); }} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/40 text-xs mb-1 block">Member ID (FF-XXXX)</label>
                <div className="flex gap-2">
                  <input value={memberCode} onChange={(e) => { setMemberCode(e.target.value.toUpperCase()); setFoundMember(null); setLookupError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    placeholder="e.g. FF-0042"
                    className="flex-1 bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono outline-none focus:border-[#00D4FF]/50 transition-all" />
                  <button onClick={handleLookup} disabled={lookingUp || !memberCode.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#00D4FF] text-black text-sm font-bold hover:bg-[#00c0e8] transition-all disabled:opacity-60 flex-shrink-0">
                    {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
                  </button>
                </div>
                {lookupError && <p className="text-red-400 text-xs mt-1">{lookupError}</p>}
              </div>

              {foundMember && (
                <div className="bg-[#00C896]/5 border border-[#00C896]/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00C896] to-[#00D4FF] flex items-center justify-center text-black text-sm font-bold">
                      {foundMember.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{foundMember.name}</p>
                      <p className="text-white/40 text-xs">{foundMember.email}</p>
                    </div>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-lg ${foundMember.status === "Active" ? "bg-[#00C896]/10 text-[#00C896]" : "bg-red-500/10 text-red-400"}`}>{foundMember.status}</span>
                  </div>
                </div>
              )}

              {foundMember && (
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Renew to Plan</label>
                  <select value={plan} onChange={(e) => setPlan(e.target.value)}
                    className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none">
                    <option>Premium</option>
                    <option>Standard</option>
                    <option>Basic</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setMemberCode(""); setFoundMember(null); setLookupError(""); }} className="flex-1 py-2.5 rounded-xl bg-[#1e1e2a] text-white/60 text-sm font-medium hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleAddRenewal} disabled={saving || !foundMember}
                className="flex-1 py-2.5 rounded-xl bg-[#00C896] text-black text-sm font-bold hover:bg-[#00b085] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Creating..." : "Create Renewal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
