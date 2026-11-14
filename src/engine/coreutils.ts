// Strumenti di base di Linux con le opzioni vere: ls, cat, head, tail, wc, grep,
// sort, uniq, cut, find e altri usati ogni giorno da chi lavora in sicurezza.
// Sostituiscono le versioni minime di shell.ts (si registrano in COMMANDS).

import { COMMANDS, longEntry, readText, splitLines, type Ctx } from './shell';
import { sha256 } from './sha256';
import type { Line } from './types';
import type { DirNode, VNode } from './vfs';

// ---------------------------------------------------------------- utilità

interface Parsed {
  f: Set<string>;
  v: Record<string, string>;
  rest: string[];
  err?: string;
}

/** Legge opzioni brevi (-la, -n5, -n 5, -k2 -t:) separando le opzioni dagli argomenti. */
export function parseOpts(args: string[], flags: string, vals: string): Parsed {
  const f = new Set<string>();
  const v: Record<string, string> = {};
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') {
      rest.push(...args.slice(i + 1));
      break;
    }
    if (a.length > 1 && a[0] === '-' && a[1] !== '-') {
      for (let j = 1; j < a.length; j++) {
        const ch = a[j];
        if (vals.includes(ch)) {
          const tail = a.slice(j + 1);
          if (tail !== '') v[ch] = tail;
          else if (i + 1 < args.length) v[ch] = args[++i];
          else return { f, v, rest, err: `l'opzione richiede un valore -- '${ch}'` };
          break;
        }
        if (flags.includes(ch)) f.add(ch);
        else return { f, v, rest, err: `opzione non valida -- '${ch}'` };
      }
    } else rest.push(a);
  }
  return { f, v, rest };
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const quote = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

