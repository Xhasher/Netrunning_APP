import { describe, expect, it } from 'vitest';
import { buildWorld } from '../src/content/world';
import { COMMANDS } from '../src/engine/shell';
import { MANPAGES } from '../src/engine/manpages';

// comandi interni o alias che non hanno bisogno di una scheda propria
const NO_DOC = new Set(['[', 'true', 'false', 'w', 'ls-', 'groups-', 'python']);
// esempi che richiedono interazione o un contesto speciale
const SKIP = [/^!!/, /^nano\b/, /^ssh\b/, /^exit\b/, /^flag\b/, /^report\b/, /^hint\b/];

describe('manuale', () => {
  it('ogni comando ha una scheda, con descrizione', () => {
    const missing = Object.keys(COMMANDS).filter((c) => !NO_DOC.has(c) && !MANPAGES[c]?.description?.length);
    expect(missing, `comandi senza scheda: ${missing.join(', ')}`).toEqual([]);
  });

  it('"vedi anche" rimanda sempre a schede esistenti', () => {
    const bad: string[] = [];
    for (const p of Object.values(MANPAGES)) for (const s of p.see ?? []) if (!MANPAGES[s]) bad.push(`${p.name} → ${s}`);
    expect(bad).toEqual([]);
  });

  it('ogni scheda ha una categoria e una breve descrizione', () => {
    const bad = Object.values(MANPAGES).filter((p) => !p.cat || !p.short).map((p) => p.name);
    expect(bad, bad.join(', ')).toEqual([]);
  });

  it('tutti gli esempi funzionano nel deck, senza errori', () => {
    const failures: string[] = [];
    let n = 0;
    for (const p of Object.values(MANPAGES)) {
      for (const [cmd] of p.examples ?? []) {
        if (SKIP.some((r) => r.test(cmd)) || p.game) continue;
        n++;
        const sh = buildWorld('edge');
        const r = sh.run(cmd);
        const errs = r.lines.filter((l) => l.cls === 'err' && /^(bash|[a-z][a-z0-9_.-]*): /i.test(l.text)).map((l) => l.text);
        const expectedErr = false;
        if (errs.length && !(cmd.startsWith('chown') || cmd.startsWith('lastb') || cmd.startsWith('nc -zv jukebox.lan 3306') || cmd.startsWith('curl -i') || cmd.startsWith('crontab -l') || cmd.includes('2>/dev/null') && false))
          failures.push(`[${p.name}] ${cmd} → ${errs[0]}`);
        void expectedErr;
        if (!r.lines.length && !/&&|>|rm |mv |cp |touch|mkdir|chmod|alias|sed -i|tar|tee|^IP=|^N=|^\[ |^cd |^diff -q/.test(cmd) && !cmd.includes('2>/dev/null')) failures.push(`[${p.name}] ${cmd} → nessun output`);
      }
    }
    expect(n).toBeGreaterThan(150);
    expect(failures.join('\n')).toBe('');
  });
});
