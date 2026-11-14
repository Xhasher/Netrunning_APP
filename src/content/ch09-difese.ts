import type { Mission } from '../game/types';

// Capitolo 09, quinta missione: i "guardiani" della rete. Proxy, firewall di nuova
// generazione, DMZ, IDS/IPS con le loro regole, VPN.

export const NETDEF_MISSION: Mission = {
  id: 'ch09-m5',
  title: 'I guardiani della rete',
  tagline: 'Proxy, firewall, DMZ, IDS e IPS, regole di rilevamento e VPN: come si difende una rete aziendale.',
  xp: 300,
  steps: [
    {
      kind: 'lesson',
      title: 'Una rete con le mura',
      body: `@nyx: Fino a ora hai visto la rete come una strada: indirizzi, porte, pacchetti. Una rete aziendale però ha dei **guardiani** messi lungo la strada, ognuno con un compito diverso. Un analista deve sapere chi sono, perché i loro registri (log) sono le prime prove che leggerà.

Immagina un palazzo:
- il **firewall** è il portone: decide chi può entrare e uscire, e da quale porta
- la **DMZ** è l'atrio: una zona dove stanno i servizi che il pubblico deve raggiungere (il sito web, la posta), separata dagli uffici
- il **proxy** è la portineria per chi esce: gli impiegati non vanno su Internet direttamente, chiedono al proxy, che controlla e annota
- l'**IDS / IPS** è la telecamera con la guardia: osserva cosa passa e riconosce i comportamenti sospetti
- la **VPN** è il passaggio sotterraneo protetto per chi lavora da fuori

Nessuno di questi basta da solo: è la **difesa in profondità** che hai visto nel capitolo dei fondamenti.`,
    },
    {
      kind: 'lesson',
      title: 'Firewall e DMZ',
      body: `Un **firewall** applica delle **regole** al traffico: per ogni pacchetto decide se farlo passare (*allow*) o bloccarlo (*deny* o *drop*). Le regole guardano soprattutto indirizzo di partenza, indirizzo di arrivo, porta e protocollo. Si leggono **dall'alto in basso**, e vince la prima che corrisponde; in fondo c'è sempre una regola "blocca tutto il resto" (*default deny*).

Esempio di regole, diverso dagli esercizi:

\`\`\`
1  ALLOW  qualsiasi      -> 203.0.113.10  porta 443   (il sito web, per tutti)
2  ALLOW  10.0.0.0/24    -> qualsiasi     porta 53    (DNS, per gli uffici)
3  DENY   qualsiasi      -> qualsiasi                 (tutto il resto)
\`\`\`

I firewall si sono evoluti:
- **a filtro di pacchetti**: guardano ogni pacchetto da solo, senza memoria
- **stateful**: ricordano le connessioni aperte, quindi lasciano rientrare le risposte a ciò che è uscito, e solo quelle
- **di nuova generazione** (NGFW): riconoscono anche l'applicazione (non "porta 443" ma "questo è un servizio di file sharing") e possono integrare antivirus e IPS
- **WAF** (*Web Application Firewall*): specializzato nelle richieste web, blocca per esempio SQL injection e XSS davanti a un sito

La **DMZ** (zona demilitarizzata) è una rete separata per i server raggiungibili da Internet. Se un attaccante buca il sito web, si ritrova nella DMZ, e il firewall interno gli impedisce di arrivare agli uffici. Senza DMZ, il server web compromesso sarebbe accanto ai computer della contabilità.

Il **NAT** (*Network Address Translation*) è ciò che permette a tanti computer con indirizzi privati (10.x, 192.168.x) di uscire su Internet con un unico indirizzo pubblico. Non è una protezione di per sé, ma ha un effetto collaterale utile: da fuori non si può contattare direttamente un computer interno.`,
    },
    {
      kind: 'lesson',
      title: 'Il proxy',
      body: `Un **proxy** è un intermediario: il tuo computer non contatta direttamente il sito, chiede al proxy di farlo per lui.

- **forward proxy** (quello degli uffici): sta tra gli utenti e Internet. Può bloccare categorie di siti (malware, phishing), e soprattutto **registra** chi ha visitato cosa. Ricordi il log del proxy nella missione sul phishing? Era lui
- **reverse proxy**: sta davanti ai server, dal lato opposto. Riceve le richieste da Internet e le smista ai server interni; spesso fa anche da WAF e gestisce i certificati HTTPS
- **ispezione TLS**: per vedere dentro il traffico cifrato, alcuni proxy aziendali lo decifrano e lo ricifrano. Funziona solo perché i computer aziendali si fidano del certificato del proxy, ed è un tema delicato di privacy che va dichiarato ai dipendenti

Per un analista il log del proxy è oro: dice **quale utente**, da **quale computer**, ha contattato **quale indirizzo**, e se il proxy l'ha **bloccato**.`,
    },
    {
      kind: 'task',
      title: 'Il log del proxy',
      body: `Arasaka Logistics ti ha passato il log del proxy di ieri in \`rete/difese/proxy.log\`. Ogni riga ha: data, ora, computer, utente, azione del proxy (\`ALLOW\` o \`BLOCK\`), categoria e indirizzo.

Cerca le richieste **bloccate** perché classificate come malware:

\`\`\`
grep BLOCK rete/difese/proxy.log
\`\`\`

Un computer ha provato più volte a contattare un dominio di malware. Quale? Invia il suo indirizzo IP con \`flag\`.`,
      objective: 'Quale computer ha tentato più volte di contattare un dominio di malware?',
      hints: ['Filtra anche la categoria: grep BLOCK rete/difese/proxy.log | grep malware', 'flag 10.0.3.44'],
      answer: ['10.0.3.44'],
      success: `**10.0.3.44** (utente \`r.costa\`) ha provato sei volte, a intervalli regolari, a contattare lo stesso dominio di malware. Il proxy l'ha bloccato: bene. Ma un computer che **continua** a provare da solo, con regolarità, non è una persona distratta che clicca: è un programma installato su quel computer. Il blocco ha evitato il danno, ma il computer va comunque analizzato e probabilmente ripulito.

Una regola d'oro: un blocco non chiude un caso, lo **apre**.`,
    },
    {
      kind: 'lesson',
      title: 'IDS e IPS',
      body: `Un **IDS** (*Intrusion Detection System*) osserva il traffico e **segnala** ciò che riconosce come sospetto. Un **IPS** (*Intrusion Prevention System*) fa lo stesso ma sta **in linea**, cioè il traffico gli passa attraverso, e quindi può anche **bloccare**.

- l'IDS lavora su una **copia** del traffico: se sbaglia, al massimo genera un allarme inutile
- l'IPS lavora sul traffico **vero**: se sbaglia, blocca qualcosa di legittimo (e magari ferma un servizio). Per questo le regole si provano prima in modalità IDS, e si passano in blocco solo quando sono affidabili

Si distinguono anche per **dove** guardano: **NIDS** sulla rete, **HIDS** su un singolo computer (gli EDR e Sysmon, che incontrerai nei prossimi capitoli, sono parenti stretti).

E per **come** riconoscono gli attacchi:
- **a firme** (*signature*): confrontano il traffico con descrizioni di attacchi noti. Precisi, ma ciechi davanti a ciò che non conoscono
- **ad anomalie**: imparano cos'è "normale" e segnalano ciò che se ne discosta. Vedono anche il nuovo, ma con molti più falsi allarmi

Due termini da non confondere:
- **falso positivo**: allarme su qualcosa di innocuo. Fa perdere tempo
- **falso negativo**: attacco vero che **non** genera allarme. È il più pericoloso, perché non lo vedi

Gli strumenti open source più diffusi sono **Suricata** e **Snort**; **Zeek** invece non dà allarmi ma registra in dettaglio ogni connessione, ottimo per le indagini.`,
    },
    {
      kind: 'task',
      title: 'Gli allarmi della notte',
      body: `In \`rete/difese/ids.log\` ci sono gli allarmi dell'IDS di stanotte, nel formato di Suricata. Ogni allarme ha una **priorità**: 1 è la più alta.

Quanti allarmi hanno **priorità 1**? Invia il numero con \`flag\`.`,
      objective: 'Conta gli allarmi con priorità 1.',
      hints: ['Ogni riga contiene il testo "Priority: N".', 'grep -c "Priority: 1" rete/difese/ids.log, poi flag 3'],
      answer: ['3'],
      success: `**3** allarmi di priorità massima su 14. È il primo filtro del triage: si parte da quelli, si chiudono o si aprono come incidenti, poi si scende.

Guardali uno per uno con \`grep "Priority: 1" rete/difese/ids.log\`: due riguardano lo stesso computer interno, \`10.0.3.44\`. Lo stesso del log del proxy. Due fonti diverse che indicano lo stesso computer: è così che un sospetto diventa un caso.`,
    },
    {
      kind: 'lesson',
      title: 'Leggere una regola',
      body: `Le regole di Suricata e Snort hanno sempre la stessa forma. Esempio, diverso dall'esercizio:

\`\`\`
alert tcp $HOME_NET any -> $EXTERNAL_NET 25 (msg:"Posta inviata da un PC"; sid:1000001; rev:1;)
\`\`\`

Si legge da sinistra a destra:
- \`alert\`: cosa fare. In un IPS può essere anche \`drop\` (blocca) o \`pass\` (ignora)
- \`tcp\`: il protocollo
- \`$HOME_NET any\`: da dove parte il traffico (la rete interna, qualsiasi porta)
- \`->\`: la direzione
- \`$EXTERNAL_NET 25\`: dove va (Internet, porta 25, cioè SMTP, l'invio di posta)
- tra parentesi le **opzioni**: \`msg\` è il testo dell'allarme, \`content\` è il testo da cercare dentro il pacchetto, \`sid\` è il numero che identifica la regola, \`rev\` la sua versione

Questa regola segnala un computer dell'ufficio che spedisce posta direttamente, invece di passare dal server di posta aziendale: tipico di un PC infetto usato per mandare spam.

?? Saper leggere e scrivere regole è una competenza che si chiede agli analisti SOC di secondo livello e ai *detection engineer*. Per i log dei SIEM esiste un formato simile e indipendente dal prodotto, chiamato **Sigma**.`,
    },
    {
      kind: 'task',
      title: 'La regola del collega',
      body: `Un collega ha scritto una regola per riconoscere il malware del computer \`10.0.3.44\`. È in \`rete/difese/locale.rules\`:

\`\`\`
cat rete/difese/locale.rules
\`\`\`

Su quale **porta di destinazione** fa scattare l'allarme? Invia il numero con \`flag\`.`,
      objective: 'Su quale porta di destinazione scatta la regola?',
      hints: ['La porta di destinazione è il numero subito dopo $EXTERNAL_NET, a destra della freccia.', 'flag 8443'],
      answer: ['8443'],
      success: `**8443**: la regola cerca connessioni dalla rete interna verso Internet sulla porta 8443 che contengono il testo \`/beacon?id=\`. È esattamente il comportamento del malware: un "battito" regolare verso il suo server di comando.

Nota l'azione: \`alert\`, non \`drop\`. Il collega ha fatto bene: una regola nuova si tiene in osservazione qualche giorno, per vedere se genera falsi positivi, prima di farla bloccare.`,
    },
    {
      kind: 'lesson',
      title: 'Le VPN',
      body: `Una **VPN** (*Virtual Private Network*) crea un **tunnel cifrato** attraverso una rete di cui non ti fidi (Internet, il wifi di un bar), così il traffico al suo interno non si può leggere né modificare lungo la strada.

Due usi principali in azienda:
- **accesso remoto** (*remote access*): il dipendente da casa si collega alla rete aziendale come se fosse in ufficio
- **sito-sito** (*site-to-site*): due sedi collegate in modo permanente, come se fossero un'unica rete

Termini che incontrerai:
- **IPsec**, **OpenVPN**, **WireGuard**: i protocolli più usati per costruire il tunnel
- **split tunneling**: solo il traffico verso l'azienda passa nel tunnel, il resto va su Internet direttamente. Più veloce, ma quel traffico sfugge al proxy e ai controlli aziendali
- **full tunnel**: tutto passa dall'azienda. Più lento, più controllabile

!! La VPN protegge il **tragitto**, non il computer né l'utente. Le VPN aziendali sono tra i bersagli preferiti degli attaccanti: un account VPN rubato senza MFA apre la porta a tutta la rete. Per questo vanno sempre aggiornate (nel capitolo sulla ricognizione vedrai quanto sono comuni le vulnerabilità dei dispositivi VPN) e protette con MFA.

Il modello più recente, legato all'idea di **Zero Trust**, si chiama **ZTNA** (*Zero Trust Network Access*): invece di mettere l'utente "dentro la rete", gli si dà accesso solo alle singole applicazioni che gli servono, verificando ogni volta identità e stato del dispositivo.`,
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      question: 'Un\'azienda vuole bloccare automaticamente un attacco noto appena viene riconosciuto nel traffico. Cosa le serve?',
      options: ['Un IDS, perché lavora su una copia del traffico', 'Un IPS, perché sta in linea e può scartare i pacchetti', 'Un proxy inverso', 'Uno split tunneling'],
      correct: 1,
      explain: `Solo un sistema **in linea** può bloccare: è l'IPS. L'IDS vede una copia e può solo segnalare.`,
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      question: 'Il server web dell\'azienda viene compromesso. Grazie a quale scelta di progettazione l\'attaccante NON raggiunge direttamente i computer degli uffici?',
      options: ['La VPN', 'Il server sta in una DMZ separata dalla rete interna da un firewall', 'Il NAT', 'Il proxy degli utenti'],
      correct: 1,
      explain: `La **DMZ** isola i servizi esposti a Internet: compromettere il server web non dà accesso diretto alla rete interna.`,
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      question: 'Un IDS non genera nessun allarme durante un attacco reale, perché l\'attacco usa una tecnica nuova. Come si chiama questo errore?',
      options: ['Falso positivo', 'Falso negativo', 'Vero positivo', 'Split tunneling'],
      correct: 1,
      explain: `Un attacco vero non segnalato è un **falso negativo**: il più pericoloso, perché nessuno lo vede. È il limite dei sistemi a firme davanti al nuovo.`,
    },
  ],
  recap: [
    ['firewall', 'regole dall\'alto in basso, la prima che corrisponde vince; in fondo "blocca tutto"'],
    ['stateful · NGFW · WAF', 'ricorda le connessioni · riconosce le applicazioni · protegge i siti web'],
    ['DMZ', 'rete separata per i server esposti a Internet'],
    ['NAT', 'tanti indirizzi privati escono con un indirizzo pubblico'],
    ['forward / reverse proxy', 'davanti agli utenti / davanti ai server; il log dice chi ha visitato cosa'],
    ['IDS / IPS', 'segnala su una copia / sta in linea e può bloccare'],
    ['firme / anomalie', 'attacchi noti, precisi / comportamenti insoliti, più falsi allarmi'],
    ['falso positivo / negativo', 'allarme inutile / attacco non visto'],
    ['regola Suricata', 'azione protocollo origine -> destinazione (opzioni)'],
    ['VPN', 'tunnel cifrato; accesso remoto o sito-sito; split o full tunnel; sempre con MFA'],
  ],
};
