// Comandi di amministrazione e diagnostica: stato del sistema, servizi, log, rete.
// I dati sono simulati ma coerenti con il resto del deck.

import { DNS } from './osint';
import { lookup } from './network';
import { COMMANDS, readText, splitLines, type Ctx } from './shell';
import { parseOpts } from './coreutils';
import type { VNode } from './vfs';

const hostOf = (c: Ctx) => c.sh.host;

function sizeOf(c: Ctx, n: VNode): number {
  if (n.type === 'file') return c.sh.fs.size(n);
  let t = 4096;
  for (const ch of n.children.values()) t += sizeOf(c, ch);
  return t;
}

function human(n: number): string {
  if (n < 1024) return `${n}`;
  const u = ['K', 'M', 'G'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < 2) {
    v /= 1024;
    i++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)}${u[i]}`;
}

function uname(c: Ctx): number {
  const p = parseOpts(c.args, 'asrnmo', '');
  if (p.err) {
    c.err(`uname: ${p.err}`);
    return 1;
  }
  const parts: Record<string, string> = { s: 'Linux', n: hostOf(c), r: '6.8.0-nightos', m: 'x86_64', o: 'GNU/Linux' };
  if (p.f.has('a')) c.out(`Linux ${hostOf(c)} 6.8.0-nightos #1 SMP PREEMPT_DYNAMIC Thu Nov 12 2077 x86_64 GNU/Linux`);
  else c.out((['s', 'n', 'r', 'm', 'o'].filter((k) => p.f.has(k)).map((k) => parts[k]).join(' ')) || 'Linux');
  return 0;
}

function uptime(c: Ctx): number {
  c.out(' 21:04:00 up 3 days,  4:12,  1 user,  load average: 0.08, 0.11, 0.09');
  return 0;
}

function df(c: Ctx): number {
  const n = c.sh.fs.get(DISKS_FILE);
  const rows =
    n && n.type === 'file'
      ? splitLines(n.content).filter((l) => l.trim())
      : ['/dev/sda1        40G   12G   26G  32% /', 'tmpfs           2.0G     0  2.0G   0% /dev/shm', '/dev/sda2       100G   61G   34G  65% /var'];
  const h = c.args.some((a) => /^-\w*h/.test(a));
  const target = c.args.find((a) => !a.startsWith('-'));
  c.out('Filesystem      Size  Used Avail Use% Mounted on', 'dim');
  const toK = (v: string) => {
    const m = v.match(/^([\d.]+)([KMGT]?)$/);
    return m ? String(Math.round(parseFloat(m[1]) * 1024 ** ('KMGT'.indexOf(m[2] || 'K') ))) : v;
  };
  let shown = rows;
  if (target) {
    const abs = c.sh.abs(target);
    const mount = rows.map((r) => r.trim().split(/\s+/).pop()!).filter((m) => abs === m || abs.startsWith(m === '/' ? '/' : m + '/')).sort((a, b) => b.length - a.length)[0];
    shown = rows.filter((r) => r.trim().split(/\s+/).pop() === mount);
  }
  for (const r of shown) {
    const p = r.trim().split(/\s+/);
    const pct = parseInt(p[4], 10);
    const line = h ? r : `${p[0].padEnd(15)} ${[p[1], p[2], p[3]].map((x) => toK(x).padStart(10)).join(' ')} ${p[4].padStart(4)} ${p[5]}`;
    c.out(line, pct >= 90 ? 'bad' : pct >= 80 ? 'warn' : 'out');
  }
  return 0;
}

