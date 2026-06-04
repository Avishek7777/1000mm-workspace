"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Cross } from "lucide-react";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "How to Join", href: "#how-to-join" },
  { label: "About Us", href: "#about-us" },
  { label: "Donate Now", href: "#donate" },
];

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-lg" : ""
      }`}
      style={{
        background: scrolled
          ? "linear-gradient(90deg, rgba(74,222,128,0.75) 0%, rgba(249,115,22,0.75) 100%)"
          : "linear-gradient(90deg, #4ade80 0%, #f97316 100%)",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/40">
            <Cross className="w-4 h-4 text-white" />
          </div>
          <span
            className="font-bold text-white text-lg tracking-tight leading-none"
            style={{ fontFamily: "Georgia, serif" }}
          >
            1000<span className="font-light">MM</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-white/90 hover:text-white text-sm font-medium tracking-wide transition-colors duration-200 hover:underline underline-offset-4"
            >
              {link.label}
            </Link>
          ))}
          {/* Apply Now — goes to portal register */}
          <Link
            href={`${PORTAL_URL}/register`}
            target="_blank"
            className="ml-2 px-5 py-2 rounded-full bg-white/20 border border-white/50 text-white text-sm font-semibold hover:bg-white/30 transition-all duration-200"
          >
            Apply Now
          </Link>
          {/* Login — goes to portal login */}
          <Link
            href={PORTAL_URL}
            target="_blank"
            className="px-5 py-2 rounded-full bg-white text-orange-500 text-sm font-semibold hover:bg-white/90 transition-all duration-200 shadow-md"
          >
            Login
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
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-white font-medium text-base border-b border-white/20 pb-2"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
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
    </nav>
  );
}
