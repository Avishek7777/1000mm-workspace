"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";

export async function markNotificationReadAction(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  // Only mark if it belongs to this user
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: session.user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard"); // refreshes sidebar badge
}

export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      readAt: null,
      channel: "IN_APP",
    },
    data: { readAt: new Date() },
  });

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}
