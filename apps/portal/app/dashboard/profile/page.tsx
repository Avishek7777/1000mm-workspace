import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { ProfilePictureUpload } from "./_components/ProfilePictureUpload";
import { ChangePasswordForm } from "./_components/ChangePasswordForm";
import { EditProfileForm } from "./_components/EditProfileForm";

const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: "System Admin",
  MAIN_DIRECTOR: "Union Director",
  LOCAL_DIRECTOR: "Local Director",
  TRAINER: "Trainer",
  TRAINEE: "Trainee",
};

export default async function ProfilePage() {
  const sessionUser = await requireAuth();
  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      fullName: true,
      fullNameBangla: true,
      email: true,
      phone: true,
      profilePicture: true,
      role: true,
      createdAt: true,
      homeMission: { select: { name: true, code: true } },
    },
  });

  if (!dbUser) redirect("/login");

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-lg font-semibold text-gray-900">My Profile</h1>

      <ProfilePictureUpload
        currentImage={dbUser.profilePicture}
        displayName={dbUser.fullName}
      />

      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <Row label="Full name" value={dbUser.fullName} />
        {dbUser.fullNameBangla && <Row label="নাম" value={dbUser.fullNameBangla} />}
        <Row label="Email" value={dbUser.email} />
        {dbUser.phone && <Row label="Phone" value={dbUser.phone} />}
        <Row
          label="Role"
          value={`${ROLE_LABELS[dbUser.role] ?? dbUser.role} · ${dbUser.homeMission?.name ?? "—"} (${dbUser.homeMission?.code ?? "—"})`}
        />
        <Row
          label="Member since"
          value={dbUser.createdAt.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        />
      </div>

      <EditProfileForm
        currentName={dbUser.fullName}
        currentNameBangla={dbUser.fullNameBangla}
        currentPhone={dbUser.phone}
      />

      <ChangePasswordForm />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
