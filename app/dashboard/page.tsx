import { requireAuth } from "@/lib/auth/helpers";
import SystemAdminDashboard from "./system-admin/page";

// As more role dashboards are built, import and add them here.
// Each is a regular async Server Component — no special routing needed.

export default async function DashboardPage() {
  const user = await requireAuth();

  switch (user.role) {
    case "SYSTEM_ADMIN":
      return <SystemAdminDashboard />;

    // Placeholders — replace with real dashboards as they're built
    case "MAIN_DIRECTOR":
    case "LOCAL_DIRECTOR":
    case "TRAINER":
    case "TRAINEE":
    default:
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              Dashboard coming soon
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Signed in as {user.role.replace(/_/g, " ").toLowerCase()}
            </p>
          </div>
        </div>
      );
  }
}
