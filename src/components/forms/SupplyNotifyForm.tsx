"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE } from "@/lib/animations";

type Status = "idle" | "loading" | "success" | "duplicate" | "error" | "invalid";

export function SupplyNotifyForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("invalid");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), type: "supply" }),
      });
      if (res.status === 409) { setStatus("duplicate"); return; }
      if (!res.ok) { setStatus("error"); return; }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="flex flex-col items-center gap-3 py-6"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              className="text-vynl-champagne"
            >
              <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1" />
              <path
                d="M8.5 14l4 4 7-8"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="square"
              />
            </svg>
            <p className="text-sm font-sans font-light text-vynl-gray-300">
              You&apos;re on the list! We&apos;ll be in touch.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex flex-col gap-2 w-full"
          >
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col sm:flex-row gap-0 w-full"
            >
              <label htmlFor="supply-email" className="sr-only">
                Email address
              </label>
              <input
                id="supply-email"
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status === "invalid") setStatus("idle"); }}
                placeholder="your@email.com"
                disabled={status === "loading"}
                className={`
                  flex-1 bg-transparent border px-5 py-4
                  text-sm font-sans font-light text-vynl-white placeholder:text-vynl-gray-600
                  focus:outline-none transition-colors duration-300
                  sm:border-r-0 disabled:opacity-50
                  ${status === "invalid" ? "border-red-400/60" : "border-white/20 focus:border-vynl-champagne/60"}
                `}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="
                  shrink-0 px-8 py-4 bg-vynl-champagne-light text-vynl-black
                  text-xs font-sans font-medium tracking-widest uppercase
                  hover:bg-vynl-nude transition-colors duration-300
                  disabled:opacity-60 disabled:cursor-not-allowed
                  active:scale-[0.97] active:duration-75
                  border border-vynl-champagne-light
                "
              >
                {status === "loading" ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                    </svg>
                    Saving
                  </span>
                ) : (
                  "Notify Me"
                )}
              </button>
            </form>

            {status === "invalid" && (
              <p className="text-xs font-sans text-red-400 text-center sm:text-left">
                Please enter a valid email address.
              </p>
            )}
            {status === "duplicate" && (
              <p className="text-xs font-sans text-vynl-champagne text-center sm:text-left">
                You&apos;re already on the list!
              </p>
            )}
            {status === "error" && (
              <p className="text-xs font-sans text-red-400 text-center sm:text-left">
                Something went wrong. Please try again.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
