// Riconosce i comandi citati nei testi del corso: serve a nasconderli nei compiti
// quando il giocatore li ha già visti in una lezione o usati con successo.

import { CHAPTERS } from '../content';
import '../engine/manual';
import { ALIASES, MANPAGES } from '../engine/manpages';

/** Parole che nel testo normale (non nel codice) sono anche parole comuni: non si sfocano. */
export const PROSE_SKIP = new Set(['flag', 'hint', 'help', 'report', 'man', 'exit', 'cheat', 'date', 'id', 'test', 'last', 'free', 'which', 'who', 'w', 'file', 'sort', 'cut', 'tree', 'env', 'for', 'if', 'pipe', 'regex']);

const SKIP_WORDS = new Set(['do', 'then', 'else', 'done', 'fi', 'in', '{', '}']);

/** Nome canonico di un comando (o null se la parola non è un comando conosciuto). */
export function cmdName(word: string): string | null {
  if (!word) return null;
  if (/^[A-Za-z_]\w*=/.test(word)) return 'assign';
  if (word.startsWith('./')) return 'script';
  const n = ALIASES[word] ?? ALIASES[word.toLowerCase()] ?? word;
  return MANPAGES[n] && !MANPAGES[n].game ? n : null;
}

/** Comandi in una riga di shell: spezza su pipe, && , || e ; e prende la prima parola di ogni pezzo. */
export function commandsInLine(line: string): string[] {
  const out: string[] = [];
  for (const seg of line.split(/\||&&|\|\||;/)) {
    const words = seg.trim().split(/\s+/);
    let w = words.shift() ?? '';
    while (SKIP_WORDS.has(w) && words.length) w = words.shift()!;
    if (w === 'sudo' && words.length) {
      out.push('sudo');
      w = words.shift() ?? '';
    }
    const c = cmdName(w);
    if (c) out.push(c);
  }
  return out;
}

/** Tutti i comandi citati in un testo del corso (blocchi di codice e codice in linea). */
export function commandsInMarkup(md: string): string[] {
  const found = new Set<string>();
  for (const b of md.matchAll(/```\n?([\s\S]*?)```/g)) for (const l of b[1].split('\n')) for (const c of commandsInLine(l.replace(/^[$#]\s*/, ''))) found.add(c);
  const noBlocks = md.replace(/```[\s\S]*?```/g, '');
  for (const m of noBlocks.matchAll(/`([^`]+)`/g)) for (const c of commandsInLine(m[1])) found.add(c);
  return [...found];
}

let taughtCache: Map<string, Set<string>[]> | null = null;

/**
 * Per ogni passo di ogni missione: i comandi spiegati in una LEZIONE precedente
 * (in qualsiasi capitolo o passo anteriore). Servono a decidere cosa nascondere nei compiti.
 */
export function taughtBefore(missionId: string, stepIndex: number): Set<string> {
  if (!taughtCache) {
    taughtCache = new Map();
    const running = new Set<string>();
    for (const ch of CHAPTERS)
      for (const m of ch.missions) {
        const perStep: Set<string>[] = [];
        for (const s of m.steps) {
          perStep.push(new Set(running));
          if (s.kind === 'lesson') for (const c of commandsInMarkup(s.body)) running.add(c);
        }
        taughtCache.set(m.id, perStep);
      }
  }
  return taughtCache.get(missionId)?.[stepIndex] ?? new Set();
}
