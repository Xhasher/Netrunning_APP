// Esempi dal vivo nelle lezioni: i blocchi di codice che finiscono con il segnaposto
// vengono eseguiti su un deck pulito (non su quello del giocatore) e completati con
// l'output vero. Tutti i blocchi di una lezione condividono lo stesso deck, così un
// esempio può costruire su quello precedente.

import type { Shell } from '../engine/shell';
import { LIVE, LIVE_FRESH } from './schede';
import { buildWorld } from './world';

const MAX_LINES = 12;
const cache = new Map<string, string>();

function runBlock(sh: Shell, cmds: string[]): string[] {
  const out: string[] = [];
  sh.cwd = sh.home;
  for (const cmd of cmds) {
    out.push(`$ ${cmd}`);
    const res = sh.run(cmd);
    const lines = res.lines.filter((l) => l.cls !== 'info' && l.cls !== 'cmd').map((l) => l.text);
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    if (!lines.length) out.push('(nessuna risposta: il comando ha lavorato in silenzio)');
    else if (lines.length > MAX_LINES) out.push(...lines.slice(0, MAX_LINES), `… (altre ${lines.length - MAX_LINES} righe)`);
    else out.push(...lines);
  }
  return out;
}

/** Sostituisce ogni blocco "$ comando ... %%OUT%%" con comando e risposta vera. */
export function expandLive(body: string, user: string): string {
  if (!body.includes(LIVE) && !body.includes(LIVE_FRESH)) return body;
  const key = `${user}\u0000${body}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const sh = buildWorld(user);
  const done = body.replace(/```\n([\s\S]*?)```/g, (block, inner: string) => {
    if (!inner.includes(LIVE) && !inner.includes(LIVE_FRESH)) return block;
    const cmds = inner
      .split('\n')
      .filter((l) => l.startsWith('$ '))
      .map((l) => l.slice(2));
    return '```\n' + runBlock(inner.includes(LIVE_FRESH) ? buildWorld(user) : sh, cmds).join('\n') + '\n```';
  });
  if (cache.size > 40) cache.clear();
  cache.set(key, done);
  return done;
}
