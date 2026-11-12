import type { Chapter } from '../game/types';

const isCmd = (name: string) => (ev: { type: string; name?: string; ok?: boolean }) =>
  ev.type === 'command' && ev.name === name && ev.ok === true;

export const CH01: Chapter = {
  id: 'ch01',
  code: '01',
  title: 'Jack-in',
  subtitle: 'Il terminale e Linux, da zero',
  missions: [
    // ------------------------------------------------------------------ 1.1
    {
      id: 'ch01-m1',
      title: 'Benvenuto a Night City',
      tagline: 'Cos\'è Linux, cos\'è un terminale, e il tuo primo comando.',
      xp: 100,
      steps: [
        {
          kind: 'lesson',
          title: 'La sveglia',
          body: `@nyx: Ehi. Sei sveglio? Bene. Mi chiamo Nyx, faccio la netrunner da prima che tu nascessi. Rook, il fixer, dice che hai del potenziale. Vediamo.

@nyx: In questa città chi controlla i computer controlla tutto. Ma ci sono due modi di usare quello che ti insegnerò: per entrare dove non devi, o per **proteggere** chi viene attaccato. Noi lavoriamo con un contratto firmato. Sempre.

!! Tutto quello che fai in questo gioco è simulato: il terminale, i file, la rete. Nessun comando esce dal tuo telefono. Puoi sbagliare quanto vuoi.`,
        },
        {
          kind: 'lesson',
          title: 'Cos\'è un sistema operativo',
          body: `Un computer da solo è solo hardware: processore, memoria, disco. Il **sistema operativo** è il programma principale che fa funzionare tutto il resto: gestisce i file, la memoria, la rete, e fa partire gli altri programmi.

Ne conosci già alcuni:
- **Windows** sui PC
- **Android** sul tuo telefono
- **macOS / iOS** sui prodotti Apple

**Linux** è un sistema operativo gratuito e open source (il codice è pubblico). Lo trovi in posti che magari non immagini:
- la grande maggioranza dei **server** di Internet (i siti che visiti girano quasi tutti su Linux)
- **Android**, che è costruito proprio sopra Linux
- router, smart TV, auto, telecamere...

?? Per questo chi lavora in sicurezza informatica DEVE conoscere Linux: è quello che troverai sia quando attacchi (in un test autorizzato) sia quando difendi.`,
        },
        {
          kind: 'lesson',
          title: 'Cos\'è il terminale',
          body: `Di solito usi un computer con le finestre, le icone e il mouse: questa si chiama **interfaccia grafica** (GUI).

Esiste un altro modo: scrivere **comandi** di testo. Il programma che li legge e li esegue si chiama **shell** (la più diffusa su Linux si chiama **bash**). La finestra in cui scrivi si chiama **terminale**.

Perché usarlo se esistono le finestre?
- è **più veloce** e più preciso, una volta imparato
- sui server spesso **non c'è** l'interfaccia grafica: c'è solo il terminale
- si possono **automatizzare** le cose (script)
- quasi tutti gli strumenti di sicurezza funzionano da terminale

Nella parte bassa dello schermo c'è il tuo terminale. Ogni comando segue questo schema:

\`\`\`
comando [opzioni] [argomenti]
\`\`\`

Scrivi il comando e premi **Invio**. La shell lo esegue e ti mostra il risultato.`,
        },
        {
          kind: 'lesson',
          title: 'Il prompt',
          body: `Prima del cursore vedi una scritta tipo questa. Si chiama **prompt**: è la shell che ti dice "sono pronta, scrivi".

\`\`\`
edge@deck:~$
\`\`\`

Ogni pezzo ha un significato:
- \`edge\` → il nome dell'**utente** con cui sei collegato (sarà il tuo nome)
- \`@deck\` → il nome del **computer** (host)
- \`~\` → la **cartella** in cui ti trovi (la tilde \`~\` significa "la tua cartella personale", la *home*)
- \`$\` → sei un utente **normale**. Se ci fosse \`#\` saresti **root**, l'amministratore con tutti i poteri.

?? Durante un attacco reale, vedere \`#\` nel prompt significa avere il controllo totale della macchina. È l'obiettivo di molti attaccanti, e quello che i difensori devono impedire.`,
        },
        {
          kind: 'task',
          title: 'Chi sei?',
          body: `Il tuo primo comando: \`whoami\`. È l'inglese "who am I?", cioè "chi sono io?". Stampa il nome dell'utente con cui sei collegato.

Tocca il terminale, scrivi il comando qui sotto e premi Invio:

\`\`\`
whoami
\`\`\``,
          objective: 'Scrivi whoami nel terminale e premi Invio.',
          hints: ['Scrivi esattamente: whoami (tutto minuscolo, attaccato) e premi Invio.'],
          check: isCmd('whoami'),
          success: `Il terminale ha risposto con il tuo nome utente. È proprio il primo comando che un pentester lancia quando entra in una macchina: **sapere chi sei ti dice cosa puoi fare**.`,
        },
        {
          kind: 'task',
          title: 'Dove sei?',
          body: `Ora chiediamo al sistema come si chiama questo computer. Il comando è \`hostname\` (host = computer, name = nome).

\`\`\`
hostname
\`\`\``,
          objective: 'Scopri il nome del computer con hostname.',
          hints: ['Scrivi: hostname'],
          check: isCmd('hostname'),
          success: `Il tuo computer si chiama **deck**: è lo stesso nome che vedi nel prompt, dopo la @.`,
        },
        {
          kind: 'task',
          title: 'Sbagliare è normale',
          body: `Linux è **case-sensitive**: distingue tra MAIUSCOLE e minuscole. Per lui \`whoami\` e \`Whoami\` sono due parole completamente diverse.

Proviamolo. Scrivi apposta il comando con la W maiuscola:

\`\`\`
Whoami
\`\`\`

?? Sul telefono la tastiera a volte mette da sola la maiuscola a inizio frase. In questo terminale l'abbiamo disattivata, ma ricordatelo se usi altre app.`,
          objective: 'Prova a scrivere Whoami con la W maiuscola.',
          hints: ['Scrivi: Whoami (con la W maiuscola). Vedrai un errore: è voluto!'],
          check: (ev) => ev.type === 'command' && ev.name === 'Whoami' && !ev.ok,
          success: `\`command not found\` vuol dire "comando non trovato". È l'errore che vedrai più spesso, e quasi sempre significa un errore di battitura. Leggere gli errori con calma è metà del lavoro: ti dicono esattamente cosa non va.`,
        },
        {
          kind: 'task',
          title: 'Chiedere aiuto',
          body: `Non devi ricordare tutto a memoria. Il comando \`help\` elenca i comandi che puoi usare in questo deck, con una breve spiegazione.

\`\`\`
help
\`\`\``,
          objective: 'Guarda l\'elenco dei comandi con help.',
          hints: ['Scrivi: help'],
          check: isCmd('help'),
          success: `Molti di quei comandi ti sono ancora sconosciuti: li imparerai uno alla volta. Gli ultimi due (\`flag\` e \`hint\`) sono comandi del gioco: \`hint\` ti dà un suggerimento quando sei bloccato.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Nel prompt `mara@server:~#` cosa ti dice il simbolo `#` alla fine?',
          options: [
            'Che il computer è spento',
            'Che sei collegato come root, l\'amministratore',
            'Che hai fatto un errore',
            'Che sei nella cartella principale',
          ],
          correct: 1,
          explain: `\`$\` = utente normale, \`#\` = **root**, l'amministratore con pieni poteri. Root può leggere, modificare o cancellare qualsiasi cosa nel sistema.`,
        },
      ],
      recap: [
        ['Linux', 'sistema operativo gratuito, usato dalla maggior parte dei server'],
        ['terminale / shell', 'il terminale è la finestra, la shell (bash) è il programma che esegue i comandi'],
        ['prompt', 'utente@computer:cartella$ — $ utente normale, # root'],
        ['whoami', 'mostra il tuo nome utente'],
        ['hostname', 'mostra il nome del computer'],
        ['help', 'elenca i comandi disponibili'],
      ],
    },

    // ------------------------------------------------------------------ 1.2
    {
      id: 'ch01-m2',
      title: 'Orientarsi nel filesystem',
      tagline: 'Cartelle, percorsi e come muoversi: pwd, ls, cd.',
      xp: 150,
      steps: [
        {
          kind: 'lesson',
          title: 'File e cartelle',
          body: `Tutto quello che è salvato su un computer sta dentro dei **file**: un documento, una foto, un programma. I file sono organizzati in **cartelle** (in inglese *directory*), e le cartelle possono contenere altre cartelle.

Su Windows ci sono più "dischi" (C:, D:...). Su Linux invece c'è **un unico albero** che parte da una cartella speciale chiamata **radice** (*root directory*) e scritta con una barra: \`/\`

\`\`\`
/                 ← la radice: contiene tutto
├── bin/          ← programmi di base (ls, cat...)
├── etc/          ← file di configurazione del sistema
├── home/         ← le cartelle personali degli utenti
│   └── edge/     ← la TUA cartella (la "home", ~)
├── root/         ← la home dell'amministratore
├── tmp/          ← file temporanei
└── var/          ← dati che cambiano, come i log
\`\`\`

?? Questi nomi sono uguali su quasi tutti i Linux del mondo. Un hacker sa che le password degli utenti sono in \`/etc\`, che le tracce di un attacco si cercano in \`/var/log\`, e così via.`,
        },
        {
          kind: 'task',
          title: 'Dove mi trovo?',
          body: `In ogni momento la shell "si trova" dentro una cartella, chiamata **cartella di lavoro** (*working directory*). Per sapere quale, usa \`pwd\`: *print working directory*, "stampa la cartella di lavoro".

\`\`\`
pwd
\`\`\``,
          objective: 'Scopri in quale cartella ti trovi con pwd.',
          hints: ['Scrivi: pwd'],
          check: isCmd('pwd'),
          success: `Il risultato è il **percorso** della tua cartella: si legge da sinistra a destra, e ogni \`/\` separa una cartella dalla successiva. Sei dentro \`home\`, che è dentro \`/\` (la radice). Questa è la tua **home**, abbreviata con \`~\` nel prompt.`,
        },
        {
          kind: 'task',
          title: 'Cosa c\'è qui?',
          body: `Per vedere cosa contiene una cartella si usa \`ls\` (da *list*, "elenca").

\`\`\`
ls
\`\`\`

In questo deck le **cartelle** sono colorate di blu e finiscono con \`/\`; i **file** sono in bianco.`,
          objective: 'Elenca il contenuto della tua home con ls.',
          hints: ['Scrivi: ls (sono una L e una S minuscole)'],
          check: (ev, sh) => ev.type === 'ls' && ev.path === sh.home,
          success: `Ci sono 3 cartelle (\`contratti\`, \`missioni\`, \`rete\`) e un file (\`README.txt\`).

?? Su Linux l'estensione (\`.txt\`) è solo una convenzione per gli umani: un file può chiamarsi come vuoi, anche senza estensione.`,
        },
        {
          kind: 'task',
          title: 'Entrare in una cartella',
          body: `Per spostarti in un'altra cartella usa \`cd\` (*change directory*, "cambia cartella"), seguito dal nome della cartella.

Entra in \`missioni\`:

\`\`\`
cd missioni
\`\`\`

Guarda il prompt dopo il comando: cambierà da \`~\` a \`~/missioni\`.`,
          objective: 'Entra nella cartella missioni con cd.',
          hints: ['Scrivi: cd missioni', 'Se sei in un\'altra cartella, prima torna a casa con: cd'],
          check: (ev, sh) => ev.type === 'cd' && ev.path === sh.home + '/missioni',
          success: `Il prompt ora mostra \`~/missioni\`: sei dentro la cartella. \`cd\` non stampa niente quando funziona. In Linux vale spesso la regola **"nessuna notizia, buona notizia"**: se un comando non dice nulla, di solito è andato tutto bene.`,
        },
        {
          kind: 'task',
          title: 'Tornare indietro',
          body: `Ogni cartella contiene due "cartelle" speciali e invisibili:
- \`.\` (un punto) → **la cartella stessa**
- \`..\` (due punti) → **la cartella genitore**, quella che sta un livello sopra

Quindi per salire di un livello si scrive:

\`\`\`
cd ..
\`\`\`

Attenzione allo spazio tra \`cd\` e \`..\`!`,
          objective: 'Torna nella cartella superiore con cd ..',
          hints: ['Scrivi: cd .. (cd, uno spazio, due punti)'],
          check: (ev) => ev.type === 'command' && ev.name === 'cd' && ev.args[0]?.replace(/\/$/, '') === '..' && ev.ok,
          success: `Sei salito di un livello: guarda come è cambiato il prompt.`,
        },
        {
          kind: 'lesson',
          title: 'Percorsi assoluti e relativi',
          body: `Ci sono due modi di indicare dove si trova un file o una cartella:

**Percorso assoluto**: parte sempre dalla radice \`/\`. Funziona da qualsiasi posto, come un indirizzo completo con città e via.

\`\`\`
/home/edge/missioni
\`\`\`

**Percorso relativo**: NON inizia con \`/\` e parte dalla cartella in cui ti trovi adesso. È come dire "la seconda porta a destra": dipende da dove sei.

\`\`\`
missioni          (se sei già in /home/edge)
../edge/missioni  (sali di uno, poi entra in edge, poi in missioni)
\`\`\`

E poi ci sono le scorciatoie:
- \`~\` → la tua home
- \`cd\` da solo → torna nella home`,
        },
        {
          kind: 'task',
          title: 'Visita di sistema',
          body: `Usiamo un percorso assoluto per andare nella cartella delle configurazioni di sistema:

\`\`\`
cd /etc
\`\`\`

Poi guarda cosa contiene con \`ls\`.`,
          objective: 'Vai in /etc ed elencane il contenuto con ls.',
          hints: ['Prima: cd /etc', 'Poi: ls'],
          check: (ev) => ev.type === 'ls' && ev.path === '/etc',
          success: `Il prompt mostra \`/etc\` e non \`~\`, perché sei fuori dalla tua home. Qui ci sono i file di configurazione del sistema. Uno, \`passwd\`, contiene l'elenco degli utenti: lo esamineremo nei prossimi capitoli.`,
        },
        {
          kind: 'task',
          title: 'Vietato l\'ingresso',
          body: `Non tutte le cartelle sono aperte a tutti. Prova a entrare nella home dell'amministratore:

\`\`\`
cd /root
\`\`\``,
          objective: 'Prova a entrare in /root.',
          hints: ['Scrivi: cd /root'],
          check: (ev, sh) => ev.type === 'command' && ev.name === 'cd' && !ev.ok && !!ev.args[0] && sh.abs(ev.args[0]) === '/root',
          success: `\`Permission denied\`: **permesso negato**. Linux controlla chi può fare cosa: il tuo utente normale non può entrare nella cartella di root. Questo sistema di **permessi** è una delle difese fondamentali di Linux, e aggirarlo (la *privilege escalation*) è uno degli obiettivi principali di un attaccante. Lo studieremo a fondo.`,
        },
        {
          kind: 'task',
          title: 'Casa dolce casa',
          body: `Torna nella tua home. Hai tre modi, tutti validi:

\`\`\`
cd
cd ~
cd /home/TUONOME
\`\`\``,
          objective: 'Torna nella tua home.',
          hints: ['Il modo più veloce: scrivi solo cd e premi Invio.'],
          check: (ev, sh) => ev.type === 'cd' && ev.path === sh.home,
          success: `Il prompt mostra di nuovo \`~\`. Ora sai muoverti nell'albero di Linux.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Sei in `/home/edge/missioni`. Dove ti porta il comando `cd ..`?',
          options: ['/', '/home', '/home/edge', '/home/edge/missioni/..'],
          correct: 2,
          explain: `\`..\` è la cartella genitore: da \`/home/edge/missioni\` si sale di **un** livello e si arriva a \`/home/edge\`.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Quale di questi è un percorso **assoluto**?',
          options: ['missioni/benvenuto.txt', '../etc', '/var/log/syslog', '~ (tilde)'],
          correct: 2,
          explain: `Un percorso assoluto inizia sempre con \`/\`. \`~\` è una scorciatoia che la shell trasforma in \`/home/tuonome\`, ma scritta così non è un percorso assoluto.`,
        },
      ],
      recap: [
        ['/', 'la radice: l\'inizio di tutto il filesystem'],
        ['~', 'la tua cartella personale (home)'],
        ['pwd', 'mostra la cartella in cui ti trovi'],
        ['ls', 'elenca file e cartelle'],
        ['cd CARTELLA', 'entra in una cartella'],
        ['cd ..', 'sale di un livello'],
        ['cd', 'torna nella home'],
        ['Permission denied', 'non hai i permessi per quell\'azione'],
      ],
    },

    // ------------------------------------------------------------------ 1.3
    {
      id: 'ch01-m3',
      title: 'Ciò che non si vede',
      tagline: 'Leggere i file con cat, i file nascosti e la tua prima flag.',
      xp: 150,
      steps: [
        {
          kind: 'task',
          title: 'Leggere un file',
          body: `Per leggere il contenuto di un file di testo si usa \`cat\` (da *concatenate*: può anche unire più file).

Nyx ti ha lasciato un messaggio in \`missioni/benvenuto.txt\`. Leggilo:

\`\`\`
cat missioni/benvenuto.txt
\`\`\`

(Oppure entra prima nella cartella con \`cd missioni\` e poi scrivi \`cat benvenuto.txt\`. Il risultato è lo stesso: percorso relativo diverso, stesso file.)`,
          objective: 'Leggi il file benvenuto.txt con cat.',
          hints: [
            'Il file si trova nella cartella missioni, dentro la tua home.',
            'Dalla home scrivi: cat missioni/benvenuto.txt',
          ],
          check: (ev, sh) => ev.type === 'read' && ev.path === sh.home + '/missioni/benvenuto.txt',
          success: `Hai letto il tuo primo file. Nyx accenna a un file che \`ls\` "non ti mostra"...`,
        },
        {
          kind: 'lesson',
          title: 'Due trucchi che ti salveranno la vita',
          body: `I professionisti non scrivono tutto a mano. Due scorciatoie:

**1. Il tasto TAB (autocompletamento)**
Scrivi l'inizio di un nome e premi **TAB**: la shell completa il resto. Se ci sono più possibilità te le mostra. Prova per esempio a scrivere \`cat miss\` e poi TAB.

**2. La freccia SU ↑ (cronologia)**
Premi **↑** per richiamare i comandi che hai già scritto, così non devi ridigitarli.

Sul telefono trovi **TAB**, **↑** e **↓** nella barra sopra la tastiera, insieme ai simboli più usati (\`/\`, \`-\`, \`.\`, \`~\`, \`|\`).

?? TAB evita anche gli errori di battitura: se non completa, probabilmente il file non esiste o il nome è diverso.`,
        },
        {
          kind: 'task',
          title: 'Opzioni',
          body: `I comandi accettano **opzioni** (dette anche *flag*) che ne cambiano il comportamento. Di solito iniziano con un trattino \`-\`.

Su Linux i file il cui nome **inizia con un punto** (es. \`.config\`) sono **nascosti**: \`ls\` normalmente non li mostra. L'opzione \`-a\` (*all*, "tutti") li fa comparire:

\`\`\`
ls -a missioni
\`\`\``,
          objective: 'Mostra i file nascosti della cartella missioni con ls -a.',
          hints: ['Dalla home scrivi: ls -a missioni', 'Se sei già dentro missioni basta: ls -a'],
          check: (ev, sh) => ev.type === 'ls' && ev.path === sh.home + '/missioni' && ev.flags.includes('a'),
          success: `Sono comparsi \`.\` e \`..\` (le cartelle speciali che conosci) e un file nascosto: \`.nota_segreta\`.

!! "Nascosto" NON vuol dire "protetto". È solo una convenzione per non ingombrare la vista. Chiunque può vederli con \`ls -a\`. La prima cosa che fa un attaccante in una cartella è proprio \`ls -la\`.`,
        },
        {
          kind: 'task',
          title: 'La prima flag',
          body: `Leggi il file nascosto con \`cat\`. Attenzione: il punto fa parte del nome!

Dentro troverai una **flag**: un codice nel formato \`NC{...}\`. Nelle gare di hacking chiamate **CTF** (*Capture The Flag*) si cercano proprio codici come questo, nascosti dentro i sistemi.

Quando la trovi, inviala con il comando del gioco \`flag\`:

\`\`\`
flag NC{...}
\`\`\``,
          objective: 'Leggi .nota_segreta e invia la flag con il comando flag.',
          hints: [
            'Il file si chiama .nota_segreta ed è nella cartella missioni.',
            'Dalla home: cat missioni/.nota_segreta',
            'Poi scrivi: flag NC{v3d0_l_1nv1s1b1l3}',
          ],
          answer: ['NC{v3d0_l_1nv1s1b1l3}'],
          success: `Flag catturata! 🏴 Nelle CTF vere (come picoCTF o i "box" di HackTheBox) il lavoro è proprio questo: esplorare un sistema finché non trovi la flag.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un file si chiama `.password_backup`. Cosa succede se scrivi solo `ls` nella sua cartella?',
          options: [
            'Lo vedi normalmente',
            'Non lo vedi, perché inizia con un punto',
            'Ricevi Permission denied',
            'Il file viene cancellato',
          ],
          correct: 1,
          explain: `I file che iniziano con \`.\` sono nascosti e compaiono solo con \`ls -a\`. Non sono protetti, solo nascosti alla vista: chiunque usi \`-a\` li vede.`,
        },
      ],
      recap: [
        ['cat FILE', 'mostra il contenuto di un file'],
        ['TAB', 'completa automaticamente comandi e nomi di file'],
        ['↑ / ↓', 'scorre i comandi già scritti'],
        ['opzioni', 'modificano un comando, iniziano con - (es. -a)'],
        ['ls -a', 'mostra anche i file nascosti'],
        ['.file', 'un nome che inizia con un punto è nascosto (non protetto!)'],
        ['flag', 'un codice segreto da trovare, come nelle gare CTF'],
      ],
    },

    // ------------------------------------------------------------------ 1.4
    {
      id: 'ch01-m4',
      title: 'Leggere il manuale',
      tagline: 'man, ls -l, echo e history: imparare da soli.',
      xp: 150,
      steps: [
        {
          kind: 'lesson',
          title: 'Il segreto dei professionisti',
          body: `@nyx: Vuoi sapere il segreto dei migliori hacker? Non ricordano tutto. Sanno **cercare**. Il manuale è il tuo migliore amico.

Su Linux quasi ogni comando ha una **pagina di manuale** che spiega a cosa serve e quali opzioni ha. Si apre con:

\`\`\`
man NOMECOMANDO
\`\`\`

La pagina è divisa in sezioni:
- **NOME**: cos'è il comando
- **SINTASSI**: come si scrive. Le parti tra \`[parentesi quadre]\` sono **facoltative**, i \`...\` vogliono dire "anche più di uno"
- **DESCRIZIONE**: cosa fa
- **OPZIONI**: le varianti disponibili
- **ESEMPI**

?? Il vero \`man\` di Linux è in inglese. Qui è in italiano per imparare, ma più avanti è importante abituarsi all'inglese tecnico: è la lingua della sicurezza informatica.`,
        },
        {
          kind: 'task',
          title: 'Apri il manuale',
          body: `Leggi il manuale del comando \`ls\`:

\`\`\`
man ls
\`\`\`

Cerca nella sezione OPZIONI cosa fa \`-l\`.`,
          objective: 'Apri il manuale di ls.',
          hints: ['Scrivi: man ls'],
          check: (ev) => ev.type === 'man' && ev.topic === 'ls',
          success: `L'opzione \`-l\` mostra il **formato lungo**. Proviamola.`,
        },
        {
          kind: 'task',
          title: 'Il formato lungo',
          body: `Nella tua home, prova:

\`\`\`
ls -l
\`\`\`

Le opzioni si possono anche combinare: \`ls -la\` = \`ls -l -a\`, cioè formato lungo + file nascosti.`,
          objective: 'Elenca i file in formato lungo con ls -l.',
          hints: ['Scrivi: ls -l (trattino e una L minuscola, non il numero 1)'],
          check: (ev) => ev.type === 'ls' && ev.flags.includes('l'),
          success: `Ogni riga ora ha molte informazioni. Le spieghiamo nella prossima lezione.`,
        },
        {
          kind: 'lesson',
          title: 'Leggere ls -l',
          body: `Prendiamo una riga come esempio:

\`\`\`
-rw-r--r--  1 edge  edge    244 Nov 11 21:04 README.txt
\`\`\`

Da sinistra a destra:
- \`-\` → il **tipo**: \`-\` file, \`d\` cartella (*directory*)
- \`rw-r--r--\` → i **permessi** (letti a gruppi di tre: proprietario, gruppo, tutti gli altri). \`r\` = leggere, \`w\` = scrivere, \`x\` = eseguire, \`-\` = permesso assente
- \`1\` → numero di collegamenti (per ora ignoralo)
- \`edge\` → il **proprietario** del file
- \`edge\` → il **gruppo** proprietario
- \`244\` → la **dimensione** in byte
- \`Nov 11 21:04\` → data dell'ultima **modifica**
- \`README.txt\` → il **nome**

?? I permessi sono uno dei punti in cui si nascondono più vulnerabilità. Un file di password leggibile da "tutti gli altri" (\`r\` nell'ultimo gruppo) è un regalo per un attaccante. Li studieremo a fondo nel capitolo su Linux avanzato.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Cosa ti dice la riga `drwx------ 2 root root 4096 Nov 11 21:04 root`?',
          options: [
            'È un file che chiunque può leggere',
            'È una cartella a cui può accedere solo il proprietario, root',
            'È un programma da eseguire',
            'È una cartella vuota a cui tutti possono accedere',
          ],
          correct: 1,
          explain: `\`d\` = cartella. \`rwx\` = il proprietario (root) può fare tutto. \`------\` = gruppo e altri non possono fare niente. Ecco perché prima hai ricevuto *Permission denied*.`,
        },
        {
          kind: 'task',
          title: 'L\'eco',
          body: `\`echo\` stampa semplicemente il testo che gli scrivi. Sembra inutile, ma negli **script** (programmi fatti di comandi) è usatissimo.

Le **virgolette** raggruppano più parole in un solo argomento:

\`\`\`
echo "Ciao Night City"
\`\`\``,
          objective: 'Usa echo per stampare un messaggio.',
          hints: ['Scrivi: echo "Ciao Night City"'],
          check: (ev) => ev.type === 'command' && ev.name === 'echo' && ev.args.length > 0,
          success: `Il terminale ha ripetuto il tuo testo. Più avanti userai \`echo\` per scrivere dentro i file e per costruire i tuoi primi script.`,
        },
        {
          kind: 'task',
          title: 'Le tracce che lasci',
          body: `La shell ricorda tutti i comandi che scrivi. Guardali con:

\`\`\`
history
\`\`\``,
          objective: 'Mostra la cronologia dei comandi con history.',
          hints: ['Scrivi: history'],
          check: isCmd('history'),
          success: `Ecco tutto quello che hai fatto finora, numerato.

!! Questo è importante per entrambi i lati. Un **attaccante** che entra in un server legge la cronologia degli altri utenti per scoprire password scritte per errore e comandi interessanti. Un **difensore** che indaga su un'intrusione legge la cronologia per capire cosa ha fatto l'intruso. Su Linux viene salvata nel file nascosto \`~/.bash_history\`.`,
        },
        {
          kind: 'task',
          title: 'Fare pulizia',
          body: `Lo schermo è pieno? \`clear\` lo ripulisce (la cronologia resta).

\`\`\`
clear
\`\`\``,
          objective: 'Pulisci lo schermo con clear.',
          hints: ['Scrivi: clear'],
          check: isCmd('clear'),
          success: `Schermo pulito. Sei pronto per il tuo primo lavoro vero.`,
        },
      ],
      recap: [
        ['man COMANDO', 'apre il manuale di un comando'],
        ['[ ] nella sintassi', 'parte facoltativa'],
        ['ls -l', 'formato lungo: tipo, permessi, proprietario, dimensione, data'],
        ['r w x', 'permessi di lettura, scrittura, esecuzione'],
        ['echo TESTO', 'stampa un testo'],
        ['history', 'cronologia dei comandi (salvata in ~/.bash_history)'],
        ['clear', 'pulisce lo schermo'],
      ],
    },

    // ------------------------------------------------------------------ 1.5 laboratorio
    {
      id: 'ch01-m6',
      title: 'Costruire e demolire',
      tagline: 'Creare, copiare, spostare e cancellare: mkdir, touch, cp, mv, rm.',
      xp: 150,
      steps: [
        {
          kind: 'lesson',
          title: 'Mettere le mani sui file',
          body: `@nyx: Finora hai solo guardato. Ora impari a **cambiare** le cose: creare cartelle, scrivere file, copiarli, spostarli e cancellarli. Sono le operazioni che farai mille volte al giorno, in attacco come in difesa.

I comandi sono brevi e vengono dall'inglese:
- \`mkdir\` → *make directory*, crea una cartella
- \`touch\` → crea un file vuoto
- \`cp\` → *copy*, copia
- \`mv\` → *move*, sposta (e rinomina)
- \`rm\` → *remove*, cancella

Lavoreremo nella cartella \`laboratorio\`, dove puoi pasticciare quanto vuoi.`,
        },
        {
          kind: 'task',
          title: 'Una cartella nuova',
          body: `Entra nel laboratorio e crea una cartella chiamata \`appunti\`:

\`\`\`
cd laboratorio
mkdir appunti
\`\`\`

Poi controlla con \`ls\` che ci sia.`,
          objective: 'Crea la cartella laboratorio/appunti.',
          hints: ['Prima: cd laboratorio', 'Poi: mkdir appunti'],
          check: (ev, sh) => ev.type === 'fsop' && ev.op === 'mkdir' && ev.paths[0] === `${sh.home}/laboratorio/appunti`,
          success: `Cartella creata. Ricorda: \`mkdir -p a/b/c\` crea anche tutte le cartelle intermedie in un colpo solo.`,
        },
        {
          kind: 'lesson',
          title: 'Scrivere dentro un file: > e >>',
          body: `Hai visto che \`echo\` stampa un testo sullo schermo. Con il simbolo \`>\` puoi **mandare quell'output dentro un file** invece che sullo schermo. Si chiama **redirezione**:

\`\`\`
echo "prima riga" > note.txt
\`\`\`

Attenzione alla differenza:
- \`>\` → **sovrascrive**: se il file esisteva, il vecchio contenuto sparisce
- \`>>\` → **aggiunge** in fondo al file

\`\`\`
echo "seconda riga" >> note.txt
\`\`\`

La redirezione funziona con **qualsiasi** comando, non solo echo: \`ls -la > elenco.txt\` salva l'elenco dei file. È così che un analista salva le prove: \`ps aux > processi.txt\`.

!! Un \`>\` al posto di \`>>\` ha cancellato più file importanti di quanto immagini. Prima di premere Invio, controlla quanti \`>\` hai scritto.`,
        },
        {
          kind: 'task',
          title: 'Il tuo primo file',
          body: `Crea il file \`appunti/comandi.txt\` con dentro una riga, e poi aggiungine una seconda:

\`\`\`
echo "ls elenca i file" > appunti/comandi.txt
echo "cd cambia cartella" >> appunti/comandi.txt
\`\`\`

Controlla il risultato con \`cat appunti/comandi.txt\`.`,
          objective: 'Scrivi almeno due righe in appunti/comandi.txt.',
          hints: [
            'Sei in laboratorio? Controlla con pwd.',
            'echo "ls elenca i file" > appunti/comandi.txt e poi echo "cd cambia cartella" >> appunti/comandi.txt',
          ],
          check: (ev, sh) => {
            if (ev.type !== 'write') return false;
            const n = sh.fs.get(`${sh.home}/laboratorio/appunti/comandi.txt`);
            return !!n && n.type === 'file' && n.content.trim().split('\n').length >= 2;
          },
          success: `Il file ha due righe. Hai appena usato la redirezione: uno degli strumenti più potenti della shell.`,
        },
        {
          kind: 'task',
          title: 'Copia di sicurezza',
          body: `Prima di modificare un file importante, un professionista ne fa sempre una **copia di backup**:

\`\`\`
cp appunti/comandi.txt appunti/comandi.bak
\`\`\`

\`cp ORIGINE DESTINAZIONE\`: prima cosa copiare, poi dove.`,
          objective: 'Copia comandi.txt in comandi.bak.',
          hints: ['Dalla cartella laboratorio: cp appunti/comandi.txt appunti/comandi.bak'],
          check: (ev) => ev.type === 'fsop' && ev.op === 'cp' && ev.paths[1].endsWith('comandi.bak'),
          success: `Copia fatta.

?? Ricordi l'audit del capitolo 03? I file \`.bak\` dimenticati in giro sono una miniera per gli attaccanti. Fai i backup, ma poi mettili al sicuro.`,
        },
        {
          kind: 'task',
          title: 'Rinominare',
          body: `Su Linux non esiste un comando "rinomina": si usa \`mv\` (*move*). Spostare un file nella stessa cartella con un nome diverso **è** rinominarlo.

Dai un nome migliore alla bozza:

\`\`\`
mv bozza.txt idee.txt
\`\`\``,
          objective: 'Rinomina bozza.txt in idee.txt.',
          hints: ['Dalla cartella laboratorio: mv bozza.txt idee.txt'],
          check: (ev, sh) => ev.type === 'fsop' && ev.op === 'mv' && ev.paths[1] === `${sh.home}/laboratorio/idee.txt`,
          success: `Rinominato. \`mv\` serve anche a spostare: \`mv idee.txt appunti/\` metterebbe il file dentro la cartella appunti.`,
        },
        {
          kind: 'lesson',
          title: 'rm: niente cestino',
          body: `\`rm\` cancella i file. Ma attenzione: **su Linux non c'è il cestino**. Un file cancellato con \`rm\` è sparito per sempre. Il sistema non chiede nemmeno conferma.

- \`rm file.txt\` → cancella un file
- \`rm -r cartella\` → cancella una cartella **con tutto quello che contiene**
- \`rm -f\` → *force*, non si lamenta nemmeno se il file non esiste

!! \`rm -rf\` sul percorso sbagliato è uno degli errori più catastrofici che si possano fare: c'è chi ha cancellato server interi così. Regola d'oro: **rileggi il comando prima di premere Invio**, e non lanciare mai \`rm -rf\` copiato da Internet senza capirlo.

?? Un attaccante che entra in un sistema spesso usa \`rm\` per cancellare le proprie tracce. Per questo i log vanno copiati altrove in tempo reale (ricordi il SIEM?).`,
        },
        {
          kind: 'task',
          title: 'Pulizia',
          body: `Il file \`vecchio_log.txt\` non serve più. Cancellalo:

\`\`\`
rm vecchio_log.txt
\`\`\``,
          objective: 'Cancella laboratorio/vecchio_log.txt.',
          hints: ['Dalla cartella laboratorio: rm vecchio_log.txt'],
          check: (ev, sh) => ev.type === 'fsop' && ev.op === 'rm' && ev.paths[0] === `${sh.home}/laboratorio/vecchio_log.txt`,
          success: `Cancellato, e senza ritorno. Ora guarda il risultato del tuo lavoro.`,
        },
        {
          kind: 'task',
          title: 'Il quadro d\'insieme',
          body: `\`tree\` disegna una cartella e tutte le sottocartelle come un albero. Torna nella home e guarda il laboratorio:

\`\`\`
cd
tree laboratorio
\`\`\``,
          objective: 'Visualizza il laboratorio con tree.',
          hints: ['Scrivi: tree laboratorio (dalla home)', 'Se sei dentro laboratorio basta: tree'],
          check: (ev) => ev.type === 'command' && ev.name === 'tree' && ev.ok,
          success: `Ecco tutto quello che hai costruito. Ora sai creare, scrivere, copiare, rinominare e cancellare: sei pronto per l'esame del capitolo.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Il file `report.txt` contiene 50 righe di lavoro. Cosa succede se scrivi `echo "fine" > report.txt`?',
          options: [
            'Aggiunge "fine" in fondo al file',
            'Il file ora contiene solo "fine": le 50 righe sono perse',
            'Dà errore perché il file esiste già',
            'Crea un nuovo file report2.txt',
          ],
          correct: 1,
          explain: `\`>\` sovrascrive senza chiedere. Per aggiungere in fondo serve \`>>\`. Un errore classico, ed è per questo che si fanno i backup con \`cp\` prima di toccare file importanti.`,
        },
      ],
      recap: [
        ['mkdir [-p] CARTELLA', 'crea una cartella (-p anche le intermedie)'],
        ['touch FILE', 'crea un file vuoto'],
        ['comando > file', 'scrive l\'output nel file, sovrascrivendolo'],
        ['comando >> file', 'aggiunge l\'output in fondo al file'],
        ['cp ORIGINE DEST', 'copia (la destinazione esistente viene sovrascritta)'],
        ['mv ORIGINE DEST', 'sposta o rinomina'],
        ['rm [-r] FILE', 'cancella per sempre: niente cestino!'],
        ['tree', 'mostra le cartelle come un albero'],
      ],
    },

    // ------------------------------------------------------------------ 1.6 esame
    {
      id: 'ch01-m5',
      title: 'Il primo contratto',
      tagline: 'Esame del capitolo: trova il codice di Rook da solo.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Messaggio in arrivo',
          body: `@rook: Allora sei tu il nuovo. Nyx parla bene di te, e Nyx non parla bene di nessuno.

@rook: Ho un lavoretto. Ti ho mandato dei file nel deck, in **contratti/rook**. Leggi il brief, trova il codice d'accesso e mandamelo. Niente mano sulla spalla stavolta.

@nyx: È il tuo esame per questo capitolo. Hai tutto quello che ti serve: \`cd\`, \`ls\`, \`ls -a\`, \`cat\`. Se ti blocchi c'è il pulsante **Suggerimento**, ma prova prima da solo. Anche sbagliare strada fa parte del lavoro.`,
        },
        {
          kind: 'task',
          title: 'Il codice di Rook',
          body: `Obiettivo: trova il codice d'accesso nelle consegne di Rook e invialo con \`flag\`.

Metodo consigliato (è lo stesso che si usa nei test reali):
- leggi **sempre** prima le istruzioni (il brief)
- esplora con ordine, una cartella alla volta
- non fidarti di quello che si vede: controlla anche i file nascosti`,
          objective: 'Trova il codice in contratti/rook e invialo con flag.',
          hints: [
            'Comincia con: cd contratti/rook e poi ls. Leggi brief.txt con cat.',
            'Il brief parla di un "doppio fondo". Le cose nascoste iniziano con un punto: usa ls -a dentro ogni consegna.',
            'Guarda in consegna_b con ls -a: c\'è una cartella nascosta .doppiofondo. Entra e leggi il file.',
            'cat contratti/rook/consegna_b/.doppiofondo/codice.txt, poi flag NC{d0pp10_f0nd0}',
          ],
          answer: ['NC{d0pp10_f0nd0}'],
          success: `@rook: Preciso. Mi piaci. Ci sentiamo per il prossimo lavoro: si tratta di una **rete**.

Hai completato il Capitolo 01! Ora sai muoverti in un sistema Linux, leggere file, trovare le cose nascoste e usare il manuale. Sono le basi su cui costruiremo tutto il resto.`,
        },
      ],
      recap: [
        ['Metodo', 'leggi le istruzioni, esplora con ordine, controlla i file nascosti'],
        ['ls -a ovunque', 'le cose interessanti spesso iniziano con un punto'],
        ['Percorsi lunghi', 'puoi scrivere cat a/b/c/file.txt senza entrare in ogni cartella'],
      ],
    },
  ],
};
