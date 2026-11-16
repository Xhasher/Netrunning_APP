// Capitolo 02 · Rete di quartiere. Il primo lavoro sul campo: la rete del bar di Mama Reyes.
//
// Trama: la mattina dopo la giornata alla scrivania di Rook (capitolo F). Mama Reyes, la
// proprietaria di Lo Scantinato, è convinta che qualcuno le entri nella rete: il jukebox
// si accende da solo alle tre di notte e suona canzoni che nessuno ha scelto. Tu fai il tuo
// primo penetration test autorizzato: dove sei (2.1), chi c'è (2.2), quali porte sono aperte
// e chi è entrato dal jukebox (2.3). La 2.4 (in ch-pratica.ts) è il giorno dopo: "la cassa
// non va!". Il capitolo 03 riparte dal vecchio server del bar.
//
// Regole di scrittura: si va al terminale presto; i comandi li spiega la lezione "Nyx spiega"
// (teach.ts), qui si spiega la rete; ogni termine spiegato dove compare.

import type { Chapter } from '../game/types';

/** Versione dei contenuti in cui il capitolo è stato riscritto (passi nuovi). */
const V = 19;

export const CH02: Chapter = {
  id: 'ch02',
  code: '02',
  title: 'Rete di quartiere',
  subtitle: 'Il primo lavoro: la rete del bar di Mama. Indirizzi, ping, DNS, porte e nmap',
  missions: [
    // ------------------------------------------------------------------ 2.1
    {
      id: 'ch02-m1',
      title: 'Dove sei',
      tagline: 'Cos\'è una rete, cos\'è un indirizzo IP e come trovare il tuo.',
      xp: 150,
      steps: [
        {
          kind: 'lesson',
          title: 'Il jukebox che suona da solo',
          body: `Le nove del mattino. Il bar è chiuso, le sedie sono sui tavoli. Dietro il bancone c'è una donna con le braccia tatuate e una tazza di caffè: Mama Reyes, la proprietaria di Lo Scantinato.

@mama: Allora sei tu quello che manda Rook. Ti dico com'è. Da una settimana, alle tre di notte, il jukebox si accende da solo e suona canzoni che nessuno ha scelto. Il bar è chiuso, le porte sono sbarrate. Qualcuno mi entra nella rete. Voglio sapere chi, e voglio che smetta.

@rook: Mama ha firmato il contratto ieri sera. Hai l'autorizzazione per controllare tutta la rete del bar. Cerca i buchi, poi le spieghi come chiuderli.

@nyx: Questo lavoro ha un nome: **penetration test**, "pentest" in breve. Un attacco simulato, **autorizzato per iscritto** dal proprietario, per trovare le debolezze prima di chi le userebbe davvero.

@nyx: E ogni pentest comincia con la domanda più semplice: **dove sono?** Il tuo deck è collegato alla rete del bar. Vediamo con che indirizzo.`,
        },
        {
          kind: 'task',
          title: 'Il tuo indirizzo',
          lessonAfter: true,
          body: `Scrivi:

\`\`\`
ip a
\`\`\`

Verrà fuori un blocco di righe che sembra complicato. Non preoccuparti: subito dopo lo leggiamo insieme, riga per riga.`,
          objective: 'Mostra la configurazione di rete con ip a.',
          hints: ['Scrivi: ip a (ip, spazio, a)'],
          check: (ev) => ev.type === 'netinfo',
          success: `Fatto. Hai chiesto al deck di mostrarti le sue **schede di rete** e i loro **indirizzi**. Ora Nyx ti spiega cosa stai guardando.`,
        },
        {
          kind: 'lesson',
          title: 'Cos\'è una rete',
          body: `@nyx: Facciamo un passo indietro. Cosa vuol dire "essere in rete"?

Una **rete** è un insieme di dispositivi collegati che si scambiano dati: computer, telefoni, stampanti, telecamere. E, qui al bar, anche un jukebox e un registratore di cassa.

- **LAN** (*Local Area Network*, rete locale): la rete di un posto solo. Casa tua, un ufficio, questo bar
- **router**: la scatoletta con le lucine che crea la LAN, dà il wifi e collega la LAN a Internet. Fa da ufficio postale del quartiere: smista i dati verso il dispositivo giusto
- **Internet**: la rete delle reti. Collega tra loro milioni di LAN in tutto il mondo

I dati non viaggiano tutti in un blocco. Vengono divisi in piccoli **pacchetti**, come lettere. Ogni pacchetto porta scritto il **mittente** e il **destinatario**.

Perché dispositivi diversi si capiscano servono regole comuni, uguali per tutti. Si chiamano **protocolli**. Ne incontrerai tanti, con nomi di tre o quattro lettere: IP, TCP, DNS, HTTP, SSH. Ognuno lo spieghiamo quando arriva.

@nyx: Il dispositivo con cui comunichi è collegato alla rete da una **scheda di rete** (in inglese *interface*, interfaccia). Nel tuo \`ip a\` ce n'erano due: \`eth0\`, quella vera, e \`lo\`, una scheda finta con cui il computer parla con se stesso.`,
        },
        {
          kind: 'lesson',
          title: 'L\'indirizzo IP',
          body: `@nyx: Per spedire una lettera serve un indirizzo. In rete ogni dispositivo ne ha uno: l'**indirizzo IP** (da *Internet Protocol*, il protocollo che porta i pacchetti a destinazione).

La versione più diffusa, **IPv4**, è fatta di **quattro numeri da 0 a 255**, separati da punti:

\`\`\`
192.168.1.50
\`\`\`

Gli indirizzi sono di due tipi.

**Privati**: valgono solo **dentro** una LAN. Da Internet non si raggiungono direttamente, e lo stesso indirizzo può esistere in mille case diverse, come "interno 5" in mille palazzi. Si riconoscono dall'inizio:
- \`192.168.\` qualcosa
- \`10.\` qualcosa
- da \`172.16.\` a \`172.31.\` qualcosa

**Pubblici**: unici in tutto il mondo, visibili da Internet. Di solito ce l'ha solo il router, che lo **condivide** con tutti i dispositivi della casa: verso l'esterno, il bar intero ha un indirizzo solo.

Poi c'è un indirizzo speciale: \`127.0.0.1\`, detto **localhost**. È quello della scheda finta \`lo\`: vuol dire "me stesso". Ogni computer al mondo ce l'ha.

?? Esiste anche **IPv6**, con indirizzi molto più lunghi (per esempio \`2001:db8::1\`), nato perché gli indirizzi IPv4 sono quasi finiti. Lo vedrai più avanti. Per ora, IPv4 basta e avanza.`,
        },
        {
          kind: 'task',
          title: 'Rispondi',
          body: `Qual è l'indirizzo IP del tuo deck sulla scheda \`eth0\`? Scrivi solo i quattro numeri, senza \`/24\`.

\`\`\`
flag 192.168.x.x
\`\`\`

(Se l'output non è più sullo schermo, riscrivi \`ip a\`: la freccia ↑ lo richiama.)`,
          objective: 'Invia il tuo indirizzo IP con flag.',
          hints: ['È nella riga inet sotto eth0 di "ip a". Scrivi solo i 4 numeri.', 'flag 192.168.1.50'],
          answer: ['192.168.1.50'],
          success: `Esatto: sei \`192.168.1.50\`.

E il \`/24\` che lo seguiva? Vuol dire che i primi **tre** numeri, \`192.168.1\`, sono la "via": sono uguali per tutti i dispositivi del bar. L'ultimo numero è il "civico" di ognuno. In questa rete ci stanno fino a 254 dispositivi, da \`.1\` a \`.254\`.`,
        },
        {
          kind: 'task',
          since: V,
          title: 'Privato o pubblico?',
          body: `@mama: Quindi tutti su Internet possono vedere il tuo computer con quel numero?

Rispondi a Mama. L'indirizzo \`192.168.1.50\` è **privato** o **pubblico**? Invia la risposta con \`flag\`.`,
          objective: 'L\'indirizzo del deck è privato o pubblico?',
          hints: ['Guarda come comincia: 192.168.', 'Gli indirizzi che iniziano con 192.168. valgono solo nella rete locale: flag privato'],
          answer: ['privato', 'è privato', 'privata'],
          solve: ['flag privato'],
          success: `**Privato.** Comincia con \`192.168.\`: vale solo dentro il bar. Da Internet si vede l'indirizzo pubblico del router, non quello del tuo deck.

@nyx: Questo vuol dire una cosa importante per Mama. Se qualcuno accende il jukebox alle tre di notte, una di due: o è entrato da Internet attraverso il router, o è **dentro** la rete locale. Per esempio collegato al wifi del bar, magari dal parcheggio. Lo scopriremo.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Quale di questi indirizzi è **privato** (usato solo in una rete locale)?',
          options: ['8.8.8.8', '192.168.0.10', '151.101.1.140', '256.1.1.1'],
          correct: 1,
          explain: `\`192.168.x.x\` è un intervallo privato. \`8.8.8.8\` e \`151.101.1.140\` sono pubblici. \`256.1.1.1\` non è nemmeno valido: ogni numero va da 0 a 255.`,
        },
      ],
      recap: [
        ['penetration test', 'attacco simulato e autorizzato per trovare le debolezze'],
        ['rete / LAN', 'dispositivi collegati; la LAN è la rete di un posto solo'],
        ['router', 'crea la LAN e la collega a Internet'],
        ['pacchetto', 'un pezzetto di dati con mittente e destinatario'],
        ['protocollo', 'le regole comuni per comunicare'],
        ['indirizzo IP', 'l\'indirizzo di un dispositivo in rete, es. 192.168.1.50'],
        ['IP privato', '192.168.x.x, 10.x.x.x, 172.16-31.x.x: solo nella LAN'],
        ['127.0.0.1', 'localhost: il computer stesso (scheda lo)'],
        ['/24', 'i primi tre numeri sono la rete, l\'ultimo il dispositivo'],
        ['ip a', 'mostra le schede di rete e il tuo IP'],
      ],
    },

    // ------------------------------------------------------------------ 2.2
    {
      id: 'ch02-m2',
      title: 'C\'è qualcuno?',
      tagline: 'ping, il DNS e perché il silenzio non vuol dire "spento".',
      xp: 150,
      steps: [
        {
          kind: 'lesson',
          title: 'Il sonar',
          body: `Le dieci. Mama ti ha disegnato su un tovagliolo i dispositivi del bar: "il router, il jukebox, la cassa. Basta, non c'è altro".

@nyx: Fidarsi è bene, controllare è il mestiere. Cominciamo dal più semplice: chiedere a un dispositivo "ci sei?".

Il comando per farlo si chiama \`ping\`, e funziona come il **sonar** di un sottomarino:
- il tuo computer manda un piccolo pacchetto di prova: "ci sei?"
- se il destinatario è acceso e disposto a rispondere, rimanda indietro "ci sono!"
- \`ping\` misura quanto tempo ci mette la risposta, in **millisecondi** (ms, millesimi di secondo)

Quel pacchetto di prova usa un protocollo apposta, **ICMP**, che la rete usa per i messaggi di servizio: "ci sei?", "non riesco a consegnare", "strada sbagliata".

Partiamo dal dispositivo più importante: il router.`,
        },
        {
          kind: 'task',
          title: 'Ping al router',
          body: `Il router, visto dai dispositivi della LAN, si chiama anche **gateway**, "porta d'uscita": tutto quello che va verso Internet passa da lui. Nelle reti piccole ha quasi sempre l'indirizzo che finisce con \`.1\`.

\`\`\`
ping 192.168.1.1
\`\`\``,
          objective: 'Fai ping al router 192.168.1.1.',
          hints: ['Scrivi: ping 192.168.1.1'],
          check: (ev) => ev.type === 'ping' && ev.ip === '192.168.1.1' && ev.replies > 0,
          success: `Il router risponde. Nell'output c'è un valore che la lezione su \`ping\` non ti ha ancora spiegato: \`ttl=64\`.

**TTL** sta per *Time To Live*, "tempo di vita". È un numero scritto in ogni pacchetto, che cala di 1 ogni volta che il pacchetto attraversa un router. Se arriva a 0, il pacchetto viene buttato: così un pacchetto finito in un giro sbagliato non circola per sempre.

Il valore di partenza dipende dal sistema operativo: **64** di solito è Linux, **128** è Windows. È un primo indizio su cosa c'è dall'altra parte, e i pentester lo notano sempre.`,
        },
        {
          kind: 'lesson',
          title: 'Il DNS: la rubrica di Internet',
          body: `@nyx: Ricordare numeri come \`142.250.180.14\` è scomodo. Per questo i dispositivi hanno anche dei **nomi**: \`google.com\`, \`wikipedia.org\`. O, qui al bar, \`jukebox.lan\`.

Ma i pacchetti viaggiano solo con gli indirizzi. Serve qualcuno che traduca il nome nel numero: è il **DNS** (*Domain Name System*), la rubrica telefonica della rete.

Quando scrivi un nome, il tuo computer fa due passi:
- chiede a un **server DNS** (un computer che fa da rubrica): "che indirizzo ha \`jukebox.lan\`?"
- ricevuto il numero, contatta quell'indirizzo

Nella rete del bar fa da rubrica il router stesso. I nomi dei dispositivi locali finiscono con \`.lan\`.

!! Il DNS è anche un bersaglio. Chi riesce a falsificare le sue risposte può mandarti su un sito finto anche se scrivi il nome giusto. Si chiama *DNS spoofing*.`,
        },
        {
          kind: 'task',
          title: 'Ping per nome',
          body: `Ora il sospettato numero uno: il jukebox. Fai ping usando il **nome** invece dell'indirizzo:

\`\`\`
ping jukebox.lan
\`\`\`

Guarda la prima riga dell'output: ti dice in quale indirizzo il DNS ha tradotto il nome.`,
          objective: 'Fai ping a jukebox.lan usando il nome.',
          hints: ['Scrivi: ping jukebox.lan'],
          check: (ev) => ev.type === 'ping' && ev.target.toLowerCase().startsWith('jukebox') && ev.replies > 0,
          success: `Il jukebox è acceso e risponde.`,
        },
        {
          kind: 'task',
          since: V,
          title: 'Il civico del jukebox',
          body: `Che indirizzo IP ha il jukebox? Lo trovi nella prima riga dell'output di prima, tra parentesi. Invialo con \`flag\`.`,
          objective: 'Invia con flag l\'indirizzo IP di jukebox.lan.',
          hints: ['Nella riga PING jukebox.lan (...) l\'indirizzo è tra parentesi.', 'flag 192.168.1.20'],
          answer: ['192.168.1.20'],
          solve: ['ping -c 1 jukebox.lan', 'flag 192.168.1.20'],
          success: `\`192.168.1.20\`. Stessa "via" del tuo deck (\`192.168.1\`), civico 20. È nella stessa LAN: lo raggiungi direttamente, senza passare da Internet.`,
        },
        {
          kind: 'task',
          title: 'Silenzio',
          body: `Ora il registratore di cassa, \`cassa.lan\`:

\`\`\`
ping cassa.lan
\`\`\``,
          objective: 'Fai ping a cassa.lan e osserva cosa succede.',
          hints: ['Scrivi: ping cassa.lan'],
          check: (ev) => ev.type === 'ping' && ev.ip === '192.168.1.30',
          success: `\`100% packet loss\`: nessuna risposta. Mama dice "è spenta, la accendo solo quando apro".

Ma guarda bene: **il DNS ha trovato il suo indirizzo**, \`192.168.1.30\`. Quindi il dispositivo esiste.

@nyx: E non rispondere al ping **non vuol dire essere spenti**. Molti dispositivi hanno un **firewall**: un filtro che decide quale traffico far passare e quale no. Spesso è configurato per ignorare i ping, così il dispositivo è meno visibile. Nella prossima missione scopriremo la verità.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Fai `ping` a un server e ottieni `100% packet loss`. Cosa puoi concludere con certezza?',
          options: [
            'Il server è sicuramente spento',
            'Il server non esiste',
            'Non ha risposto al ping: potrebbe essere spento OPPURE un firewall blocca l\'ICMP',
            'La tua connessione non funziona',
          ],
          correct: 2,
          explain: `Il silenzio è ambiguo. Un buon analista non tira conclusioni da un solo test: verifica con altri metodi. Vale in attacco come in difesa.`,
        },
      ],
      recap: [
        ['ping HOST', 'chiede "ci sei?" a un dispositivo (protocollo ICMP)'],
        ['ms', 'millisecondi: il tempo di andata e ritorno'],
        ['TTL', 'cala a ogni router; 64 suggerisce Linux, 128 Windows'],
        ['DNS', 'traduce i nomi (jukebox.lan) in indirizzi IP'],
        ['gateway / router', 'la porta d\'uscita della LAN, spesso .1'],
        ['firewall', 'filtro che blocca o lascia passare il traffico'],
        ['100% packet loss', 'nessuna risposta: spento oppure filtrato'],
      ],
    },

    // ------------------------------------------------------------------ 2.3
    {
      id: 'ch02-m3',
      title: 'Porte aperte',
      tagline: 'Porte, servizi, il perimetro del contratto e la tua prima scansione con nmap.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Le porte',
          body: `Mezzogiorno. Sai chi è acceso, più o meno. Ora la domanda vera: **da dove si entra?**

@nyx: Un indirizzo IP identifica un **dispositivo**. Ma su un dispositivo girano tanti programmi che usano la rete nello stesso momento: un sito web, la posta, l'accesso a distanza. Come fa un pacchetto a sapere a quale programma è destinato?

Con un numero in più: la **porta**. Va da **0 a 65535**. Se l'IP è l'indirizzo di un **palazzo**, la porta è il **numero dell'appartamento**. Non è una porta fisica: è solo un numero scritto dentro ogni pacchetto.

Un programma che resta in attesa di visite su una porta si chiama **servizio**. Ogni porta aperta è un servizio che risponde a chiunque bussi: per questo, per chi attacca, ogni porta aperta è una possibile entrata.

Una porta può essere:
- **open** (aperta): c'è un servizio che risponde
- **closed** (chiusa): non c'è niente in ascolto
- **filtered** (filtrata): un firewall impedisce di saperlo`,
        },
        {
          kind: 'lesson',
          since: V,
          title: 'Le porte da conoscere a memoria',
          body: `@nyx: Alcuni servizi usano sempre la stessa porta, per convenzione. Queste si imparano a memoria: le ritroverai in ogni scansione, in ogni log, in ogni colloquio.

Prima ricordati due parole del capitolo F:
- **cifrato**: i dati sono trasformati con una chiave segreta. Chi li intercetta lungo la strada vede solo caratteri senza senso
- **in chiaro**: i dati viaggiano così come sono. Chi li intercetta, per esempio sullo stesso wifi, legge tutto, password comprese

\`\`\`
21   FTP      trasferire file               in chiaro
22   SSH      comandare un computer a distanza  cifrato
23   Telnet   comandare un computer a distanza  IN CHIARO
25   SMTP     spedire posta
53   DNS      la rubrica dei nomi
80   HTTP     siti web                      in chiaro
443  HTTPS    siti web (il lucchetto)       cifrato
3306 MySQL    database
3389 RDP      desktop remoto di Windows
\`\`\`

Un **database** è un archivio di dati ordinato in tabelle: i clienti di un negozio, gli ordini, i prodotti. Spesso è la cosa più preziosa di un'azienda.

Guarda SSH e Telnet: fanno **la stessa cosa**, ma uno cifra e l'altro no. Tienilo a mente.`,
        },
        {
          kind: 'lesson',
          title: 'TCP: la stretta di mano',
          body: `@nyx: Come si fa a sapere se una porta è aperta? Si bussa e si ascolta la risposta.

Quasi tutti i servizi usano il protocollo **TCP**, che prima di scambiare dati fa una "stretta di mano" in tre tempi (*three-way handshake*):

\`\`\`
tu   ── SYN ──────▶  server   "vorrei parlare"
tu   ◀── SYN-ACK ──  server   "va bene, ci sono"
tu   ── ACK ──────▶  server   "ok, iniziamo"
\`\`\`

SYN, ACK e RST sono **segnali** scritti nei pacchetti: SYN vuol dire "inizio", ACK "ricevuto".

Se sulla porta non c'è nessuno, il server risponde con un **RST** ("niente da fare").

Una scansione delle porte fa esattamente questo: bussa a ogni porta, manda un SYN, e guarda cosa torna indietro. SYN-ACK: aperta. RST: chiusa. Silenzio: filtrata.

?? Esiste anche **UDP**, un protocollo più veloce ma senza stretta di mano e senza garanzia che i dati arrivino. Lo usano il DNS, i giochi online e lo streaming, dove la velocità conta più di un pacchetto perso.`,
        },
        {
          kind: 'lesson',
          title: 'Prima regola: il perimetro',
          body: `@nyx: Fermo un attimo. Prima di bussare a qualsiasi porta, ricordati ieri sera, alla scrivania di Rook: le **stesse identiche azioni** fanno di te un professionista oppure un imputato. La differenza è un foglio firmato.

Te lo ripasso in breve:
- serve un'**autorizzazione scritta**, firmata da chi ha il potere di darla
- il **perimetro** (*scope*) dice cosa puoi toccare. Tutto il resto è **vietato**
- in Italia l'**art. 615-ter del Codice Penale** punisce l'accesso abusivo a un sistema informatico, con il carcere. Anche una scansione non autorizzata può metterti nei guai

!! Una scansione delle porte, per chi la riceve, è indistinguibile dai primi passi di un attacco. Si fa **solo** dentro il perimetro.`,
        },
        {
          kind: 'task',
          title: 'Leggi il contratto',
          body: `Il contratto firmato da Mama ieri sera è nel file \`rete/scope.txt\`. Leggilo prima di fare qualsiasi altra cosa.`,
          objective: 'Leggi il file rete/scope.txt.',
          hints: ['Dalla home: cat rete/scope.txt'],
          check: (ev, sh) => ev.type === 'read' && ev.path === sh.home + '/rete/scope.txt',
          success: `Il contratto ti autorizza a testare la rete \`192.168.1.0/24\`: tutti gli indirizzi da \`192.168.1.0\` a \`192.168.1.255\`, cioè tutta la "via" del bar.

\`helix.corp\` invece è scritto esplicitamente **fuori scope**: non va toccato.`,
        },
        {
          kind: 'lesson',
          title: 'nmap',
          body: `@nyx: Per bussare a centinaia di porte non lo fai a mano. Usi **nmap** (*Network Mapper*): lo strumento di ricognizione di rete più usato al mondo, da chi attacca e da chi difende. È gratuito e chiunque può leggerne il codice (si dice *open source*).

Fa tre lavori, e li userai in quest'ordine:
- **scoperta degli host**: quali dispositivi sono accesi in una rete. (*Host* vuol dire semplicemente "un dispositivo collegato in rete")
- **scansione delle porte**: quali porte sono aperte su un dispositivo
- **riconoscimento dei servizi**: quale programma, e quale **versione**, risponde su ogni porta

Il bersaglio può essere un solo indirizzo, un nome, oppure un'intera rete. Una rete si scrive con la barra che hai visto in \`ip a\`: \`192.168.1.0/24\` vuol dire "tutti gli indirizzi che cominciano con 192.168.1". Questa scrittura si chiama **notazione CIDR**.

Primo lavoro: il tovagliolo di Mama dice tre dispositivi. Vediamo se è vero.`,
        },
        {
          kind: 'task',
          title: 'Chi c\'è nel bar?',
          body: `Scopri tutti i dispositivi accesi nella rete del bar. L'opzione \`-sn\` dice a nmap di fare **solo** la scoperta, senza toccare le porte:

\`\`\`
nmap -sn 192.168.1.0/24
\`\`\``,
          objective: 'Scopri gli host accesi con nmap -sn 192.168.1.0/24',
          hints: ['Scrivi: nmap -sn 192.168.1.0/24'],
          check: (ev) => ev.type === 'scan' && ev.flags.includes('-sn') && ev.target.endsWith('/24') && !ev.outOfScope,
          success: `C'è anche \`cassa.lan\`, che al ping non rispondeva!

Perché nmap non si affida solo al ping. Prova anche a bussare a porte comuni, e nelle reti locali usa **ARP**: una domanda gridata a tutta la LAN, "chi ha questo indirizzo?". A quella ogni dispositivo acceso deve rispondere, altrimenti non potrebbe comunicare. Lo vedrai bene nel capitolo sulle reti avanzate.

**Un solo metodo non basta mai.**`,
        },
        {
          kind: 'task',
          title: 'Conta',
          body: `Quanti dispositivi risultano accesi (*hosts up*) nella rete, contando anche il tuo deck? Guarda l'ultima riga dell'output di nmap.`,
          objective: 'Invia il numero di host accesi con flag.',
          hints: ['L\'ultima riga dice "(N hosts up)".', 'flag 4'],
          answer: ['4'],
          success: `Quattro: il router, il jukebox, la cassa e te. Il tovagliolo di Mama era giusto: nessun dispositivo sconosciuto **dentro** la rete, adesso.

Chi accende il jukebox, quindi, alle tre di notte arriva, lavora e se ne va. Hai una **mappa** della rete. Ora le porte.`,
        },
        {
          kind: 'task',
          title: 'Bussare alle porte',
          body: `Scansiona le porte del jukebox. Senza opzioni, nmap controlla le **1000 porte più usate**:

\`\`\`
nmap jukebox.lan
\`\`\``,
          objective: 'Scansiona le porte di jukebox.lan con nmap.',
          hints: ['Scrivi: nmap jukebox.lan'],
          check: (ev) => ev.type === 'scan' && ev.ip === '192.168.1.20' && !ev.flags.includes('-sn'),
          success: `Leggiamo il risultato:
- \`Not shown: 997 closed tcp ports\`: 997 porte chiuse, che nmap non elenca per non riempire lo schermo
- poi una tabella con tre colonne: **PORT** (il numero e il protocollo), **STATE** (lo stato), **SERVICE** (il servizio che di solito usa quella porta)

Il jukebox ha 3 porte aperte: 22 (ssh), 23 (telnet) e 80 (http). Un jukebox con tre entrate.`,
        },
        {
          kind: 'task',
          title: 'Il servizio pericoloso',
          body: `Guarda le porte aperte del jukebox. Una di queste è un accesso a distanza che manda tutto **in chiaro**, password comprese. Chiunque sia sulla stessa rete può leggerle mentre passano.

Quale servizio è? Rispondi con il suo nome.`,
          objective: 'Invia il nome del servizio insicuro con flag.',
          hints: [
            'Ripassa la tabella delle porte da conoscere: quale accesso a distanza NON è cifrato?',
            'SSH è cifrato, telnet no. flag telnet',
          ],
          answer: ['telnet', '23', '23/tcp'],
          success: `**Telnet**, porta 23. È un protocollo degli anni Settanta e non dovrebbe mai essere acceso. Il suo sostituto sicuro è **SSH**, porta 22, che fa la stessa cosa ma cifra tutto.

@nyx: E i jukebox come questo escono di fabbrica con telnet acceso e una password uguale per tutti, scritta nel manuale. Il manuale è su Internet. Ecco come entra il tuo musicista notturno: dal parcheggio, collegato al wifi del bar, con la password di fabbrica.

Prima vulnerabilità trovata.`,
        },
        {
          kind: 'task',
          title: 'Che versione sei?',
          body: `Sapere che c'è un servizio è utile. Sapere **quale programma e quale versione** è ancora meglio.

Perché? I programmi hanno errori, e quando un errore permette di attaccarli si chiama **vulnerabilità**. Quelle scoperte vengono pubblicate in un elenco pubblico, con un codice per ognuna: le **CVE** (*Common Vulnerabilities and Exposures*). Una versione vecchia di un programma si porta dietro tutte le CVE scoperte dopo.

L'opzione \`-sV\` chiede a nmap di riconoscere le versioni:

\`\`\`
nmap -sV 192.168.1.20
\`\`\``,
          objective: 'Rileva le versioni dei servizi con nmap -sV 192.168.1.20',
          hints: ['Scrivi: nmap -sV 192.168.1.20'],
          check: (ev) => ev.type === 'scan' && ev.ip === '192.168.1.20' && ev.flags.includes('-sV'),
          success: `Ora c'è una colonna in più, **VERSION**. \`OpenSSH 7.4\` e \`Apache httpd 2.4.29\` sono versioni **molto vecchie**. Apache è il programma che mostra le pagine web del jukebox (si chiama *server web*).

Un pentester, a questo punto, cercherebbe "Apache 2.4.29 CVE" per sapere quali vulnerabilità note si porta dietro. Lo farai nel capitolo sulla ricognizione.`,
        },
        {
          kind: 'task',
          title: 'La tentazione',
          body: `@rook: Senti, già che ci sei... \`helix.corp\` è la corporazione che vuole comprare il bar di Mama. Scommetto che c'entrano loro. Dai un'occhiata anche alla loro rete, no? Nessuno lo saprà.

Cosa fai? Puoi provare a scrivere \`nmap helix.corp\` e vedere cosa succede, oppure rifiutare:

\`\`\`
flag no
\`\`\``,
          objective: 'Decidi: rifiuta con "flag no" (o prova a scansionare e osserva).',
          hints: ['helix.corp è nella lista FUORI SCOPE del contratto.', 'La risposta professionale è: flag no'],
          answer: ['no', 'rifiuto', 'no grazie'],
          success: `@nyx: Risposta giusta. Rook ti stava mettendo alla prova... o forse no. In ogni caso: **il perimetro non si discute**. Se un cliente o un collega ti chiede di andare oltre, la risposta è no, finché non c'è un'autorizzazione scritta di chi ne ha il diritto. Helix non ti ha autorizzato.`,
        },
        {
          kind: 'lesson',
          title: 'Il report',
          body: `@nyx: Un pentest non finisce quando trovi i problemi. Finisce quando li **spieghi** al cliente, in modo che possa correggerli. Il documento si chiama **report**, ed è il vero prodotto del tuo lavoro: Mama non paga per le scansioni, paga per sapere cosa fare.

Per ogni problema si scrive cosa hai trovato, quanto è grave, e **come si risolve**:

\`\`\`
[ALTO]  Telnet acceso su jukebox.lan (192.168.1.20:23)
        Rischio: password trasmesse in chiaro; password di fabbrica.
        Soluzione: spegnere telnet, usare SSH, cambiare la password.

[MEDIO] Programmi vecchi su jukebox.lan
        OpenSSH 7.4, Apache 2.4.29: vulnerabilità note.
        Soluzione: aggiornare all'ultima versione.

[INFO]  cassa.lan ignora il ping: buona pratica.
\`\`\`

La notazione \`192.168.1.20:23\` vuol dire "indirizzo 192.168.1.20, porta 23". La troverai ovunque.

?? Qui attacco e difesa si incontrano: ogni vulnerabilità che trovi diventa una correzione. Più avanti farai il lavoro opposto: accorgerti di chi fa queste scansioni sulla tua rete.`,
        },
        {
          kind: 'task',
          since: V,
          title: 'Il primo rigo',
          body: `@mama: Non leggo le cose sullo schermo. Mettimelo per iscritto, che poi lo stampo.

Scrivi il primo problema del report in un file. Ti ricordi \`echo\` e \`>\` dalla prima notte? \`echo\` scrive un testo, \`>\` lo manda in un file invece che sullo schermo:

\`\`\`
echo "ALTO: telnet acceso sul jukebox, spegnerlo" > rete/report.txt
\`\`\`

Il testo tra virgolette puoi scriverlo come vuoi, basta che contenga la parola **telnet**. Poi controlla con \`cat rete/report.txt\`.`,
          objective: 'Crea rete/report.txt con il problema di telnet.',
          hints: [
            'echo "il tuo testo" > rete/report.txt (il testo deve contenere la parola telnet)',
            'echo "ALTO: telnet acceso sul jukebox, spegnerlo" > rete/report.txt',
          ],
          state: (sh) => {
            const f = sh.fs.get(`${sh.home}/rete/report.txt`);
            return !!f && f.type === 'file' && /telnet/i.test(f.content);
          },
          solve: ['echo "ALTO: telnet acceso sul jukebox, spegnerlo" > rete/report.txt'],
          success: `Il report c'è. Mama lo stampa, lo legge due volte, poi prende il telefono e chiama il tecnico del jukebox: "spegnete quella cosa, il telnet".

Quella notte, alle tre, il jukebox resta muto.

@mama: Lavoro pulito. Rook aveva ragione su di te. Torna domani: il vecchio server del bar è pieno di roba che nessuno guarda da anni.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica finale',
          question: 'Un amico ti chiede di "testare" il sito della sua azienda con nmap, ma l\'azienda non è sua e non c\'è nulla di scritto. Cosa fai?',
          options: [
            'Lo faccio, tanto è solo una scansione',
            'Lo faccio di notte, così nessuno se ne accorge',
            'Non lo faccio senza un\'autorizzazione scritta di chi ha l\'autorità sul sistema',
            'Uso una VPN così non mi trovano',
          ],
          correct: 2,
          explain: `Serve l'autorizzazione di chi ha davvero l'autorità sul sistema (il proprietario o l'azienda), non di un amico che ci lavora. Per esercitarti esistono laboratori legali gratuiti, costruiti apposta per essere attaccati: li trovi nella sezione **Carriera** del menu.`,
        },
      ],
      recap: [
        ['porta', 'numero 0-65535 che identifica un servizio su un dispositivo'],
        ['servizio', 'programma in attesa di connessioni su una porta'],
        ['22 / 23 / 80 / 443', 'SSH (cifrato), Telnet (in chiaro), HTTP, HTTPS'],
        ['TCP handshake', 'SYN → SYN-ACK → ACK; RST = chiusa'],
        ['scope', 'il perimetro autorizzato: mai uscirne'],
        ['nmap -sn RETE', 'scopre gli host accesi'],
        ['nmap HOST', 'scansiona le 1000 porte più usate'],
        ['nmap -sV HOST', 'riconosce programmi e versioni'],
        ['CVE', 'elenco pubblico delle vulnerabilità note'],
        ['report', 'problema + gravità + soluzione: il vero prodotto di un pentest'],
      ],
    },
  ],
};
