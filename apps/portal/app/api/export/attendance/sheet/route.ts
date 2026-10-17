import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import path from "path";
import { readFileSync } from "fs";

/**
 * Attendance sheet for one programme.
 *
 * Distinct from ../pdf, which lists scan events: a sheet starts from everyone
 * ENROLLED, so the people who did not turn up appear too. A register that
 * cannot show an absence is not a register.
 *
 *   range=week (default)  seven dated columns across one landscape page —
 *                         the way a register is actually kept
 *   range=day             a single date, and in filled mode the time each
 *                         person was scanned
 *
 *   mode=blank            empty boxes to mark by hand
 *   mode=filled           marked from the scans already recorded
 *
 * A week runs for seven days from `date` rather than snapping to a Monday or a
 * Sabbath: whoever prints it picks the day their week starts, which avoids
 * guessing at a convention.
 */

const TEAL = "#0d7a6e";
const RED = "#b91c1c";
const DAYS_IN_WEEK = 7;

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: TEAL,
    paddingBottom: 9,
    marginBottom: 10,
  },
  logo: { width: 36, height: 36 },
  hCenter: { alignItems: "center" },
  title: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#111" },
  subtitle: { fontSize: 9, color: TEAL, marginTop: 2 },
  meta: { fontSize: 7.5, color: "#666", marginTop: 2 },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
    padding: "5 8",
    marginBottom: 7,
    fontSize: 8,
  },
  thead: {
    flexDirection: "row",
    backgroundColor: TEAL,
    padding: "5 6",
    borderRadius: 3,
  },
  thTxt: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 8 },
  thDay: {
    color: "#fff",
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    padding: "4 6",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },
  rowAlt: {
    flexDirection: "row",
    padding: "4 6",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },
  cell: { color: "#374151" },
  cellBold: { fontFamily: "Helvetica-Bold", color: "#111" },
  // An empty square to tick by hand.
  boxWrap: { alignItems: "center" },
  box: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 2,
  },
  mark: { textAlign: "center", fontFamily: "Helvetica-Bold" },
  sigLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#9ca3af",
    height: 11,
    marginRight: 10,
  },
  signoff: { flexDirection: "row", justifyContent: "space-between", marginTop: 22 },
  signoffBox: { width: "45%" },
  signoffRule: { borderTopWidth: 0.5, borderTopColor: "#6b7280", marginBottom: 3 },
  signoffLabel: { fontSize: 7.5, color: "#6b7280" },
  footer: { marginTop: 12, fontSize: 7, color: "#9ca3af", textAlign: "right" },
});

