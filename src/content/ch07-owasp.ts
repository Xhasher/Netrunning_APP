import type { Mission } from '../game/types';

// Capitolo 07, seconda parte: la OWASP Top 10 e un audit pratico di un negozio online.
// Tutto avviene su un sito simulato e dentro un contratto firmato: si osserva e si documenta,
// non si sfrutta.

const httpTo = (needle: string) => (ev: { type: string; path?: string; host?: string }) =>
  ev.type === 'http' && (ev.host ?? '').startsWith('negozio') && (ev.path ?? '').includes(needle);

export const OWASP_MISSIONS: Mission[] = [
  // ------------------------------------------------------------------ 7.4
  {
    id: 'ch07-m4',
    title: 'La Top 10',
    tagline: 'Le dieci famiglie di problemi delle applicazioni web, come si riconoscono e come si curano.',
    xp: 250,
    steps: [
      {
        kind: 'lesson',
        title: 'Una lingua comune',
        body: `@rook: Domani ti mando a controllare un negozio online. Il titolare ha letto da qualche parte "OWASP" e vuole un report "secondo la Top 10". Prima di andare, impara di cosa parla.

**OWASP** (*Open Worldwide Application Security Project*) è una comunità senza scopo di lucro che pubblica guide gratuite sulla sicurezza del software. Il suo documento più famoso è la **OWASP Top 10**: le dieci categorie di rischio più importanti per le applicazioni web, aggiornata ogni qualche anno con i dati di migliaia di applicazioni reali.

Serve a dare a tutti la stessa lingua. Quando in un report scrivi "A01 · Broken Access Control", sviluppatori, manager e revisori capiscono subito di che famiglia di problema si tratta e quanto è comune.

Le categorie si scrivono con una sigla: **A** più il numero in classifica. Qui usiamo l'edizione **2021**, la più citata negli annunci di lavoro e nei corsi.

?? Non è un elenco di attacchi ma di **debolezze**. Ogni voce raccoglie decine di problemi specifici (catalogati come *CWE*), con la loro causa e la loro cura.`,
      },
      {
        kind: 'lesson',
        title: 'A01 - A03',
        body: `**A01 · Broken Access Control** (controllo degli accessi difettoso). Al primo posto. L'applicazione non controlla bene **chi può fare cosa**.
- esempio: cambi il numero nell'indirizzo \`/fattura?id=500\` in \`id=501\` e vedi la fattura di un altro cliente. Si chiama **IDOR** (*Insecure Direct Object Reference*)
- esempio: un utente normale apre \`/admin\` e il pannello si carica
- cura: ogni richiesta controlla **sul server** che l'utente abbia diritto a **quella** risorsa. Negare per impostazione predefinita

**A02 · Cryptographic Failures** (errori di crittografia). Dati sensibili non protetti come dovrebbero.
- esempio: sito senza HTTPS, password conservate in chiaro o con MD5, dati sensibili nell'URL (finiscono nei log)
- cura: HTTPS ovunque, algoritmi moderni, password con funzioni lente fatte apposta (bcrypt, Argon2), mai dati segreti nell'indirizzo

**A03 · Injection**. Dati dell'utente trattati come comandi. Comprende la **SQL injection** che hai visto nei log e il **Cross-Site Scripting** (XSS).
- cura: query parametrizzate, validare l'input, codificare l'output (mai incollare testo dell'utente in una pagina così com'è)`,
      },
      {
        kind: 'lesson',
        title: 'A04 - A07',
        body: `**A04 · Insecure Design** (progettazione insicura). Il problema non è un errore di programmazione ma l'idea stessa.
- esempio: il recupero password chiede "colore preferito"; un buono sconto si può usare infinite volte perché nessuno ha previsto un limite
- cura: pensare agli abusi **mentre si progetta** (*threat modeling*), non dopo

**A05 · Security Misconfiguration** (configurazione sbagliata).
- esempio: elenco dei file della cartella visibile, pagine di errore con i dettagli tecnici, account di prova lasciati attivi, file di backup raggiungibili dal web, intestazioni di sicurezza mancanti
- cura: configurazioni standard rinforzate, ambienti di test separati, controlli automatici

**A06 · Vulnerable and Outdated Components** (componenti vulnerabili o obsoleti).
- esempio: un server con una versione di PHP o di una libreria non più supportata, con vulnerabilità note pubblicate
- cura: inventario di cosa si usa e in che versione, aggiornamenti regolari, togliere ciò che non serve

**A07 · Identification and Authentication Failures** (autenticazione difettosa).
- esempio: nessun limite ai tentativi di login, password deboli accettate, sessione che non scade mai, nessuna MFA per gli amministratori
- cura: limiti e blocchi ai tentativi, MFA, sessioni che scadono, cookie protetti`,
      },
      {
        kind: 'lesson',
        title: 'A08 - A10',
        body: `**A08 · Software and Data Integrity Failures** (integrità del software e dei dati).
- esempio: l'applicazione scarica aggiornamenti senza verificarne la firma; una pipeline di sviluppo che accetta codice da chiunque
- cura: firme e impronte verificate (ricordi \`sha256sum\`?), dipendenze da fonti fidate

**A09 · Security Logging and Monitoring Failures** (log e monitoraggio insufficienti).
- esempio: i login falliti non vengono registrati; i log ci sono ma nessuno li guarda; l'attacco viene scoperto dopo mesi, da un giornalista
- cura: registrare gli eventi importanti, inviarli a un SIEM, allarmi su ciò che conta. È il lavoro del SOC

**A10 · Server-Side Request Forgery** (SSRF). L'applicazione scarica un indirizzo scelto dall'utente (per un'anteprima, un'immagine) e qualcuno le fa scaricare indirizzi **interni**.
- esempio: \`/anteprima?url=http://169.254.169.254/\` fa leggere al server i dati riservati del cloud su cui gira
- cura: elenco chiuso di destinazioni ammesse, blocco degli indirizzi interni

!! Conoscere la Top 10 serve a **trovare e far correggere** questi problemi, in un lavoro autorizzato. Per esercitarti sul serio esistono laboratori costruiti apposta, come la PortSwigger Web Security Academy (gratuita) e OWASP Juice Shop.`,
      },
      {
        kind: 'quiz',
        title: 'Classifica',
        question: 'Un utente scopre che cambiando `/profilo?id=88` in `/profilo?id=89` vede i dati di un altro utente. Quale categoria?',
        options: ['A03 · Injection', 'A01 · Broken Access Control', 'A05 · Security Misconfiguration', 'A07 · Authentication Failures'],
        correct: 1,
        explain: `È un **IDOR**, il caso più classico di **A01**: l'utente è autenticato correttamente, ma il server non controlla che il profilo 89 sia suo.`,
      },
      {
        kind: 'quiz',
        title: 'Classifica',
        question: 'Il sito gira su una versione di WordPress di cinque anni fa, con dieci CVE pubbliche. Quale categoria?',
        options: ['A06 · Vulnerable and Outdated Components', 'A04 · Insecure Design', 'A09 · Logging Failures', 'A02 · Cryptographic Failures'],
        correct: 0,
        explain: `Componenti non aggiornati con vulnerabilità note: **A06**. La cura è un inventario delle versioni e un piano di aggiornamento.`,
      },
      {
        kind: 'quiz',
        title: 'Classifica',
        question: 'Dopo un attacco si scopre che il sito non registrava né i login falliti né le modifiche degli amministratori. Quale categoria?',
        options: ['A01 · Broken Access Control', 'A08 · Integrity Failures', 'A09 · Logging and Monitoring Failures', 'A10 · SSRF'],
        correct: 2,
        explain: `Senza log non si può né rilevare l'attacco né ricostruirlo: **A09**.`,
      },
      {
        kind: 'quiz',
        title: 'Classifica',
        question: 'Il recupero password di un sito chiede solo "in che città sei nato?", un\'informazione che si trova sui social. Quale categoria descrive meglio il problema di fondo?',
        options: ['A03 · Injection', 'A04 · Insecure Design', 'A06 · Outdated Components', 'A10 · SSRF'],
        correct: 1,
        explain: `Il codice può essere scritto benissimo: è **l'idea** a essere debole. **A04 · Insecure Design**. (Si può anche leggere come A07, ma la radice è nella progettazione.)`,
      },
    ],
    recap: [
      ['OWASP Top 10', 'le dieci categorie di rischio più importanti delle applicazioni web'],
      ['A01 Broken Access Control', 'IDOR, pannelli non protetti: controlla i diritti sul server'],
      ['A02 Cryptographic Failures', 'niente HTTPS, password deboli o in chiaro, dati sensibili nell\'URL'],
      ['A03 Injection', 'SQL injection, XSS: query parametrizzate, output codificato'],
      ['A04 Insecure Design', 'il difetto è nel progetto, non nel codice'],
      ['A05 Security Misconfiguration', 'backup esposti, errori verbosi, header mancanti'],
      ['A06 Outdated Components', 'versioni vecchie con vulnerabilità note'],
      ['A07 Authentication Failures', 'nessun limite ai tentativi, niente MFA, sessioni eterne'],
      ['A08 Integrity Failures', 'aggiornamenti e dati non verificati'],
      ['A09 Logging Failures', 'nessun log, o log che nessuno guarda'],
      ['A10 SSRF', 'il server scarica indirizzi interni scelti dall\'utente'],
    ],
  },

  // ------------------------------------------------------------------ 7.5
  {
    id: 'ch07-m5',
    title: 'Il negozio di Judy',
    tagline: 'Audit autorizzato di un negozio online: trovare, classificare e documentare.',
    xp: 350,
    steps: [
      {
        kind: 'lesson',
        title: 'Il contratto',
        body: `@rook: Judy ha aperto un negozio online di braindance. Un cliente le ha scritto: "ho visto l'ordine di un altro". Vuole sapere cos'altro non va prima che lo scopra qualcun altro. Il contratto è firmato, il perimetro è in \`web/negozio-contratto.txt\`.

@nyx: Regola d'oro per un audit web: **osservi e documenti, non sfrutti**. Quando trovi un problema lo dimostri con il minimo indispensabile (una richiesta, uno screenshot), lo classifichi e passi oltre. Non scarichi i dati dei clienti per "vedere quanto è grave".

Leggi il contratto prima di toccare qualsiasi cosa.`,
      },
      {
        kind: 'task',
        title: 'Il tuo ordine',
        body: `Judy ti ha creato un account di prova, con un ordine già fatto: il numero è scritto nel contratto. Aprilo con \`curl\`:

\`\`\`
curl "http://negozio.lan/ordine.php?id=1041"
\`\`\`

?? Le virgolette servono perché \`?\` per la shell è un carattere jolly: così l'indirizzo arriva a \`curl\` esattamente come l'hai scritto.`,
        objective: 'Apri il tuo ordine di prova (numero 1041).',
        hints: ['Il numero dell\'ordine è nel contratto: cat web/negozio-contratto.txt', 'curl "http://negozio.lan/ordine.php?id=1041"'],
        check: httpTo('id=1041'),
        success: `È il tuo ordine di prova, con i dati dell'account del contratto. Nota come l'ordine è identificato: un **numero progressivo** nell'indirizzo. Cosa succede se lo cambi?`,
      },
      {
        kind: 'task',
        title: 'Un numero in più',
        body: `Prova a chiedere l'ordine successivo, il **1042**. Il contratto lo autorizza esplicitamente, per **una sola** richiesta di verifica.`,
        objective: 'Verifica se puoi vedere l\'ordine 1042.',
        hints: ['Lo stesso comando di prima, con un numero diverso.', 'curl "http://negozio.lan/ordine.php?id=1042"'],
        check: httpTo('id=1042'),
        success: `Nome, indirizzo e parte della carta di un'altra cliente. Il server ti ha riconosciuto come utente di prova e ti ha dato comunque l'ordine di qualcun altro: **non controlla a chi appartiene**.

È esattamente ciò che il cliente aveva segnalato. E qui ti fermi: una richiesta basta a dimostrare il problema. Provare tutti i numeri da 1 a 5000 vorrebbe dire scaricare i dati di migliaia di persone, cioè **creare** una violazione di dati invece di documentarla.`,
      },
      {
        kind: 'task',
        title: 'Dagli un nome',
        body: `Nel report ogni problema va classificato. A quale categoria della OWASP Top 10 appartiene quello che hai appena trovato? Invia la sigla (per esempio \`flag A07\`).`,
        objective: 'Classifica il problema degli ordini.',
        hints: ['È un IDOR: il server non controlla chi può accedere a cosa.', 'flag A01'],
        answer: ['A01', 'A01:2021', 'broken access control'],
        success: `**A01 · Broken Access Control**. Nel report scriverai: cosa hai fatto (una richiesta all'ordine 1042 con l'utente di prova), cosa hai ottenuto (dati di un'altra cliente), perché succede (nessun controllo di proprietà sul server) e come si corregge (ogni richiesta verifica che l'ordine appartenga all'utente collegato; in più, identificativi non prevedibili).`,
      },
      {
        kind: 'task',
        title: 'Le intestazioni',
        body: `Ora guarda solo le **intestazioni** della risposta, senza la pagina:

\`\`\`
curl -I http://negozio.lan/
\`\`\`

Una riga rivela il linguaggio usato dal sito e la sua versione. Che versione di PHP usa il negozio? Inviala con \`flag\`.`,
        objective: 'Quale versione di PHP rivelano le intestazioni?',
        hints: ['Cerca la riga X-Powered-By.', 'flag 5.6.40'],
        answer: ['5.6.40', 'php/5.6.40', 'php 5.6.40'],
        success: `**PHP 5.6.40**: il supporto di PHP 5.6 è finito nel 2018. Da allora le vulnerabilità scoperte non vengono più corrette: è **A06 · Vulnerable and Outdated Components**.

Le stesse intestazioni rivelano altri due problemi, da **A05 · Security Misconfiguration**:
- il server **annuncia** versioni esatte (\`Server\`, \`X-Powered-By\`): regala a chiunque la lista delle vulnerabilità da provare
- mancano le intestazioni di sicurezza (\`Strict-Transport-Security\`, \`Content-Security-Policy\`), e il cookie di sessione non ha i flag \`Secure\` e \`HttpOnly\`, che impediscono di inviarlo in chiaro e di leggerlo da uno script`,
      },
      {
        kind: 'task',
        title: 'Il file dimenticato',
        body: `Nel contratto Judy ammette che lo sviluppatore "fa una copia dei file prima di modificarli". Le copie di solito si chiamano come l'originale più \`.bak\`, \`.old\` o \`~\`. La configurazione di un sito PHP si chiama spesso \`config.php\`.

Il file \`config.php\` non si vede: il server lo esegue. Ma la sua copia di backup? Provala:

\`\`\`
curl http://negozio.lan/config.php.bak
\`\`\`

Quale **utente del database** compare nel file? Invialo con \`flag\`.`,
        objective: 'Trova l\'utente del database nel file di backup.',
        hints: ['curl http://negozio.lan/config.php.bak', 'Cerca la riga DB_USER: flag shop_admin'],
        answer: ['shop_admin'],
        success: `Utente e password del database, leggibili da chiunque. Il server **esegue** i file \`.php\`, ma un file \`.bak\` per lui è testo qualsiasi e lo consegna così com'è.

È **A05 · Security Misconfiguration**. Le cure: niente copie di lavoro sul server di produzione; il server deve rifiutare le estensioni di backup; e la password del database va **cambiata subito**, perché va considerata già compromessa. Nel report un problema così va segnalato **immediatamente**, non a fine lavoro.`,
      },
      {
        kind: 'task',
        title: 'Il log racconta il resto',
        body: `Judy ti ha passato anche il log del suo server, \`web/negozio.log\`. Il negozio ha una funzione "anteprima" che scarica una pagina indicata nel parametro \`url=\`. Guarda quali indirizzi le hanno chiesto di scaricare:

\`\`\`
grep "url=" web/negozio.log
\`\`\`

Uno di quegli indirizzi non è un sito Internet ma un indirizzo **interno** speciale, quello dei metadati del cloud. Quale? Invia l'indirizzo IP con \`flag\`.`,
        objective: 'Quale indirizzo interno è stato chiesto alla funzione anteprima?',
        hints: ['Cerca un IP che inizia con 169.254.', 'flag 169.254.169.254'],
        answer: ['169.254.169.254'],
        success: `**169.254.169.254** è l'indirizzo dei **metadati** nei grandi cloud: da lì una macchina può leggere informazioni su sé stessa, a volte anche credenziali temporanee. Qualcuno ha chiesto al server di Judy di scaricarlo per lui: è un tentativo di **A10 · SSRF**. Lo stesso IP ha provato anche \`localhost\`.

La cura: la funzione anteprima deve accettare solo destinazioni esterne e bloccare gli indirizzi interni e speciali.`,
      },
      {
        kind: 'task',
        title: 'Password di passaggio',
        body: `Nello stesso log cerca le richieste alla pagina di login:

\`\`\`
grep "login.php" web/negozio.log
\`\`\`

C'è qualcosa che in un log non dovrebbe **mai** comparire. Di quale utente si legge la password? Invia il nome utente con \`flag\`.`,
        objective: 'Di quale utente la password è finita nel log?',
        hints: ['Il modulo di login usa GET: i dati finiscono nell\'indirizzo, e l\'indirizzo finisce nel log.', 'flag judy'],
        answer: ['judy'],
        success: `Il modulo di login invia i dati con il metodo **GET**, cioè dentro l'indirizzo: \`login.php?user=judy&pass=...\`. E l'indirizzo finisce nel log del server, nella cronologia del browser, nei log di eventuali proxy. In più il sito non usa HTTPS, quindi la password viaggia in chiaro.

È **A02 · Cryptographic Failures** (dati sensibili esposti e non cifrati). La cura: login con **POST** e solo su **HTTPS**. E dato che quella password ora è in un file di log, va cambiata.

Guarda anche quante volte \`203.0.113.9\` ha provato il login in pochi secondi senza mai essere bloccato: è **A07**, nessun limite ai tentativi.`,
      },
      {
        kind: 'lesson',
        title: 'Il report',
        body: `@nyx: Hai trovato sei problemi in un'ora, senza scaricare un solo dato in più del necessario. Ora la parte che il cliente leggerà davvero.

Ogni problema nel report ha sempre gli stessi campi:
- **titolo** e **categoria** (es. "Ordini di altri clienti visibili · A01")
- **gravità** (critica, alta, media, bassa), motivata
- **descrizione**: cosa hai fatto e cosa hai osservato, in modo che chiunque possa ripeterlo
- **impatto**: cosa potrebbe succedere, in parole che capisce anche chi non è tecnico
- **raccomandazione**: come si corregge, in concreto

Per il negozio di Judy l'ordine di priorità è chiaro:
- **subito**: password del database esposta (cambiarla, togliere il file), ordini visibili (dati di carte e indirizzi)
- **a breve**: HTTPS e login con POST, limite ai tentativi di login, blocco dell'SSRF
- **pianificato**: aggiornamento di PHP, intestazioni di sicurezza, rimuovere le versioni dalle intestazioni

?? Il problema da riferire **subito**, anche a metà lavoro, è quello che espone dati reali o credenziali. Il contratto dice sempre chi chiamare in quel caso.`,
      },
      {
        kind: 'quiz',
        title: 'Verifica finale',
        question: 'Durante un audit autorizzato trovi un IDOR che mostra gli ordini degli altri clienti. Qual è il comportamento corretto?',
        options: [
          'Scaricare tutti gli ordini per stimare quanti clienti sono coinvolti',
          'Fare una sola richiesta di verifica, documentarla e segnalarla subito',
          'Non segnalarlo: era fuori dalle cose che il cliente aveva chiesto',
          'Pubblicarlo per mettere pressione al cliente',
        ],
        correct: 1,
        explain: `Si dimostra con il minimo indispensabile, si documenta e, visto che riguarda dati personali, si segnala **subito** al referente indicato nel contratto. Stimare il numero di clienti coinvolti è compito del cliente, guardando i suoi dati, non tuo scaricandoli.`,
      },
    ],
    recap: [
      ['curl "URL?id=..."', 'virgolette: ? e & sono speciali per la shell'],
      ['curl -I', 'solo le intestazioni della risposta'],
      ['IDOR (A01)', 'cambi un numero e vedi i dati di altri'],
      ['X-Powered-By / Server', 'versioni esposte: A05, e se vecchie A06'],
      ['file .bak', 'copie di backup consegnate come testo: A05'],
      ['url= verso 169.254.169.254', 'tentativo di SSRF (A10)'],
      ['password nell\'URL', 'login con GET e senza HTTPS: A02'],
      ['report', 'titolo, categoria, gravità, descrizione, impatto, raccomandazione'],
    ],
  },
];

