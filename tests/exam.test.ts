import { describe, expect, it } from 'vitest';
import { allMissions } from '../src/content';
import { EXAM_BANK } from '../src/content/exam-bank';
import { CHAPTERS } from '../src/content';
import { EXAMS, buildExam, examPool, grade } from '../src/game/exam';

const ALL = allMissions().map((m) => m.id);
const seeded = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

describe('esami simulati', () => {
  it('la banca di scenari è valida e riferita a capitoli esistenti', () => {
    const ids = new Set(CHAPTERS.map((c) => c.id));
    for (const q of EXAM_BANK) {
      expect(ids.has(q.chapter), q.question).toBe(true);
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(q.options.length);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });

  it('l\'esame finale ha 60 domande diverse, bilanciate, con poche carte di Memoria', () => {
    const qs = buildExam(examPool(ALL, [], false, seeded(3)), EXAMS.finale.count, seeded(4));
    expect(qs).toHaveLength(60);
    expect(new Set(qs.map((q) => q.question + q.options.join())).size).toBe(60);
    expect(qs.filter((q) => q.chapter === 'memoria').length).toBeLessThanOrEqual(15);
    expect(new Set(qs.map((q) => q.chapter)).size).toBeGreaterThanOrEqual(15);
    for (const q of qs) expect(q.options[q.correct]).toBeDefined();
  });

  it('l\'esame parziale usa solo ciò che è stato studiato', () => {
    const done = ALL.slice(0, 8);
    const pool = examPool(done, [], true, seeded(1));
    const studied = new Set(CHAPTERS.filter((c) => c.missions.some((m) => done.includes(m.id))).map((c) => c.id));
    for (const q of pool) expect(q.chapter === 'memoria' || studied.has(q.chapter)).toBe(true);
    expect(examPool([], [], true)).toHaveLength(0);
  });

  it('correzione e soglia', () => {
    const qs = buildExam(examPool(ALL, [], false, seeded(7)), 20, seeded(8));
    const right = qs.map((q) => q.correct);
    expect(grade(qs, right, 75)).toMatchObject({ score: 20, pct: 100, passed: true });
    const some = right.map((a, i) => (i < 14 ? a : null));
    const r = grade(qs, some, 75);
    expect(r.pct).toBe(70);
    expect(r.passed).toBe(false);
    expect(r.byChapter.reduce((n, [, , t]) => n + t, 0)).toBe(20);
  });
});
