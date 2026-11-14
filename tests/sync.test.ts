import { describe, expect, it } from 'vitest';
import { defaultSave, type SaveData } from '../src/game/state';
import { GIST_FILE, mergeSaves, syncOnce, type CloudPayload } from '../src/game/sync';

const mk = (o: Partial<SaveData>): SaveData => ({ ...defaultSave(), handle: 'vito', ...o });

describe('unione dei salvataggi', () => {
  it('non perde progressi da nessuno dei due dispositivi', () => {
    const phone = mk({ updatedAt: 100, xp: 900, completed: ['ch01-m1', 'ch01-m2'], known: ['ls'], ops: ['op01'], best: { phish: 8 }, fontScale: 1.2, progress: { 'ch02-m1': 3 } });
    const pc = mk({ updatedAt: 200, xp: 700, completed: ['ch01-m1', 'chF-m1'], known: ['cd'], best: { phish: 6, soc: 9 }, fontScale: 1, progress: { 'ch02-m1': 5, 'ch01-m2': 2 } });
    const m = mergeSaves(phone, pc);
    expect(new Set(m.completed)).toEqual(new Set(['ch01-m1', 'ch01-m2', 'chF-m1']));
    expect(m.xp).toBe(900);
    expect(new Set(m.known)).toEqual(new Set(['ls', 'cd']));
    expect(m.ops).toEqual(['op01']);
    expect(m.best).toEqual({ phish: 8, soc: 9 });
    expect(m.progress).toEqual({ 'ch02-m1': 5 });
    expect(m.fontScale).toBe(1.2);
    expect(m.updatedAt).toBe(200);
  });

  it('Memoria, serie ed esami', () => {
    const a = mk({ updatedAt: 1, srs: { x: [3, 50], y: [1, 10] }, streak: { day: 10, count: 4, best: 7 }, exams: [{ kind: 'finale', day: 9, score: 40, total: 60, pct: 67, passed: false, secs: 3000 }] });
    const b = mk({ updatedAt: 2, srs: { x: [1, 12], z: [2, 20] }, streak: { day: 11, count: 1, best: 3 }, exams: [{ kind: 'finale', day: 9, score: 40, total: 60, pct: 67, passed: false, secs: 3000 }, { kind: 'parziale', day: 11, score: 25, total: 30, pct: 83, passed: true, secs: 900 }] });
    const m = mergeSaves(a, b);
    expect(m.srs).toEqual({ x: [3, 50], y: [1, 10], z: [2, 20] });
    expect(m.streak).toEqual({ day: 11, count: 1, best: 7 });
    expect(m.exams).toHaveLength(2);
  });
});

describe('sincronizzazione con il Gist', () => {
  function fakeGitHub(initial: CloudPayload | null) {
    let stored = initial ? JSON.stringify(initial) : null;
    const calls: string[] = [];
    const f = (async (url: string, init?: RequestInit) => {
      const u = String(url).replace('https://api.github.com', '');
      const method = init?.method ?? 'GET';
      calls.push(`${method} ${u}`);
      const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'x-oauth-scopes': 'gist' } });
      if (u === '/user') return json({ login: 'vito-gh' });
      if (u.startsWith('/gists?')) return json(stored ? [{ id: 'g1', files: { [GIST_FILE]: {} } }] : []);
      if (u === '/gists' && method === 'POST') {
        stored = JSON.parse(String(init!.body)).files[GIST_FILE].content;
        return json({ id: 'g1' }, 201);
      }
      if (u === '/gists/g1' && method === 'GET') return json({ files: { [GIST_FILE]: { content: stored } } });
      if (u === '/gists/g1' && method === 'PATCH') {
        stored = JSON.parse(String(init!.body)).files[GIST_FILE].content;
        return json({ id: 'g1' });
      }
      return json({}, 404);
    }) as typeof fetch;
    return { f, calls, stored: () => (stored ? (JSON.parse(stored) as CloudPayload) : null) };
  }

  it('al primo collegamento crea il Gist con i progressi locali', async () => {
    const gh = fakeGitHub(null);
    const local = { v: 1 as const, save: mk({ updatedAt: 5, completed: ['ch01-m1'] }), deck: { home: 'a' } };
    const r = await syncOnce({ token: 't' }, local, gh.f);
    expect(r.created).toBe(true);
    expect(r.cfg).toMatchObject({ gistId: 'g1', login: 'vito-gh' });
    expect(gh.stored()!.save.completed).toEqual(['ch01-m1']);
  });

  it('un dispositivo nuovo riceve i progressi senza cancellarli', async () => {
    const gh = fakeGitHub({ v: 1, save: mk({ updatedAt: 50, xp: 1200, completed: ['ch01-m1', 'ch01-m2'] }), deck: { home: 'telefono' } });
    const fresh = { v: 1 as const, save: mk({ updatedAt: 60, xp: 0, completed: [] }), deck: null };
    const r = await syncOnce({ token: 't' }, fresh, gh.f);
    expect(r.save.completed).toEqual(['ch01-m1', 'ch01-m2']);
    expect(r.save.xp).toBe(1200);
    expect(gh.stored()!.save.xp).toBe(1200);
    expect(gh.calls).toContain('PATCH /gists/g1');
  });

  it('token non valido: errore chiaro', async () => {
    const f = (async () => new Response('{}', { status: 401 })) as unknown as typeof fetch;
    await expect(syncOnce({ token: 'x' }, { v: 1, save: mk({}), deck: null }, f)).rejects.toThrow('Token non valido');
  });
});
