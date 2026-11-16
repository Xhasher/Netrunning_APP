// Capitolo 05 · Scripting. Far lavorare il deck al posto tuo.
//
// Trama: Luca è in ferie per dieci giorni e il sito di Mama gira sul tuo deck (capitolo AM).
// Ogni mattina devi controllare log, accessi e servizi. Al terzo giorno di comandi ripetuti
// a mano, Nyx ti insegna a scriverli una volta sola: variabili (5.1), il primo script (5.2),
// un guardiano che dà l'allarme da solo (5.3). La 5.4 (ch-pratica.ts) affina gli attrezzi.

import type { Chapter } from '../game/types';

/** Versione dei contenuti in cui il capitolo è stato rivisto (passi nuovi). */
const V = 19;

export const CH05: Chapter = {
  id: 'ch05',
  code: '05',
  title: 'Scripting',
  subtitle: 'Variabili, editor, script e automazione con Bash',
  missions: [
    // ------------------------------------------------------------------ 5.1
    {
      id: 'ch05-m1',
      title: 'Variabili',
      tagline: 'Dare un nome ai valori: $HOME, NOME=valore e $(comando).',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Perché automatizzare',
          body: `Terzo giorno senza Luca. Ogni mattina la stessa routine: apri il log degli accessi, conti i tentativi falliti, cerchi gli indirizzi strani, controlli che il sito sia su. Venti minuti, sempre gli stessi comandi.

@nyx: Ti guardo da tre giorni. Scrivi le stesse catene di comandi, a mano, ogni mattina. Ora immagina di doverlo fare su cinquanta server. Impossibile.

@nyx: Chi lavora bene in sicurezza **automatizza**: scrive i comandi una volta sola in un file, lo **script**, e poi lo lancia quando serve. O lo fa lanciare al computer, da solo, ogni mattina. È una delle differenze più grandi tra chi comincia e chi fa questo mestiere da anni.

Per scrivere script servono tre ingredienti, e li vedrai in quest'ordine:
- le **variabili**, per ricordare dei valori
- un **editor**, per scrivere i file
- le **strutture**: cicli (ripeti) e condizioni (se... allora...)`,
        },
        {
          kind: 'task',
          title: 'Le variabili che esistono già',
          body: `Una **variabile** è un nome a cui è associato un valore, come un'etichetta su una scatola. La shell ne ha già alcune pronte, dette **variabili d'ambiente**: descrivono l'ambiente in cui lavori (chi sei, dov'è la tua home, dove ti trovi). Per leggerne una, metti un \`$\` davanti al nome:

\`\`\`
echo $HOME
echo "Sono $USER e mi trovo in $PWD"
\`\`\`

Prova almeno uno dei due comandi. Per vederle tutte c'è \`env\`.`,
          objective: 'Stampa una variabile con echo $NOME.',
          hints: ['Scrivi: echo $HOME'],
          check: (ev) => ev.type === 'command' && ev.name === 'echo' && ev.ok && ev.args.some((a) => a.startsWith('/home/')),
          success: `La shell ha sostituito \`$HOME\` con il suo valore **prima** di eseguire echo. Questo meccanismo si chiama **espansione**.

?? Le variabili d'ambiente a volte contengono segreti, come chiavi di accesso a servizi cloud. Durante un'indagine si controllano sempre: \`env\` è uno dei primi comandi da lanciare.`,
        },
        {
          kind: 'task',
          since: V,
          title: 'Dove cerca i comandi',
          body: `Tra le variabili d'ambiente ce n'è una che spiega un mistero del capitolo AM. Quando scrivi \`ls\`, come fa la shell a trovare il file \`/usr/bin/ls\`?

Lo cerca nelle cartelle elencate in \`PATH\` ("percorso"), **una dopo l'altra, nell'ordine scritto**, e si ferma alla prima che contiene un programma con quel nome:

\`\`\`
echo $PATH
\`\`\`

Le cartelle sono separate da due punti. Qual è la **prima** in cui la shell cerca? Inviala con \`flag\`.`,
          objective: 'Invia con flag la prima cartella di PATH.',
          hints: ['echo $PATH, poi guarda cosa c\'è prima dei primi due punti.', 'flag /usr/local/bin'],
          answer: ['/usr/local/bin', '/usr/local/bin/'],
          solve: ['echo $PATH', 'flag /usr/local/bin'],
          success: `\`/usr/local/bin\`. Ecco come funziona il trucco del falso \`ls\`: se un attaccante riesce a mettere un programma chiamato \`ls\` in una cartella che viene **prima** di \`/usr/bin\` nel PATH, la shell trova il suo e si ferma lì.

Per questo chi difende controlla due cose: chi può scrivere nelle cartelle del PATH, e che il PATH non contenga cartelle strane come \`/tmp\` o \`.\` (la cartella attuale).`,
        },
        {
          kind: 'task',
          title: 'Crea una variabile',
          body: `Ora creane una tua. Domani controllerai un altro dispositivo: se l'indirizzo è scritto in un posto solo, lo cambi una volta.

\`\`\`
BERSAGLIO="jukebox.lan"
echo "Scansiono $BERSAGLIO"
\`\`\`

?? Le virgolette contano: tra virgolette **doppie** \`"..."\` le variabili vengono espanse, tra virgolette **singole** \`'...'\` no. Prova \`echo '$BERSAGLIO'\` per vedere la differenza.`,
          objective: 'Crea una variabile e usala con echo.',
          hints: [
            'Scrivi: BERSAGLIO="jukebox.lan" e poi echo "Scansiono $BERSAGLIO"',
            'Se scrivi BERSAGLIO = "jukebox.lan" con gli spazi, la shell pensa che BERSAGLIO sia un comando!',
          ],
          check: (ev, sh) =>
            ev.type === 'command' && ev.name === 'echo' && ev.ok && Object.entries(sh.vars).some(([k, v]) => /^[A-Za-z_]\w*$/.test(k) && v !== '' && ev.args.join(' ').includes(v)),
          success: `Hai creato e usato una variabile. Ora il valore è scritto in un posto solo: se cambia il bersaglio, cambi una riga invece di dieci.`,
        },
        {
          kind: 'task',
          title: 'Il risultato di un comando',
          body: `La cosa più utile di tutte: mettere in una variabile **il risultato di un comando**. Si scrive il comando dentro \`$(...)\`. Prova con il conteggio che fai ogni mattina sul log del capitolo 04:

\`\`\`
FALLITI=$(grep "Failed password" caso/auth.log | wc -l)
echo "Tentativi falliti: $FALLITI"
\`\`\`

La shell esegue prima il comando tra parentesi e mette il risultato al suo posto. Si chiama **sostituzione di comando**.`,
          objective: 'Salva l\'output di un comando in una variabile con $(...) e stampala.',
          hints: ['Scrivi le due righe dell\'esempio, una alla volta.', 'Puoi anche scriverle su una riga sola separandole con ;'],
          check: (ev, sh) => ev.type === 'command' && ev.name === 'echo' && ev.ok && Object.values(sh.vars).includes('40') && ev.args.join(' ').includes('40'),
          success: `40, come nel capitolo 04, ma ora il numero è dentro una variabile e lo puoi riusare: confrontarlo, scriverlo in un report, mandarlo in un allarme...`,
        },
        {
          kind: 'task',
          title: 'Errori in silenzio',
          body: `Uno script deve produrre un risultato pulito, senza messaggi d'errore che non interessano a nessuno. Per toglierli devi sapere una cosa: ogni comando ha **due uscite**. Lo **stdout** (*standard output*) per l'output normale, e lo **stderr** (*standard error*) per i messaggi di errore. Di solito finiscono entrambe sullo schermo, mescolate.

Prova a cercare un file in tutto il sistema:

\`\`\`
find / -name passwd
\`\`\`

Vedrai anche messaggi \`Permission denied\`. Ora ripeti mandando gli errori nel "buco nero" \`/dev/null\`, un file speciale che butta via tutto quello che riceve:

\`\`\`
find / -name passwd 2>/dev/null
\`\`\`

Ti ricordi \`>\` della prima notte, che mandava l'output in un file? \`2>\` fa lo stesso, ma solo con l'uscita numero 2, cioè gli errori. (L'uscita numero 1 è lo stdout: \`>\` da solo vuol dire \`1>\`.)`,
          objective: 'Cerca passwd con find, nascondendo gli errori con 2>/dev/null.',
          hints: ['Scrivi: find / -name passwd 2>/dev/null'],
          check: (ev) => ev.type === 'command' && ev.name === 'find' && ev.args.includes('passwd'),
          success: `Output pulito: solo \`/etc/passwd\`. \`2>/dev/null\` lo vedrai ovunque negli script e nei comandi dei professionisti.`,
        },
        {
          kind: 'task',
          since: V,
          title: 'Stesso strumento, altra domanda',
          body: `Il bello di uno script con argomenti: non lo riscrivi, cambi solo la domanda. Usa \`conta.sh\` per contare i tentativi falliti nello stesso log:

\`\`\`
./conta.sh ~/caso/auth.log Failed
\`\`\`

Quante righe? Invia il numero con \`flag\`.`,
          objective: 'Conta le righe con Failed usando conta.sh e invia il numero.',
          hints: ['Dalla cartella dove hai salvato conta.sh: ./conta.sh ~/caso/auth.log Failed', 'flag 40'],
          answer: ['40'],
          solve: ['flag 40'],
          success: `40, lo stesso numero che hai trovato a mano nel capitolo 04. Stesso risultato, ma ora con un comando corto che chiunque nel team può usare senza ricordare la catena \`grep | wc -l\`.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Hai scritto `IP=192.168.1.20`. Cosa stampa `echo \'Bersaglio: $IP\'` (con le virgolette singole)?',
          options: ['Bersaglio: 192.168.1.20', 'Bersaglio: $IP', 'Bersaglio:', 'Un errore'],
          correct: 1,
          explain: `Tra virgolette **singole** la shell non espande nulla: stampa il testo così com'è. Con le doppie \`"Bersaglio: $IP"\` avresti ottenuto l'indirizzo.`,
        },
      ],
      recap: [
        ['$NOME', 'legge il valore di una variabile'],
        ['NOME=valore', 'crea una variabile (senza spazi attorno a =)'],
        ['"..." / \'...\'', 'le doppie espandono le variabili, le singole no'],
        ['$(comando)', 'sostituzione di comando: inserisce l\'output'],
        ['env', 'mostra le variabili d\'ambiente'],
        ['stdout / stderr', 'output normale / messaggi di errore'],
        ['2>/dev/null', 'butta via i messaggi di errore'],
      ],
    },

    // ------------------------------------------------------------------ 5.2
    {
      id: 'ch05-m2',
      title: 'Il primo script',
      tagline: 'Scrivere un file con nano, renderlo eseguibile e passargli argomenti.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Cos\'è uno script',
          body: `@nyx: Uno **script** è un semplice file di testo che contiene comandi, uno per riga. Quando lo esegui, la shell li esegue in ordine, uno dopo l'altro, come se li scrivessi tu. Hai già incontrato uno script: \`backup.sh\`, sul vecchio server di Mama.

Uno script Bash di solito si presenta così:

\`\`\`
#!/bin/bash
# Questo è un commento: la shell lo ignora
echo "Ciao, sono uno script"
whoami
\`\`\`

- La prima riga \`#!/bin/bash\` si chiama **shebang** (da *sharp*, il nome inglese di \`#\`, e *bang*, quello di \`!\`): dice al sistema quale programma deve eseguire il file
- Le righe che iniziano con \`#\` sono **commenti**: note per chi legge, la shell le salta
- Per convenzione gli script Bash finiscono con \`.sh\`

Per scrivere il file userai **nano**, l'editor che hai già usato per correggere la configurazione del sito di Mama.

@nyx: Cominciamo da uno piccolo, per capire il meccanismo. Poi costruiamo quello che ti serve ogni mattina.`,
        },
        {
          kind: 'task',
          title: 'Apri l\'editor',
          body: `Entra nella cartella \`script\` e apri un file nuovo con nano:

\`\`\`
cd script
nano ciao.sh
\`\`\`

Si aprirà l'editor. Scrivi queste righe:

\`\`\`
#!/bin/bash
# il mio primo script
echo "Ciao da $USER"
date
\`\`\`

(\`date\` stampa la data e l'ora: in un controllo del mattino è utile sapere quando è stato fatto.)

Poi tocca **Salva** ed **Esci**. (Nel vero nano: Ctrl+O per salvare, Ctrl+X per uscire.)`,
          objective: 'Crea e salva script/ciao.sh con nano.',
          hints: ['Prima cd script, poi nano ciao.sh', 'Nell\'editor scrivi le righe e premi Salva.'],
          state: (sh) => {
            const n = sh.fs.get(`${sh.home}/script/ciao.sh`);
            return !!n && n.type === 'file' && n.content.includes('echo');
          },
          check: (ev, sh) => {
            if (ev.type !== 'saved' || !ev.path.endsWith('.sh')) return false;
            const n = sh.fs.get(ev.path);
            return !!n && n.type === 'file' && n.content.includes('echo');
          },
          success: `Hai scritto il tuo primo script! Ora dobbiamo eseguirlo.`,
        },
        {
          kind: 'task',
          title: 'Eseguilo',
          body: `Il modo più semplice: chiedi a \`bash\`, il programma della shell, di leggere il file ed eseguire i comandi che contiene.

\`\`\`
bash ciao.sh
\`\`\``,
          objective: 'Esegui lo script con bash ciao.sh.',
          hints: ['Dalla cartella script: bash ciao.sh'],
          check: (ev) => ev.type === 'script' && ev.ok,
          success: `Lo script ha eseguito i comandi uno dopo l'altro. Se qualcosa non va, riaprilo con \`nano ciao.sh\` e correggi.`,
        },
        {
          kind: 'task',
          title: 'Rendilo eseguibile',
          body: `Gli strumenti veri si lanciano direttamente, con \`./nome\` (\`./\` vuol dire "nella cartella attuale"). Prova:

\`\`\`
./ciao.sh
\`\`\`

Riceverai *Permission denied*: il file non ha il permesso \`x\` (esecuzione). Ricordi \`chmod\`? Aggiungilo e riprova:

\`\`\`
chmod +x ciao.sh
./ciao.sh
\`\`\``,
          objective: 'Rendi eseguibile lo script e lancialo con ./ciao.sh.',
          hints: ['chmod +x ciao.sh', 'Poi: ./ciao.sh'],
          check: (ev) => ev.type === 'script' && ev.ok && ev.path.endsWith('.sh'),
          success: `Funziona! \`chmod +x\` aggiunge il permesso di esecuzione.

!! Per lo stesso motivo, se trovi uno script **eseguibile** e **modificabile da tutti** (777) su un server, è una vulnerabilità seria: chiunque può cambiarne i comandi. L'hai già sistemato nel capitolo 03, ricordi \`backup.sh\`?`,
        },
        {
          kind: 'lesson',
          title: 'Gli argomenti',
          body: `@nyx: \`ciao.sh\` fa sempre la stessa cosa. Uno script diventa davvero utile quando accetta **argomenti**, come i comandi veri: \`cat\` ti chiede quale file, \`ping\` quale indirizzo. Così lo stesso script lavora ogni volta su dati diversi.

Dentro lo script gli argomenti hanno nomi fissi:
- \`$1\` è il primo argomento, \`$2\` il secondo, e così via
- \`$#\` è il numero di argomenti ricevuti
- \`$0\` è il nome dello script

Esempio: uno script \`saluta.sh\` con dentro

\`\`\`
#!/bin/bash
echo "Ciao $1, benvenuto a Night City"
\`\`\`

lanciato con \`./saluta.sh Nyx\` stampa \`Ciao Nyx, benvenuto a Night City\`.`,
        },
        {
          kind: 'task',
          title: 'Uno strumento vero',
          body: `Ora lo strumento per la tua routine del mattino. Uno script \`conta.sh\` che conta quante righe di un file contengono una parola. File e parola arrivano come argomenti:

\`\`\`
nano conta.sh
\`\`\`

Contenuto:

\`\`\`
#!/bin/bash
# uso: ./conta.sh FILE PAROLA
N=$(grep "$2" "$1" | wc -l)
echo "$2 compare in $N righe di $1"
\`\`\`

Salva, rendilo eseguibile e provalo sul log del capitolo 04:

\`\`\`
chmod +x conta.sh
./conta.sh ~/caso/auth.log Accepted
\`\`\``,
          objective: 'Crea conta.sh e lancialo con due argomenti.',
          hints: [
            'Scrivi lo script con nano conta.sh, salva, poi chmod +x conta.sh',
            './conta.sh ~/caso/auth.log Accepted',
          ],
          check: (ev, sh) => {
            if (ev.type !== 'script' || !ev.ok) return false;
            const n = sh.fs.get(ev.path);
            return !!n && n.type === 'file' && n.content.includes('$1') && n.content.includes('$2');
          },
          success: `Hai costruito un piccolo strumento riutilizzabile! Ora puoi cercare qualsiasi parola in qualsiasi log con un comando solo.

?? Le virgolette attorno a \`"$1"\` e \`"$2"\` sono una buona abitudine: proteggono lo script se un argomento contiene spazi.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Lanci `./scan.sh` e ricevi `Permission denied`, ma il file esiste ed è tuo. Qual è la causa più probabile?',
          options: [
            'Lo script contiene un errore',
            'Il file non ha il permesso di esecuzione: serve chmod +x scan.sh',
            'Bisogna essere root per eseguire script',
            'Manca l\'estensione .sh',
          ],
          correct: 1,
          explain: `Senza il permesso \`x\` il sistema rifiuta di eseguire il file. In alternativa puoi sempre lanciarlo con \`bash scan.sh\`, che legge il file invece di eseguirlo direttamente.`,
        },
      ],
      recap: [
        ['script', 'un file di testo con comandi da eseguire in ordine'],
        ['#!/bin/bash', 'shebang: quale programma esegue lo script'],
        ['# commento', 'nota ignorata dalla shell'],
        ['nano FILE', 'editor di testo (Ctrl+O salva, Ctrl+X esce)'],
        ['bash script.sh', 'esegue uno script'],
        ['chmod +x / ./script.sh', 'rende eseguibile / lancia direttamente'],
        ['$1 $2 $#', 'argomenti dello script e loro numero'],
      ],
    },

    // ------------------------------------------------------------------ 5.3
    {
      id: 'ch05-m3',
      title: 'Il guardiano automatico',
      tagline: 'Cicli for, condizioni if e uno script di allarme per il SOC.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Ripetere: il ciclo for',
          body: `Quinto giorno. Mama ti chiede di controllare, ogni mattina, anche che router, jukebox e cassa rispondano.

@nyx: Tre dispositivi, tre comandi quasi uguali. Domani magari dieci. Quando una cosa va fatta **per ogni elemento di una lista**, si usa un **ciclo**: scrivi i comandi una volta, e il deck li ripete per ogni elemento.

Per esempio, il controllo di Mama:

\`\`\`
for host in gateway.lan jukebox.lan cassa.lan; do
  ping -c 1 $host
done
\`\`\`

Si legge: "per ogni \`host\` della lista, fai (\`do\`) un ping; fatto (\`done\`)". A ogni giro la variabile \`host\` contiene l'elemento di turno. Nyx ti spiega la forma esatta tra un attimo. Altri due esempi di liste:

\`\`\`
for i in $(seq 1 5); do echo "Giro $i"; done
\`\`\`

\`\`\`
for f in missioni/*.txt; do echo "== $f"; wc -w $f; done
\`\`\`

L'ultimo usa un **carattere jolly**: \`missioni/*.txt\` diventa la lista di tutti i file di testo nella cartella missioni. Nel terminale puoi scrivere tutto su una riga separando con \`;\`.`,
        },
        {
          kind: 'task',
          title: 'Il primo ciclo',
          body: `Conta le righe di ogni file nella cartella \`caso\` con un ciclo (dalla home):

\`\`\`
for f in caso/*; do echo "== $f"; wc -l $f; done
\`\`\``,
          objective: 'Esegui un ciclo for sui file di caso/.',
          hints: ['Torna nella home con cd, poi scrivi il ciclo su una riga.', 'for f in caso/*; do echo "== $f"; wc -l $f; done'],
          check: (ev) => ev.type === 'command' && ev.name === 'for' && ev.args.length > 2,
          success: `Il ciclo ha lavorato su ogni file per te. Con 3 file è comodo, con 3000 è indispensabile.`,
        },
        {
          kind: 'task',
          since: V,
          title: 'Un utente alla volta',
          body: `Un ciclo può contenere anche un \`$(...)\`. Conta i tentativi contro ognuno dei tre utenti presi di mira nel capitolo 04, in un colpo solo:

\`\`\`
for u in root admin mama; do echo "$u: $(grep "for $u from" caso/auth.log | wc -l)"; done
\`\`\`

Quale utente compare più volte? Invia il nome con \`flag\`.`,
          objective: 'Con un ciclo, trova l\'utente più preso di mira e invialo con flag.',
          hints: ['Il numero più alto accanto a un nome.', 'flag root'],
          answer: ['root'],
          solve: ['for u in root admin mama; do echo "$u: $(grep "for $u from" caso/auth.log | wc -l)"; done', 'flag root'],
          success: `**root**, 23 righe: l'utente che esiste su ogni Linux del mondo, quindi il primo che si prova. Per \`mama\` il conteggio include anche i due login riusciti (le righe \`Accepted ... for mama from\`): un conteggio va sempre letto sapendo cosa conta davvero.

Tre comandi in uno. E se domani la lista diventa di cinquanta nomi, il comando resta lungo uguale.`,
        },
        {
          kind: 'lesson',
          title: 'Decidere: if',
          body: `@nyx: Un ciclo ripete. Ma un guardiano deve anche **decidere**: "se i tentativi falliti sono troppi, dai l'allarme; altrimenti stai zitto". Per decidere si usa \`if\` ("se"), seguito da \`then\` ("allora") e, se serve, \`else\` ("altrimenti").

Nyx ti mostra la forma tra un attimo. Qui ti preparo il pezzo più importante: le **condizioni**, cioè le domande che \`if\` può fare. Si scrivono tra parentesi quadre, con gli **spazi** dentro:
- \`[ -f file ]\` → il file esiste
- \`[ -d cartella ]\` → la cartella esiste
- \`[ "$A" = "$B" ]\` → due testi sono uguali
- \`[ $N -gt 10 ]\` → N è maggiore di 10 (*greater than*). Poi ci sono \`-lt\` minore, \`-eq\` uguale, \`-ge\` maggiore o uguale

Le prime due servono per i file, le ultime per i numeri. Il guardiano userà proprio \`-gt\`: "se i tentativi sono più di dieci".`,
        },
        {
          kind: 'task',
          title: 'Una condizione',
          body: `Prova un if su una riga:

\`\`\`
if [ -f caso/auth.log ]; then echo "Log presente"; else echo "Log mancante!"; fi
\`\`\``,
          objective: 'Esegui una struttura if.',
          hints: ['Copia l\'esempio facendo attenzione agli spazi: uno dopo [ e uno prima di ]. Ogni pezzo (then, else, fi) è separato da un punto e virgola.', 'if [ -f caso/auth.log ]; then echo "Log presente"; else echo "Log mancante!"; fi'],
          check: (ev) => ev.type === 'command' && ev.name === 'if',
          success: `La shell ha controllato la condizione e scelto il ramo giusto. Ora mettiamo insieme tutto.`,
        },
        {
          kind: 'task',
          title: 'Il guardiano',
          body: `Ora metti insieme tutto: variabili, \`$(...)\`, \`if\`, \`for\`, argomenti. Scrivi lo script \`allarme.sh\`: controlla un log e dà l'allarme se ci sono troppi login falliti, elencando gli IP sospetti. Se va tutto bene, lo dice e basta.

\`\`\`
nano allarme.sh
\`\`\`

\`\`\`
#!/bin/bash
# uso: ./allarme.sh FILE_LOG
LOG=$1
SOGLIA=10
N=$(grep "Failed password" $LOG | wc -l)
if [ $N -gt $SOGLIA ]; then
  echo "ALLARME: $N login falliti in $LOG"
  for ip in $(grep "Failed password" $LOG | cut -d " " -f 11 | sort | uniq); do
    echo "IP sospetto: $ip"
  done
else
  echo "Tutto tranquillo ($N login falliti)"
fi
\`\`\`

Poi rendilo eseguibile e lancialo:

\`\`\`
chmod +x allarme.sh
./allarme.sh caso/auth.log
\`\`\`

(Salvalo dove preferisci: nella home o in \`script/\`, adattando i percorsi.)`,
          objective: 'Crea allarme.sh (con if e for) e lancialo sul log.',
          hints: [
            'Torna nella home con cd, così il percorso caso/auth.log funziona.',
            'nano allarme.sh, scrivi lo script, Salva, chmod +x allarme.sh',
            './allarme.sh caso/auth.log',
          ],
          check: (ev, sh) => {
            if (ev.type !== 'script' || !ev.ok) return false;
            const n = sh.fs.get(ev.path);
            return !!n && n.type === 'file' && /\bif\b/.test(n.content) && /\bfor\b/.test(n.content);
          },
          success: `**ALLARME: 40 login falliti**, con l'elenco degli IP sospetti.

@nyx: Hai appena scritto un piccolo sistema di rilevamento. I SIEM veri funzionano con lo stesso principio, solo su scala enorme: regole del tipo "se succede X più di N volte, dai l'allarme". E ti ricordi \`/etc/crontab\` del capitolo AM? Con una riga lì dentro, il guardiano girerebbe da solo ogni 5 minuti.

La mattina dopo, la routine dura trenta secondi. Il resto del tempo lo passi ad affinare gli attrezzi.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Perché `if [$N -gt 10]` dà errore, mentre `if [ $N -gt 10 ]` funziona?',
          options: [
            'Perché N deve essere scritta in minuscolo',
            'Perché [ è un comando: servono gli spazi per separarlo dai suoi argomenti',
            'Perché -gt non esiste',
            'Non c\'è differenza',
          ],
          correct: 1,
          explain: `\`[\` è letteralmente un comando (un altro nome di \`test\`), e \`]\` è il suo ultimo argomento. Senza spazi la shell legge \`[$N\` come una parola unica e non trova nessun comando con quel nome.`,
        },
      ],
      recap: [
        ['for X in LISTA; do ...; done', 'ripete i comandi per ogni elemento'],
        ['caso/*', 'carattere jolly: tutti i file della cartella'],
        ['$(seq 1 5)', 'la lista di numeri da 1 a 5'],
        ['if [ ... ]; then ...; else ...; fi', 'esegue i comandi solo se la condizione è vera'],
        ['-f -d', 'il file / la cartella esiste'],
        ['-gt -lt -eq', 'maggiore, minore, uguale (numeri)'],
        ['soglia di allarme', 'il principio delle regole di rilevamento di un SIEM'],
      ],
    },
  ],
};
