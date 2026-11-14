// Missioni di pratica aggiunte ai capitoli esistenti:
// - 2.4 Diagnosi di rete: la scala del troubleshooting (indirizzo, gateway, DNS, porta, servizio)
// - 5.4 Gli attrezzi del testo: awk, sed, tr, tee, xargs, diff sui log veri del deck

import type { Shell } from '../engine/shell';
import type { ShellEvent } from '../engine/types';
import type { Mission } from '../game/types';

const cmd = (name: string, test: (args: string[]) => boolean = () => true) => (ev: ShellEvent) =>
  ev.type === 'command' && ev.name === name && ev.ok && test(ev.args);

export function addPracticeFiles(sh: Shell): void {
  const mine = { owner: sh.user, group: sh.user };
  const base = [
    '# configurazione del server SSH del negozio',
    'Port 22',
    'PermitRootLogin no',
    'PasswordAuthentication no',
    'PubkeyAuthentication yes',
    'MaxAuthTries 3',
    'X11Forwarding no',
    'AllowUsers mama luca',
  ];
  sh.localFs.writeFile(`${sh.home}/testo/sshd_config.ieri`, base.join('\n') + '\n', mine);
  sh.localFs.writeFile(`${sh.home}/testo/sshd_config.oggi`, base.map((l) => (l === 'PermitRootLogin no' ? 'PermitRootLogin yes' : l)).join('\n') + '\n', mine);
}

// ------------------------------------------------------------------ 2.4

