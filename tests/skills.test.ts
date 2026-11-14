import { describe, expect, it } from 'vitest';
import { allMissions } from '../src/content';
import { MANPAGES } from '../src/engine/manpages';
import { MODULES, backfill, introduced, recordSuccess, skillsInLine, stateOf, type Skills } from '../src/game/skills';
import { defaultSave } from '../src/game/state';
import { mergeSaves } from '../src/game/sync';

const ctx = (skills: Skills, intro: string[] = [], srs: Record<string, [number, number]> = {}) => ({ skills, intro: new Set(intro), srs });

describe('competenze', () => {
  it('ogni competenza dei moduli ha una scheda nel Manuale', () => {
    const missing = MODULES.flatMap((m) => m.skills).filter((s) => !MANPAGES[s]);
    expect(missing).toEqual([]);
  });

  it('riconosce comandi e concetti in una riga', () => {
    expect(skillsInLine('grep -c "Failed" caso/auth.log').sort()).toEqual(['grep']);
    expect(new Set(skillsInLine('cat /etc/passwd | grep bash | wc -l'))).toEqual(new Set(['cat', 'grep', 'wc', 'pipe']));
    expect(skillsInLine('echo "ciao" >> note.txt')).toEqual(expect.arrayContaining(['echo', 'redirezioni']));
    expect(skillsInLine('for f in *.txt; do wc -l $f; done')).toEqual(expect.arrayContaining(['for', 'wc', 'variabili', 'jolly']));
    expect(skillsInLine('flag 40')).toEqual([]);
  });

  it('i cinque stati salgono solo con prove vere', () => {
    const s: Skills = {};
    expect(stateOf(ctx(s), 'grep')).toBe(0);
    expect(stateOf(ctx(s, ['grep']), 'grep')).toBe(1);
    expect(stateOf(ctx(s, ['grep'], { 'o:grep:-c': [2, 99] }), 'grep')).toBe(2);
    recordSuccess(s, ['grep'], 'ch04-m2', true, 100);
    expect(stateOf(ctx(s), 'grep')).toBe(3);
    recordSuccess(s, ['grep'], 'ch04-m2', false, 100);
    recordSuccess(s, ['grep'], 'ch04-m2', false, 101);
    expect(stateOf(ctx(s), 'grep')).toBe(3); // stessa situazione: non basta
    const up = recordSuccess(s, ['grep'], 'sim:bruteforce', false, 102);
    expect(up).toEqual(['grep']);
    expect(stateOf(ctx(s), 'grep')).toBe(4);
    recordSuccess(s, ['grep'], 'pal:grep-c', false, 105);
    expect(stateOf(ctx(s), 'grep')).toBe(4); // troppo presto
    recordSuccess(s, ['grep'], 'esame', false, 110);
    expect(stateOf(ctx(s), 'grep')).toBe(5);
  });

  it('ricostruisce le prove dal diario delle missioni', () => {
    const s: Skills = {};
    backfill(
      s,
      {
        'ch01-m2': [
          { l: 'pwd', d: '/home/x', s: 2, k: 'p' },
          { l: 'ls', d: '/home/x', s: 4, k: 'p' },
        ],
        'ch01-m3': [
          { l: '', d: '/home/x', s: 1, k: 'h' },
          { l: 'cat missioni/benvenuto.txt', d: '/home/x', s: 1, k: 'p' },
          { l: 'ls -a missioni', d: '/home/x', s: 4, k: 'p' },
        ],
      },
      50,
    );
    expect(s.ls.solo.sort()).toEqual(['ch01-m2', 'ch01-m3']);
    expect(s.ls.acq).toBe(50);
    expect(s.cat.ex).toBe(1);
    expect(s.cat.solo).toEqual([]);
  });

  it('le lezioni viste rendono le competenze "introdotte"', () => {
    const ids = allMissions().map((m) => m.id);
    expect(introduced([], {}).size).toBe(0);
    const after = introduced([ids[0]], {});
    expect(after.has('whoami')).toBe(true);
  });

  it('l\'unione dei salvataggi somma le prove dei due dispositivi', () => {
    const a = { ...defaultSave(), updatedAt: 1, skills: { grep: { ex: 3, solo: ['ch04-m2'], acq: undefined } } };
    const b = { ...defaultSave(), updatedAt: 2, skills: { grep: { ex: 1, solo: ['sim:x'], acq: 40 }, ls: { ex: 1, solo: [] } } };
    const m = mergeSaves(a, b);
    expect(m.skills.grep).toMatchObject({ ex: 3, acq: 40 });
    expect(new Set(m.skills.grep.solo)).toEqual(new Set(['ch04-m2', 'sim:x']));
    expect(m.skills.ls.ex).toBe(1);
  });
});

describe('passi aggiunti al corso', () => {
  it('i progressi salvati prima restano sullo stesso passo', async () => {
    const { migrateProgress } = await import('../src/game/migrate');
    const m = allMissions().find((x) => x.steps.some((s) => s.since))!;
    const newIdx = m.steps.findIndex((s) => s.since);
    const target = m.steps.findIndex((s, i) => i > newIdx && !s.since);
    const oldIdx = m.steps.slice(0, target).filter((s) => !s.since).length;
    const save = { ...defaultSave(), contentVer: 0, progress: { [m.id]: oldIdx } };
    const out = migrateProgress(save);
    expect(out.progress[m.id]).toBe(target);
    expect(migrateProgress(out).progress[m.id]).toBe(target);
  });
});
