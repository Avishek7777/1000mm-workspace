"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";

type FormData = {
  name: string;
  email: string;
  message: string;
};

const contactInfo = {
  address: {
    icon: MapPin,
    title: "Address",
    lines: [
      "1000 Missionary Movement",
      "Seventh-day Adventist Church of Bangladesh",
      "149 Shah Ali Bagh, Mirpur-1, Dhaka-1216, GPO Box 80, Dhaka 1000",
    ],
  },
  contact: {
    icon: Phone,
    title: "Contact",
    lines: ["+880 1314-333300", "info@1000mm.org.bd", "www.1000mm.org.bd"],
  },
  schedule: {
    icon: Calendar,
    title: "Training Schedules",
    lines: [
      "Batch Intake: January & July",
      "Training Duration: 3 Months",
      "Field Assignment: 9 Months",
    ],
  },
};

export default function ContactUs() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    // Replace with your actual form submission logic
    await new Promise((r) => setTimeout(r, 1000));
    console.log(data);
    reset();
  };

  return (
    <section
      id="contact"
      className="relative py-10 overflow-hidden bg-stone-50"
    >
      {/* Decorative top border */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: "linear-gradient(90deg, #4ade80 0%, #f97316 100%)",
        }}
      />

      {/* Background watermark */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-bold select-none pointer-events-none leading-none opacity-[0.03] text-stone-400"
        style={{ fontFamily: "Georgia, serif" }}
        aria-hidden="true"
      >
        CONTACT
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <span
              className="h-px w-12"
              style={{
                background: "linear-gradient(90deg, #16a34a, #f97316)",
              }}
            />
            <span
              className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-500"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Get in Touch
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-stone-800 leading-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Contact{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              Us
            </span>
          </h2>
        </motion.div>

        {/* 3-column info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {Object.values(contactInfo).map((info, i) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="relative rounded-3xl p-7 bg-white border border-stone-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group"
            >
              {/* Corner accent */}
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-bl-3xl rounded-tr-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{
                  background:
                    i % 2 === 0
                      ? "linear-gradient(135deg, #4ade80, #16a34a)"
                      : "linear-gradient(135deg, #f97316, #ea580c)",
                }}
              />

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 shadow-sm"
                style={{
                  background:
                    i % 2 === 0
                      ? "linear-gradient(135deg, #16a34a, #4ade80)"
                      : i === 1
                        ? "linear-gradient(135deg, #f97316, #fb923c)"
                        : "linear-gradient(135deg, #16a34a, #f97316)",
                }}
              >
                <info.icon className="w-5 h-5 text-white" />
              </div>

              <h3
                className="font-bold text-stone-800 text-base mb-3"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {info.title}
              </h3>

              <div className="space-y-1">
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

        {/* Contact form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-8 md:p-10">
            <h3
              className="text-xl font-bold text-stone-800 mb-1"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Send us a Message
            </h3>
            <p
              className="text-stone-400 text-sm mb-7"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Have a question? We&apos;d love to hear from you.
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
                {/* Name */}
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
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200"
                    style={{ fontFamily: "Georgia, serif" }}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
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
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200"
                    style={{ fontFamily: "Georgia, serif" }}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Message */}
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
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200 resize-none"
                    style={{ fontFamily: "Georgia, serif" }}
                  />
                  {errors.message && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 hover:scale-[1.02] active:scale-100 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {isSubmitting ? "Sending..." : "Send Message →"}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
