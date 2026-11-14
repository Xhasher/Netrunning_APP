// Salvataggio nel cloud tramite un Gist privato di GitHub: lo stesso account
// sincronizza i progressi tra l'APK e la versione browser. Nessun server nostro:
// i dati restano nell'account GitHub del giocatore.

import type { SaveData } from './state';

export const GIST_FILE = 'netrunning-save.json';
const CFG_KEY = 'nc-cloud-v1';

export interface CloudConfig {
  token: string;
  gistId?: string;
  login?: string;
  lastSync?: number;
  lastError?: string;
}

export interface CloudPayload {
  v: 1;
  save: SaveData;
  deck: unknown;
}

export function loadCloud(): CloudConfig | null {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    return raw ? (JSON.parse(raw) as CloudConfig) : null;
  } catch {
    return null;
  }
}

export function saveCloud(c: CloudConfig | null): void {
  try {
    if (c) localStorage.setItem(CFG_KEY, JSON.stringify(c));
    else localStorage.removeItem(CFG_KEY);
  } catch {
    /* archiviazione non disponibile */
  }
}

// ---------------------------------------------------------------- unione dei salvataggi

const union = <T>(a: readonly T[], b: readonly T[]): T[] => [...new Set([...a, ...b])];

/**
 * Unisce i progressi di due dispositivi senza perdere niente:
 * missioni, operazioni e comandi conosciuti si sommano; XP e record prendono il massimo;
 * le carte di Memoria tengono lo stato più avanzato. Le preferenze del dispositivo
 * (dimensione del testo, effetti) restano quelle locali.
 */
export function mergeSaves(local: SaveData, remote: SaveData): SaveData {
  const newer = (remote.updatedAt ?? 0) > (local.updatedAt ?? 0) ? remote : local;
  const older = newer === remote ? local : remote;
  const completed = union(newer.completed ?? [], older.completed ?? []);
  const done = new Set(completed);

  const progress: Record<string, number> = {};
  for (const src of [older.progress ?? {}, newer.progress ?? {}])
    for (const [k, v] of Object.entries(src)) if (!done.has(k)) progress[k] = Math.max(progress[k] ?? 0, v);

  const best: Record<string, number> = { ...(older.best ?? {}) };
  for (const [k, v] of Object.entries(newer.best ?? {})) best[k] = Math.max(best[k] ?? -Infinity, v);

  const srs: SaveData['srs'] = { ...(older.srs ?? {}) };
  for (const [k, v] of Object.entries(newer.srs ?? {})) {
    const o = srs[k];
    srs[k] = !o || v[0] > o[0] || (v[0] === o[0] && v[1] >= o[1]) ? v : o;
  }

  const sa = local.streak ?? { day: 0, count: 0, best: 0 };
  const sb = remote.streak ?? { day: 0, count: 0, best: 0 };
  const sMain = sa.day > sb.day || (sa.day === sb.day && sa.count >= sb.count) ? sa : sb;
  const streak = { ...sMain, best: Math.max(sa.best, sb.best) };

  const examKey = (e: SaveData['exams'][number]) => `${e.kind}|${e.day}|${e.pct}|${e.secs}`;
  const exams = [...new Map([...(older.exams ?? []), ...(newer.exams ?? [])].map((e) => [examKey(e), e])).values()].sort((a, b) => a.day - b.day).slice(-30);

  return {
    ...older,
    ...newer,
    handle: newer.handle ?? older.handle,
    xp: Math.max(local.xp ?? 0, remote.xp ?? 0),
    completed,
    progress,
    ops: union(newer.ops ?? [], older.ops ?? []),
    best,
    known: union(newer.known ?? [], older.known ?? []),
    srs,
    streak,
    logs: { ...(older.logs ?? {}), ...(newer.logs ?? {}) },
    exams,
    // preferenze di questo dispositivo
    fontScale: local.fontScale,
    effects: local.effects,
    hideKnown: local.hideKnown,
    updatedAt: Math.max(local.updatedAt ?? 0, remote.updatedAt ?? 0),
  };
}

/** Riassunto leggibile di un salvataggio. */
export function describe(s: SaveData): string {
  return `${s.handle ?? '?'} · ${s.xp} XP · ${s.completed.length} missioni`;
}

// ---------------------------------------------------------------- GitHub Gist

type Fetch = typeof fetch;