function humanSize(n: number): string {
  if (n < 1024) return String(n);
  const units = ['K', 'M', 'G'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)}${units[i]}`;
}

function mkLine(c: Ctx, name: string, node: VNode, human: boolean): Line {
  const l = longEntry(c.sh, name, node);
  if (!human) return l;
  const size = c.sh.fs.size(node);
  return { ...l, text: l.text.replace(/^(\S+\s+\d+\s+\S+\s+\S+\s+)\s*\d+/, (_m, pre: string) => pre + humanSize(size).padStart(5)) };
}

/** Intervalli come in cut: "1,3", "2-4", "2-", "-3". Restituisce un test sull'indice (da 1). */
function parseRanges(spec: string): ((i: number) => boolean) | null {
  const parts = spec.split(',').filter(Boolean);
  if (!parts.length) return null;
  const tests: ((i: number) => boolean)[] = [];
  for (const p of parts) {
    const m = p.match(/^(\d*)(-?)(\d*)$/);
    if (!m || (m[1] === '' && m[3] === '')) return null;
    const a = m[1] === '' ? 1 : Number(m[1]);
    const b = m[2] === '' ? a : m[3] === '' ? Infinity : Number(m[3]);
    if (a < 1 || b < a) return null;
    tests.push((i) => i >= a && i <= b);
  }
  return (i) => tests.some((t) => t(i));
}

function collectFiles(c: Ctx, abs: string, shown: string, out: [string, string][]): void {
  const node = c.sh.fs.get(abs);
  if (!node || c.sh.blocked(abs)) return;
  if (node.type === 'file') {
    out.push([abs, shown]);
    return;
  }
  if (node.locked) return;
  for (const name of [...node.children.keys()].sort()) collectFiles(c, `${abs === '/' ? '' : abs}/${name}`, `${shown.replace(/\/$/, '')}/${name}`, out);
}

// ---------------------------------------------------------------- ls

function ls(c: Ctx): number {
  const p = parseOpts(c.args, 'alh1RrSdt', '');
  if (p.err) {
    c.err(`ls: ${p.err}`);
    c.info('💡 Opzioni disponibili: -a -l -h -R -r -S -t -d -1. Vedi "man ls".');
    return 2;
  }
  const { f } = p;
  const all = f.has('a');
  const long = f.has('l');
  const human = f.has('h');
  const rec = f.has('R');
  const targets = p.rest.length ? p.rest : ['.'];
  const dirFlags = [...f];
  let code = 0;

  const sortEntries = (entries: [string, VNode][]) => {
    entries.sort(([a], [b]) => a.replace(/^\./, '').localeCompare(b.replace(/^\./, '')));
    if (f.has('S')) entries.sort(([, a], [, b]) => c.sh.fs.size(b) - c.sh.fs.size(a));
    else if (f.has('t')) entries.sort(([, a], [, b]) => (a.mtime < b.mtime ? 1 : a.mtime > b.mtime ? -1 : 0));
    if (f.has('r')) entries.reverse();
  };

  const show = (name: string, node: VNode) => {
    if (long) {
      const l = mkLine(c, name, node, human);
      c.out(l.text, l.cls);
    } else if (node.type === 'dir') c.out(name === '.' || name === '..' ? name : name + '/', 'dir');
    else c.out(name);
  };

  const listDir = (abs: string, shown: string, header: boolean): void => {
    const node = c.sh.fs.get(abs) as DirNode;
    c.emit({ type: 'ls', path: abs, flags: dirFlags });
    if (header) c.out(`${shown}:`, 'dim');
    const entries: [string, VNode][] = [...node.children.entries()].filter(([n]) => all || !n.startsWith('.'));
    sortEntries(entries);
    if (all) {
      entries.unshift(['..', c.sh.fs.get(abs === '/' ? '/' : abs + '/..') as DirNode]);
      entries.unshift(['.', node]);
    }
    if (long) c.out(`total ${entries.length * 4}`);
    for (const [n, child] of entries) show(n, child);
    if (!long && entries.length === 0) c.out('(cartella vuota)', 'dim');
    if (rec)
      for (const [n, child] of entries) {
        if (n === '.' || n === '..' || child.type !== 'dir' || child.locked) continue;
        c.out('');
        listDir(`${abs === '/' ? '' : abs}/${n}`, `${shown.replace(/\/$/, '')}/${n}`, true);
      }
  };

  targets.forEach((t, i) => {
    const abs = c.sh.abs(t);
    const node = c.sh.fs.get(abs);
    if (!node || c.sh.blocked(abs)) {
      c.err(`ls: cannot access '${t}': ${node ? 'Permission denied' : 'No such file or directory'}`);
      code = 2;
      return;
    }
    if (node.type === 'file' || f.has('d')) {
      show(t, node);
      return;
    }
    if (node.locked) {
      c.err(`ls: cannot open directory '${t}': Permission denied`);
      code = 2;
      return;
    }
    listDir(abs, t, targets.length > 1 || rec);
    if (targets.length > 1 && i < targets.length - 1) c.out('');
  });
  return code;
}

// ---------------------------------------------------------------- cat, head, tail, wc

function cat(c: Ctx): number {
  const p = parseOpts(c.args, 'nbAs', '');
  if (p.err) {
    c.err(`cat: ${p.err}`);
    return 1;
  }
  if (p.rest.length === 0 && c.stdin === null) {
    c.err('cat: manca il nome del file');
    c.info('💡 Scrivi il nome del file dopo cat, es: cat note.txt');
    return 1;
  }
  const text = readText(c, p.rest, 'cat');
  if (text === null) return 1;
  let n = 0;
  let prevBlank = false;
  for (const l of splitLines(text)) {
    if (p.f.has('s') && l === '' && prevBlank) continue;
    prevBlank = l === '';
    const numbered = p.f.has('b') ? l !== '' : p.f.has('n');
    if (numbered) n++;
    const shown = p.f.has('A') ? l + '$' : l;
    c.out(numbered ? `${String(n).padStart(6)}\t${shown}` : shown);
  }
  return 0;
}

function headTail(c: Ctx, which: 'head' | 'tail'): number {
  const args = c.args.map((a) => (/^-\d+$/.test(a) ? `-n${a.slice(1)}` : a));
  const p = parseOpts(args, 'qvf', 'nc');
  if (p.err) {
    c.err(`${which}: ${p.err}`);
    return 1;
  }
  const fromStart = which === 'tail' && /^\+\d+$/.test(p.v.n ?? '');
  const n = p.v.c !== undefined ? Number(p.v.c) : fromStart ? Number(p.v.n.slice(1)) : p.v.n !== undefined ? Number(p.v.n) : 10;
  if (!Number.isInteger(n) || n < 0) {
    c.err(`${which}: invalid number of ${p.v.c !== undefined ? 'bytes' : 'lines'}: '${p.v.n ?? p.v.c}'`);
    return 1;
  }
  if (p.f.has('f') && which === 'tail') c.info('💡 tail -f seguirebbe il file in tempo reale. Qui mostro le ultime righe e termino.');
  const files = p.rest.length ? p.rest : [];
  const many = files.length > 1 && !p.f.has('q');
  const list = files.length ? files : [''];
  for (let i = 0; i < list.length; i++) {
    const text = readText(c, list[i] ? [list[i]] : [], which);
    if (text === null) return 1;
    if (many || p.f.has('v')) c.out(`${i ? '\n' : ''}==> ${list[i] || 'standard input'} <==`, 'dim');
    if (p.v.c !== undefined) {
      const bytes = text;
      for (const l of splitLines(which === 'head' ? bytes.slice(0, n) : bytes.slice(Math.max(0, bytes.length - n)))) c.out(l);
      continue;
    }
    const lines = splitLines(text);
    const sel = which === 'head' ? lines.slice(0, n) : fromStart ? lines.slice(Math.max(0, n - 1)) : lines.slice(Math.max(0, lines.length - n));
    for (const l of sel) c.out(l);
  }
  return 0;
}

function wc(c: Ctx): number {
  const p = parseOpts(c.args, 'lwcmL', '');
  if (p.err) {
    c.err(`wc: ${p.err}`);
    return 1;
  }
  const sel = ['l', 'w', 'c', 'm', 'L'].filter((x) => p.f.has(x));
  const files = p.rest.length ? p.rest : [''];
  const tot = { l: 0, w: 0, c: 0, m: 0, L: 0 };
  for (const file of files) {
    const text = readText(c, file ? [file] : [], 'wc');
    if (text === null) return 1;
    const v = {
      l: (text.match(/\n/g) ?? []).length,
      w: text.split(/\s+/).filter(Boolean).length,
      c: new TextEncoder().encode(text).length,
      m: [...text].length,
      L: Math.max(0, ...splitLines(text).map((l) => [...l].length)),
    };
    for (const k of Object.keys(tot) as (keyof typeof tot)[]) tot[k] += v[k];
    const nums = sel.length ? sel.map((k) => String(v[k as keyof typeof v])).join(' ') : `${String(v.l).padStart(3)} ${String(v.w).padStart(4)} ${String(v.c).padStart(5)}`;
    c.out(`${nums}${file ? ' ' + file : ''}`);
  }
  if (files.length > 1) {
    const nums = sel.length ? sel.map((k) => String(tot[k as keyof typeof tot])).join(' ') : `${String(tot.l).padStart(3)} ${String(tot.w).padStart(4)} ${String(tot.c).padStart(5)}`;
    c.out(`${nums} total`);
  }
  return 0;
}

// ---------------------------------------------------------------- grep

function grep(c: Ctx): number {
  const args = c.args.map((a) => (/^-[ABC]\d+$/.test(a) ? `${a.slice(0, 2)}${a.slice(2)}` : a));
  const p = parseOpts(args, 'ivncrRwlLEFohHqs', 'ABCme');
  if (p.err) {
    c.err(`grep: ${p.err}`);
    c.info('💡 Opzioni: -i -v -n -c -r -w -l -L -E -o -h -H -q -A -B -C -m. Vedi "man grep".');
    return 2;
  }
  const rest = [...p.rest];
  const pattern: string | undefined = p.v.e ?? rest.shift();
  if (pattern === undefined) {
    c.err('Usage: grep [OPTION]... PATTERNS [FILE]...');
    return 2;
  }
  let re: RegExp;
  try {
    let src = p.f.has('E') && !p.f.has('F') ? pattern : esc(pattern);
    if (p.f.has('w')) src = `(?<![A-Za-z0-9_])(?:${src})(?![A-Za-z0-9_])`;
    re = new RegExp(src, `${p.f.has('i') ? 'i' : ''}g`);
  } catch {
    c.err(`grep: espressione regolare non valida: ${pattern}`);
    return 2;
  }
  const test = (l: string) => {
    re.lastIndex = 0;
    return re.test(l);
  };
  const recursive = p.f.has('r') || p.f.has('R');
  const after = Number(p.v.A ?? p.v.C ?? 0);
  const before = Number(p.v.B ?? p.v.C ?? 0);
  const max = p.v.m !== undefined ? Number(p.v.m) : Infinity;

  // elenco delle sorgenti: [nome mostrato, testo]
  const sources: [string, string][] = [];
  const targets = rest.length ? rest : recursive ? ['.'] : [];
  let failed = false;
  if (!targets.length) {
    const t = readText(c, [], 'grep');
    if (t === null) return 2;
    sources.push(['(standard input)', t]);
  }
  for (const t of targets) {
    const abs = c.sh.abs(t);
    const node = c.sh.fs.get(abs);
    if (node?.type === 'dir' && !c.sh.blocked(abs)) {
      if (!recursive) {
        c.err(`grep: ${t}: Is a directory`);
        failed = true;
        continue;
      }
      const list: [string, string][] = [];
      collectFiles(c, abs, t === '.' ? '' : t, list);
      for (const [fa, shown] of list) {
        const text = readText(c, [fa], 'grep');
        if (text !== null) sources.push([shown.replace(/^\//, '') || fa, text]);
      }
    } else {
      const text = readText(c, [t], 'grep');
      if (text === null) failed = true;
      else sources.push([t, text]);
    }
  }
  const showName = p.f.has('H') || (!p.f.has('h') && (targets.length > 1 || recursive));
  let total = 0;
  let sep = false;
  for (const [name, text] of sources) {
    const lines = splitLines(text);
    const hits: number[] = [];
    lines.forEach((l, i) => {
      if (hits.length < max && test(l) !== p.f.has('v')) hits.push(i);
    });
    total += hits.length;
    const pre = showName ? `${name}` : '';
    if (p.f.has('q')) continue;
    if (p.f.has('l')) {
      if (hits.length) c.out(name);
      continue;
    }
    if (p.f.has('L')) {
      if (!hits.length) c.out(name);
      continue;
    }
    if (p.f.has('c')) {
      c.out(`${pre ? pre + ':' : ''}${hits.length}`);
      continue;
    }
    if (p.f.has('o') && !p.f.has('v')) {
      for (const i of hits) {
        re.lastIndex = 0;
        for (const m of lines[i].matchAll(re)) c.out(`${pre ? pre + ':' : ''}${p.f.has('n') ? `${i + 1}:` : ''}${m[0]}`);
      }
      continue;
    }
    const show = new Map<number, boolean>(); // indice → è una corrispondenza
    for (const i of hits) {
      for (let k = Math.max(0, i - before); k <= Math.min(lines.length - 1, i + after); k++) if (!show.get(k)) show.set(k, k === i || hits.includes(k));
    }
    let prev = -2;
    for (const i of [...show.keys()].sort((a, b) => a - b)) {
      if ((before || after) && prev >= 0 && i > prev + 1) c.out('--', 'dim');
      else if ((before || after) && sep && prev === -2) c.out('--', 'dim');
      const mark = show.get(i) ? ':' : '-';
      c.out(`${pre ? pre + mark : ''}${p.f.has('n') ? `${i + 1}${mark}` : ''}${lines[i]}`);
      prev = i;
    }
    if (show.size) sep = true;
  }
  if (failed && total === 0) return 2;
  return total > 0 ? 0 : 1;
}

// ---------------------------------------------------------------- sort, uniq, cut

function sort(c: Ctx): number {
  const p = parseOpts(c.args, 'nrufbc', 'kt');
  if (p.err) {
    c.err(`sort: ${p.err}`);
    return 2;
  }
  const text = readText(c, p.rest, 'sort');
  if (text === null) return 2;
  const sep = p.v.t;
  let kStart = 0;
  let kEnd = Infinity;
  if (p.v.k !== undefined) {
    const m = p.v.k.match(/^(\d+)(?:,(\d+))?/);
    if (!m) {
      c.err(`sort: campo non valido: '${p.v.k}'`);
      return 2;
    }
    kStart = Number(m[1]) - 1;
    kEnd = m[2] ? Number(m[2]) : kStart + 1;
  }
  const key = (l: string) => {
    if (p.v.k === undefined) return l;
    const parts = sep ? l.split(sep) : l.trim().split(/\s+/);
    return parts.slice(kStart, kEnd).join(sep ?? ' ');
  };
  const cmp = (a: string, b: string) => {
    let ka = key(a);
    let kb = key(b);
    if (p.f.has('n')) {
      const d = (parseFloat(ka) || 0) - (parseFloat(kb) || 0);
      if (d) return d;
      return 0;
    }
    if (p.f.has('f')) {
      ka = ka.toLowerCase();
      kb = kb.toLowerCase();
    }
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  };
  let lines = splitLines(text);
  if (p.f.has('c')) {
    for (let i = 1; i < lines.length; i++)
      if (cmp(lines[i - 1], lines[i]) > 0) {
        c.err(`sort: -:${i + 1}: disorder: ${lines[i]}`);
        return 1;
      }
    return 0;
  }
  lines = [...lines].sort(cmp);
  if (p.f.has('r')) lines.reverse();
  if (p.f.has('u')) lines = lines.filter((l, i) => i === 0 || cmp(lines[i - 1], l) !== 0);
  for (const l of lines) c.out(l);
  return 0;
}

function uniq(c: Ctx): number {
  const p = parseOpts(c.args, 'cduiu', '');
  if (p.err) {
    c.err(`uniq: ${p.err}`);
    return 1;
  }
  const text = readText(c, p.rest, 'uniq');
  if (text === null) return 1;
  const norm = (s: string) => (p.f.has('i') ? s.toLowerCase() : s);
  const groups: [string, number][] = [];
  for (const l of splitLines(text)) {
    const last = groups[groups.length - 1];
    if (last && norm(last[0]) === norm(l)) last[1]++;
    else groups.push([l, 1]);
  }
  for (const [l, n] of groups) {
    if (p.f.has('d') && n < 2) continue;
    if (p.f.has('u') && n > 1) continue;
    c.out(p.f.has('c') ? `${String(n).padStart(7)} ${l}` : l);
  }
  return 0;
}

function cut(c: Ctx): number {
  const p = parseOpts(c.args, 's', 'dfcb');
  if (p.err) {
    c.err(`cut: ${p.err}`);
    return 1;
  }
  const delim = p.v.d ?? '\t';
  if ([...delim].length !== 1) {
    c.err('cut: the delimiter must be a single character');
    return 1;
  }
  const spec = p.v.f ?? p.v.c ?? p.v.b;
  if (spec === undefined) {
    c.err('cut: you must specify a list of bytes, characters, or fields');
    c.info('💡 Esempio: cut -d " " -f 3 file.txt  (terza colonna, separata da spazi)');
    return 1;
  }
  const want = parseRanges(spec);
  if (!want) {
    c.err(`cut: invalid field value '${spec}'`);
    return 1;
  }
  const text = readText(c, p.rest, 'cut');
  if (text === null) return 1;
  for (const l of splitLines(text)) {
    if (p.v.f === undefined) {
      c.out([...l].filter((_, i) => want(i + 1)).join(''));
      continue;
    }
    const parts = l.split(delim);
    if (parts.length === 1) {
      if (!p.f.has('s')) c.out(l);
      continue;
    }
    c.out(parts.filter((_, i) => want(i + 1)).join(delim));
  }
  return 0;
}

// ---------------------------------------------------------------- find

function find(c: Ctx): number {
  const starts: string[] = [];
  const preds: ((abs: string, node: VNode, depth: number) => boolean)[] = [];
  let maxDepth = Infinity;
  let minDepth = 0;
  let exec: { cmd: string[]; plus: boolean } | null = null;
  let del = false;
  let negate = false;
  const add = (fn: (abs: string, node: VNode, depth: number) => boolean) => {
    const neg = negate;
    negate = false;
    preds.push((a, n, d) => fn(a, n, d) !== neg);
  };
  const a = c.args;
  const need = (i: number, opt: string): string | null => {
    if (a[i] === undefined) {
      c.err(`find: missing argument to \`${opt}'`);
      return null;
    }
    return a[i];
  };
  let i = 0;
  while (i < a.length && !a[i].startsWith('-') && a[i] !== '!' && a[i] !== '(') starts.push(a[i++]);
  for (; i < a.length; i++) {
    const o = a[i];
    if (o === '-not' || o === '!') {
      negate = true;
    } else if (o === '-name' || o === '-iname') {
      const pat = need(++i, o);
      if (pat === null) return 1;
      const re = new RegExp(`^${esc(pat).replace(/\\\*/g, '.*').replace(/\\\?/g, '.')}$`, o === '-iname' ? 'i' : '');
      add((abs) => re.test(abs.slice(abs.lastIndexOf('/') + 1)));
    } else if (o === '-type') {
      const t = need(++i, o);
      if (t === null) return 1;
      if (t !== 'f' && t !== 'd') {
        c.err(`find: Unknown argument to -type: ${t}`);
        return 1;
      }
      add((_a, n) => (t === 'd') === (n.type === 'dir'));
    } else if (o === '-user') {
      const u = need(++i, o);
      if (u === null) return 1;
      add((_a, n) => n.owner === u);
    } else if (o === '-group') {
      const g = need(++i, o);
      if (g === null) return 1;
      add((_a, n) => n.group === g);
    } else if (o === '-perm') {
      const m = need(++i, o);
      if (m === null) return 1;
      if (/^[-/]?4000$/.test(m) || m === '-u=s' || m === '/u=s') add((_a, n) => n.type === 'file' && n.perms[2] === 's');
      else if (/^-?0?[0-7]{3}$/.test(m)) {
        const oct = (perms: string) => perms.match(/.{3}/g)!.map((g) => (g[0] === 'r' ? 4 : 0) + (g[1] === 'w' ? 2 : 0) + (/[xs]/.test(g[2]) ? 1 : 0)).join('');
        const want = m.replace(/^-?0?/, '');
        add((_a, n) => (m.startsWith('-') ? [...oct(n.perms)].every((d, k) => (Number(d) & Number(want[k])) === Number(want[k])) : oct(n.perms) === want));
      } else {
        c.err(`find: modo non supportato in questo deck: ${m}`);
        c.info('💡 -perm accetta: 644 (esatto), -644 (almeno questi), -4000 (SUID).');
        return 1;
      }
    } else if (o === '-size') {
      const sz = need(++i, o);
      if (sz === null) return 1;
      const m = sz.match(/^([+-]?)(\d+)([ckMG]?)$/);
      if (!m) {
        c.err(`find: argomento non valido per -size: ${sz}`);
        return 1;
      }
      const mult = { '': 512, c: 1, k: 1024, M: 1048576, G: 1073741824 }[m[3] as '' | 'c' | 'k' | 'M' | 'G'];
      const limit = Number(m[2]) * mult;
      add((_a, n) => {
        if (n.type !== 'file') return false;
        const s = c.sh.fs.size(n);
        return m[1] === '+' ? s > limit : m[1] === '-' ? s < limit : Math.ceil(s / mult) * mult === limit || s === limit;
      });
    } else if (o === '-empty') {
      add((_a, n) => (n.type === 'file' ? n.content === '' : n.children.size === 0));
    } else if (o === '-maxdepth' || o === '-mindepth') {
      const d = need(++i, o);
      if (d === null) return 1;
      if (!/^\d+$/.test(d)) {
        c.err(`find: argomento non valido '${d}' per ${o}`);
        return 1;
      }
      if (o === '-maxdepth') maxDepth = Number(d);
      else minDepth = Number(d);
    } else if (o === '-exec') {
      const cmd: string[] = [];
      i++;
      while (i < a.length && a[i] !== ';' && a[i] !== '+') cmd.push(a[i++]);
      if (i >= a.length || !cmd.length) {
        c.err("find: missing argument to `-exec'");
        return 1;
      }
      exec = { cmd, plus: a[i] === '+' };
    } else if (o === '-delete') {
      del = true;
    } else if (o === '-print') {
      /* è già il comportamento predefinito */
    } else {
      c.err(`find: unknown predicate \`${o}'`);
      c.info('💡 Supportati: -name -iname -type -user -group -perm -size -empty -maxdepth -mindepth -not -exec -delete.');
      return 1;
    }
  }
  if (!starts.length) starts.push('.');

  const matches: string[] = [];
  let denied = false;
  const walk = (node: VNode, shown: string, abs: string, depth: number) => {
    if (depth >= minDepth && preds.every((fn) => fn(abs, node, depth))) matches.push(shown);
    if (node.type !== 'dir' || depth >= maxDepth) return;
    if (node.locked) {
      c.err(`find: '${shown}': Permission denied`);
      denied = true;
      return;
    }
    for (const [k, child] of [...node.children.entries()].sort(([x], [y]) => x.localeCompare(y)))
      walk(child, shown === '/' ? `/${k}` : `${shown}/${k}`, `${abs === '/' ? '' : abs}/${k}`, depth + 1);
  };
  const absOf = new Map<string, string>();
  for (const st of starts) {
    const abs = c.sh.abs(st);
    const node = c.sh.fs.get(abs);
    if (!node) {
      c.err(`find: '${st}': No such file or directory`);
      denied = true;
      continue;
    }
    const before = matches.length;
    walk(node, st.length > 1 ? st.replace(/\/$/, '') : st, abs, 0);
    for (let k = before; k < matches.length; k++) absOf.set(matches[k], c.sh.abs(matches[k]));
  }

  if (del) {
    for (const m of [...matches].reverse()) {
      const abs = c.sh.abs(m);
      const parent = c.sh.fs.get(abs.slice(0, abs.lastIndexOf('/')) || '/') as DirNode | undefined;
      const node = c.sh.fs.get(abs);
      if (!parent || !node || node.type === 'dir' && node.children.size) continue;
      if (parent.owner !== c.sh.user && parent.perms[7] !== 'w') {
        c.err(`find: cannot delete '${m}': Permission denied`);
        denied = true;
        continue;
      }
      parent.children.delete(abs.slice(abs.lastIndexOf('/') + 1));
      c.emit({ type: 'fsop', op: 'rm', paths: [abs] });
    }
    return denied ? 1 : 0;
  }
  if (exec) {
    const run = (line: string) => {
      const inner = { lines: [] as Line[], events: c.sink.events, capture: [] as Line[] };
      c.sh.execText(line, inner, c.depth + 1);
      for (const l of inner.lines) c.raw(l, 'err');
      for (const l of inner.capture) c.raw(l, 'out');
    };
    if (exec.plus) run(exec.cmd.flatMap((t) => (t === '{}' ? matches : [t])).map(quote).join(' '));
    else for (const m of matches) run(exec.cmd.map((t) => quote(t.split('{}').join(m))).join(' '));
    return denied ? 1 : 0;
  }
  for (const m of matches) c.out(m, c.sh.fs.get(c.sh.abs(m))?.type === 'dir' ? 'dir' : 'out');
  return denied ? 1 : 0;
}

