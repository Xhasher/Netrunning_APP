// Verifica di fine capitolo: un test cumulativo che serve a fissare, non a giudicare.
// Due terzi delle domande riguardano il capitolo appena chiuso, un terzo ripesca dai
// capitoli precedenti (prima le cose più deboli in Memoria). Si mescolano domande a
// scelta multipla ed esercizi "ricomponi / scrivi il comando". Chi sbaglia rivede la
// spiegazione e ritrova la domanda in coda, finché non la sa.

import { CHAPTERS, allMissions } from '../content';
import { EXAM_BANK } from '../content/exam-bank';
import { GENERATORS } from '../content/drills';
import { PALESTRA_SKILLS } from '../content/palestra';
import { buildCards, shuffle, type Card, type Srs } from './cards';
import { skillsInLine } from './skills';
import type { Chapter } from './types';

export const CHAPTER_TEST = {
  /** percentuale al primo tentativo per superarla */
  pass: 80,
  /** domande sul capitolo */
  own: 12,
  /** domande di ripasso dai capitoli precedenti */
  past: 6,
  /** esercizi della parte pratica */
  practical: 4,
  xpPass: 100,
};

export interface ChapterTestRecord {
  /** miglior percentuale al primo tentativo */
  best: number;
  day: number;
  passed: boolean;
  tries: number;
  /** parte pratica: esercizi risolti e totali nel tentativo migliore */
  prat?: [number, number];
}

export interface TestQuiz {
  question: string;
  options: string[];
  correct: number;
  explain: string;
}

export interface TestItem {
  card?: Card;
  quiz?: TestQuiz;
  tag: string;
  box: number;
  early: boolean;
  isNew: boolean;
}

type Rnd = () => number;

const chapterOfMission = (() => {
  let map: Map<string, string> | null = null;
  return (id: string) => {
    if (!map) {
      map = new Map();
      for (const c of CHAPTERS) for (const m of c.missions) map.set(m.id, c.id);
    }
    return map.get(id);
  };
})();

/** Capitolo a cui appartiene una carta di Memoria (dall'ordine di introduzione). */
export function chapterOfCard(card: Card): string | undefined {
  const m = allMissions()[Math.floor(card.order / 1000)];
  return m ? chapterOfMission(m.id) : undefined;
}

function quizzesOf(ch: Chapter): TestQuiz[] {
  const out: TestQuiz[] = [];
  for (const m of ch.missions) for (const s of m.steps) if (s.kind === 'quiz') out.push({ question: s.question, options: s.options, correct: s.correct, explain: s.explain });
  for (const q of EXAM_BANK) if (q.chapter === ch.id) out.push({ question: q.question, options: q.options, correct: q.correct, explain: q.explain });
  return out;
}

/** Le carte in forma "attiva": almeno ricomporre, e scrivere quando si può. */
function cardItem(card: Card, srs: Srs, tag: string, day: number): TestItem {
  const s = srs[card.id];
  return { card, tag, box: Math.max(2, s?.[0] ?? 0), isNew: !s, early: !!s && s[1] > day };
}

/** Sceglie carte variando il tipo (comandi, opzioni, esempi, concetti) e partendo dalle più deboli. */
function pickCards(cards: Card[], srs: Srs, n: number, rnd: Rnd): Card[] {
  const weak = (c: Card) => srs[c.id]?.[0] ?? -1;
  const byKind = new Map<string, Card[]>();
  for (const c of shuffle(cards, rnd).sort((a, b) => weak(a) - weak(b))) {
    const l = byKind.get(c.kind) ?? [];
    l.push(c);
    byKind.set(c.kind, l);
  }
  const out: Card[] = [];
  const kinds = ['ex', 'opt', 'cmd', 'fact'].filter((k) => byKind.has(k));
  while (out.length < n && kinds.some((k) => byKind.get(k)!.length)) for (const k of kinds) if (out.length < n) {
    const c = byKind.get(k)!.shift();
    if (c) out.push(c);
  }
  return out;
}

export function chapterComplete(ch: Chapter, completed: readonly string[]): boolean {
  return ch.missions.every((m) => completed.includes(m.id));
}

