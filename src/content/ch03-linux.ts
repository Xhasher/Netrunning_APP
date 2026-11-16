// Capitolo 03 · Linux in profondità. Utenti, permessi, ricerca e processi.
//
// Trama: dopo la cassa (2.4), Mama ti affida il vecchio server del bar. L'aveva messo su
// "alla buona" un amico di suo nipote, anni fa, e nessuno ci ha più guardato. Mama ti ha
// copiato i file sul deck. Prima impari come Linux sa chi è chi, sul tuo deck (3.1); poi
// fai l'audit dei permessi dei file del server (3.2); poi cerchi le copie dimenticate e
// guardi cosa gira (3.3). Il capitolo finisce con un messaggio di Mama alle sei del mattino:
// il server è lentissimo. È il capitolo 04.
//
// Regole di scrittura: i comandi li spiega la lezione "Nyx spiega" (teach.ts); qui si
// spiegano le idee (utenti, permessi, processi) e il perché; si va al terminale presto.

import type { Shell } from '../engine/shell';
import type { ShellEvent } from '../engine/types';
import type { Chapter } from '../game/types';

const isCmd = (name: string) => (ev: ShellEvent) => ev.type === 'command' && ev.name === name && ev.ok;

const permsOf = (sh: Shell, rel: string) => sh.fs.get(`${sh.home}/${rel}`)?.perms ?? '';

/** Versione dei contenuti in cui il capitolo è stato riscritto (passi nuovi). */
const V = 19;

