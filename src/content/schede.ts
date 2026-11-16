// Lezioni sui comandi: prima del primo esercizio che usa un comando, il corso inserisce
// una lezione in cui Nyx lo spiega da capo (vedi content/teach.ts): perché serve, com'è
// fatto pezzo per pezzo, cosa risponde davvero il terminale e come si legge, le opzioni
// che servono adesso, gli errori tipici. Per i comandi senza una lezione scritta a mano
// si usa la stessa struttura con i testi del Manuale. Gli esempi si eseguono dal vivo
// quando la lezione viene mostrata (content/live.ts): i blocchi che finiscono con
// %%OUT%% vengono completati con l'output vero.

import '../engine/manual';
import { MANPAGES, type ManPage } from '../engine/manpages';
import { commandsInLine, flagsInLine, optHead } from '../game/cmdparse';
import type { Chapter, LessonStep, TaskStep } from '../game/types';
import { TEACH } from './teach';

const CONCEPT: Record<string, string> = { assign: 'variabili' };

function blocks(md: string): string[] {
  return [...md.matchAll(/```\n?([\s\S]*?)```/g)].flatMap((b) => b[1].split('\n')).map((l) => l.replace(/^[$#]\s+/, '').trim()).filter(Boolean);
}

/** Comandi e concetti che un compito chiede di usare (dai blocchi di codice e dalla soluzione). */
export function topicsOfTask(t: TaskStep): { topics: string[]; lines: string[] } {
  const lines = blocks(t.body);
  const last = t.hints[t.hints.length - 1] ?? '';
  const sol = last.includes(': ') ? last.slice(last.lastIndexOf(': ') + 2) : last;
  const all = lines.length ? lines : commandsInLine(sol).length ? [sol] : [];
  const topics: string[] = [];
  const add = (n: string) => {
    const name = CONCEPT[n] ?? n;
    if (MANPAGES[name] && !MANPAGES[name].game && !topics.includes(name)) topics.push(name);
  };
  for (const l of all) {
    for (const c of commandsInLine(l)) add(c);
    if (/\s\|\s/.test(l)) add('pipe');
    if (/\s2?>>?\s/.test(l)) add('redirezioni');
    if (/(^|\s)[^\s"']*\*[^\s"']*/.test(l) && !/grep|awk|sed/.test(l)) add('jolly');
  }
  return { topics, lines: all };
}

/** Vale la pena dedicarle una lezione? (i comandi di una riga non ne hanno bisogno) */
function rich(p: ManPage): boolean {
  return !!TEACH[p.name] || (p.options?.length ?? 0) > 0 || (p.examples?.length ?? 0) > 1 || p.description.length > 1;
}

/** Versione dei contenuti che ha introdotto le schede a livelli. */
export const LEVELS_VER = 13;

/** Segnaposto: il blocco viene completato con l'output vero quando la lezione è mostrata. */
export const LIVE = '%%OUT%%';

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
/** Come LIVE, ma l'esempio parte da un deck pulito (non dipende dagli esempi precedenti). */
export const LIVE_FRESH = '%%OUT:nuovo%%';
const live = (cmds: readonly string[], fresh = false) => '```\n' + cmds.map((c) => `$ ${c}`).join('\n') + `\n${fresh ? LIVE_FRESH : LIVE}\n` + '```';

/** Esempi che non si possono eseguire da soli in una lezione. */
const NOT_LIVE = [/^!!/, /^nano\b/, /^sudo nano\b/, /^ssh\b/, /^exit\b/, /^flag\b/, /^report\b/, /^hint\b/, /^python3?\b/, /^pwsh$/, /^clear\b/];
const canRun = (cmd: string) => !NOT_LIVE.some((r) => r.test(cmd));

/** Opzioni del Manuale usate da un comando in un gruppo di righe. */
function flagsOf(name: string, lines: readonly string[]): string[] {
  return [...new Set(lines.flatMap((l) => flagsInLine(l)[name] ?? []))];
}

/** Un esempio usa solo comandi e concetti che il giocatore ha già incontrato? */
function onlyKnown(cmd: string, name: string, known: ReadonlySet<string>): boolean {
  const ok = (c: string) => c === name || known.has(CONCEPT[c] ?? c);
  if (!commandsInLine(cmd).every(ok)) return false;
  if (/\s\|\s/.test(cmd) && !ok('pipe')) return false;
  if (/\s2?>>?\s/.test(cmd) && !ok('redirezioni')) return false;
  if (/\$\(|\bfor\b|\bif\b/.test(cmd) && !ok('variabili')) return false;
  return true;
}

/**
 * La lezione di un comando. "avoid" sono le righe dell'esercizio che segue (per non
 * regalare la soluzione negli esempi e per sapere quali opzioni servono subito);
 * "known" i comandi già incontrati, per non mostrare esempi con comandi mai visti.
 */
export function schedaFor(name: string, avoid: readonly string[] = [], known: ReadonlySet<string> = new Set()): LessonStep | null {
  const p = MANPAGES[name];
  if (!p || p.game || !rich(p)) return null;
  const t = TEACH[name];
  const skip = new Set(avoid.map(norm));
  const now = new Set(flagsOf(name, avoid));
  const out: string[] = [];
  const line = ([k, d]: [string, string]) => `- \`${k}\` → ${d}`;

  // 1. perché
  out.push(`@nyx: ${t ? t.why : `Ti serve uno strumento nuovo: \`${name}\`. ${p.short ? p.short.replace(/^./, (c) => c.toUpperCase()) + '.' : ''}`}`);

  // 2. cosa fa
  out.push('**Cosa fa**', ...(t?.what ?? p.description));

  // 3. com'è fatto
  if (t) {
    out.push('**Com\'è fatto**', '```\n' + t.form + '\n```', t.parts.map(([k, d]) => `- \`${k}\` → ${d}`).join('\n'));
  } else if (p.synopsis && p.synopsis !== name) {
    out.push('**Com\'è fatto**', '```\n' + p.synopsis + '\n```', 'Si legge così: le parti tra parentesi quadre `[ ]` sono facoltative; le parole in MAIUSCOLO vanno sostituite con i tuoi valori (un nome di file, un numero...).');
  }

  // 4. la risposta vera
  const used = new Set<string>();
  const demo = t?.demo ?? (p.examples ?? []).map(([l]) => l).filter((l) => !skip.has(norm(l)) && canRun(l) && onlyKnown(l, name, known)).slice(0, 1);
  if (demo.length) {
    demo.forEach((d) => used.add(norm(d)));
    out.push('**Guarda cosa risponde**', 'Questo è il terminale vero del tuo deck: i comandi dopo il `$` sono stati eseguiti adesso, e sotto c\'è la risposta.', live(demo));
    if (t?.read?.length) out.push('**Come si legge**', t.read.map((r) => `- ${r}`).join('\n'));
    else if (!t) {
      const ex = (p.examples ?? []).find(([l]) => norm(l) === norm(demo[0]));
      if (ex) out.push(`Cioè: ${ex[1]}.`);
    }
  }

  // 5. le opzioni che servono adesso
  const opts = p.options ?? [];
  const mine = opts.filter(([k]) => now.has(optHead(k)));
  const rest = opts.filter(([k]) => !now.has(optHead(k)));
  if (mine.length) {
    out.push('**Le opzioni che ti servono adesso**', 'Un\'**opzione** è una parola in più, di solito con un trattino davanti, che cambia il modo in cui il comando lavora.');
    for (const o of mine) {
      out.push(line(o));
      const d = t?.optDemo?.[optHead(o[0])];
      if (d && !skip.has(norm(d))) {
        used.add(norm(d));
        out.push(live([d]));
      }
    }
  }

  // 6. gli errori tipici
  if (t?.mistakes?.length) {
    out.push('**Gli errori che farai (li fanno tutti)**', 'Un messaggio di errore non è un rimprovero: è il terminale che ti dice cosa non ha capito. Impara a leggerli.');
    for (const [cmd, why] of t.mistakes) out.push(live([cmd]), why);
  }

  // 7. altri esempi, solo con cose già viste
  const more = (p.examples ?? []).filter(([l]) => !skip.has(norm(l)) && !used.has(norm(l)) && canRun(l) && onlyKnown(l, name, known) && flagsOf(name, [l]).every((f) => now.has(f)));
  if (more.length) {
    out.push('**Altri esempi**');
    for (const [l, d] of more.slice(0, 3)) out.push(live([l], true), `${d.replace(/^./, (c) => c.toUpperCase())}.`);
  }

  // 8. il resto, per dopo
  if (rest.length)
    out.push(
      mine.length || t ? '**Per dopo**' : '**Le opzioni**',
      `\`${name}\` ha anche altre opzioni. ${mine.length ? 'Non servono adesso' : 'Nel prossimo esercizio non servono'}: leggile una volta, per sapere che esistono. Ognuna tornerà con la sua spiegazione quando un esercizio la chiederà.`,
      rest.map(line).join('\n'),
    );

  // 9. dal mestiere, e la cosa da ricordare
  for (const n of (p.notes ?? []).slice(0, t ? 2 : 3)) out.push(`?? ${n}`);
  if (t) out.push(t.remember.startsWith('!! ') ? t.remember : `@nyx: ${t.remember}`);
  return { kind: 'lesson', title: `Nyx spiega · ${name}`, body: out.join('\n\n'), scheda: name };
}

/** Lezione breve per un'opzione nuova di un comando già visto. */
export function livelloFor(name: string, fresh: readonly string[], knownFlags: readonly string[], avoid: readonly string[] = [], known: ReadonlySet<string> = new Set()): LessonStep | null {
  const p = MANPAGES[name];
  const opts = (p?.options ?? []).filter(([k]) => fresh.includes(optHead(k)));
  if (!p || !opts.length) return null;
  const t = TEACH[name];
  const skip = new Set(avoid.map(norm));
  const out: string[] = [];
  out.push(`@nyx: \`${name}\` lo conosci già: ${p.short || 'lo hai usato negli esercizi precedenti'}. Per il prossimo esercizio ti serve una cosa in più.`);
  for (const [k, d] of opts) {
    out.push(`- \`${k}\` → ${d}`);
    const own = t?.optDemo?.[optHead(k)];
    const allowed = new Set([...knownFlags, ...fresh]);
    const fromMan = (p.examples ?? [])
      .map(([l]) => l)
      .find((l) => !skip.has(norm(l)) && canRun(l) && onlyKnown(l, name, known) && (flagsInLine(l)[name] ?? []).includes(optHead(k)) && (flagsInLine(l)[name] ?? []).every((f) => allowed.has(f)));
    const d2 = own && !skip.has(norm(own)) ? own : fromMan;
    if (d2) {
      out.push(live([d2], true));
      const ex = (p.examples ?? []).find(([l]) => norm(l) === norm(d2));
      if (ex) out.push(`Cioè: ${ex[1]}.`);
    }
  }
  if (knownFlags.length) out.push(`Le opzioni di \`${name}\` che hai già usato: ${knownFlags.map((f) => `\`${f}\``).join(', ')}. Si possono combinare con quella nuova.`);
  return { kind: 'lesson', title: `Un passo in più · ${name} ${fresh.join(' ')}`, body: out.join('\n\n'), scheda: name, since: LEVELS_VER };
}

/**
 * Inserisce le lezioni nel corso: una completa per comando, prima del primo compito che lo usa;
 * poi una breve ogni volta che un compito chiede un'opzione mai vista di quel comando.
 */
export function addSchede(chapters: Chapter[]): void {
  const seen = new Set<string>();
  const knownFlags = new Map<string, string[]>();
  for (const ch of chapters)
    for (const m of ch.missions) {
      const steps: typeof m.steps = [];
      for (const s of m.steps) {
        const after: typeof m.steps = [];
        if (s.kind === 'task') {
          const { topics, lines } = topicsOfTask(s);
          for (const t of topics) {
            const used = flagsOf(t, lines);
            if (!seen.has(t)) {
              const card = schedaFor(t, s.lessonAfter ? [] : lines, seen);
              seen.add(t);
              if (card) (s.lessonAfter ? after : steps).push(card);
              knownFlags.set(t, used);
              continue;
            }
            const k = knownFlags.get(t) ?? [];
            // già spiegata nella lezione della missione? allora niente lezione in più
            const taught = (f: string) => steps.some((x) => x.kind === 'lesson' && !x.scheda && x.body.includes(`${t} ${f}`));
            const fresh = used.filter((f) => !k.includes(f));
            knownFlags.set(t, [...k, ...fresh]);
            const todo = fresh.filter((f) => !taught(f));
            if (!todo.length || s.ownLesson) continue;
            const card = livelloFor(t, todo, k, lines, seen);
            if (card) steps.push(card);
          }
        }
        steps.push(s, ...after);
      }
      m.steps = steps;
    }
}
