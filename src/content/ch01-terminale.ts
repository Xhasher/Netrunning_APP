// Capitolo 01 · Jack-in. Per chi non ha mai aperto un terminale.
//
// Trama: una notte sola. Nyx ti mette davanti un deck e ti dà tempo fino all'alba per
// dimostrare che puoi lavorare per Rook, il fixer. Ogni missione è una prova che lei
// ti prepara; l'ultima è il primo lavoro vero.
//
// Regole di scrittura del capitolo:
// - si scrive nel terminale dopo UNA schermata; la teoria arriva subito dopo aver provato
// - ogni termine nuovo è spiegato nel punto in cui compare
// - ogni comando nuovo ha la sua lezione "Nyx spiega" (content/teach.ts), inserita in
//   automatico prima dell'esercizio: qui i compiti dicono cosa fare e perché, nella storia

import type { Chapter } from '../game/types';

const isCmd = (name: string) => (ev: { type: string; name?: string; ok?: boolean }) =>
  ev.type === 'command' && ev.name === name && ev.ok === true;

/** Versione dei contenuti in cui il capitolo è stato riscritto (passi nuovi). */
const V = 18;

export const CH01: Chapter = {
  id: 'ch01',
  code: '01',
  title: 'Jack-in',
  subtitle: 'Una notte per imparare il terminale, da zero',
  missions: [
    // ------------------------------------------------------------------ 1.1
    {
      id: 'ch01-m1',
      title: 'Una notte sola',
      tagline: 'Accendi il deck e scrivi il tuo primo comando.',
      xp: 100,
      steps: [
        {
          kind: 'lesson',
          title: 'Sopra Lo Scantinato',
          body: `Night City, le undici di sera. Una stanza sopra un bar che si chiama Lo Scantinato. Sul tavolo, tra due tazze di synth-caffè, c'è un computer nero grande quanto un libro.

@nyx: Mi chiamo Nyx. Faccio la netrunner da prima che tu nascessi: entro nei computer degli altri. Solo in quelli di chi mi paga per scoprire da dove potrebbe entrare un criminale, e con un contratto firmato. Sempre.

@nyx: Rook, il fixer che ci trova i lavori, ne ha uno per domattina e gli manca una persona. Gli ho detto che forse ce l'ho. Quindi hai **una notte** per dimostrarmi che non sei un turista.

@nyx: Quello sul tavolo è un **deck**: il tuo computer. Non ha icone e non ha il mouse. Gli si parla **scrivendo**. Niente teoria, per adesso: accendilo e prova.

!! Tutto quello che fai in questo gioco è simulato: il deck, i file, la rete. Nessun comando esce dal tuo telefono. Puoi sbagliare quanto vuoi, ed è il modo giusto per imparare.`,
        },
        {
          kind: 'task',
          lessonAfter: true,
          title: 'Chi sei?',
          body: `@nyx: La parte nera in basso è il **terminale**: lì scrivi, lì il deck ti risponde. Prima domanda che si fa a una macchina: *per te, io chi sono?*

Fai così:
- tocca la parte nera in basso (su PC: cliccaci sopra)
- scrivi la parola qui sotto, tutta minuscola e tutta attaccata
- premi **Invio**

\`\`\`
whoami
\`\`\`

È inglese: *who am I*, "chi sono io".`,
          objective: 'Scrivi whoami nel terminale e premi Invio.',
          hints: ['Scrivi esattamente: whoami (tutto minuscolo, senza spazi) e premi Invio.'],
          check: isCmd('whoami'),
          success: `Il deck ha risposto con il tuo nome. Hai appena dato il tuo primo **comando**: una parola che il computer capisce e a cui risponde.

@nyx: Visto? Tu scrivi, lui risponde. Tutto il resto del mestiere è questo, con parole diverse.`,
        },
        {
          kind: 'lesson',
          title: 'La riga che ti aspetta',
          body: `@nyx: Guarda il terminale. Prima del punto in cui scrivi c'è sempre una riga come questa:

\`\`\`
edge@deck:~$
\`\`\`

Si chiama **prompt** ("invito"): è il deck che ti dice *sono pronto, scrivi*. Non è decorazione: ogni pezzo ti dà un'informazione.

- \`edge\` → il tuo **nome utente** (nel tuo terminale c'è il nome che hai scelto)
- \`@\` → si legge "presso"
- \`deck\` → il **nome del computer** su cui stai lavorando
- \`~\` → la **cartella** in cui ti trovi. Il simbolo \`~\` (si chiama *tilde*) vuol dire "la mia cartella personale"
- \`$\` → sei un **utente normale**

Se al posto di \`$\` ci fosse \`#\`, saresti **root**: l'amministratore, l'utente che su quel computer può fare qualsiasi cosa.

?? Quando lavorerai su dieci computer insieme, il prompt sarà l'unica cosa che ti dice *su quale* stai per premere Invio. Abituati a guardarlo.`,
        },
        {
          kind: 'task',
          title: 'Come si chiama il deck?',
          body: `@nyx: Il nome del computer lo vedi nel prompt, ma un professionista non si fida di quello che "si vede": **chiede** alla macchina.

\`\`\`
hostname
\`\`\`

*host* è il termine tecnico per "computer collegato a una rete"; *name* è il nome.`,
          objective: 'Scopri il nome del computer con hostname.',
          hints: ['Scrivi: hostname'],
          check: isCmd('hostname'),
          success: `Si chiama **deck**: lo stesso nome che vedi nel prompt dopo la \`@\`. Ora sai chi sei e su che macchina sei.`,
        },
        {
          kind: 'task',
          title: 'Sbagliare è normale',
          body: `@nyx: Adesso sbaglia. Sul serio: voglio che tu veda cosa succede.

Linux, il sistema che fa funzionare questo deck, distingue le lettere MAIUSCOLE dalle minuscole. Per lui \`whoami\` e \`Whoami\` sono due parole diverse. (In inglese si dice che è *case-sensitive*.)

Scrivi apposta il comando con la W maiuscola:

\`\`\`
Whoami
\`\`\``,
          objective: 'Prova a scrivere Whoami con la W maiuscola.',
          hints: ['Scrivi: Whoami (con la W maiuscola). Vedrai un errore: è voluto!'],
          check: (ev) => ev.type === 'command' && ev.name === 'Whoami' && !ev.ok,
          success: `\`command not found\`: "comando non trovato". È l'errore che vedrai più spesso in assoluto, e quasi sempre vuol dire che hai sbagliato a scrivere.

@nyx: Non è successo niente di grave, vero? Un errore non rompe il deck. Ti dice cosa non ha capito: **leggilo sempre**, con calma. Chi salta i messaggi d'errore resta fermo per ore.`,
        },
        {
          kind: 'task',
          title: 'Chiedere aiuto',
          body: `@nyx: Seconda cosa che devi sapere da subito: **nessuno ricorda tutto**. Nemmeno io. Bisogna sapere dove guardare.

Questo comando elenca tutte le parole che il deck capisce, con una riga di spiegazione ciascuna:

\`\`\`
help
\`\`\``,
          objective: 'Guarda l\'elenco dei comandi con help.',
          hints: ['Scrivi: help'],
          check: isCmd('help'),
          success: `Sono tanti, e quasi tutti ti sono sconosciuti. Va benissimo: li imparerai uno alla volta, usandoli.

In fondo all'elenco ci sono due comandi che esistono solo in questo gioco: \`hint\` ti dà un suggerimento quando sei bloccato, \`flag\` serve a consegnare una risposta. Li userai presto.`,
        },
        {
          kind: 'lesson',
          title: 'Cosa hai appena usato',
          body: `@nyx: Ora che ci hai messo le mani, ti dico come si chiamano le cose. Tre parole, e le sentirai ogni giorno.

**Terminale**: la finestra nera in cui scrivi. È solo uno schermo e una tastiera.

**Shell**: il programma che sta dietro al terminale. Legge quello che scrivi, lo esegue e ti mostra la risposta. Su Linux la shell più diffusa si chiama **bash**. (Per questo gli errori iniziano con \`bash:\`: è lei che ti parla.)

**Comando**: la parola che scrivi. Quasi sempre è il nome di un piccolo programma: \`whoami\` è un programma che stampa il tuo nome.

Perché scrivere, se esistono le finestre e le icone?
- i computer che contano, i **server**, spesso non hanno né schermo né mouse: si comandano solo così
- una volta imparato, è molto **più veloce**
- un comando scritto si può **ripetere** identico, mille volte, anche da solo
- quasi tutti gli strumenti di chi fa sicurezza funzionano così

?? Un **server** è un computer che offre un servizio ad altri computer: mostra un sito, conserva la posta, custodisce dei dati. Di solito sta acceso giorno e notte, in una stanza dove non entra nessuno.`,
        },
        {
          kind: 'lesson',
          title: 'Linux',
          body: `@nyx: Ultima cosa per stasera, poi si riparte a scrivere.

Un computer, da solo, è un mucchio di pezzi: un processore che fa i calcoli, una memoria, un disco. Per farli lavorare insieme serve un programma principale, che parte per primo e gestisce tutto il resto: i file, la rete, gli altri programmi. Si chiama **sistema operativo**.

Ne conosci già qualcuno: **Windows** sui PC, **Android** sul telefono, **macOS** e **iOS** sui prodotti Apple.

**Linux** è un altro sistema operativo. È gratuito, e il suo codice è pubblico: chiunque può leggerlo e controllarlo (si dice *open source*). Non lo vedi quasi mai, ma è ovunque:
- sulla grande maggioranza dei server di Internet: i siti che visiti girano quasi tutti su Linux
- dentro Android, che è costruito sopra Linux
- nei router, nelle TV, nelle telecamere, nelle auto

Linux esiste in tante "confezioni", chiamate **distribuzioni**: Ubuntu, Debian, Kali... Cambiano i programmi inclusi e l'aspetto, ma i comandi che impari qui funzionano su tutte.

@nyx: Per questo cominciamo da qui. Chi fa sicurezza passa la vita su Linux: è il sistema che dovrai difendere, ed è quello su cui girano gli attrezzi con cui lavorerai.`,
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
        ['comando', 'una parola che il computer capisce e a cui risponde'],
        ['terminale / shell', 'il terminale è la finestra; la shell (bash) è il programma che esegue i comandi'],
        ['prompt', 'utente@computer:cartella$ — $ utente normale, # root'],
        ['whoami', 'mostra il tuo nome utente'],
        ['hostname', 'mostra il nome del computer'],
        ['help', 'elenca i comandi disponibili'],
        ['command not found', 'il comando non esiste: quasi sempre un errore di battitura'],
        ['Linux', 'sistema operativo gratuito, usato dalla maggior parte dei server'],
      ],
    },

    // ------------------------------------------------------------------ 1.2
    {
      id: 'ch01-m2',
      title: 'Le stanze del deck',
      tagline: 'Cartelle, percorsi e come muoversi: pwd, ls, cd.',
      xp: 150,
      steps: [
        {
          kind: 'lesson',
          title: 'Un edificio al buio',
          body: `Mezzanotte. Nyx finisce il caffè.

@nyx: Il deck non è vuoto. Ci ho messo dentro tutto quello che ti servirà nei prossimi lavori. Ma prima devi imparare a **camminarci dentro**, e senza vedere niente: come in un edificio al buio, con una torcia.

Tutto quello che un computer conserva sta dentro dei **file**: un documento, una foto, un programma sono file. Per non fare confusione, i file stanno dentro delle **cartelle** (in inglese *directory*), e una cartella può contenere altre cartelle.

Su Linux c'è **un solo grande edificio**. La porta d'ingresso è una cartella speciale, la **radice** (*root*), che si scrive con una barra: \`/\`. Tutto il resto sta lì dentro.

\`\`\`
/                 ← la radice: contiene tutto
├── bin/          ← i programmi di base (i comandi)
├── etc/          ← le impostazioni del sistema
├── home/         ← le cartelle personali degli utenti
│   └── edge/     ← la TUA cartella personale
├── root/         ← la cartella dell'amministratore
├── tmp/          ← file temporanei
└── var/          ← dati che cambiano, come i registri
\`\`\`

La tua cartella personale si chiama **home** ("casa"). È il posto dove parti ogni volta che accendi il deck, ed è tua: lì puoi fare quello che vuoi.

?? Questi nomi sono uguali su quasi tutti i Linux del mondo. Impararli una volta vuol dire sapersi orientare su qualsiasi server.`,
        },
        {
          kind: 'task',
          title: 'Dove mi trovo?',
          body: `@nyx: Il terminale è sempre "dentro" una cartella, anche se non la vedi. Prima regola al buio: sapere in che stanza sei.

\`\`\`
pwd
\`\`\``,
          objective: 'Scopri in quale cartella ti trovi con pwd.',
          hints: ['Scrivi: pwd'],
          check: isCmd('pwd'),
          success: `La risposta è un **percorso**: la strada per arrivare dove sei, partendo dalla radice. Si legge da sinistra a destra, e ogni \`/\` vuol dire "entra in": dalla radice entra in \`home\`, poi nella cartella con il tuo nome.

Quella è la tua home: la stessa che il prompt abbrevia con \`~\`.`,
        },
        {
          kind: 'task',
          title: 'Cosa c\'è qui?',
          body: `@nyx: Sai dove sei. Ora accendi la torcia.

\`\`\`
ls
\`\`\``,
          objective: 'Elenca il contenuto della tua home con ls.',
          hints: ['Scrivi: ls (sono una L e una S minuscole)'],
          check: (ev, sh) => ev.type === 'ls' && ev.path === sh.home,
          success: `Quelle che finiscono con \`/\` (in blu) sono **cartelle**; \`README.txt\` è un **file**.

@nyx: Sono tante, lo so. Sono i lavori che ti aspettano: ogni cartella è un caso. Stanotte te ne servono solo due: \`missioni\` e \`laboratorio\`. Le altre, per ora, non aprirle. Tanto non capiresti niente.

?? Su Linux l'estensione (\`.txt\`) è solo un'abitudine per le persone: un file può chiamarsi come vuole, anche senza estensione.`,
        },
        {
          kind: 'task',
          title: 'Entrare in una cartella',
          body: `@nyx: Entra in \`missioni\`. E mentre lo fai, tieni d'occhio il prompt.

\`\`\`
cd missioni
\`\`\``,
          objective: 'Entra nella cartella missioni con cd.',
          hints: ['Scrivi: cd missioni', 'Se sei in un\'altra cartella, prima torna a casa con: cd'],
          check: (ev, sh) => ev.type === 'cd' && ev.path === sh.home + '/missioni',
          success: `Il prompt è cambiato da \`~\` a \`~/missioni\`: sei dentro.

Hai notato che \`cd\` non ha risposto niente? Su Linux vale la regola **"nessuna notizia, buona notizia"**: quando un comando sta zitto, è andato tutto bene.`,
        },
        {
          kind: 'lesson',
          since: V,
          title: 'Comando e argomento',
          body: `@nyx: Fermati un secondo. Hai appena fatto una cosa nuova senza accorgertene.

\`whoami\` e \`pwd\` erano una parola sola. \`cd missioni\` sono **due**:

\`\`\`
cd missioni
\`\`\`

- \`cd\` è il **comando**: *cosa* fare (cambiare cartella)
- \`missioni\` è l'**argomento**: *su cosa* farlo (quale cartella)

In mezzo c'è uno **spazio**, ed è obbligatorio: è lo spazio a dire al deck dove finisce il comando e dove comincia l'argomento. \`cdmissioni\`, tutto attaccato, per lui è il nome di un comando che non esiste.

Quasi tutti i comandi funzionano così: **il comando, uno spazio, la cosa su cui lavorare**. Alcuni, come \`pwd\`, non hanno bisogno di argomenti. Altri ne accettano più di uno, sempre separati da spazi.`,
        },
        {
          kind: 'task',
          ownLesson: true,
          title: 'Tornare indietro',
          body: `@nyx: Sei entrato. Ora esci.

In ogni cartella esistono due nomi speciali, che non vedi ma ci sono sempre:
- \`.\` (un punto) → **questa** cartella
- \`..\` (due punti) → la cartella **che contiene** questa: quella un piano sopra

Quindi per salire di un piano:

\`\`\`
cd ..
\`\`\`

Attento allo spazio tra \`cd\` e i due punti: \`..\` è l'argomento.`,
          objective: 'Torna nella cartella superiore con cd ..',
          hints: ['Scrivi: cd .. (cd, uno spazio, due punti)'],
          check: (ev) => ev.type === 'command' && ev.name === 'cd' && ev.args[0]?.replace(/\/$/, '') === '..' && ev.ok,
          success: `Il prompt è tornato a \`~\`: sei di nuovo nella tua home.`,
        },
        {
          kind: 'lesson',
          title: 'Due modi di indicare la strada',
          body: `@nyx: Finora hai detto al deck "entra nella stanza qui accanto". Funziona finché la stanza è accanto. Per andare lontano serve l'indirizzo completo.

Ci sono due modi di indicare dove si trova un file o una cartella.

**Percorso assoluto**: comincia sempre con \`/\`, cioè parte dalla radice. È un indirizzo completo, con città e via: funziona da **qualunque** cartella tu sia.

\`\`\`
/home/edge/missioni
\`\`\`

**Percorso relativo**: **non** comincia con \`/\`. Parte dalla cartella in cui sei adesso. È come dire "la seconda porta a destra": dipende da dove ti trovi.

\`\`\`
missioni
\`\`\`

Se sei nella tua home, i due percorsi qui sopra portano nello stesso posto. Se sei altrove, il secondo non funziona più; il primo sì.

Come si riconoscono? Guarda il **primo carattere**: se è \`/\` è assoluto, altrimenti è relativo.

Due scorciatoie che userai sempre:
- \`~\` → la tua home, ovunque tu sia
- \`cd\` da solo, senza argomento → ti riporta a casa`,
        },
        {
          kind: 'task',
          title: 'Visita di sistema',
          body: `@nyx: Usciamo dalla tua cartella. Vai a vedere dove il sistema tiene le sue impostazioni, usando un percorso assoluto:

\`\`\`
cd /etc
\`\`\`

Poi guardati intorno con \`ls\`.`,
          objective: 'Vai in /etc ed elencane il contenuto con ls.',
          hints: ['Prima: cd /etc', 'Poi: ls'],
          check: (ev) => ev.type === 'ls' && ev.path === '/etc',
          success: `Il prompt ora mostra \`/etc\` e non più \`~\`: sei fuori da casa tua.

Qui stanno i file con le impostazioni del sistema. Uno si chiama \`passwd\` e contiene l'elenco degli utenti: lo aprirai tra qualche capitolo.`,
        },
        {
          kind: 'task',
          title: 'Vietato l\'ingresso',
          body: `@nyx: Non tutte le porte si aprono. Prova a entrare nella cartella personale dell'amministratore:

\`\`\`
cd /root
\`\`\``,
          objective: 'Prova a entrare in /root.',
          hints: ['Scrivi: cd /root'],
          check: (ev, sh) => ev.type === 'command' && ev.name === 'cd' && !ev.ok && !!ev.args[0] && sh.abs(ev.args[0]) === '/root',
          success: `\`Permission denied\`: **permesso negato**. La cartella esiste, ma il tuo utente non ha il diritto di entrarci.

Linux controlla, per ogni file e ogni cartella, *chi* può fare *cosa*. Si chiamano **permessi**, e sono la prima difesa di qualsiasi sistema.

@nyx: Ricordati questa porta chiusa. Metà del mio lavoro è controllare che porte così siano chiuse davvero. L'altra metà è scoprire quelle che qualcuno ha lasciato aperte.`,
        },
        {
          kind: 'task',
          ownLesson: true,
          title: 'Casa dolce casa',
          body: `@nyx: Torna a casa. Hai tre modi, e portano tutti nello stesso posto:

\`\`\`
cd
\`\`\`

oppure \`cd ~\`, oppure il percorso assoluto della tua home (quello che ti ha stampato \`pwd\` all'inizio).`,
          objective: 'Torna nella tua home.',
          hints: ['Il modo più veloce: scrivi solo cd e premi Invio.'],
          check: (ev, sh) => ev.type === 'cd' && ev.path === sh.home,
          success: `Il prompt mostra di nuovo \`~\`.

@nyx: Dentro, fuori, lontano, di nuovo a casa. Sai camminare al buio. Mezz'ora fa non sapevi cosa fosse un terminale.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Sei in `/home/edge/missioni`. Dove ti porta il comando `cd ..`?',
          options: ['/', '/home', '/home/edge', '/home/edge/missioni/..'],
          correct: 2,
          explain: `\`..\` è la cartella che contiene quella in cui sei: da \`/home/edge/missioni\` si sale di **un** piano e si arriva a \`/home/edge\`.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Quale di questi è un percorso **assoluto**?',
          options: ['missioni/benvenuto.txt', '../etc', '/var/log/syslog', '~ (tilde)'],
          correct: 2,
          explain: `Un percorso assoluto inizia sempre con \`/\`. \`~\` è una scorciatoia che la shell trasforma nel percorso della tua home, ma scritta così non è un percorso assoluto.`,
        },
      ],
      recap: [
        ['file / cartella', 'i dati stanno nei file; le cartelle (directory) contengono file e altre cartelle'],
        ['/', 'la radice: la cartella che contiene tutto'],
        ['~', 'la tua cartella personale (home)'],
        ['pwd', 'mostra la cartella in cui ti trovi'],
        ['ls', 'elenca file e cartelle'],
        ['cd CARTELLA', 'entra in una cartella'],
        ['cd ..', 'sale di un livello'],
        ['cd', 'torna nella home'],
        ['argomento', 'ciò su cui il comando lavora, separato da uno spazio'],
        ['percorso assoluto / relativo', 'parte da / · parte da dove sei'],
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
          kind: 'lesson',
          since: V,
          title: 'L\'una di notte',
          body: `L'una. Dal bar di sotto sale la musica, attutita dal pavimento.

@nyx: Finora hai guardato i **nomi** delle cose. Ma un nome non ti dice niente: le informazioni stanno *dentro* i file. Istruzioni, impostazioni, registri di quello che è successo: su Linux quasi tutto è un file di testo che si può leggere.

@nyx: In \`missioni\` ti ho lasciato un messaggio. Leggilo. E leggilo bene, perché dentro c'è un indizio.`,
        },
        {
          kind: 'task',
          title: 'Leggere un file',
          body: `Il messaggio è nel file \`benvenuto.txt\`, dentro la cartella \`missioni\`. Dalla tua home:

\`\`\`
cat missioni/benvenuto.txt
\`\`\`

\`missioni/benvenuto.txt\` è un percorso relativo: "nella cartella \`missioni\`, il file \`benvenuto.txt\`". Stai leggendo un file in un'altra stanza senza entrarci.

(Se preferisci, puoi fare in due passi: \`cd missioni\` e poi \`cat benvenuto.txt\`. Il file è lo stesso.)`,
          objective: 'Leggi il file benvenuto.txt con cat.',
          hints: [
            'Il file si trova nella cartella missioni, dentro la tua home.',
            'Dalla home scrivi: cat missioni/benvenuto.txt',
          ],
          check: (ev, sh) => ev.type === 'read' && ev.path === sh.home + '/missioni/benvenuto.txt',
          success: `Hai letto il tuo primo file.

Nel messaggio Nyx dice che in quella cartella c'è un file che \`ls\` "non ti mostra". Tienilo a mente.`,
        },
        {
          kind: 'lesson',
          title: 'Due trucchi che ti salveranno la vita',
          body: `@nyx: Prima di andare a caccia, due scorciatoie. Le uso da vent'anni e le uso ogni trenta secondi.

**1. Il tasto TAB: completa al posto tuo**

Scrivi l'inizio di un nome e premi **TAB**: il deck completa il resto. Se ci sono più possibilità, te le elenca. Prova a scrivere \`cat miss\` e poi TAB.

Non serve solo a fare prima: se TAB **non completa**, vuol dire che quel nome non esiste. Hai scoperto l'errore prima ancora di premere Invio.

**2. La freccia SU: richiama i comandi già scritti**

Premi **↑** e ricompare l'ultimo comando. Premila ancora e torni indietro, uno alla volta. Hai sbagliato una lettera in un comando lungo? ↑, correggi, Invio.

Sul telefono trovi **TAB**, **↑** e **↓** nella barra sopra la tastiera, insieme ai simboli che servono più spesso (\`/\`, \`-\`, \`.\`, \`~\`, \`|\`).`,
        },
        {
          kind: 'task',
          ownLesson: true,
          title: 'Opzioni',
          body: `@nyx: Adesso la caccia. Su Linux un file il cui nome **comincia con un punto** è **nascosto**: \`ls\` fa finta di non vederlo.

Per farglielo mostrare si aggiunge al comando un'**opzione**: una parola in più, con un trattino davanti, che cambia il modo in cui il comando lavora.

\`\`\`
ls -a missioni
\`\`\`

Adesso i pezzi sono tre, separati da spazi:
- \`ls\` → il comando
- \`-a\` → l'opzione (*all*, "tutti": mostra anche i nascosti)
- \`missioni\` → l'argomento

Lo schema generale di ogni comando è questo: **comando, opzioni, argomenti**.

?? In inglese le opzioni si chiamano anche *flag*. Non confonderle con le **flag** delle gare di hacking, che incontrerai tra un minuto: stesso nome, cose diverse.`,
          objective: 'Mostra i file nascosti della cartella missioni con ls -a.',
          hints: ['Dalla home scrivi: ls -a missioni', 'Se sei già dentro missioni basta: ls -a'],
          check: (ev, sh) => ev.type === 'ls' && ev.path === sh.home + '/missioni' && ev.flags.includes('a'),
          success: `Sono comparsi \`.\` e \`..\` (i due nomi speciali che conosci già) e un file che prima non c'era: \`.nota_segreta\`.

!! "Nascosto" **non** vuol dire "protetto". È solo un modo per non ingombrare l'elenco. Chiunque scriva \`ls -a\` lo vede. Chi nasconde una password in un file con il punto davanti non ha nascosto niente.`,
        },
        {
          kind: 'task',
          title: 'La prima flag',
          body: `@nyx: Trovato. Adesso leggilo.

Usa \`cat\` come prima. Attento: il punto iniziale fa parte del nome.

Dentro c'è una **flag** ("bandierina"): un codice scritto così, \`NC{...}\`. Nelle gare di hacking, che si chiamano **CTF** (*Capture The Flag*, "cattura la bandiera"), si cercano proprio codici come questo, nascosti dentro i sistemi: chi lo trova dimostra di essere arrivato fin lì.

Quando l'hai trovata, consegnala con il comando del gioco \`flag\`, seguito dal codice:

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
          success: `Flag catturata! 🏴

@nyx: La prima non si scorda. E hai fatto esattamente quello che si fa nel lavoro vero: hai letto un indizio, hai capito cosa cercare, hai usato lo strumento giusto.`,
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
        ['opzione', 'cambia il modo in cui un comando lavora; inizia con - (es. -a)'],
        ['comando opzioni argomenti', 'lo schema di ogni comando, con gli spazi in mezzo'],
        ['ls -a', 'mostra anche i file nascosti'],
        ['.file', 'un nome che inizia con un punto è nascosto (non protetto!)'],
        ['flag', 'un codice da trovare e consegnare, come nelle gare CTF'],
      ],
    },

    // ------------------------------------------------------------------ 1.4
    {
      id: 'ch01-m4',
      title: 'Dieci minuti da solo',
      tagline: 'man, ls -l, echo e history: imparare a cavarsela.',
      xp: 150,
      steps: [
        {
          kind: 'lesson',
          title: 'Il segreto dei professionisti',
          body: `Le due. Nyx si alza e prende la giacca.

@nyx: Scendo a prendere altro caffè. Dieci minuti. Se ti blocchi **non chiamarmi**: domani, sul lavoro, non ci sarò.

@nyx: Ti dico il segreto di quelli bravi. Non ricordano tutto: sanno **cercare**. E la prima cosa in cui si cerca è il manuale, che su Linux sta dentro il computer.

Quasi ogni comando ha la sua **pagina di manuale**: spiega a cosa serve, come si scrive e quali opzioni ha. Si apre con \`man\` seguito dal nome del comando.

Le pagine hanno sempre le stesse sezioni:
- **NOME**: cosa fa, in una riga
- **SINTASSI**: come si scrive
- **DESCRIZIONE**: la spiegazione
- **OPZIONI**: l'elenco delle opzioni
- **ESEMPI**

Nella sintassi troverai due segni: ciò che sta tra parentesi quadre \`[ ]\` è **facoltativo**; le parole in MAIUSCOLO sono da **sostituire** con i tuoi valori.

?? Nel vero Linux il manuale è in inglese. Qui è in italiano, per imparare. Ma l'inglese tecnico è la lingua di questo mestiere: ci arriveremo.`,
        },
        {
          kind: 'task',
          title: 'Apri il manuale',
          body: `Nyx è uscita. Sei solo con il deck.

Conosci già \`ls\` e la sua opzione \`-a\`. Ne ha altre: scoprile dal manuale.

\`\`\`
man ls
\`\`\`

Cerca, nella sezione OPZIONI, cosa fa \`-l\`.`,
          objective: 'Apri il manuale di ls.',
          hints: ['Scrivi: man ls'],
          check: (ev) => ev.type === 'man' && ev.topic === 'ls',
          success: `Nel manuale c'è scritto: \`-l\` mostra il **formato lungo**, con molti più dettagli su ogni file. Nessuno te l'ha detto: l'hai trovato tu.`,
        },
        {
          kind: 'task',
          ownLesson: true,
          title: 'Il formato lungo',
          body: `Prova l'opzione che hai appena scoperto, nella tua home:

\`\`\`
ls -l
\`\`\`

È una elle minuscola, non il numero uno.`,
          objective: 'Elenca i file in formato lungo con ls -l.',
          hints: ['Scrivi: ls -l (trattino e una L minuscola, non il numero 1)'],
          check: (ev) => ev.type === 'ls' && ev.flags.includes('l'),
          success: `Ogni file adesso occupa una riga intera, piena di informazioni. Sembra un muro di simboli, ma si legge pezzo per pezzo: te lo spiego subito.

?? Le opzioni si possono unire dopo un solo trattino: \`ls -la\` vuol dire \`ls -l -a\`, cioè formato lungo **e** file nascosti.`,
        },
        {
          kind: 'lesson',
          title: 'Leggere ls -l',
          body: `Prendiamo una riga sola:

\`\`\`
-rw-r--r--  1 edge  edge    244 Nov 11 21:04 README.txt
\`\`\`

Da sinistra a destra:
- \`-\` → il **tipo**: \`-\` vuol dire file, \`d\` vuol dire cartella (*directory*)
- \`rw-r--r--\` → i **permessi**: chi può fare cosa con questo file
- \`1\` → un contatore tecnico: per ora ignoralo
- \`edge\` → il **proprietario**: l'utente a cui il file appartiene
- \`edge\` → il **gruppo**: un insieme di utenti che condividono gli stessi permessi
- \`244\` → la **dimensione**, in byte
- \`Nov 11 21:04\` → data e ora dell'ultima **modifica**
- \`README.txt\` → il **nome**

Un **byte** è l'unità di misura dei dati: in un file di testo, un byte è più o meno un carattere. Mille byte fanno un KB, un milione un MB, un miliardo un GB.

I **permessi** sono nove lettere, da leggere a gruppi di tre:
- le prime tre riguardano il **proprietario**
- le tre in mezzo il **gruppo**
- le ultime tre **tutti gli altri**

In ogni gruppo: \`r\` = può leggere (*read*), \`w\` = può modificare (*write*), \`x\` = può eseguire come programma (*execute*). Un trattino al posto della lettera vuol dire che quel permesso manca.

Quindi \`rw-r--r--\` si legge: il proprietario legge e modifica; il gruppo legge soltanto; gli altri leggono soltanto.

?? Non devi impararli a memoria stanotte: c'è un capitolo intero sui permessi. Per ora ti basta saperli riconoscere.`,
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
          explain: `\`d\` = cartella. \`rwx\` = il proprietario (root) può fare tutto. \`------\` = il gruppo e gli altri non possono fare niente. Ecco perché prima hai ricevuto *Permission denied* entrando in \`/root\`.`,
        },
        {
          kind: 'task',
          title: 'L\'eco',
          body: `Il terminale sa anche parlare. Il comando \`echo\` ripete sullo schermo il testo che gli scrivi.

Le **virgolette** servono a tenere insieme più parole: dicono al deck "questo è un pezzo unico, spazi compresi".

\`\`\`
echo "Ciao Night City"
\`\`\``,
          objective: 'Usa echo per stampare un messaggio.',
          hints: ['Scrivi: echo "Ciao Night City"'],
          check: (ev) => ev.type === 'command' && ev.name === 'echo' && ev.args.length > 0,
          success: `Il deck ha ripetuto la tua frase. Sembra un comando inutile, ma tra poco lo userai per **scrivere dentro i file**, e più avanti nei tuoi primi programmi.`,
        },
        {
          kind: 'task',
          title: 'Le tracce che lasci',
          body: `Il deck si ricorda tutto quello che gli scrivi. Guarda:

\`\`\`
history
\`\`\``,
          objective: 'Mostra la cronologia dei comandi con history.',
          hints: ['Scrivi: history'],
          check: isCmd('history'),
          success: `Ecco la tua notte, comando per comando, numerata. Errori compresi.

!! La cronologia viene salvata in un file nascosto della tua home, \`.bash_history\`. Chi entra in un computer che non è suo la legge per prima cosa: ci trova i comandi usati e, a volte, password scritte per sbaglio. Chi indaga su un'intrusione la legge per capire cosa ha fatto l'intruso. **Non scrivere mai una password dentro un comando.**`,
        },
        {
          kind: 'task',
          title: 'Fare pulizia',
          body: `Lo schermo è pieno. Senti i passi di Nyx sulle scale: meglio farsi trovare in ordine.

\`\`\`
clear
\`\`\``,
          objective: 'Pulisci lo schermo con clear.',
          hints: ['Scrivi: clear'],
          check: isCmd('clear'),
          success: `Schermo pulito. (Solo lo schermo: la cronologia è ancora tutta lì.)

@nyx: Sei ancora vivo. E non mi hai chiamato. Bene: adesso smetti di guardare e cominci a costruire.`,
        },
      ],
      recap: [
        ['man COMANDO', 'apre il manuale di un comando'],
        ['[ ] nella sintassi', 'parte facoltativa; MAIUSCOLO = da sostituire'],
        ['ls -l', 'formato lungo: tipo, permessi, proprietario, gruppo, dimensione, data'],
        ['r w x', 'permessi di lettura, modifica, esecuzione'],
        ['byte', 'unità di misura dei dati: circa un carattere di testo'],
        ['echo TESTO', 'stampa un testo'],
        ['history', 'cronologia dei comandi (salvata in ~/.bash_history)'],
        ['clear', 'pulisce lo schermo'],
      ],
    },

    // ------------------------------------------------------------------ 1.5 laboratorio
    {
      id: 'ch01-m6',
      title: 'Costruire e demolire',
      tagline: 'Creare, copiare, spostare e cancellare: mkdir, cp, mv e il resto.',
      xp: 150,
      steps: [
        {
          kind: 'lesson',
          title: 'Mettere le mani sui file',
          body: `Le tre. Nyx posa due tazze sul tavolo e si siede di fronte a te.

@nyx: Rook non sopporta i disordinati. Un runner che non ritrova i suoi appunti è un runner che perde le prove, e chi perde le prove non viene pagato.

@nyx: Finora hai solo **guardato**: non hai cambiato niente sul deck. Adesso impari a creare, copiare, spostare, cancellare. Sono i gesti che farai mille volte al giorno.

Lavorerai nella cartella \`laboratorio\`. Ci ho lasciato dentro un paio di file vecchi: lì puoi pasticciare quanto vuoi, non si rompe niente.

Un comando alla volta. Per ognuno ti spiego prima a cosa serve e come è fatto, poi lo provi tu.`,
        },
        {
          kind: 'task',
          title: 'Una cartella nuova',
          body: `@nyx: Per prima cosa, un posto per i tuoi appunti.

Entra nel laboratorio e crea una cartella chiamata \`appunti\`. Sono due comandi: scrivi il primo, premi Invio, poi il secondo.

\`\`\`
cd laboratorio
mkdir appunti
\`\`\`

Poi controlla con \`ls\` che ci sia.`,
          objective: 'Crea la cartella laboratorio/appunti.',
          hints: ['Prima: cd laboratorio', 'Poi: mkdir appunti'],
          state: (sh) => sh.fs.get(`${sh.home}/laboratorio/appunti`)?.type === 'dir',
          check: (ev, sh) => ev.type === 'fsop' && ev.op === 'mkdir' && ev.paths[0] === `${sh.home}/laboratorio/appunti`,
          success: `Cartella creata: \`ls\` ora mostra \`appunti/\`, con la barra finale delle cartelle.

Hai fatto la tua prima **modifica** al deck. Fino a un minuto fa quella cartella non esisteva.`,
        },
        {
          kind: 'task',
          title: 'Il tuo primo file',
          body: `@nyx: Una cartella vuota non serve a niente. Scrivici dentro.

Crea il file \`comandi.txt\` nella cartella \`appunti\`, con una prima riga; poi aggiungine una seconda. Guarda bene: il primo comando ha **un** \`>\`, il secondo ne ha **due**.

\`\`\`
echo "ls elenca i file" > appunti/comandi.txt
echo "cd cambia cartella" >> appunti/comandi.txt
\`\`\`

Poi leggi il risultato con \`cat appunti/comandi.txt\`.`,
          objective: 'Scrivi almeno due righe in laboratorio/appunti/comandi.txt.',
          hints: [
            'Sei in laboratorio? Controlla con pwd.',
            'echo "ls elenca i file" > appunti/comandi.txt e poi echo "cd cambia cartella" >> appunti/comandi.txt',
          ],
          state: (sh) => {
            const n = sh.fs.get(`${sh.home}/laboratorio/appunti/comandi.txt`);
            return !!n && n.type === 'file' && n.content.trim().split('\n').length >= 2;
          },
          check: (ev, sh) => {
            if (ev.type !== 'write') return false;
            const n = sh.fs.get(`${sh.home}/laboratorio/appunti/comandi.txt`);
            return !!n && n.type === 'file' && n.content.trim().split('\n').length >= 2;
          },
          success: `Il file ha due righe: il tuo primo appunto.

Hai visto che i due \`echo\` non hanno stampato niente sullo schermo? Il testo è andato nel file. Con \`>\` il file è stato creato; con \`>>\` la seconda riga è stata **aggiunta in fondo**.

!! Se anche la seconda volta avessi scritto un solo \`>\`, la prima riga sarebbe sparita. Prima di premere Invio, conta i \`>\`.`,
        },
        {
          kind: 'task',
          title: 'Copia di sicurezza',
          body: `@nyx: Regola che ti salverà il posto di lavoro: **prima di modificare un file importante, fanne una copia**. Si chiama *backup*.

Per abitudine, alle copie di sicurezza si dà l'estensione \`.bak\`.

\`\`\`
cp appunti/comandi.txt appunti/comandi.bak
\`\`\`

L'ordine è sempre lo stesso: prima **cosa** copiare, poi **dove**.`,
          objective: 'Copia comandi.txt in comandi.bak.',
          hints: ['Dalla cartella laboratorio: cp appunti/comandi.txt appunti/comandi.bak'],
          state: (sh) => sh.fs.get(`${sh.home}/laboratorio/appunti/comandi.bak`)?.type === 'file',
          check: (ev) => ev.type === 'fsop' && ev.op === 'cp' && ev.paths[1].endsWith('comandi.bak'),
          success: `Ora i file sono due, identici. Se rovini l'originale, hai la copia.

?? Un avviso per il futuro: le copie \`.bak\` dimenticate in giro sono tra le cose che un attaccante cerca per prime, perché spesso contengono password. I backup si fanno, e poi si mettono al sicuro.`,
        },
        {
          kind: 'task',
          title: 'Rinominare',
          body: `@nyx: Nel laboratorio c'è un file che si chiama \`bozza.txt\`. Un nome così non dice niente. Dagliene uno migliore.

Su Linux non esiste un comando "rinomina": si usa quello per spostare. Spostare un file nella stessa cartella, con un nome diverso, **è** rinominarlo.

\`\`\`
mv bozza.txt idee.txt
\`\`\``,
          objective: 'Rinomina bozza.txt in idee.txt.',
          hints: ['Dalla cartella laboratorio: mv bozza.txt idee.txt'],
          state: (sh) => !!sh.fs.get(`${sh.home}/laboratorio/idee.txt`) && !sh.fs.get(`${sh.home}/laboratorio/bozza.txt`),
          check: (ev, sh) => ev.type === 'fsop' && ev.op === 'mv' && ev.paths[1] === `${sh.home}/laboratorio/idee.txt`,
          success: `\`bozza.txt\` non c'è più: al suo posto c'è \`idee.txt\`. A differenza di \`cp\`, con \`mv\` l'originale **non resta**.

Lo stesso comando sposta davvero, quando la destinazione è una cartella: \`mv idee.txt appunti/\` metterebbe il file dentro \`appunti\`.`,
        },
        {
          kind: 'lesson',
          title: 'Niente cestino',
          body: `@nyx: Ora il comando di cui devi avere paura. Te lo insegno apposta adesso, alle tre di notte, quando sei stanco: così te lo ricordi.

Quando cancelli un file con le finestre e il mouse, finisce nel cestino e puoi ripescarlo. **Nel terminale il cestino non esiste.** Un file cancellato è perso, e il deck non ti chiede "sei sicuro?".

Per questo, prima di cancellare qualsiasi cosa, si fanno due cose:
- si **guarda** con \`ls\` che cosa si sta per cancellare
- si **rilegge** il comando prima di premere Invio

Ogni anno qualcuno, da qualche parte, cancella un server intero con una riga scritta di fretta. Di solito è una persona esperta che si è fidata troppo delle proprie dita.

!! Non eseguire mai un comando di cancellazione copiato da Internet senza averlo capito parola per parola.`,
        },
        {
          kind: 'task',
          title: 'Pulizia',
          body: `@nyx: Nel laboratorio c'è un file che non serve più: \`vecchio_log.txt\`. Buttalo. Ma prima guardalo con \`ls\`.

\`\`\`
rm vecchio_log.txt
\`\`\``,
          objective: 'Cancella laboratorio/vecchio_log.txt.',
          hints: ['Dalla cartella laboratorio: rm vecchio_log.txt'],
          state: (sh) => !!sh.fs.get(`${sh.home}/laboratorio`) && !sh.fs.get(`${sh.home}/laboratorio/vecchio_log.txt`),
          check: (ev, sh) => ev.type === 'fsop' && ev.op === 'rm' && ev.paths[0] === `${sh.home}/laboratorio/vecchio_log.txt`,
          success: `Nessuna domanda, nessun messaggio: il file non c'è più, e non tornerà.

?? Un **log** è un file in cui un programma annota, riga dopo riga, quello che succede: un diario di bordo. Chi entra di nascosto in un sistema prova spesso a cancellare i log per non lasciare tracce. Li incontrerai tra qualche capitolo, e imparerai a leggerli.`,
        },
        {
          kind: 'task',
          title: 'Il quadro d\'insieme',
          body: `@nyx: Fammi vedere cosa hai costruito. Torna a casa e disegnami il laboratorio dall'alto.

\`\`\`
cd
tree laboratorio
\`\`\``,
          objective: 'Visualizza il laboratorio con tree.',
          hints: ['Scrivi: tree laboratorio (dalla home)', 'Se sei dentro laboratorio basta: tree'],
          check: (ev) => ev.type === 'command' && ev.name === 'tree' && ev.ok,
          success: `Eccolo: la cartella \`appunti\` con i tuoi due file, e \`idee.txt\`. Il vecchio log non c'è più.

@nyx: Ordinato. A Rook piacerà. Sai creare, scrivere, copiare, rinominare e cancellare. Ti manca una cosa sola: farlo senza di me.`,
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
          explain: `Un solo \`>\` riscrive il file da capo, senza chiedere. Per aggiungere in fondo servono due \`>>\`. È un errore classico, ed è per questo che prima di toccare un file importante se ne fa una copia con \`cp\`.`,
        },
      ],
      recap: [
        ['mkdir CARTELLA', 'crea una cartella'],
        ['comando > file', 'scrive l\'output nel file, riscrivendolo da capo'],
        ['comando >> file', 'aggiunge l\'output in fondo al file'],
        ['cp ORIGINE DEST', 'copia: l\'originale resta'],
        ['mv ORIGINE DEST', 'sposta o rinomina: l\'originale non resta'],
        ['rm FILE', 'cancella per sempre: niente cestino!'],
        ['tree', 'mostra le cartelle come un albero'],
        ['backup', 'copia di sicurezza, da fare prima di modificare'],
        ['log', 'file in cui un programma annota ciò che succede'],
      ],
    },

    // ------------------------------------------------------------------ 1.6 esame
    {
      id: 'ch01-m5',
      title: 'Il primo contratto',
      tagline: 'L\'alba. Rook ti mette alla prova: trova il codice da solo.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Messaggio in arrivo',
          body: `Le cinque e mezza. Fuori il cielo sopra Night City passa dal nero al viola. Il deck vibra: un messaggio.

@rook: Allora sei tu il nuovo. Nyx parla bene di te, e Nyx non parla bene di nessuno.

@rook: Prima di darti un lavoro vero voglio vedere come ti muovi. Ti ho mandato dei file nel deck, in **contratti/rook**. Leggi il brief, trova il codice d'accesso e mandamelo. Niente mano sulla spalla, stavolta.

Nyx chiude il suo deck e si appoggia allo schienale.

@nyx: Io non ti dico niente. Hai tutto quello che serve: \`cd\`, \`ls\`, \`ls -a\`, \`cat\`. Se ti blocchi c'è il pulsante **Suggerimento**, ma prima prova da solo. Sbagliare strada fa parte del lavoro.`,
        },
        {
          kind: 'task',
          title: 'Il codice di Rook',
          body: `Obiettivo: trova il codice d'accesso nelle consegne di Rook e invialo con \`flag\`.

Il metodo è lo stesso che si usa nel lavoro vero:
- leggi **sempre** prima le istruzioni (il *brief*, cioè il foglio con le istruzioni del lavoro)
- esplora con ordine, una cartella alla volta
- non fidarti di quello che si vede al primo sguardo: controlla anche i file nascosti`,
          objective: 'Trova il codice in contratti/rook e invialo con flag.',
          hints: [
            'Comincia con: cd contratti/rook e poi ls. Leggi brief.txt con cat.',
            'Il brief parla di un "doppio fondo". Le cose nascoste iniziano con un punto: usa ls -a dentro ogni consegna.',
            'Guarda in consegna_b con ls -a: c\'è una cartella nascosta .doppiofondo. Entra e leggi il file.',
            'cat contratti/rook/consegna_b/.doppiofondo/codice.txt, poi flag NC{d0pp10_f0nd0}',
          ],
          answer: ['NC{d0pp10_f0nd0}'],
          success: `@rook: Preciso. Mi piaci. Dormi un paio d'ore: il prossimo lavoro riguarda una **rete**, e il cliente è la proprietaria del bar che hai sotto i piedi.

@nyx: Ieri sera non sapevi cos'era un terminale. Adesso sai muoverti in un sistema Linux, leggere i file, trovare quello che è nascosto, usare il manuale e tenere in ordine il tuo lavoro. È su questo che si costruisce tutto il resto.

Hai completato il Capitolo 01.`,
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
