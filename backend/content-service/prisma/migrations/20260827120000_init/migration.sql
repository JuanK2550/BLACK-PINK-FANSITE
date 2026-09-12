-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "content";

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('es', 'en', 'ko');

-- CreateEnum
CREATE TYPE "AlbumType" AS ENUM ('SINGLE', 'EP', 'ALBUM', 'COMPILATION');

-- CreateEnum
CREATE TYPE "SoloWorkType" AS ENUM ('SINGLE', 'EP', 'ALBUM', 'COLLABORATION', 'OST', 'OTHER');

-- CreateEnum
CREATE TYPE "TimelineCategory" AS ENUM ('DEBUT', 'COMEBACK', 'AWARD', 'TOUR', 'RECORD', 'SOLO', 'OTHER');

-- CreateEnum
CREATE TYPE "TriviaCategory" AS ENUM ('GROUP', 'MEMBER', 'MUSIC', 'RECORD', 'FANDOM', 'STAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "QuizDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "koreanName" TEXT,
    "birthDate" DATE,
    "nationality" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "bio" TEXT,
    "imageUrl" TEXT,
    "colorAccent" TEXT,
    "socials" JSONB,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_translations" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "position" TEXT,
    "nickname" TEXT,
    "bio" TEXT,
    "description" TEXT,

    CONSTRAINT "member_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AlbumType" NOT NULL,
    "releaseDate" DATE NOT NULL,
    "coverUrl" TEXT,
    "label" TEXT,
    "description" TEXT,
    "spotifyId" TEXT,
    "youtubePlaylistId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_translations" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT,
    "formatLabel" TEXT,
    "description" TEXT,

    CONSTRAINT "album_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trackNumber" INTEGER NOT NULL,
    "durationSec" INTEGER,
    "isTitleTrack" BOOLEAN NOT NULL DEFAULT false,
    "spotifyId" TEXT,
    "youtubeId" TEXT,
    "lyricsAvailable" BOOLEAN NOT NULL DEFAULT false,
    "titleLocalized" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solo_works" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "SoloWorkType" NOT NULL,
    "releaseDate" DATE NOT NULL,
    "coverUrl" TEXT,
    "spotifyId" TEXT,
    "youtubeId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solo_works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solo_work_translations" (
    "id" TEXT NOT NULL,
    "soloWorkId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT,
    "formatLabel" TEXT,
    "description" TEXT,

    CONSTRAINT "solo_work_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "TimelineCategory" NOT NULL,
    "imageUrl" TEXT,
    "memberId" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 3,
    "datePrecision" TEXT NOT NULL DEFAULT 'day',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_event_translations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT,
    "description" TEXT,

    CONSTRAINT "timeline_event_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trivia" (
    "id" TEXT NOT NULL,
    "category" "TriviaCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "memberId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trivia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trivia_translations" (
    "id" TEXT NOT NULL,
    "triviaId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "trivia_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "organization" TEXT NOT NULL,
    "won" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "award_translations" (
    "id" TEXT NOT NULL,
    "awardId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT,
    "category" TEXT,

    CONSTRAINT "award_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "difficulty" "QuizDifficulty" NOT NULL DEFAULT 'EASY',
    "explanation" TEXT,
    "source" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_question_translations" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "explanation" TEXT,

    CONSTRAINT "quiz_question_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_slug_key" ON "members"("slug");

-- CreateIndex
CREATE INDEX "members_displayOrder_idx" ON "members"("displayOrder");

-- CreateIndex
CREATE INDEX "members_verified_idx" ON "members"("verified");

-- CreateIndex
CREATE INDEX "member_translations_locale_idx" ON "member_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "member_translations_memberId_locale_key" ON "member_translations"("memberId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "albums_slug_key" ON "albums"("slug");

-- CreateIndex
CREATE INDEX "albums_releaseDate_idx" ON "albums"("releaseDate");

-- CreateIndex
CREATE INDEX "albums_type_idx" ON "albums"("type");

-- CreateIndex
CREATE INDEX "albums_type_releaseDate_idx" ON "albums"("type", "releaseDate");

-- CreateIndex
CREATE INDEX "albums_verified_idx" ON "albums"("verified");

-- CreateIndex
CREATE INDEX "album_translations_locale_idx" ON "album_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "album_translations_albumId_locale_key" ON "album_translations"("albumId", "locale");

-- CreateIndex
CREATE INDEX "tracks_albumId_idx" ON "tracks"("albumId");

-- CreateIndex
CREATE INDEX "tracks_isTitleTrack_idx" ON "tracks"("isTitleTrack");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_albumId_trackNumber_key" ON "tracks"("albumId", "trackNumber");

-- CreateIndex
CREATE UNIQUE INDEX "solo_works_slug_key" ON "solo_works"("slug");

-- CreateIndex
CREATE INDEX "solo_works_memberId_idx" ON "solo_works"("memberId");

-- CreateIndex
CREATE INDEX "solo_works_releaseDate_idx" ON "solo_works"("releaseDate");

-- CreateIndex
CREATE INDEX "solo_works_type_idx" ON "solo_works"("type");

-- CreateIndex
CREATE INDEX "solo_work_translations_locale_idx" ON "solo_work_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "solo_work_translations_soloWorkId_locale_key" ON "solo_work_translations"("soloWorkId", "locale");

-- CreateIndex
CREATE INDEX "timeline_events_date_idx" ON "timeline_events"("date");

-- CreateIndex
CREATE INDEX "timeline_events_category_idx" ON "timeline_events"("category");

-- CreateIndex
CREATE INDEX "timeline_events_category_date_idx" ON "timeline_events"("category", "date");

-- CreateIndex
CREATE INDEX "timeline_events_memberId_idx" ON "timeline_events"("memberId");

-- CreateIndex
CREATE INDEX "timeline_events_importance_idx" ON "timeline_events"("importance");

-- CreateIndex
CREATE INDEX "timeline_events_verified_idx" ON "timeline_events"("verified");

-- CreateIndex
CREATE INDEX "timeline_event_translations_locale_idx" ON "timeline_event_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "timeline_event_translations_eventId_locale_key" ON "timeline_event_translations"("eventId", "locale");

-- CreateIndex
CREATE INDEX "trivia_category_idx" ON "trivia"("category");

-- CreateIndex
CREATE INDEX "trivia_memberId_idx" ON "trivia"("memberId");

-- CreateIndex
CREATE INDEX "trivia_verified_idx" ON "trivia"("verified");

-- CreateIndex
CREATE INDEX "trivia_category_verified_idx" ON "trivia"("category", "verified");

-- CreateIndex
CREATE INDEX "trivia_translations_locale_idx" ON "trivia_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "trivia_translations_triviaId_locale_key" ON "trivia_translations"("triviaId", "locale");

-- CreateIndex
CREATE INDEX "awards_year_idx" ON "awards"("year");

-- CreateIndex
CREATE INDEX "awards_organization_idx" ON "awards"("organization");

-- CreateIndex
CREATE INDEX "awards_won_idx" ON "awards"("won");

-- CreateIndex
CREATE INDEX "awards_verified_idx" ON "awards"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "awards_organization_year_category_name_key" ON "awards"("organization", "year", "category", "name");

-- CreateIndex
CREATE INDEX "award_translations_locale_idx" ON "award_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "award_translations_awardId_locale_key" ON "award_translations"("awardId", "locale");

-- CreateIndex
CREATE INDEX "quiz_questions_difficulty_idx" ON "quiz_questions"("difficulty");

-- CreateIndex
CREATE INDEX "quiz_questions_verified_idx" ON "quiz_questions"("verified");

-- CreateIndex
CREATE INDEX "quiz_questions_difficulty_verified_idx" ON "quiz_questions"("difficulty", "verified");

-- CreateIndex
CREATE INDEX "quiz_question_translations_locale_idx" ON "quiz_question_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_question_translations_questionId_locale_key" ON "quiz_question_translations"("questionId", "locale");

-- AddForeignKey
ALTER TABLE "member_translations" ADD CONSTRAINT "member_translations_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_translations" ADD CONSTRAINT "album_translations_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solo_works" ADD CONSTRAINT "solo_works_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solo_work_translations" ADD CONSTRAINT "solo_work_translations_soloWorkId_fkey" FOREIGN KEY ("soloWorkId") REFERENCES "solo_works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_event_translations" ADD CONSTRAINT "timeline_event_translations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "timeline_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trivia" ADD CONSTRAINT "trivia_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trivia_translations" ADD CONSTRAINT "trivia_translations_triviaId_fkey" FOREIGN KEY ("triviaId") REFERENCES "trivia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award_translations" ADD CONSTRAINT "award_translations_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "awards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_question_translations" ADD CONSTRAINT "quiz_question_translations_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

