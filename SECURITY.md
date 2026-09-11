# Seguridad

Si encuentras una vulnerabilidad, **no abras un issue público**: repórtala en
privado desde la pestaña **Security → Report a vulnerability** de este
repositorio.

Lo que más interesa:

- Cualquier forma de que el **gateway** reenvíe una ruta que no está en su lista
  blanca (`services/api-gateway/src/proxy/routes.ts`).
- Cualquier forma de que **PINKY** revele datos personales, siga instrucciones
  metidas en el contenido o proponga un enlace fuera del mapa del sitio.
- Cualquier forma de que un audio enviado a la transcripción **se guarde** en
  disco o en los registros.
- Acceso a los endpoints internos (`/api/revalidate`, `/api/v1/admin/reindex`)
  sin el secreto.

El sitio es un proyecto de fans sin ánimo de lucro: no hay programa de
recompensas, pero sí agradecimiento público si lo deseas.
