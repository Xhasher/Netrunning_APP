import { describe, expect, it } from 'vitest';
import {
  dimensionsOf,
  dueSkills,
  eligible,
  errorKind,
  isFragile,
  levelFor,
  mergeLearn,
  normalizeStats,
  recordAttempt,
  recurringErrors,
  snapshot,
  type Learn,
} from '../src/game/engine';
import { PALESTRA, generatePalestra } from '../src/content/palestra';
import { GENERATORS, generateSession, type Level } from '../src/content/drills';
import { buildWorld } from '../src/content/world';
import { genRequires, palRequires } from '../src/game/prereq';
import { introduced, skillsInLine, stateOf } from '../src/game/skills';
import { CHAPTERS } from '../src/content';
import { defaultSave } from '../src/game/state';
import { mergeSaves } from '../src/game/sync';

describe('motore di apprendimento', () => {
  it('registra giusti, sbagliati, aiuti, errori e tempi', () => {
    const l: Learn = {};
    recordAttempt(l, { skills: ['grep'], ok: false, kind: 'missione', error: 'percorso', day: 10 });
    recordAttempt(l, { skills: ['grep'], ok: true, kind: 'missione', helped: true, sec: 40, day: 10 });
    recordAttempt(l, { skills: ['grep'], ok: true, kind: 'palestra', sec: 20, day: 10 });
    const g = l.grep;
    expect([g.ok, g.ko, g.hint, g.timed, g.sec]).toEqual([2, 1, 1, 2, 60]);
    expect(g.errs).toEqual({ percorso: 1 });
    expect(g.kinds).toEqual(['palestra']);
    const d = dimensionsOf(g);
    expect(d.precisione).toBeCloseTo(2 / 3);
    expect(d.autonomia).toBeCloseTo(1 / 2);
    expect(d.memoria).toBeNull();
  });

  it('una prova dopo almeno tre giorni misura la memoria', () => {
    const l: Learn = {};
    recordAttempt(l, { skills: ['ls'], ok: true, kind: 'missione', day: 1 });
    recordAttempt(l, { skills: ['ls'], ok: true, kind: 'palestra', day: 2 });
    expect(l.ls.late).toEqual([0, 0]);
    recordAttempt(l, { skills: ['ls'], ok: true, kind: 'quiz', day: 6 });
    expect(l.ls.late).toEqual([1, 1]);
    recordAttempt(l, { skills: ['ls'], ok: true, kind: 'quiz', helped: true, day: 12 });
    expect(l.ls.late).toEqual([1, 2]);
  });

  it('livello: guidato finché la competenza è solo introdotta o va male, avanzato solo se precisa e autonoma', () => {
    const l: Learn = {};
    expect(levelFor(undefined, 1)).toBe(1);
    for (let i = 0; i < 5; i++) recordAttempt(l, { skills: ['cut'], ok: true, kind: 'palestra', day: 1 });
    expect(levelFor(l.cut, 3)).toBe(2);
    expect(levelFor(l.cut, 4)).toBe(3);
    for (let i = 0; i < 6; i++) recordAttempt(l, { skills: ['cut'], ok: false, kind: 'palestra', day: 1 });
    expect(isFragile(l.cut)).toBe(true);
    expect(levelFor(l.cut, 4)).toBe(1);
  });

  it('ripasso dilazionato: torna prima ciò che è scaduto o fragile', () => {
    const l: Learn = {};
    recordAttempt(l, { skills: ['ls'], ok: true, kind: 'palestra', day: 10 });
    recordAttempt(l, { skills: ['ls'], ok: true, kind: 'palestra', day: 10 });
    recordAttempt(l, { skills: ['cd'], ok: false, kind: 'palestra', day: 10 });
    recordAttempt(l, { skills: ['cd'], ok: false, kind: 'palestra', day: 10 });
    recordAttempt(l, { skills: ['cd'], ok: false, kind: 'palestra', day: 10 });
    const taught = new Set(['ls', 'cd', 'pwd']);
    expect(dueSkills(l, taught, 10)).toEqual([]);
    expect(dueSkills(l, taught, 11)).toEqual(['cd']);
    expect(dueSkills(l, taught, 14)).toEqual(['cd', 'ls']);
  });

  it('i prerequisiti escludono ciò che non è stato insegnato', () => {
    const taught = new Set(['ls', 'cd']);
    expect(eligible({ requires: ['ls'] }, taught)).toBe(true);
    expect(eligible({ requires: ['ls', 'grep'] }, taught)).toBe(false);
    expect(eligible({ requires: ['grep'], explore: true }, taught)).toBe(true);
  });

  it('riconosce le categorie di errore e quelle ricorrenti', () => {
    expect(errorKind('cat: x: No such file or directory')).toBe('percorso');
    expect(errorKind('bash: grpe: command not found')).toBe('nome del comando');
    expect(errorKind('cat: /etc/shadow: Permission denied')).toBe('permessi');
    const l: Learn = {};
    for (let i = 0; i < 3; i++) recordAttempt(l, { skills: ['cd'], ok: false, kind: 'missione', error: 'percorso', day: 1 });
    expect(recurringErrors(l)[0]).toMatchObject({ kind: 'percorso', n: 3, skills: ['cd'] });
  });

  it('salvataggi vecchi e unione tra dispositivi', () => {
    expect(normalizeStats(undefined).late).toEqual([0, 0]);
    const a: Learn = { ls: { ...normalizeStats(undefined), ok: 5, last: 3, kinds: ['missione'] } };
    const b: Learn = { ls: { ...normalizeStats(undefined), ok: 1, last: 9, kinds: ['esame'] }, cd: normalizeStats(undefined) };
    const m = mergeLearn(a, b);
    expect(m.ls.ok).toBe(5);
    expect(m.ls.last).toBe(9);
    expect(new Set(m.ls.kinds)).toEqual(new Set(['missione', 'esame']));
    expect(m.cd).toBeDefined();
    const s = mergeSaves({ ...defaultSave(), updatedAt: 1, learn: a, history: [[1, 2, 0.5]] }, { ...defaultSave(), updatedAt: 2, learn: b, history: [[1, 3, 0.6], [2, 4, 0.7]] });
    expect(s.learn.ls.ok).toBe(5);
    expect(s.history).toEqual([[1, 3, 0.6], [2, 4, 0.7]]);
    expect(snapshot([[1, 1, 0]], 1, 2, 0.5)).toEqual([[1, 2, 0.5]]);
  });

  it('lo stato "applicata autonomamente" richiede tre tipi di attività e memoria a distanza', () => {
    const l: Learn = {};
    recordAttempt(l, { skills: ['grep'], ok: true, kind: 'missione', day: 1 });
    recordAttempt(l, { skills: ['grep'], ok: true, kind: 'palestra', day: 2 });
    recordAttempt(l, { skills: ['grep'], ok: true, kind: 'simulazione', day: 9 });
    const ctx = { skills: { grep: { ex: 3, solo: ['a', 'b'], acq: 2, cons: true } }, intro: new Set(['grep']), srs: {}, learn: l };
    expect(stateOf(ctx, 'grep')).toBe(6);
    expect(stateOf({ ...ctx, learn: {} }, 'grep')).toBe(5);
  });
});

