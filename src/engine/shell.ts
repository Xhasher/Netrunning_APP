// Una shell finta che imita bash. Interpreta la riga, esegue i comandi sul
// filesystem virtuale e sulla rete simulata, ed emette eventi per le missioni.

import { ALIASES, MANPAGES } from './manpages';
import { displayName, hostsInRange, isIp, lookup, type Host, type Network } from './network';
import type { Line, LineClass, RunResult, ShellEvent } from './types';
import { base64Decode, base64Encode, sha256 } from './sha256';
import type { DirNode, Vfs, VNode } from './vfs';

type Stream = 'out' | 'err';
interface OutLine extends Line {
  stream: Stream;
}

interface Ctx {
  sh: Shell;
  name: string;
  args: string[];
  stdin: string | null;
  out(text: string, cls?: LineClass, delay?: number): void;
  err(text: string): void;
  info(text: string): void;
  emit(ev: ShellEvent): void;
  clear(): void;
  raw(l: Line, stream: Stream): void;
  depth: number;
  sink: Sink;
}

type Command = (c: Ctx) => number;

/** Un server remoto simulato. */
export interface RemoteSystem {
  hostname: string;
  fs: Vfs;
  /** utenti con cui il consulente può collegarsi (accesso concesso dal cliente) */
  users: string[];
  banner?: string[];
}

export interface ShellOptions {
  user: string;
  host: string;
  fs: Vfs;
  net: Network;
  /** fornisce il suggerimento della missione attuale */
  hint?: () => string | null;
}

const WELL_KNOWN: Record<number, string> = {
  21: 'ftp',
  22: 'ssh',
  23: 'telnet',
  25: 'smtp',
  53: 'domain',
  80: 'http',
  110: 'pop3',
  139: 'netbios-ssn',
  143: 'imap',
  443: 'https',
  445: 'microsoft-ds',
  3306: 'mysql',
  3389: 'ms-wbt-server',
  8080: 'http-proxy',
};

const NMAP_HEADER = 'Starting Nmap 7.95 ( https://nmap.org ) at 2077-11-11 21:04 CET';

// ---------------------------------------------------------------- tokenizer

type Op = '|' | '>' | '>>' | '2>';
type Token = { t: string; op?: Op; glob?: boolean };

/** Espansione delle variabili ($NOME, ${NOME}, $1, $?) e della sostituzione di comando $(...). */
export interface Expander {
  get(name: string): string;
  sub(cmd: string): string;
}

function matchParen(s: string, open: number): number {
  let depth = 0;
  let q: string | null = null;
  for (let i = open; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      if (ch === q) q = null;
      continue;
    }
    if (ch === '"' || ch === "'") q = ch;
    else if (ch === '(') depth++;
    else if (ch === ')' && --depth === 0) return i;
  }
  return -1;
}

function tokenize(line: string, ex?: Expander): Token[] | { error: string } {
  const tokens: Token[] = [];
  let cur = '';
  let has = false;
  let glob = false;
  let quote: '"' | "'" | null = null;
  const push = () => {
    if (has) tokens.push(glob ? { t: cur, glob: true } : { t: cur });
    cur = '';
    has = false;
    glob = false;
  };
  const expand = (i: number): [string, number] | null => {
    if (!ex) return null;
    const next = line[i + 1];
    if (next === '(') {
      const end = matchParen(line, i + 1);
      if (end < 0) return null;
      return [ex.sub(line.slice(i + 2, end)), end];
    }
    if (next === '{') {
      const end = line.indexOf('}', i);
      if (end < 0) return null;
      return [ex.get(line.slice(i + 2, end)), end];
    }
    const m = line.slice(i + 1).match(/^([A-Za-z_]\w*|[0-9?#])/);
    if (!m) return null;
    return [ex.get(m[1]), i + m[1].length];
  };
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === '\\' && quote === '"' && i + 1 < line.length) cur += line[++i];
      else if (ch === '$' && quote === '"') {
        const r = expand(i);
        if (r) {
          cur += r[0];
          i = r[1];
        } else cur += ch;
      } else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      has = true;
    } else if (ch === '\\' && i + 1 < line.length) {
      cur += line[++i];
      has = true;
    } else if (ch === '$') {
      const r = expand(i);
      if (!r) {
        cur += ch;
        has = true;
        continue;
      }
      i = r[1];
      // senza virgolette il valore viene diviso sugli spazi, come in bash
      const parts = r[0].split(/\s+/);
      parts.forEach((part, k) => {
        if (k > 0) push();
        if (part) {
          cur += part;
          has = true;
        }
      });
    } else if (ch === ' ' || ch === '\t') {
      push();
    } else if (ch === '|') {
      push();
      tokens.push({ t: '|', op: '|' });
    } else if (ch === '>') {
      const append = line[i + 1] === '>';
      if (cur === '2' && has) {
        cur = '';
        has = false;
        tokens.push({ t: '2>', op: '2>' });
      } else {
        push();
        tokens.push(append ? { t: '>>', op: '>>' } : { t: '>', op: '>' });
      }
      if (append) i++;
    } else {
      if (ch === '*' || ch === '?') glob = true;
      cur += ch;
      has = true;
    }
  }
  if (quote) return { error: `bash: unexpected EOF while looking for matching \`${quote}'` };
  push();
  return tokens;
}

// ---------------------------------------------------------------- parser di script

type Joint = ';' | '&&' | '||';
interface Stmt {
  text: string;
  op: Joint;
}
type Node =
  | { k: 'cmd'; text: string; op: Joint }
  | { k: 'for'; v: string; list: string; body: Node[]; op: Joint }
  | { k: 'if'; cond: string; then: Node[]; else: Node[]; op: Joint };

/** Divide il testo in istruzioni su ; && || e a capo, ignorando i commenti #. */
function splitStatements(src: string): Stmt[] {
  const out: Stmt[] = [];
  let cur = '';
  let op: Joint = ';';
  let q: string | null = null;
  let depth = 0;
  const flush = (next: Joint) => {
    if (cur.trim()) out.push({ text: cur.trim(), op });
    cur = '';
    op = next;
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === q) q = null;
      cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      q = ch;
      cur += ch;
    } else if (ch === '$' && src[i + 1] === '(') {
      depth++;
      cur += '$(';
      i++;
    } else if (ch === ')' && depth > 0) {
      depth--;
      cur += ch;
    } else if (depth > 0) cur += ch;
    else if (ch === '#' && (i === 0 || /\s/.test(src[i - 1]))) {
      while (i < src.length && src[i] !== '\n') i++;
      flush(';');
    } else if (ch === '\n' || ch === ';') flush(';');
    else if (ch === '&' && src[i + 1] === '&') {
      flush('&&');
      i++;
    } else if (ch === '|' && src[i + 1] === '|') {
      flush('||');
      i++;
    } else cur += ch;
  }
  flush(';');
  return out;
}

class ParseError extends Error {}

function parseScript(src: string): Node[] {
  const stmts = splitStatements(src);
  let i = 0;
  const first = (s: Stmt) => s.text.split(/\s+/)[0];
  /** consuma la parola chiave kw all'inizio dell'istruzione corrente */
  const expect = (kw: string) => {
    const s = stmts[i];
    if (!s || first(s) !== kw) throw new ParseError(`bash: syntax error: manca "${kw}"`);
    const rest = s.text.slice(kw.length).trim();
    if (rest) stmts[i] = { text: rest, op: ';' };
    else i++;
  };
  const block = (ends: string[]): Node[] => {
    const nodes: Node[] = [];
    while (i < stmts.length) {
      const s = stmts[i];
      const w = first(s);
      if (ends.includes(w)) return nodes;
      if (['done', 'fi', 'else', 'then', 'do'].includes(w))
        throw new ParseError(`bash: syntax error near unexpected token \`${w}'`);
      if (w === 'for') {
        const m = s.text.match(/^for\s+([A-Za-z_]\w*)\s+in\s*(.*)$/);
        if (!m) throw new ParseError('bash: syntax error: usa "for NOME in VALORI; do ...; done"');
        i++;
        expect('do');
        const body = block(['done']);
        expect('done');
        nodes.push({ k: 'for', v: m[1], list: m[2], body, op: s.op });
      } else if (w === 'if') {
        const cond = s.text.slice(2).trim();
        i++;
        expect('then');
        const then = block(['else', 'fi']);
        let els: Node[] = [];
        if (stmts[i] && first(stmts[i]) === 'else') {
          expect('else');
          els = block(['fi']);
        }
        expect('fi');
        nodes.push({ k: 'if', cond, then, else: els, op: s.op });
      } else {
        nodes.push({ k: 'cmd', text: s.text, op: s.op });
        i++;
      }
    }
    if (ends.length) throw new ParseError(`bash: syntax error: manca "${ends[ends.length - 1]}"`);
    return nodes;
  };
  return block([]);
}

/** Destinazione dell'output durante l'esecuzione. */
interface Sink {
  lines: Line[];
  events: ShellEvent[];
  /** se presente, lo stdout finale viene raccolto qui invece di essere mostrato */
  capture?: Line[];
  clear?: boolean;
}

