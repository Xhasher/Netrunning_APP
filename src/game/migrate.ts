// Quando il corso guadagna passi nuovi (schede, esercizi), gli indici dei passi
// di una missione cambiano. I progressi salvati con la versione precedente vengono
// spostati sullo stesso passo di prima, così nessuno salta o ripete un esercizio.
// Ogni passo aggiunto porta "since": la versione in cui è arrivato.

import { CHAPTERS } from '../content';
import { CONTENT_VER, type SaveData } from './state';

export function migrateProgress(save: SaveData): SaveData {
  const v = save.contentVer ?? 0;
  if (v >= CONTENT_VER) return save;
  const progress: Record<string, number> = {};
  for (const [id, i] of Object.entries(save.progress ?? {})) {
    const m = CHAPTERS.flatMap((c) => c.missions).find((x) => x.id === id);
    if (!m) {
      progress[id] = i;
      continue;
    }
    // indici, nel corso di oggi, dei passi che esistevano già nella versione del salvataggio
    const old = m.steps.flatMap((s, k) => ((s.since ?? 0) > v ? [] : [k]));
    progress[id] = old[i] ?? Math.min(i + (m.steps.length - old.length), m.steps.length - 1);
  }
  return { ...save, progress, contentVer: CONTENT_VER };
}
