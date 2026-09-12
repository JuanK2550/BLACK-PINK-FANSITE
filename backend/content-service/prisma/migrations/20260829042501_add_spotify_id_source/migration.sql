-- CreateEnum
CREATE TYPE "IdSource" AS ENUM ('SCRIPT', 'MANUAL');

-- AlterTable
ALTER TABLE "solo_works" ADD COLUMN     "durationSec" INTEGER,
ADD COLUMN     "spotifyIdSource" "IdSource";

-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "spotifyIdSource" "IdSource";

-- La procedencia solo tiene sentido si hay identificador, y un identificador
-- sin procedencia es un dato huerfano del que nadie sabra de donde salio.
-- Los dos campos van juntos o no van.
ALTER TABLE "tracks"
  ADD CONSTRAINT "tracks_spotify_id_source_paired"
  CHECK (("spotifyId" IS NULL) = ("spotifyIdSource" IS NULL));

ALTER TABLE "solo_works"
  ADD CONSTRAINT "solo_works_spotify_id_source_paired"
  CHECK (("spotifyId" IS NULL) = ("spotifyIdSource" IS NULL));

-- Una duracion en segundos negativa o cero no existe.
ALTER TABLE "solo_works"
  ADD CONSTRAINT "solo_works_duration_positive"
  CHECK ("durationSec" IS NULL OR "durationSec" > 0);
