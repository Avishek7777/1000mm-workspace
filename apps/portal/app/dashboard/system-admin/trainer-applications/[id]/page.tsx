// apps/portal/app/dashboard/system-admin/trainer-applications/[id]/page.tsx

import { prisma as db } from "@1000mm/db";
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  CreditCard,
  Camera,
  CheckCircle,
  XCircle,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Globe,
} from "lucide-react";
import {
  approveTrainerApplicationAction,
  rejectTrainerApplicationAction,
} from "@/actions/trainerApplications";
import { ExportButtons } from "../_components/ExportButtons";
import { TopicAssignSelect } from "./_components/TopicAssignSelect";
import { EditLetterForm } from "./_components/EditLetterForm";
import { ApplicationExportButton } from "./_components/ApplicationExportButton";
import { AttachDocumentPanel } from "./_components/AttachDocumentPanel";
import { PrintButton } from "@/components/PrintButton";

export const metadata = { title: "Trainer Application Review" };

export default async function TrainerApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN")
    redirect("/dashboard");

  const { id } = await params;

  const [application, programs] = await Promise.all([
    db.trainerApplication.findUnique({
      where: { id },
      include: {
        reviewedBy:  { select: { fullName: true } },
        createdUser: { select: { id: true, fullName: true, role: true } },
        attachments: { include: { uploadedBy: { select: { fullName: true } } }, orderBy: { uploadedAt: "desc" } },
      },
    }),
    db.trainingProgram.findMany({
      where: { deletedAt: null, isPublished: true },
      orderBy: { startDate: "desc" },
      select: {
        id: true, code: true, title: true,
        topics: {
          where: { deletedAt: null },
          orderBy: { order: "asc" },
          select: { id: true, title: true, trainerId: true },
        },
      },
    }),
  ]);

  if (!application) notFound();

  const isPending = application.status === "PENDING";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Print-only bio-data header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-xl font-bold text-gray-900">Trainer Application — Bio-data</h1>
        <p className="text-sm text-gray-500 mt-0.5">1000 Missionary Movement Bangladesh · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        <hr className="my-3 border-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900">{application.fullName}</h2>
        <p className="text-sm text-gray-600 mt-1">
          <strong>Email:</strong> {application.email}{application.phone ? ` · Phone: ${application.phone}` : ""}
          {application.country ? ` · Country: ${application.country}` : ""}
        </p>
        <p className="text-sm text-gray-600"><strong>Address:</strong> {application.fullAddress}</p>
        <p className="text-sm text-gray-600"><strong>Specialization:</strong> {application.specialization}</p>
        <p className="text-sm text-gray-600 mt-1"><strong>Status:</strong> {application.status}</p>
      </div>

      {/* Back + header */}
      <div className="print:hidden">
        <Link
          href="/dashboard/system-admin/trainer-applications"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          All Applications
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {application.fullName}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Applied{" "}
              {new Date(application.createdAt).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <StatusBadge status={application.status} />
          <div className="flex items-center gap-2 print:hidden">
            <PrintButton label="Print Bio-data" />
            <ApplicationExportButton applicationId={application.id} />
            <ExportButtons trainerId={application.createdUser?.id} />
          </div>
        </div>
      </div>

      {/* Already-reviewed notice */}
      {!isPending && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            application.status === "APPROVED"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span className="font-medium">
            {application.status === "APPROVED" ? "Approved" : "Rejected"}
          </span>{" "}
          by {application.reviewedBy?.fullName ?? "SA"} on{" "}
          {application.reviewedAt
            ? new Date(application.reviewedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—"}
          {application.reviewNote && (
            <p className="mt-1 text-xs opacity-80">
              Note: {application.reviewNote}
            </p>
          )}
          {application.createdUser && (
            <p className="mt-1 text-xs">
              Portal account created:{" "}
              <Link
                href={`/dashboard/users/${application.createdUser.id}`}
                className="underline underline-offset-2"
              >
                {application.createdUser.fullName}
              </Link>
            </p>
          )}
        </div>
      )}

      {/* Details grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard icon={Mail} label="Email" value={application.email} />
        <InfoCard
          icon={Phone}
          label="Phone"
          value={application.phone ?? "Not provided"}
        />
        {application.country && (
          <InfoCard icon={Globe} label="Country" value={application.country} />
        )}
        <InfoCard
          icon={MapPin}
          label="Full Address"
          value={application.fullAddress}
          wide={!application.country}
        />
        <InfoCard
          icon={Briefcase}
          label="Specialization"
          value={application.specialization}
          wide
        />
      </div>

      {/* Acknowledgements */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Acknowledgements
        </h2>
        <div className="space-y-2">
          <AckRow
            checked={application.acceptsSelfFunding}
            label="Accepts responsibility for own expenses (airfare, hotel, meals, personal costs)"
          />
          <AckRow
            checked={application.requestsInvitationLetter}
            label="Requests an official invitation letter from 1000MM"
          />
        </div>
      </div>

      {/* Documents */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          Submitted Documents
        </h2>
        <div className="space-y-2">
          <DocRow
            icon={FileText}
            label="Curriculum Vitae (CV)"
            storageKey={application.cvStorageKey}
          />
          <DocRow
            icon={CreditCard}
            label="Passport"
            storageKey={application.passportStorageKey}
          />
          <DocRow
            icon={Camera}
            label="Passport-sized Photo"
            storageKey={application.photoStorageKey}
          />
        </div>
      </div>

      {/* Official letters */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Official Letters</h2>
        <div className="space-y-4">
          {/* Invitation */}
          <div>
            <div className="flex items-center gap-3">
              <a
                href={`/api/export/trainer-letter?id=${application.id}&type=invitation`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Invitation Letter
              </a>
              {application.invitationLetterBody && (
                <span className="text-xs text-teal-600 font-medium">● Customized</span>
              )}
            </div>
            <EditLetterForm
              applicationId={application.id}
              letterType="invitation"
              defaultBody={application.invitationLetterBody ?? `We are pleased to invite you to serve as a Trainer with the 1000 Missionary Movement Bangladesh (1000MM BD) programme. Your application has been reviewed and we would like to formally extend an invitation for you to participate in our upcoming training sessions.\n\nThe 1000 Missionary Movement Bangladesh is a national mission initiative aimed at training and deploying missionaries across Bangladesh. As a Trainer, you will play a vital role in equipping participants with the spiritual and practical tools necessary for effective missionary work.\n\nYour area of specialisation — ${application.specialization} — aligns well with the needs of our programme. We look forward to welcoming you to our team.\n\nPlease present this letter along with a valid form of identification upon your arrival. For any queries regarding logistics or programme details, do not hesitate to contact our office.`}
              requiredDoc1={application.requiredDoc1}
              requiredDoc2={application.requiredDoc2}
              requiredDoc3={application.requiredDoc3}
              requiredDoc4={application.requiredDoc4}
            />
          </div>

          {/* Recommendation */}
          <div>
            <div className="flex items-center gap-3">
              <a
                href={`/api/export/trainer-letter?id=${application.id}&type=recommendation`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Recommendation Letter
              </a>
              {application.recommendationLetterBody && (
                <span className="text-xs text-teal-600 font-medium">● Customized</span>
              )}
            </div>
            <EditLetterForm
              applicationId={application.id}
              letterType="recommendation"
              defaultBody={application.recommendationLetterBody ?? `This letter serves as a formal recommendation for ${application.fullName} as a prospective Trainer with the 1000 Missionary Movement Bangladesh (1000MM BD) programme.\n\n${application.fullName} has applied to serve as a Trainer within our organisation and their application has been thoroughly reviewed. Based on their stated expertise in ${application.specialization} and their background as presented in their application, we find them to be a suitable candidate for the Trainer role.\n\nWe commend ${application.fullName} to any institution or organisation that may require confirmation of their participation and standing with the 1000 Missionary Movement Bangladesh.`}
            />
          </div>
        </div>
      </div>

      {/* Admin attachments */}
      <AttachDocumentPanel
        applicationId={application.id}
        attachments={application.attachments}
      />

      {/* Action panel — only for pending */}
      {isPending && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Review Decision
          </h2>

          {/* Approve form */}
          <form
            action={approveTrainerApplicationAction}
            className="mb-6 space-y-4"
          >
            <input type="hidden" name="applicationId" value={application.id} />
            <h3 className="text-sm font-medium text-gray-800">
              Approve & Create Account
            </h3>

            <TopicAssignSelect
              programs={programs.map((p) => ({
                id: p.id,
                code: p.code,
                title: p.title,
                topics: p.topics.map((t) => ({
                  id: t.id,
                  title: t.title,
                  hasTrainer: !!t.trainerId,
                })),
              }))}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Internal Note (optional)
              </label>
              <textarea
                name="reviewNote"
                rows={2}
                placeholder="Any notes for your records…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <p className="text-xs text-gray-400">
              Approving will create a TRAINER account and email a password-setup
              link to <strong>{application.email}</strong>. The link expires in
              7 days.
            </p>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Approve & Send Account Link
            </button>
          </form>

          <hr className="border-gray-100" />

          {/* Reject form */}
          <form
            action={rejectTrainerApplicationAction}
            className="mt-6 space-y-3"
          >
            <input type="hidden" name="applicationId" value={application.id} />
            <h3 className="text-sm font-medium text-gray-800">
              Reject Application
            </h3>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Reason / Note (optional)
              </label>
              <textarea
                name="reviewNote"
                rows={2}
                placeholder="Reason for rejection (visible in your records, optionally emailed to applicant)…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <XCircle className="h-4 w-4" />
              Reject Application
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  wide,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${wide ? "sm:col-span-2" : ""}`}
    >
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="whitespace-pre-wrap text-sm text-gray-800">{value}</p>
    </div>
  );
}

function DocRow({
  icon: Icon,
  label,
  storageKey,
}: {
  icon: React.ElementType;
  label: string;
  storageKey: string | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
      <div className="flex items-center gap-2.5 text-sm text-gray-700">
        <Icon className="h-4 w-4 text-gray-400" />
        {label}
      </div>
      {storageKey ? (
        <a
          href={`/api/uploads/${storageKey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
        >
          View <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="text-xs text-gray-400">Not uploaded</span>
      )}
    </div>
  );
}

function AckRow({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <div
        className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
          checked ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"
        }`}
      >
        {checked && (
          <svg
            className="h-2.5 w-2.5 text-white"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span className={checked ? "text-gray-700" : "text-gray-400"}>
        {label}
      </span>
    </div>
  );
}
