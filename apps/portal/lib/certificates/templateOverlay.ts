/**
 * Draws a complete certificate onto the blank official template.
 *
 * Template (border + logos + watermark only):
 *   apps/portal/public/certificates/template.pdf
 * Embedded fonts:
 *   apps/portal/public/certificates/fonts/*.ttf
 *
 * Everything else — heading, batch, motto, recipient name, body paragraph,
 * both signature blocks, date of issue, QR, reference — is rendered here.
 * Positions are fractions of the page (0,0 = top-left). Set `debugGrid: true`
 * to overlay a coordinate grid while tuning, then turn it off.
 */
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync } from "fs";
import path from "path";

export type CertificateOverlayData = {
  batchLabel: string; // "28th"  (empty string → batch line omitted)
  traineeName: string;
  programPeriod: string; // "December 1 to 18, 2025"
  issuedAt: string; // "December 18, 2025"
  qrPng: Uint8Array;
  referenceNumber: string;
  directorName: string;
  directorTitle: string;
  presidentName: string;
  presidentTitle: string;
  directorSignaturePng?: Uint8Array;
  presidentSignaturePng?: Uint8Array;
  debugGrid?: boolean;
};

const BLACK = rgb(0.11, 0.1, 0.09);
const MAROON = rgb(0.5, 0.08, 0.08);
const GREEN = rgb(0.05, 0.42, 0.25);
const INK = rgb(0.22, 0.18, 0.12);

type Align = "left" | "center" | "right";

// ── Layout (fractions of page width/height, from top-left) ──────────────────
// Baselines (yTop) unless noted. Upper block compressed to free space below.
// Inner border (from grid): x∈[0.085,0.915], y∈[0.11,0.905].
// ~3rem safe inset keeps content within y∈[0.17,0.845], x∈[0.128,0.872].
const LAYOUT = {
  orgName: { yTop: 0.178, size: 20, color: BLACK, tracking: 1.2 },
  subtitle: { yTop: 0.214, size: 13, color: BLACK },
  address: { yTop: 0.246, size: 11.5, color: INK },
  batch: { yTop: 0.289, size: 20, color: MAROON, tracking: 1 },
  motto: { yTop: 0.325, size: 18, color: MAROON },
  presents: { yTop: 0.359, size: 12, color: INK },
  certOfCompletion: { yTop: 0.391, size: 16, color: GREEN, tracking: 1.5 },
  toWord: { yTop: 0.414, size: 12, color: INK },
  name: { yTop: 0.47, size: 33, color: MAROON }, // Manufacturing Consent
  body: {
    startYTop: 0.52,
    size: 13,
    leftFrac: 0.115,
    rightFrac: 0.885,
    lineHeight: 0.042,
    color: INK,
  },
  sig: {
    ruleYTop: 0.742,
    ruleHalfW: 0.11,
    imgMaxH: 0.058,
    nameYTop: 0.773,
    nameSize: 12.5,
    titleYTop: 0.798,
    titleSize: 11,
  },
  directorX: 0.245,
  presidentX: 0.755,
  // Date of issue — left-aligned block so date, rule and label all line up
  issueLeftX: 0.1,
  issueDate: { yTop: 0.834, size: 11 },
  issueRuleYTop: 0.844,
  issueRuleW: 0.065,
  issueLabel: { yTop: 0.86, size: 8.5 },
  // Our additions
  qr: { x: 0.885, yTop: 0.79, size: 0.053 },
  reference: { yTop: 0.86, x: 0.28, size: 8.5, color: INK },
};

const BODY_TEMPLATE = (period: string) =>
  `has successfully completed the 1000 Missionary Movement Training Program ` +
  `conducted by 1000 Missionary Movement of Bangladesh Union Mission of the ` +
  `Seventh-day Adventists from ${period} at Bangladesh Adventist Nursing ` +
  `College, Gazipur-1750. You are hereby commissioned as a volunteer ` +
  `missionary to share the gospel of our Lord and Savior Jesus Christ with the world.`;

const FONT_DIR = () =>
  path.join(process.cwd(), "public", "certificates", "fonts");

let fontCache: Record<string, Uint8Array> | null = null;
function loadFonts(): Record<string, Uint8Array> {
  if (fontCache) return fontCache;
  const names = [
    "Cinzel-Bold",
    "Cinzel-Regular",
    "EBGaramond-Regular",
    "EBGaramond-Italic",
    "EBGaramond-Bold",
    "EBGaramond-MediumItalic",
    "GreatVibes-Regular",
    "ManufacturingConsent-Regular",
  ];
  const out: Record<string, Uint8Array> = {};
  for (const n of names) {
    out[n] = new Uint8Array(readFileSync(path.join(FONT_DIR(), `${n}.ttf`)));
  }
  fontCache = out;
  return out;
}