function globToRegex(pat: string): RegExp {
  const rx = pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${rx}$`);
}

/** Separa le opzioni brevi (-la → l, a) dagli argomenti. */
function splitShortFlags(args: string[]): { flags: Set<string>; rest: string[] } {
  const flags = new Set<string>();
  const rest: string[] = [];
  for (const a of args) {
    if (a.length > 1 && a.startsWith('-') && !a.startsWith('--')) for (const f of a.slice(1)) flags.add(f);
    else rest.push(a);
  }
  return { flags, rest };
}

function levenshtein(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

function dirnameOf(p: string): string {
  const i = p.lastIndexOf('/');
  return i <= 0 ? '/' : p.slice(0, i);
}

function splitLines(s: string): string[] {
  const lines = s.split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

// ---------------------------------------------------------------- shell

export class Shell {
  user: string;
  host: string;
  home: string;
  cwd: string;
  oldPwd: string;
  fs: Vfs;
  net: Network;
  history: string[] = [];
  /** IP bloccati dal firewall (ufw) */
  firewall: string[] = [];
  /** gruppi dell'utente */
  groups: string[] = ['users'];
  hint?: () => string | null;

  constructor(o: ShellOptions) {
    this.user = o.user;
    this.host = o.host;
    this.home = `/home/${o.user}`;
    this.cwd = this.home;
    this.oldPwd = this.home;
    this.fs = o.fs;
    this.net = o.net;
    this.hint = o.hint;
  }

  /** Percorso da mostrare nel prompt (~ al posto della home). */
  promptPath(): string {
    if (this.cwd === this.home) return '~';
    if (this.cwd.startsWith(this.home + '/')) return '~' + this.cwd.slice(this.home.length);
    return this.cwd;
  }

  promptText(): string {
    return `${this.user}@${this.host}:${this.promptPath()}$`;
  }

  abs(p: string): string {
    return this.fs.resolve(this.cwd, this.home, p);
  }

  commandNames(): string[] {
    return Object.keys(COMMANDS).sort();
  }

  vars: Record<string, string> = {};
  private steps = 0;
  /** server remoti raggiungibili con ssh, per indirizzo IP */
  remotes = new Map<string, RemoteSystem>();
  /** sessioni aperte: la shell locale resta "sotto" quelle remote */
  private sessions: { fs: Vfs; user: string; host: string; home: string; cwd: string; oldPwd: string }[] = [];

  get remoteDepth(): number {
    return this.sessions.length;
  }

  connect(r: RemoteSystem, user: string): void {
    this.sessions.push({ fs: this.fs, user: this.user, host: this.host, home: this.home, cwd: this.cwd, oldPwd: this.oldPwd });
    this.fs = r.fs;
    this.user = user;
    this.host = r.hostname;
    this.home = user === 'root' ? '/root' : `/home/${user}`;
    this.cwd = r.fs.get(this.home) ? this.home : '/';
    this.oldPwd = this.cwd;
  }

  disconnect(): string | null {
    const prev = this.sessions.pop();
    if (!prev) return null;
    const host = this.host;
    Object.assign(this, prev);
    return host;
  }

  getVar(name: string): string {
    switch (name) {
      case 'HOME':
        return this.home;
      case 'USER':
        return this.user;
      case 'PWD':
        return this.cwd;
      case 'HOSTNAME':
        return this.host;
      case 'SHELL':
        return '/bin/bash';
      case 'PATH':
        return '/usr/local/bin:/usr/bin:/bin';
    }
    return this.vars[name] ?? '';
  }

  run(input: string): RunResult {
    const line = input.trim();
    const result: RunResult = { lines: [], events: [] };
    if (!line) return result;
    this.history.push(line);
    this.steps = 0;
    const sink: Sink = { lines: result.lines, events: result.events };
    this.execText(line, sink, 0);
    if (sink.clear) result.clear = true;
    return result;
  }

  /** Esegue un testo che può contenere più istruzioni, cicli e condizioni. */
  execText(src: string, sink: Sink, depth: number): number {
    let nodes: Node[];
    try {
      nodes = parseScript(src);
    } catch (e) {
      if (!(e instanceof ParseError)) throw e;
      sink.lines.push({ text: e.message, cls: 'err' });
      this.vars['?'] = '2';
      return 2;
    }
    return this.execNodes(nodes, sink, depth);
  }

  private execNodes(nodes: Node[], sink: Sink, depth: number): number {
    let code = Number(this.vars['?'] ?? 0);
    for (const n of nodes) {
      if (n.op === '&&' && code !== 0) continue;
      if (n.op === '||' && code === 0) continue;
      if (++this.steps > 2000) {
        sink.lines.push({ text: 'bash: interrotto: troppi comandi (ciclo infinito?)', cls: 'err' });
        return 1;
      }
      if (n.k === 'cmd') code = this.execPipeline(n.text, sink, depth);
      else if (n.k === 'for') {
        const toks = this.expandGlobs(tokenize(n.list, this.expander(sink, depth)));
        if ('error' in toks) {
          sink.lines.push({ text: toks.error, cls: 'err' });
          return 2;
        }
        code = 0;
        sink.events.push({ type: 'command', name: 'for', args: [n.v, ...toks.map((t) => t.t)], ok: true });
        for (const t of toks) {
          this.vars[n.v] = t.t;
          code = this.execNodes(n.body, sink, depth);
        }
      } else {
        const c = this.execPipeline(n.cond, sink, depth);
        sink.events.push({ type: 'command', name: 'if', args: [n.cond], ok: true });
        code = this.execNodes(c === 0 ? n.then : n.else, sink, depth);
      }
      this.vars['?'] = String(code);
    }
    return code;
  }

  private expander(sink: Sink, depth: number): Expander {
    return {
      get: (name) => this.getVar(name),
      sub: (cmd) => {
        if (depth > 8) return '';
        const inner: Sink = { lines: [], events: sink.events, capture: [] };
        this.execText(cmd, inner, depth + 1);
        sink.lines.push(...inner.lines);
        return inner.capture!.map((l) => l.text).join('\n').replace(/\n+$/, '');
      },
    };
  }

  /** Sostituisce i modelli come *.txt con i file corrispondenti. */
  private expandGlobs<T extends Token[] | { error: string }>(toks: T): T {
    if ('error' in toks) return toks;
    const out: Token[] = [];
    for (const t of toks as Token[]) {
      if (!t.glob || t.op) {
        out.push(t);
        continue;
      }
      const slash = t.t.lastIndexOf('/');
      const dirPart = slash >= 0 ? t.t.slice(0, slash + 1) : '';
      const pat = slash >= 0 ? t.t.slice(slash + 1) : t.t;
      const dir = this.fs.get(this.abs(dirPart || '.'));
      const rx = globToRegex(pat);
      const matches =
        dir && dir.type === 'dir' && !dir.locked
          ? [...dir.children.keys()].filter((k) => rx.test(k) && (pat.startsWith('.') || !k.startsWith('.'))).sort()
          : [];
      if (matches.length) for (const m of matches) out.push({ t: dirPart + m });
      else out.push({ t: t.t });
    }
    return out as T;
  }

  /** Il percorso passa da una cartella protetta? (il sistema non deve rivelare se il file esiste) */
  blocked(abs: string): boolean {
    const parts = abs.split('/').filter(Boolean);
    for (let i = 1; i < parts.length; i++) {
      const n = this.fs.get('/' + parts.slice(0, i).join('/'));
      if (n?.locked) return true;
    }
    return false;
  }

  /** Si può scrivere in questo percorso? */
  canWrite(abs: string): boolean {
    const node = this.fs.get(abs);
    if (node) return !node.locked && node.type === 'file' && (node.owner === this.user || node.perms[7] === 'w');
    const parent = this.fs.get(dirnameOf(abs));
    return !!parent && parent.type === 'dir' && !parent.locked && (parent.owner === this.user || parent.perms[7] === 'w');
  }

  writeText(abs: string, text: string, append: boolean): string | null {
    if (abs === '/dev/null') return null;
    const parent = this.fs.get(dirnameOf(abs));
    if (!parent || parent.type !== 'dir') return 'No such file or directory';
    const node = this.fs.get(abs);
    if (node?.type === 'dir') return 'Is a directory';
    if (!this.canWrite(abs)) return 'Permission denied';
    if (node && node.type === 'file') {
      node.content = append ? node.content + text : text;
      node.mtime = 'Nov 12 21:04';
    } else this.fs.writeFile(abs, text, { owner: this.user, group: this.user, mtime: 'Nov 12 21:04' });
    return null;
  }

  private execPipeline(text: string, sink: Sink, depth: number): number {
    const raw = tokenize(text, this.expander(sink, depth));
    if ('error' in raw) {
      sink.lines.push({ text: raw.error, cls: 'err' });
      return 2;
    }
    const tokens = this.expandGlobs(raw);
    if (tokens.length === 0) return 0;

    // assegnazione di variabile: NOME=valore (anche con "export")
    const assign = (t: Token) => !t.op && /^[A-Za-z_]\w*=/.test(t.t);
    const assignList = tokens[0].t === 'export' ? tokens.slice(1) : tokens;
    if (assignList.length > 0 && assignList.every(assign)) {
      for (const t of assignList) {
        const eq = t.t.indexOf('=');
        this.vars[t.t.slice(0, eq)] = t.t.slice(eq + 1);
      }
      sink.events.push({ type: 'command', name: 'assign', args: assignList.map((t) => t.t), ok: true });
      return 0;
    }

    const segments: Token[][] = [[]];
    for (const tok of tokens) {
      if (tok.op === '|') segments.push([]);
      else segments[segments.length - 1].push(tok);
    }
    if (segments.some((sg) => sg.length === 0)) {
      sink.lines.push({ text: "bash: syntax error near unexpected token `|'", cls: 'err' });
      return 2;
    }

    let stdin: string | null = null;
    let code = 0;
    for (let idx = 0; idx < segments.length; idx++) {
      const isLast = idx === segments.length - 1;
      // redirezioni
      const words: string[] = [];
      let outFile: { path: string; append: boolean } | null = null;
      let errFile: string | null = null;
      const seg = segments[idx];
      for (let j = 0; j < seg.length; j++) {
        const t = seg[j];
        if (t.op === '>' || t.op === '>>' || t.op === '2>') {
          const target = seg[j + 1];
          if (!target || target.op) {
            sink.lines.push({ text: "bash: syntax error near unexpected token `newline'", cls: 'err' });
            return 2;
          }
          j++;
          if (t.op === '2>') errFile = this.abs(target.t);
          else outFile = { path: this.abs(target.t), append: t.op === '>>' };
        } else words.push(t.t);
      }
      if (words.length === 0) {
        if (outFile) this.writeText(outFile.path, '', outFile.append);
        continue;
      }

      const produced: OutLine[] = [];
      code = this.runCommand(words, stdin, produced, sink, depth);

      const outLines = produced.filter((l) => l.stream === 'out');
      const errLines = produced.filter((l) => l.stream === 'err');
      if (errFile === null) for (const l of errLines) sink.lines.push({ text: l.text, cls: l.cls, delay: l.delay });
      else if (errFile !== '/dev/null') this.writeText(errFile, errLines.map((l) => l.text + '\n').join(''), false);

      const outText = outLines.map((l) => l.text + '\n').join('');
      if (outFile) {
        const e = this.writeText(outFile.path, outText, outFile.append);
        if (e) {
          sink.lines.push({ text: `bash: ${outFile.path}: ${e}`, cls: 'err' });
          code = 1;
        } else sink.events.push({ type: 'write', path: outFile.path });
        stdin = '';
      } else if (isLast) {
        for (const l of outLines) {
          const line = { text: l.text, cls: l.cls, delay: l.delay };
          if (sink.capture) sink.capture.push(line);
          else sink.lines.push(line);
        }
      }
      if (!outFile) stdin = outText;
    }
    return code;
  }

  private runCommand(words: string[], stdin: string | null, produced: OutLine[], sink: Sink, depth: number): number {
    const typed = words[0];
    const args = words.slice(1);

    // esecuzione di uno script con ./script.sh o /percorso/script.sh
    if (typed.includes('/')) {
      const p = this.abs(typed);
      const node = this.fs.get(p);
      if (!node) {
        produced.push({ text: `bash: ${typed}: No such file or directory`, cls: 'err', stream: 'err' });
        sink.events.push({ type: 'command', name: typed, args, ok: false });
        return 127;
      }
      if (node.type === 'dir') {
        produced.push({ text: `bash: ${typed}: Is a directory`, cls: 'err', stream: 'err' });
        return 126;
      }
      if (node.locked || node.perms[2] !== 'x' || node.owner !== this.user) {
        produced.push({ text: `bash: ${typed}: Permission denied`, cls: 'err', stream: 'err' });
        if (node.perms[2] !== 'x')
          produced.push({ text: `💡 Il file non è eseguibile. Rendilo eseguibile con: chmod +x ${typed}`, cls: 'info', stream: 'err' });
        sink.events.push({ type: 'command', name: typed, args, ok: false });
        return 126;
      }
      const code = this.runScript(p, args, produced, sink, depth);
      sink.events.push({ type: 'script', path: p, ok: code === 0 });
      sink.events.push({ type: 'command', name: typed, args, ok: code === 0 });
      return code;
    }

    const name = ALIASES[typed] ?? typed;
    const cmd = COMMANDS[name];
    if (!cmd) {
      produced.push({ text: `bash: ${typed}: command not found`, cls: 'err', stream: 'err' });
      const lower = typed.toLowerCase();
      if (lower !== typed && COMMANDS[ALIASES[lower] ?? lower]) {
        produced.push({
          text: `💡 Linux distingue MAIUSCOLE e minuscole: "${typed}" e "${lower}" sono parole diverse. Prova "${lower}".`,
          cls: 'info',
          stream: 'err',
        });
      } else {
        const near = this.commandNames()
          .map((c) => [c, levenshtein(lower, c)] as const)
          .filter(([c, d]) => d <= (c.length > 3 ? 2 : 1))
          .sort((a, b) => a[1] - b[1]);
        produced.push({
          text: near.length ? `💡 Forse intendevi "${near[0][0]}"?` : '💡 Scrivi "help" per vedere i comandi disponibili.',
          cls: 'info',
          stream: 'err',
        });
      }
      sink.events.push({ type: 'command', name: typed, args, ok: false });
      return 127;
    }
    const ctx: Ctx = {
      sh: this,
      name,
      args,
      stdin,
      depth,
      out: (text, cls, delay) => produced.push({ text, cls: cls ?? 'out', delay, stream: 'out' }),
      err: (text) => produced.push({ text, cls: 'err', stream: 'err' }),
      info: (text) => produced.push({ text, cls: 'info', stream: 'err' }),
      raw: (l, stream) => produced.push({ ...l, stream }),
      emit: (ev) => sink.events.push(ev),
      clear: () => {
        sink.clear = true;
        sink.lines.length = 0;
      },
      sink,
    };
    let code = 1;
    try {
      code = cmd(ctx);
    } catch (e) {
      ctx.err(`${name}: errore interno (${(e as Error).message})`);
    }
    sink.events.push({ type: 'command', name, args, ok: code === 0 });
    return code;
  }

  /** Esegue un file di script con i suoi argomenti ($1, $2...). */
  runScript(path: string, args: string[], produced: OutLine[], sink: Sink, depth: number): number {
    if (depth > 6) {
      produced.push({ text: 'bash: troppi script annidati', cls: 'err', stream: 'err' });
      return 1;
    }
    const node = this.fs.get(path);
    if (!node || node.type !== 'file') return 127;
    const saved: Record<string, string | undefined> = {};
    const positional: Record<string, string> = { '0': path, '#': String(args.length) };
    for (let k = 1; k <= 9; k++) positional[String(k)] = args[k - 1] ?? '';
    for (const [k, v] of Object.entries(positional)) {
      saved[k] = this.vars[k];
      this.vars[k] = v;
    }
    const inner: Sink = { lines: [], events: sink.events, capture: [] };
    const code = this.execText(node.content, inner, depth + 1);
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete this.vars[k];
      else this.vars[k] = v;
    }
    // stdout dello script → stdout del comando; errori e messaggi → stderr
    for (const l of inner.lines) produced.push({ ...l, stream: 'err' });
    for (const l of inner.capture!) produced.push({ ...l, stream: 'out' });
    return code;
  }

  /** Completamento con TAB. Restituisce la nuova riga e le alternative possibili. */
  complete(input: string): { line: string; options: string[] } {
    const m = input.match(/^(.*?)(\S*)$/s)!;
    const before = m[1];
    const word = m[2];
    const isCommand = before.trim() === '' || /\|\s*$/.test(before);

    let candidates: { name: string; suffix: string }[];
    let prefixPath = '';
    let partial = word;

    if (isCommand) {
      candidates = this.commandNames().map((n) => ({ name: n, suffix: ' ' }));
    } else {
      const slash = word.lastIndexOf('/');
      prefixPath = slash >= 0 ? word.slice(0, slash + 1) : '';
      partial = slash >= 0 ? word.slice(slash + 1) : word;
      const dirNode = this.fs.get(this.abs(prefixPath || '.'));
      if (!dirNode || dirNode.type !== 'dir' || dirNode.locked) return { line: input, options: [] };
      candidates = [...dirNode.children.entries()]
        .filter(([n]) => partial.startsWith('.') || !n.startsWith('.'))
        .map(([n, node]) => ({ name: n, suffix: node.type === 'dir' ? '/' : ' ' }));
    }

    const matches = candidates.filter((c) => c.name.startsWith(partial)).sort((a, b) => a.name.localeCompare(b.name));
    if (matches.length === 0) return { line: input, options: [] };
    if (matches.length === 1) {
      return { line: before + prefixPath + matches[0].name + matches[0].suffix, options: [] };
    }
    let common = matches[0].name;
    for (const c of matches) while (!c.name.startsWith(common)) common = common.slice(0, -1);
    return {
      line: before + prefixPath + common,
      options: matches.map((c) => c.name + (c.suffix === '/' ? '/' : '')),
    };
  }
}

