# Piano del corso: dall'inizio al primo lavoro da junior

Obiettivo del progetto: chi finisce il corso deve poter fare un colloquio per un ruolo **junior** in
cybersecurity (analista SOC L1, junior pentester, sistemista con focus sicurezza) e svolgere le attività
di base. Questo file tiene traccia di cosa è già coperto e cosa manca.

## Già coperto (v1.2)

| Area | Stato |
|---|---|
| Linux da riga di comando | 13 capitoli di terminale simulato; **Manuale** con ~85 schede (opzioni complete, esempi verificati) |
| Analisi di log (grep, awk, sed, sort/uniq, cut) | missioni + simulazioni + operazioni |
| Reti (IP, DNS, porte, nmap, tcpdump, sottoreti) | capitoli 02 e 09 |
| Web (HTTP, SQLi, XSS, path traversal dal lato log) | capitolo 07 |
| Blue Team (SIEM, MITRE, IOC, threat hunting, incident response) | capitoli 04 e 08, operazioni 02/04/05/08 |
| Hardening e privilegi (dal lato difesa) | capitolo 11 |
| Windows e Active Directory (Event ID) | capitolo 12 |
| Cloud, strumenti, laboratorio, report, carriera | capitolo 13 |
| Crittografia, hash, password | capitolo 06 |

## Da aggiungere (in ordine di priorità)

1. **Fondamenti di sicurezza** (nuovo capitolo, prima dei comandi): triade CIA, minacce/vulnerabilità/rischio,
   tipi di attaccanti e malware (virus, worm, trojan, ransomware, RAT, rootkit), tipi di controlli
   (preventivi, di rilevamento, correttivi), difesa in profondità, privacy e GDPR, NIS2, ISO 27001 e NIST CSF.
2. **Lezioni riscritte con esempi diversi dagli esercizi** per tutti i capitoli (fatto per i 5 casi più evidenti;
   da estendere a tutte le missioni, partendo dai capitoli 01-04).
3. **OWASP Top 10 completa** (oggi coperte solo injection, XSS, path traversal, esposizione di informazioni):
   controllo accessi, autenticazione e sessioni, SSRF, componenti vulnerabili, deserializzazione, configurazioni errate.
4. **Analisi del phishing in profondità**: header delle email, SPF/DKIM/DMARC letti da un messaggio, URL sospetti,
   allegati, indicatori; playbook del SOC L1.
5. **Ciclo di vita del SOC**: ticketing, severità e priorità, escalation, playbook, metriche (MTTD/MTTR), turni.
6. **Reti avanzate**: DHCP, NAT, firewall e regole (iptables/ufw), VPN, Wi-Fi e sue minacce, IDS con regole Suricata.
7. **Penetration testing (in laboratorio autorizzato)**: metodologia (PTES), enumerazione, vulnerabilità note,
   uso di Metasploit e Burp in ambiente di laboratorio, report di pentest.
8. **Forensics di base**: catena di custodia, acquisizione, timeline, memoria, artefatti Windows e Linux.
9. **Scripting**: Python di base per la sicurezza (parsing di log, richieste HTTP, hashing).
10. **Esami simulati**: quiz a tempo in stile Security+ / CySA+ con domande a risposta multipla e a scenario.

## Come si lavora

Ogni capitolo nuovo segue lo stesso schema: lezioni con esempio diverso dall'esercizio, compiti con comandi
nascosti, quiz, almeno una Operazione, test automatici (partita completa) e voci nel Manuale.

## Aggiunto nella 1.3

- **Memoria** (pannello a parte): carte a ripetizione spaziata generate dal Manuale (nomi dei comandi, opzioni, esempi) e da mazzi di codici (porte, codici HTTP, Event ID, permessi, sottoreti, percorsi dei log, tattiche ATT&CK, CVSS). Tre livelli per carta: riconoscere, ricomporre, scrivere. Le carte si sbloccano avanzando nel corso; i comandi del Manuale non trattati in una missione entrano alla fine del capitolo più vicino.
- **Simulazioni con una storia**: ogni sfida casuale ha un committente e un motivo.

## Aggiunto nella 1.4

