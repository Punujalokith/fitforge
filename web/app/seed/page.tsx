"use client";
import { useState } from "react";
import { seedDatabase } from "@/lib/seed";

export default function SeedPage() {
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);

  const handleSeed = async () => {
    setStatus("Seeding database... please wait ⏳");
    await seedDatabase();
    setStatus("✅ Database seeded successfully! You can now go to the dashboard.");
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-[#0D0D12] flex items-center justify-center">
      <div className="bg-[#16161f] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center">
        <h1 className="text-white font-bold text-xl mb-2">Seed Database</h1>
        <p className="text-white/40 text-sm mb-6">Click once to add sample data to Firebase</p>
        {status && (
          <p className="text-[#00C896] text-sm mb-4 bg-[#00C896]/10 rounded-xl p-3">{status}</p>
        )}
        {!done ? (
          <button
            onClick={handleSeed}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00C896] to-[#00D4FF] text-black font-bold text-sm"
          >
            Seed Database
          </button>
        ) : (
          <a
            href="/dashboard"
            className="block w-full py-3 rounded-xl bg-[#00C896] text-black font-bold text-sm"
          >
            Go to Dashboard →
          </a>
        )}
      </div>
    </div>
  );
}
