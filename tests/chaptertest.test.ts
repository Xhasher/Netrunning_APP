import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/content';
import { extraQuizCount } from '../src/content/quiz-extra';
import { CHAPTER_TEST, buildChapterTest, practicalPlan, recordChapterTest, recordPractical, stars, type ChapterTestRecord } from '../src/game/chaptertest';
import { makeRng } from '../src/content/drills';
import { defaultSave } from '../src/game/state';
import { mergeSaves } from '../src/game/sync';

const upTo = (ci: number) => CHAPTERS.slice(0, ci + 1).flatMap((c) => c.missions.map((m) => m.id));

describe('verifica di fine capitolo', () => {
  it('ogni capitolo ha una verifica consistente, con ripasso dei precedenti', () => {
    CHAPTERS.forEach((ch, ci) => {
      const items = buildChapterTest(ch.id, upTo(ci), [], {}, 100, makeRng(ci + 1).next);
      const own = items.filter((i) => !i.tag.startsWith('Ripasso'));
      const past = items.filter((i) => i.tag.startsWith('Ripasso'));
      expect(own.length, `${ch.id}: domande del capitolo`).toBeGreaterThanOrEqual(6);
      expect(own.length).toBeLessThanOrEqual(CHAPTER_TEST.own);
      if (ci > 0) expect(past.length, `${ch.id}: ripasso`).toBe(CHAPTER_TEST.past);
      else expect(past.length).toBe(0);
      for (const it of items) {
        expect(!!it.card !== !!it.quiz).toBe(true);
        if (it.quiz) expect(it.quiz.options[it.quiz.correct]).toBeTruthy();
        // gli esercizi con le carte sono in forma attiva: ricomporre o scrivere
        if (it.card) expect(it.box).toBeGreaterThanOrEqual(2);
      }
      // nessun doppione
      const keys = items.map((i) => i.card?.id ?? i.quiz!.question);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  it('le domande cambiano da un tentativo all\'altro', () => {
    const a = buildChapterTest('ch04', upTo(4), [], {}, 100, makeRng(1).next).map((i) => i.card?.id ?? i.quiz!.question);
    const b = buildChapterTest('ch04', upTo(4), [], {}, 100, makeRng(2).next).map((i) => i.card?.id ?? i.quiz!.question);
    expect(a).not.toEqual(b);
  });

  it('il ripasso parte dalle carte più deboli', () => {
    const base = buildChapterTest('ch03', upTo(3), [], {}, 100, makeRng(3).next);
    const pastCards = base.filter((i) => i.card && i.tag.startsWith('Ripasso')).map((i) => i.card!.id);
    expect(pastCards.length).toBeGreaterThan(0);
    // se quelle carte sono già solide, ne escono altre
    const srs = Object.fromEntries(pastCards.map((id) => [id, [5, 200] as [number, number]]));
    const again = buildChapterTest('ch03', upTo(3), [], srs, 100, makeRng(3).next)
      .filter((i) => i.card && i.tag.startsWith('Ripasso'))
      .map((i) => i.card!.id);
    expect(again.some((id) => pastCards.includes(id))).toBe(false);
  });

  it('soglia, record, stelle', () => {
    const t: Record<string, ChapterTestRecord> = {};
    expect(recordChapterTest(t, 'ch01', 10, 18, 5)).toMatchObject({ pct: 56, passed: false, firstPass: false });
    expect(stars(t.ch01)).toBe(0);
    expect(recordChapterTest(t, 'ch01', 15, 18, 6)).toMatchObject({ pct: 83, passed: true, firstPass: true });
    expect(recordChapterTest(t, 'ch01', 12, 18, 7)).toMatchObject({ passed: false, firstPass: false });
    expect(t.ch01).toMatchObject({ best: 83, passed: true, tries: 3 });
    recordPractical(t, 'ch01', 2, 4, 7);
    expect(stars(t.ch01)).toBe(1);
    recordPractical(t, 'ch01', 3, 4, 8);
    recordPractical(t, 'ch01', 1, 4, 9);
    expect(t.ch01.prat).toEqual([3, 4]);
    expect(stars(t.ch01)).toBe(2);
  });

  it('i capitoli pratici hanno una parte nel terminale', () => {
    for (const id of ['ch01', 'ch03', 'ch04', 'chAM', 'ch05']) {
      const p = practicalPlan(id);
      expect(p.pool.length > 0 || p.drills, id).toBe(true);
    }
  });

  it('i risultati si uniscono tra dispositivi', () => {
    const a = { ...defaultSave(), updatedAt: 1, chTests: { ch01: { best: 70, day: 1, passed: false, tries: 2 } } };
    const b = { ...defaultSave(), updatedAt: 2, chTests: { ch01: { best: 90, day: 2, passed: true, tries: 1, prat: [3, 4] as [number, number] }, ch02: { best: 50, day: 2, passed: false, tries: 1 } } };
    const m = mergeSaves(a, b);
    expect(m.chTests.ch01).toMatchObject({ best: 90, passed: true, tries: 2, prat: [3, 4] });
    expect(m.chTests.ch02.best).toBe(50);
  });

  it('ogni missione ha almeno due domande di verifica (tranne la prova finale del capitolo 1)', () => {
    expect(extraQuizCount()).toBeGreaterThanOrEqual(80);
    const few = CHAPTERS.flatMap((c) => c.missions).filter((m) => m.steps.filter((s) => s.kind === 'quiz').length < 2 && m.id !== 'ch01-m5').map((m) => m.id);
    expect(few).toEqual([]);
  });

  it('la risposta giusta non è sempre nella stessa posizione', () => {
    const pos = [0, 0, 0, 0];
    for (const c of CHAPTERS) for (const m of c.missions) for (const s of m.steps) if (s.kind === 'quiz' && s.options.length === 4) pos[s.correct]++;
    const tot = pos.reduce((a, b) => a + b, 0);
    for (const n of pos) expect(n / tot).toBeGreaterThan(0.15);
  });
});
