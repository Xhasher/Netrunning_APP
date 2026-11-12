# Night City Netrunning

Un gioco per Android che insegna **ethical hacking, penetration testing e cyber defense** partendo da zero, in italiano, con ambientazione cyberpunk.

Si gioca in un **terminale Linux simulato**: comandi, file, rete e bersagli sono tutti finti, quindi si può sperimentare senza rischi e senza connessione.

## Contenuti attuali (v0.3)

| Capitolo | Missioni | Argomenti |
|---|---|---|
| 01 · Jack-in | 6 | cos'è Linux, il terminale, il prompt, `whoami`, `pwd`, `ls`, `cd`, percorsi, `cat`, file nascosti, `man`, `ls -l`, `echo`, `history`, `mkdir`, `touch`, `>` e `>>`, `cp`, `mv`, `rm`, `tree`, prima CTF |
| 02 · Rete di quartiere | 3 | reti, indirizzi IP, `ip a`, `ping`, DNS, firewall, porte, TCP, scope e legge (art. 615-ter c.p.), `nmap`, CVE, report di pentest |
| 03 · Linux in profondità | 3 | utenti e gruppi, `id`, `/etc/passwd`, `/etc/shadow` e hash, permessi e `chmod`, audit, minimo privilegio, `find`, pipe, `grep`, `wc`, `ps aux` |
| 04 · Primo turno al SOC | 3 | log e `/var/log`, `head`/`tail`, brute force, `cut \| sort \| uniq -c`, intrusione, cryptominer, timeline, `sudo ufw`, incident response, rapporto d'incidente |
| 05 · Scripting | 3 | variabili, `$(...)`, stdout/stderr, `2>/dev/null`, `nano`, shebang, `chmod +x`, argomenti `$1`, cicli `for`, `if` e `test`, script di allarme |
| 06 · Crittografia e password | 3 | codifica vs cifratura vs hash, `base64`, cifratura simmetrica e asimmetrica, TLS/HTTPS, SHA-256, `sha256sum -c`, supply chain attack, sale e hash lenti, password manager, MFA |
| 07 · Web security | 3 | URL e HTTP, codici di stato, header, `curl`, information disclosure, robots.txt, security through obscurity, `access.log`, scanner, SQL injection, XSS, path traversal e relative difese |

Altre funzioni: **Allenamento** (quiz di ripasso a caso sulle missioni completate), **Codex** (glossario di tutto ciò che hai imparato), **Carriera** (laboratori legali gratuiti e certificazioni).

I capitoli 08-13 (reti avanzate, OSINT, hardening, Windows e Active Directory, Blue Team avanzato, cloud) sono nella mappa come "in arrivo".

## Scaricare l'APK

A ogni push, GitHub Actions compila l'APK:

- **Release "apk-latest"** del repository: scarica `NightCity-Netrunning.apk` direttamente dal telefono.
- In alternativa, nella scheda **Actions**, apri l'ultima esecuzione di "Build APK" e scarica l'artifact (è uno zip).

Per installarlo su Android devi permettere l'installazione da "origini sconosciute" per il browser o il file manager.

## Sviluppo

```bash
npm install
npm run dev      # gioca nel browser su http://localhost:5173
npm test         # test del motore e di tutte le missioni
npm run build    # build web in dist/
```

Per compilare l'APK in locale servono Android Studio (SDK) e Java 21:

```bash
npm run build
npx cap add android   # solo la prima volta
npx cap sync android
cd android && ./gradlew assembleDebug
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