function du(c: Ctx): number {
  const p = parseOpts(c.args, 'shac', '');
  if (p.err) {
    c.err(`du: ${p.err}`);
    return 1;
  }
  const targets = p.rest.length ? p.rest : ['.'];
  const fmt = (n: number) => (p.f.has('h') ? human(n) : String(Math.ceil(n / 1024)));
  for (const t of targets) {
    const abs = c.sh.abs(t);
    const n = c.sh.fs.get(abs);
    if (!n || c.sh.blocked(abs)) {
      c.err(`du: cannot access '${t}': ${n ? 'Permission denied' : 'No such file or directory'}`);
      return 1;
    }
    if (p.f.has('s') || n.type === 'file') c.out(`${fmt(sizeOf(c, n))}\t${t}`);
    else {
      const walk = (node: VNode, shown: string) => {
        if (node.type !== 'dir') {
          if (p.f.has('a')) c.out(`${fmt(c.sh.fs.size(node))}\t${shown}`);
          return;
        }
        for (const [k, ch] of [...node.children.entries()].sort(([a], [b]) => a.localeCompare(b))) walk(ch, `${shown}/${k}`);
        c.out(`${fmt(sizeOf(c, node))}\t${shown}`);
      };
      walk(n, t);
    }
  }
  return 0;
}

function free(c: Ctx): number {
  const h = c.args.includes('-h');
  const m = (mb: number) => (h ? (mb >= 1024 ? `${(mb / 1024).toFixed(1)}Gi` : `${mb}Mi`) : String(mb * 1024));
  c.out('               total        used        free      shared  buff/cache   available', 'dim');
  c.out(`Mem:     ${[3944, 1203, 812, 24, 1929, 2514].map((x) => m(x).padStart(11)).join(' ')}`);
  c.out(`Swap:    ${[2048, 0, 2048].map((x) => m(x).padStart(11)).join(' ')}`);
  return 0;
}

function who(c: Ctx): number {
  c.out(`${c.sh.user}    pts/0        2077-11-12 21:04 (192.168.1.50)`);
  return 0;
}

function last(c: Ctx): number {
  const u = c.sh.user;
  c.out(`${u.padEnd(9)}pts/0        192.168.1.50     Thu Nov 12 21:04   still logged in`);
  c.out(`${u.padEnd(9)}pts/0        192.168.1.50     Wed Nov 11 18:02 - 19:45  (01:43)`);
  c.out('reboot   system boot  6.8.0-nightos    Mon Nov  9 16:52   still running');
  c.out('');
  c.out('wtmp begins Mon Nov  9 16:52:01 2077', 'dim');
  return 0;
}

function lastb(c: Ctx): number {
  if (c.sh.user !== 'root') {
    c.err('lastb: cannot open /var/log/btmp: Permission denied');
    c.info('💡 lastb elenca i login FALLITI (file /var/log/btmp): serve root. È uno dei primi comandi in un\'indagine su un brute force.');
    return 1;
  }
  if (c.sh.system) {
    c.out('admin    ssh:notty    198.51.100.66    Thu Nov 12 22:40 - 22:40  (00:00)');
    c.out('root     ssh:notty    198.51.100.66    Thu Nov 12 22:40 - 22:40  (00:00)');
  } else
    for (const [u, m] of [['git', '10:37'], ['postgres', '10:34'], ['ubuntu', '10:31'], ['admin', '10:28'], ['test', '10:25'], ['oracle', '10:22']])
      c.out(`${u.padEnd(9)}ssh:notty    45.155.205.33    Thu Nov 12 03:${m.slice(0, 2)} - 03:${m.slice(0, 2)}  (00:00)`);
  c.out('');
  c.out('btmp begins Thu Nov 12 00:00:09 2077', 'dim');
  return 0;
}

// ---------------------------------------------------------------- servizi e diario di sistema
//
// Lo stato dei servizi e il diario (journal) stanno in file del deck, così le missioni
// possono preparare un guasto e il giocatore può ripararlo davvero. Se i file non ci
// sono (server remoti delle Operazioni) si usano i valori predefiniti.

export const SVC_FILE = '/var/lib/nightos/servizi';
export const JOURNAL_FILE = '/var/log/journal/system.journal';
export const DISKS_FILE = '/var/lib/nightos/dischi';

