import type { Chapter, Mission } from '../game/types';

// Gestione degli incidenti (NIST SP 800-61) e basi di analisi forense.
// Si lavora su copie e su esportazioni: l'analista osserva, misura, documenta.

const readOf = (end: string) => (ev: { type: string; path?: string }) => ev.type === 'read' && (ev.path ?? '').endsWith(end);

export const IR_MISSION: Mission = {
  id: 'ch08-m5',
  title: 'L\'incidente, dall\'inizio alla fine',
  tagline: 'Il ciclo di gestione degli incidenti: rilevare, analizzare, contenere, eradicare, ripristinare, imparare.',
  xp: 350,
  steps: [
    {
      kind: 'lesson',
      title: 'Le due di notte',
      body: `@nyx: 02:31. Il SIEM ha acceso un allarme sul server web di Kiroshi Ottiche: un processo di \`www-data\` parla con l'esterno. Il reperibile sei tu.

@nyx: Un incidente non si gestisce a istinto. Si segue un ciclo, sempre lo stesso, che ti impedisce di dimenticare passi quando l'adrenalina è alta. Il più usato è quello del **NIST** (documento SP 800-61), in quattro fasi:

- **1. Preparazione**: tutto ciò che si fa **prima**. Procedure scritte, contatti, strumenti pronti, log attivi, backup provati. Se manca, nelle fasi dopo si improvvisa
- **2. Rilevamento e analisi**: capire se è davvero un incidente, quanto è grave, cosa è successo e dove
- **3. Contenimento, eradicazione e ripristino**: fermare il danno, togliere l'attaccante, tornare alla normalità
- **4. Attività post-incidente**: la riunione sulle **lezioni apprese** e il report. Ciò che si impara torna nella preparazione

?? Un altro modello molto citato è quello SANS in sei passi (PICERL: Preparation, Identification, Containment, Eradication, Recovery, Lessons learned). Sono la stessa idea divisa in modo diverso: ai colloqui va bene citarne uno qualsiasi, purché tu sappia spiegarlo.`,
    },
    {
      kind: 'lesson',
      title: 'Evento, allarme, incidente',
      body: `Tre parole che al SOC non sono sinonimi:
- **evento**: qualsiasi cosa osservabile. Un login, una richiesta web, un file creato. Milioni al giorno
- **allarme** (*alert*): un evento (o una serie) che una regola ha giudicato sospetto. Può essere un **falso positivo**
- **incidente**: un evento che **viola** (o minaccia concretamente) la sicurezza: dati esposti, sistema compromesso, servizio fermo

Il primo lavoro dell'analista è il **triage**: decidere in fretta se l'allarme è vero, e quanto è grave. La gravità si stima da:
- **impatto funzionale**: il servizio è fermo, rallentato, intatto?
- **impatto sui dati**: dati personali, segreti aziendali, nulla?
- **recuperabilità**: si torna alla normalità in ore, giorni, o mai?
- **estensione**: una macchina o molte? l'attaccante è ancora dentro?

Esempio diverso dal tuo caso: un antivirus blocca un allegato prima che venga aperto. È un evento interessante, forse un allarme, **non** un incidente: nessuna violazione è avvenuta. Si registra e si chiude.

!! Dal momento in cui dichiari un incidente, **scrivi tutto con l'ora**: cosa hai visto, cosa hai fatto, chi hai avvisato. Quel diario diventa il report, e a volte una prova in tribunale.`,
    },
    {
      kind: 'task',
      title: 'L\'allarme',
      body: `Leggi l'allarme del SIEM:

\`\`\`
cat ir/allarme.txt
\`\`\``,
      objective: 'Leggi l\'allarme.',
      hints: ['cat ir/allarme.txt'],
      check: readOf('ir/allarme.txt'),
      success: `Un processo dell'utente del server web (\`www-data\`) ha aperto una connessione verso un IP esterno, su una porta insolita. Il server web non dovrebbe **mai** iniziare connessioni verso Internet da solo. È quasi certamente un incidente. Ora serve capire **come** è successo.`,
    },
    {
      kind: 'lesson',
      title: 'La linea del tempo',
      body: `Lo strumento più potente dell'analisi è la **timeline**: tutti gli eventi di tutte le fonti, messi in un'unica fila in ordine di tempo. Da lì la storia si legge da sola.

Il trucco: se ogni riga dei log inizia con la data in formato **ISO** (\`2077-11-14 02:14:07\`), l'ordine alfabetico coincide con l'ordine di tempo. Quindi basta unire i file e ordinarli:

\`\`\`
cat fonte1.log fonte2.log | sort
\`\`\`

Esempio diverso dal tuo caso: per unire tutti i log di una cartella e vedere solo quelli di un certo indirizzo:

\`\`\`
cat logs/*.log | sort | grep 10.0.0.7
\`\`\`

!! Prima di unire log di macchine diverse, verifica che abbiano lo **stesso fuso orario** e orologi sincronizzati (NTP). Un'ora di differenza ribalta la storia.`,
    },
    {
      kind: 'task',
      title: 'Unisci le fonti',
      body: `In \`ir/\` ci sono tre esportazioni: il log del server web, quello degli accessi e quello dei processi. Mettile in un'unica linea del tempo e cerca il primo evento che coinvolge l'indirizzo dell'allarme.

Qual è l'**ora** (\`HH:MM:SS\`) del primo contatto di quell'indirizzo con il server? Inviala con \`flag\`.`,
      objective: 'A che ora l\'attaccante ha contattato il server per la prima volta?',
      hints: ['Unisci e ordina: cat ir/*.log | sort', 'Poi filtra l\'IP dell\'allarme: cat ir/*.log | sort | grep 198.51.100.23', 'flag 02:09:41'],
      answer: ['02:09:41', '2077-11-14 02:09:41'],
      success: `**02:09:41**: ventidue minuti prima dell'allarme, e non sul processo sospetto ma sul **sito web**. La linea del tempo racconta: prima l'esplorazione del sito, poi un caricamento, poi il comando. Andiamo a vedere quale pagina ha usato.`,
    },
    {
      kind: 'task',
      title: 'La porta d\'ingresso',
      body: `Guarda le richieste dell'attaccante al server web. Ha **caricato** qualcosa (una richiesta POST) e poi l'ha richiamato più volte.

Qual è il percorso del file che ha poi usato per eseguire comandi? Invialo con \`flag\`.`,
      objective: 'Quale file caricato è stato usato per eseguire comandi?',
      hints: ['grep 198.51.100.23 ir/web.log', 'Il file sta nella cartella degli upload e viene chiamato con ?cmd=: flag /uploads/avatar.php'],
      answer: ['/uploads/avatar.php', 'uploads/avatar.php', 'avatar.php'],
      success: `**/uploads/avatar.php**: il modulo per caricare la foto profilo accettava anche file \`.php\`, e il server li eseguiva. L'attaccante ha caricato una **web shell**: una pagina che esegue i comandi passati nell'indirizzo (\`?cmd=...\`).

Nella OWASP Top 10 è una combinazione di **A04** (progettazione: nessun controllo sul tipo di file) e **A05** (configurazione: la cartella degli upload non dovrebbe mai eseguire codice).`,
    },
    {
      kind: 'task',
      title: 'Ha lasciato qualcosa?',
      body: `Un attaccante che entra vuole poter **rientrare**: è la **persistenza**. Nel log dei processi c'è una modifica alle attività programmate.

\`\`\`
grep -i cron ir/processi.log
\`\`\`

Quale file ha aggiunto per far ripartire il suo programma? Invia il percorso con \`flag\`.`,
      objective: 'Quale file di persistenza è stato creato?',
      hints: ['grep -i cron ir/processi.log', 'flag /etc/cron.d/php-sess'],
      answer: ['/etc/cron.d/php-sess'],
      success: `**/etc/cron.d/php-sess**: un nome scelto per sembrare un file di sistema che pulisce le sessioni PHP. Ogni 10 minuti rilancia il programma che si collega all'esterno. Se ti fossi limitato a uccidere il processo, sarebbe tornato da solo dieci minuti dopo.`,
    },
    {
      kind: 'lesson',
      title: 'Contenere, eradicare, ripristinare',
      body: `Ora sai abbastanza per agire. Tre passi, in quest'ordine.

**Contenimento**: impedire che il danno si allarghi, **senza distruggere le prove**.
- a breve termine: **isolare** la macchina dalla rete (porta dello switch, regola del firewall, isolamento dall'EDR). Non spegnerla: la memoria contiene processi, connessioni e chiavi che con lo spegnimento si perdono
- bloccare gli IOC: IP e domini dell'attaccante sul firewall
- se ci sono credenziali esposte (la password del database stava sul server?), cambiarle
- **prima** di cambiare troppe cose: fare le copie forensi (memoria, disco). Lo vedrai nel prossimo capitolo

**Eradicazione**: togliere tutto ciò che l'attaccante ha lasciato. Web shell, file di persistenza, programmi, account creati. E **chiudere la porta** da cui è entrato: senza correggere il modulo di upload, rientrerà domani.

**Ripristino**: tornare in servizio in sicurezza. Spesso conviene **reinstallare** da un'immagine pulita invece di "ripulire": non sai mai se hai trovato tutto. Poi si ripristinano i dati da un backup **precedente** alla compromissione e si tiene la macchina sotto osservazione più stretta per qualche settimana.

!! Avvisare l'attaccante è un rischio: se si accorge di essere stato scoperto prima che tu l'abbia contenuto, può cancellare le tracce o fare danni. Per questo contenimento ed eradicazione si pianificano e si eseguono rapidamente, tutti insieme.`,
    },
    {
      kind: 'task',
      title: 'Il report',
      body: `@nyx: Sono le 05:00, il server è isolato, i file dell'attaccante sono stati copiati come prova e rimossi. Ora il report per il cliente. Ti ho preparato lo schema in \`ir/report.md\`: aprilo con l'editor e completa almeno la sezione **Causa**, scrivendo come è entrato l'attaccante (deve comparire la parola \`upload\`).

\`\`\`
nano ir/report.md
\`\`\``,
      objective: 'Completa la sezione Causa del report e salvalo.',
      hints: ['nano ir/report.md', 'Sotto "## Causa" scrivi per esempio: il modulo di upload della foto profilo accettava file PHP, poi premi Salva.'],
      check: (ev, sh) => {
        if (ev.type !== 'saved' || !ev.path.endsWith('ir/report.md')) return false;
        const n = sh.fs.get(ev.path);
        return !!n && n.type === 'file' && /##\s*causa[\s\S]*upload/i.test(n.content);
      },
      success: `Un report di incidente ha sempre: **sintesi** per la direzione (tre righe, niente gergo), **cronologia** con gli orari, **causa** (come sono entrati), **impatto** (cosa hanno visto o preso), **azioni** fatte, **raccomandazioni** per evitare che si ripeta.

Poi, entro un paio di settimane, la riunione sulle **lezioni apprese**, **senza cercare colpevoli**: cosa ha funzionato (il SIEM ha visto la connessione), cosa no (nessuno ha visto il caricamento del file per 22 minuti), cosa si cambia (allarme sui file \`.php\` negli upload).`,
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      question: 'Hai confermato che un server è compromesso e l\'attaccante è ancora collegato. Qual è la scelta migliore come primo contenimento?',
      options: [
        'Spegnere subito il server dal pulsante',
        'Isolarlo dalla rete lasciandolo acceso, dopo aver avvisato il responsabile',
        'Cancellare i file sospetti e riavviare',
        'Aspettare la fine del turno per non disturbare nessuno',
      ],
      correct: 1,
      explain: `Isolare **taglia fuori** l'attaccante senza perdere ciò che c'è in memoria (processi, connessioni, chiavi). Spegnere distrugge prove volatili; cancellare e riavviare distrugge prove e spesso non elimina la persistenza.`,
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      question: 'In quale fase del ciclo NIST si decide di attivare un allarme sui file .php caricati nella cartella degli upload?',
      options: ['Rilevamento e analisi', 'Contenimento', 'Attività post-incidente (lezioni apprese)', 'Ripristino'],
      correct: 2,
      explain: `Nasce dalle **lezioni apprese**, e si traduce in **preparazione** per il prossimo incidente. È per questo che il ciclo è un cerchio.`,
    },
  ],
  recap: [
    ['NIST SP 800-61', 'preparazione · rilevamento e analisi · contenimento, eradicazione, ripristino · post-incidente'],
    ['evento / allarme / incidente', 'osservabile / sospetto / violazione reale'],
    ['triage', 'è vero? quanto è grave? quanto è esteso?'],
    ['cat *.log | sort', 'linea del tempo da più fonti, con date ISO'],
    ['web shell', 'file caricato che esegue comandi dal browser'],
    ['persistenza', 'cron, servizi, chiavi SSH: il modo per rientrare'],
    ['contenimento', 'isolare senza spegnere, bloccare gli IOC'],
    ['lezioni apprese', 'senza colpevoli: cosa cambiamo per la prossima volta'],
  ],
};

