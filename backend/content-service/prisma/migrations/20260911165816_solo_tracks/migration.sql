-- CreateTable
CREATE TABLE "solo_tracks" (
    "id" TEXT NOT NULL,
    "soloWorkId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trackNumber" INTEGER NOT NULL,
    "durationSec" INTEGER,
    "isTitleTrack" BOOLEAN NOT NULL DEFAULT false,
    "featuring" TEXT,
    "spotifyId" TEXT,
    "spotifyIdSource" "IdSource",
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solo_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solo_tracks_soloWorkId_idx" ON "solo_tracks"("soloWorkId");

-- CreateIndex
CREATE UNIQUE INDEX "solo_tracks_soloWorkId_trackNumber_key" ON "solo_tracks"("soloWorkId", "trackNumber");

-- AddForeignKey
ALTER TABLE "solo_tracks" ADD CONSTRAINT "solo_tracks_soloWorkId_fkey" FOREIGN KEY ("soloWorkId") REFERENCES "solo_works"("id") ON DELETE CASCADE ON UPDATE CASCADE;
