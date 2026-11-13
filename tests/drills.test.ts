import { describe, expect, it } from 'vitest';
import { GENERATORS, LEVELS, generateSession, makeRng, type Level } from '../src/content/drills';
import { buildWorld } from '../src/content/world';

const chapters = Object.keys(GENERATORS);

describe('simulazioni', () => {
  it('lo stesso seme genera la stessa sessione, semi diversi sessioni diverse', () => {
    const a = generateSession(buildWorld('edge'), chapters, 2, 42).map((d) => d.prompt);
    const b = generateSession(buildWorld('edge'), chapters, 2, 42).map((d) => d.prompt);
    const c = generateSession(buildWorld('edge'), chapters, 2, 43).map((d) => d.prompt);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('il numero di sfide dipende dalla difficoltà', () => {
    for (const lv of [1, 2, 3] as Level[]) expect(generateSession(buildWorld('edge'), ['ch01'], lv, 7)).toHaveLength(LEVELS[lv].count);
  });

  for (const lv of [1, 2, 3] as Level[]) {
    it(`ogni sfida è risolvibile (livello ${lv}, 40 sessioni casuali)`, () => {
      for (let seed = 1; seed <= 40; seed++) {
        const sh = buildWorld('edge');
        const drills = generateSession(sh, chapters, lv, seed * 7919 + lv);
        for (const d of drills) {
          let out = '';
          const events = [];
          for (const cmd of d.solve) {
            const r = sh.run(cmd);
            out += r.lines.map((l) => l.text).join('\n') + '\n';
            events.push(...r.events);
          }
          const where = `${d.chapter} "${d.title}" seme ${seed}`;
          if (d.answer) {
            const a = d.answer[0];
            if (a === 'si' || a === 'no') {
              // risposte sì/no: verificate dal contenuto dell'output
              if (d.title.includes('Posta')) expect(out.includes('+all'), where).toBe(a === 'si');
            } else expect(out.toLowerCase(), `${where}: atteso ${a}\n${out}`).toContain(a.toLowerCase());
          }
          if (d.state) expect(d.state(sh), where).toBe(true);
          if (d.check) expect(events.some((e) => d.check!(e, sh)), where).toBe(true);
        }
      }
    });
  }

  it('il generatore casuale è uniforme abbastanza', () => {
    const r = makeRng(1);
    const counts = [0, 0, 0];
    for (let i = 0; i < 3000; i++) counts[r.int(0, 2)]++;
    for (const n of counts) expect(n).toBeGreaterThan(850);
  });
});
