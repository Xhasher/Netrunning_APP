// Una shell finta che imita bash. Interpreta la riga, esegue i comandi sul
// filesystem virtuale e sulla rete simulata, ed emette eventi per le missioni.

import { ALIASES, MANPAGES } from './manpages';
import { displayName, hostsInRange, isIp, lookup, type Host, type Network } from './network';
import type { Line, LineClass, RunResult, ShellEvent } from './types';
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
}

type Command = (c: Ctx) => number;

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

type Token = { t: string; pipe?: boolean };

function tokenize(line: string): Token[] | { error: string } {
  const tokens: Token[] = [];
  let cur = '';
  let has = false;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === '\\' && quote === '"' && i + 1 < line.length) cur += line[++i];
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      has = true;
    } else if (ch === '\\' && i + 1 < line.length) {
      cur += line[++i];
      has = true;
    } else if (ch === ' ' || ch === '\t') {
      if (has) tokens.push({ t: cur });
      cur = '';
      has = false;
    } else if (ch === '|') {
      if (has) tokens.push({ t: cur });
      cur = '';
      has = false;
      tokens.push({ t: '|', pipe: true });
    } else {
      cur += ch;
      has = true;
    }
  }
  if (quote) return { error: `bash: unexpected EOF while looking for matching \`${quote}'` };
  if (has) tokens.push({ t: cur });
  return tokens;
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

  run(input: string): RunResult {
    const line = input.trim();
    const result: RunResult = { lines: [], events: [] };
    if (!line) return result;
    this.history.push(line);

    const tokens = tokenize(line);
    if ('error' in tokens) {
      result.lines.push({ text: tokens.error, cls: 'err' });
      return result;
    }

    const segments: string[][] = [[]];
    for (const tok of tokens) {
      if (tok.pipe) segments.push([]);
      else segments[segments.length - 1].push(tok.t);
    }
    if (segments.some((s) => s.length === 0)) {
      result.lines.push({ text: "bash: syntax error near unexpected token `|'", cls: 'err' });
      return result;
    }

    let stdin: string | null = null;
    segments.forEach((seg, idx) => {
      const isLast = idx === segments.length - 1;
      const produced: OutLine[] = [];
      const typed = seg[0];
      const name = ALIASES[typed] ?? typed;
      const args = seg.slice(1);
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
            text: near.length
              ? `💡 Forse intendevi "${near[0][0]}"?`
              : '💡 Scrivi "help" per vedere i comandi disponibili.',
            cls: 'info',
            stream: 'err',
          });
        }
        result.events.push({ type: 'command', name: typed, args, ok: false });
      } else {
        const ctx: Ctx = {
          sh: this,
          name,
          args,
          stdin,
          out: (text, cls, delay) => produced.push({ text, cls: cls ?? 'out', delay, stream: 'out' }),
          err: (text) => produced.push({ text, cls: 'err', stream: 'err' }),
          info: (text) => produced.push({ text, cls: 'info', stream: 'err' }),
          emit: (ev) => result.events.push(ev),
          clear: () => {
            result.clear = true;
            result.lines = [];
          },
        };
        let code = 1;
        try {
          code = cmd(ctx);
        } catch (e) {
          ctx.err(`${name}: errore interno (${(e as Error).message})`);
        }
        result.events.push({ type: 'command', name, args, ok: code === 0 });
      }

      for (const l of produced) {
        if (l.stream === 'err' || isLast) result.lines.push({ text: l.text, cls: l.cls, delay: l.delay });
      }
      stdin = produced
        .filter((l) => l.stream === 'out')
        .map((l) => l.text + '\n')
        .join('');
    });
    return result;
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
    if (!node) {
      c.err(`${cmdName}: ${f}: No such file or directory`);
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
        c.out(flags.has('n') ? `${i + 1}:${l}` : l);
      }
    });
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

  sudo(c) {
    c.err(`${c.sh.user} is not in the sudoers file.  This incident will be reported.`);
    c.info('💡 Il tuo utente non ha i privilegi di amministratore (root). Ottenerli è la "privilege escalation": la vedremo nei capitoli avanzati.');
    return 1;
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

  exit(c) {
    c.info('Per tornare alla mappa usa il pulsante ◂ in alto a sinistra.');
    return 0;
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

