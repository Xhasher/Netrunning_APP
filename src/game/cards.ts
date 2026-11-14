// Palestra della memoria: carte a ripetizione spaziata.
//
// Le carte nascono da due fonti: i mazzi di "codici" (porte, Event ID, permessi...)
// e il Manuale (nome dei comandi, opzioni, esempi). Una carta entra in gioco solo
// quando l'argomento è stato affrontato nel corso.
//
// Ogni carta sale di "scatola" a ogni risposta giusta: più è alta la scatola, più
// tardi torna e più difficile è l'esercizio (riconoscere -> ricomporre -> scrivere).

import { CHAPTERS, allMissions } from '../content';
import { FACT_DECKS } from '../content/facts';
import '../content/world';
import '../engine/manual';
import { MANPAGES } from '../engine/manpages';
import { COMMANDS } from '../engine/shell';
import { commandsInLine, commandsInMarkup } from './cmdparse';

export type CardKind = 'fact' | 'cmd' | 'opt' | 'ex';

export interface Card {
  id: string;
  kind: CardKind;
  /** gruppo mostrato al giocatore */
  deck: string;
  /** ordine di introduzione: prima le cose imparate prima */
  order: number;
  /** domanda (mini-markdown in linea) */
  prompt: string;
  answer: string;
  accept?: string[];
  note?: string;
  /** la risposta è codice (va mostrata in monospazio e confrontata senza toccare le maiuscole) */
  code: boolean;
  /** si può chiedere di scriverla a mano */
  typeable: boolean;
  /** risposte sbagliate plausibili */
  pool: string[];
  /** solo opzioni: comando e descrizione, per la domanda inversa */
  cmd?: string;
  desc?: string;
  descPool?: string[];
}

export type Exercise =
  | { type: 'choice'; prompt: string; code?: string; options: string[]; correct: number; optionsCode: boolean }
  | { type: 'build'; prompt: string; tokens: string[]; answer: string[] }
  | { type: 'type'; prompt: string; answer: string; accept: string[]; code: boolean; lenient: boolean };

/** [scatola, giorno in cui torna] */
export type Srs = Record<string, [number, number]>;

/** Dopo quanti giorni torna una carta, per scatola. */
export const INTERVALS = [0, 1, 3, 7, 16, 35, 80];
export const MAX_BOX = INTERVALS.length - 1;
/** Da questa scatola in su la carta si considera "imparata". */
export const LEARNED_BOX = 3;

export function today(now = new Date()): number {
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
}

type Rnd = () => number;