export const NETDIAG_MISSION: Mission = {
  id: 'ch02-m4',
  title: 'Diagnosi di rete',
  tagline: '"Non funziona Internet": la scala del troubleshooting, un gradino alla volta.',
  xp: 250,
  steps: [
    {
      kind: 'lesson',
      title: '"La cassa non va!"',
      body: `@rook: Mama è nel panico: "La cassa non risponde, è rotta!". Il tecnico del negozio è irraggiungibile.

@nyx: Prima lezione da helpdesk: "non funziona" non è una diagnosi. Si sale una **scala**, dal basso, e ci si ferma al primo gradino rotto:

1. **io**: ho un indirizzo IP? So qual è il gateway (la porta verso le altre reti)?
2. **il gateway**: risponde?
3. **il nome**: il DNS trasforma il nome nell'indirizzo giusto?
4. **la porta**: il servizio che mi serve accetta connessioni?
5. **il servizio**: risponde come dovrebbe?

@nyx: Ogni gradino ha il suo comando. Saltarne uno vuol dire dare la colpa alla cosa sbagliata.`,
    },
    {
      kind: 'task',
      title: 'Gradino 1: la strada',
      body: `\`ip route\` mostra la **tabella di instradamento**: dove manda i pacchetti il tuo deck.

\`\`\`
ip route
\`\`\`

La riga \`default via ...\` indica il **gateway predefinito**: tutto ciò che non è nella rete locale passa da lì. L'altra riga dice che la rete \`192.168.1.0/24\` è raggiungibile direttamente.`,
      objective: 'Qual è il gateway predefinito? Invia il suo IP con flag.',
      hints: ['La riga che inizia con default.', 'ip route e poi: flag 192.168.1.1'],
      answer: ['192.168.1.1'],
      success: 'Il gateway è il router `192.168.1.1`. Hai un indirizzo e sai dove uscire: gradino 1 superato.',
    },
    {
      kind: 'task',
      title: 'Gradino 2: il gateway',
      body: `\`-c 2\` dice a ping di mandare solo 2 pacchetti (*count*) e poi fermarsi:

\`\`\`
ping -c 2 192.168.1.1
\`\`\``,
      objective: 'Verifica che il gateway risponda, con 2 pacchetti.',
      hints: ['ping con -c e il numero di pacchetti.', 'ping -c 2 192.168.1.1'],
      check: (ev) => ev.type === 'ping' && ev.ip === '192.168.1.1' && ev.replies > 0,
      success: '`0% packet loss`: il router risponde. La rete locale funziona.',
    },
    {
      kind: 'task',
      title: 'Gradino 3: il nome',
      body: `Le persone usano nomi (\`cassa.lan\`), le macchine usano indirizzi. \`nslookup\` chiede al **DNS** che indirizzo corrisponde a un nome:

\`\`\`
nslookup cassa.lan
\`\`\`

\`Server\` è il DNS che ha risposto (qui è il router stesso); sotto c'è la risposta.`,
      objective: 'Che indirizzo ha cassa.lan? Invialo con flag.',
      hints: ['La riga Address nella parte "answer".', 'nslookup cassa.lan e poi: flag 192.168.1.30'],
      answer: ['192.168.1.30'],
      success: 'Il nome si traduce in `192.168.1.30`. Il DNS funziona.',
    },
    {
      kind: 'task',
      title: 'La prova che inganna',
      body: `Mama ha già provato con ping, e infatti:

\`\`\`
ping -c 2 cassa.lan
\`\`\`

Provaci anche tu e guarda il risultato.`,
      objective: 'Fai ping a cassa.lan con 2 pacchetti.',
      hints: ['Come prima, con il nome della cassa.', 'ping -c 2 cassa.lan'],
      check: (ev) => ev.type === 'ping' && ev.ip === '192.168.1.30',
      success: '100% di pacchetti persi. Mama direbbe "è spenta". Ma ricordi il capitolo 2.2: molti dispositivi **ignorano il ping** di proposito. Il ping non risponde alla domanda vera: *il servizio della cassa funziona?*',
    },
    {
      kind: 'task',
      title: 'Gradino 4: la porta',
      body: `La cassa riceve i pagamenti con HTTPS, sulla porta **443**. \`nc\` (*netcat*, il "coltellino svizzero" delle reti) con \`-z\` prova solo ad aprire la connessione, senza mandare dati, e con \`-v\` racconta com'è andata:

\`\`\`
nc -zv cassa.lan 443
\`\`\``,
      objective: 'Verifica se la porta 443 di cassa.lan accetta connessioni.',
      hints: ['nc -zv, poi il nome, poi il numero di porta.', 'nc -zv cassa.lan 443'],
      check: cmd('nc-open', (a) => a[0] === 'cassa.lan' && a[1] === '443'),
      success: `\`succeeded!\`: la cassa è **accesa** e il suo servizio **accetta connessioni**. Non è rotta. Il problema è da un'altra parte (e infatti Mama scopre che il lettore delle carte era scollegato dalla Wi-Fi).

?? È lo stesso controllo che fa nmap su una porta, ma su una sola e in un secondo. In un'azienda vale anche il contrario: se una porta che dovrebbe essere chiusa risponde, è un problema di sicurezza.`,
    },
    {
      kind: 'task',
      title: 'Gradino 5: il servizio',
      body: `L'ultimo gradino è chiedere al servizio di rispondere davvero. Per un sito web basta \`curl -I\`, che chiede solo le **intestazioni** della risposta:

\`\`\`
curl -I http://jukebox.lan
\`\`\`

La prima riga contiene il **codice di stato**: 200 vuol dire "tutto bene".`,
      objective: 'Interroga il sito del jukebox e invia con flag il codice di stato.',
      hints: ['curl -I e l\'indirizzo del sito.', 'curl -I http://jukebox.lan e poi: flag 200'],
      answer: ['200'],
      success: 'Il jukebox risponde `200 OK`. Hai salito tutta la scala: indirizzo, gateway, DNS, porta, servizio.',
    },
    {
      kind: 'task',
      title: 'Fuori dalla rete',
      body: `\`traceroute\` mostra la **strada** che fanno i pacchetti per arrivare a un indirizzo lontano: ogni riga è un router attraversato (un *salto*, *hop*).

\`\`\`
traceroute 8.8.8.8
\`\`\`

Se a un certo punto i salti si fermano, sai **dove** si rompe la strada: nella tua rete, dal fornitore di Internet o dall'altra parte.`,
      objective: 'Quanti salti servono per arrivare a 8.8.8.8? Invia il numero con flag.',
      hints: ['Conta le righe numerate.', 'traceroute 8.8.8.8 e poi: flag 4'],
      answer: ['4'],
      success: `Quattro salti; il terzo risponde con \`* * *\`: quel router non risponde alle sonde, ma lascia passare il traffico (infatti si arriva a destinazione). Non è un guasto.

!! Ping e traceroute verso server di altri vanno bene per diagnosi occasionali. Le scansioni di porte (nmap) invece si fanno **solo** su sistemi autorizzati.`,
    },
    {
      kind: 'task',
      title: 'E io, cosa espongo?',
      body: `L'ultimo controllo si fa sulla **propria** macchina: quali porte stanno aspettando connessioni? \`ss\` (*socket statistics*) con:
- \`-t\` → solo TCP
- \`-l\` → solo le porte in ascolto (*listening*)
- \`-n\` → numeri invece dei nomi
- \`-p\` → il programma che le tiene aperte

\`\`\`
ss -tlnp
\`\`\``,
      objective: 'Quale porta è in ascolto sul tuo deck? Invia il numero con flag.',
      hints: ['La colonna Local Address:Port.', 'ss -tlnp e poi: flag 22'],
      answer: ['22'],
      success: 'Solo la 22, il servizio SSH (`sshd`). `0.0.0.0` vuol dire "su tutte le schede di rete". In un controllo di sicurezza, ogni porta in ascolto deve avere un motivo: se non serve, si spegne il servizio.',
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      skills: ['ping', 'nc'],
      question: 'Un server non risponde al ping, ma `nc -zv server 443` dice `succeeded`. Cosa concludi?',
      options: [
        'Il server è acceso e il servizio HTTPS accetta connessioni: il ping è solo filtrato',
        'Il server è spento',
        'nc si è sbagliato: vale il ping',
        'La rete è guasta',
      ],
      correct: 0,
      explain: 'Una connessione riuscita è una prova più forte di un ping mancato. Il ping usa ICMP, che molti firewall bloccano; il servizio vero usa TCP sulla sua porta.',
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      skills: ['nslookup', 'ping'],
      question: '`ping 192.168.1.30` funziona, `ping cassa.lan` risponde "Name or service not known". Quale gradino è rotto?',
      options: ['Il DNS: il nome non viene tradotto in indirizzo', 'Il gateway', 'La porta del servizio', 'Il cavo di rete'],
      correct: 0,
      explain: 'Con l\'indirizzo funziona, con il nome no: la rete c\'è, manca la traduzione. Si controlla il DNS (con nslookup o dig) e la sua configurazione.',
    },
  ],
  recap: [
    ['scala del troubleshooting', 'io → gateway → DNS → porta → servizio'],
    ['ip route', 'la tabella di instradamento; "default via" = gateway'],
    ['ping -c N', 'manda N pacchetti e si ferma'],
    ['nslookup NOME', 'chiede al DNS l\'indirizzo di un nome'],
    ['nc -zv HOST PORTA', 'la porta accetta connessioni?'],
    ['curl -I URL', 'solo le intestazioni della risposta web'],
    ['traceroute', 'la strada verso un indirizzo, salto per salto'],
    ['ss -tlnp', 'le porte TCP in ascolto sulla tua macchina'],
  ],
};

