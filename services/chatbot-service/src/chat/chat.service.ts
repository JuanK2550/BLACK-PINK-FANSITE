import { Inject, Injectable, Logger } from '@nestjs/common';
import { SUPPORTED_LOCALES, type Locale } from '@blackpink/types';
import { AI_PROVIDER, AiError, type AiProvider, type ChatTurn } from '../provider/ai-provider';
import { RetrievalService } from '../rag/retrieval.service';
import { VectorStoreService } from '../rag/vector-store.service';
import { SafetyService } from '../safety/safety.service';
import { newContextFence } from '../safety/sanitize';
import { buildSystemPrompt, splitAction } from './prompt';
import { NO_ACTION, resolveAction, type ChatAction, type KnownTarget } from './sitemap';

export interface ChatCitation {
  label: string;
  path: string;
}

/** Lo que el controlador emite por SSE. */
export type ChatEvent =
  | { type: 'token'; text: string }
  | { type: 'done'; action: ChatAction; citations: ChatCitation[] }
  /** El cliente debe DESCARTAR lo pintado y mostrar solo este texto. */
  | { type: 'blocked'; text: string }
  | { type: 'error'; code: string; message: string };

const FALLBACK_LOCALE: Locale = 'en';

/** Marcador de accion. Es protocolo interno y nunca se muestra. */
const MARKER = 'ACCION:';

/**
 * Mensajes de fallo, en los tres idiomas.
 *
 * Se escriben AQUI y no se le piden al modelo: cuando el modelo es justo lo
 * que ha fallado, pedirle que redacte la disculpa no funciona. Ademas, la
 * cuota agotada tiene que sonar a algo temporal y comprensible, no a error.
 */
