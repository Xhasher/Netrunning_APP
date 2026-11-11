import type { Chapter } from '../game/types';

export const CH02: Chapter = {
  id: 'ch02',
  code: '02',
  title: 'Rete di quartiere',
  subtitle: 'Come parlano i computer: IP, ping, DNS, porte e nmap',
  missions: [
    // ------------------------------------------------------------------ 2.1
    {
      id: 'ch02-m1',
      title: 'Indirizzi',
      tagline: 'Cos\'è una rete, cos\'è un indirizzo IP e come trovare il tuo.',
      xp: 150,
      steps: [
        {
          kind: 'lesson',
          title: 'Il lavoro',
          body: `@rook: Mama Reyes gestisce "Lo Scantinato", un bar di Watson. Pensa che qualcuno le stia entrando nella rete. Vuole che un professionista controlli quanto è sicura. Ti pagano per trovare i buchi **prima** dei cattivi.

@nyx: Questo si chiama **penetration test**: un attacco simulato, **autorizzato** dal proprietario, per scoprire le debolezze e poi correggerle. Ma prima di attaccare una rete devi capire come funziona. Si parte dalle basi.`,
        },
        {
          kind: 'lesson',
          title: 'Cos\'è una rete',
          body: `Una **rete** è un insieme di dispositivi collegati che si scambiano dati: computer, telefoni, stampanti, telecamere, il router di casa.

- **LAN** (*Local Area Network*): la rete locale, per esempio quella di casa tua o del bar. Di solito è creata dal **router**.
- **Internet**: la rete delle reti, che collega tra loro milioni di LAN in tutto il mondo.

I dati non viaggiano tutti insieme: vengono divisi in piccoli **pacchetti**, come lettere spedite per posta. Ogni pacchetto ha un **mittente** e un **destinatario**.

Perché tutti si capiscano servono delle regole comuni: si chiamano **protocolli**. Ne incontrerai tanti: IP, TCP, UDP, HTTP, DNS, SSH...`,
        },
        {
          kind: 'lesson',
          title: 'L\'indirizzo IP',
          body: `Per spedire una lettera ti serve un indirizzo. In rete ogni dispositivo ha un **indirizzo IP** (*Internet Protocol*). La versione più comune, **IPv4**, è fatta di 4 numeri da 0 a 255 separati da punti:

\`\`\`
192.168.1.50
\`\`\`

Ci sono due tipi di indirizzi:
- **Privati**: usati solo dentro una LAN, non raggiungibili direttamente da Internet. Riconoscili perché iniziano con \`192.168.\`, \`10.\` oppure da \`172.16.\` a \`172.31.\`
- **Pubblici**: unici in tutto il mondo, visibili su Internet. Il tuo router ne ha uno e lo "condivide" con tutti i dispositivi di casa.

C'è anche un indirizzo speciale: \`127.0.0.1\`, detto **localhost** o *loopback*: è il computer che parla con se stesso.

?? Esiste anche **IPv6**, con indirizzi molto più lunghi (es. \`2001:db8::1\`), nato perché gli indirizzi IPv4 sono finiti. Per ora concentrati su IPv4.`,
        },
        {
          kind: 'task',
          title: 'Il tuo indirizzo',
          body: `Il deck è collegato alla rete del bar. Scopri il tuo indirizzo IP con:

\`\`\`
ip a
\`\`\`

(\`a\` sta per *address*. Sui sistemi più vecchi si usa \`ifconfig\`.)

Nel risultato vedrai due **interfacce** di rete (le "schede di rete"):
- \`lo\` → il loopback, \`127.0.0.1\`
- \`eth0\` → la scheda di rete vera. Cerca la riga che inizia con \`inet\`.`,
          objective: 'Mostra la configurazione di rete con ip a.',
          hints: ['Scrivi: ip a (ip, spazio, a)'],
          check: (ev) => ev.type === 'netinfo',
          success: `Sotto \`eth0\`, nella riga \`inet\`, c'è il tuo indirizzo seguito da \`/24\`. Il \`/24\` indica la grandezza della rete: significa che i primi 3 numeri (\`192.168.1\`) sono la "via", in comune a tutti i dispositivi del bar, e l'ultimo numero è il "civico" del singolo dispositivo. In una rete /24 possono stare fino a 254 dispositivi (da .1 a .254).`,
        },
        {
          kind: 'task',
          title: 'Rispondi',
          body: `Qual è l'indirizzo IP del tuo deck sull'interfaccia \`eth0\`? Scrivi solo i quattro numeri, senza \`/24\`.

\`\`\`
flag 192.168.x.x
\`\`\``,
          objective: 'Invia il tuo indirizzo IP con flag.',
          hints: ['È nella riga inet sotto eth0 di "ip a". Scrivi solo i 4 numeri.', 'flag 192.168.1.50'],
          answer: ['192.168.1.50'],
          success: `Esatto: sei \`192.168.1.50\`. Il primo passo di ogni attività in rete è sapere **dove sei**.`,
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
        ['rete / LAN', 'dispositivi collegati; la LAN è la rete locale'],
        ['pacchetto', 'un pezzetto di dati con mittente e destinatario'],
        ['protocollo', 'le regole comuni per comunicare'],
        ['indirizzo IP', 'l\'indirizzo di un dispositivo in rete, es. 192.168.1.50'],
        ['IP privato', '192.168.x.x, 10.x.x.x, 172.16-31.x.x'],
        ['127.0.0.1', 'localhost: il computer stesso'],
        ['ip a', 'mostra le interfacce di rete e il tuo IP'],
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
          body: `Il comando \`ping\` serve a capire se un altro dispositivo è raggiungibile. Funziona come il **sonar** di un sottomarino:

- il tuo computer manda un pacchetto speciale chiamato **ICMP Echo Request** ("ci sei?")
- se il destinatario è acceso e disposto a rispondere, rimanda un **Echo Reply** ("ci sono!")
- \`ping\` misura quanto tempo ci mette la risposta, in **millisecondi** (ms)

**ICMP** è un protocollo usato per messaggi di servizio e di errore della rete.

?? Nel vero Linux \`ping\` continua all'infinito finché non premi **Ctrl+C**. Qui ne invia 4 (puoi cambiare il numero con \`-c\`, es. \`ping -c 2 ...\`).`,
        },
        {
          kind: 'task',
          title: 'Ping al router',
          body: `Il **router** (o *gateway*) è il dispositivo che collega la LAN del bar a Internet. Nelle reti di casa ha quasi sempre l'indirizzo che finisce con \`.1\`.

\`\`\`
ping 192.168.1.1
\`\`\``,
          objective: 'Fai ping al router 192.168.1.1.',
          hints: ['Scrivi: ping 192.168.1.1'],
          check: (ev) => ev.type === 'ping' && ev.ip === '192.168.1.1' && ev.replies > 0,
          success: `Il router risponde! Leggiamo l'output:
- \`64 bytes from 192.168.1.1\` → è arrivata una risposta di 64 byte
- \`icmp_seq=1\` → il numero del pacchetto
- \`ttl=64\` → *Time To Live*, un contatore anti-loop. Il valore iniziale dipende dal sistema operativo: **64** di solito è Linux, **128** Windows. È un primo indizio per capire che sistema c'è dall'altra parte!
- \`time=1.2 ms\` → il tempo di andata e ritorno
- in fondo, il riepilogo: \`0% packet loss\` vuol dire nessun pacchetto perso.`,
        },
        {
          kind: 'lesson',
          title: 'Il DNS: la rubrica di Internet',
          body: `Ricordare numeri come \`142.250.180.14\` è scomodo. Per questo esistono i **nomi**: \`google.com\`, \`wikipedia.org\`...

Il **DNS** (*Domain Name System*) è la "rubrica telefonica" della rete: trasforma un nome nel suo indirizzo IP. Quando scrivi un nome, il tuo computer chiede prima al server DNS "che IP ha questo nome?", e poi contatta quell'IP.

Nella LAN del bar il router fa anche da DNS: i dispositivi hanno nomi che finiscono con \`.lan\`.

!! Il DNS è anche un bersaglio: un attaccante che riesce a falsificare le risposte DNS può mandarti su un sito falso anche se scrivi il nome giusto (*DNS spoofing*).`,
        },
        {
          kind: 'task',
          title: 'Ping per nome',
          body: `Nel bar c'è un vecchio jukebox collegato in rete. Si chiama \`jukebox.lan\`. Fai ping usando il nome invece dell'IP:

\`\`\`
ping jukebox.lan
\`\`\`

Guarda la prima riga: il DNS ti dirà quale IP corrisponde a quel nome.`,
          objective: 'Fai ping a jukebox.lan usando il nome.',
          hints: ['Scrivi: ping jukebox.lan'],
          check: (ev) => ev.type === 'ping' && ev.target.toLowerCase().startsWith('jukebox') && ev.replies > 0,
          success: `Il nome \`jukebox.lan\` è stato tradotto in \`192.168.1.20\`. Il jukebox è acceso e risponde.`,
        },
        {
          kind: 'task',
          title: 'Silenzio',
          body: `Ora prova con il registratore di cassa del bar, \`cassa.lan\`:

\`\`\`
ping cassa.lan
\`\`\``,
          objective: 'Fai ping a cassa.lan e osserva cosa succede.',
          hints: ['Scrivi: ping cassa.lan'],
          check: (ev) => ev.type === 'ping' && ev.ip === '192.168.1.30',
          success: `\`100% packet loss\`: nessuna risposta. Ma attenzione: **il DNS ha trovato l'IP**, quindi il dispositivo esiste.

Non rispondere al ping **non vuol dire essere spenti**. Molti sistemi hanno un **firewall** (un filtro che decide quale traffico far passare) configurato per ignorare l'ICMP. È una piccola misura di difesa: rende il dispositivo meno visibile. Nella prossima missione vedremo come scoprirlo lo stesso.`,
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
          explain: `Il silenzio è ambiguo. Un buon analista non tira conclusioni da un solo test: verifica con altri metodi. È un principio che vale sia in attacco sia in difesa.`,
        },
      ],
      recap: [
        ['ping HOST', 'verifica se un dispositivo risponde (ICMP echo)'],
        ['ms', 'millisecondi: il tempo di andata e ritorno'],
        ['TTL', '64 suggerisce Linux, 128 Windows'],
        ['DNS', 'traduce i nomi (jukebox.lan) in indirizzi IP'],
        ['gateway / router', 'collega la LAN a Internet, spesso .1'],
        ['firewall', 'filtro che blocca o lascia passare il traffico'],
        ['100% packet loss', 'nessuna risposta: spento oppure filtrato'],
      ],
    },

    // ------------------------------------------------------------------ 2.3
    {
      id: 'ch02-m3',
      title: 'Porte aperte',
      tagline: 'Porte, servizi, lo scope legale e la tua prima scansione con nmap.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Le porte',
          body: `Un indirizzo IP identifica un **dispositivo**. Ma su un dispositivo girano molti programmi che usano la rete nello stesso momento: un sito web, la posta, l'accesso remoto...

Per distinguerli si usano le **porte**: numeri da **0 a 65535**. Se l'IP è l'indirizzo di un **palazzo**, la porta è il **numero dell'appartamento**.

Un programma che resta in ascolto su una porta si chiama **servizio**. Alcune porte sono famose e vanno imparate a memoria:

\`\`\`
21   FTP      trasferimento file (non cifrato)
22   SSH      accesso remoto sicuro (cifrato)
23   Telnet   accesso remoto NON cifrato
25   SMTP     invio di email
53   DNS      risoluzione dei nomi
80   HTTP     siti web (non cifrato)
443  HTTPS    siti web cifrati (il lucchetto)
3306 MySQL    database
3389 RDP      desktop remoto di Windows
\`\`\`

Una porta può essere:
- **open** (aperta): c'è un servizio che risponde
- **closed** (chiusa): non c'è niente in ascolto
- **filtered** (filtrata): un firewall impedisce di saperlo`,
        },
        {
          kind: 'lesson',
          title: 'TCP: la stretta di mano',
          body: `La maggior parte dei servizi usa il protocollo **TCP**, che prima di scambiare dati stabilisce una connessione con una "stretta di mano" in tre tempi (*three-way handshake*):

\`\`\`
tu      ── SYN ──────▶  server    "vorrei parlare"
tu      ◀── SYN-ACK ──  server    "va bene, ci sono"
tu      ── ACK ──────▶  server    "ok, iniziamo"
\`\`\`

Se la porta è chiusa, il server risponde con un **RST** ("niente da fare").

È proprio così che funziona una scansione delle porte: si bussa a ogni porta e si guarda come risponde.

?? Esiste anche **UDP**, un protocollo più veloce ma senza handshake e senza garanzia di consegna. Lo usano per esempio DNS, giochi online e streaming.`,
        },
        {
          kind: 'lesson',
          title: 'Prima regola: lo scope',
          body: `@nyx: Fermati. Prima di toccare un solo pacchetto devi sapere **dove puoi andare**. È la differenza tra un professionista e un criminale.

Ogni penetration test reale inizia con un **contratto** che definisce:
- lo **scope** (perimetro): quali sistemi puoi testare
- cosa è **fuori scope**: sistemi che NON devi toccare
- quali tecniche sono permesse e in che orari
- la **firma** di chi ha l'autorità per autorizzarti

!! In Italia l'**art. 615-ter del Codice Penale** punisce l'accesso abusivo a un sistema informatico, con la reclusione fino a 3 anni, e di più nei casi aggravati. Anche una scansione non autorizzata può causarti grossi guai legali e lavorativi. **Mai** fuori dallo scope, **mai** senza autorizzazione scritta.`,
        },
        {
          kind: 'task',
          title: 'Leggi il contratto',
          body: `Il contratto firmato da Mama Reyes è nel file \`rete/scope.txt\`. Leggilo.`,
          objective: 'Leggi il file rete/scope.txt.',
          hints: ['Dalla home: cat rete/scope.txt'],
          check: (ev, sh) => ev.type === 'read' && ev.path === sh.home + '/rete/scope.txt',
          success: `Sei autorizzato a testare la rete \`192.168.1.0/24\`, cioè tutti gli indirizzi da \`192.168.1.0\` a \`192.168.1.255\`. \`helix.corp\` è esplicitamente fuori scope: non toccarlo.`,
        },
        {
          kind: 'lesson',
          title: 'nmap',
          body: `**nmap** (*Network Mapper*) è lo strumento di ricognizione di rete più usato al mondo, sia da chi attacca sia da chi difende. È gratuito e open source.

Fa principalmente tre cose:
- **host discovery**: scopre quali dispositivi sono accesi in una rete
- **port scanning**: scopre quali porte sono aperte su un dispositivo
- **service detection**: capisce quale programma (e quale **versione**) risponde su ogni porta

La sintassi base è:

\`\`\`
nmap [opzioni] bersaglio
\`\`\`

Il bersaglio può essere un IP, un nome, o un'intera rete in notazione **CIDR**, come \`192.168.1.0/24\`.`,
        },
        {
          kind: 'task',
          title: 'Chi c\'è nel bar?',
          body: `Scopriamo tutti i dispositivi accesi nella rete del bar. L'opzione \`-sn\` dice a nmap di fare **solo** la scoperta degli host, senza scansionare le porte:

\`\`\`
nmap -sn 192.168.1.0/24
\`\`\``,
          objective: 'Scopri gli host accesi con nmap -sn 192.168.1.0/24',
          hints: ['Scrivi: nmap -sn 192.168.1.0/24'],
          check: (ev) => ev.type === 'scan' && ev.flags.includes('-sn') && ev.target.endsWith('/24') && !ev.outOfScope,
          success: `nmap ha trovato anche \`cassa.lan\`, che al ping non rispondeva! Perché nmap non si affida solo al ping: prova anche a contattare porte comuni (come la 80 e la 443) e, nelle reti locali, usa il protocollo **ARP**. **Un solo metodo non basta mai.**`,
        },
        {
          kind: 'task',
          title: 'Conta',
          body: `Quanti host risultano accesi (*hosts up*) nella rete, contando anche il tuo deck? Guarda l'ultima riga dell'output di nmap.`,
          objective: 'Invia il numero di host accesi con flag.',
          hints: ['L\'ultima riga dice "(N hosts up)".', 'flag 4'],
          answer: ['4'],
          success: `4 dispositivi: il router, il jukebox, la cassa e te. Ora hai una **mappa** della rete. Prossimo passo: le porte.`,
        },
        {
          kind: 'task',
          title: 'Bussare alle porte',
          body: `Scansioniamo le porte del jukebox. Senza opzioni, nmap controlla le **1000 porte più comuni**:

\`\`\`
nmap jukebox.lan
\`\`\``,
          objective: 'Scansiona le porte di jukebox.lan con nmap.',
          hints: ['Scrivi: nmap jukebox.lan'],
          check: (ev) => ev.type === 'scan' && ev.ip === '192.168.1.20' && !ev.flags.includes('-sn'),
          success: `Leggiamo il risultato:
- \`Not shown: 997 closed tcp ports\` → 997 porte chiuse, non mostrate
- poi una tabella: **PORT** (numero/protocollo), **STATE** (stato), **SERVICE** (il servizio che di solito usa quella porta)

Il jukebox ha 3 porte aperte: 22 (ssh), 23 (telnet) e 80 (http).`,
        },
        {
          kind: 'task',
          title: 'Il servizio pericoloso',
          body: `Guarda le porte aperte del jukebox. Una di queste usa un protocollo di accesso remoto che manda tutto **in chiaro**, password comprese, senza alcuna cifratura. Chiunque intercetti il traffico può leggerle.

Quale servizio è? Rispondi con il nome del servizio.`,
          objective: 'Invia il nome del servizio insicuro con flag.',
          hints: [
            'Ripassa la tabella delle porte famose: quale servizio di accesso remoto NON è cifrato?',
            'SSH è cifrato, telnet no. flag telnet',
          ],
          answer: ['telnet', '23', '23/tcp'],
          success: `**Telnet** (porta 23) trasmette tutto in chiaro. È un protocollo degli anni '70 e non dovrebbe mai essere esposto. Il sostituto sicuro è **SSH** (porta 22), che cifra la comunicazione. Prima vulnerabilità trovata!`,
        },
        {
          kind: 'task',
          title: 'Che versione sei?',
          body: `Sapere che c'è un servizio è utile. Sapere **quale programma e quale versione** è ancora meglio: le versioni vecchie hanno spesso **vulnerabilità note**, pubblicate in database pubblici (le **CVE**, *Common Vulnerabilities and Exposures*).

L'opzione \`-sV\` attiva il rilevamento delle versioni:

\`\`\`
nmap -sV 192.168.1.20
\`\`\``,
          objective: 'Rileva le versioni dei servizi con nmap -sV 192.168.1.20',
          hints: ['Scrivi: nmap -sV 192.168.1.20'],
          check: (ev) => ev.type === 'scan' && ev.ip === '192.168.1.20' && ev.flags.includes('-sV'),
          success: `Ora c'è la colonna **VERSION**. \`OpenSSH 7.4\` e \`Apache httpd 2.4.29\` sono versioni **molto vecchie**: un pentester a questo punto cercherebbe "Apache 2.4.29 CVE" per scoprire quali vulnerabilità note hanno. Lo faremo nel capitolo sulla ricognizione.`,
        },
        {
          kind: 'task',
          title: 'La tentazione',
          body: `@rook: Senti, già che ci sei... \`helix.corp\` è la corporazione che vuole comprare il bar di Mama. Dai un'occhiata anche a loro, no? Nessuno lo saprà.

Cosa fai? Puoi provare a scrivere \`nmap helix.corp\` e vedere cosa succede, oppure rifiutare rispondendo:

\`\`\`
flag no
\`\`\``,
          objective: 'Decidi: rifiuta con "flag no" (o prova a scansionare e osserva).',
          hints: ['helix.corp è nella lista FUORI SCOPE del contratto.', 'La risposta professionale è: flag no'],
          answer: ['no', 'rifiuto', 'no grazie'],
          success: `@nyx: Risposta giusta. Rook ti stava mettendo alla prova... o forse no. In ogni caso: **lo scope non si discute**. Se un cliente o un collega ti chiede di andare oltre, la risposta è no, finché non c'è un'autorizzazione scritta di chi ne ha il diritto.`,
        },
        {
          kind: 'lesson',
          title: 'Il report',
          body: `Un penetration test non finisce quando trovi i problemi: finisce quando li **comunichi** in modo chiaro, così che il cliente possa correggerli. Il documento si chiama **report**.

Per ogni problema si scrive cosa hai trovato, quanto è grave, e **come risolverlo**:

\`\`\`
[ALTO]  Telnet esposto su jukebox.lan (192.168.1.20:23)
        Rischio: credenziali trasmesse in chiaro.
        Soluzione: disattivare telnet, usare SSH.

[MEDIO] Software obsoleto su jukebox.lan
        OpenSSH 7.4, Apache 2.4.29: vulnerabilità note.
        Soluzione: aggiornare all'ultima versione.

[INFO]  cassa.lan filtra l'ICMP: buona pratica.
\`\`\`

?? Questo è il punto in cui attacco e **difesa** si incontrano: ogni vulnerabilità che trovi diventa una correzione che rende il sistema più sicuro. Nei capitoli Blue Team imparerai a fare il lavoro opposto: rilevare chi sta facendo queste scansioni sulla tua rete.`,
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
        ['22 / 23 / 80 / 443', 'SSH, Telnet, HTTP, HTTPS'],
        ['TCP handshake', 'SYN → SYN-ACK → ACK'],
        ['scope', 'il perimetro autorizzato: mai uscirne'],
        ['art. 615-ter c.p.', 'accesso abusivo a un sistema informatico'],
        ['nmap -sn RETE', 'scopre gli host accesi'],
        ['nmap HOST', 'scansiona le 1000 porte più comuni'],
        ['nmap -sV HOST', 'rileva software e versioni'],
        ['CVE', 'database pubblico delle vulnerabilità note'],
        ['report', 'problemi + gravità + soluzione: il vero prodotto di un pentest'],
      ],
    },
  ],
};
