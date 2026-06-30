import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { startDirectorReviewAction } from "@/actions/director";
import { DirectorActionPanel } from "./_components/DirectorActionPanel";

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

const STATUS_COLORS: Record<string, string> = {
  RECOMMENDED: "bg-teal-100 text-teal-700",
  UNDER_MAIN_DIRECTOR_REVIEW: "bg-purple-100 text-purple-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  RETURNED_TO_LMD: "bg-orange-100 text-orange-700",
};

const MISSION_COLORS: Record<string, string> = {
  EBM: "bg-blue-100 text-blue-700",
  NBM: "bg-teal-100 text-teal-700",
  SBM: "bg-purple-100 text-purple-700",
  WBM: "bg-amber-100 text-amber-700",
};

export default async function DirectorApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
  const { applicationId } = await params;

  const app = await prisma.application.findFirst({
    where: { id: applicationId, deletedAt: null },
    include: {
      applicant: { select: { fullName: true, email: true } },
      submittedFromMission: true,
      window: { include: { program: { select: { title: true } } } },
      documents: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
      recommendation: {
        include: {
          recommender: { select: { fullName: true, email: true } },
        },
      },
      lmdReviewer: { select: { fullName: true } },
    },
  });

  if (!app) redirect("/dashboard/director/applications");

  // Auto-start director review if RECOMMENDED
  if (app.status === "RECOMMENDED") {
    await startDirectorReviewAction(applicationId);
  }

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

  const mCode = app.submittedFromMission.code;
  const statusColor = STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-600";
  const missionColor = MISSION_COLORS[mCode] ?? "bg-gray-100 text-gray-600";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/director/applications"
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
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${missionColor}`}
            >
              {mCode}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
            >
              {formatEnum(app.status)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Link
            href={`/dashboard/director/applications/${applicationId}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print
          </Link>
          {profilePhotoUrl && (
            <div className="h-30 w-28 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <img
                src={profilePhotoUrl}
                alt="Applicant"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── LMD Recommendation Summary (shown before application details) ── */}
      {app.recommendation && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="h-4 w-4 text-teal-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-sm font-semibold text-teal-800">
              LMD Recommendation
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-teal-600 font-medium">
                Recommended By
              </p>
              <p className="mt-0.5 text-sm font-medium text-teal-900">
                {app.recommendation.recommender.fullName}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-teal-600 font-medium">
                Recommended On
              </p>
              <p className="mt-0.5 text-sm text-teal-900">
                {formatDate(app.recommendation.recommendedAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-teal-600 font-medium">
                Mission
              </p>
              <p className="mt-0.5 text-sm text-teal-900">
                {app.submittedFromMission.name}
              </p>
            </div>
          </div>

          {/* LMD written comment */}
          {app.recommendation.writtenComment && (
            <div className="rounded-lg border border-teal-200 bg-white p-3 mb-3">
              <p className="text-xs font-medium text-teal-700 mb-1">
                LMD Comment:
              </p>
              <p className="text-sm text-gray-700">
                {app.recommendation.writtenComment}
              </p>
            </div>
          )}

          {/* LMD documents */}
          {lmdDocs.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-teal-700">
                LMD Documents:
              </p>
              <div className="flex flex-wrap gap-2">
                {lmdDocs.map((doc) => (
                  <a
                    key={doc.id}
                    href={`/api/uploads/${doc.storageKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors"
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {doc.kind.replace(/_/g, " ").toLowerCase()}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* ── DIRECTOR ACTION PANEL ── */}
      <DirectorActionPanel
        applicationId={applicationId}
        status={app.status}
        existingDirectorComment={app.directorReviewerComment}
        existingRejectionReason={app.rejectionReason}
        referenceNumber={app.referenceNumber}
        missionName={app.submittedFromMission.name}
        programTitle={app.window.program.title}
      />
    </div>
  );
}
