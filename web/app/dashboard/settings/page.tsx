"use client";
import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getSettingsRealTime, saveSettings } from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

const tabs = ["Gym Profile", "Plans & Pricing", "Notifications", "Security"];

const defaultProfile = {
  gymName: "FitForge Gym",
  ownerName: "Alex Morgan",
  email: "owner@fitforge.com",
  phone: "",
  address: "",
  city: "",
  description: "",
};

const defaultPlans = [
  { name: "Basic",    price: "39", features: "Access to gym floor, Locker room" },
  { name: "Standard", price: "59", features: "Basic + Group classes, Sauna" },
  { name: "Premium",  price: "89", features: "Standard + Personal trainer, Nutrition plan" },
];

const notificationItems = [
  "New member registration",
  "Payment received",
  "Payment failed",
  "Membership expiring (3 days)",
  "Daily attendance summary",
  "Monthly revenue report",
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Gym Profile");

  // Gym Profile
  const [profile, setProfile] = useState(defaultProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Plans
  const [plans, setPlans] = useState(defaultPlans);
  const [savingPlans, setSavingPlans] = useState(false);
  const [plansMsg, setPlansMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationItems.map((n) => [n, true]))
  );

  // Security
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const unsub = getSettingsRealTime((data) => {
      if (data.profile) setProfile({ ...defaultProfile, ...data.profile });
      if (data.plans) setPlans(data.plans);
      if (data.notifications) setNotifications(data.notifications);
    });
    return () => unsub();
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await saveSettings({ profile });
      setProfileMsg({ type: "success", text: "Gym profile saved successfully!" });
      setTimeout(() => setProfileMsg(null), 3000);
    } catch {
      setProfileMsg({ type: "error", text: "Failed to save. Please try again." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePlans = async () => {
    setSavingPlans(true);
    setPlansMsg(null);
    try {
      await saveSettings({ plans });
      setPlansMsg({ type: "success", text: "Plans updated successfully!" });
      setTimeout(() => setPlansMsg(null), 3000);
    } catch {
      setPlansMsg({ type: "error", text: "Failed to save. Please try again." });
    } finally {
      setSavingPlans(false);
    }
  };

  const handleToggleNotification = async (item: string) => {
    const updated = { ...notifications, [item]: !notifications[item] };
    setNotifications(updated);
    await saveSettings({ notifications: updated });
  };

  const handleChangePassword = async () => {
    if (!newPw || !confirmPw || !currentPw) {
      setPwMsg({ type: "error", text: "Please fill in all fields." });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPw.length < 6) {
      setPwMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setSavingPw(true);
    setPwMsg(null);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Not logged in");
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPwMsg({ type: "success", text: "Password updated successfully!" });
      setTimeout(() => setPwMsg(null), 3000);
    } catch (err: any) {
      const msg = err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential"
        ? "Current password is incorrect."
        : "Failed to update password. Please try again.";
      setPwMsg({ type: "error", text: msg });
    } finally {
      setSavingPw(false);
    }
  };

  const profileFields = [
    { key: "gymName", label: "Gym Name", placeholder: "FitForge Gym" },
    { key: "ownerName", label: "Owner Name", placeholder: "Alex Morgan" },
    { key: "email", label: "Email", placeholder: "owner@fitforge.com" },
    { key: "phone", label: "Phone", placeholder: "+1 (555) 000-0000" },
    { key: "address", label: "Address", placeholder: "123 Gym Street..." },
    { key: "city", label: "City", placeholder: "New York" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-0.5">Configure your gym settings and preferences</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="col-span-1 space-y-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === t ? "bg-[#00D4FF]/10 text-[#00D4FF]" : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="col-span-3 bg-[#16161f] border border-white/5 rounded-xl p-6">

          {/* ─── GYM PROFILE ─── */}
          {activeTab === "Gym Profile" && (
            <div className="space-y-5">
              <h2 className="text-white font-semibold text-base">Gym Profile</h2>
              {profileMsg && (
                <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${profileMsg.type === "success" ? "bg-[#00C896]/10 border border-[#00C896]/20 text-[#00C896]" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                  {profileMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {profileMsg.text}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {profileFields.map((f) => (
                  <div key={f.key}>
                    <label className="text-white/40 text-xs mb-1.5 block">{f.label}</label>
                    <input
                      value={(profile as any)[f.key]}
                      onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#00D4FF]/50 transition-all"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1.5 block">Description</label>
                <textarea
                  rows={3}
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="About your gym..."
                  className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#00D4FF]/50 transition-all resize-none"
                />
              </div>
              <button onClick={handleSaveProfile} disabled={savingProfile}
                className="flex items-center gap-2 bg-gradient-to-r from-[#00C896] to-[#00D4FF] text-black font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all disabled:opacity-60">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* ─── PLANS & PRICING ─── */}
          {activeTab === "Plans & Pricing" && (
            <div className="space-y-5">
              <h2 className="text-white font-semibold text-base">Plans & Pricing</h2>
              {plansMsg && (
                <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${plansMsg.type === "success" ? "bg-[#00C896]/10 border border-[#00C896]/20 text-[#00C896]" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                  {plansMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {plansMsg.text}
                </div>
              )}
              {plans.map((plan, idx) => (
                <div key={plan.name} className="bg-[#1e1e2a] border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm">{plan.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-sm">$</span>
                      <input
                        value={plan.price}
                        onChange={(e) => {
                          const updated = [...plans];
                          updated[idx] = { ...updated[idx], price: e.target.value };
                          setPlans(updated);
                        }}
                        className="w-20 bg-[#16161f] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none text-center focus:border-[#00D4FF]/50"
                      />
                      <span className="text-white/40 text-sm">/mo</span>
                    </div>
                  </div>
                  <input
                    value={plan.features}
                    onChange={(e) => {
                      const updated = [...plans];
                      updated[idx] = { ...updated[idx], features: e.target.value };
                      setPlans(updated);
                    }}
                    className="w-full bg-[#16161f] border border-white/10 rounded-lg px-3 py-2 text-white/60 text-xs outline-none focus:border-[#00D4FF]/50"
                    placeholder="Features..."
                  />
                </div>
              ))}
              <button onClick={handleSavePlans} disabled={savingPlans}
                className="flex items-center gap-2 bg-gradient-to-r from-[#00C896] to-[#00D4FF] text-black font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all disabled:opacity-60">
                {savingPlans ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingPlans ? "Saving..." : "Save Plans"}
              </button>
            </div>
          )}

          {/* ─── NOTIFICATIONS ─── */}
          {activeTab === "Notifications" && (
            <div className="space-y-5">
              <h2 className="text-white font-semibold text-base">Notification Preferences</h2>
              <p className="text-white/30 text-xs">Changes are saved automatically.</p>
              {notificationItems.map((item) => (
                <div key={item} className="flex items-center justify-between py-2.5 border-b border-white/5">
                  <span className="text-white/70 text-sm">{item}</span>
                  <button
                    onClick={() => handleToggleNotification(item)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${notifications[item] ? "bg-[#00C896]" : "bg-white/10"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${notifications[item] ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ─── SECURITY ─── */}
          {activeTab === "Security" && (
            <div className="space-y-5">
              <h2 className="text-white font-semibold text-base">Security Settings</h2>
              {pwMsg && (
                <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${pwMsg.type === "success" ? "bg-[#00C896]/10 border border-[#00C896]/20 text-[#00C896]" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                  {pwMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {pwMsg.text}
                </div>
              )}
              {[
                { label: "Current Password", value: currentPw, set: setCurrentPw },
                { label: "New Password", value: newPw, set: setNewPw },
                { label: "Confirm New Password", value: confirmPw, set: setConfirmPw },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-white/40 text-xs mb-1.5 block">{f.label}</label>
                  <input
                    type="password"
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#00D4FF]/50 transition-all"
                  />
                </div>
              ))}
              <button onClick={handleChangePassword} disabled={savingPw}
                className="flex items-center gap-2 bg-gradient-to-r from-[#00C896] to-[#00D4FF] text-black font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all disabled:opacity-60">
                {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingPw ? "Updating..." : "Update Password"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
