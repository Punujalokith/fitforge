"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Users, Clock, CalendarDays } from "lucide-react";
import { getClassesRealTime, addClass, updateClass, deleteClass } from "@/lib/firestore";

const typeColor: Record<string, string> = {
  Yoga: "bg-[#A855F7]/10 text-[#A855F7]",
  Spinning: "bg-[#00D4FF]/10 text-[#00D4FF]",
  HIIT: "bg-red-500/10 text-red-400",
  Pilates: "bg-pink-500/10 text-pink-400",
  Boxing: "bg-orange-500/10 text-orange-400",
  Zumba: "bg-yellow-500/10 text-yellow-400",
  Strength: "bg-[#00C896]/10 text-[#00C896]",
  Other: "bg-white/10 text-white/60",
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const classTypes = ["Yoga", "Spinning", "HIIT", "Pilates", "Boxing", "Zumba", "Strength", "Other"];

const emptyForm = { name: "", type: "Yoga", trainer: "", day: "Monday", time: "08:00", duration: "60", maxCapacity: "20", status: "Active" };

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterDay, setFilterDay] = useState("All");

  useEffect(() => {
    const unsub = getClassesRealTime((data) => { setClasses(data); setLoading(false); });
    return () => unsub();
  }, []);

  const filtered = filterDay === "All" ? classes : classes.filter((c) => c.day === filterDay);

  const openAdd = () => { setForm(emptyForm); setEditClass(null); setShowModal(true); };
  const openEdit = (c: any) => {
    setForm({ name: c.name, type: c.type, trainer: c.trainer || "", day: c.day, time: c.time, duration: String(c.duration), maxCapacity: String(c.maxCapacity), status: c.status });
    setEditClass(c);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.trainer) return;
    setSaving(true);
    try {
      const data = { ...form, duration: Number(form.duration), maxCapacity: Number(form.maxCapacity) };
      if (editClass) await updateClass(editClass.id, data);
      else await addClass(data);
      setShowModal(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await deleteClass(id); }
    finally { setDeleting(null); }
  };

  const totalActive = classes.filter((c) => c.status === "Active").length;
  const totalEnrolled = classes.reduce((s, c) => s + (c.enrolled || 0), 0);
  const totalCapacity = classes.reduce((s, c) => s + (c.maxCapacity || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Classes</h1>
          <p className="text-white/40 text-sm mt-0.5">Manage gym class schedule and enrollments</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#00C896] hover:bg-[#00b085] text-black font-semibold px-4 py-2.5 rounded-xl transition-all text-sm">
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Classes", value: classes.length.toString(), color: "text-[#00D4FF]" },
          { label: "Active Classes", value: totalActive.toString(), color: "text-[#00C896]" },
          { label: "Total Enrolled", value: totalEnrolled.toString(), color: "text-[#A855F7]" },
          { label: "Total Capacity", value: totalCapacity.toString(), color: "text-yellow-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[#16161f] border border-white/5 rounded-xl p-5">
            <p className="text-white/40 text-sm">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Day Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {["All", ...days].map((d) => (
          <button key={d} onClick={() => setFilterDay(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterDay === d ? "bg-[#00D4FF] text-black" : "bg-[#16161f] border border-white/5 text-white/50 hover:text-white"}`}>
            {d}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" /></div>}

      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-20 text-white/20">
              No classes {filterDay !== "All" ? `on ${filterDay}` : "yet"}. Click &quot;Add Class&quot; to get started.
            </div>
          )}
          {filtered.map((c) => (
            <div key={c.id} className={`bg-[#16161f] border rounded-xl p-5 transition-all hover:border-white/10 ${c.status === "Active" ? "border-white/5" : "border-red-500/10 opacity-70"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold text-sm">{c.name}</h3>
                  <p className="text-white/40 text-xs mt-0.5">{c.trainer}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${typeColor[c.type] || typeColor.Other}`}>{c.type}</span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{c.day}</span>
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{c.time} · {c.duration} min</span>
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Users className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{c.enrolled || 0} / {c.maxCapacity} enrolled</span>
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="mb-4">
                <div className="h-1.5 bg-[#1e1e2a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00C896] to-[#00D4FF] rounded-full transition-all"
                    style={{ width: `${Math.min(((c.enrolled || 0) / (c.maxCapacity || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => openEdit(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1e1e2a] hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-all">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-50">
                  {deleting === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">{editClass ? "Edit Class" : "Add New Class"}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-white/40 text-xs mb-1 block">Class Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Morning Yoga"
                  className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#00D4FF]/50 transition-all" />
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">Trainer</label>
                <input value={form.trainer} onChange={(e) => setForm({ ...form, trainer: e.target.value })}
                  placeholder="Trainer name"
                  className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#00D4FF]/50 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
                    {classTypes.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Day</label>
                  <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}
                    className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
                    {days.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Time</label>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none" />
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Duration (min)</label>
                  <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="60"
                    className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none" />
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Max Capacity</label>
                  <input type="number" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })}
                    placeholder="20"
                    className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none" />
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#1e1e2a] text-white/60 text-sm font-medium hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#00C896] text-black text-sm font-bold hover:bg-[#00b085] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : editClass ? "Save Changes" : "Add Class"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
