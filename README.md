# Night City Netrunning

Un gioco per Android che insegna **ethical hacking, penetration testing e cyber defense** partendo da zero, in italiano, con ambientazione cyberpunk.

Si gioca in un **terminale Linux simulato**: comandi, file, rete e bersagli sono tutti finti, quindi si può sperimentare senza rischi e senza connessione.

## Contenuti (v1.2)

| Capitolo | Missioni | Argomenti |
|---|---|---|
| 01 · Jack-in | 6 | cos'è Linux, il terminale, il prompt, `whoami`, `pwd`, `ls`, `cd`, percorsi, `cat`, file nascosti, `man`, `ls -l`, `echo`, `history`, `mkdir`, `touch`, `>` e `>>`, `cp`, `mv`, `rm`, `tree`, prima CTF |
| F · Fondamenti di sicurezza | 5 | triade CIA, AAA e non ripudio, asset/minacce/vulnerabilità/rischio, controlli, difesa in profondità, minimo privilegio, attori di minaccia, malware, ingegneria sociale, Kill Chain, MFA e password, ciclo di vita degli account, art. 615-ter, perimetro, divulgazione responsabile, GDPR, ISO 27001, NIST CSF, ruoli |
| 02 · Rete di quartiere | 3 | reti, indirizzi IP, `ip a`, `ping`, DNS, firewall, porte, TCP, scope e legge (art. 615-ter c.p.), `nmap`, CVE, report di pentest |
| 03 · Linux in profondità | 3 | utenti e gruppi, `id`, `/etc/passwd`, `/etc/shadow` e hash, permessi e `chmod`, audit, minimo privilegio, `find`, pipe, `grep`, `wc`, `ps aux` |
| 04 · Primo turno al SOC | 3 | log e `/var/log`, `head`/`tail`, brute force, `cut \| sort \| uniq -c`, intrusione, cryptominer, timeline, `sudo ufw`, incident response, rapporto d'incidente |
| 05 · Scripting | 3 | variabili, `$(...)`, stdout/stderr, `2>/dev/null`, `nano`, shebang, `chmod +x`, argomenti `$1`, cicli `for`, `if` e `test`, script di allarme |
| 06 · Crittografia e password | 3 | codifica vs cifratura vs hash, `base64`, cifratura simmetrica e asimmetrica, TLS/HTTPS, SHA-256, `sha256sum -c`, supply chain attack, sale e hash lenti, password manager, MFA |
| PY · Python per la sicurezza | 4 | `python3`, variabili e tipi, f-string, traceback, if/for/while, liste e dizionari, funzioni, file con `with open`, `split`, `Counter`, `re`, `set`, `sys.argv`, `hashlib`, `os`, `json`, `try/except` |
| 07 · Web security | 5 | URL e HTTP, codici di stato, header, `curl`, information disclosure, robots.txt, security through obscurity, `access.log`, scanner, SQL injection, XSS, path traversal; OWASP Top 10 completa; audit autorizzato di un negozio (IDOR, versioni esposte, file di backup, SSRF, password nei log) e struttura del report |
| 08 · Blue Team avanzato | 5 | SIEM e normalizzazione, regole di rilevamento, password spraying, Cyber Kill Chain, MITRE ATT&CK, threat intelligence, IOC, threat hunting nei log DNS e per hash, IDS; analisi del phishing (intestazioni, SPF/DKIM/DMARC, link, campagna, risposta); gestione completa di un incidente (NIST SP 800-61) |
| 09 · Reti avanzate | 5 | modello OSI e TCP/IP, incapsulamento, MAC e ARP, ARP spoofing, routing, CIDR e sottoreti con `ipcalc`, segmentazione e VLAN, `tcpdump`, flag TCP, protocolli in chiaro, scansioni SYN, chiavi SSH, known_hosts, tunnel e VPN; firewall, DMZ, NAT, proxy, IDS/IPS, regole Suricata, VPN aziendali |
| 10 · Ricognizione e OSINT | 4 | OSINT e limiti etici/legali (GDPR), `whois`, `dig` (A, MX, TXT, NS), SPF/DKIM/DMARC, certificate transparency (`crtsh`), shadow IT, metadati con `exiftool`, effetto mosaico, CVE, CVSS, NVD e KEV, priorità delle correzioni |
| 11 · Rinforzare i sistemi | 4 | cosa fa un attaccante dopo l'accesso (dal punto di vista di chi difende), `sudo -l` e regole pericolose, file SUID, credenziali nei file, `ss -tlnp`, `apt list --upgradable`, configurazione SSH sicura, CIS Benchmarks, riuso delle credenziali, difesa in profondità, EDR, backup 3-2-1, zero trust |
| PT · Pentest guidato | 4 | fasi di un pentest (PTES, NIST 800-115), black/grey/white box, regole d'ingaggio, `nmap -sV`, robots.txt, directory listing, credenziali dimenticate, `cve` e KEV, prova minima e riuso delle password, `sudo -l` e GTFOBins, script di root, report con gravità, riverifica |
| 12 · Windows e Active Directory | 3 | struttura di Windows, PowerShell (alias `Get-Content`, `Select-String`...), Active Directory, Domain Controller, gruppi privilegiati, tiering, Kerberos e NTLM, Event ID (4624, 4625, 4672, 4720, 4728, 7045, 1102), Sysmon, log centralizzati |
| DF · Analisi forense | 3 | copie forensi, write blocker, impronte, catena di custodia, ordine di volatilità, firme dei file (`file`, `xxd`), `strings`, IOC, date MACB, timeline del filesystem, timestomping, `.bash_history` |
| 13 · Cloud e carriera | 4 | cloud e responsabilità condivisa, IAM, storage pubblici, chiavi nel codice, cassetta degli attrezzi (Wireshark, Burp, Wazuh, Sysmon, Autopsy, CyberChef...), `alias` e `cheat`, guida al laboratorio di casa, report professionale, percorso di carriera e colloqui |