// ---------------------------------------------------------------- tr, tee, xargs, diff

function expandSet(s: string): string {
  const classes: Record<string, string> = {
    '[:upper:]': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '[:lower:]': 'abcdefghijklmnopqrstuvwxyz',
    '[:digit:]': '0123456789',
    '[:alpha:]': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    '[:space:]': ' \t\n',
    '[:punct:]': '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
  };
  let out = s.replace(/\[:[a-z]+:\]/g, (m) => classes[m] ?? m).replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  out = out.replace(/(.)-(.)/g, (_m, a: string, b: string) => {
    let r = '';
    for (let k = a.charCodeAt(0); k <= b.charCodeAt(0); k++) r += String.fromCharCode(k);
    return r;
  });
  return out;
}

function tr(c: Ctx): number {
  const p = parseOpts(c.args, 'dsc', '');
  if (p.err || p.rest.length < 1 || (!p.f.has('d') && !p.f.has('s') && p.rest.length < 2)) {
    c.err(p.err ? `tr: ${p.err}` : 'tr: operando mancante');
    c.info('💡 Esempi: tr a-z A-Z · tr -d " " · tr -s " " (legge dall\'input di una pipe).');
    return 1;
  }
  if (c.stdin === null) {
    c.err('tr: serve un input: usa una pipe, es. echo ciao | tr a-z A-Z');
    return 1;
  }
  const s1 = expandSet(p.rest[0]);
  const s2 = expandSet(p.rest[1] ?? '');
  let out = '';
  let last = '';
  for (const ch of c.stdin) {
    const inSet = s1.includes(ch) !== p.f.has('c');
    if (p.f.has('d') && inSet) continue;
    let r = ch;
    if (inSet && s2 && !p.f.has('d')) r = s2[Math.min(s1.indexOf(ch) < 0 ? s2.length - 1 : s1.indexOf(ch), s2.length - 1)];
    if (p.f.has('s') && inSet && r === last) continue;
    out += r;
    last = r;
  }
  for (const l of splitLines(out)) c.out(l);
  return 0;
}

