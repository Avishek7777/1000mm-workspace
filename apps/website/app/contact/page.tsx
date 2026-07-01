"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Calendar, ArrowLeft, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";

type FormData = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};

const staticInfo = [
  {
    icon: MapPin,
    title: "Address",
    lines: [
      "1000 Missionary Movement",
      "Seventh-day Adventist Church of Bangladesh",
      "149 Shah Ali Bagh, Mirpur-1, Dhaka-1216",
      "GPO Box 80, Dhaka 1000",
    ],
    gradient: "linear-gradient(135deg, #16a34a, #4ade80)",
  },
  {
    icon: Phone,
    title: "Phone",
    lines: ["+880 1324-333377"],
    gradient: "linear-gradient(135deg, #007f98, #0099b8)",
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["info@1000mm.org.bd"],
    gradient: "linear-gradient(135deg, #f97316, #fb923c)",
  },
  {
    icon: Calendar,
    title: "Office Hours",
    lines: [
      "Monday – Friday",
      "8:00 AM – 5:00 PM (BST)",
      "Closed on Saturdays (Sabbath)",
    ],
    gradient: "linear-gradient(135deg, #16a34a, #f97316)",
  },
];

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    await new Promise((r) => setTimeout(r, 1000));
    console.log(data);
    reset();
  };

  return (
    <>
      <NavBar />

      <main
        className="relative min-h-screen overflow-hidden pt-24 pb-20"
        style={{
          background: "linear-gradient(160deg, #f9fafb 0%, #fff7ed 100%)",
        }}
      >
        {/* Background watermark */}
        <div
          className="absolute left-1/2 top-[6%] -translate-x-1/2 text-[22vw] font-bold select-none pointer-events-none leading-none opacity-[0.025] text-stone-400"
          style={{ fontFamily: "Georgia, serif" }}
          aria-hidden="true"
        >
          CONTACT
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {/* Back link */}
          <Link
            href="/#contact"
            className="mb-10 inline-flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-700"
            style={{ fontFamily: "Georgia, serif" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-14"
          >
            <div className="mb-4 flex items-center gap-3">
              <span
                className="h-px w-12"
                style={{
                  background: "linear-gradient(90deg, #16a34a, #f97316)",
                }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Get in Touch
              </span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold leading-tight text-stone-800"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Contact{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                }}
              >
                Us
              </span>
            </h1>
            <p
              className="mt-4 max-w-xl text-base leading-relaxed text-stone-500"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Have a question, prayer request, or want to partner with us? We'd
              love to hear from you. Fill in the form below or reach us
              directly.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-start">
            {/* LEFT — Contact info cards */}
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                {staticInfo.map((info, i) => (
                  <motion.div
                    key={info.title}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="rounded-2xl p-6 bg-white border border-stone-100 shadow-sm"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm"
                      style={{ background: info.gradient }}
                    >
                      <info.icon className="w-4 h-4 text-white" />
                    </div>
                    <h3
                      className="font-bold text-stone-800 text-sm mb-2"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {info.title}
                    </h3>
                    <div className="space-y-0.5">
                      {info.lines.map((line, j) => (
                        <p
                          key={j}
                          className="text-stone-500 text-sm leading-relaxed"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Scripture */}
              <motion.blockquote
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="rounded-2xl p-6 border border-stone-100 bg-white"
                style={{ fontFamily: "Georgia, serif" }}
              >
                <div
                  className="text-4xl leading-none mb-2 select-none"
                  style={{
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
                <p className="text-stone-600 text-base italic leading-relaxed">
                  Ask, and it will be given to you; seek, and you will find;
                  knock, and the door will be opened to you.
                </p>
                <p className="text-stone-400 text-sm mt-3">— Matthew 7:7</p>
              </motion.blockquote>
            </div>

            {/* RIGHT — Form */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="sticky top-28"
            >
              <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-8 md:p-10">
                <h2
                  className="text-xl font-bold text-stone-800 mb-1"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Send us a Message
                </h2>
                <p
                  className="text-stone-400 text-sm mb-7"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  We&apos;ll get back to you as soon as possible.
                </p>

                {isSubmitSuccessful ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10"
                  >
                    <div
                      className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #16a34a, #4ade80)",
                      }}
                    >
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <p
                      className="text-stone-700 font-semibold text-lg"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      Message sent!
                    </p>
                    <p
                      className="text-stone-400 text-sm mt-1"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      We&apos;ll get back to you as soon as possible.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                      <label
                        className="block text-xs font-semibold text-stone-500 tracking-wide uppercase mb-2"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        Full Name
                      </label>
                      <input
                        {...register("name", { required: "Name is required" })}
                        placeholder="Your name"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200"
                        style={{ fontFamily: "Georgia, serif" }}
                      />
                      {errors.name && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        className="block text-xs font-semibold text-stone-500 tracking-wide uppercase mb-2"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        Email Address
                      </label>
                      <input
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Enter a valid email address",
                          },
                        })}
                        placeholder="you@example.com"
                        type="email"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200"
                        style={{ fontFamily: "Georgia, serif" }}
                      />
                      {errors.email && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        className="block text-xs font-semibold text-stone-500 tracking-wide uppercase mb-2"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        Phone{" "}
                        <span className="normal-case font-normal text-stone-300">
                          (optional)
                        </span>
                      </label>
                      <input
                        {...register("phone")}
                        placeholder="+880 01XXX-XXXXXX"
                        type="tel"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200"
                        style={{ fontFamily: "Georgia, serif" }}
                      />
                    </div>

                    <div>
                      <label
                        className="block text-xs font-semibold text-stone-500 tracking-wide uppercase mb-2"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        Message
                      </label>
                      <textarea
                        {...register("message", {
                          required: "Message is required",
                        })}
                        placeholder="How can we help you?"
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 resize-none"
                        style={{ fontFamily: "Georgia, serif" }}
                      />
                      {errors.message && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-100 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background:
                          "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                        fontFamily: "Georgia, serif",
                      }}
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
