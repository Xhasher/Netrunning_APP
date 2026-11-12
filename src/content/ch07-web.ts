import type { Chapter } from '../game/types';

export const CH07: Chapter = {
  id: 'ch07',
  code: '07',
  title: 'Web security',
  subtitle: 'Come funziona il web, cosa rivela un sito e come si riconoscono gli attacchi',
  missions: [
    // ------------------------------------------------------------------ 7.1
    {
      id: 'ch07-m1',
      title: 'Richiesta e risposta',
      tagline: 'URL, HTTP, metodi, codici di stato e header.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Il nuovo incarico',
          body: `@rook: Mama ha fatto fare un sito al jukebox: la gente sceglie le canzoni dal telefono. Dopo l'ultimo casino vuole che tu lo controlli. Stesso contratto di prima: rete \`192.168.1.0/24\`, niente fuori scope.

@nyx: La maggior parte degli attacchi oggi passa dal web. Prima di difendere un sito devi capire come parla: il protocollo **HTTP**.`,
        },
        {
          kind: 'lesson',
          title: 'Anatomia di un URL',
          body: `Un indirizzo web (**URL**) ha diverse parti:

\`\`\`
http://jukebox.lan:80/playlist.php?id=1
└┬─┘   └────┬────┘└┬┘└─────┬──────┘└─┬─┘
 │          │      │       │         └ parametri (query string)
 │          │      │       └ percorso della risorsa
 │          │      └ porta (80 è quella predefinita di HTTP)
 │          └ nome del server (risolto con il DNS!)
 └ protocollo (http o https)
\`\`\`

I **parametri** dopo il \`?\` sono dati che il browser manda al server, nel formato \`nome=valore\`, separati da \`&\`. Sono anche il punto in cui arriva la maggior parte degli attacchi, perché sono **dati scelti dall'utente**.`,
        },
        {
          kind: 'lesson',
          title: 'HTTP: domanda e risposta',
          body: `HTTP funziona a domanda e risposta. Il browser manda una **richiesta**:

\`\`\`
GET /playlist.php?id=1 HTTP/1.1
Host: jukebox.lan
User-Agent: Mozilla/5.0 (Android 14)
\`\`\`

Il server risponde con un **codice di stato**, degli **header** e il **contenuto** (spesso HTML):

\`\`\`
HTTP/1.1 200 OK
Server: Apache/2.4.29 (Ubuntu)
Content-Type: text/html

<html>...</html>
\`\`\`

I **metodi** più comuni: \`GET\` (chiedi una pagina), \`POST\` (invia dati, es. un modulo di login).

I **codici di stato** si riconoscono dalla prima cifra:
- \`2xx\` successo → \`200 OK\`
- \`3xx\` redirezione → \`301\`, \`302\`
- \`4xx\` errore del client → \`401\` serve login, \`403\` vietato, \`404\` non trovato
- \`5xx\` errore del server → \`500\` il programma sul server è andato in crash

?? Un \`500\` in risposta a una richiesta strana è un indizio importante: vuol dire che l'input dell'utente ha fatto andare in crash l'applicazione. Ricordatelo per la terza missione.`,
        },
        {
          kind: 'task',
          title: 'Scarica la pagina',
          body: `\`curl\` è un "browser da terminale": fa la richiesta e mostra la risposta grezza. Guarda la home del jukebox:

\`\`\`
curl http://jukebox.lan/
\`\`\``,
          objective: 'Scarica la home del jukebox con curl.',
          hints: ['Scrivi: curl http://jukebox.lan/'],
          check: (ev) => ev.type === 'http' && ev.path === '/' && !ev.head,
          success: `Questo è l'**HTML**, il codice che il browser trasforma nella pagina che vedi. Leggilo con attenzione: tra i tag c'è qualcosa che un visitatore normale non vedrebbe mai... Ci torniamo nella prossima missione.`,
        },
        {
          kind: 'task',
          title: 'Gli header',
          body: `Con \`-I\` vedi solo gli **header** della risposta:

\`\`\`
curl -I http://jukebox.lan/
\`\`\`

L'header \`Server\` rivela che software usa il sito. Quale versione di Apache? Invia solo il numero di versione con \`flag\`.`,
          objective: 'Leggi gli header e invia la versione di Apache.',
          hints: ['curl -I http://jukebox.lan/', 'Cerca la riga Server: Apache/... e invia il numero: flag 2.4.29'],
          answer: ['2.4.29', 'apache/2.4.29'],
          success: `Apache **2.4.29**, e c'è anche \`X-Powered-By: PHP/7.2.24\`. Sono versioni vecchie, con vulnerabilità note: lo stesso dato che avevi trovato con \`nmap -sV\` nel capitolo 02, ma stavolta è il sito stesso a dirlo a chiunque.

Questa si chiama **information disclosure** (rivelazione di informazioni). La correzione è semplice: configurare il server perché non mostri le versioni (in Apache: \`ServerTokens Prod\`) e, soprattutto, **aggiornare**.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un sito risponde `403` alla pagina /admin/. Cosa significa?',
          options: [
            'La pagina non esiste',
            'La pagina esiste ma l\'accesso è vietato',
            'Il server è in crash',
            'Tutto ok',
          ],
          correct: 1,
          explain: `\`403 Forbidden\`: la risorsa c'è, ma non hai il permesso. \`404\` vorrebbe dire "non esiste", \`500\` "errore del server". Anche solo la differenza tra 403 e 404 dà informazioni: conferma che /admin/ esiste.`,
        },
      ],
      recap: [
        ['URL', 'protocollo://server:porta/percorso?parametri'],
        ['parametri', 'nome=valore dopo il ?: dati scelti dall\'utente'],
        ['GET / POST', 'chiedere una pagina / inviare dati'],
        ['200 / 403 / 404 / 500', 'ok / vietato / non trovato / crash del server'],
        ['header', 'informazioni sulla risposta, es. Server'],
        ['curl URL / curl -I URL', 'scarica la pagina / solo gli header'],
        ['information disclosure', 'il sistema rivela informazioni utili a un attaccante'],
      ],
    },

    // ------------------------------------------------------------------ 7.2
    {
      id: 'ch07-m2',
      title: 'Quello che il sito racconta',
      tagline: 'Commenti nell\'HTML, robots.txt e perché nascondere non è proteggere.',
      xp: 200,
      steps: [
        {
          kind: 'task',
          title: 'Il commento dimenticato',
          body: `Nell'HTML i commenti si scrivono così: \`<!-- testo -->\`. Il browser non li mostra, ma sono lì, nel codice, visibili a chiunque guardi.

Rileggi la home del jukebox e cerca il commento. Indica quale percorso nascosto rivela, con \`flag\`. Puoi anche filtrare con \`grep\`:

\`\`\`
curl http://jukebox.lan/ | grep "<!--"
\`\`\``,
          objective: 'Trova il percorso rivelato dal commento HTML e invialo.',
          hints: ['curl http://jukebox.lan/ | grep "<!--"', 'Il commento parla di un pannello: flag /pannello/'],
          answer: ['/pannello/', '/pannello', 'pannello'],
          success: `Lo sviluppatore ha lasciato una nota per sé: "togliere il link al pannello". Ma l'ha dimenticata nel codice pubblico. I commenti nell'HTML sono una fonte classica di informazioni: percorsi nascosti, nomi utente, versioni, a volte perfino password.`,
        },
        {
          kind: 'task',
          title: 'robots.txt',
          body: `Molti siti hanno un file \`/robots.txt\` che dice ai motori di ricerca (come Google) quali pagine **non** indicizzare:

\`\`\`
curl http://jukebox.lan/robots.txt
\`\`\``,
          objective: 'Leggi il robots.txt del jukebox.',
          hints: ['Scrivi: curl http://jukebox.lan/robots.txt'],
          check: (ev) => ev.type === 'http' && ev.path === '/robots.txt',
          success: `\`Disallow: /pannello/\` e \`Disallow: /backup/\`. Il file vuole nascondere queste pagine a Google, ma intanto le **elenca pubblicamente** a chiunque lo legga. È la prima cosa che guarda chi esplora un sito.`,
        },
        {
          kind: 'lesson',
          title: 'Nascondere non è proteggere',
          body: `@nyx: Hai notato lo schema? File nascosti con il punto, commenti invisibili, pagine "non indicizzate"... È sempre lo stesso errore: pensare che una cosa **difficile da trovare** sia **protetta**.

Questo errore ha un nome: **security through obscurity** (sicurezza tramite segretezza). Da sola non funziona mai, perché prima o poi qualcuno trova la cosa nascosta.

La protezione vera è il **controllo degli accessi**: il pannello deve chiedere un login robusto (meglio ancora, con MFA) ed essere raggiungibile solo dalla rete interna. Non basta che "nessuno conosca l'indirizzo".

Per il report del jukebox:

\`\`\`
[MEDIO] Pannello di amministrazione esposto (/pannello/)
        Il percorso è rivelato da un commento HTML e da robots.txt.
        Soluzione: limitare l'accesso alla rete interna, login con
        MFA, rimuovere i commenti dal codice in produzione.

[BASSO] Versioni del software negli header (Apache, PHP)
        Soluzione: ServerTokens Prod, rimuovere X-Powered-By,
        aggiornare Apache e PHP.
\`\`\``,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un collega dice: "Il pannello admin è sicuro, l\'indirizzo è /pannello-segreto-x7k9/ e nessuno lo conosce". Cosa rispondi?',
          options: [
            'Ha ragione, è impossibile indovinarlo',
            'È security through obscurity: l\'indirizzo può uscire da log, commenti, cronologia o robots.txt. Serve un vero controllo degli accessi',
            'Basta cambiare l\'indirizzo ogni mese',
            'Basta aggiungerlo a robots.txt',
          ],
          correct: 1,
          explain: `Un indirizzo "segreto" non è una password: finisce in cronologie, log dei proxy, screenshot, commenti nel codice. Può essere un livello in più, ma mai l'unico. Aggiungerlo a robots.txt sarebbe addirittura pubblicizzarlo!`,
        },
      ],
      recap: [
        ['<!-- commento -->', 'invisibile nel browser, visibile nel codice'],
        ['robots.txt', 'indicazioni per i motori di ricerca, leggibili da tutti'],
        ['security through obscurity', 'affidarsi alla segretezza invece che a controlli veri'],
        ['controllo degli accessi', 'login robusto, MFA, accesso solo dalla rete interna'],
      ],
    },

    // ------------------------------------------------------------------ 7.3
    {
      id: 'ch07-m3',
      title: 'Attacchi nel log',
      tagline: 'Leggere access.log: scanner, SQL injection, XSS, path traversal e come prevenirli.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Il log del server web',
          body: `Anche il server web scrive un log: ogni richiesta ricevuta diventa una riga in \`access.log\`. Mama te ne ha copiato uno in \`web/access.log\`. Il formato standard è questo:

\`\`\`
203.0.113.50 - - [12/Nov/2077:20:01:13 +0100] "GET /admin/ HTTP/1.1" 404 196 "-" "Mozilla/5.0 ..."
\`\`\`

Contando le parole separate da spazi:
- campo **1** → IP del visitatore
- campo **4** → data e ora
- campi **6-7** → metodo e percorso richiesto
- campo **9** → **codice di stato**
- campo **10** → dimensione della risposta
- in fondo, lo **User-Agent**: il programma che ha fatto la richiesta (browser, telefono, script...)`,
        },
        {
          kind: 'task',
          title: 'Chi cerca a tentoni?',
          body: `Uno **scanner di vulnerabilità** prova decine di percorsi noti (\`/admin\`, \`/.env\`, \`/backup.zip\`...) sperando di trovarne uno esistente. Si riconosce perché genera **tanti 404**.

Conta i 404 per IP con la catena che conosci:

\`\`\`
grep " 404 " web/access.log | cut -d " " -f 1 | sort | uniq -c
\`\`\`

Invia l'IP dello scanner con \`flag\`.`,
          objective: 'Trova l\'IP che genera più 404 e invialo.',
          hints: ['grep " 404 " web/access.log | cut -d " " -f 1 | sort | uniq -c', 'flag 203.0.113.50'],
          answer: ['203.0.113.50'],
          success: `**203.0.113.50**: 12 pagine inesistenti in pochi secondi, con uno User-Agent che dice addirittura \`VulnScanner\`. È ricognizione automatica. Guarda anche le sue ultime righe: ha letto \`robots.txt\` e poi ha provato \`/pannello/\` (ricevendo \`401\`, serve il login). Esattamente il percorso che hai scoperto tu!`,
        },
        {
          kind: 'lesson',
          title: 'Riconoscere gli attacchi: SQL injection',
          body: `Molti siti prendono un parametro dell'URL e lo inseriscono in una **query** al database. Ad esempio \`playlist.php?id=1\` potrebbe eseguire:

\`\`\`
SELECT * FROM playlist WHERE id = 1
\`\`\`

Se il programmatore **incolla** il parametro nella query così com'è, un attaccante può scrivere nel parametro dei **pezzi di SQL** e cambiare il significato della query. Si chiama **SQL injection**, ed è da decenni tra le vulnerabilità web più gravi: può portare alla lettura dell'intero database.

Nei log si riconosce da parole del linguaggio SQL dentro i parametri: \`'\` (un apice), \`OR 1=1\`, \`UNION SELECT\`, \`--\`. Negli URL gli spazi diventano \`%20\`.

**La difesa** è una sola, ed è molto efficace: le **query parametrizzate** (*prepared statements*). Il programma manda al database la query e i dati **separati**, così i dati non possono mai essere interpretati come comandi SQL.`,
        },
        {
          kind: 'task',
          title: 'La caccia',
          body: `Cerca nel log i tentativi di SQL injection, ignorando maiuscole e minuscole:

\`\`\`
grep -i "union" web/access.log
\`\`\`

Da quale IP arrivano? Invialo con \`flag\`.`,
          objective: 'Trova l\'IP che ha tentato la SQL injection.',
          hints: ['grep -i "union" web/access.log', 'Il primo campo della riga: flag 203.0.113.77'],
          answer: ['203.0.113.77'],
          success: `**203.0.113.77**, di nuovo lui! Lo stesso indirizzo del brute force SSH e del firmware avvelenato. Collegare indizi da log e sistemi diversi allo stesso attore si chiama **correlazione**, ed è il cuore del lavoro di un SOC.`,
        },
        {
          kind: 'task',
          title: 'Ha funzionato?',
          body: `La domanda decisiva: l'applicazione è vulnerabile? Guarda **tutte** le richieste di quell'IP:

\`\`\`
grep 203.0.113.77 web/access.log
\`\`\`

Osserva i codici di stato (campo 9). Quale codice ha risposto il server alla richiesta che conteneva solo un apice \`'\`? Invialo con \`flag\`.`,
          objective: 'Invia il codice di stato della richiesta con l\'apice.',
          hints: ['grep 203.0.113.77 web/access.log', 'La prima riga, quella che finisce con id=1\': flag 500'],
          answer: ['500'],
          success: `**500**: un singolo apice ha mandato in crash l'applicazione. È il segno classico che il parametro \`id\` viene incollato direttamente nella query SQL.

E la richiesta con \`OR 1=1\` ha ricevuto \`200\` con una risposta **molto più grande** del normale (2210 byte invece di ~800): probabilmente ha restituito **tutte** le playlist invece di una. L'applicazione è quasi certamente **vulnerabile**.

!! In un caso reale questo è un incidente da trattare subito: va avvisato lo sviluppatore, va corretto il codice con le query parametrizzate, e va verificato nei log del database se sono stati letti dati.`,
        },
        {
          kind: 'lesson',
          title: 'Gli altri due classici',
          body: `Nel log ci sono altri due tipi di attacco da riconoscere.

**Path traversal**: \`download.php?file=../../../../etc/passwd\`. Ricordi \`..\`, la cartella genitore? L'attaccante prova a "risalire" fuori dalla cartella del sito per leggere file di sistema. Qui il server ha risposto \`403\`: bloccato.
**Difesa**: non usare mai nomi di file scelti dall'utente così come sono; accettare solo nomi da una lista prevista.

**XSS** (*Cross-Site Scripting*): \`cerca.php?q=%3Cscript%3E...\` (\`%3C\` e \`%3E\` sono \`<\` e \`>\`). L'attaccante prova a far stampare alla pagina del codice JavaScript, che verrebbe eseguito nel browser **degli altri visitatori**, per esempio per rubare la loro sessione.
**Difesa**: l'**output encoding**, cioè trasformare i caratteri speciali come \`<\` in testo innocuo prima di mostrarli nella pagina, più un header **Content-Security-Policy** che limita gli script eseguibili.

?? Questi attacchi fanno parte della **OWASP Top 10**, la lista delle vulnerabilità web più importanti, aggiornata periodicamente dalla fondazione OWASP. È la base di qualsiasi lavoro sulla sicurezza web, sia in attacco sia in difesa.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica finale',
          question: 'Qual è la correzione giusta per la SQL injection nel jukebox?',
          options: [
            'Bloccare l\'IP 203.0.113.77 sul firewall',
            'Usare query parametrizzate (prepared statements) nel codice di playlist.php',
            'Nascondere la pagina playlist.php',
            'Rinominare il database',
          ],
          correct: 1,
          explain: `Bloccare l'IP è un **contenimento** utile ma temporaneo: l'attaccante può cambiare indirizzo, e chiunque altro può sfruttare lo stesso difetto. La **correzione** vera è nel codice: con le query parametrizzate i dati non possono più diventare comandi SQL.`,
        },
      ],
      recap: [
        ['access.log', 'una riga per ogni richiesta: IP, data, percorso, codice, User-Agent'],
        ['scanner', 'tanti 404 su percorsi noti in poco tempo'],
        ['SQL injection', 'pezzi di SQL nei parametri; difesa: query parametrizzate'],
        ['500 dopo un apice', 'indizio di parametro incollato nella query'],
        ['path traversal', '../ per uscire dalla cartella; difesa: liste di nomi ammessi'],
        ['XSS', 'script nella pagina degli altri; difesa: output encoding e CSP'],
        ['correlazione', 'collegare indizi diversi allo stesso attaccante'],
        ['OWASP Top 10', 'le vulnerabilità web più importanti'],
      ],
    },
  ],
};
