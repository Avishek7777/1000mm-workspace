"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import Image from "next/image";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.1000mm.org.bd";

const navLinks = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/#about-us",
  },
  {
    label: "Projects",
    href: "#",
    submenu: [
      { label: "Current Projects", href: "/current-projects" },
      { label: "Training Schedule", href: "/training-schedule" },
    ],
  },
  {
    label: "Donate",
    href: "#",
    submenu: [
      { label: "Donate Now", href: "/donate-now" },
      { label: "How to Donate", href: "/how-to-donate" },
      { label: "Donation Proceeds", href: "/donation-proceeds" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileOpenLabel, setMobileOpenLabel] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 120);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-lg" : ""
      }`}
      style={{
        background: scrolled
          ? "linear-gradient(90deg, rgba(0,127,152,0.75) 0%, rgba(249,115,22,0.75) 100%)"
          : "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.12)"
          : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <Image
              src="/logos/1000mm-logo.png"
              alt="1000MM Logo"
              width={28}
              height={28}
            />
          </div>
          <span
            className="font-semibold text-white text-sm tracking-tight leading-tight hidden sm:block"
          >
            1000 Missionary Movement Bangladesh
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) =>
            link.submenu ? (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => handleMouseEnter(link.label)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className="flex items-center gap-1 text-white/75 hover:text-white text-sm font-medium tracking-wide transition-colors duration-200"
                  aria-expanded={activeDropdown === link.label}
                  onClick={() =>
                    setActiveDropdown(
                      activeDropdown === link.label ? null : link.label,
                    )
                  }
                >
                  {link.label}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === link.label ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {activeDropdown === link.label && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden"
                    style={{
                      animation: "fadeSlideDown 0.15s ease-out forwards",
                    }}
                  >
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-l border-t border-gray-100" />
                    <div className="py-1.5">
                      {link.submenu.map((sub, i) => (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className={`flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-orange-50 hover:text-gray-900 transition-colors duration-150 ${
                            i < link.submenu.length - 1
                              ? "border-b border-gray-50"
                              : ""
                          }`}
                        >
                          <span
                            className={
                              i === 0
                                ? "text-green-500 text-xs"
                                : "text-orange-400 text-xs"
                            }
                          >
                            {i === 0 ? "●" : "✦"}
                          </span>
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-white/75 hover:text-white text-sm font-medium tracking-wide transition-colors duration-200"
              >
                {link.label}
              </Link>
            ),
          )}

          {/* Two CTA buttons */}
          <div className="flex items-center gap-2 ml-2">
            <Link
              href={`${PORTAL_URL}/register`}
              target="_blank"
              className="px-4 py-2 rounded-full font-bold text-white text-xs hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-sm"
              style={{
                background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              Apply Now
            </Link>
            <Link
              href={PORTAL_URL}
              target="_blank"
              className="px-4 py-2 rounded-full font-bold text-sm border border-white/25 text-white/80 hover:text-white hover:border-white/50 hover:bg-white/10 transition-all duration-200"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 pb-6 pt-2 flex flex-col gap-3"
          style={{
            background: "linear-gradient(160deg, #0a1a0f 0%, #1a0a03 100%)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {navLinks.map((link) =>
            link.submenu ? (
              <div key={link.label} className="border-b border-white/10 pb-2">
                <button
                  className="flex items-center justify-between w-full text-white/80 font-medium text-sm py-1"
                  onClick={() =>
                    setMobileOpenLabel(
                      mobileOpenLabel === link.label ? null : link.label,
                    )
                  }
                >
                  {link.label}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      mobileOpenLabel === link.label ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {mobileOpenLabel === link.label && (
                  <div className="mt-2 ml-3 flex flex-col gap-1.5">
                    {link.submenu.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className="text-white/60 text-sm py-1 border-l-2 border-white/20 pl-3 hover:text-white hover:border-orange-400 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-white/80 font-medium text-sm border-b border-white/10 pb-2 hover:text-white transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ),
          )}
          <div className="flex flex-col gap-2 mt-2">
            <Link
              href={`${PORTAL_URL}/register`}
              target="_blank"
              className="py-3 rounded-full font-bold text-white text-sm text-center hover:opacity-90 transition-all"
              style={{
                background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
              onClick={() => setMenuOpen(false)}
            >
              Apply Now
            </Link>
            <Link
              href={PORTAL_URL}
              target="_blank"
              className="py-3 rounded-full font-bold text-sm text-center border border-white/25 text-white/80 hover:bg-white/10 transition-all"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </nav>
  );
}