describe('progressione per capitolo', () => {
  const taughtAfter = (missionId: string) => {
    const ids = CHAPTERS.flatMap((c) => c.missions.map((m) => m.id));
    return introduced(ids.slice(0, ids.indexOf(missionId) + 1), {});
  };

  it('ogni esercizio della Palestra e ogni sfida si generano e hanno prerequisiti', () => {
    for (const e of PALESTRA) expect(palRequires(e), e.id).toContain(e.skill === 'redirezioni' ? 'redirezioni' : e.skill);
    for (const [ch, gs] of Object.entries(GENERATORS)) for (const g of gs) for (const lv of [1, 2, 3] as Level[]) expect(genRequires(ch, g.id, lv).length, `${ch}/${g.id}`).toBeGreaterThan(0);
  });

  it('a fine capitolo 01 la Palestra non chiede comandi dei capitoli successivi', () => {
    const taught = taughtAfter('ch01-m5');
    expect(taught.has('ls')).toBe(true);
    expect(taught.has('grep')).toBe(false);
    const sh = buildWorld('prova');
    const pool = [...taught].map((skill) => ({ skill, weight: 1 }));
    for (let seed = 1; seed <= 15; seed++) {
      const drills = generatePalestra(sh, { pool, seed, count: 6, allowed: (e) => palRequires(e).filter((k) => k !== e.skill).every((k) => taught.has(k)) });
      for (const d of drills) for (const line of d.solve) for (const k of skillsInLine(line)) expect(taught.has(k) || k === d.skill, `${d.title}: ${line}`).toBe(true);
    }
  }, 60000);

  it('le Simulazioni filtrano le sfide con comandi non ancora insegnati', () => {
    const taught = taughtAfter('ch01-m5');
    const sh = buildWorld('prova');
    const drills = generateSession(sh, ['ch01'], 1, 7, (ch, id, lv) => genRequires(ch, id, lv).every((k) => taught.has(k)));
    expect(drills.length).toBeGreaterThan(0);
    for (const d of drills) for (const line of d.solve) for (const k of skillsInLine(line)) expect(taught.has(k), `${d.title}: ${line}`).toBe(true);
  }, 60000);
});
