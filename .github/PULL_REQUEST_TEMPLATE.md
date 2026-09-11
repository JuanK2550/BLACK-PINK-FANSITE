<!--
  El título del PR es el mensaje del commit que quedará en main: Conventional
  Commits con un scope de commitlint.config.mjs. Ejemplos:
    feat(web): comparador de integrantes
    fix(content): la nacionalidad no se traducía
  De él sale la versión (semantic-release): `feat` sube la menor, `fix` el
  parche, y `BREAKING CHANGE:` en el cuerpo la mayor.
-->

## Qué cambia

<!-- Una o dos frases. El porqué, no el cómo: el cómo está en el diff. -->

## Cómo se ha comprobado

<!-- Qué se ejecutó y qué se miró. «Funciona» no es una comprobación. -->

- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test`
- [ ] `pnpm check:contrast` si se tocó la paleta
- [ ] `pnpm test:e2e` si cambia la navegación, el idioma, el reproductor o el chat
- [ ] Mirado en el navegador en escritorio **y a 375px** si cambia la interfaz

## Reglas del proyecto

<!-- Las invariantes de CLAUDE.md. Si no aplica, táchala o bórrala. -->

- [ ] No se aloja ni se sirve audio o vídeo con copyright; lo único que suena es el embed oficial de Spotify
- [ ] Toda cadena visible está en `apps/web/messages/{es,en,ko}.json`, en los tres idiomas
- [ ] El aviso de sitio no oficial sigue visible en todas las páginas
- [ ] Los datos nuevos llevan `source` y `verified`; lo que no está contrastado va con `verified: false`
- [ ] Las imágenes nuevas tienen licencia libre y su atribución llega a `/creditos`
- [ ] Las animaciones nuevas respetan `prefers-reduced-motion`
- [ ] `apps/web` no envía `includeUnverified=true` en ninguna llamada

## Capturas

<!-- Antes y después, escritorio y móvil, si cambia algo que se ve. -->
