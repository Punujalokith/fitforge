import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const members = [
  { name: "Sarah Johnson", email: "sarah@email.com", phone: "+1 555-0101", plan: "Premium", status: "Active", trainerId: "", joinedDate: "Jan 2026" },
  { name: "Mike Chen", email: "mike@email.com", phone: "+1 555-0102", plan: "Standard", status: "Active", trainerId: "", joinedDate: "Feb 2026" },
  { name: "Emily Davis", email: "emily@email.com", phone: "+1 555-0103", plan: "Basic", status: "Expired", trainerId: "", joinedDate: "Dec 2025" },
  { name: "James Wilson", email: "james@email.com", phone: "+1 555-0104", plan: "Premium", status: "Active", trainerId: "", joinedDate: "Mar 2026" },
  { name: "Lisa Anderson", email: "lisa@email.com", phone: "+1 555-0105", plan: "Standard", status: "Active", trainerId: "", joinedDate: "Jan 2026" },
  { name: "Tom Bradley", email: "tom@email.com", phone: "+1 555-0106", plan: "Premium", status: "Active", trainerId: "", joinedDate: "Apr 2026" },
  { name: "Nina Patel", email: "nina@email.com", phone: "+1 555-0107", plan: "Basic", status: "Active", trainerId: "", joinedDate: "May 2026" },
  { name: "Chris Lee", email: "chris@email.com", phone: "+1 555-0108", plan: "Standard", status: "Active", trainerId: "", joinedDate: "Feb 2026" },
];

const trainers = [
  { name: "Mike Torres", specialty: "Strength & Conditioning", experience: "5 years", email: "mike.torres@fitforge.com", phone: "+1 555-0201", rating: 4.9, members: 18, status: "Active" },
  { name: "Lisa Ray", specialty: "Yoga & Flexibility", experience: "4 years", email: "lisa.ray@fitforge.com", phone: "+1 555-0202", rating: 4.8, members: 14, status: "Active" },
  { name: "James Carter", specialty: "Cardio & HIIT", experience: "3 years", email: "james.carter@fitforge.com", phone: "+1 555-0203", rating: 4.7, members: 12, status: "Active" },
];

export const seedDatabase = async () => {
  try {
    console.log("Seeding members...");
    for (const m of members) {
      await addDoc(collection(db, "members"), { ...m, createdAt: serverTimestamp() });
    }

    console.log("Seeding trainers...");
    for (const t of trainers) {
      await addDoc(collection(db, "trainers"), { ...t, createdAt: serverTimestamp() });
    }

    console.log("✅ Database seeded successfully!");
  } catch (e) {
    console.error("Seed error:", e);
  }
};
