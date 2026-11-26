import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DM inbox',
  robots: { index: false, follow: false },
};

export default function DmInboxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
