"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { TrainingCategory, ApplicationWindowState } from "@1000mm/db";
import { headers } from "next/headers";
import { isSettingEnabled, SETTINGS } from "@/lib/settings";

export type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  programId?: string;
};

const MAX_ACTIVE_PROGRAMS = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireDirector() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }
  if (user.role === "MAIN_DIRECTOR") {
    const allowed = await isSettingEnabled(SETTINGS.UD_CAN_MANAGE_PROGRAMS);
    if (!allowed) redirect("/dashboard/director");
  }
  return user;
}

async function getClientIp() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

// ─── CREATE PROGRAM ───────────────────────────────────────────────────────────

// Helper: treat empty string as undefined for optional string fields
const optionalStr = (max = 1000) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || undefined)
    .optional();

const programSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(20)
      .regex(
        /^[A-Z0-9-]+$/,
        "Code must be uppercase letters, numbers, and hyphens only.",
      ),
    title: z.string().trim().min(3, "Title is required.").max(120),
    titleBangla: optionalStr(120),
    category: z.nativeEnum(TrainingCategory, {
      errorMap: () => ({ message: "Please select a category." }),
    }),
    summary: optionalStr(1000),
    summaryBangla: optionalStr(1000),
    startDate: z
      .string()
      .min(1, "Start date is required.")
      .refine((v) => !isNaN(Date.parse(v)), "Invalid start date."),
    endDate: z
      .string()
      .min(1, "End date is required.")
      .refine((v) => !isNaN(Date.parse(v)), "Invalid end date."),
    location: optionalStr(120),
    locationBangla: optionalStr(120),
    targetIntake: z.coerce
      .number({ invalid_type_error: "Target intake is required." })
      .int()
      .min(1, "Must be at least 1.")
      .max(10000),
    // Empty string from form → undefined, otherwise parse as int
    maxIntake: z.preprocess(
      (v) =>
        v === "" || v === undefined || v === null ? undefined : Number(v),
      z.number().int().min(1).max(10000).optional(),
    ),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    path: ["endDate"],
    message: "End date must be after start date.",
  });

export async function createProgramAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireDirector();

  const raw = Object.fromEntries(formData.entries());

  const schemaWithIsMain = programSchema.and(
    z.object({
      isMain: z.preprocess((v) => v === "on", z.boolean()).optional(),
    }),
  );

  const parsed = schemaWithIsMain.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const d = parsed.data;

  const existing = await prisma.trainingProgram.findUnique({
    where: { code: d.code },
  });
  if (existing) {
    return {
      ok: false,
      fieldErrors: { code: "A program with this code already exists." },
    };
  }

  const program = await prisma.trainingProgram.create({
    data: {
      code: d.code,
      title: d.title,
      titleBangla: d.titleBangla || null,
      category: d.category,
      summary: d.summary || null,
      summaryBangla: d.summaryBangla || null,
      isMain: d.isMain ?? false,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      location: d.location || null,
      locationBangla: d.locationBangla || null,
      targetIntake: d.targetIntake,
      maxIntake: d.maxIntake || null,
      isPublished: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "WINDOW_CREATED",
      actorId: user.id,
      actorRole: user.role,
      targetType: "TrainingProgram",
      targetId: program.id,
      ipAddress: await getClientIp(),
      details: { code: program.code, title: program.title },
    },
  });

  if (d.isMain) {
    await prisma.user.updateMany({
      where: { isMissionary: true },
      data: { isMissionary: false },
    });
  }

  revalidatePath("/dashboard/director/programs");
  return { ok: true, programId: program.id };
}

// ─── EDIT PROGRAM ─────────────────────────────────────────────────────────────

export async function editProgramAction(
  programId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireDirector();

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null },
  });
  if (!program) return { ok: false, error: "Program not found." };

  const raw = Object.fromEntries(formData.entries());
  // Code is not editable after creation
  const parsed = programSchema.omit({ code: true }).safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const d = parsed.data;

  await prisma.trainingProgram.update({
    where: { id: programId },
    data: {
      title: d.title,
      titleBangla: d.titleBangla || null,
      category: d.category,
      summary: d.summary || null,
      summaryBangla: d.summaryBangla || null,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      location: d.location || null,
      locationBangla: d.locationBangla || null,
      targetIntake: d.targetIntake,
      maxIntake: d.maxIntake || null,
    },
  });

  revalidatePath(`/dashboard/director/programs/${programId}`);
  revalidatePath("/dashboard/director/programs");
  return { ok: true, programId };
}

