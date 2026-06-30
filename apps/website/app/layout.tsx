import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Noto_Sans,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import BackToTop from "@/components/BackToTop";

const playfairDisplayHeading = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
});
const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "1000 Missionary Movement Bangladesh",
  description:
    "Join the 1000 Missionary Movement and spend one year fully dedicated to serving Jesus — transforming lives, planting churches, and sharing the hope of the Gospel across Bangladesh and beyond.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        notoSans.variable,
        playfairDisplayHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('pageshow', function(e) {
                if (e.persisted) {
                  var els = document.querySelectorAll('[style*="opacity: 0"]');
                  for (var i = 0; i < els.length; i++) {
                    els[i].style.opacity = '1';
                    els[i].style.transform = 'none';
                    els[i].style.visibility = 'visible';
                  }
                }
              });
            `,
          }}
        />
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
