-- Prepara Postgres: extensiones y un esquema por servicio.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS chat;

DO $$
BEGIN
  EXECUTE format('GRANT ALL ON SCHEMA content, media, chat TO %I', current_user);
END
$$;
