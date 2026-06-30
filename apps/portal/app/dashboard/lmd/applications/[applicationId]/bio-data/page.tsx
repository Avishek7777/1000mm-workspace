import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import { PrintControls } from "../print/_components/PrintControls";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

function formatDate(d?: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatEnum(v?: string | null) {
  if (!v) return "—";
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-1.5 pr-3 text-[11px] font-semibold text-gray-500 w-40 align-top">{label}</td>
      <td className="py-1.5 text-[12px] text-gray-900">{value || "—"}</td>
    </tr>
  );
}

export default async function LmdApplicationBioDataPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const user = await requireRole(["LOCAL_DIRECTOR"]);
  const { applicationId } = await params;

  const lmdUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { directedMission: true },
  });
  const missionId = lmdUser?.directedMission?.id;
  if (!missionId) redirect("/dashboard");

  const app = await prisma.application.findFirst({
    where: { id: applicationId, submittedFromMissionId: missionId, deletedAt: null },
    include: {
      submittedFromMission: true,
      window: { include: { program: { select: { title: true, code: true } } } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!app) redirect("/dashboard/lmd/applications");

  const fd = (app.formData as Record<string, unknown>) ?? {};
  let rawEdu = fd.education;
  if (typeof rawEdu === "string") { try { rawEdu = JSON.parse(rawEdu); } catch { rawEdu = []; } }
  const educationEntries = (Array.isArray(rawEdu) ? rawEdu : []) as Array<{ degree: string; institutionName: string; gpa: string; passingYear: string }>;

  const presentAddress = [app.presentAddressVillage, app.presentAddressPostOffice, app.presentAddressUpazila, app.presentAddressDistrict].filter(Boolean).join(", ");
  const permanentAddress = app.permanentSameAsPresent
    ? presentAddress
    : [app.permanentAddressVillage, app.permanentAddressPostOffice, app.permanentAddressUpazila, app.permanentAddressDistrict].filter(Boolean).join(", ");

  const profilePhoto = app.documents.find((d) => d.kind === "PROFILE_PHOTO");
  const profilePhotoUrl = profilePhoto ? `${appUrl}/uploads/${profilePhoto.storageKey}` : null;

  const bloodType = app.applicantBloodType?.replace("_", " ").replace("POS", "+").replace("NEG", "-");
  const generatedAt = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-3xl">
      <style dangerouslySetInnerHTML={{ __html: `
        #bio-print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          @page { margin: 12mm; }
          body * { visibility: hidden !important; }
          #bio-print, #bio-print * { visibility: visible !important; }
          #bio-print { position: absolute; left: 0; top: 0; width: 100%; color: #000; }
          .no-print { display: none !important; }
        }
      ` }} />

      <PrintControls backHref={`/dashboard/lmd/applications/${applicationId}`} />

      <div id="bio-print" className="bg-white text-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-gray-800 pb-3 mb-4">
          {/* Left logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/1000mm-logo.png" alt="1000MM" className="h-14 w-auto flex-shrink-0" />
          {/* Center text */}
          <div className="flex-1 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">
              1000 Missionary Movement Bangladesh
            </p>
            <h1 className="text-[18px] font-bold text-gray-900 mt-1 tracking-wide">BIO-DATA</h1>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {app.window.program.code} — {app.window.program.title}
            </p>
            {app.referenceNumber && (
              <p className="text-[10px] font-mono text-gray-400 mt-0.5">Ref: {app.referenceNumber}</p>
            )}
          </div>
          {/* Right logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/sda-logo.png" alt="SDA" className="h-14 w-auto flex-shrink-0" />
        </div>

        {/* Photo + personal info side by side */}
        <div className="flex gap-5 mb-5">
          {/* Photo box */}
          <div className="flex-shrink-0">
            <div className="w-28 h-36 border-2 border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
              {profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profilePhotoUrl} alt="Applicant" className="h-full w-full object-cover" />
              ) : (
                <p className="text-[9px] text-gray-400 text-center px-1">No Photo</p>
              )}
            </div>
            <p className="text-[9px] text-center text-gray-400 mt-1">Passport Size Photo</p>
          </div>

          {/* Personal details */}
          <div className="flex-1">
            <table className="w-full">
              <tbody>
                <Row label="Name (English)" value={app.applicantFullName} />
                <Row label="Name (Bangla)" value={app.applicantFullNameBangla} />
                <Row label="Date of Birth" value={formatDate(app.applicantDateOfBirth)} />
                <Row label="Place of Birth" value={app.applicantPlaceOfBirth} />
                <Row label="Gender" value={formatEnum(app.applicantGender)} />
                <Row label="Blood Group" value={bloodType} />
                <Row label="Marital Status" value={formatEnum(app.applicantMaritalStatus)} />
                <Row label="Height / Weight" value={[app.applicantHeight ? `${app.applicantHeight} cm` : null, app.applicantWeight ? `${app.applicantWeight} kg` : null].filter(Boolean).join(" / ") || "—"} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Church & Denomination */}
        <section className="mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-1 mb-2">Church Information</h2>
          <table className="w-full">
            <tbody>
              <Row label="Denomination" value={formatEnum(app.applicantDenomination)} />
              <Row label="Church Name" value={app.applicantChurchName} />
              <Row label="Date of Baptism" value={formatDate(app.applicantDateOfBaptism)} />
            </tbody>
          </table>
        </section>

        {/* Contact & Address */}
        <section className="mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-1 mb-2">Contact & Address</h2>
          <table className="w-full">
            <tbody>
              <Row label="Mobile No" value={app.applicantMobileNo} />
              <Row label="Email" value={app.applicantEmail} />
              <Row label="Workplace" value={app.applicantWorkplace} />
              <Row label="Present Address" value={presentAddress || "—"} />
              <Row label="Permanent Address" value={permanentAddress || presentAddress || "—"} />
            </tbody>
          </table>
        </section>

        {/* Family */}
        <section className="mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-1 mb-2">Family Details</h2>
          <div className="grid grid-cols-2 gap-x-6">
            <table>
              <tbody>
                <Row label="Father's Name" value={app.fatherName} />
                <Row label="Father's Age" value={app.fatherAge?.toString()} />
                <Row label="Father's Religion" value={formatEnum(app.fatherReligion)} />
                {app.fatherChurchName && <Row label="Father's Church" value={app.fatherChurchName} />}
              </tbody>
            </table>
            <table>
              <tbody>
                <Row label="Mother's Name" value={app.motherName} />
                <Row label="Mother's Age" value={app.motherAge?.toString()} />
                <Row label="Mother's Religion" value={formatEnum(app.motherReligion)} />
                {app.motherChurchName && <Row label="Mother's Church" value={app.motherChurchName} />}
              </tbody>
            </table>
          </div>
          <table className="w-full mt-1">
            <tbody>
              <Row label="Family Mobile" value={app.familyMobileNo} />
              <Row label="Family Email" value={app.familyEmail} />
            </tbody>
          </table>
        </section>

        {/* Education */}
        <section className="mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-1 mb-2">Educational Background</h2>
          {educationEntries.length === 0 ? (
            <p className="text-[11px] text-gray-400">No education entries recorded.</p>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-gray-300 text-left text-gray-500">
                  <th className="py-1 font-semibold">Degree</th>
                  <th className="py-1 font-semibold">Institution</th>
                  <th className="py-1 font-semibold">Result / GPA</th>
                  <th className="py-1 font-semibold">Year</th>
                </tr>
              </thead>
              <tbody>
                {educationEntries.map((e, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1">{e.degree || "—"}</td>
                    <td className="py-1">{e.institutionName || "—"}</td>
                    <td className="py-1">{e.gpa?.toString() || "—"}</td>
                    <td className="py-1">{e.passingYear?.toString() || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Signature + declaration */}
        <div className="mt-8 grid grid-cols-2 gap-16 break-inside-avoid">
          <div>
            <div className="border-t border-gray-400 pt-1">
              <p className="text-[10px] text-gray-600">Applicant Signature</p>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Date: ___________________</p>
          </div>
          <div>
            <div className="border-t border-gray-400 pt-1">
              <p className="text-[10px] text-gray-600">LMD Signature & Stamp</p>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">{app.submittedFromMission.name}</p>
          </div>
        </div>

        <p className="mt-5 text-center text-[9px] text-gray-400">
          Generated {generatedAt} · {app.submittedFromMission.name} · 1000MMBD Portal
        </p>
      </div>
    </div>
  );
}
