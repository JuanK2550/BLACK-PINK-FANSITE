/** Identificadores de los microservicios del monorepo. */
export const SERVICE_NAMES = [
  'api-gateway',
  'content-service',
  'media-service',
  'chatbot-service',
  'speech-service',
] as const;

export type ServiceName = (typeof SERVICE_NAMES)[number];

/** Respuesta del endpoint GET /health de cada servicio. */
export interface HealthResponse {
  status: 'ok';
  service: ServiceName;
}