export interface Unit {
  name: string;
  desc: string;
  /** active | failed | inactive */
  state: string;
  enabled: boolean;
  pid: number;
  mem: string;
  since: string;
}

const DEFAULT_UNITS: Unit[] = [
  { name: 'ssh', desc: 'OpenBSD Secure Shell server', state: 'active', enabled: true, pid: 455, mem: '5.4M', since: 'Mon 2077-11-09 16:52:11 CET; 3 days ago' },
  { name: 'cron', desc: 'Regular background program processing daemon', state: 'active', enabled: true, pid: 402, mem: '1.2M', since: 'Mon 2077-11-09 16:52:11 CET; 3 days ago' },
  { name: 'rsyslog', desc: 'System Logging Service', state: 'active', enabled: true, pid: 470, mem: '2.8M', since: 'Mon 2077-11-09 16:52:11 CET; 3 days ago' },
  { name: 'ufw', desc: 'Uncomplicated firewall', state: 'active', enabled: true, pid: 0, mem: '0B', since: 'Mon 2077-11-09 16:52:10 CET; 3 days ago' },
  { name: 'nginx', desc: 'A high performance web server and a reverse proxy server', state: 'active', enabled: true, pid: 601, mem: '6.1M', since: 'Mon 2077-11-09 16:52:12 CET; 3 days ago' },
];

/** "nome|descrizione|stato|enabled|pid|memoria|da quando" per riga. */
export function encodeUnits(units: Unit[]): string {
  return units.map((u) => [u.name, u.desc, u.state, u.enabled ? 'enabled' : 'disabled', u.pid, u.mem, u.since].join('|')).join('\n') + '\n';
}

function readUnits(c: Ctx): { units: Unit[]; stored: boolean } {
  const n = c.sh.fs.get(SVC_FILE);
  if (!n || n.type !== 'file') {
    const units = DEFAULT_UNITS.filter((u) => u.name !== 'nginx' || !c.sh.system || !!c.sh.system.listening?.some(([port]) => [80, 443, 8443].includes(port)));
    return { units: units.map((u) => ({ ...u })), stored: false };
  }
  const units = splitLines(n.content)
    .filter((l) => l.includes('|'))
    .map((l) => {
      const [name, desc, state, en, pid, mem, since] = l.split('|');
      return { name, desc, state, enabled: en === 'enabled', pid: Number(pid) || 0, mem, since };
    });
  return { units, stored: true };
}

function writeUnits(c: Ctx, units: Unit[]): void {
  const n = c.sh.fs.get(SVC_FILE);
  if (n && n.type === 'file') n.content = encodeUnits(units);
}

/** Una voce del diario: priorità (0 emerg ... 7 debug) e riga in formato syslog. */
interface JEntry {
  prio: number;
  line: string;
}

const PRIOS = ['emerg', 'alert', 'crit', 'err', 'warning', 'notice', 'info', 'debug'];

function defaultJournal(c: Ctx): JEntry[] {
  const h = hostOf(c);
  const rows: [number, string, string][] = [
    [6, 'sshd', 'Accepted publickey for ' + c.sh.user + ' from 192.168.1.50 port 50122 ssh2'],
    [6, 'cron', 'pam_unix(cron:session): session opened for user root by (uid=0)'],
    [5, 'sshd', 'Failed password for invalid user admin from 198.51.100.9 port 40122 ssh2'],
    [5, 'sshd', 'Failed password for root from 198.51.100.9 port 40123 ssh2'],
    [6, 'systemd', 'Started Daily apt download activities.'],
    [5, 'sudo', `${c.sh.user} : TTY=pts/0 ; PWD=/home/${c.sh.user} ; USER=root ; COMMAND=/usr/sbin/ufw status`],
    [6, 'sshd', 'Received disconnect from 198.51.100.9 port 40123:11: Bye Bye'],
    [6, 'kernel', 'eth0: link up, 1000Mbps, full-duplex'],
    [6, 'nginx', '10.0.3.4 "GET / HTTP/1.1" 200'],
    [6, 'cron', '(root) CMD (run-parts /etc/cron.hourly)'],
  ];
  return rows.map(([prio, prog, msg], i) => ({ prio, line: `Nov 12 21:0${i % 10}:0${i % 10} ${h} ${prog}[${400 + i * 31}]: ${msg}` }));
}

