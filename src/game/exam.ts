// Esami simulati: domande da quiz delle missioni, banca di scenari e carte di Memoria,
// bilanciate per capitolo, a tempo, con soglia di superamento come nelle certificazioni.

import { CHAPTERS } from '../content';
import { EXAM_BANK } from '../content/exam-bank';
import { buildCards, exerciseFor, shuffle } from './cards';

export interface ExamQ {
  chapter: string;
  question: string;
  options: string[];
  correct: number;
  explain: string;
  /** le opzioni sono codice (da mostrare in monospazio) */
  code?: boolean;
}

export type ExamKind = 'parziale' | 'finale' | 'pratico';

export interface ExamSpec {
  kind: ExamKind;
  title: string;
  /** numero di domande o di sfide */
  count: number;
  minutes: number;
  /** percentuale minima per superarlo */
  pass: number;
  blurb: string;
}

export const EXAMS: Record<ExamKind, ExamSpec> = {
  parziale: {
    kind: 'parziale',
    title: 'Esame sui capitoli completati',
    count: 30,
    minutes: 30,
    pass: 75,
    blurb: 'Domande solo sugli argomenti che hai già studiato. Un minuto a domanda, soglia 75%: il ritmo di Security+.',
  },
  finale: {
    kind: 'finale',
    title: 'Esame finale junior',
    count: 60,
    minutes: 60,
    pass: 75,
    blurb: 'Tutto il corso, 60 domande in 60 minuti. Se lo superi con costanza, le basi teoriche per un colloquio da junior ci sono.',
  },
  pratico: {
    kind: 'pratico',
    title: 'Prova pratica a tempo',
    count: 8,
    minutes: 40,
    pass: 75,
    blurb: '8 sfide nel terminale, livello Difficile, senza suggerimenti, 40 minuti. Lo stile delle certificazioni pratiche come eJPT e BTL1.',
  },
};

type Rnd = () => number;

function fromOptions(chapter: string, question: string, options: string[], correct: number, explain: string, rnd: Rnd): ExamQ {
  const order = shuffle(options.map((_, i) => i), rnd);
  return { chapter, question, options: order.map((i) => options[i]), correct: order.indexOf(correct), explain };
}

/** Tutte le domande disponibili. Con onlyDone, solo dai capitoli con almeno una missione completata. */
export function examPool(completed: readonly string[], known: readonly string[], onlyDone: boolean, rnd: Rnd = Math.random): ExamQ[] {
  const done = new Set(completed);
  const allIds = CHAPTERS.flatMap((c) => c.missions.map((m) => m.id));
  const studied = new Set(CHAPTERS.filter((c) => c.missions.some((m) => done.has(m.id))).map((c) => c.id));
  const pool: ExamQ[] = [];

  for (const c of CHAPTERS)
    for (const m of c.missions) {
      if (onlyDone && !done.has(m.id)) continue;
      for (const s of m.steps) if (s.kind === 'quiz') pool.push(fromOptions(c.id, s.question, s.options, s.correct, s.explain, rnd));
    }
  for (const q of EXAM_BANK) if (!onlyDone || studied.has(q.chapter)) pool.push(fromOptions(q.chapter, q.question, q.options, q.correct, q.explain, rnd));

  // carte di Memoria a scelta multipla (solo codici e concetti, non i comandi)
  const cards = buildCards(onlyDone ? completed : allIds, onlyDone ? known : []).filter((c) => c.kind === 'fact');
  for (const card of cards) {
    const ex = exerciseFor(card, 0, rnd);
    if (ex.type !== 'choice') continue;
    pool.push({
      chapter: 'memoria',
      question: ex.prompt,
      options: ex.options,
      correct: ex.correct,
      code: ex.optionsCode,
      explain: card.note ? `Risposta: **${card.answer}** (${card.note}).` : `Risposta: **${card.answer}**.`,
    });
  }
  return pool;
}

/**
 * Sceglie n domande bilanciando i capitoli: a turno una per capitolo, in ordine casuale,
 * con al massimo un quarto di domande dalle carte di Memoria.
 */
export function buildExam(pool: readonly ExamQ[], n: number, rnd: Rnd = Math.random): ExamQ[] {
  const byCh = new Map<string, ExamQ[]>();
  for (const q of shuffle(pool, rnd)) {
    const l = byCh.get(q.chapter) ?? [];
    l.push(q);
    byCh.set(q.chapter, l);
  }
  const maxMemory = Math.floor(n / 4);
  const out: ExamQ[] = [];
  let memory = 0;
  const chapters = shuffle([...byCh.keys()], rnd);
  while (out.length < n) {
    let added = false;
    for (const ch of chapters) {
      if (out.length >= n) break;
      if (ch === 'memoria' && memory >= maxMemory) continue;
      const q = byCh.get(ch)!.shift();
      if (!q) continue;
      out.push(q);
      if (ch === 'memoria') memory++;
      added = true;
    }
    if (!added) break;
  }
  return shuffle(out, rnd);
}

export interface ExamResult {
  score: number;
  total: number;
  pct: number;
  passed: boolean;
  /** per capitolo: [giuste, totali] */
  byChapter: [string, number, number][];
}

export function grade(qs: readonly ExamQ[], answers: readonly (number | null)[], pass: number): ExamResult {
  const per = new Map<string, [number, number]>();
  let score = 0;
  qs.forEach((q, i) => {
    const ok = answers[i] === q.correct;
    if (ok) score++;
    const cur = per.get(q.chapter) ?? [0, 0];
    per.set(q.chapter, [cur[0] + (ok ? 1 : 0), cur[1] + 1]);
  });
  const pct = qs.length ? Math.round((score / qs.length) * 100) : 0;
  const order = new Map(CHAPTERS.map((c, i) => [c.id, i]));
  const byChapter = [...per].map(([ch, [ok, tot]]) => [ch, ok, tot] as [string, number, number]).sort((a, b) => (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99));
  return { score, total: qs.length, pct, passed: pct >= pass, byChapter };
}

export function chapterName(id: string): string {
  if (id === 'memoria') return 'Codici e concetti';
  const c = CHAPTERS.find((x) => x.id === id);
  return c ? `${c.code} · ${c.title}` : id;
}

export interface ExamRecord {
  kind: ExamKind;
  /** giorno (vedi today()) */
  day: number;
  score: number;
  total: number;
  pct: number;
  passed: boolean;
  /** secondi impiegati */
  secs: number;
}
