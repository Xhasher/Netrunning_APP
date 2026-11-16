// Capitolo F · Fondamenti di sicurezza. Il vocabolario e i ragionamenti che ogni colloquio
// da junior dà per scontati. Poca tastiera, molta testa: si usano solo cat e flag.
//
// Trama: il giorno dopo la notte del capitolo 01. Rook ti fa sedere alla scrivania del
// retro di Lo Scantinato, dove arrivano le richieste dei clienti. Prima di mandarti da
// Mama Reyes per il primo lavoro sul campo, vuole che tu sappia parlare con un cliente:
// capire cosa gli è successo, cosa rischia, chi lo attacca e cosa si può fare per legge.
// Ogni missione è un'ora della giornata con un cliente diverso; alla fine arriva il contratto.
//
// Regole di scrittura: ogni termine spiegato dove compare; liste brevi; un esempio concreto
// per ogni idea; Nyx e Rook parlano, il testo normale spiega.

import type { Chapter } from '../game/types';

/** Versione dei contenuti in cui il capitolo è stato riscritto (passi nuovi). */
const V = 19;

export const CHF: Chapter = {
  id: 'chF',
  code: 'F',
  title: 'Fondamenti di sicurezza',
  subtitle: 'Una giornata alla scrivania di Rook: le idee che reggono tutto il resto',
  missions: [
    // ------------------------------------------------------------------ F.1
    {
      id: 'chF-m1',
      title: 'Tre parole che reggono tutto',
      tagline: 'Riservatezza, integrità, disponibilità: la triade CIA e il modello AAA.',
      xp: 150,
      steps: [
        {
          kind: 'lesson',
          since: V,
          title: 'Il retro del bar',
          body: `Mezzogiorno. Hai dormito quattro ore. Rook ti aspetta nel retro di Lo Scantinato, a un tavolo pieno di fogli, con una ciotola di ramen che non ha toccato.

@rook: Sai muovere le dita sul terminale. Bene. Ma un cliente non ti chiede "che comando usi?". Ti chiede "cosa mi è successo, è grave, cosa faccio?". Se non sai rispondere a quello, i comandi non servono.

@rook: Oggi stai alla mia scrivania. Arrivano clienti con dei guai, e tu impari a capirli. Se a fine giornata parli la loro lingua, domani ti mando da Mama, la proprietaria di questo bar. Il suo è un lavoro vero.

@nyx: Io resto qui. Sul deck, nella cartella \`fondamenti\`, Rook ti ha copiato tutto quello che arriva oggi.`,
        },
        {
          kind: 'task',
          since: V,
          title: 'Le segnalazioni del mattino',
          body: `@rook: Tre clienti mi hanno chiamato stamattina. Tre guai che sembrano diversi. Leggili.

\`\`\`
cat fondamenti/incidenti.txt
\`\`\`

Per ora leggi e basta. Tra un minuto ti do lo strumento per metterli in ordine.`,
          objective: 'Leggi le tre segnalazioni con cat.',
          hints: ['Dalla home: cat fondamenti/incidenti.txt'],
          check: (ev, sh) => ev.type === 'read' && ev.path === `${sh.home}/fondamenti/incidenti.txt`,
          solve: ['cat fondamenti/incidenti.txt'],
          success: `Una clinica che non riesce più ad aprire i suoi file, un'officina che ha pagato la persona sbagliata, uno studio che ha spedito un elenco di clienti a un concorrente.

@rook: Tre storie diverse. Ma chi fa questo mestiere le mette subito in tre caselle. Nyx, spiegagli quali.`,
        },
        {
          kind: 'lesson',
          title: 'La triade CIA',
          body: `@nyx: Chi lavora in sicurezza non protegge "i computer". Protegge le **informazioni** e i **servizi** che le usano. E per ogni informazione si fa sempre tre domande.

Le tre domande hanno un nome: la **triade CIA**, dalle iniziali inglesi. Le spie non c'entrano.

**1. Riservatezza** (*Confidentiality*): la vede **solo chi ne ha diritto**?

Si rompe quando un elenco di clienti finisce nelle mani sbagliate, quando qualcuno legge la posta di un collega, quando viene rubato un portatile con dentro dati in chiaro.

**2. Integrità** (*Integrity*): è **esatta**, e nessuno l'ha cambiata di nascosto?

Si rompe quando qualcuno modifica un numero in una fattura, un voto in un registro, una riga di un file per coprire le proprie tracce.

**3. Disponibilità** (*Availability*): **c'è quando serve**?

Si rompe quando un programma malevolo rende i file illeggibili, quando qualcuno intasa un sito di richieste finché smette di rispondere, quando un disco si guasta e non c'è una copia.

@nyx: Ogni incidente ne colpisce almeno una. Dire quale, è il primo passo per capire cosa fare.

?? Le tre tirano in direzioni opposte. Un documento chiuso in una cassaforte murata è riservatissimo, ma non serve a nessuno. Il mestiere è trovare l'equilibrio giusto **per quel cliente**: una clinica mette al primo posto la disponibilità, uno studio legale la riservatezza, una banca l'integrità.`,
        },
        {
          kind: 'task',
          title: 'Il primo cliente',
          body: `@rook: Caso A, la clinica. I file ci sono ancora. Nessuno li ha portati via, nessuno li ha cambiati. Ma i medici non riescono ad aprirli da due giorni.

Quale delle tre proprietà è stata colpita? Rispondi con \`flag\` seguito dal nome, per esempio \`flag riservatezza\`.

(Se serve, rileggi la segnalazione con il comando di prima: la freccia ↑ lo richiama.)`,
          objective: 'Caso A: quale proprietà della triade è stata violata?',
          hints: [
            'I dati della clinica non sono stati rubati né modificati: semplicemente non si riescono più a usare.',
            'Quando un servizio non c\'è nel momento in cui serve, è la disponibilità: flag disponibilità',
          ],
          answer: ['disponibilità', 'disponibilita', 'availability', 'la disponibilità'],
          success: `**Disponibilità.** Le cartelle dei pazienti esistono ancora, ma è come se non ci fossero.

A farlo è stato un **ransomware**: un programma che rende i file illeggibili (li *cifra*, cioè li trasforma in un testo incomprensibile che si può rimettere a posto solo con una chiave segreta) e poi chiede un riscatto per quella chiave.

La difesa numero uno si chiama **backup**: una copia dei dati, tenuta **scollegata** dalla rete, perché il ransomware non la raggiunga. E provata davvero almeno una volta: un backup mai provato è una speranza, non un backup.`,
        },
        {
          kind: 'task',
          title: 'Il secondo cliente',
          body: `@rook: Caso B, l'officina. La fattura era quella vera, è arrivata come sempre, si leggeva benissimo. Ma un dato dentro non era più quello giusto, e diciottomila eddies sono finiti a qualcun altro.

Quale proprietà?`,
          objective: 'Caso B: quale proprietà è stata violata?',
          hints: ['La fattura è arrivata ed era leggibile. Ma un dato al suo interno non era più quello vero.', 'Un dato alterato da chi non doveva: flag integrità'],
          answer: ['integrità', 'integrita', 'integrity', 'l\'integrità'],
          success: `**Integrità.** Nessun segreto è stato svelato e niente è sparito: è stato **cambiato un dato**, l'IBAN, cioè il codice del conto su cui pagare.

È la truffa più redditizia contro le piccole aziende. Si chiama **BEC** (*Business Email Compromise*): qualcuno si inserisce nella posta tra un'azienda e un fornitore e cambia le coordinate di pagamento.

@rook: E la difesa non è un programma. È una **telefonata**. Quando un fornitore "cambia IBAN", si chiama il fornitore a un numero che si conosceva già, non a quello scritto nella mail.`,
        },
        {
          kind: 'task',
          title: 'Il terzo cliente',
          body: `@rook: Caso C, lo studio dei commercialisti. Niente cancellato, niente cambiato, tutto funziona. Eppure il titolare mi ha chiamato con la voce che tremava.

Quale proprietà?`,
          objective: 'Caso C: quale proprietà è stata violata?',
          hints: ['I dati sono finiti sotto gli occhi di qualcuno che non doveva vederli.', 'flag riservatezza'],
          answer: ['riservatezza', 'confidenzialità', 'confidenzialita', 'confidentiality', 'la riservatezza'],
          success: `**Riservatezza.** Un allegato sbagliato, un destinatario sbagliato: nessun hacker, solo un errore umano. Ed è così che nasce la maggior parte delle fughe di dati.

@nyx: Quel file contiene nomi e redditi di persone vere. Questo fa scattare un obbligo di legge, e non da poco. Lo vedrai nell'ultima missione di oggi.`,
        },
        {
          kind: 'lesson',
          title: 'Chi sei, cosa puoi, cosa hai fatto',
          body: `@nyx: Hai visto cosa si protegge. Ora come lo protegge un sistema fatto bene. Ogni volta che qualcuno prova a usarlo, il sistema si fa tre domande, in quest'ordine.

**1. Chi sei?** Si chiama **autenticazione**. La dimostri con qualcosa: una password, un'impronta, una chiave.

**2. Cosa puoi fare?** Si chiama **autorizzazione**. Il sistema sa chi sei, ora decide a cosa puoi accedere. Il *Permission denied* che hai visto stanotte su \`/root\` era l'autorizzazione al lavoro.

**3. Cosa hai fatto?** Si chiama **tracciamento** (in inglese *accounting*). Il sistema scrive in un registro, il **log**, chi ha fatto cosa e quando. Senza log, dopo un incidente non si può nemmeno cominciare a indagare.

Dalle iniziali inglesi (*Authentication, Authorization, Accounting*) si chiama **modello AAA**.

Un esempio che conosci, l'ufficio con il badge:
- passi il badge al tornello → **autenticazione**: il sistema sa che sei tu
- il badge apre il tuo ufficio ma non la sala server → **autorizzazione**
- il sistema annota che sei entrato alle 8:52 → **tracciamento**

C'è un'ultima parola da conoscere: **non ripudio**. Vuol dire che chi ha fatto una cosa **non può negare di averla fatta**.

?? Per questo un account condiviso da tutto l'ufficio ("admin", con la password sul post-it) è un problema anche se la password è robusta: nel log c'è scritto "admin", non il nome di una persona. Nessuno può essere chiamato a rispondere.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un utente entra correttamente con la sua password, ma quando prova ad aprire la cartella degli stipendi riceve "Permission denied". Quale meccanismo lo ha fermato?',
          options: ['L\'autenticazione', 'L\'autorizzazione', 'Il tracciamento', 'Il non ripudio'],
          correct: 1,
          explain: `L'autenticazione è andata bene: il sistema sa chi è. A fermarlo è stata l'**autorizzazione**: quella persona non ha il permesso di aprire quella cartella.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Dopo un\'intrusione, l\'attaccante cancella le righe del log che mostrano i suoi accessi. Quale proprietà della triade ha colpito con questa azione?',
          options: ['Riservatezza', 'Integrità', 'Disponibilità', 'Nessuna: i log non sono dati'],
          correct: 1,
          explain: `Ha **alterato** un'informazione che doveva restare fedele: è **integrità**. Per questo i log importanti si copiano subito su un altro computer, dove chi è entrato nel server non può arrivare.`,
        },
      ],
      recap: [
        ['Riservatezza', 'solo chi ha diritto vede l\'informazione'],
        ['Integrità', 'l\'informazione è esatta e non alterata'],
        ['Disponibilità', 'informazione e servizio ci sono quando servono'],
        ['ransomware', 'programma che rende i file illeggibili e chiede un riscatto'],
        ['backup', 'copia dei dati, tenuta scollegata e provata davvero'],
        ['Autenticazione', 'chi sei?'],
        ['Autorizzazione', 'cosa puoi fare?'],
        ['Tracciamento', 'cosa hai fatto? (i log)'],
        ['Non ripudio', 'non puoi negare di aver compiuto un\'azione'],
      ],
    },

    // ------------------------------------------------------------------ F.2
    {
      id: 'chF-m2',
      title: 'Quanto rischio?',
      tagline: 'Asset, minacce, vulnerabilità, rischio e controlli: decidere cosa proteggere prima.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Non si può proteggere tutto',
          body: `Le due del pomeriggio. Entra un uomo con un grembiule sporco di farina: Kenji Tanaka, ha un emporio due strade più in là.

@rook: Il signor Tanaka ha quattro problemi e i soldi per risolverne uno. Vuole sapere quale. "Tutti" non è una risposta: è il modo più rapido per perdere un cliente.

@nyx: È la domanda vera di questo mestiere. Nessuno ha tempo e soldi infiniti. Si ragiona per **rischio**. E per farlo servono quattro parole, che non vanno mai confuse.

**Asset** (bene): una cosa che ha valore e va protetta. L'elenco dei clienti, il computer della cassa, la reputazione del negozio.

**Minaccia**: qualcosa o qualcuno che **potrebbe** fare un danno. Un ladro, un dipendente arrabbiato, un incendio, un errore.

**Vulnerabilità**: una **debolezza** che la minaccia può sfruttare. Un programma vecchio mai aggiornato, una password banale, una porta lasciata aperta.

**Rischio**: la possibilità che una minaccia sfrutti una vulnerabilità e danneggi un asset.

L'immagine da tenere in testa:
- la **pioggia** è la minaccia
- il **buco nel tetto** è la vulnerabilità
- il **pavimento di legno** è l'asset

Senza pioggia, il buco non fa danni. Senza buco, la pioggia nemmeno. Il rischio nasce quando si incontrano.`,
        },
        {
          kind: 'lesson',
          title: 'Misurare il rischio',
          body: `@nyx: Il rischio si misura con due numeri, e una moltiplicazione.

\`\`\`
rischio = probabilità × impatto
\`\`\`

- **probabilità**: quanto è facile che succeda, da 1 (raro) a 5 (quasi certo)
- **impatto**: quanto male fa se succede, da 1 (un fastidio) a 5 (si chiude bottega)

Un esempio. Questo stesso bar ha due problemi:
- la password del wifi dei clienti è scritta sul muro. Che un estraneo la usi è quasi certo: probabilità **5**. Ma il wifi è fatto per questo: impatto **1**. Rischio **5 × 1 = 5**
- il computer della cassa sta sullo stesso wifi dei clienti. Che qualcuno ne approfitti è poco probabile: **2**. Ma se succede, rubano i dati delle carte di credito: impatto **5**. Rischio **2 × 5 = 10**

Il secondo è **meno probabile** ma **viene prima**, perché il suo rischio è più alto.

Si fa così per ogni problema, poi si mettono in fila dal rischio più alto al più basso. Quella lista si chiama **registro dei rischi**.`,
        },
        {
          kind: 'task',
          title: 'Il registro dei rischi',
          body: `@rook: Ecco i quattro problemi del signor Tanaka. Probabilità e impatto li ho già stimati io.

\`\`\`
cat fondamenti/rischi.txt
\`\`\`

Per ogni riga moltiplica probabilità per impatto. Quale rischio è il più alto? Invia la sua sigla con \`flag\` (per esempio \`flag R9\`).`,
          objective: 'Qual è il rischio più alto del registro?',
          hints: ['Moltiplica probabilità per impatto su ogni riga.', 'R1 = 12, R2 = 20, R3 = 5, R4 = 9.', 'flag R2'],
          answer: ['R2', 'r2'],
          success: `**R2**, con 20 su 25. Un server esposto a Internet e non aggiornato è **probabile** (ci sono programmi che girano giorno e notte cercando proprio macchine così) e **grave**.

Guarda R3, l'allagamento: avrebbe lo stesso impatto, ma è così raro che finisce in fondo. Senza calcolo, a sensazione, molti avrebbero messo l'acqua al primo posto.

@rook: Bravo. Tanaka aggiorna il server questa settimana.`,
        },
        {
          kind: 'lesson',
          since: V,
          title: 'Cosa si fa con un rischio',
          body: `@rook: Tanaka mi ha chiesto: "e gli altri tre?". Non ha detto "li ignoro". Ha chiesto cosa si può fare. Ci sono quattro risposte possibili, e solo quattro.

**Ridurre** (si dice anche *mitigare*): si fa qualcosa per abbassarlo. Aggiornare il server, cifrare il portatile, togliere i permessi allo stagista.

**Trasferire**: si fa pagare il danno a qualcun altro. Un'assicurazione, o un fornitore che si prende la responsabilità per contratto.

**Evitare**: si smette di fare la cosa rischiosa. Se il sito vecchio non serve più, lo si spegne.

**Accettare**: si decide di tenerselo, perché ridurlo costerebbe più del danno.

!! Accettare un rischio è una scelta legittima. Ma la fa **il cliente**, informato e per iscritto. Mai il tecnico da solo, e mai per dimenticanza.`,
        },
        {
          kind: 'lesson',
          title: 'I controlli',
          body: `@nyx: Qualsiasi cosa tu faccia per ridurre un rischio si chiama **controllo** (in italiano anche *contromisura*). Ai colloqui li chiedono sempre divisi in due modi.

**In base al momento in cui agiscono:**
- **preventivi**: impediscono che succeda. Una serratura, una password, un aggiornamento
- **rilevativi**: si accorgono che sta succedendo, o che è successo. Un allarme, una telecamera, un log
- **correttivi**: rimettono a posto dopo. Ripristinare i file dal backup, riparare un programma

**In base a cosa sono:**
- **tecnici**: fatti di programmi e macchine. Password, permessi, antivirus
- **amministrativi**: fatti di regole scritte. "Le password si cambiano se c'è un sospetto", un corso per i dipendenti
- **fisici**: nel mondo reale. Serrature, badge, guardie

Nessun controllo è perfetto. Per questo se ne mettono **tanti, diversi, uno dietro l'altro**: chi supera il primo trova il secondo. Si chiama **difesa in profondità**, e funziona come un castello: fossato, mura, torri, cassaforte.

Due regole che ritroverai in ogni capitolo:
- **minimo privilegio**: ognuno ha solo i permessi che servono al suo lavoro. Niente di più
- **separazione dei compiti**: le operazioni delicate richiedono due persone. Chi prepara un bonifico non è chi lo approva`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un\'azienda installa telecamere nella sala server. Che tipo di controllo è?',
          options: ['Tecnico e preventivo', 'Fisico e rilevativo', 'Amministrativo e correttivo', 'Fisico e correttivo'],
          correct: 1,
          explain: `Sta nel mondo reale, quindi è **fisico**. E non impedisce di entrare: **rileva** e registra chi entra. (Una telecamera ben visibile scoraggia anche un po', ma il suo compito principale è vedere.)`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Il cliente stipula un\'assicurazione contro i danni da ransomware. Cosa sta facendo con quel rischio?',
          options: ['Lo riduce', 'Lo evita', 'Lo trasferisce', 'Lo accetta'],
          correct: 2,
          explain: `Lo **trasferisce**: il danno economico lo paga l'assicurazione. Attenzione però: la probabilità che l'attacco avvenga non cambia di una virgola. Per questo l'assicurazione non sostituisce i backup.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Uno stagista ha ricevuto i permessi di amministratore "così non ci disturba ogni volta". Quale regola è stata violata?',
          options: ['Difesa in profondità', 'Non ripudio', 'Minimo privilegio', 'Disponibilità'],
          correct: 2,
          explain: `**Minimo privilegio**: si danno solo i permessi necessari. Se qualcuno ruba la password dello stagista, si ritrova amministratore al primo colpo.`,
        },
      ],
      recap: [
        ['asset', 'ciò che ha valore e va protetto'],
        ['minaccia', 'chi o cosa potrebbe causare un danno'],
        ['vulnerabilità', 'la debolezza che la minaccia sfrutta'],
        ['rischio', 'probabilità × impatto'],
        ['registro dei rischi', 'l\'elenco dei rischi, dal più alto al più basso'],
        ['trattamento', 'ridurre, trasferire, evitare, accettare'],
        ['controlli', 'preventivi, rilevativi, correttivi · tecnici, amministrativi, fisici'],
        ['difesa in profondità', 'più strati di protezione diversi'],
        ['minimo privilegio', 'solo i permessi che servono'],
      ],
    },

    // ------------------------------------------------------------------ F.3
    {
      id: 'chF-m3',
      title: 'Chi c\'è là fuori',
      tagline: 'Chi attacca, perché, con quali armi, e come si riconosce una trappola.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Chi vuoi che attacchi proprio me',
          body: `Le quattro. Una signora con gli occhiali a specchio si siede davanti a Rook: Neon Ottica, un negozio di occhiali in centro.

@rook: La signora vuole sapere perché dovrebbe spendere soldi in sicurezza. Dice: "ma chi vuoi che attacchi proprio me, che vendo occhiali?".

@nyx: È la domanda sbagliata. Quasi nessuno **sceglie** la vittima. Si lancia una rete enorme, a migliaia di indirizzi insieme, e si tira su quello che resta impigliato.

Chi attacca si chiama **attore della minaccia** (in inglese *threat actor*). Sapere chi è aiuta a capire cosa vuole e quanto insisterà.

- **criminali organizzati**: vogliono **soldi**. Riscatti, truffe, furto di carte di credito. Sono di gran lunga i più comuni contro le aziende normali
- **gruppi pagati da uno Stato**: vogliono **segreti**, o sabotare. Pazienti, ben pagati, restano nascosti per mesi. In gergo si chiamano **APT**
- **interni**: un dipendente o un ex dipendente. A volte in malafede; molto più spesso semplicemente **distratto**: clicca, sbaglia, perde un portatile
- **attivisti** (*hacktivisti*): attaccano per una **causa**. Oscurano siti, pubblicano dati per protesta
- **dilettanti**: usano programmi scritti da altri senza capirli. Poco bravi, ma tanti e rumorosi

!! L'attaccante non ha bisogno di essere un genio. Ha bisogno che **tu** abbia lasciato qualcosa aperto. Quasi tutti gli incidenti veri sfruttano errori banali, non tecniche da film.`,
        },
        {
          kind: 'lesson',
          title: 'Le armi: il malware',
          body: `@nyx: Il **malware** (da *malicious software*, programma malevolo) è il nome generico per qualsiasi programma fatto per fare danni. Le famiglie si distinguono da **come arrivano** e da **cosa fanno**.

**Come arrivano:**
- **virus**: si nasconde dentro un file. Parte quando qualcuno lo apre
- **worm** ("verme"): si copia **da solo** da un computer all'altro della rete, senza che nessuno faccia niente
- **trojan** (da "cavallo di Troia"): si presenta come qualcosa di utile, un gioco, una fattura, un aggiornamento, e nasconde altro

**Cosa fanno:**
- **ransomware**: rende i file illeggibili e chiede un riscatto (l'hai visto stamattina, alla clinica)
- **spyware**: spia quello che fai. Il **keylogger** registra ogni tasto premuto, password comprese
- **backdoor** ("porta sul retro"): lascia un ingresso segreto per rientrare quando si vuole
- **rootkit**: si nasconde così in profondità nel sistema che i normali strumenti non lo vedono
- **botnet**: migliaia di computer infetti comandati insieme da lontano
- **cryptominer**: usa il tuo computer per produrre criptovaluta per qualcun altro. Te ne accorgi perché tutto è lentissimo e la ventola non si ferma mai

Nella realtà un attacco ne usa diversi insieme: arriva come trojan dentro un allegato, apre una backdoor, e settimane dopo scarica il ransomware.`,
        },
        {
          kind: 'lesson',
          title: 'Le armi: ingannare le persone',
          body: `@nyx: L'arma più efficace non è un programma. È una persona che si fida.

Attaccare la persona invece del computer si chiama **ingegneria sociale**. Funziona perché sfrutta reazioni normalissime: la fretta, la paura, la gentilezza, il rispetto per il capo.

- **phishing** (si legge "fiscing", da *fishing*, pescare): un messaggio finto che ti spinge a cliccare un link, aprire un allegato o scrivere la tua password
- **spear phishing** ("pesca con l'arpione"): phishing **su misura** per una persona, con dettagli veri sulla sua vita
- **whaling** ("caccia alla balena"): spear phishing contro i dirigenti
- **smishing** e **vishing**: lo stesso via **SMS** o per **telefono**
- **pretexting**: inventarsi un ruolo credibile. "Buongiorno, sono il tecnico della banca"
- **tailgating**: entrare in un edificio accodandosi a chi ha il badge

I segnali di una trappola sono quasi sempre gli stessi:
- **fretta**: "entro un'ora", "ultimo avviso"
- una **paura** o un **premio**: "il tuo conto sarà bloccato", "hai vinto"
- la richiesta di **saltare le regole**: "solo per questa volta", "non dirlo a nessuno"
- un **mittente quasi giusto**: \`banca-sicura.nc\` invece di \`bancasicura.nc\``,
        },
        {
          kind: 'task',
          since: V,
          title: 'La posta della signora',
          body: `@rook: La signora mi ha inoltrato le ultime tre mail che ha ricevuto. Dice che sono tutte normali. Vediamo se ha ragione.

\`\`\`
cat fondamenti/messaggi.txt
\`\`\`

Una delle tre è una trappola. Quale? Invia la lettera con \`flag\` (per esempio \`flag A\`).`,
          objective: 'Quale dei tre messaggi è phishing?',
          hints: [
            'Cerca i segnali: fretta, paura, richiesta di saltare le regole, un mittente quasi giusto.',
            'Guarda bene l\'indirizzo del mittente di ogni messaggio, lettera per lettera.',
            'Il messaggio B viene da neon-ottica-amministrazione.nc, non da neonottica.nc, e mette fretta: flag B',
          ],
          answer: ['B', 'b', 'messaggio b'],
          solve: ['cat fondamenti/messaggi.txt', 'flag B'],
          success: `Il **messaggio B**. Tutti i segnali insieme:
- il mittente sembra quello giusto ma non lo è: \`neon-ottica-amministrazione.nc\`, non \`neonottica.nc\`
- c'è **fretta** ("entro le 17")
- c'è una **minaccia** ("la fornitura sarà sospesa")
- chiede di **saltare la procedura** ("non serve passare dal commercialista")
- e il link porta a un sito che non c'entra niente

@nyx: Gli altri due erano veri, anche quello del corriere che sembrava sospetto. Non basta un dettaglio strano: si guarda l'**insieme**. E nel dubbio non si clicca: si chiama il mittente a un numero che si conosceva già.`,
        },
        {
          kind: 'lesson',
          title: 'Le fasi di un attacco',
          body: `@nyx: Un attacco non è un istante. È una **sequenza di passi**, e ogni passo è un'occasione per fermarlo.

Il modello più famoso si chiama **Cyber Kill Chain** ("catena dell'uccisione": il nome viene dal linguaggio militare). Sette fasi:

- **1. Ricognizione**: studiare il bersaglio. Chi lavora lì, che programmi usa, quali indirizzi email
- **2. Preparazione**: costruire l'arma. Per esempio un documento che sembra una fattura e dentro ha il malware
- **3. Consegna**: farla arrivare. Quasi sempre per email
- **4. Sfruttamento**: la vittima apre il file, la debolezza viene usata, il malware parte
- **5. Installazione**: il malware si sistema per restare anche dopo che il computer viene spento e riacceso
- **6. Comando e controllo**: il computer infetto "telefona a casa", all'attaccante, e aspetta ordini
- **7. Azione**: rubare, rendere illeggibili i file, distruggere

Perché ti serve: chi attacca deve riuscire in **tutte** le fasi. A chi difende basta **spezzare la catena in un punto**.
- la formazione dei dipendenti ferma la consegna
- gli aggiornamenti fermano lo sfruttamento
- controllare con chi parlano i computer ferma il comando e controllo

?? Più avanti userai un modello molto più dettagliato, **MITRE ATT&CK**: un catalogo pubblico di tutte le tecniche usate dagli attaccanti veri. La Kill Chain è la cartina della città, ATT&CK lo stradario.`,
        },
        {
          kind: 'lesson',
          since: V,
          title: 'Altri attacchi da riconoscere',
          body: `@nyx: Ultimi nomi, poi la signora può andare. Sono attacchi che incontrerai in ogni capitolo.

**Contro le password:**
- **brute force** ("forza bruta"): provare migliaia di password, una dopo l'altra, sullo stesso account
- **password spraying**: provare poche password comunissime ("Estate2077!") su tanti account diversi
- **credential stuffing**: prendere email e password rubate a un sito e riprovarle su tutti gli altri

**Contro i servizi:**
- **DoS** (*Denial of Service*): sommergere un sito di richieste finché non risponde più a nessuno. **DDoS** se le richieste arrivano da migliaia di computer insieme, di solito una botnet

**Contro le comunicazioni:**
- **man in the middle** ("uomo nel mezzo"): mettersi tra due persone che si parlano, per leggere o cambiare quello che si dicono

**Contro i fornitori:**
- **supply chain** ("catena di fornitura"): colpire un fornitore per arrivare a tutti i suoi clienti. Per esempio avvelenando l'aggiornamento di un programma che usano in mille

@rook: La signora ha firmato. Un controllo completo, il mese prossimo. Visto? Quando sai spiegare, la gente ascolta.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un programma si copia da un computer all\'altro attraverso la rete dell\'ufficio, senza che nessuno apra nulla. Che tipo di malware è?',
          options: ['Trojan', 'Worm', 'Keylogger', 'Rootkit'],
          correct: 1,
          explain: `Si diffonde **da solo**: è un **worm**. Il virus ha bisogno che qualcuno apra il file infetto; il trojan che qualcuno lo installi credendolo utile.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'L\'amministratore delegato riceve un\'email che cita il suo ultimo viaggio e il nome del suo assistente, e gli chiede di aprire un "contratto urgente". Come si chiama questo attacco?',
          options: ['Smishing', 'Tailgating', 'Whaling', 'Password spraying'],
          correct: 2,
          explain: `È phishing su misura rivolto a un dirigente: si chiama **whaling**, "caccia alla balena". I dettagli veri servono a far abbassare la guardia, e spesso l'attaccante li trova su Internet, nei profili pubblici.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un PC infetto contatta ogni 60 secondi un server sconosciuto su Internet. In quale fase della Kill Chain ci troviamo?',
          options: ['Ricognizione', 'Consegna', 'Comando e controllo', 'Preparazione'],
          correct: 2,
          explain: `Il malware "telefona a casa" per ricevere ordini: è la fase di **comando e controllo** (in sigla **C2**). Quel contatto regolare si chiama *beacon*, ed è uno dei segnali che un analista impara a cercare.`,
        },
      ],
      recap: [
        ['attori della minaccia', 'criminali, Stati (APT), interni, attivisti, dilettanti'],
        ['malware', 'virus, worm, trojan · ransomware, spyware, backdoor, rootkit, botnet, cryptominer'],
        ['ingegneria sociale', 'phishing, spear phishing, whaling, smishing, vishing, pretexting, tailgating'],
        ['segnali di phishing', 'fretta, paura o premio, saltare le regole, mittente quasi giusto'],
        ['Kill Chain', 'ricognizione, preparazione, consegna, sfruttamento, installazione, C2, azione'],
        ['attacchi alle password', 'brute force, password spraying, credential stuffing'],
        ['DoS / DDoS', 'sommergere un servizio di richieste'],
        ['supply chain', 'colpire un fornitore per arrivare ai clienti'],
      ],
    },

    // ------------------------------------------------------------------ F.4
    {
      id: 'chF-m4',
      title: 'Dimostra chi sei',
      tagline: 'Fattori di autenticazione, MFA, password fatte bene e la vita di un account.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Nessuna finestra rotta',
          body: `Le sei. Il telefono di Rook squilla. Lui ascolta, chiude, e ti guarda.

@rook: Lo studio dentistico di via Kabuki è stato svuotato stanotte. Archivi dei pazienti, fatture, tutto. Nessuna finestra rotta, nessun allarme. Sono entrati con un account **valido**. Voglio sapere quale, e perché era così facile.

@nyx: Oggi gli attaccanti quasi non "bucano" più niente. **Entrano con la password di qualcuno.** Per questo la difesa più importante, oggi, è proteggere l'identità.

Ricordi l'**autenticazione**, il "chi sei"? Si dimostra con uno o più **fattori**. I fattori sono di tre tipi:

- **qualcosa che sai**: una password, un PIN, la risposta a una domanda segreta
- **qualcosa che hai**: il telefono con un'app che genera codici, una chiavetta di sicurezza
- **qualcosa che sei**: l'impronta digitale, il volto (si chiama *biometria*)

L'**autenticazione a più fattori**, **MFA** in sigla, ne chiede almeno **due di tipo diverso**. Rubare una password non basta più: serve anche il telefono della vittima.

È la singola misura che ferma più attacchi in assoluto.

!! Password e domanda segreta **non** sono MFA: sono due cose "che sai". I due fattori devono essere di **tipo diverso**.`,
        },
        {
          kind: 'lesson',
          since: V,
          title: 'Non tutti i secondi fattori sono uguali',
          body: `@nyx: Il secondo fattore può arrivare in vari modi. Dal più debole al più forte:

- **codice via SMS**: meglio di niente. Ma un criminale può convincere l'operatore telefonico a spostare il tuo numero su una sua SIM, e ricevere lui i codici
- **codice di un'app** sul telefono, che cambia ogni 30 secondi: buono
- **notifica da approvare** ("sei tu che stai entrando? Sì / No"): comoda, ma chi viene bombardato di notifiche alle tre di notte a volte preme "Sì" solo per farle smettere
- **chiave di sicurezza fisica** (una chiavetta da collegare o avvicinare, oppure una *passkey* sul telefono): la migliore. Non funziona su un sito falso, quindi resiste anche al phishing

?? Se un cliente non ha nessuna MFA, il consiglio è uno solo: **attivatela adesso, qualunque**. Si migliora dopo.`,
        },
        {
          kind: 'lesson',
          title: 'Password fatte bene',
          body: `@nyx: Le regole sulle password sono cambiate rispetto a quelle che ti hanno insegnato a scuola. Quelle che seguono oggi gli esperti (le pubblica il **NIST**, l'ente americano che scrive gli standard tecnici) dicono:

- **la lunghezza conta più dei simboli strani**. \`cavallo-batteria-graffetta-corretto\` è molto più robusta di \`P@ssw0rd!\`, ed è anche più facile da ricordare
- **una password diversa per ogni servizio**. Sempre
- **un gestore di password** (*password manager*) che le ricorda tutte per te. Tu ne ricordi una sola, lunga
- **niente cambio obbligato ogni tre mesi**. Produce solo \`Estate2077!\` seguita da \`Autunno2077!\`. Si cambia quando c'è il sospetto che sia stata rubata
- **rifiutare le password già rubate**: quelle che compaiono in elenchi trapelati da altri siti

Perché una password diversa per ogni servizio? Per il **credential stuffing** che hai visto prima. Quando un sito viene violato, le coppie email e password finiscono in vendita. Dei programmi le riprovano in automatico su posta, banca, social. Se la riusi, cadono tutte insieme.

Come la conserva un sistema fatto bene: **mai così com'è**. Ne salva solo un'**impronta**: un codice calcolato dalla password, da cui non si può tornare indietro. Quando la riscrivi, il sistema ricalcola l'impronta e confronta. Lo vedrai all'opera nel capitolo sulla crittografia.

?? Se un sito, quando clicchi "password dimenticata", ti rimanda per email **la tua vecchia password**, vuol dire che la conserva così com'è. Un sito fatto bene può solo fartene impostare una **nuova**.`,
        },
        {
          kind: 'lesson',
          title: 'La vita di un account',
          body: `@nyx: Un account nasce, cambia e deve morire. Gli incidenti nascono quasi sempre nell'ultima fase, quando ci si dimentica di farlo morire.

- **quando una persona arriva**: riceve un account con i permessi del suo ruolo. Non di più
- **quando cambia ruolo**: le si danno i permessi nuovi **e le si tolgono quelli vecchi**. Se non si fa, dopo dieci anni un dipendente può aprire tutto
- **quando se ne va**: l'account si **disattiva il giorno stesso**

In inglese le tre fasi si chiamano *joiner, mover, leaver*: chi entra, chi si sposta, chi esce.

Tre tipi di account da controllare in ogni verifica:
- **account orfani**: appartengono a persone che non lavorano più lì. Nessuno li usa, nessuno li guarda
- **account di servizio**: non li usa una persona, ma un programma (per esempio quello che fa i backup di notte). Spesso hanno molti permessi, una password che non scade mai e nessuna MFA
- **account amministrativi**: chi amministra i sistemi ne ha **due**: uno normale per la posta e il web, uno potente solo per i lavori delicati`,
        },
        {
          kind: 'task',
          title: 'L\'account sbagliato',
          body: `@rook: Lo studio mi ha mandato l'elenco dei suoi account. Per ognuno c'è il ruolo, se ha la MFA, quando è stata cambiata la password l'ultima volta.

\`\`\`
cat fondamenti/accessi.txt
\`\`\`

Uno di questi era la porta perfetta: molti permessi, nessun secondo fattore, password vecchissima. Invia il suo nome con \`flag\`.`,
          objective: 'Quale account era il più esposto?',
          hints: [
            'Cerca tra gli account con ruolo di amministratore quello senza MFA.',
            'Guarda anche la data della password: una è del 2071.',
            'flag svc.backup',
          ],
          answer: ['svc.backup'],
          success: `**svc.backup**. È un **account di servizio** (il prefisso \`svc\` sta per *service*), ha i permessi da amministratore, non ha MFA, e la sua password non cambia da sei anni. Dalla nota, la conosceva anche il vecchio fornitore.

Nessuna persona lo usa durante il giorno, quindi nessuno nota se lo usa qualcun altro. È esattamente il tipo di account che gli attaccanti cercano per primo.

@nyx: Guarda anche \`l.conti\`: ha lasciato lo studio, ma il suo account è ancora attivo. È un **account orfano**. Due porte aperte, nello stesso elenco.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Quale di queste combinazioni è una vera autenticazione a più fattori?',
          options: [
            'Password e PIN',
            'Password e codice generato dall\'app sul telefono',
            'Impronta digitale e riconoscimento del volto',
            'Password e data di nascita',
          ],
          correct: 1,
          explain: `Servono fattori di **tipo diverso**: la password è qualcosa che **sai**, il telefono è qualcosa che **hai**. Password e PIN sono due cose che sai; impronta e volto due cose che sei.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un sito di ricette viene violato. Una settimana dopo, qualcuno entra nella posta aziendale di un dipendente al primo tentativo. Cosa è successo, con ogni probabilità?',
          options: ['Un attacco brute force', 'Credential stuffing: usava la stessa password su entrambi', 'Un worm', 'Un attacco DoS'],
          correct: 1,
          explain: `**Credential stuffing**: la coppia email e password rubata al sito di ricette è stata riprovata altrove. Un brute force richiede migliaia di tentativi; qui ne è bastato uno. Si evita con password diverse ovunque e con la MFA.`,
        },
      ],
      recap: [
        ['fattori', 'qualcosa che sai, che hai, che sei'],
        ['MFA', 'almeno due fattori di tipo DIVERSO'],
        ['chiave di sicurezza', 'il secondo fattore più forte: resiste al phishing'],
        ['password', 'lunghe, diverse per ogni servizio, in un gestore di password'],
        ['impronta (hash)', 'come si conservano le password: mai così come sono'],
        ['credential stuffing', 'password rubate altrove e riprovate'],
        ['joiner / mover / leaver', 'chi entra, chi cambia ruolo, chi esce'],
        ['account orfano', 'di una persona che non lavora più lì'],
        ['account di servizio', 'usato da un programma: potente e spesso dimenticato'],
      ],
    },

    // ------------------------------------------------------------------ F.5
    {
      id: 'chF-m5',
      title: 'Le regole del mestiere',
      tagline: 'Legge, autorizzazione, perimetro, privacy e gli standard che trovi negli annunci di lavoro.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'La differenza è un foglio firmato',
          body: `Le otto di sera. Il bar si riempie. Rook chiude la porta del retro e abbassa la voce.

@rook: Ultima cosa, e la più importante. Domani vai da Mama a fare il tuo primo lavoro sul campo. Prima devi sapere cosa ti separa da un criminale.

@nyx: Le **stesse identiche azioni** fanno di te un professionista oppure un imputato. La differenza non è la tecnica, e nemmeno l'intenzione. È un **foglio firmato**.

In Italia l'**articolo 615-ter del codice penale** punisce l'**accesso abusivo a un sistema informatico**: entrare, o restare, in un computer protetto senza il permesso di chi ne è responsabile. È reato **anche se**:
- la password era banale, o scritta su un foglietto attaccato allo schermo
- non hai toccato né copiato niente
- volevi solo "dare un'occhiata", o perfino avvisare il proprietario

Per lavorare servono quindi, **prima** di toccare qualsiasi cosa, tre documenti:
- un'**autorizzazione scritta**, firmata da chi ha davvero il potere di darla: il proprietario del sistema. Non "un amico che ci lavora"
- il **perimetro** (in inglese *scope*): l'elenco esatto di cosa puoi toccare. Tutto quello che non c'è scritto è **vietato**
- le **regole d'ingaggio**: in che orari, con quali tecniche, cosa fare se si rompe qualcosa, chi chiamare

!! Se durante un lavoro trovi un computer che non è nel perimetro, ti **fermi**. Anche se è palesemente vulnerabile. Lo segnali al cliente e aspetti.`,
        },
        {
          kind: 'task',
          title: 'Il contratto',
          body: `@rook: Un esempio vero, prima di quello di Mama. È un contratto che ho firmato il mese scorso con una clinica. Leggilo come se dovessi lavorarci tu domani.

\`\`\`
cat fondamenti/ingaggio.txt
\`\`\`

Dentro la rete autorizzata c'è **un indirizzo che non devi toccare per nessun motivo**. Quale? Invialo con \`flag\`.

(Un indirizzo è il "numero civico" di un computer in rete: quattro numeri separati da punti. Lo vedrai bene nel prossimo capitolo.)`,
          objective: 'Quale indirizzo è escluso dal perimetro?',
          hints: ['Leggi la sezione ESCLUSIONI.', 'flag 10.20.0.50'],
          answer: ['10.20.0.50'],
          success: `**10.20.0.50**: il macchinario per la dialisi. Sta **dentro** la rete autorizzata, ma è **escluso per iscritto**. Basta una prova un po' insistente per bloccare un apparecchio medico, e a quell'apparecchio è collegata una persona.

@nyx: Guarda anche il resto: un orario preciso, il divieto di attacchi che fermano i servizi, un numero da chiamare se qualcosa va storto. Un contratto serio li ha sempre tutti e tre. Se ne manca uno, prima di cominciare si chiede.`,
        },
        {
          kind: 'lesson',
          title: 'Quando trovi qualcosa da solo',
          body: `@nyx: Può capitare di notare una falla senza averla cercata. Un sito che, se cambi un numero nell'indirizzo, ti mostra i dati di un altro cliente. Un documento riservato che compare su un motore di ricerca.

La strada giusta si chiama **divulgazione responsabile**:
- **non** andare oltre. Non scaricare niente, non "provare" per vedere quanto è grave
- **segnalarlo in privato** al proprietario. Molte aziende hanno un indirizzo apposta
- **dargli il tempo** di correggere, prima di parlarne con chiunque

Alcune aziende invitano apertamente a cercare falle nei loro sistemi, con regole scritte e una ricompensa per chi ne trova: si chiamano programmi di **bug bounty**. Lì l'autorizzazione c'è: è il regolamento del programma. E vale la solita regola: si resta nel perimetro.

Nel mestiere sentirai parlare di **cappelli**, come nei vecchi film western:
- **white hat** (cappello bianco): lavora con l'autorizzazione, per migliorare la sicurezza
- **black hat** (nero): senza autorizzazione, per soldi o per fare danni
- **grey hat** (grigio): senza autorizzazione ma "a fin di bene". Per la legge, resta senza autorizzazione

E di **squadre**, a colori:
- **red team**: simula gli attaccanti
- **blue team**: difende e si accorge degli attacchi
- **purple team**: li fa lavorare insieme, perché ognuno impari dall'altro`,
        },
        {
          kind: 'lesson',
          title: 'Privacy: il GDPR in cinque minuti',
          body: `@nyx: Ti ricordi lo studio dei commercialisti di stamattina? È ora di chiudere quel caso.

Il **GDPR** è il regolamento europeo che protegge i **dati personali**. Non devi fare l'avvocato, ma devi sapere queste cose.

**Dato personale**: qualsiasi informazione su una persona che si può identificare. Nome, email, indirizzo di casa, targa, posizione, perfino l'indirizzo internet del suo computer.

**Dati particolari**: salute, religione, opinioni politiche, orientamento sessuale, impronte e volto. Vanno protetti ancora di più.

**Titolare**: chi decide perché e come si usano i dati (l'azienda). **Responsabile**: chi li usa per conto del titolare (un fornitore).

Due regole di base:
- si raccolgono **solo i dati che servono**, e si tengono **solo per il tempo che serve**
- chi li tiene deve **proteggerli** in modo adeguato al rischio

La parte che ti toccherà sul lavoro è la **violazione dei dati** (in inglese *data breach*): qualsiasi perdita di riservatezza, integrità o disponibilità di dati personali. Quando succede:
- l'azienda deve **avvisare il Garante della privacy entro 72 ore** da quando se ne accorge, a meno che sia improbabile un rischio per le persone
- se il rischio per le persone è **alto**, deve avvisare anche loro
- in ogni caso, deve **scriverla** in un registro interno

Per questo, in un incidente, l'ora in cui te ne accorgi va **annotata subito**: da lì parte il conto alla rovescia.

@nyx: Lo studio dei commercialisti ha spedito i redditi di 340 persone a un concorrente. Nessun hacker, ma è una violazione dei dati a tutti gli effetti. Hanno 72 ore.`,
        },
        {
          kind: 'lesson',
          title: 'Gli standard che trovi negli annunci',
          body: `@rook: L'ultima cosa la dico io. Quando cercherai lavoro, negli annunci troverai sempre le stesse sigle. Non devi saperle a memoria. Devi sapere **cosa sono**, e non fare la faccia di chi non le ha mai sentite.

**ISO/IEC 27001**: la regola internazionale per organizzare la sicurezza in un'azienda. Un'azienda può farsi **certificare**: un ente esterno controlla che la rispetti.

**NIST Cybersecurity Framework**: un modello americano, gratuito, usatissimo. Divide il lavoro di sicurezza in **sei funzioni**:
- **Govern**: decidere strategia, ruoli e regole
- **Identify**: sapere cosa si ha e quali rischi corre
- **Protect**: proteggerlo
- **Detect**: accorgersi degli attacchi
- **Respond**: reagire
- **Recover**: tornare alla normalità

**CIS Controls**: un elenco di cose da fare, in ordine di importanza. Le prime due: sapere quali computer hai e quali programmi ci girano. Non si protegge quello che non si sa di avere.

**OWASP Top 10**: i dieci problemi più comuni dei siti web. Lo vedrai nel capitolo sul web.

**NIS2**: una legge europea che obbliga le organizzazioni di settori importanti (energia, sanità, trasporti, servizi digitali e altri) a proteggersi e a segnalare gli incidenti.

E i lavori da cui si entra:
- **analista SOC di primo livello**: guarda gli allarmi, separa i falsi dai veri, apre gli incidenti. È la porta d'ingresso più comune
- **penetration tester junior**: cerca le falle, con un contratto, e scrive un rapporto
- **tecnico di sicurezza**: installa e mantiene le difese
- **GRC** (governo, rischio e conformità alle regole): analisi dei rischi, regole, verifiche. Poco terminale, molta scrittura

@rook: Fine della giornata. Parli la lingua dei clienti. Domattina alle nove, al bancone di Mama: ha un contratto per te.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Trovi per caso che il sito di un negozio mostra gli ordini di altri clienti cambiando un numero nell\'indirizzo. Qual è il comportamento corretto?',
          options: [
            'Scaricare tutti gli ordini per dimostrare quanto è grave',
            'Pubblicarlo subito sui social per avvisare i clienti',
            'Fermarsi e segnalarlo in privato al negozio',
            'Provare altre pagine per vedere cos\'altro è esposto',
          ],
          correct: 2,
          explain: `**Divulgazione responsabile**: ci si ferma e si segnala in privato. Scaricare dati altrui o esplorare oltre trasforma una scoperta casuale in un accesso abusivo, qualunque sia l'intenzione.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Entro quanto tempo il titolare deve notificare al Garante una violazione di dati personali che comporta un rischio per le persone?',
          options: ['24 ore', '72 ore', '7 giorni', '30 giorni'],
          correct: 1,
          explain: `**72 ore** da quando ne è venuto a conoscenza. Se la notifica arriva dopo, va spiegato il motivo del ritardo.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Il SOC nota un allarme e conferma che è in corso un\'intrusione. In quale funzione del NIST CSF rientra questa attività?',
          options: ['Identify', 'Protect', 'Detect', 'Recover'],
          correct: 2,
          explain: `Accorgersi di un incidente è **Detect** (rilevare). Subito dopo viene **Respond** (reagire), poi **Recover** (tornare alla normalità).`,
        },
      ],
      recap: [
        ['art. 615-ter c.p.', 'accesso abusivo a sistema informatico'],
        ['autorizzazione scritta', 'senza, non si tocca nulla'],
        ['perimetro (scope)', 'ciò che puoi toccare; il resto è vietato'],
        ['regole d\'ingaggio', 'orari, tecniche ammesse, chi chiamare se qualcosa si rompe'],
        ['divulgazione responsabile', 'segnalare in privato e dare tempo di correggere'],
        ['GDPR', 'dati personali; violazione da notificare al Garante entro 72 ore'],
        ['ISO/IEC 27001', 'standard certificabile per organizzare la sicurezza'],
        ['NIST CSF', 'Govern, Identify, Protect, Detect, Respond, Recover'],
        ['red / blue / purple team', 'attacco simulato, difesa, collaborazione'],
      ],
    },
  ],
};
