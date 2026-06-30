-- CreateTable
CREATE TABLE "testimonies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'from-green-400 to-emerald-600',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testimonies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "testimonies_isPublished_idx" ON "testimonies"("isPublished");