function tee(c: Ctx): number {
  const p = parseOpts(c.args, 'a', '');
  if (p.err) {
    c.err(`tee: ${p.err}`);
    return 1;
  }
  const text = c.stdin ?? '';
  for (const f of p.rest) {
    const e = c.sh.writeText(c.sh.abs(f), text, p.f.has('a'));
    if (e) c.err(`tee: ${f}: ${e}`);
    else c.emit({ type: 'write', path: c.sh.abs(f) });
  }
  for (const l of splitLines(text)) c.out(l);
  return 0;
}

function xargs(c: Ctx): number {
  let i = 0;
  let per = Infinity;
  let rep: string | null = null;
  while (i < c.args.length && c.args[i].startsWith('-')) {
    const a = c.args[i];
    if (a === '-n') per = Number(c.args[++i]);
    else if (/^-n\d+$/.test(a)) per = Number(a.slice(2));
    else if (a === '-I') rep = c.args[++i] ?? '{}';
    else if (a !== '-0' && a !== '-t') {
      c.err(`xargs: opzione non valida -- '${a.slice(1)}'`);
      return 1;
    }
    i++;
  }
  if (!Number.isFinite(per) && per !== Infinity) per = Infinity;
  const cmd = c.args.slice(i).length ? c.args.slice(i) : ['echo'];
  const tokens = (c.stdin ?? '').split(/\s+/).filter(Boolean);
  const batches: string[][] = [];
  if (rep) for (const t of tokens) batches.push([t]);
  else {
    const size = Number.isFinite(per) && per > 0 ? per : tokens.length || 1;
    for (let k = 0; k < tokens.length; k += size) batches.push(tokens.slice(k, k + size));
  }
  if (!batches.length) batches.push([]);
  for (const b of batches) {
    const line = rep ? cmd.map((t) => quote(t.split(rep!).join(b[0] ?? ''))).join(' ') : [...cmd.map(quote), ...b.map(quote)].join(' ');
    const inner = { lines: [] as Line[], events: c.sink.events, capture: [] as Line[] };
    c.sh.execText(line, inner, c.depth + 1);
    for (const l of inner.lines) c.raw(l, 'err');
    for (const l of inner.capture) c.raw(l, 'out');
  }
  return 0;
}

