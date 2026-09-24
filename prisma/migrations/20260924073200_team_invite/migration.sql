-- CreateTable
CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "social" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "whyJoin" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "portfolio" TEXT,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamInvite_createdAt_idx" ON "TeamInvite"("createdAt");

-- CreateIndex
CREATE INDEX "TeamInvite_role_idx" ON "TeamInvite"("role");

-- CreateIndex
CREATE INDEX "TeamInvite_fingerprint_createdAt_idx" ON "TeamInvite"("fingerprint", "createdAt");
