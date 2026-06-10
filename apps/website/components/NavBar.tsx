"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import Image from "next/image";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "How to Join", href: "#how-to-join" },
  { label: "About Us", href: "#about-us" },
  {
    label: "Projects",
    href: "#projects",
    submenu: [
      { label: "Current Projects", href: "/current-projects" },
      { label: "Support a Missionary", href: "#support-a-missionary" },
    ],
  },
  {
    label: "Donate",
    href: "#donate",
    submenu: [
      { label: "Donate Now", href: "/donate-now" },
      { label: "How to Donate", href: "/how-to-donate" },
      { label: "Donation Proceeds", href: "/donation-proceeds" },
    ],
  },
  {
    label: "Resources",
    href: "#resources",
    submenu: [
      { label: "Documents", href: "#documents" },
      { label: "Training Schedule", href: "#training-schedule" },
      { label: "Blog", href: "#blog" },
      { label: "Media", href: "#media" },
      { label: "FAQs", href: "#faqs" },
    ],
  },
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
          ? "linear-gradient(90deg, rgba(0,127,152,0.6) 0%, rgba(249,115,22,0.6) 100%)"
          : "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/40">
            <Image
              src="/logos/1000mm-logo.png"
              alt="1000MM Logo"
              width={32}
              height={32}
            />
          </div>
          <span className="font-semibold text-white text-lg tracking-tight leading-none">
            1000
            <span className="font-semibold">
              {" "}
              Missionary Movement Bangladesh
            </span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.submenu ? (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => handleMouseEnter(link.label)}
                onMouseLeave={handleMouseLeave}
              >
                <button className="flex items-center gap-1 text-white/90 hover:text-white text-sm font-medium tracking-wide transition-colors duration-200 hover:underline underline-offset-4">
                  {link.label}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === link.label ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {activeDropdown === link.label && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden"
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
                          className={`flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-orange-50 hover:text-gray-900 transition-colors duration-150 ${
                            i < link.submenu.length - 1
                              ? "border-b border-gray-100"
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
                className="text-white/90 hover:text-white text-sm font-medium tracking-wide transition-colors duration-200 hover:underline underline-offset-4"
              >
                {link.label}
              </Link>
            ),
          )}

          <Link
            href={`${PORTAL_URL}`}
            target="_blank"
            className="ml-2 px-5 py-2 rounded-full bg-white/20 border border-white/50 text-white text-sm font-semibold hover:bg-white/30 transition-all duration-200"
          >
            Register / Login
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 pb-6 pt-2 flex flex-col gap-4"
          style={{
            background: "linear-gradient(135deg, #4ade80 0%, #f97316 100%)",
          }}
        >
          {navLinks.map((link) =>
            link.submenu ? (
              <div key={link.label} className="border-b border-white/20 pb-2">
                <button
                  className="flex items-center justify-between w-full text-white font-medium text-base"
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
                  <div className="mt-2 ml-3 flex flex-col gap-2">
                    {link.submenu.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className="text-white/85 text-sm py-1 border-l-2 border-white/30 pl-3 hover:text-white transition-colors"
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
                className="text-white font-medium text-base border-b border-white/20 pb-2"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ),
          )}
          <Link
            href={`${PORTAL_URL}/register`}
            target="_blank"
            className="mt-2 px-5 py-2 rounded-full bg-white/20 border border-white/50 text-white text-sm font-semibold text-center"
            onClick={() => setMenuOpen(false)}
          >
            Apply Now
          </Link>
          <Link
            href={PORTAL_URL}
            target="_blank"
            className="px-5 py-2 rounded-full bg-white text-orange-500 text-sm font-semibold text-center"
            onClick={() => setMenuOpen(false)}
          >
            Login
          </Link>
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
