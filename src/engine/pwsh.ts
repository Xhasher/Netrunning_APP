// PowerShell simulato. La differenza con bash è una sola, ma enorme: tra un comando e
// l'altro nella pipeline passano OGGETTI con proprietà (Name, Id, Length...), non testo.
// Si filtra con Where-Object, si scelgono le colonne con Select-Object, si ordina, si conta.
//
// "pwsh" apre la console sul deck (come PowerShell su Linux); "Enter-PSSession" si collega
// a un PC Windows simulato, con processi, servizi, attività pianificate, utenti ed eventi.

import { COMMANDS, Shell, type RemoteSystem } from './shell';
import { sha256 } from './sha256';
import type { Line, LineClass, ShellEvent } from './types';
import type { VNode } from './vfs';

type Val = string | number | boolean | null;
export type PsObj = Record<string, Val> & { __cols?: never };
type Item = string | PsObj;

/** Dati "vivi" di un PC Windows simulato. */
export interface WinData {
  processes: { Name: string; Id: number; CPU: number; WS: number; Path: string; Parent: string; CommandLine: string; Company: string }[];
  services: { Name: string; DisplayName: string; Status: string; StartType: string }[];
  tasks: { TaskName: string; TaskPath: string; State: string; Author: string; Action: string; Trigger: string }[];
  conns: { LocalAddress: string; LocalPort: number; RemoteAddress: string; RemotePort: number; State: string; OwningProcess: number }[];
  users: { Name: string; Enabled: boolean; LastLogon: string; Description: string }[];
  groups: Record<string, { Name: string; ObjectClass: string; PrincipalSource: string }[]>;
  events: { TimeCreated: string; Id: number; LevelDisplayName: string; LogName: string; Message: string }[];
}

export interface WinSystem extends RemoteSystem {
  win: WinData;
}

/** Computer raggiungibili con Enter-PSSession (registrati dai contenuti). */
export const PS_COMPUTERS: Record<string, () => WinSystem> = {};
const REMOTES = new WeakMap<Shell, Record<string, WinSystem>>();

// ---------------------------------------------------------------- uscita

interface Out {
  lines: Line[];
  events: ShellEvent[];
}

const print = (o: Out, text: string, cls?: LineClass) => o.lines.push({ text, cls });
const perr = (o: Out, text: string) => o.lines.push({ text, cls: 'err' });

class PsError extends Error {}

// ---------------------------------------------------------------- percorsi

const isWin = (sh: Shell) => !!(sh.system as WinSystem | null)?.win;

