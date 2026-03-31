"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin/waitlist";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || loading || blocked) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (res.status === 429) {
        setBlocked(true);
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Too many attempts. Try again in 15 minutes.");
        return;
      }

      if (res.status === 401) {
        setError("Incorrect password.");
        setPassword("");
        return;
      }

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      // Cookie is now set — navigate to the protected page
      window.location.href = next;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-200 p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1.5">
              Vynl · Admin
            </p>
            <h1 className="text-2xl font-medium text-gray-900 tracking-tight">
              Sign in
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium tracking-widest uppercase text-gray-500">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                autoFocus
                autoComplete="current-password"
                disabled={loading || blocked}
                className="w-full border-b border-gray-200 bg-transparent py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-900 transition-colors disabled:opacity-40"
              />
              {error && (
                <p className="text-xs text-red-500 mt-0.5">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || blocked || !password}
              className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Spinner />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Protected area — authorised access only
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
