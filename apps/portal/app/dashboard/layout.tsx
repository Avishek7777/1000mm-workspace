import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import DashboardShell from "./_components/dashboard-shell";
import { isSettingEnabled, SETTINGS } from "@/lib/settings";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireAuth();

  const isAdmin =
    sessionUser.role === "MAIN_DIRECTOR" || sessionUser.role === "SYSTEM_ADMIN";
  const isLmd = sessionUser.role === "LOCAL_DIRECTOR";

  const [dbUser, unreadCount, applicantCount, lmdAttendanceEnabled] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { isMissionary: true, profilePicture: true },
    }).catch(() => null),
    prisma.notification.count({
      where: {
        userId: sessionUser.id,
        readAt: null,
        channel: "IN_APP",
      },
    }).catch(() => 0),
    isAdmin
      ? prisma.programEnrollment.count({
          where: { status: "APPLIED", deletedAt: null },
        }).catch(() => 0)
      : Promise.resolve(0),
    isLmd ? isSettingEnabled(SETTINGS.LMD_ATTENDANCE_ENABLED).catch(() => false) : Promise.resolve(false),
  ]);

  const user = {
    ...sessionUser,
    name: sessionUser.name ?? null,
    email: sessionUser.email ?? null,
    isMissionary: dbUser?.isMissionary ?? false,
    image: dbUser?.profilePicture ?? null,
  };

  return (
    <DashboardShell
      user={{ ...user, name: user.name ?? null, email: user.email ?? null }}
      unreadCount={unreadCount}
      applicantCount={applicantCount}
      lmdAttendanceEnabled={lmdAttendanceEnabled}
    >
      {children}
    </DashboardShell>
  );
}
