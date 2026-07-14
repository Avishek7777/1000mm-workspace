import Link from "next/link";
import { requireRole } from "@/lib/auth/helpers";
import { getAllSettings, SETTING_KEYS } from "@/lib/settings";
import { SettingsClient } from "./_components/SettingsClient";
import { AiKeyForm } from "./_components/AiKeyForm";
import { prisma } from "@1000mm/db";

const SETTING_GROUPS = [
  {
    group: "Union Director Permissions",
    description:
      "Control what the Union Director can do on the platform. When disabled, those features redirect UD away.",
    items: [
      {
        key: SETTING_KEYS.UD_CAN_MANAGE_PROGRAMS,
        label: "Manage Training Programs",
        description:
          "Allow UD to create, edit, publish and archive training programs.",
      },
      {
        key: SETTING_KEYS.UD_CAN_MANAGE_WINDOWS,
        label: "Manage Application Windows",
        description: "Allow UD to open and close application windows.",
      },
      {
        key: SETTING_KEYS.UD_CAN_OPEN_LMD_REPORT_WINDOWS,
        label: "Open LMD Report Windows",
        description:
          "Allow UD to open and close monthly LMD reporting windows.",
      },
      {
        key: SETTING_KEYS.UD_CAN_RESPOND_COMPLAINTS,
        label: "Respond to Complaints",
        description:
          "Allow UD to read and respond to complaints. SA always retains this ability.",
      },
      {
        key: SETTING_KEYS.UD_CAN_EXPORT_APPLICANTS,
        label: "Export Applicant Lists",
        description: "Allow UD to download applicant lists as PDF or Excel.",
      },
      {
        key: SETTING_KEYS.ID_CARDS_PRINTING_ENABLED,
        label: "Print ID Cards",
        description: "Allow UD to generate and print trainee ID cards.",
      },
    ],
  },
  {
    group: "LMD Permissions",
    description: "Control what Local Mission Directors can access.",
    items: [
      {
        key: SETTING_KEYS.LMD_ATTENDANCE_ENABLED,
        label: "Attendance Scanning",
        description: "Allow LMDs to access the QR attendance scanning feature.",
      },
    ],
  },
];

export default async function SettingsPage() {
  await requireRole(["SYSTEM_ADMIN"]);

  const [settings, aiKeySetting] = await Promise.all([
    getAllSettings(),
    prisma.systemSetting.findUnique({ where: { key: SETTING_KEYS.AI_API_KEY } }),
  ]);

  const aiKey = typeof aiKeySetting?.value === "string" ? aiKeySetting.value : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          System-wide configuration. Changes take effect immediately.
        </p>
      </div>

      {/* Sub-pages */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/settings/certificate"
          className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-teal-300 hover:bg-teal-50/40 transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">Certificate Config</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Director &amp; president names and signatures
            </p>
          </div>
          <span className="text-gray-300 group-hover:text-teal-500">→</span>
        </Link>
        <Link
          href="/dashboard/settings/testimonials"
          className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-teal-300 hover:bg-teal-50/40 transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">Testimonials</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Manage homepage testimonies
            </p>
          </div>
          <span className="text-gray-300 group-hover:text-teal-500">→</span>
        </Link>
      </div>

      <SettingsClient groups={SETTING_GROUPS} initialSettings={settings} />
      <AiKeyForm currentKey={aiKey} />
    </div>
  );
}
