-- Outbound messages must never make a contact look like a new incoming lead.
ALTER TABLE "Contact" ADD COLUMN "leadActivityAt" TIMESTAMP(3);
UPDATE "Contact" SET "leadActivityAt" = "createdAt";
UPDATE "Contact" AS contact
SET "leadActivityAt" = GREATEST(contact."createdAt", inbound."lastInboundAt")
FROM (
  SELECT "contactId", MAX(LEAST("sentAt", CURRENT_TIMESTAMP)) AS "lastInboundAt"
  FROM "Message" WHERE "direction" = 'INBOUND'
  GROUP BY "contactId"
) AS inbound
WHERE contact."id" = inbound."contactId";
ALTER TABLE "Contact" ALTER COLUMN "leadActivityAt" SET NOT NULL;
ALTER TABLE "Contact" ALTER COLUMN "leadActivityAt" SET DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "Contact_leadActivityAt_id_idx" ON "Contact"("leadActivityAt", "id");
