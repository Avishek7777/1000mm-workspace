/**
 * lib/settings.ts
 * Non-server helpers and constants for system settings.
 * Safe to import from both server components and "use server" actions.
 */

import { prisma } from "@1000mm/db";

// ─── Setting key constants ────────────────────────────────────────────────────

export const SETTING_KEYS = {
  UD_CAN_EXPORT_APPLICANTS: "ud.can_export_applicants",
  UD_CAN_MANAGE_PROGRAMS: "ud.can_manage_programs",
  UD_CAN_MANAGE_WINDOWS: "ud.can_manage_windows",
  UD_CAN_RESPOND_COMPLAINTS: "ud.can_respond_complaints",
  UD_CAN_OPEN_LMD_REPORT_WINDOWS: "ud.can_open_lmd_report_windows",
  ID_CARDS_PRINTING_ENABLED: "idcards.printing_enabled",
  SALARY_WINDOW_START: "salary.request_window_start",
  SALARY_WINDOW_END: "salary.request_window_end",
  LMD_ATTENDANCE_ENABLED: "lmd.attendance_enabled",
  AI_API_KEY: "ai.api_key",
  // Certificate signatories (configured by SA in Certificate Config)
  CERT_DIRECTOR_NAME: "cert.director_name",
  CERT_DIRECTOR_SIGNATURE: "cert.director_signature",
  CERT_PRESIDENT_NAME: "cert.president_name",
  CERT_PRESIDENT_SIGNATURE: "cert.president_signature",
  // Batch label printed on certificates ("28th" → "28th BATCH"); overrides
  // the program's batch number when set.
  CERT_BATCH_LABEL: "cert.batch_label",
} as const;

// Default signatory names/titles shown on the certificate.
export const CERT_DEFAULTS = {
  directorName: "Dr. Cho Choon Ho",
  directorTitle: "Director, 1000 MM Bangladesh",
  presidentName: "Pr. Won Sang Kim",
  presidentTitle: "President, BAUM",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

// Alias for convenience
export const SETTINGS = SETTING_KEYS;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function isSettingEnabled(key: string): Promise<boolean> {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  return (setting?.value as boolean | null) === true;
}

/** Read a string-valued setting (name, storage key, etc.), or null. */
export async function getStringSetting(key: string): Promise<string | null> {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  const v = setting?.value;
  return typeof v === "string" && v.trim() ? v : null;
}

export async function getSettings(
  keys: string[],
): Promise<Record<string, boolean>> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
  });
  const map: Record<string, boolean> = {};
  for (const key of keys) map[key] = false;
  for (const row of rows) map[row.key] = (row.value as boolean) === true;
  return map;
}

export async function getAllSettings(): Promise<Record<string, boolean>> {
  return getSettings(Object.values(SETTING_KEYS));
}
