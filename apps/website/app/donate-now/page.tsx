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
} from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";

// ─── Types ────────────────────────────────────────────────────────────────────

type Method = "bkash" | "nagad" | "card" | "paypal";

// ─── Preset amounts ───────────────────────────────────────────────────────────

const presets = [
  { bdt: 500, label: "৳500" },
  { bdt: 1000, label: "৳1,000" },
  { bdt: 3000, label: "৳3,000" },
  { bdt: 5000, label: "৳5,000" },
  { bdt: 15000, label: "৳15,000" },
];

// ─── Payment method config ────────────────────────────────────────────────────

const methods: {
  id: Method;
  name: string;
  subtitle: string;
  logo: React.ReactNode;
}[] = [
  {
    id: "bkash",
    name: "bKash",
    subtitle: "Mobile banking",
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

// ─── Sub-forms ────────────────────────────────────────────────────────────────

function MobileMoneyForm({
  method,
  amount,
  onSubmit,
  loading,
}: {
  method: "bkash" | "nagad";
  amount: number;
  onSubmit: () => void;
  loading: boolean;
}) {
  const [phone, setPhone] = useState("");
  const cfg = {
    bkash: { color: "#E2136E", bg: "#fdf2f7", border: "#fbc8df" },
    nagad: { color: "#F7941D", bg: "#fff8f0", border: "#fcd9a8" },
  }[method];

  return (
    <motion.div
      key={method}
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
          {method === "bkash" ? "bKash" : "Nagad"} Payment
        </p>
        <p
          className="text-xs text-gray-500"
          style={{ fontFamily: "Georgia, serif" }}
        >
          You will receive a prompt on your{" "}
          {method === "bkash" ? "bKash" : "Nagad"} number
        </p>
      </div>
      <div>
        <label
          className="block text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1.5"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {method === "bkash" ? "bKash" : "Nagad"} Number
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
        <span
          className="text-sm text-amber-800"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Donation amount
        </span>
        <span
          className="font-bold text-lg"
          style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
        >
          ৳{amount.toLocaleString()}
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
            Send {method === "bkash" ? "bKash" : "Nagad"} Request
          </>
        )}
      </button>
    </motion.div>
  );
}

function CardForm({
  amount,
  onSubmit,
  loading,
}: {
  amount: number;
  onSubmit: () => void;
  loading: boolean;
}) {
  const [card, setCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvc: "",
  });
  const fmt = (v: string) =>
    v
      .replace(/\D/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim()
      .slice(0, 19);
  const fmtExp = (v: string) =>
    v
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1/$2")
      .slice(0, 5);
  const ready =
    card.number.length >= 19 &&
    card.name &&
    card.expiry.length === 5 &&
    card.cvc.length >= 3;

  return (
    <motion.div
      key="card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <svg
          viewBox="0 0 38 24"
          className="w-10 h-7 rounded shadow-sm"
          fill="none"
        >
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
        <svg
          viewBox="0 0 38 24"
          className="w-10 h-7 rounded shadow-sm"
          fill="none"
        >
          <rect width="38" height="24" rx="4" fill="#252525" />
          <circle cx="14" cy="12" r="7" fill="#EB001B" />
          <circle cx="24" cy="12" r="7" fill="#F79E1B" />
          <path d="M19 7.3a7 7 0 0 1 0 9.4A7 7 0 0 1 19 7.3z" fill="#FF5F00" />
        </svg>
        <span
          className="text-xs text-gray-400 ml-1"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Powered by Stripe
        </span>
      </div>
      <div>
        <label
          className="block text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1.5"
          style={{ fontFamily: "Georgia, serif" }}
        >
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
        <label
          className="block text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1.5"
          style={{ fontFamily: "Georgia, serif" }}
        >
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
          <label
            className="block text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1.5"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Expiry
          </label>
          <input
            type="text"
            value={card.expiry}
            onChange={(e) =>
              setCard({ ...card, expiry: fmtExp(e.target.value) })
            }
            placeholder="MM/YY"
            maxLength={5}
            className="w-full px-4 py-3 rounded-2xl border border-amber-200 bg-white text-sm font-mono focus:outline-none focus:border-blue-400 transition-colors"
            style={{ color: "#3b1f08" }}
          />
        </div>
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1.5"
            style={{ fontFamily: "Georgia, serif" }}
          >
            CVC
          </label>
          <input
            type="text"
            value={card.cvc}
            onChange={(e) =>
              setCard({
                ...card,
                cvc: e.target.value.replace(/\D/g, "").slice(0, 4),
              })
            }
            placeholder="•••"
            maxLength={4}
            className="w-full px-4 py-3 rounded-2xl border border-amber-200 bg-white text-sm font-mono focus:outline-none focus:border-blue-400 transition-colors"
            style={{ color: "#3b1f08" }}
          />
        </div>
      </div>
      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-3 flex items-center justify-between">
        <span
          className="text-sm text-amber-800"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Donation amount
        </span>
        <span
          className="font-bold text-lg"
          style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
        >
          ৳{amount.toLocaleString()}
        </span>
      </div>
      <button
        onClick={onSubmit}
        disabled={loading || !ready}
        className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        style={{
          background: "linear-gradient(90deg, #1a56db 0%, #007f98 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Pay ৳{amount.toLocaleString()} Securely
          </>
        )}
      </button>
      <p
        className="text-center text-xs text-gray-400 flex items-center justify-center gap-1"
        style={{ fontFamily: "Georgia, serif" }}
      >
        <Lock className="w-3 h-3" /> Secured by Stripe · 256-bit SSL
      </p>
    </motion.div>
  );
}

