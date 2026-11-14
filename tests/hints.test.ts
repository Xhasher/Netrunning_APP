import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/content';
import { NO_HINTS_UNLOCK, hintGate, hintPolicy } from '../src/game/hints';

describe('aiuti che diminuiscono', () => {
  it('ogni capitolo ha una regola, e i primi sono liberi', () => {
    expect(CHAPTERS.slice(0, 4).map((c) => hintPolicy(c.id))).toEqual(['libero', 'libero', 'libero', 'libero']);
    expect(hintPolicy('ch04')).toBe('dopo-tentativo');
    expect(hintPolicy('chPT')).toBe('su-richiesta');
  });

  it('dopo-tentativo: serve un comando provato', () => {
    expect(hintGate('dopo-tentativo', { tries: 0, level: 0, armed: false }).ok).toBe(false);
    expect(hintGate('dopo-tentativo', { tries: 1, level: 0, armed: false }).ok).toBe(true);
  });

  it('su-richiesta: prima un avviso, poi il suggerimento', () => {
    expect(hintGate('su-richiesta', { tries: 0, level: 0, armed: false })).toMatchObject({ ok: true, confirm: true });
    expect(hintGate('su-richiesta', { tries: 0, level: 0, armed: true })).toMatchObject({ ok: true, confirm: false });
    expect(hintGate('su-richiesta', { tries: 0, level: 1, armed: false }).confirm).toBe(false);
  });

  it('senza suggerimenti: si sbloccano solo dopo vari tentativi', () => {
    expect(hintGate('libero', { tries: NO_HINTS_UNLOCK - 1, level: 0, armed: false, noHints: true }).ok).toBe(false);
    expect(hintGate('libero', { tries: NO_HINTS_UNLOCK, level: 0, armed: false, noHints: true }).ok).toBe(true);
  });
});
