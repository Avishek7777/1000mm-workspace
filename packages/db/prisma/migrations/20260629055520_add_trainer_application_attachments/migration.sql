-- CreateTable
CREATE TABLE "trainer_application_attachments" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "label" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainer_application_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trainer_application_attachments_applicationId_idx" ON "trainer_application_attachments"("applicationId");

-- AddForeignKey
ALTER TABLE "trainer_application_attachments" ADD CONSTRAINT "trainer_application_attachments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "trainer_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_application_attachments" ADD CONSTRAINT "trainer_application_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
