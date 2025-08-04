"use client";
import { useState, useEffect } from "react";
import { Send, Megaphone, Users, UserCheck, Loader2, Sparkles, Copy, Check } from "lucide-react";
import { getAnnouncementsRealTime, addAnnouncement, getMembers } from "@/lib/firestore";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");

  // AI Writer state
  const [aiTopic, setAiTopic] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = getAnnouncementsRealTime(setAnnouncements);
    getMembers().then((m) => setTotalMembers(m.length));
    return () => unsub();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      await addAnnouncement({ title, message, targetGroup: target, totalReached: totalMembers });
      setTitle(""); setMessage("");
      setSuccess("Announcement sent successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } finally { setSending(false); }
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    setAiGenerating(true); setAiError(""); setAiResult("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "announcement", context: aiTopic }),
      });
      const data = await res.json();
      if (data.error) setAiError(data.error);
      else setAiResult(data.text || "");
    } catch {
      setAiError("Failed to connect to AI. Check your API key in .env.local");
    } finally { setAiGenerating(false); }
  };

  const handleCopyToForm = () => {
    setMessage(aiResult);
    if (!title) setTitle(aiTopic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        <p className="text-white/40 text-sm mt-0.5">Send announcements to your members</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left — Compose + AI */}
        <div className="col-span-2 space-y-4">

          {/* AI Writer */}
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16161f] border border-[#A855F7]/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#A855F7]" />
              <h2 className="text-white font-semibold text-base">AI Announcement Writer</h2>
              <span className="text-[#A855F7] text-xs bg-[#A855F7]/10 px-2 py-0.5 rounded-full ml-auto">Powered by Claude</span>
            </div>
            <div className="flex gap-2">
              <input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
                placeholder="Describe your announcement topic... e.g. 'New yoga class starting Monday'"
                className="flex-1 bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#A855F7]/50 transition-all" />
              <button onClick={handleAiGenerate} disabled={aiGenerating || !aiTopic.trim()}
                className="flex items-center gap-2 bg-[#A855F7] hover:bg-[#9333ea] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all disabled:opacity-60 flex-shrink-0">
                {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiGenerating ? "Writing..." : "Generate"}
              </button>
            </div>

            {aiError && (
              <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-3">
                ⚠ {aiError}
              </div>
            )}

            {aiResult && (
              <div className="mt-3 bg-[#1e1e2a] border border-[#A855F7]/20 rounded-xl p-4">
                <p className="text-white/80 text-sm leading-relaxed">{aiResult}</p>
                <button onClick={handleCopyToForm}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#A855F7] hover:text-white transition-all">
                  {copied ? <><Check className="w-3.5 h-3.5 text-[#00C896]" /><span className="text-[#00C896]">Copied to form!</span></> : <><Copy className="w-3.5 h-3.5" /> Use this in announcement form</>}
                </button>
              </div>
            )}
          </div>

          {/* Compose */}
          <div className="bg-[#16161f] border border-white/5 rounded-xl p-5 space-y-4">
            <h2 className="text-white font-semibold text-base">New Announcement</h2>
            {success && <div className="bg-[#00C896]/10 border border-[#00C896]/20 text-[#00C896] text-sm rounded-xl px-4 py-3">{success}</div>}
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title..."
              className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#00D4FF]/50 transition-all" />
            <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message to members..."
              className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#00D4FF]/50 transition-all resize-none" />
            <div>
              <p className="text-white/40 text-xs mb-2">Send to:</p>
              <div className="flex gap-2">
                {[
                  { key: "all", label: "All Members", icon: Users },
                  { key: "premium", label: "Premium Only", icon: UserCheck },
                  { key: "expired", label: "Expired", icon: Megaphone },
                ].map((t) => (
                  <button key={t.key} onClick={() => setTarget(t.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${target === t.key ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20" : "bg-[#1e1e2a] text-white/40 hover:text-white"}`}>
                    <t.icon className="w-3.5 h-3.5" />{t.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleSend} disabled={sending}
              className="flex items-center gap-2 bg-gradient-to-r from-[#00C896] to-[#00D4FF] text-black font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-all disabled:opacity-60">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Sending..." : "Send Announcement"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          {[
            { label: "Total Sent", value: announcements.length.toString(), color: "text-[#00D4FF]" },
            { label: "Members Reached", value: totalMembers.toLocaleString(), color: "text-[#00C896]" },
          ].map((s) => (
            <div key={s.label} className="bg-[#16161f] border border-white/5 rounded-xl p-5">
              <p className="text-white/40 text-sm">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
          <div className="bg-[#16161f] border border-white/5 rounded-xl p-5">
            <p className="text-white/40 text-xs mb-2">AI Writer Tips</p>
            <ul className="space-y-1.5 text-white/40 text-xs">
              {["New class or schedule change", "Holiday hours or closure", "Promotion or discount offer", "Motivational message", "Equipment update"].map((t) => (
                <li key={t} className="flex items-start gap-1.5 cursor-pointer hover:text-white/70 transition-all" onClick={() => setAiTopic(t)}>
                  <span className="text-[#A855F7] mt-0.5">•</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Past Announcements */}
      <div className="bg-[#16161f] border border-white/5 rounded-xl p-5">
        <h2 className="text-white font-semibold text-base mb-4">Past Announcements</h2>
        {announcements.length === 0 && <p className="text-white/20 text-sm text-center py-8">No announcements sent yet</p>}
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="flex items-start gap-4 bg-[#1e1e2a] rounded-xl p-4">
              <div className="w-9 h-9 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-4 h-4 text-[#00D4FF]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm">{a.title}</h3>
                  <span className="bg-[#00C896]/10 text-[#00C896] text-xs px-2.5 py-1 rounded-lg font-medium">
                    Sent to {(a.totalReached || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-white/40 text-xs mt-1">{a.message}</p>
                <p className="text-white/20 text-xs mt-2">{formatDate(a.sentAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
