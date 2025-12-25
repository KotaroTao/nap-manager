-- CreateEnum
CREATE TYPE "SiteType1" AS ENUM ('paid', 'free', 'approval');

-- CreateEnum
CREATE TYPE "SiteType2" AS ENUM ('sns', 'portal', 'job', 'other');

-- CreateEnum
CREATE TYPE "EditMethod" AS ENUM ('form', 'email', 'phone', 'other');

-- CreateEnum
CREATE TYPE "Importance" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "SeoImpact" AS ENUM ('large', 'medium', 'small', 'none');

-- CreateEnum
CREATE TYPE "SiteCategory" AS ENUM ('master', 'auto', 'manual');

-- CreateEnum
CREATE TYPE "ClinicSiteStatus" AS ENUM ('matched', 'needsReview', 'mismatched', 'unregistered', 'unchecked', 'inaccessible');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('urgent', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "CorrectionRequestStatus" AS ENUM ('pending', 'requested', 'inProgress', 'completed', 'impossible', 'onHold');

-- CreateEnum
CREATE TYPE "RequestMethod" AS ENUM ('form', 'email', 'phone', 'other');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_kana" TEXT,
    "postal_code" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fax" TEXT,
    "email" TEXT,
    "website" TEXT,
    "business_hours" TEXT,
    "closed_days" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_naps" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "old_name" TEXT,
    "old_address" TEXT,
    "old_phone" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinic_naps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "register_url" TEXT,
    "edit_url" TEXT,
    "type_1" "SiteType1" NOT NULL,
    "type_2" "SiteType2" NOT NULL,
    "edit_method" "EditMethod" NOT NULL,
    "importance" "Importance" NOT NULL,
    "seo_impact" "SeoImpact" NOT NULL,
    "template" TEXT,
    "comment" TEXT,
    "site_type" "SiteCategory" NOT NULL DEFAULT 'master',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_sites" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "page_url" TEXT,
    "status" "ClinicSiteStatus" NOT NULL DEFAULT 'unchecked',
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "priority_score" INTEGER NOT NULL DEFAULT 0,
    "detected_name" TEXT,
    "detected_address" TEXT,
    "detected_phone" TEXT,
    "last_checked_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correction_requests" (
    "id" TEXT NOT NULL,
    "clinic_site_id" TEXT NOT NULL,
    "status" "CorrectionRequestStatus" NOT NULL DEFAULT 'pending',
    "request_method" "RequestMethod",
    "template_text" TEXT,
    "requested_at" TIMESTAMP(3),
    "reminder_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correction_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_histories" (
    "id" TEXT NOT NULL,
    "correction_request_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "attachment_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "new_mismatch" BOOLEAN NOT NULL DEFAULT true,
    "weekly_summary" BOOLEAN NOT NULL DEFAULT true,
    "follow_up_reminder" BOOLEAN NOT NULL DEFAULT true,
    "access_error" BOOLEAN NOT NULL DEFAULT false,
    "reminder_days" INTEGER NOT NULL DEFAULT 7,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_sites_clinic_id_site_id_key" ON "clinic_sites"("clinic_id", "site_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_admin_id_key" ON "notification_settings"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- AddForeignKey
ALTER TABLE "clinic_naps" ADD CONSTRAINT "clinic_naps_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_sites" ADD CONSTRAINT "clinic_sites_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_sites" ADD CONSTRAINT "clinic_sites_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_requests" ADD CONSTRAINT "correction_requests_clinic_site_id_fkey" FOREIGN KEY ("clinic_site_id") REFERENCES "clinic_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_histories" ADD CONSTRAINT "request_histories_correction_request_id_fkey" FOREIGN KEY ("correction_request_id") REFERENCES "correction_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