function readJournal(c: Ctx): JEntry[] {
  const n = c.sh.fs.get(JOURNAL_FILE);
  if (!n || n.type !== 'file') return defaultJournal(c);
  return splitLines(n.content)
    .filter((l) => /^\d\|/.test(l))
    .map((l) => ({ prio: Number(l[0]), line: l.slice(2) }));
}

let clock = 0;
/** Aggiunge voci al diario (solo se il diario è un file del deck). */
function journalAppend(c: Ctx, entries: [number, string, string][]): void {
  const n = c.sh.fs.get(JOURNAL_FILE);
  if (!n || n.type !== 'file') return;
  const sec = String(10 + (clock++ % 50)).padStart(2, '0');
  n.content += entries.map(([prio, prog, msg]) => `${prio}|Nov 12 21:04:${sec} ${hostOf(c)} ${prog}: ${msg}\n`).join('');
}

const PROG_OF: Record<string, string> = { ssh: 'sshd', sshd: 'sshd', cron: 'cron', nginx: 'nginx', sudo: 'sudo', rsyslog: 'rsyslogd', ufw: 'ufw', backup: 'backup.sh' };

function unitMatches(unit: string, line: string): boolean {
  const prog = line.replace(/^\S+ +\d+ [\d:]+ \S+ /, '').split(/[[:]/)[0];
  return prog === (PROG_OF[unit] ?? unit) || line.includes(`${unit}.service`);
}

/** Errori di configurazione di nginx (un controllo minimo, come "nginx -t"). */
export function nginxConfigError(c: Ctx): string | null {
  const dir = c.sh.fs.get('/etc/nginx/sites-enabled');
  if (!dir || dir.type !== 'dir') return null;
  const KNOWN = new Set(['server', 'listen', 'server_name', 'root', 'index', 'location', 'try_files', 'access_log', 'error_log', 'return', 'proxy_pass', 'add_header', 'ssl_certificate', 'ssl_certificate_key', 'autoindex', 'deny', 'allow']);
  for (const [name, f] of dir.children) {
    if (f.type !== 'file') continue;
    const lines = f.content.split('\n');
    let depth = 0;
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].replace(/#.*/, '').trim();
      if (!t) continue;
      const where = `in /etc/nginx/sites-enabled/${name}:${i + 1}`;
      if (t === '}') {
        depth--;
        continue;
      }
      const word = t.split(/\s+/)[0].replace(/[;{]$/, '');
      if (!KNOWN.has(word)) return `unknown directive "${word}" ${where}`;
      if (t.endsWith('{')) depth++;
      else if (!t.endsWith(';')) return `directive "${word}" is not terminated by ";" ${where}`;
    }
    if (depth !== 0) return `unexpected end of file, expecting "}" in /etc/nginx/sites-enabled/${name}:${lines.length}`;
  }
  return null;
}

function unitStatus(c: Ctx, u: Unit): void {
  const failed = u.state === 'failed';
  c.out(`${failed ? '×' : u.state === 'active' ? '●' : '○'} ${u.name}.service - ${u.desc}`, failed ? 'bad' : u.state === 'active' ? 'ok' : 'out');
  c.out(`     Loaded: loaded (/lib/systemd/system/${u.name}.service; ${u.enabled ? 'enabled' : 'disabled'}; vendor preset: enabled)`);
  if (u.state === 'active') c.out(`     Active: active (${u.name === 'ufw' ? 'exited' : 'running'}) since ${u.since}`, 'ok');
  else if (failed) c.out(`     Active: failed (Result: exit-code) since ${u.since}`, 'bad');
  else c.out(`     Active: inactive (dead) since ${u.since}`);
  if (u.pid && u.state === 'active') c.out(`   Main PID: ${u.pid} (${PROG_OF[u.name] ?? u.name})`);
  if (u.state === 'active') c.out(`     Memory: ${u.mem}`);
  const tail = readJournal(c)
    .filter((e) => unitMatches(u.name, e.line))
    .slice(-5);
  if (tail.length) {
    c.out('');
    for (const e of tail) c.out(e.line, e.prio <= 3 ? 'bad' : e.prio === 4 ? 'warn' : 'out');
  }
}

function systemctl(c: Ctx, asRoot = false): number {
  const flags = c.args.filter((a) => a.startsWith('--'));
  const [sub0, ...rest] = c.args.filter((a) => !a.startsWith('--'));
  const sub = flags.includes('--failed') && !sub0 ? 'list-units' : sub0;
  const name = (rest[0] ?? '').replace(/\.service$/, '');
  const { units, stored } = readUnits(c);
  if (!sub) {
    c.err("systemctl: serve un'azione (status, is-active, list-units, restart...)");
    return 1;
  }
  if (sub === 'list-units' || sub === 'list-unit-files') {
    const stateF = flags.find((f) => f.startsWith('--state='))?.split('=')[1] ?? (flags.includes('--failed') ? 'failed' : '');
    const shown = units.filter((u) => !stateF || u.state === stateF || (stateF === 'running' && u.state === 'active'));
    if (sub === 'list-unit-files') {
      c.out('UNIT FILE              STATE', 'dim');
      for (const u of units) c.out(`${(u.name + '.service').padEnd(23)}${u.enabled ? 'enabled' : 'disabled'}`);
      return 0;
    }
    c.out('  UNIT                LOAD   ACTIVE   SUB     DESCRIPTION', 'dim');
    for (const u of shown) {
      const subS = u.state === 'active' ? (u.name === 'ufw' ? 'exited ' : 'running') : u.state === 'failed' ? 'failed ' : 'dead   ';
      c.out(`${u.state === 'failed' ? '●' : ' '} ${(u.name + '.service').padEnd(19)} loaded ${u.state.padEnd(8)} ${subS} ${u.desc}`, u.state === 'failed' ? 'bad' : 'out');
    }
    c.out('');
    c.out(`${shown.length} loaded units listed.`, 'dim');
    c.emit({ type: 'command', name: 'systemctl-list', args: [stateF], ok: true });
    return 0;
  }
  const u = units.find((x) => x.name === name);
  if (!u) {
    c.err(`${sub === 'status' ? 'Unit ' : 'Failed to ' + sub + ' '}${name || '?'}.service ${sub === 'status' ? 'could not be found.' : 'not found.'}`);
    return sub === 'status' ? 4 : 5;
  }
  if (sub === 'is-active') {
    c.out(u.state === 'active' ? 'active' : u.state);
    return u.state === 'active' ? 0 : 3;
  }
  if (sub === 'is-enabled') {
    c.out(u.enabled ? 'enabled' : 'disabled');
    return u.enabled ? 0 : 1;
  }
  if (sub === 'status') {
    unitStatus(c, u);
    c.emit({ type: 'command', name: 'systemctl-status', args: [name], ok: true });
    return u.state === 'active' ? 0 : 3;
  }
  if (['start', 'stop', 'restart', 'enable', 'disable', 'reload'].includes(sub)) {
    if (c.sh.user !== 'root' && !asRoot) {
      c.err(`Failed to ${sub} ${name}.service: Interactive authentication required.`);
      c.info('💡 Gestire i servizi richiede privilegi di amministratore: sudo systemctl ' + sub + ' ' + name);
      return 1;
    }
    if (!stored) return 0;
    if (sub === 'enable' || sub === 'disable') {
      u.enabled = sub === 'enable';
      writeUnits(c, units);
      c.out(sub === 'enable' ? `Created symlink /etc/systemd/system/multi-user.target.wants/${name}.service → /lib/systemd/system/${name}.service.` : `Removed /etc/systemd/system/multi-user.target.wants/${name}.service.`);
      return 0;
    }
    if (sub === 'stop') {
      u.state = 'inactive';
      u.since = 'Thu 2077-11-12 21:04:00 CET; 1s ago';
      writeUnits(c, units);
      journalAppend(c, [[6, 'systemd[1]', `Stopped ${u.name}.service - ${u.desc}.`]]);
      c.emit({ type: 'command', name: 'systemctl-stop', args: [name], ok: true });
      return 0;
    }
    const err = name === 'nginx' ? nginxConfigError(c) : null;
    if (err) {
      u.state = 'failed';
      u.since = 'Thu 2077-11-12 21:04:00 CET; 1s ago';
      writeUnits(c, units);
      journalAppend(c, [
        [2, 'nginx[3110]', `nginx: [emerg] ${err}`],
        [3, 'nginx[3110]', 'nginx: configuration file /etc/nginx/nginx.conf test failed'],
        [3, 'systemd[1]', `nginx.service: Control process exited, code=exited, status=1/FAILURE`],
        [3, 'systemd[1]', `Failed to start ${u.name}.service - ${u.desc}.`],
      ]);
      c.err(`Job for ${name}.service failed because the control process exited with error code.`);
      c.err(`See "systemctl status ${name}.service" and "journalctl -xeu ${name}.service" for details.`);
      c.emit({ type: 'command', name: `systemctl-${sub}`, args: [name], ok: false });
      return 1;
    }
    u.state = 'active';
    u.pid = u.pid || 3120;
    u.since = 'Thu 2077-11-12 21:04:00 CET; 1s ago';
    writeUnits(c, units);
    journalAppend(c, [[6, 'systemd[1]', `Started ${u.name}.service - ${u.desc}.`]]);
    c.emit({ type: 'command', name: `systemctl-${sub}`, args: [name], ok: true });
    return 0;
  }
  c.err(`Unknown command verb ${sub}.`);
  return 1;
}

/** Orario "HH:MM[:SS]" di una riga syslog, in secondi dalla mezzanotte. */
function secsOf(line: string): number {
  const m = line.match(/^\S+ +\d+ (\d\d):(\d\d):(\d\d)/);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
}

function parseClock(s: string): number | null {
  const m = s.match(/(\d{1,2}):(\d\d)(?::(\d\d))?$/);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] ?? 0) : null;
}

