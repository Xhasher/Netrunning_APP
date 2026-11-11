# Night City Edgerunner

Un gioco per Android che insegna **ethical hacking, penetration testing e cyber defense** partendo da zero, in italiano, con ambientazione cyberpunk.

Si gioca in un **terminale Linux simulato**: comandi, file, rete e bersagli sono tutti finti, quindi si può sperimentare senza rischi e senza connessione.

## Contenuti attuali (v0.1)

| Capitolo | Missioni | Argomenti |
|---|---|---|
| 01 · Jack-in | 5 | cos'è Linux, il terminale, il prompt, `whoami`, `pwd`, `ls`, `cd`, percorsi, `cat`, file nascosti, `man`, `ls -l` e permessi, `echo`, `history`, prima CTF |
| 02 · Rete di quartiere | 3 | reti, indirizzi IP, `ip a`, `ping`, ICMP, TTL, DNS, firewall, porte, TCP handshake, scope e legge (art. 615-ter c.p.), `nmap -sn`, `nmap`, `nmap -sV`, CVE, report |

Gli altri capitoli (da Linux avanzato fino a incident response e cloud) sono già nella mappa come "in arrivo". La sezione **Carriera** indica laboratori legali gratuiti e certificazioni per il percorso reale.

## Scaricare l'APK

A ogni push, GitHub Actions compila l'APK:

- **Release "apk-latest"** del repository: scarica `NightCity-Edgerunner.apk` direttamente dal telefono.
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

Tutti i sistemi, le reti e i personaggi del gioco sono simulati o inventati. Le tecniche insegnate vanno usate **solo** su sistemi propri o con un'autorizzazione scritta. L'ambientazione si ispira all'immaginario cyberpunk. "Night City" e "Edgerunners" sono marchi di CD PROJEKT: prima di un'eventuale pubblicazione sul Play Store il nome andrà cambiato.
