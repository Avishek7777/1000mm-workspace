import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";
import Image from "next/image";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "How to Join", href: "/#how-to-join" },
  { label: "About Us", href: "/#about-us" },
  { label: "Become a Trainer", href: "/become-a-trainer" },
  { label: "FAQs", href: "/faq" },
  { label: "Donate Now", href: "/donate-now" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
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
      className="relative overflow-hidden pt-4"
      style={{
        background: "linear-gradient(135deg, #003d4a 0%, #7a2800 100%)",
      }}
    >
      {/* Top gradient border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
        }}
      />

      {/* Background cross pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Main footer — 3 columns: brand · links (2-col grid) · cta */}
        <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 items-start">
          {/* Brand */}
          <div className="flex flex-col gap-2.5">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <Image
                src="/logos/sda-nsd.png"
                alt="1000MM Logo"
                width={36}
                height={36}
              />
              <span
                className="font-bold text-white/90 text-[11px] leading-snug max-w-[240px]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Official website · Seventh-day Adventist Church of Bangladesh
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/10 text-white/35 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all duration-200"
                  target="_blank"
                >
                  <social.icon className="w-3 h-3" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick links — 2-column grid, 3 links each */}
          <div className="flex flex-col gap-2">
            <p
              className="text-white text-[10px] font-extrabold tracking-widest uppercase"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Quick Links
            </p>
            <div
              className="h-px w-6"
              style={{ background: "linear-gradient(90deg, #007f98, #f97316)" }}
            />
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {quickLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-white/60 text-[11px] font-semibold hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  <span
                    className="h-px w-0 group-hover:w-2.5 transition-all duration-300 shrink-0"
                    style={{
                      background: "linear-gradient(90deg, #007f98, #f97316)",
                    }}
                  />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Scripture + CTAs */}
          <div className="flex flex-col gap-2.5">
            <p
              className="text-white text-[10px] font-extrabold tracking-widest uppercase"
              style={{ fontFamily: "Georgia, serif" }}
            >
              The Great Commission
            </p>
            <div
              className="h-px w-6"
              style={{ background: "linear-gradient(90deg, #007f98, #f97316)" }}
            />
            <div
              className="rounded-xl px-3 py-2.5"
              style={{
                background:
                  "linear-gradient(135deg, rgba(74,222,128,0.07) 0%, rgba(249,115,22,0.05) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-white/90 text-[11px] font-semibold leading-relaxed italic"
                style={{ fontFamily: "Georgia, serif" }}
              >
                &ldquo;Go therefore and make disciples of all nations.&rdquo;
              </p>
              <p
                className="text-white/60 text-[10px] font-semibold mt-1"
                style={{ fontFamily: "Georgia, serif" }}
              >
                — Matthew 28:19
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="border-t py-3 flex flex-col md:flex-row items-center justify-between gap-2"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p
            className="text-white/20 text-[10px] font-semibold"
            style={{ fontFamily: "Georgia, serif" }}
          >
            © {new Date().getFullYear()} 1000 Missionary Movement Bangladesh. All Rights Reserved. · A
            Ministry of the Seventh-day Adventist Church
          </p>
          <div
            className="flex items-center gap-3 text-[10px]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {legalLinks.map((link, i) => (
              <span key={link.label} className="flex items-center gap-3">
                <Link
                  href={link.href}
                  className="text-white/20 hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </Link>
                {i < legalLinks.length - 1 && (
                  <span className="text-white/10">·</span>
                )}
              </span>
            ))}
          </div>
          <p
            className="text-white/20 text-[10px] font-semibold italic"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Designed for the Glory of God
          </p>
        </div>
      </div>
    </footer>
  );
}
