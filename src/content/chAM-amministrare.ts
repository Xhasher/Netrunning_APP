// Capitolo AM: amministrare un server Linux. Il lavoro quotidiano di un tecnico IT e
// di un analista junior: capire lo stato di una macchina, far ripartire un servizio
// guasto, leggere il diario di sistema, trovare cosa riempie un disco.
// Tutto sul deck: il sito del negozio di Mama gira qui, e stamattina è giù.
//
// Trama: una settimana dopo il capitolo 04. Mama ha spostato sul tuo deck il sito del bar
// (con il negozio online delle magliette), e lo cura Luca, un tecnico a chiamata. Luca parte
// per le ferie e il sito si spegne. Visita medica della macchina (AM.1), il servizio che non
// parte (AM.2), il diario della notte (AM.3), il disco pieno (AM.4).

import { nginxConfigError } from '../engine/sysinfo';
import type { Shell } from '../engine/shell';
import type { ShellEvent } from '../engine/types';
import type { Chapter } from '../game/types';

/** Versione dei contenuti in cui il capitolo è stato rivisto (passi nuovi). */
const V = 19;

const cmd = (name: string, test: (args: string[]) => boolean = () => true) => (ev: ShellEvent) =>
  ev.type === 'command' && ev.name === name && ev.ok && test(ev.args);

const configOk = (sh: Shell) => {
  const f = sh.fs.get('/etc/nginx/sites-enabled/negozio');
  return !!f && f.type === 'file' && !f.content.includes('server_nmae') && nginxConfigError({ sh } as never) === null;
};

