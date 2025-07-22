"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        password,
        isNewUser: true,
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to set password. Please try again.");
        return;
      }

      router.push("/");
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#131315] font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#201F1D] rounded-2xl shadow-lg p-6 border-2 border-[#333230]"
      >
        <div className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white text-center mb-2 font-sans"
          >
            Doge Prize Admin
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center text-white text-2xl mt-8 font-sans"
          >
            Set Password
          </motion.p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-900/30 border border-red-700 text-red-200 rounded-lg"
            >
              {error}
            </motion.div>
          )}
          <div className="space-y-2">
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border-2 border-[#333230] bg-[#151413] text-white placeholder-gray-400"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border-2 border-[#333230] bg-[#151413] text-white placeholder-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#580DA9] text-white px-4 py-2 rounded-lg hover:bg-[#4A0B8F] disabled:bg-[#333230] disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Setting password..." : "Set Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
} 