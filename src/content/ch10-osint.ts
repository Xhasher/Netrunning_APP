import type { Chapter } from '../game/types';

export const CH10: Chapter = {
  id: 'ch10',
  code: '10',
  title: 'Ricognizione e OSINT',
  subtitle: 'Cosa sa Internet di un\'azienda, e come ridurlo',
  missions: [
    // ------------------------------------------------------------------ 10.1
    {
      id: 'ch10-m1',
      title: 'Fonti aperte',
      tagline: 'Cos\'è l\'OSINT, i suoi limiti etici e legali, e il registro dei domini.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Un incarico diverso',
          body: `@rook: Un'ottica del centro, Neon Ottica, ha letto di un'azienda simile finita nei guai per una truffa via email molto credibile. Vogliono sapere **cosa può scoprire un attaccante su di loro** senza nemmeno toccare i loro sistemi.

@nyx: Si chiama **OSINT**, *Open Source Intelligence*: raccogliere informazioni da **fonti aperte**, cioè pubbliche. Registri dei domini, DNS, siti web, documenti pubblicati, social network aziendali, offerte di lavoro...

È la prima fase di quasi ogni attacco (ricordi la **Ricognizione** della kill chain?), ed è per questo che i difensori la fanno **prima** degli attaccanti: per vedere la propria azienda con gli occhi del nemico e chiudere le falle.`,
        },
        {
          kind: 'lesson',
          title: 'Le regole',
          body: `"Pubblico" non vuol dire "tutto è permesso". Un professionista rispetta dei limiti precisi:

- lavora con un **incarico scritto** e uno scopo definito (leggi \`osint/LEGGIMI.txt\`)
- si concentra sull'**organizzazione**: domini, servizi, documenti aziendali. Non scava nella vita privata delle persone
- tratta i dati personali che incontra secondo il **GDPR**: solo quelli necessari, conservati in modo sicuro, cancellati a fine incarico
- distingue la ricognizione **passiva** (consultare fonti pubbliche, senza toccare i sistemi del bersaglio) da quella **attiva** (scansioni, richieste ai server), che richiede autorizzazione esplicita

!! Raccogliere e incrociare informazioni su una persona per molestarla, minacciarla o esporla (*doxxing*) è una violazione grave, e in Italia può essere reato (per esempio trattamento illecito di dati, stalking). L'OSINT di cui parliamo serve a **proteggere** un'organizzazione, non a sorvegliare individui.`,
        },
        {
          kind: 'task',
          title: 'Il registro dei domini',
          body: `Ogni dominio ha un record pubblico con chi l'ha registrato, quando, e i contatti tecnici. Si consulta con \`whois\`:

\`\`\`
whois neonottica.nc
\`\`\`

Quale indirizzo email tecnico è pubblico? Invialo con \`flag\`.`,
          objective: 'Consulta il whois di neonottica.nc e invia l\'email tecnica.',
          hints: ['whois neonottica.nc', 'Cerca la riga Tech Email: flag it@neonottica.nc'],
          answer: ['it@neonottica.nc'],
          success: `\`it@neonottica.nc\`: un attaccante ora sa a chi mandare un'email di phishing credibile ("Gentile reparto IT, il vostro dominio scade..."), e conosce il formato degli indirizzi aziendali.

Non è un disastro, ma è un'informazione da **sapere**. Meglio usare un indirizzo generico e dedicato per i contatti pubblici, e i registrar offrono l'oscuramento dei dati.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Durante la valutazione per Neon Ottica trovi il profilo social personale di un dipendente, con foto della sua famiglia. Cosa fai?',
          options: [
            'Lo includo nel report con tutti i dettagli',
            'Lo ignoro: è fuori scopo. Al massimo segnalo in modo generico che i dipendenti espongono informazioni aziendali sui social, senza dati personali',
            'Lo salvo per usarlo dopo',
            'Contatto il dipendente per avvisarlo',
          ],
          correct: 1,
          explain: `L'incarico riguarda l'azienda, e il GDPR impone di trattare solo i dati **necessari**. Se il rischio è reale (es. un dipendente pubblica foto del badge), lo si segnala come tema di **formazione**, in modo anonimo e generale.`,
        },
      ],
      recap: [
        ['OSINT', 'informazioni da fonti pubbliche'],
        ['ricognizione passiva / attiva', 'solo fonti pubbliche / interazione con i sistemi del bersaglio'],
        ['GDPR', 'solo dati necessari, protetti, poi cancellati'],
        ['doxxing', 'esporre dati di una persona: violazione grave, può essere reato'],
        ['whois DOMINIO', 'registrar, date, proprietario e contatti di un dominio'],
      ],
    },

    // ------------------------------------------------------------------ 10.2
    {
      id: 'ch10-m2',
      title: 'La mappa dei sottodomini',
      tagline: 'Record DNS, SPF e certificate transparency: trovare i server dimenticati.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Il DNS racconta molto',
          body: `Il DNS è pubblico per definizione: deve dire a tutto il mondo dove trovare i servizi di un dominio. Oltre al record **A** (l'IP), ci sono:
- **MX** → i server che ricevono la posta
- **NS** → i server DNS che gestiscono il dominio
- **TXT** → testi liberi, usati per esempio da:
  - **SPF**: l'elenco dei server autorizzati a **inviare** email per quel dominio. Serve contro lo *spoofing*, cioè le email false con il mittente dell'azienda
  - codici di verifica di servizi esterni (rivelano quali servizi cloud usa l'azienda)

Il comando è \`dig\`, seguito dal dominio e dal tipo di record.`,
        },
        {
          kind: 'task',
          title: 'Posta e SPF',
          body: `Guarda chi riceve la posta e quali server sono autorizzati a inviarla:

\`\`\`
dig neonottica.nc MX
dig neonottica.nc TXT
\`\`\``,
          objective: 'Interroga i record MX e TXT di neonottica.nc.',
          hints: ['dig neonottica.nc MX e poi dig neonottica.nc TXT'],
          check: (ev) => ev.type === 'command' && ev.name === 'dig-ok' && ev.args[1] === 'TXT',
          success: `Il record SPF finisce con \`-all\`: "rifiuta qualsiasi server non elencato". È la configurazione **corretta**. Se ci fosse \`+all\` ("accetta tutti") o mancasse del tutto, chiunque potrebbe mandare email che sembrano davvero di Neon Ottica.

?? SPF lavora insieme a **DKIM** (firma digitale delle email) e **DMARC** (cosa fare con le email che falliscono i controlli). Insieme sono la difesa base contro lo spoofing del mittente.`,
        },
        {
          kind: 'lesson',
          title: 'Certificate transparency',
          body: `Ogni volta che un'autorità rilascia un certificato HTTPS, lo deve registrare in **log pubblici** chiamati *certificate transparency*. L'obiettivo è nobile: accorgersi se qualcuno ottiene un certificato falso per il tuo dominio.

L'effetto collaterale: chiunque può cercare **tutti i nomi** per cui un'azienda ha mai chiesto un certificato. Compresi i server di test, quelli interni esposti per errore e quelli **dimenticati**. Il sito più usato per cercarli è **crt.sh**; nel deck c'è il comando \`crtsh\` che lo simula.`,
        },
        {
          kind: 'task',
          title: 'Il server dimenticato',
          body: `Cerca i certificati di Neon Ottica:

\`\`\`
crtsh neonottica.nc
\`\`\`

Uno dei sottodomini ha un nome sospetto e un certificato vecchio di anni: probabilmente nessuno se ne ricorda più. Quale? Invialo con \`flag\`.

Puoi controllare che esista ancora con \`dig NOME A\`.`,
          objective: 'Trova il sottodominio dimenticato e invialo.',
          hints: ['crtsh neonottica.nc', 'Guarda le date: uno è del 2074 e ha "old" nel nome. flag dev-old.neonottica.nc'],
          answer: ['dev-old.neonottica.nc'],
          success: `\`dev-old.neonottica.nc\`: un vecchio server di sviluppo, certificato del 2074, e ha ancora un IP. I server dimenticati sono un bersaglio ideale: nessuno li aggiorna, nessuno li sorveglia.

Questo fenomeno si chiama **shadow IT**, e controllare continuamente la propria **superficie d'attacco** (tutto ciò che è esposto) è un lavoro a sé: *Attack Surface Management*.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Il record TXT di un dominio è `v=spf1 +all`. Che rischio comporta?',
          options: [
            'Nessuno, è la configurazione consigliata',
            'Qualsiasi server al mondo è autorizzato a inviare email a nome del dominio: lo spoofing del mittente diventa facile',
            'Il sito web non funziona',
            'Le email in arrivo vengono bloccate',
          ],
          correct: 1,
          explain: `\`+all\` vuol dire "tutti sono autorizzati": SPF diventa inutile. La configurazione corretta elenca i server autorizzati e termina con \`-all\` (o \`~all\` durante i test).`,
        },
      ],
      recap: [
        ['dig DOMINIO TIPO', 'interroga il DNS: A, MX, TXT, NS'],
        ['SPF', 'record TXT con i server autorizzati a inviare email; -all = rifiuta gli altri'],
        ['DKIM / DMARC', 'firma delle email / politica sui controlli falliti'],
        ['certificate transparency', 'log pubblici di tutti i certificati HTTPS'],
        ['crt.sh', 'ricerca dei certificati: rivela i sottodomini'],
        ['shadow IT', 'sistemi dimenticati o non gestiti'],
        ['superficie d\'attacco', 'tutto ciò che un\'azienda espone'],
      ],
    },

    // ------------------------------------------------------------------ 10.3
    {
      id: 'ch10-m3',
      title: 'Documenti che parlano',
      tagline: 'Metadati nei file pubblicati e il rischio delle informazioni sparse.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'I metadati',
          body: `Ogni documento contiene, oltre al testo, dei **metadati**: dati sul file stesso. Autore, software usato, date di creazione, a volte il percorso del server da cui è stato creato. Le foto possono contenere il modello del telefono e perfino le **coordinate GPS**.

Quando un'azienda pubblica cataloghi, listini o bilanci sul sito, spesso nessuno pensa a ripulirli. Lo strumento classico per leggerli è \`exiftool\`.`,
        },
        {
          kind: 'task',
          title: 'Il catalogo',
          body: `Neon Ottica pubblica il catalogo in PDF sul sito. Ne hai una copia in \`osint/catalogo_2077.pdf\`. Leggi i suoi metadati:

\`\`\`
exiftool osint/catalogo_2077.pdf
\`\`\`

Il campo \`Template\` contiene un percorso di rete interno. Qual è il nome del **server interno** dei file? Invialo con \`flag\`.`,
          objective: 'Leggi i metadati del catalogo e invia il nome del server interno.',
          hints: ['exiftool osint/catalogo_2077.pdf', 'Il percorso è \\\\srv-file01\\marketing\\...: flag srv-file01'],
          answer: ['srv-file01', '\\\\srv-file01'],
          success: `Da un catalogo pubblicitario hai ricavato:
- **srv-file01**: il nome di un server interno
- **m.ferri**: il formato dei nomi utente (iniziale.cognome)
- **Word 2016**: la versione del software usato in ufficio

Presi da soli sembrano dettagli. Insieme, permettono di scrivere un'email di phishing molto credibile ("Ciao, il modello su srv-file01 non si apre...") e di indovinare gli account per uno spraying.

La correzione è semplice: **ripulire i metadati** prima di pubblicare (molti programmi hanno l'opzione "rimuovi informazioni personali").`,
        },
        {
          kind: 'lesson',
          title: 'Il mosaico',
          body: `La lezione più importante dell'OSINT è l'**effetto mosaico**: informazioni innocue, messe insieme, diventano pericolose.

- un'offerta di lavoro che chiede "esperienza con FortiVPN" rivela quale VPN usa l'azienda
- un post aziendale con la foto dell'ufficio mostra un post-it sul monitor
- il formato delle email più l'organigramma sul sito danno la lista di tutti gli indirizzi

Le difese non sono tecniche ma di **processo**:
- una revisione di sicurezza di ciò che si pubblica
- la **formazione** dei dipendenti (*security awareness*)
- controlli periodici OSINT sulla propria azienda, come quello che stai facendo`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Perché il formato degli indirizzi email (es. nome.cognome@azienda) è un\'informazione utile a un attaccante?',
          options: [
            'Non è utile a nulla',
            'Permette di costruire la lista degli indirizzi dei dipendenti per phishing e password spraying',
            'Permette di leggere le email',
            'Permette di cambiare le password',
          ],
          correct: 1,
          explain: `Con il formato e qualche nome (dal sito, dai comunicati...) si ricostruiscono decine di indirizzi validi. È il primo passo per campagne di phishing mirate e per lo spraying che hai rilevato nel capitolo 08. La difesa vera resta l'MFA e la formazione.`,
        },
      ],
      recap: [
        ['metadati', 'autore, software, date, percorsi, GPS nascosti nei file'],
        ['exiftool FILE', 'legge i metadati'],
        ['effetto mosaico', 'dettagli innocui che insieme diventano pericolosi'],
        ['security awareness', 'formazione dei dipendenti sui rischi'],
        ['ripulire prima di pubblicare', 'la difesa contro la fuga di metadati'],
      ],
    },

    // ------------------------------------------------------------------ 10.4
    {
      id: 'ch10-m4',
      title: 'Vulnerabilità note',
      tagline: 'CVE, CVSS e come decidere cosa aggiornare per primo.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'CVE e CVSS',
          body: `Quando qualcuno scopre una vulnerabilità in un software diffuso, le viene assegnato un identificativo pubblico: la **CVE** (*Common Vulnerabilities and Exposures*), per esempio \`CVE-2021-44228\`. Così tutti parlano dello stesso problema.

A ogni CVE si associa un punteggio **CVSS** da 0 a 10 che ne misura la gravità:

\`\`\`
0.1 - 3.9  BASSA
4.0 - 6.9  MEDIA
7.0 - 8.9  ALTA
9.0 - 10   CRITICA
\`\`\`

Il CVSS considera per esempio: si può sfruttare **da remoto**? Serve un **account**? Serve un'**azione dell'utente**? Cosa si ottiene (lettura di dati, controllo totale)?

Il database pubblico di riferimento è il **NVD** del NIST. In più, l'agenzia americana CISA mantiene la lista **KEV** (*Known Exploited Vulnerabilities*): le CVE che gli attaccanti **stanno già sfruttando** davvero.`,
        },
        {
          kind: 'task',
          title: 'Cosa espone Neon Ottica',
          body: `Neon Ottica ti ha autorizzato anche a una scansione dei servizi esposti. I risultati sono in \`osint/servizi.txt\`. Leggili:

\`\`\`
cat osint/servizi.txt
\`\`\`

Poi controlla ogni software nel database delle vulnerabilità con \`cve PRODOTTO VERSIONE\`, per esempio:

\`\`\`
cve fortivpn 7.0.1
\`\`\``,
          objective: 'Controlla le vulnerabilità dei servizi esposti con cve.',
          hints: ['cat osint/servizi.txt, poi un comando cve per ogni riga: cve apache 2.4.57, cve roundcube 1.6.2, cve fortivpn 7.0.1, cve wordpress 5.2.4'],
          check: (ev) => ev.type === 'command' && ev.name === 'cve-ok' && ev.args[1] !== '',
          success: `Prova tutte e quattro le righe se non l'hai già fatto: alcune versioni sono aggiornate, altre no. Ora la domanda vera di ogni difensore: **da dove comincio?**`,
        },
        {
          kind: 'task',
          title: 'La priorità',
          body: `Le risorse sono sempre limitate: bisogna decidere **cosa correggere per primo**. Il criterio base è il punteggio CVSS più alto, pesato con quanto è esposto il sistema e se la falla viene già sfruttata.

Quale **sottodominio** va sistemato per primo? Invialo con \`flag\`.`,
          objective: 'Invia il sottodominio da correggere per primo.',
          hints: [
            'Confronta i CVSS trovati: il più alto è sopra 9.5.',
            'WordPress 5.2.4 ha una CVE con CVSS 9.8, ed è sul server dimenticato: flag dev-old.neonottica.nc',
          ],
          answer: ['dev-old.neonottica.nc', 'dev-old', 'wordpress'],
          success: `**dev-old.neonottica.nc**: WordPress 5.2.4 con una falla **critica (9.8)** che permette di eseguire codice senza autenticazione, su un server che nessuno sorveglia. La correzione migliore non è aggiornarlo: è **spegnerlo**, visto che non serve più.

Subito dopo viene la **VPN** (9.6): un server di accesso remoto vulnerabile è una porta d'ingresso diretta nella rete aziendale. Apache e Roundcube invece risultano già aggiornati.

!! In un'azienda vera questa analisi diventa un processo continuo: **vulnerability management**. Scansioni periodiche, priorità, aggiornamenti, verifica.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica finale',
          question: 'Hai due vulnerabilità: A con CVSS 9.1 su un server interno spento da mesi, B con CVSS 8.1 sulla VPN esposta a Internet e presente nella lista KEV. Quale correggi per prima?',
          options: [
            'A, perché ha il CVSS più alto',
            'B: è esposta a Internet e gli attaccanti la stanno già sfruttando',
            'Nessuna delle due',
            'Entrambe insieme, anche se non ci sono risorse',
          ],
          correct: 1,
          explain: `Il CVSS misura la gravità **teorica**. La priorità reale dipende anche dal **contesto**: esposizione, valore del sistema e sfruttamento attivo (KEV). Una falla "solo" alta, sfruttata ogni giorno, su un sistema esposto, è più urgente di una critica su un server spento.`,
        },
      ],
      recap: [
        ['CVE', 'identificativo pubblico di una vulnerabilità'],
        ['CVSS', 'gravità da 0 a 10: bassa, media, alta, critica'],
        ['NVD', 'database pubblico delle vulnerabilità (NIST)'],
        ['KEV', 'lista CISA delle vulnerabilità già sfruttate'],
        ['cve PRODOTTO VERSIONE', 'cerca vulnerabilità note (simulato)'],
        ['priorità', 'CVSS + esposizione + sfruttamento attivo'],
        ['vulnerability management', 'scansione, priorità, correzione, verifica, in ciclo'],
      ],
    },
  ],
};