// Day layout: wide name column, then one narrow column per date.
const WEEK_COL = { no: "4%", name: "26%", mission: "8%", day: "8%", total: "6%" };
const DAY_COL = {
  no: "5%",
  name: "30%",
  mission: "10%",
  ref: "19%",
  status: "12%",
  sign: "24%",
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (
    !user ||
    !["SYSTEM_ADMIN", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "LOCAL_DIRECTOR"].includes(
      user.role,
    )
  )
    return new NextResponse("Forbidden", { status: 403 });

  const sp = new URL(req.url).searchParams;
  const programId = sp.get("program");
  const mode = sp.get("mode") === "blank" ? "blank" : "filled";
  const range = sp.get("range") === "day" ? "day" : "week";
  const dateParam = sp.get("date");

  if (!programId) return new NextResponse("program is required", { status: 400 });

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null },
    select: { id: true, code: true, title: true, batch: true },
  });
  if (!program) return new NextResponse("Program not found", { status: 404 });

  const base = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime()))
    return new NextResponse("Invalid date", { status: 400 });

  const rangeStart = startOfDay(base);
  const dayCount = range === "week" ? DAYS_IN_WEEK : 1;
  const rangeEnd = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    rangeStart.getDate() + dayCount,
  );
  const days = Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(
      rangeStart.getFullYear(),
      rangeStart.getMonth(),
      rangeStart.getDate() + i,
    );
    return {
      date: d,
      weekday: d.toLocaleDateString("en-GB", { weekday: "short" }),
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
    };
  });

  // Everyone on the roster — absentees included, which is the point.
  const enrollments = await prisma.programEnrollment.findMany({
    where: { programId: program.id, deletedAt: null, status: "ENROLLED" },
    orderBy: [
      { trainee: { homeMission: { code: "asc" } } },
      { trainee: { fullName: "asc" } },
    ],
    select: {
      id: true,
      trainee: {
        select: { fullName: true, homeMission: { select: { code: true } } },
      },
      application: {
        select: { applicantFullName: true, referenceNumber: true },
      },
    },
  });

  const scans =
    mode === "filled"
      ? await prisma.attendanceScan.findMany({
          where: {
            programId: program.id,
            scannedAt: { gte: rangeStart, lt: rangeEnd },
          },
          select: { enrollmentId: true, scannedAt: true },
        })
      : [];

  // enrollmentId -> set of day keys present, and the time for single-day mode.
  const presentDays = new Map<string, Set<string>>();
  const firstScanAt = new Map<string, Date>();
  for (const s of scans) {
    const d = new Date(s.scannedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!presentDays.has(s.enrollmentId)) presentDays.set(s.enrollmentId, new Set());
    presentDays.get(s.enrollmentId)!.add(key);
    const prev = firstScanAt.get(s.enrollmentId);
    if (!prev || d < prev) firstScanAt.set(s.enrollmentId, d);
  }

  const rows = enrollments.map((e, i) => {
    const present = presentDays.get(e.id) ?? new Set<string>();
    return {
      no: i + 1,
      // Same identity rule as the ID card: the reviewed name.
      name: e.application?.applicantFullName ?? e.trainee.fullName,
      mission: e.trainee.homeMission?.code ?? "—",
      reference: e.application?.referenceNumber ?? e.id.slice(-8).toUpperCase(),
      present,
      total: present.size,
      scannedAt: firstScanAt.get(e.id) ?? null,
    };
  });

  let logoSrc: string | undefined;
  let sdaSrc: string | undefined;
  try {
    logoSrc = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "1000mm-logo.png")).toString("base64")}`;
    sdaSrc = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "sda-logo.png")).toString("base64")}`;
  } catch {}

  const fmtLong = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const rangeLabel =
    range === "week"
      ? `${fmtLong(days[0].date)} — ${fmtLong(days[days.length - 1].date)}`
      : rangeStart.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // ── Table head ─────────────────────────────────────────────────────────────
  const headCells =
    range === "week"
      ? [
          createElement(Text, { key: "no", style: { ...styles.thTxt, width: WEEK_COL.no } }, "#"),
          createElement(Text, { key: "name", style: { ...styles.thTxt, width: WEEK_COL.name } }, "Name"),
          createElement(Text, { key: "mi", style: { ...styles.thTxt, width: WEEK_COL.mission } }, "Mission"),
          ...days.map((d) =>
            createElement(
              View,
              { key: d.key, style: { width: WEEK_COL.day } },
              createElement(Text, { style: styles.thDay }, d.weekday),
              createElement(Text, { style: { ...styles.thDay, fontSize: 6.5 } }, d.label),
            ),
          ),
          ...(mode === "filled"
            ? [
                createElement(
                  Text,
                  { key: "tot", style: { ...styles.thTxt, width: WEEK_COL.total, textAlign: "center" } },
                  "Tot",
                ),
              ]
            : []),
        ]
      : [
          createElement(Text, { key: "no", style: { ...styles.thTxt, width: DAY_COL.no } }, "#"),
          createElement(Text, { key: "name", style: { ...styles.thTxt, width: DAY_COL.name } }, "Name"),
          createElement(Text, { key: "mi", style: { ...styles.thTxt, width: DAY_COL.mission } }, "Mission"),
          createElement(Text, { key: "ref", style: { ...styles.thTxt, width: DAY_COL.ref } }, "ID"),
          createElement(
            Text,
            { key: "st", style: { ...styles.thTxt, width: DAY_COL.status } },
            mode === "blank" ? "Present" : "Status",
          ),
          createElement(
            Text,
            { key: "sg", style: { ...styles.thTxt, width: DAY_COL.sign } },
            mode === "blank" ? "Signature" : "Time",
          ),
        ];

  // ── Rows ───────────────────────────────────────────────────────────────────
  const bodyRows = rows.map((r, i) => {
    const rowStyle = i % 2 === 0 ? styles.row : styles.rowAlt;
    if (range === "week") {
      return createElement(
        View,
        { key: r.reference + i, style: rowStyle },
        createElement(Text, { style: { ...styles.cell, width: WEEK_COL.no, color: "#9ca3af" } }, String(r.no)),
        createElement(Text, { style: { ...styles.cellBold, width: WEEK_COL.name, fontSize: 8 } }, r.name),
        createElement(
          Text,
          { style: { ...styles.cell, width: WEEK_COL.mission, color: "#7c3aed", fontFamily: "Helvetica-Bold", fontSize: 7.5 } },
          r.mission,
        ),
        ...days.map((d) =>
          mode === "blank"
            ? createElement(
                View,
                { key: d.key, style: { ...styles.boxWrap, width: WEEK_COL.day } },
                createElement(View, { style: styles.box }),
              )
            : createElement(
                Text,
                {
                  key: d.key,
                  style: {
                    ...styles.mark,
                    width: WEEK_COL.day,
                    color: r.present.has(d.key) ? TEAL : "#d1d5db",
                  },
                },
                r.present.has(d.key) ? "P" : "·",
              ),
        ),
        ...(mode === "filled"
          ? [
              createElement(
                Text,
                {
                  key: "tot",
                  style: {
                    ...styles.mark,
                    width: WEEK_COL.total,
                    color: r.total === 0 ? RED : "#374151",
                  },
                },
                String(r.total),
              ),
            ]
          : []),
      );
    }
    return createElement(
      View,
      { key: r.reference + i, style: rowStyle },
      createElement(Text, { style: { ...styles.cell, width: DAY_COL.no, color: "#9ca3af" } }, String(r.no)),
      createElement(Text, { style: { ...styles.cellBold, width: DAY_COL.name } }, r.name),
      createElement(
        Text,
        { style: { ...styles.cell, width: DAY_COL.mission, color: "#7c3aed", fontFamily: "Helvetica-Bold" } },
        r.mission,
      ),
      createElement(
        Text,
        { style: { ...styles.cell, width: DAY_COL.ref, fontSize: 7.5, color: "#6b7280" } },
        r.reference,
      ),
      mode === "blank"
        ? createElement(View, { style: { width: DAY_COL.status } }, createElement(View, { style: styles.box }))
        : createElement(
            Text,
            {
              style: {
                ...styles.cell,
                width: DAY_COL.status,
                fontFamily: "Helvetica-Bold",
                color: r.scannedAt ? TEAL : RED,
              },
            },
            r.scannedAt ? "Present" : "Absent",
          ),
      mode === "blank"
        ? createElement(View, { style: { width: DAY_COL.sign } }, createElement(View, { style: styles.sigLine }))
        : createElement(
            Text,
            { style: { ...styles.cell, width: DAY_COL.sign } },
            r.scannedAt
              ? new Date(r.scannedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
              : "—",
          ),
    );
  });

  const summaryRight =
    mode === "blank"
      ? createElement(Text, { style: { color: "#6b7280" } }, "To be completed by hand")
      : range === "week"
        ? createElement(
            Text,
            {},
            `Attendances recorded: ${rows.reduce((n, r) => n + r.total, 0)} · Never present: ${rows.filter((r) => r.total === 0).length}`,
          )
        : createElement(
            Text,
            {},
            `Present: ${rows.filter((r) => r.scannedAt).length}    Absent: ${rows.filter((r) => !r.scannedAt).length}`,
          );

  const doc = createElement(
    Document,
    {},
    createElement(
      Page,
      // Seven dated columns plus a name need the long edge.
      { size: "A4", orientation: range === "week" ? "landscape" : "portrait", style: styles.page },
      createElement(
        View,
        { style: styles.header },
        logoSrc ? createElement(Image, { src: logoSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
        createElement(
          View,
          { style: styles.hCenter },
          createElement(Text, { style: styles.title }, "1000 Missionary Movement Bangladesh"),
          createElement(
            Text,
            { style: styles.subtitle },
            mode === "blank" ? "Attendance Sheet" : "Attendance Register",
          ),
          createElement(
            Text,
            { style: styles.meta },
            `${program.code} — ${program.title}${program.batch ? ` · Batch ${program.batch}` : ""}`,
          ),
          createElement(Text, { style: styles.meta }, rangeLabel),
        ),
        sdaSrc ? createElement(Image, { src: sdaSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
      ),

      createElement(
        View,
        { style: styles.summary },
        createElement(Text, {}, `Enrolled: ${rows.length}`),
        summaryRight,
      ),

      createElement(
        View,
        // `fixed` repeats the header on every page — a roster that runs past
        // one page is otherwise a column of unlabelled values.
        { style: styles.thead, fixed: true },
        ...headCells,
      ),

      ...bodyRows,

      ...(rows.length === 0
        ? [
            createElement(
              Text,
              {
                key: "empty",
                style: { ...styles.cell, marginTop: 14, textAlign: "center", color: "#9ca3af" },
              },
              "No trainees are enrolled on this program.",
            ),
          ]
        : []),

      createElement(
        View,
        { style: styles.signoff },
        createElement(
          View,
          { style: styles.signoffBox },
          createElement(View, { style: styles.signoffRule }),
          createElement(Text, { style: styles.signoffLabel }, "Taken by (name & signature)"),
        ),
        createElement(
          View,
          { style: styles.signoffBox },
          createElement(View, { style: styles.signoffRule }),
          createElement(Text, { style: styles.signoffLabel }, "Director / Coordinator"),
        ),
      ),

      createElement(
        Text,
        { style: styles.footer },
        `${program.code} · ${rangeLabel} · generated by ${user.fullName} · ${generatedAt}`,
      ),
    ),
  );

  const buffer = await renderToBuffer(doc as any);
  const slug = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const filename = `attendance-${mode}-${range}-${program.code}-${slug(rangeStart)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
