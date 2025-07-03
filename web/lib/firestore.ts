import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, query, orderBy,
  onSnapshot, serverTimestamp, where, getDoc, setDoc, runTransaction
} from "firebase/firestore";
import { db } from "./firebase";

// ─── ID GENERATION ─────────────────────────────────────
export const generateMemberId = async (): Promise<string> => {
  const counterRef = doc(db, "meta", "counters");
  let id = "FF-0001";
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const next = (snap.exists() ? (snap.data().memberCount || 0) : 0) + 1;
    tx.set(counterRef, { memberCount: next }, { merge: true });
    id = `FF-${String(next).padStart(4, "0")}`;
  });
  return id;
};

export const generateCoachId = async (): Promise<string> => {
  const counterRef = doc(db, "meta", "counters");
  let id = "FC-0001";
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const next = (snap.exists() ? (snap.data().coachCount || 0) : 0) + 1;
    tx.set(counterRef, { coachCount: next }, { merge: true });
    id = `FC-${String(next).padStart(4, "0")}`;
  });
  return id;
};

// ─── MEMBERS ───────────────────────────────────────────
export const getMembers = async () => {
  const snap = await getDocs(query(collection(db, "members"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getMembersRealTime = (callback: (data: any[]) => void) => {
  const q = query(collection(db, "members"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const addMember = async (data: any): Promise<{ docRef: any; memberId: string }> => {
  const memberId = await generateMemberId();
  const docRef = await addDoc(collection(db, "members"), {
    ...data,
    memberId,
    createdAt: serverTimestamp(),
    status: data.status || "Active",
  });
  return { docRef, memberId };
};

export const updateMember = async (id: string, data: any) => {
  await updateDoc(doc(db, "members", id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteMember = async (id: string) => {
  await deleteDoc(doc(db, "members", id));
};

export const getMemberByCode = async (memberId: string) => {
  const q = query(collection(db, "members"), where("memberId", "==", memberId.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
};

export const getPaymentsByMemberOnce = async (memberDocId: string) => {
  const snap = await getDocs(query(collection(db, "payments"), orderBy("createdAt", "desc")));
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() as any }));
  return all.filter((p) => p.memberDocId === memberDocId);
};

// ─── ATTENDANCE ────────────────────────────────────────
export const checkInMember = async (memberId: string, memberName: string, memberInitials: string, memberDocId?: string) => {
  return await addDoc(collection(db, "attendance"), {
    memberId,
    memberName,
    memberInitials,
    memberDocId: memberDocId || null,
    checkInTime: serverTimestamp(),
    checkOutTime: null,
    date: new Date().toISOString().split("T")[0],
  });
};

export const checkOutMember = async (attendanceId: string) => {
  await updateDoc(doc(db, "attendance", attendanceId), {
    checkOutTime: serverTimestamp(),
  });
};

export const getTodayAttendance = (callback: (data: any[]) => void) => {
  const today = new Date().toISOString().split("T")[0];
  const q = query(
    collection(db, "attendance"),
    where("date", "==", today),
    orderBy("checkInTime", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const getRecentAttendance = (callback: (data: any[]) => void) => {
  const q = query(collection(db, "attendance"), orderBy("checkInTime", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.slice(0, 6).map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const getAllAttendanceRealTime = (callback: (data: any[]) => void) => {
  const q = query(collection(db, "attendance"), orderBy("checkInTime", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

// ─── GATE CONTROL ──────────────────────────────────────
export const getGateStatusRealTime = (callback: (isOpen: boolean) => void) => {
  return onSnapshot(doc(db, "meta", "gate"), (snap) => {
    callback(snap.exists() ? (snap.data()?.isOpen ?? false) : false);
  });
};

export const setGateStatus = async (isOpen: boolean) => {
  await setDoc(doc(db, "meta", "gate"), {
    isOpen,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// ─── TRAINERS ──────────────────────────────────────────
export const getTrainers = async () => {
  const snap = await getDocs(query(collection(db, "trainers"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getTrainersRealTime = (callback: (data: any[]) => void) => {
  const q = query(collection(db, "trainers"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const addTrainer = async (data: any): Promise<{ docRef: any; coachId: string }> => {
  const coachId = await generateCoachId();
  const docRef = await addDoc(collection(db, "trainers"), {
    ...data,
    coachId,
    createdAt: serverTimestamp(),
    status: "Active",
    isOnDuty: false,
    shiftStarted: null,
    currentShiftId: null,
    rating: 5.0,
    members: 0,
  });
  return { docRef, coachId };
};

export const updateTrainer = async (id: string, data: any) => {
  await updateDoc(doc(db, "trainers", id), { ...data, updatedAt: serverTimestamp() });
};

export const getTrainerByCoachId = async (coachId: string) => {
  const q = query(collection(db, "trainers"), where("coachId", "==", coachId.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
};

// ─── COACH SHIFTS ──────────────────────────────────────
export const startCoachShift = async (trainerId: string, coachId: string, coachName: string) => {
  const shiftRef = await addDoc(collection(db, "coachShifts"), {
    coachId,
    coachName,
    trainerId,
    startTime: serverTimestamp(),
    endTime: null,
    date: new Date().toISOString().split("T")[0],
  });
  await updateDoc(doc(db, "trainers", trainerId), {
    isOnDuty: true,
    shiftStarted: serverTimestamp(),
    currentShiftId: shiftRef.id,
  });
  return shiftRef;
};

export const endCoachShift = async (trainerId: string, currentShiftId: string) => {
  await updateDoc(doc(db, "coachShifts", currentShiftId), { endTime: serverTimestamp() });
  await updateDoc(doc(db, "trainers", trainerId), {
    isOnDuty: false,
    shiftStarted: null,
    currentShiftId: null,
  });
};

export const getTodayCoachShiftsRealTime = (callback: (data: any[]) => void) => {
  const today = new Date().toISOString().split("T")[0];
  const q = query(
    collection(db, "coachShifts"),
    where("date", "==", today),
    orderBy("startTime", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

// ─── PAYMENTS ──────────────────────────────────────────
export const getPayments = async () => {
  const snap = await getDocs(query(collection(db, "payments"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getPaymentsRealTime = (callback: (data: any[]) => void) => {
  const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const addPayment = async (data: any) => {
  const now = new Date();
  const month = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return await addDoc(collection(db, "payments"), {
    ...data,
    month,
    date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    createdAt: serverTimestamp(),
  });
};

export const updatePayment = async (id: string, data: any) => {
  await updateDoc(doc(db, "payments", id), { ...data, updatedAt: serverTimestamp() });
};

export const getRecentPaymentsRealTime = (callback: (data: any[]) => void) => {
  const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.slice(0, 5).map((d) => ({ id: d.id, ...d.data() })));
  });
};

// ─── CLASSES ───────────────────────────────────────────
export const getClassesRealTime = (callback: (data: any[]) => void) => {
  const q = query(collection(db, "classes"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const addClass = async (data: any) => {
  return await addDoc(collection(db, "classes"), {
    ...data,
    enrolled: 0,
    createdAt: serverTimestamp(),
  });
};

export const updateClass = async (id: string, data: any) => {
  await updateDoc(doc(db, "classes", id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteClass = async (id: string) => {
  await deleteDoc(doc(db, "classes", id));
};

// ─── RENEWALS ──────────────────────────────────────────
export const getRenewalsRealTime = (callback: (data: any[]) => void) => {
  const q = query(collection(db, "renewals"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const addRenewalRequest = async (data: any) => {
  return await addDoc(collection(db, "renewals"), {
    ...data,
    status: "Pending",
    createdAt: serverTimestamp(),
  });
};

export const approveRenewal = async (renewalId: string, memberDocId: string) => {
  await updateDoc(doc(db, "renewals", renewalId), {
    status: "Approved",
    approvedAt: serverTimestamp(),
  });
  await updateMember(memberDocId, { status: "Active" });
};

export const rejectRenewal = async (renewalId: string) => {
  await updateDoc(doc(db, "renewals", renewalId), {
    status: "Rejected",
    rejectedAt: serverTimestamp(),
  });
};

// ─── ANNOUNCEMENTS ─────────────────────────────────────
export const getAnnouncementsRealTime = (callback: (data: any[]) => void) => {
  const q = query(collection(db, "announcements"), orderBy("sentAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const addAnnouncement = async (data: any) => {
  return await addDoc(collection(db, "announcements"), {
    ...data,
    sentAt: serverTimestamp(),
  });
};

// ─── DASHBOARD STATS ───────────────────────────────────
export const getDashboardStatsRealTime = (callback: (stats: any) => void) => {
  const today = new Date().toISOString().split("T")[0];
  let stats = { totalMembers: 0, todayCheckins: 0, monthlyRevenue: 0, activePlans: 0 };
  let counts = { members: false, attendance: false, payments: false };

  const checkDone = () => {
    if (counts.members && counts.attendance && counts.payments) callback({ ...stats });
  };

  const u1 = onSnapshot(collection(db, "members"), (snap) => {
    stats.totalMembers = snap.size;
    stats.activePlans = snap.docs.filter((d) => d.data().status === "Active").length;
    counts.members = true;
    checkDone();
  });

  const u2 = onSnapshot(
    query(collection(db, "attendance"), where("date", "==", today)),
    (snap) => { stats.todayCheckins = snap.size; counts.attendance = true; checkDone(); }
  );

  const u3 = onSnapshot(collection(db, "payments"), (snap) => {
    stats.monthlyRevenue = snap.docs
      .filter((d) => d.data().status === "Paid")
      .reduce((s, d) => s + (Number(d.data().amount) || 0), 0);
    counts.payments = true;
    checkDone();
  });

  return () => { u1(); u2(); u3(); };
};

// ─── SETTINGS ──────────────────────────────────────────
export const getSettingsRealTime = (callback: (data: any) => void) => {
  return onSnapshot(doc(db, "settings", "gym"), (snap) => {
    callback(snap.exists() ? snap.data() : {});
  });
};

export const saveSettings = async (data: any) => {
  await setDoc(doc(db, "settings", "gym"), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};
