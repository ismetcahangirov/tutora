-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('LANDING_SECTION', 'FAQ', 'BLOG_POST');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "ContentEntry" (
    "id" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentEntry_type_status_order_idx" ON "ContentEntry"("type", "status", "order");

-- CreateIndex
CREATE INDEX "ContentEntry_status_publishedAt_idx" ON "ContentEntry"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "ContentEntry_authorId_idx" ON "ContentEntry"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentEntry_type_locale_slug_key" ON "ContentEntry"("type", "locale", "slug");

-- AddForeignKey
ALTER TABLE "ContentEntry" ADD CONSTRAINT "ContentEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
