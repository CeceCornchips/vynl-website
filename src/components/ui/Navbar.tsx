"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavItem, CTALink } from "@/types";
import { PrimaryButton } from "./Buttons";

interface MobileMenuProps {
  items: NavItem[];
  cta?: CTALink;
  isOpen: boolean;
  onClose: () => void;
}

function MobileMenu({ items, cta, isOpen, onClose }: MobileMenuProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-vynl-black/80 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw]",
          "bg-vynl-black text-vynl-white flex flex-col",
          "transition-transform duration-400 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-8 py-7 border-b border-white/10">
          <span className="font-display text-lg tracking-ultra-wide text-vynl-champagne">
            VYNL
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 hover:opacity-60 transition-opacity"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M2 2l14 14M16 2L2 16" strokeLinecap="square" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-8 py-10 flex flex-col gap-1">
          {items.map((item) => (
            <div key={item.label}>
              <Link
                href={item.href}
                onClick={onClose}
                className="block py-4 text-sm font-sans font-light tracking-widest uppercase text-vynl-gray-200 hover:text-vynl-champagne transition-colors border-b border-white/5"
              >
                {item.label}
              </Link>
              {item.children && (
                <div className="pl-4 flex flex-col py-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      onClick={onClose}
                      className="block py-2.5 text-xs font-sans text-vynl-gray-400 hover:text-vynl-champagne transition-colors tracking-widest uppercase"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {cta && (
          <div className="px-8 py-8 border-t border-white/10">
            <PrimaryButton
              href={cta.href}
              fullWidth
              onClick={onClose}
              className="bg-vynl-champagne-light text-vynl-black hover:bg-vynl-nude"
            >
              {cta.label}
            </PrimaryButton>
          </div>
        )}
      </div>
    </>
  );
}

interface NavbarProps {
  logoText?: string;
  items: NavItem[];
  cta?: CTALink;
}

export function Navbar({ logoText = "VYNL", items, cta }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-30 transition-all duration-500",
          scrolled
            ? "bg-vynl-black/96 backdrop-blur-md py-4 border-b border-white/5"
            : "bg-transparent py-6"
        )}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-xl tracking-ultra-wide text-vynl-white hover:text-vynl-champagne transition-colors"
          >
            {logoText}
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            {items.map((item) => (
              <div key={item.label} className="relative group pb-4">
                <Link
                  href={item.href}
                  className="text-2xs font-sans font-medium tracking-ultra-wide uppercase text-vynl-gray-300 hover:text-vynl-white transition-colors"
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-52 bg-vynl-black border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="block px-6 py-3.5 text-2xs font-sans tracking-widest uppercase text-vynl-gray-300 hover:text-vynl-champagne hover:bg-white/5 transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            {cta && (
              <PrimaryButton
                href={cta.href}
                size="sm"
                className="hidden md:inline-flex bg-vynl-champagne-light text-vynl-black hover:bg-vynl-nude border-none"
              >
                {cta.label}
              </PrimaryButton>
            )}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="md:hidden text-vynl-white hover:text-vynl-champagne transition-colors p-1"
            >
              <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M0 1h22M0 7h22M0 13h22" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        items={items}
        cta={cta}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
}

export { MobileMenu };
