import { requireRole } from "@/lib/auth/helpers";
import { getAllSettings, SETTING_KEYS } from "@/lib/settings";
import { SettingsClient } from "./_components/SettingsClient";

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
];

export default async function SettingsPage() {
  await requireRole(["SYSTEM_ADMIN"]);

  const settings = await getAllSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          System-wide configuration. Changes take effect immediately.
        </p>
      </div>

      <SettingsClient groups={SETTING_GROUPS} initialSettings={settings} />
    </div>
  );
}