function PayPalForm({
  amount,
  onSubmit,
  loading,
}: {
  amount: number;
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
        <p
          className="text-sm text-gray-600 leading-relaxed"
          style={{ fontFamily: "Georgia, serif" }}
        >
          You will be redirected to PayPal to complete your donation of{" "}
          <span className="font-bold text-gray-900">
            ৳{amount.toLocaleString()}
          </span>{" "}
          securely.
        </p>
      </div>
      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-3 flex items-center justify-between">
        <span
          className="text-sm text-amber-800"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Donation amount
        </span>
        <span
          className="font-bold text-lg"
          style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
        >
          ৳{amount.toLocaleString()}
        </span>
      </div>
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01] transition-all duration-300 shadow-md disabled:opacity-50"
        style={{
          background: "linear-gradient(90deg, #003087 0%, #009cde 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Globe className="w-5 h-5" />
            Continue to PayPal
          </>
        )}
      </button>
      <p
        className="text-center text-xs text-gray-400 flex items-center justify-center gap-1"
        style={{ fontFamily: "Georgia, serif" }}
      >
        <Lock className="w-3 h-3" /> Redirects to PayPal's secure checkout
      </p>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DonateNowPage() {
  const router = useRouter();
  const [amount, setAmount] = useState(3000);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [method, setMethod] = useState<Method>("bkash");
  const [loading, setLoading] = useState(false);

  const finalAmount = useCustom ? parseInt(customAmount || "0") : amount;

  async function handleSubmit() {
    if (!finalAmount || finalAmount < 10) return;
    setLoading(true);
    // ── TODO: replace each case with real API call ─────────────────────────
    switch (method) {
      case "bkash":
        // const res = await fetch("/api/payments/bkash/create", { method: "POST", body: JSON.stringify({ amount: finalAmount }) })
        // const { bkashURL } = await res.json(); window.location.href = bkashURL;
        await new Promise((r) => setTimeout(r, 1800));
        break;
      case "nagad":
        // const res = await fetch("/api/payments/nagad/init", { method: "POST", body: JSON.stringify({ amount: finalAmount }) })
        // window.location.href = nagadRedirectURL;
        await new Promise((r) => setTimeout(r, 1800));
        break;
      case "card":
        // const { clientSecret } = await fetch("/api/payments/stripe/create-intent", ...).then(r => r.json())
        // await stripe.confirmCardPayment(clientSecret, { payment_method: { card: elements.getElement(CardElement) } })
        await new Promise((r) => setTimeout(r, 1800));
        break;
      case "paypal":
        // const { approvalUrl } = await fetch("/api/payments/paypal/create-order", ...).then(r => r.json())
        // window.location.href = approvalUrl;
        await new Promise((r) => setTimeout(r, 1800));
        break;
    }
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
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23a16207' stroke-width='0.5'/%3E%3C/svg%3E")`,
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
            Choose your amount and payment method. Every taka goes directly to
            training and sustaining a young missionary in the field.
          </motion.p>
        </div>
      </section>

      {/* ── Main form ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 border-y border-amber-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_420px] gap-10 items-start">
            {/* LEFT — steps 1 & 2 */}
            <div className="space-y-10">
              {/* Step 1 — Amount */}
              <motion.div variants={fadeUp} initial="hidden" animate="show">
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{
                      background: "linear-gradient(90deg, #007f98, #f97316)",
                    }}
                  >
                    1
                  </span>
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                  >
                    Choose an Amount
                  </h2>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                  {presets.map((p) => {
                    const active = !useCustom && amount === p.bdt;
                    return (
                      <button
                        key={p.bdt}
                        onClick={() => {
                          setAmount(p.bdt);
                          setUseCustom(false);
                        }}
                        className={`py-3 rounded-2xl text-sm font-bold border transition-all duration-200 ${active ? "text-white shadow-md scale-[1.04]" : "bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-400"}`}
                        style={
                          active
                            ? {
                                background:
                                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                                borderColor: "transparent",
                                fontFamily: "Georgia, serif",
                              }
                            : { fontFamily: "Georgia, serif" }
                        }
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                <div
                  className={`rounded-2xl border p-4 transition-all duration-200 ${useCustom ? "border-orange-400 bg-orange-50/40" : "border-amber-200 bg-amber-50/40"}`}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-2"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Or enter a custom amount
                  </p>
                  <div className="relative">
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-base"
                      style={{ color: "#b45309", fontFamily: "Georgia, serif" }}
                    >
                      ৳
                    </span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setUseCustom(true);
                      }}
                      onFocus={() => setUseCustom(true)}
                      placeholder="Enter amount"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:border-orange-400 transition-colors"
                      style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Step 2 — Method */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.15 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{
                      background: "linear-gradient(90deg, #007f98, #f97316)",
                    }}
                  >
                    2
                  </span>
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                  >
                    Choose Payment Method
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`relative flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200 hover:shadow-sm ${method === m.id ? "border-orange-400 ring-2 ring-orange-200 bg-orange-50/40" : "border-amber-200 bg-amber-50/30 hover:border-amber-300"}`}
                    >
                      {method === m.id && (
                        <span
                          className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{
                            background:
                              "linear-gradient(90deg, #007f98, #f97316)",
                          }}
                        >
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                      <div className="shrink-0">{m.logo}</div>
                      <div>
                        <p
                          className="font-bold text-sm"
                          style={{
                            fontFamily: "Georgia, serif",
                            color: "#3b1f08",
                          }}
                        >
                          {m.name}
                        </p>
                        <p
                          className="text-xs text-gray-400"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {m.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* RIGHT — payment panel (sticky) */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.25 }}
              className="sticky top-28"
            >
              <div className="rounded-3xl border border-amber-200 bg-white shadow-lg overflow-hidden">
                {/* Panel header */}
                <div
                  className="px-7 py-5 border-b border-amber-100"
                  style={{
                    background:
                      "linear-gradient(135deg, #fdf6ec 0%, #fef3e2 100%)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-0.5"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        Step 3 — Complete
                      </p>
                      <p
                        className="font-bold text-lg"
                        style={{
                          fontFamily: "Georgia, serif",
                          color: "#3b1f08",
                        }}
                      >
                        {methods.find((m) => m.id === method)?.name} Payment
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-xs text-amber-600"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        Giving
                      </p>
                      <p
                        className="text-2xl font-bold text-transparent bg-clip-text"
                        style={{
                          backgroundImage:
                            "linear-gradient(90deg, #007f98, #f97316)",
                          fontFamily: "Georgia, serif",
                        }}
                      >
                        ৳{(finalAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Sub-form */}
                <div className="px-7 py-6">
                  <AnimatePresence mode="wait">
                    {(method === "bkash" || method === "nagad") && (
                      <MobileMoneyForm
                        key={method}
                        method={method}
                        amount={finalAmount || 0}
                        onSubmit={handleSubmit}
                        loading={loading}
                      />
                    )}
                    {method === "card" && (
                      <CardForm
                        key="card"
                        amount={finalAmount || 0}
                        onSubmit={handleSubmit}
                        loading={loading}
                      />
                    )}
                    {method === "paypal" && (
                      <PayPalForm
                        key="paypal"
                        amount={finalAmount || 0}
                        onSubmit={handleSubmit}
                        loading={loading}
                      />
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
                  <div
                    key={text}
                    className="flex items-center gap-1.5 text-gray-400"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span
                      className="text-xs"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {text}
                    </span>
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
          <Heart
            className="w-6 h-6 mx-auto mb-3 text-orange-400"
            fill="currentColor"
          />
          <p
            className="text-base leading-relaxed"
            style={{ fontFamily: "Georgia, serif", color: "#92400e" }}
          >
            Want to give by bank transfer or check?{" "}
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
