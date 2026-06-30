import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { isSettingEnabled, SETTINGS } from "@/lib/settings";
import { redirect } from "next/navigation";
import { QrScanner } from "./_components/QrScanner";

export default async function AttendancePage() {
  const session = await auth();
  await requireRole([
    "SYSTEM_ADMIN",
    "MAIN_DIRECTOR",
    "SECRETARY",
    "ASSOCIATE_DIRECTOR",
    "LOCAL_DIRECTOR",
  ]);

  // LMD access is gated by SA setting
  if (session?.user?.role === "LOCAL_DIRECTOR") {
    const enabled = await isSettingEnabled(SETTINGS.LMD_ATTENDANCE_ENABLED);
    if (!enabled) redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          Attendance Scanner
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Scan a trainee&apos;s ID card QR code to look up their record.
        </p>
      </div>

      <QrScanner />
    </div>
  );
}
