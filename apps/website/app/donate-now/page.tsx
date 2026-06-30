"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  CreditCard,
  Globe,
  Lock,
  Check,
  Loader2,
  Heart,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";

// ─── Country / currency config ────────────────────────────────────────────────

type CountryConfig = {
  code: string;
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  presets: number[];
  locale: string;
};

const countries: CountryConfig[] = [
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    currency: "USD",
    symbol: "$",
    presets: [25, 50, 100, 500, 1000],
    locale: "en-US",
  },
  {
    code: "BD",
    name: "Bangladesh",
    flag: "🇧🇩",
    currency: "BDT",
    symbol: "৳",
    presets: [3000, 5000, 10000, 50000, 100000],
    locale: "bn-BD",
  },
  {
    code: "EU",
    name: "Europe (EU)",
    flag: "🇪🇺",
    currency: "EUR",
    symbol: "€",
    presets: [25, 50, 100, 500, 1000],
    locale: "de-DE",
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    currency: "GBP",
    symbol: "£",
    presets: [20, 50, 100, 400, 800],
    locale: "en-GB",
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    currency: "CAD",
    symbol: "C$",
    presets: [35, 70, 150, 700, 1400],
    locale: "en-CA",
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    currency: "AUD",
    symbol: "A$",
    presets: [40, 80, 150, 800, 1500],
    locale: "en-AU",
  },
  {
    code: "BR",
    name: "Brazil",
    flag: "🇧🇷",
    currency: "BRL",
    symbol: "R$",
    presets: [150, 300, 600, 3000, 6000],
    locale: "pt-BR",
  },
  {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    currency: "SGD",
    symbol: "S$",
    presets: [35, 70, 150, 700, 1400],
    locale: "en-SG",
  },
  {
    code: "ZA",
    name: "South Africa",
    flag: "🇿🇦",
    currency: "ZAR",
    symbol: "R",
    presets: [500, 1000, 2000, 10000, 20000],
    locale: "en-ZA",
  },
  {
    code: "NZ",
    name: "New Zealand",
    flag: "🇳🇿",
    currency: "NZD",
    symbol: "NZ$",
    presets: [40, 80, 160, 800, 1600],
    locale: "en-NZ",
  },
  {
    code: "CH",
    name: "Switzerland",
    flag: "🇨🇭",
    currency: "CHF",
    symbol: "CHF",
    presets: [25, 50, 100, 500, 1000],
    locale: "de-CH",
  },
  {
    code: "NO",
    name: "Norway",
    flag: "🇳🇴",
    currency: "NOK",
    symbol: "kr",
    presets: [250, 500, 1000, 5000, 10000],
    locale: "nb-NO",
  },
  {
    code: "KR",
    name: "South Korea",
    flag: "🇰🇷",
    currency: "KRW",
    symbol: "₩",
    presets: [35000, 70000, 140000, 700000, 1400000],
    locale: "ko-KR",
  },
];