function diff(c: Ctx): number {
  const p = parseOpts(c.args, 'uq', '');
  if (p.err || p.rest.length !== 2) {
    c.err(p.err ? `diff: ${p.err}` : 'diff: servono due file');
    return 2;
  }
  const A = readText(c, [p.rest[0]], 'diff');
  const B = readText(c, [p.rest[1]], 'diff');
  if (A === null || B === null) return 2;
  const a = splitLines(A);
  const b = splitLines(B);
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops: { t: ' ' | '-' | '+'; l: string; i: number; j: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) ops.push({ t: ' ', l: a[i], i: i++, j: j++ });
    else if (j < b.length && (i >= a.length || dp[i][j + 1] >= dp[i + 1][j])) ops.push({ t: '+', l: b[j], i, j: j++ });
    else ops.push({ t: '-', l: a[i], i: i++, j });
  }
  if (!ops.some((o) => o.t !== ' ')) return 0;
  c.emit({ type: 'command', name: 'diff-found', args: [], ok: true });
  if (p.f.has('q')) {
    c.out(`Files ${p.rest[0]} and ${p.rest[1]} differ`);
    return 1;
  }
  if (p.f.has('u')) {
    c.out(`--- ${p.rest[0]}`);
    c.out(`+++ ${p.rest[1]}`);
    c.out(`@@ -1,${a.length} +1,${b.length} @@`, 'dim');
    for (const o of ops) c.out(`${o.t}${o.l}`, o.t === '+' ? 'ok' : o.t === '-' ? 'err' : 'out');
    return 1;
  }
  let k = 0;
  while (k < ops.length) {
    if (ops[k].t === ' ') {
      k++;
      continue;
    }
    const start = k;
    while (k < ops.length && ops[k].t !== ' ') k++;
    const del = ops.slice(start, k).filter((o) => o.t === '-');
    const ins = ops.slice(start, k).filter((o) => o.t === '+');
    const ra = del.length ? (del.length > 1 ? `${del[0].i + 1},${del[del.length - 1].i + 1}` : `${del[0].i + 1}`) : `${ops[start].i}`;
    const rb = ins.length ? (ins.length > 1 ? `${ins[0].j + 1},${ins[ins.length - 1].j + 1}` : `${ins[0].j + 1}`) : `${ops[start].j}`;
    c.out(`${ra}${del.length && ins.length ? 'c' : del.length ? 'd' : 'a'}${rb}`, 'dim');
    for (const o of del) c.out(`< ${o.l}`, 'err');
    if (del.length && ins.length) c.out('---', 'dim');
    for (const o of ins) c.out(`> ${o.l}`, 'ok');
  }
  return 1;
}