function journalctl(c: Ctx): number {
  const args = c.args;
  let unit = '';
  let n = Infinity;
  let prio = 7;
  let reverse = false;
  let since: number | null = null;
  let until: number | null = null;
  let grepS = '';
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const val = () => args[++i] ?? '';
    if (a === '-u' || a === '--unit') unit = val().replace(/\.service$/, '');
    else if (a.startsWith('--unit=')) unit = a.slice(7).replace(/\.service$/, '');
    else if (a === '-n' || a === '--lines') n = Number(val());
    else if (/^-n\d+$/.test(a)) n = Number(a.slice(2));
    else if (a === '-e') n = Math.min(n, 30);
    else if (a === '-p' || a === '--priority') {
      const v = val();
      prio = /^\d$/.test(v) ? Number(v) : PRIOS.indexOf(v.split('..').pop()!);
      if (prio < 0) {
        c.err(`Failed to parse priority value: ${v}`);
        return 1;
      }
    } else if (a === '-r' || a === '--reverse') reverse = true;
    else if (a === '-g' || a === '--grep') grepS = val();
    else if (a === '--since' || a === '-S') since = parseClock(val());
    else if (a === '--until' || a === '-U') until = parseClock(val());
    else if (a.startsWith('--since=')) since = parseClock(a.slice(8));
    else if (a === '-x' || a === '-xe' || a === '-xeu' || a === '--no-pager' || a === '-f') {
      if (a === '-xeu') unit = val().replace(/\.service$/, '');
      if (a.includes('e')) n = Math.min(n, 30);
    }
  }
  let rows = readJournal(c).filter(
    (e) =>
      e.prio <= prio &&
      (!unit || unitMatches(unit, e.line)) &&
      (since === null || secsOf(e.line) >= since) &&
      (until === null || secsOf(e.line) <= until) &&
      (!grepS || e.line.toLowerCase().includes(grepS.toLowerCase())),
  );
  if (Number.isFinite(n)) rows = rows.slice(-Math.max(1, n));
  if (reverse) rows = [...rows].reverse();
  c.out('-- Journal begins at Mon 2077-11-09 16:52:01 CET --', 'dim');
  if (!rows.length) {
    c.out('-- No entries --', 'dim');
    return 0;
  }
  for (const e of rows) c.out(e.line, e.prio <= 3 ? 'bad' : e.prio === 4 ? 'warn' : 'out');
  c.emit({ type: 'command', name: 'journalctl-ok', args: [unit, String(prio), since === null ? '' : String(since)], ok: true });
  return 0;
}

