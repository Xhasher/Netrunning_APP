import type { Chapter } from '../game/types';

export const CH09: Chapter = {
  id: 'ch09',
  code: '09',
  title: 'Reti avanzate',
  subtitle: 'Modello OSI, MAC e ARP, sottoreti, analisi del traffico e SSH',
  missions: [
    // ------------------------------------------------------------------ 9.1
    {
      id: 'ch09-m1',
      title: 'Strati',
      tagline: 'Il modello OSI e TCP/IP, l\'incapsulamento, MAC, ARP e routing.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Torniamo al bar',
          body: `@nyx: Nel capitolo 02 hai imparato IP, porte e ping. Funzionava, ma era come guidare senza sapere cosa c'è sotto il cofano. Per difendere una rete, e per leggere il traffico, devi capire **come è costruita**.

@nyx: Una rete funziona a **strati**, come una spedizione: tu scrivi una lettera, la metti in una busta con l'indirizzo, il corriere la mette in un furgone, il furgone usa le strade. Ognuno si occupa solo del suo pezzo.`,
        },
        {
          kind: 'lesson',
          title: 'Il modello OSI',
          body: `Il **modello OSI** divide la comunicazione in 7 strati (*layer*). Nella pratica si usa spesso il modello **TCP/IP**, più semplice, ma i numeri OSI li sentirai ovunque ("un attacco di livello 7", "uno switch di livello 2"):

\`\`\`
7 Applicazione  HTTP, DNS, SSH        ← cosa dici
6 Presentazione codifica, cifratura TLS
5 Sessione      gestione del dialogo
4 Trasporto     TCP, UDP, porte       ← a quale programma
3 Rete          IP, routing           ← a quale computer, anche lontano
2 Collegamento  Ethernet, Wi-Fi, MAC  ← al prossimo dispositivo sul cavo
1 Fisico        cavi, onde radio      ← i bit veri e propri
\`\`\`

Quando mandi una richiesta, ogni strato **incapsula** i dati del livello sopra aggiungendo la sua intestazione, come buste dentro buste: la richiesta HTTP va in un segmento TCP (porta), che va in un pacchetto IP (indirizzo), che va in un frame Ethernet (MAC). Chi riceve apre le buste in ordine inverso.

?? Saper dire "a che livello" sta un problema aiuta moltissimo: un firewall che filtra porte e IP lavora ai livelli 3-4, un WAF che blocca le SQL injection lavora al livello 7.`,
        },
        {
          kind: 'lesson',
          title: 'MAC e ARP',
          body: `Al **livello 2** i dispositivi non usano l'IP, ma l'indirizzo **MAC**: un identificativo della scheda di rete, scritto come 6 coppie esadecimali, es. \`02:4e:43:00:00:01\`. Il MAC serve solo **dentro la rete locale**: non attraversa i router.

Ma allora, se conosco l'IP \`192.168.1.20\`, come scopro il suo MAC? Con il protocollo **ARP**: il computer chiede a tutta la rete "chi ha l'IP 192.168.1.20?" e il proprietario risponde con il suo MAC. La risposta viene ricordata nella **tabella ARP** (o tabella dei vicini).

!! ARP non ha nessuna autenticazione: chiunque può rispondere "sono io". Un attaccante nella stessa rete può fingersi il router e far passare tutto il traffico da sé (**ARP spoofing**, un attacco *man in the middle*). Le difese: switch con protezioni dedicate (*Dynamic ARP Inspection*) e soprattutto **cifrare** il traffico, così anche se viene intercettato resta illeggibile.`,
        },
        {
          kind: 'task',
          title: 'I tuoi vicini',
          body: `Guarda la tabella dei vicini del tuo deck:

\`\`\`
ip neigh
\`\`\`

(Su sistemi vecchi: \`arp -a\`.) Qual è l'indirizzo **MAC** del router \`192.168.1.1\`? Invialo con \`flag\`.`,
          objective: 'Trova il MAC del router con ip neigh.',
          hints: ['Scrivi: ip neigh', 'Cerca la riga di 192.168.1.1, dopo "lladdr": flag 02:4e:43:00:00:01'],
          answer: ['02:4e:43:00:00:01'],
          success: `Ogni dispositivo che il tuo deck ha contattato compare con il suo MAC. Un difensore confronta spesso questa lista con l'**inventario**: un MAC sconosciuto vuol dire un dispositivo che nessuno ha autorizzato. Te ne servirà uno tra poco.`,
        },
        {
          kind: 'task',
          title: 'La strada',
          body: `Come fa il deck a raggiungere Internet? Ha una **tabella di instradamento** (*routing table*):

\`\`\`
ip route
\`\`\`

La riga \`default via 192.168.1.1\` vuol dire: "tutto quello che non è nella rete locale, mandalo al router". La seconda riga dice che la rete \`192.168.1.0/24\` è raggiungibile direttamente.`,
          objective: 'Guarda la tabella di instradamento con ip route.',
          hints: ['Scrivi: ip route'],
          check: (ev) => ev.type === 'netinfo',
          success: `Il router è il **default gateway**: la porta verso l'esterno. È anche per questo che è un bersaglio prezioso, e che il traffico che passa da lì va protetto.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un firewall blocca tutto il traffico verso la porta 23 (telnet). A quale livello OSI lavora soprattutto questa regola?',
          options: ['Livello 1, fisico', 'Livello 2, collegamento', 'Livello 4, trasporto', 'Livello 7, applicazione'],
          correct: 2,
          explain: `Le **porte** appartengono al livello 4 (TCP/UDP). Una regola basata solo su IP e porta è un filtro di livello 3-4. Per capire il **contenuto** di una richiesta (es. una SQL injection dentro HTTP) serve un controllo di livello 7.`,
        },
      ],
      recap: [
        ['OSI', '7 livelli: fisico, collegamento, rete, trasporto, sessione, presentazione, applicazione'],
        ['incapsulamento', 'HTTP dentro TCP dentro IP dentro Ethernet'],
        ['MAC', 'indirizzo della scheda di rete, vale solo nella rete locale'],
        ['ARP', 'scopre il MAC partendo dall\'IP; non autenticato'],
        ['ARP spoofing', 'fingersi un altro dispositivo per intercettare il traffico'],
        ['ip neigh / arp -a', 'la tabella dei vicini (IP → MAC)'],
        ['ip route', 'la tabella di instradamento; default = gateway'],
      ],
    },

    // ------------------------------------------------------------------ 9.2
    {
      id: 'ch09-m2',
      title: 'Sottoreti',
      tagline: 'CIDR, maschere, quanti host ci stanno e perché segmentare la rete.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Cosa vuol dire /24',
          body: `Un indirizzo IPv4 sono **32 bit**, scritti come 4 numeri da 8 bit. Il numero dopo la barra (notazione **CIDR**) dice **quanti bit iniziali** identificano la rete. Gli altri identificano il singolo dispositivo.

\`\`\`
192.168.1.50/24
└────┬────┘ └┬┘
 24 bit di    8 bit per gli host
 rete         → 2^8 = 256 indirizzi
\`\`\`

In ogni rete due indirizzi sono riservati:
- il **primo** è l'indirizzo della rete stessa (\`192.168.1.0\`)
- l'**ultimo** è il **broadcast**, che raggiunge tutti (\`192.168.1.255\`)

Quindi una /24 ha **254** host utilizzabili. La formula: **2^(32 − prefisso) − 2**.

\`\`\`
/24 → 256 indirizzi → 254 host   maschera 255.255.255.0
/25 → 128 indirizzi → 126 host   maschera 255.255.255.128
/26 →  64 indirizzi →  62 host   maschera 255.255.255.192
/16 → 65536 indirizzi             maschera 255.255.0.0
\`\`\``,
        },
        {
          kind: 'task',
          title: 'La calcolatrice',
          body: `Fare i conti a mano è utile per capire, ma nella pratica si usa uno strumento: \`ipcalc\`. Prova con la rete del bar:

\`\`\`
ipcalc 192.168.1.50/24
\`\`\`

Poi calcola una rete più piccola, \`10.0.0.0/26\`, e invia con \`flag\` quanti host può contenere.`,
          objective: 'Usa ipcalc e invia il numero di host di una /26.',
          hints: ['ipcalc 10.0.0.0/26', 'Guarda la riga Hosts/Net: flag 62'],
          answer: ['62'],
          success: `**62 host**: 64 indirizzi meno rete e broadcast. Nota anche \`Broadcast: 10.0.0.63\`: la rete successiva inizia da \`10.0.0.64\`.`,
        },
        {
          kind: 'task',
          title: 'Dentro o fuori?',
          body: `Un contratto autorizza la scansione della rete \`192.168.1.128/25\`. L'indirizzo \`192.168.1.100\` è **nello scope**?

Calcola con \`ipcalc 192.168.1.128/25\`, guarda HostMin e HostMax, e rispondi con \`flag si\` oppure \`flag no\`.`,
          objective: 'Decidi se 192.168.1.100 è dentro 192.168.1.128/25.',
          hints: ['ipcalc 192.168.1.128/25', 'Gli host vanno da .129 a .254: .100 è fuori. flag no'],
          answer: ['no'],
          success: `**No**: la /25 va da \`192.168.1.128\` a \`192.168.1.255\`. Saper leggere il CIDR **è una questione legale**, non solo tecnica: scansionare \`.100\` vorrebbe dire uscire dallo scope del contratto.`,
        },
        {
          kind: 'lesson',
          title: 'Perché dividere la rete',
          body: `Le sottoreti non servono solo a contare indirizzi: sono uno strumento di **difesa**. Si chiama **segmentazione**.

Nella rete del bar, oggi, il jukebox, la cassa, il telefono di Mama e il Wi-Fi dei clienti stanno tutti nella stessa \`/24\`. Se un cliente con un portatile infetto si collega al Wi-Fi, può raggiungere **direttamente** la cassa.

Una rete ben progettata la divide, per esempio:

\`\`\`
192.168.10.0/24  amministrazione e cassa
192.168.20.0/24  dispositivi (jukebox, telecamere)
192.168.30.0/24  Wi-Fi ospiti: solo Internet, niente reti interne
\`\`\`

Tra le sottoreti c'è un **firewall** che lascia passare solo il traffico necessario. Così un problema in un segmento **non si propaga** agli altri: l'attaccante deve superare un'altra barriera (in ATT&CK, il *Lateral Movement* diventa molto più difficile).

?? Le **VLAN** permettono di creare reti separate anche usando gli stessi switch fisici.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Qual è il vantaggio principale di mettere il Wi-Fi degli ospiti in una sottorete separata, con un firewall verso le altre?',
          options: [
            'Il Wi-Fi diventa più veloce',
            'Un dispositivo compromesso tra gli ospiti non può raggiungere direttamente cassa e server',
            'Non servono più le password',
            'Gli ospiti non possono usare Internet',
          ],
          correct: 1,
          explain: `La segmentazione **contiene** i danni: anche se un dispositivo degli ospiti è infetto, il firewall tra le sottoreti gli impedisce di arrivare ai sistemi importanti. È uno dei principi della "difesa in profondità".`,
        },
      ],
      recap: [
        ['CIDR /N', 'i primi N bit indicano la rete'],
        ['2^(32−N) − 2', 'numero di host utilizzabili'],
        ['rete / broadcast', 'primo e ultimo indirizzo, riservati'],
        ['/24 /25 /26', '254, 126, 62 host'],
        ['ipcalc', 'calcola rete, maschera, broadcast e host'],
        ['segmentazione', 'dividere la rete per contenere i danni'],
        ['VLAN', 'reti separate sugli stessi switch'],
      ],
    },

    // ------------------------------------------------------------------ 9.3
    {
      id: 'ch09-m3',
      title: 'Ascoltare il cavo',
      tagline: 'Leggere una cattura di traffico: handshake, scansioni e password in chiaro.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Catturare il traffico',
          body: `Gli strumenti di **cattura del traffico** registrano ogni pacchetto che passa da una scheda di rete:
- **tcpdump** da terminale
- **Wireshark** con interfaccia grafica, il più usato al mondo per l'analisi

Le catture si salvano in file (formato \`.pcap\`) da analizzare dopo. Per un difensore sono la prova più dettagliata che esista: mostrano **esattamente** cosa è passato sulla rete.

Una riga di tcpdump si legge così:

\`\`\`
21:10:00.411 IP 192.168.1.33.50512 > 192.168.1.20.80: Flags [S], seq 1000
     ora         sorgente  .porta  →  destinazione.porta   flag TCP
\`\`\`

I **flag TCP** ricordano l'handshake del capitolo 02:
- \`[S]\` SYN → "vorrei parlare"
- \`[S.]\` SYN-ACK → "ok" (il punto indica ACK)
- \`[.]\` ACK
- \`[P.]\` PUSH → qui ci sono dei dati
- \`[R.]\` RESET → "porta chiusa"

Mama ha registrato un minuto di traffico del bar in \`rete/cattura.txt\`.`,
        },
        {
          kind: 'task',
          title: 'Apri la cattura',
          body: `Leggi la cattura con tcpdump:

\`\`\`
tcpdump -r rete/cattura.txt
\`\`\`

Riconosci la richiesta DNS iniziale, l'handshake TCP verso il jukebox, e del traffico cifrato verso la cassa sulla porta 443.`,
          objective: 'Leggi la cattura con tcpdump -r.',
          hints: ['Scrivi: tcpdump -r rete/cattura.txt'],
          check: (ev) => ev.type === 'command' && ev.name === 'tcpdump' && ev.ok,
          success: `C'è molto da vedere. In fondo, molte righe tutte uguali tranne la porta di destinazione... Ma prima guardiamo una cosa più grave.`,
        },
        {
          kind: 'task',
          title: 'In chiaro',
          body: `Cerca nella cattura la parola "password":

\`\`\`
grep -i password rete/cattura.txt
\`\`\`

La password di Mama per il pannello del jukebox viaggia **leggibile**. Con quale protocollo? Rispondi con il nome del protocollo con \`flag\`.`,
          objective: 'Trova il protocollo che trasmette la password in chiaro.',
          hints: ['Guarda la riga POST /pannello/login poco sopra: porta 80.', 'La porta 80 è HTTP: flag http'],
          answer: ['http', 'http/1.1', '80'],
          success: `**HTTP** sulla porta 80, senza cifratura: chiunque sia sulla stessa rete (un cliente sul Wi-Fi, un dispositivo con ARP spoofing) può leggere la password. Confronta con la riga verso la cassa sulla 443: lì il contenuto è **illeggibile**, perché è HTTPS.

La correzione: attivare **HTTPS** sul pannello del jukebox e cambiare la password di Mama, che va considerata esposta.`,
        },
        {
          kind: 'task',
          title: 'Chi bussa a tutte le porte?',
          body: `In fondo alla cattura c'è un dispositivo che manda tanti \`[S]\` (SYN) a porte diverse del jukebox, e riceve molti \`[R.]\` (porta chiusa). È lo schema di una **scansione SYN**, come quella di nmap.

Conta i SYN per sorgente:

\`\`\`
grep "Flags [S]," rete/cattura.txt | cut -d " " -f 3 | sort | uniq -c
\`\`\`

Quale **indirizzo IP** sta scansionando? Invialo con \`flag\` (senza la porta finale).`,
          objective: 'Trova l\'IP che fa la scansione SYN.',
          hints: ['Il terzo campo è IP.porta: il numero dopo l\'ultimo punto è la porta sorgente.', 'flag 192.168.1.66'],
          answer: ['192.168.1.66'],
          success: `**192.168.1.66**: 12 SYN verso 12 porte diverse in pochi istanti. E ora confronta con la tabella dei vicini (\`ip neigh\`): quell'indirizzo **non c'è**, e non è nella lista dei dispositivi del bar.

Un dispositivo sconosciuto che scansiona la rete interna è un incidente serio: qualcuno ha collegato un apparecchio al bar (o un dispositivo è stato compromesso). Il passo successivo sarebbe trovarlo fisicamente dal suo MAC e isolarlo.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'In una cattura vedi molti `[S]` dalla stessa sorgente verso porte diverse, e quasi solo `[R.]` come risposta. Cosa sta succedendo?',
          options: [
            'Un download molto veloce',
            'Una scansione delle porte: le risposte RST indicano porte chiuse',
            'Una videochiamata',
            'Un errore del cavo',
          ],
          correct: 1,
          explain: `SYN verso tante porte = scansione. Le risposte \`[S.]\` indicano porte **aperte**, le \`[R.]\` porte **chiuse**. Lo stesso schema che nmap usa per costruire la sua tabella, visto dal lato del difensore.`,
        },
      ],
      recap: [
        ['tcpdump / Wireshark', 'cattura e analisi del traffico di rete'],
        ['tcpdump -r FILE', 'legge una cattura salvata'],
        ['[S] [S.] [.] [P.] [R.]', 'SYN, SYN-ACK, ACK, dati, reset'],
        ['protocolli in chiaro', 'HTTP, telnet, FTP: tutto leggibile da chi intercetta'],
        ['scansione SYN', 'tanti SYN su porte diverse dalla stessa sorgente'],
        ['dispositivo sconosciuto', 'IP/MAC non in inventario: da indagare subito'],
      ],
    },

    // ------------------------------------------------------------------ 9.4
    {
      id: 'ch09-m4',
      title: 'Chiavi e tunnel',
      tagline: 'SSH a fondo: chiavi, fingerprint, tunnel e VPN.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Perché le chiavi',
          body: `Hai usato \`ssh\` nelle Operazioni senza password: il cliente aveva installato la tua **chiave pubblica**. Ecco come funziona.

1. Generi una **coppia di chiavi** sul tuo computer
2. La **pubblica** (\`id_ed25519.pub\`) la copi sul server, nel file \`~/.ssh/authorized_keys\`
3. Quando ti colleghi, il server ti manda una "sfida" che solo chi possiede la **privata** sa risolvere (crittografia asimmetrica, capitolo 06!)
4. La chiave privata **non lascia mai** il tuo computer

Rispetto alle password: niente da indovinare (il brute force diventa inutile) e niente da intercettare.`,
        },
        {
          kind: 'task',
          title: 'La tua coppia di chiavi',
          body: `Genera la tua coppia di chiavi:

\`\`\`
ssh-keygen
\`\`\`

Poi guarda i permessi dei file creati:

\`\`\`
ls -l ~/.ssh
\`\`\`

Che permessi ha la chiave **privata** \`id_ed25519\`? Invia la stringa (es. \`rw-r--r--\`) oppure il numero (es. \`644\`) con \`flag\`.`,
          objective: 'Genera le chiavi e invia i permessi della chiave privata.',
          hints: ['ssh-keygen, poi ls -l ~/.ssh', 'La privata è rw------- cioè 600: flag 600'],
          answer: ['600', 'rw-------', '-rw-------'],
          success: `**600** (\`rw-------\`): solo tu puoi leggerla. SSH è così severo che **rifiuta** di usare una chiave privata leggibile da altri. Ricordi il principio del minimo privilegio?

!! La chiave privata è come la chiave di casa: chi la copia può entrare ovunque tu sia autorizzato. Non va mai inviata via email, chat o caricata in un repository. Nella pratica si protegge anche con una **passphrase**.`,
        },
        {
          kind: 'lesson',
          title: 'Fingerprint e known_hosts',
          body: `La prima volta che ti colleghi a un server, SSH ti mostra un messaggio come questo:

\`\`\`
The authenticity of host 'server (10.0.0.5)' can't be established.
ED25519 key fingerprint is SHA256:Xk3...q9.
Are you sure you want to continue connecting (yes/no)?
\`\`\`

È l'**impronta** della chiave del **server**. Se rispondi \`yes\`, viene salvata in \`~/.ssh/known_hosts\`. Le volte successive SSH controlla che sia la stessa.

Se un giorno compare l'avviso:

\`\`\`
WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!
\`\`\`

vuol dire che il server risponde con un'altra chiave. Può essere innocuo (il server è stato reinstallato), ma può anche essere un attacco **man in the middle**: qualcuno si è messo in mezzo fingendosi il server. **Non ignorarlo mai**: verifica con l'amministratore prima di proseguire.`,
        },
        {
          kind: 'lesson',
          title: 'Tunnel e VPN',
          body: `SSH può anche creare **tunnel**: trasportare dentro la sua connessione cifrata altro traffico. Esempio: un database accessibile solo dall'interno del server si raggiunge in sicurezza con

\`\`\`
ssh -L 3306:localhost:3306 utente@server
\`\`\`

Il traffico verso la porta 3306 del tuo computer viaggia **cifrato** dentro SSH fino al server.

Una **VPN** fa lo stesso su scala più grande: crea un tunnel cifrato tra il tuo dispositivo e una rete, come se fossi collegato lì. Le aziende la usano per il lavoro da remoto (strumenti: WireGuard, OpenVPN, IPsec).

!! I tunnel sono un'arma a doppio taglio: gli attaccanti li usano per far uscire dati o raggiungere reti interne aggirando i firewall. Per un SOC, una connessione SSH lunghissima verso un IP esterno sconosciuto è un'anomalia da indagare. E una VPN aziendale protetta solo da password è proprio il bersaglio del password spraying del capitolo 08.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Collegandoti al solito server compare "REMOTE HOST IDENTIFICATION HAS CHANGED". Cosa fai?',
          options: [
            'Cancello known_hosts e riprovo: è un errore comune',
            'Mi fermo e verifico con l\'amministratore se la chiave del server è cambiata davvero: potrebbe essere un man in the middle',
            'Uso telnet al posto di ssh',
            'Ignoro l\'avviso',
          ],
          correct: 1,
          explain: `L'avviso esiste proprio per proteggerti da un man in the middle. Cancellare \`known_hosts\` senza verificare vuol dire disattivare la protezione nel momento in cui serve. Se l'amministratore conferma la reinstallazione, allora si aggiorna l'impronta.`,
        },
      ],
      recap: [
        ['ssh-keygen', 'crea la coppia di chiavi'],
        ['id_ed25519 / .pub', 'privata (600, mai condivisa) / pubblica (sui server)'],
        ['authorized_keys', 'chiavi pubbliche ammesse su un account'],
        ['known_hosts', 'impronte dei server già visti'],
        ['HOST IDENTIFICATION HAS CHANGED', 'possibile man in the middle: verifica!'],
        ['ssh -L', 'tunnel cifrato verso una porta remota'],
        ['VPN', 'tunnel cifrato verso un\'intera rete (WireGuard, OpenVPN)'],
      ],
    },
  ],
};