// ---------------------------------------------------------------- stat, file, xxd, which, chown, tar

function stat(c: Ctx): number {
  if (!c.args.length) {
    c.err('stat: manca un operando');
    return 1;
  }
  for (const f of c.args) {
    const abs = c.sh.abs(f);
    const n = c.sh.fs.get(abs);
    if (!n || c.sh.blocked(abs)) {
      c.err(`stat: cannot statx '${f}': ${n ? 'Permission denied' : 'No such file or directory'}`);
      return 1;
    }
    const oct = n.perms.match(/.{3}/g)!.map((g) => (g[0] === 'r' ? 4 : 0) + (g[1] === 'w' ? 2 : 0) + (/[xs]/.test(g[2]) ? 1 : 0)).join('');
    c.out(`  File: ${f}`);
    c.out(`  Size: ${c.sh.fs.size(n)}\t\t${n.type === 'dir' ? 'directory' : 'regular file'}`);
    c.out(`Access: (0${oct}/${n.type === 'dir' ? 'd' : '-'}${n.perms})  Uid: (${n.owner})  Gid: (${n.group})`);
    c.out(`Modify: 2077-11-1${n.mtime.startsWith('Nov 12') ? 2 : 1} ${n.mtime.slice(7)}:00 +0100`);
    c.out(`Change: 2077-11-1${n.mtime.startsWith('Nov 12') ? 2 : 1} ${n.mtime.slice(7)}:00 +0100`);
  }
  return 0;
}