const MESSAGES: Record<Locale, { quota: string; unavailable: string; generic: string }> = {
  es: {
    quota:
      'Ahora mismo he agotado mi cuota de preguntas del dia. Vuelve a intentarlo en un rato: mientras tanto puedes seguir explorando el sitio.',
    unavailable:
      'Mi cerebro no esta configurado todavia en este sitio, asi que no puedo responder. El contenido esta igualmente disponible en las paginas.',
    generic: 'Me he encontrado con un problema al responder. Intentalo otra vez en un momento.',
  },
  en: {
    quota:
      "I've used up my question quota for now. Try again in a little while: you can keep exploring the site meanwhile.",
    unavailable:
      'My brain is not configured on this site yet, so I cannot answer. The content is still available on the pages.',
    generic: 'I ran into a problem answering that. Please try again in a moment.',
  },
  ko: {
    quota:
      '지금은 질문 한도를 다 써버렸어요. 잠시 뒤에 다시 시도해 주세요. 그동안 사이트를 둘러보셔도 좋아요.',
    unavailable:
      '이 사이트에서는 아직 제 두뇌가 설정되지 않아 답변할 수 없어요. 내용은 각 페이지에서 확인하실 수 있습니다.',
    generic: '답변하는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
  },
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly ai: AiProvider,
    private readonly retrieval: RetrievalService,
    private readonly store: VectorStoreService,
    private readonly safety: SafetyService,
  ) {}

  /**
   * Responde en trozos.
   *
   * Devuelve eventos, no texto: el controlador solo los traduce a SSE y no
   * tiene que saber nada del RAG ni del proveedor. Asi el flujo entero se
   * puede probar sin abrir un socket.
   */
  async *answer(
    raw: string,
    uiLocale: Locale,
    history: ChatTurn[],
    signal?: AbortSignal,
    sessionId = '',
  ): AsyncIterable<ChatEvent> {
    /*
     * SEGURIDAD ANTES QUE NADA, y antes de gastar cuota.
     *
     * `checkInput` tambien decide el idioma: PINKY responde en el idioma en
     * que le hablan, no en el de la interfaz. Se hace aqui y no despues
     * porque una negativa tambien tiene que salir en el idioma correcto.
     */
    const check = this.safety.checkInput(raw, uiLocale, sessionId);
    const locale = check.locale;
    const message = check.message;
    const texts = MESSAGES[locale] ?? MESSAGES[FALLBACK_LOCALE];

    if (check.refusal) {
      // La negativa se emite como texto normal, no como error: para el
      // visitante es una respuesta, y para el cliente un turno mas.
      yield { type: 'token', text: check.refusal.text };
      yield { type: 'done', action: NO_ACTION, citations: [] };
      return;
    }

    if (!this.ai.isConfigured()) {
      yield { type: 'error', code: 'NOT_CONFIGURED', message: texts.unavailable };
      return;
    }

    let context = '';
    let citations: ChatCitation[] = [];
    let known: KnownTarget[] = [];

    try {
      const chunks = await this.retrieval.retrieve(message, locale);
      // `format` neutraliza cada fragmento: ver retrieval.service.ts.
      context = this.retrieval.format(chunks);

      // Una cita por seccion, no una por fragmento: seis fragmentos de la
      // misma ficha son una sola fuente para el visitante.
      const seen = new Set<string>();
      citations = chunks
        .filter((chunk) => !seen.has(chunk.sourcePath) && seen.add(chunk.sourcePath))
        .map((chunk) => ({ label: chunk.sourceLabel, path: `/${locale}${chunk.sourcePath}` }));

      known = citations.map((cite) => ({
        path: cite.path.replace(`/${locale}`, ''),
        label: cite.label,
      }));
    } catch (error) {
      if (error instanceof AiError && error.kind === 'quota') {
        yield { type: 'error', code: 'QUOTA', message: texts.quota };
        return;
      }
      // Sin contexto se puede seguir: el modelo dira que no lo tiene, que es
      // exactamente lo que debe decir.
      this.logger.warn(`Recuperacion fallida: ${String(error)}`);
    }

    /*
     * Delimitador nuevo en cada peticion. Un texto malicioso guardado en el
     * indice no puede cerrar el bloque de datos para "salir" a la zona de
     * instrucciones: tendria que acertar un valor que no existia cuando se
     * escribio.
     */
    const system = buildSystemPrompt(locale, context, newContextFence());
    let full = '';
    let emitted = 0;

    try {
      for await (const piece of this.ai.streamChat(
        { system, history: history.slice(-10), message },
        signal,
      )) {
        full += piece;

        /*
         * EL MARCADOR NO PUEDE ASOMAR AL CLIENTE.
         *
         * `ACCION:` va al final del texto y es protocolo, no respuesta. En
         * cuanto aparece se deja de emitir y el resto se acumula para
         * procesarlo al cerrar.
         *
         * Y ojo con lo que no se ve: el marcador llega TROCEADO POR LA RED.
         * Puede partirse en "ACC" + "ION:", y para cuando se reconoce, las
         * tres primeras letras ya estarian en pantalla. Por eso se retienen
         * siempre los ultimos caracteres del bufer -tantos como el marcador
         * menos uno- hasta saber que no son su comienzo. Es la diferencia
         * entre una respuesta limpia y una que termina en "ACC".
         */
        const marker = full.indexOf(MARKER);
        const safeEnd =
          marker === -1
            ? Math.max(emitted, full.length - (MARKER.length - 1))
            : // El salto de linea que separa el texto del marcador es
              // protocolo: sin recortarlo, la respuesta termina en un "\n"
              // suelto que el cliente pinta como un parrafo vacio.
              full.slice(0, marker).trimEnd().length;

        if (safeEnd > emitted) {
          /*
           * FILTRO DE SALIDA SOBRE LO ACUMULADO.
           *
           * Se revisa el texto completo emitido hasta ahora, no el trozo
           * suelto: una frase prohibida puede repartirse entre dos trozos y
           * ninguno de los dos, por separado, dispara nada.
           *
           * Limite conocido y asumido: lo ya enviado no se puede retirar. Por
           * eso al bloquear se emite un evento `blocked`, y el contrato con el
           * cliente es que DESCARTE lo pintado y muestre solo ese texto. Sin
           * streaming no haria falta; con streaming, es esto o esperar a la
           * respuesta entera y perder la escritura progresiva.
           */
          const guard = this.safety.checkOutput(full.slice(0, safeEnd), locale, sessionId);
          if (guard.blocked) {
            yield { type: 'blocked', text: guard.text };
            return;
          }

          yield { type: 'token', text: full.slice(emitted, safeEnd) };
          emitted = safeEnd;
        }
      }

      // Cierre: lo retenido sale ahora, salvo que fuera el marcador.
      const marker = full.indexOf(MARKER);
      const end = marker === -1 ? full.length : full.slice(0, marker).trimEnd().length;
      if (end > emitted) {
        yield { type: 'token', text: full.slice(emitted, end) };
      }
    } catch (error) {
      if (error instanceof AiError && error.kind === 'quota') {
        yield { type: 'error', code: 'QUOTA', message: texts.quota };
        return;
      }
      if (error instanceof AiError && error.kind === 'aborted') return;

      this.logger.warn(`Generacion fallida: ${String(error)}`);
      yield { type: 'error', code: 'UPSTREAM', message: texts.generic };
      return;
    }

    // Ultima revision sobre la respuesta completa: el bucle solo llego a ver
    // lo que iba emitiendo, y el cierre puede anadir la frase final.
    const finalGuard = this.safety.checkOutput(full, locale, sessionId);
    if (finalGuard.blocked) {
      yield { type: 'blocked', text: finalGuard.text };
      return;
    }

    const { raw: marker } = splitAction(full);
    const action = resolveAction(marker, locale, known);

    yield {
      type: 'done',
      action,
      // Si el modelo no uso el contexto, las citas sobran: se envian solo
      // cuando hubo contexto de verdad.
      citations: context ? citations.slice(0, 3) : [],
    };
  }

  /** Preguntas sugeridas. Fijas y traducidas: no gastan cuota. */
  suggestions(locale: Locale): string[] {
    const all: Record<Locale, string[]> = {
      es: [
        '¿Cuando debuto BLACKPINK?',
        '¿Que canciones tiene BORN PINK?',
        '¿Que premios han ganado?',
        'Cuentame algo de Rose',
        '¿Donde veo la cronologia?',
      ],
      en: [
        'When did BLACKPINK debut?',
        'What songs are on BORN PINK?',
        'Which awards have they won?',
        'Tell me something about Rose',
        'Where can I see the timeline?',
      ],
      ko: [
        'BLACKPINK는 언제 데뷔했나요?',
        'BORN PINK에는 어떤 곡이 있나요?',
        '어떤 상을 받았나요?',
        '로제에 대해 알려주세요',
        '연표는 어디에서 볼 수 있나요?',
      ],
    };

    return all[locale] ?? all[FALLBACK_LOCALE];
  }

  /** Estado del indice, para diagnostico interno. */
  async indexStatus(): Promise<{ provider: string; configured: boolean; chunks: number }> {
    let chunks = 0;
    try {
      chunks = await this.store.count();
    } catch {
      chunks = -1;
    }

    return {
      provider: this.ai.describe(),
      configured: this.ai.isConfigured(),
      chunks,
    };
  }
}

/** Idioma pedido, o el de respaldo si llega algo que no soportamos. */
export function resolveLocale(value: string | undefined): Locale {
  return SUPPORTED_LOCALES.includes(value as Locale) ? (value as Locale) : FALLBACK_LOCALE;
}