/** Compone la verifica del capitolo: domande sue + ripasso dei precedenti. */
export function buildChapterTest(chId: string, completed: readonly string[], known: readonly string[], srs: Srs, day: number, rnd: Rnd = Math.random): TestItem[] {
  const ci = CHAPTERS.findIndex((c) => c.id === chId);
  if (ci < 0) return [];
  const ch = CHAPTERS[ci];
  const past = CHAPTERS.slice(0, ci);
  // le carte disponibili: quelle sbloccate dal capitolo e dai precedenti (anche se non tutte le missioni sono segnate)
  const ids = [...new Set([...completed, ...CHAPTERS.slice(0, ci + 1).flatMap((c) => c.missions.map((m) => m.id))])];
  const cards = buildCards(ids, known);
  const tagOf = (c: Chapter) => `${c.code} · ${c.title}`;

  const ownCards = cards.filter((c) => chapterOfCard(c) === chId);
  const ownQuiz = shuffle(quizzesOf(ch), rnd);
  // metà domande e metà esercizi attivi, se il capitolo ne ha abbastanza
  const nCards = Math.min(ownCards.length, Math.max(CHAPTER_TEST.own - ownQuiz.length, Math.floor(CHAPTER_TEST.own / 3)));
  const nQuiz = Math.min(ownQuiz.length, CHAPTER_TEST.own - nCards);
  const items: TestItem[] = [
    ...ownQuiz.slice(0, nQuiz).map((quiz) => ({ quiz, tag: tagOf(ch), box: 0, early: false, isNew: false })),
    ...pickCards(ownCards, srs, nCards, rnd).map((c) => cardItem(c, srs, tagOf(ch), day)),
  ];

  if (past.length) {
    const pastIds = new Set(past.map((c) => c.id));
    const pastCards = cards.filter((c) => pastIds.has(chapterOfCard(c) ?? ''));
    const half = Math.ceil(CHAPTER_TEST.past / 2);
    const pc = pickCards(pastCards, srs, half, rnd);
    const pq = shuffle(
      past.flatMap((c) => quizzesOf(c).map((quiz) => ({ quiz, c }))),
      rnd,
    ).slice(0, CHAPTER_TEST.past - pc.length);
    items.push(
      ...pc.map((c) => cardItem(c, srs, `Ripasso · ${chapterNameOf(chapterOfCard(c))}`, day)),
      ...pq.map(({ quiz, c }) => ({ quiz, tag: `Ripasso · ${tagOf(c)}`, box: 0, early: false, isNew: false })),
    );
  }
  return shuffle(items, rnd);
}

function chapterNameOf(id: string | undefined): string {
  const c = CHAPTERS.find((x) => x.id === id);
  return c ? `${c.code} · ${c.title}` : 'capitoli precedenti';
}

/**
 * Parte pratica: le competenze del capitolo che hanno esercizi in Palestra (pesate) e,
 * se il capitolo ha sfide generate, anche quelle.
 */
export function practicalPlan(chId: string): { pool: { skill: string; weight: number }[]; drills: boolean; repair: boolean } {
  const ch = CHAPTERS.find((c) => c.id === chId);
  if (!ch) return { pool: [], drills: false, repair: false };
  const count = new Map<string, number>();
  for (const m of ch.missions)
    for (const s of m.steps) {
      if (s.kind !== 'task') continue;
      const sol = s.solve?.join('\n') ?? s.hints[s.hints.length - 1] ?? '';
      const lines = [...[...s.body.matchAll(/```\n?([\s\S]*?)```/g)].flatMap((b) => b[1].split('\n')), sol.includes(': ') ? sol.slice(sol.lastIndexOf(': ') + 2) : sol];
      for (const l of lines) for (const sk of skillsInLine(l)) if (PALESTRA_SKILLS.includes(sk)) count.set(sk, (count.get(sk) ?? 0) + 1);
    }
  const pool = [...count].map(([skill, n]) => ({ skill, weight: Math.min(4, n) }));
  const drills = !!GENERATORS[chId]?.length;
  // i capitoli senza sfide proprie, dall'amministrazione in poi, hanno una riparazione nella parte pratica
  const repair = !drills && CHAPTERS.findIndex((c) => c.id === chId) >= CHAPTERS.findIndex((c) => c.id === 'chAM');
  return { pool, drills, repair };
}

/** Aggiorna il registro dopo un tentativo; restituisce true se è la prima volta che viene superata. */
export function recordChapterTest(tests: Record<string, ChapterTestRecord>, chId: string, firstTry: number, total: number, day: number): { pct: number; passed: boolean; firstPass: boolean } {
  const pct = total ? Math.round((firstTry / total) * 100) : 0;
  const passed = pct >= CHAPTER_TEST.pass;
  const prev = tests[chId];
  const firstPass = passed && !prev?.passed;
  tests[chId] = { best: Math.max(prev?.best ?? 0, pct), day, passed: passed || !!prev?.passed, tries: (prev?.tries ?? 0) + 1, prat: prev?.prat };
  return { pct, passed, firstPass };
}

export function recordPractical(tests: Record<string, ChapterTestRecord>, chId: string, ok: number, total: number, day: number): void {
  const prev = tests[chId] ?? { best: 0, day, passed: false, tries: 0 };
  if (!prev.prat || ok / total > prev.prat[0] / prev.prat[1]) prev.prat = [ok, total];
  tests[chId] = prev;
}

/** Stelle del capitolo: una per la teoria superata, una per la pratica (almeno tre quarti). */
export function stars(r: ChapterTestRecord | undefined): number {
  if (!r) return 0;
  return (r.passed ? 1 : 0) + (r.prat && r.prat[0] / r.prat[1] >= 0.75 ? 1 : 0);
}
