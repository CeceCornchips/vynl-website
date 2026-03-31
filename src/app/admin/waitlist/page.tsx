"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type WaitlistType = "academy" | "supply";

interface GuideDownload {
  id: number;
  downloaded_at: string;
  device_type: string;
  ip_address: string;
}

interface GuideStats {
  total_downloads: number;
  downloads_today: number;
  downloads_this_week: number;
  downloads_this_month: number;
  by_device: { mobile: number; tablet: number; desktop: number };
  recent_downloads: GuideDownload[];
  daily_trend: { date: string; count: number }[];
}

interface WaitlistEntry {
  id: number;
  name: string;
  email: string;
  type: WaitlistType;
  notified: boolean;
  notified_at: string | null;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Sydney",
  });
}

function toCSV(rows: WaitlistEntry[]) {
  const header = ["ID", "Name", "Email", "Type", "Notified", "Notified At", "Signed Up"];
  const lines = rows.map((r) =>
    [
      r.id,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.email.replace(/"/g, '""')}"`,
      r.type,
      r.notified ? "Yes" : "No",
      r.notified_at ? formatDate(r.notified_at) : "",
      formatDate(r.created_at),
    ].join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

function downloadCSV(rows: WaitlistEntry[], type: WaitlistType) {
  const csv = toCSV(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vynl-${type}-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-block border-2 border-current border-t-transparent rounded-full animate-spin ${size === "sm" ? "w-3 h-3" : "w-4 h-4"}`}
    />
  );
}

function Badge({ notified }: { notified: boolean }) {
  return (
    <span
      className={
        notified
          ? "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full"
          : "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-full"
      }
    >
      <span className={`w-1.5 h-1.5 rounded-full ${notified ? "bg-emerald-500" : "bg-gray-400"}`} />
      {notified ? "Notified" : "Pending"}
    </span>
  );
}

interface LaunchButtonProps {
  type: WaitlistType;
  pendingCount: number;
  onNotify: (type: WaitlistType) => Promise<void>;
  sending: boolean;
}

function LaunchButton({ type, pendingCount, onNotify, sending }: LaunchButtonProps) {
  const label = type === "academy" ? "Academy" : "Supply";

  function handleClick() {
    if (pendingCount === 0) return;
    const confirmed = window.confirm(
      `Send launch email to ${pendingCount} unnotified ${label} waitlist member${pendingCount !== 1 ? "s" : ""}?\n\nThis cannot be undone.`
    );
    if (confirmed) onNotify(type);
  }

  return (
    <button
      onClick={handleClick}
      disabled={sending || pendingCount === 0}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-black text-white border border-black hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {sending && <Spinner size="sm" />}
      Send Launch Email ({pendingCount} pending)
    </button>
  );
}

// ── Guide Downloads component ─────────────────────────────────────────────────

function GuideDownloadsSection() {
  const [stats, setStats] = useState<GuideStats | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const fetchStats = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/guide-stats", { credentials: "include" });
      if (res.status === 401) { window.location.href = "/admin/login"; return; }
      if (!res.ok) throw new Error("Failed to load guide stats.");
      setStats(await res.json());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Australia/Sydney",
    });
  }

  const total = stats?.total_downloads ?? 0;

  return (
    <div className="mt-12 pt-10 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">
            Gel-X Retention Guide
          </p>
          <h2 className="text-xl font-medium text-gray-900 tracking-tight">Guide Downloads</h2>
        </div>
        <button
          onClick={fetchStats}
          className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-300 transition-colors self-start sm:self-auto"
        >
          Refresh
        </button>
      </div>

      {status === "loading" && (
        <div className="flex items-center gap-3 text-sm text-gray-500 py-12 justify-center">
          <Spinner />
          Loading stats…
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 mb-6">
          Failed to load guide stats.
          <button onClick={fetchStats} className="ml-3 underline hover:no-underline">Retry</button>
        </div>
      )}

      {status === "ready" && stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {([
              { label: "Total Downloads", value: stats.total_downloads },
              { label: "Today", value: stats.downloads_today },
              { label: "This Week", value: stats.downloads_this_week },
              { label: "This Month", value: stats.downloads_this_month },
            ] as const).map(({ label, value }) => (
              <div key={label} className="bg-white border border-gray-200 p-5">
                <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">
                  {label}
                </p>
                <p className="text-4xl font-medium text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* By device */}
          <div className="bg-white border border-gray-200 p-5 mb-6">
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-3">
              By Device
            </p>
            <div className="flex flex-wrap gap-3">
              {(["mobile", "desktop", "tablet"] as const).map((d) => {
                const count = stats.by_device[d];
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <span
                    key={d}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                  >
                    <span className="capitalize">{d}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                    <span className="text-gray-400">({pct}%)</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Recent downloads table */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <span className="text-sm text-gray-600">
                Recent {stats.recent_downloads.length} download{stats.recent_downloads.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {["#", "Date & Time", "Device", "IP Address"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-medium tracking-wider uppercase text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_downloads.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400">
                        No downloads yet.
                      </td>
                    </tr>
                  ) : (
                    stats.recent_downloads.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? "bg-gray-50/50" : ""}`}
                      >
                        <td className="px-5 py-3.5 text-gray-400 text-xs w-10">{i + 1}</td>
                        <td className="px-5 py-3.5 text-gray-600 text-xs whitespace-nowrap">
                          {formatDate(row.downloaded_at)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 capitalize">
                            {row.device_type ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs font-mono whitespace-nowrap">
                          {row.ip_address
                            ? row.ip_address.length > 10
                              ? `${row.ip_address.slice(0, 10)}…`
                              : row.ip_address
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [pageStatus, setPageStatus] = useState<"loading" | "ready" | "error">("loading");
  const [dataError, setDataError] = useState("");

  const [sending, setSending] = useState<WaitlistType | null>(null);
  const [sendResult, setSendResult] = useState<{ type: WaitlistType; sent: number } | null>(null);
  const [filterType, setFilterType] = useState<WaitlistType | "all">("all");
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchEntries = useCallback(async () => {
    setPageStatus("loading");
    setDataError("");
    try {
      const res = await fetch("/api/admin/waitlist", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!res.ok) throw new Error("Failed to load data.");
      const json = (await res.json()) as { entries: WaitlistEntry[] };
      setEntries(json.entries);
      setPageStatus("ready");
    } catch (err) {
      setDataError(err instanceof Error ? err.message : "Unknown error.");
      setPageStatus("error");
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/admin/login";
    }
  }

  async function handleNotify(type: WaitlistType) {
    setSending(type);
    setSendResult(null);
    const label = type === "academy" ? "Academy" : "Supply";
    try {
      const res = await fetch("/api/waitlist/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type,
          subject: `Vynl ${label} is launching — you're first to know`,
          previewText: "As a waitlist member, you get exclusive early access.",
        }),
      });
      const json = (await res.json()) as { sent?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to send.");
      setSendResult({ type, sent: json.sent ?? 0 });
      await fetchEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send emails.");
    } finally {
      setSending(null);
    }
  }

  const academyEntries = entries.filter((e) => e.type === "academy");
  const supplyEntries = entries.filter((e) => e.type === "supply");
  const academyPending = academyEntries.filter((e) => !e.notified).length;
  const supplyPending = supplyEntries.filter((e) => !e.notified).length;
  const filteredEntries =
    filterType === "all" ? entries : entries.filter((e) => e.type === filterType);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">
              Vynl · Admin
            </p>
            <h1 className="text-3xl font-medium text-gray-900 tracking-tight">Waitlist</h1>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:border-gray-500 hover:text-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
          >
            {loggingOut ? <Spinner size="sm" /> : (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3M9 9.5 12 6.5 9 3.5M12 6.5H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            Sign out
          </button>
        </div>

        {/* Loading / error states */}
        {pageStatus === "loading" && (
          <div className="flex items-center gap-3 text-sm text-gray-500 py-20 justify-center">
            <Spinner />
            Loading waitlist…
          </div>
        )}

        {pageStatus === "error" && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 mb-8">
            {dataError}
            <button
              onClick={fetchEntries}
              className="ml-3 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {pageStatus === "ready" && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {(["academy", "supply"] as WaitlistType[]).map((t) => {
                const all = t === "academy" ? academyEntries : supplyEntries;
                const pending = t === "academy" ? academyPending : supplyPending;
                const label = t === "academy" ? "Academy" : "Supply";
                return (
                  <div key={t} className="bg-white border border-gray-200 p-6">
                    <div className="mb-4">
                      <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-1">
                        Vynl {label}
                      </p>
                      <p className="text-4xl font-medium text-gray-900">{all.length}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {pending} unnotified
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => downloadCSV(all, t)}
                        disabled={all.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 hover:border-gray-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 1v7M3 5l3 3 3-3M2 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Export CSV
                      </button>
                      <LaunchButton
                        type={t}
                        pendingCount={pending}
                        onNotify={handleNotify}
                        sending={sending === t}
                      />
                    </div>
                    {sendResult?.type === t && (
                      <p className="text-xs text-emerald-600 mt-3">
                        ✓ Sent to {sendResult.sent} recipient{sendResult.sent !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-gray-200">
                <span className="text-sm text-gray-600">
                  {filteredEntries.length} entr{filteredEntries.length !== 1 ? "ies" : "y"}
                </span>
                <div className="flex items-center gap-2">
                  {(["all", "academy", "supply"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterType(f)}
                      className={`px-3 py-1 text-xs font-medium capitalize transition-colors ${
                        filterType === f
                          ? "bg-gray-900 text-white"
                          : "text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-300"
                      }`}
                    >
                      {f === "all" ? "All" : f === "academy" ? "Academy" : "Supply"}
                    </button>
                  ))}
                  <button
                    onClick={fetchEntries}
                    className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-300 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {["Name", "Email", "List", "Status", "Notified At", "Signed Up"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs font-medium tracking-wider uppercase text-gray-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                          No entries yet.
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map((entry, i) => (
                        <tr
                          key={entry.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? "bg-gray-50/50" : ""}`}
                        >
                          <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                            {entry.name}
                          </td>
                          <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                            <a
                              href={`mailto:${entry.email}`}
                              className="hover:underline hover:text-gray-900 transition-colors"
                            >
                              {entry.email}
                            </a>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 capitalize">
                              {entry.type}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <Badge notified={entry.notified} />
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                            {formatDate(entry.notified_at)}
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                            {formatDate(entry.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Guide Downloads — always renders with its own loading state */}
        <GuideDownloadsSection />

      </div>
    </div>
  );
}
