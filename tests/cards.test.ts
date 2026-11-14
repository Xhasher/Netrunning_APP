import { describe, expect, it } from 'vitest';
import { allMissions } from '../src/content';
import { INTERVALS, buildCards, buildSession, bumpStreak, checkTyped, exerciseFor, review, stats, tokenize, type Srs } from '../src/game/cards';

const ALL = allMissions().map((m) => m.id);
const seeded = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

describe('palestra della memoria', () => {
  it('senza missioni completate non ci sono carte', () => {
    expect(buildCards([], [])).toEqual([]);
  });

  it('le carte crescono con il corso e hanno id unici', () => {
    const few = buildCards(ALL.slice(0, 2), []);
    const all = buildCards(ALL, []);
    expect(few.length).toBeGreaterThan(5);
    expect(all.length).toBeGreaterThan(300);
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
    expect(few.some((c) => c.id.startsWith('f:porte'))).toBe(false);
    expect(all.some((c) => c.id === 'f:porte:22')).toBe(true);
    expect(all.some((c) => c.id === 'r:porte:22')).toBe(true);
  });

  it('ogni carta produce esercizi validi a ogni scatola', () => {
    const rnd = seeded(7);
    for (const c of buildCards(ALL, []))
      for (let box = 0; box < INTERVALS.length; box++) {
        const ex = exerciseFor(c, box, rnd);
        if (ex.type === 'choice') {
          expect(ex.options.length, c.id).toBeGreaterThanOrEqual(3);
          expect(new Set(ex.options).size, c.id).toBe(ex.options.length);
          expect(ex.correct, c.id).toBeGreaterThanOrEqual(0);
        } else if (ex.type === 'build') {
          expect(ex.answer.join(' ')).toBe(tokenize(c.answer).join(' '));
          for (const t of ex.answer) expect(ex.tokens).toContain(t);
        } else {
          expect(checkTyped(ex, ex.answer), c.id).toBe(true);
          expect(checkTyped(ex, 'zzz-sbagliato'), c.id).toBe(false);
        }
      }
  });

  it('la difficoltà cresce: scelta, ricomposizione, scrittura', () => {
    const cards = buildCards(ALL, []);
    const ex = cards.find((c) => c.kind === 'ex' && tokenize(c.answer).length >= 3)!;
    expect(exerciseFor(ex, 1).type).toBe('build');
    expect(exerciseFor(ex, 4).type).toBe('type');
    const opt = cards.find((c) => c.id === 'o:ls:-a')!;
    expect(exerciseFor(opt, 0).type).toBe('choice');
    expect(exerciseFor(opt, 3).type).toBe('type');
  });

  it('accetta le risposte scritte in modo equivalente', () => {
    const cards = buildCards(ALL, []);
    const ssh = exerciseFor(cards.find((c) => c.id === 'f:porte:22')!, 3);
    expect(ssh.type).toBe('type');
    if (ssh.type === 'type') expect(checkTyped(ssh, '  ssh ')).toBe(true);
    const cidr = exerciseFor(cards.find((c) => c.id === 'r:cidr:/24')!, 3);
    if (cidr.type === 'type') expect(checkTyped(cidr, '24')).toBe(true);
  });

  it('ripetizione spaziata: giusto allontana, sbagliato riavvicina', () => {
    const srs: Srs = {};
    review(srs, 'a', true, 100);
    expect(srs.a).toEqual([1, 101]);
    review(srs, 'a', true, 101);
    expect(srs.a).toEqual([2, 104]);
    review(srs, 'a', true, 104);
    review(srs, 'a', true, 111);
    expect(srs.a[0]).toBe(4);
    review(srs, 'a', false, 130);
    expect(srs.a).toEqual([2, 133]);
    review(srs, 'a', true, 130, true);
    expect(srs.a).toEqual([2, 133]);
  });

  it('la sessione mescola carte in scadenza e nuove, senza doppioni', () => {
    const cards = buildCards(ALL, []);
    const srs: Srs = {};
    const first = buildSession(cards, srs, 100, 12, 6, seeded(1));
    expect(first.length).toBe(6);
    expect(first.every((i) => i.isNew)).toBe(true);
    for (const i of first) review(srs, i.card.id, true, 100);
    const next = buildSession(cards, srs, 101, 12, 6, seeded(2));
    expect(next.length).toBe(12);
    expect(new Set(next.map((i) => i.card.id)).size).toBe(12);
    expect(next.filter((i) => !i.isNew).length).toBe(6);
    const st = stats(cards, srs, 101);
    expect(st.seen).toBe(6);
    expect(st.due).toBe(6);
  });

  it('serie di giorni consecutivi', () => {
    let s = bumpStreak({ day: 0, count: 0, best: 0 }, 10);
    s = bumpStreak(s, 10);
    s = bumpStreak(s, 11);
    expect(s).toEqual({ day: 11, count: 2, best: 2 });
    s = bumpStreak(s, 14);
    expect(s).toEqual({ day: 14, count: 1, best: 2 });
  });
});
