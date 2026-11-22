-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "cvFileName" TEXT,
ADD COLUMN     "cvKey" TEXT,
ADD COLUMN     "cvSize" INTEGER,
ADD COLUMN     "cvUpdatedAt" TIMESTAMP(3);
