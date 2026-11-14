import { describe, expect, it } from 'vitest';
import { MANPAGES } from '../src/engine/manpages';
import { PALESTRA, PALESTRA_SKILLS, exercisesFor, generatePalestra } from '../src/content/palestra';
import { buildWorld } from '../src/content/world';
import { makeRng } from '../src/content/drills';
import { MODULES, skillsInLine } from '../src/game/skills';

const SKILLS = new Set(MODULES.flatMap((m) => m.skills));

describe('palestra dei comandi', () => {
  it('ogni esercizio allena una competenza vera, con id unici', () => {
    expect(new Set(PALESTRA.map((e) => e.id)).size).toBe(PALESTRA.length);
    for (const e of PALESTRA) expect(SKILLS.has(e.skill) && !!MANPAGES[e.skill], e.id).toBe(true);
    expect(PALESTRA.length).toBeGreaterThanOrEqual(40);
  });

  it('ogni esercizio è risolvibile e la soluzione usa la competenza allenata (30 semi)', () => {
    for (const e of PALESTRA)
      for (let seed = 1; seed <= 30; seed++) {
        const sh = buildWorld('edge');
        const drill = e.make({ sh, r: makeRng(seed * 31 + 7), lv: e.lv, dir: `pal/1-${e.id}` });
        let out = '';
        const events = [];
        for (const cmd of drill.solve) {
          const r = sh.run(cmd);
          out += r.lines.map((l) => l.text).join('\n') + '\n';
          events.push(...r.events);
          expect(r.lines.filter((l) => l.cls === 'err' && /^(bash|[a-z][a-z0-9_.-]*): /i.test(l.text)).map((l) => l.text), `${e.id} seme ${seed}: ${cmd}`).toEqual([]);
        }
        const where = `${e.id} seme ${seed}`;
        if (drill.answer) expect(out.toLowerCase(), `${where}: atteso ${drill.answer[0]}\n${out}`).toContain(drill.answer[0].toLowerCase());
        if (drill.state) expect(drill.state(sh), where).toBe(true);
        expect(drill.answer || drill.state, where).toBeTruthy();
        expect(drill.solve.flatMap((l) => skillsInLine(l)), where).toContain(e.skill);
      }
  }, 60_000);

  it('una serie su un comando sale di livello', () => {
    const d = generatePalestra(buildWorld('edge'), { skill: 'grep', seed: 5 });
    expect(d).toHaveLength(5);
    expect(d.every((x) => x.skill === 'grep')).toBe(true);
    const lv = d.map((x) => x.lv!);
    expect([...lv].sort()).toEqual(lv);
  });

  it('l\'allenamento misto alterna i comandi', () => {
    const d = generatePalestra(buildWorld('edge'), { pool: [{ skill: 'grep', weight: 3 }, { skill: 'find', weight: 1 }, { skill: 'cd', weight: 1 }], seed: 9 });
    expect(d).toHaveLength(6);
    for (let i = 1; i < d.length; i++) expect(d[i].skill === d[i - 1].skill && d[i].skill !== undefined).toBe(false);
  });

  it('copre i comandi principali del lavoro da junior', () => {
    for (const s of ['cd', 'ls', 'cat', 'grep', 'find', 'head', 'tail', 'wc', 'sort', 'uniq', 'cut', 'chmod', 'cp', 'mv', 'rm', 'mkdir', 'redirezioni', 'pipe']) expect(exercisesFor(s).length, s).toBeGreaterThan(0);
    expect(PALESTRA_SKILLS.length).toBeGreaterThanOrEqual(25);
  });
});
