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
  c.out('Filesystem      Size  Used Avail Use% Mounted on', 'dim');
  c.out('/dev/sda1        40G   12G   26G  32% /');
  c.out('tmpfs           2.0G     0  2.0G   0% /dev/shm');
  c.out('/dev/sda2       100G   61G   34G  65% /var');
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
  c.out('admin    ssh:notty    198.51.100.66    Thu Nov 12 22:40 - 22:40  (00:00)');
  c.out('root     ssh:notty    198.51.100.66    Thu Nov 12 22:40 - 22:40  (00:00)');
  c.out('');
  c.out('btmp begins Thu Nov 12 00:00:09 2077', 'dim');
  return 0;
}

const SERVICES: Record<string, { desc: string; pid: number; mem: string }> = {
  ssh: { desc: 'OpenBSD Secure Shell server', pid: 455, mem: '5.4M' },
  cron: { desc: 'Regular background program processing daemon', pid: 402, mem: '1.2M' },
  rsyslog: { desc: 'System Logging Service', pid: 470, mem: '2.8M' },
  ufw: { desc: 'Uncomplicated firewall', pid: 0, mem: '0B' },
  nginx: { desc: 'A high performance web server and a reverse proxy server', pid: 601, mem: '6.1M' },
};

function systemctl(c: Ctx): number {
  const [sub, ...rest] = c.args.filter((a) => !a.startsWith('--no-'));
  const name = (rest[0] ?? '').replace(/\.service$/, '');
  const svcs = Object.keys(SERVICES).filter((s) => s !== 'nginx' || !!c.sh.system?.listening?.some(([port]) => [80, 443, 8443].includes(port)) || c.sh.system === null);
  if (!sub) {
    c.err('systemctl: serve un\'azione (status, is-active, list-units, restart...)');
    return 1;
  }
  if (sub === 'list-units' || sub === 'list-unit-files') {
    c.out('  UNIT                LOAD   ACTIVE SUB     DESCRIPTION', 'dim');
    for (const s of svcs) c.out(`  ${(s + '.service').padEnd(19)} loaded active ${s === 'ufw' ? 'exited ' : 'running'} ${SERVICES[s].desc}`);
    return 0;
  }
  if (!SERVICES[name] || !svcs.includes(name)) {
    c.err(`${sub === 'status' ? 'Unit' : 'Failed to ' + sub + ' '}${name || '?'}.service ${sub === 'status' ? 'could not be found.' : 'not found.'}`);
    return sub === 'status' ? 4 : 5;
  }
  if (sub === 'is-active') {
    c.out('active');
    return 0;
  }
  if (sub === 'status') {
    const s = SERVICES[name];
    c.out(`● ${name}.service - ${s.desc}`, 'ok');
    c.out(`     Loaded: loaded (/lib/systemd/system/${name}.service; enabled; vendor preset: enabled)`);
    c.out('     Active: active (running) since Mon 2077-11-09 16:52:11 CET; 3 days ago', 'ok');
    if (s.pid) c.out(`   Main PID: ${s.pid} (${name === 'ssh' ? 'sshd' : name})`);
    c.out(`     Memory: ${s.mem}`);
    c.emit({ type: 'command', name: 'systemctl-status', args: [name], ok: true });
    return 0;
  }
  if (['start', 'stop', 'restart', 'enable', 'disable', 'reload'].includes(sub)) {
    if (c.sh.user !== 'root') {
      c.err(`Failed to ${sub} ${name}.service: Interactive authentication required.`);
      c.info('💡 Gestire i servizi richiede privilegi di amministratore (root o sudo).');
      return 1;
    }
    return 0;
  }
  c.err(`Unknown command verb ${sub}.`);
  return 1;
}

function journalctl(c: Ctx): number {
  const p = parseOpts([], '', '');
  const args = c.args;
  let unit = '';
  let n = 10;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-u') unit = (args[++i] ?? '').replace(/\.service$/, '');
    else if (args[i] === '-n') n = Number(args[++i]);
    else if (/^-n\d+$/.test(args[i])) n = Number(args[i].slice(2));
  }
  void p;
  const h = hostOf(c);
  const all: [string, string][] = [
    ['sshd', 'Accepted publickey for ' + c.sh.user + ' from 192.168.1.50 port 50122 ssh2'],
    ['cron', `pam_unix(cron:session): session opened for user root by (uid=0)`],
    ['sshd', 'Failed password for invalid user admin from 198.51.100.9 port 40122 ssh2'],
    ['sshd', 'Failed password for root from 198.51.100.9 port 40123 ssh2'],
    ['systemd', 'Started Daily apt download activities.'],
    ['sudo', `${c.sh.user} : TTY=pts/0 ; PWD=/home/${c.sh.user} ; USER=root ; COMMAND=/usr/sbin/ufw status`],
    ['sshd', 'Received disconnect from 198.51.100.9 port 40123:11: Bye Bye'],
    ['kernel', 'eth0: link up, 1000Mbps, full-duplex'],
    ['nginx', '10.0.3.4 "GET / HTTP/1.1" 200'],
    ['cron', '(root) CMD (run-parts /etc/cron.hourly)'],
  ];
  const map: Record<string, string> = { ssh: 'sshd', sshd: 'sshd', cron: 'cron', nginx: 'nginx', sudo: 'sudo' };
  const rows = all.filter(([prog]) => !unit || prog === (map[unit] ?? unit));
  if (unit && !rows.length) {
    c.out('-- No entries --', 'dim');
    return 0;
  }
  c.out(`-- Journal begins at Mon 2077-11-09 16:52:01 CET --`, 'dim');
  rows.slice(-Math.max(1, n || 10)).forEach(([prog, msg], i) => c.out(`Nov 12 21:0${i % 10}:0${i % 10} ${h} ${prog}[${400 + i * 31}]: ${msg}`));
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
  systemctl,
  journalctl,
  crontab,
  netstat,
  traceroute,
  nslookup,
  nc,
  lsb_release: lsbRelease,
  strings: readFileCmd,
});