export const CHDF: Chapter = {
  id: 'chDF',
  code: 'DF',
  title: 'Analisi forense',
  subtitle: 'Prove digitali: catena di custodia, firme dei file, tracce nascoste e linee del tempo',
  missions: [
    // ------------------------------------------------------------------ DF.1
    {
      id: 'chDF-m1',
      title: 'Non toccare niente',
      tagline: 'Ordine di volatilità, copie forensi, impronte e catena di custodia.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'La prova che vale',
          body: `@rook: Ricordi il server di Kiroshi? Il cliente vuole denunciare. L'avvocato chiede le prove "in modo che reggano". Il primo che ha toccato il server ha copiato i file con il mouse su una chiavetta. Così non reggono.

@nyx: L'**analisi forense digitale** (*digital forensics*) è il lavoro di raccogliere, conservare e analizzare prove digitali in modo che siano **affidabili**: chiunque deve poter ripetere la tua analisi e ottenere lo stesso risultato.

Le regole di base:
- **non lavorare mai sull'originale**. Si fa una **copia forense** (un'**immagine**): una copia bit per bit di tutto il disco, compreso lo spazio "vuoto" dove restano tracce di file cancellati
- per acquisire si usa un **write blocker**, un dispositivo che impedisce qualsiasi scrittura sul disco originale: anche solo collegarlo a un computer normale può modificare date e file
- si calcola l'**impronta** (hash, SHA-256) dell'originale e della copia: se coincidono, la copia è identica. Chiunque, in futuro, può ricalcolarla e verificare che niente è cambiato
- si analizza solo la copia, possibilmente una **copia della copia**`,
        },
        {
          kind: 'lesson',
          title: 'Prima ciò che svanisce',
          body: `Non tutte le prove durano uguale. L'**ordine di volatilità** (descritto nell'RFC 3227) dice cosa raccogliere per primo, dal più fragile al più stabile:

- **1. registri e cache del processore**: nanosecondi (in pratica non si raccolgono)
- **2. memoria RAM**: processi in esecuzione, connessioni aperte, chiavi di cifratura, comandi digitati. Sparisce allo spegnimento
- **3. stato della rete**: connessioni attive, tabelle ARP, instradamento
- **4. processi in esecuzione**
- **5. disco**: file, log, file temporanei
- **6. log remoti e backup**: su altri sistemi
- **7. supporti d'archivio**: nastri, dischi esterni in un armadio

Esempio diverso dal tuo caso: un PC aziendale con un ransomware attivo. Se lo spegni, il disco resta (cifrato), ma perdi la memoria, dove a volte si trova la chiave che il ransomware ha usato. Per questo si cerca di acquisire la RAM **prima** di spegnere, se è sicuro farlo.

**Catena di custodia** (*chain of custody*): il registro scritto di **ogni** passaggio di una prova. Chi l'ha presa, quando, dove, con quale impronta, a chi l'ha consegnata, dove è stata conservata. Un buco nella catena basta a un avvocato per contestare la prova.`,
        },
        {
          kind: 'task',
          title: 'Il registro',
          body: `Il collega ha acquisito il disco del server e ha fatto due copie di lavoro. Leggi il registro della catena di custodia:

\`\`\`
cat forense/custodia.txt
\`\`\``,
          objective: 'Leggi la catena di custodia.',
          hints: ['cat forense/custodia.txt'],
          check: readOf('forense/custodia.txt'),
          success: `Il registro riporta l'impronta SHA-256 calcolata al momento dell'acquisizione. Da quel momento, ogni copia **deve** avere la stessa impronta. Verifichiamolo.`,
        },
        {
          kind: 'task',
          title: 'Le copie sono identiche?',
          body: `Calcola l'impronta delle due copie di lavoro e confrontala con quella del registro:

\`\`\`
sha256sum forense/copie/*.img
\`\`\`

Una delle due è stata **alterata**. Quale? Invia il nome del file con \`flag\`.`,
          objective: 'Quale copia non coincide con l\'impronta registrata?',
          hints: ['Confronta le prime cifre di ogni impronta con quella in custodia.txt.', 'flag copia-b.img'],
          answer: ['copia-b.img', 'forense/copie/copia-b.img'],
          success: `**copia-b.img** ha un'impronta diversa: basta un singolo byte cambiato per ottenerne una completamente diversa. Forse qualcuno l'ha montata senza protezione in scrittura, e il sistema ha aggiornato qualche data. Non importa il perché: **non è più una prova affidabile**. Si scarta, si annota nel registro, e si rifà una copia da quella buona.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Arrivi su un PC compromesso, acceso. Cosa raccogli per primo?',
          options: ['L\'immagine del disco', 'La memoria RAM', 'I backup della settimana scorsa', 'I log del firewall aziendale'],
          correct: 1,
          explain: `Seguendo l'**ordine di volatilità**, la RAM viene prima: sparisce allo spegnimento. Disco, backup e log remoti resistono più a lungo.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'A cosa serve calcolare lo SHA-256 dell\'immagine di un disco subito dopo l\'acquisizione?',
          options: [
            'A cifrare il disco per proteggerlo',
            'A dimostrare in seguito che la copia non è stata modificata',
            'A comprimere l\'immagine',
            'A recuperare i file cancellati',
          ],
          correct: 1,
          explain: `L'impronta è il "sigillo" della prova: ricalcolandola in qualsiasi momento si dimostra che la copia è identica all'originale. Non cifra e non comprime nulla.`,
        },
      ],
      recap: [
        ['immagine forense', 'copia bit per bit di tutto il disco'],
        ['write blocker', 'impedisce di scrivere sull\'originale'],
        ['sha256sum', 'il sigillo: stessa impronta = stessa prova'],
        ['ordine di volatilità', 'RAM e rete prima, disco poi, archivi per ultimi'],
        ['catena di custodia', 'chi, quando, dove, con quale impronta, a chi'],
      ],
    },

    // ------------------------------------------------------------------ DF.2
    {
      id: 'chDF-m2',
      title: 'Il nome mente',
      tagline: 'Firme dei file (magic bytes), stringhe nascoste e indicatori da cercare.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Il contenuto non mente',
          body: `@nyx: Dalla copia buona il collega ha estratto i file trovati nella cartella degli upload. Sembrano foto e documenti. Sembrano.

Il nome e l'estensione di un file li sceglie chi lo crea: \`foto.jpg\` può contenere qualsiasi cosa. Ciò che conta è il **contenuto**, e quasi ogni formato inizia con una sequenza di byte fissa, la **firma** (*magic bytes*):

\`\`\`
7f 45 4c 46   .ELF   programma Linux
4d 5a         MZ     programma Windows (.exe)
25 50 44 46   %PDF   documento PDF
50 4b 03 04   PK     archivio ZIP (anche .docx, .xlsx, .apk)
ff d8 ff             immagine JPEG
89 50 4e 47   .PNG   immagine PNG
\`\`\`

Due strumenti per leggerla:
- \`file NOME\` guarda la firma e ti dice cos'è davvero, ignorando l'estensione
- \`xxd NOME | head -n 1\` ti mostra i primi byte in esadecimale, per controllare con i tuoi occhi

Esempio diverso dal tuo caso: \`file contratto.docx\` risponde "Zip archive data". È normale: i documenti Office moderni sono archivi ZIP. Se invece rispondesse "PE32 executable", sarebbe un programma travestito.`,
        },
        {
          kind: 'task',
          title: 'Chi è davvero?',
          body: `Controlla il tipo reale di tutti i file estratti in un colpo solo:

\`\`\`
file forense/estratti/*
\`\`\`

Uno dei file ha l'estensione di un'immagine ma è un **programma**. Quale? Invia il nome con \`flag\`.`,
          objective: 'Quale file è un programma travestito?',
          hints: ['Cerca la riga con ELF.', 'flag sfondo_mare.jpg'],
          answer: ['sfondo_mare.jpg', 'forense/estratti/sfondo_mare.jpg'],
          success: `**sfondo_mare.jpg** è un eseguibile Linux (firma \`ELF\`). Controllalo anche a occhio:

\`\`\`
xxd forense/estratti/sfondo_mare.jpg | head -n 1
\`\`\`

I primi byte sono \`7f 45 4c 46\`. Nessuna foto inizia così.`,
        },
        {
          kind: 'lesson',
          title: 'Le parole dentro un programma',
          body: `Un programma è fatto per lo più di byte illeggibili, ma dentro ci sono spesso **testi** in chiaro: messaggi, nomi di file, indirizzi di server, comandi. Il comando \`strings\` estrae tutte le sequenze leggibili di almeno 4 caratteri.

È il primo passo dell'**analisi statica**: guardare dentro un programma **senza eseguirlo**. Dà indizi preziosi in pochi secondi. Esempio diverso dal tuo caso:

\`\`\`
strings sospetto.bin | grep -i http
\`\`\`

mostra gli indirizzi web contenuti nel programma, spesso il server che lo comanda.

!! Un programma sospetto non si esegue **mai** sul tuo computer "per vedere cosa fa". Quella è l'**analisi dinamica**, e si fa solo in una macchina isolata costruita apposta (*sandbox*). Qui ci limitiamo a leggerlo.`,
        },
        {
          kind: 'task',
          title: 'Chi comanda?',
          body: `Estrai le stringhe dal programma travestito e cerca a quale **dominio** si collega:

\`\`\`
strings forense/estratti/sfondo_mare.jpg
\`\`\`

Invia il dominio con \`flag\`.`,
          objective: 'A quale dominio si collega il programma?',
          hints: ['Cerca una riga con un indirizzo o con .nc', 'flag sync.kiroshi-cdn.nc'],
          answer: ['sync.kiroshi-cdn.nc'],
          success: `**sync.kiroshi-cdn.nc**: un dominio costruito per sembrare quello del cliente (Kiroshi) e di un servizio innocuo (CDN, distribuzione di contenuti). È il server di **comando e controllo**. Nota anche le altre stringhe: il percorso del file di persistenza e la porta, le stesse che hai visto nell'incidente.`,
        },
        {
          kind: 'task',
          title: 'Lo conoscono già?',
          body: `Gli **IOC** (indicatori di compromissione) si condividono tra aziende e ricercatori: impronte di file, domini, IP. Il CERT ti ha mandato un bollettino in \`forense/bollettino.txt\` con le impronte di alcuni malware noti.

Calcola l'impronta del programma e cercala nel bollettino:

\`\`\`
sha256sum forense/estratti/sfondo_mare.jpg
\`\`\`

A quale **famiglia** di malware appartiene? Invia il nome con \`flag\`.`,
          objective: 'A quale famiglia appartiene il programma?',
          hints: ['Copia le prime cifre dell\'impronta e cercale: grep PRIME_CIFRE forense/bollettino.txt', 'flag NightCrawler'],
          answer: ['nightcrawler'],
          success: `**NightCrawler**: una famiglia già descritta dal CERT. Da qui puoi leggere cosa fa di solito, quali altre tracce lascia, come rimuoverla. E il tuo caso diventa a sua volta un contributo: domini e impronte nuove si condividono con gli altri.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: '`file fattura.pdf` risponde "PE32 executable (GUI) Intel 80386, for MS Windows". Cosa significa?',
          options: [
            'Che è un PDF con un errore di formato',
            'Che è un programma Windows travestito da PDF',
            'Che il comando file non riconosce i PDF',
            'Che il file è cifrato',
          ],
          correct: 1,
          explain: `\`file\` guarda la firma, non il nome: quel file è un **eseguibile** Windows con un nome da documento. È un trucco classico degli allegati di phishing.`,
        },
      ],
      recap: [
        ['magic bytes', 'la firma iniziale che dice cos\'è davvero un file'],
        ['file NOME', 'riconosce il tipo dal contenuto, non dall\'estensione'],
        ['xxd NOME | head -n 1', 'i primi byte in esadecimale'],
        ['strings', 'testi leggibili dentro un file binario'],
        ['analisi statica / dinamica', 'leggere senza eseguire / eseguire in una sandbox isolata'],
        ['IOC', 'impronte, domini e IP da cercare e condividere'],
      ],
    },

    // ------------------------------------------------------------------ DF.3
    {
      id: 'chDF-m3',
      title: 'Le date raccontano',
      tagline: 'Date dei file (MACB), linee del tempo del filesystem, cronologia dei comandi e timestomping.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Quattro date per ogni file',
          body: `Ogni file su disco porta con sé diverse date. Si ricordano con la sigla **MACB**:

- **M**odified: l'ultima volta che il **contenuto** è stato modificato
- **A**ccessed: l'ultima volta che è stato **letto** (molti sistemi la aggiornano poco, per prestazioni)
- **C**hanged: l'ultima modifica ai **metadati** (permessi, proprietario, nome). Su Linux non si può impostare a mano facilmente
- **B**orn: la **creazione** (non tutti i filesystem la registrano)

\`stat FILE\` le mostra. Esempio diverso dal tuo caso: un file di configurazione con Modify di ieri sera e nessun cambio approvato in calendario è una domanda da fare all'amministratore.

Gli strumenti forensi raccolgono queste date per **tutti** i file dell'immagine e le mettono in fila: è la **timeline del filesystem**, che si unisce a quella dei log.

!! Un attaccante può falsificare la data di modifica di un file per farlo sembrare vecchio e innocuo: si chiama **timestomping**. Ma cambiare la data di modifica aggiorna la data **Changed**, che resta recente. Una data di modifica molto vecchia con una Changed di stanotte è un segnale fortissimo.`,
        },
        {
          kind: 'task',
          title: 'La timeline del disco',
          body: `Il collega ha esportato le date dei file dell'immagine in \`forense/timeline.csv\` (una riga per file: data, tipo di data, utente, percorso). Ordinala e guarda solo i file toccati da \`www-data\` quella notte:

\`\`\`
sort forense/timeline.csv | grep www-data
\`\`\`

Il programma è stato scaricato in \`/tmp\` e poi **copiato** altrove con un nome nuovo, ed è quella copia che è stata eseguita (la riga \`A\`, l'accesso, coincide con l'ora dell'allarme). Qual è il percorso della copia? Invialo con \`flag\`.`,
          objective: 'Dove è stato copiato ed eseguito il programma?',
          hints: ['Guarda le righe con B (creazione) dopo /tmp/sfondo_mare.jpg, e la riga con A.', 'flag /tmp/.x/kworker'],
          answer: ['/tmp/.x/kworker'],
          success: `**/tmp/.x/kworker**: una cartella nascosta (il punto) e un nome che imita un vero processo del kernel Linux (\`kworker\`). Chi guarda la lista dei processi di fretta non lo nota. È il programma che abbiamo trovato travestito da \`sfondo_mare.jpg\`, una volta copiato e rinominato.`,
        },
        {
          kind: 'task',
          title: 'La data falsa',
          body: `Nella stessa timeline cerca le righe del file di persistenza \`php-sess\`:

\`\`\`
grep php-sess forense/timeline.csv
\`\`\`

La sua data di modifica (\`M\`) dice 2071, ma un'altra data lo smentisce. In che **anno** risulta davvero toccato (data \`C\`)? Invialo con \`flag\`.`,
          objective: 'In che anno è stato davvero modificato il file di persistenza?',
          hints: ['Confronta la riga M con la riga C.', 'flag 2077'],
          answer: ['2077'],
          success: `**2077**, la notte dell'attacco. Il file "dice" di avere sei anni, ma i suoi metadati sono stati cambiati stanotte: è **timestomping**. Una regola utile in un'indagine: quando date diverse dello stesso file non sono coerenti, la più difficile da falsificare vince.`,
        },
        {
          kind: 'task',
          title: 'Cosa ha scritto',
          body: `Nella cartella dell'utente \`www-data\` è rimasta la sua **cronologia dei comandi**, il file \`.bash_history\`. È una delle prove più eloquenti: sono le parole dell'attaccante, una per riga.

\`\`\`
cat forense/www-data/.bash_history
\`\`\`

Da quale **dominio** ha scaricato il programma? Invialo con \`flag\`.`,
          objective: 'Da quale dominio è stato scaricato il programma?',
          hints: ['Cerca la riga con curl o wget.', 'flag files.pastebox.nc'],
          answer: ['files.pastebox.nc'],
          success: `**files.pastebox.nc**, un servizio di condivisione file. L'ultima riga è un tentativo di cancellare la cronologia (\`history -c\`): non ha funzionato perché la shell salva il file solo all'uscita, e la sessione è stata interrotta dall'isolamento. Gli attaccanti sbagliano anche loro.

?? In un'indagine vera la cronologia si confronta sempre con la timeline: chi sa di essere osservato può anche scrivere comandi finti apposta.`,
        },
        {
          kind: 'lesson',
          title: 'Ciò che hai costruito',
          body: `@nyx: Rimetti in fila quello che sai adesso, perché è esattamente ciò che va nel report forense:

- **02:09** l'attaccante esplora il sito di Kiroshi
- **02:12** carica una web shell attraverso il modulo della foto profilo
- **02:14** dalla web shell scarica da \`files.pastebox.nc\` il programma NightCrawler, mascherato da immagine
- **02:15** lo copia in \`/tmp/.x/kworker\`, lo avvia, e crea la persistenza in \`/etc/cron.d/php-sess\` con una data falsa
- **02:31** il programma contatta \`sync.kiroshi-cdn.nc\` e il SIEM se ne accorge

Ogni riga è sostenuta da una prova, con la sua fonte e la sua impronta. Questo distingue un'**opinione** da un'**analisi**.

?? Gli strumenti veri da conoscere per nome: **Autopsy** e **The Sleuth Kit** (analisi dei dischi), **Volatility** (analisi della memoria), **plaso / log2timeline** (timeline), **FTK Imager** e \`dd\` (acquisizione). Si imparano bene sulle sfide gratuite di CyberDefenders e Blue Team Labs Online.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un file ha Modified: 2069-03-01 e Changed: ieri alle 03:12. Cosa sospetti?',
          options: [
            'Niente: è un file vecchio',
            'Timestomping: qualcuno ha falsificato la data di modifica',
            'Che l\'orologio del server è rotto',
            'Che il file è stato solo letto',
          ],
          correct: 1,
          explain: `Modificare la data di modifica aggiorna la data **Changed** dei metadati. Una Changed recentissima su un file "antico" è la firma tipica del **timestomping**.`,
        },
      ],
      recap: [
        ['MACB', 'Modified, Accessed, Changed, Born'],
        ['stat', 'mostra le date di un file'],
        ['timeline del filesystem', 'le date di tutti i file, in fila'],
        ['timestomping', 'data falsificata; la Changed la tradisce'],
        ['.bash_history', 'i comandi digitati, da confrontare con la timeline'],
        ['strumenti', 'Autopsy, Sleuth Kit, Volatility, plaso, FTK Imager'],
      ],
    },
  ],
};