export const PHISHING_MISSION: Mission = {
  id: 'ch08-m4',
  title: 'Anatomia di un phishing',
  tagline: 'Leggere le intestazioni di un\'email, SPF/DKIM/DMARC, link ingannevoli e cosa fare dopo.',
  xp: 300,
  steps: [
    {
      kind: 'lesson',
      title: 'Il pulsante "Segnala"',
      body: `@nyx: Turno al SOC di Arasaka Logistics. Una dipendente dell'amministrazione ha premuto "Segnala phishing" su un'email. È il pane quotidiano di un analista di primo livello: decine al giorno. Devi dire se è vera o falsa, e se è falsa capire **quanto è grave** e **chi altro l'ha ricevuta**.

La segnalazione è in \`posta/segnalazione.txt\`, l'email originale (con tutte le intestazioni) in \`posta/fattura.eml\`.

Un'email ha due parti:
- le **intestazioni** (*header*): righe \`Nome: valore\` in cima, che raccontano chi l'ha spedita, da dove è passata e quali controlli ha superato. Il programma di posta ne mostra pochissime
- il **corpo**: il testo che vedi, con link e allegati

!! L'email sospetta si analizza **come testo**, mai aprendola o cliccando. Un link si legge, non si visita; un allegato si calcola l'impronta, non si apre.`,
    },
    {
      kind: 'task',
      title: 'Leggi tutto',
      body: `Leggi prima la segnalazione e poi l'email completa:

\`\`\`
cat posta/segnalazione.txt
cat posta/fattura.eml
\`\`\``,
      objective: 'Leggi l\'email sospetta completa.',
      hints: ['cat posta/fattura.eml'],
      check: (ev) => ev.type === 'read' && ev.path.endsWith('posta/fattura.eml'),
      success: `Urgenza ("entro 24 ore"), minaccia ("sospensione del servizio"), un link per "regolarizzare". Sono i segnali classici, ma non bastano: un analista porta **prove**. Andiamo a cercarle nelle intestazioni.`,
    },
    {
      kind: 'lesson',
      title: 'Le intestazioni che contano',
      body: `Le intestazioni da guardare, nell'ordine:

**From**: il mittente che vedi. Si può scrivere qualsiasi cosa, come il mittente su una busta di carta. Non prova niente.

**Return-Path**: dove tornano i messaggi di errore. Se il dominio è diverso dal From, è un primo campanello.

**Reply-To**: dove va la tua risposta se premi "Rispondi". Un Reply-To verso un indirizzo gratuito o sconosciuto, diverso dal From, è tipico delle truffe sui pagamenti: tu credi di rispondere all'azienda, e invece scrivi al truffatore.

**Received**: ogni server che ha passato l'email aggiunge una riga **in cima**. Si leggono **dal basso verso l'alto**: l'ultima riga è il primo server, quello da cui l'email è partita, con il suo indirizzo IP.

**Authentication-Results**: il verdetto dei controlli fatti dal tuo server di posta:
- **SPF**: l'IP che ha spedito è tra quelli autorizzati dal dominio? (\`pass\` o \`fail\`)
- **DKIM**: l'email ha una firma digitale valida del dominio? (\`pass\`, \`fail\`, \`none\` se manca)
- **DMARC**: il dominio del From è allineato con SPF o DKIM, e cosa chiede di fare il dominio se non lo è?

Esempio, diverso dal tuo caso: un'email che dice di arrivare da \`banca.nc\` ma ha \`spf=fail\` e \`dkim=none\` **non** è stata spedita dai server della banca, qualunque cosa dica il From.

?? Un \`pass\` non significa "email sicura": significa solo che il dominio è autentico. Un truffatore può comprare \`banca-sicura.nc\`, configurare tutto bene e ottenere tre \`pass\`. Per questo si guarda sempre **quale** dominio ha superato i controlli.`,
    },
    {
      kind: 'task',
      title: 'Da dove viene?',
      body: `Trova la riga \`Received\` più in basso (il primo server) e il suo indirizzo IP:

\`\`\`
grep "Received" posta/fattura.eml
\`\`\`

Invia l'IP del server che ha spedito l'email.`,
      objective: 'Qual è l\'IP del primo server?',
      hints: ['L\'ultima riga Received è la prima in ordine di tempo.', 'flag 203.0.113.88'],
      answer: ['203.0.113.88'],
      success: `**203.0.113.88**, un server di \`arasaka-pagamenti.nc\`: un dominio che **somiglia** a quello dell'azienda, ma non è suo. È il primo **indicatore di compromissione** (IOC) da annotare.`,
    },
    {
      kind: 'task',
      title: 'Il verdetto dei controlli',
      body: `Ora guarda il risultato dei controlli:

\`\`\`
grep -i "authentication-results" -A 2 posta/fattura.eml
\`\`\`

Qual è il risultato di **SPF**? Invialo con \`flag\`.`,
      objective: 'Qual è il risultato di SPF?',
      hints: ['Cerca spf= nella riga.', 'flag fail'],
      answer: ['fail', 'spf=fail'],
      success: `**SPF fail**: \`arasaka.nc\` non autorizza quell'IP a spedire a suo nome. In più DKIM è \`none\` (nessuna firma) e DMARC è \`fail\`. Il From **mente**: l'email non viene da Arasaka.

Perché allora è arrivata in casella? Perché il dominio ha una politica DMARC \`p=none\` ("solo osservare"). Con \`p=quarantine\` o \`p=reject\` sarebbe finita in quarantena o rifiutata. È una raccomandazione da girare a chi gestisce la posta.`,
    },
    {
      kind: 'task',
      title: 'A chi risponderesti?',
      body: `Se la dipendente avesse premuto "Rispondi", a quale indirizzo sarebbe arrivata la risposta? Invialo con \`flag\`.`,
      objective: 'Quale indirizzo c\'è nel Reply-To?',
      hints: ['grep -i "reply-to" posta/fattura.eml', 'flag recupero.crediti77@mailbox.nc'],
      answer: ['recupero.crediti77@mailbox.nc'],
      success: `Una casella gratuita che non ha niente a che fare con l'azienda. È la tecnica della **BEC** (*Business Email Compromise*): il truffatore spera in una risposta per avviare una conversazione e arrivare a un bonifico. Altro IOC da annotare.`,
    },
    {
      kind: 'lesson',
      title: 'Leggere un link',
      body: `Il dominio vero di un indirizzo web è la parte **subito prima del primo \`/\`** dopo \`https://\`, letta **da destra verso sinistra**.

Esempi diversi dal tuo caso:
- \`https://login.banca.nc/conto\` → dominio **banca.nc** (e \`login\` è un suo sottodominio). Legittimo.
- \`https://banca.nc.verifica-conto.nc/login\` → dominio **verifica-conto.nc**. "banca.nc" è solo un sottodominio scelto dal truffatore per ingannare l'occhio.
- \`https://banca.nc@203.0.113.5/\` → tutto quello che sta prima della \`@\` viene ignorato: si va a **203.0.113.5**.
- \`https://bаnca.nc\` → quella "а" può essere una lettera cirillica identica alla nostra: è un dominio diverso (*omografo*).

E un testo cliccabile può mostrare un indirizzo e puntare a un altro: si controlla sempre l'indirizzo **vero**, che nell'email in formato testo è dentro \`href="..."\`.`,
    },
    {
      kind: 'task',
      title: 'Dove porta il link?',
      body: `Trova il link vero nel corpo dell'email:

\`\`\`
grep "href" posta/fattura.eml
\`\`\`

Qual è il **dominio** vero a cui porta? Invialo con \`flag\`.`,
      objective: 'Qual è il dominio vero del link?',
      hints: ['Leggi l\'indirizzo da destra verso sinistra, fino al primo /.', 'flag pagamenti-sicuri.nc'],
      answer: ['pagamenti-sicuri.nc'],
      success: `**pagamenti-sicuri.nc**: "arasaka.nc" all'inizio è solo un sottodominio messo lì per ingannare. È una pagina che imita il login aziendale per raccogliere password (*credential harvesting*). Terzo IOC.`,
    },
    {
      kind: 'task',
      title: 'Quanti l\'hanno ricevuta?',
      body: `Nessun truffatore manda un'email sola. Il server di posta ha registrato tutte le consegne del giorno in \`posta/consegne.log\`. Conta quante caselle hanno ricevuto un'email con lo stesso oggetto:

\`\`\`
grep -c "fattura scaduta" posta/consegne.log
\`\`\``,
      objective: 'Quante caselle hanno ricevuto l\'email?',
      hints: ['grep -c "fattura scaduta" posta/consegne.log', 'flag 6'],
      answer: ['6'],
      success: `**6** caselle. La segnalazione di una persona sola ti ha fatto scoprire una campagna. Ora controlla se qualcuno ha **cliccato**: il log del proxy web dice chi ha visitato il dominio del link.`,
    },
    {
      kind: 'task',
      title: 'Qualcuno ha cliccato?',
      body: `Cerca il dominio malevolo nel log del proxy aziendale:

\`\`\`
grep pagamenti-sicuri.nc posta/proxy.log
\`\`\`

Quale utente ha visitato la pagina e ci ha anche **inviato dati** (una richiesta POST)? Invia il nome utente con \`flag\`.`,
      objective: 'Chi ha inviato dati alla pagina falsa?',
      hints: ['Cerca la riga con POST.', 'flag t.okafor'],
      answer: ['t.okafor'],
      success: `**t.okafor** ha aperto la pagina e ha inviato il modulo: con ogni probabilità ha inserito le sue credenziali. Da questo momento il suo account va considerato **compromesso**. L'altro utente ha solo aperto la pagina (GET) senza inviare nulla: va comunque avvisato.`,
    },
    {
      kind: 'lesson',
      title: 'Cosa si fa adesso',
      body: `@nyx: Hai trasformato un clic su "Segnala" in un incidente con dei nomi e delle prove. Ecco cosa fa un SOC in questi casi, in ordine:

- **contenere**: reimpostare la password di t.okafor, chiudere tutte le sue sessioni attive, verificare la MFA (e se un nuovo dispositivo è stato registrato a suo nome)
- **ripulire**: togliere l'email da tutte e 6 le caselle (*search and purge*)
- **bloccare gli IOC**: il dominio \`pagamenti-sicuri.nc\` sul proxy, il dominio \`arasaka-pagamenti.nc\` e l'IP \`203.0.113.88\` sul server di posta, l'indirizzo del Reply-To
- **indagare**: cosa ha fatto l'account compromesso dopo il clic? accessi da Paesi insoliti, regole di inoltro della posta create di nascosto, email inviate a sua volta
- **comunicare**: avvisare i destinatari, ringraziare chi ha segnalato (così lo rifarà), proporre DMARC \`p=reject\`
- **documentare**: tempi, IOC, azioni fatte. Se ci sono dati personali coinvolti, il responsabile valuta l'obbligo di notifica entro 72 ore

?? Mai rimproverare chi ha cliccato. Chi teme una punizione la prossima volta non segnala, e un clic non segnalato è molto peggio di uno segnalato.`,
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      question: 'Un\'email ha SPF, DKIM e DMARC tutti "pass", per il dominio `arasaka-fatture.nc`. Cosa puoi concludere?',
      options: [
        'Che è un\'email legittima di Arasaka',
        'Solo che è stata davvero spedita da arasaka-fatture.nc: resta da capire chi possiede quel dominio',
        'Che è sicuramente phishing',
        'Niente: SPF e DKIM non servono a nulla',
      ],
      correct: 1,
      explain: `I controlli dicono che il dominio è **autentico**, non che è **quello giusto**. Un truffatore può registrare un dominio simile e configurarlo perfettamente. Verifica sempre se il dominio appartiene davvero all'azienda (whois, età del dominio, elenco dei domini ufficiali).`,
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      question: 'Un utente ha inserito la password in una pagina di phishing 20 minuti fa. Qual è la prima azione?',
      options: [
        'Mandargli un corso di formazione',
        'Reimpostare la password e chiudere le sue sessioni attive',
        'Aspettare di vedere se succede qualcosa',
        'Cancellare l\'email dalla sua casella',
      ],
      correct: 1,
      explain: `Prima si **contiene**: con la password in mano l'attaccante può entrare in qualsiasi momento. Reimpostarla e chiudere le sessioni gli toglie l'accesso. Il resto (ripulire le caselle, indagare, formare) viene subito dopo.`,
    },
  ],
  recap: [
    ['From', 'il mittente dichiarato: si può falsificare'],
    ['Reply-To', 'dove va la risposta: diverso dal From = campanello'],
    ['Received', 'si leggono dal basso: l\'ultima riga è il server di partenza'],
    ['SPF / DKIM / DMARC', 'IP autorizzato / firma valida / allineamento e politica del dominio'],
    ['dominio di un link', 'da destra a sinistra fino al primo /; ciò che precede @ si ignora'],
    ['IOC', 'indicatori: IP, domini, indirizzi, impronte'],
    ['risposta', 'contenere, ripulire, bloccare, indagare, comunicare, documentare'],
  ],
};
