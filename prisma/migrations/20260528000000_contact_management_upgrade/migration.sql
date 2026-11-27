-- Contact management upgrade
-- Preserve existing ContactSubmission data.

-- New enums
CREATE TYPE "ContactPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "ContactReplyStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- Migrate SubmissionStatus enum safely
ALTER TYPE "SubmissionStatus" RENAME TO "SubmissionStatus_old";
CREATE TYPE "SubmissionStatus" AS ENUM ('NEW', 'READ', 'IN_PROGRESS', 'REPLIED', 'ARCHIVED', 'SPAM');

ALTER TABLE "ContactSubmission"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "SubmissionStatus" USING (
    CASE "status"::text
      WHEN 'new' THEN 'NEW'
      WHEN 'reviewed' THEN 'READ'
      WHEN 'resolved' THEN 'REPLIED'
      WHEN 'spam' THEN 'SPAM'
      ELSE 'NEW'
    END
  )::"SubmissionStatus",
  ALTER COLUMN "status" SET DEFAULT 'NEW';

DROP TYPE "SubmissionStatus_old";

-- Extend ContactSubmission
ALTER TABLE "ContactSubmission"
  ADD COLUMN "priority" "ContactPriority" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "assignedToId" TEXT,
  ADD COLUMN "readAt" TIMESTAMP(3),
  ADD COLUMN "repliedAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "spamAt" TIMESTAMP(3);

CREATE INDEX "ContactSubmission_status_createdAt_idx" ON "ContactSubmission"("status", "createdAt");
CREATE INDEX "ContactSubmission_priority_createdAt_idx" ON "ContactSubmission"("priority", "createdAt");
CREATE INDEX "ContactSubmission_assignedToId_createdAt_idx" ON "ContactSubmission"("assignedToId", "createdAt");
CREATE INDEX "ContactSubmission_email_idx" ON "ContactSubmission"("email");
CREATE INDEX "ContactSubmission_createdAt_idx" ON "ContactSubmission"("createdAt");

ALTER TABLE "ContactSubmission"
  ADD CONSTRAINT "ContactSubmission_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ContactReply
CREATE TABLE "ContactReply" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "actorId" TEXT,
  "actorEmail" TEXT,
  "toEmail" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "bodyText" TEXT NOT NULL,
  "bodyHtml" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'resend',
  "providerMessageId" TEXT,
  "status" "ContactReplyStatus" NOT NULL DEFAULT 'PENDING',
  "error" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactReply_submissionId_createdAt_idx" ON "ContactReply"("submissionId", "createdAt");
CREATE INDEX "ContactReply_actorId_idx" ON "ContactReply"("actorId");

ALTER TABLE "ContactReply"
  ADD CONSTRAINT "ContactReply_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ContactSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactReply"
  ADD CONSTRAINT "ContactReply_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ContactNote
CREATE TABLE "ContactNote" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "authorId" TEXT,
  "authorEmail" TEXT,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContactNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactNote_submissionId_createdAt_idx" ON "ContactNote"("submissionId", "createdAt");
CREATE INDEX "ContactNote_authorId_idx" ON "ContactNote"("authorId");

ALTER TABLE "ContactNote"
  ADD CONSTRAINT "ContactNote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ContactSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactNote"
  ADD CONSTRAINT "ContactNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ContactActivity
CREATE TABLE "ContactActivity" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "actorId" TEXT,
  "actorEmail" TEXT,
  "type" TEXT NOT NULL,
  "detail" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactActivity_submissionId_createdAt_idx" ON "ContactActivity"("submissionId", "createdAt");
CREATE INDEX "ContactActivity_type_idx" ON "ContactActivity"("type");

ALTER TABLE "ContactActivity"
  ADD CONSTRAINT "ContactActivity_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ContactSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactActivity"
  ADD CONSTRAINT "ContactActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
