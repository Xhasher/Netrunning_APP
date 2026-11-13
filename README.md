# Night City Netrunning

Un gioco per Android che insegna **ethical hacking, penetration testing e cyber defense** partendo da zero, in italiano, con ambientazione cyberpunk.

Si gioca in un **terminale Linux simulato**: comandi, file, rete e bersagli sono tutti finti, quindi si può sperimentare senza rischi e senza connessione.

## Contenuti (v1.1): il corso completo

| Capitolo | Missioni | Argomenti |
|---|---|---|
| 01 · Jack-in | 6 | cos'è Linux, il terminale, il prompt, `whoami`, `pwd`, `ls`, `cd`, percorsi, `cat`, file nascosti, `man`, `ls -l`, `echo`, `history`, `mkdir`, `touch`, `>` e `>>`, `cp`, `mv`, `rm`, `tree`, prima CTF |
| 02 · Rete di quartiere | 3 | reti, indirizzi IP, `ip a`, `ping`, DNS, firewall, porte, TCP, scope e legge (art. 615-ter c.p.), `nmap`, CVE, report di pentest |
| 03 · Linux in profondità | 3 | utenti e gruppi, `id`, `/etc/passwd`, `/etc/shadow` e hash, permessi e `chmod`, audit, minimo privilegio, `find`, pipe, `grep`, `wc`, `ps aux` |
| 04 · Primo turno al SOC | 3 | log e `/var/log`, `head`/`tail`, brute force, `cut \| sort \| uniq -c`, intrusione, cryptominer, timeline, `sudo ufw`, incident response, rapporto d'incidente |
| 05 · Scripting | 3 | variabili, `$(...)`, stdout/stderr, `2>/dev/null`, `nano`, shebang, `chmod +x`, argomenti `$1`, cicli `for`, `if` e `test`, script di allarme |
| 06 · Crittografia e password | 3 | codifica vs cifratura vs hash, `base64`, cifratura simmetrica e asimmetrica, TLS/HTTPS, SHA-256, `sha256sum -c`, supply chain attack, sale e hash lenti, password manager, MFA |
| 07 · Web security | 3 | URL e HTTP, codici di stato, header, `curl`, information disclosure, robots.txt, security through obscurity, `access.log`, scanner, SQL injection, XSS, path traversal e relative difese |
| 08 · Blue Team avanzato | 3 | SIEM e normalizzazione, regole di rilevamento, password spraying, Cyber Kill Chain, MITRE ATT&CK, threat intelligence, IOC, threat hunting nei log DNS e per hash, IDS |
| 09 · Reti avanzate | 4 | modello OSI e TCP/IP, incapsulamento, MAC e ARP, ARP spoofing, routing, CIDR e sottoreti con `ipcalc`, segmentazione e VLAN, `tcpdump`, flag TCP, protocolli in chiaro, scansioni SYN, chiavi SSH, known_hosts, tunnel e VPN |
| 10 · Ricognizione e OSINT | 4 | OSINT e limiti etici/legali (GDPR), `whois`, `dig` (A, MX, TXT, NS), SPF/DKIM/DMARC, certificate transparency (`crtsh`), shadow IT, metadati con `exiftool`, effetto mosaico, CVE, CVSS, NVD e KEV, priorità delle correzioni |
| 11 · Rinforzare i sistemi | 4 | cosa fa un attaccante dopo l'accesso (dal punto di vista di chi difende), `sudo -l` e regole pericolose, file SUID, credenziali nei file, `ss -tlnp`, `apt list --upgradable`, configurazione SSH sicura, CIS Benchmarks, riuso delle credenziali, difesa in profondità, EDR, backup 3-2-1, zero trust |
| 12 · Windows e Active Directory | 3 | struttura di Windows, PowerShell (alias `Get-Content`, `Select-String`...), Active Directory, Domain Controller, gruppi privilegiati, tiering, Kerberos e NTLM, Event ID (4624, 4625, 4672, 4720, 4728, 7045, 1102), Sysmon, log centralizzati |
| 13 · Cloud e carriera | 4 | cloud e responsabilità condivisa, IAM, storage pubblici, chiavi nel codice, cassetta degli attrezzi (Wireshark, Burp, Wazuh, Sysmon, Autopsy, CyberChef...), `alias` e `cheat`, guida al laboratorio di casa, report professionale, percorso di carriera e colloqui |

Altre modalità:
- **Operazioni**: simulatore in stile console. Ti colleghi con `ssh` ai server simulati dei clienti, indaghi con comandi reali e segnali i problemi con `report`. Nove contratti: audit di un server (OP-01), incident response su un'intrusione (OP-02), audit di un sito web (OP-03), threat hunting a partire da un bollettino di IOC (OP-04), analisi forense di rete (OP-05), impronta pubblica di un'azienda (OP-06), hardening di un server (OP-07), incidente in un dominio Windows (OP-08), audit di una configurazione cloud (OP-09).
- **Terminale libero**: il Linux simulato senza missioni, con esercizi liberi in `palestra/`.
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
