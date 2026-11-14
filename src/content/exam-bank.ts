// Domande d'esame "a scenario", nello stile delle certificazioni d'ingresso
// (Security+, CySA+, eJPT, BTL1): una situazione concreta e la scelta migliore.

export interface BankQ {
  chapter: string;
  question: string;
  options: string[];
  correct: number;
  explain: string;
}

export const EXAM_BANK: BankQ[] = [
  // --- Linux e terminale
  {
    chapter: 'ch01',
    question: 'Sei in `/var/log/nginx` e devi leggere `/etc/hosts` senza cambiare cartella. Quale comando?',
    options: ['cd /etc && cat hosts', 'cat /etc/hosts', 'cat ../etc/hosts', 'ls /etc/hosts'],
    correct: 1,
    explain: 'Un percorso assoluto funziona da qualsiasi cartella. `../etc/hosts` punterebbe a `/var/log/etc/hosts`; `ls` mostra il nome, non il contenuto.',
  },
  {
    chapter: 'ch01',
    question: 'Un collega ti dice che in una cartella "non c\'è niente", ma `du` dice che occupa 2 GB. Quale comando lanci per primo?',
    options: ['rm -r cartella', 'ls -la cartella', 'cat cartella', 'pwd'],
    correct: 1,
    explain: '`ls -la` mostra anche i file nascosti (il cui nome inizia con un punto), con dimensioni e permessi.',
  },
  {
    chapter: 'ch03',
    question: 'Un file ha permessi `-rw-r--r--` ed è di proprietà di root. Un utente normale può...',
    options: ['leggerlo e modificarlo', 'leggerlo ma non modificarlo', 'né leggerlo né modificarlo', 'eseguirlo'],
    correct: 1,
    explain: 'Il terzo gruppo di permessi (`r--`) vale per tutti gli altri: solo lettura.',
  },
  {
    chapter: 'ch03',
    question: 'Una chiave SSH privata deve avere permessi tali che solo il proprietario possa leggerla e scriverla. Quale valore numerico?',
    options: ['644', '755', '600', '777'],
    correct: 2,
    explain: '600 = `rw-------`. Con permessi più larghi, ssh rifiuta di usarla.',
  },
  {
    chapter: 'ch05',
    question: 'Uno script deve girare ogni notte alle 2:30. Quale riga di crontab è corretta?',
    options: ['2 30 * * * /opt/script.sh', '30 2 * * * /opt/script.sh', '* * 2 30 * /opt/script.sh', '30 * 2 * * /opt/script.sh'],
    correct: 1,
    explain: 'Il formato è minuto, ora, giorno del mese, mese, giorno della settimana: `30 2 * * *`.',
  },
  {
    chapter: 'ch05',
    question: 'Vuoi salvare l\'output di un comando in un file **senza** cancellare ciò che il file contiene già. Quale operatore?',
    options: ['>', '>>', '|', '2>'],
    correct: 1,
    explain: '`>>` aggiunge in fondo; `>` sovrascrive; `|` passa l\'output a un altro comando; `2>` redirige gli errori.',
  },
  // --- reti
  {
    chapter: 'ch02',
    question: 'Un server web risponde sulla porta 443 ma non sulla 80. Cosa puoi dedurre?',
    options: ['Il sito è spento', 'Il sito accetta solo HTTPS', 'Il DNS non funziona', 'Il server usa SSH'],
    correct: 1,
    explain: '443 è HTTPS; 80 è HTTP in chiaro. Molti siti chiudono la 80 o la usano solo per reindirizzare alla 443.',
  },
  {
    chapter: 'ch09',
    question: 'Quanti indirizzi utilizzabili per i dispositivi ha la rete 10.0.5.0/26?',
    options: ['64', '62', '30', '126'],
    correct: 1,
    explain: '/26 lascia 6 bit agli host: 2⁶ = 64 indirizzi, meno rete e broadcast = 62.',
  },
  {
    chapter: 'ch09',
    question: 'In una cattura di rete vedi molti pacchetti SYN verso porte diverse dello stesso host, senza che le connessioni si completino. Cosa sta succedendo?',
    options: ['Un trasferimento di file', 'Una scansione delle porte', 'Un aggiornamento del sistema', 'Una risoluzione DNS'],
    correct: 1,
    explain: 'Tanti SYN su porte diverse senza handshake completo sono la firma di una scansione (tipo `nmap -sS`).',
  },
  {
    chapter: 'ch09',
    question: 'Quale protocollo andrebbe sostituito subito perché trasmette password in chiaro?',
    options: ['SSH', 'Telnet', 'HTTPS', 'SFTP'],
    correct: 1,
    explain: 'Telnet (porta 23) trasmette tutto, password comprese, in chiaro. Si sostituisce con SSH.',
  },
  // --- SOC e log
  {
    chapter: 'ch04',
    question: 'In `auth.log` vedi 300 "Failed password" per root da un solo IP, poi un "Accepted password" per root dallo stesso IP. Qual è la conclusione più corretta?',
    options: ['Un utente ha dimenticato la password', 'Brute force riuscito: l\'account root va considerato compromesso', 'Un falso positivo del SIEM', 'Una scansione delle porte'],
    correct: 1,
    explain: 'Tanti tentativi falliti seguiti da un successo dallo stesso IP: il brute force ha funzionato. Si passa subito al contenimento.',
  },
  {
    chapter: 'ch08',
    question: 'Venti account diversi hanno un solo login fallito ciascuno, tutti dallo stesso IP in due minuti. Che attacco è?',
    options: ['Brute force', 'Password spraying', 'Credential stuffing', 'Phishing'],
    correct: 1,
    explain: 'Poche password provate su molti account, per restare sotto la soglia di blocco: password spraying.',
  },
  {
    chapter: 'ch08',
    question: 'Una regola del SIEM genera 400 allarmi al giorno, quasi tutti falsi positivi. Qual è il rischio principale?',
    options: ['Che il SIEM si riempia', 'Che gli analisti, sommersi, ignorino anche l\'allarme vero (alert fatigue)', 'Nessuno: meglio troppi che pochi', 'Che i log vengano cancellati'],
    correct: 1,
    explain: 'Troppi falsi positivi producono "alert fatigue": la regola va affinata, non lasciata così.',
  },
  {
    chapter: 'ch08',
    question: 'Un computer contatta lo stesso dominio sconosciuto ogni 60 secondi esatti, giorno e notte. Cosa sospetti?',
    options: ['Aggiornamenti automatici', 'Un beacon di comando e controllo', 'Un utente molto attivo', 'Un errore del DNS'],
    correct: 1,
    explain: 'Regolarità perfetta e continua verso un dominio sconosciuto è tipica di un malware che "chiama casa" (C2).',
  },
  {
    chapter: 'ch08',
    question: 'Durante la gestione di un incidente, quale di queste azioni appartiene al CONTENIMENTO?',
    options: ['Reinstallare il server da zero', 'Isolare il computer infetto dalla rete', 'Scrivere il report finale', 'Organizzare la formazione del personale'],
    correct: 1,
    explain: 'Isolare impedisce al danno di allargarsi. Reinstallare è ripristino/eradicazione; report e formazione sono post-incidente.',
  },
  // --- crittografia
  {
    chapter: 'ch06',
    question: 'Un sito conserva le password con SHA-256 senza sale. Qual è il problema principale?',
    options: ['SHA-256 è reversibile', 'Password uguali hanno hash uguali e si possono usare tabelle precalcolate; inoltre SHA-256 è troppo veloce', 'SHA-256 produce hash troppo lunghi', 'Nessun problema'],
    correct: 1,
    explain: 'Per le password servono sale e funzioni lente fatte apposta (bcrypt, scrypt, Argon2).',
  },
  {
    chapter: 'ch06',
    question: 'Il testo `bm9uIGUgY2lmcmF0bw==` è...',
    options: ['Cifrato con AES', 'Codificato in Base64: chiunque può decodificarlo', 'Un hash SHA-256', 'Una chiave privata'],
    correct: 1,
    explain: 'Lettere, numeri e `=` finali: Base64. È una codifica, non una protezione.',
  },
  {
    chapter: 'ch06',
    question: 'Per mandare un file riservato a un collega in modo che solo lui possa leggerlo, con la crittografia asimmetrica usi...',
    options: ['la tua chiave privata', 'la sua chiave pubblica', 'la sua chiave privata', 'la tua chiave pubblica'],
    correct: 1,
    explain: 'Si cifra con la chiave PUBBLICA del destinatario: solo la sua chiave privata potrà decifrare.',
  },
  // --- web
  {
    chapter: 'ch07',
    question: 'Nel log del server web compare `GET /prodotto.php?id=5%27%20OR%201=1--`. Che tentativo è?',
    options: ['XSS', 'SQL injection', 'Path traversal', 'SSRF'],
    correct: 1,
    explain: '`%27` è un apice e `OR 1=1--` è SQL: tentativo di SQL injection. La difesa: query parametrizzate.',
  },
  {
    chapter: 'ch07',
    question: 'Una richiesta contiene `../../../../etc/passwd` nel parametro `file=`. Che attacco è?',
    options: ['Path traversal', 'XSS', 'Brute force', 'CSRF'],
    correct: 0,
    explain: 'Le sequenze `../` cercano di uscire dalla cartella prevista: path traversal (OWASP A01).',
  },
  {
    chapter: 'ch07',
    question: 'Un utente scrive nei commenti di un blog `<script>...</script>` e il codice viene eseguito nel browser di chi legge. Quale categoria e quale cura?',
    options: ['A03 Injection (XSS): codificare l\'output prima di mostrarlo', 'A06: aggiornare il server', 'A07: attivare la MFA', 'A10 SSRF: bloccare gli indirizzi interni'],
    correct: 0,
    explain: 'È Cross-Site Scripting, nella categoria Injection. La cura principale è codificare (escape) ciò che l\'utente ha scritto prima di inserirlo nella pagina.',
  },
  {
    chapter: 'ch07',
    question: 'Un\'email ha `spf=fail` e `dmarc=fail` per il dominio del mittente, ma è arrivata in casella. Quale impostazione del dominio lo spiega più probabilmente?',
    options: ['DMARC con p=none', 'DKIM attivo', 'SPF con -all', 'Un certificato TLS scaduto'],
    correct: 0,
    explain: 'Con `p=none` il dominio chiede solo di osservare, non di rifiutare. Andrebbe portato a `quarantine` o `reject`.',
  },
  // --- OSINT e vulnerabilità
  {
    chapter: 'ch10',
    question: 'Due vulnerabilità hanno CVSS 9.8 e 7.5. La seconda è nel catalogo KEV (sfruttata attivamente) ed è su un server esposto a Internet; la prima è su un server interno isolato. Quale correggi per prima?',
    options: ['Quella da 9.8: il punteggio è più alto', 'Quella da 7.5: sfruttata attivamente e raggiungibile da chiunque', 'Indifferente', 'Nessuna delle due'],
    correct: 1,
    explain: 'La priorità tiene conto di sfruttamento reale ed esposizione, non solo del punteggio CVSS.',
  },
  {
    chapter: 'ch10',
    question: 'Quale attività è ricognizione PASSIVA?',
    options: ['nmap sul server del cliente', 'Consultare i certificati pubblici del dominio (certificate transparency)', 'Provare password sul login', 'Inviare email di prova ai dipendenti'],
    correct: 1,
    explain: 'Leggere registri pubblici non tocca i sistemi del bersaglio. Le altre azioni interagiscono con loro.',
  },
  // --- hardening e pentest
  {
    chapter: 'ch11',
    question: '`sudo -l` mostra `(root) NOPASSWD: /usr/bin/find`. Perché è un rischio?',
    options: ['find è un programma lento', 'find può eseguire comandi (-exec): con sudo, li eseguirebbe come root', 'find può cancellare solo file temporanei', 'Non è un rischio'],
    correct: 1,
    explain: 'Molti programmi apparentemente innocui permettono di lanciare comandi: concessi via sudo, regalano root. GTFOBins li elenca.',
  },
  {
    chapter: 'ch11',
    question: 'Quale configurazione SSH è la più sicura?',
    options: ['PermitRootLogin yes, PasswordAuthentication yes', 'PermitRootLogin no, PasswordAuthentication no (solo chiavi)', 'Porta 2222 con password', 'Telnet al posto di SSH'],
    correct: 1,
    explain: 'Niente login diretto di root e solo chiavi: le password non si possono indovinare a tentativi. Cambiare porta riduce il rumore, non protegge.',
  },
  {
    chapter: 'chPT',
    question: 'In un pentest trovi una password valida in un file pubblico. Le regole consentono una sola prova. Cosa fai dopo essere entrato?',
    options: ['Crei un utente per tornare più tardi', 'Osservi senza modificare nulla, annoti ora e prove, e ti fermi entro le regole', 'Cambi la password per proteggere il cliente', 'Cancelli i log per non disturbare'],
    correct: 1,
    explain: 'Si documenta e si osserva. Creare utenti, cambiare password o toccare i log sono modifiche che il contratto non consente.',
  },
  {
    chapter: 'chPT',
    question: 'A cosa serve la riverifica (retest) dopo un pentest?',
    options: ['A trovare nuove vulnerabilità in altri sistemi', 'A controllare che le correzioni abbiano davvero risolto i problemi del report', 'A rifare la ricognizione da capo', 'A fatturare il lavoro'],
    correct: 1,
    explain: 'Si ripetono le prove del report: risolto, parzialmente risolto, ancora aperto.',
  },
  // --- Windows, forense, cloud, fondamenti
  {
    chapter: 'ch12',
    question: 'Nel registro di sicurezza di un domain controller compare l\'Event ID 1102 alle 03:14. Cosa significa?',
    options: ['Un accesso riuscito', 'Il registro di controllo è stato cancellato', 'Un nuovo servizio installato', 'Un account bloccato'],
    correct: 1,
    explain: '1102 = registro di sicurezza cancellato: spesso un attaccante che copre le tracce. Va indagato subito.',
  },
  {
    chapter: 'ch12',
    question: 'Un account appena creato viene aggiunto al gruppo Domain Admins da un account di helpdesk, di notte. Quali Event ID cerchi?',
    options: ['4624 e 4625', '4720 e 4728', '7045 e 1102', '4688 e 4672'],
    correct: 1,
    explain: '4720 = account creato; 4728 = aggiunto a un gruppo globale privilegiato (come Domain Admins).',
  },
  {
    chapter: 'chDF',
    question: 'L\'impronta SHA-256 della copia di un disco non coincide con quella registrata all\'acquisizione. Cosa fai?',
    options: ['Usi comunque la copia', 'Scarti la copia, lo annoti nella catena di custodia e ne fai una nuova dall\'originale', 'Ricalcoli l\'impronta con MD5', 'Correggi l\'impronta nel registro'],
    correct: 1,
    explain: 'Una copia con impronta diversa non è più una prova affidabile. Si scarta e si documenta.',
  },
  {
    chapter: 'chDF',
    question: '`file foto.jpg` risponde "ELF 64-bit LSB executable". Cosa significa?',
    options: ['Che è una foto in un formato raro', 'Che è un programma Linux con un nome da immagine', 'Che il file è danneggiato', 'Che è un documento cifrato'],
    correct: 1,
    explain: '`file` guarda la firma del contenuto (magic bytes), non l\'estensione: è un eseguibile travestito.',
  },
  {
    chapter: 'ch13',
    question: 'Secondo il modello di responsabilità condivisa del cloud, chi deve configurare correttamente i permessi di uno storage?',
    options: ['Il fornitore cloud', 'Il cliente', 'Nessuno: sono automatici', 'Il produttore del browser'],
    correct: 1,
    explain: 'Il fornitore protegge l\'infrastruttura; configurazioni, accessi e dati sono responsabilità del cliente.',
  },
  {
    chapter: 'chF',
    question: 'Un ransomware cifra i server di un ospedale; nessun dato viene copiato. Quale proprietà della triade CIA è colpita?',
    options: ['Riservatezza', 'Integrità', 'Disponibilità', 'Non ripudio'],
    correct: 2,
    explain: 'I dati ci sono ma non si possono usare: disponibilità.',
  },
  {
    chapter: 'chF',
    question: 'Un\'azienda compra una polizza contro gli attacchi informatici. Che trattamento del rischio è?',
    options: ['Mitigazione', 'Trasferimento', 'Accettazione', 'Eliminazione'],
    correct: 1,
    explain: 'Il danno economico passa all\'assicurazione: trasferimento. La probabilità dell\'attacco non cambia.',
  },
  {
    chapter: 'chF',
    question: 'Quale combinazione è una vera autenticazione a più fattori?',
    options: ['Password e domanda segreta', 'Password e codice dall\'app sul telefono', 'PIN e password', 'Due password diverse'],
    correct: 1,
    explain: 'Servono fattori di categorie diverse: qualcosa che sai (password) e qualcosa che hai (telefono).',
  },
  {
    chapter: 'chPY',
    question: 'Cosa stampa questo codice?\n```\nconta = {}\nfor ip in ["a", "b", "a"]:\n    conta[ip] = conta.get(ip, 0) + 1\nprint(conta)\n```',
    options: ["{'a': 1, 'b': 1}", "{'a': 2, 'b': 1}", "['a', 'b', 'a']", 'KeyError'],
    correct: 1,
    explain: '`get(ip, 0)` restituisce 0 per le chiavi nuove: "a" arriva a 2, "b" a 1.',
  },
  {
    chapter: 'chPY',
    question: 'Uno script si ferma con `FileNotFoundError` quando un file dell\'elenco manca. Come lo rendi robusto?',
    options: ['Con un ciclo while', 'Con try/except FileNotFoundError intorno all\'apertura del file', 'Con import os', 'Rinominando il file'],
    correct: 1,
    explain: 'Si gestisce l\'errore previsto, si scrive cosa è successo e si passa al file successivo.',
  },
];