Altre modalità:
- **Operazioni**: simulatore in stile console. Ti colleghi con `ssh` ai server simulati dei clienti, indaghi con comandi reali e segnali i problemi con `report`. Nove contratti: audit di un server (OP-01), incident response su un'intrusione (OP-02), audit di un sito web (OP-03), threat hunting a partire da un bollettino di IOC (OP-04), analisi forense di rete (OP-05), impronta pubblica di un'azienda (OP-06), hardening di un server (OP-07), incidente in un dominio Windows (OP-08), audit di una configurazione cloud (OP-09).
- **Terminale libero**: il Linux simulato senza missioni, con esercizi liberi in `palestra/`.
- **Manuale**: ~85 schede di comandi e concetti della shell (pipe, redirezioni, variabili, cicli, regex), con tutte le opzioni, esempi diversi dagli esercizi (verificati da un test automatico) e note sull'uso professionale. Si apre dal pulsante in mappa e dal libro 📖 in ogni schermata; le lezioni linkano le schede dei comandi che spiegano. `man COMANDO` mostra la stessa scheda nel terminale.
- **Comandi nascosti nei compiti**: i comandi spiegati in una lezione o già usati compaiono sfocati e si aprono al tocco, per costringerti a ricordarli (si disattiva in Opzioni).
- **Analisi del lavoro (coach)**: il gioco registra i comandi che scrivi e come ti muovi nel filesystem. A fine missione Nyx ti dà i consigli più utili; a fine capitolo c'è un debriefing completo (statistiche, punti di forza, abitudini da correggere, con la tua riga e una versione migliore).
- **Esami simulati**: teorico sui capitoli completati, finale su tutto il corso e prova pratica nel terminale, a tempo e con soglia del 75%, come le certificazioni. Risultati per capitolo, aree da ripassare e spiegazione di ogni errore.
- **Glossario attivo**: ogni termine tecnico nelle lezioni è sottolineato e si tocca per leggerne la spiegazione; il glossario completo, con ricerca, è nel Codex.
- **Gioca anche da PC**: la versione browser è su https://xhasher.github.io/Netrunning_APP/ (pubblicata automaticamente da `.github/workflows/pages.yml`). Su PC la lezione sta a sinistra e il terminale a destra; Esc fa da tasto indietro.
- **Progressi condivisi tra telefono e PC**: in Opzioni › Gioca su più dispositivi si collega un token GitHub con il solo permesso `gist`. I progressi vengono salvati in un Gist privato dell'utente e **uniti** (non sovrascritti) tra i dispositivi: missioni, XP, Memoria ed esami si sommano. Nessun server esterno (`src/game/sync.ts`).
- **Effetti visivi** discreti (transizioni, conteggio XP, promozioni di rango), disattivabili in Opzioni e spenti automaticamente se il sistema chiede di ridurre il movimento.
- **Memoria**: allenamento quotidiano di 5 minuti a ripetizione spaziata. Esercizi in tre livelli (scegli, ricomponi, scrivi) su comandi, opzioni e codici da sapere a memoria; le carte tornano poco prima di essere dimenticate, con serie di giorni consecutivi.
- **Simulazioni**: sfide pratiche generate a caso, sempre diverse, sui capitoli scelti, con tre livelli di difficoltà (Facile, Medio, Difficile). Riepilogo finale con le soluzioni.
- **Giochi**: *Phishing o no?* (riconoscere email e SMS truffa), *Turno al SOC* (triage degli allarmi), *Allenamento* (quiz di ripasso).
- **Codex** (glossario) e **Carriera** (laboratori legali gratuiti, certificazioni e i **Trucchi del mestiere**: consigli pratici su terminale, metodo, studio e lavoro, uno dei quali compare a caso sulla mappa).
- Nel terminale: `alias`, `!!`, `cheat` (promemoria rapidi per argomento).

