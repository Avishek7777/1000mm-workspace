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
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

// Alias for convenience
export const SETTINGS = SETTING_KEYS;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function isSettingEnabled(key: string): Promise<boolean> {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  return (setting?.value as boolean | null) === true;
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
