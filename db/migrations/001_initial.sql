-- Original pilot schema, retained for existing installations.
CREATE TYPE "TaskStatus" AS ENUM ('OFFERED', 'ACCEPTED', 'COMPLETED', 'PARTIAL', 'SKIPPED', 'REPLACED');
CREATE TYPE "AssessmentKind" AS ENUM ('INITIAL', 'MONTHLY');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "emailVerified" TIMESTAMP(3),
  "name" TEXT,
  "image" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Almaty',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

CREATE TABLE "Sphere" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  CONSTRAINT "Sphere_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Sphere_position_key" ON "Sphere"("position");

CREATE TABLE "Assessment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sphereId" TEXT NOT NULL,
  "score" INTEGER,
  "kind" "AssessmentKind" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Assessment_userId_createdAt_idx" ON "Assessment"("userId", "createdAt");

CREATE TABLE "Goal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sphereId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "minimum" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskTemplate" (
  "id" TEXT NOT NULL,
  "sphereId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "minimumText" TEXT NOT NULL,
  "normalText" TEXT NOT NULL,
  "expandedText" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "published" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskInstance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "localDate" TEXT NOT NULL,
  "variant" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'OFFERED',
  "replacedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskInstance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaskInstance_replacedById_key" ON "TaskInstance"("replacedById");
CREATE INDEX "TaskInstance_userId_localDate_idx" ON "TaskInstance"("userId", "localDate");

CREATE TABLE "TaskReport" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "note" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TaskReport_userId_occurredAt_idx" ON "TaskReport"("userId", "occurredAt");

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_sphereId_fkey" FOREIGN KEY ("sphereId") REFERENCES "Sphere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_sphereId_fkey" FOREIGN KEY ("sphereId") REFERENCES "Sphere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskInstance" ADD CONSTRAINT "TaskInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskReport" ADD CONSTRAINT "TaskReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskReport" ADD CONSTRAINT "TaskReport_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
