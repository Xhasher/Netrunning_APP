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
