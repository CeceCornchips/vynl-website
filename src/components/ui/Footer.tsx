import Link from "next/link";
import { cn } from "@/lib/utils";
import type { FooterData } from "@/types";

interface FooterProps {
  data: FooterData;
  className?: string;
}

export function Footer({ data, className }: FooterProps) {
  return (
    <footer className={cn("bg-vynl-black text-vynl-white", className)}>
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        {/* Main grid */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-[2fr_repeat(4,1fr)] pt-20 pb-16 border-b border-white/8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
            <span className="font-display text-xl tracking-ultra-wide text-vynl-champagne">
              {data.logoText ?? "VYNL"}
            </span>
            {data.tagline && (
              <p className="text-sm font-display italic text-vynl-gray-500 max-w-xs leading-relaxed">
                {data.tagline}
              </p>
            )}
            <div className="w-8 h-px bg-vynl-champagne/40 mt-2" />
          </div>

          {data.linkGroups.map((group) => (
            <div key={group.heading} className="flex flex-col gap-5">
              <h4 className="text-2xs font-sans font-medium tracking-ultra-wide uppercase text-vynl-gray-600">
                {group.heading}
              </h4>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs font-sans font-light text-vynl-gray-400 hover:text-vynl-champagne transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-2xs font-sans text-vynl-gray-600 tracking-widest uppercase">
          <span>{data.copyright}</span>
          {data.legal && (
            <div className="flex gap-8">
              {data.legal.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="hover:text-vynl-gray-400 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
