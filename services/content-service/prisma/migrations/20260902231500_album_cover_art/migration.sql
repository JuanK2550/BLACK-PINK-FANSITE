-- Portadas de album y de obra en solitario.
--
-- La imagen NO se aloja: `coverUrl` apunta a la CDN de Spotify. Se guardan sus
-- medidas porque, al no pasar por el optimizador de Next, no hay otra forma de
-- reservar el hueco antes de que cargue.
--
-- `coverAlbumId` es la trazabilidad: dice de que album de Spotify salio cada
-- portada, para poder comprobarla sin fiarse del script.

-- AlterTable
ALTER TABLE "albums" ADD COLUMN     "coverAlbumId" TEXT,
ADD COLUMN     "coverHeight" INTEGER,
ADD COLUMN     "coverSource" "IdSource",
ADD COLUMN     "coverWidth" INTEGER;

-- AlterTable
ALTER TABLE "solo_works" ADD COLUMN     "coverAlbumId" TEXT,
ADD COLUMN     "coverHeight" INTEGER,
ADD COLUMN     "coverSource" "IdSource",
ADD COLUMN     "coverWidth" INTEGER;
