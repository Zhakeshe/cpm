-- CreateTable
CREATE TABLE "ScrimmageRegistration" (
    "id" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamNumber" TEXT,
    "school" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "captainName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "memberCount" INTEGER NOT NULL,
    "ftcExperience" TEXT NOT NULL,
    "robotStatus" TEXT NOT NULL,
    "testingAreas" TEXT[],
    "comment" TEXT,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrimmageRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScrimmageRegistration_fingerprint_createdAt_idx" ON "ScrimmageRegistration"("fingerprint", "createdAt");

-- CreateIndex
CREATE INDEX "ScrimmageRegistration_school_idx" ON "ScrimmageRegistration"("school");

-- CreateIndex
CREATE INDEX "ScrimmageRegistration_createdAt_idx" ON "ScrimmageRegistration"("createdAt");

-- CreateIndex
CREATE INDEX "ScrimmageRegistration_ftcExperience_idx" ON "ScrimmageRegistration"("ftcExperience");