// ---------------------------------------------------------------- helpers

function readText(c: Ctx, files: string[], cmdName: string): string | null {
  if (files.length === 0) {
    if (c.stdin !== null) return c.stdin;
    c.err(`${cmdName}: manca il nome del file`);
    return null;
  }
  let text = '';
  for (const f of files) {
    const p = c.sh.abs(f);
    const node = c.sh.fs.get(p);
    if (!node || c.sh.blocked(p)) {
      c.err(`${cmdName}: ${f}: ${c.sh.blocked(p) ? 'Permission denied' : 'No such file or directory'}`);
      return null;
    }
    if (node.type === 'dir') {
      c.err(`${cmdName}: ${f}: Is a directory`);
      return null;
    }
    if (node.locked) {
      c.err(`${cmdName}: ${f}: Permission denied`);
      return null;
    }
    c.emit({ type: 'read', path: p });
    text += node.content.endsWith('\n') || node.content === '' ? node.content : node.content + '\n';
  }
  return text;
}

function longEntry(sh: Shell, name: string, node: VNode): Line {
  const type = node.type === 'dir' ? 'd' : '-';
  const links = node.type === 'dir' ? 2 + [...node.children.values()].filter((n) => n.type === 'dir').length : 1;
  const size = String(sh.fs.size(node)).padStart(5);
  const display = node.type === 'dir' && name !== '.' && name !== '..' ? name + '/' : name;
  return {
    text: `${type}${node.perms} ${String(links).padStart(2)} ${node.owner.padEnd(5)} ${node.group.padEnd(5)} ${size} ${node.mtime} ${display}`,
    cls: node.type === 'dir' ? 'dir' : 'out',
  };
}