export async function overlayCertificate(
  templateBytes: Uint8Array,
  data: CertificateOverlayData,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(templateBytes);
  pdf.registerFontkit(fontkit);
  const page = pdf.getPage(0);
  const { width: W, height: H } = page.getSize();

  pdf.setTitle(`Certificate of Completion — ${data.traineeName}`);
  pdf.setAuthor("1000 Missionary Movement Bangladesh");
  pdf.setSubject(`Reference ${data.referenceNumber}`);
  pdf.setKeywords(["1000MM", "certificate", data.referenceNumber]);
  pdf.setProducer("1000MM Bangladesh Portal");
  pdf.setCreator("1000MM Bangladesh Portal");

  // Fonts — custom certificate faces, with Times as a safety fallback.
  let cinzelBold: PDFFont,
    garamond: PDFFont,
    garamondItalic: PDFFont,
    garamondBold: PDFFont,
    garamondMedItalic: PDFFont,
    script: PDFFont;
  try {
    const f = loadFonts();
    cinzelBold = await pdf.embedFont(f["Cinzel-Bold"], { subset: true });
    garamond = await pdf.embedFont(f["EBGaramond-Regular"], { subset: true });
    garamondItalic = await pdf.embedFont(f["EBGaramond-Italic"], {
      subset: true,
    });
    garamondBold = await pdf.embedFont(f["EBGaramond-Bold"], { subset: true });
    garamondMedItalic = await pdf.embedFont(f["EBGaramond-MediumItalic"], {
      subset: true,
    });
    script = await pdf.embedFont(f["ManufacturingConsent-Regular"], {
      subset: true,
    });
  } catch {
    const b = await pdf.embedFont(StandardFonts.TimesRomanBold);
    const r = await pdf.embedFont(StandardFonts.TimesRoman);
    const i = await pdf.embedFont(StandardFonts.TimesRomanItalic);
    cinzelBold = b;
    garamond = r;
    garamondItalic = i;
    garamondBold = b;
    garamondMedItalic = i;
    script = i;
  }

  const yOf = (top: number) => H - top * H;

  // Width including optional letter-tracking
  function widthOf(font: PDFFont, text: string, size: number, tracking = 0) {
    return font.widthOfTextAtSize(text, size) + tracking * (text.length - 1);
  }

  function drawText(
    text: string,
    x: number,
    yTop: number,
    size: number,
    font: PDFFont,
    color = INK,
    align: Align = "left",
    tracking = 0,
  ) {
    const w = widthOf(font, text, size, tracking);
    let startX = x;
    if (align === "center") startX = x - w / 2;
    else if (align === "right") startX = x - w;
    const y = yOf(yTop);
    if (tracking === 0) {
      page.drawText(text, { x: startX, y, size, font, color });
    } else {
      let cx = startX;
      for (const ch of text) {
        page.drawText(ch, { x: cx, y, size, font, color });
        cx += font.widthOfTextAtSize(ch, size) + tracking;
      }
    }
  }

  const centered = (
    text: string,
    cfg: { yTop: number; size: number; color: typeof INK; tracking?: number },
    font: PDFFont,
    centerX = 0.5,
  ) =>
    drawText(
      text,
      centerX * W,
      cfg.yTop,
      cfg.size,
      font,
      cfg.color,
      "center",
      cfg.tracking ?? 0,
    );

  // Word-wrapped, centered paragraph
  function drawParagraph(text: string, cfg: typeof LAYOUT.body, font: PDFFont) {
    const left = cfg.leftFrac * W;
    const maxW = (cfg.rightFrac - cfg.leftFrac) * W;
    const centerX = left + maxW / 2;
    const words = text.split(" ");
    const lines: string[][] = [];
    let cur: string[] = [];
    for (const word of words) {
      const test = [...cur, word].join(" ");
      if (cur.length && font.widthOfTextAtSize(test, cfg.size) > maxW) {
        lines.push(cur);
        cur = [word];
      } else cur.push(word);
    }
    if (cur.length) lines.push(cur);
    lines.forEach((lineWords, i) => {
      const y = yOf(cfg.startYTop + i * cfg.lineHeight);
      const lineText = lineWords.join(" ");
      const textW = font.widthOfTextAtSize(lineText, cfg.size);
      page.drawText(lineText, {
        x: centerX - textW / 2,
        y,
        size: cfg.size,
        font,
        color: cfg.color,
      });
    });
  }

  async function drawSignatureBlock(
    centerXFrac: number,
    sigPng: Uint8Array | undefined,
    name: string,
    title: string,
  ) {
    const s = LAYOUT.sig;
    const cx = centerXFrac * W;
    const halfW = s.ruleHalfW * W;
    if (sigPng) {
      try {
        const img = await pdf.embedPng(sigPng);
        const maxH = s.imgMaxH * H;
        const maxW = halfW * 1.7;
        const scale = Math.min(maxH / img.height, maxW / img.width);
        page.drawImage(img, {
          x: cx - (img.width * scale) / 2,
          y: yOf(s.ruleYTop),
          width: img.width * scale,
          height: img.height * scale,
        });
      } catch {
        /* skip bad image */
      }
    }
    page.drawLine({
      start: { x: cx - halfW, y: yOf(s.ruleYTop) },
      end: { x: cx + halfW, y: yOf(s.ruleYTop) },
      thickness: 0.8,
      color: INK,
    });
    drawText(name, cx, s.nameYTop, s.nameSize, garamond, INK, "center");
    drawText(
      title,
      cx,
      s.titleYTop,
      s.titleSize,
      garamondItalic,
      INK,
      "center",
    );
  }

  // Optional tuning grid
  if (data.debugGrid) {
    const grid = rgb(0.6, 0.7, 0.85);
    for (let i = 1; i < 20; i++) {
      const f = i / 20;
      page.drawLine({
        start: { x: f * W, y: 0 },
        end: { x: f * W, y: H },
        thickness: 0.3,
        color: grid,
        opacity: 0.5,
      });
      page.drawLine({
        start: { x: 0, y: yOf(f) },
        end: { x: W, y: yOf(f) },
        thickness: 0.3,
        color: grid,
        opacity: 0.5,
      });
      drawText(f.toFixed(2), 2, f + 0.008, 5, garamond, grid, "left");
      drawText(f.toFixed(2), f * W + 1, 0.012, 5, garamond, grid, "left");
    }
  }

  // ── Heading ──────────────────────────────────────────────────────────────
  centered("1000 MISSIONARY MOVEMENT BANGLADESH", LAYOUT.orgName, cinzelBold);
  centered("of Seventh-day Adventist Church", LAYOUT.subtitle, garamondBold);
  centered(
    "149 Shah Ali Bagh, Mirpur-1, Dhaka 1216",
    LAYOUT.address,
    garamondItalic,
  );

  // ── Batch + motto ────────────────────────────────────────────────────────
  if (data.batchLabel)
    centered(`${data.batchLabel} BATCH`, LAYOUT.batch, cinzelBold);
  centered(
    "“Once a Missionary, Always a Missionary”",
    LAYOUT.motto,
    garamondMedItalic,
  );

  // ── Presents / to ────────────────────────────────────────────────────────
  centered("Presents this", LAYOUT.presents, garamondItalic);
  centered("CERTIFICATE OF COMPLETION", LAYOUT.certOfCompletion, cinzelBold);
  centered("to", LAYOUT.toWord, garamondItalic);

  // ── Recipient name (script) ──────────────────────────────────────────────
  centered(data.traineeName, LAYOUT.name, script);

  // ── Body paragraph ───────────────────────────────────────────────────────
  drawParagraph(BODY_TEMPLATE(data.programPeriod), LAYOUT.body, garamondItalic);

  // ── Signatures ───────────────────────────────────────────────────────────
  await drawSignatureBlock(
    LAYOUT.directorX,
    data.directorSignaturePng,
    data.directorName,
    data.directorTitle,
  );
  await drawSignatureBlock(
    LAYOUT.presidentX,
    data.presidentSignaturePng,
    data.presidentName,
    data.presidentTitle,
  );

  // ── Date of issue (bottom-left, all left-aligned to one column) ───────────
  const ix = LAYOUT.issueLeftX * W;
  drawText(
    data.issuedAt,
    ix,
    LAYOUT.issueDate.yTop,
    LAYOUT.issueDate.size,
    garamondItalic,
    INK,
    "left",
  );
  page.drawLine({
    start: { x: ix, y: yOf(LAYOUT.issueRuleYTop) },
    end: { x: ix + LAYOUT.issueRuleW * W, y: yOf(LAYOUT.issueRuleYTop) },
    thickness: 0.6,
    color: INK,
  });
  drawText(
    "Date of Issue",
    ix,
    LAYOUT.issueLabel.yTop,
    LAYOUT.issueLabel.size,
    garamondItalic,
    INK,
    "left",
  );

  // ── QR + reference ───────────────────────────────────────────────────────
  const qr = await pdf.embedPng(data.qrPng);
  const qrSize = LAYOUT.qr.size * W;
  page.drawImage(qr, {
    x: LAYOUT.qr.x * W - qrSize / 2,
    y: yOf(LAYOUT.qr.yTop) - qrSize,
    width: qrSize,
    height: qrSize,
  });
  drawText(
    `Ref: ${data.referenceNumber}`,
    LAYOUT.reference.x * W,
    LAYOUT.reference.yTop,
    LAYOUT.reference.size,
    garamond,
    INK,
    "center",
  );

  return pdf.save();
}

/** 1 → "1st", 2 → "2nd", 29 → "29th" */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** "December 1 to 18, 2025" / cross-month / cross-year forms. */
export function formatProgramPeriod(start: Date, end: Date): string {
  const M = (d: Date) => d.toLocaleDateString("en-US", { month: "long" });
  const D = (d: Date) => d.getDate();
  const Y = (d: Date) => d.getFullYear();
  if (Y(start) === Y(end)) {
    if (M(start) === M(end))
      return `${M(start)} ${D(start)} to ${D(end)}, ${Y(end)}`;
    return `${M(start)} ${D(start)} to ${M(end)} ${D(end)}, ${Y(end)}`;
  }
  return `${M(start)} ${D(start)}, ${Y(start)} to ${M(end)} ${D(end)}, ${Y(end)}`;
}

/** "December 18, 2025" */
export function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
