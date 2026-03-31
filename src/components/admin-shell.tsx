'use client';

import { TimezoneProvider } from '@/contexts/timezone-context';

/**
 * Client-side wrapper rendered inside the server AdminLayout.
 * Provides the TimezoneContext to every admin page and component.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return <TimezoneProvider>{children}</TimezoneProvider>;
}
