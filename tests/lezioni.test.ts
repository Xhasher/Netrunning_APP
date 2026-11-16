import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'fs';
import { CHAPTERS } from '../src/content';
import { expandLive } from '../src/content/live';
import { LIVE, LIVE_FRESH } from '../src/content/schede';
import { TEACH } from '../src/content/teach';
import { buildWorld } from '../src/content/world';
import { MANPAGES } from '../src/engine/manpages';

const lessons = CHAPTERS.flatMap((c) => c.missions.flatMap((m) => m.steps.filter((s) => s.kind === 'lesson' && s.scheda).map((s) => ({ m: m.id, s: s as { title: string; body: string; scheda: string; since?: number } }))));
const isErr = (l: string) =>
  /^(bash|[a-z][a-z0-9_.-]*): .*(No such file|not found|Permission denied|cannot|invalid|missing|Is a directory|Not a directory|unknown|not permitted|File exists|manca|serve)|^Failed to |^ERROR|^Usage:|^What manual page|\[NC-ETICA\]|NXDOMAIN|is not in the sudoers|QUITTING|command not found/i.test(l) && !/Connection refused/.test(l);

describe('lezioni sui comandi', () => {
  it('ogni lezione scritta a mano riguarda un comando del Manuale e viene usata nel corso', () => {
    for (const k of Object.keys(TEACH)) expect(MANPAGES[k], k).toBeTruthy();
    const used = new Set(lessons.filter((l) => !l.s.since).map((l) => l.s.scheda));
    expect(Object.keys(TEACH).filter((k) => !used.has(k))).toEqual([]);
  });

  it('gli esempi dal vivo funzionano e gli errori mostrati sono errori veri', () => {
    const report: string[] = [];
    const bad: string[] = [];
    for (const { m, s } of lessons) {
      const out = expandLive(s.body, 'edge');
      expect(out.includes(LIVE) || out.includes(LIVE_FRESH), `${s.title}: segnaposto rimasto`).toBe(false);
      report.push(`\n######## ${m} · ${s.title}\n${out}`);
      const t = TEACH[s.scheda];
      const wrong = new Set((t?.mistakes ?? []).map(([c]) => c));
      // ogni blocco terminale: comandi e risposte
      for (const b of out.matchAll(/```\n([\s\S]*?)```/g)) {
        const lines = b[1].split('\n');
        let cur = '';
        let errs: string[] = [];
        let silent = true;
        const close = () => {
          if (!cur) return;
          if (wrong.has(cur)) {
            // un errore tipico deve produrre un messaggio, tranne quelli "silenziosi" spiegati nel testo
            if (!errs.length && silent && !/Nessun errore|Nessun risultato/.test(t!.mistakes!.find(([c]) => c === cur)![1])) bad.push(`${s.title}: l'errore "${cur}" non dà errore`);
          } else if (errs.length) bad.push(`${s.title}: "${cur}" → ${errs[0]}`);
        };
        for (const l of lines) {
          if (l.startsWith('$ ')) {
            close();
            cur = l.slice(2);
            errs = [];
            silent = true;
          } else {
            if (cur && !l.startsWith('(nessuna risposta')) silent = false;
            if (cur && isErr(l)) errs.push(l);
          }
        }
        close();
      }
    }
    writeFileSync('/tmp/claude-0/-home-user/318dce16-3d94-59e3-baa4-390ef5172e3d/scratchpad/lezioni.txt', report.join('\n'));
    expect(bad).toEqual([]);
  });

  it('una lezione non mostra esempi con comandi mai visti', () => {
    const sh = buildWorld('edge');
    void sh;
    const first = lessons.find((l) => l.s.scheda === 'ls' && !l.s.since)!;
    expect(first.s.body).not.toMatch(/wc -l|ls -lhS/);
    expect(first.s.body).toContain('@nyx:');
    expect(first.s.body).not.toContain('diversi dall');
  });
});