function file(c: Ctx): number {
  if (!c.args.length) {
    c.err('Usage: file FILE...');
    return 1;
  }
  let code = 0;
  for (const f of c.args) {
    const abs = c.sh.abs(f);
    const n = c.sh.fs.get(abs);
    if (!n || c.sh.blocked(abs)) {
      c.out(`${f}: cannot open \`${f}' (${n ? 'Permission denied' : 'No such file or directory'})`);
      code = 1;
      continue;
    }
    if (n.type === 'dir') c.out(`${f}: directory`);
    else {
      const t = n.content;
      let d = 'ASCII text';
      if (t === '') d = 'empty';
      else if (t.startsWith('\u007fELF')) d = 'ELF 64-bit LSB executable, x86-64';
      else if (t.startsWith('%PDF')) d = 'PDF document';
      else if (t.slice(0, 12).includes('JFIF')) d = 'JPEG image data, JFIF standard 1.01';
      else if (t.startsWith('MZ')) d = 'PE32 executable (GUI) Intel 80386, for MS Windows';
      else if (t.startsWith('DISKIMG')) d = 'DOS/MBR boot sector; partition 1 : ID=0x83 (Linux)';
      else if (t.startsWith('PK')) d = 'Zip archive data';
      else if (t.startsWith('TARSIM1')) d = 'POSIX tar archive (gzip compressed data)';
      else if (t.startsWith('#!')) d = `${t.includes('python') ? 'Python script' : 'Bourne-Again shell script'}, ASCII text executable`;
      else if (t.startsWith('-----BEGIN')) d = 'PEM certificate or key';
      else if (/^[A-Za-z0-9+/=\s]{40,}$/.test(t) && t.trim().length > 40) d = 'ASCII text, with very long lines (forse Base64)';
      else if (/[^\x00-\x7f]/.test(t)) d = 'UTF-8 Unicode text';
      c.out(`${f}: ${d}`);
    }
  }
  return code;
}

function xxd(c: Ctx): number {
  const text = readText(c, c.args.filter((a) => !a.startsWith('-')), 'xxd');
  if (text === null) return 1;
  const bytes = [...new TextEncoder().encode(text)];
  for (let off = 0; off < bytes.length; off += 16) {
    const chunk = bytes.slice(off, off + 16);
    const hex = chunk.map((b) => b.toString(16).padStart(2, '0')).reduce((acc, h, i) => acc + h + (i % 2 ? ' ' : ''), '');
    c.out(`${off.toString(16).padStart(8, '0')}: ${hex.padEnd(40)} ${chunk.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('')}`);
  }
  return 0;
}