export class SyncError extends Error {
  constructor(
    message: string,
    public auth = false,
  ) {
    super(message);
  }
}

export class GistClient {
  constructor(
    private token: string,
    private fetchFn: Fetch = (...a) => fetch(...a),
  ) {}

  private async api(path: string, init: RequestInit = {}): Promise<unknown> {
    let res: Response;
    try {
      res = await this.fetchFn(`https://api.github.com${path}`, {
        ...init,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        },
      });
    } catch {
      throw new SyncError('Nessuna connessione a GitHub. Riproverò più tardi.');
    }
    if (res.status === 401) throw new SyncError('Token non valido o scaduto.', true);
    if (res.status === 403 || res.status === 404) {
      const scopes = res.headers.get('x-oauth-scopes');
      if (scopes !== null && !scopes.split(',').map((s) => s.trim()).includes('gist')) throw new SyncError('Il token non ha il permesso "gist".', true);
      throw new SyncError(`GitHub ha rifiutato la richiesta (${res.status}).`, res.status === 403);
    }
    if (!res.ok) throw new SyncError(`Errore di GitHub (${res.status}).`);
    return res.status === 204 ? null : res.json();
  }

  async login(): Promise<string> {
    const u = (await this.api('/user')) as { login: string };
    return u.login;
  }

  /** Trova il Gist del gioco tra quelli dell'utente. */
  async findGist(): Promise<string | null> {
    for (let page = 1; page <= 5; page++) {
      const list = (await this.api(`/gists?per_page=100&page=${page}`)) as { id: string; files: Record<string, unknown> }[];
      const hit = list.find((g) => g.files && GIST_FILE in g.files);
      if (hit) return hit.id;
      if (list.length < 100) break;
    }
    return null;
  }

  async read(id: string): Promise<CloudPayload | null> {
    const g = (await this.api(`/gists/${id}`)) as { files: Record<string, { content?: string; truncated?: boolean; raw_url?: string }> };
    const f = g.files?.[GIST_FILE];
    if (!f) return null;
    let text = f.content ?? '';
    if (f.truncated && f.raw_url) {
      const r = await this.fetchFn(f.raw_url);
      text = await r.text();
    }
    try {
      const data = JSON.parse(text) as CloudPayload;
      return data && data.save ? data : null;
    } catch {
      return null;
    }
  }

  async create(p: CloudPayload): Promise<string> {
    const g = (await this.api('/gists', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Night City Netrunning: salvataggio (non modificare a mano)',
        public: false,
        files: { [GIST_FILE]: { content: JSON.stringify(p) } },
      }),
    })) as { id: string };
    return g.id;
  }

  async write(id: string, p: CloudPayload): Promise<void> {
    await this.api(`/gists/${id}`, { method: 'PATCH', body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(p) } } }) });
  }
}

/**
 * Una sincronizzazione completa: legge il cloud, unisce, scrive il risultato.
 * Restituisce il salvataggio unito e, se il cloud aveva file del deck più recenti, quelli.
 */
export async function syncOnce(
  cfg: CloudConfig,
  local: CloudPayload,
  fetchFn?: Fetch,
): Promise<{ save: SaveData; remoteDeck: unknown | null; cfg: CloudConfig; created: boolean }> {
  const gc = new GistClient(cfg.token, fetchFn);
  const next: CloudConfig = { ...cfg };
  if (!next.login) next.login = await gc.login();
  if (!next.gistId) next.gistId = (await gc.findGist()) ?? undefined;
  let created = false;
  let remote: CloudPayload | null = null;
  if (next.gistId) {
    try {
      remote = await gc.read(next.gistId);
    } catch (e) {
      if (!(e instanceof SyncError) || e.auth) throw e;
      next.gistId = undefined; // il Gist è stato cancellato: lo ricreo
    }
  }
  const merged = remote ? mergeSaves(local.save, remote.save) : local.save;
  const remoteNewer = !!remote && (remote.save.updatedAt ?? 0) > (local.save.updatedAt ?? 0);
  const deck = remoteNewer ? remote!.deck : local.deck;
  const payload: CloudPayload = { v: 1, save: merged, deck };
  if (next.gistId) await gc.write(next.gistId, payload);
  else {
    next.gistId = await gc.create(payload);
    created = true;
  }
  next.lastSync = Date.now();
  next.lastError = undefined;
  return { save: merged, remoteDeck: remoteNewer ? remote!.deck : null, cfg: next, created };
}
