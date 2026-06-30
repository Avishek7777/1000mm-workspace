"use server";

import { z } from "zod";
import { Resend } from "resend";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma, Prisma } from "@1000mm/db";
import BulkEmail from "@/lib/email/templates/BulkEmail";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

const INFO_FROM = "1000MM Bangladesh <info@1000mm.org.bd>";
const DONATE_FROM = "1000MM Bangladesh <donate@1000mm.org.bd>";

const AUDIENCE_ROLES = {
  all_users: undefined,
  missionaries: "TRAINEE",
  trainees: "TRAINEE",
  trainers: "TRAINER",
  directors: ["MAIN_DIRECTOR", "ASSOCIATE_DIRECTOR", "LOCAL_DIRECTOR", "SECRETARY"],
  admins: "SYSTEM_ADMIN",
} as const;

const schema = z.object({
  fromEmail: z.enum(["info", "donate"]),
  audience: z.enum(["all_users", "missionaries", "trainees", "trainers", "directors", "admins"]),
  subject: z.string().trim().min(3, "Subject is required.").max(200),
  body: z.string().trim().min(10, "Body is required.").max(10000),
});

export type BulkEmailResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  sent?: number;
  skipped?: number;
};

async function requireSA() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "SYSTEM_ADMIN") redirect("/dashboard");
  return user;
}

async function getRecipients(audience: keyof typeof AUDIENCE_ROLES) {
  const base: Prisma.UserWhereInput = {
    emailVerified: { not: null },
  };

  let extra: Prisma.UserWhereInput = {};
  if (audience === "missionaries") {
    extra = { role: "TRAINEE", isMissionary: true };
  } else if (audience === "trainees") {
    extra = { role: "TRAINEE" };
  } else if (audience === "trainers") {
    extra = { role: "TRAINER" };
  } else if (audience === "directors") {
    extra = { role: { in: ["MAIN_DIRECTOR", "ASSOCIATE_DIRECTOR", "LOCAL_DIRECTOR", "SECRETARY"] } };
  } else if (audience === "admins") {
    extra = { role: "SYSTEM_ADMIN" };
  }

  return prisma.user.findMany({
    where: { ...base, ...extra },
    select: { id: true, email: true, fullName: true },
  });
}

export async function sendBulkEmailAction(
  _prev: BulkEmailResult,
  formData: FormData,
): Promise<BulkEmailResult> {
  const sender = await requireSA();

  const parsed = schema.safeParse({
    fromEmail: formData.get("fromEmail"),
    audience: formData.get("audience"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { fromEmail, audience, subject, body } = parsed.data;
  const from = fromEmail === "donate" ? DONATE_FROM : INFO_FROM;
  const senderName = sender.fullName ?? "The Administration";

  const recipients = await getRecipients(audience);
  if (recipients.length === 0) {
    return { ok: false, error: "No recipients found for the selected audience." };
  }

  const valid = recipients.filter((r) => r.email && r.email.includes("@"));
  const skipped = recipients.length - valid.length;

  const BATCH_SIZE = 100;
  let sent = 0;

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const chunk = valid.slice(i, i + BATCH_SIZE);
    try {
      await resend.batch.send(
        chunk.map((r) => ({
          from,
          to: r.email!,
          subject,
          react: React.createElement(BulkEmail, { subject, body, senderName }),
        }))
      );
      sent += chunk.length;
    } catch (err) {
      console.error("[BULK EMAIL] Batch failed:", err);
      return {
        ok: false,
        error: `Sent ${sent} email(s) before an error occurred. Check server logs.`,
        sent,
        skipped,
      };
    }
  }

  return { ok: true, sent, skipped };
}

export async function getAudienceCount(audience: string): Promise<number> {
  if (!Object.keys(AUDIENCE_ROLES).includes(audience)) return 0;
  const recipients = await getRecipients(audience as keyof typeof AUDIENCE_ROLES);
  return recipients.length;
}
