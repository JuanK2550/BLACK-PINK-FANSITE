# Syne

`syne-800.ttf` es Syne ExtraBold, la misma familia display que usa el sitio.

- Autores: Bonjour Monde / Lucas Descroix
- Licencia: **SIL Open Font License 1.1** — https://openfontlicense.org
- Origen: Google Fonts (`https://fonts.gstatic.com/s/syne/`)

La OFL permite redistribuir el archivo dentro de otro proyecto, así que la
fuente viaja en el repositorio a propósito.

**Por qué está aquí y no se descarga en cada petición.** La imagen Open Graph
del quiz (`../quiz/route.tsx`) la lee del disco. La alternativa habitual es
bajarla de Google en cada render, y eso ata una imagen estática a que un
tercero responda: si Google falla, la tarjeta sale con la sans del sistema o no
sale. Son 52 KB por no depender de nadie.

El resto del sitio NO usa este archivo: las fuentes de las páginas las sirve
`next/font/google`, que las auto-hospeda en el build.
