/**
 * Datos estructurados.
 *
 * `dangerouslySetInnerHTML` es la unica forma de emitir JSON-LD en React, pero
 * el JSON se escapa antes: un `<` sin escapar dentro de una cadena cerraria el
 * <script> y convertiria un dato en HTML ejecutable. El contenido viene de la
 * base de datos, asi que no se da por seguro.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\u003c'),
      }}
    />
  );
}
