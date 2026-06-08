import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import { BioDataForm } from "./_components/BioDataForm";

export default async function NewApplicationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Check if there's already a submitted/active application
  const existingSubmitted = await prisma.application.findFirst({
    where: {
      applicantId: userId,
      deletedAt: null,
      status: {
        notIn: ["DRAFT", "WITHDRAWN"],
      },
    },
  });

  if (existingSubmitted) {
    redirect("/dashboard/my-application");
  }

  // Get user + mission
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { homeMission: true },
  });

  // Check for open window
  const activeWindow = await prisma.applicationWindow.findFirst({
    where: {
      state: "OPEN",
      deletedAt: null,
      applicationCloseDate: { gte: new Date() },
      OR: [
        { scopedToMissionId: null },
        { scopedToMissionId: user?.homeMissionId },
      ],
    },
    include: { program: true },
    orderBy: { applicationOpenDate: "desc" },
  });

  // Fetch full draft (with formData + documents) so pages can be hydrated
  const existingDraft = await prisma.application.findFirst({
    where: {
      applicantId: userId,
      status: "DRAFT",
      deletedAt: null,
    },
    include: {
      documents: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Role guard — only TRAINEE can access this page
  if (!user || user.role !== "TRAINEE") redirect("/dashboard");

  // Re-apply flow: if no DRAFT exists, fall back to most recent previous
  // application to pre-populate the form for returning applicants
  const previousApplication = !existingDraft
    ? await prisma.application.findFirst({
        where: {
          applicantId: userId,
          deletedAt: null,
          status: { notIn: ["DRAFT", "WITHDRAWN"] },
        },
        orderBy: { submittedAt: "desc" },
        include: {
          documents: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
          },
        },
      })
    : null;

  // Use draft if exists, otherwise fall back to previous application
  const formSource = existingDraft ?? previousApplication;
  const isReapply = !existingDraft && !!previousApplication;

  return (
    <div className="min-h-screen bg-gray-50">
      {isReapply && (
        <div className="mx-auto max-w-3xl px-6 pt-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm text-blue-800">
            <strong>Re-applying?</strong> We've pre-filled the form with your
            previous application data. Please review all fields before
            submitting — some information may have changed.
          </div>
        </div>
      )}
      <BioDataForm
        applicantName={user?.fullName ?? ""}
        missionCode={user?.homeMission?.code ?? ""}
        missionName={user?.homeMission?.name ?? ""}
        windowOpen={!!activeWindow}
        windowCloseDate={
          activeWindow?.applicationCloseDate?.toISOString() ?? null
        }
        programTitle={activeWindow?.program?.title ?? null}
        existingDraft={
          formSource
            ? {
                id: formSource.id,
                // Page 1 — personal details
                applicantFullName: formSource.applicantFullName ?? "",
                applicantFullNameBangla:
                  formSource.applicantFullNameBangla ?? "",
                applicantDateOfBirth: formSource.applicantDateOfBirth
                  ? formSource.applicantDateOfBirth.toISOString().split("T")[0]
                  : "",
                applicantGender: formSource.applicantGender ?? "",
                applicantBloodType: formSource.applicantBloodType ?? "",
                applicantMaritalStatus: formSource.applicantMaritalStatus ?? "",
                applicantDenomination: formSource.applicantDenomination ?? "",
                applicantMobileNo: formSource.applicantMobileNo ?? "",
                applicantEmail: formSource.applicantEmail ?? "",
                applicantPlaceOfBirth: formSource.applicantPlaceOfBirth ?? "",
                applicantHeight: formSource.applicantHeight ?? "",
                applicantWeight: formSource.applicantWeight ?? "",
                applicantChurchName: formSource.applicantChurchName ?? "",
                applicantDateOfBaptism: formSource.applicantDateOfBaptism
                  ? formSource.applicantDateOfBaptism
                      .toISOString()
                      .split("T")[0]
                  : "",
                applicantWorkplace: formSource.applicantWorkplace ?? "",
                presentAddressDistrict: formSource.presentAddressDistrict ?? "",
                presentAddressUpazila: formSource.presentAddressUpazila ?? "",
                presentAddressPostOffice:
                  formSource.presentAddressPostOffice ?? "",
                presentAddressVillage: formSource.presentAddressVillage ?? "",
                permanentSameAsPresent:
                  formSource.permanentSameAsPresent ?? false,
                permanentAddressDistrict:
                  formSource.permanentAddressDistrict ?? "",
                permanentAddressUpazila:
                  formSource.permanentAddressUpazila ?? "",
                permanentAddressPostOffice:
                  formSource.permanentAddressPostOffice ?? "",
                permanentAddressVillage:
                  formSource.permanentAddressVillage ?? "",
                // Page 2 — family details
                fatherName: formSource.fatherName ?? "",
                fatherAge: formSource.fatherAge ?? "",
                fatherReligion: formSource.fatherReligion ?? "",
                fatherChurchName: formSource.fatherChurchName ?? "",
                motherName: formSource.motherName ?? "",
                motherAge: formSource.motherAge ?? "",
                motherReligion: formSource.motherReligion ?? "",
                motherChurchName: formSource.motherChurchName ?? "",
                familyMobileNo: formSource.familyMobileNo ?? "",
                familyEmail: formSource.familyEmail ?? "",
                // Page 3 — education (from formData JSON)
                educationEntries:
                  ((formSource.formData as Record<string, unknown>)
                    ?.education as Array<{
                    id: string;
                    degree: string;
                    institutionName: string;
                    gpa: string;
                    passingYear: string;
                  }> | null) ?? null,
                // Page 4 — application section (from formData JSON)
                missionaryDesire:
                  (
                    formSource.formData as Record<string, unknown>
                  )?.missionaryDesire?.toString() ?? "",
                courtRecord:
                  (formSource.formData as Record<string, unknown>)
                    ?.courtRecord != null
                    ? String(
                        (formSource.formData as Record<string, unknown>)
                          .courtRecord,
                      )
                    : "",
                healthCondition:
                  (formSource.formData as Record<string, unknown>)
                    ?.healthCondition != null
                    ? String(
                        (formSource.formData as Record<string, unknown>)
                          .healthCondition,
                      )
                    : "",
                badHabits:
                  (formSource.formData as Record<string, unknown>)?.badHabits !=
                  null
                    ? String(
                        (formSource.formData as Record<string, unknown>)
                          .badHabits,
                      )
                    : "",
              }
            : null
        }
      />
    </div>
  );
}
