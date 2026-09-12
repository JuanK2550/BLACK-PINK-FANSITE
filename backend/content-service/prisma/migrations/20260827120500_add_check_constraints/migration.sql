-- Restricciones de integridad que Prisma no sabe declarar en el esquema.
--
-- Van en la base de datos y no solo en el codigo a proposito: un rango que
-- unicamente vive en TypeScript deja de existir en cuanto alguien inserta
-- desde psql, desde un script de importacion o desde otro servicio.

-- La importancia de un hito de cronologia va de 1 a 5.
ALTER TABLE "timeline_events"
  ADD CONSTRAINT "timeline_events_importance_range"
  CHECK ("importance" >= 1 AND "importance" <= 5);

-- Solo tres precisiones de fecha: dia, mes o ano. Muchos hitos se conocen por
-- mes pero no por dia, y guardar el dia 1 sin decirlo seria inventar precision.
ALTER TABLE "timeline_events"
  ADD CONSTRAINT "timeline_events_date_precision_values"
  CHECK ("datePrecision" IN ('day', 'month', 'year'));

-- El indice de la respuesta correcta no puede ser negativo. Que apunte dentro
-- del array de opciones se comprueba en el seed y en el servicio, porque
-- PostgreSQL no puede validar la longitud de un JSON arbitrario en un CHECK
-- de forma estable.
ALTER TABLE "quiz_questions"
  ADD CONSTRAINT "quiz_questions_correct_index_non_negative"
  CHECK ("correctIndex" >= 0);

-- Un numero de pista empieza en 1.
ALTER TABLE "tracks"
  ADD CONSTRAINT "tracks_track_number_positive"
  CHECK ("trackNumber" >= 1);

-- Una duracion en segundos, si existe, es positiva.
ALTER TABLE "tracks"
  ADD CONSTRAINT "tracks_duration_positive"
  CHECK ("durationSec" IS NULL OR "durationSec" > 0);

-- Un premio pertenece a un ano plausible: el grupo debuto en 2016.
ALTER TABLE "awards"
  ADD CONSTRAINT "awards_year_range"
  CHECK ("year" >= 2016 AND "year" <= 2100);

-- Un color de acento es un hexadecimal de 6 digitos con almohadilla.
ALTER TABLE "members"
  ADD CONSTRAINT "members_color_accent_format"
  CHECK ("colorAccent" IS NULL OR "colorAccent" ~ '^#[0-9a-fA-F]{6}$');

-- Una curiosidad no puede quedarse sin fuente: sin fuente no es un dato,
-- es un rumor.
ALTER TABLE "trivia"
  ADD CONSTRAINT "trivia_source_not_blank"
  CHECK (length(btrim("source")) > 0);
