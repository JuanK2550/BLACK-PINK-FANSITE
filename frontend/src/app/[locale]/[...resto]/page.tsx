// Envía cualquier ruta inexistente a la página 404.

import { notFound } from 'next/navigation';

export default function RutaInexistente() {
  notFound();
}
