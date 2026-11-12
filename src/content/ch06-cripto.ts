import type { Chapter } from '../game/types';

export const CH06: Chapter = {
  id: 'ch06',
  code: '06',
  title: 'Crittografia e password',
  subtitle: 'Codifica, cifratura, hash, integrità e password sicure',
  missions: [
    // ------------------------------------------------------------------ 6.1
    {
      id: 'ch06-m1',
      title: 'Codificare non è cifrare',
      tagline: 'Codifica, cifratura simmetrica e asimmetrica, e il lucchetto di HTTPS.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Tre parole che tutti confondono',
          body: `@nyx: Metà dei principianti, e anche molti sviluppatori, confonde tre cose diverse. Se le capisci bene, eviterai errori che costano carissimo.

**1. Codifica** (*encoding*): trasforma i dati in un altro formato per **trasportarli** meglio. Non c'è nessun segreto e nessuna chiave: chiunque conosca il formato torna indietro. Esempi: Base64, URL encoding (\`%20\` = spazio).

**2. Cifratura** (*encryption*): rende i dati **illeggibili** a chi non ha la **chiave**. Si torna indietro solo con la chiave giusta. Esempi: AES, RSA, la connessione HTTPS.

**3. Hash**: calcola un'**impronta** dei dati. È **a senso unico**: dall'impronta non si torna ai dati. Serve a verificare (password, integrità dei file). Esempi: SHA-256, bcrypt.

!! L'errore classico: "ho protetto la password con Base64". **No**: l'hai solo travestita. Base64 si decodifica in un secondo.`,
        },
        {
          kind: 'task',
          title: 'Un messaggio "segreto"',
          body: `Nyx ti ha lasciato un messaggio in \`cripto/messaggio.txt\`. Guardalo:

\`\`\`
cat cripto/messaggio.txt
\`\`\`

Sembra incomprensibile, ma lettere, numeri e un \`=\` finale sono il segno tipico del **Base64**. Decodificalo:

\`\`\`
base64 -d cripto/messaggio.txt
\`\`\`

Dentro c'è una flag: inviala.`,
          objective: 'Decodifica il messaggio con base64 -d e invia la flag.',
          hints: ['base64 -d cripto/messaggio.txt', 'flag NC{b4s364_n0n_e_c1fr4tur4}'],
          answer: ['NC{b4s364_n0n_e_c1fr4tur4}'],
          success: `Visto? Nessuna chiave, nessuna password: il "segreto" era leggibile da chiunque. Base64 si trova ovunque (email, token web, configurazioni) e spesso chi analizza un sistema scopre dati sensibili proprio decodificandolo.`,
        },
        {
          kind: 'lesson',
          title: 'Cifratura simmetrica',
          body: `Nella cifratura **simmetrica** c'è **una sola chiave**, che serve sia a cifrare sia a decifrare. Come la chiave di un lucchetto: chi ce l'ha, apre.

\`\`\`
"ciao"  ──cifra con K──▶  "x9#Lq"  ──decifra con K──▶  "ciao"
\`\`\`

- è **velocissima**, perfetta per grandi quantità di dati (dischi, file, connessioni)
- l'algoritmo più usato oggi è **AES**
- il problema: **come passi la chiave** all'altra persona senza che qualcuno la intercetti?`,
        },
        {
          kind: 'lesson',
          title: 'Cifratura asimmetrica',
          body: `La cifratura **asimmetrica** risolve il problema con **due chiavi** collegate tra loro:
- una **chiave pubblica**, che puoi dare a tutti
- una **chiave privata**, che tieni solo tu

Quello che si cifra con la pubblica si decifra **solo** con la privata. Come una cassetta delle lettere: chiunque può imbucare (pubblica), solo tu hai la chiave per aprire (privata).

Funziona anche al contrario, per le **firme digitali**: firmi con la privata, e chiunque verifica con la tua pubblica che il messaggio viene davvero da te e non è stato modificato.

- algoritmi: **RSA**, curve ellittiche
- è più lenta della simmetrica

?? Le **chiavi SSH** di cui abbiamo parlato nel capitolo SOC sono proprio una coppia pubblica/privata: la pubblica va sul server, la privata resta sul tuo computer.`,
        },
        {
          kind: 'lesson',
          title: 'Il lucchetto di HTTPS',
          body: `Quando visiti un sito in **HTTPS** (il lucchetto nel browser) succedono entrambe le cose, grazie al protocollo **TLS**:

1. il sito ti manda il suo **certificato**, che contiene la sua chiave pubblica, firmato da un'**autorità di certificazione** di cui il tuo browser si fida
2. il browser controlla la firma: così sa che sta parlando davvero con quel sito e non con un impostore
3. con la crittografia asimmetrica, browser e sito si accordano su una **chiave simmetrica** temporanea
4. da lì in poi tutto viaggia cifrato con quella chiave, velocemente

!! Il lucchetto vuol dire "la connessione è cifrata", **non** "il sito è onesto". Anche i siti di phishing hanno spesso il lucchetto. Controlla sempre l'indirizzo.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Uno sviluppatore salva le password degli utenti in Base64 "per sicurezza". Cosa gli dici?',
          options: [
            'Va bene, Base64 è una cifratura sicura',
            'Base64 è solo una codifica: chiunque può decodificarla. Le password vanno salvate come hash con un algoritmo adatto',
            'Meglio usare Base64 due volte',
            'Basta nascondere il file',
          ],
          correct: 1,
          explain: `Base64 non ha chiavi: è reversibile da chiunque. Le password non vanno nemmeno **cifrate** (chi ha la chiave le leggerebbe tutte), ma salvate come **hash** con algoritmi lenti e con "sale", come bcrypt o Argon2. Lo vediamo nella missione sulle password.`,
        },
      ],
      recap: [
        ['codifica', 'cambia formato, nessun segreto (Base64, %20)'],
        ['cifratura', 'illeggibile senza la chiave (AES, RSA)'],
        ['hash', 'impronta a senso unico (SHA-256, bcrypt)'],
        ['base64 -d', 'decodifica Base64'],
        ['simmetrica', 'una chiave sola, veloce (AES)'],
        ['asimmetrica', 'chiave pubblica + privata, firme digitali (RSA)'],
        ['TLS / HTTPS', 'certificato + accordo su una chiave + cifratura'],
        ['lucchetto', 'connessione cifrata, non "sito onesto"'],
      ],
    },

    // ------------------------------------------------------------------ 6.2
    {
      id: 'ch06-m2',
      title: 'Impronte digitali',
      tagline: 'Funzioni hash, effetto valanga e verifica dell\'integrità dei file.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Le proprietà di un hash',
          body: `Una funzione **hash** come **SHA-256** prende dati di qualsiasi dimensione (una parola o un film intero) e produce sempre un'impronta della **stessa lunghezza**: 64 caratteri esadecimali.

Le sue proprietà:
- **deterministica**: gli stessi dati danno sempre la stessa impronta
- **a senso unico**: dall'impronta non si risale ai dati
- **effetto valanga**: cambi un solo carattere e l'impronta cambia completamente
- **resistente alle collisioni**: è praticamente impossibile trovare due file diversi con la stessa impronta

?? Algoritmi vecchi come **MD5** e **SHA-1** oggi sono considerati rotti per usi di sicurezza: si sono trovate collisioni. Usa SHA-256 o superiori.`,
        },
        {
          kind: 'task',
          title: 'L\'effetto valanga',
          body: `Calcola l'impronta di due parole quasi uguali:

\`\`\`
echo ciao | sha256sum
echo Ciao | sha256sum
\`\`\`

Cambia solo una lettera maiuscola... guarda quanto è diverso il risultato.`,
          objective: 'Calcola lo SHA-256 di due testi diversi.',
          hints: ['Scrivi: echo ciao | sha256sum e poi echo Ciao | sha256sum'],
          check: (ev) => ev.type === 'command' && ev.name === 'sha256sum' && ev.ok,
          success: `Due impronte che non hanno niente in comune, anche se il testo differisce di una sola lettera. È proprio questo che rende gli hash perfetti per accorgersi di qualsiasi modifica.`,
        },
        {
          kind: 'lesson',
          title: 'Verificare l\'integrità',
          body: `Quando scarichi un programma o un aggiornamento, come fai a sapere che nessuno l'ha modificato per strada? Il produttore pubblica le **impronte** dei file originali, spesso in un file chiamato \`SHA256SUMS\`:

\`\`\`
3a7bd3e2...  programma.bin
91c4f0a8...  update.sh
\`\`\`

Tu calcoli l'impronta di quello che hai scaricato e la confronti. Se è identica, il file è integro. Se è diversa, **qualcuno l'ha modificato**.

Il comando \`sha256sum -c SHA256SUMS\` fa il confronto in automatico per tutti i file della lista.

?? I difensori usano lo stesso principio per sorvegliare i server: si salvano le impronte dei file di sistema, e un programma (come AIDE o Tripwire) avvisa se qualcosa cambia. Si chiama **FIM**, *File Integrity Monitoring*.`,
        },
        {
          kind: 'task',
          title: 'Il firmware manomesso',
          body: `Mama ha scaricato un aggiornamento per il jukebox, in \`cripto/firmware\`. Il produttore ha pubblicato le impronte originali nel file \`SHA256SUMS\`. Verifica che tutto sia integro:

\`\`\`
cd cripto/firmware
sha256sum -c SHA256SUMS
\`\`\`

Quale file è stato manomesso? Invia il suo nome con \`flag\`.`,
          objective: 'Verifica il firmware e invia il nome del file manomesso.',
          hints: ['cd cripto/firmware e poi sha256sum -c SHA256SUMS', 'Cerca la riga con FAILED: flag update.sh'],
          answer: ['update.sh'],
          success: `\`update.sh\` non corrisponde all'originale. Guarda cosa c'è dentro con \`cat update.sh\`: qualcuno ha aggiunto in fondo una riga che **scarica ed esegue** uno script dall'indirizzo \`203.0.113.77\`, il nostro vecchio amico del capitolo SOC!

È un **attacco alla catena di distribuzione** (*supply chain attack*): invece di attaccare il bersaglio direttamente, si avvelena un aggiornamento che il bersaglio installerà da solo. Il controllo delle impronte l'ha fermato.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un attaccante modifica `update.sh` e poi ricalcola e sostituisce anche l\'impronta dentro `SHA256SUMS`. Il controllo funziona ancora?',
          options: [
            'Sì, SHA-256 se ne accorge comunque',
            'No: se l\'attaccante può cambiare anche la lista delle impronte, il controllo non serve. Per questo la lista va firmata digitalmente o presa da una fonte sicura',
            'Sì, perché il file diventa più grande',
            'No, ma solo con MD5',
          ],
          correct: 1,
          explain: `L'impronta dimostra che il file corrisponde alla lista, non che la lista sia autentica. Per questo i progetti seri **firmano** la lista con la loro chiave privata (crittografia asimmetrica!): chiunque può verificare la firma con la chiave pubblica, ma nessuno può falsificarla.`,
        },
      ],
      recap: [
        ['SHA-256', 'impronta di 64 caratteri esadecimali'],
        ['effetto valanga', 'una minima modifica cambia tutta l\'impronta'],
        ['MD5 / SHA-1', 'vecchi e rotti per la sicurezza'],
        ['sha256sum FILE', 'calcola l\'impronta di un file'],
        ['sha256sum -c LISTA', 'verifica i file contro una lista di impronte'],
        ['FIM', 'sorveglianza dell\'integrità dei file di sistema'],
        ['supply chain attack', 'avvelenare un aggiornamento invece del bersaglio'],
        ['firma digitale', 'dimostra chi ha prodotto la lista delle impronte'],
      ],
    },

    // ------------------------------------------------------------------ 6.3
    {
      id: 'ch06-m3',
      title: 'Password',
      tagline: 'Perché le password deboli cadono, sale e hash lenti, password manager e MFA.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Come vengono salvate',
          body: `Un sito fatto bene **non conosce** la tua password. Salva solo il suo hash: quando fai login, calcola l'hash di quello che scrivi e lo confronta.

Ma se un attaccante ruba il database degli hash (succede di continuo: si chiamano **data breach**), può provare a indovinare le password "offline", senza limiti di tentativi:
1. prende una parola candidata, es. \`estate2023\`
2. ne calcola l'hash
3. se è uguale a uno di quelli rubati, ha trovato la password

Non deve "rompere" l'hash: deve solo **indovinare** l'originale. E qui entrano in gioco la lunghezza e la prevedibilità della tua password.`,
        },
        {
          kind: 'lesson',
          title: 'La matematica delle password',
          body: `Quante password diverse esistono? **caratteri possibili ^ lunghezza**.

\`\`\`
solo minuscole (26), 6 caratteri    →  26^6  ≈ 300 milioni
minusc.+maiusc.+cifre (62), 8 car.  →  62^8  ≈ 218 mila miliardi
62 caratteri, 12 caratteri          →  62^12 ≈ 3 miliardi di miliardi
4 parole a caso da 7776             →  7776^4 ≈ 3,6 milioni di miliardi
\`\`\`

Con hash veloci, un computer con buone schede grafiche prova **miliardi** di combinazioni al secondo. Una password di 6 minuscole cade in meno di un secondo. Una di 12 caratteri casuali richiede secoli.

Ma il vero punto debole non è la matematica: sono le **persone**. Gli attaccanti non provano tutto a caso, provano prima:
- le password più comuni (\`123456\`, \`password\`, \`qwerty\`...)
- le **liste di password reali** uscite dai breach precedenti: miliardi di voci
- parole del dizionario con varianti prevedibili: \`Estate2023!\`, \`P4ssw0rd\`

!! Sostituire lettere con numeri (\`a\`→\`4\`, \`o\`→\`0\`) **non** rende sicura una password: è il primo trucco che gli strumenti di attacco provano.`,
        },
        {
          kind: 'lesson',
          title: 'Le difese di chi salva le password',
          body: `Chi gestisce un sistema ha due armi:

**Il sale** (*salt*): un valore casuale diverso per ogni utente, aggiunto alla password prima di calcolare l'hash. Così due utenti con la stessa password hanno hash diversi, e l'attaccante non può usare tabelle precalcolate: deve ricominciare da capo per ogni utente.

**Gli hash lenti**: SHA-256 è progettato per essere veloce, ottimo per i file ma pessimo per le password. Per le password si usano algoritmi **volutamente lenti** come **bcrypt**, **scrypt** o **Argon2**: un login che impiega 0,1 secondi non disturba nessuno, ma rallenta l'attaccante di milioni di volte.

?? Ricordi la riga di \`/etc/shadow\` che iniziava con \`$y$\`? Quel prefisso indica l'algoritmo **yescrypt**, uno di questi hash lenti, con il sale incluso.`,
        },
        {
          kind: 'quiz',
          title: 'Quale password?',
          question: 'Quale di queste password è la più robusta?',
          options: ['P@ssw0rd2077!', 'Mario1985', 'tramonto-ruggine-violino-autobus', 'Qw3rty!!'],
          correct: 2,
          explain: `Quattro parole casuali formano una **passphrase**: lunga, facile da ricordare e non prevedibile. \`P@ssw0rd2077!\` sembra complicata, ma è "password" con le sostituzioni più ovvie e un anno: è tra i primi tentativi di qualsiasi attacco. \`Mario1985\` (nome + anno) e \`Qw3rty!!\` (tastiera) sono schemi notissimi.`,
        },
        {
          kind: 'lesson',
          title: 'Le difese di tutti i giorni',
          body: `Cosa fare in pratica, per te e per le persone che proteggerai:

- **Una password diversa per ogni sito.** Il pericolo più grande è il riuso: se un sito viene violato, gli attaccanti provano la stessa email e password ovunque (si chiama **credential stuffing**)
- **Un password manager** (Bitwarden, KeePassXC, quello del browser...): genera e ricorda password lunghe e casuali. Tu ricordi solo una passphrase robusta
- **L'autenticazione a più fattori (MFA)**: oltre alla password serve una seconda prova, come un codice da un'app o una chiave fisica. Anche se la password viene rubata, da sola non basta. È la singola difesa più efficace contro il furto di account
- **Controllare i breach**: servizi come *Have I Been Pwned* dicono se la tua email compare in un data breach noto

!! Attenzione ai codici MFA: nessun servizio serio ti chiederà mai di **dettare** il codice al telefono o in chat. Chi lo chiede sta cercando di rubarti l'account.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica finale',
          question: 'Un sito che usi è stato violato e la tua password è uscita. Usavi la stessa password anche per la email. Qual è la cosa più urgente da fare?',
          options: [
            'Niente, la password era complicata',
            'Cambiare subito la password della email (e di ogni altro servizio dove la usavi) e attivare l\'MFA',
            'Cancellare l\'account del sito violato e basta',
            'Aspettare di vedere se succede qualcosa',
          ],
          correct: 1,
          explain: `Il pericolo immediato è il **credential stuffing**: gli attaccanti proveranno quella password ovunque, a partire dall'email, che è la chiave per recuperare tutti gli altri account. Cambiala subito, attiva l'MFA e da ora in poi usa un password manager con password uniche.`,
        },
      ],
      recap: [
        ['data breach', 'furto di un database, spesso con gli hash delle password'],
        ['attacco a dizionario', 'provare password comuni e liste di breach precedenti'],
        ['caratteri ^ lunghezza', 'il numero di password possibili: conta soprattutto la lunghezza'],
        ['sale (salt)', 'valore casuale per utente: hash diversi per password uguali'],
        ['bcrypt / Argon2 / yescrypt', 'hash volutamente lenti, adatti alle password'],
        ['passphrase', 'più parole casuali: lunga e facile da ricordare'],
        ['credential stuffing', 'riprovare le password rubate su altri siti'],
        ['password manager + MFA', 'le due difese più efficaci per chiunque'],
      ],
    },
  ],
};
