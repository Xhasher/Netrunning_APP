import { describe, expect, it } from 'vitest';
import { allMissions } from '../src/content';
import { defaultSave, parseBackup, makeBackup } from '../src/game/state';
import { mergeSaves } from '../src/game/sync';
import { migrateProgress } from '../src/game/migrate';

describe('collaudo: salvataggi vecchi e sincronizzazione', () => {
  it('un salvataggio senza i campi nuovi si unisce a uno nuovo senza perdere niente', () => {
    const old = { ...defaultSave(), updatedAt: 5, xp: 700, completed: ['ch01-m1'] } as Record<string, unknown>;
    for (const k of ['learn', 'history', 'orient', 'chTests', 'skills']) delete old[k];
    const now = { ...defaultSave(), updatedAt: 9, xp: 900, completed: ['ch01-m1', 'ch01-m2'], learn: { ls: { ok: 3, ko: 0, hint: 0, sec: 0, timed: 0, last: 2, run: 3, errs: {}, late: [0, 0] as [number, number], know: [0, 0] as [number, number], why: [0, 0] as [number, number], kinds: [] } }, history: [[2, 1, 1]] as [number, number, number][], orient: { answers: { giallo: 1 }, tastes: {}, choice: 'soc' as const } };
    for (const [a, b] of [[old, now], [now, old]] as const) {
      const m = mergeSaves(a as never, b as never);
      expect(m.xp).toBe(900);
      expect(new Set(m.completed)).toEqual(new Set(['ch01-m1', 'ch01-m2']));
      expect(m.learn.ls.ok).toBe(3);
      expect(m.orient.choice).toBe('soc');
      expect(m.history.length).toBe(1);
    }
  });

  it('un backup vecchio si legge con tutti i campi nuovi a posto', () => {
    const s = { ...defaultSave(), handle: 'vito', xp: 10, completed: ['ch01-m1'] } as Record<string, unknown>;
    for (const k of ['learn', 'history', 'orient', 'contentVer']) delete s[k];
    const back = parseBackup(makeBackup(s as never, null))!;
    expect(back.save.learn).toEqual({});
    expect(back.save.orient).toEqual({ answers: {}, tastes: {} });
    expect(back.save.contentVer).toBe(0);
  });

  it('chi era a metà di una missione nella versione 19 resta sullo stesso passo dopo le domande nuove', () => {
    const m = allMissions().find((x) => x.steps.some((s) => s.since === 20) && x.steps.findIndex((s) => s.since === 20) > 1)!;
    const before = m.steps.filter((s) => (s.since ?? 0) <= 19);
    const target = before.length - 1; // ultimo passo che esisteva nella 19
    const out = migrateProgress({ ...defaultSave(), contentVer: 19, progress: { [m.id]: target } });
    const step = m.steps[out.progress[m.id]];
    expect(step).toBe(before[target]);
  });
});
