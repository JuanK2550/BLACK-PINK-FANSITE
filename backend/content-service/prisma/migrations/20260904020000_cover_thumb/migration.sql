-- La misma portada en el tamano pequeno que publica Spotify (300px).
--
-- Las portadas no pasan por el optimizador de Next -para no re-alojar ni
-- reescalar material con copyright-, y sin optimizador no hay srcset: `sizes`
-- no hace nada. Mandar el archivo de 640px a una miniatura de 56 costaba
-- 17,8 KB por portada donde bastan 6,1.
--
-- No es una variante nuestra: Spotify publica 640, 300 y 64, y aqui se elige.

-- AlterTable
ALTER TABLE "albums" ADD COLUMN     "coverThumbUrl" TEXT,
ADD COLUMN     "coverThumbWidth" INTEGER,
ADD COLUMN     "coverThumbHeight" INTEGER;

-- AlterTable
ALTER TABLE "solo_works" ADD COLUMN     "coverThumbUrl" TEXT,
ADD COLUMN     "coverThumbWidth" INTEGER,
ADD COLUMN     "coverThumbHeight" INTEGER;
