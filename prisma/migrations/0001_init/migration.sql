-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DimensionUnit" AS ENUM ('CM', 'IN', 'MM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medium" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Medium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkMedium" (
    "artworkId" TEXT NOT NULL,
    "mediumId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ArtworkMedium_pkey" PRIMARY KEY ("artworkId","mediumId")
);

-- CreateTable
CREATE TABLE "Artwork" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "height" DECIMAL(8,2),
    "width" DECIMAL(8,2),
    "depth" DECIMAL(8,2),
    "unit" "DimensionUnit" NOT NULL DEFAULT 'CM',
    "dimensionsNote" TEXT,
    "description" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkImage" (
    "id" TEXT NOT NULL,
    "artworkId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "blurDataUrl" TEXT,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ArtworkImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "artistName" TEXT NOT NULL DEFAULT 'Artist Name',
    "tagline" TEXT,
    "heroText" TEXT,
    "statementTitle" TEXT,
    "statement" TEXT,
    "bio" TEXT,
    "portraitKey" TEXT,
    "portraitWidth" INTEGER,
    "portraitHeight" INTEGER,
    "portraitBlur" TEXT,
    "email" TEXT,
    "location" TEXT,
    "instagram" TEXT,
    "website" TEXT,
    "seoDescription" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Medium_name_key" ON "Medium"("name");

-- CreateIndex
CREATE INDEX "ArtworkMedium_mediumId_idx" ON "ArtworkMedium"("mediumId");

-- CreateIndex
CREATE UNIQUE INDEX "Artwork_slug_key" ON "Artwork"("slug");

-- CreateIndex
CREATE INDEX "Artwork_published_year_idx" ON "Artwork"("published", "year");

-- CreateIndex
CREATE INDEX "Artwork_categoryId_idx" ON "Artwork"("categoryId");

-- CreateIndex
CREATE INDEX "Artwork_featured_idx" ON "Artwork"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "ArtworkImage_key_key" ON "ArtworkImage"("key");

-- CreateIndex
CREATE INDEX "ArtworkImage_artworkId_sortOrder_idx" ON "ArtworkImage"("artworkId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ArtworkMedium" ADD CONSTRAINT "ArtworkMedium_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtworkMedium" ADD CONSTRAINT "ArtworkMedium_mediumId_fkey" FOREIGN KEY ("mediumId") REFERENCES "Medium"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtworkImage" ADD CONSTRAINT "ArtworkImage_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
