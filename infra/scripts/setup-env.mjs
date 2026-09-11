#!/usr/bin/env node
/**
 * Crea el fichero .env de la raiz a partir de .env.example.
 * No sobreescribe nada si el .env ya existe.
 */
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const example = path.join(root, '.env.example');
const target = path.join(root, '.env');

if (!existsSync(example)) {
  console.error('No se encuentra .env.example en la raiz del monorepo.');
  process.exit(1);
}

if (existsSync(target)) {
  console.log('.env ya existe: no se toca nada.');
  process.exit(0);
}

copyFileSync(example, target);
console.log('.env creado a partir de .env.example.');
console.log('Revisa INTERNAL_API_KEY y las claves de API antes de arrancar.');