// ─── PUBLISH / UNPUBLISH ──────────────────────────────────────────────────────

export async function publishProgramAction(
  programId: string,
): Promise<ActionResult> {
  const user = await requireDirector();

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null },
  });
  if (!program) return { ok: false, error: "Program not found." };
  if (program.isPublished) return { ok: true }; // already published

  // Enforce max 5 active programs
  const activeCount = await prisma.trainingProgram.count({
    where: { isPublished: true, deletedAt: null },
  });
  if (activeCount >= MAX_ACTIVE_PROGRAMS) {
    return {
      ok: false,
      error: `Maximum of ${MAX_ACTIVE_PROGRAMS} active programs allowed. Please unpublish another program first.`,
    };
  }

  await prisma.trainingProgram.update({
    where: { id: programId },
    data: { isPublished: true },
  });

  revalidatePath(`/dashboard/director/programs/${programId}`);
  revalidatePath("/dashboard/director/programs");
  revalidatePath("/dashboard/director");
  return { ok: true };
}

export async function unpublishProgramAction(
  programId: string,
): Promise<ActionResult> {
  await requireDirector();

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null },
  });
  if (!program) return { ok: false, error: "Program not found." };

  // Cannot unpublish if there's an OPEN window
  const openWindow = await prisma.applicationWindow.findFirst({
    where: { programId, state: "OPEN", deletedAt: null },
  });
  if (openWindow) {
    return {
      ok: false,
      error: "Close the application window before unpublishing.",
    };
  }

  await prisma.trainingProgram.update({
    where: { id: programId },
    data: { isPublished: false },
  });

  revalidatePath(`/dashboard/director/programs/${programId}`);
  revalidatePath("/dashboard/director/programs");
  return { ok: true };
}

// ─── ARCHIVE (soft delete) ────────────────────────────────────────────────────

export async function archiveProgramAction(
  programId: string,
): Promise<ActionResult> {
  const user = await requireDirector();

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null },
  });
  if (!program) return { ok: false, error: "Program not found." };

  const openWindow = await prisma.applicationWindow.findFirst({
    where: { programId, state: "OPEN", deletedAt: null },
  });
  if (openWindow) {
    return {
      ok: false,
      error: "Close the application window before archiving.",
    };
  }

  await prisma.trainingProgram.update({
    where: { id: programId },
    data: { isPublished: false, deletedAt: new Date() },
  });

  revalidatePath("/dashboard/director/programs");
  return { ok: true };
}

// ─── CREATE APPLICATION WINDOW ────────────────────────────────────────────────

const windowSchema = z
  .object({
    scopedToMissionId: z.string().optional(),
    advertisingStartDate: z
      .string()
      .refine((v) => !isNaN(Date.parse(v)), "Invalid date."),
    applicationOpenDate: z
      .string()
      .refine((v) => !isNaN(Date.parse(v)), "Invalid date."),
    applicationCloseDate: z
      .string()
      .refine((v) => !isNaN(Date.parse(v)), "Invalid date."),
    trainingStartDate: z
      .string()
      .refine((v) => !isNaN(Date.parse(v)), "Invalid date."),
    targetIntake: z.coerce.number().int().min(1),
    notes: z.string().trim().max(500).optional(),
  })
  .refine(
    (d) => new Date(d.applicationCloseDate) > new Date(d.applicationOpenDate),
    {
      path: ["applicationCloseDate"],
      message: "Close date must be after open date.",
    },
  );

