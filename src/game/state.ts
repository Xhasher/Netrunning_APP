import { allMissions } from '../content';

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
}

export function defaultSave(): SaveData {
  return { handle: null, xp: 0, completed: [], progress: {}, fontScale: 1, ops: [], best: {} };
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

/** Le missioni si sbloccano in ordine: una è aperta se la precedente è completata. */
export function isUnlocked(s: SaveData, missionId: string): boolean {
  const list = allMissions();
  const i = list.findIndex((m) => m.id === missionId);
  if (i <= 0) return i === 0;
  return s.completed.includes(list[i - 1].id);
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

export function loadDeck(): { home?: unknown; aliases?: Record<string, string> } | null {
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