function nginxCmd(c: Ctx): number {
  if (!c.args.includes('-t')) {
    c.err('nginx: in questo deck si usa solo "nginx -t" (controllo della configurazione); il servizio si gestisce con systemctl.');
    return 1;
  }
  if (!c.sh.fs.get('/etc/nginx')) {
    c.err('nginx: command not found');
    return 127;
  }
  const err = nginxConfigError(c);
  if (err) {
    c.err(`nginx: [emerg] ${err}`);
    c.err('nginx: configuration file /etc/nginx/nginx.conf test failed');
    return 1;
  }
  c.out('nginx: the configuration file /etc/nginx/nginx.conf syntax is ok');
  c.out('nginx: configuration file /etc/nginx/nginx.conf test is successful', 'ok');
  c.emit({ type: 'command', name: 'nginx-t-ok', args: [], ok: true });
  return 0;
}

function crontab(c: Ctx): number {
  if (!c.args.includes('-l')) {
    c.err('crontab: in questo deck usa: crontab -l');
    return 1;
  }
  const path = `/var/spool/cron/crontabs/${c.sh.user}`;
  const node = c.sh.fs.get(path);
  if (!node || node.type !== 'file') {
    c.err(`no crontab for ${c.sh.user}`);
    return 1;
  }
  for (const l of splitLines(node.content)) c.out(l);
  return 0;
}

