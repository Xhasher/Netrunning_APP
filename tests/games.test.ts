import { describe, expect, it } from 'vitest';
import { GAMES } from '../src/content/games';

describe('mini giochi', () => {
  it('ogni carta ha una risposta valida e una spiegazione', () => {
    for (const g of GAMES) {
      expect(g.cards.length).toBeGreaterThanOrEqual(8);
      for (const c of g.cards) {
        expect([0, 1]).toContain(c.answer);
        expect(c.explain.length).toBeGreaterThan(40);
      }
      // entrambe le risposte devono comparire, per non rendere il gioco ovvio
      expect(new Set(g.cards.map((c) => c.answer)).size).toBe(2);
    }
  });
});
