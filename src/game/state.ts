import { allMissions } from '../content';
import type { LogEntry } from './coach';

const KEY = 'nc-edgerunner-save-v1';

export interface SaveData {
  handle: string | null;
  xp: number;
  completed: string[];
  /** passo raggiunto nelle missioni in corso */
  progress: Record<string, number>;
  fontScale: number;
  /** operazioni completate */
  ops: string[];
  /** miglior punteggio nei mini giochi */
  best: Record<string, number>;
  /** comandi che il giocatore ha già usato con successo */
  known: string[];
  /** nasconde nei compiti i comandi già conosciuti (da toccare per vederli) */
  hideKnown: boolean;
  /** ultime impostazioni delle simulazioni */
  sim: { chapters: string[]; level: 1 | 2 | 3 };
  /** Palestra della memoria: per ogni carta [scatola, giorno in cui torna] */
  srs: Record<string, [number, number]>;
  /** giorni consecutivi di allenamento */
  streak: { day: number; count: number; best: number };
  /** diario dei comandi di ogni missione (l'ultima volta che è stata giocata) */
  logs: Record<string, LogEntry[]>;
}

export function defaultSave(): SaveData {
  return { handle: null, xp: 0, completed: [], progress: {}, fontScale: 1, ops: [], best: {}, known: [], hideKnown: true, sim: { chapters: [], level: 1 }, srs: {}, streak: { day: 0, count: 0, best: 0 }, logs: {} };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    return { ...defaultSave(), ...JSON.parse(raw) };
  } catch {
    return defaultSave();
  }
}

export function writeSave(s: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* salvataggio non disponibile: il gioco continua lo stesso */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}

export const RANKS: [number, string][] = [
  [0, 'Pivello'],
  [400, 'Runner di strada'],
  [1200, 'Netrunner'],
  [2500, 'Edgerunner'],
  [4000, 'Analista di Night City'],
  [5000, 'Leggenda di Night City'],
]

export function rankFor(xp: number): { name: string; next: number | null; floor: number } {
  let idx = 0;
  RANKS.forEach(([min], i) => {
    if (xp >= min) idx = i;
  });
  return { name: RANKS[idx][1], floor: RANKS[idx][0], next: RANKS[idx + 1]?.[0] ?? null };
}

/** Le missioni si sbloccano in ordine: una è aperta se la precedente è completata (o se è già stata completata). */
export function isUnlocked(s: SaveData, missionId: string): boolean {
  const list = allMissions();
  const i = list.findIndex((m) => m.id === missionId);
  if (i <= 0) return i === 0;
  // una missione già completata resta sempre rigiocabile, anche se nel corso ne sono state aggiunte di nuove prima
  return s.completed.includes(missionId) || s.completed.includes(list[i - 1].id);
}

export function nextMissionId(s: SaveData): string | null {
  return allMissions().find((m) => !s.completed.includes(m.id))?.id ?? null;
}

/** Nome utente valido per Linux: minuscole, cifre, trattino e underscore, inizia con una lettera. */
export function validHandle(h: string): boolean {
  return /^[a-z][a-z0-9_-]{1,15}$/.test(h);
}

const FS_KEY = 'nc-deck-home-v1';

/** Salva la home del deck (file creati, permessi cambiati...) e gli alias. */
export function saveDeck(data: unknown): void {
  try {
    const json = JSON.stringify(data);
    if (json.length < 1_500_000) localStorage.setItem(FS_KEY, json);
  } catch {
    /* spazio esaurito o archiviazione non disponibile: si continua senza */
  }
}

export function loadDeck(): { home?: unknown; deleted?: string[]; aliases?: Record<string, string> } | null {
  try {
    const raw = localStorage.getItem(FS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDeck(): void {
  try {
    localStorage.removeItem(FS_KEY);
  } catch {
    /* ignora */
  }
}

// ---------------------------------------------------------------- backup dei progressi

const BACKUP_PREFIX = 'NCB1:';

function utf8ToB64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64ToUtf8(b64: string): string {
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Trasforma salvataggio e file del deck in un codice di testo da copiare. */
export function makeBackup(save: SaveData, deck: unknown): string {
  return BACKUP_PREFIX + utf8ToB64(JSON.stringify({ v: 1, save, deck }));
}

/** Legge un codice di backup; restituisce null se non è valido. */
export function parseBackup(code: string): { save: SaveData; deck: unknown } | null {
  try {
    const clean = code.trim().replace(/\s+/g, '');
    if (!clean.startsWith(BACKUP_PREFIX)) return null;
    const data = JSON.parse(b64ToUtf8(clean.slice(BACKUP_PREFIX.length)));
    const s = data?.save;
    if (!s || typeof s !== 'object' || (s.handle !== null && typeof s.handle !== 'string')) return null;
    if (typeof s.xp !== 'number' || !Array.isArray(s.completed) || !s.completed.every((x: unknown) => typeof x === 'string')) return null;
    const save: SaveData = { ...defaultSave(), ...s };
    save.completed = [...new Set(save.completed)];
    return { save, deck: data.deck ?? null };
  } catch {
    return null;
  }
}