function netstat(c: Ctx): number {
  const list: [number, string][] = c.sh.system?.listening ?? [[22, 'sshd']];
  c.out('Active Internet connections (only servers)', 'dim');
  c.out('Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name', 'dim');
  list.forEach(([port, proc], i) => c.out(`tcp        0      0 0.0.0.0:${String(port).padEnd(15)} 0.0.0.0:*               LISTEN      ${400 + i * 37}/${proc}`));
  c.emit({ type: 'command', name: 'ss-ok', args: list.map(([x]) => String(x)), ok: true });
  return 0;
}

function traceroute(c: Ctx): number {
  const target = c.args.find((a) => !a.startsWith('-'));
  if (!target) {
    c.err('Usage: traceroute host');
    return 1;
  }
  const res = lookup(c.sh.net, target);
  if (!res) {
    c.err(`${target}: Name or service not known`);
    return 2;
  }
  c.out(`traceroute to ${target} (${res.ip}), 30 hops max, 60 byte packets`);
  if (res.ip.startsWith('192.168.1.')) c.out(` 1  ${res.host?.names[0] ?? res.ip} (${res.ip})  ${(res.host?.latency ?? 2).toFixed(3)} ms  ${(res.host?.latency ?? 2).toFixed(3)} ms`);
  else {
    c.out(` 1  gateway.lan (${c.sh.net.gateway})  1.214 ms  1.180 ms`);
    c.out(' 2  10.254.0.1 (10.254.0.1)  8.402 ms  8.377 ms');
    c.out(' 3  * * *');
    c.out(` 4  ${target} (${res.ip})  ${((res.host?.latency ?? 30) + 6).toFixed(3)} ms  ${((res.host?.latency ?? 30) + 6.2).toFixed(3)} ms`);
  }
  c.info('💡 Ogni riga è un "salto" (router). Gli asterischi * indicano router che non rispondono: spesso un firewall.');
  return 0;
}

