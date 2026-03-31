'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Users,
  Wrench,
  Settings,
  DollarSign,
  Bell,
  LogOut,
  X,
  Menu,
  Sparkles,
  ListOrdered,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SignOutButton } from '@clerk/nextjs';
import { useState } from 'react';
import { TimezoneSelector } from '@/components/timezone-selector';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/bookings', label: 'Bookings', icon: BookOpen, badge: true },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/admin/services', label: 'Services', icon: Wrench },
  { href: '/admin/waitlist', label: 'Waitlist', icon: ListOrdered },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

interface AdminNavProps {
  pendingCount: number;
}

function NavLinks({
  pathname,
  pendingCount,
  onNavigate,
}: {
  pathname: string;
  pendingCount: number;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && pendingCount > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-1.5 min-w-[20px] h-5 text-[10px] font-bold tabular-nums',
                  isActive
                    ? 'bg-white/25 text-primary-foreground'
                    : 'bg-yellow-100 text-yellow-800',
                )}
              >
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminNav({ pendingCount }: AdminNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 border-r bg-card fixed inset-y-0 z-40 shadow-sm">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">Admin Panel</p>
            <p className="text-[11px] text-muted-foreground">Nail Studio</p>
          </div>
        </div>

        <NavLinks pathname={pathname} pendingCount={pendingCount} />

        <div className="border-t">
          <TimezoneSelector />
        </div>

        <div className="px-3 py-3 border-t">
          <SignOutButton>
            <button className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
              <LogOut className="size-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────── */}
      <header className="lg:hidden fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" />
          </div>
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* ── Mobile drawer ────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex flex-col w-72 bg-card shadow-xl">
            <div className="flex items-center justify-between px-5 py-5 border-b">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-bold">Admin Panel</p>
                  <p className="text-[11px] text-muted-foreground">Nail Studio</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <NavLinks
              pathname={pathname}
              pendingCount={pendingCount}
              onNavigate={() => setMobileOpen(false)}
            />

            <div className="border-t">
              <TimezoneSelector />
            </div>

            <div className="px-3 py-3 border-t">
              <SignOutButton>
                <button className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <LogOut className="size-4 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
