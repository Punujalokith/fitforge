"use client";
import { useState, useEffect } from "react";
import { Search, Plus, Pencil, RefreshCw, X, Loader2, History, CreditCard, Copy, Check, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { getMembersRealTime, addMember, updateMember, deleteMember, getPaymentsByMemberOnce } from "@/lib/firestore";

const planColor: Record<string, string> = {
  Premium: "bg-[#00D4FF]/10 text-[#00D4FF]",
  Standard: "bg-[#00C896]/10 text-[#00C896]",
  Basic: "bg-[#A855F7]/10 text-[#A855F7]",
};

const statusStyle: Record<string, string> = {
  Paid: "bg-[#00C896]/10 text-[#00C896]",
  Pending: "bg-yellow-500/10 text-yellow-400",
  Failed: "bg-red-500/10 text-red-400",
};

const tabs = ["All Members", "Premium", "Standard", "Basic", "Expired"];
const emptyForm = { name: "", email: "", phone: "", plan: "Standard", status: "Active", trainer: "", joinedDate: "" };

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("All Members");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyMember, setHistoryMember] = useState<any>(null);
  const [historyPayments, setHistoryPayments] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [newMemberResult, setNewMemberResult] = useState<{ memberId: string; tempPassword: string; name: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<any>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const unsub = getMembersRealTime((data) => { setMembers(data); setLoading(false); });
    return () => unsub();
  }, []);

  const filtered = members.filter((m) => {
    const matchTab =
      activeTab === "All Members" ? true :
      activeTab === "Expired" ? m.status === "Expired" :
      m.plan === activeTab;
    const matchSearch =
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.memberId?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const getInitials = (name: string) =>
    name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "??";

  const openAdd = () => { setForm(emptyForm); setEditMember(null); setShowModal(true); };
  const openEdit = (m: any) => {
    setForm({ name: m.name, email: m.email, phone: m.phone || "", plan: m.plan, status: m.status, trainer: m.trainer || "", joinedDate: m.joinedDate || "" });
    setEditMember(m);
    setShowModal(true);
  };

  const openHistory = async (m: any) => {
    setHistoryMember(m);
    setHistoryLoading(true);
    const payments = await getPaymentsByMemberOnce(m.id);
    setHistoryPayments(payments);
    setHistoryLoading(false);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      if (editMember) {
        await updateMember(editMember.id, form);
        setShowModal(false);
      } else {
        const joinedDate = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
        const { docRef, memberId: generatedMemberId } = await addMember({ ...form, joinedDate, passwordChanged: false });

        // Generate a strong fallback password immediately
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        let tempPassword = `${generatedMemberId}-${new Date().getFullYear()}-${rand}`;
        let uid: string | undefined;

        // Try Firebase Admin API — gracefully skip if not configured
        try {
          const res = await fetch("/api/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "createMember", email: form.email, memberId: generatedMemberId, name: form.name }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.tempPassword) tempPassword = data.tempPassword;
            if (data.uid) uid = data.uid;
          }
        } catch { /* API not configured — fallback password will be used */ }

        await updateMember(docRef.id, {
          ...(uid ? { uid } : {}),
          tempPassword,
          passwordChanged: false,
        });
        setShowModal(false);
        setNewMemberResult({ memberId: generatedMemberId, tempPassword, name: form.name });
      }
    } catch (err) {
      console.error("Failed to save member:", err);
    } finally { setSaving(false); }
  };

  const handleResetPassword = async (member: any) => {
    setResetTarget(member);
    setResetResult(null);
  };

  const confirmReset = async () => {
    if (!resetTarget) return;
    setResetLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetPassword", uid: resetTarget.uid, memberId: resetTarget.memberId }),
      });
      const data = await res.json();
      if (data.tempPassword) {
        await updateMember(resetTarget.id, { tempPassword: data.tempPassword, passwordChanged: false });
        setResetResult(data.tempPassword);
      }
    } finally { setResetLoading(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      // Delete Firebase Auth user if uid exists
      if (deleteTarget.uid) {
        await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "deleteMember", uid: deleteTarget.uid }),
        });
      }
      // Delete Firestore document
      await deleteMember(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="text-white/40 text-sm mt-0.5">Manage and track all gym members</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#00C896] hover:bg-[#00b085] text-black font-semibold px-4 py-2.5 rounded-xl transition-all text-sm">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      <div className="bg-[#16161f] border border-white/5 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 bg-[#1e1e2a] border border-white/5 rounded-xl px-4 py-2.5">
          <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or member ID (FF-XXXX)..."
            className="bg-transparent text-sm text-white placeholder:text-white/30 outline-none w-full" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-[#00D4FF] text-black" : "bg-[#1e1e2a] text-white/50 hover:text-white"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" /></div>}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.length === 0 && <div className="col-span-full text-center py-20 text-white/20">No members found</div>}
          {filtered.map((member) => (
            <div key={member.id} className={`bg-[#16161f] border hover:border-white/10 rounded-xl p-5 flex flex-col items-center text-center transition-all ${member.passwordChanged === false && member.tempPassword ? "border-yellow-500/30" : "border-white/5"}`}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00C896] to-[#00D4FF] flex items-center justify-center text-black text-lg font-bold mb-3">
                {getInitials(member.name)}
              </div>
              <h3 className="text-white font-bold text-sm">{member.name}</h3>
              {member.memberId && (
                <span className="mt-1.5 text-xs font-mono font-bold text-[#00D4FF] bg-[#00D4FF]/10 px-2.5 py-0.5 rounded-md tracking-wide">
                  {member.memberId}
                </span>
              )}
              <p className="text-white/40 text-xs mt-1.5">Joined {member.joinedDate}</p>

              {/* Password status */}
              {member.passwordChanged === false && member.tempPassword ? (
                <div className="mt-3 w-full bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2.5">
                  <p className="text-yellow-400 text-[10px] font-medium mb-1.5 flex items-center gap-1">
                    <KeyRound className="w-3 h-3" /> Temp Password — Not changed yet
                  </p>
                  <div className="flex items-center gap-1.5">
                    <code className="flex-1 text-xs text-yellow-300 font-mono bg-black/20 px-2 py-1 rounded-lg truncate">
                      {member.tempPassword}
                    </code>
                    <button onClick={() => copyText(member.tempPassword, member.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 flex-shrink-0">
                      {copied === member.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ) : member.passwordChanged === true ? (
                <div className="mt-3 flex items-center gap-1.5 text-[#00C896] text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Password set by member</span>
                </div>
              ) : null}

              <div className="flex items-center gap-2 mt-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${planColor[member.plan] || "bg-white/10 text-white"}`}>{member.plan}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${member.status === "Active" ? "bg-[#00C896]/10 text-[#00C896]" : "bg-red-500/10 text-red-400"}`}>{member.status}</span>
              </div>
              <p className="text-white/30 text-xs mt-2">Trainer: {member.trainer || "None"}</p>

              <div className="mt-4 w-full space-y-1.5">
                {/* Row 1: Edit + History */}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(member)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1e1e2a] hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-all">
                    <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Edit</span>
                  </button>
                  <button onClick={() => openHistory(member)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1e1e2a] hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-all">
                    <History className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>History</span>
                  </button>
                </div>
                {/* Row 2: Icon actions */}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleResetPassword(member)} title="Reset Password"
                    className="flex-1 flex items-center justify-center py-1.5 rounded-lg bg-[#1e1e2a] hover:bg-yellow-500/20 text-white/40 hover:text-yellow-400 transition-all">
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(member)} title="Delete Member"
                    className="flex-1 flex items-center justify-center py-1.5 rounded-lg bg-[#1e1e2a] hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {member.status === "Expired" && (
                    <button onClick={() => updateMember(member.id, { status: "Active" })} title="Renew Member"
                      className="flex-1 flex items-center justify-center py-1.5 rounded-lg bg-[#00C896] hover:bg-[#00b085] text-black transition-all">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Member Created — show credentials */}
      {newMemberResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-[#00C896]/30 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#00C896]/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#00C896]" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Member Created!</h2>
                <p className="text-white/40 text-sm">Share these login details with {newMemberResult.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-[#1e1e2a] rounded-xl p-4">
                <p className="text-white/40 text-xs mb-1">Member ID</p>
                <div className="flex items-center justify-between">
                  <code className="text-[#00D4FF] font-mono font-bold text-lg">{newMemberResult.memberId}</code>
                  <button onClick={() => copyText(newMemberResult.memberId, "id")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF] text-xs hover:bg-[#00D4FF]/20 transition-all">
                    {copied === "id" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === "id" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="bg-[#1e1e2a] rounded-xl p-4">
                <p className="text-white/40 text-xs mb-1">Temporary Password</p>
                <div className="flex items-center justify-between">
                  <code className="text-yellow-300 font-mono font-bold text-lg">{newMemberResult.tempPassword}</code>
                  <button onClick={() => copyText(newMemberResult.tempPassword, "pw")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs hover:bg-yellow-500/20 transition-all">
                    {copied === "pw" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === "pw" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl p-3">
                <p className="text-[#00D4FF] text-xs">ℹ️ The member will be asked to change this password when they first log into the app.</p>
              </div>
            </div>

            <button onClick={() => setNewMemberResult(null)}
              className="w-full mt-5 py-2.5 rounded-xl bg-[#00C896] text-black text-sm font-bold hover:bg-[#00b085] transition-all">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold text-lg mb-2">Reset Password</h2>
            <p className="text-white/40 text-sm mb-5">
              Reset password for <span className="text-white font-semibold">{resetTarget.name}</span>?
              A new temporary password will be generated.
            </p>

            {resetResult ? (
              <>
                <div className="bg-[#1e1e2a] rounded-xl p-4 mb-4">
                  <p className="text-white/40 text-xs mb-1">New Temporary Password</p>
                  <div className="flex items-center justify-between">
                    <code className="text-yellow-300 font-mono font-bold">{resetResult}</code>
                    <button onClick={() => copyText(resetResult, "reset")}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs">
                      {copied === "reset" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <button onClick={() => { setResetTarget(null); setResetResult(null); }}
                  className="w-full py-2.5 rounded-xl bg-[#00C896] text-black text-sm font-bold">Done</button>
              </>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setResetTarget(null)} className="flex-1 py-2.5 rounded-xl bg-[#1e1e2a] text-white/60 text-sm font-medium hover:bg-white/10">Cancel</button>
                <button onClick={confirmReset} disabled={resetLoading}
                  className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-black text-sm font-bold hover:bg-yellow-400 disabled:opacity-60 flex items-center justify-center gap-2">
                  {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {resetLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Delete Member</h2>
                <p className="text-white/40 text-sm">This action cannot be undone</p>
              </div>
            </div>
            <div className="bg-[#1e1e2a] rounded-xl px-4 py-3 mb-5">
              <p className="text-white font-semibold text-sm">{deleteTarget.name}</p>
              {deleteTarget.memberId && (
                <p className="text-[#00D4FF] font-mono text-xs mt-0.5">{deleteTarget.memberId}</p>
              )}
              <p className="text-white/40 text-xs mt-0.5">{deleteTarget.email}</p>
            </div>
            <p className="text-white/50 text-sm mb-5">
              This will permanently remove the member from Firestore and revoke their login access.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#1e1e2a] text-white/60 text-sm font-medium hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
                {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">{editMember ? "Edit Member" : "Add New Member"}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {!editMember && (
              <div className="bg-[#00C896]/5 border border-[#00C896]/20 rounded-xl px-4 py-3 mb-4 space-y-1">
                <p className="text-[#00C896] text-xs font-medium">✨ Auto-generated on save:</p>
                <p className="text-white/50 text-xs">• Unique Member ID (FF-XXXX)</p>
                <p className="text-white/50 text-xs">• Temporary login password</p>
              </div>
            )}
            {editMember?.memberId && (
              <div className="bg-[#1e1e2a] rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
                <span className="text-white/40 text-xs">Member ID:</span>
                <span className="text-[#00D4FF] font-mono font-bold text-sm">{editMember.memberId}</span>
              </div>
            )}
            <div className="space-y-3">
              {[
                { key: "name", label: "Full Name", placeholder: "Enter full name" },
                { key: "email", label: "Email", placeholder: "Enter email address" },
                { key: "phone", label: "Phone", placeholder: "Enter phone number" },
                { key: "trainer", label: "Trainer Name", placeholder: "Assigned trainer (optional)" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-white/40 text-xs mb-1 block">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#00D4FF]/50 transition-all" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "plan", label: "Plan", options: ["Premium", "Standard", "Basic"] },
                  { key: "status", label: "Status", options: ["Active", "Expired"] },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-white/40 text-xs mb-1 block">{f.label}</label>
                    <select value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none">
                      {f.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#1e1e2a] text-white/60 text-sm font-medium hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#00C896] text-black text-sm font-bold hover:bg-[#00b085] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Creating..." : editMember ? "Save Changes" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {historyMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#00D4FF]" /> Payment History
                </h2>
                <p className="text-white/40 text-sm mt-0.5">
                  {historyMember.name}
                  {historyMember.memberId && <span className="ml-2 font-mono text-[#00D4FF] text-xs bg-[#00D4FF]/10 px-2 py-0.5 rounded">{historyMember.memberId}</span>}
                </p>
              </div>
              <button onClick={() => { setHistoryMember(null); setHistoryPayments([]); }} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {historyLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-[#00D4FF] animate-spin" /></div>
            ) : historyPayments.length === 0 ? (
              <p className="text-white/20 text-sm text-center py-10">No payment records found.</p>
            ) : (
              <>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {historyPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-[#1e1e2a] rounded-xl px-4 py-3">
                      <div>
                        <p className="text-white text-sm font-medium">{p.month || p.date || "—"}</p>
                        <p className="text-white/40 text-xs mt-0.5">{p.plan} · {p.method || "—"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold text-sm">${p.amount}</span>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${statusStyle[p.status] || "bg-white/10 text-white"}`}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Paid", value: `$${historyPayments.filter(p => p.status === "Paid").reduce((s, p) => s + Number(p.amount || 0), 0)}`, color: "text-[#00C896]" },
                    { label: "Pending", value: `$${historyPayments.filter(p => p.status === "Pending").reduce((s, p) => s + Number(p.amount || 0), 0)}`, color: "text-yellow-400" },
                    { label: "Payments", value: historyPayments.length.toString(), color: "text-[#00D4FF]" },
                  ].map((s) => (
                    <div key={s.label} className="bg-[#1e1e2a] rounded-xl p-3 text-center">
                      <p className="text-white/40 text-xs">{s.label}</p>
                      <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