function toAbs(sh: Shell, p: string): string {
  let q = p.replace(/\\/g, '/').replace(/^['"]|['"]$/g, '');
  if (isWin(sh)) q = q.replace(/^[a-z]:/i, '');
  else if (/^[a-z]:/i.test(q)) q = q.replace(/^[a-z]:/i, '');
  if (q === '~' || q.startsWith('~/')) q = sh.home + q.slice(1);
  if (!q.startsWith('/')) q = (sh.cwd === '/' ? '' : sh.cwd) + '/' + q;
  const parts: string[] = [];
  for (const s of q.split('/')) {
    if (!s || s === '.') continue;
    if (s === '..') parts.pop();
    else parts.push(s);
  }
  return '/' + parts.join('/');
}

export function psPath(sh: Shell, abs = sh.cwd): string {
  if (!isWin(sh)) return abs;
  return 'C:' + (abs === '/' ? '\\' : abs.replace(/\//g, '\\'));
}

// ---------------------------------------------------------------- tokenizer

interface Tok {
  t: string;
  /** 'str' tra virgolette, 'block' tra graffe, 'hash' @{...}, 'word' */
  k: 'word' | 'str' | 'block' | 'hash';
}

function splitPipeline(src: string): string[] {
  const out: string[] = [];
  let cur = '';
  let depth = 0;
  let q: string | null = null;
  for (const ch of src) {
    if (q) {
      cur += ch;
      if (ch === q) q = null;
      continue;
    }
    if (ch === '"' || ch === "'") q = ch;
    else if (ch === '{' || ch === '(') depth++;
    else if (ch === '}' || ch === ')') depth--;
    else if (ch === '|' && depth === 0) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (q || depth !== 0) throw new PsError('Missing closing quote or bracket in the expression.');
  out.push(cur.trim());
  return out;
}

function tokenize(seg: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < seg.length) {
    const ch = seg[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const j = seg.indexOf(ch, i + 1);
      if (j < 0) throw new PsError('The string is missing the terminator.');
      toks.push({ t: seg.slice(i + 1, j), k: 'str' });
      i = j + 1;
      continue;
    }
    if (ch === '{' || (ch === '@' && seg[i + 1] === '{')) {
      const start = ch === '@' ? i + 2 : i + 1;
      let d = 1;
      let j = start;
      let q: string | null = null;
      for (; j < seg.length && d > 0; j++) {
        const c = seg[j];
        if (q) {
          if (c === q) q = null;
        } else if (c === '"' || c === "'") q = c;
        else if (c === '{') d++;
        else if (c === '}') d--;
      }
      toks.push({ t: seg.slice(start, j - 1).trim(), k: ch === '@' ? 'hash' : 'block' });
      i = j;
      continue;
    }
    let j = i;
    while (j < seg.length && !/\s/.test(seg[j])) j++;
    toks.push({ t: seg.slice(i, j), k: 'word' });
    i = j;
  }
  return toks;
}

interface Args {
  named: Record<string, string>;
  switches: Set<string>;
  pos: Tok[];
}

/** Separa parametri nominati (-Nome valore), interruttori (-Recurse) e posizionali. */
function parseArgs(toks: Tok[], switches: string[]): Args {
  const a: Args = { named: {}, switches: new Set(), pos: [] };
  const sw = new Set(switches.map((s) => s.toLowerCase()));
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.k === 'word' && /^-[a-z]/i.test(t.t) && !/^-\d/.test(t.t)) {
      const name = t.t.slice(1).replace(/:$/, '').toLowerCase();
      if (sw.has(name)) a.switches.add(name);
      else {
        const v = toks[++i];
        a.named[name] = v ? (v.k === 'hash' ? '@{' + v.t + '}' : v.t) : '';
      }
    } else a.pos.push(t);
  }
  return a;
}

// ---------------------------------------------------------------- espressioni (Where-Object)

const getProp = (it: Item, name: string): Val => {
  if (typeof it === 'string') return name.toLowerCase() === 'length' ? it.length : null;
  const k = Object.keys(it).find((x) => x.toLowerCase() === name.toLowerCase());
  return k ? (it[k] as Val) : null;
};

function literal(s: string): Val {
  const t = s.trim();
  if (/^\$true$/i.test(t)) return true;
  if (/^\$false$/i.test(t)) return false;
  if (/^\$null$/i.test(t)) return null;
  const q = t.match(/^(['"])(.*)\1$/);
  if (q) return q[2];
  const n = t.match(/^(\d+(?:\.\d+)?)(kb|mb|gb)?$/i);
  if (n) return Number(n[1]) * (n[2] ? 1024 ** (['kb', 'mb', 'gb'].indexOf(n[2].toLowerCase()) + 1) : 1);
  return t;
}

const wildcard = (pat: string) => new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');

function compare(a: Val, op: string, b: Val): boolean {
  const num = typeof a === 'number' && !Number.isNaN(Number(b));
  const A = num ? a : String(a ?? '').toLowerCase();
  const B = num ? Number(b) : String(b ?? '').toLowerCase();
  switch (op) {
    case '-eq':
      return typeof a === 'boolean' ? a === b : A === B;
    case '-ne':
      return typeof a === 'boolean' ? a !== b : A !== B;
    case '-gt':
      return A > B;
    case '-lt':
      return A < B;
    case '-ge':
      return A >= B;
    case '-le':
      return A <= B;
    case '-like':
      return wildcard(String(b)).test(String(a ?? ''));
    case '-notlike':
      return !wildcard(String(b)).test(String(a ?? ''));
    case '-match':
      return new RegExp(String(b), 'i').test(String(a ?? ''));
    case '-notmatch':
      return !new RegExp(String(b), 'i').test(String(a ?? ''));
    case '-contains':
      return String(a ?? '').toLowerCase().split(/[,\s]+/).includes(String(b).toLowerCase());
  }
  throw new PsError(`Operatore non supportato: ${op}`);
}

/** Valuta { $_.Prop -op valore [-and|-or ...] } su un elemento. */
function evalBlock(block: string, it: Item): boolean {
  const parts = block.split(/\s+(-and|-or)\s+/i);
  let res = evalCond(parts[0], it);
  for (let i = 1; i < parts.length; i += 2) {
    const v = evalCond(parts[i + 1], it);
    res = parts[i].toLowerCase() === '-and' ? res && v : res || v;
  }
  return res;
}

function evalCond(src: string, it: Item): boolean {
  const s = src.trim().replace(/^\((.*)\)$/, '$1');
  const m = s.match(/^\$_(?:\.(\w+))?\s+(-[a-z]+)\s+(.+)$/i) ?? s.match(/^\$PSItem(?:\.(\w+))?\s+(-[a-z]+)\s+(.+)$/i);
  if (m) {
    const val = m[1] ? getProp(it, m[1]) : typeof it === 'string' ? it : JSON.stringify(it);
    return compare(val, m[2].toLowerCase(), literal(m[3]));
  }
  const b = s.match(/^(-not\s+|!)?\$_\.(\w+)$/i);
  if (b) return !!getProp(it, b[2]) !== !!b[1];
  throw new PsError(`Espressione non capita: { ${s} }. Esempio: { $_.Name -eq 'notepad' }`);
}

// ---------------------------------------------------------------- formattazione

const DEFAULT_COLS = Symbol('cols');
type Typed = PsObj & { [DEFAULT_COLS]?: string[] };

function obj(o: Record<string, Val>, cols?: string[]): PsObj {
  const x = { ...o } as Typed;
  if (cols) Object.defineProperty(x, DEFAULT_COLS, { value: cols, enumerable: false });
  return x as PsObj;
}

const colsOf = (o: PsObj) => (o as Typed)[DEFAULT_COLS] ?? Object.keys(o);
const show = (v: Val) => (v === null ? '' : typeof v === 'boolean' ? (v ? 'True' : 'False') : String(v));

function formatTable(o: Out, items: PsObj[], cols?: string[]): void {
  if (!items.length) return;
  const c = cols ?? colsOf(items[0]);
  const w = c.map((k) => Math.min(70, Math.max(k.length, ...items.map((it) => show(getProp(it, k)).length))));
  const numeric = c.map((k) => items.every((it) => typeof getProp(it, k) === 'number'));
  const cell = (s: string, i: number) => {
    const t = s.length > w[i] ? s.slice(0, w[i] - 1) + '…' : s;
    return numeric[i] ? t.padStart(w[i]) : t.padEnd(w[i]);
  };
  print(o, '');
  print(o, c.map((k, i) => cell(k, i)).join(' ').trimEnd(), 'dim');
  print(o, c.map((k, i) => cell('-'.repeat(k.length), i)).join(' ').trimEnd(), 'dim');
  for (const it of items) print(o, c.map((k, i) => cell(show(getProp(it, k)), i)).join(' ').trimEnd());
  print(o, '');
}

function formatList(o: Out, items: PsObj[], props?: string[]): void {
  for (const it of items) {
    const keys = props && !(props.length === 1 && props[0] === '*') ? props : Object.keys(it);
    const w = Math.max(...keys.map((k) => k.length));
    print(o, '');
    for (const k of keys) print(o, `${k.padEnd(w)} : ${show(getProp(it, k))}`);
  }
  print(o, '');
}

function render(o: Out, items: Item[]): void {
  const strs = items.filter((x): x is string => typeof x === 'string');
  if (strs.length === items.length) {
    for (const s of strs) print(o, s);
    return;
  }
  // gruppi di oggetti con le stesse colonne predefinite
  let batch: PsObj[] = [];
  const flush = () => {
    if (batch.length) formatTable(o, batch);
    batch = [];
  };
  for (const it of items) {
    if (typeof it === 'string') {
      flush();
      print(o, it);
    } else {
      if (batch.length && colsOf(batch[0]).join() !== colsOf(it).join()) flush();
      batch.push(it);
    }
  }
  flush();
}

// ---------------------------------------------------------------- cmdlet

interface Ctx {
  sh: Shell;
  o: Out;
  input: Item[];
  toks: Tok[];
  /** primo comando della pipeline? (serve a capire se c'è input) */
  first: boolean;
}

type Cmdlet = (c: Ctx) => Item[];

const winData = (sh: Shell): WinData | null => (sh.system as WinSystem | null)?.win ?? null;

function needWin(c: Ctx, name: string): WinData {
  const w = winData(c.sh);
  if (!w) throw new PsError(`${name}: questo cmdlet esiste solo su Windows. Il deck è un Linux: collegati a un PC Windows con Enter-PSSession -ComputerName NOME.`);
  return w;
}

function readFile(c: Ctx, p: string, cmd: string): { abs: string; node: VNode & { type: 'file' } } {
  const abs = toAbs(c.sh, p);
  const node = c.sh.fs.get(abs);
  if (!node || c.sh.blocked(abs)) throw new PsError(`${cmd}: Cannot find path '${psPath(c.sh, abs)}' because it does not exist.`);
  if (node.locked) throw new PsError(`${cmd}: Access to the path '${psPath(c.sh, abs)}' is denied.`);
  if (node.type !== 'file') throw new PsError(`${cmd}: '${psPath(c.sh, abs)}' è una cartella.`);
  c.o.events.push({ type: 'read', path: abs });
  return { abs, node: node as VNode & { type: 'file' } };
}

const hidden = (name: string) => name.startsWith('.') || name === 'AppData';

const CMDLETS: Record<string, Cmdlet> = {
  'get-childitem'(c) {
    const a = parseArgs(c.toks, ['recurse', 'force', 'file', 'directory']);
    const path = a.named.path ?? a.pos[0]?.t ?? '.';
    const filter = a.named.filter ? wildcard(a.named.filter) : null;
    const abs = toAbs(c.sh, path);
    const node = c.sh.fs.get(abs);
    if (!node || c.sh.blocked(abs)) throw new PsError(`Get-ChildItem: Cannot find path '${psPath(c.sh, abs)}' because it does not exist.`);
    const out: Item[] = [];
    const walk = (dir: VNode, dabs: string) => {
      if (dir.type !== 'dir') return;
      for (const [name, n] of [...dir.children].sort(([x], [y]) => x.localeCompare(y))) {
        if (hidden(name) && !a.switches.has('force')) continue;
        const full = `${dabs === '/' ? '' : dabs}/${name}`;
        const isDir = n.type === 'dir';
        if ((!filter || filter.test(name)) && !(a.switches.has('file') && isDir) && !(a.switches.has('directory') && !isDir))
          out.push(
            obj(
              {
                Mode: isDir ? 'd----' : hidden(name) ? '-a-h-' : '-a---',
                LastWriteTime: '13/11/2077 09:01',
                Length: isDir ? null : c.sh.fs.size(n),
                Name: name,
                FullName: psPath(c.sh, full),
                Directory: psPath(c.sh, dabs),
              },
              ['Mode', 'LastWriteTime', 'Length', 'Name'],
            ),
          );
        if (isDir && a.switches.has('recurse') && !n.locked) walk(n, full);
      }
    };
    if (node.type === 'file') out.push(obj({ Mode: '-a---', LastWriteTime: '13/11/2077 09:01', Length: c.sh.fs.size(node), Name: abs.split('/').pop()!, FullName: psPath(c.sh, abs), Directory: psPath(c.sh, abs.replace(/\/[^/]*$/, '') || '/') }, ['Mode', 'LastWriteTime', 'Length', 'Name']));
    else if (node.locked) throw new PsError(`Get-ChildItem: Access to the path '${psPath(c.sh, abs)}' is denied.`);
    else walk(node, abs);
    return out;
  },

  'get-content'(c) {
    const a = parseArgs(c.toks, []);
    const p = a.named.path ?? a.pos[0]?.t;
    if (!p) throw new PsError('Get-Content: manca il percorso del file (-Path).');
    const lines = readFile(c, p, 'Get-Content').node.content.replace(/\n$/, '').split('\n');
    const head = Number(a.named.totalcount ?? a.named.head ?? a.named.first ?? 0);
    const tail = Number(a.named.tail ?? a.named.last ?? 0);
    return head ? lines.slice(0, head) : tail ? lines.slice(-tail) : lines;
  },

  'select-string'(c) {
    const a = parseArgs(c.toks, ['simplematch', 'casesensitive', 'notmatch']);
    const pat = a.named.pattern ?? a.pos[0]?.t;
    if (!pat) throw new PsError('Select-String: manca -Pattern.');
    const path = a.named.path ?? (a.named.pattern ? a.pos[0]?.t : a.pos[1]?.t);
    const re = new RegExp(a.switches.has('simplematch') ? pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : pat, a.switches.has('casesensitive') ? '' : 'i');
    const out: Item[] = [];
    const test = (s: string) => re.test(s) !== a.switches.has('notmatch');
    if (path) {
      const { abs, node } = readFile(c, path, 'Select-String');
      node.content
        .replace(/\n$/, '')
        .split('\n')
        .forEach((l, i) => {
          if (test(l)) out.push(obj({ Path: psPath(c.sh, abs), LineNumber: i + 1, Line: l }, ['LineNumber', 'Line']));
        });
    } else for (const it of c.input) if (typeof it === 'string' ? test(it) : test(JSON.stringify(it))) out.push(it);
    return out;
  },

  'where-object'(c) {
    const a = c.toks;
    const block = a.find((t) => t.k === 'block');
    if (block) return c.input.filter((it) => evalBlock(block.t, it));
    // sintassi semplificata: Where-Object Prop -eq valore
    if (a.length >= 3) return c.input.filter((it) => compare(getProp(it, a[0].t), a[1].t.toLowerCase(), literal(a[2].k === 'str' ? `'${a[2].t}'` : a[2].t)));
    if (a.length === 1) return c.input.filter((it) => !!getProp(it, a[0].t));
    throw new PsError("Where-Object: scrivi la condizione tra graffe, es. Where-Object { $_.Id -gt 1000 }");
  },

  'select-object'(c) {
    const a = parseArgs(c.toks, ['unique']);
    let items = [...c.input];
    const first = Number(a.named.first ?? 0);
    const last = Number(a.named.last ?? 0);
    const expand = a.named.expandproperty;
    const props = (a.named.property ?? a.pos.map((t) => t.t).join(','))
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (a.switches.has('unique')) items = items.filter((x, i) => items.findIndex((y) => JSON.stringify(y) === JSON.stringify(x)) === i);
    if (first) items = items.slice(0, first);
    if (last) items = items.slice(-last);
    if (expand) return items.map((it) => show(getProp(it, expand)));
    if (props.length && !(props.length === 1 && props[0] === '*'))
      return items.map((it) =>
        obj(
          Object.fromEntries(props.map((p) => [Object.keys(typeof it === 'string' ? {} : it).find((k) => k.toLowerCase() === p.toLowerCase()) ?? p, getProp(it, p)])),
          undefined,
        ),
      );
    return items;
  },

  'sort-object'(c) {
    const a = parseArgs(c.toks, ['descending', 'unique']);
    const prop = a.named.property ?? a.pos[0]?.t;
    const items = [...c.input].sort((x, y) => {
      const A = prop ? getProp(x, prop) : (x as Val);
      const B = prop ? getProp(y, prop) : (y as Val);
      if (typeof A === 'number' && typeof B === 'number') return A - B;
      return show(A).localeCompare(show(B));
    });
    if (a.switches.has('descending')) items.reverse();
    return a.switches.has('unique') ? items.filter((x, i) => i === 0 || JSON.stringify(x) !== JSON.stringify(items[i - 1])) : items;
  },

  'group-object'(c) {
    const a = parseArgs(c.toks, ['noelement']);
    const prop = a.named.property ?? a.pos[0]?.t;
    if (!prop) throw new PsError('Group-Object: indica la proprietà, es. Group-Object Id');
    const groups = new Map<string, number>();
    for (const it of c.input) {
      const k = show(getProp(it, prop));
      groups.set(k, (groups.get(k) ?? 0) + 1);
    }
    return [...groups].map(([Name, Count]) => obj({ Count, Name }, ['Count', 'Name']));
  },

  'measure-object'(c) {
    const a = parseArgs(c.toks, ['sum', 'average', 'maximum', 'minimum', 'line']);
    const prop = a.named.property ?? a.pos[0]?.t;
    const r: Record<string, Val> = { Count: c.input.length };
    if (prop) {
      const nums = c.input.map((it) => Number(getProp(it, prop))).filter((n) => !Number.isNaN(n));
      if (a.switches.has('sum')) r.Sum = nums.reduce((s, n) => s + n, 0);
      if (a.switches.has('average')) r.Average = nums.length ? Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 100) / 100 : 0;
      if (a.switches.has('maximum')) r.Maximum = Math.max(...nums);
      if (a.switches.has('minimum')) r.Minimum = Math.min(...nums);
      r.Property = prop;
    }
    return [obj(r)];
  },

  'format-list'(c) {
    const a = parseArgs(c.toks, []);
    const props = (a.named.property ?? a.pos.map((t) => t.t).join(','))
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const objs = c.input.filter((x): x is PsObj => typeof x !== 'string');
    formatList(c.o, objs, props.length ? props : undefined);
    for (const s of c.input) if (typeof s === 'string') print(c.o, s);
    return [];
  },

  'format-table'(c) {
    const a = parseArgs(c.toks, ['autosize']);
    const props = (a.named.property ?? a.pos.map((t) => t.t).join(','))
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const objs = c.input.filter((x): x is PsObj => typeof x !== 'string');
    formatTable(c.o, objs, props.length ? props : undefined);
    return [];
  },

  'write-output'(c) {
    return c.toks.map((t) => t.t);
  },

  'get-location'(c) {
    return [obj({ Path: psPath(c.sh) })];
  },

  'set-location'(c) {
    const p = c.toks[0]?.t ?? '~';
    const abs = toAbs(c.sh, p);
    const n = c.sh.fs.get(abs);
    if (!n || n.type !== 'dir' || c.sh.blocked(abs)) throw new PsError(`Set-Location: Cannot find path '${psPath(c.sh, abs)}' because it does not exist.`);
    c.sh.cwd = abs;
    return [];
  },

  'clear-host'(c) {
    c.o.lines.length = 0;
    (c.o as Out & { clear?: boolean }).clear = true;
    return [];
  },

  'get-filehash'(c) {
    const a = parseArgs(c.toks, []);
    const p = a.named.path ?? a.pos[0]?.t;
    if (!p) throw new PsError('Get-FileHash: manca il percorso del file.');
    const alg = (a.named.algorithm ?? 'SHA256').toUpperCase();
    if (alg !== 'SHA256') throw new PsError(`Get-FileHash: nel deck è disponibile solo SHA256 (hai chiesto ${alg}).`);
    const { abs, node } = readFile(c, p, 'Get-FileHash');
    return [obj({ Algorithm: 'SHA256', Hash: sha256(node.content).toUpperCase(), Path: psPath(c.sh, abs) })];
  },

  'get-process'(c) {
    const a = parseArgs(c.toks, []);
    const name = a.named.name ?? a.pos[0]?.t;
    const id = a.named.id;
    const w = winData(c.sh);
    const list = w
      ? w.processes
      : [
          { Name: 'systemd', Id: 1, CPU: 1.2, WS: 12, Path: '/sbin/init', Parent: '', CommandLine: '/sbin/init', Company: '' },
          { Name: 'cron', Id: 402, CPU: 0.1, WS: 4, Path: '/usr/sbin/cron', Parent: 'systemd', CommandLine: '/usr/sbin/cron -f', Company: '' },
          { Name: 'sshd', Id: 455, CPU: 0.3, WS: 9, Path: '/usr/sbin/sshd', Parent: 'systemd', CommandLine: 'sshd: /usr/sbin/sshd -D', Company: '' },
          { Name: 'pwsh', Id: 1500, CPU: 2.4, WS: 96, Path: '/opt/microsoft/powershell/7/pwsh', Parent: 'bash', CommandLine: 'pwsh', Company: 'Microsoft Corporation' },
        ];
    const sel = list.filter((p) => (!name || wildcard(name).test(p.Name)) && (!id || p.Id === Number(id)));
    if ((name || id) && !sel.length) throw new PsError(`Get-Process: Cannot find a process with the ${id ? 'process identifier ' + id : 'name "' + name + '"'}.`);
    return sel.map((p) => obj({ ...p }, ['Id', 'Name', 'CPU', 'WS']));
  },

  'stop-process'(c) {
    const w = needWin(c, 'Stop-Process');
    const a = parseArgs(c.toks, ['force']);
    const id = Number(a.named.id ?? (c.input[0] && typeof c.input[0] !== 'string' ? getProp(c.input[0], 'Id') : NaN));
    const i = w.processes.findIndex((p) => p.Id === id);
    if (i < 0) throw new PsError(`Stop-Process: Cannot find a process with the process identifier ${a.named.id ?? '?'}.`);
    const [p] = w.processes.splice(i, 1);
    w.conns = w.conns.filter((x) => x.OwningProcess !== id);
    c.o.events.push({ type: 'command', name: 'ps:stop-process', args: [String(id), p.Name], ok: true });
    return [];
  },

  'get-service'(c) {
    const w = needWin(c, 'Get-Service');
    const a = parseArgs(c.toks, []);
    const name = a.named.name ?? a.pos[0]?.t;
    return w.services.filter((s) => !name || wildcard(name).test(s.Name)).map((s) => obj({ ...s }, ['Status', 'Name', 'DisplayName']));
  },

  'get-scheduledtask'(c) {
    const w = needWin(c, 'Get-ScheduledTask');
    const a = parseArgs(c.toks, []);
    const name = a.named.taskname ?? a.pos[0]?.t;
    const sel = w.tasks.filter((t) => !name || wildcard(name).test(t.TaskName));
    if (name && !sel.length) throw new PsError(`Get-ScheduledTask: No MSFT_ScheduledTask objects found with property 'TaskName' equal to '${name}'.`);
    return sel.map((t) => obj({ ...t }, ['TaskPath', 'TaskName', 'State']));
  },

  'disable-scheduledtask'(c) {
    const w = needWin(c, 'Disable-ScheduledTask');
    const a = parseArgs(c.toks, []);
    const name = a.named.taskname ?? a.pos[0]?.t ?? (c.input[0] && typeof c.input[0] !== 'string' ? String(getProp(c.input[0], 'TaskName')) : '');
    const t = w.tasks.find((x) => x.TaskName.toLowerCase() === name.toLowerCase());
    if (!t) throw new PsError(`Disable-ScheduledTask: The system cannot find the file specified. (${name})`);
    t.State = 'Disabled';
    c.o.events.push({ type: 'command', name: 'ps:disable-scheduledtask', args: [t.TaskName], ok: true });
    return [obj({ TaskPath: t.TaskPath, TaskName: t.TaskName, State: t.State }, ['TaskPath', 'TaskName', 'State'])];
  },

  'get-nettcpconnection'(c) {
    const w = needWin(c, 'Get-NetTCPConnection');
    const a = parseArgs(c.toks, []);
    return w.conns
      .filter((x) => (!a.named.state || x.State.toLowerCase() === a.named.state.toLowerCase()) && (!a.named.owningprocess || x.OwningProcess === Number(a.named.owningprocess)))
      .map((x) => obj({ ...x }, ['LocalAddress', 'LocalPort', 'RemoteAddress', 'RemotePort', 'State', 'OwningProcess']));
  },

  'get-localuser'(c) {
    const w = needWin(c, 'Get-LocalUser');
    return w.users.map((u) => obj({ ...u }, ['Name', 'Enabled', 'Description']));
  },

  'disable-localuser'(c) {
    const w = needWin(c, 'Disable-LocalUser');
    const a = parseArgs(c.toks, []);
    const name = a.named.name ?? a.pos[0]?.t ?? '';
    const u = w.users.find((x) => x.Name.toLowerCase() === name.toLowerCase());
    if (!u) throw new PsError(`Disable-LocalUser: User ${name} was not found.`);
    u.Enabled = false;
    c.o.events.push({ type: 'command', name: 'ps:disable-localuser', args: [u.Name], ok: true });
    return [];
  },

  'get-localgroupmember'(c) {
    const w = needWin(c, 'Get-LocalGroupMember');
    const a = parseArgs(c.toks, []);
    const g = a.named.group ?? a.named.name ?? a.pos[0]?.t ?? '';
    const key = Object.keys(w.groups).find((k) => k.toLowerCase() === g.toLowerCase());
    if (!key) throw new PsError(`Get-LocalGroupMember: Group ${g} was not found.`);
    return w.groups[key].map((m) => obj({ ...m }, ['ObjectClass', 'Name', 'PrincipalSource']));
  },

  'get-winevent'(c) {
    const w = needWin(c, 'Get-WinEvent');
    const a = parseArgs(c.toks, []);
    let log = a.named.logname ?? a.pos[0]?.t ?? '';
    let ids: number[] = [];
    const fh = a.named.filterhashtable;
    if (fh) {
      const body = fh.replace(/^@\{|\}$/g, '');
      for (const part of body.split(';')) {
        const [k, v] = part.split('=').map((x) => x?.trim());
        if (!k || v === undefined) continue;
        if (/^logname$/i.test(k)) log = v.replace(/['"]/g, '');
        if (/^id$/i.test(k)) ids = v.split(',').map((x) => Number(x.trim()));
      }
    }
    if (!log) throw new PsError("Get-WinEvent: indica il registro, es. -LogName Security oppure -FilterHashtable @{LogName='Security'; Id=4625}");
    let ev = w.events.filter((e) => e.LogName.toLowerCase() === log.toLowerCase() && (!ids.length || ids.includes(e.Id)));
    if (!ev.length) throw new PsError('Get-WinEvent: No events were found that match the specified selection criteria.');
    ev = [...ev].reverse(); // dal più recente, come il vero Get-WinEvent
    const max = Number(a.named.maxevents ?? 0);
    if (max) ev = ev.slice(0, max);
    return ev.map((e) => obj({ ...e }, ['TimeCreated', 'Id', 'LevelDisplayName', 'Message']));
  },

  'enter-pssession'(c) {
    const a = parseArgs(c.toks, []);
    const name = (a.named.computername ?? a.pos[0]?.t ?? '').toUpperCase();
    if (winData(c.sh)) throw new PsError('Enter-PSSession: sei già in una sessione remota. Esci con Exit-PSSession.');
    const mk = PS_COMPUTERS[name];
    if (!mk) throw new PsError(`Enter-PSSession: Connecting to remote server ${name || '?'} failed: WinRM cannot complete the operation. Verify that the specified computer name is valid.`);
    // lo stesso PC per tutta la sessione del deck: le azioni fatte restano
    const cache = REMOTES.get(c.sh) ?? {};
    REMOTES.set(c.sh, cache);
    const sys = (cache[name] ??= mk());
    c.sh.connect(sys, sys.users[0]);
    c.o.events.push({ type: 'command', name: 'ps:enter-pssession', args: [name], ok: true });
    return [];
  },

  'exit-pssession'(c) {
    if (!winData(c.sh)) return [];
    const host = c.sh.disconnect();
    c.o.events.push({ type: 'command', name: 'ps:exit-pssession', args: [host ?? ''], ok: true });
    return [];
  },

  'get-command'() {
    return Object.keys(CMDLETS)
      .map((k) => NICE[k] ?? k)
      .sort()
      .map((n) => obj({ CommandType: 'Cmdlet', Name: n }, ['CommandType', 'Name']));
  },

  'get-help'(c) {
    const n = (c.toks[0]?.t ?? '').toLowerCase();
    const k = ALIAS[n] ?? n;
    if (!HELP[k]) return ['Get-Help NOME-CMDLET mostra una spiegazione breve. Get-Command elenca i cmdlet disponibili. La scheda completa è nel Manuale: man pwsh.'];
    return [`${NICE[k]}: ${HELP[k]}`];
  },
};

const NICE: Record<string, string> = Object.fromEntries(
  Object.keys(CMDLETS).map((k) => [
    k,
    k
      .split('-')
      .map((p) => p.replace(/^./, (x) => x.toUpperCase()))
      .join('-')
      .replace('Childitem', 'ChildItem')
      .replace('Filehash', 'FileHash')
      .replace('Scheduledtask', 'ScheduledTask')
      .replace('Nettcpconnection', 'NetTCPConnection')
      .replace('Localuser', 'LocalUser')
      .replace('Localgroupmember', 'LocalGroupMember')
      .replace('Winevent', 'WinEvent')
      .replace('Pssession', 'PSSession'),
  ]),
);

const HELP: Record<string, string> = {
  'get-childitem': 'elenca file e cartelle (alias ls, dir, gci). -Recurse, -Filter *.txt, -Force per i nascosti.',
  'get-content': 'legge un file riga per riga (alias cat, gc). -Tail N, -TotalCount N.',
  'select-string': 'cerca un testo o un\'espressione regolare (alias sls): il grep di PowerShell.',
  'where-object': 'filtra gli oggetti: Where-Object { $_.Proprietà -eq valore } (alias ?, where).',
  'select-object': 'sceglie proprietà o elementi: -Property A,B, -First N, -ExpandProperty A (alias select).',
  'sort-object': 'ordina per una proprietà; -Descending dal più grande (alias sort).',
  'group-object': 'raggruppa e conta per una proprietà (alias group).',
  'measure-object': 'conta (Count), e con -Property X -Sum/-Average/-Maximum fa i calcoli (alias measure).',
  'format-list': 'mostra ogni oggetto come elenco "Nome : valore"; Format-List * mostra tutto (alias fl).',
  'get-process': 'i processi in esecuzione, con Id, CPU, memoria, percorso (alias ps, gps).',
  'get-service': 'i servizi di Windows e il loro stato (alias gsv).',
  'get-scheduledtask': 'le attività pianificate di Windows: uno dei posti preferiti per la persistenza.',
  'get-nettcpconnection': 'le connessioni di rete TCP, con il processo che le possiede: il netstat di PowerShell.',
  'get-localuser': 'gli account locali del PC.',
  'get-localgroupmember': 'i membri di un gruppo locale, es. -Group Administrators.',
  'get-winevent': 'legge il Registro eventi: -FilterHashtable @{LogName=\'Security\'; Id=4625}.',
  'get-filehash': 'calcola l\'impronta SHA256 di un file.',
  'enter-pssession': 'apre una sessione PowerShell su un altro computer (WinRM).',
  'exit-pssession': 'chiude la sessione remota.',
  'stop-process': 'termina un processo: Stop-Process -Id N.',
  'disable-scheduledtask': 'disattiva un\'attività pianificata senza cancellarla (le prove restano).',
  'disable-localuser': 'disattiva un account locale.',
};

const ALIAS: Record<string, string> = {
  ls: 'get-childitem',
  dir: 'get-childitem',
  gci: 'get-childitem',
  cat: 'get-content',
  gc: 'get-content',
  type: 'get-content',
  sls: 'select-string',
  '?': 'where-object',
  where: 'where-object',
  select: 'select-object',
  sort: 'sort-object',
  group: 'group-object',
  measure: 'measure-object',
  fl: 'format-list',
  ft: 'format-table',
  echo: 'write-output',
  write: 'write-output',
  pwd: 'get-location',
  gl: 'get-location',
  cd: 'set-location',
  sl: 'set-location',
  cls: 'clear-host',
  clear: 'clear-host',
  ps: 'get-process',
  gps: 'get-process',
  gsv: 'get-service',
  kill: 'stop-process',
  help: 'get-help',
  man: 'get-help',
  gcm: 'get-command',
  etsn: 'enter-pssession',
  exsn: 'exit-pssession',
};

// ---------------------------------------------------------------- esecuzione

/** Esegue una riga di PowerShell. Restituisce false se la riga chiede di uscire da pwsh. */
export function runPs(sh: Shell, line: string, o: Out): boolean {
  const t = line.trim();
  if (/^exit$/i.test(t)) {
    if (winData(sh)) {
      const host = sh.disconnect();
      o.events.push({ type: 'command', name: 'ps:exit-pssession', args: [host ?? ''], ok: true });
      return true;
    }
    return false;
  }
  let items: Item[] = [];
  try {
    const segs = splitPipeline(t);
    segs.forEach((seg, i) => {
      const toks = tokenize(seg);
      if (!toks.length) throw new PsError('An empty pipe element is not allowed.');
      const word = toks[0].t.toLowerCase();
      const name = ALIAS[word] ?? word;
      const fn = CMDLETS[name];
      if (!fn) {
        // un comando di Linux dentro PowerShell (su Linux pwsh li trova davvero)
        // i comandi del gioco (flag, hint, report...) valgono ovunque; quelli di Linux solo sul deck
        const GAME = ['flag', 'risposta', 'hint', 'suggerimento', 'report', 'cheat'];
        if (COMMANDS[word] && i === 0 && segs.length === 1 && (GAME.includes(word) || !winData(sh))) {
          const r = sh.runBash(t);
          o.lines.push(...r.lines);
          o.events.push(...r.events);
          items = [];
          return;
        }
        throw new PsError(`${toks[0].t}: The term '${toks[0].t}' is not recognized as a name of a cmdlet, function, script file, or executable program.`);
      }
      items = fn({ sh, o, input: items, toks: toks.slice(1), first: i === 0 });
      o.events.push({ type: 'command', name: `ps:${name}`, args: toks.slice(1).map((x) => x.t), ok: true });
    });
    render(o, items);
  } catch (e) {
    if (!(e instanceof PsError) && !(e instanceof SyntaxError)) throw e;
    perr(o, e.message);
    if (/not recognized/.test(e.message)) o.lines.push({ text: '💡 Get-Command elenca i cmdlet disponibili; Get-Help NOME ne spiega uno.', cls: 'info' });
  }
  return true;
}

/** Il prompt di PowerShell: "PS C:\Users\x>" o, in una sessione remota, "[PC]: PS C:\...>". */
export function psPrompt(sh: Shell): string {
  const remote = winData(sh) ? `[${sh.host}]: ` : '';
  return `${remote}PS ${psPath(sh)}>`;
}

Object.assign(COMMANDS, {
  pwsh(c: { sh: Shell; args: string[]; out: (t: string, cls?: LineClass) => void; err: (t: string) => void; info: (t: string) => void; emit: (e: ShellEvent) => void }) {
    const i = c.args.findIndex((a) => /^-c(ommand)?$/i.test(a));
    if (i >= 0) {
      const o: Out = { lines: [], events: [] };
      runPs(c.sh, c.args.slice(i + 1).join(' '), o);
      for (const l of o.lines) l.cls === 'err' ? c.err(l.text) : l.cls === 'info' ? c.info(l.text) : c.out(l.text, l.cls);
      o.events.forEach((e) => c.emit(e));
      return o.lines.some((l) => l.cls === 'err') ? 1 : 0;
    }
    c.sh.ps = true;
    c.out('PowerShell 7.4.6');
    c.out(''); 
    c.info('Sei in PowerShell: i comandi si chiamano Verbo-Nome (Get-ChildItem, Get-Content...) e nella pipeline passano oggetti. "exit" per tornare a bash.');
    c.emit({ type: 'command', name: 'pwsh-start', args: [], ok: true });
    return 0;
  },
});
(COMMANDS as Record<string, unknown>).powershell = COMMANDS.pwsh;

Shell.psHook = runPs;