// ------------------------------------------------------------------ 5.4

export const TEXTTOOLS_MISSION: Mission = {
  id: 'ch05-m4',
  title: 'Gli attrezzi del testo',
  tagline: 'awk, sed, tr, tee, xargs e diff: trasformare i log invece di leggerli.',
  xp: 300,
  steps: [
    {
      kind: 'lesson',
      title: 'Colonne, non righe',
      body: `@nyx: Finora hai filtrato righe intere con grep e tagliato campi con cut. Ma un log è una **tabella**: ogni riga ha le sue colonne. Il re delle colonne è **awk**.

\`\`\`
awk '{print $1}' web/access.log
\`\`\`

- awk legge il file riga per riga e la divide in campi, separati da spazi
- \`$1\` è il primo campo, \`$2\` il secondo... \`$0\` è la riga intera
- quello tra \`{ }\` è cosa fare su ogni riga; tutto il programma va tra apici \`' '\`

In \`access.log\` (il log di un sito web) il campo 1 è l'IP del visitatore, il 9 è il codice di stato (200, 404...).

?? Rispetto a cut, awk tratta più spazi di fila come un separatore solo: è perfetto per output "allineati" come quello di ps o ls -l.`,
    },
    {
      kind: 'task',
      title: 'Solo gli IP',
      body: `Mostra solo il primo campo di ogni riga di \`web/access.log\`.`,
      objective: 'Stampa solo gli IP di web/access.log con awk.',
      hints: ['awk \'{print $N}\' FILE, con il numero del campo.', 'awk \'{print $1}\' web/access.log'],
      check: cmd('awk', (a) => a.some((x) => /print \$1\b/.test(x)) && a.some((x) => x.endsWith('access.log'))),
      success: 'Una colonna pulita: ora la puoi passare a sort e uniq come hai fatto nel capitolo SOC.',
    },
    {
      kind: 'task',
      title: 'La classifica',
      body: `Componi la classifica dei visitatori:

\`\`\`
awk '{print $1}' web/access.log | sort | uniq -c | sort -rn | head -n 3
\`\`\``,
      objective: 'Quale IP ha fatto più richieste? Invialo con flag.',
      hints: ['La prima riga della classifica.', 'flag 203.0.113.50'],
      answer: ['203.0.113.50'],
      success: '`203.0.113.50`, 15 richieste su 26: più della metà del traffico da un indirizzo esterno. Vediamo cosa cercava.',
    },
    {
      kind: 'lesson',
      title: 'awk con le condizioni',
      body: `Prima delle graffe si può mettere una **condizione**: l'azione vale solo per le righe che la rispettano.

\`\`\`
awk '$9 == 404' web/access.log
\`\`\`

mostra solo le righe con codice 404 (pagina non trovata). Senza azione, awk stampa la riga intera. Si possono usare \`==\`, \`!=\`, \`>\`, \`<\`, \`>=\`.

Per file separati da altro, \`-F\` sceglie il separatore. In \`/etc/passwd\` i campi sono separati da due punti, il 3 è l'UID:

\`\`\`
awk -F: '$3 >= 1000 {print $1}' /etc/passwd
\`\`\`

stampa i nomi degli utenti con UID da 1000 in su: su Debian e Ubuntu sono le **persone**; sotto il 1000 ci sono gli account di sistema.`,
    },
    {
      kind: 'task',
      title: 'Pagine che non esistono',
      body: `Tante richieste di pagine inesistenti dallo stesso IP sono il segno di uno **scanner** che cerca file dimenticati. Contale:

\`\`\`
awk '$9 == 404' web/access.log | wc -l
\`\`\``,
      objective: 'Quante richieste hanno avuto risposta 404? Invia il numero con flag.',
      hints: ['La condizione su $9 e poi wc -l.', 'flag 12'],
      answer: ['12'],
      success: '12 su 26. Un sito normale ne ha pochissime: qui qualcuno sta tirando a indovinare indirizzi (`/admin`, `/backup.zip`...).',
    },
    {
      kind: 'task',
      title: 'Le persone vere',
      body: `Usa awk con il separatore \`:\` su \`/etc/passwd\` per mostrare gli utenti con UID da 1000 in su.`,
      objective: 'Quanti utenti hanno UID ≥ 1000? Invia il numero con flag.',
      hints: ['-F: per il separatore, condizione su $3, stampa $1.', 'awk -F: \'$3 >= 1000 {print $1}\' /etc/passwd e poi: flag 2'],
      answer: ['2'],
      success: 'Tu e Mama. In un audit degli accessi è la prima lista da chiedere: ogni persona deve corrispondere a qualcuno che lavora davvero lì.',
    },
    {
      kind: 'lesson',
      title: 'sed: cerca e sostituisci',
      body: `**sed** (*stream editor*) modifica il testo mentre passa. L'uso più comune è la sostituzione:

\`\`\`
sed 's/VECCHIO/NUOVO/g' FILE
\`\`\`

- \`s\` → sostituisci
- \`g\` → in tutta la riga (senza, solo la prima volta in ogni riga)
- il risultato va a schermo: il file originale **non cambia**. Per salvarlo: \`> nuovo_file\`

Con \`-E\` il testo cercato può essere un'**espressione regolare**: \`[0-9]+\` vuol dire "una o più cifre", \`\\.\` vuol dire "un punto vero" (il punto da solo vuol dire "qualsiasi carattere").

!! Prima di mandare un log a un fornitore o a un collega esterno, si tolgono i **dati personali** (GDPR): gli IP dei clienti sono dati personali. Si chiama *anonimizzare* (o, più correttamente, pseudonimizzare).`,
    },
    {
      kind: 'task',
      title: 'Anonimizza',
      body: `Lo sviluppatore del sito vuole il log per capire gli errori. Crea \`web/access_anon.log\`: uguale a \`access.log\`, ma con ogni IP della rete interna (\`192.168.1.qualcosa\`) sostituito da \`IP-INTERNO\`.

\`\`\`
sed -E 's/192\\.168\\.1\\.[0-9]+/IP-INTERNO/g' web/access.log > web/access_anon.log
\`\`\``,
      objective: 'Crea web/access_anon.log senza indirizzi 192.168.1.x.',
      hints: ['sed -E con s/MODELLO/IP-INTERNO/g, e > per salvare in un file nuovo.', 'sed -E \'s/192\\.168\\.1\\.[0-9]+/IP-INTERNO/g\' web/access.log > web/access_anon.log'],
      state: (sh) => {
        const f = sh.fs.get(`${sh.home}/web/access_anon.log`);
        return !!f && f.type === 'file' && f.content.includes('IP-INTERNO') && !/192\.168\.1\.\d/.test(f.content) && f.content.split('\n').length >= 20;
      },
      success: 'Il file nuovo ha le stesse righe, senza gli IP dei clienti. L\'originale è intatto: lo conservi per te, nel caso serva un\'indagine.',
    },
    {
      kind: 'lesson',
      title: 'tr, tee e xargs',
      body: `Tre attrezzi piccoli che tornano utili ogni giorno:

**tr** (*translate*) cambia o toglie singoli caratteri. \`tr -s ' '\` "spreme" gli spazi ripetuti in uno solo: così \`cut -d ' '\` funziona anche su output allineati.

\`\`\`
ps aux | tr -s ' ' | cut -d ' ' -f 1
\`\`\`

**tee** è un raccordo a T: scrive quello che riceve in un file **e** lo passa avanti. Salvi un risultato intermedio senza interrompere la pipe.

\`\`\`
grep Failed caso/auth.log | tee fallimenti.txt | wc -l
\`\`\`

**xargs** trasforma le righe che riceve in **argomenti** di un comando. Molti comandi (wc, sha256sum, ls) vogliono i file come argomenti, non dalla pipe:

\`\`\`
find ~/web -name "*.log" | xargs wc -l
\`\`\``,
    },
    {
      kind: 'task',
      title: 'Processi per utente',
      body: `Conta i processi di ogni utente:

\`\`\`
ps aux | tr -s ' ' | cut -d ' ' -f 1 | sort | uniq -c
\`\`\``,
      objective: 'Quanti processi appartengono a root? Invia il numero con flag.',
      hints: ['Cerca la riga con root nel conteggio.', 'flag 3'],
      answer: ['3'],
      success: 'Tre: init, cron e sshd. Senza `tr -s` il comando cut avrebbe visto decine di campi vuoti tra uno spazio e l\'altro.',
    },
    {
      kind: 'task',
      title: 'Salva e conta',
      body: `Salva le richieste con errore 404 in \`~/errori404.txt\` e, nella stessa riga, contale:

\`\`\`
grep ' 404 ' web/access.log | tee ~/errori404.txt | wc -l
\`\`\``,
      objective: 'Crea ~/errori404.txt con le righe 404 usando tee in una pipe.',
      hints: ['grep, poi tee con il nome del file, poi wc -l.', 'grep \' 404 \' web/access.log | tee ~/errori404.txt | wc -l'],
      state: (sh) => {
        const f = sh.fs.get(`${sh.home}/errori404.txt`);
        return !!f && f.type === 'file' && f.content.trim().split('\n').length === 12;
      },
      success: 'A schermo il numero, nel file le righe da allegare al ticket. Un comando solo.',
    },
    {
      kind: 'task',
      title: 'Tanti file insieme',
      body: `Conta le righe di tutti i file \`.log\` nelle cartelle \`caso\` e \`web\`:

\`\`\`
find ~/caso ~/web -name "*.log" | xargs wc -l
\`\`\``,
      objective: 'Quante righe in totale? Invia il numero con flag.',
      hints: ['L\'ultima riga di wc, "total".', 'flag 89'],
      answer: ['89'],
      success: 'wc ha ricevuto i tre file come argomenti e ha aggiunto il totale. Con xargs ogni elenco di file diventa lavoro fatto in una volta.',
    },
    {
      kind: 'lesson',
      title: 'diff: cosa è cambiato',
      body: `**diff** confronta due file riga per riga e mostra solo le differenze:

\`\`\`
diff vecchio nuovo
\`\`\`

- \`<\` → la riga com'era nel primo file
- \`>\` → la riga com'è nel secondo
- \`3c3\` → "la riga 3 è cambiata" (c = *change*; a = aggiunta, d = cancellata)

Nel lavoro si usa per confrontare una configurazione con la sua copia di sicurezza: "cosa ha cambiato qualcuno da ieri?". Gli strumenti di controllo dell'integrità (come AIDE) fanno lo stesso su migliaia di file.`,
    },
    {
      kind: 'task',
      title: 'La modifica di stanotte',
      body: `In \`testo\` ci sono due copie della configurazione SSH del negozio: quella di ieri e quella di oggi.

\`\`\`
diff testo/sshd_config.ieri testo/sshd_config.oggi
\`\`\``,
      objective: 'Invia con flag la riga com\'è OGGI.',
      hints: ['La riga con > davanti, senza il simbolo.', 'flag PermitRootLogin yes'],
      answer: ['PermitRootLogin yes'],
      success: `Qualcuno ha **permesso a root di entrare direttamente** via SSH. È una delle prime cose che fa un attaccante per tornare, ed è vietata da ogni guida di hardening. Da segnalare subito: chi l'ha cambiata, e perché?`,
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      skills: ['awk'],
      question: 'Cosa stampa `awk \'$9 >= 500 {print $1}\' web/access.log`?',
      options: [
        'Gli IP delle richieste a cui il server ha risposto con un errore 5xx',
        'Le prime 500 righe del log',
        'Le righe dalla 9 alla 500',
        'Le richieste più grandi di 500 byte',
      ],
      correct: 0,
      explain: 'Condizione sul campo 9 (il codice di stato), azione: stampa il campo 1 (l\'IP). I 5xx sono errori del server: spesso il segno che qualcuno sta provando input strani.',
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      ex: 'correggi',
      skills: ['sed'],
      question: 'Un collega scrive `sed \'s/admin/ADMIN/\' utenti.txt` ma il file non cambia. Perché?',
      options: [
        'sed scrive il risultato a schermo: per salvarlo serve > nuovo_file',
        'Manca la g finale',
        'sed funziona solo con -E',
        'Il file è in sola lettura',
      ],
      correct: 0,
      explain: 'sed non tocca l\'originale (a meno di usare -i, "in place", da usare con attenzione). È una protezione: prima guardi il risultato, poi decidi se salvarlo.',
    },
  ],
  recap: [
    ['awk \'{print $N}\'', 'stampa il campo N di ogni riga'],
    ['awk \'COND\'', 'solo le righe che rispettano la condizione'],
    ['awk -F:', 'sceglie il separatore dei campi'],
    ['sed \'s/A/B/g\'', 'sostituisce A con B (a schermo)'],
    ['sed -E', 'espressioni regolari estese: [0-9]+, \\.'],
    ['tr -s \' \'', 'spreme gli spazi ripetuti'],
    ['tee FILE', 'salva in un file e passa avanti'],
    ['xargs CMD', 'le righe ricevute diventano argomenti di CMD'],
    ['diff A B', 'le righe diverse: < in A, > in B'],
    ['anonimizzare', 'togliere i dati personali prima di condividere un log'],
  ],
};
