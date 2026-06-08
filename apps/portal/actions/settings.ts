"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { SETTING_KEYS, type SettingKey } from "@/lib/settings";

export type ActionResult = { ok: boolean; error?: string };

async function requireSA() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "SYSTEM_ADMIN") redirect("/dashboard");
  return user;
}

export async function toggleSettingAction(
  key: string,
  enabled: boolean,
): Promise<ActionResult> {
  const actor = await requireSA();

  if (!Object.values(SETTING_KEYS).includes(key as SettingKey)) {
    return { ok: false, error: "Unknown setting key." };
  }

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: enabled, updatedById: actor.id },
    create: { key, value: enabled, description: key },
  });

  await prisma.auditLog.create({
    data: {
      action: "USER_ROLE_CHANGED",
      actorId: actor.id,
      actorRole: actor.role,
      targetType: "SystemSetting",
      targetId: key,
      details: { key, enabled },
    },
  });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}
