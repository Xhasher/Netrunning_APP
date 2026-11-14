// Comandi già spiegati prima di un certo passo: serve a nasconderli nei compiti
// quando il giocatore li ha già visti in una lezione o usati con successo.

import { CHAPTERS } from '../content';
import { commandsInMarkup } from './cmdparse';

export { PROSE_SKIP, cmdName, commandsInLine, commandsInMarkup } from './cmdparse';

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
