import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import * as XLSX from "xlsx";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, fullName: true },
  });
  if (!user || user.role !== "LOCAL_DIRECTOR")
    return new NextResponse("Forbidden", { status: 403 });

  const lmdMission = await prisma.localMission.findFirst({
    where: { directorId: user.id },
    select: { id: true, name: true, code: true },
  });
  if (!lmdMission) return new NextResponse("Mission not found", { status: 404 });

  const { searchParams } = new URL(req.url);
  const yearParam      = searchParams.get("year")      ?? undefined;
  const monthParam     = searchParams.get("month")     ?? undefined;
  const genderParam    = searchParams.get("gender")    ?? undefined;
  const districtParam  = searchParams.get("district")  ?? undefined;
  const programIdParam = searchParams.get("programId") ?? undefined;

  const yearNum  = yearParam  ? parseInt(yearParam,  10) : undefined;
  const monthNum = monthParam ? parseInt(monthParam, 10) : undefined;

  let startDateFilter: { gte: Date; lt: Date } | undefined;
  if (yearNum && monthNum) {
    startDateFilter = { gte: new Date(yearNum, monthNum - 1, 1), lt: new Date(yearNum, monthNum, 1) };
  } else if (yearNum) {
    startDateFilter = { gte: new Date(yearNum, 0, 1), lt: new Date(yearNum + 1, 0, 1) };
  } else if (monthNum) {
    const cy = new Date().getFullYear();
    startDateFilter = { gte: new Date(cy, monthNum - 1, 1), lt: new Date(cy, monthNum, 1) };
  }

  const deployments = await prisma.missionaryDeployment.findMany({
    where: {
      deletedAt: null,
      missionary: {
        homeMissionId: lmdMission.id,
        ...((genderParam || districtParam) ? {
          applications: {
            some: {
              status: "ACCEPTED",
              ...(genderParam === "MALE" || genderParam === "FEMALE" ? { applicantGender: genderParam } : {}),
              ...(districtParam ? { presentAddressDistrict: districtParam } : {}),
            },
          },
        } : {}),
        ...(programIdParam ? {
          enrollmentsAsTrainee: { some: { programId: programIdParam, deletedAt: null } },
        } : {}),
      },
      ...(startDateFilter ? { startDate: startDateFilter } : {}),
    },
    orderBy: { startDate: "desc" },
    include: {
      missionary: {
        select: {
          fullName: true,
          fullNameBangla: true,
          phone: true,
          email: true,
          applications: {
            where: { status: "ACCEPTED" },
            select: { applicantGender: true, presentAddressDistrict: true, referenceNumber: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          enrollmentsAsTrainee: {
            where: { deletedAt: null },
            select: { program: { select: { code: true, title: true } } },
            orderBy: { enrolledAt: "desc" },
            take: 1,
          },
        },
      },
      mission: { select: { code: true, name: true } },
    },
  });

  const fmt = (d: Date) => new Date(d).toLocaleDateString("en-GB");

  const rows = deployments.map((d, i) => {
    const app  = d.missionary.applications[0];
    return {
      "#":              i + 1,
      "Name (English)": d.missionary.fullName,
      "Name (Bangla)":  d.missionary.fullNameBangla ?? "",
      "Reference No":   app?.referenceNumber ?? "",
      "Program":        d.missionary.enrollmentsAsTrainee[0]?.program?.code ?? "",
      "Program Title":  d.missionary.enrollmentsAsTrainee[0]?.program?.title ?? "",
      "Deployed To":    d.mission.code,
      "Mission Name":   d.mission.name,
      "Start Date":     fmt(d.startDate),
      "End Date":       d.endDate ? fmt(d.endDate) : "",
      "Status":         d.status,
      "Location":       d.location ?? "",
      "Gender":         app?.applicantGender === "MALE" ? "Male" : app?.applicantGender === "FEMALE" ? "Female" : "",
      "District":       app?.presentAddressDistrict ?? "",
      "Phone":          d.missionary.phone ?? "",
      "Email":          d.missionary.email ?? "",
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)) + 2,
  }));
  ws["!cols"] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, "Deployed Missionaries");

  const filterLabel = [
    lmdMission.name,
    yearNum  ? String(yearNum)                        : null,
    monthNum ? MONTHS[monthNum - 1]                   : null,
    genderParam === "MALE" ? "Male" : genderParam === "FEMALE" ? "Female" : null,
    districtParam ?? null,
  ].filter(Boolean).join(" · ");

  const summaryRows = [
    { Summary: "1000 Missionary Movement Bangladesh", Value: "" },
    { Summary: "Mission",      Value: lmdMission.name },
    { Summary: "Filter",       Value: filterLabel },
    { Summary: "",             Value: "" },
    { Summary: "Total",        Value: deployments.length },
    { Summary: "Active",       Value: deployments.filter((d) => d.status === "ACTIVE").length },
    { Summary: "Completed",    Value: deployments.filter((d) => d.status === "COMPLETED").length },
    { Summary: "Pending",      Value: deployments.filter((d) => d.status === "PENDING").length },
    { Summary: "",             Value: "" },
    { Summary: "Male",         Value: deployments.filter((d) => d.missionary.applications[0]?.applicantGender === "MALE").length },
    { Summary: "Female",       Value: deployments.filter((d) => d.missionary.applications[0]?.applicantGender === "FEMALE").length },
    { Summary: "",             Value: "" },
    { Summary: "Generated At", Value: new Date().toLocaleString("en-GB") },
    { Summary: "Generated By", Value: user.fullName },
  ];
  const ws2 = XLSX.utils.json_to_sheet(summaryRows);
  ws2["!cols"] = [{ wch: 30 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="deployed-missionaries.xlsx"`,
    },
  });
}
