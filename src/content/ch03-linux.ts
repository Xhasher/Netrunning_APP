import type { Shell } from '../engine/shell';
import type { ShellEvent } from '../engine/types';
import type { Chapter } from '../game/types';

const isCmd = (name: string) => (ev: ShellEvent) => ev.type === 'command' && ev.name === name && ev.ok;

const permsOf = (sh: Shell, rel: string) => sh.fs.get(`${sh.home}/${rel}`)?.perms ?? '';

export const CH03: Chapter = {
  id: 'ch03',
  code: '03',
  title: 'Linux in profondità',
  subtitle: 'Utenti, permessi, ricerca e processi',
  missions: [
    // ------------------------------------------------------------------ 3.1
    {
      id: 'ch03-m1',
      title: 'Chi abita qui',
      tagline: 'Utenti, gruppi, /etc/passwd e dove finiscono le password.',
      xp: 150,
      steps: [
        {
          kind: 'lesson',
          title: 'Un sistema, tante persone',
          body: `@nyx: Linux è nato per essere usato da **tante persone insieme** sullo stesso computer. Per questo tutto, ma proprio tutto, appartiene a qualcuno.

Ogni **utente** ha:
- un **nome** (es. \`mama\`) e un numero, lo **UID** (*User ID*). Al sistema interessa il numero, non il nome
- una cartella **home**
- una **shell** che parte quando entra

Gli utenti si organizzano in **gruppi**, così si possono dare gli stessi permessi a più persone insieme (es. il gruppo \`sudo\` può diventare amministratore).

Non tutti gli utenti sono persone: molti programmi girano con un utente dedicato (\`www-data\` per il server web, \`syslog\` per i log...). Si chiamano **utenti di servizio**. È una misura di sicurezza: se qualcuno buca il server web, si ritrova con i poteri limitati di \`www-data\`, non con quelli di root.

?? L'utente con UID **0** è sempre root, qualunque nome abbia.`,
        },
        {
          kind: 'task',
          title: 'La tua carta d\'identità',
          body: `Il comando \`id\` mostra la tua identità completa: UID, gruppo principale (GID) e tutti i gruppi di cui fai parte.

\`\`\`
id
\`\`\``,
          objective: 'Mostra la tua identità con id.',
          hints: ['Scrivi: id'],
          check: isCmd('id'),
          success: `Sei l'utente numero **1000**: su molti Linux è il primo utente "umano" creato. Fai parte anche del gruppo \`users\`. Non sei nel gruppo \`sudo\`: non puoi diventare amministratore.`,
        },
        {
          kind: 'lesson',
          title: '/etc/passwd',
          body: `L'elenco degli utenti sta nel file \`/etc/passwd\`. Ogni riga è un utente, e i campi sono separati da **due punti** \`:\`

\`\`\`
mama:x:1001:1001:Mama Reyes:/home/mama:/bin/bash
 1   2  3    4      5           6          7
\`\`\`

1. nome utente
2. \`x\` → la password **non** è qui (ne parliamo tra poco)
3. UID
4. GID, il gruppo principale
5. descrizione (spesso il nome completo)
6. cartella home
7. shell. \`/usr/sbin/nologin\` vuol dire che quell'utente **non può** entrare in modo interattivo: tipico degli utenti di servizio

Il nome è fuorviante: \`passwd\` è leggibile da tutti, proprio perché molti programmi devono sapere chi sono gli utenti.`,
        },
        {
          kind: 'task',
          title: 'Il registro degli abitanti',
          body: `Leggi il file degli utenti di questo deck:

\`\`\`
cat /etc/passwd
\`\`\`

Poi trova l'UID di Mama Reyes e invialo con \`flag\`.`,
          objective: 'Leggi /etc/passwd e invia l\'UID di mama con flag.',
          hints: ['cat /etc/passwd, poi cerca la riga che inizia con mama.', 'È il terzo campo della riga di mama: flag 1001'],
          answer: ['1001'],
          success: `Esatto, **1001**. Durante un'indagine, sapere chi esiste su un sistema è il primo passo: un utente che nessuno ricorda di aver creato è un campanello d'allarme.`,
        },
        {
          kind: 'task',
          title: 'Solo i nomi',
          body: `Il file è difficile da leggere. Il comando \`cut\` estrae solo le colonne che ti interessano: \`-d\` indica il separatore, \`-f\` il numero della colonna.

\`\`\`
cut -d ":" -f 1 /etc/passwd
\`\`\``,
          objective: 'Estrai i nomi degli utenti con cut.',
          hints: ['Scrivi: cut -d ":" -f 1 /etc/passwd'],
          check: (ev) => ev.type === 'command' && ev.name === 'cut' && ev.ok,
          success: `Solo i nomi, uno per riga. \`cut\` sembra un dettaglio, ma è uno degli strumenti che userai di più per analizzare i log: lo rivedremo nel capitolo Blue Team.`,
        },
        {
          kind: 'lesson',
          title: 'Dove sono le password?',
          body: `Le password **non** sono salvate così come le scrivi. Il sistema salva solo il loro **hash**: un "riassunto" ottenuto con una funzione matematica che funziona in un solo senso.

\`\`\`
password  →  funzione hash  →  $y$j9T$Fq3...
\`\`\`

Quando fai il login, il sistema calcola l'hash di quello che hai scritto e lo confronta con quello salvato. Se sono uguali, la password è giusta. Così la password vera non è scritta da nessuna parte.

Gli hash sono nel file \`/etc/shadow\`, che **solo root** può leggere.

!! Se un attaccante riesce a leggere \`/etc/shadow\`, può provare a "indovinare" le password calcolando l'hash di milioni di parole comuni. Per questo le password devono essere **lunghe e uniche**, e il file shadow va protetto. Lo approfondiremo nel capitolo sulla crittografia.`,
        },
        {
          kind: 'task',
          title: 'La cassaforte',
          body: `Prova a leggere il file delle password:

\`\`\`
cat /etc/shadow
\`\`\``,
          objective: 'Prova a leggere /etc/shadow.',
          hints: ['Scrivi: cat /etc/shadow (riceverai un errore: è voluto)'],
          check: (ev, sh) => ev.type === 'command' && ev.name === 'cat' && !ev.ok && ev.args.some((a) => sh.abs(a) === '/etc/shadow'),
          success: `*Permission denied*. Bene così: un utente normale non deve poter leggere gli hash delle password. Se su un sistema questo file fosse leggibile da tutti, sarebbe una vulnerabilità **grave** da mettere subito nel report.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'In `/etc/passwd` trovi la riga `backup:x:0:0::/home/backup:/bin/bash`. Perché è preoccupante?',
          options: [
            'Perché non ha una descrizione',
            'Perché ha UID 0: è un secondo root, con pieni poteri',
            'Perché usa la shell bash',
            'Non è preoccupante',
          ],
          correct: 1,
          explain: `UID 0 = root. Un utente "nascosto" con UID 0 è un classico trucco per mantenere l'accesso a un sistema dopo un'intrusione (si chiama **persistenza**). Un difensore controlla sempre che solo root abbia UID 0.`,
        },
      ],
      recap: [
        ['utente / UID', 'ogni utente ha un numero; UID 0 = root'],
        ['gruppo / GID', 'insiemi di utenti con gli stessi permessi'],
        ['utente di servizio', 'utente per un programma, spesso con shell nologin'],
        ['id', 'mostra UID, GID e gruppi'],
        ['/etc/passwd', 'elenco degli utenti, campi separati da :'],
        ['/etc/shadow', 'hash delle password, leggibile solo da root'],
        ['hash', 'riassunto a senso unico: si salva l\'hash, non la password'],
        ['cut -d ":" -f 1', 'estrae la prima colonna separata da :'],
      ],
    },

    // ------------------------------------------------------------------ 3.2
    {
      id: 'ch03-m2',
      title: 'Chiavi e serrature',
      tagline: 'Permessi rwx, notazione numerica e chmod: il tuo primo audit.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'I permessi, per bene',
          body: `Hai già visto stringhe come \`rw-r--r--\`. Sono **tre gruppi da tre lettere**:

\`\`\`
rw-   r--   r--
 │     │     └── altri (tutti gli altri utenti)
 │     └──────── gruppo del file
 └────────────── proprietario
\`\`\`

Le lettere hanno un significato diverso per file e cartelle:
- \`r\` (read): su un file → leggerlo; su una cartella → vederne il contenuto con ls
- \`w\` (write): su un file → modificarlo; su una cartella → creare o cancellare file al suo interno
- \`x\` (execute): su un file → eseguirlo come programma; su una cartella → entrarci con cd

Un trattino \`-\` vuol dire "permesso negato".`,
        },
        {
          kind: 'lesson',
          title: 'I permessi in numeri',
          body: `Gli amministratori scrivono spesso i permessi con **tre cifre**. Ogni lettera vale un numero, e si sommano:

\`\`\`
r = 4     w = 2     x = 1

rwx = 4+2+1 = 7
rw- = 4+2   = 6
r-x = 4  +1 = 5
r-- = 4     = 4
--- =         0
\`\`\`

Quindi:
- \`644\` = \`rw-r--r--\` → il proprietario scrive, tutti leggono (documenti normali)
- \`600\` = \`rw-------\` → solo il proprietario (file privati, chiavi, password)
- \`755\` = \`rwxr-xr-x\` → tutti eseguono, solo il proprietario modifica (programmi)
- \`777\` = \`rwxrwxrwx\` → **tutti possono fare tutto**. Quasi sempre è un errore

Per cambiarli si usa \`chmod\` (*change mode*): \`chmod 600 file\`. Solo il proprietario del file (o root) può farlo.`,
        },
        {
          kind: 'task',
          title: 'Il lavoro',
          body: `Mama ti ha chiesto di controllare i file del vecchio server. Leggi il suo messaggio:

\`\`\`
cat audit/LEGGIMI.txt
\`\`\``,
          objective: 'Leggi audit/LEGGIMI.txt.',
          hints: ['Dalla home: cat audit/LEGGIMI.txt'],
          check: (ev, sh) => ev.type === 'read' && ev.path === `${sh.home}/audit/LEGGIMI.txt`,
          success: `Un **audit dei permessi**: controllare che ogni file sia accessibile solo da chi ne ha bisogno. È un lavoro tipico sia del pentester sia del sistemista.`,
        },
        {
          kind: 'task',
          title: 'Ispezione',
          body: `Guarda i permessi di tutti i file nella cartella, compresi quelli nascosti:

\`\`\`
ls -la audit/scantinato
\`\`\``,
          objective: 'Elenca audit/scantinato in formato lungo.',
          hints: ['Scrivi: ls -la audit/scantinato'],
          check: (ev, sh) => ev.type === 'ls' && ev.path === `${sh.home}/audit/scantinato` && ev.flags.includes('l'),
          success: `Guarda la prima colonna di ogni file con attenzione. Qualcosa non va...`,
        },
        {
          kind: 'task',
          title: 'Trova il problema',
          body: `Un file contiene una **password** ed è leggibile e modificabile da **chiunque** (\`rw-rw-rw-\`). Quale? Leggilo con \`cat\` per conferma e invia il suo nome con \`flag\`.`,
          objective: 'Invia il nome del file con la password esposta.',
          hints: ['Cerca il file con permessi rw-rw-rw-.', 'È config.bak: flag config.bak'],
          answer: ['config.bak', 'audit/scantinato/config.bak'],
          success: `\`config.bak\` contiene la password del database della cassa, ed è leggibile da **qualsiasi** utente del sistema. È una delle vulnerabilità più comuni in assoluto: i file di backup e di configurazione dimenticati con permessi troppo larghi.`,
        },
        {
          kind: 'task',
          title: 'Chiudi la serratura',
          body: `Correggi i permessi: solo il proprietario deve poter leggere e scrivere il file.

\`\`\`
chmod 600 audit/scantinato/config.bak
\`\`\`

Poi controlla con \`ls -l\` che sia diventato \`rw-------\`.`,
          objective: 'Rendi config.bak privato con chmod 600.',
          hints: ['Scrivi: chmod 600 audit/scantinato/config.bak'],
          state: (sh) => {
            const p = permsOf(sh, 'audit/scantinato/config.bak');
            return !!p && (p.slice(3) === '------' || (p[4] !== 'w' && p.slice(6) === '---'));
          },
          check: (ev, sh) => {
            if (ev.type !== 'chmod') return false;
            const p = permsOf(sh, 'audit/scantinato/config.bak');
            return p.slice(3) === '------' || (p[4] !== 'w' && p.slice(6) === '---');
          },
          success: `Corretto. Ora gli altri utenti ricevono *Permission denied*.

!! Nel mondo reale però non basta: quella password è stata esposta per chissà quanto tempo. Va considerata **compromessa** e cambiata. Correggere i permessi chiude la porta, ma non cancella chi potrebbe essere già passato.`,
        },
        {
          kind: 'task',
          title: 'Lo script pericoloso',
          body: `C'è un altro problema: \`backup.sh\` è uno script che il server esegue ogni notte, e ha permessi \`rwxrwxrwx\` (777).

Chiunque può **modificarlo**. Un attaccante potrebbe aggiungere i suoi comandi, e il server li eseguirebbe per lui ogni notte.

Togli la scrittura a gruppo e altri. Va bene \`755\` (tutti eseguono, solo tu modifichi) oppure \`700\` (solo tu):

\`\`\`
chmod 755 audit/scantinato/backup.sh
\`\`\``,
          objective: 'Togli il permesso di scrittura a gruppo e altri su backup.sh.',
          hints: ['Scrivi: chmod 755 audit/scantinato/backup.sh', 'In alternativa la forma simbolica: chmod go-w audit/scantinato/backup.sh'],
          state: (sh) => {
            const p = permsOf(sh, 'audit/scantinato/backup.sh');
            return !!p && p[0] === 'r' && p[2] === 'x' && p[4] !== 'w' && p[7] !== 'w';
          },
          check: (ev, sh) => {
            if (ev.type !== 'chmod') return false;
            const p = permsOf(sh, 'audit/scantinato/backup.sh');
            return p[0] === 'r' && p[2] === 'x' && p[4] !== 'w' && p[7] !== 'w';
          },
          success: `Sistemato. Uno script eseguito automaticamente e modificabile da tutti è un classico punto di **privilege escalation**: chi lo modifica fa eseguire i propri comandi a un utente più potente. Ora chiudi il report con un principio da ricordare sempre.`,
        },
        {
          kind: 'lesson',
          title: 'Il minimo privilegio',
          body: `@nyx: Tutto quello che hai fatto si riassume in una regola, la più importante della difesa:

**Principio del minimo privilegio**: ogni utente e ogni programma deve avere **solo** i permessi che gli servono, e niente di più.

- un file di password → \`600\`
- uno script → non scrivibile dagli altri
- un servizio web → gira come \`www-data\`, non come root
- un dipendente → accede solo ai dati del suo lavoro

Più permessi ci sono in giro, più strade ha un attaccante. Un buon difensore toglie tutto quello che non serve.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Che permessi corrispondono a `640`?',
          options: ['rw-r-----', 'rwxr-----', 'rw-rw----', 'r--r-----'],
          correct: 0,
          explain: `6 = 4+2 = \`rw-\` (proprietario), 4 = \`r--\` (gruppo), 0 = \`---\` (altri). È un valore tipico per i file di log: il proprietario scrive, il gruppo legge, gli altri niente.`,
        },
      ],
      recap: [
        ['rwx', 'leggere, scrivere, eseguire (per una cartella x = entrarci)'],
        ['proprietario / gruppo / altri', 'i tre blocchi dei permessi'],
        ['r=4 w=2 x=1', 'si sommano: 7=rwx, 6=rw-, 5=r-x, 4=r--'],
        ['600 / 644 / 755', 'privato / documento / programma'],
        ['777', 'tutti possono tutto: quasi sempre un errore'],
        ['chmod 600 FILE', 'cambia i permessi (solo proprietario o root)'],
        ['chmod go-w FILE', 'forma simbolica: toglie la scrittura a gruppo e altri'],
        ['minimo privilegio', 'solo i permessi strettamente necessari'],
      ],
    },

    // ------------------------------------------------------------------ 3.3
    {
      id: 'ch03-m3',
      title: 'Ago nel pagliaio',
      tagline: 'find, la pipe |, grep, wc e i processi con ps.',
      xp: 200,
      steps: [
        {
          kind: 'task',
          title: 'Cercare un file',
          body: `In un sistema ci sono migliaia di file. \`find\` li cerca per te, scendendo in tutte le sottocartelle:

\`\`\`
find PARTENZA -name "MODELLO"
\`\`\`

Nel modello, \`*\` significa "qualsiasi testo". Cerchiamo tutti i file di backup (che finiscono con \`.bak\`) nella tua home:

\`\`\`
find ~ -name "*.bak"
\`\`\``,
          objective: 'Cerca i file .bak nella tua home con find.',
          hints: ['Scrivi: find ~ -name "*.bak"'],
          check: (ev) => ev.type === 'command' && ev.name === 'find' && ev.ok && ev.args.some((a) => a.includes('.bak')),
          success: `\`find\` ha trovato anche il file dentro la cartella nascosta \`.old\`. A differenza di \`ls\`, \`find\` non salta i file nascosti.`,
        },
        {
          kind: 'task',
          title: 'Conta',
          body: `Quanti file \`.bak\` hai trovato? Invia il numero con \`flag\`.`,
          objective: 'Invia il numero di file .bak trovati.',
          hints: ['Conta le righe stampate dal comando find precedente.', 'flag 2'],
          answer: ['2', 'due'],
          success: `Due. In un audit reale si cercano proprio così i file dimenticati: \`*.bak\`, \`*.old\`, \`*.conf\`, \`*.sql\`... Spesso contengono password o dati sensibili.`,
        },
        {
          kind: 'lesson',
          title: 'La pipe: collegare i comandi',
          body: `Ecco l'idea più potente di Linux. Ogni comando fa **una cosa sola**, ma si possono **collegare** con il simbolo \`|\` (si chiama *pipe*, "tubo"): l'output del primo comando diventa l'input del secondo.

\`\`\`
cat /etc/group | grep sudo | wc -l
\`\`\`

Si legge da sinistra a destra:
1. \`cat /etc/group\` → stampa tutti i gruppi del sistema
2. \`| grep sudo\` → tiene solo le righe che contengono "sudo"
3. \`| wc -l\` → conta quante righe sono rimaste

Altri comandi utili da mettere nei tubi:
- \`grep TESTO\` → filtra le righe (\`-i\` ignora maiuscole, \`-v\` inverte)
- \`wc -l\` → conta le righe
- \`sort\` → ordina
- \`uniq -c\` → conta le righe uguali consecutive
- \`head\` / \`tail\` → prime / ultime righe

?? Il simbolo \`|\` lo trovi nella barra dei tasti rapidi sopra la tastiera.`,
        },
        {
          kind: 'task',
          title: 'Chi può entrare?',
          body: `Quanti utenti di questo sistema hanno come shell \`/bin/bash\`, cioè possono fare il login? Usa una pipe per contarli:

\`\`\`
cat /etc/passwd | grep bash | wc -l
\`\`\`

Invia il risultato con \`flag\`.`,
          objective: 'Conta gli utenti con shell bash e invia il numero.',
          hints: ['Scrivi: cat /etc/passwd | grep bash | wc -l', 'flag 3'],
          answer: ['3', 'tre'],
          success: `Tre: \`root\`, tu e \`mama\`. Sono gli account che un attaccante proverebbe a colpire per entrare, e quelli che un difensore deve proteggere meglio.`,
        },
        {
          kind: 'lesson',
          title: 'I processi',
          body: `Un programma salvato sul disco è solo un file. Quando lo avvii diventa un **processo**: un programma in esecuzione, con:
- un numero identificativo, il **PID**
- un **utente** che lo esegue (e di cui ha i permessi)
- un consumo di **CPU** e **memoria**

Il comando \`ps aux\` mostra tutti i processi del sistema. Le colonne più importanti:
- \`USER\` → chi lo esegue
- \`PID\` → il suo numero
- \`%CPU\` / \`%MEM\` → quanta potenza e memoria usa
- \`START\` → quando è partito
- \`COMMAND\` → il comando completo

!! Per un difensore \`ps aux\` è fondamentale: un processo sconosciuto che consuma il 100% della CPU, o che parte da una cartella strana come \`/tmp\`, è un **indicatore di compromissione**.`,
        },
        {
          kind: 'task',
          title: 'Cosa gira qui?',
          body: `Guarda i processi in esecuzione sul tuo deck:

\`\`\`
ps aux
\`\`\``,
          objective: 'Elenca tutti i processi con ps aux.',
          hints: ['Scrivi: ps aux'],
          check: (ev) => ev.type === 'command' && ev.name === 'ps' && ev.args.length > 0 && ev.ok,
          success: `Un sistema pulito: \`init\` (il primo processo, PID 1), \`cron\` (esegue i lavori programmati), \`sshd\` (il servizio di accesso remoto), \`rsyslogd\` (scrive i log), e la tua shell. Tutto nella norma. Ricordati com'è un sistema sano: ti servirà per riconoscerne uno malato.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Cosa fa `cat log.txt | grep errore | wc -l`?',
          options: [
            'Cancella le righe con "errore"',
            'Conta quante righe di log.txt contengono "errore"',
            'Cerca il file errore dentro log.txt',
            'Stampa log.txt tre volte',
          ],
          correct: 1,
          explain: `\`cat\` stampa il file, \`grep\` tiene solo le righe con "errore", \`wc -l\` le conta. È esattamente il tipo di comando che userai nel prossimo capitolo per analizzare un attacco.`,
        },
      ],
      recap: [
        ['find ~ -name "*.bak"', 'cerca file per nome, anche nelle cartelle nascoste'],
        ['|', 'la pipe: l\'output di un comando diventa l\'input del successivo'],
        ['grep / wc -l', 'filtra righe / conta righe'],
        ['sort / uniq -c', 'ordina / conta righe uguali'],
        ['processo / PID', 'un programma in esecuzione e il suo numero'],
        ['ps aux', 'tutti i processi con utente, CPU, memoria e comando'],
        ['indicatore di compromissione', 'segno che un sistema potrebbe essere stato violato'],
      ],
    },
  ],
};