function formatAmount(amount: number, country: CountryConfig): string {
  return `${country.symbol}${amount.toLocaleString(country.locale)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Method = "bkash" | "nagad" | "card" | "paypal";

const methods: {
  id: Method;
  name: string;
  subtitle: string;
  availableFor?: string[]; // country codes — undefined = all
  logo: React.ReactNode;
}[] = [
  {
    id: "bkash",
    name: "bKash",
    subtitle: "Mobile banking",
    availableFor: ["BD"],
    logo: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <rect width="48" height="48" rx="12" fill="#E2136E" />
        <text
          x="50%"
          y="58%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="13"
          fontWeight="bold"
          fontFamily="Georgia, serif"
        >
          bKash
        </text>
      </svg>
    ),
  },
  {
    id: "nagad",
    name: "Nagad",
    subtitle: "Mobile banking",
    availableFor: ["BD"],
    logo: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <rect width="48" height="48" rx="12" fill="#F7941D" />
        <text
          x="50%"
          y="58%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
          fontFamily="Georgia, serif"
        >
          Nagad
        </text>
      </svg>
    ),
  },
  {
    id: "card",
    name: "Card",
    subtitle: "Visa · Mastercard · Stripe",
    logo: (
      <div className="flex items-center gap-1">
        <svg viewBox="0 0 38 24" className="w-9 h-6" fill="none">
          <rect width="38" height="24" rx="4" fill="#1A1F71" />
          <text
            x="50%"
            y="62%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="white"
            fontSize="9"
            fontWeight="bold"
            fontFamily="Arial"
            letterSpacing="1"
          >
            VISA
          </text>
        </svg>
        <svg viewBox="0 0 38 24" className="w-9 h-6" fill="none">
          <rect width="38" height="24" rx="4" fill="#252525" />
          <circle cx="14" cy="12" r="7" fill="#EB001B" />
          <circle cx="24" cy="12" r="7" fill="#F79E1B" />
          <path d="M19 7.3a7 7 0 0 1 0 9.4A7 7 0 0 1 19 7.3z" fill="#FF5F00" />
        </svg>
      </div>
    ),
  },
  {
    id: "paypal",
    name: "PayPal",
    subtitle: "International payments",
    logo: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <rect width="48" height="48" rx="12" fill="#003087" />
        <text
          x="50%"
          y="58%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
          fontFamily="Arial"
        >
          PayPal
        </text>
      </svg>
    ),
  },
];

// ─── Backgrounds ──────────────────────────────────────────────────────────────

const warmBg = {
  background: "linear-gradient(160deg, #fdf6ec 0%, #fef3e2 50%, #fdf0d5 100%)",
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// ─── Country Selector ─────────────────────────────────────────────────────────

function CountrySelector({
  selected,
  onChange,
}: {
  selected: CountryConfig;
  onChange: (c: CountryConfig) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl border border-amber-200 bg-white text-left transition-colors hover:border-amber-400 focus:outline-none"
        style={{ fontFamily: "Georgia, serif" }}
      >
        <span className="text-xl">{selected.flag}</span>
        <div className="flex-1">
          <span className="text-sm font-bold text-stone-800">
            {selected.name}
          </span>
          <span className="text-xs text-stone-400 ml-2">
            ({selected.currency})
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-amber-200 bg-white shadow-xl z-20 overflow-hidden max-h-56 overflow-y-auto">
          {countries.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-amber-50 ${
                c.code === selected.code ? "bg-orange-50/60" : ""
              }`}
              style={{ fontFamily: "Georgia, serif" }}
            >
              <span className="text-lg">{c.flag}</span>
              <span className="font-medium text-stone-800 flex-1">{c.name}</span>
              <span className="text-xs text-stone-400">{c.currency}</span>
              {c.code === selected.code && (
                <Check className="w-3.5 h-3.5 text-orange-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-forms ────────────────────────────────────────────────────────────────

function MobileMoneyForm({
  methodId,
  amount,
  country,
  onSubmit,
  loading,
}: {
  methodId: "bkash" | "nagad";
  amount: number;
  country: CountryConfig;
  onSubmit: () => void;
  loading: boolean;
}) {
  const [phone, setPhone] = useState("");
  const cfg = {
    bkash: { color: "#E2136E", bg: "#fdf2f7", border: "#fbc8df" },
    nagad: { color: "#F7941D", bg: "#fff8f0", border: "#fcd9a8" },
  }[methodId];

  return (
    <motion.div
      key={methodId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div
        className="rounded-2xl p-4 border"
        style={{ background: cfg.bg, borderColor: cfg.border }}
      >
        <p
          className="font-bold text-sm mb-0.5"
          style={{ color: cfg.color, fontFamily: "Georgia, serif" }}
        >
          {methodId === "bkash" ? "bKash" : "Nagad"} Payment
        </p>
        <p className="text-xs text-gray-500" style={{ fontFamily: "Georgia, serif" }}>
          You will receive a prompt on your {methodId === "bkash" ? "bKash" : "Nagad"} number
        </p>
      </div>
      <div>
        <label
          className="block text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1.5"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {methodId === "bkash" ? "bKash" : "Nagad"} Number
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">
            +880
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXX-XXXXXX"
            className="w-full pl-14 pr-4 py-3 rounded-2xl border border-amber-200 bg-white text-sm focus:outline-none focus:border-orange-400 transition-colors"
            style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
          />
        </div>
      </div>
      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-3 flex items-center justify-between">
        <span className="text-sm text-amber-800" style={{ fontFamily: "Georgia, serif" }}>
          Donation amount
        </span>
        <span className="font-bold text-lg" style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}>
          {formatAmount(amount, country)}
        </span>
      </div>
      <button
        onClick={onSubmit}
        disabled={loading || phone.length < 10}
        className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        style={{
          background: `linear-gradient(90deg, ${cfg.color} 0%, #f97316 100%)`,
          fontFamily: "Georgia, serif",
        }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Smartphone className="w-5 h-5" />
            Send {methodId === "bkash" ? "bKash" : "Nagad"} Request
          </>
        )}
      </button>
    </motion.div>
  );
}

function CardForm({
  amount,
  country,
  onSubmit,
  loading,
}: {
  amount: number;
  country: CountryConfig;
  onSubmit: () => void;
  loading: boolean;
}) {
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const fmt = (v: string) =>
    v.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  const fmtExp = (v: string) =>
    v.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "$1/$2").slice(0, 5);
  const ready =
    card.number.length >= 19 && card.name && card.expiry.length === 5 && card.cvc.length >= 3;

  return (
    <motion.div
      key="card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1.5" style={{ fontFamily: "Georgia, serif" }}>
          Card Number
        </label>
        <input
          type="text"
          value={card.number}
          onChange={(e) => setCard({ ...card, number: fmt(e.target.value) })}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          className="w-full px-4 py-3 rounded-2xl border border-amber-200 bg-white text-sm font-mono focus:outline-none focus:border-blue-400 transition-colors"
          style={{ color: "#3b1f08" }}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1.5" style={{ fontFamily: "Georgia, serif" }}>
          Cardholder Name
        </label>
        <input
          type="text"
          value={card.name}
          onChange={(e) => setCard({ ...card, name: e.target.value })}
          placeholder="Name as on card"
          className="w-full px-4 py-3 rounded-2xl border border-amber-200 bg-white text-sm focus:outline-none focus:border-blue-400 transition-colors"
          style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1.5" style={{ fontFamily: "Georgia, serif" }}>Expiry</label>
          <input
            type="text"
            value={card.expiry}
            onChange={(e) => setCard({ ...card, expiry: fmtExp(e.target.value) })}
            placeholder="MM/YY"
            maxLength={5}
            className="w-full px-4 py-3 rounded-2xl border border-amber-200 bg-white text-sm font-mono focus:outline-none focus:border-blue-400 transition-colors"
            style={{ color: "#3b1f08" }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1.5" style={{ fontFamily: "Georgia, serif" }}>CVC</label>
          <input
            type="text"
            value={card.cvc}
            onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            placeholder="•••"
            maxLength={4}
            className="w-full px-4 py-3 rounded-2xl border border-amber-200 bg-white text-sm font-mono focus:outline-none focus:border-blue-400 transition-colors"
            style={{ color: "#3b1f08" }}
          />
        </div>
      </div>
      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-3 flex items-center justify-between">
        <span className="text-sm text-amber-800" style={{ fontFamily: "Georgia, serif" }}>Donation amount</span>
        <span className="font-bold text-lg" style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}>
          {formatAmount(amount, country)}
        </span>
      </div>
      <button
        onClick={onSubmit}
        disabled={loading || !ready}
        className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        style={{ background: "linear-gradient(90deg, #1a56db 0%, #007f98 100%)", fontFamily: "Georgia, serif" }}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <><Lock className="w-4 h-4" /> Pay {formatAmount(amount, country)} Securely</>
        )}
      </button>
      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1" style={{ fontFamily: "Georgia, serif" }}>
        <Lock className="w-3 h-3" /> Secured by Stripe · 256-bit SSL
      </p>
    </motion.div>
  );
}