## Scaricare l'APK

A ogni push, GitHub Actions compila l'APK:

- **Release "apk-latest"** del repository: scarica `NightCity-Netrunning.apk` direttamente dal telefono.
- In alternativa, nella scheda **Actions**, apri l'ultima esecuzione di "Build APK" e scarica l'artifact (è uno zip).

Per installarlo su Android devi permettere l'installazione da "origini sconosciute" per il browser o il file manager.

## Aggiornare l'app senza perdere i progressi

Dalla versione 1.1.1 l'app ha l'identificativo `it.nightcity.netrunningapp`. Ogni APK è firmato con la stessa chiave
(`signing/netrunning.keystore`) e ha un numero di versione crescente, quindi si installa **sopra** la versione
precedente mantenendo i salvataggi.

Se un aggiornamento viene rifiutato (di solito perché la copia installata è firmata con un'altra chiave),
Android non permette di forzarlo: in **Opzioni → Backup dei progressi** c'è un codice da copiare prima di reinstallare,
e **Recupera progressi** permette di ripartire da un capitolo.

## Piano del corso

`COURSE.md` elenca cosa è coperto e cosa manca per arrivare a un livello junior.

## Sviluppo

```bash
npm install
npm run dev      # gioca nel browser su http://localhost:5173
npm test         # test del motore e di tutte le missioni
npm run build    # build web in dist/
```

Per compilare l'APK in locale servono Android Studio (SDK) e Java 21:

```bash
ANDROID_HOME=/percorso/sdk ./scripts/build-apk.sh
```

## Struttura

```
src/engine/    shell finta (bash), filesystem virtuale, rete simulata, manuale dei comandi
src/content/   il deck del giocatore (file e cartelle) e i capitoli con le missioni
src/game/      salvataggi, progressione, verifica degli obiettivi
src/ui/        interfaccia: schermate, terminale, stile
tests/         test del motore + "walkthrough" che completa ogni missione
```

Per aggiungere un capitolo: crea `src/content/chNN-nome.ts` seguendo i modelli esistenti, aggiungilo a `CHAPTERS` in `src/content/index.ts` e aggiungi le soluzioni in `tests/walkthrough.test.ts`.

## Nota legale

Tutti i sistemi, le reti e i personaggi del gioco sono simulati o inventati. Le tecniche insegnate vanno usate **solo** su sistemi propri o con un'autorizzazione scritta. L'ambientazione si ispira all'immaginario cyberpunk. "Night City" è un marchio di CD PROJEKT: prima di un'eventuale pubblicazione sul Play Store il nome andrà cambiato.