export const CH03: Chapter = {
  id: 'ch03',
  code: '03',
  title: 'Linux in profondità',
  subtitle: 'Il vecchio server del bar: utenti, permessi, ricerca e processi',
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
          body: `La cassa funziona di nuovo. Mama ti offre una birra e ti allunga una chiavetta.

@mama: Il vecchio server del bar. L'aveva messo su un amico di mio nipote, anni fa, "alla buona". Da allora nessuno ci ha più guardato dentro. Ti ho copiato tutto sul deck. Dimmi se è un colabrodo.

@nyx: Per giudicare un sistema Linux devi sapere come ragiona. E la prima cosa che Linux vuole sapere, sempre, è: **chi sei?**

Linux è nato per essere usato da **tante persone insieme** sullo stesso computer. Per questo tutto, ma proprio tutto, appartiene a qualcuno: ogni file, ogni cartella, ogni programma in esecuzione.

Ogni **utente** ha:
- un **nome** (per esempio \`mama\`) e un **numero**. Al sistema interessa il numero, non il nome
- una cartella **home**, la sua casa
- una **shell**, il programma che parte quando entra (quello in cui stai scrivendo)

Gli utenti si raggruppano in **gruppi**, per dare gli stessi permessi a più persone insieme: "tutti quelli della contabilità possono leggere le fatture".

Ma non tutti gli utenti sono persone. Molti programmi girano con un utente tutto loro: \`www-data\` per il **server web** (il programma che mostra le pagine di un sito), \`syslog\` per i **log**. Si chiamano **utenti di servizio**, e sono una difesa: se qualcuno buca il server web, si ritrova con i poteri di \`www-data\`, non con quelli dell'amministratore.

@nyx: Cominciamo da te. Sul tuo deck.`,
        },
        {
          kind: 'task',
          title: 'La tua carta d\'identità',
          body: `\`whoami\` ti diceva solo il nome. \`id\` ti dà la carta d'identità completa: il tuo numero e i tuoi gruppi.

\`\`\`
id
\`\`\``,
          objective: 'Mostra la tua identità con id.',
          hints: ['Scrivi: id'],
          check: isCmd('id'),
          success: `Sei l'utente numero **1000**: su molti Linux è il primo utente "umano" creato. Fai parte anche del gruppo \`users\`.

Non sei nel gruppo \`sudo\`. Chi ci sta può usare il comando \`sudo\` (*superuser do*) per eseguire un singolo comando con i pieni poteri, dopo aver scritto la propria password. È il modo corretto di fare l'amministratore: si lavora da utente normale, e si chiedono i pieni poteri solo quando servono. Tu, su questo deck, quei poteri non li hai.`,
        },
        {
          kind: 'lesson',
          title: '/etc/passwd',
          body: `@nyx: Dove tiene Linux l'elenco degli utenti? In un semplice file di testo: \`/etc/passwd\`. Ogni riga è un utente, e i pezzi della riga (si chiamano **campi**) sono separati da **due punti** \`:\`

\`\`\`
mama:x:1001:1001:Mama Reyes:/home/mama:/bin/bash
 1   2  3    4      5           6          7
\`\`\`

1. il nome utente
2. \`x\`: vuol dire "la password **non** è qui". Tra poco vediamo dov'è
3. il numero dell'utente, l'**UID** (*User ID*)
4. il numero del suo gruppo principale, il **GID** (*Group ID*)
5. una descrizione, spesso il nome completo
6. la cartella home
7. la shell. Se c'è \`/usr/sbin/nologin\`, quell'utente **non può** aprire un terminale: è il segno tipico di un utente di servizio

Il nome del file inganna: \`passwd\` non contiene password, ed è **leggibile da tutti**, perché molti programmi devono sapere chi sono gli utenti.

?? Una regola da tatuarsi: l'utente con UID **0** è **root**, l'amministratore con pieni poteri. Qualunque nome abbia.`,
        },
        {
          kind: 'task',
          title: 'Il registro degli abitanti',
          body: `Leggi il file degli utenti del deck:

\`\`\`
cat /etc/passwd
\`\`\`

Poi trova l'UID di Mama Reyes (il terzo campo della sua riga) e invialo con \`flag\`.`,
          objective: 'Leggi /etc/passwd e invia l\'UID di mama con flag.',
          hints: ['cat /etc/passwd, poi cerca la riga che inizia con mama.', 'È il terzo campo della riga di mama: flag 1001'],
          answer: ['1001'],
          success: `Esatto, **1001**. In un'indagine, sapere chi esiste su un sistema è il primo passo: un utente che nessuno ricorda di aver creato è un campanello d'allarme.`,
        },
        {
          kind: 'task',
          since: V,
          title: 'Dove abita Mama',
          body: `Nella stessa riga di \`mama\`, qual è la sua cartella home? È il **sesto** campo. Invia il percorso completo con \`flag\`.`,
          objective: 'Invia con flag la cartella home di mama.',
          hints: ['Conta i campi della riga di mama separati da due punti: il sesto inizia con /home.', 'flag /home/mama'],
          answer: ['/home/mama', '/home/mama/'],
          solve: ['flag /home/mama'],
          success: `\`/home/mama\`. Contare i campi a mano funziona, ma su un file di cento righe diventa un incubo. Per questo c'è un comando che taglia le colonne per te.`,
        },
        {
          kind: 'task',
          title: 'Solo i nomi',
          body: `Prendi solo la prima colonna di \`/etc/passwd\`, i nomi degli utenti:

\`\`\`
cut -d ":" -f 1 /etc/passwd
\`\`\``,
          objective: 'Estrai i nomi degli utenti con cut.',
          hints: ['Scrivi: cut -d ":" -f 1 /etc/passwd'],
          check: (ev) => ev.type === 'command' && ev.name === 'cut' && ev.ok,
          success: `Solo i nomi, uno per riga. Sette utenti: tre persone (root, tu, mama) e quattro utenti di servizio. \`cut\` sembra un dettaglio, ma lo userai di continuo per leggere i log.`,
        },
        {
          kind: 'lesson',
          title: 'Dove sono le password?',
          body: `@nyx: Ricordi lo studio dentistico, alla scrivania di Rook? Ti ho detto che un sistema fatto bene non conserva le password così come sono, ma solo una loro **impronta**. Ora la vedi da vicino.

L'impronta si chiama **hash**. È il risultato di un calcolo che funziona **in un senso solo**: dalla password si ottiene l'hash, ma dall'hash non si torna alla password.

\`\`\`
password  →  funzione di hash  →  $y$j9T$Fq3...
\`\`\`

Quando entri, il sistema calcola l'hash di quello che hai scritto e lo confronta con quello salvato. Se sono uguali, la password è giusta. La password vera non è scritta da nessuna parte.

Gli hash stanno nel file \`/etc/shadow\` ("ombra"), che **solo root** può leggere.

!! Chi riesce a leggere \`/etc/shadow\` può provare a indovinare le password: calcola l'hash di milioni di parole comuni e cerca quelle che coincidono. Per questo le password devono essere **lunghe e uniche**, e il file deve restare chiuso. Lo vedrai bene nel capitolo sulla crittografia.`,
        },
        {
          kind: 'task',
          title: 'La cassaforte',
          body: `Prova a leggere il file delle password:

\`\`\`
cat /etc/shadow
\`\`\`

Riceverai un errore. È voluto: guarda quale.`,
          objective: 'Prova a leggere /etc/shadow.',
          hints: ['Scrivi: cat /etc/shadow (riceverai un errore: è voluto)'],
          check: (ev, sh) => ev.type === 'command' && ev.name === 'cat' && !ev.ok && ev.args.some((a) => sh.abs(a) === '/etc/shadow'),
          success: `*Permission denied*. Bene così: un utente normale non deve poter leggere gli hash delle password. Se su un sistema questo file fosse leggibile da tutti, sarebbe una vulnerabilità **grave**, da mettere in cima al report.

@nyx: Ora sai come Linux sa chi è chi. Domani apriamo i file del server di Mama, e vediamo chi può toccare cosa.`,
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
          explain: `UID 0 = root. Un utente "nascosto" con UID 0 è un trucco classico per tenersi l'accesso a un sistema dopo un'intrusione (si chiama **persistenza**). Chi difende controlla sempre che solo root abbia UID 0.`,
        },
      ],
      recap: [
        ['utente / UID', 'ogni utente ha un numero; UID 0 = root'],
        ['gruppo / GID', 'insiemi di utenti con gli stessi permessi'],
        ['utente di servizio', 'utente per un programma, spesso con shell nologin'],
        ['sudo', 'esegue un comando con i pieni poteri, per chi è nel gruppo sudo'],
        ['id', 'mostra UID, GID e gruppi'],
        ['/etc/passwd', 'elenco degli utenti, 7 campi separati da :'],
        ['/etc/shadow', 'hash delle password, leggibile solo da root'],
        ['hash', 'impronta a senso unico: si salva l\'hash, non la password'],
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
          kind: 'task',
          title: 'Il lavoro',
          body: `Il pomeriggio dopo. Mama ti ha lasciato un biglietto insieme ai file del server. Leggilo:

\`\`\`
cat audit/LEGGIMI.txt
\`\`\``,
          objective: 'Leggi audit/LEGGIMI.txt.',
          hints: ['Dalla home: cat audit/LEGGIMI.txt'],
          check: (ev, sh) => ev.type === 'read' && ev.path === `${sh.home}/audit/LEGGIMI.txt`,
          success: `Ti chiede un **audit dei permessi**: controllare che ogni file sia accessibile solo da chi ne ha bisogno. È un lavoro tipico sia del pentester sia del **sistemista** (chi installa e mantiene i server di un'azienda).

*Audit* vuol dire semplicemente "verifica": si controlla com'è fatto qualcosa rispetto a come dovrebbe essere.`,
        },
        {
          kind: 'task',
          title: 'Ispezione',
          body: `Guarda i file del server in formato lungo, compresi quelli nascosti. Ti ricordi \`ls -la\` dalla prima notte?

\`\`\`
ls -la audit/scantinato
\`\`\``,
          objective: 'Elenca audit/scantinato in formato lungo.',
          hints: ['Scrivi: ls -la audit/scantinato'],
          check: (ev, sh) => ev.type === 'ls' && ev.path === `${sh.home}/audit/scantinato` && ev.flags.includes('l'),
          success: `Guarda la prima colonna di ogni riga: quelle stringhe di lettere e trattini, come \`rw-rw-rw-\` o \`rwxrwxrwx\`. La prima notte hai imparato a riconoscerle: sono i **permessi**. Ora è il momento di leggerle davvero, e di giudicarle. Qualcosa non va...`,
        },
        {
          kind: 'lesson',
          title: 'I permessi, per bene',
          body: `@nyx: Quelle nove lettere sono **tre gruppi da tre**. Ogni gruppo dice cosa può fare una categoria di persone:

\`\`\`
rw-   r--   r--
 │     │     └── altri: tutti gli altri utenti del sistema
 │     └──────── gruppo: chi fa parte del gruppo del file
 └────────────── proprietario: chi possiede il file
\`\`\`

(Il carattere che nell'output di \`ls -l\` viene **prima** delle nove lettere dice il tipo: \`-\` è un file, \`d\` una cartella.)

Le tre lettere sono sempre in quest'ordine, e su file e cartelle vogliono dire cose un po' diverse:
- \`r\` (*read*): su un file → **leggerlo**; su una cartella → **vederne il contenuto** con ls
- \`w\` (*write*): su un file → **modificarlo**; su una cartella → **creare o cancellare** file dentro
- \`x\` (*execute*): su un file → **eseguirlo** come programma; su una cartella → **entrarci** con cd

Un trattino \`-\` al posto di una lettera vuol dire "questo no".

Esempio: \`rw-r-----\` vuol dire che il proprietario legge e modifica, il gruppo solo legge, gli altri niente.`,
        },
        {
          kind: 'lesson',
          title: 'I permessi in numeri',
          body: `@nyx: Chi amministra i sistemi scrive i permessi con **tre cifre**, una per categoria. Ogni lettera vale un numero, e si sommano:

\`\`\`
r = 4     w = 2     x = 1

rwx = 4+2+1 = 7
rw- = 4+2   = 6
r-x = 4  +1 = 5
r-- = 4     = 4
--- =         0
\`\`\`

I quattro valori che vedrai ovunque:
- \`644\` = \`rw-r--r--\`: il proprietario modifica, tutti leggono. **Documenti normali**
- \`600\` = \`rw-------\`: solo il proprietario. **File privati: chiavi, password**
- \`755\` = \`rwxr-xr-x\`: tutti eseguono, solo il proprietario modifica. **Programmi**
- \`777\` = \`rwxrwxrwx\`: **tutti possono fare tutto**. Quasi sempre è un errore

Ora torna all'elenco dei file di Mama, e guardalo con questi occhi.`,
        },
        {
          kind: 'task',
          title: 'Trova il problema',
          body: `Un file contiene una **password** ed è leggibile e modificabile da **chiunque** (\`rw-rw-rw-\`, cioè 666). Quale? Leggilo con \`cat\` per conferma, e invia il suo nome con \`flag\`.`,
          objective: 'Invia il nome del file con la password esposta.',
          hints: ['Cerca il file con permessi rw-rw-rw-.', 'È config.bak: flag config.bak'],
          answer: ['config.bak', 'audit/scantinato/config.bak'],
          success: `\`config.bak\` contiene la password del database della cassa. Sì, quella cassa che hai fatto ripartire ieri sera. Ed è leggibile da **qualsiasi** utente del server.

È una delle vulnerabilità più comuni in assoluto: copie di backup e file di configurazione (i file che contengono le impostazioni di un programma) dimenticati con permessi troppo larghi.`,
        },
        {
          kind: 'task',
          title: 'Chiudi la serratura',
          body: `Correggi i permessi: solo il proprietario deve poter leggere e modificare il file. Cioè \`rw-------\`, cioè **600**:

\`\`\`
chmod 600 audit/scantinato/config.bak
\`\`\``,
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

!! Nel mondo reale però non basta. Quella password è rimasta esposta per chissà quanto tempo: va considerata **compromessa** (cioè potenzialmente già nelle mani sbagliate) e va **cambiata**. Correggere i permessi chiude la porta, ma non manda via chi potrebbe essere già passato.`,
        },
        {
          kind: 'task',
          since: V,
          title: 'Fidarsi è bene',
          body: `Un professionista non dice "fatto" finché non l'ha visto. Ricontrolla i permessi:

\`\`\`
ls -l audit/scantinato
\`\`\`

Quali sono adesso le nove lettere dei permessi di \`config.bak\`? Inviale con \`flag\`.`,
          objective: 'Invia con flag i nuovi permessi di config.bak.',
          hints: ['Nella riga di config.bak, le nove lettere dopo il primo trattino.', 'flag rw-------'],
          answer: ['rw-------', '-rw-------', '600'],
          solve: ['ls -l audit/scantinato', 'flag rw-------'],
          success: `\`rw-------\`: proprietario legge e scrive, gruppo e altri niente. Esattamente **600**. Controllare dopo ogni modifica è un'abitudine che ti salverà più di una volta.`,
        },
        {
          kind: 'task',
          title: 'Lo script pericoloso',
          body: `C'è un altro problema. \`backup.sh\` è uno **script**: un file che contiene una lista di comandi, eseguiti uno dopo l'altro come un programma. Il server lo esegue da solo ogni notte, con i poteri dell'amministratore, per fare la copia dei dati.

E ha permessi \`rwxrwxrwx\` (777): chiunque può **modificarlo**. Un attaccante potrebbe aggiungerci i suoi comandi, e ogni notte il server li eseguirebbe per lui, con pieni poteri.

Togli la scrittura a gruppo e altri. Va bene \`755\` (tutti eseguono, solo il proprietario modifica) oppure \`700\` (solo il proprietario):

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
          success: `Sistemato. Uno script eseguito in automatico da un utente potente, e modificabile da tutti, è un classico caso di **privilege escalation** ("scalata dei privilegi"): un utente normale riesce a far eseguire i propri comandi con poteri più alti dei suoi.`,
        },
        {
          kind: 'lesson',
          title: 'Il minimo privilegio',
          body: `@nyx: Tutto quello che hai fatto oggi è una regola che hai già sentito da Rook. Ora l'hai vista applicata ai file.

**Principio del minimo privilegio**: ogni utente e ogni programma deve avere **solo** i permessi che gli servono, e niente di più.

- un file con una password → \`600\`
- uno script eseguito in automatico → non modificabile dagli altri
- un server web → gira come \`www-data\`, non come root
- un dipendente → accede solo ai dati del suo lavoro

Più permessi ci sono in giro, più strade ha un attaccante. Chi difende toglie tutto quello che non serve.`,
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
        ['audit', 'verifica di com\'è fatto qualcosa rispetto a come dovrebbe essere'],
        ['rwx', 'leggere, scrivere, eseguire (per una cartella x = entrarci)'],
        ['proprietario / gruppo / altri', 'i tre blocchi dei permessi'],
        ['r=4 w=2 x=1', 'si sommano: 7=rwx, 6=rw-, 5=r-x, 4=r--'],
        ['600 / 644 / 755', 'privato / documento / programma'],
        ['777', 'tutti possono tutto: quasi sempre un errore'],
        ['chmod 600 FILE', 'cambia i permessi (solo proprietario o root)'],
        ['chmod go-w FILE', 'forma simbolica: toglie la scrittura a gruppo e altri'],
        ['script', 'file con una lista di comandi, eseguito come un programma'],
        ['privilege escalation', 'ottenere più poteri di quelli che si hanno'],
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
          kind: 'lesson',
          since: V,
          title: 'Copie dappertutto',
          body: `Sera. Mama legge il tuo report sui permessi e scuote la testa.

@mama: Quel ragazzo faceva copie di tutto. "Non si sa mai", diceva. Le lasciava dove capitava.

@nyx: È un problema più grande di quanto sembri. Ogni copia dimenticata di un file importante è un'altra porta da chiudere, e spesso nessuno sa nemmeno che esiste. I file di copia di solito finiscono con \`.bak\` (da *backup*) o \`.old\`.

@nyx: Cercarli a mano, cartella per cartella, è impossibile su un server vero. C'è un comando che lo fa per te.`,
        },
        {
          kind: 'task',
          title: 'Cercare un file',
          body: `Cerca tutti i file che finiscono con \`.bak\`, partendo dalla tua home e scendendo in tutte le sottocartelle:

\`\`\`
find ~ -name "*.bak"
\`\`\`

(\`~\` è la tua home, l'asterisco \`*\` vuol dire "qualsiasi testo".)`,
          objective: 'Cerca i file .bak nella tua home con find.',
          hints: ['Scrivi: find ~ -name "*.bak"'],
          check: (ev) => ev.type === 'command' && ev.name === 'find' && ev.ok && ev.args.some((a) => a.includes('.bak')),
          success: `\`find\` ha trovato anche un file dentro la cartella nascosta \`.old\`. \`ls\` senza \`-a\` non te l'avrebbe mostrato; \`find\` invece non salta niente.`,
        },
        {
          kind: 'task',
          title: 'Conta',
          body: `Quanti file \`.bak\` hai trovato? Invia il numero con \`flag\`.`,
          objective: 'Invia il numero di file .bak trovati.',
          hints: ['Conta le righe stampate dal comando find precedente.', 'flag 2'],
          answer: ['2', 'due'],
          success: `Due. In un audit vero si cercano proprio così i file dimenticati: \`*.bak\`, \`*.old\`, \`*.conf\`, \`*.sql\`. Spesso contengono password o dati personali.`,
        },
        {
          kind: 'lesson',
          title: 'La pipe: collegare i comandi',
          body: `@nyx: Hai contato a occhio. Con due righe va bene; con duemila no. Ti serve un modo per far fare al computer anche il conteggio.

Ecco l'idea più potente di tutto Linux. Ogni comando fa **una cosa sola**, e la fa bene: \`cat\` mostra, \`grep\` filtra, \`wc\` conta. Da soli sono piccoli. Ma si possono **collegare**, come stazioni di una catena di montaggio: quello che esce da uno entra nel successivo.

Il collegamento si fa con il simbolo \`|\`, che si chiama **pipe** ("tubo").

Nelle prossime schermate ti presento i due attrezzi che metterai più spesso nei tubi, \`grep\` e \`wc\`, e poi il tubo stesso.

?? Il simbolo \`|\` lo trovi nella barra dei tasti rapidi sopra la tastiera.`,
        },
        {
          kind: 'task',
          title: 'Chi può entrare?',
          body: `Quanti utenti del deck hanno come shell \`/bin/bash\`, cioè possono aprire un terminale? Fai fare il conteggio al computer:

\`\`\`
cat /etc/passwd | grep bash | wc -l
\`\`\`

Invia il risultato con \`flag\`.`,
          objective: 'Conta gli utenti con shell bash e invia il numero.',
          hints: ['Scrivi: cat /etc/passwd | grep bash | wc -l', 'flag 3'],
          answer: ['3', 'tre'],
          success: `Tre: \`root\`, tu e \`mama\`. Sono gli account che un attaccante proverebbe a colpire per entrare, e quindi quelli da proteggere meglio.`,
        },
        {
          kind: 'lesson',
          title: 'I processi',
          body: `@nyx: Ultima cosa per oggi. Finora hai guardato **file**: cose ferme sul disco. Ma un computer acceso sta sempre facendo qualcosa.

Un programma salvato sul disco è solo un file, come una ricetta in un libro. Quando lo avvii diventa un **processo**: la ricetta mentre qualcuno la sta cucinando. Ogni processo ha:
- un numero che lo identifica, il **PID** (*Process ID*)
- un **utente** che lo esegue, e di cui ha i permessi
- un consumo di **CPU** e di **memoria**

La **CPU** (il processore) è il "cervello" che esegue i calcoli: un processo che la usa al 100% rallenta tutto il resto. La **memoria** (RAM) è il piano di lavoro temporaneo dei programmi: veloce, ma si svuota quando spegni.

!! Per chi difende, l'elenco dei processi è una miniera. Un processo sconosciuto che divora la CPU, o che parte da una cartella strana come \`/tmp\`, è un **indicatore di compromissione** (in inglese *IoC*, *Indicator of Compromise*): un segno concreto che il sistema potrebbe essere stato violato.`,
        },
        {
          kind: 'task',
          title: 'Cosa gira qui?',
          body: `Guarda tutti i processi in esecuzione sul tuo deck:

\`\`\`
ps aux
\`\`\``,
          objective: 'Elenca tutti i processi con ps aux.',
          hints: ['Scrivi: ps aux'],
          check: (ev) => ev.type === 'command' && ev.name === 'ps' && ev.args.length > 0 && ev.ok,
          success: `Un sistema pulito:
- \`init\`, il primo processo, quello che avvia tutti gli altri: ha sempre PID 1
- \`cron\`, che esegue i lavori programmati (come il \`backup.sh\` di Mama, ogni notte)
- \`sshd\`, il servizio di accesso a distanza con SSH
- \`rsyslogd\`, che scrive i log
- la tua shell, \`bash\`, e lo stesso \`ps\` che hai appena lanciato

Tutto nella norma. Ricordati com'è fatto un sistema sano: ti servirà per riconoscerne uno malato.`,
        },
        {
          kind: 'task',
          since: V,
          title: 'Un processo solo',
          body: `Su un server vero i processi sono centinaia. Se ne cerchi uno, metti \`ps\` in un tubo con \`grep\`: lo stesso trucco di prima, su un altro comando.

\`\`\`
ps aux | grep sshd
\`\`\`

Qual è il PID del servizio \`sshd\`? Invialo con \`flag\`.`,
          objective: 'Trova il PID di sshd con ps aux | grep sshd.',
          hints: ['Il PID è la seconda colonna della riga di sshd.', 'ps aux | grep sshd e poi: flag 455'],
          answer: ['455'],
          solve: ['ps aux | grep sshd', 'flag 455'],
          success: `**455**. \`ps\` produce l'elenco, \`grep\` tiene solo la riga che ti interessa. È lo stesso schema, applicato a un comando diverso: la pipe funziona con qualsiasi comando che stampa testo.

Ti mancano solo le domande finali. Consegni il report sul server a Mama, lei lo infila in un cassetto: "lo faccio sistemare la settimana prossima".

Alle sei del mattino dopo, il telefono vibra. È lei: *il server è lentissimo e la ventola urla. Vieni.*`,
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
          explain: `\`cat\` stampa il file, \`grep\` tiene solo le righe con "errore", \`wc -l\` le conta. È esattamente il tipo di comando che userai nel prossimo capitolo per ricostruire un attacco.`,
        },
      ],
      recap: [
        ['find ~ -name "*.bak"', 'cerca file per nome, anche nelle cartelle nascoste'],
        ['|', 'la pipe: l\'output di un comando diventa l\'input del successivo'],
        ['grep / wc -l', 'filtra righe / conta righe'],
        ['processo / PID', 'un programma in esecuzione e il suo numero'],
        ['CPU / RAM', 'il processore / la memoria di lavoro temporanea'],
        ['ps aux', 'tutti i processi con utente, CPU, memoria e comando'],
        ['ps aux | grep NOME', 'trova un processo nell\'elenco'],
        ['indicatore di compromissione', 'segno concreto che un sistema potrebbe essere stato violato'],
      ],
    },
  ],
};