// ---------------------------------------------------------------- comandi

const COMMANDS: Record<string, Command> = {
  help(c) {
    c.out('Comandi disponibili in questo deck:', 'dim');
    const pages = Object.values(MANPAGES);
    const width = Math.max(...pages.map((p) => p.name.length));
    for (const p of pages.filter((p) => !p.game)) c.out(`  ${p.name.padEnd(width)}  ${p.short}`);
    c.out('Comandi del gioco:', 'dim');
    for (const p of pages.filter((p) => p.game)) c.out(`  ${p.name.padEnd(width)}  ${p.short}`);
    c.out('Per i dettagli di un comando scrivi: man NOMECOMANDO', 'dim');
    return 0;
  },

  man(c) {
    const topic = c.args[0];
    if (!topic) {
      c.err('What manual page do you want?');
      c.err("For example, try 'man man'.");
      return 1;
    }
    const page = MANPAGES[ALIASES[topic] ?? topic];
    if (!page) {
      c.err(`No manual entry for ${topic}`);
      return 16;
    }
    c.emit({ type: 'man', topic: page.name });
    c.out(`${page.name.toUpperCase()}(1)${page.game ? '  [comando del gioco]' : ''}`, 'dim');
    c.out('NOME', 'ok');
    c.out(`    ${page.name} - ${page.short}`);
    c.out('SINTASSI', 'ok');
    c.out(`    ${page.synopsis}`);
    c.out('DESCRIZIONE', 'ok');
    for (const d of page.description) c.out(`    ${d}`);
    if (page.options?.length) {
      c.out('OPZIONI', 'ok');
      for (const [o, d] of page.options) c.out(`    ${o.padEnd(6)} ${d}`);
    }
    if (page.examples?.length) {
      c.out('ESEMPI', 'ok');
      for (const [e, d] of page.examples) {
        c.out(`    $ ${e}`, 'dir');
        c.out(`      ${d}`, 'dim');
      }
    }
    return 0;
  },

  whoami(c) {
    c.out(c.sh.user);
    return 0;
  },

  hostname(c) {
    c.out(c.sh.host);
    return 0;
  },

  pwd(c) {
    c.out(c.sh.cwd);
    return 0;
  },

  ls(c) {
    const { flags, rest } = splitShortFlags(c.args);
    for (const f of flags) {
      if (!'alh1'.includes(f)) {
        c.err(`ls: invalid option -- '${f}'`);
        c.info('💡 Opzioni disponibili qui: -a (nascosti) e -l (formato lungo). Vedi "man ls".');
        return 2;
      }
    }
    const all = flags.has('a');
    const long = flags.has('l');
    const targets = rest.length ? rest : ['.'];
    let code = 0;
    targets.forEach((t, i) => {
      const p = c.sh.abs(t);
      const node = c.sh.fs.get(p);
      if (!node) {
        c.err(`ls: cannot access '${t}': No such file or directory`);
        code = 2;
        return;
      }
      if (node.type === 'file') {
        if (long) {
          const l = longEntry(c.sh, t, node);
          c.out(l.text, l.cls);
        } else c.out(t);
        return;
      }
      if (node.locked) {
        c.err(`ls: cannot open directory '${t}': Permission denied`);
        code = 2;
        return;
      }
      c.emit({ type: 'ls', path: p, flags: [...flags] });
      if (targets.length > 1) c.out(`${t}:`, 'dim');
      const entries: [string, VNode][] = [];
      if (all) {
        entries.push(['.', node]);
        entries.push(['..', c.sh.fs.get(p === '/' ? '/' : p + '/..') as DirNode]);
      }
      const children = [...(node as DirNode).children.entries()]
        .filter(([n]) => all || !n.startsWith('.'))
        .sort(([a], [b]) => a.replace(/^\./, '').localeCompare(b.replace(/^\./, '')));
      entries.push(...children);
      if (long) c.out(`total ${entries.length * 4}`);
      for (const [n, child] of entries) {
        if (long) {
          const l = longEntry(c.sh, n, child);
          c.out(l.text, l.cls);
        } else if (child.type === 'dir') c.out(n === '.' || n === '..' ? n : n + '/', 'dir');
        else c.out(n);
      }
      if (!long && entries.length === 0) c.out('(cartella vuota)', 'dim');
      if (targets.length > 1 && i < targets.length - 1) c.out('');
    });
    return code;
  },

  cd(c) {
    if (c.args.length > 1) {
      c.err('bash: cd: too many arguments');
      return 1;
    }
    const t = c.args[0] ?? '~';
    const p = t === '-' ? c.sh.oldPwd : c.sh.abs(t);
    const node = c.sh.fs.get(p);
    if (!node) {
      c.err(`bash: cd: ${t}: No such file or directory`);
      return 1;
    }
    if (node.type !== 'dir') {
      c.err(`bash: cd: ${t}: Not a directory`);
      c.info('💡 cd serve per entrare nelle cartelle. Per leggere un file usa "cat".');
      return 1;
    }
    if (node.locked) {
      c.err(`bash: cd: ${t}: Permission denied`);
      return 1;
    }
    c.sh.oldPwd = c.sh.cwd;
    c.sh.cwd = p;
    if (t === '-') c.out(p);
    c.emit({ type: 'cd', path: p });
    return 0;
  },

  cat(c) {
    if (c.args.length === 0 && c.stdin === null) {
      c.err('cat: manca il nome del file');
      c.info('💡 Scrivi il nome del file dopo cat, es: cat note.txt');
      return 1;
    }
    const text = readText(c, c.args, 'cat');
    if (text === null) return 1;
    for (const l of splitLines(text)) c.out(l);
    return 0;
  },

  echo(c) {
    const args = c.args[0] === '-n' ? c.args.slice(1) : c.args;
    c.out(args.join(' '));
    return 0;
  },

  clear(c) {
    c.clear();
    return 0;
  },

  history(c) {
    c.sh.history.forEach((h, i) => c.out(`${String(i + 1).padStart(5)}  ${h}`));
    return 0;
  },

  grep(c) {
    const { flags, rest } = splitShortFlags(c.args);
    const pattern = rest[0];
    if (pattern === undefined) {
      c.err('Usage: grep [OPTION]... PATTERNS [FILE]...');
      return 2;
    }
    const text = readText(c, rest.slice(1), 'grep');
    if (text === null) return 2;
    const ci = flags.has('i');
    const needle = ci ? pattern.toLowerCase() : pattern;
    let found = 0;
    splitLines(text).forEach((l, i) => {
      const hay = ci ? l.toLowerCase() : l;
      const match = hay.includes(needle) !== flags.has('v');
      if (match) {
        found++;
        if (!flags.has('c')) c.out(flags.has('n') ? `${i + 1}:${l}` : l);
      }
    });
    if (flags.has('c')) c.out(String(found));
    return found ? 0 : 1;
  },

  head(c) {
    return headTail(c, 'head');
  },

  tail(c) {
    return headTail(c, 'tail');
  },

  wc(c) {
    const { flags, rest } = splitShortFlags(c.args);
    const text = readText(c, rest, 'wc');
    if (text === null) return 1;
    const lines = (text.match(/\n/g) ?? []).length;
    const suffix = rest[0] ? ` ${rest[0]}` : '';
    if (flags.has('l')) c.out(`${lines}${suffix}`);
    else {
      const words = text.split(/\s+/).filter(Boolean).length;
      c.out(`${String(lines).padStart(3)} ${String(words).padStart(4)} ${String(new TextEncoder().encode(text).length).padStart(5)}${suffix}`);
    }
    return 0;
  },

  ip(c) {
    const sub = c.args[0];
    if (!sub || !['a', 'addr', 'address'].includes(sub)) {
      c.err('Usage: ip [ OPTIONS ] OBJECT { COMMAND | help }');
      c.info('💡 In questo deck prova: ip a');
      return 255;
    }
    const n = c.sh.net;
    c.emit({ type: 'netinfo' });
    c.out('1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN');
    c.out('    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00', 'dim');
    c.out('    inet 127.0.0.1/8 scope host lo');
    c.out('2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP');
    c.out(`    link/ether ${n.myMac} brd ff:ff:ff:ff:ff:ff`, 'dim');
    c.out(`    inet ${n.myIp}/${n.cidr} brd 192.168.1.255 scope global eth0`, 'ok');
    return 0;
  },

  ifconfig(c) {
    const n = c.sh.net;
    c.emit({ type: 'netinfo' });
    c.out('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500');
    c.out(`        inet ${n.myIp}  netmask 255.255.255.0  broadcast 192.168.1.255`, 'ok');
    c.out(`        ether ${n.myMac}  txqueuelen 1000  (Ethernet)`, 'dim');
    c.out('');
    c.out('lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536');
    c.out('        inet 127.0.0.1  netmask 255.0.0.0');
    return 0;
  },

  ping(c) {
    let count = 4;
    let target: string | undefined;
    for (let i = 0; i < c.args.length; i++) {
      const a = c.args[i];
      if (a === '-c') {
        const n = Number(c.args[++i]);
        if (!Number.isInteger(n) || n < 1) {
          c.err(`ping: invalid argument: '${c.args[i] ?? ''}'`);
          return 1;
        }
        count = Math.min(n, 10);
      } else if (a.startsWith('-')) {
        c.err(`ping: invalid option -- '${a.slice(1)}'`);
        return 2;
      } else target = a;
    }
    if (!target) {
      c.err('ping: usage error: Destination address required');
      return 1;
    }
    const res = lookup(c.sh.net, target);
    if (!res) {
      c.err(`ping: ${target}: Name or service not known`);
      c.info('💡 Il nome non esiste nel DNS di questa rete. Controlla di averlo scritto bene.');
      c.emit({ type: 'ping', target, ip: null, replies: 0 });
      return 2;
    }
    const { ip, host } = res;
    c.out(`PING ${target} (${ip}) 56(84) bytes of data.`);
    let replies = 0;
    const times: number[] = [];
    for (let seq = 1; seq <= count; seq++) {
      if (host?.pingable) {
        const t = +(host.latency * (0.8 + ((seq * 37) % 10) / 20)).toFixed(2);
        times.push(t);
        replies++;
        const from = isIp(target) ? ip : `${host.names[0]} (${ip})`;
        c.out(`64 bytes from ${from}: icmp_seq=${seq} ttl=${host.ttl} time=${t} ms`, 'out', 450);
      } else if (!host && ip.startsWith('192.168.1.')) {
        c.out(`From ${c.sh.net.myIp} icmp_seq=${seq} Destination Host Unreachable`, 'err', 450);
      } else {
        c.out('', 'out', 700); // nessuna risposta: solo attesa
      }
    }
    const loss = Math.round(((count - replies) / count) * 100);
    c.out('');
    c.out(`--- ${target} ping statistics ---`);
    c.out(`${count} packets transmitted, ${replies} received, ${loss}% packet loss, time ${(count - 1) * 1001}ms`);
    if (times.length) {
      const min = Math.min(...times);
      const max = Math.max(...times);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      c.out(`rtt min/avg/max/mdev = ${min.toFixed(3)}/${avg.toFixed(3)}/${max.toFixed(3)}/${((max - min) / 2).toFixed(3)} ms`);
    }
    c.emit({ type: 'ping', target, ip, replies });
    return replies ? 0 : 1;
  },

  nmap(c) {
    const flags: string[] = [];
    let ports: number[] | null = null;
    let target: string | undefined;
    for (let i = 0; i < c.args.length; i++) {
      const a = c.args[i];
      if (a === '-p') {
        const spec = c.args[++i] ?? '';
        ports = spec.split(',').map(Number);
        if (!spec || ports.some((p) => !Number.isInteger(p) || p < 1 || p > 65535)) {
          c.err(`Error #485: Your port specifications are illegal.`);
          return 1;
        }
        flags.push('-p');
      } else if (['-sn', '-sV', '-Pn', '-sT', '-sS', '-v'].includes(a)) flags.push(a);
      else if (a.startsWith('-')) {
        c.err(`nmap: unrecognized option '${a}'`);
        c.info('💡 Opzioni disponibili qui: -sn, -sV, -p. Vedi "man nmap".');
        return 1;
      } else target = a;
    }
    if (!target) {
      c.out('Nmap 7.95 ( https://nmap.org )');
      c.out('Usage: nmap [Scan Type(s)] [Options] {target specification}');
      c.info('💡 Indica un bersaglio, es: nmap 192.168.1.20 — e solo se è nello scope!');
      return 0;
    }

    let hosts: Host[];
    let rangeSize = 1;
    let unknownIp: string | null = null;
    const range = hostsInRange(c.sh.net, target);
    if (range) {
      hosts = range;
      rangeSize = 256;
      if (!target.startsWith('192.168.1.')) {
        c.emit({ type: 'scan', target, ip: null, flags, outOfScope: true });
        return outOfScope(c, target);
      }
    } else {
      const res = lookup(c.sh.net, target);
      if (!res) {
        c.out(NMAP_HEADER);
        c.err(`Failed to resolve "${target}".`);
        c.err('WARNING: No targets were specified, so 0 hosts scanned.');
        c.emit({ type: 'scan', target, ip: null, flags, outOfScope: false });
        return 1;
      }
      hosts = res.host ? [res.host] : [];
      if (!res.host) unknownIp = res.ip;
    }

    const lanPrefix = '192.168.1.';
    const outside = hosts.some((h) => !h.inScope) || (unknownIp !== null && !unknownIp.startsWith(lanPrefix));
    if (outside) {
      c.emit({ type: 'scan', target, ip: hosts[0]?.ip ?? unknownIp, flags, outOfScope: true });
      return outOfScope(c, target);
    }

    c.out(NMAP_HEADER);
    const t0 = Date.now() % 7;
    if (flags.includes('-sn')) {
      for (const h of hosts) {
        c.out(`Nmap scan report for ${displayName(h, h.ip)}`, 'ok', 350);
        c.out(`Host is up (${(h.latency / 1000).toFixed(4)}s latency).`);
      }
      c.out(
        `Nmap done: ${rangeSize} IP address${rangeSize > 1 ? 'es' : ''} (${hosts.length} host${hosts.length === 1 ? '' : 's'} up) scanned in ${(rangeSize > 1 ? 2.31 : 0.05).toFixed(2)} seconds`,
        'out',
        400,
      );
      c.emit({ type: 'scan', target, ip: hosts.length === 1 ? hosts[0].ip : null, flags, outOfScope: false });
      return 0;
    }

    if (hosts.length === 0) {
      c.out('Note: Host seems down. If it is really up, but blocking our ping probes, try -Pn', 'warn', 600);
      c.out(`Nmap done: 1 IP address (0 hosts up) scanned in 3.04 seconds`);
      c.emit({ type: 'scan', target, ip: unknownIp, flags, outOfScope: false });
      return 0;
    }

    const version = flags.includes('-sV');
    for (const h of hosts) {
      c.out(`Nmap scan report for ${displayName(h, h.ip)}`, 'ok', 500);
      c.out(`Host is up (${(h.latency / 1000).toFixed(4)}s latency).`);
      type Row = { port: string; state: string; service: string; version: string };
      let rows: Row[];
      if (ports) {
        rows = ports.map((p) => {
          const open = h.ports.find((x) => x.port === p);
          return {
            port: `${p}/tcp`,
            state: open ? 'open' : 'closed',
            service: open?.service ?? WELL_KNOWN[p] ?? 'unknown',
            version: open?.version ?? '',
          };
        });
      } else {
        rows = h.ports.map((p) => ({ port: `${p.port}/tcp`, state: 'open', service: p.service, version: p.version }));
        c.out(`Not shown: ${1000 - rows.length} closed tcp ports (conn-refused)`);
      }
      if (rows.length === 0) {
        c.out('All 1000 scanned ports are closed', 'dim');
        continue;
      }
      const w1 = Math.max(4, ...rows.map((r) => r.port.length)) + 1;
      const w2 = Math.max(5, ...rows.map((r) => r.state.length)) + 1;
      const w3 = Math.max(7, ...rows.map((r) => r.service.length)) + 1;
      c.out(`${'PORT'.padEnd(w1)}${'STATE'.padEnd(w2)}${version ? 'SERVICE'.padEnd(w3) + 'VERSION' : 'SERVICE'}`, 'dim', 900);
      for (const r of rows) {
        c.out(
          `${r.port.padEnd(w1)}${r.state.padEnd(w2)}${version ? r.service.padEnd(w3) + r.version : r.service}`,
          r.state === 'open' ? 'out' : 'dim',
          120,
        );
      }
      c.out('');
    }
    if (version) c.out('Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .', 'dim');
    c.out(`Nmap done: 1 IP address (1 host up) scanned in ${(version ? 6.18 : 0.42 + t0 / 100).toFixed(2)} seconds`);
    c.emit({ type: 'scan', target, ip: hosts[0].ip, flags, outOfScope: false });
    return 0;
  },

  mkdir(c) {
    const { flags, rest } = splitShortFlags(c.args);
    if (!rest.length) {
      c.err('mkdir: missing operand');
      return 1;
    }
    let code = 0;
    for (const d of rest) {
      const p = c.sh.abs(d);
      if (c.sh.fs.get(p)) {
        if (!flags.has('p')) {
          c.err(`mkdir: cannot create directory '${d}': File exists`);
          code = 1;
        }
        continue;
      }
      const parent = c.sh.fs.get(dirnameOf(p));
      if (!parent && !flags.has('p')) {
        c.err(`mkdir: cannot create directory '${d}': No such file or directory`);
        c.info('💡 Per creare anche le cartelle intermedie usa: mkdir -p');
        code = 1;
        continue;
      }
      if (!c.sh.canWrite(p) && parent) {
        c.err(`mkdir: cannot create directory '${d}': Permission denied`);
        code = 1;
        continue;
      }
      c.sh.fs.mkdirp(p, { owner: c.sh.user, group: c.sh.user });
      c.emit({ type: 'fsop', op: 'mkdir', paths: [p] });
    }
    return code;
  },

  touch(c) {
    if (!c.args.length) {
      c.err('touch: missing file operand');
      return 1;
    }
    for (const f of c.args) {
      const p = c.sh.abs(f);
      const node = c.sh.fs.get(p);
      if (node) {
        node.mtime = 'Nov 12 21:04';
        continue;
      }
      const e = c.sh.writeText(p, '', false);
      if (e) {
        c.err(`touch: cannot touch '${f}': ${e}`);
        return 1;
      }
      c.emit({ type: 'fsop', op: 'touch', paths: [p] });
    }
    return 0;
  },

  rm(c) {
    const { flags, rest } = splitShortFlags(c.args);
    if (!rest.length) {
      c.err('rm: missing operand');
      return 1;
    }
    let code = 0;
    for (const f of rest) {
      const p = c.sh.abs(f);
      const node = c.sh.fs.get(p);
      if (!node) {
        if (!flags.has('f')) {
          c.err(`rm: cannot remove '${f}': No such file or directory`);
          code = 1;
        }
        continue;
      }
      if (p === '/' || p === c.sh.home) {
        c.err(`rm: it is dangerous to operate recursively on '${f}'`);
        c.info('⚠️ Il deck ti ha fermato. Su un vero Linux "rm -rf" su una cartella importante cancella tutto, senza cestino e senza conferma.');
        code = 1;
        continue;
      }
      if (node.type === 'dir' && !flags.has('r') && !flags.has('R')) {
        c.err(`rm: cannot remove '${f}': Is a directory`);
        c.info('💡 Per cancellare una cartella con tutto il contenuto: rm -r (fai molta attenzione!)');
        code = 1;
        continue;
      }
      const parent = c.sh.fs.get(dirnameOf(p)) as DirNode;
      const writable = parent.owner === c.sh.user || parent.perms[7] === 'w';
      if (!writable || parent.locked) {
        c.err(`rm: cannot remove '${f}': Permission denied`);
        code = 1;
        continue;
      }
      parent.children.delete(p.slice(p.lastIndexOf('/') + 1));
      c.emit({ type: 'fsop', op: 'rm', paths: [p] });
    }
    return code;
  },

  rmdir(c) {
    for (const d of c.args) {
      const p = c.sh.abs(d);
      const node = c.sh.fs.get(p);
      if (!node || node.type !== 'dir') {
        c.err(`rmdir: failed to remove '${d}': ${node ? 'Not a directory' : 'No such file or directory'}`);
        return 1;
      }
      if (node.children.size) {
        c.err(`rmdir: failed to remove '${d}': Directory not empty`);
        return 1;
      }
      const parent = c.sh.fs.get(dirnameOf(p)) as DirNode;
      if (parent.owner !== c.sh.user) {
        c.err(`rmdir: failed to remove '${d}': Permission denied`);
        return 1;
      }
      parent.children.delete(p.slice(p.lastIndexOf('/') + 1));
      c.emit({ type: 'fsop', op: 'rm', paths: [p] });
    }
    return 0;
  },

  cp(c) {
    return copyMove(c, 'cp');
  },

  mv(c) {
    return copyMove(c, 'mv');
  },

  nano(c) {
    const f = c.args[0];
    if (!f) {
      c.err('nano: indica il file da aprire, es: nano note.txt');
      return 1;
    }
    const p = c.sh.abs(f);
    const node = c.sh.fs.get(p);
    if (node?.type === 'dir') {
      c.err(`nano: ${f}: Is a directory`);
      return 1;
    }
    if (node?.locked) {
      c.err(`nano: ${f}: Permission denied`);
      return 1;
    }
    c.emit({ type: 'edit', path: p });
    return 0;
  },

  base64(c) {
    const { flags, rest } = splitShortFlags(c.args);
    const text = readText(c, rest, 'base64');
    if (text === null) return 1;
    if (flags.has('d')) {
      const dec = base64Decode(text);
      if (dec === null) {
        c.err('base64: invalid input');
        return 1;
      }
      for (const l of splitLines(dec)) c.out(l);
    } else {
      const enc = base64Encode(text);
      for (let i = 0; i < enc.length; i += 76) c.out(enc.slice(i, i + 76));
    }
    return 0;
  },

  sha256sum(c) {
    if (c.args[0] === '-c') {
      const list = readText(c, c.args.slice(1), 'sha256sum');
      if (list === null) return 1;
      let failed = 0;
      for (const l of splitLines(list)) {
        const m = l.match(/^([0-9a-f]{64})\s+\*?(.+)$/);
        if (!m) continue;
        const t = readText(c, [m[2]], 'sha256sum');
        if (t === null) {
          failed++;
          continue;
        }
        const ok = sha256(t) === m[1];
        if (!ok) failed++;
        c.out(`${m[2]}: ${ok ? 'OK' : 'FAILED'}`, ok ? 'ok' : 'err');
      }
      if (failed) c.err(`sha256sum: WARNING: ${failed} computed checksum${failed > 1 ? 's' : ''} did NOT match`);
      c.emit({ type: 'command', name: 'sha256check', args: [String(failed)], ok: true });
      return failed ? 1 : 0;
    }
    if (!c.args.length) {
      if (c.stdin === null) {
        c.err('sha256sum: indica un file, es: sha256sum file.txt');
        return 1;
      }
      c.out(`${sha256(c.stdin)}  -`);
      return 0;
    }
    let code = 0;
    for (const f of c.args) {
      const t = readText(c, [f], 'sha256sum');
      if (t === null) {
        code = 1;
        continue;
      }
      c.out(`${sha256(t)}  ${f}`);
    }
    return code;
  },

  seq(c) {
    const nums = c.args.map(Number);
    if (!nums.length || nums.some((n) => !Number.isInteger(n))) {
      c.err('seq: usa seq FINE oppure seq INIZIO FINE');
      return 1;
    }
    const [from, to] = nums.length === 1 ? [1, nums[0]] : [nums[0], nums[1]];
    if (to - from > 500) {
      c.err('seq: massimo 500 numeri in questo deck');
      return 1;
    }
    for (let i = from; i <= to; i++) c.out(String(i));
    return 0;
  },

  test(c) {
    return testExpr(c, c.args);
  },

  '['(c) {
    if (c.args[c.args.length - 1] !== ']') {
      c.err("bash: [: missing `]'");
      c.info('💡 Attenzione agli spazi: [ -f file ] (spazio dopo [ e prima di ])');
      return 2;
    }
    return testExpr(c, c.args.slice(0, -1));
  },

  true() {
    return 0;
  },

  false() {
    return 1;
  },

  bash(c) {
    const f = c.args[0];
    if (!f) {
      c.info('Sei già dentro bash 🙂 Per eseguire uno script: bash nomescript.sh');
      return 0;
    }
    const p = c.sh.abs(f);
    const node = c.sh.fs.get(p);
    if (!node || node.type !== 'file') {
      c.err(`bash: ${f}: No such file or directory`);
      return 127;
    }
    if (node.locked) {
      c.err(`bash: ${f}: Permission denied`);
      return 126;
    }
    const produced: OutLine[] = [];
    const code = c.sh.runScript(p, c.args.slice(1), produced, c.sink, c.depth);
    for (const l of produced) c.raw(l, l.stream);
    c.emit({ type: 'script', path: p, ok: code === 0 });
    return code;
  },

  env(c) {
    for (const k of ['HOME', 'USER', 'HOSTNAME', 'PWD', 'SHELL', 'PATH']) c.out(`${k}=${c.sh.getVar(k)}`);
    for (const [k, v] of Object.entries(c.sh.vars)) if (/^[A-Za-z_]\w*$/.test(k)) c.out(`${k}=${v}`);
    return 0;
  },

  date(c) {
    c.out('Thu Nov 12 21:04:00 CET 2077');
    return 0;
  },

  tree(c) {
    const start = c.args[0] ?? '.';
    const node = c.sh.fs.get(c.sh.abs(start));
    if (!node) {
      c.err(`${start} [error opening dir]`);
      return 1;
    }
    let dirs = 0;
    let files = 0;
    c.out(start, 'dir');
    const walk = (n: VNode, prefix: string) => {
      if (n.type !== 'dir' || n.locked) return;
      const kids = [...n.children.entries()].filter(([k]) => !k.startsWith('.')).sort(([a], [b]) => a.localeCompare(b));
      kids.forEach(([k, child], i) => {
        const last = i === kids.length - 1;
        c.out(`${prefix}${last ? '└── ' : '├── '}${k}`, child.type === 'dir' ? 'dir' : 'out');
        if (child.type === 'dir') {
          dirs++;
          walk(child, prefix + (last ? '    ' : '│   '));
        } else files++;
      });
    };
    walk(node, '');
    c.out('');
    c.out(`${dirs} directories, ${files} files`, 'dim');
    return 0;
  },

  curl(c) {
    const { flags, rest } = splitShortFlags(c.args);
    const url = rest[0];
    if (!url) {
      c.err('curl: try \'curl --help\' for more information');
      c.info('💡 Esempio: curl http://jukebox.lan/');
      return 2;
    }
    const m = url.match(/^(?:https?:\/\/)?([^/:]+)(\/.*)?$/);
    const host = m?.[1].toLowerCase() ?? '';
    const path = m?.[2] ?? '/';
    const res = lookup(c.sh.net, host);
    if (!res) {
      c.err(`curl: (6) Could not resolve host: ${host}`);
      return 6;
    }
    if (res.host && !res.host.inScope) return outOfScope(c, host);
    const site = WEB[res.ip];
    if (!site) {
      c.err(`curl: (7) Failed to connect to ${host} port 80: Connection refused`);
      return 7;
    }
    const page = site.pages[path];
    const status = page ? '200 OK' : '404 Not Found';
    c.emit({ type: 'http', host, path, status: page ? 200 : 404, head: flags.has('I') });
    if (flags.has('I') || flags.has('i')) {
      c.out(`HTTP/1.1 ${status}`, page ? 'ok' : 'err');
      c.out('Date: Thu, 12 Nov 2077 21:04:00 GMT');
      for (const hdr of site.headers) c.out(hdr);
      c.out(`Content-Type: ${page?.type ?? 'text/html'}; charset=UTF-8`);
      if (flags.has('I')) return 0;
      c.out('');
    }
    const body = page?.body ?? '<html><body><h1>Not Found</h1></body></html>';
    for (const l of splitLines(body)) c.out(l);
    return 0;
  },

  sudo(c) {
    if (c.args[0] === 'ufw') {
      c.info('[sudo] concesso: il contratto ti autorizza ad amministrare solo il firewall (ufw).');
      return ufw({ ...c, args: c.args.slice(1) }, true);
    }
    c.err(`${c.sh.user} is not in the sudoers file.  This incident will be reported.`);
    c.info('💡 Il tuo utente non ha i privilegi di amministratore (root). In questo deck sudo è permesso solo per "ufw".');
    return 1;
  },

  ufw(c) {
    return ufw(c, false);
  },

  id(c) {
    const sh = c.sh;
    const gids: Record<string, number> = { users: 100, adm: 4 };
    const extra = sh.groups.map((g) => `${gids[g] ?? 1001}(${g})`).join(',');
    c.out(`uid=1000(${sh.user}) gid=1000(${sh.user}) groups=1000(${sh.user})${extra ? ',' + extra : ''}`);
    return 0;
  },

  groups(c) {
    c.out([c.sh.user, ...c.sh.groups].join(' '));
    return 0;
  },

  chmod(c) {
    const [mode, ...files] = c.args;
    if (!mode || files.length === 0) {
      c.err(mode ? `chmod: missing operand after '${mode}'` : 'chmod: missing operand');
      c.info('💡 Sintassi: chmod PERMESSI FILE, es: chmod 600 segreto.txt');
      return 1;
    }
    let code = 0;
    for (const f of files) {
      const p = c.sh.abs(f);
      const node = c.sh.fs.get(p);
      if (!node) {
        c.err(`chmod: cannot access '${f}': No such file or directory`);
        code = 1;
        continue;
      }
      if (node.owner !== c.sh.user) {
        c.err(`chmod: changing permissions of '${f}': Operation not permitted`);
        c.info('💡 Solo il proprietario del file (o root) può cambiarne i permessi.');
        code = 1;
        continue;
      }
      const next = applyMode(node.perms, mode);
      if (!next) {
        c.err(`chmod: invalid mode: '${mode}'`);
        return 1;
      }
      node.perms = next;
      c.emit({ type: 'chmod', path: p, perms: next });
    }
    return code;
  },

  find(c) {
    let start = '.';
    let name: RegExp | null = null;
    let type: string | null = null;
    let user: string | null = null;
    for (let i = 0; i < c.args.length; i++) {
      const a = c.args[i];
      if (a === '-name' || a === '-iname') {
        const pat = c.args[++i];
        if (pat === undefined) {
          c.err(`find: missing argument to \`${a}'`);
          return 1;
        }
        const rx = pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
        name = new RegExp(`^${rx}$`, a === '-iname' ? 'i' : '');
      } else if (a === '-type') {
        type = c.args[++i] ?? '';
        if (type !== 'f' && type !== 'd') {
          c.err(`find: Unknown argument to -type: ${type}`);
          return 1;
        }
      } else if (a === '-user') {
        user = c.args[++i] ?? '';
      } else if (a.startsWith('-')) {
        c.err(`find: unknown predicate \`${a}'`);
        c.info('💡 In questo deck find supporta: -name, -iname, -type f|d, -user.');
        return 1;
      } else start = a;
    }
    const root = c.sh.abs(start);
    const node = c.sh.fs.get(root);
    if (!node) {
      c.err(`find: '${start}': No such file or directory`);
      return 1;
    }
    let denied = false;
    const walk = (n: VNode, shown: string, base: string) => {
      const okName = !name || name.test(base);
      const okType = !type || (type === 'd') === (n.type === 'dir');
      const okUser = !user || n.owner === user;
      if (okName && okType && okUser) c.out(shown, n.type === 'dir' ? 'dir' : 'out');
      if (n.type !== 'dir') return;
      if (n.locked) {
        c.err(`find: '${shown}': Permission denied`);
        denied = true;
        return;
      }
      for (const [k, child] of [...n.children.entries()].sort(([a], [b]) => a.localeCompare(b)))
        walk(child, shown === '/' ? `/${k}` : `${shown}/${k}`, k);
    };
    walk(node, start.length > 1 ? start.replace(/\/$/, '') : start, start === '/' ? '/' : start.split('/').filter(Boolean).pop() ?? start);
    return denied ? 1 : 0;
  },

  ps(c) {
    const full = c.args.some((a) => /^-?(aux|ef|e)$/.test(a));
    if (!full) {
      c.out('    PID TTY          TIME CMD');
      c.out('   1337 pts/0    00:00:00 bash');
      c.out('   1402 pts/0    00:00:00 ps');
      return 0;
    }
    const u = c.sh.user.padEnd(8).slice(0, 8);
    const rows = [
      'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND',
      'root           1  0.0  0.3 167744 12020 ?        Ss   21:00   0:01 /sbin/init',
      'root         402  0.0  0.1  10224  4096 ?        Ss   21:00   0:00 /usr/sbin/cron -f',
      'root         455  0.0  0.2  15432  8800 ?        Ss   21:00   0:00 sshd: /usr/sbin/sshd -D',
      'syslog       470  0.0  0.1 222400  5120 ?        Ssl  21:00   0:00 /usr/sbin/rsyslogd -n',
      `${u}    1337  0.0  0.1   8600  5300 pts/0    Ss   21:04   0:00 -bash`,
      `${u}    1402  0.0  0.0  10072  3300 pts/0    R+   21:06   0:00 ps aux`,
    ];
    for (const r of rows) c.out(r, r.startsWith('USER') ? 'dim' : 'out');
    return 0;
  },

  sort(c) {
    const { flags, rest } = splitShortFlags(c.args);
    const text = readText(c, rest, 'sort');
    if (text === null) return 2;
    let lines = splitLines(text);
    if (flags.has('n')) lines.sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b));
    else lines.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    if (flags.has('r')) lines = lines.reverse();
    for (const l of lines) c.out(l);
    return 0;
  },

  uniq(c) {
    const { flags, rest } = splitShortFlags(c.args);
    const text = readText(c, rest, 'uniq');
    if (text === null) return 1;
    const groups: [string, number][] = [];
    for (const l of splitLines(text)) {
      const last = groups[groups.length - 1];
      if (last && last[0] === l) last[1]++;
      else groups.push([l, 1]);
    }
    for (const [l, n] of groups) c.out(flags.has('c') ? `${String(n).padStart(7)} ${l}` : l);
    return 0;
  },

  cut(c) {
    let delim = '\t';
    let fields: number[] | null = null;
    const files: string[] = [];
    for (let i = 0; i < c.args.length; i++) {
      const a = c.args[i];
      if (a.startsWith('-d')) delim = a.length > 2 ? a.slice(2) : c.args[++i] ?? '';
      else if (a.startsWith('-f')) {
        const spec = a.length > 2 ? a.slice(2) : c.args[++i] ?? '';
        fields = spec.split(',').map(Number);
        if (fields.some((n) => !Number.isInteger(n) || n < 1)) {
          c.err(`cut: invalid field value '${spec}'`);
          return 1;
        }
      } else files.push(a);
    }
    if (delim.length !== 1) {
      c.err('cut: the delimiter must be a single character');
      return 1;
    }
    if (!fields) {
      c.err('cut: you must specify a list of bytes, characters, or fields');
      c.info('💡 Esempio: cut -d " " -f 3 file.txt  (terza colonna, separata da spazi)');
      return 1;
    }
    const text = readText(c, files, 'cut');
    if (text === null) return 1;
    for (const l of splitLines(text)) {
      const parts = l.split(delim);
      c.out(parts.length === 1 ? l : fields.map((f) => parts[f - 1]).filter((x) => x !== undefined).join(delim));
    }
    return 0;
  },

  flag(c) {
    const value = c.args.join(' ').trim();
    if (!value) {
      c.err('flag: scrivi la risposta dopo il comando, es: flag NC{...}');
      return 1;
    }
    c.emit({ type: 'answer', value });
    return 0;
  },

  hint(c) {
    const h = c.sh.hint?.();
    if (h) c.info(`💡 ${h}`);
    else c.info('Nessun obiettivo attivo in questo momento: segui il pannello della missione.');
    return 0;
  },

  ssh(c) {
    const target = c.args.find((a) => !a.startsWith('-'));
    if (!target) {
      c.err('usage: ssh [utente@]host');
      return 255;
    }
    const at = target.indexOf('@');
    const user = at >= 0 ? target.slice(0, at) : c.sh.user;
    const hostName = at >= 0 ? target.slice(at + 1) : target;
    const res = lookup(c.sh.net, hostName);
    if (!res) {
      c.err(`ssh: Could not resolve hostname ${hostName}: Name or service not known`);
      return 255;
    }
    if (res.host && !res.host.inScope) return outOfScope(c, hostName);
    const remote = c.sh.remotes.get(res.ip);
    if (!remote || !res.host?.ports.some((p) => p.port === 22)) {
      c.err(`ssh: connect to host ${hostName} port 22: Connection refused`);
      return 255;
    }
    if (!remote.users.includes(user)) {
      c.err(`${user}@${hostName}: Permission denied (publickey).`);
      c.info(`💡 Il contratto ti dà accesso solo come: ${remote.users.join(', ')}`);
      c.emit({ type: 'command', name: 'ssh-denied', args: [user, res.ip], ok: false });
      return 255;
    }
    c.sh.connect(remote, user);
    for (const l of remote.banner ?? [`Welcome to ${remote.hostname}`]) c.out(l, 'dim');
    c.info(`🔗 Sei collegato a ${remote.hostname}. Scrivi "exit" per tornare al tuo deck.`);
    c.emit({ type: 'ssh', host: remote.hostname, ip: res.ip, user });
    return 0;
  },

  report(c) {
    const value = c.args.join(' ').trim();
    if (!value) {
      c.err('report: indica cosa hai trovato, es: report /percorso/del/file');
      return 1;
    }
    c.emit({ type: 'report', value });
    return 0;
  },

  exit(c) {
    const host = c.sh.disconnect();
    if (host) {
      c.out('logout');
      c.out(`Connection to ${host} closed.`, 'dim');
      return 0;
    }
    c.info('Per tornare alla mappa usa il pulsante ◂ in alto a sinistra.');
    return 0;
  },
};

