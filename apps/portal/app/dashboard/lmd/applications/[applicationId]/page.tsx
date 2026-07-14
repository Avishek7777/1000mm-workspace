import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { startReviewAction } from "@/actions/lmd";
import { ActionPanel } from "./_components/ActionPanel";


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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-900">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-gray-900">{value || "—"}</p>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{children}</div>
  );
}

export default async function LmdApplicationDetailPage({
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
    where: {
      id: applicationId,
      submittedFromMissionId: missionId,
      deletedAt: null,
    },
    include: {
      applicant: { select: { fullName: true, email: true } },
      submittedFromMission: true,
      window: { include: { program: { select: { title: true } } } },
      documents: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
      recommendation: true,
    },
  });

  if (!app) redirect("/dashboard/lmd/applications");

  if (["SUBMITTED", "RETURNED_TO_LMD"].includes(app.status)) {
    await startReviewAction(applicationId);
  }

  const fd = (app.formData as Record<string, unknown>) ?? {};
  let rawEducation = fd.education;
  if (typeof rawEducation === "string") {
    try { rawEducation = JSON.parse(rawEducation); } catch { rawEducation = []; }
  }
  const educationEntries = (Array.isArray(rawEducation) ? rawEducation : []) as Array<{
    degree: string;
    institutionName: string;
    gpa: string;
    passingYear: string;
  }>;

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

  const applicantDocs = app.documents.filter((d) =>
    [
      "PROFILE_PHOTO",
      "FATHER_NID",
      "MOTHER_NID",
      "EDUCATION_CERTIFICATE",
      "DISTRICT_PASTOR_RECOMMENDATION",
      "NID",
      "BIRTH_CERTIFICATE",
      "PARENT_PASSPORT_PHOTO",
      "BAPTISM_CERTIFICATE",
      "PARENTS_CONSENT",
      "LETTER_OF_INTENT",
    ].includes(d.kind),
  );

  const lmdDocs = app.documents.filter((d) =>
    ["RECOMMENDATION_LETTER", "SWORN_STATEMENT", "EXCOM_VOTE_COPY"].includes(
      d.kind,
    ),
  );

  const profilePhoto = app.documents.find((d) => d.kind === "PROFILE_PHOTO");
  const profilePhotoUrl = profilePhoto
    ? `/api/uploads/${profilePhoto.storageKey}`
    : null;

  const isRecommended = app.status === "RECOMMENDED";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/lmd/applications"
            className="mb-1 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            ← Back to Applications
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">
            {app.applicantFullName}
          </h1>
          <div className="mt-1 flex items-center gap-3">
            {app.referenceNumber && (
              <span className="font-mono text-xs text-gray-500">
                {app.referenceNumber}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                isRecommended
                  ? "bg-teal-100 text-teal-700"
                  : app.status === "RETURNED_TO_APPLICANT"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {formatEnum(app.status)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Print actions */}
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/lmd/applications/${applicationId}/bio-data`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Bio-Data
            </Link>
            <Link
              href={`/dashboard/lmd/applications/${applicationId}/print`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print
            </Link>
          </div>
          {profilePhotoUrl && (
            <div className="h-16 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <img src={profilePhotoUrl} alt="Applicant" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 1: Personal Details ── */}
      <Section title="1. Personal Details">
        <Grid>
          <Field label="Full Name (English)" value={app.applicantFullName} />
          <Field
            label="Full Name (Bangla)"
            value={app.applicantFullNameBangla}
          />
          <Field
            label="Date of Birth"
            value={formatDate(app.applicantDateOfBirth)}
          />
          <Field label="Gender" value={formatEnum(app.applicantGender)} />
          <Field
            label="Blood Type"
            value={app.applicantBloodType
              ?.replace("_", " ")
              .replace("POS", "+")
              .replace("NEG", "-")}
          />
          <Field
            label="Marital Status"
            value={formatEnum(app.applicantMaritalStatus)}
          />
          <Field
            label="Denomination"
            value={formatEnum(app.applicantDenomination)}
          />
          <Field label="Place of Birth" value={app.applicantPlaceOfBirth} />
          <Field label="Church Name" value={app.applicantChurchName} />
          <Field
            label="Date of Baptism"
            value={formatDate(app.applicantDateOfBaptism)}
          />
          <Field label="Height (cm)" value={app.applicantHeight?.toString()} />
          <Field label="Weight (kg)" value={app.applicantWeight?.toString()} />
          <Field label="Workplace" value={app.applicantWorkplace} />
          <Field label="Mobile No" value={app.applicantMobileNo} />
          <Field label="Email" value={app.applicantEmail} />
        </Grid>
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
          <Field label="Present Address" value={presentAddress || "—"} />
          <Field
            label="Permanent Address"
            value={permanentAddress || presentAddress || "—"}
          />
        </div>
      </Section>

      {/* ── SECTION 2: Family Details ── */}
      <Section title="2. Family Details">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Father
            </p>
            <Grid>
              <Field label="Name" value={app.fatherName} />
              <Field label="Age" value={app.fatherAge?.toString()} />
              <Field label="Religion" value={formatEnum(app.fatherReligion)} />
              {app.fatherChurchName && (
                <Field label="Church" value={app.fatherChurchName} />
              )}
            </Grid>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Mother
            </p>
            <Grid>
              <Field label="Name" value={app.motherName} />
              <Field label="Age" value={app.motherAge?.toString()} />
              <Field label="Religion" value={formatEnum(app.motherReligion)} />
              {app.motherChurchName && (
                <Field label="Church" value={app.motherChurchName} />
              )}
            </Grid>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <Grid>
              <Field label="Family Mobile No" value={app.familyMobileNo} />
              <Field label="Family Email" value={app.familyEmail} />
            </Grid>
          </div>
        </div>
      </Section>

      {/* ── SECTION 3: Education ── */}
      <Section title="3. Educational Background">
        {educationEntries.length === 0 ? (
          <p className="text-sm text-gray-400">
            No education entries recorded.
          </p>
        ) : (
          <div className="space-y-4">
            {educationEntries.map((e, i) => (
              <div
                key={i}
                className={i > 0 ? "border-t border-gray-100 pt-4" : ""}
              >
                <Grid>
                  <Field label="Degree" value={e.degree} />
                  <Field label="Institution" value={e.institutionName} />
                  <Field label="GPA / Result" value={e.gpa?.toString()} />
                  <Field
                    label="Passing Year"
                    value={e.passingYear?.toString()}
                  />
                </Grid>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── SECTION 4: Application Details ── */}
      <Section title="4. Application Details">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
              Missionary Desire
            </p>
            <p className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">
              {(fd.missionaryDesire as string) || "—"}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-3 sm:grid-cols-3">
            <Field
              label="Criminal / Court Record"
              value={
                fd.courtRecord === true
                  ? "Yes"
                  : fd.courtRecord === false
                    ? "No"
                    : "—"
              }
            />
            <Field
              label="Health Condition"
              value={
                fd.healthCondition === true
                  ? "Yes"
                  : fd.healthCondition === false
                    ? "No"
                    : "—"
              }
            />
            <Field
              label="Harmful Habits"
              value={
                fd.badHabits === true
                  ? "Yes"
                  : fd.badHabits === false
                    ? "No"
                    : "—"
              }
            />
          </div>
        </div>
      </Section>

      {/* ── SECTION 5: Applicant Documents ── */}
      <Section title="5. Applicant Documents">
        {applicantDocs.length === 0 ? (
          <p className="text-sm text-gray-400">No documents uploaded.</p>
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {applicantDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-500"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">
                        {doc.fileName}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {doc.kind.replace(/_/g, " ").toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/api/uploads/${doc.storageKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>

            {/* Download all as ZIP */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <a
                href={`/api/application/${applicationId}/documents/zip`}
                download
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download All Documents as ZIP
                <span className="text-gray-400">
                  ({applicantDocs.length} files)
                </span>
              </a>
            </div>
          </>
        )}
      </Section>

      {/* ── ACTION PANEL ── */}
      <ActionPanel
        applicationId={applicationId}
        status={app.status}
        lmdDocs={lmdDocs.map((d) => ({
          kind: d.kind,
          fileName: d.fileName,
          storageKey: d.storageKey,
        }))}
        existingComment={app.lmdReviewerComment}
        existingWrittenComment={app.recommendation?.writtenComment}
        existingLmdRejectionReason={app.lmdRejectionReason} // ← new
        referenceNumber={app.referenceNumber} // ← new
        missionName={app.submittedFromMission.name} // ← new
        programTitle={app.window.program.title} // ← new
      />
    </div>
  );
}
