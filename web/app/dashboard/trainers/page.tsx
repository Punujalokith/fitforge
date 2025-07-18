"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Star, Users, X, Loader2, Clock, PlayCircle, StopCircle, KeyRound, ShieldCheck, Copy, Check, Trash2 } from "lucide-react";
import { getTrainersRealTime, addTrainer, updateTrainer, startCoachShift, endCoachShift } from "@/lib/firestore";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const emptyForm = { name: "", specialty: "", experience: "", email: "", phone: "", status: "Active" };

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTrainer, setEditTrainer] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [shiftLoading, setShiftLoading] = useState<string | null>(null);
  const [newCoachResult, setNewCoachResult] = useState<{ coachId: string; tempPassword: string; name: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<any>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const unsub = getTrainersRealTime((data) => { setTrainers(data); setLoading(false); });
    return () => unsub();
  }, []);

  const getInitials = (name: string) => name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";
  const openAdd = () => { setForm(emptyForm); setEditTrainer(null); setShowModal(true); };
  const openEdit = (t: any) => {
    setForm({ name: t.name, specialty: t.specialty, experience: t.experience, email: t.email || "", phone: t.phone || "", status: t.status });
    setEditTrainer(t);
    setShowModal(true);
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
      if (editTrainer) {
        await updateTrainer(editTrainer.id, form);
        setShowModal(false);
      } else {
        const { docRef, coachId: generatedCoachId } = await addTrainer({ ...form, passwordChanged: false });

        const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
        let tempPassword = `${generatedCoachId}-${new Date().getFullYear()}-${rand}`;
        let uid: string | undefined;

        try {
          const res = await fetch("/api/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "createCoach", email: form.email, coachId: generatedCoachId, name: form.name }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.tempPassword) tempPassword = data.tempPassword;
            if (data.uid) uid = data.uid;
          }
        } catch { /* API not configured — fallback password will be used */ }

        await updateTrainer(docRef.id, {
          ...(uid ? { uid } : {}),
          tempPassword,
          passwordChanged: false,
        });
        setShowModal(false);
        setNewCoachResult({ coachId: generatedCoachId, tempPassword, name: form.name });
      }
    } catch (err) {
      console.error("Failed to save trainer:", err);
    } finally { setSaving(false); }
  };

  const handleShiftToggle = async (t: any) => {
    setShiftLoading(t.id);
    try {
      if (t.isOnDuty && t.currentShiftId) {
        await endCoachShift(t.id, t.currentShiftId);
      } else {
        await startCoachShift(t.id, t.coachId || t.id, t.name);
      }
    } finally { setShiftLoading(null); }
  };

  const confirmReset = async () => {
    if (!resetTarget) return;
    setResetLoading(true);
    try {
      const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
      let tempPassword = `${resetTarget.coachId}-${new Date().getFullYear()}-${rand}`;

      try {
        const res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resetCoachPassword", uid: resetTarget.uid, coachId: resetTarget.coachId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.tempPassword) tempPassword = data.tempPassword;
        }
      } catch { /* use fallback */ }

      await updateTrainer(resetTarget.id, { tempPassword, passwordChanged: false });
      setResetResult(tempPassword);
    } finally { setResetLoading(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.uid) {
        await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "deleteMember", uid: deleteTarget.uid }),
        });
      }
      await deleteDoc(doc(db, "trainers", deleteTarget.id));
      setDeleteTarget(null);
    } finally { setDeleteLoading(false); }
  };

  const formatShiftTime = (ts: any) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const active = trainers.filter((t) => t.status === "Active").length;
  const onDuty = trainers.filter((t) => t.isOnDuty).length;
  const totalAssigned = trainers.reduce((s, t) => s + (t.members || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trainers</h1>
          <p className="text-white/40 text-sm mt-0.5">Manage your gym trainers and their schedules</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#00C896] hover:bg-[#00b085] text-black font-semibold px-4 py-2.5 rounded-xl transition-all text-sm">
          <Plus className="w-4 h-4" /> Add Trainer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Trainers", value: trainers.length.toString(), color: "text-[#00D4FF]" },
          { label: "Active Trainers", value: active.toString(), color: "text-[#00C896]" },
          { label: "On Duty Now", value: onDuty.toString(), color: "text-yellow-400" },
          { label: "Members Assigned", value: totalAssigned.toString(), color: "text-[#A855F7]" },
        ].map((s) => (
          <div key={s.label} className="bg-[#16161f] border border-white/5 rounded-xl p-5">
            <p className="text-white/40 text-sm">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" /></div>}

      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {trainers.length === 0 && <div className="col-span-3 text-center py-20 text-white/20">No trainers yet. Click &quot;Add Trainer&quot; to get started.</div>}
          {trainers.map((t) => (
            <div key={t.id} className={`bg-[#16161f] border rounded-xl p-5 transition-all ${t.passwordChanged === false && t.tempPassword ? "border-yellow-500/30" : t.isOnDuty ? "border-[#00C896]/30 shadow-[0_0_20px_rgba(0,200,150,0.05)]" : "border-white/5 hover:border-white/10"}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00C896] to-[#00D4FF] flex items-center justify-center text-black font-bold text-sm">{getInitials(t.name)}</div>
                    {t.isOnDuty && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00C896] rounded-full border-2 border-[#16161f]" />}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{t.name}</h3>
                    <p className="text-white/40 text-xs">{t.experience} exp.</p>
                    {t.coachId && (
                      <span className="text-xs font-mono font-bold text-[#A855F7] bg-[#A855F7]/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">{t.coachId}</span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${t.status === "Active" ? "bg-[#00C896]/10 text-[#00C896]" : "bg-red-500/10 text-red-400"}`}>{t.status}</span>
              </div>

              <p className="text-white/50 text-xs mb-3 bg-[#1e1e2a] rounded-lg px-3 py-2">{t.specialty}</p>

              {/* Temp password box */}
              {t.passwordChanged === false && t.tempPassword ? (
                <div className="mb-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2.5">
                  <p className="text-yellow-400 text-[10px] font-medium mb-1.5 flex items-center gap-1">
                    <KeyRound className="w-3 h-3" /> Temp Password — Not changed yet
                  </p>
                  <div className="flex items-center gap-1.5">
                    <code className="flex-1 text-xs text-yellow-300 font-mono bg-black/20 px-2 py-1 rounded-lg truncate">{t.tempPassword}</code>
                    <button onClick={() => copyText(t.tempPassword, t.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 flex-shrink-0">
                      {copied === t.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ) : t.passwordChanged === true ? (
                <div className="mb-3 flex items-center gap-1.5 text-[#00C896] text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Password set by coach</span>
                </div>
              ) : null}

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-white/50 text-xs"><Users className="w-3.5 h-3.5" />{t.members || 0} members</div>
                <div className="flex items-center gap-1 text-yellow-400 text-xs"><Star className="w-3.5 h-3.5 fill-yellow-400" />{t.rating || 5.0}</div>
              </div>

              {/* On Duty Status */}
              {t.isOnDuty ? (
                <div className="flex items-center gap-1.5 bg-[#00C896]/10 border border-[#00C896]/20 rounded-lg px-3 py-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse flex-shrink-0" />
                  <span className="text-[#00C896] text-xs font-medium">On Duty</span>
                  {t.shiftStarted && (
                    <span className="text-white/30 text-xs ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" />Since {formatShiftTime(t.shiftStarted)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-[#1e1e2a] rounded-lg px-3 py-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />
                  <span className="text-white/30 text-xs">Off Duty</span>
                </div>
              )}

              <div className="flex gap-2 mb-1.5">
                <button onClick={() => openEdit(t)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1e1e2a] hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-all">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => handleShiftToggle(t)} disabled={shiftLoading === t.id || t.status !== "Active"}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                    t.isOnDuty
                      ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      : "bg-[#00C896]/10 text-[#00C896] hover:bg-[#00C896]/20"
                  }`}>
                  {shiftLoading === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                    t.isOnDuty ? <><StopCircle className="w-3.5 h-3.5" /> End Shift</> :
                    <><PlayCircle className="w-3.5 h-3.5" /> Start Shift</>
                  }
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setResetTarget(t)} title="Reset Password"
                  className="flex-1 flex items-center justify-center py-1.5 rounded-lg bg-[#1e1e2a] hover:bg-yellow-500/20 text-white/40 hover:text-yellow-400 transition-all text-xs gap-1">
                  <KeyRound className="w-3.5 h-3.5" /> Reset PW
                </button>
                <button onClick={() => setDeleteTarget(t)} title="Delete Trainer"
                  className="flex-1 flex items-center justify-center py-1.5 rounded-lg bg-[#1e1e2a] hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all text-xs gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Coach Credentials Modal */}
      {newCoachResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-[#A855F7]/30 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#A855F7]/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#A855F7]" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Coach Added!</h2>
                <p className="text-white/40 text-sm">Share these login details with {newCoachResult.name}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-[#1e1e2a] rounded-xl p-4">
                <p className="text-white/40 text-xs mb-1">Coach ID</p>
                <div className="flex items-center justify-between">
                  <code className="text-[#A855F7] font-mono font-bold text-lg">{newCoachResult.coachId}</code>
                  <button onClick={() => copyText(newCoachResult.coachId, "cid")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A855F7]/10 text-[#A855F7] text-xs hover:bg-[#A855F7]/20 transition-all">
                    {copied === "cid" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === "cid" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="bg-[#1e1e2a] rounded-xl p-4">
                <p className="text-white/40 text-xs mb-1">Temporary Password</p>
                <div className="flex items-center justify-between">
                  <code className="text-yellow-300 font-mono font-bold text-lg">{newCoachResult.tempPassword}</code>
                  <button onClick={() => copyText(newCoachResult.tempPassword, "cpw")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs hover:bg-yellow-500/20 transition-all">
                    {copied === "cpw" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === "cpw" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="bg-[#A855F7]/5 border border-[#A855F7]/20 rounded-xl p-3">
                <p className="text-[#A855F7] text-xs">ℹ️ The coach will be asked to change this password when they first log into the app. They scan their QR code (FC-XXXX) to mark themselves on duty.</p>
              </div>
            </div>
            <button onClick={() => setNewCoachResult(null)}
              className="w-full mt-5 py-2.5 rounded-xl bg-[#A855F7] text-white text-sm font-bold hover:bg-[#9333ea] transition-all">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold text-lg mb-2">Reset Coach Password</h2>
            <p className="text-white/40 text-sm mb-5">
              Reset password for <span className="text-white font-semibold">{resetTarget.name}</span>? A new temporary password will be generated.
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

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Delete Trainer</h2>
                <p className="text-white/40 text-sm">This action cannot be undone</p>
              </div>
            </div>
            <div className="bg-[#1e1e2a] rounded-xl px-4 py-3 mb-5">
              <p className="text-white font-semibold text-sm">{deleteTarget.name}</p>
              {deleteTarget.coachId && <p className="text-[#A855F7] font-mono text-xs mt-0.5">{deleteTarget.coachId}</p>}
              <p className="text-white/40 text-xs mt-0.5">{deleteTarget.email}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl bg-[#1e1e2a] text-white/60 text-sm font-medium hover:bg-white/10">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2">
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
              <h2 className="text-white font-bold text-lg">{editTrainer ? "Edit Trainer" : "Add New Trainer"}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {!editTrainer && (
              <div className="bg-[#A855F7]/5 border border-[#A855F7]/20 rounded-xl px-4 py-3 mb-4 space-y-1">
                <p className="text-[#A855F7] text-xs font-medium">✨ Auto-generated on save:</p>
                <p className="text-white/50 text-xs">• Unique Coach ID (FC-XXXX)</p>
                <p className="text-white/50 text-xs">• Temporary login password</p>
              </div>
            )}
            {editTrainer?.coachId && (
              <div className="bg-[#1e1e2a] rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
                <span className="text-white/40 text-xs">Coach ID:</span>
                <span className="text-[#A855F7] font-mono font-bold text-sm">{editTrainer.coachId}</span>
              </div>
            )}
            <div className="space-y-3">
              {[
                { key: "name", label: "Full Name", placeholder: "Trainer full name" },
                { key: "specialty", label: "Specialty", placeholder: "e.g. Strength & Conditioning" },
                { key: "experience", label: "Experience", placeholder: "e.g. 5 years" },
                { key: "email", label: "Email", placeholder: "trainer@example.com" },
                { key: "phone", label: "Phone", placeholder: "+1 555-0000" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-white/40 text-xs mb-1 block">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#00D4FF]/50 transition-all" />
                </div>
              ))}
              <div>
                <label className="text-white/40 text-xs mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#1e1e2a] text-white/60 text-sm font-medium hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#00C896] text-black text-sm font-bold hover:bg-[#00b085] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : editTrainer ? "Save Changes" : "Add Trainer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
