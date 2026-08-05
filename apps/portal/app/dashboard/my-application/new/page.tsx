import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import { BioDataForm } from "./_components/BioDataForm";

export default async function NewApplicationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Check if there's already a submitted/active application.
  //
  // RETURNED_TO_APPLICANT is deliberately exempt: a returned application is
  // the applicant's to edit again, and the "Edit & Resubmit" buttons on
  // /dashboard/my-application and /dashboard/trainee link straight here.
  // Treating it as "already submitted" bounced them back to the page they
  // came from, so the button appeared to do nothing at all.
  const existingSubmitted = await prisma.application.findFirst({
    where: {
      applicantId: userId,
      deletedAt: null,
      status: {
        notIn: ["DRAFT", "WITHDRAWN", "RETURNED_TO_APPLICANT"],
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
  const isReturned =
    isReapply && previousApplication?.status === "RETURNED_TO_APPLICANT";

  return (
    <div className="min-h-screen bg-gray-50">
      {isReapply && (
        <div className="mx-auto max-w-3xl px-6 pt-6">
          {isReturned ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
              <strong>Application returned.</strong> Your application was sent
              back for changes and is pre-filled below. Update the fields
              mentioned in the reviewer&rsquo;s comment, then submit again.
              {previousApplication?.lmdReviewerComment && (
                <p className="mt-2 border-t border-amber-200 pt-2 text-amber-800">
                  <span className="font-medium">Reviewer&rsquo;s comment:</span>{" "}
                  {previousApplication.lmdReviewerComment}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm text-blue-800">
              <strong>Re-applying?</strong> We&rsquo;ve pre-filled the form with
              your previous application data. Please review all fields before
              submitting — some information may have changed.
            </div>
          )}
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
                documents: formSource.documents,
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
                districtPastorName:
                  (
                    formSource.formData as Record<string, unknown>
                  )?.districtPastorName?.toString() ?? "",
                districtPastorMobile:
                  (
                    formSource.formData as Record<string, unknown>
                  )?.districtPastorMobile?.toString() ?? "",
                districtPastorEmail:
                  (
                    formSource.formData as Record<string, unknown>
                  )?.districtPastorEmail?.toString() ?? "",
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