function which(c: Ctx): number {
  let code = 0;
  const builtin = new Set(['cd', 'echo', 'pwd', 'alias', 'history', 'exit', 'test', 'true', 'false', 'help', 'clear']);
  for (const n of c.args) {
    if (builtin.has(n)) c.out(`${n}: shell built-in command`);
    else if (COMMANDS[n] && !['flag', 'hint', 'report', 'cheat'].includes(n)) c.out(`/usr/bin/${n}`);
    else code = 1;
  }
  return code;
}

function chown(c: Ctx): number {
  const [spec, ...files] = c.args.filter((a) => !a.startsWith('-'));
  if (!spec || !files.length) {
    c.err('chown: operando mancante');
    c.info('💡 Sintassi: chown UTENTE[:GRUPPO] FILE');
    return 1;
  }
  const [user, group] = spec.split(':');
  for (const f of files) {
    const abs = c.sh.abs(f);
    const n = c.sh.fs.get(abs);
    if (!n) {
      c.err(`chown: cannot access '${f}': No such file or directory`);
      return 1;
    }
    if (c.sh.user !== 'root') {
      c.err(`chown: changing ownership of '${f}': Operation not permitted`);
      c.info('💡 Solo root può cambiare il proprietario di un file (altrimenti si potrebbe "regalare" un file a un altro utente).');
      return 1;
    }
    if (user) n.owner = user;
    if (group) n.group = group;
  }
  return 0;
}

function tar(c: Ctx): number {
  const first = c.args[0] ?? '';
  const bundled = first && !first.startsWith('-') ? `-${first}` : first;
  const rest = first && !first.startsWith('-') ? c.args.slice(1) : c.args.slice(1);
  const opts = new Set(bundled.replace(/^-/, '').split(''));
  const args = [...rest];
  let archive = '';
  let dir = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-C') dir = args.splice(i, 2)[1] ?? '';
  }
  if (opts.has('f')) archive = args.shift() ?? '';
  if (!archive || !(opts.has('c') || opts.has('x') || opts.has('t'))) {
    c.err('tar: serve un\'azione e un file: tar -czf ARCHIVIO CARTELLA · tar -tzf ARCHIVIO · tar -xzf ARCHIVIO');
    return 2;
  }
  const abs = c.sh.abs(archive);
  const verbose = opts.has('v');
  if (opts.has('c')) {
    if (!args.length) {
      c.err('tar: Refusing to create an empty archive');
      return 2;
    }
    const entries: Record<string, { c: string; p: string; d: boolean }> = {};
    for (const src of args) {
      const list: [string, string][] = [];
      const node = c.sh.fs.get(c.sh.abs(src));
      if (!node || c.sh.blocked(c.sh.abs(src))) {
        c.err(`tar: ${src}: Cannot stat: ${node ? 'Permission denied' : 'No such file or directory'}`);
        return 2;
      }
      if (node.type === 'dir') entries[src.replace(/\/$/, '') + '/'] = { c: '', p: node.perms, d: true };
      collectFiles(c, c.sh.abs(src), src.replace(/\/$/, ''), list);
      for (const [fa, shown] of list) entries[shown] = { c: (c.sh.fs.get(fa) as { content: string }).content, p: c.sh.fs.get(fa)!.perms, d: false };
    }
    const e = c.sh.writeText(abs, 'TARSIM1\n' + JSON.stringify(entries), false);
    if (e) {
      c.err(`tar: ${archive}: Cannot open: ${e}`);
      return 2;
    }
    if (verbose) for (const k of Object.keys(entries)) c.out(k);
    c.emit({ type: 'fsop', op: 'touch', paths: [abs] });
    return 0;
  }
  const node = c.sh.fs.get(abs);
  if (!node || node.type !== 'file' || !node.content.startsWith('TARSIM1\n')) {
    c.err(`tar: ${archive}: ${node ? 'Not in gzip format' : 'Cannot open: No such file or directory'}`);
    return 2;
  }
  const entries = JSON.parse(node.content.slice(8)) as Record<string, { c: string; p: string; d: boolean }>;
  if (opts.has('t')) {
    for (const k of Object.keys(entries)) c.out(k);
    return 0;
  }
  for (const [k, v] of Object.entries(entries)) {
    const target = c.sh.abs(`${dir ? dir + '/' : ''}${k}`);
    if (v.d) c.sh.fs.mkdirp(target, { owner: c.sh.user, group: c.sh.user });
    else {
      const e = c.sh.writeText(target, v.c, false);
      if (e) {
        c.err(`tar: ${k}: Cannot open: ${e}`);
        return 2;
      }
      const w = c.sh.fs.get(target);
      if (w) w.perms = v.p;
    }
    if (verbose) c.out(k);
  }
  c.emit({ type: 'fsop', op: 'cp', paths: [abs, c.sh.abs(dir || '.')] });
  return 0;
}

function md5hint(c: Ctx): number {
  c.err('md5sum: usa sha256sum');
  c.info('💡 MD5 e SHA-1 sono considerati rotti per usi di sicurezza (collisioni note): per l\'integrità usa SHA-256.');
  void sha256;
  return 1;
}

Object.assign(COMMANDS, {
  ls,
  cat,
  head: (c: Ctx) => headTail(c, 'head'),
  tail: (c: Ctx) => headTail(c, 'tail'),
  wc,
  grep,
  sort,
  uniq,
  cut,
  find,
  tr,
  tee,
  xargs,
  diff,
  stat,
  file,
  xxd,
  which,
  chown,
  tar,
  md5sum: md5hint,
  sha1sum: md5hint,
});
