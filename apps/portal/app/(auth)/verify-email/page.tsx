import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";

export const metadata = {
  title: "Verify Email — 1000MM Bangladesh",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/login?error=invalid-token");
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    redirect("/login?error=expired-token");
  }

  // ── Email-change token: switch the account to the new address ──
  if (record.newEmail) {
    // Re-check availability — another account may have claimed the address
    // between the request and the click.
    const taken = await prisma.user.findUnique({
      where: { email: record.newEmail },
    });
    if (taken && taken.id !== record.userId) {
      redirect("/login?error=email-taken");
    }

    const before = await prisma.user.findUnique({
      where: { id: record.userId },
      select: { email: true, role: true },
    });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { email: record.newEmail, emailVerified: new Date() },
      }),
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          action: "USER_EMAIL_CHANGED",
          actorId: record.userId,
          actorRole: before?.role,
          targetType: "User",
          targetId: record.userId,
          details: { from: before?.email, to: record.newEmail, via: "self-service" },
        },
      }),
    ]);

    redirect("/login?verified=1&email-changed=1");
  }

  // ── Plain verification token: confirm the current email ──
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date(), isActive: true },
    }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?verified=1");
}
