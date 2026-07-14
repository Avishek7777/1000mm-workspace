import { overlayCertificate } from "../lib/certificates/templateOverlay";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import QRCode from "qrcode";

const OUT = process.argv[2] || "cert-preview.pdf";
const debug = process.argv.includes("--grid");

const tmpl = new Uint8Array(
  readFileSync(path.join(process.cwd(), "public", "certificates", "template.pdf")),
);

const qrDataUrl = await QRCode.toDataURL("https://1000mm.org.bd/verify/MMBD-2025-0029", {
  margin: 0,
  width: 240,
});
const qrPng = new Uint8Array(Buffer.from(qrDataUrl.split(",")[1], "base64"));

const sigDir = path.join(process.cwd(), "public", "uploads", "certificate-signatures");
const readSig = (name: string) => {
  try {
    return new Uint8Array(readFileSync(path.join(sigDir, name)));
  } catch {
    return undefined;
  }
};

const bytes = await overlayCertificate(tmpl, {
  batchLabel: "1st",
  traineeName: "Suzan Sarkar",
  programPeriod: "August 1 to November 30, 2026",
  issuedAt: "July 14, 2026",
  qrPng,
  referenceNumber: "1000MM-2026-L-MISSIONARY.WBM1",
  directorName: "Pr. Krysthyann Zeferino",
  directorTitle: "Director, 1000 MM Bangladesh",
  presidentName: "Pr. Won Sang Kim",
  presidentTitle: "President, BAUM",
  directorSignaturePng: readSig("director.png"),
  presidentSignaturePng: readSig("president.png"),
  debugGrid: debug,
});

writeFileSync(OUT, bytes);
console.log("wrote", OUT);
