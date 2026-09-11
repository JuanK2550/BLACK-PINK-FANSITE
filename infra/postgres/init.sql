-- Inicializacion de la base de datos de desarrollo.
-- Se ejecuta una unica vez, al crear el volumen del contenedor de Postgres.

-- pgvector: necesario para el RAG del chatbot (Fase 7).
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Un schema por microservicio. Cada servicio es dueno del suyo y gestiona
-- sus propias migraciones Prisma; ningun servicio lee tablas de otro.
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS chat;

-- En desarrollo todos los servicios comparten el mismo rol.
-- En produccion conviene un rol por servicio con permisos solo sobre su schema.
DO $$
BEGIN
  EXECUTE format('GRANT ALL ON SCHEMA content, media, chat TO %I', current_user);
END
$$;
