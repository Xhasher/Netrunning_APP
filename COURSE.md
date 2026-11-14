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
