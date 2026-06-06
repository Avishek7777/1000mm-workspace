import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Sidebar from "./_components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  const unreadCount = await prisma.notification.count({
    where: {
      userId: user.id,
      readAt: null,
      channel: "IN_APP",
    },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} unreadCount={unreadCount} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