export function shuffle<T>(arr: readonly T[], rnd: Rnd = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------- cosa è sbloccato

/** Comandi del Manuale non trattati nelle missioni: si sbloccano finendo il capitolo indicato. */
const EXTRA: Record<string, string[]> = {
  ch01: ['rmdir', 'which', 'file', 'stat'],
  ch03: ['chown', 'groups', 'df', 'du', 'free', 'uname', 'uptime', 'who', 'w', 'last', 'lastb', 'systemctl', 'tar', 'lsb_release'],
  ch04: ['tr', 'tee', 'xargs', 'diff', 'awk', 'sed', 'journalctl', 'strings'],
  ch05: ['seq', 'true', 'false'],
  ch06: ['md5sum', 'sha1sum', 'xxd'],
  ch09: ['netstat', 'traceroute', 'nslookup', 'nc'],
  ch10: ['crtsh', 'cve'],
};

let taughtAt: Map<string, number> | null = null;

/** Per ogni comando, l'indice della prima missione che lo spiega. */
function taughtIndex(): Map<string, number> {
  if (!taughtAt) {
    taughtAt = new Map();
    let i = 0;
    for (const ch of CHAPTERS)
      for (const m of ch.missions) {
        for (const s of m.steps) {
          if (s.kind === 'quiz') continue;
          const text = s.kind === 'task' ? [s.body, ...s.hints.map((h) => h)].join('\n') : s.body;
          for (const c of commandsInMarkup(text)) if (!taughtAt.has(c)) taughtAt.set(c, i);
        }
        i++;
      }
    // comandi che il corso non spiega in una missione: entrano dopo il capitolo più vicino
    let end = 0;
    for (const ch of CHAPTERS) {
      end += ch.missions.length;
      for (const c of EXTRA[ch.id] ?? []) if (!taughtAt.has(c) && MANPAGES[c]) taughtAt.set(c, end - 1);
    }
  }
  return taughtAt;
}

/** Comandi che il giocatore ha incontrato: spiegati in missioni completate oppure già usati. */
export function unlockedCommands(completed: readonly string[], known: readonly string[]): Map<string, number> {
  const out = new Map<string, number>();
  const done = new Set(completed);
  const idx = taughtIndex();
  const missions = allMissions();
  for (const [c, i] of idx) if (done.has(missions[i].id)) out.set(c, i);
  for (const c of known) if (!out.has(c) && MANPAGES[c] && !MANPAGES[c].game) out.set(c, idx.get(c) ?? missions.length);
  return out;
}

// ---------------------------------------------------------------- generazione

/** Spezza un comando in pezzi, tenendo insieme ciò che sta tra virgolette. */
export function tokenize(cmd: string): string[] {
  return cmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
}

const flagOf = (key: string) => key.split(/\s+/)[0];

function exampleOk(line: string, desc: string): boolean {
  if (line.includes('\n') || line.length > 64 || desc.length < 6) return false;
  const n = tokenize(line).length;
  return n >= 1 && n <= 9;
}

/** Tutte le carte disponibili per questo giocatore. */
export function buildCards(completed: readonly string[], known: readonly string[]): Card[] {
  const cards: Card[] = [];
  const done = new Set(completed);
  const missions = allMissions();
  const cmds = unlockedCommands(completed, known);
  const names = [...cmds.keys()].filter((c) => COMMANDS[c] && MANPAGES[c]?.short);
  const allFlags = new Set<string>();
  for (const c of cmds.keys()) for (const [k] of MANPAGES[c]?.options ?? []) if (!k.includes(' / ')) allFlags.add(flagOf(k));

  for (const deck of FACT_DECKS) {
    if (!done.has(deck.unlock)) continue;
    const base = missions.findIndex((m) => m.id === deck.unlock) * 1000 + 500;
    const answers = [...new Set(deck.items.map((i) => i.a))];
    const questions = deck.items.map((i) => i.q);
    deck.items.forEach((it, n) => {
      cards.push({
        id: `f:${deck.id}:${it.q}`,
        kind: 'fact',
        deck: deck.title,
        order: base + n * 2,
        prompt: deck.ask(it.q),
        answer: it.a,
        accept: it.accept,
        note: it.note,
        code: false,
        typeable: !!deck.typeFwd,
        pool: answers.filter((a) => a !== it.a && !(it.accept ?? []).includes(a.toLowerCase())),
      });
      if (deck.askReverse)
        cards.push({
          id: `r:${deck.id}:${it.q}`,
          kind: 'fact',
          deck: deck.title,
          order: base + n * 2 + 1,
          prompt: deck.askReverse(it.a),
          answer: it.q,
          accept: it.q.startsWith('/') ? [it.q.slice(1)] : undefined,
          note: it.note,
          code: false,
          typeable: true,
          pool: questions.filter((q) => q !== it.q),
        });
    });
  }

  for (const [name, idx] of cmds) {
    const page = MANPAGES[name];
    if (!page || page.game) continue;
    const base = idx * 1000;
    const deck = page.cat ?? 'Comandi';
    if (COMMANDS[name] && page.short)
      cards.push({
        id: `c:${name}`,
        kind: 'cmd',
        deck,
        order: base,
        prompt: `Quale comando serve a questo: **${page.short}**?`,
        answer: name,
        code: true,
        typeable: true,
        pool: names.filter((n) => n !== name && MANPAGES[n].short !== page.short),
      });
    const opts = (page.options ?? []).filter(([k]) => !k.includes(' / '));
    const flags = opts.map(([k]) => flagOf(k));
    opts.forEach(([key, desc], n) => {
      const flag = flagOf(key);
      if (flags.indexOf(flag) !== n) return; // stessa opzione con due forme: una carta sola
      cards.push({
        id: `o:${name}:${flag}`,
        kind: 'opt',
        deck,
        order: base + 10 + n,
        prompt: `In \`${name}\`, quale opzione fa questo: **${desc}**?`,
        answer: flag,
        accept: key !== flag ? [key] : undefined,
        code: true,
        typeable: true,
        pool: [...flags.filter((f) => f !== flag), ...[...allFlags].filter((f) => !flags.includes(f))],
        cmd: name,
        desc,
        descPool: opts.filter(([k]) => flagOf(k) !== flag).map(([, d]) => d),
      });
    });
    (page.examples ?? []).forEach(([line, desc], n) => {
      if (!exampleOk(line, desc)) return;
      const used = commandsInLine(line);
      if (!used.every((c) => cmds.has(c) || c === 'assign' || c === 'script')) return;
      const toks = tokenize(line);
      cards.push({
        id: `x:${name}:${n}`,
        kind: 'ex',
        deck,
        order: base + 100 + n,
        prompt: `Scrivi il comando: **${desc}**`,
        answer: line,
        code: true,
        typeable: true,
        pool: [...flags.filter((f) => !toks.includes(f)), ...names.filter((c) => !toks.includes(c))],
        cmd: name,
      });
    });
  }
  return cards.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------- esercizi

function pick(pool: readonly string[], n: number, rnd: Rnd, not: readonly string[] = []): string[] {
  return shuffle([...new Set(pool)].filter((p) => !not.includes(p)), rnd).slice(0, n);
}

function choice(prompt: string, right: string, wrong: string[], optionsCode: boolean, rnd: Rnd, code?: string): Exercise {
  const options = shuffle([right, ...wrong], rnd);
  return { type: 'choice', prompt, code, options, correct: options.indexOf(right), optionsCode };
}

/** L'esercizio adatto alla scatola: 0-1 riconoscere, 2 ricomporre, 3+ scrivere. */
export function exerciseFor(card: Card, box: number, rnd: Rnd = Math.random): Exercise {
  const typed = (lenient = false): Exercise => ({
    type: 'type',
    prompt: card.prompt,
    answer: card.answer,
    accept: card.accept ?? [],
    code: card.code,
    lenient,
  });
  const fallback = () => choice(card.prompt, card.answer, pick(card.pool, 3, rnd, [card.answer]), card.code, rnd);

  if (card.kind === 'opt') {
    if (box === 0 && card.descPool && card.desc) {
      // con poche opzioni le alternative vengono da altri comandi (pescate dal pool delle descrizioni)
      const wrong = pick(card.descPool, 3, rnd, [card.desc]);
      if (wrong.length >= 2) return choice(`Cosa fa l'opzione \`${card.answer}\` di \`${card.cmd}\`?`, card.desc, wrong, false, rnd);
    }
    if (box <= 1) return fallback();
    return typed();
  }

  if (card.kind === 'ex') {
    const toks = tokenize(card.answer);
    if (box === 0 || toks.length < 2) {
      if (box >= 2) return typed(true);
      // completa: si nasconde un'opzione (se c'è) oppure il nome del comando
      const flagIdx = toks.findIndex((t, i) => i > 0 && /^-{1,2}[A-Za-z]/.test(t));
      const hide = flagIdx > 0 ? flagIdx : 0;
      const isFlag = hide > 0;
      const wrong = pick(
        card.pool.filter((p) => p.startsWith('-') === isFlag),
        3,
        rnd,
        [toks[hide]],
      );
      if (wrong.length >= 2) {
        const shown = toks.map((t, i) => (i === hide ? '____' : t)).join(' ');
        return choice(`Completa il comando: **${card.prompt.replace(/^Scrivi il comando: \*\*|\*\*$/g, '')}**`, toks[hide], wrong, true, rnd, shown);
      }
    }
    if (box <= 2) {
      const extra = pick(card.pool, Math.min(2, Math.max(1, 6 - toks.length)), rnd, toks);
      return { type: 'build', prompt: card.prompt.replace('Scrivi', 'Ricomponi'), tokens: shuffle([...toks, ...extra], rnd), answer: toks };
    }
    return typed(true);
  }

  // codici e nomi dei comandi
  if (box <= 1 || !card.typeable) {
    const n = box >= 2 ? 5 : 3;
    return choice(card.prompt, card.answer, pick(card.pool, n, rnd, [card.answer]), card.code, rnd);
  }
  return typed();
}

const plain = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');

const codeNorm = (s: string) => s.trim().replace(/\s+/g, ' ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

/** La risposta scritta a mano è giusta? */
export function checkTyped(ex: Extract<Exercise, { type: 'type' }>, given: string): boolean {
  const all = [ex.answer, ...ex.accept];
  if (ex.code) {
    const g = codeNorm(given);
    return all.some((a) => codeNorm(a) === g || codeNorm(a).replace(/'/g, '"') === g.replace(/'/g, '"'));
  }
  const g = plain(given);
  return g !== '' && all.some((a) => plain(a) === g);
}

// ---------------------------------------------------------------- ripetizione spaziata

/** Aggiorna la scatola dopo una risposta. Nel ripasso anticipato una risposta giusta non sposta nulla. */
export function review(srs: Srs, id: string, ok: boolean, day: number, early = false): void {
  const cur = srs[id];
  if (ok) {
    if (early && cur) return;
    const box = Math.min(MAX_BOX, (cur?.[0] ?? 0) + 1);
    srs[id] = [box, day + INTERVALS[box]];
  } else {
    const box = Math.max(0, (cur?.[0] ?? 0) - 2);
    srs[id] = [box, day + INTERVALS[box]];
  }
}

export interface SessionItem {
  card: Card;
  box: number;
  isNew: boolean;
  early: boolean;
}

export interface Stats {
  total: number;
  seen: number;
  learned: number;
  due: number;
  fresh: number;
}

export function stats(cards: readonly Card[], srs: Srs, day: number): Stats {
  let seen = 0;
  let learned = 0;
  let due = 0;
  for (const c of cards) {
    const s = srs[c.id];
    if (!s) continue;
    seen++;
    if (s[0] >= LEARNED_BOX) learned++;
    if (s[1] <= day) due++;
  }
  return { total: cards.length, seen, learned, due, fresh: cards.length - seen };
}

/**
 * Compone una sessione breve e mescolata: prima le carte in scadenza, poi qualche carta nuova.
 * Se non c'è nulla in scadenza né di nuovo, propone un ripasso anticipato delle carte più deboli.
 */
export function buildSession(cards: readonly Card[], srs: Srs, day: number, size = 12, maxNew = 6, rnd: Rnd = Math.random): SessionItem[] {
  const due = cards.filter((c) => srs[c.id] && srs[c.id][1] <= day).sort((a, b) => srs[a.id][1] - srs[b.id][1] || srs[a.id][0] - srs[b.id][0]);
  const fresh = cards.filter((c) => !srs[c.id]);
  const nNew = Math.min(maxNew, fresh.length, Math.max(size - due.length, Math.min(3, size)));
  const items: SessionItem[] = [];
  for (const c of due.slice(0, size - nNew)) items.push({ card: c, box: srs[c.id][0], isNew: false, early: false });
  for (const c of fresh.slice(0, nNew)) items.push({ card: c, box: 0, isNew: true, early: false });
  if (items.length < size) {
    const used = new Set(items.map((i) => i.card.id));
    const rest = cards.filter((c) => srs[c.id] && !used.has(c.id)).sort((a, b) => srs[a.id][0] - srs[b.id][0] || srs[a.id][1] - srs[b.id][1]);
    // ripasso anticipato solo se la sessione sarebbe altrimenti vuota o quasi
    if (items.length < 4) for (const c of rest.slice(0, size - items.length)) items.push({ card: c, box: srs[c.id][0], isNew: false, early: true });
  }
  return shuffle(items, rnd);
}

export interface Streak {
  day: number;
  count: number;
  best: number;
}

/** Registra una sessione completata oggi e restituisce la serie aggiornata. */
export function bumpStreak(s: Streak, day: number): Streak {
  if (s.day === day) return s;
  const count = s.day === day - 1 ? s.count + 1 : 1;
  return { day, count, best: Math.max(s.best, count) };
}

/** La serie è ancora viva? (oggi o ieri) */
export function liveStreak(s: Streak, day: number): number {
  return s.day >= day - 1 ? s.count : 0;
}
