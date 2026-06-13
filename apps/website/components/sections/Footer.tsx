import Link from "next/link";
//import { Cross } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";
import Image from "next/image";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "How to Join", href: "#how-to-join" },
  { label: "About Us", href: "#about-us" },
  { label: "Donate Now", href: "/donate-now" },
  { label: "Login", href: "#login" },
];

const socialLinks = [
  {
    icon: FaFacebookF,
    href: "https://www.facebook.com/1000mm.bd/",
    label: "Facebook",
  },
  { icon: FaInstagram, href: "#", label: "Instagram" },
  { icon: FaYoutube, href: "#", label: "YouTube" },
  { icon: FaXTwitter, href: "#", label: "Twitter / X" },
];

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #071009 0%, #130a03 100%)",
      }}
    >
      {/* Top gradient border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, #4ade80 0%, #f97316 100%)",
        }}
      />

      {/* Background cross pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(74,222,128,0.3) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Main footer content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand column */}
          <div className="md:col-span-1 flex flex-col gap-5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 w-fit">
              <div>
                {/* className="w-12 h-12 rounded-full bg-white/20 flex items-center */}
                {/* justify-center border border-white/20" */}
                <Image
                  src="/logos/sda-nsd.png"
                  alt="1000MM Logo"
                  width={64}
                  height={64}
                />
                {/* <Cross className="w-4 h-4 text-white" /> */}
              </div>
              <span
                className="font-bold text-white tracking-tight"
                style={{ fontFamily: "Georgia, serif", fontSize: "0.9rem" }}
              >
                {/* 1000<span className="font-light opacity-70">MM</span> */}
                An official website of the Seventh-day Adventist Church of
                Bangladesh.
              </span>
            </Link>

            {/* Tagline */}
            <p
              className="text-white/50 text-sm text-justify leading-relaxed max-w-xs"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Raising and mobilizing a new generation of Bangladeshi
              missionaries to impact the world for God. Through training,
              discipleship, and practical support, we equip and send passionate
              servants to bring the hope of the Gospel to unreached peoples,
              make disciples, and advance God's Kingdom across the world.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-1">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all duration-200"
                  target="_blank"
                >
                  <social.icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-col gap-4">
            <h4
              className="text-white font-bold text-sm tracking-widest uppercase"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Quick Links
            </h4>
            <div
              className="h-px w-8"
              style={{
                background: "linear-gradient(90deg, #007f98, #f97316)",
              }}
            />
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/50 text-sm hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    <span
                      className="h-px w-0 group-hover:w-4 transition-all duration-300"
                      style={{
                        background: "linear-gradient(90deg, #007f98, #f97316)",
                      }}
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Scripture + CTA */}
          <div className="flex flex-col gap-6">
            <h4
              className="text-white font-bold text-sm tracking-widest uppercase"
              style={{ fontFamily: "Georgia, serif" }}
            >
              The Great Commission
            </h4>
            <div
              className="h-px w-8"
              style={{
                background: "linear-gradient(90deg, #007f98, #f97316)",
              }}
            />

            {/* Scripture quote */}
            <div
              className="relative rounded-2xl p-5 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(249,115,22,0.06) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="text-4xl leading-none select-none"
                style={{
                  fontFamily: "Georgia, serif",
                  background: "linear-gradient(90deg, #007f98, #f97316)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  display: "inline-block",
                }}
                aria-hidden="true"
              >
                &ldquo;
              </div>
              <p
                className="text-white/70 text-sm leading-relaxed italic"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Go therefore and make disciples of all nations.
              </p>
              <p
                className="text-white/30 text-xs mt-2"
                style={{ fontFamily: "Georgia, serif" }}
              >
                — Matthew 28:19
              </p>
            </div>

            {/* Donate CTA */}
            <Link
              href="/donate-now"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-white text-sm hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg w-fit"
              style={{
                background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                fontFamily: "Georgia, serif",
              }}
            >
              Donate Now →
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="border-t py-6 flex flex-col md:flex-row items-center justify-between gap-3"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <p
            className="text-white/25 text-xs text-center md:text-left"
            style={{ fontFamily: "Georgia, serif" }}
          >
            © 2026 1000 Missionary Movement Bangladesh. All Rights Reserved.
            <br className="md:hidden" /> A Ministry of the Seventh-day Adventist
            Church
          </p>
          <p
            className="text-white/20 text-xs italic"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Designed &amp; Developed for the Glory of God
          </p>
        </div>
      </div>
    </footer>
  );
}
