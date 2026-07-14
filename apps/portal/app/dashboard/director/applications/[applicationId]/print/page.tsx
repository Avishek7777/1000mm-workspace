import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import { PrintControls } from "./_components/PrintControls";


function formatDate(d?: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEnum(v?: string | null) {
  if (!v) return "—";
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Cell({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-gray-200 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="text-[12px] text-gray-900">{value || "—"}</p>
    </div>
  );
}

function Block({
  title,
  cols = 2,
  children,
}: {
  title: string;
  cols?: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h2 className="mb-2 border-b-2 border-gray-800 pb-1 text-[13px] font-bold uppercase tracking-wide text-gray-800">
        {title}
      </h2>
      <div
        className={`grid gap-x-6 ${cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {children}
      </div>
    </section>
  );
}

export default async function ApplicationPrintPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
  const { applicationId } = await params;

  // NOTE: read-only — deliberately does NOT call startDirectorReviewAction,
  // so printing never changes the application's status.
  const app = await prisma.application.findFirst({
    where: { id: applicationId, deletedAt: null },
    include: {
      applicant: { select: { fullName: true, email: true } },
      submittedFromMission: true,
      window: { include: { program: { select: { title: true } } } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      recommendation: {
        include: { recommender: { select: { fullName: true } } },
      },
    },
  });

  if (!app) redirect("/dashboard/director/applications");

  const fd = (app.formData as Record<string, unknown>) ?? {};
  const educationEntries = Array.isArray(fd.education)
    ? (fd.education as Array<{
        degree: string;
        institutionName: string;
        gpa: string;
        passingYear: string;
      }>)
    : [];

  const presentAddress = [
    app.presentAddressVillage,
    app.presentAddressPostOffice,
    app.presentAddressUpazila,
    app.presentAddressDistrict,
  ]
    .filter(Boolean)
    .join(", ");

  const permanentAddress = app.permanentSameAsPresent
    ? presentAddress
    : [
        app.permanentAddressVillage,
        app.permanentAddressPostOffice,
        app.permanentAddressUpazila,
        app.permanentAddressDistrict,
      ]
        .filter(Boolean)
        .join(", ");

  const profilePhoto = app.documents.find((d) => d.kind === "PROFILE_PHOTO");
  const profilePhotoUrl = profilePhoto
    ? `/api/uploads/${profilePhoto.storageKey}`
    : null;

  const yesNo = (v: unknown) => (v === true ? "Yes" : v === false ? "No" : "—");

  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-3xl">
      {/* Scoped print rules: hide everything except #app-print when printing. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            #app-print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media print {
              @page { margin: 14mm; }
              body * { visibility: hidden !important; }
              #app-print, #app-print * { visibility: visible !important; }
              #app-print { position: absolute; left: 0; top: 0; width: 100%; color: #000; }
              .no-print { display: none !important; }
            }
          `,
        }}
      />

      <PrintControls backHref="/dashboard/director/applications" />

      <div id="app-print" className="bg-white px-2 text-gray-900">
        {/* Document header */}
        <div className="flex items-start justify-between gap-4 border-b-4 border-gray-900 pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              1000 Missionary Movement — Bangladesh
            </p>
            <h1 className="mt-1 text-xl font-bold text-gray-900">
              {app.applicantFullName}
            </h1>
            <p className="mt-1 text-[11px] text-gray-600">
              {app.referenceNumber ? `Ref: ${app.referenceNumber} · ` : ""}
              {app.submittedFromMission.code} — {app.submittedFromMission.name}{" "}
              · {formatEnum(app.status)}
            </p>
            <p className="text-[11px] text-gray-600">
              Program: {app.window.program.title}
            </p>
          </div>
          {profilePhotoUrl && (
            <div className="h-30 w-28 flex-shrink-0 overflow-hidden rounded border border-gray-300 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profilePhotoUrl}
                alt="Applicant"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>

        {/* 1. Personal */}
        <Block title="1. Personal Details">
          <Cell label="Full Name (English)" value={app.applicantFullName} />
          <Cell
            label="Full Name (Bangla)"
            value={app.applicantFullNameBangla}
          />
          <Cell
            label="Date of Birth"
            value={formatDate(app.applicantDateOfBirth)}
          />
          <Cell label="Gender" value={formatEnum(app.applicantGender)} />
          <Cell
            label="Blood Type"
            value={app.applicantBloodType
              ?.replace("_", " ")
              .replace("POS", "+")
              .replace("NEG", "-")}
          />
          <Cell
            label="Marital Status"
            value={formatEnum(app.applicantMaritalStatus)}
          />
          <Cell
            label="Denomination"
            value={formatEnum(app.applicantDenomination)}
          />
          <Cell label="Place of Birth" value={app.applicantPlaceOfBirth} />
          <Cell label="Church Name" value={app.applicantChurchName} />
          <Cell
            label="Date of Baptism"
            value={formatDate(app.applicantDateOfBaptism)}
          />
          <Cell label="Height (cm)" value={app.applicantHeight?.toString()} />
          <Cell label="Weight (kg)" value={app.applicantWeight?.toString()} />
          <Cell label="Workplace" value={app.applicantWorkplace} />
          <Cell label="Mobile No" value={app.applicantMobileNo} />
          <Cell label="Email" value={app.applicantEmail} />
          <Cell label="Present Address" value={presentAddress || "—"} />
          <Cell
            label="Permanent Address"
            value={permanentAddress || presentAddress || "—"}
          />
        </Block>

        {/* 2. Family */}
        <Block title="2. Family Details">
          <Cell label="Father — Name" value={app.fatherName} />
          <Cell label="Father — Age" value={app.fatherAge?.toString()} />
          <Cell
            label="Father — Religion"
            value={formatEnum(app.fatherReligion)}
          />
          <Cell label="Father — Church" value={app.fatherChurchName} />
          <Cell label="Mother — Name" value={app.motherName} />
          <Cell label="Mother — Age" value={app.motherAge?.toString()} />
          <Cell
            label="Mother — Religion"
            value={formatEnum(app.motherReligion)}
          />
          <Cell label="Mother — Church" value={app.motherChurchName} />
          <Cell label="Family Mobile No" value={app.familyMobileNo} />
          <Cell label="Family Email" value={app.familyEmail} />
        </Block>

        {/* 3. Education */}
        <Block title="3. Educational Background" cols={1}>
          {educationEntries.length === 0 ? (
            <p className="py-1.5 text-[12px] text-gray-400">
              No education entries recorded.
            </p>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-gray-300 text-left text-gray-500">
                  <th className="py-1 font-medium">Degree</th>
                  <th className="py-1 font-medium">Institution</th>
                  <th className="py-1 font-medium">GPA / Result</th>
                  <th className="py-1 font-medium">Passing Year</th>
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
        </Block>

        {/* 4. Application Details */}
        <Block title="4. Application Details" cols={1}>
          <div className="border-b border-gray-200 py-1.5">
            <p className="text-[9px] uppercase tracking-wider text-gray-500">
              Missionary Desire
            </p>
            <p className="whitespace-pre-wrap text-[12px] text-gray-900">
              {(fd.missionaryDesire as string) || "—"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-x-6">
            <Cell
              label="District Pastor's Name"
              value={(fd.districtPastorName as string) || "—"}
            />
            <Cell
              label="Pastor's Mobile No"
              value={(fd.districtPastorMobile as string) || "—"}
            />
            <Cell
              label="Pastor's Email"
              value={(fd.districtPastorEmail as string) || "—"}
            />
          </div>
          <div className="grid grid-cols-3 gap-x-6">
            <Cell
              label="Criminal / Court Record"
              value={yesNo(fd.courtRecord)}
            />
            <Cell label="Health Condition" value={yesNo(fd.healthCondition)} />
            <Cell label="Harmful Habits" value={yesNo(fd.badHabits)} />
          </div>
        </Block>

        {/* LMD Recommendation */}
        {app.recommendation && (
          <Block title="LMD Recommendation" cols={1}>
            <div className="grid grid-cols-2 gap-x-6">
              <Cell
                label="Recommended By"
                value={app.recommendation.recommender.fullName}
              />
              <Cell
                label="Recommended On"
                value={formatDate(app.recommendation.recommendedAt)}
              />
            </div>
            {app.recommendation.writtenComment && (
              <div className="border-b border-gray-200 py-1.5">
                <p className="text-[9px] uppercase tracking-wider text-gray-500">
                  Comment
                </p>
                <p className="whitespace-pre-wrap text-[12px] text-gray-900">
                  {app.recommendation.writtenComment}
                </p>
              </div>
            )}
          </Block>
        )}

        {/* Documents on file */}
        <Block title="Documents on File" cols={1}>
          {app.documents.length === 0 ? (
            <p className="py-1.5 text-[12px] text-gray-400">
              No documents uploaded.
            </p>
          ) : (
            <ul className="text-[11px] text-gray-800">
              {app.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex justify-between border-b border-gray-100 py-1"
                >
                  <span>{doc.kind.replace(/_/g, " ").toLowerCase()}</span>
                  <span className="text-gray-500">{doc.fileName}</span>
                </li>
              ))}
            </ul>
          )}
        </Block>

        {/* Signature + footer */}
        <div className="mt-10 grid grid-cols-2 gap-12 break-inside-avoid">
          <div className="border-t border-gray-400 pt-1 text-[10px] text-gray-600">
            Director Signature
          </div>
          <div className="border-t border-gray-400 pt-1 text-[10px] text-gray-600">
            Date
          </div>
        </div>
        <p className="mt-6 text-center text-[9px] text-gray-400">
          Generated {generatedAt} · 1000MMBD Portal
        </p>
      </div>
    </div>
  );
}
