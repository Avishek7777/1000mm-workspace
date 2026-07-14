"use client";

import { useState } from "react";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa6";
import { Link as LinkIcon, Check } from "lucide-react";

/**
 * Share a page to Facebook / WhatsApp or copy its link.
 * `path` is site-relative (e.g. /current-projects/foo); the absolute URL is
 * built from the browser origin so it works in every environment.
 */
export function ShareButtons({
  path,
  title,
  size = "md",
}: {
  path: string;
  title: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);

  const url = () =>
    typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  const open = (shareUrl: string) =>
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");

  const btn =
    size === "sm"
      ? "h-7 w-7 rounded-full border flex items-center justify-center transition-colors"
      : "h-9 w-9 rounded-full border flex items-center justify-center transition-colors";
  const icon = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Share on Facebook"
        title="Share on Facebook"
        onClick={() =>
          open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`,
          )
        }
        className={`${btn} border-stone-200 text-stone-400 hover:border-[#1877f2] hover:text-[#1877f2]`}
      >
        <FaFacebookF className={icon} />
      </button>
      <button
        type="button"
        aria-label="Share on WhatsApp"
        title="Share on WhatsApp"
        onClick={() =>
          open(
            `https://wa.me/?text=${encodeURIComponent(`${title} — ${url()}`)}`,
          )
        }
        className={`${btn} border-stone-200 text-stone-400 hover:border-[#25d366] hover:text-[#25d366]`}
      >
        <FaWhatsapp className={icon} />
      </button>
      <button
        type="button"
        aria-label="Copy link"
        title={copied ? "Copied!" : "Copy link"}
        onClick={async () => {
          await navigator.clipboard.writeText(url());
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className={`${btn} ${copied ? "border-teal-400 text-teal-600" : "border-stone-200 text-stone-400 hover:border-teal-500 hover:text-teal-600"}`}
      >
        {copied ? <Check className={icon} /> : <LinkIcon className={icon} />}
      </button>
    </div>
  );
}
