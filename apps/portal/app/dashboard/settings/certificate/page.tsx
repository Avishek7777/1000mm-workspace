import Link from "next/link";
import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { SETTING_KEYS, CERT_DEFAULTS } from "@/lib/settings";
import { CertificateConfigForm } from "./_components/CertificateConfigForm";

export const metadata = { title: "Certificate Config" };

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export default async function CertificateConfigPage() {
  await requireRole(["SYSTEM_ADMIN"]);

  const rows = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          SETTING_KEYS.CERT_DIRECTOR_NAME,
          SETTING_KEYS.CERT_DIRECTOR_SIGNATURE,
          SETTING_KEYS.CERT_PRESIDENT_NAME,
          SETTING_KEYS.CERT_PRESIDENT_SIGNATURE,
        ],
      },
    },
  });
  const map = new Map(rows.map((r) => [r.key, asString(r.value)]));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/settings"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Settings
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">
          Certificate Config
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Signatory names and signature images printed on issued certificates.
        </p>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-blue-700">
        These appear above the two signature lines on every certificate. Upload
        a signature as a transparent PNG for the cleanest result. Leaving a name
        blank uses the default.
      </div>

      <CertificateConfigForm
        directorName={map.get(SETTING_KEYS.CERT_DIRECTOR_NAME) || ""}
        directorSignature={map.get(SETTING_KEYS.CERT_DIRECTOR_SIGNATURE) || ""}
        presidentName={map.get(SETTING_KEYS.CERT_PRESIDENT_NAME) || ""}
        presidentSignature={map.get(SETTING_KEYS.CERT_PRESIDENT_SIGNATURE) || ""}
        defaults={{
          directorName: CERT_DEFAULTS.directorName,
          directorTitle: CERT_DEFAULTS.directorTitle,
          presidentName: CERT_DEFAULTS.presidentName,
          presidentTitle: CERT_DEFAULTS.presidentTitle,
        }}
      />
    </div>
  );
}
