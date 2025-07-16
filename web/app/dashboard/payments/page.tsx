"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Download, Plus, X, Loader2, UserCheck, ChevronLeft, ChevronRight, Calendar, ArrowRightLeft } from "lucide-react";
import { getPaymentsRealTime, addPayment, getMemberByCode, getSettingsRealTime, updateMember } from "@/lib/firestore";

function getMonthLabel(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const DEFAULT_PLAN_PRICES: Record<string, number> = { Premium: 89, Standard: 59, Basic: 39 };

const statusStyle: Record<string, string> = {
  Paid:    "bg-[#00C896]/10 text-[#00C896] border border-[#00C896]/20",
  Pending: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  Failed:  "bg-red-500/10 text-red-400 border border-red-500/20",
  Credit:  "bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/20",
};

const planColor: Record<string, string> = {
  Premium:  "bg-[#00D4FF]/10 text-[#00D4FF]",
  Standard: "bg-[#00C896]/10 text-[#00C896]",
  Basic:    "bg-[#A855F7]/10 text-[#A855F7]",
};

const emptyForm = { memberCode: "", memberName: "", memberDocId: "", plan: "Standard", amount: "", method: "Card", status: "Paid" };

export default function PaymentsPage() {
  const [payments, setPayments]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filter, setFilter]             = useState("All");
  const [monthOffset, setMonthOffset]   = useState(0);
  const [allTime, setAllTime]           = useState(false);
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(emptyForm);
  const [saving, setSaving]             = useState(false);
  const [lookingUp, setLookingUp]       = useState(false);
  const [lookupResult, setLookupResult] = useState<"found" | "not-found" | null>(null);
  const [alreadyPaidInfo, setAlreadyPaidInfo] = useState<any | null>(null);
  const [planPrices, setPlanPrices]     = useState<Record<string, number>>(DEFAULT_PLAN_PRICES);
  const [changePlanTarget, setChangePlanTarget] = useState<any | null>(null);
  const [selectedNewPlan, setSelectedNewPlan]   = useState("");
  const [changingPlan, setChangingPlan]         = useState(false);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMonth = getMonthLabel(0);

  useEffect(() => {
    const unsub1 = getPaymentsRealTime((data) => { setPayments(data); setLoading(false); });
    const unsub2 = getSettingsRealTime((data) => {
      if (data.plans && Array.isArray(data.plans)) {
        const prices: Record<string, number> = { ...DEFAULT_PLAN_PRICES };
        data.plans.forEach((p: any) => { if (p.name && p.price) prices[p.name] = Number(p.price); });
        setPlanPrices(prices);
      }
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const handleCodeChange = (val: string) => {
    const code = val.toUpperCase();
    setForm((prev) => ({ ...prev, memberCode: code, memberName: "", memberDocId: "" }));
    setLookupResult(null);
    setAlreadyPaidInfo(null);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (code.trim().length >= 4) {
      lookupTimer.current = setTimeout(async () => {
        setLookingUp(true);
        const member = await getMemberByCode(code.trim());
        if (member) {
          setForm((prev) => ({
            ...prev,
            memberName:  member.name,
            memberDocId: member.id,
            plan:        member.plan || prev.plan,
            amount:      String(planPrices[member.plan] || ""),
          }));
          setLookupResult("found");
          const existingPaid = payments.find(
            (p) => p.memberDocId === member.id && p.month === currentMonth && p.status === "Paid"
          );
          setAlreadyPaidInfo(existingPaid || null);
        } else {
          setLookupResult("not-found");
          setAlreadyPaidInfo(null);
        }
        setLookingUp(false);
      }, 500);
    }
  };

  const calcProRata = (fromPlan: string, toPlan: string) => {
    const now = new Date();
    const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed  = now.getDate();
    const daysRemaining = daysInMonth - daysElapsed;
    const oldPrice  = planPrices[fromPlan] || 0;
    const newPrice  = planPrices[toPlan]   || 0;
    const priceDiff = newPrice - oldPrice;
    const amount    = Math.abs(Math.round((priceDiff / daysInMonth) * daysRemaining));
    const isUpgrade = priceDiff > 0;
    return { daysInMonth, daysElapsed, daysRemaining, oldPrice, newPrice, amount, isUpgrade };
  };

  const confirmChangePlan = async () => {
    if (!changePlanTarget || !selectedNewPlan) return;
    setChangingPlan(true);
    try {
      const { amount, isUpgrade } = calcProRata(changePlanTarget.plan, selectedNewPlan);
      await addPayment({
        memberName:  changePlanTarget.memberName,
        memberDocId: changePlanTarget.memberDocId,
        memberId:    changePlanTarget.memberId || null,
        plan:        selectedNewPlan,
        amount,
        method:   "Card",
        status:   isUpgrade ? "Paid" : "Credit",
        type:     isUpgrade ? "Plan Upgrade" : "Plan Downgrade",
        fromPlan: changePlanTarget.plan,
        toPlan:   selectedNewPlan,
      });
      await updateMember(changePlanTarget.memberDocId, { plan: selectedNewPlan });
      setChangePlanTarget(null);
      setSelectedNewPlan("");
    } finally {
      setChangingPlan(false);
    }
  };

  const selectedMonth = getMonthLabel(monthOffset);

  const monthPayments = allTime
    ? payments
    : payments.filter((p) => (p.month || "") === selectedMonth);

  const filtered = monthPayments.filter((p) => {
    const matchSearch =
      p.memberName?.toLowerCase().includes(search.toLowerCase()) ||
      p.memberId?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" ? true : p.status === filter;
    return matchSearch && matchFilter;
  });

  const getInitials = (name: string) =>
    name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "??";

  const totalRevenue = monthPayments.filter((p) => p.status === "Paid").reduce((s, p) => s + Number(p.amount || 0), 0);
  const pending      = monthPayments.filter((p) => p.status === "Pending").reduce((s, p) => s + Number(p.amount || 0), 0);
  const failed       = monthPayments.filter((p) => p.status === "Failed").reduce((s, p) => s + Number(p.amount || 0), 0);

  const handleSave = async () => {
    if (!form.memberName || !form.amount || alreadyPaidInfo) return;
    setSaving(true);
    try {
      await addPayment({
        memberName:  form.memberName,
        memberDocId: form.memberDocId || null,
        memberId:    form.memberCode  || null,
        plan:        form.plan,
        amount:      Number(form.amount),
        method:      form.method,
        status:      form.status,
      });
      setShowModal(false);
      setForm(emptyForm);
      setLookupResult(null);
      setAlreadyPaidInfo(null);
    } finally { setSaving(false); }
  };

  const openChangePlanFromModal = () => {
    if (!alreadyPaidInfo) return;
    setShowModal(false);
    setChangePlanTarget(alreadyPaidInfo);
    setSelectedNewPlan("");
  };

  const proRata = changePlanTarget && selectedNewPlan
    ? calcProRata(changePlanTarget.plan, selectedNewPlan)
    : null;

  return (
    <div className="space-y-6">

      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-white/40 text-sm mt-0.5">View and manage all payment transactions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowModal(true); setForm(emptyForm); setLookupResult(null); setAlreadyPaidInfo(null); }}
            className="flex items-center gap-2 bg-[#00C896] hover:bg-[#00b085] text-black font-semibold px-4 py-2.5 rounded-xl transition-all text-sm">
            <Plus className="w-4 h-4" /> Add Payment
          </button>
          <button className="flex items-center gap-2 bg-[#1e1e2a] border border-white/10 hover:bg-white/10 text-white/70 font-medium px-4 py-2.5 rounded-xl transition-all text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* ─── MONTH NAVIGATOR ─── */}
      <div className="flex items-center justify-between bg-[#16161f] border border-white/5 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-white/30" />
          <span className="text-white/40 text-sm">Showing:</span>
          <span className="text-white font-semibold text-sm">{allTime ? "All Time" : selectedMonth}</span>
        </div>
        <div className="flex items-center gap-2">
          {!allTime && (
            <>
              <button
                onClick={() => setMonthOffset((o) => o - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e1e2a] hover:bg-white/10 text-white/50 hover:text-white transition-all"
                title="Previous month">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))}
                disabled={monthOffset === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e1e2a] hover:bg-white/10 text-white/50 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next month">
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => { setAllTime((v) => !v); setMonthOffset(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${allTime ? "bg-[#00D4FF] text-black" : "bg-[#1e1e2a] text-white/50 hover:text-white"}`}>
            All Time
          </button>
        </div>
      </div>

      {/* ─── STATS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue",      value: `$${totalRevenue.toLocaleString()}`, sub: allTime ? "all time" : selectedMonth,                                          color: "border-b-[#00D4FF]" },
          { label: "Total Transactions", value: monthPayments.length.toString(),      sub: `${filtered.length} shown`,                                                    color: "border-b-[#00C896]" },
          { label: "Pending",            value: `$${pending.toLocaleString()}`,       sub: `${monthPayments.filter(p => p.status === "Pending").length} payments`,         color: "border-b-yellow-500" },
          { label: "Failed",             value: `$${failed.toLocaleString()}`,        sub: `${monthPayments.filter(p => p.status === "Failed").length} payments`,          color: "border-b-red-500" },
        ].map((s) => (
          <div key={s.label} className={`bg-[#16161f] border border-white/5 border-b-2 ${s.color} rounded-xl p-5`}>
            <p className="text-white/40 text-sm">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            <p className="text-white/20 text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── TABLE ─── */}
      <div className="bg-[#16161f] border border-white/5 rounded-xl">
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <div className="flex items-center gap-2 bg-[#1e1e2a] border border-white/5 rounded-xl px-4 py-2 flex-1">
            <Search className="w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by member name or ID (FF-XXXX)..."
              className="bg-transparent text-sm text-white placeholder:text-white/30 outline-none w-full" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["All", "Paid", "Pending", "Failed", "Credit"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? "bg-[#00D4FF] text-black" : "bg-[#1e1e2a] text-white/50 hover:text-white"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-9 text-white/30 text-xs px-5 py-3 border-b border-white/5">
          <span>#</span>
          <span className="col-span-2">Member</span>
          <span>ID</span>
          <span>Plan</span>
          <span>Amount</span>
          <span>Month</span>
          <span>Status</span>
          <span></span>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#00D4FF] animate-spin" />
          </div>
        )}

        <div className="divide-y divide-white/5">
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-white/20 text-sm">
              {allTime ? "No payments found" : `No payments for ${selectedMonth}`}
            </div>
          )}
          {filtered.map((p, i) => (
            <div key={p.id} className="grid grid-cols-9 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-all">
              <span className="text-white/30 text-sm">#{String(i + 1).padStart(3, "0")}</span>
              <div className="col-span-2 flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00C896] to-[#00D4FF] flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
                  {getInitials(p.memberName)}
                </div>
                <div className="min-w-0">
                  <span className="text-white text-sm font-medium truncate block">{p.memberName}</span>
                  {p.type && <span className="text-white/30 text-xs">{p.type}</span>}
                </div>
              </div>
              <span className="text-white/40 text-xs font-mono">{p.memberId || "—"}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md w-fit ${planColor[p.plan] || "bg-white/10 text-white"}`}>{p.plan}</span>
              <span className="text-white font-semibold text-sm">${p.amount}</span>
              <span className="text-white/40 text-xs leading-tight">{p.month || p.date || "—"}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg w-fit ${statusStyle[p.status] || ""}`}>{p.status}</span>
              <div className="flex justify-end">
                {p.status === "Paid" && p.month === currentMonth && !p.type && p.memberDocId && (
                  <button
                    onClick={() => { setChangePlanTarget(p); setSelectedNewPlan(""); }}
                    title="Change Plan"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1e1e2a] hover:bg-[#00D4FF]/10 text-white/40 hover:text-[#00D4FF] text-xs transition-all border border-white/5">
                    <ArrowRightLeft className="w-3 h-3" />
                    <span className="hidden xl:inline">Change</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ADD PAYMENT MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Add Payment</h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {/* Member ID Lookup */}
              <div>
                <label className="text-white/40 text-xs mb-1 block">Member ID (FF-XXXX)</label>
                <div className="relative">
                  <input
                    value={form.memberCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="Type member ID to auto-fill name..."
                    className={`w-full bg-[#1e1e2a] border rounded-xl px-4 py-2.5 text-white text-sm font-mono outline-none transition-all pr-10 ${
                      alreadyPaidInfo          ? "border-yellow-500/60" :
                      lookupResult === "found" ? "border-[#00C896]/60"  :
                      lookupResult === "not-found" ? "border-red-500/50" :
                      "border-white/10 focus:border-[#00D4FF]/50"
                    }`} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {lookingUp && <Loader2 className="w-4 h-4 text-white/30 animate-spin" />}
                    {!lookingUp && lookupResult === "found" && !alreadyPaidInfo && <UserCheck className="w-4 h-4 text-[#00C896]" />}
                    {!lookingUp && lookupResult === "found" &&  alreadyPaidInfo && <UserCheck className="w-4 h-4 text-yellow-400" />}
                    {!lookingUp && lookupResult === "not-found" && <X className="w-4 h-4 text-red-400" />}
                  </div>
                </div>
              </div>

              {/* Member Name */}
              <div>
                <label className="text-white/40 text-xs mb-1 block">Member Name</label>
                <input
                  value={form.memberName}
                  onChange={(e) => setForm({ ...form, memberName: e.target.value })}
                  placeholder={lookupResult === "not-found" ? "Not found — enter manually" : "Auto-filled from member ID"}
                  className={`w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${
                    lookupResult === "found" && !alreadyPaidInfo ? "text-[#00C896] font-medium" :
                    lookupResult === "found" &&  alreadyPaidInfo ? "text-yellow-400 font-medium" :
                    "text-white"
                  }`} />
                {lookupResult === "found" && !alreadyPaidInfo   && <p className="text-[#00C896] text-xs mt-1">✓ Member linked — payment history will be tracked</p>}
                {lookupResult === "not-found"                    && <p className="text-yellow-400 text-xs mt-1">ID not found — enter name manually to continue</p>}
              </div>

              {/* Already paid warning */}
              {alreadyPaidInfo && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 space-y-3">
                  <p className="text-yellow-400 text-sm font-semibold">Already paid for {currentMonth}</p>
                  <p className="text-yellow-400/70 text-xs">
                    {form.memberName} already has a {alreadyPaidInfo.plan} payment (${alreadyPaidInfo.amount}) recorded this month.
                    To switch their membership, use Change Plan.
                  </p>
                  <button
                    onClick={openChangePlanFromModal}
                    className="flex items-center gap-2 w-full justify-center py-2 rounded-xl bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 text-[#00D4FF] text-sm font-semibold border border-[#00D4FF]/20 transition-all">
                    <ArrowRightLeft className="w-4 h-4" /> Change Plan Instead
                  </button>
                </div>
              )}

              {/* Rest of form — hidden when already paid */}
              {!alreadyPaidInfo && (
                <>
                  <div>
                    <label className="text-white/40 text-xs mb-1 block">Amount ($)</label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="e.g. 89"
                      className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#00D4FF]/50 transition-all" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: "plan",   label: "Plan",   options: ["Premium", "Standard", "Basic"] },
                      { key: "method", label: "Method", options: ["Card", "Cash", "Transfer"] },
                      { key: "status", label: "Status", options: ["Paid", "Pending", "Failed"] },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="text-white/40 text-xs mb-1 block">{f.label}</label>
                        <select
                          value={(form as any)[f.key]}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
                          {f.options.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setAlreadyPaidInfo(null); }}
                className="flex-1 py-2.5 rounded-xl bg-[#1e1e2a] text-white/60 text-sm font-medium hover:bg-white/10 transition-all">
                Cancel
              </button>
              {!alreadyPaidInfo && (
                <button
                  onClick={handleSave}
                  disabled={saving || !form.memberName || !form.amount}
                  className="flex-1 py-2.5 rounded-xl bg-[#00C896] text-black text-sm font-bold hover:bg-[#00b085] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Saving..." : "Add Payment"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── CHANGE PLAN MODAL ─── */}
      {changePlanTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161f] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Change Membership Plan</h2>
              <button onClick={() => { setChangePlanTarget(null); setSelectedNewPlan(""); }} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member info */}
            <div className="bg-[#1e1e2a] rounded-xl p-4 mb-4">
              <p className="text-white font-semibold text-sm">{changePlanTarget.memberName}</p>
              <p className="text-white/40 text-xs mt-0.5">
                Current plan:{" "}
                <span className={`font-semibold ${changePlanTarget.plan === "Premium" ? "text-[#00D4FF]" : changePlanTarget.plan === "Standard" ? "text-[#00C896]" : "text-[#A855F7]"}`}>
                  {changePlanTarget.plan} (${planPrices[changePlanTarget.plan] || 0}/mo)
                </span>
              </p>
              <p className="text-white/40 text-xs mt-0.5">Payment: {changePlanTarget.date || changePlanTarget.month || currentMonth}</p>
            </div>

            {/* Plan selector */}
            <div className="mb-4">
              <label className="text-white/40 text-xs mb-2 block">Select New Plan</label>
              <div className="grid grid-cols-3 gap-2">
                {(["Premium", "Standard", "Basic"] as const).filter((pl) => pl !== changePlanTarget.plan).map((pl) => (
                  <button key={pl} onClick={() => setSelectedNewPlan(pl)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      selectedNewPlan === pl
                        ? pl === "Premium"  ? "bg-[#00D4FF]/20 border-[#00D4FF] text-[#00D4FF]"
                        : pl === "Standard" ? "bg-[#00C896]/20 border-[#00C896] text-[#00C896]"
                        :                    "bg-[#A855F7]/20 border-[#A855F7] text-[#A855F7]"
                        : "bg-[#1e1e2a] border-white/10 text-white/50 hover:text-white"
                    }`}>
                    {pl}<br />
                    <span className="text-xs font-normal opacity-70">${planPrices[pl] || 0}/mo</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pro-rata breakdown */}
            {proRata && (
              <div className={`rounded-xl p-4 mb-4 space-y-2 ${proRata.isUpgrade ? "bg-[#00C896]/10 border border-[#00C896]/20" : "bg-[#A855F7]/10 border border-[#A855F7]/20"}`}>
                <p className={`text-sm font-bold ${proRata.isUpgrade ? "text-[#00C896]" : "text-[#A855F7]"}`}>
                  {proRata.isUpgrade ? "Upgrade" : "Downgrade"} — {proRata.isUpgrade ? "Collect" : "Credit"} ${proRata.amount}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/40">
                  <span>Days in month</span>    <span className="text-white/60">{proRata.daysInMonth}</span>
                  <span>Days elapsed</span>     <span className="text-white/60">{proRata.daysElapsed}</span>
                  <span>Days remaining</span>   <span className="text-white/60">{proRata.daysRemaining}</span>
                  <span>Price difference</span> <span className="text-white/60">${Math.abs(proRata.newPrice - proRata.oldPrice)}/mo</span>
                </div>
                <p className="text-xs text-white/30">
                  {proRata.isUpgrade
                    ? `Charge $${proRata.amount} for the remaining ${proRata.daysRemaining} days at the ${selectedNewPlan} rate.`
                    : `Issue $${proRata.amount} credit for the remaining ${proRata.daysRemaining} days at the lower rate.`}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setChangePlanTarget(null); setSelectedNewPlan(""); }}
                className="flex-1 py-2.5 rounded-xl bg-[#1e1e2a] text-white/60 text-sm font-medium hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button
                onClick={confirmChangePlan}
                disabled={!selectedNewPlan || changingPlan}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
                  proRata?.isUpgrade !== false
                    ? "bg-gradient-to-r from-[#00C896] to-[#00D4FF] text-black hover:opacity-90"
                    : "bg-[#A855F7] text-white hover:bg-[#9333ea]"
                }`}>
                {changingPlan && <Loader2 className="w-4 h-4 animate-spin" />}
                {changingPlan
                  ? "Saving..."
                  : !selectedNewPlan
                  ? "Select a plan"
                  : proRata?.isUpgrade
                  ? `Confirm Upgrade (+$${proRata.amount})`
                  : `Confirm Downgrade (−$${proRata?.amount})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