- **Schede di studio**: prima del primo esercizio che usa un comando (o un concetto come pipe, redirezioni, variabili) il corso inserisce una lezione completa presa dal Manuale: a cosa serve, sintassi, tutte le opzioni, esempi diversi dall'esercizio, errori comuni. L'esercizio che segue ha il comando sfocato. 45 schede in tutto il corso (`src/content/schede.ts`).
- **Capitolo F · Fondamenti di sicurezza** (dopo il capitolo 01): triade CIA e AAA, rischio e controlli, attori e tipi di attacco, Kill Chain, autenticazione e ciclo di vita degli account, legge, perimetro, GDPR, standard e ruoli. Tre nuovi mazzi di Memoria.
- Schede del Manuale approfondite per ssh, ssh-keygen, whois, exiftool, crtsh, cve, nano.

Restano da fare: riscrittura narrativa a mano delle lezioni 01–04, OWASP Top 10 completo, analisi del phishing, ciclo di vita del SOC, reti avanzate, pentest in laboratorio, forensics, Python, esami a tempo.

## Aggiunto nella 1.5

- **Coach** (`src/game/coach.ts`): diario dei comandi per missione e analisi automatica. Riconosce errori di battitura (con il comando giusto), percorsi sbagliati, errori ripetuti senza leggere il messaggio, catene riscrivibili (`cat | grep`, `grep | wc -l`, `sort | uniq`, `grep | head -n 1`), spostamenti inutili con `cd`, file enormi letti con `cat`, comandi lunghi riscritti a mano, `rm -r` senza guardare, `chmod 777`, `sudo` superfluo, scansioni fuori perimetro, troppi suggerimenti o risposte sbagliate; e segnala anche ciò che fai bene. Consigli a fine missione, debriefing a fine capitolo (anche dalla mappa).

## Aggiunto nella 1.6

- Coach anche nelle Simulazioni e nelle Operazioni (soglie di efficienza diverse per modalità; i complimenti solo se gli obiettivi sono stati raggiunti).
- **7.4 La Top 10**: tutte le categorie OWASP 2021 con esempi e cure. **7.5 Il negozio di Judy**: audit autorizzato su un sito simulato (IDOR, header e versioni, backup esposto, SSRF e password nei log), classificazione e struttura del report.
- **8.4 Anatomia di un phishing**: intestazioni (Received, Reply-To, Return-Path), SPF/DKIM/DMARC, lettura dei link, ricerca della campagna nei log di consegna e del proxy, procedura di risposta.
- Mazzi di Memoria: OWASP Top 10, analisi delle email.
- Le missioni già completate restano rigiocabili anche se ne vengono aggiunte di nuove prima.


## Aggiunto nella 1.7

- **8.5 L'incidente, dall'inizio alla fine**: ciclo NIST SP 800-61, evento/allarme/incidente, triage e gravità, timeline da più fonti (`cat *.log | sort`), web shell, persistenza via cron, contenimento senza spegnere, eradicazione, ripristino, report e lezioni apprese.
- **Capitolo DF · Analisi forense** (dopo il 12): copie forensi, write blocker, impronte e catena di custodia, ordine di volatilità; firme dei file (`file`, `xxd`), `strings`, IOC e bollettini; date MACB, timeline del filesystem, timestomping, `.bash_history`. Lo stesso caso (Kiroshi) collega incidente e forense.
- `file` riconosce anche JPEG, eseguibili Windows e immagini disco.
- Mazzo di Memoria: incidenti e forense.


## Aggiunto nella 1.8

- **Python nel terminale** (`src/engine/pyparse.ts`, `python.ts`, `pycmd.ts`): mini interprete Python 3 vero. Variabili, if/elif/else, for/while, funzioni e lambda, liste, tuple, dizionari, insiemi, comprehension, f-string con formato, slicing, try/except/finally, with open() in lettura e scrittura, sys.argv e stdin; moduli sys, os, os.path, re, hashlib (sha256), base64, json, collections (Counter, defaultdict), math, random, string, time. Errori e traceback come nel vero Python (con il suggerimento "Did you mean"). Niente classi né rete.
- **Capitolo PY · Python per la sicurezza** (dopo il 06): primo script e lettura degli errori; decisioni, liste, cicli, dizionari, funzioni (porte rischiose, scala CVSS); log con open, split, Counter, re, set, sys.argv; hashlib e verifica di firmware, os, JSON di configurazioni cloud, try/except.
- Sfide Python nelle Simulazioni (sempre diverse) e mazzo di Memoria "Python essenziale".
- Il codice in linea lungo va a capo invece di uscire dallo schermo.