export const CHAM: Chapter = {
  id: 'chAM',
  code: 'AM',
  title: 'Amministrare Linux',
  subtitle: 'Servizi, diario di sistema, dischi e lavori pianificati: il mestiere di chi tiene in piedi i server',
  missions: [
    // ------------------------------------------------------------------ AM.1
    {
      id: 'chAM-m1',
      title: 'Lo stato della macchina',
      tagline: 'Prima di toccare un server, guardalo: sistema, accensione, memoria, dischi.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Un turno da sistemista',
          body: `Una settimana dopo. Il server del bar è stato reinstallato da zero, e Mama ha mantenuto la promessa: il sito di Lo Scantinato, con il piccolo negozio online delle magliette, ora gira sul **tuo** deck. Lo cura Luca, un tecnico che passa due volte al mese.

Le otto del mattino. Il telefono vibra.

@mama: Il sito non si apre. Luca è partito stanotte per le ferie e non risponde. Mi hanno già scritto tre clienti.

@rook: Ecco il lavoro vero: metà del tempo non insegui hacker, tieni in piedi le cose.

@nyx: Rook esagera, ma non troppo. Nei primi lavori in sicurezza metà del tempo si passa a fare il **sistemista**: tenere in piedi i server, capire perché un servizio è giù, perché un disco è pieno. Nei primi lavori in sicurezza metà del tempo si passa a fare il **sistemista**: tenere in piedi i server, capire perché un servizio è giù, perché un disco è pieno. Un analista che non sa amministrare Linux non capisce neanche cosa è normale e cosa no.

@nyx: Prima regola: **non toccare niente finché non hai guardato**. In pochi comandi un professionista fa la "visita medica" di una macchina: che sistema è, da quanto è acceso, quanta memoria e quanto disco ha libero.`,
        },
        {
          kind: 'task',
          title: 'Che sistema è?',
          body: `Prima voce della visita medica: che sistema è, e quanto è aggiornato. Con \`-r\` (*release*) \`uname\` mostra solo la versione del kernel:

\`\`\`
uname -r
\`\`\`

Perché proprio il kernel? Molte delle vulnerabilità più gravi di Linux riguardano lui: sapere quale versione gira ti dice se mancano aggiornamenti di sicurezza.`,
          objective: 'Trova la versione del kernel e inviala con flag.',
          hints: ['uname con l\'opzione per la versione (release).', 'uname -r e poi: flag 6.8.0-nightos'],
          answer: ['6.8.0-nightos'],
          success: 'Il kernel è il `6.8.0-nightos`. In un inventario si annota per ogni server: quando esce una vulnerabilità del kernel, sai subito quali macchine aggiornare.',
        },
        {
          kind: 'task',
          title: 'Da quanto è acceso?',
          body: `\`uptime\` risponde a tre domande in una riga:

\`\`\`
uptime
\`\`\`

- l'ora attuale
- da quanto tempo la macchina è accesa (\`up 3 days\` = accesa da tre giorni)
- quanti utenti sono collegati
- il **carico** (*load average*): tre numeri, la media degli ultimi 1, 5 e 15 minuti. Più è alto, più programmi stanno aspettando il loro turno sul processore`,
          objective: 'Da quanti giorni è acceso il deck? Invia il numero con flag.',
          hints: ['Dopo "up" c\'è il tempo di accensione.', 'uptime e poi: flag 3'],
          answer: ['3'],
          success: `Tre giorni. Un server riavviato da pochi minuti, quando nessuno l'ha fatto apposta, è un indizio: un guasto, un aggiornamento automatico, o qualcuno che ha messo le mani dove non doveva.

?? Il **load average** è il numero medio di programmi che vogliono la CPU. Si confronta con il numero di processori: su una macchina con 4 CPU un carico di 4 vuol dire "pieno ma regge", 12 vuol dire "in affanno".`,
        },
        {
          kind: 'task',
          title: 'La memoria',
          body: `Seconda voce: la memoria.

\`\`\`
free -h
\`\`\`

Attenzione a quale colonna guardi. Quella che conta è **available**: quanta memoria i programmi possono ancora usare. La colonna \`free\` è più bassa perché Linux usa la RAM inutilizzata come **cache**: ci tiene i file letti di recente, così la seconda volta li trova subito. Quando un programma ha bisogno di memoria, la cache si fa da parte.

Lo **swap** è un pezzo di disco usato come memoria di riserva. Il disco è molto più lento della RAM: se lo swap è molto usato, la memoria non basta e la macchina arranca.`,
          objective: 'Quanta memoria è disponibile (available)? Invia il valore con flag, es. flag 1.0Gi',
          hints: ['Riga Mem:, ultima colonna.', 'free -h e poi: flag 2.5Gi'],
          answer: ['2.5Gi', '2.5', '2.5 Gi', '2.5G', '2.5GB'],
          success: '2,5 GB disponibili su 3,9: la memoria non è il problema. Un processo che si mangia tutta la RAM si troverebbe con `ps aux`, guardando la colonna %MEM.',
        },
        {
          kind: 'task',
          title: 'I dischi',
          body: `Terza voce: i dischi.

\`\`\`
df -h
\`\`\`

Su questo deck \`/var\`, la cartella dove stanno log, siti e backup, ha una partizione tutta sua. Guarda la colonna **Use%** riga per riga.`,
          objective: 'Quale partizione è quasi piena? Invia la cartella (Mounted on) con flag.',
          hints: ['Guarda la colonna Use%: sopra il 90% è un problema.', 'df -h e poi: flag /var'],
          answer: ['/var', 'var'],
          success: `\`/var\` è al **96%**. Quando arriva al 100% i programmi non riescono più a scrivere: i log si fermano (e un attacco passerebbe senza traccia), i database si bloccano, i backup falliscono. Ci torneremo nell'ultima missione di questo capitolo.`,
        },
        {
          kind: 'task',
          title: 'Dove sta un programma?',
          body: `Ultima voce: i programmi che ti serviranno ci sono? Controlla dove sta \`nmap\`:

\`\`\`
which nmap
\`\`\``,
          objective: 'Dove si trova il programma nmap? Invia il percorso completo con flag.',
          hints: ['which seguito dal nome del comando.', 'which nmap e poi: flag /usr/bin/nmap'],
          answer: ['/usr/bin/nmap'],
          success: '`/usr/bin` è la cartella dei programmi installati dal sistema; quelli installati a mano dall\'amministratore di solito stanno in `/usr/local/bin`.',
        },
        {
          kind: 'task',
          since: V,
          title: 'Il vero ls',
          body: `Ora lo stesso controllo, ma con occhi da analista. Un attaccante che entra in una macchina a volte mette un **falso** \`ls\` (o un falso \`ps\`) in una cartella che il sistema controlla prima di quella giusta. Il falso fa il suo lavoro, ma **nasconde** i file dell'attaccante.

\`\`\`
which ls
\`\`\`

Invia il percorso con \`flag\`. Se è in una cartella di sistema, il deck è a posto.`,
          objective: 'Dove si trova il programma ls? Invia il percorso con flag.',
          hints: ['which ls', 'flag /usr/bin/ls'],
          answer: ['/usr/bin/ls'],
          solve: ['which ls', 'flag /usr/bin/ls'],
          success: `\`/usr/bin/ls\`: quello vero, nella cartella dei programmi di sistema. Se avessi visto \`/tmp/ls\` o un percorso dentro una home, sarebbe stato un **indicatore di compromissione**, come il finto \`kthreadd\` sul server di Mama.

Visita medica completa: sistema aggiornato, acceso da tre giorni, memoria a posto, un disco quasi pieno. Il sito però resta giù. Il motivo non è nella macchina: è in un servizio.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          ex: 'interpreta',
          skills: ['df'],
          question: `Un collega ti incolla questo. Cosa rischia il server nei prossimi giorni?

\`\`\`
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        40G   14G   24G  37% /
/dev/sda2       100G   96G  4.0G  96% /var
\`\`\``,
          options: [
            'Che si riempia /var: si fermano log, database e backup',
            'Niente: in totale ci sono ancora 28 GB liberi',
            'Che si riempia /, la radice del sistema',
            'Che finisca la memoria RAM',
          ],
          correct: 0,
          explain: 'Le partizioni sono separate: lo spazio libero di `/` non aiuta `/var`. Conta la percentuale di ogni riga, non il totale.',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          skills: ['uptime'],
          question: 'Su un server con 2 CPU, `uptime` mostra `load average: 7.80, 7.95, 8.10`. Cosa vuol dire?',
          options: [
            'È sovraccarico da un po\': i programmi aspettano la CPU, da almeno 15 minuti',
            'Va tutto bene: il carico sta scendendo',
            'Il server è acceso da 7 giorni',
            'Ci sono 8 utenti collegati',
          ],
          correct: 0,
          explain: 'Il carico è circa 8 con solo 2 CPU: quattro volte la capacità. I tre numeri sono simili, quindi non è un picco momentaneo. Prossimo passo: `ps aux` per trovare chi consuma (un cryptominer, per esempio, si vede proprio così).',
        },
      ],
      recap: [
        ['uname -r / -a', 'versione del kernel / tutte le informazioni'],
        ['uptime', 'da quanto è acceso, utenti, carico medio (1, 5, 15 minuti)'],
        ['free -h', 'memoria: conta la colonna available'],
        ['df -h', 'spazio dei dischi: guarda Use% di ogni partizione'],
        ['which COMANDO', 'quale file viene eseguito'],
        ['partizione', 'una parte di disco separata, montata su una cartella'],
      ],
    },

    // ------------------------------------------------------------------ AM.2
    {
      id: 'chAM-m2',
      title: 'Il servizio che non parte',
      tagline: 'systemctl, il diario di un servizio, una configurazione sbagliata e come ripararla.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Servizi e systemd',
          body: `@nyx: Il sito di Mama non è un file che qualcuno apre. È un **servizio**: un programma che gira in sottofondo, senza finestra, giorno e notte, e aspetta di fare il suo lavoro. \`sshd\` aspetta le connessioni SSH, \`cron\` lancia i lavori pianificati, \`nginx\` consegna le pagine web a chi le chiede. (Nel gergo di Linux i servizi si chiamano anche **demoni**, *daemon*: niente di diabolico, è un vecchio scherzo dei programmatori.)

Su quasi tutti i Linux moderni i servizi li gestisce **systemd**, il primo programma che parte all'accensione: quel processo con PID 1 che hai visto in \`ps aux\`. Gli si parla con il comando \`systemctl\`.

Ogni servizio ha uno **stato**:
- **active** → in funzione
- **inactive** → spento, di proposito
- **failed** → doveva funzionare ma è andato in errore

E una seconda informazione, separata: **enabled** (parte da solo all'accensione) o **disabled**. Un servizio può essere *enabled* ma *failed*: doveva partire e non ce l'ha fatta.`,
        },
        {
          kind: 'task',
          title: 'Cosa è guasto?',
          body: `Su un server girano decine di servizi. Fatti dire solo quelli in errore:

\`\`\`
systemctl --failed
\`\`\``,
          objective: 'Quale servizio è in errore? Invia il nome con flag.',
          hints: ['systemctl con l\'opzione che mostra solo i guasti.', 'systemctl --failed e poi: flag nginx'],
          answer: ['nginx', 'nginx.service'],
          success: '`nginx` è il server web: è lui che serve il sito del negozio. È **failed**, quindi qualcosa lo ha fatto fallire. Ora bisogna capire cosa.',
        },
        {
          kind: 'task',
          title: 'Lo stato completo',
          body: `\`status\` mostra la scheda del servizio:

\`\`\`
systemctl status nginx
\`\`\`

Leggila dall'alto: **Loaded** (è installato? è enabled?), **Active** (lo stato e da quando), e in fondo **le ultime righe del suo diario**. Molto spesso il motivo del guasto è già scritto lì.`,
          objective: 'Mostra lo stato del servizio nginx.',
          hints: ['systemctl status seguito dal nome del servizio.', 'systemctl status nginx'],
          check: cmd('systemctl-status', (a) => a[0] === 'nginx'),
          success: `\`Active: failed\` da stamattina alle 06:12. E nelle ultime righe c'è un \`[emerg]\` (emergenza): nginx non ha capito una riga della sua configurazione.

?? Gli errori dei servizi si leggono **dal basso verso l'alto**: le ultime righe dicono che è fallito, quelle sopra dicono perché.`,
        },
        {
          kind: 'lesson',
          title: 'Il diario di sistema',
          body: `Le ultime righe di \`status\` sono solo un assaggio. Tutti i servizi scrivono in un unico **diario** (*journal*) gestito da systemd. Non è un file di testo come \`auth.log\`: è in un formato speciale (si dice **binario**), che \`cat\` mostrerebbe come una poltiglia di simboli. Si interroga con un comando apposta, \`journalctl\`, che Nyx ti presenta adesso.

Ogni riga del diario si legge come quelle di \`auth.log\` del capitolo 04: data e ora, macchina, programma con il suo PID, messaggio.

!! Nel diario finisce anche **chi ha usato sudo e per fare cosa**. È uno dei primi posti dove si guarda in un'indagine: chi ha cambiato cosa, e quando.`,
        },
        {
          kind: 'task',
          title: 'La parola sbagliata',
          body: `Apri il diario del solo servizio nginx (\`-u\` sta per *unit*, il nome che systemd dà ai servizi):

\`\`\`
journalctl -u nginx
\`\`\`

Cerca il messaggio \`[emerg]\`: dice **quale parola** nginx non conosce, in **quale file** e a **quale riga**.`,
          objective: 'Quale direttiva (parola) sconosciuta ha bloccato nginx? Inviala con flag.',
          hints: ['journalctl -u nginx, poi cerca "unknown directive".', 'La parola tra virgolette: flag server_nmae'],
          answer: ['server_nmae'],
          success: '`server_nmae`: doveva essere `server_name`. Un errore di battitura alla riga 3 di `/etc/nginx/sites-enabled/negozio`. Basta una lettera per spegnere un sito.\n\nUna **direttiva** è una riga di comando nella configurazione: una parola chiave seguita dal suo valore, come `server_name negozio.lan;` (il nome del sito).',
        },
        {
          kind: 'task',
          title: 'Chi ha toccato il file?',
          body: `Prima di correggere, un professionista si chiede **perché** il file è cambiato: un errore? Un attacco? Il diario registra ogni uso di sudo. Con \`-g\` (come \`grep\`) mostra solo le righe che contengono un testo:

\`\`\`
journalctl -g negozio
\`\`\``,
          objective: 'Quale utente ha modificato la configurazione del sito? Invia il nome con flag.',
          hints: ['Cerca la riga di sudo con COMMAND=/usr/bin/nano.', 'journalctl -g negozio e poi: flag luca'],
          answer: ['luca'],
          success: `Alle 06:09 \`luca\` ha aperto il file con \`sudo nano\`, alle 06:12 ha riavviato nginx, ed è fallito. Nessun attacco: una modifica fatta di fretta prima delle ferie, senza controllo.

?? Un sistema **in produzione** è quello in uso vero, dai clienti veri (il contrario è un sistema "di prova"). Per questo le aziende usano il **change management**, la "gestione delle modifiche": ogni modifica a un sistema in produzione si annota, si prova prima e ha un piano per tornare indietro.`,
        },
        {
          kind: 'lesson',
          title: 'Correggere una configurazione',
          body: `I file di configurazione di sistema stanno in \`/etc\` e appartengono a root: per modificarli serve \`sudo\`.

\`\`\`
sudo nano /etc/nginx/sites-enabled/negozio
\`\`\`

La procedura di un sistemista, sempre la stessa:
1. **copia di sicurezza** del file, per poter tornare indietro
2. **modifica** con l'editor (un **editor** è un programma per scrivere dentro un file: sui server si usa \`nano\`, che Nyx ti presenta tra un attimo)
3. **controllo** della sintassi: \`sudo nginx -t\` (quasi ogni servizio ha un controllo simile)
4. **riavvio** del servizio solo se il controllo è passato
5. **verifica** che sia attivo e che il sito risponda

!! Saltare il punto 3 è esattamente l'errore di Luca: un riavvio con una configurazione sbagliata spegne il servizio.`,
        },
        {
          kind: 'task',
          since: V,
          title: 'La copia di sicurezza',
          body: `Punto 1: la copia. Il file è di root, ma tutti lo possono leggere (\`rw-r--r--\`): per copiarlo nella tua home non serve sudo.

\`\`\`
cp /etc/nginx/sites-enabled/negozio negozio.bak
\`\`\`

!! Non mettere la copia nella stessa cartella \`sites-enabled\`: nginx legge **tutti** i file che ci trova, e caricherebbe il sito due volte.`,
          objective: 'Copia la configurazione del sito in ~/negozio.bak.',
          hints: ['cp, poi il file di origine, poi il nome della copia.', 'cp /etc/nginx/sites-enabled/negozio negozio.bak'],
          state: (sh) => {
            const f = sh.fs.get(`${sh.home}/negozio.bak`);
            return !!f && f.type === 'file' && f.content.includes('server_');
          },
          solve: ['cp /etc/nginx/sites-enabled/negozio negozio.bak'],
          success: 'Copia fatta. Se la correzione va storta, rimetti a posto il file originale in un secondo. Ora puoi toccare.',
        },
        {
          kind: 'task',
          title: 'Correggi l\'errore',
          body: `Apri il file con l'editor, come amministratore:

\`\`\`
sudo nano /etc/nginx/sites-enabled/negozio
\`\`\`

Alla riga 3 trasforma \`server_nmae\` in \`server_name\` e salva.`,
          objective: 'Correggi la direttiva sbagliata nella configurazione del sito.',
          hints: ['sudo nano apre il file con i permessi di root; corregge le due lettere scambiate.', 'sudo nano /etc/nginx/sites-enabled/negozio, riga 3: server_name negozio.lan;'],
          state: configOk,
          success: 'Configurazione corretta. Ma non fidarti dei tuoi occhi: fai controllare il file a nginx.',
        },
        {
          kind: 'task',
          title: 'Il controllo',
          body: `Punto 3: fai controllare il file a nginx, senza toccare il servizio.

\`\`\`
sudo nginx -t
\`\`\``,
          objective: 'Controlla la configurazione di nginx.',
          hints: ['nginx con l\'opzione di test, come amministratore.', 'sudo nginx -t'],
          check: cmd('nginx-t-ok'),
          success: '`syntax is ok` e `test is successful`: adesso, e solo adesso, si può riavviare.',
        },
        {
          kind: 'task',
          title: 'Riavvio',
          body: `\`\`\`
sudo systemctl restart nginx
\`\`\`

Se tutto va bene, \`restart\` non stampa niente: nel terminale, "nessuna notizia, buona notizia".`,
          objective: 'Riavvia nginx come amministratore.',
          hints: ['systemctl restart, con sudo davanti.', 'sudo systemctl restart nginx'],
          check: cmd('systemctl-restart', (a) => a[0] === 'nginx'),
          success: `Il sito di Mama è di nuovo su. Nel diario c'è la riga \`Started ...\` con l'ora del tuo intervento: anche tu hai lasciato traccia, come si deve.

?? Ultimo passo del mestiere: una nota per Luca, che al rientro deve sapere cosa è successo e cosa hai cambiato. Chi lavora a turni scrive sempre.`,
        },
        {
          kind: 'task',
          since: V,
          title: 'È vivo?',
          body: `Punto 5: verifica. Il modo più rapido per chiedere a systemd se un servizio è acceso:

\`\`\`
systemctl is-active nginx
\`\`\`

Risponde con una parola sola. Inviala con \`flag\`.`,
          objective: 'Controlla che nginx sia attivo e invia la risposta con flag.',
          hints: ['systemctl is-active nginx', 'flag active'],
          answer: ['active'],
          solve: ['systemctl is-active nginx', 'flag active'],
          success: `\`active\`. Un'ora fa la stessa domanda avrebbe risposto \`failed\`. Una parola sola è comoda anche per gli **script**: un programma di controllo può chiederlo ogni minuto e avvisare qualcuno appena la risposta cambia.

@mama: Il sito si apre! I clienti ordinano di nuovo. Come hai fatto?

@nyx: Una lettera sbagliata, Mama. Ma prima di festeggiare, guardiamo cos'altro è successo stanotte.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          ex: 'interpreta',
          skills: ['systemctl'],
          question: `Cosa ti dicono queste due righe di \`systemctl status cups\`?

\`\`\`
Loaded: loaded (/lib/systemd/system/cups.service; disabled; vendor preset: enabled)
Active: inactive (dead)
\`\`\``,
          options: [
            'Il servizio di stampa è spento e non parte all\'accensione: probabilmente di proposito',
            'Il servizio è guasto e va riparato subito',
            'Il servizio è acceso ma non risponde',
            'Il servizio è stato cancellato',
          ],
          correct: 0,
          explain: '*inactive* non è *failed*: nessuno ha chiesto a cups di funzionare (*disabled*). Su un server senza stampanti è proprio quello che si vuole: meno servizi accesi, meno superficie d\'attacco.',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          skills: ['systemctl', 'nginx'],
          question: 'Hai modificato la configurazione di un servizio in produzione. Qual è l\'ordine giusto?',
          options: [
            'Controllo della sintassi (nginx -t), poi restart, poi verifica dello stato',
            'Restart, e se non va controllo il diario',
            'Riavvio dell\'intera macchina, così ripartono tutti i servizi',
            'Disable e poi enable del servizio',
          ],
          correct: 0,
          explain: 'Prima si controlla, poi si riavvia, poi si verifica. Riavviare l\'intera macchina per un servizio è come spegnere la corrente di casa per cambiare una lampadina.',
        },
      ],
      recap: [
        ['servizio / demone', 'programma in sottofondo: ssh, cron, nginx'],
        ['systemctl --failed', 'i servizi in errore'],
        ['systemctl status S', 'stato, da quando, ultime righe del diario'],
        ['active / inactive / failed', 'acceso / spento di proposito / in errore'],
        ['enabled / disabled', 'parte o non parte da solo all\'accensione'],
        ['journalctl -u S', 'il diario di un servizio'],
        ['journalctl -g TESTO', 'solo le righe che contengono il testo'],
        ['sudo nano /etc/...', 'modificare una configurazione di sistema'],
        ['nginx -t', 'controlla la configurazione prima del riavvio'],
        ['sudo systemctl restart S', 'riavvia un servizio'],
        ['change management', 'ogni modifica si annota, si prova, si può annullare'],
      ],
    },

    // ------------------------------------------------------------------ AM.3
    {
      id: 'chAM-m3',
      title: 'Il diario di sistema',
      tagline: 'Priorità, fasce orarie, accessi riusciti e falliti: leggere il journal come un analista.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Le priorità',
          body: `@nyx: Il sito è tornato su. Ma un buon tecnico, dopo un guasto, si chiede: **è successo altro?** Una notte di diario contiene centinaia di righe. Non le leggi tutte: **filtri**.

Ogni messaggio del diario ha una **priorità**, da 0 (la più grave) a 7:

\`\`\`
0 emerg   1 alert   2 crit   3 err
4 warning   5 notice   6 info   7 debug
\`\`\`

Le più usate: **err** (errore: qualcosa non ha funzionato), **warning** (avviso: non si è ancora rotto niente, ma potrebbe), **info** (informazione normale), **debug** (dettagli minuti, utili solo a chi scrive il programma).

\`-p\` mostra una priorità **e tutte quelle più gravi**:

\`\`\`
journalctl -p err
\`\`\`

mostra err, crit, alert ed emerg. \`journalctl -p warning\` aggiunge anche gli avvisi.`,
        },
        {
          kind: 'task',
          title: 'Gli errori della notte',
          body: `Mostra solo gli errori (e peggio):

\`\`\`
journalctl -p err
\`\`\`

Oltre a quelli di nginx che conosci già, c'è un altro programma che ha fallito, due volte.`,
          objective: 'Quale altro programma ha registrato errori? Invia il nome con flag.',
          hints: ['Guarda il nome tra la macchina (deck) e la parentesi quadra.', 'journalctl -p err e poi: flag backup.sh'],
          answer: ['backup.sh', 'backup'],
          success: `Il **backup** è fallito alle 01:15 e alle 13:15 con \`No space left on device\`: nessuno spazio sul disco. Da stanotte il sito del negozio non ha copie di sicurezza.

!! Un backup fallito in silenzio è uno dei rischi più sottovalutati: lo scopri il giorno in cui ti serve.`,
        },
        {
          kind: 'task',
          title: 'Gli avvisi',
          body: `Allarga a \`warning\` (avvisi): problemi che non hanno ancora rotto niente, ma lo faranno.

\`\`\`
journalctl -p warning
\`\`\``,
          objective: 'Un avviso ripetuto parla di un filesystem: quale? Invialo con flag.',
          hints: ['Cerca le righe di "monitor".', 'journalctl -p warning e poi: flag /var'],
          answer: ['/var', 'var'],
          success: 'Il monitoraggio avvisava già alle 02:00 e alle 10:00: `/var` al 96%. Avviso ignorato, backup fallito. È lo schema di tanti incidenti veri: i segnali c\'erano.',
        },
        {
          kind: 'task',
          title: 'Una fascia oraria',
          body: `\`--since\` e \`--until\` limitano il diario a un intervallo di tempo:

\`\`\`
journalctl --since 03:00 --until 04:00
\`\`\`

Tra le 3 e le 4 di notte, quando nessuno lavora, c'è stato movimento.`,
          objective: 'Da quale IP sono arrivati i tentativi di accesso? Invialo con flag.',
          hints: ['Le righe di sshd con "Failed password".', 'journalctl --since 03:00 --until 04:00 e poi: flag 45.155.205.33'],
          answer: ['45.155.205.33'],
          success: `Sei tentativi in pochi secondi, ognuno con un nome diverso: oracle, test, admin, ubuntu, postgres, git. **invalid user** vuol dire che quegli utenti sul deck non esistono nemmeno.

È uno **scanner automatico**: prova i nomi più comuni su migliaia di server al giorno. Rumore di fondo di Internet, ma va annotato e, se insiste, bloccato.`,
        },
        {
          kind: 'task',
          title: 'Chi è entrato davvero',
          body: `\`last\` elenca gli accessi **riusciti** (dal file \`/var/log/wtmp\`): utente, terminale, da quale IP, quando, per quanto.

\`\`\`
last
\`\`\`

\`still logged in\` vuol dire che la sessione è ancora aperta. \`reboot\` segna le accensioni della macchina.`,
          objective: 'Da quale IP entri tu sul deck? Invialo con flag.',
          hints: ['La colonna dopo pts/0.', 'last e poi: flag 192.168.1.50'],
          answer: ['192.168.1.50'],
          success: 'Tutti gli accessi riusciti vengono dalla rete interna (192.168.1.50): bene. Un accesso riuscito da un IP esterno sconosciuto, magari subito dopo tanti fallimenti, sarebbe invece un allarme rosso.',
        },
        {
          kind: 'task',
          title: 'I tentativi falliti',
          body: `\`lastb\` (*last bad*) elenca gli accessi **falliti** (dal file \`/var/log/btmp\`). Il file è leggibile solo da root:

\`\`\`
sudo lastb
\`\`\``,
          objective: 'Quanti tentativi falliti registra lastb? Invia il numero con flag.',
          hints: ['Conta le righe con ssh:notty (o usa una pipe con wc -l, togliendo le righe vuote e quella finale).', 'sudo lastb e poi: flag 6'],
          answer: ['6'],
          success: 'Sei, gli stessi che hai visto nel diario. Due fonti diverse che raccontano la stessa storia: in un\'indagine si cerca sempre una **conferma incrociata**.',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          skills: ['journalctl'],
          question: 'Vuoi vedere gli errori del servizio ssh dalle 22:00 in poi. Quale comando?',
          options: ['journalctl -u ssh -p err --since 22:00', 'journalctl -p ssh --since err', 'cat /var/log/journal | grep ssh', 'systemctl status ssh --since 22:00'],
          correct: 0,
          explain: 'I filtri di journalctl si combinano: servizio (-u), priorità (-p), tempo (--since). Il file del journal è binario: con cat non si legge.',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          ex: 'interpreta',
          skills: ['journalctl'],
          question: `Cosa racconta questa riga?

\`\`\`
Nov 12 03:10:28 deck sshd[2003]: Failed password for invalid user admin from 45.155.205.33 port 51002 ssh2
\`\`\``,
          options: [
            'Qualcuno ha provato a entrare come "admin", un utente che sul deck non esiste',
            'L\'utente admin ha sbagliato la sua password',
            'L\'account admin è stato bloccato',
            'Il servizio ssh è andato in errore',
          ],
          correct: 0,
          explain: '*invalid user* = l\'utente non esiste. Se l\'utente esistesse, la riga direbbe solo `Failed password for admin`. Molti tentativi su utenti inesistenti = scanner automatico; molti tentativi su un utente vero = attacco mirato.',
        },
      ],
      recap: [
        ['priorità 0-7', 'emerg, alert, crit, err, warning, notice, info, debug'],
        ['journalctl -p err', 'errori e più gravi'],
        ['journalctl --since / --until', 'una fascia oraria'],
        ['last', 'accessi riusciti (wtmp)'],
        ['sudo lastb', 'accessi falliti (btmp)'],
        ['invalid user', 'tentativo su un utente che non esiste'],
        ['conferma incrociata', 'due fonti diverse che raccontano la stessa cosa'],
      ],
    },

    // ------------------------------------------------------------------ AM.4
    {
      id: 'chAM-m4',
      title: 'Il disco pieno',
      tagline: 'df, du, sort -h, cron, tar: dalla partizione piena alla causa, senza buttare via prove.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Il metodo: dall\'alto verso il basso',
          body: `@nyx: Ultimo pezzo del puzzle. Il backup fallisce perché \`/var\` è pieno, e se non si libera spazio, presto si fermeranno anche i log e il sito. Trovare cosa riempie un disco è un classico, e si fa sempre allo stesso modo:

1. \`df -h\` → **quale** partizione è piena
2. \`du -sh CARTELLA/*\` → **quale cartella** dentro di lei pesa di più
3. si scende di livello finché si trova **il file**
4. ci si chiede **perché** cresce (chi ci scrive?)

Per il punto 2 serve un comando nuovo, \`du\`: Nyx te lo presenta tra un attimo.`,
        },
        {
          kind: 'task',
          title: 'Quanto è pieno?',
          body: `\`df\` accetta anche un percorso: mostra solo la partizione che lo contiene.

\`\`\`
df -h /var
\`\`\``,
          objective: 'A che percentuale è /var? Invia il valore con flag (es. flag 50%).',
          hints: ['La colonna Use%.', 'df -h /var e poi: flag 96%'],
          answer: ['96%', '96'],
          success: '96%: restano 4 GB. Con un log che cresce senza sosta, è questione di giorni.',
        },
        {
          kind: 'task',
          title: 'Quale cartella?',
          body: `Misura ogni cartella dentro \`/var/log\` e mettile in fila dalla più leggera alla più pesante:

\`\`\`
du -sh /var/log/* | sort -h
\`\`\`

La più grande è in fondo.`,
          objective: 'Quale cartella di /var/log pesa di più? Inviane il nome con flag.',
          hints: ['L\'ultima riga dopo sort -h.', 'du -sh /var/log/* | sort -h e poi: flag app'],
          answer: ['app', '/var/log/app', '/var/log/app/'],
          success: '`/var/log/app` pesa più di tutte le altre insieme. Nel deck i numeri sono piccoli, ma la proporzione è quella di un caso vero: un solo colpevole.',
        },
        {
          kind: 'task',
          title: 'Quale file?',
          body: `Scendi di un livello. \`ls\` con \`-l\` e \`-h\` mostra la dimensione di ogni file in modo leggibile, e \`-S\` li ordina dal più grande:

\`\`\`
ls -lhS /var/log/app
\`\`\``,
          objective: 'Quale file sta riempiendo il disco? Inviane il nome con flag.',
          hints: ['Il primo della lista con -S.', 'ls -lhS /var/log/app e poi: flag debug.log'],
          answer: ['debug.log', '/var/log/app/debug.log'],
          success: 'Un **log di debug**: il livello di dettaglio più alto, utile per un programmatore che cerca un errore, inutile (e pesantissimo) in produzione. Qualcuno lo ha acceso e se ne è dimenticato.',
        },
        {
          kind: 'lesson',
          title: 'I lavori pianificati',
          body: `Chi scrive in quel file? Un programma acceso sempre, oppure un **lavoro pianificato**. Su Linux li gestisce **cron**: i lavori di sistema stanno in \`/etc/crontab\`.

Ogni riga ha cinque campi di tempo, poi l'utente e il comando:

\`\`\`
# minuto ora giorno-del-mese mese giorno-della-settimana  utente  comando
15 1,13  *  *  *    root  /usr/local/bin/backup.sh
\`\`\`

- \`*\` = ogni valore (ogni giorno, ogni mese...)
- \`1,13\` = alle 1 e alle 13
- \`*/5\` = ogni 5 (nel campo dei minuti: ogni 5 minuti)

La riga sopra vuol dire: "alle 01:15 e alle 13:15, ogni giorno, root esegue backup.sh". Sono proprio gli orari dei backup falliti nel diario.

!! cron è anche uno dei posti preferiti dagli attaccanti per **restare** in una macchina (*persistenza*): in ogni indagine si controlla.`,
        },
        {
          kind: 'task',
          title: 'Chi scrive nel log?',
          body: `Cerca in \`/etc/crontab\` la riga che nomina \`debug.log\`:

\`\`\`
grep debug.log /etc/crontab
\`\`\`

\`>>\` alla fine del comando lo conosci già: aggiunge l'output in fondo al file.`,
          objective: 'Quale script scrive in debug.log? Invia il suo percorso completo con flag.',
          hints: ['Il comando eseguito da root in quella riga, senza le opzioni.', 'grep debug.log /etc/crontab e poi: flag /opt/app/esporta.sh'],
          answer: ['/opt/app/esporta.sh'],
          success: '`*/5 * * * *`: ogni 5 minuti, giorno e notte, `esporta.sh --debug` aggiunge righe a `debug.log`. Sono 288 esecuzioni al giorno.',
        },
        {
          kind: 'lesson',
          title: 'Prima di pulire, conserva',
          body: `La tentazione è cancellare il file e chiudere il ticket. Un professionista invece:

1. **conserva** una copia (compressa) del log: potrebbe servire a chi sviluppa l'applicazione, o a un'indagine
2. **toglie la causa**: senza, il disco si riempie di nuovo
3. **libera lo spazio**, con il permesso del responsabile
4. **verifica** e scrive cosa ha fatto

Per conservare si usa \`tar\`, che impacchetta file e cartelle in un unico **archivio**; con \`z\` lo comprime (i log di testo diventano anche dieci volte più piccoli):

\`\`\`
tar -czf ARCHIVIO.tgz COSA_ARCHIVIARE
\`\`\`

- \`c\` → *create*, crea l'archivio
- \`z\` → comprime con gzip
- \`f\` → il nome del file dell'archivio, subito dopo

Per controllare il contenuto senza estrarlo: \`tar -tzf ARCHIVIO.tgz\` (\`t\` = *list*). Per estrarre: \`tar -xzf ARCHIVIO.tgz\`.`,
        },
        {
          kind: 'task',
          title: 'L\'archivio',
          body: `Crea nella tua home un archivio compresso del log:

\`\`\`
tar -czf ~/debug-20771112.tgz /var/log/app/debug.log
\`\`\``,
          objective: 'Crea ~/debug-20771112.tgz con dentro /var/log/app/debug.log.',
          hints: ['tar con c (crea), z (comprimi), f (nome archivio), poi il file da archiviare.', 'tar -czf ~/debug-20771112.tgz /var/log/app/debug.log'],
          state: (sh) => {
            const f = sh.fs.get(`${sh.home}/debug-20771112.tgz`);
            return !!f && f.type === 'file' && f.content.startsWith('TARSIM1') && f.content.includes('debug.log');
          },
          success: 'Archivio creato. Ora verifica che dentro ci sia davvero quello che pensi: un backup mai controllato non è un backup.',
        },
        {
          kind: 'task',
          title: 'Controlla l\'archivio',
          body: `\`\`\`
tar -tzf ~/debug-20771112.tgz
\`\`\``,
          objective: 'Elenca il contenuto dell\'archivio senza estrarlo.',
          hints: ['t al posto di c: elenca invece di creare.', 'tar -tzf ~/debug-20771112.tgz'],
          check: cmd('tar', (a) => /^-?\w*t\w*$/.test(a[0] ?? '') && a.some((x) => x.endsWith('debug-20771112.tgz'))),
          success: 'C\'è `/var/log/app/debug.log`. Copia conservata e verificata.',
        },
        {
          kind: 'task',
          title: 'Togli la causa',
          body: `Il lavoro di esportazione serve al negozio: non va tolto, va solo **spento il debug**. Modifica \`/etc/crontab\` come amministratore e togli \`--debug\` dalla riga di \`esporta.sh\` (lascia il resto com'è):

\`\`\`
sudo nano /etc/crontab
\`\`\``,
          objective: 'Togli l\'opzione --debug dalla riga di esporta.sh in /etc/crontab.',
          hints: ['sudo nano /etc/crontab, ultima riga.', 'La riga diventa: */5 * * * *  root  /opt/app/esporta.sh >> /var/log/app/debug.log'],
          state: (sh) => {
            const f = sh.fs.get('/etc/crontab');
            return !!f && f.type === 'file' && f.content.includes('/opt/app/esporta.sh') && !f.content.includes('--debug');
          },
          success: `Da ora l'esportazione scrive solo le righe importanti. Il passo successivo, con l'ok di Mama, è svuotare il vecchio log (\`sudo truncate -s 0 /var/log/app/debug.log\`) e far ripartire il backup.

?? Nelle aziende i log non crescono all'infinito grazie a **logrotate**: ogni giorno (o settimana) comprime il log vecchio, ne apre uno nuovo e cancella quelli troppo vecchi. Un log senza rotazione è un disco pieno che aspetta.

Scrivi la nota per Luca: il sito spento da un errore di battitura, il backup fermo da un giorno per il disco pieno, il debug dimenticato acceso. Mama la legge e ride: "Luca torna fra dieci giorni. Speriamo che il deck regga".

@nyx: Reggerà. Ma hai notato una cosa? Oggi hai scritto gli stessi comandi, a mano, decine di volte. Il prossimo passo è farli scrivere al deck al posto tuo.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          skills: ['crontab'],
          question: 'Cosa vuol dire la riga `0 3 * * 1  root  /usr/local/bin/pulizia.sh` in /etc/crontab?',
          options: ['Ogni lunedì alle 03:00 root esegue pulizia.sh', 'Ogni giorno alle 03:01', 'Ogni 3 minuti', 'Il primo del mese alle 03:00'],
          correct: 0,
          explain: 'Minuto 0, ora 3, qualsiasi giorno del mese, qualsiasi mese, giorno della settimana 1 (lunedì; 0 e 7 sono domenica).',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          skills: ['du', 'df'],
          question: 'Un disco è pieno al 98%. Qual è la sequenza giusta?',
          options: [
            'df per la partizione, du per la cartella e il file, poi la causa, poi conservare e pulire',
            'Cancellare subito i file più vecchi di /var/log',
            'Riavviare il server per liberare spazio',
            'Aggiungere un disco nuovo e non pensarci più',
          ],
          correct: 0,
          explain: 'Senza la causa il problema torna. E cancellare i log a caso può distruggere le prove di un incidente: a volte un disco pieno di log è proprio il segno di un attacco in corso.',
        },
      ],
      recap: [
        ['df -h PERCORSO', 'la partizione che contiene il percorso'],
        ['du -sh DIR/* | sort -h', 'le cartelle dalla più leggera alla più pesante'],
        ['ls -lhS', 'i file dal più grande, con dimensioni leggibili'],
        ['/etc/crontab', 'i lavori pianificati di sistema'],
        ['m h dom mon dow', 'minuto, ora, giorno del mese, mese, giorno della settimana'],
        ['*/5', 'ogni 5 unità (ogni 5 minuti nel primo campo)'],
        ['tar -czf A.tgz X', 'crea un archivio compresso'],
        ['tar -tzf A.tgz', 'elenca il contenuto di un archivio'],
        ['tar -xzf A.tgz', 'estrae un archivio'],
        ['logrotate', 'ruota, comprime e cancella i log vecchi'],
      ],
    },
  ],
};
