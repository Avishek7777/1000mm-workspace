import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import path from "path";
import { readFileSync } from "fs";

const TEAL = "#0d7a6e";
const ALLOWED_ROLES = ["MAIN_DIRECTOR", "SYSTEM_ADMIN", "LOCAL_DIRECTOR", "TRAINER"] as const;

const styles = StyleSheet.create({
  page:     { padding: 26, fontSize: 7.5, fontFamily: "Helvetica", color: "#1a1a1a" },
  header:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: TEAL, paddingBottom: 10, marginBottom: 14 },
  logo:     { width: 36, height: 36 },
  hCenter:  { alignItems: "center" },
  title:    { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111" },
  subtitle: { fontSize: 8, color: TEAL, marginTop: 2 },
  meta:     { fontSize: 7, color: "#666", marginTop: 2 },
  thead:    { flexDirection: "row", backgroundColor: TEAL, padding: "4 6", borderRadius: 3 },
  thText:   { color: "#fff", fontFamily: "Helvetica-Bold", flex: 1 },
  thCenter: { color: "#fff", fontFamily: "Helvetica-Bold", flex: 1, textAlign: "center" },
  row:      { flexDirection: "row", padding: "3 6", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  rowAlt:   { flexDirection: "row", padding: "3 6", backgroundColor: "#f9fafb", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  cell:     { flex: 1, color: "#374151" },
  cellBold: { flex: 1, fontFamily: "Helvetica-Bold", color: "#111" },
  cellCtr:  { flex: 1, color: "#374151", textAlign: "center" },
  tfoot:    { flexDirection: "row", backgroundColor: "#e5e7eb", padding: "4 6", marginTop: 1 },
  tfCell:   { flex: 1, fontFamily: "Helvetica-Bold", color: "#111" },
  footer:   { marginTop: 14, fontSize: 7, color: "#9ca3af", textAlign: "right" },
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, fullName: true, homeMissionId: true },
  });
  if (!user || !ALLOWED_ROLES.includes(user.role as typeof ALLOWED_ROLES[number]))
    return new NextResponse("Forbidden", { status: 403 });

  const isStaff = ["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role);

  const lmdMission = !isStaff
    ? await prisma.localMission.findFirst({ where: { directorId: user.id } })
    : null;

  const { searchParams } = new URL(req.url);
  const programParam = searchParams.get("program") ?? undefined;
  const missionParam = searchParams.get("mission") ?? undefined;
  const genderParam  = searchParams.get("gender")  ?? undefined;
  const qParam       = searchParams.get("q")       ?? undefined;

  const enrollments = await prisma.programEnrollment.findMany({
    where: {
      deletedAt: null,
      status: "ENROLLED",
      ...(programParam ? { programId: programParam } : {}),
      ...(genderParam ? { application: { applicantGender: genderParam as "MALE" | "FEMALE" } } : {}),
      trainee: {
        ...(!isStaff ? { homeMissionId: lmdMission?.id ?? user.homeMissionId } : {}),
        ...(isStaff && missionParam ? { homeMission: { code: missionParam } } : {}),
        ...(qParam ? { fullName: { contains: qParam, mode: "insensitive" as const } } : {}),
      },
    },
    include: {
      trainee: {
        select: {
          id: true,
          fullName: true,
          homeMission: { select: { code: true } },
        },
      },
      program: { select: { code: true } },
      application: { select: { referenceNumber: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Report counts
  const traineeIds = enrollments.map((e) => e.traineeId);
  const reportCounts = await prisma.fieldReport.groupBy({
    by: ["traineeId"],
    where: { traineeId: { in: traineeIds } },
    _count: true,
  });
  const reportCountMap = new Map(reportCounts.map((r) => [r.traineeId, r._count]));

  let logoSrc: string | undefined;
  let sdaSrc: string | undefined;
  try {
    const logoBuf = readFileSync(path.join(process.cwd(), "public", "logos", "1000mm-logo.png"));
    logoSrc = `data:image/png;base64,${logoBuf.toString("base64")}`;
    const sdaBuf  = readFileSync(path.join(process.cwd(), "public", "logos", "sda-logo.png"));
    sdaSrc  = `data:image/png;base64,${sdaBuf.toString("base64")}`;
  } catch {}

  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const filterParts = [
    programParam ?? null,
    missionParam ?? (!isStaff && lmdMission ? lmdMission.name : null),
    genderParam === "MALE" ? "Male" : genderParam === "FEMALE" ? "Female" : null,
    qParam ? `"${qParam}"` : null,
  ].filter(Boolean);
  const filterLabel = filterParts.length ? filterParts.join(" · ") : "All trainees";

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const doc = createElement(
    Document,
    {},
    createElement(
      Page,
      { size: "A4", orientation: "landscape", style: styles.page },
      // Header
      createElement(View, { style: styles.header },
        logoSrc ? createElement(Image, { src: logoSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
        createElement(View, { style: styles.hCenter },
          createElement(Text, { style: styles.title }, "1000 Missionary Movement Bangladesh"),
          createElement(Text, { style: styles.subtitle }, "Trainees Roster"),
          createElement(Text, { style: styles.meta }, filterLabel),
          createElement(Text, { style: styles.meta }, `Generated: ${generatedAt}`),
        ),
        sdaSrc ? createElement(Image, { src: sdaSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
      ),
      // Table head
      createElement(View, { style: styles.thead },
        createElement(Text, { style: { ...styles.thText, flex: 0.35 } }, "#"),
        createElement(Text, { style: { ...styles.thText, flex: 2.5 } }, "Name"),
        createElement(Text, { style: { ...styles.thText, flex: 1.2 } }, "Ref No"),
        ...(isStaff ? [createElement(Text, { style: { ...styles.thText, flex: 0.7 } }, "Mission")] : []),
        createElement(Text, { style: { ...styles.thText, flex: 0.8 } }, "Program"),
        createElement(Text, { style: { ...styles.thText, flex: 1.2 } }, "Enrolled"),
        createElement(Text, { style: { ...styles.thText, flex: 1.5 } }, "Deployment"),
        createElement(Text, { style: { ...styles.thCenter, flex: 0.7 } }, "Reports"),
        createElement(Text, { style: { ...styles.thCenter, flex: 0.8 } }, "Attend."),
        createElement(Text, { style: { ...styles.thCenter, flex: 0.8 } }, "Cert."),
      ),
      // Rows
      ...enrollments.map((e, i) => {
        const rowStyle = i % 2 === 0 ? styles.row : styles.rowAlt;
        const reports = reportCountMap.get(e.traineeId) ?? 0;
        return createElement(View, { key: e.id, style: rowStyle },
          createElement(Text, { style: { ...styles.cell, flex: 0.35 } }, String(i + 1)),
          createElement(Text, { style: { ...styles.cellBold, flex: 2.5 } }, e.trainee.fullName),
          createElement(Text, { style: { ...styles.cell, flex: 1.2 } }, e.application?.referenceNumber ?? "—"),
          ...(isStaff ? [createElement(Text, { style: { ...styles.cell, flex: 0.7 } }, e.trainee.homeMission?.code ?? "—")] : []),
          createElement(Text, { style: { ...styles.cell, flex: 0.8 } }, e.program.code),
          createElement(Text, { style: { ...styles.cell, flex: 1.2 } }, fmt(e.enrolledAt)),
          createElement(Text, { style: { ...styles.cell, flex: 1.5 } }, e.deploymentLocation ?? "—"),
          createElement(Text, { style: { ...styles.cellCtr, flex: 0.7 } }, String(reports)),
          createElement(Text, { style: { ...styles.cellCtr, flex: 0.8 } }, e.attendanceConfirmed ? "Yes" : "No"),
          createElement(Text, { style: { ...styles.cellCtr, flex: 0.8 } }, e.certificateIssued ? "Yes" : "No"),
        );
      }),
      // Footer
      createElement(View, { style: styles.tfoot },
        createElement(Text, { style: { ...styles.tfCell, flex: 0.35 } }, ""),
        createElement(Text, { style: { ...styles.tfCell, flex: 10.65 } }, `Total: ${enrollments.length} Trainee${enrollments.length !== 1 ? "s" : ""}`),
      ),
      createElement(Text, { style: styles.footer }, `Generated: ${generatedAt} · ${user.fullName}`),
    ),
  );

  const buffer = await renderToBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="trainees-roster.pdf"`,
    },
  });
}
