import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import { BioDataForm } from "./_components/BioDataForm";

export default async function NewApplicationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  if (session.user.role !== "TRAINEE") redirect("/dashboard");

  // Check if there's already a submitted/active application
  const existingSubmitted = await prisma.application.findFirst({
    where: {
      applicantId: userId,
      deletedAt: null,
      status: { notIn: ["DRAFT", "WITHDRAWN"] },
    },
  });
  if (existingSubmitted) redirect("/dashboard/my-application");

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

  // Fetch full draft including uploaded documents
  const existingDraft = await prisma.application.findFirst({
    where: { applicantId: userId, status: "DRAFT", deletedAt: null },
    include: {
      documents: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: { kind: true, fileName: true, educationEntryIndex: true },
      },
    },
  });

  const fd = existingDraft?.formData as Record<string, unknown> | null;

  return (
    <div className="min-h-screen bg-gray-50">
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
          existingDraft
            ? {
                id: existingDraft.id,
                // Page 1
                applicantFullName: existingDraft.applicantFullName ?? "",
                applicantFullNameBangla:
                  existingDraft.applicantFullNameBangla ?? "",
                applicantDateOfBirth: existingDraft.applicantDateOfBirth
                  ? existingDraft.applicantDateOfBirth
                      .toISOString()
                      .split("T")[0]
                  : "",
                applicantGender: existingDraft.applicantGender ?? "",
                applicantBloodType: existingDraft.applicantBloodType ?? "",
                applicantMaritalStatus:
                  existingDraft.applicantMaritalStatus ?? "",
                applicantDenomination:
                  existingDraft.applicantDenomination ?? "",
                applicantMobileNo: existingDraft.applicantMobileNo ?? "",
                applicantEmail: existingDraft.applicantEmail ?? "",
                applicantPlaceOfBirth:
                  existingDraft.applicantPlaceOfBirth ?? "",
                applicantHeight: existingDraft.applicantHeight ?? "",
                applicantWeight: existingDraft.applicantWeight ?? "",
                applicantChurchName: existingDraft.applicantChurchName ?? "",
                applicantDateOfBaptism: existingDraft.applicantDateOfBaptism
                  ? existingDraft.applicantDateOfBaptism
                      .toISOString()
                      .split("T")[0]
                  : "",
                applicantWorkplace: existingDraft.applicantWorkplace ?? "",
                presentAddressDistrict:
                  existingDraft.presentAddressDistrict ?? "",
                presentAddressUpazila:
                  existingDraft.presentAddressUpazila ?? "",
                presentAddressPostOffice:
                  existingDraft.presentAddressPostOffice ?? "",
                presentAddressVillage:
                  existingDraft.presentAddressVillage ?? "",
                permanentSameAsPresent:
                  existingDraft.permanentSameAsPresent ?? false,
                permanentAddressDistrict:
                  existingDraft.permanentAddressDistrict ?? "",
                permanentAddressUpazila:
                  existingDraft.permanentAddressUpazila ?? "",
                permanentAddressPostOffice:
                  existingDraft.permanentAddressPostOffice ?? "",
                permanentAddressVillage:
                  existingDraft.permanentAddressVillage ?? "",
                // Page 2
                fatherName: existingDraft.fatherName ?? "",
                fatherAge: existingDraft.fatherAge ?? "",
                fatherReligion: existingDraft.fatherReligion ?? "",
                fatherChurchName: existingDraft.fatherChurchName ?? "",
                motherName: existingDraft.motherName ?? "",
                motherAge: existingDraft.motherAge ?? "",
                motherReligion: existingDraft.motherReligion ?? "",
                motherChurchName: existingDraft.motherChurchName ?? "",
                familyMobileNo: existingDraft.familyMobileNo ?? "",
                familyEmail: existingDraft.familyEmail ?? "",
                // Page 3
                educationEntries:
                  (fd?.education as Array<{
                    id: string;
                    degree: string;
                    institutionName: string;
                    gpa: string;
                    passingYear: string;
                  }> | null) ?? null,
                // Page 4
                missionaryDesire: fd?.missionaryDesire?.toString() ?? "",
                courtRecord:
                  fd?.courtRecord != null ? String(fd.courtRecord) : "",
                healthCondition:
                  fd?.healthCondition != null ? String(fd.healthCondition) : "",
                badHabits: fd?.badHabits != null ? String(fd.badHabits) : "",
                // Uploaded documents
                documents: existingDraft.documents.map((doc) => ({
                  kind: doc.kind,
                  fileName: doc.fileName,
                  educationEntryIndex: doc.educationEntryIndex,
                })),
              }
            : null
        }
      />
    </div>
  );
}
