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
 * Attendance sheet for one programme on one day.
 *
 * Distinct from ../pdf, which lists scan events: a sheet lists everyone
 * ENROLLED, so the people who did not turn up appear too. A register that
 * cannot show an absence is not a register.
 *
 *   mode=blank   roster with empty tick boxes and a signature column, for
 *                taking attendance on paper
 *   mode=filled  the same roster marked Present/Absent from the day's scans
 */

const TEAL = "#0d7a6e";
const RED = "#b91c1c";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: TEAL,
    paddingBottom: 10,
    marginBottom: 12,
  },
  logo: { width: 38, height: 38 },
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
    marginBottom: 8,
    fontSize: 8,
  },
  thead: {
    flexDirection: "row",
    backgroundColor: TEAL,
    padding: "5 6",
    borderRadius: 3,
  },
  thTxt: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 8 },
  row: {
    flexDirection: "row",
    padding: "5 6",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },
  rowAlt: {
    flexDirection: "row",
    padding: "5 6",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },
  cell: { color: "#374151" },
  cellBold: { fontFamily: "Helvetica-Bold", color: "#111" },
  // An empty square to tick, and a rule to sign on.
  box: { width: 11, height: 11, borderWidth: 1, borderColor: "#9ca3af", borderRadius: 2 },
  sigLine: { borderBottomWidth: 0.5, borderBottomColor: "#9ca3af", height: 11, marginRight: 10 },
  signoff: { flexDirection: "row", justifyContent: "space-between", marginTop: 26 },
  signoffBox: { width: "45%" },
  signoffRule: { borderTopWidth: 0.5, borderTopColor: "#6b7280", marginBottom: 3 },
  signoffLabel: { fontSize: 7.5, color: "#6b7280" },
  footer: { marginTop: 14, fontSize: 7, color: "#9ca3af", textAlign: "right" },
});

const COL = {
  no: "5%",
  name: "30%",
  mission: "10%",
  ref: "19%",
  status: "12%",
  sign: "24%",
};

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
  const dateParam = sp.get("date");

  if (!programId)
    return new NextResponse("program is required", { status: 400 });

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null },
    select: { id: true, code: true, title: true, batch: true },
  });
  if (!program) return new NextResponse("Program not found", { status: 404 });

  // Local calendar day, matching how scans are deduplicated.
  const base = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime()))
    return new NextResponse("Invalid date", { status: 400 });
  const dayStart = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const dayEnd = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);

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
            scannedAt: { gte: dayStart, lt: dayEnd },
          },
          select: { enrollmentId: true, scannedAt: true },
        })
      : [];
  const scanByEnrollment = new Map(scans.map((s) => [s.enrollmentId, s.scannedAt]));

  const rows = enrollments.map((e, i) => ({
    no: i + 1,
    // Same identity rule as the ID card: the reviewed name.
    name: e.application?.applicantFullName ?? e.trainee.fullName,
    mission: e.trainee.homeMission?.code ?? "—",
    reference: e.application?.referenceNumber ?? e.id.slice(-8).toUpperCase(),
    scannedAt: scanByEnrollment.get(e.id) ?? null,
  }));

  const presentCount = rows.filter((r) => r.scannedAt).length;

  let logoSrc: string | undefined;
  let sdaSrc: string | undefined;
  try {
    logoSrc = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "1000mm-logo.png")).toString("base64")}`;
    sdaSrc = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "sda-logo.png")).toString("base64")}`;
  } catch {}

  const dayLabel = dayStart.toLocaleDateString("en-GB", {
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

  const headerCells =
    mode === "blank"
      ? [
          ["#", COL.no],
          ["Name", COL.name],
          ["Mission", COL.mission],
          ["ID", COL.ref],
          ["Present", COL.status],
          ["Signature", COL.sign],
        ]
      : [
          ["#", COL.no],
          ["Name", COL.name],
          ["Mission", COL.mission],
          ["ID", COL.ref],
          ["Status", COL.status],
          ["Time", COL.sign],
        ];

  const doc = createElement(
    Document,
    {},
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(
        View,
        { style: styles.header },
        logoSrc
          ? createElement(Image, { src: logoSrc, style: styles.logo })
          : createElement(View, { style: styles.logo }),
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
          createElement(Text, { style: styles.meta }, dayLabel),
        ),
        sdaSrc
          ? createElement(Image, { src: sdaSrc, style: styles.logo })
          : createElement(View, { style: styles.logo }),
      ),

      createElement(
        View,
        { style: styles.summary },
        createElement(
          Text,
          {},
          `Enrolled: ${rows.length}`,
        ),
        mode === "filled"
          ? createElement(
              Text,
              {},
              `Present: ${presentCount}    Absent: ${rows.length - presentCount}`,
            )
          : createElement(Text, { style: { color: "#6b7280" } }, "To be completed by hand"),
      ),

      createElement(
        View,
        // `fixed` repeats the header on every page — a roster that runs past
        // one page is otherwise a column of unlabelled values.
        { style: styles.thead, fixed: true },
        ...headerCells.map(([label, width]) =>
          createElement(Text, { key: label, style: { ...styles.thTxt, width } }, label),
        ),
      ),

      ...rows.map((r, i) =>
        createElement(
          View,
          { key: r.reference + i, style: i % 2 === 0 ? styles.row : styles.rowAlt },
          createElement(
            Text,
            { style: { ...styles.cell, width: COL.no, color: "#9ca3af" } },
            String(r.no),
          ),
          createElement(Text, { style: { ...styles.cellBold, width: COL.name } }, r.name),
          createElement(
            Text,
            {
              style: {
                ...styles.cell,
                width: COL.mission,
                color: "#7c3aed",
                fontFamily: "Helvetica-Bold",
              },
            },
            r.mission,
          ),
          createElement(
            Text,
            { style: { ...styles.cell, width: COL.ref, fontSize: 7.5, color: "#6b7280" } },
            r.reference,
          ),
          mode === "blank"
            ? createElement(
                View,
                { style: { width: COL.status } },
                createElement(View, { style: styles.box }),
              )
            : createElement(
                Text,
                {
                  style: {
                    ...styles.cell,
                    width: COL.status,
                    fontFamily: "Helvetica-Bold",
                    color: r.scannedAt ? TEAL : RED,
                  },
                },
                r.scannedAt ? "Present" : "Absent",
              ),
          mode === "blank"
            ? createElement(
                View,
                { style: { width: COL.sign } },
                createElement(View, { style: styles.sigLine }),
              )
            : createElement(
                Text,
                { style: { ...styles.cell, width: COL.sign } },
                r.scannedAt
                  ? new Date(r.scannedAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—",
              ),
        ),
      ),

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
        `${program.code} · ${dayLabel} · generated by ${user.fullName} · ${generatedAt}`,
      ),
    ),
  );

  const buffer = await renderToBuffer(doc as any);
  const dateSlug = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, "0")}-${String(dayStart.getDate()).padStart(2, "0")}`;
  const filename = `attendance-${mode}-${program.code}-${dateSlug}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
