// Esercizi aggiunti ai primi capitoli: "interpreta l'output" (leggere cosa ha risposto
// il sistema e capirlo) e "correggi l'errore" (un comando sbagliato, come quelli che
// scriverai davvero, da sistemare). Si aggiungono a quelli che c'erano: nessuno viene tolto.
// Vanno prima delle domande di verifica finali di ogni missione.

import type { Chapter, QuizStep, Step, TaskStep } from '../game/types';
import { LEVELS_VER } from './schede';

const V = LEVELS_VER;

const interpreta = (q: Omit<QuizStep, 'kind' | 'ex' | 'since'>): QuizStep => ({ kind: 'quiz', ex: 'interpreta', since: V, ...q });
const correggi = (t: Omit<TaskStep, 'kind' | 'ex' | 'since'>): TaskStep => ({ kind: 'task', ex: 'correggi', since: V, ...t });

export const EXTRA: Record<string, Step[]> = {
  'ch01-m2': [
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['pwd', 'cd'],
      question: `Un collega ha scritto questi comandi. Cosa stampa l'**ultimo** pwd?

\`\`\`
$ pwd
/home/edge/missioni
$ cd ..
$ pwd
\`\`\``,
      options: ['/home/edge', '/home', '/home/edge/missioni/..', '/'],
      correct: 0,
      explain: '`..` è la cartella genitore: da `/home/edge/missioni` si sale a `/home/edge`. `pwd` stampa sempre il percorso "pulito", senza `..`.',
    }),
    correggi({
      title: 'Correggi l\'errore',
      body: `Un collega vuole entrare nella cartella \`/etc\` e scrive:

\`\`\`
cd/etc
\`\`\`

Il terminale risponde: \`bash: cd/etc: No such file or directory\`. Per bash \`cd/etc\` è **una parola sola**: non sa dove finisce il comando e dove inizia il percorso.`,
      objective: 'Scrivi il comando giusto ed entra in /etc.',
      hints: ['Tra il comando e il suo argomento ci vuole uno spazio.', 'cd /etc'],
      check: (ev) => ev.type === 'cd' && ev.path === '/etc',
      solve: ['cd /etc'],
      success: 'Lo spazio separa il comando dai suoi argomenti. È l\'errore più comune all\'inizio: quando un comando "non esiste", controlla prima gli spazi.',
    }),
  ],
  'ch01-m3': [
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['ls'],
      question: `Questo è l'output di \`ls -a missioni\`. Quanti **file nascosti veri** contiene la cartella?

\`\`\`
.  ..  .nota_segreta  benvenuto.txt  lista_spesa.txt
\`\`\``,
      options: ['1', '3', '0', '2'],
      correct: 0,
      explain: '`.` e `..` non sono file: sono i riferimenti alla cartella stessa e a quella sopra, e compaiono in ogni cartella. L\'unico file nascosto vero è `.nota_segreta`.',
    }),
    correggi({
      title: 'Correggi l\'errore',
      body: `Il file \`missioni/benvenuto.txt\` esiste (l'hai appena letto), eppure questo comando fallisce:

\`\`\`
cat missioni/Benvenuto.txt
\`\`\`

Risposta: \`cat: missioni/Benvenuto.txt: No such file or directory\`.`,
      objective: 'Trova l\'errore e leggi il file con il nome giusto.',
      hints: ['Confronta lettera per lettera il nome scritto con quello che mostra ls missioni.', 'Linux distingue maiuscole e minuscole: cat missioni/benvenuto.txt'],
      check: (ev, sh) => ev.type === 'read' && ev.path === `${sh.home}/missioni/benvenuto.txt`,
      solve: ['cat missioni/benvenuto.txt'],
      success: 'Per Linux `Benvenuto.txt` e `benvenuto.txt` sono due nomi diversi. Windows invece li considera uguali: è una delle prime differenze che si notano.\n\n?? Il tasto **Tab** completa i nomi dei file al posto tuo: niente errori di battitura.',
    }),
  ],
  'ch01-m4': [
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['ls'],
      question: `Questa è una riga di \`ls -l\`. Quanto è grande il file?

\`\`\`
-rw-r--r--  1 edge  edge    381 Nov 11 21:04 benvenuto.txt
\`\`\``,
      options: ['381 byte', '1 byte', '21 byte', '4 KB'],
      correct: 0,
      explain: 'Le colonne sono: permessi, collegamenti, proprietario, gruppo, **dimensione in byte**, data e ora di modifica, nome. 381 byte sono circa 381 caratteri di testo.',
    }),
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['ls'],
      question: `In questa riga di \`ls -l\`, cosa ti dice la **prima lettera**, la \`d\`?

\`\`\`
drwxr-xr-x  2 edge  edge   4096 Nov 11 21:04 missioni/
\`\`\``,
      options: ['È una cartella (directory)', 'Il file è stato cancellato', 'Il file appartiene a root', 'Il file è nascosto'],
      correct: 0,
      explain: 'Il primo carattere è il **tipo**: `d` cartella, `-` file normale, `l` collegamento. Le nove lettere dopo sono i permessi, che vedrai nel capitolo su Linux.',
    }),
    correggi({
      title: 'Correggi l\'errore',
      body: `Un collega vuole leggere il manuale di \`cat\` e scrive solo:

\`\`\`
man
\`\`\`

Il terminale risponde: \`What manual page do you want?\` ("quale pagina del manuale vuoi?").`,
      objective: 'Apri la pagina del manuale di cat.',
      hints: ['man ha bisogno di sapere di quale comando vuoi il manuale.', 'man cat'],
      check: (ev) => ev.type === 'man' && ev.topic === 'cat',
      solve: ['man cat'],
      success: 'Molti comandi hanno bisogno di un **argomento**: l\'oggetto su cui lavorare. Quando un comando "si lamenta", leggi il messaggio: quasi sempre dice cosa manca.',
    }),
  ],
  'ch01-m6': [
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['redirezioni', 'echo'],
      question: `Cosa stampa l'ultimo comando?

\`\`\`
$ echo "uno" > note.txt
$ echo "due" > note.txt
$ cat note.txt
\`\`\``,
      options: ['due', 'uno e due, su due righe', 'uno', 'niente: il file è vuoto'],
      correct: 0,
      explain: 'Un solo `>` **sostituisce** tutto il contenuto del file: il secondo echo ha cancellato "uno". Per aggiungere in fondo serve `>>`. Sbagliare tra i due su un file importante vuol dire perderlo.',
    }),
    correggi({
      title: 'Correggi l\'errore',
      body: `Un collega vuole preparare la cartella \`laboratorio/prove/2077\` partendo dalla home, ma \`prove\` non esiste ancora:

\`\`\`
mkdir ~/laboratorio/prove/2077
\`\`\`

Risposta: \`mkdir: cannot create directory ... No such file or directory\`. mkdir da solo crea una cartella alla volta.`,
      objective: 'Crea ~/laboratorio/prove/2077 con un solo comando.',
      hints: ['mkdir ha un\'opzione che crea anche le cartelle intermedie che mancano.', 'mkdir -p ~/laboratorio/prove/2077'],
      state: (sh) => sh.fs.get(`${sh.home}/laboratorio/prove/2077`)?.type === 'dir',
      solve: ['mkdir -p ~/laboratorio/prove/2077'],
      success: '`-p` sta per *parents* ("genitori"): crea tutte le cartelle del percorso che mancano, e non dà errore se esistono già. Negli script si usa quasi sempre così.',
    }),
  ],
  'ch02-m1': [
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['ip'],
      question: `Questa riga viene da \`ip a\`. Qual è l'**indirizzo IP** di questa scheda di rete?

\`\`\`
inet 192.168.1.50/24 brd 192.168.1.255 scope global eth0
\`\`\``,
      options: ['192.168.1.50', '192.168.1.255', '24', 'eth0'],
      correct: 0,
      explain: 'Dopo `inet` c\'è l\'indirizzo IPv4 (192.168.1.50); `/24` è la dimensione della rete; `brd` è l\'indirizzo di broadcast (per parlare a tutta la rete); `eth0` è il nome della scheda.',
    }),
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['ip', 'ipcalc'],
      question: 'Nella stessa riga, cosa significa `/24` dopo l\'indirizzo?',
      options: [
        'I primi 24 bit indicano la rete: i dispositivi della stessa rete sono 192.168.1.qualcosa',
        'Ci sono 24 dispositivi collegati',
        'Il computer usa la porta 24',
        'È il 24° indirizzo della rete',
      ],
      correct: 0,
      explain: '`/24` vuol dire che i primi tre numeri (24 bit) sono fissi e identificano la rete; l\'ultimo numero cambia da dispositivo a dispositivo. In una /24 ci sono 254 indirizzi utilizzabili.',
    }),
  ],
  'ch02-m2': [
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['ping'],
      question: `Hai lanciato un ping verso un server e hai ottenuto:

\`\`\`
3 packets transmitted, 0 received, 100% packet loss
\`\`\`

Cosa puoi concludere?`,
      options: [
        'Nessuna risposta: il server è spento, irraggiungibile o blocca il ping. Non si sa ancora quale',
        'Il server è sicuramente spento',
        'Il server è protetto, quindi è sicuro',
        'Il ping ha funzionato',
      ],
      correct: 0,
      explain: 'Molti firewall bloccano il ping: un server può non rispondere ed essere acceso, con servizi raggiungibili. Per un analista "nessuna risposta" non è "nessun pericolo".',
    }),
    correggi({
      title: 'Correggi l\'errore',
      body: `Un collega vuole controllare che il router (l'indirizzo \`.1\` della rete 192.168.1.0/24) risponda, ma scrive:

\`\`\`
ping 192.168.1.256
\`\`\`

Risposta: \`ping: 192.168.1.256: Name or service not known\`. Ognuno dei quattro numeri di un indirizzo IPv4 va da 0 a 255: 256 non può esistere, così ping lo scambia per un nome.`,
      objective: 'Fai il ping al router della rete.',
      hints: ['Il router è il primo indirizzo della rete: finisce con .1', 'ping 192.168.1.1'],
      check: (ev) => ev.type === 'ping' && ev.ip === '192.168.1.1',
      solve: ['ping 192.168.1.1'],
      success: 'Ogni numero di un IPv4 sta in un byte, cioè 8 bit: da 0 a 255. Un indirizzo con un numero più grande è un errore di battitura, sempre.',
    }),
  ],
  'ch02-m3': [
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['nmap'],
      question: `Risultato di una scansione autorizzata. Quale servizio segnaleresti **per primo** al cliente?

\`\`\`
PORT   STATE SERVICE
22/tcp open  ssh
23/tcp open  telnet
80/tcp open  http
\`\`\``,
      options: ['telnet (23): trasmette tutto in chiaro, password comprese', 'ssh (22)', 'http (80)', 'nessuno: sono tutte porte normali'],
      correct: 0,
      explain: 'Telnet è un accesso remoto senza cifratura: chiunque intercetti il traffico legge utente e password. Si sostituisce con SSH. Anche HTTP è in chiaro, ma per un sito pubblico è meno grave di un accesso amministrativo.',
    }),
    correggi({
      title: 'Correggi l\'errore',
      body: `Un collega vuole sapere **quali host sono accesi** in tutta la rete 192.168.1.0/24, senza scansionare le porte, e scrive:

\`\`\`
nmap 192.168.1.0
\`\`\`

Risposta: \`0 hosts up\`. Ha sbagliato due cose: ha indicato un solo indirizzo invece della rete intera, e ha lanciato una scansione delle porte invece della sola scoperta.`,
      objective: 'Scopri gli host attivi di tutta la rete, senza scansione delle porte.',
      hints: ['La rete intera si scrive con la sua dimensione: /24. La sola scoperta degli host ha un\'opzione apposta.', 'nmap -sn 192.168.1.0/24'],
      check: (ev) => ev.type === 'scan' && ev.flags.includes('-sn') && ev.target.endsWith('/24'),
      solve: ['nmap -sn 192.168.1.0/24'],
      success: '`-sn` vuol dire "niente scansione delle porte": nmap si limita a chiedere chi c\'è. È più veloce e meno invasivo, ed è il primo passo di ogni ricognizione.',
    }),
  ],
  'ch03-m1': [
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['id', 'groups'],
      question: `Questo è l'output di \`id\` per l'utente \`sara\`. Può usare \`sudo\` per diventare amministratrice?

\`\`\`
uid=1002(sara) gid=1002(sara) groups=1002(sara),27(sudo),100(users)
\`\`\``,
      options: ['Sì: fa parte del gruppo sudo', 'No: il suo uid non è 0', 'Solo se conosce la password di root', 'Non si può dire da questo output'],
      correct: 0,
      explain: 'Su Debian e Ubuntu chi è nel gruppo `sudo` può eseguire comandi come root (con la *propria* password). In un controllo degli accessi, l\'elenco dei membri di sudo è tra le prime cose da guardare.',
    }),
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['cat'],
      question: `Una riga di \`/etc/passwd\`. Cosa significa l'**ultimo campo**?

\`\`\`
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
\`\`\``,
      options: [
        'L\'account non può aprire una sessione: serve a un programma, non a una persona',
        'L\'account è bloccato perché ha sbagliato la password',
        'La password è vuota',
        'L\'account è stato cancellato',
      ],
      correct: 0,
      explain: 'Il settimo campo è la shell, il programma che parte quando l\'utente entra. `nologin` rifiuta l\'accesso: è normale per gli account di servizio. Un account di servizio con `/bin/bash` invece merita una domanda.',
    }),
    correggi({
      title: 'Correggi l\'errore',
      body: `Un collega vuole l'elenco dei soli **nomi utente** e scrive:

\`\`\`
cut -d ":" -f 7 /etc/passwd
\`\`\`

Ottiene una colonna di \`/bin/bash\` e \`/usr/sbin/nologin\`: le shell, non i nomi.`,
      objective: 'Correggi il comando e mostra solo i nomi utente.',
      hints: ['In /etc/passwd il nome utente è il primo campo.', 'cut -d ":" -f 1 /etc/passwd'],
      check: (ev) => ev.type === 'command' && ev.name === 'cut' && ev.ok && ev.args.includes('/etc/passwd') && /(^|\s)-f\s*1(\s|$)/.test(ev.args.join(' ')),
      solve: ['cut -d ":" -f 1 /etc/passwd'],
      success: 'Con `cut` conti i campi da 1, da sinistra. Prima di estrarre, guarda una riga intera e conta i separatori: è il modo più rapido per non sbagliare.',
    }),
  ],
  'ch03-m2': [
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['chmod', 'ls'],
      question: `Un utente del gruppo \`dev\` può **eseguire** questo script?

\`\`\`
-rwxr-x---  1 edge  dev   120 Nov 11 21:04 deploy.sh
\`\`\``,
      options: ['Sì: il gruppo ha r-x', 'No: può eseguirlo solo il proprietario', 'Sì, e può anche modificarlo', 'No: nessuno può eseguirlo'],
      correct: 0,
      explain: 'Si leggono tre gruppi di tre: proprietario `rwx`, gruppo `r-x`, altri `---`. Il gruppo legge ed esegue ma non modifica; gli altri non possono fare nulla.',
    }),
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['chmod'],
      question: 'Quale numero corrisponde ai permessi `rw-r-----`?',
      options: ['640', '644', '600', '750'],
      correct: 0,
      explain: 'Proprietario `rw-` = 4+2 = 6; gruppo `r--` = 4; altri `---` = 0. Quindi 640: il formato tipico dei file di log leggibili dal gruppo degli amministratori.',
    }),
    correggi({
      title: 'Correggi l\'errore',
      body: `Un collega voleva che \`audit/scantinato/turni.txt\` fosse leggibile e modificabile **solo dal proprietario**, ma ha scritto le cifre al contrario:

\`\`\`
chmod 006 audit/scantinato/turni.txt
\`\`\`

Così il proprietario non può fare nulla, e chiunque altro può leggere e scrivere: il contrario di quello che voleva.`,
      objective: 'Imposta i permessi giusti: rw------- (solo il proprietario legge e scrive).',
      hints: ['Le tre cifre sono, nell\'ordine: proprietario, gruppo, altri.', 'chmod 600 audit/scantinato/turni.txt'],
      check: (ev, sh) => ev.type === 'chmod' && ev.path === `${sh.home}/audit/scantinato/turni.txt` && ev.perms === 'rw-------',
      solve: ['chmod 600 audit/scantinato/turni.txt'],
      success: 'Le cifre si leggono sempre nello stesso ordine: **u**tente proprietario, **g**ruppo, **o**ther (altri). Dopo un chmod importante, controlla sempre con `ls -l`.',
    }),
  ],
  'ch03-m3': [
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['grep', 'wc', 'pipe'],
      question: `Questo comando stampa \`3\`. Cosa significa?

\`\`\`
cat /etc/passwd | grep bash | wc -l
\`\`\``,
      options: [
        'Tre righe di /etc/passwd contengono "bash": tre account usano la shell bash',
        'Tre file contengono la parola bash',
        'bash è installato tre volte',
        'Il sistema ha tre utenti in tutto',
      ],
      correct: 0,
      explain: 'Si legge da sinistra a destra: cat manda il file, grep tiene solo le righe con "bash", wc -l le conta. Ogni pezzo lavora sull\'output del precedente.',
    }),
    correggi({
      title: 'Correggi l\'errore',
      body: `Un collega cerca tutti gli script \`.sh\` nella sua home e scrive:

\`\`\`
find -name "*.sh" ~
\`\`\`

Risposta: \`find: unknown predicate '~'\`. In find l'ordine conta.`,
      objective: 'Trova tutti i file .sh nella tua home.',
      hints: ['find vuole prima DOVE cercare, poi COSA cercare.', 'find ~ -name "*.sh"'],
      check: (ev, sh) => ev.type === 'command' && ev.name === 'find' && ev.ok && (ev.args[0] === '~' || ev.args[0] === sh.home || ev.args[0] === sh.home + '/') && ev.args.includes('*.sh'),
      solve: ['find ~ -name "*.sh"'],
      success: 'Schema di find: `find DOVE CONDIZIONI`. Gli script trovati (`backup.sh`, `update.sh`) sono proprio il tipo di file da controllare in un audit: chi li può modificare? Cosa eseguono?',
    }),
  ],
  'ch04-m1': [
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['cat'],
      question: `Cosa racconta questa riga di \`auth.log\`?

\`\`\`
Nov 12 03:14:07 server sshd[2231]: Failed password for root from 203.0.113.77 port 52814 ssh2
\`\`\``,
      options: [
        'Alle 03:14:07 qualcuno dall\'IP 203.0.113.77 ha provato ad accedere come root via SSH, con la password sbagliata',
        'root ha cambiato la sua password alle 03:14',
        'Il server 203.0.113.77 è stato violato',
        'La porta 52814 del server è aperta e vulnerabile',
      ],
      correct: 0,
      explain: 'Ogni riga di log risponde a: **quando** (data e ora), **dove** (server, programma sshd), **cosa** (password sbagliata), **chi** (utente root), **da dove** (IP). La porta 52814 è quella del *client*, scelta a caso dal suo computer: non dice nulla sul server.',
    }),
    correggi({
      title: 'Correggi l\'errore',
      body: `Un collega vuole vedere le prime **3** righe del log e scrive:

\`\`\`
head -n caso/auth.log
\`\`\`

Risposta: \`head: invalid number of lines: 'caso/auth.log'\`. head ha preso il nome del file come se fosse il numero.`,
      objective: 'Mostra le prime 3 righe di caso/auth.log.',
      hints: ['Dopo -n ci va il numero di righe, poi il file.', 'head -n 3 caso/auth.log'],
      check: (ev) => ev.type === 'command' && ev.name === 'head' && ev.ok && ev.args.includes('caso/auth.log') && /(^|\s)-n\s*3(\s|$)|(^|\s)-3(\s|$)/.test(ev.args.join(' ')),
      solve: ['head -n 3 caso/auth.log'],
      success: 'Alcune opzioni vogliono un **valore** subito dopo (`-n 3`, `-d ":"`, `-f 1`). Se lo dimentichi, il comando prende come valore la parola successiva: l\'errore sembra strano, ma la causa è semplice.',
    }),
  ],
  'ch04-m2': [
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['sort', 'uniq'],
      question: `Questo è l'output di \`... | sort | uniq -c\` sugli IP dei tentativi falliti. Cosa indica la **prima colonna**?

\`\`\`
     37 203.0.113.77
      3 198.51.100.9
\`\`\``,
      options: ['Quante volte compare ogni IP', 'La porta usata da ogni IP', 'Il numero di riga nel log', 'Il PID del processo'],
      correct: 0,
      explain: '`uniq -c` mette davanti a ogni riga quante volte si ripete. 37 tentativi in pochi minuti da un solo IP sono un attacco a forza bruta. I 3 tentativi su root dall\'altro IP sono pochi, ma un analista li annota comunque: qualcuno ha provato.',
    }),
    correggi({
      title: 'Correggi l\'errore',
      body: `Un collega conta i tentativi falliti così, e ottiene \`0\`:

\`\`\`
grep "failed password" caso/auth.log | wc -l
\`\`\`

Eppure nel log ce ne sono decine. Nel log c'è scritto \`Failed\`, con la F maiuscola.`,
      objective: 'Correggi il comando aggiungendo un\'opzione a grep, senza cambiare il testo cercato.',
      hints: ['grep distingue maiuscole e minuscole, a meno di dirgli di ignorarle.', 'grep -i "failed password" caso/auth.log | wc -l'],
      check: (ev) => ev.type === 'command' && ev.name === 'grep' && ev.ok && ev.args.some((a) => /^-\w*i/.test(a)) && ev.args.includes('failed password'),
      solve: ['grep -i "failed password" caso/auth.log | wc -l'],
      success: 'Un risultato **zero** va sempre verificato: può voler dire "non è successo niente" oppure "ho cercato male". Nel dubbio, prova la ricerca con -i o su un pezzo più corto del testo.',
    }),
  ],
  'ch04-m3': [
    interpreta({
      title: 'Interpreta l\'output',
      skills: ['ufw'],
      question: `Questo è \`sudo ufw status\`. Cosa succede a una connessione SSH (porta 22) che arriva da 203.0.113.77?

\`\`\`
Status: active

To                Action      From
--                ------      ----
Anywhere          DENY        203.0.113.77
22/tcp            ALLOW       Anywhere
\`\`\``,
      options: ['Viene bloccata: la regola DENY per quell\'IP viene prima', 'Passa: la porta 22 è aperta a tutti', 'Passa, ma viene registrata', 'Il firewall non è attivo'],
      correct: 0,
      explain: 'ufw controlla le regole **dall\'alto in basso** e applica la prima che corrisponde. Per questo i blocchi di IP specifici si mettono prima delle aperture generali.',
    }),
    correggi({
      title: 'Correggi l\'errore',
      body: `Dal conteggio di prima, \`198.51.100.9\` ha tentato 3 accessi come root. Un collega prova a bloccarlo:

\`\`\`
ufw deny from 198.51.100.9
\`\`\`

Risposta: \`ERROR: You need to be root to run this script\`.`,
      objective: 'Blocca 198.51.100.9 sul firewall.',
      hints: ['Il firewall si modifica solo come amministratore.', 'sudo ufw deny from 198.51.100.9'],
      check: (ev) => ev.type === 'firewall' && ev.action === 'deny' && ev.ip === '198.51.100.9',
      solve: ['sudo ufw deny from 198.51.100.9'],
      success: '"Permission denied" e "you need to be root" vogliono dire la stessa cosa: serve un permesso che non hai. Prima di aggiungere sudo, chiediti sempre se *devi* davvero fare quell\'operazione da amministratore.',
    }),
  ],
};

/** Inserisce gli esercizi aggiunti prima delle domande di verifica finali di ogni missione. */
export function addExtra(chapters: Chapter[]): void {
  for (const ch of chapters)
    for (const m of ch.missions) {
      const extra = EXTRA[m.id];
      if (!extra) continue;
      const lastTask = m.steps.map((s) => s.kind).lastIndexOf('task');
      let at = m.steps.findIndex((s, i) => i > lastTask && s.kind === 'quiz');
      if (at < 0) at = m.steps.length;
      m.steps.splice(at, 0, ...extra);
    }
}
