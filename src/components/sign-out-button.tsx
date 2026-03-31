'use client';

import { useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';

interface SignOutBtnProps {
  className?: string;
  iconClassName?: string;
  label?: string;
}

export function SignOutBtn({
  className = 'flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors',
  iconClassName = 'size-4 shrink-0',
  label = 'Sign Out',
}: SignOutBtnProps) {
  const { signOut } = useClerk();

  return (
    <button className={className} onClick={() => signOut({ redirectUrl: '/' })}>
      <LogOut className={iconClassName} />
      {label}
    </button>
  );
}