export async function createWindowAction(
  programId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireDirector();
  if (user.role === "MAIN_DIRECTOR") {
    const allowed = await isSettingEnabled(SETTINGS.UD_CAN_MANAGE_WINDOWS);
    if (!allowed) return { ok: false, error: "Not permitted." };
  }

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null },
  });
  if (!program) return { ok: false, error: "Program not found." };

  // Only one non-archived window per program
  const existingWindow = await prisma.applicationWindow.findFirst({
    where: {
      programId,
      state: { notIn: ["ARCHIVED"] },
      deletedAt: null,
    },
  });
  if (existingWindow) {
    return {
      ok: false,
      error: "This program already has an active window. Archive it first.",
    };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = windowSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString();
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const d = parsed.data;

  await prisma.applicationWindow.create({
    data: {
      programId,
      scopedToMissionId: d.scopedToMissionId || null,
      state: "DRAFT",
      advertisingStartDate: new Date(d.advertisingStartDate),
      applicationOpenDate: new Date(d.applicationOpenDate),
      applicationCloseDate: new Date(d.applicationCloseDate),
      trainingStartDate: new Date(d.trainingStartDate),
      targetIntake: d.targetIntake,
      notes: d.notes || null,
      createdById: user.id,
    },
  });

  revalidatePath(`/dashboard/director/programs/${programId}`);
  return { ok: true, programId };
}

// ─── OPEN WINDOW ─────────────────────────────────────────────────────────────

export async function openWindowAction(
  windowId: string,
): Promise<ActionResult> {
  const user = await requireDirector();
  if (user.role === "MAIN_DIRECTOR") {
    const allowed = await isSettingEnabled(SETTINGS.UD_CAN_MANAGE_WINDOWS);
    if (!allowed) return { ok: false, error: "Not permitted." };
  }

  const window = await prisma.applicationWindow.findFirst({
    where: { id: windowId, deletedAt: null },
    include: { program: true },
  });
  if (!window) return { ok: false, error: "Window not found." };
  if (window.state === "OPEN") return { ok: true };

  if (!["DRAFT", "ADVERTISING"].includes(window.state)) {
    return {
      ok: false,
      error: "Only DRAFT or ADVERTISING windows can be opened.",
    };
  }

  await prisma.$transaction([
    prisma.applicationWindow.update({
      where: { id: windowId },
      data: { state: "OPEN" },
    }),
    prisma.auditLog.create({
      data: {
        action: "WINDOW_OPENED",
        actorId: user.id,
        actorRole: user.role,
        targetType: "ApplicationWindow",
        targetId: windowId,
        ipAddress: await getClientIp(),
        details: { programCode: window.program.code },
      },
    }),
  ]);

  revalidatePath(`/dashboard/director/programs/${window.programId}`);
  return { ok: true };
}

// ─── CLOSE WINDOW ────────────────────────────────────────────────────────────

export async function closeWindowAction(
  windowId: string,
): Promise<ActionResult> {
  const user = await requireDirector();
  if (user.role === "MAIN_DIRECTOR") {
    const allowed = await isSettingEnabled(SETTINGS.UD_CAN_MANAGE_WINDOWS);
    if (!allowed) return { ok: false, error: "Not permitted." };
  }

  const window = await prisma.applicationWindow.findFirst({
    where: { id: windowId, deletedAt: null },
    include: { program: true },
  });
  if (!window) return { ok: false, error: "Window not found." };
  if (window.state !== "OPEN")
    return { ok: false, error: "Window is not currently open." };

  await prisma.$transaction([
    prisma.applicationWindow.update({
      where: { id: windowId },
      data: { state: "CLOSED" },
    }),
    prisma.auditLog.create({
      data: {
        action: "WINDOW_CLOSED",
        actorId: user.id,
        actorRole: user.role,
        targetType: "ApplicationWindow",
        targetId: windowId,
        ipAddress: await getClientIp(),
        details: { programCode: window.program.code },
      },
    }),
  ]);

  revalidatePath(`/dashboard/director/programs/${window.programId}`);
  return { ok: true };
}

// ─── ARCHIVE WINDOW ──────────────────────────────────────────────────────────

export async function archiveWindowAction(
  windowId: string,
): Promise<ActionResult> {
  const user = await requireDirector();

  const window = await prisma.applicationWindow.findFirst({
    where: { id: windowId, deletedAt: null },
  });
  if (!window) return { ok: false, error: "Window not found." };
  if (window.state === "OPEN")
    return { ok: false, error: "Close the window before archiving." };

  await prisma.applicationWindow.update({
    where: { id: windowId },
    data: { state: "ARCHIVED" },
  });

  revalidatePath(`/dashboard/director/programs/${window.programId}`);
  return { ok: true };
}
