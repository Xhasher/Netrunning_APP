// Prerequisiti degli esercizi generati (Palestra e Simulazioni).
//
// Gli esercizi sono generati a caso, quindi i prerequisiti non si scrivono a mano: si ricavano
// dalla soluzione di riferimento. Ogni generatore viene fatto girare con alcuni semi diversi su
// un deck di prova, e i comandi delle sue soluzioni diventano le competenze richieste.
// Un esercizio entra in gioco solo quando tutte sono state insegnate.

import { GENERATORS, makeRng, type Ctx, type Level } from '../content/drills';
import { PALESTRA, type PalEx } from '../content/palestra';
import { buildWorld } from '../content/world';
import type { Shell } from '../engine/shell';
import type { ActivityMeta, Difficulty } from './engine';
import { skillsInLine } from './skills';

const SEEDS = [11, 2077, 424242];

let scratch: Shell | null = null;
const deck = (): Shell => (scratch ??= buildWorld('prova'));

const cache = new Map<string, string[]>();

function requiresOf(key: string, run: (c: Ctx) => { solve: string[] }, lv: Level): string[] {
  const hit = cache.get(key);
  if (hit) return hit;
  const out = new Set<string>();
  SEEDS.forEach((seed, i) => {
    try {
      const d = run({ sh: deck(), r: makeRng(seed), lv, dir: `pre/${key.replace(/[^\w-]/g, '_')}-${i}` });
      for (const line of d.solve) skillsInLine(line).forEach((s) => out.add(s));
    } catch {
      /* un generatore che fallisce qui fallirebbe anche in gioco: lo segnala il test */
    }
  });
  const list = [...out].sort();
  cache.set(key, list);
  return list;
}

/** Competenze richieste da un esercizio della Palestra (comprese quella allenata). */
export function palRequires(e: PalEx): string[] {
  return requiresOf(`pal:${e.id}`, (c) => e.make(c), e.lv);
}

/** Competenze richieste da una sfida delle Simulazioni a un certo livello. */
export function genRequires(chapter: string, genId: string, lv: Level): string[] {
  const g = (GENERATORS[chapter] ?? []).find((x) => x.id === genId);
  if (!g) return [];
  return requiresOf(`sim:${chapter}:${genId}:${lv}`, (c) => g.make(c), lv);
}

/** Carta d'identità di un esercizio della Palestra. */
export function palMeta(e: PalEx): ActivityMeta {
  return {
    id: `pal:${e.id}`,
    chapter: 'palestra',
    topics: [e.skill],
    skills: [e.skill],
    requires: palRequires(e),
    level: e.lv as Difficulty,
    kind: 'palestra',
    goal: `Usare ${e.skill} da solo, al livello ${e.lv}.`,
    criteria: 'Risolto senza suggerimenti: vale per l\'autonomia. Con suggerimenti: vale solo come esercizio.',
  };
}

/** Tutti gli esercizi della Palestra con i loro prerequisiti (per i test e la pagina Competenze). */
export function palestraMetas(): ActivityMeta[] {
  return PALESTRA.map(palMeta);
}
