// Schede di studio: prima del primo esercizio che usa un comando, il corso inserisce
// una lezione completa presa dal Manuale (a cosa serve, come si scrive, tutte le
// opzioni, esempi DIVERSI dall'esercizio, errori comuni). Così l'esercizio che segue
// si fa a memoria e non copiando.

import '../engine/manual';
import { MANPAGES, type ManPage } from '../engine/manpages';
import { commandsInLine } from '../game/cmdparse';
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

export function schedaFor(name: string, avoid: readonly string[] = []): LessonStep | null {
  const p = MANPAGES[name];
  if (!p || p.game || !rich(p)) return null;
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
  const skip = new Set(avoid.map(norm));
  const out: string[] = [];
  if (p.short) out.push(`**${name}**: ${p.short}.`);
  out.push(...p.description);
  if (p.synopsis && p.synopsis !== name) out.push('**Come si scrive**', '```\n' + p.synopsis + '\n```', 'Le parti tra parentesi quadre sono facoltative; le parole in MAIUSCOLO vanno sostituite con i tuoi valori.');
  if (p.options?.length) out.push('**Tutte le opzioni**', p.options.map(([k, d]) => `- \`${k}\` → ${d}`).join('\n'));
  const ex = (p.examples ?? []).filter(([l]) => !skip.has(norm(l)));
  if (ex.length) out.push('**Esempi** (diversi dall\'esercizio che ti aspetta). Se in un esempio compare un comando che non conosci ancora, va bene così: lo incontrerai più avanti.', ex.map(([l, d]) => '```\n' + l + '\n```\n' + d).join('\n\n'));
  for (const n of p.notes ?? []) out.push(`?? ${n}`);
  if (p.see?.length) out.push(`Collegati: ${p.see.map((s) => `\`${s}\``).join(', ')}. Ritrovi questa scheda quando vuoi nel **Manuale**.`);
  return { kind: 'lesson', title: `Scheda · ${name}`, body: out.join('\n\n'), scheda: name };
}

/** Inserisce le schede nel corso: una per comando, prima del primo compito che lo usa. */
export function addSchede(chapters: Chapter[]): void {
  const seen = new Set<string>();
  for (const ch of chapters)
    for (const m of ch.missions) {
      const steps: typeof m.steps = [];
      for (const s of m.steps) {
        if (s.kind === 'task') {
          const { topics, lines } = topicsOfTask(s);
          for (const t of topics) {
            if (seen.has(t)) continue;
            seen.add(t);
            const card = schedaFor(t, lines);
            if (card) steps.push(card);
          }
        }
        steps.push(s);
      }
      m.steps = steps;
    }
}
