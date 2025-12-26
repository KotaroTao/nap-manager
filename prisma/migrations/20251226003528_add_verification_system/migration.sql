-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('match', 'partialMatch', 'mismatch', 'notFound', 'error');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('verified', 'mismatch', 'needsReview', 'notFound', 'error', 'pending');

-- AlterTable: sites - NAP検証用フィールド追加
ALTER TABLE "sites" ADD COLUMN "search_url_template" TEXT;
ALTER TABLE "sites" ADD COLUMN "clinic_page_pattern" TEXT;
ALTER TABLE "sites" ADD COLUMN "nap_selectors" JSONB;

-- AlterTable: clinic_sites - NAP検証用フィールド追加
ALTER TABLE "clinic_sites" ADD COLUMN "last_verified_at" TIMESTAMP(3);
ALTER TABLE "clinic_sites" ADD COLUMN "verification_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: verification_logs
CREATE TABLE "verification_logs" (
    "id" TEXT NOT NULL,
    "clinic_site_id" TEXT NOT NULL,
    "search_query" TEXT NOT NULL,
    "found_url" TEXT,
    "detected_name" TEXT,
    "detected_address" TEXT,
    "detected_phone" TEXT,
    "name_match" "MatchStatus" NOT NULL,
    "address_match" "MatchStatus" NOT NULL,
    "phone_match" "MatchStatus" NOT NULL,
    "overall_status" "VerificationStatus" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "raw_response" TEXT,
    "error_message" TEXT,
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_logs_clinic_site_id_idx" ON "verification_logs"("clinic_site_id");

-- CreateIndex
CREATE INDEX "verification_logs_verified_at_idx" ON "verification_logs"("verified_at");

-- CreateIndex
CREATE INDEX "verification_logs_overall_status_idx" ON "verification_logs"("overall_status");

-- AddForeignKey
ALTER TABLE "verification_logs" ADD CONSTRAINT "verification_logs_clinic_site_id_fkey" FOREIGN KEY ("clinic_site_id") REFERENCES "clinic_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
