// Schede di studio: prima del primo esercizio che usa un comando, il corso inserisce
// una lezione completa presa dal Manuale (a cosa serve, come si scrive, tutte le
// opzioni, esempi DIVERSI dall'esercizio, errori comuni). Così l'esercizio che segue
// si fa a memoria e non copiando.

import '../engine/manual';
import { MANPAGES, type ManPage } from '../engine/manpages';
import { commandsInLine, flagsInLine, optHead } from '../game/cmdparse';
import type { Chapter, LessonStep, TaskStep } from '../game/types';

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

/** Vale la pena dedicarle una lezione? (le schede di una riga non aggiungono nulla) */
function rich(p: ManPage): boolean {
  return (p.options?.length ?? 0) > 0 || (p.examples?.length ?? 0) > 1 || p.description.length > 1;
}

/** Versione dei contenuti che ha introdotto le schede a livelli. */
export const LEVELS_VER = 13;

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Opzioni del Manuale usate da un comando in un gruppo di righe. */
function flagsOf(name: string, lines: readonly string[]): string[] {
  return [...new Set(lines.flatMap((l) => flagsInLine(l)[name] ?? []))];
}

/**
 * Scheda completa di un comando. Le opzioni sono divise in due: quelle che servono
 * nell'esercizio che segue (da imparare adesso) e le altre, per quando serviranno.
 * Non si toglie niente: cambia solo l'ordine in cui le cose vengono chieste.
 */
export function schedaFor(name: string, avoid: readonly string[] = []): LessonStep | null {
  const p = MANPAGES[name];
  if (!p || p.game || !rich(p)) return null;
  const skip = new Set(avoid.map(norm));
  const now = new Set(flagsOf(name, avoid));
  const out: string[] = [];
  if (p.short) out.push(`**${name}**: ${p.short}.`);
  out.push(...p.description);
  if (p.synopsis && p.synopsis !== name) out.push('**Come si scrive**', '```\n' + p.synopsis + '\n```', 'Le parti tra parentesi quadre sono facoltative; le parole in MAIUSCOLO vanno sostituite con i tuoi valori.');
  const opts = p.options ?? [];
  const mine = opts.filter(([k]) => now.has(optHead(k)));
  const rest = opts.filter(([k]) => !now.has(optHead(k)));
  const line = ([k, d]: [string, string]) => `- \`${k}\` → ${d}`;
  if (mine.length) {
    out.push('**Le opzioni che userai adesso**', mine.map(line).join('\n'));
    if (rest.length) out.push('**Le altre opzioni**, da leggere ma non da imparare a memoria oggi: ognuna tornerà in un esercizio, con una scheda breve, quando servirà.', rest.map(line).join('\n'));
  } else if (opts.length) {
    out.push(rest.length > 3 ? '**Opzioni**. Nel prossimo esercizio il comando si usa senza opzioni: queste leggile, le userai più avanti una alla volta.' : '**Opzioni**', rest.map(line).join('\n'));
  }
  const ex = (p.examples ?? []).filter(([l]) => !skip.has(norm(l)));
  if (ex.length) out.push('**Esempi** (diversi dall\'esercizio che ti aspetta). Se in un esempio compare un comando che non conosci ancora, va bene così: lo incontrerai più avanti.', ex.map(([l, d]) => '```\n' + l + '\n```\n' + d).join('\n\n'));
  for (const n of p.notes ?? []) out.push(`?? ${n}`);
  if (p.see?.length) out.push(`Collegati: ${p.see.map((s) => `\`${s}\``).join(', ')}. Ritrovi questa scheda quando vuoi nel **Manuale**.`);
  return { kind: 'lesson', title: `Scheda · ${name}`, body: out.join('\n\n'), scheda: name };
}

/** Scheda breve per un livello nuovo di un comando già visto: solo le opzioni nuove. */
export function livelloFor(name: string, fresh: readonly string[], known: readonly string[], avoid: readonly string[] = []): LessonStep | null {
  const p = MANPAGES[name];
  const opts = (p?.options ?? []).filter(([k]) => fresh.includes(optHead(k)));
  if (!p || !opts.length) return null;
  const skip = new Set(avoid.map(norm));
  const out: string[] = [];
  out.push(`Conosci già \`${name}\`: ${p.short || 'lo hai usato negli esercizi precedenti'}. Adesso serve un livello in più.`);
  out.push(opts.map(([k, d]) => `- \`${k}\` → ${d}`).join('\n'));
  const ex = (p.examples ?? []).filter(([l]) => !skip.has(norm(l)) && fresh.some((f) => (flagsInLine(l)[name] ?? []).includes(f)));
  if (ex.length) out.push('**Esempio**', ex.slice(0, 2).map(([l, d]) => '```\n' + l + '\n```\n' + d).join('\n\n'));
  if (known.length) out.push(`Le opzioni di \`${name}\` che hai già usato: ${known.map((f) => `\`${f}\``).join(', ')}. Si possono combinare con quelle nuove.`);
  out.push('La scheda completa resta nel **Manuale**.');
  return { kind: 'lesson', title: `Livello nuovo · ${name} ${fresh.join(' ')}`, body: out.join('\n\n'), scheda: name, since: LEVELS_VER };
}

/**
 * Inserisce le schede nel corso: una completa per comando, prima del primo compito che lo usa;
 * poi una breve ogni volta che un compito chiede un'opzione mai vista di quel comando.
 */
export function addSchede(chapters: Chapter[]): void {
  const seen = new Set<string>();
  const known = new Map<string, string[]>();
  for (const ch of chapters)
    for (const m of ch.missions) {
      const steps: typeof m.steps = [];
      for (const s of m.steps) {
        if (s.kind === 'task') {
          const { topics, lines } = topicsOfTask(s);
          for (const t of topics) {
            const used = flagsOf(t, lines);
            if (!seen.has(t)) {
              seen.add(t);
              const card = schedaFor(t, lines);
              if (card) steps.push(card);
              known.set(t, used);
              continue;
            }
            const k = known.get(t) ?? [];
            // già spiegata nella lezione della missione? allora niente scheda in più
            const taught = (f: string) => steps.some((x) => x.kind === 'lesson' && !x.scheda && x.body.includes(`${t} ${f}`));
            const fresh = used.filter((f) => !k.includes(f));
            known.set(t, [...k, ...fresh]);
            const todo = fresh.filter((f) => !taught(f));
            if (!todo.length) continue;
            const card = livelloFor(t, todo, k, lines);
            if (card) steps.push(card);
          }
        }
        steps.push(s);
      }
      m.steps = steps;
    }
}
