// Riconosce i comandi citati nei testi del corso (senza dipendere dai contenuti).

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