function applyMode(perms: string, mode: string): string | null {
  if (/^[0-7]{3}$/.test(mode)) {
    return mode
      .split('')
      .map((d) => {
        const n = Number(d);
        return (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-');
      })
      .join('');
  }
  const bits = perms.split('');
  for (const clause of mode.split(',')) {
    const m = clause.match(/^([ugoa]*)([+\-=])([rwx]*)$/);
    if (!m) return null;
    const who = m[1] === '' || m[1].includes('a') ? 'ugo' : m[1];
    for (const w of who) {
      const off = { u: 0, g: 3, o: 6 }[w as 'u' | 'g' | 'o'];
      ['r', 'w', 'x'].forEach((p, i) => {
        const has = m[3].includes(p);
        if (m[2] === '=') bits[off + i] = has ? p : '-';
        else if (has) bits[off + i] = m[2] === '+' ? p : '-';
      });
    }
  }
  return bits.join('');
}

function ufw(c: Ctx, root: boolean): number {
  if (!root) {
    c.err('ERROR: You need to be root to run this script');
    c.info('💡 Il firewall si gestisce come amministratore: prova con sudo davanti.');
    return 1;
  }
  const [sub, ...rest] = c.args;
  if (sub === 'status') {
    c.out('Status: active');
    c.out('');
    c.out('To                         Action      From');
    c.out('--                         ------      ----');
    c.out('22/tcp                     ALLOW       Anywhere');
    for (const ip of c.sh.firewall) c.out(`Anywhere                   DENY        ${ip}`, 'warn');
    return 0;
  }
  if ((sub === 'deny' || sub === 'allow') && rest[0] === 'from' && rest[1]) {
    const ip = rest[1];
    if (!isIp(ip)) {
      c.err(`ERROR: Bad source address`);
      return 1;
    }
    if (sub === 'deny') {
      if (!c.sh.firewall.includes(ip)) c.sh.firewall.push(ip);
    } else c.sh.firewall = c.sh.firewall.filter((x) => x !== ip);
    c.out('Rule added');
    c.emit({ type: 'firewall', action: sub, ip });
    return 0;
  }
  c.err(`ERROR: Invalid syntax`);
  c.info('💡 Esempi: sudo ufw status · sudo ufw deny from 203.0.113.77');
  return 1;
}

function copyMove(c: Ctx, which: 'cp' | 'mv'): number {
  const { flags, rest } = splitShortFlags(c.args);
  if (rest.length < 2) {
    c.err(`${which}: missing destination file operand`);
    c.info(`💡 Sintassi: ${which} ORIGINE DESTINAZIONE`);
    return 1;
  }
  const dest = rest[rest.length - 1];
  const sources = rest.slice(0, -1);
  const destAbs = c.sh.abs(dest);
  const destNode = c.sh.fs.get(destAbs);
  if (sources.length > 1 && destNode?.type !== 'dir') {
    c.err(`${which}: target '${dest}' is not a directory`);
    return 1;
  }
  for (const src of sources) {
    const sAbs = c.sh.abs(src);
    const node = c.sh.fs.get(sAbs);
    if (!node) {
      c.err(`${which}: cannot stat '${src}': No such file or directory`);
      return 1;
    }
    if (node.locked) {
      c.err(`${which}: cannot open '${src}' for reading: Permission denied`);
      return 1;
    }
    if (node.type === 'dir' && which === 'cp' && !flags.has('r') && !flags.has('R')) {
      c.err(`cp: -r not specified; omitting directory '${src}'`);
      return 1;
    }
    const target = destNode?.type === 'dir' ? `${destAbs}/${sAbs.slice(sAbs.lastIndexOf('/') + 1)}` : destAbs;
    if (target === sAbs || target.startsWith(sAbs + '/')) {
      c.err(`${which}: '${src}' and '${dest}' are the same file`);
      return 1;
    }
    if (!c.sh.canWrite(target) && !(c.sh.fs.get(target)?.type === 'file' && c.sh.fs.get(target)!.owner === c.sh.user)) {
      c.err(`${which}: cannot create '${dest}': Permission denied`);
      return 1;
    }
    const parent = c.sh.fs.get(dirnameOf(target));
    if (!parent || parent.type !== 'dir') {
      c.err(`${which}: cannot create '${dest}': No such file or directory`);
      return 1;
    }
    const clone = (n: VNode): VNode =>
      n.type === 'file'
        ? { ...n, owner: which === 'cp' ? c.sh.user : n.owner, group: which === 'cp' ? c.sh.user : n.group }
        : { ...n, children: new Map([...n.children].map(([k, v]) => [k, clone(v)])) };
    parent.children.set(target.slice(target.lastIndexOf('/') + 1), which === 'cp' ? clone(node) : node);
    if (which === 'mv') {
      const sp = c.sh.fs.get(dirnameOf(sAbs)) as DirNode;
      sp.children.delete(sAbs.slice(sAbs.lastIndexOf('/') + 1));
    }
    c.emit({ type: 'fsop', op: which, paths: [sAbs, target] });
  }
  return 0;
}

function testExpr(c: Ctx, a: string[]): number {
  const ok = (b: boolean) => (b ? 0 : 1);
  if (a[0] === '!') return 1 - testExpr(c, a.slice(1));
  if (a.length === 0) return 1;
  if (a.length === 1) return ok(a[0] !== '');
  if (a.length === 2) {
    const node = c.sh.fs.get(c.sh.abs(a[1]));
    switch (a[0]) {
      case '-f':
        return ok(node?.type === 'file');
      case '-d':
        return ok(node?.type === 'dir');
      case '-e':
        return ok(!!node);
      case '-z':
        return ok(a[1] === '');
      case '-n':
        return ok(a[1] !== '');
    }
  }
  if (a.length === 3) {
    const [x, op, y] = a;
    const nx = Number(x);
    const ny = Number(y);
    switch (op) {
      case '=':
      case '==':
        return ok(x === y);
      case '!=':
        return ok(x !== y);
      case '-eq':
        return ok(nx === ny);
      case '-ne':
        return ok(nx !== ny);
      case '-gt':
        return ok(nx > ny);
      case '-ge':
        return ok(nx >= ny);
      case '-lt':
        return ok(nx < ny);
      case '-le':
        return ok(nx <= ny);
    }
  }
  c.err(`test: espressione non riconosciuta: ${a.join(' ')}`);
  return 2;
}

export interface Site {
  headers: string[];
  pages: Record<string, { body: string; type?: string }>;
}

/** Registra un sito web simulato su un indirizzo IP (usato dalle Operazioni). */
export function addSite(ip: string, site: Site): void {
  WEB[ip] = site;
}

/** Siti web simulati, raggiungibili con curl. */
const WEB: Record<string, Site> = {
  '192.168.1.20': {
    headers: ['Server: Apache/2.4.29 (Ubuntu)', 'X-Powered-By: PHP/7.2.24'],
    pages: {
      '/': {
        body: [
          '<!DOCTYPE html>',
          '<html><head><title>Jukebox dello Scantinato</title></head>',
          '<body>',
          '  <h1>🎵 Jukebox dello Scantinato</h1>',
          '  <p>Scegli la prossima canzone!</p>',
          '  <a href="/playlist.php?id=1">Playlist della casa</a>',
          '  <!-- TODO: togliere il link al pannello prima di andare online: /pannello/ -->',
          '</body></html>',
        ].join('\n'),
      },
      '/robots.txt': {
        type: 'text/plain',
        body: ['User-agent: *', 'Disallow: /pannello/', 'Disallow: /backup/'].join('\n'),
      },
      '/playlist.php?id=1': {
        body: '<html><body><h2>Playlist della casa</h2><ul><li>Chippin\' In</li><li>Never Fade Away</li></ul></body></html>',
      },
    },
  },
  '192.168.1.1': {
    headers: ['Server: lighttpd/1.4.76'],
    pages: { '/': { body: '<html><body><h1>Router</h1><form>Password: <input type="password"></form></body></html>' } },
  },
};

function headTail(c: Ctx, which: 'head' | 'tail'): number {
  let n = 10;
  const files: string[] = [];
  for (let i = 0; i < c.args.length; i++) {
    const a = c.args[i];
    if (a === '-n') n = Number(c.args[++i]);
    else if (/^-\d+$/.test(a)) n = Number(a.slice(1));
    else files.push(a);
  }
  if (!Number.isInteger(n) || n < 0) {
    c.err(`${which}: invalid number of lines`);
    return 1;
  }
  const text = readText(c, files, which);
  if (text === null) return 1;
  const lines = splitLines(text);
  for (const l of which === 'head' ? lines.slice(0, n) : lines.slice(Math.max(0, lines.length - n))) c.out(l);
  return 0;
}

function outOfScope(c: Ctx, target: string): number {
  c.err(`[NC-ETICA] Scansione bloccata: "${target}" NON è nello scope del contratto.`);
  c.info('⚖️ Nel mondo reale, scansionare o entrare in sistemi senza autorizzazione scritta è illegale.');
  c.info('In Italia l\'accesso abusivo a un sistema informatico è punito dall\'art. 615-ter del Codice Penale.');
  c.info('Un ethical hacker lavora SOLO dentro il perimetro concordato. Rileggi scope.txt.');
  return 1;
}

