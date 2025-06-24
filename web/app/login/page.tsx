"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D12] flex items-center justify-center p-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#00C896]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00C896] to-[#00D4FF] flex items-center justify-center mb-4 shadow-lg shadow-[#00D4FF]/20">
            <span className="text-black font-black text-xl">FF</span>
          </div>
          <h1 className="text-white font-bold text-2xl">FitForge</h1>
          <p className="text-white/40 text-sm mt-1">Gym Management System</p>
        </div>

        {/* Card */}
        <div className="bg-[#16161f] border border-white/5 rounded-2xl p-7">
          <h2 className="text-white font-bold text-lg mb-1">Welcome back</h2>
          <p className="text-white/40 text-sm mb-6">Sign in to your owner account</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="owner@fitforge.com"
                className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#00D4FF]/50 transition-all"
              />
            </div>

            <div>
              <label className="text-white/40 text-xs mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className="w-full bg-[#1e1e2a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#00D4FF]/50 transition-all pr-10"
                />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-white/30 hover:text-white/60 transition-all">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-[#00D4FF]" />
                <span className="text-white/40 text-xs">Remember me</span>
              </label>
              <button className="text-[#00D4FF] text-xs hover:underline">Forgot password?</button>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00C896] to-[#00D4FF] text-black font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          FitForge © 2026 — Gym Management System
        </p>
      </div>
    </div>
  );
}
