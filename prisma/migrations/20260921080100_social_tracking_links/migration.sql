CREATE TABLE "TrackingChannel" (
    "slug" TEXT NOT NULL,
    "source" "ContactSource" NOT NULL,
    "title" TEXT NOT NULL,
    "greeting" TEXT NOT NULL DEFAULT '',
    "waPrefill" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingChannel_pkey" PRIMARY KEY ("slug")
);

CREATE TABLE "TrackingClick" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "source" "ContactSource" NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "convertedAt" TIMESTAMP(3),
    "contactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingClick_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrackingClick_token_key" ON "TrackingClick"("token");
CREATE INDEX "TrackingClick_slug_idx" ON "TrackingClick"("slug");
CREATE INDEX "TrackingClick_contactId_idx" ON "TrackingClick"("contactId");
CREATE INDEX "TrackingClick_createdAt_idx" ON "TrackingClick"("createdAt");

ALTER TABLE "TrackingClick" ADD CONSTRAINT "TrackingClick_slug_fkey" FOREIGN KEY ("slug") REFERENCES "TrackingChannel"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrackingClick" ADD CONSTRAINT "TrackingClick_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
