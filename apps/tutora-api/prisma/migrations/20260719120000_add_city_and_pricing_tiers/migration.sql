-- CreateEnum
CREATE TYPE "PricingPeriod" AS ENUM ('HOURLY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- AlterTable: add District.cityId as nullable first so existing rows can be backfilled.
ALTER TABLE "District" ADD COLUMN "cityId" TEXT;

-- Backfill: every district that existed before this migration was a Baku
-- district (the only city seeded so far); create that City row and point the
-- existing districts at it before the column is made required.
INSERT INTO "City" ("id", "name", "slug", "createdAt", "updatedAt")
SELECT 'cty_' || substr(md5(random()::text || clock_timestamp()::text), 1, 22), 'Baku', 'baku', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "City" WHERE "slug" = 'baku');

UPDATE "District"
SET "cityId" = (SELECT "id" FROM "City" WHERE "slug" = 'baku')
WHERE "cityId" IS NULL;

-- AlterTable: cityId is now backfilled for every existing row, make it required.
ALTER TABLE "District" ALTER COLUMN "cityId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "District_cityId_idx" ON "District"("cityId");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PricingTier" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "tutorSubjectId" TEXT,
    "period" "PricingPeriod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingTier_pkey" PRIMARY KEY ("id")
);

-- Backfill: one HOURLY base tier per existing tutor profile, copied from the
-- scalar rate column that this migration is about to drop.
INSERT INTO "PricingTier" ("id", "tutorId", "tutorSubjectId", "period", "amount", "createdAt", "updatedAt")
SELECT 'prt_' || substr(md5(random()::text || clock_timestamp()::text || "id"), 1, 22), "id", NULL, 'HOURLY', "hourlyRate", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "TutorProfile";

-- Backfill: one HOURLY subject-override tier per existing non-null priceOverride.
INSERT INTO "PricingTier" ("id", "tutorId", "tutorSubjectId", "period", "amount", "createdAt", "updatedAt")
SELECT 'prt_' || substr(md5(random()::text || clock_timestamp()::text || "id"), 1, 22), "tutorId", "id", 'HOURLY', "priceOverride", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "TutorSubject"
WHERE "priceOverride" IS NOT NULL;

-- CreateIndex
CREATE INDEX "PricingTier_tutorSubjectId_idx" ON "PricingTier"("tutorSubjectId");

-- CreateIndex
CREATE INDEX "PricingTier_tutorId_period_idx" ON "PricingTier"("tutorId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "PricingTier_tutorId_tutorSubjectId_period_key" ON "PricingTier"("tutorId", "tutorSubjectId", "period");

-- CreateIndex: Postgres treats NULL as distinct under the composite unique
-- index above, so the base-rate rows (tutorSubjectId IS NULL) need this
-- partial index to actually enforce "one row per tutor+period" at the DB
-- level; the service layer relies on it instead of a transaction-level lock.
CREATE UNIQUE INDEX "PricingTier_base_rate_tutorId_period_key" ON "PricingTier"("tutorId", "period") WHERE "tutorSubjectId" IS NULL;

-- AddForeignKey
ALTER TABLE "PricingTier" ADD CONSTRAINT "PricingTier_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingTier" ADD CONSTRAINT "PricingTier_tutorSubjectId_fkey" FOREIGN KEY ("tutorSubjectId") REFERENCES "TutorSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: add the denormalized search cache column, copy the existing
-- rate into it, then drop the scalar column now that PricingTier owns pricing.
ALTER TABLE "TutorProfile" ADD COLUMN "hourlyRateCache" DECIMAL(10,2);

UPDATE "TutorProfile" SET "hourlyRateCache" = "hourlyRate";

ALTER TABLE "TutorProfile" DROP COLUMN "hourlyRate";

-- DropIndex
DROP INDEX "TutorProfile_hourlyRate_idx";

-- CreateIndex
CREATE INDEX "TutorProfile_hourlyRateCache_idx" ON "TutorProfile"("hourlyRateCache");

-- AlterTable
ALTER TABLE "TutorSubject" DROP COLUMN "priceOverride";
