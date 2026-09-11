/**
 * ============================================================================
 * FILAS HUERFANAS
 * ============================================================================
 * El seed usa `upsert` con un id DERIVADO DEL TEXTO:
 *
 *   trivia   -> sha256(content.es)
 *   quiz     -> sha256(question.es)
 *   timeline -> sha256(fecha + title.es)
 *   awards   -> clave compuesta [organizacion, ano, categoria, nombre]
 *
 * Eso hace que reejecutar el seed sea idempotente, pero tiene un filo: al
 * CORREGIR el texto de una fila cambia su id, el upsert inserta una fila nueva
 * y la vieja se queda en la base para siempre. Nadie la borra, porque el seed
 * no borra nada.
 *
 * El sintoma es silencioso: el contador de curiosidades sube en uno y la
 * version anterior del dato -normalmente la que estaba SIN contrastar- sigue
 * publicandose junto a la corregida.
 *
 * Este script no borra por su cuenta. Enumera lo que sobra y, con --fix, lo
 * elimina.
 * ============================================================================
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client/client';
import { AWARDS } from './seed-data/awards';
import { QUIZ } from './seed-data/quiz';
import { TIMELINE } from './seed-data/timeline';
import { TRIVIA } from './seed-data/trivia';

const rootEnv = path.resolve(import.meta.dirname, '../../../.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

const connectionString = process.env.DATABASE_URL_CONTENT ?? '';
const schema = new URL(connectionString).searchParams.get('schema') ?? 'public';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }, { schema }) });

const FIX = process.argv.includes('--fix');

// Mismo separador que el seed: NUL, no un espacio. Si aqui se usa otro, TODAS
// las filas parecen huerfanas y el script recomendaria borrar el catalogo.
const stableId = (...parts: string[]): string =>
  createHash('sha256').update(parts.join('\u0000')).digest('hex').slice(0, 25);

async function main(): Promise<void> {
  // Los premios no usan `stableId`, pero tienen el mismo filo: su identidad es
  // la clave compuesta, asi que CORREGIR el nombre de un premio inserta uno
  // nuevo y deja el anterior publicado al lado.
  const claveAward = (a: { organization: string; year: number; category: string; name: string }) =>
    [a.organization, a.year, a.category, a.name].join('|');

  const esperados = {
    trivia: new Set(TRIVIA.map((item) => stableId('trivia', item.content.es))),
    quiz: new Set(QUIZ.map((item) => stableId('quiz', item.question.es))),
    timeline: new Set(
      TIMELINE.map((event) =>
        stableId('timeline', event.date.toISOString().slice(0, 10), event.title.es),
      ),
    ),
    awards: new Set(AWARDS.map(claveAward)),
  };

  const huerfanos = {
    trivia: (
      await prisma.trivia.findMany({ select: { id: true, content: true, verified: true } })
    ).filter((row) => !esperados.trivia.has(row.id)),
    quiz: (
      await prisma.quizQuestion.findMany({ select: { id: true, question: true, verified: true } })
    ).filter((row) => !esperados.quiz.has(row.id)),
    timeline: (
      await prisma.timelineEvent.findMany({ select: { id: true, title: true, verified: true } })
    ).filter((row) => !esperados.timeline.has(row.id)),
    awards: (
      await prisma.award.findMany({
        select: {
          id: true,
          name: true,
          organization: true,
          year: true,
          category: true,
          verified: true,
        },
      })
    ).filter((row) => !esperados.awards.has(claveAward(row))),
  };

  const total =
    huerfanos.trivia.length +
    huerfanos.quiz.length +
    huerfanos.timeline.length +
    huerfanos.awards.length;

  if (total === 0) {
    console.log('Sin filas huerfanas: la base coincide con el seed.');
    return;
  }

  console.log(`${total} fila(s) en la base que el seed ya no genera:\n`);
  for (const row of huerfanos.trivia) {
    console.log(
      `  [curiosidad] ${row.verified ? 'verificada' : 'sin contrastar'}  ${row.content.slice(0, 80)}`,
    );
  }
  for (const row of huerfanos.quiz) {
    console.log(
      `  [quiz]       ${row.verified ? 'verificada' : 'sin contrastar'}  ${row.question.slice(0, 80)}`,
    );
  }
  for (const row of huerfanos.timeline) {
    console.log(
      `  [hito]       ${row.verified ? 'verificado' : 'sin contrastar'}  ${row.title.slice(0, 80)}`,
    );
  }
  for (const row of huerfanos.awards) {
    console.log(
      `  [premio]     ${row.verified ? 'verificado' : 'sin contrastar'}  ${row.organization} ${row.year} — ${row.name}`,
    );
  }

  if (!FIX) {
    console.log('\nRepite con --fix para borrarlas.');
    return;
  }

  await prisma.trivia.deleteMany({ where: { id: { in: huerfanos.trivia.map((r) => r.id) } } });
  await prisma.quizQuestion.deleteMany({ where: { id: { in: huerfanos.quiz.map((r) => r.id) } } });
  await prisma.timelineEvent.deleteMany({
    where: { id: { in: huerfanos.timeline.map((r) => r.id) } },
  });
  await prisma.award.deleteMany({ where: { id: { in: huerfanos.awards.map((r) => r.id) } } });
  console.log(`\n${total} fila(s) borradas.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
