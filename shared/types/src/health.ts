// Tipos del endpoint de salud.

export const SERVICE_NAMES = [
  'api-gateway',
  'content-service',
  'media-service',
  'chatbot-service',
  'speech-service',
] as const;

export type ServiceName = (typeof SERVICE_NAMES)[number];

export interface HealthResponse {
  status: 'ok';
  service: ServiceName;
}
