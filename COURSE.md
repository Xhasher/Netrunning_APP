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

Restano: Python per la sicurezza, reti avanzate (VLAN, VPN, proxy, IDS/IPS), pentest guidato in laboratorio, esami simulati a tempo.
