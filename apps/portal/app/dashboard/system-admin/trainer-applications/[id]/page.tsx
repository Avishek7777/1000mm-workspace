// apps/portal/app/dashboard/system-admin/trainer-applications/[id]/page.tsx

import { db } from "@1000mm/db";
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
  TicketCheck,
} from "lucide-react";
import {
  approveTrainerApplicationAction,
  rejectTrainerApplicationAction,
} from "@/actions/trainerApplications";

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

  const [application, missions] = await Promise.all([
    db.trainerApplication.findUnique({
      where: { id },
      include: {
        reviewedBy: { select: { fullName: true } },
        createdUser: { select: { id: true, fullName: true, role: true } },
      },
    }),
    db.localMission.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!application) notFound();

  const isPending = application.status === "PENDING";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back + header */}
      <div>
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
        <InfoCard
          icon={MapPin}
          label="Full Address"
          value={application.fullAddress}
          wide
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Assign Home Mission <span className="text-red-500">*</span>
              </label>
              <select
                name="homeMissionId"
                required
                defaultValue=""
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select a mission…
                </option>
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            </div>

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
