-- AlterTable
ALTER TABLE "member_translations" ADD COLUMN     "imageAlt" TEXT;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "imageAuthor" TEXT,
ADD COLUMN     "imageDate" DATE,
ADD COLUMN     "imageFocus" TEXT,
ADD COLUMN     "imageHeight" INTEGER,
ADD COLUMN     "imageLicense" TEXT,
ADD COLUMN     "imageLicenseUrl" TEXT,
ADD COLUMN     "imageSource" TEXT,
ADD COLUMN     "imageWidth" INTEGER;
