import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import DashboardShell from "./_components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireAuth();

  const [dbUser, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { isMissionary: true },
    }),
    prisma.notification.count({
      where: {
        userId: sessionUser.id,
        readAt: null,
        channel: "IN_APP",
      },
    }),
  ]);

  const user = {
    ...sessionUser,
    name: sessionUser.name ?? null,
    email: sessionUser.email ?? null,
    isMissionary: dbUser?.isMissionary ?? false,
  };

  return (
    <DashboardShell
      user={{ ...user, name: user.name ?? null, email: user.email ?? null }}
      unreadCount={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}
