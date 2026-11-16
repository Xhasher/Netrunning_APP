import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/content';
import { EXAM_BANK } from '../src/content/exam-bank';
import { FIX } from '../src/content/quiz-fix';

/** La risposta giusta si riconosce dalla lunghezza: più lunga di tutte le altre di un quarto e di 12 caratteri. */
const byLength = (opts: string[], c: number) => {
  const L = opts.map((o) => o.length);
  const others = Math.max(...L.filter((_, i) => i !== c));
  return L[c] >= others * 1.25 && L[c] - others >= 12;
};

const all = () => [
  ...CHAPTERS.flatMap((ch) => ch.missions.flatMap((m) => m.steps.flatMap((s) => (s.kind === 'quiz' ? [{ where: m.id, q: s }] : [])))),
  ...EXAM_BANK.map((q) => ({ where: `esame ${q.chapter}`, q })),
];

describe('domande bilanciate', () => {
  it('ogni correzione corrisponde a una domanda esistente', () => {
    const qs = all().map((x) => x.q.question);
    const missing = Object.keys(FIX).filter((k) => qs.filter((q) => q === k || q.split('\n')[0] === k).length !== 1);
    expect(missing).toEqual([]);
  });

  it('la risposta giusta resta tra le opzioni e le opzioni sono 4, tutte diverse', () => {
    for (const { where, q } of all()) {
      expect(q.correct, where).toBeLessThan(q.options.length);
      expect(new Set(q.options).size, `${where}: ${q.question.slice(0, 50)}`).toBe(q.options.length);
    }
  });

  it('poche domande si indovinano dalla lunghezza della risposta', () => {
    const list = all();
    const bad = list.filter(({ q }) => byLength(q.options, q.correct));
    expect(bad.length / list.length, bad.map((x) => x.q.question.split('\n')[0]).join('\n')).toBeLessThan(0.03);
    // e la giusta non è quasi sempre la più lunga (a caso sarebbe una su quattro)
    const longest = list.filter(({ q }) => {
      const L = q.options.map((o) => o.length);
      return L[q.correct] === Math.max(...L) && L.filter((x) => x === L[q.correct]).length === 1;
    });
    expect(longest.length / list.length).toBeLessThan(0.5);
  });
});

describe('domande sul perché e assaggi bilanciati', () => {
  it('nei giochi e negli assaggi la giusta non si riconosce dalla lunghezza', async () => {
    const { GAMES, generatePhishingCard, generateTriageCard } = await import('../src/content/games');
    const { TASTES } = await import('../src/game/orientation');
    const { makeRng } = await import('../src/content/drills');
    const r = makeRng(9);
    const items = [
      ...GAMES.flatMap((g) => g.cards.map((c) => c.why)),
      ...Array.from({ length: 100 }, () => [generatePhishingCard(r).why, generateTriageCard(r).why]).flat(),
      ...Object.values(TASTES).flatMap((t) => t.steps),
    ];
    const bad = items.filter((x) => byLength(x.options, x.correct));
    expect(bad.map((x) => x.options[x.correct])).toEqual([]);
  });
});

describe('domande uniche', () => {
  it('nessuna domanda compare due volte nel corso', () => {
    const qs = CHAPTERS.flatMap((ch) => ch.missions.flatMap((m) => m.steps.flatMap((s) => (s.kind === 'quiz' ? [s.question] : []))));
    const dup = qs.filter((q, i) => qs.indexOf(q) !== i);
    expect(dup).toEqual([]);
  });
});