## Aggiunto nella 1.9

- **Capitolo PT · Pentest guidato** (dopo l'11): incarico completo su un server di laboratorio (range.lan). Fasi PTES/NIST 800-115, black/grey/white box, regole d'ingaggio ed esclusioni; ricognizione con `nmap -sV`, robots.txt, directory listing e file di configurazione dimenticato; vulnerabilità note (`cve`), una sola prova di accesso con riuso della password, `sudo -l`, script di root modificabile, senza mai sfruttare né modificare; report con gravità; riverifica su range2.lan (risolto / parziale / aperto). Percorso di allenamento e certificazioni.
- Nuove voci CVE (Jenkins, MySQL) e mazzo di Memoria "Pentest".


## Aggiunto nella 1.10

- **Esami simulati** (pulsante Esami nella mappa e in Giochi): esame sui capitoli completati (30 domande, 30 minuti), esame finale junior (60 domande, 60 minuti), prova pratica nel terminale (8 sfide Difficile, 40 minuti, senza suggerimenti). Soglia 75%. Domande bilanciate per capitolo da quiz delle missioni, banca di 38 scenari in stile certificazione (`src/content/exam-bank.ts`) e carte di Memoria. Durante l'esame niente correzioni: griglia delle domande, "rivedi dopo", consegna o tempo scaduto; poi punteggio, dettaglio per capitolo, aree da ripassare e spiegazione di ogni errore. Storico degli ultimi tentativi e indicatore "pronto" dopo tre finali superati.


## Aggiunto nella 1.11

- **9.5 I guardiani della rete**: firewall (filtro, stateful, NGFW, WAF), DMZ, NAT, forward e reverse proxy, ispezione TLS, IDS/IPS (NIDS/HIDS, firme e anomalie, falsi positivi e negativi), lettura di una regola Suricata, Sigma, VPN (accesso remoto, sito-sito, split/full tunnel), ZTNA. Esercizi su log del proxy, allarmi Suricata e una regola locale.
- **Revisione per principianti** dei capitoli 01-04: definiti server, distribuzione, kernel, byte, log, sudo, CPU e RAM, router, cifrato e in chiaro, database, ARP, TTL, pool di mining; struttura comando/opzioni/argomenti con un esempio; distinzione tra opzioni ("flag") e flag delle CTF; spiegato il conteggio dei campi per `cut -f 11`; parole chiave do/done/then/else/fi. Corretti i rimandi a capitoli successivi presentati come già visti.
- **Glossario attivo**: 189 termini spiegati in parole semplici (`src/content/glossary.ts`). Nelle lezioni e nelle sfide la prima occorrenza di ogni termine è sottolineata e si tocca per leggere la definizione; nel Codex c'è il glossario completo con ricerca.

Il programma previsto in questo documento è completo. Prossimi passi possibili: approfondire i punti deboli che emergono dagli esami simulati.

## Aggiunto nella 1.12

- Effetti visivi con interruttore (classe `fx`, rispetta `prefers-reduced-motion`): transizione tra schermate con linea di scansione, comparsa a cascata, conteggio degli XP, riquadro "nuovo rango", obiettivo raggiunto che pulsa, risposta sbagliata che trema, logo che sfarfalla ogni tanto.
- Versione browser su GitHub Pages e salvataggio condiviso tramite Gist privato, con unione dei progressi tra dispositivi.

## Aggiunto nella 1.13 (riprogettazione didattica, fase 1)

- **Competenze** (`src/game/skills.ts`): ogni comando e concetto ha cinque stati calcolati da ciò che il giocatore fa davvero: introdotta (vista in una lezione), compresa (interpretazione, correzione o carta di Memoria salita), esercitata (un esercizio riuscito), acquisita (due situazioni diverse senza suggerimenti), consolidata (riusata senza aiuti almeno 7 giorni dopo). Pagina "Competenze" divisa per moduli; le prove si ricostruiscono dal diario delle missioni già giocate e si uniscono tra dispositivi.
- **Schede a livelli**: la prima scheda di un comando separa le opzioni che servono subito da quelle "per quando serviranno" (non si toglie nulla); quando un esercizio chiede un'opzione mai vista compare una scheda breve "Livello nuovo" con la sola opzione nuova, un esempio e le opzioni già note.
- **Aiuti che diminuiscono** (`src/game/hints.ts`): capitoli 01, F, 02, 03 suggerimenti liberi; 04, 05, 06, PY, 07 il suggerimento si sblocca dopo il primo tentativo; dal capitolo 08 si chiede con una conferma. Vale anche per il comando `hint`.
- **Palestra dei comandi** (`src/content/palestra.ts`): 57 esercizi brevi generati a caso su 27 competenze (navigazione, file, redirezioni, grep in 7 varianti, find, head/tail, wc, sort/uniq, cut, awk, sed, tr, diff, chmod, base64, sha256sum), in tre livelli. Serie su un comando (dal livello 1 al 3) o allenamento misto sulle competenze più deboli.
- **Interpreta l'output / correggi l'errore**: 29 esercizi nuovi nelle missioni dei capitoli 01-04, prima delle verifiche finali. Gli esercizi esistenti restano tutti.
- I progressi salvati con le versioni precedenti vengono spostati sullo stesso passo (`src/game/migrate.ts`), anche quando arrivano dal cloud o da un backup.

## Aggiunto nella 1.14 (riprogettazione didattica, fase 2)

- **Capitolo AM · Amministrare Linux** (dopo il 04, `src/content/chAM-amministrare.ts`): stato della macchina (uname, uptime, free, df, which); il servizio che non parte (systemctl --failed/status, journalctl -u e -g, chi ha cambiato il file, correzione con `sudo nano`, `nginx -t`, restart); il diario di sistema (priorità, --since/--until, last, lastb); il disco pieno (df, du | sort -h, ls -lhS, /etc/crontab, tar czf/tzf, togliere la causa senza buttare le prove). Gli scenari sono collegati: il backup fallisce perché /var è pieno, /var è pieno per un log di debug lanciato da cron.
- **Motore**: servizi e diario di sistema guidati da file del deck (`src/engine/sysinfo.ts`): stati active/failed/inactive, enabled, restart che fallisce finché la configurazione è sbagliata, voci con priorità e filtri reali; `df` per partizione; `sort -h`; comando `nginx -t`; sudo anche per systemctl, journalctl, lastb, nginx e nano sui file di /etc. Le modifiche ai file di sistema (/etc/nginx, /etc/crontab, servizi, diario) si salvano con il deck.
- **2.4 Diagnosi di rete**: la scala del troubleshooting (ip route, ping -c, nslookup, nc -zv, curl -I, traceroute, ss -tlnp).
- **5.4 Gli attrezzi del testo**: awk (campi, condizioni, -F), sed (sostituzioni, -E, anonimizzazione GDPR), tr -s, tee, xargs, diff.
- **Capitolo SO · Il turno al SOC** (dopo l'08, `src/content/chSOC-turno.ts`): coda degli allarmi, raggruppamento e priorità; vero/falso positivo, benigno, falso negativo, con le prove (VPN, trasferte, change, EDR, proxy); escalation con playbook e nota completa; passaggio di consegne e metriche MTTD/MTTR.
- Palestra: 12 esercizi nuovi (systemctl, journalctl, df, du, tar, crontab, tee, xargs). Glossario: 17 termini nuovi. Esami: 6 domande a scenario nuove.
- Le missioni aggiunte prima di quelle già completate restano aperte: chi è più avanti non viene bloccato.

## Aggiunto nella 1.15 (riprogettazione didattica, fase 3)

- **nmap a livelli** (`src/engine/shell.ts`): intervalli di porte e `-p-` (le porte sopra la 10000 restano nascoste alla scansione predefinita), `-O` dal TTL con obbligo di root, script NSE (`-sC`, `--script` http-title, ssh-hostkey, ftp-anon, mysql-info, banner, vuln con le CVE del deck), `-A`, `-oN`, `--open`; sudo consentito per nmap, sempre con i controlli di perimetro. Missione **PT.5 nmap fino in fondo** su due macchine di laboratorio (porta 27017 nascosta, FTP anonimo, Windows Server da riconoscere).
- **PowerShell simulato** (`src/engine/pwsh.ts`): `pwsh` apre la console (prompt `PS ...`, `exit` per uscire, `pwsh -c` per una riga); pipeline di oggetti con Get-ChildItem, Get-Content, Select-String, Where-Object (blocchi `{ $_.Prop -op valore }` con -and/-or), Select-Object, Sort-Object, Group-Object, Measure-Object, Format-List/Table; su Windows remoto (`Enter-PSSession`) Get-Process, Get-Service, Get-ScheduledTask, Get-NetTCPConnection, Get-LocalUser, Get-LocalGroupMember, Get-WinEvent -FilterHashtable, Get-FileHash, Stop-Process, Disable-ScheduledTask, Disable-LocalUser.
- **12.4 Oggetti, non testo** e **12.5 Risposta a distanza**: sul PC del phishing del capitolo SOC si raccolgono processi, connessione al C2, persistenza, backdoor, timeline degli eventi e hash, poi si contiene senza distruggere le prove.
- **Capitolo SJ · Una settimana da junior** (prima del 13): lunedì revisione degli accessi, martedì vulnerability assessment con priorità, mercoledì password spraying su un file server, giovedì hardening SSH, venerdì report settimanale in inglese con il lessico del mestiere. Diversi esercizi senza suggerimenti.
- Palestra: 6 esercizi nuovi (nmap avanzato, PowerShell). Glossario e banca degli esami ampliati.
- 1.15.1: completamento con Tab in PowerShell (cmdlet, alias, parametri, valori noti come -ComputerName/-TaskName/-Group/-LogName, percorsi con `\` su Windows); Tab ripetuto passa alla proposta successiva, come in PowerShell su Windows.

## Aggiunto nella 1.16 (più verifiche, controllo per principianti)

- **Verifica di fine capitolo** (`src/game/chaptertest.ts`): test cumulativo per ogni capitolo, 12 elementi del capitolo + 6 di ripasso dei precedenti scelti tra le carte più deboli; mescola domande a scelta, "ricomponi il comando" e "scrivi il comando"; gli errori tornano in coda (fino a 3 volte) e aggiornano la ripetizione spaziata di Memoria; soglia 80% al primo tentativo, +100 XP alla prima volta. Parte pratica: 4 esercizi nel terminale sulle competenze del capitolo (Palestra e sfide generate), validi solo senza suggerimenti. Risultati in mappa (due stelle per capitolo) e uniti tra dispositivi.
- **Ripasso lampo**: prima di ogni missione nuova, tre domande sulle missioni già completate (due carte di Memoria, prima quelle in scadenza, e una domanda); disattivabile in Opzioni.
- **89 domande di verifica nuove** (`src/content/quiz-extra.ts`) per le missioni che ne avevano una sola: ora ogni missione ne ha almeno due. Le opzioni di tutte le domande vengono mescolate in modo stabile: la risposta giusta non è più sempre la prima nelle domande recenti.
- **Controllo automatico per principianti**: nessun comando è richiesto prima di essere spiegato; 15 sigle senza spiegazione aggiunte al glossario (TTL, IT, DHCP, SMB, RDP, GET, POST, SANS, CRM, GPS, ZIP, PIN, SMS, GB, PDF); un suggerimento vago reso esplicito (5.3).

## Aggiunto nella 1.17 (lezioni sui comandi)

- Le "schede" inserite prima degli esercizi (una copia del Manuale) sono sostituite da **lezioni raccontate da Nyx** (`src/content/teach.ts`, 71 comandi e concetti, cioè tutti quelli che il corso introduce): perché serve, cosa fa, il comando smontato pezzo per pezzo, la risposta vera del terminale e come si legge, solo le opzioni che servono nell'esercizio seguente, gli errori tipici con il messaggio reale e il suo significato, la cosa da ricordare. Le altre opzioni restano in fondo, sotto "Per dopo".
- **Esempi dal vivo** (`src/content/live.ts`): i comandi degli esempi vengono eseguiti su un deck pulito quando la lezione viene mostrata, e sotto compare l'output vero. Un test esegue tutti gli esempi di tutte le lezioni e verifica che funzionino e che gli "errori tipici" producano davvero un errore.
- Gli esempi usano solo comandi già incontrati e non mostrano la risposta dell'esercizio che segue. Tolta la frase "Esempi (diversi dall'esercizio che ti aspetta)…".
- Le lezioni brevi per un'opzione nuova ("Un passo in più") mostrano l'opzione in azione, senza altre opzioni non ancora viste.

## Aggiunto nella 1.18 (riscrittura per principianti, capitolo 01)

- **Capitolo 01 riscritto da capo** con una trama: una notte sola, sopra il bar Lo Scantinato, per dimostrare a Nyx di poter lavorare per Rook; ogni missione è un'ora della notte, l'ultima è il primo contratto all'alba.
- **Si scrive subito**: nella prima missione il primo comando arriva dopo una schermata; la teoria (prompt, terminale e shell, Linux) viene dopo aver provato. La lezione sul primo comando è mostrata dopo l'esercizio (`lessonAfter`).
- Ogni termine è spiegato dove compare (comando, argomento, opzione, percorso, radice, home, permessi, byte, backup, log, flag, CTF); nuova lezione "Comando e argomento"; lo schema comando-opzioni-argomenti arriva solo quando serve.
- I compiti raccontano cosa fare e perché, senza ripetere la lezione di Nyx che li precede; tolte le mini-lezioni automatiche dove il compito spiega già l'opzione (`ownLesson`).
- I capitoli successivi verranno riscritti con lo stesso criterio, uno alla volta.

## Aggiunto nella 1.19 (riscrittura per principianti, capitoli F, 02 e 03)

- **Capitolo F riscritto** con una trama: il giorno dopo la notte del capitolo 01, alla scrivania di Rook nel retro di Lo Scantinato. Ogni missione è un'ora della giornata con un cliente diverso (la clinica, l'emporio Tanaka, Neon Ottica, lo studio dentistico Kabuki, il contratto della sera); alla fine Rook ti manda da Mama Reyes, il capitolo 02.
- Si comincia dal terminale: prima si leggono le segnalazioni dei clienti con `cat`, poi arriva la teoria della triade CIA.
- Ogni termine spiegato dove compare (ransomware, cifrare, backup, BEC, IBAN, log, MFA, NIST, impronta della password, indirizzo IP); liste lunghe divise in lezioni più brevi, con esempi concreti.
- Nuove lezioni: "Cosa si fa con un rischio", "Non tutti i secondi fattori sono uguali", "Altri attacchi da riconoscere" (brute force, password spraying, credential stuffing, DoS, man in the middle, supply chain).
- Nuovi esercizi: leggere le segnalazioni del mattino; riconoscere la mail di phishing tra tre messaggi (`fondamenti/messaggi.txt`). La missione F.3 ora ha un esercizio pratico.
- Il caso dello studio commercialisti si chiude nella lezione sul GDPR (notifica entro 72 ore).
- **Capitolo 02 riscritto** con una trama: il primo lavoro per Mama Reyes. Il jukebox del bar si accende da solo alle tre di notte; scopri dove sei, chi c'è in rete, quali porte sono aperte, e che il "musicista" entra via telnet con la password di fabbrica. La missione 2.4 (la cassa che non va) è il giorno dopo.
- Nella 2.1 si scrive `ip a` subito, e la lezione sul comando viene dopo. Nuovi esercizi: privato o pubblico (2.1), l'indirizzo del jukebox (2.2), scrivere il primo rigo del report con `echo` (2.3). Nuova lezione "Le porte da conoscere a memoria" con cifrato/in chiaro e database spiegati; il perimetro richiama il capitolo F invece di ripeterlo; spiegati host, SYN/ACK, CIDR, server web, CVE e la notazione IP:porta.
- Mama ha la sua voce nelle lezioni.
- **Capitolo 03 riscritto** con una trama: Mama ti affida il vecchio server del bar, messo su "alla buona" anni fa. Impari come Linux sa chi è chi (3.1), fai l'audit dei permessi (3.2: la password della cassa leggibile da tutti, lo script notturno modificabile da chiunque) e cerchi le copie dimenticate (3.3). Il capitolo finisce con il messaggio di Mama alle sei del mattino che apre il capitolo 04.
- Nella 3.2 si guardano prima i file con `ls -la`, poi arriva la teoria dei permessi. Nuovi esercizi: la home di Mama in /etc/passwd (3.1), ricontrollare i permessi dopo chmod (3.2), trovare un processo con `ps aux | grep sshd` (3.3). Spiegati campo, sudo, audit, file di configurazione, script, compromesso, privilege escalation, PID, CPU, RAM, IoC; le lezioni non ripetono più quello che spiegano già le schede dei comandi; la lezione sulle password riprende l'impronta del capitolo F.