function PayPalForm({
  amount,
  country,
  onSubmit,
  loading,
}: {
  amount: number;
  country: CountryConfig;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      key="paypal"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 text-center">
        <svg viewBox="0 0 48 48" className="w-12 h-12 mx-auto mb-3" fill="none">
          <rect width="48" height="48" rx="12" fill="#003087" />
          <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">PayPal</text>
        </svg>
        <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
          You will be redirected to PayPal to complete your donation of{" "}
          <span className="font-bold text-gray-900">{formatAmount(amount, country)}</span> securely.
        </p>
      </div>
      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-3 flex items-center justify-between">
        <span className="text-sm text-amber-800" style={{ fontFamily: "Georgia, serif" }}>Donation amount</span>
        <span className="font-bold text-lg" style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}>{formatAmount(amount, country)}</span>
      </div>
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-300 shadow-md disabled:opacity-50"
        style={{ background: "linear-gradient(90deg, #003087 0%, #009cde 100%)", fontFamily: "Georgia, serif" }}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <><Globe className="w-5 h-5" /> Continue to PayPal</>
        )}
      </button>
      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1" style={{ fontFamily: "Georgia, serif" }}>
        <Lock className="w-3 h-3" /> Redirects to PayPal's secure checkout
      </p>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DonateNowPage() {
  const router = useRouter();
  const [country, setCountry] = useState<CountryConfig>(countries[0]);
  const [amount, setAmount] = useState(country.presets[2]);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [method, setMethod] = useState<Method>("bkash");
  const [loading, setLoading] = useState(false);

  const finalAmount = useCustom ? parseInt(customAmount || "0") : amount;

  function handleCountryChange(c: CountryConfig) {
    setCountry(c);
    setAmount(c.presets[2]);
    setUseCustom(false);
    setCustomAmount("");
    // Reset method if current method isn't available for this country
    if (c.code !== "BD" && (method === "bkash" || method === "nagad")) {
      setMethod("card");
    }
  }

  const availableMethods = methods.filter(
    (m) => !m.availableFor || m.availableFor.includes(country.code),
  );

  async function handleSubmit() {
    if (!finalAmount || finalAmount < 1) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);
    router.push("/thank-you");
  }

  return (
    <>
      <NavBar />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 overflow-hidden" style={warmBg}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 65% 55% at 50% 0%, rgba(251,191,36,0.18) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-5"
          >
            <span className="h-px w-10 bg-orange-400" />
            <span
              className="text-orange-500 text-sm font-semibold tracking-[0.2em] uppercase"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Make a Donation
            </span>
            <span className="h-px w-10 bg-orange-400" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-4xl md:text-6xl font-bold leading-tight mb-4"
            style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
          >
            Support a Missionary
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              Starting Today.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-base md:text-lg leading-relaxed"
            style={{ fontFamily: "Georgia, serif", color: "#92400e" }}
          >
            Choose your country, pick an amount, and select your payment method.
            Every gift goes directly to training and sustaining a young
            missionary in the field.
          </motion.p>
        </div>
      </section>

      {/* ── Main form ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 border-y border-amber-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_420px] gap-10 items-start">
            {/* LEFT — steps */}
            <div className="space-y-10">
              {/* Step 1 — Country */}
              <motion.div variants={fadeUp} initial="hidden" animate="show">
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(90deg, #007f98, #f97316)" }}
                  >
                    1
                  </span>
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                  >
                    Select Your Country
                  </h2>
                </div>
                <CountrySelector selected={country} onChange={handleCountryChange} />
              </motion.div>

              {/* Step 2 — Amount */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(90deg, #007f98, #f97316)" }}
                  >
                    2
                  </span>
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                  >
                    Choose an Amount
                  </h2>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                  {country.presets.map((p) => {
                    const active = !useCustom && amount === p;
                    return (
                      <button
                        key={p}
                        onClick={() => { setAmount(p); setUseCustom(false); }}
                        className={`py-3 rounded-2xl text-sm font-bold border transition-all duration-200 ${active ? "text-white shadow-md scale-[1.04]" : "bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-400"}`}
                        style={
                          active
                            ? { background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)", borderColor: "transparent", fontFamily: "Georgia, serif" }
                            : { fontFamily: "Georgia, serif" }
                        }
                      >
                        {formatAmount(p, country)}
                      </button>
                    );
                  })}
                </div>
                <div className={`rounded-2xl border p-4 transition-all duration-200 ${useCustom ? "border-orange-400 bg-orange-50/40" : "border-amber-200 bg-amber-50/40"}`}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-2" style={{ fontFamily: "Georgia, serif" }}>
                    Or enter a custom amount
                  </p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-base" style={{ color: "#b45309", fontFamily: "Georgia, serif" }}>
                      {country.symbol}
                    </span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setUseCustom(true); }}
                      onFocus={() => setUseCustom(true)}
                      placeholder="Enter amount"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:border-orange-400 transition-colors"
                      style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Step 3 — Method */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(90deg, #007f98, #f97316)" }}
                  >
                    3
                  </span>
                  <h2 className="text-xl font-bold" style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}>
                    Choose Payment Method
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {availableMethods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`relative flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200 hover:shadow-sm ${method === m.id ? "border-orange-400 ring-2 ring-orange-200 bg-orange-50/40" : "border-amber-200 bg-amber-50/30 hover:border-amber-300"}`}
                    >
                      {method === m.id && (
                        <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(90deg, #007f98, #f97316)" }}>
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                      <div className="shrink-0">{m.logo}</div>
                      <div>
                        <p className="font-bold text-sm" style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}>{m.name}</p>
                        <p className="text-xs text-gray-400" style={{ fontFamily: "Georgia, serif" }}>{m.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* RIGHT — payment panel */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }} className="sticky top-28">
              <div className="rounded-3xl border border-amber-200 bg-white shadow-lg overflow-hidden">
                <div className="px-7 py-5 border-b border-amber-100" style={{ background: "linear-gradient(135deg, #fdf6ec 0%, #fef3e2 100%)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-0.5" style={{ fontFamily: "Georgia, serif" }}>
                        Step 4 — Complete
                      </p>
                      <p className="font-bold text-lg" style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}>
                        {availableMethods.find((m) => m.id === method)?.name} Payment
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-amber-600 mb-0.5" style={{ fontFamily: "Georgia, serif" }}>
                        {country.flag} {country.currency}
                      </p>
                      <p
                        className="text-2xl font-bold text-transparent bg-clip-text"
                        style={{ backgroundImage: "linear-gradient(90deg, #007f98, #f97316)", fontFamily: "Georgia, serif" }}
                      >
                        {formatAmount(finalAmount || 0, country)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-7 py-6">
                  <AnimatePresence mode="wait">
                    {(method === "bkash" || method === "nagad") && (
                      <MobileMoneyForm key={method} methodId={method} amount={finalAmount || 0} country={country} onSubmit={handleSubmit} loading={loading} />
                    )}
                    {method === "card" && (
                      <CardForm key="card" amount={finalAmount || 0} country={country} onSubmit={handleSubmit} loading={loading} />
                    )}
                    {method === "paypal" && (
                      <PayPalForm key="paypal" amount={finalAmount || 0} country={country} onSubmit={handleSubmit} loading={loading} />
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-4 flex items-center justify-center gap-6 flex-wrap">
                {[
                  { icon: Lock, text: "SSL Secured" },
                  { icon: ShieldCheck, text: "Verified Charity" },
                  { icon: Heart, text: "100% to Mission" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-gray-400">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs" style={{ fontFamily: "Georgia, serif" }}>{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Bottom strip ──────────────────────────────────────────────────── */}
      <section className="py-12" style={warmBg}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Heart className="w-6 h-6 mx-auto mb-3 text-orange-400" fill="currentColor" />
          <p className="text-base leading-relaxed" style={{ fontFamily: "Georgia, serif", color: "#92400e" }}>
            Want to give by bank transfer or cheque?{" "}
            <a
              href="/how-to-donate"
              className="font-semibold underline underline-offset-4 hover:text-orange-600 transition-colors"
              style={{ color: "#c2410c" }}
            >
              See all payment options →
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
