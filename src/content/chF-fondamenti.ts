import type { Chapter } from '../game/types';

// Fondamenti di sicurezza: il vocabolario e i modelli che ogni colloquio da junior dà per scontati.
// Poca tastiera, molta testa: si usano solo `cat` e `flag`.

export const CHF: Chapter = {
  id: 'chF',
  code: 'F',
  title: 'Fondamenti di sicurezza',
  subtitle: 'Le idee che reggono tutto il resto: CIA, rischio, minacce, identità, regole',
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
          title: 'Una ciotola di ramen',
          body: `@nyx: Siediti. Sai muovere due dita sul terminale, bene. Ma se domani un cliente ti chiede "cosa devo proteggere, e da cosa?", i comandi non ti bastano. Ti servono le parole giuste.

@nyx: Rook ha tre clienti nei guai da stamattina. Tre problemi che sembrano diversi. Prima di guardarli, ti insegno a metterli in ordine.

Chi lavora nella sicurezza non protegge "i computer". Protegge **informazioni** e **servizi**, e lo fa guardando sempre tre proprietà. Sono così importanti che hanno un nome: la **triade CIA** (dalle iniziali inglesi; niente a che fare con le spie).`,
        },
        {
          kind: 'lesson',
          title: 'La triade CIA',
          body: `**Riservatezza** (*Confidentiality*): l'informazione è vista **solo da chi ne ha diritto**.
- si rompe quando: un archivio clienti finisce online, qualcuno legge la posta di un collega, un portatile non cifrato viene rubato
- si difende con: permessi, cifratura, autenticazione

**Integrità** (*Integrity*): l'informazione è **esatta e non è stata alterata** da chi non doveva (o per errore).
- si rompe quando: qualcuno cambia un IBAN in una fattura, un voto in un registro, una riga in un log per coprire le tracce
- si difende con: impronte (hash), firme digitali, permessi di scrittura ristretti, registri delle modifiche

**Disponibilità** (*Availability*): l'informazione e il servizio **ci sono quando servono**.
- si rompe quando: un ransomware cifra i server, un attacco DoS intasa il sito, un disco si rompe e non c'è backup
- si difende con: backup, ridondanza, aggiornamenti, piani di ripristino

!! Un incidente può colpire più proprietà insieme. Un ransomware moderno prima **copia** i dati (riservatezza) e poi li **cifra** (disponibilità): si chiama doppia estorsione.

?? Le tre proprietà tirano in direzioni diverse. Un file chiuso in una cassaforte spenta è riservatissimo e del tutto indisponibile. Il mestiere è trovare l'equilibrio giusto **per quel cliente**: un ospedale mette al primo posto la disponibilità, uno studio legale la riservatezza, una banca l'integrità.`,
        },
        {
          kind: 'task',
          title: 'Il primo cliente',
          body: `Rook ti ha lasciato le tre segnalazioni di stamattina nella cartella \`fondamenti\`. Leggile:

\`\`\`
cat fondamenti/incidenti.txt
\`\`\`

Comincia dal **caso A**, la clinica. Quale delle tre proprietà è stata colpita? Rispondi con \`flag\` e il nome della proprietà.`,
          objective: 'Caso A: quale proprietà della triade è stata violata?',
          hints: [
            'I dati della clinica non sono stati rubati né modificati: semplicemente non si riescono più a usare.',
            'Quando un servizio non c\'è nel momento in cui serve, è la disponibilità: flag disponibilità',
          ],
          answer: ['disponibilità', 'disponibilita', 'availability', 'la disponibilità'],
          success: `**Disponibilità.** Le cartelle cliniche esistono ancora, nessuno le ha lette o cambiate, ma i medici non possono aprirle. Per una clinica è la proprietà più critica: senza dati, non si cura. La difesa numero uno qui si chiama **backup scollegato dalla rete**, provato davvero almeno una volta.`,
        },
        {
          kind: 'task',
          title: 'Il secondo cliente',
          body: `Ora il **caso B**, l'officina. Rileggi la segnalazione se serve. I soldi sono partiti verso il conto sbagliato: quale proprietà dell'informazione è venuta meno?`,
          objective: 'Caso B: quale proprietà è stata violata?',
          hints: ['La fattura è arrivata ed era leggibile. Ma un dato al suo interno non era più quello vero.', 'Un dato alterato da chi non doveva: flag integrità'],
          answer: ['integrità', 'integrita', 'integrity', 'l\'integrità'],
          success: `**Integrità.** La fattura c'era e nessun segreto è stato svelato: è stato **alterato un dato**, l'IBAN. È la truffa più redditizia contro le piccole aziende (in gergo *BEC*, Business Email Compromise). La difesa non è solo tecnica: una **telefonata di verifica** a un numero già noto prima di pagare un IBAN nuovo.`,
        },
        {
          kind: 'task',
          title: 'Il terzo cliente',
          body: `Infine il **caso C**, lo studio di commercialisti. Niente è stato cancellato, niente è stato cambiato. Eppure è un incidente serio. Quale proprietà?`,
          objective: 'Caso C: quale proprietà è stata violata?',
          hints: ['I dati sono finiti sotto gli occhi di qualcuno che non doveva vederli.', 'flag riservatezza'],
          answer: ['riservatezza', 'confidenzialità', 'confidenzialita', 'confidentiality', 'la riservatezza'],
          success: `**Riservatezza.** Un allegato sbagliato, un destinatario sbagliato: nessun hacker, solo un errore umano. E infatti la maggior parte delle violazioni di riservatezza nasce così. Dato che ci sono di mezzo dati personali, lo studio ha anche un obbligo di legge: lo vedremo nell'ultima missione di questo capitolo.`,
        },
        {
          kind: 'lesson',
          title: 'AAA: chi sei, cosa puoi, cosa hai fatto',
          body: `Per far rispettare la triade, ogni sistema serio risponde a tre domande. Si chiama modello **AAA**:

**Autenticazione** (*Authentication*): **chi sei?** Dimostri la tua identità con una password, un'impronta, una chiave.

**Autorizzazione** (*Authorization*): **cosa puoi fare?** Una volta riconosciuto, il sistema decide a cosa hai accesso. I permessi di Linux sono autorizzazione.

**Tracciamento** (*Accounting*, o *Auditing*): **cosa hai fatto?** Il sistema registra le azioni: sono i **log**. Senza log un'indagine non può nemmeno cominciare.

Sono tre cose distinte, e confonderle è un errore classico:
- entri in ufficio col badge → autenticazione
- il badge apre l'ufficio ma non la sala server → autorizzazione
- il sistema registra che sei entrato alle 08:52 → tracciamento

C'è un quarto concetto che troverai spesso: il **non ripudio**. Significa che chi ha compiuto un'azione **non può negare di averla compiuta**: una firma digitale lo garantisce, un account condiviso tra cinque persone lo distrugge.

?? Per questo gli account condivisi ("admin" usato da tutto l'ufficio) sono un problema di sicurezza anche se la password è robusta: nei log vedrai "admin", non una persona.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un utente entra correttamente con la sua password, ma quando prova ad aprire la cartella degli stipendi riceve "Permission denied". Quale meccanismo lo ha fermato?',
          options: ['L\'autenticazione', 'L\'autorizzazione', 'Il tracciamento', 'Il non ripudio'],
          correct: 1,
          explain: `L'autenticazione è andata bene (il sistema sa chi è). A fermarlo è stata l'**autorizzazione**: quell'identità non ha il permesso di aprire quella cartella.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Dopo un\'intrusione, l\'attaccante cancella le righe del log che mostrano i suoi accessi. Quale proprietà della triade ha colpito con QUESTA azione?',
          options: ['Riservatezza', 'Integrità', 'Disponibilità', 'Nessuna: i log non sono dati'],
          correct: 1,
          explain: `Ha **alterato** un'informazione che doveva restare fedele: è **integrità**. Per questo i log importanti si copiano subito su un altro sistema, dove chi entra nel server non può toccarli.`,
        },
      ],
      recap: [
        ['Riservatezza', 'solo chi ha diritto vede l\'informazione'],
        ['Integrità', 'l\'informazione è esatta e non alterata'],
        ['Disponibilità', 'informazione e servizio ci sono quando servono'],
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
          body: `@rook: Ho un cliente con quattro problemi e i soldi per risolverne uno. Vuole sapere quale. "Tutti" non è una risposta: è il modo più rapido per perdere il cliente.

@nyx: È la domanda vera di questo mestiere. Nessuno ha tempo e soldi infiniti. Si ragiona per **rischio**.

Quattro parole, da non confondere mai:

**Asset** (bene): qualcosa che ha valore e va protetto. Un archivio clienti, un server, la reputazione dell'azienda.

**Minaccia** (*threat*): qualcosa o qualcuno che **può** causare un danno. Un criminale, un dipendente scontento, un incendio, un errore.

**Vulnerabilità**: una **debolezza** che la minaccia può sfruttare. Un software non aggiornato, una password banale, una porta lasciata aperta, un dipendente non formato.

**Rischio**: la possibilità che una minaccia sfrutti una vulnerabilità e danneggi un asset.

L'immagine da tenere in testa: la **pioggia** è la minaccia, il **buco nel tetto** è la vulnerabilità, il **pavimento rovinato** è il danno. Senza pioggia il buco non fa danni; senza buco la pioggia nemmeno. Il rischio nasce quando si incontrano.`,
        },
        {
          kind: 'lesson',
          title: 'Misurare il rischio',
          body: `Il rischio si stima con due numeri:

\`\`\`
rischio = probabilità × impatto
\`\`\`

- **probabilità**: quanto è verosimile che succeda (da 1 = raro a 5 = quasi certo)
- **impatto**: quanto male fa se succede (da 1 = fastidio a 5 = l'azienda chiude)

Un esempio diverso da quello che ti aspetta. Un bar ha due problemi:
- il wifi dei clienti ha una password scritta sul muro: probabilità **5** che un estraneo lo usi, impatto **1** (è fatto apposta) → rischio **5**
- la cassa ha lo stesso wifi dei clienti: probabilità **2** che qualcuno ne approfitti, impatto **5** (rubano i dati delle carte) → rischio **10**

Il secondo problema è meno probabile ma **viene prima**. Con il rischio calcolato, i problemi si mettono in fila dal più alto al più basso: questo elenco si chiama **registro dei rischi**.

Per ogni rischio hai quattro scelte possibili (**trattamento del rischio**):
- **mitigare**: ridurlo con una contromisura (aggiornare, cifrare, formare)
- **trasferire**: farlo pagare a un altro (un'assicurazione, un fornitore)
- **evitare**: smettere di fare la cosa rischiosa (spegnere il servizio)
- **accettare**: decidere consapevolmente di tenerselo, perché ridurlo costa più del danno

!! Accettare un rischio è una decisione legittima, ma la prende **il cliente** (la direzione), informato e per iscritto. Mai il tecnico da solo, e mai per dimenticanza.`,
        },
        {
          kind: 'task',
          title: 'Il registro dei rischi',
          body: `Ecco il registro dei rischi del cliente di Rook, con probabilità e impatto già stimati:

\`\`\`
cat fondamenti/rischi.txt
\`\`\`

Calcola il rischio di ogni riga e trova quello **più alto**. Invia la sua sigla (per esempio \`flag R9\`).`,
          objective: 'Qual è il rischio più alto del registro?',
          hints: ['Moltiplica probabilità per impatto su ogni riga.', 'R1 = 12, R2 = 20, R3 = 5, R4 = 9.', 'flag R2'],
          answer: ['R2', 'r2'],
          success: `**R2**, con 20 su 25: un server esposto a Internet e non aggiornato è insieme probabile (i programmi automatici cercano macchine così a tutte le ore) e grave. Nota R3: l'allagamento avrebbe lo stesso impatto, ma è talmente raro da finire in fondo alla lista. È questo che il rischio ti permette di fare: **scegliere con un criterio**, non a sensazione.`,
        },
        {
          kind: 'lesson',
          title: 'I controlli',
          body: `Una contromisura si chiama **controllo**. I controlli si classificano in due modi, e ai colloqui li chiedono entrambi.

**Per momento in cui agiscono:**
- **preventivi**: impediscono l'incidente (firewall, cifratura, porta blindata, formazione)
- **rilevativi** (*detective*): si accorgono che sta succedendo o è successo (log, allarmi, antivirus, telecamere)
- **correttivi**: rimettono le cose a posto dopo (ripristino da backup, installazione di una patch)

**Per natura:**
- **tecnici**: fatti da hardware e software (permessi, MFA, firewall)
- **amministrativi**: regole e procedure (policy sulle password, formazione, contratti)
- **fisici**: nel mondo reale (serrature, badge, guardie)

Nessun controllo è perfetto. Per questo si applica la **difesa in profondità**: più strati diversi, uno dietro l'altro, così chi supera il primo trova il secondo. È la logica del castello: fossato, mura, torri, cassaforte.

Due principi che ritroverai in ogni capitolo:
- **minimo privilegio**: ognuno ha solo i permessi che gli servono per il suo lavoro, niente di più
- **separazione dei compiti**: le azioni delicate richiedono due persone (chi prepara il bonifico non è chi lo autorizza)

?? Il modello più recente si chiama **Zero Trust**: non ci si fida di nessuno solo perché "è dentro la rete". Ogni accesso si verifica ogni volta.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un\'azienda installa telecamere nella sala server. Che tipo di controllo è?',
          options: ['Tecnico e preventivo', 'Fisico e rilevativo', 'Amministrativo e correttivo', 'Fisico e correttivo'],
          correct: 1,
          explain: `Sta nel mondo reale, quindi è **fisico**; e non impedisce l'ingresso ma lo **rileva** e lo registra. (Una telecamera ben visibile ha anche un effetto dissuasivo, ma la sua funzione principale è rilevare.)`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Il cliente decide di stipulare una polizza assicurativa contro i danni da ransomware. Come sta trattando il rischio?',
          options: ['Lo mitiga', 'Lo evita', 'Lo trasferisce', 'Lo accetta'],
          correct: 2,
          explain: `Lo **trasferisce**: il danno economico ricade sull'assicurazione. Attenzione: la probabilità che l'attacco avvenga non cambia di una virgola, per questo la polizza non sostituisce i backup.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Uno stagista ha ricevuto i permessi di amministratore "così non ci disturba ogni volta". Quale principio è stato violato?',
          options: ['Difesa in profondità', 'Non ripudio', 'Minimo privilegio', 'Disponibilità'],
          correct: 2,
          explain: `**Minimo privilegio**: si danno solo i permessi necessari al compito. Se l'account dello stagista viene rubato con un phishing, l'attaccante si ritrova amministratore al primo colpo.`,
        },
      ],
      recap: [
        ['asset', 'ciò che ha valore e va protetto'],
        ['minaccia', 'chi o cosa può causare un danno'],
        ['vulnerabilità', 'la debolezza che la minaccia sfrutta'],
        ['rischio', 'probabilità × impatto'],
        ['trattamento', 'mitigare, trasferire, evitare, accettare'],
        ['controlli', 'preventivi, rilevativi, correttivi · tecnici, amministrativi, fisici'],
        ['difesa in profondità', 'più strati di protezione diversi'],
        ['minimo privilegio', 'solo i permessi che servono'],
      ],
    },

    // ------------------------------------------------------------------ F.3
    {
      id: 'chF-m3',
      title: 'Chi c\'è là fuori',
      tagline: 'Chi attacca, perché, e le famiglie di attacchi che un analista deve riconoscere.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Conosci chi hai davanti',
          body: `@nyx: Un cliente mi ha chiesto: "ma chi vuoi che attacchi proprio me, che vendo occhiali?". È la domanda sbagliata. Quasi nessuno sceglie la vittima: si lanciano le reti e si tira su quello che c'è.

Chi attacca si chiama **attore di minaccia** (*threat actor*). Sapere chi è aiuta a capire cosa vuole e quanto insisterà:

- **criminalità organizzata**: vuole **soldi**. Ransomware, truffe, furto di carte. È di gran lunga la minaccia più comune per le aziende normali.
- **gruppi legati a Stati** (in gergo *APT*, Advanced Persistent Threat): vogliono **informazioni** o sabotare. Pazienti, ben finanziati, restano nascosti per mesi.
- **interni** (*insider*): un dipendente o ex dipendente. Può essere **malintenzionato** oppure, molto più spesso, **negligente**: clicca, sbaglia, perde.
- **hacktivisti**: agiscono per una **causa**. Siti oscurati, dati pubblicati per protesta.
- **dilettanti** (*script kiddie*): usano strumenti scritti da altri, senza capirli. Poco abili, ma numerosi e rumorosi.

!! L'attaccante non ha bisogno di essere bravo: ha bisogno che **tu** abbia lasciato qualcosa aperto. La maggior parte degli incidenti reali sfrutta errori banali, non tecniche da film.`,
        },
        {
          kind: 'lesson',
          title: 'Il malware e le sue famiglie',
          body: `**Malware** vuol dire "software malevolo". Le famiglie si distinguono per **come si diffondono** e per **cosa fanno**:

- **virus**: si attacca a un file e si diffonde quando qualcuno lo apre
- **worm**: si diffonde **da solo** in rete, senza intervento umano
- **trojan**: si finge un programma utile (un gioco, una fattura) e nasconde altro
- **ransomware**: cifra i dati e chiede un riscatto
- **spyware / keylogger**: spia; il keylogger registra i tasti premuti, password comprese
- **rootkit**: si nasconde in profondità nel sistema per non farsi trovare
- **backdoor**: una porta di servizio lasciata per rientrare quando si vuole
- **botnet**: tanti computer infetti comandati insieme da lontano
- **cryptominer**: usa il tuo processore per produrre criptovaluta per qualcun altro

Un programma reale ne combina spesso diverse: arriva come trojan in un allegato, installa una backdoor, e settimane dopo scarica il ransomware.

?? Come ci si accorge di un cryptominer? Il computer è lento e la ventola gira sempre. Lo incontrerai davvero, in un caso del capitolo sull'analisi dei log.`,
        },
        {
          kind: 'lesson',
          title: 'Ingannare le persone',
          body: `L'**ingegneria sociale** (*social engineering*) attacca la persona invece del computer. Funziona perché sfrutta reazioni normali: fretta, paura, cortesia, rispetto dell'autorità.

- **phishing**: un messaggio finto che spinge a cliccare, aprire un allegato o dare una password
- **spear phishing**: phishing **su misura** per una persona precisa, con dettagli veri su di lei
- **whaling**: spear phishing contro i dirigenti
- **smishing** e **vishing**: lo stesso via **SMS** e per **telefono**
- **pretexting**: inventarsi un ruolo credibile ("sono il tecnico della banca")
- **tailgating**: entrare in un edificio accodandosi a chi ha il badge
- **BEC**: fingersi il capo o un fornitore per far partire un bonifico

I segnali sono quasi sempre gli stessi: **urgenza**, una **minaccia** o un **premio**, la richiesta di **uscire dalla procedura normale** ("solo per questa volta"), un mittente che somiglia a quello vero ma non lo è.

Altre famiglie di attacchi di cui devi conoscere il nome:
- **attacchi alle password**: tentativi a ripetizione (*brute force*), poche password comuni provate su tanti utenti (*password spraying*), credenziali rubate altrove e riprovate (*credential stuffing*)
- **DoS / DDoS**: sommergere un servizio di richieste finché smette di rispondere; "distribuito" se parte da migliaia di macchine
- **man-in-the-middle**: mettersi in mezzo a una comunicazione per leggerla o alterarla
- **attacchi alla filiera** (*supply chain*): colpire un fornitore per arrivare ai suoi clienti`,
        },
        {
          kind: 'lesson',
          title: 'Le fasi di un attacco',
          body: `Un attacco non è un istante: è una **sequenza di passi**. Il modello più noto è la **Cyber Kill Chain**, in sette fasi:

- **1. Ricognizione**: raccogliere informazioni sul bersaglio
- **2. Preparazione** (*weaponization*): costruire lo strumento, per esempio un documento con dentro il malware
- **3. Consegna** (*delivery*): farlo arrivare, quasi sempre per email
- **4. Sfruttamento** (*exploitation*): la vulnerabilità viene usata, il codice parte
- **5. Installazione**: il malware si sistema per restare (persistenza)
- **6. Comando e controllo** (*C2*): il computer infetto contatta l'attaccante e aspetta ordini
- **7. Azioni sull'obiettivo**: rubare, cifrare, distruggere

Perché ti serve: **ogni fase è un'occasione per fermarlo**. Chi attacca deve riuscire in tutte; a chi difende basta spezzare la catena in un punto.
- la formazione ferma la consegna
- gli aggiornamenti fermano lo sfruttamento
- il controllo delle connessioni in uscita ferma il comando e controllo

?? Più avanti userai un modello più dettagliato, **MITRE ATT&CK**, che elenca le tecniche concrete fase per fase. La Kill Chain è la mappa, ATT&CK è lo stradario.`,
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
          explain: `È phishing su misura (**spear phishing**) rivolto a un dirigente: si chiama **whaling**, "caccia alla balena". I dettagli veri servono a far abbassare la guardia, e spesso vengono da fonti pubbliche.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un PC infetto contatta ogni 60 secondi un server sconosciuto su Internet. In quale fase della Kill Chain ci troviamo?',
          options: ['Ricognizione', 'Consegna', 'Comando e controllo', 'Preparazione'],
          correct: 2,
          explain: `Il malware "telefona a casa" per ricevere ordini: è la fase di **comando e controllo** (C2). Quel contatto regolare si chiama *beacon*, ed è uno dei segnali che un analista impara a cercare nel traffico di rete.`,
        },
      ],
      recap: [
        ['attori di minaccia', 'criminali, Stati (APT), interni, hacktivisti, dilettanti'],
        ['malware', 'virus, worm, trojan, ransomware, spyware, rootkit, backdoor, botnet'],
        ['ingegneria sociale', 'phishing, spear phishing, whaling, smishing, vishing, pretexting, BEC'],
        ['attacchi alle password', 'brute force, password spraying, credential stuffing'],
        ['DoS / DDoS', 'sommergere un servizio di richieste'],
        ['Kill Chain', 'ricognizione, preparazione, consegna, sfruttamento, installazione, C2, azioni'],
      ],
    },

    // ------------------------------------------------------------------ F.4
    {
      id: 'chF-m4',
      title: 'Dimostra chi sei',
      tagline: 'Fattori di autenticazione, MFA, password fatte bene e ciclo di vita degli account.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'La porta d\'ingresso',
          body: `@rook: Lo studio dentistico di via Kabuki è stato svuotato stanotte. Nessuna finestra rotta, nessun allarme: sono entrati con un account valido. Voglio sapere quale, e perché era così facile.

@nyx: Oggi gli attaccanti non "bucano": **entrano con le credenziali di qualcuno**. L'identità è il nuovo perimetro.

Ci si autentica dimostrando una o più di queste cose, dette **fattori**:

- **qualcosa che sai**: password, PIN, risposta segreta
- **qualcosa che hai**: il telefono con l'app dei codici, una chiavetta di sicurezza, una smart card
- **qualcosa che sei**: impronta, volto, iride (biometria)

L'**autenticazione a più fattori** (**MFA**, o 2FA quando sono due) ne chiede almeno **due di tipo diverso**. È la singola misura che ferma più attacchi in assoluto: rubare una password non basta più.

!! Password + domanda segreta **non** è MFA: sono due cose "che sai". Devono essere due categorie diverse.

Non tutti i secondi fattori sono uguali, dal più debole al più forte:
- codice via **SMS**: meglio di niente, ma il numero si può dirottare
- codice dell'**app** (TOTP, cambia ogni 30 secondi): buono
- **notifica** da approvare: comoda, ma chi viene bombardato di richieste a volte approva per sfinimento
- **chiave di sicurezza fisica** (FIDO2, passkey): la migliore, resiste anche al phishing`,
        },
        {
          kind: 'lesson',
          title: 'Password fatte bene',
          body: `Le regole sono cambiate rispetto a quelle che ti hanno insegnato. Le linee guida attuali (NIST) dicono:

- **la lunghezza conta più della complessità**: \`cavallo-batteria-graffetta-corretto\` è più robusta di \`P@ssw0rd!\`, ed è più facile da ricordare
- **una password diversa per ogni servizio**: così un furto non apre tutte le porte
- **un gestore di password** (*password manager*) per ricordarle: tu ne ricordi una sola, lunga
- **niente cambio obbligato ogni tre mesi**: produce solo \`Estate2077!\` seguita da \`Autunno2077!\`. Si cambia quando c'è il sospetto che sia stata rubata
- **controllo contro le password già note**: quelle finite in furti precedenti vanno rifiutate

Perché una password diversa ovunque? Per il **credential stuffing**: quando un sito viene violato, le coppie email e password finiscono in vendita, e dei programmi le provano in automatico su posta, banca, social. Se la riusi, cadono tutti insieme.

Come le conserva un sistema fatto bene: **mai in chiaro**. Salva solo l'**impronta** (hash), calcolata insieme a un valore casuale diverso per ogni utente, il **sale** (*salt*). Così due utenti con la stessa password hanno impronte diverse, e chi ruba l'archivio non può usare tabelle già pronte. Lo vedrai all'opera nel capitolo sulla crittografia.

?? Se un sito ti rimanda la tua vecchia password per email quando clicchi "password dimenticata", la sta conservando in chiaro. Un sito serio può solo fartela **reimpostare**.`,
        },
        {
          kind: 'lesson',
          title: 'La vita di un account',
          body: `Un account nasce, cambia e deve morire. Gli incidenti nascono quasi sempre nell'ultima fase.

- **ingresso** (*joiner*): la persona arriva, riceve un account con i permessi del suo ruolo, non di più
- **cambio di ruolo** (*mover*): si aggiungono i permessi nuovi **e si tolgono i vecchi**. Se non lo si fa, dopo dieci anni un dipendente ha accesso a tutto: si chiama *accumulo dei privilegi*
- **uscita** (*leaver*): l'account si **disattiva il giorno stesso**

Tre tipi di account da tenere d'occhio in ogni audit:
- **account orfani**: di persone che non lavorano più lì
- **account di servizio**: usati dai programmi, non dalle persone. Spesso hanno molti poteri, password che non scade mai e nessuna MFA
- **account amministrativi**: vanno usati solo per amministrare. Chi amministra ha **due** account: uno normale per posta e web, uno privilegiato per i lavori delicati

Un ultimo termine: **SSO** (*Single Sign-On*). Entri una volta e accedi a tutti i servizi dell'azienda. È comodo e, fatto bene, più sicuro (una sola porta da difendere, con MFA). Ma se quella porta cede, cedono tutte.`,
        },
        {
          kind: 'task',
          title: 'L\'account sbagliato',
          body: `Rook ha ottenuto dallo studio l'elenco degli account, con ruolo, MFA e data dell'ultimo cambio password:

\`\`\`
cat fondamenti/accessi.txt
\`\`\`

Uno di questi account era la porta perfetta: molti poteri, nessun secondo fattore, password vecchissima. Invia il suo nome con \`flag\`.`,
          objective: 'Quale account era il più esposto?',
          hints: [
            'Cerca tra gli account con ruolo di amministratore quello senza MFA.',
            'Guarda anche la data della password: una è del 2071.',
            'flag svc.backup',
          ],
          answer: ['svc.backup'],
          success: `**svc.backup**: un account di servizio con poteri da amministratore, senza MFA, con una password che nessuno cambia da sei anni e, a giudicare dalla nota, conosciuta dal vecchio fornitore. Nessuna persona lo usa ogni giorno, quindi nessuno si accorge se entra qualcun altro. È il ritratto dell'account che gli attaccanti cercano per primo.

Nota anche \`l.conti\`: ha lasciato lo studio, ma l'account è ancora attivo. Un **account orfano**.`,
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
          explain: `Servono fattori di **categorie diverse**: la password è qualcosa che **sai**, il telefono è qualcosa che **hai**. Password e PIN sono due cose che sai; impronta e volto due cose che sei.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un sito di ricette viene violato. Una settimana dopo, qualcuno entra nella posta aziendale di un dipendente al primo tentativo. Cosa è successo, con ogni probabilità?',
          options: ['Un attacco brute force', 'Credential stuffing: usava la stessa password su entrambi', 'Un worm', 'Un attacco DoS'],
          correct: 1,
          explain: `**Credential stuffing**: la coppia email e password rubata al sito di ricette è stata riprovata altrove. Un brute force richiede migliaia di tentativi; qui ne è bastato uno. Si evita con password diverse e MFA.`,
        },
      ],
      recap: [
        ['fattori', 'qualcosa che sai, che hai, che sei'],
        ['MFA', 'almeno due fattori di tipo DIVERSO'],
        ['password', 'lunghe, diverse per ogni servizio, in un gestore di password'],
        ['hash + sale', 'come si conservano le password: mai in chiaro'],
        ['credential stuffing', 'password rubate altrove e riprovate'],
        ['joiner / mover / leaver', 'il ciclo di vita di un account'],
        ['account di servizio', 'usati dai programmi: potenti e spesso dimenticati'],
        ['SSO', 'un solo accesso per tutti i servizi'],
      ],
    },

    // ------------------------------------------------------------------ F.5
    {
      id: 'chF-m5',
      title: 'Le regole del mestiere',
      tagline: 'Legge, autorizzazione, perimetro, privacy e gli standard che troverai negli annunci di lavoro.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'La differenza è un foglio firmato',
          body: `@nyx: Te lo dico una volta, e poi ogni volta che servirà. Le stesse identiche azioni fanno di te un professionista oppure un imputato. La differenza non è la tecnica, e nemmeno l'intenzione. È un **foglio firmato**.

In Italia l'**articolo 615-ter del codice penale** punisce l'**accesso abusivo a un sistema informatico**: entrare o restare in un sistema protetto contro la volontà di chi ne ha il diritto. Vale anche se:
- la password era banale, o scritta su un foglietto
- non hai toccato né copiato nulla
- volevi "solo dare un'occhiata" o avvisare il proprietario

Altri reati vicini: detenere o diffondere abusivamente codici di accesso, danneggiare dati e sistemi, intercettare comunicazioni.

Per lavorare servono quindi, **prima** di toccare qualsiasi cosa:
- un'**autorizzazione scritta** di chi ha davvero il potere di darla (il proprietario del sistema, non "un amico che ci lavora")
- un **perimetro** (*scope*): l'elenco esatto di cosa puoi toccare. Tutto ciò che non è scritto è **vietato**
- le **regole d'ingaggio**: orari, tecniche ammesse e vietate, cosa fare se qualcosa si rompe, chi chiamare

!! Se durante un lavoro trovi un sistema che non è nel perimetro, ti fermi. Anche se è palesemente vulnerabile. Lo segnali al cliente e aspetti.`,
        },
        {
          kind: 'task',
          title: 'Il contratto',
          body: `Rook ha un lavoro nuovo: un controllo di sicurezza per una clinica. Prima di qualsiasi cosa, leggi le regole d'ingaggio:

\`\`\`
cat fondamenti/ingaggio.txt
\`\`\`

Dentro la rete autorizzata c'è **un indirizzo che non devi toccare per nessun motivo**. Quale? Invialo con \`flag\`.`,
          objective: 'Quale indirizzo è escluso dal perimetro?',
          hints: ['Leggi la sezione ESCLUSIONI.', 'flag 10.20.0.50'],
          answer: ['10.20.0.50'],
          success: `**10.20.0.50**, il macchinario per la dialisi. Sta dentro la rete autorizzata, ma è **escluso in modo esplicito**: anche una semplice scansione può bloccare un apparecchio medico, e lì c'è collegata una persona.

Nota anche le altre regole: una finestra oraria, il divieto di attacchi che mettono fuori servizio, un numero da chiamare se qualcosa va storto. Un contratto serio ha sempre tutti e tre.`,
        },
        {
          kind: 'lesson',
          title: 'Quando trovi qualcosa da solo',
          body: `Può capitare di notare una falla senza averla cercata: un sito che mostra i dati di un altro utente, un documento riservato indicizzato da un motore di ricerca.

La strada corretta si chiama **divulgazione responsabile** (*responsible disclosure*, o *coordinated disclosure*):
- **non** approfondire, non scaricare dati, non "dimostrare" la falla andando oltre
- segnalare in privato al proprietario (molte aziende hanno un indirizzo dedicato o un file \`security.txt\` sul sito)
- dare il tempo di correggere prima di parlarne pubblicamente

Alcune aziende invitano apertamente a cercare falle, con regole scritte e una ricompensa: sono i programmi di **bug bounty**. Lì l'autorizzazione c'è, ed è il regolamento del programma. Vale la solita regola: si resta dentro il perimetro dichiarato.

Tre colori che sentirai nominare:
- **white hat**: lavora con autorizzazione, per migliorare la sicurezza
- **black hat**: agisce senza autorizzazione, per profitto o danno
- **grey hat**: senza autorizzazione ma "a fin di bene". Per la legge resta senza autorizzazione

E le squadre: il **red team** simula l'attaccante, il **blue team** difende e rileva, il **purple team** li fa lavorare insieme perché ognuno impari dall'altro.`,
        },
        {
          kind: 'lesson',
          title: 'Privacy: il GDPR in cinque minuti',
          body: `Il **GDPR** è il regolamento europeo sulla protezione dei dati personali. Un junior non deve fare l'avvocato, ma deve sapere questo:

- **dato personale**: qualsiasi informazione che riguarda una persona identificabile. Nome, email, indirizzo IP, targa, posizione
- **categorie particolari**: salute, opinioni politiche, religione, orientamento sessuale, dati biometrici. Richiedono protezioni più forti
- **titolare del trattamento**: chi decide perché e come si usano i dati (l'azienda). **Responsabile**: chi li tratta per conto del titolare (un fornitore)
- **minimizzazione**: si raccolgono solo i dati che servono, e si tengono solo per il tempo che serve
- **sicurezza**: chi tratta dati deve proteggerli con misure adeguate al rischio

La parte che ti toccherà sul lavoro è la **violazione dei dati** (*data breach*): una perdita di riservatezza, integrità o disponibilità di dati personali. Quando accade:
- il titolare deve **notificarla al Garante per la protezione dei dati personali entro 72 ore** da quando ne viene a conoscenza, salvo che sia improbabile un rischio per le persone
- se il rischio per le persone è **elevato**, vanno avvisate anche loro
- ogni violazione va comunque **documentata** in un registro interno

Per questo, in un incidente, l'ora in cui te ne accorgi va **scritta subito**: da lì parte l'orologio.

?? Ricordi il caso C, lo studio che ha spedito l'elenco clienti al destinatario sbagliato? È un data breach a tutti gli effetti, anche senza nessun attaccante.

Un'altra sigla che incontrerai: **NIS2**, la direttiva europea che impone misure di sicurezza e obblighi di segnalazione degli incidenti alle organizzazioni di settori importanti (energia, sanità, trasporti, servizi digitali e altri).`,
        },
        {
          kind: 'lesson',
          title: 'Gli standard che trovi negli annunci',
          body: `Negli annunci di lavoro compaiono sempre le stesse sigle. Non devi conoscerle a memoria, devi sapere **cosa sono**.

**ISO/IEC 27001**: lo standard internazionale per gestire la sicurezza delle informazioni in un'organizzazione. Un'azienda può farsi **certificare**. Parla di processi, rischi e controlli, non di singoli strumenti.

**NIST Cybersecurity Framework** (CSF): un modello americano, gratuito e molto usato, che organizza tutto il lavoro di sicurezza in **sei funzioni**:
- **Govern** (governare): strategia, ruoli, regole
- **Identify** (identificare): sapere cosa si ha e quali rischi corre
- **Protect** (proteggere): le misure preventive
- **Detect** (rilevare): accorgersi degli incidenti
- **Respond** (rispondere): contenerli e gestirli
- **Recover** (ripristinare): tornare alla normalità

**CIS Controls**: un elenco pratico di controlli in ordine di priorità. I primi due sono: fare l'inventario dei dispositivi e l'inventario del software. Non si protegge ciò che non si sa di avere.

**OWASP Top 10**: i dieci rischi più comuni delle applicazioni web. Lo ritroverai nel capitolo sul web.

**MITRE ATT&CK**: il catalogo delle tattiche e tecniche usate dagli attaccanti reali.

E i ruoli da cui si entra nel settore:
- **analista SOC di primo livello**: guarda gli allarmi, distingue i falsi dai veri, apre gli incidenti. È la porta d'ingresso più comune
- **penetration tester junior**: cerca le falle, con un contratto, e scrive il report
- **tecnico di sicurezza / sistemista**: configura e mantiene le difese
- **GRC** (governance, rischio e conformità): regole, analisi dei rischi, audit. Poco terminale, molta scrittura`,
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
          explain: `Accorgersi di un incidente è **Detect** (rilevare). Subito dopo viene **Respond** (contenerlo e gestirlo), poi **Recover** (ripristinare).`,
        },
      ],
      recap: [
        ['art. 615-ter c.p.', 'accesso abusivo a sistema informatico'],
        ['autorizzazione scritta', 'senza, non si tocca nulla'],
        ['perimetro (scope)', 'ciò che puoi toccare; il resto è vietato'],
        ['divulgazione responsabile', 'segnalare in privato e dare tempo di correggere'],
        ['GDPR', 'dati personali; data breach da notificare al Garante entro 72 ore'],
        ['ISO/IEC 27001', 'standard certificabile per gestire la sicurezza'],
        ['NIST CSF', 'Govern, Identify, Protect, Detect, Respond, Recover'],
        ['red / blue / purple team', 'attacco simulato, difesa, collaborazione'],
      ],
    },
  ],
};
