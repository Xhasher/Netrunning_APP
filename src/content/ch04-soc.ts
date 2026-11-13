import type { ShellEvent } from '../engine/types';
import type { Chapter } from '../game/types';

const readOf = (rel: string) => (ev: ShellEvent, sh: { home: string }) =>
  ev.type === 'read' && ev.path === `${sh.home}/${rel}`;

export const CH04: Chapter = {
  id: 'ch04',
  code: '04',
  title: 'Primo turno al SOC',
  subtitle: 'Blue Team: log, rilevamento e risposta a un\'intrusione',
  missions: [
    // ------------------------------------------------------------------ 4.1
    {
      id: 'ch04-m1',
      title: 'Il diario del server',
      tagline: 'Cosa sono i log, dove si trovano e come si leggono.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Chiamata d\'emergenza',
          body: `@rook: Svegliati, choom. Mama Reyes ha un problema serio: il server del bar è impazzito stanotte. Stavolta non ti paga per attaccare. Ti paga per **capire cosa è successo**.

@nyx: Benvenuto dall'altra parte della barricata. Il **Blue Team** difende: sorveglia i sistemi, rileva gli attacchi e risponde. Molti lavorano in un **SOC** (*Security Operations Center*), una sala dove gli analisti controllano gli allarmi 24 ore su 24.

@nyx: È il punto d'ingresso più comune nel lavoro della sicurezza. E la regola d'oro è una sola: **i log non mentono**.`,
        },
        {
          kind: 'lesson',
          title: 'Cosa sono i log',
          body: `Un **log** è un registro: un file di testo in cui un programma scrive, riga per riga, quello che succede. Ogni riga ha quasi sempre **data e ora**.

Su Linux i log stanno in \`/var/log\`. I più importanti:
- \`/var/log/auth.log\` → autenticazioni: login riusciti e falliti, uso di sudo
- \`/var/log/syslog\` → messaggi generali del sistema
- \`/var/log/nginx/access.log\` (o \`apache2\`) → ogni visita al sito web

Una riga di \`auth.log\` si legge così:

\`\`\`
Nov 12 03:14:05 server sshd[1206]: Failed password for root from 203.0.113.77 port 51003 ssh2
\`\`\`
- \`Nov 12 03:14:05\` → quando
- \`server\` → su quale macchina
- \`sshd[1206]\` → quale programma (il servizio SSH) e il suo PID
- \`Failed password for root\` → cosa: password sbagliata per l'utente root
- \`from 203.0.113.77 port 51003\` → da dove arrivava il tentativo

!! Gli attaccanti esperti provano a **cancellare o modificare i log** per nascondere le tracce. Per questo le aziende li copiano in tempo reale su un altro sistema, chiamato **SIEM**, che raccoglie e analizza i log di tutta l'azienda.`,
        },
        {
          kind: 'task',
          title: 'Il messaggio di Mama',
          body: `Mama ti ha copiato i file del server nella cartella \`caso\`. Leggi prima il suo messaggio:

\`\`\`
cat caso/LEGGIMI.txt
\`\`\``,
          objective: 'Leggi caso/LEGGIMI.txt.',
          hints: ['Dalla home: cat caso/LEGGIMI.txt'],
          check: readOf('caso/LEGGIMI.txt'),
          success: `Server lento, ventola al massimo. Annota questi **sintomi**: un buon analista parte sempre da cosa ha notato l'utente, e poi cerca le prove.`,
        },
        {
          kind: 'task',
          title: 'Quanto è lungo?',
          body: `Prima di leggere un log, conviene sapere quanto è grande. Su un server vero può avere milioni di righe! Conta le righe di \`auth.log\`:

\`\`\`
wc -l caso/auth.log
\`\`\`

Invia il numero con \`flag\`.`,
          objective: 'Conta le righe di caso/auth.log e invia il numero.',
          hints: ['Scrivi: wc -l caso/auth.log', 'flag 46'],
          answer: ['46'],
          success: `46 righe: abbastanza poche da poterle leggere, ma è meglio abituarsi subito a non farlo. Su un log vero si **filtra**, non si legge tutto.`,
        },
        {
          kind: 'task',
          title: 'Inizio e fine',
          body: `\`head\` mostra le prime righe, \`tail\` le ultime. Con \`-n\` scegli quante. Guarda le ultime 5 righe, cioè le cose più recenti:

\`\`\`
tail -n 5 caso/auth.log
\`\`\``,
          objective: 'Guarda le ultime righe del log con tail.',
          hints: ['Scrivi: tail -n 5 caso/auth.log'],
          check: (ev) => ev.type === 'command' && ev.name === 'tail' && ev.ok,
          success: `Hai già visto qualcosa di interessante? Una riga dice \`Accepted password for mama from 203.0.113.77\`. Un login **riuscito** da un indirizzo **esterno**, alle 3 di notte. Teniamolo a mente e indaghiamo con metodo.

?? Sui server veri si usa spesso \`tail -f\` per vedere le nuove righe di un log **in tempo reale**, mentre vengono scritte.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'In quale file cercheresti i tentativi di login falliti su un server Linux?',
          options: ['/etc/passwd', '/var/log/auth.log', '/home/utente/.profile', '/tmp'],
          correct: 1,
          explain: `\`/var/log/auth.log\` registra le autenticazioni (su alcune distribuzioni, come Red Hat, si chiama \`/var/log/secure\`). \`/etc/passwd\` elenca gli utenti, ma non registra i login.`,
        },
      ],
      recap: [
        ['log', 'registro testuale degli eventi, con data e ora'],
        ['/var/log', 'la cartella dei log su Linux'],
        ['auth.log', 'login riusciti e falliti, uso di sudo'],
        ['SOC', 'Security Operations Center: dove lavorano gli analisti'],
        ['SIEM', 'sistema che raccoglie e analizza i log di tutta l\'azienda'],
        ['head / tail -n N', 'prime / ultime N righe'],
        ['tail -f', 'segue un log in tempo reale'],
      ],
    },

    // ------------------------------------------------------------------ 4.2
    {
      id: 'ch04-m2',
      title: 'Qualcuno ha bussato',
      tagline: 'Riconoscere un attacco brute force e trovare chi l\'ha fatto.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Il brute force',
          body: `Un attacco **brute force** ("forza bruta") è il più semplice che esista: un programma prova password su password, migliaia di volte, finché non indovina.

È rumoroso e si riconosce facilmente nei log:
- **tanti** \`Failed password\` in poco tempo
- quasi sempre dallo **stesso indirizzo IP**
- spesso contro utenti prevedibili: \`root\`, \`admin\`, \`test\`...

E se a un certo punto compare un \`Accepted password\` dallo stesso IP... l'attaccante ha **indovinato**.

?? Qualsiasi server con SSH esposto su Internet riceve tentativi del genere **ogni giorno**, da programmi automatici. Per questo le password deboli sono così pericolose.`,
        },
        {
          kind: 'task',
          title: 'Filtrare',
          body: `Contiamo tutti i tentativi falliti, collegando \`grep\` e \`wc\` con una pipe. Le virgolette servono perché il testo da cercare contiene uno spazio:

\`\`\`
grep "Failed password" caso/auth.log | wc -l
\`\`\`

Invia il numero con \`flag\`.`,
          objective: 'Conta i "Failed password" e invia il numero.',
          hints: ['Scrivi: grep "Failed password" caso/auth.log | wc -l', 'flag 40'],
          answer: ['40'],
          success: `40 tentativi falliti in una notte, per un piccolo bar. Non è normale. Ora capiamo **da dove** arrivano.`,
        },
        {
          kind: 'lesson',
          title: 'La catena dell\'analista',
          body: `Per sapere quali IP hanno provato più spesso, si usa una catena di comandi che ogni analista conosce a memoria. La spieghiamo su un log DIVERSO da quello del caso: il registro di un server FTP, dove ogni riga ha questa forma:

\`\`\`
Nov 12 08:01:22 files vsftpd[310]: FAIL LOGIN: Client "198.51.100.7"
\`\`\`

Per trovare il campo che ti serve, **conta le parole** separate da spazi: Nov(1) 12(2) 08:01:22(3) files(4) vsftpd[310]:(5) FAIL(6) LOGIN:(7) Client(8) **"198.51.100.7"(9)**. L'indirizzo è la nona.

La catena per contare i tentativi per IP sarebbe quindi:

\`\`\`
grep "FAIL LOGIN" ftp.log | cut -d " " -f 9 | sort | uniq -c
\`\`\`

Passo per passo:
1. \`grep "FAIL LOGIN" ...\` → solo le righe dei tentativi falliti
2. \`cut -d " " -f 9\` → divide ogni riga sugli spazi e tiene la **9ª parola**, cioè l'IP
3. \`sort\` → ordina gli IP, così quelli uguali finiscono vicini
4. \`uniq -c\` → li raggruppa e scrive quante volte compare ciascuno

Il risultato è una piccola **statistica**: quante volte ha provato ogni indirizzo.

Per il log del caso dovrai ripetere il ragionamento: guarda com'è fatta UNA riga di \`caso/auth.log\`, conta le parole e trova la posizione dell'IP. È la stessa tecnica, con un numero diverso.`,
        },
        {
          kind: 'task',
          title: 'Chi è stato?',
          body: `Esegui la catena:

\`\`\`
grep "Failed password" caso/auth.log | cut -d " " -f 11 | sort | uniq -c
\`\`\`

Poi invia con \`flag\` l'indirizzo IP che ha fatto **più** tentativi.`,
          objective: 'Trova l\'IP con più tentativi falliti e invialo con flag.',
          hints: [
            'Scrivi la catena completa. Usa ↑ per richiamare il comando precedente e modificarlo.',
            'Il numero più grande a sinistra indica l\'IP più attivo.',
            'flag 203.0.113.77',
          ],
          answer: ['203.0.113.77'],
          success: `**203.0.113.77**, con 37 tentativi. L'altro indirizzo (\`198.51.100.9\`) ne ha fatti solo 3 alle 2 di notte: probabilmente uno dei tanti scanner automatici di Internet. Distinguere il **rumore di fondo** dall'attacco vero è metà del lavoro di un analista SOC.`,
        },
        {
          kind: 'task',
          title: 'Sono entrati?',
          body: `La domanda più importante: l'attacco ha funzionato? Cerca i login **riusciti**:

\`\`\`
grep Accepted caso/auth.log
\`\`\`

Quale account ha usato l'attaccante per entrare? Invia il nome utente con \`flag\`.`,
          objective: 'Trova l\'account compromesso e invialo con flag.',
          hints: ['Scrivi: grep Accepted caso/auth.log', 'Guarda la riga con l\'IP 203.0.113.77: flag mama'],
          answer: ['mama'],
          success: `L'account **mama** è stato compromesso. Nota la differenza tra le due righe:
- \`Accepted publickey for mama from 192.168.1.12\` → Mama, dalla rete del bar, con una **chiave** SSH. Normale.
- \`Accepted password for mama from 203.0.113.77\` → qualcuno da fuori, con una **password** indovinata dopo 37 tentativi.

Abbiamo un'**intrusione confermata**.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Quale di queste misure avrebbe impedito questo attacco nel modo più efficace?',
          options: [
            'Cambiare il nome del server',
            'Disattivare il login SSH con password e usare solo chiavi SSH',
            'Cancellare auth.log ogni notte',
            'Spegnere il monitor del server',
          ],
          correct: 1,
          explain: `Con il login solo a chiave, indovinare una password non serve a niente. Altre difese utili: password lunghe e uniche, **MFA** (autenticazione a più fattori), e strumenti come **fail2ban**, che bloccano automaticamente un IP dopo troppi tentativi falliti. Cancellare i log invece aiuta solo l'attaccante!`,
        },
      ],
      recap: [
        ['brute force', 'provare password a ripetizione finché una funziona'],
        ['Failed / Accepted password', 'tentativo fallito / login riuscito'],
        ['grep "..." | wc -l', 'conta le righe che contengono un testo'],
        ['cut | sort | uniq -c', 'la catena per contare i valori di una colonna'],
        ['rumore di fondo', 'scansioni automatiche continue da distinguere dagli attacchi veri'],
        ['chiavi SSH', 'login senza password: rende inutile il brute force'],
        ['fail2ban / MFA', 'blocca chi sbaglia troppo / chiede un secondo fattore'],
      ],
    },

    // ------------------------------------------------------------------ 4.3
    {
      id: 'ch04-m3',
      title: 'Contenimento',
      tagline: 'Trovare cosa ha lasciato l\'intruso, bloccarlo e scrivere il rapporto.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Incident response',
          body: `Quando un'intrusione è confermata, si segue un metodo preciso chiamato **incident response** (risposta agli incidenti). Le fasi classiche sono:

1. **Preparazione** → avere log, backup e procedure prima che serva
2. **Identificazione** → capire cosa è successo (quello che hai appena fatto)
3. **Contenimento** → fermare il danno, ad esempio bloccando l'attaccante
4. **Eradicazione** → eliminare tutto quello che ha lasciato
5. **Ripristino** → rimettere in funzione i sistemi in sicurezza
6. **Lezioni apprese** → capire come evitare che succeda di nuovo

!! Prima di cancellare qualsiasi cosa, si **conservano le prove** (copie di log, file, lista dei processi). Servono per capire tutto l'attacco, e magari anche per una denuncia alla Polizia Postale.`,
        },
        {
          kind: 'task',
          title: 'Perché è lento?',
          body: `Mama ha salvato la lista dei processi del server in \`caso/processi.txt\` (è l'output di \`ps aux\`). Leggila e cerca qualcosa di strano.

Ricorda com'era il tuo deck sano: ora guarda la colonna \`%CPU\`, l'utente, l'orario di partenza (\`START\`) e da quale cartella parte il comando.

Invia con \`flag\` il **PID** del processo sospetto.`,
          objective: 'Trova il processo sospetto e invia il suo PID.',
          hints: [
            'cat caso/processi.txt',
            'Cerca il processo che usa quasi il 100% della CPU e parte da /tmp.',
            'flag 6631',
          ],
          answer: ['6631'],
          success: `Il processo **6631** è il colpevole:
- usa il **97.9% della CPU** → ecco perché il server è lento e la ventola urla
- parte da \`/tmp/.cache/\`, una cartella **nascosta** dentro \`/tmp\`, dove chiunque può scrivere
- si chiama \`kthreadd\`, come un vero processo del kernel Linux: un **travestimento**
- gira come \`mama\` ed è partito alle **03:20**, tre minuti dopo il login dell'attaccante
- si collega a un "pool": è un **cryptominer**, un programma che usa il server di Mama per generare criptovalute per l'attaccante

C'è anche \`keepalive.sh\`, che probabilmente lo fa ripartire se viene chiuso.`,
        },
        {
          kind: 'lesson',
          title: 'La timeline',
          body: `Mettendo in fila le prove, ricostruiamo la **timeline** dell'incidente. È la parte centrale di ogni indagine:

\`\`\`
02:02  198.51.100.9   3 tentativi su root (rumore di fondo)
03:14  203.0.113.77   inizia il brute force (root, admin, mama)
03:17  203.0.113.77   login riuscito come mama (password)
03:20  server         parte il cryptominer da /tmp/.cache/
03:21  server         parte keepalive.sh (lo tiene in vita)
mattina               Mama nota il server lento
\`\`\`

Ora è il momento del **contenimento**: chiudere la porta all'attaccante.`,
        },
        {
          kind: 'task',
          title: 'Chiudi la porta',
          body: `Blocchiamo l'indirizzo dell'attaccante sul firewall. Su Ubuntu si usa \`ufw\`, e servono i privilegi di amministratore. Mama ti ha autorizzato a usare \`sudo\` **solo** per il firewall:

\`\`\`
sudo ufw deny from 203.0.113.77
\`\`\``,
          objective: 'Blocca 203.0.113.77 con sudo ufw deny from.',
          hints: ['Scrivi: sudo ufw deny from 203.0.113.77'],
          check: (ev) => ev.type === 'firewall' && ev.action === 'deny' && ev.ip === '203.0.113.77',
          success: `Regola aggiunta: da ora il server ignora tutto il traffico da quell'indirizzo.

?? Bloccare un IP è utile ma **non basta**: un attaccante può cambiare indirizzo in un attimo. Il vero contenimento è anche cambiare la password di mama e chiudere la sessione aperta.`,
        },
        {
          kind: 'task',
          title: 'Verifica',
          body: `Controlla sempre che la modifica sia davvero attiva:

\`\`\`
sudo ufw status
\`\`\``,
          objective: 'Controlla le regole del firewall con sudo ufw status.',
          hints: ['Scrivi: sudo ufw status'],
          check: (ev, sh) => ev.type === 'command' && ev.name === 'sudo' && ev.args[0] === 'ufw' && ev.args[1] === 'status' && sh.firewall.length > 0,
          success: `La regola \`DENY 203.0.113.77\` è attiva. **Fidarsi, ma verificare**: è un'abitudine da professionisti.`,
        },
        {
          kind: 'lesson',
          title: 'Eradicazione e ripristino',
          body: `Ecco cosa si fa dopo, sul server vero (con i permessi di amministratore):

**Eradicazione**
- salvare una copia dei file sospetti come prova, poi fermare i processi (\`kill\`) e cancellare \`/tmp/.cache/\`
- cercare la **persistenza**: l'attaccante potrebbe aver lasciato altri modi per tornare. Si controllano i lavori programmati (\`crontab\`), le chiavi SSH aggiunte in \`~/.ssh/authorized_keys\`, gli utenti nuovi in \`/etc/passwd\`, i servizi all'avvio

**Ripristino**
- cambiare la password di mama, e di ogni account che usava la stessa password
- disattivare il login SSH con password, lasciando solo le chiavi
- installare fail2ban e aggiornare il sistema
- se non si è sicuri di aver trovato tutto: **reinstallare** da zero e ripristinare i dati da un backup pulito

**Lezioni apprese**
- una password debole su un servizio esposto a Internet è bastata per entrare`,
        },
        {
          kind: 'lesson',
          title: 'Il rapporto d\'incidente',
          body: `Come nel pentest, il lavoro finisce con un documento: il **rapporto d'incidente**. Deve essere chiaro anche per chi non è tecnico, come Mama:

\`\`\`
RAPPORTO D'INCIDENTE - Server "Lo Scantinato"
Gravità: ALTA

Cosa è successo:
 Il 12/11 alle 03:17 un attaccante (203.0.113.77) ha
 indovinato la password dell'account "mama" via SSH,
 dopo 37 tentativi, e ha installato un cryptominer.

Impatto:
 Server rallentato. Nessuna prova finora di furto dati,
 ma l'attaccante ha avuto l'accesso di mama per ore.

Azioni svolte:
 - IP bloccato sul firewall
 - processo malevolo identificato (PID 6631)

Azioni consigliate:
 - cambiare la password, solo login a chiave
 - rimuovere il miner e verificare la persistenza
 - installare fail2ban, aggiornare il sistema
\`\`\`

@nyx: Ottimo lavoro, choom. Hai appena fatto quello che fa un analista SOC in una notte difficile: hai letto i log, trovato l'attaccante, capito cosa ha fatto e fermato il danno.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica finale',
          question: 'Scopri un\'intrusione in corso. Qual è l\'ordine corretto?',
          options: [
            'Reinstallare subito tutto, poi pensare al resto',
            'Conservare le prove, contenere l\'attaccante, eliminare ciò che ha lasciato, ripristinare',
            'Cancellare i log per non far vedere il problema al capo',
            'Aspettare per vedere cosa fa l\'attaccante',
          ],
          correct: 1,
          explain: `Prove → contenimento → eradicazione → ripristino. Reinstallare subito distrugge le prove e non ti dice come è entrato l'attaccante: rischi che rientri dalla stessa porta. Cancellare i log è un errore grave (e in un'azienda anche una violazione delle regole).`,
        },
      ],
      recap: [
        ['incident response', 'preparazione, identificazione, contenimento, eradicazione, ripristino, lezioni'],
        ['indicatore di compromissione', 'processo in /tmp, CPU al 100%, nome travestito'],
        ['cryptominer', 'malware che usa il tuo computer per generare criptovalute'],
        ['timeline', 'gli eventi dell\'incidente in ordine di tempo'],
        ['sudo ufw deny from IP', 'blocca un indirizzo sul firewall'],
        ['persistenza', 'i modi in cui un attaccante si assicura di poter tornare'],
        ['conservare le prove', 'prima di cancellare qualsiasi cosa'],
        ['rapporto d\'incidente', 'cosa, impatto, azioni svolte, azioni consigliate'],
      ],
    },
  ],
};