function nslookup(c: Ctx): number {
  const name = c.args[0]?.toLowerCase();
  if (!name) {
    c.err('Usage: nslookup nome');
    return 1;
  }
  c.out(`Server:\t\t${c.sh.net.gateway}`);
  c.out(`Address:\t${c.sh.net.gateway}#53\n`);
  const lan = lookup(c.sh.net, name);
  const zone = DNS[name];
  if (lan && lan.host) {
    c.out('Non-authoritative answer:', 'dim');
    c.out(`Name:\t${name}`);
    c.out(`Address: ${lan.ip}`);
    return 0;
  }
  if (zone?.A?.length) {
    c.out('Non-authoritative answer:', 'dim');
    for (const a of zone.A) {
      c.out(`Name:\t${name}`);
      c.out(`Address: ${a}`);
    }
    return 0;
  }
  c.err(`** server can't find ${name}: NXDOMAIN`);
  return 1;
}

function nc(c: Ctx): number {
  const args = c.args.filter((a) => !a.startsWith('-'));
  const [target, portS] = args;
  const port = Number(portS);
  if (!c.args.some((a) => /^-[zv]+$/.test(a) && a.includes('z')) || !target || !Number.isInteger(port)) {
    c.err('Usage: nc -zv HOST PORTA');
    c.info('💡 In questo deck nc serve a verificare se una porta è aperta: nc -zv jukebox.lan 22');
    return 1;
  }
  const res = lookup(c.sh.net, target);
  if (!res) {
    c.err(`nc: getaddrinfo for host "${target}" port ${port}: Name or service not known`);
    return 1;
  }
  if (res.host && !res.host.inScope) {
    c.err(`[NC-ETICA] "${target}" NON è nello scope del contratto: connessione bloccata.`);
    return 1;
  }
  const open = res.host?.ports.find((x) => x.port === port);
  if (open) {
    c.out(`Connection to ${target} (${res.ip}) ${port} port [tcp/${open.service}] succeeded!`, 'ok');
    c.emit({ type: 'command', name: 'nc-open', args: [target, String(port)], ok: true });
    return 0;
  }
  c.err(`nc: connect to ${target} (${res.ip}) port ${port} (tcp) failed: Connection refused`);
  return 1;
}

function lsbRelease(c: Ctx): number {
  c.out('Distributor ID:\tNightOS');
  c.out('Description:\tNightOS 2077 (basato su Debian GNU/Linux)');
  c.out('Release:\t2077');
  return 0;
}

function readFileCmd(c: Ctx): number {
  const t = readText(c, c.args, 'strings');
  if (t === null) return 1;
  for (const l of splitLines(t)) for (const w of l.match(/[\x20-\x7e]{4,}/g) ?? []) c.out(w);
  return 0;
}

Object.assign(COMMANDS, {
  uname,
  uptime,
  df,
  du,
  free,
  who,
  w: who,
  last,
  lastb,
  systemctl: (c: Ctx) => systemctl(c),
  journalctl,
  nginx: nginxCmd,
  crontab,
  netstat,
  traceroute,
  nslookup,
  nc,
  lsb_release: lsbRelease,
  strings: readFileCmd,
});

export { systemctl as systemctlCmd, journalctl as journalctlCmd };
