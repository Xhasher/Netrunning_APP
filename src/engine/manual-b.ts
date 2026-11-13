// Manuale, parte B: elaborare testo e log, cercare, permessi e utenti.

import { doc } from './manpages';

const TXT = 'Testo e log';
const PERM = 'Permessi e utenti';

doc('grep', {
  cat: TXT,
  short: 'cerca righe che contengono un testo',
  synopsis: 'grep [OPZIONI] TESTO [FILE...]',
  description: [
    'Mostra solo le righe che contengono il testo cercato. Funziona su uno o più file, su un\'intera cartella (-r) o sull\'output di un altro comando tramite una pipe. È lo strumento principale dell\'analista di log.',
    'ATTENZIONE: in questo deck il testo cercato è letterale (ogni carattere vale se stesso). Nel vero Linux "." significa "qualsiasi carattere" e "*" "zero o più ripetizioni": per usarli, anche qui, serve -E (espressioni regolari estese).',
    'Il codice di uscita è 0 se trova qualcosa, 1 se non trova nulla: negli script si usa per prendere decisioni.',
  ],
  options: [
    ['-i', 'ignora maiuscole e minuscole'],
    ['-v', 'inverte: mostra le righe che NON corrispondono'],
    ['-n', 'mostra il numero di riga'],
    ['-c', 'stampa solo QUANTE righe corrispondono'],
    ['-r', '"recursive": cerca in tutti i file di una cartella e delle sue sottocartelle'],
    ['-w', 'cerca la parola intera (root non trova "rootkit")'],
    ['-l', 'stampa solo i NOMI dei file che contengono una corrispondenza'],
    ['-L', 'stampa i nomi dei file che NON la contengono'],
    ['-o', 'stampa solo la parte che corrisponde, non l\'intera riga'],
    ['-E', 'il testo è un\'espressione regolare estesa: a|b, [0-9]+, ^inizio, fine$...'],
    ['-A N / -B N / -C N', 'mostra N righe dopo / prima / attorno a ogni corrispondenza (contesto)'],
    ['-m N', 'si ferma dopo N corrispondenze'],
    ['-h / -H', 'nasconde / mostra sempre il nome del file davanti alla riga'],
    ['-q', 'non stampa nulla: serve solo il codice di uscita'],
  ],
  examples: [
    ['grep -i "failed" caso/auth.log | head -n 3', 'ignora le maiuscole, mostra le prime tre'],
    ['grep -c Accepted caso/auth.log', 'conta quante volte compare Accepted'],
    ['grep -n root /etc/passwd', 'con il numero di riga'],
    ['grep -v nologin /etc/passwd', 'solo gli utenti che NON hanno la shell nologin'],
    ['grep -ri secret cloud', 'cerca "secret" (anche maiuscolo) in ogni file sotto la cartella cloud'],
    ['grep -rl AKIA cloud', 'quali file contengono una chiave AWS? solo i nomi'],
    ['grep -E "4625|4672" windows/security.csv', 'due Event ID insieme con "o" (|)'],
    ['grep -oE "[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+" caso/auth.log | sort | uniq -c', 'estrae solo gli indirizzi IP e li conta'],
    ['grep -B1 -A1 "Accepted password" caso/auth.log', 'la riga trovata con quella prima e quella dopo'],
    ['grep -w root /etc/passwd', 'parola intera: non trova "rootkit" né "chroot"'],
  ],
  notes: [
    'Virgolette: mettile attorno al testo se contiene spazi o simboli: grep "Failed password" file.',
    'Pipe di grep: "grep a | grep b" = righe con a E b. Per a O b usa grep -E "a|b".',
    'Sui log enormi aggiungi -m N o head per fermarti presto; con -c trovi in un attimo l\'ordine di grandezza.',
    'Le espressioni regolari sono una competenza fondamentale: i SIEM, i firewall, gli IDS e i WAF le usano tutti.',
  ],
  see: ['awk', 'sed', 'cut', 'find'],
});

doc('head', {
  cat: TXT,
  description: ['Mostra le prime righe di un file (10 se non specifichi altro). Utile per capire com\'è fatto un file o un log prima di analizzarlo: guarda sempre le prime righe, poi costruisci il comando.'],
  options: [
    ['-n N / -N', 'mostra le prime N righe'],
    ['-c N', 'mostra i primi N byte'],
    ['-q / -v', 'nasconde / mostra sempre le intestazioni dei file'],
  ],
  examples: [
    ['head -n 3 caso/auth.log', 'le prime tre righe del log'],
    ['head -5 /etc/passwd', 'forma abbreviata: -5 equivale a -n 5'],
    ['sort windows/security.csv | uniq -c | sort -n -r | head -n 3', 'head chiude una classifica: le prime tre voci'],
    ['head -n 2 caso/auth.log web/access.log', 'più file: ognuno con la sua intestazione'],
  ],
  see: ['tail', 'cat', 'sed'],
});

doc('tail', {
  cat: TXT,
  description: [
    'Mostra le ultime righe di un file (10 per impostazione predefinita). Nei log le cose più recenti stanno in fondo: tail è il modo più veloce per vedere "cosa è successo per ultimo".',
    'Nel vero Linux "tail -f" resta in attesa e mostra le nuove righe in tempo reale, mentre vengono scritte: è così che si osserva un attacco in corso.',
  ],
  options: [
    ['-n N / -N', 'mostra le ultime N righe'],
    ['-n +N', 'mostra tutto a partire dalla riga N'],
    ['-c N', 'mostra gli ultimi N byte'],
    ['-f', '"follow": segue il file in tempo reale (nel deck mostra solo le ultime righe)'],
  ],
  examples: [
    ['tail -n 3 caso/auth.log', 'le ultime tre righe del log'],
    ['tail -n +2 windows/security.csv', 'tutto tranne la prima riga (l\'intestazione)'],
    ['tail -n 1 siem/eventi.log', 'l\'ultimo evento registrato'],
    ['head -n 20 caso/auth.log | tail -n 5', 'le righe dalla 16 alla 20: head e tail insieme'],
  ],
  see: ['head', 'grep', 'journalctl'],
});

doc('wc', {
  cat: TXT,
  description: [
    '"word count": conta righe, parole e byte di un file o dell\'input di una pipe. Senza opzioni mostra tutti e tre i numeri.',
    'Con -l è il modo più comune per contare "quante cose": quante righe di log corrispondono, quanti utenti, quanti file trovati.',
  ],
  options: [
    ['-l', 'conta le righe'],
    ['-w', 'conta le parole'],
    ['-c', 'conta i byte'],
    ['-m', 'conta i caratteri'],
    ['-L', 'lunghezza della riga più lunga'],
  ],
  examples: [
    ['wc -l caso/auth.log', 'quante righe ha il log'],
    ['wc -w missioni/lista_spesa.txt', 'quante parole'],
    ['grep -c Failed caso/auth.log', 'contare le corrispondenze si fa meglio con grep -c...'],
    ['grep Failed caso/auth.log | wc -l', '...o con wc -l dopo una pipe (identico risultato)'],
    ['wc -l caso/auth.log web/access.log', 'più file: ognuno più il totale'],
  ],
  see: ['grep', 'sort', 'uniq'],
});

doc('sort', {
  cat: TXT,
  description: [
    'Ordina le righe. Senza opzioni usa l\'ordine alfabetico, per cui "10" viene prima di "9". Per ordinare numeri serve -n.',
    'Insieme a uniq è la base dell\'analisi statistica dei log: "sort | uniq -c | sort -n -r" produce una classifica di qualsiasi cosa.',
  ],
  options: [
    ['-n', 'ordine numerico (9 prima di 10)'],
    ['-r', '"reverse": ordine inverso (dal più grande)'],
    ['-u', '"unique": elimina i duplicati'],
    ['-f', 'ignora maiuscole e minuscole'],
    ['-k N', 'ordina per la colonna N (i campi sono separati da spazi)'],
    ['-t SEP', 'carattere separatore dei campi per -k'],
    ['-c', 'controlla se è già ordinato (senza stampare)'],
  ],
  examples: [
    ['sort missioni/lista_spesa.txt', 'ordine alfabetico'],
    ['cut -d "," -f 2 windows/security.csv | sort -n | uniq', 'valori numerici in ordine, senza ripetizioni'],
    ['sort -t ":" -k 3 -n /etc/passwd', 'gli utenti ordinati per UID: la colonna 3, separata da due punti'],
    ['cut -d " " -f 11 caso/auth.log | sort -u', 'l\'elenco degli IP senza ripetizioni'],
    ['grep Failed caso/auth.log | cut -d " " -f 11 | sort | uniq -c | sort -n -r | head -n 3', 'la classifica classica: chi ha più tentativi'],
  ],
  notes: ['uniq vede solo righe uguali CONSECUTIVE: ricordati sempre di mettere sort prima di uniq.'],
  see: ['uniq', 'cut', 'awk'],
});

doc('uniq', {
  cat: TXT,
  description: ['Unisce le righe uguali che si trovano una dopo l\'altra. Per questo si usa quasi sempre dopo sort. Con -c scrive davanti a ogni riga quante volte compariva: il cuore di ogni statistica sui log.'],
  options: [
    ['-c', 'conta le ripetizioni e le scrive davanti'],
    ['-d', 'mostra solo le righe che compaiono più di una volta'],
    ['-u', 'mostra solo le righe che compaiono una volta sola'],
    ['-i', 'ignora maiuscole e minuscole'],
  ],
  examples: [
    ['cut -d "," -f 2 windows/security.csv | sort | uniq -c', 'quante volte compare ogni Event ID'],
    ['cut -d " " -f 1 web/access.log | sort | uniq -d', 'gli IP che hanno fatto più di una richiesta'],
    ['cut -d "," -f 2 windows/security.csv | sort | uniq -u', 'gli Event ID comparsi una sola volta: gli eventi rari, spesso i più interessanti'],
  ],
  see: ['sort', 'cut', 'wc'],
});

doc('cut', {
  cat: TXT,
  description: [
    'Estrae colonne da un testo. Divide ogni riga in campi usando un carattere separatore (-d) e tiene solo quelli richiesti (-f). I campi si contano da 1.',
    'Va bene quando il separatore è sempre uno solo e preciso (virgola, due punti). Quando le colonne sono separate da un numero variabile di spazi, awk è più adatto.',
  ],
  options: [
    ['-d SEP', 'il carattere che separa i campi (un solo carattere)'],
    ['-f LISTA', 'i campi da tenere: 3, 1,4, 2-5, 3- (dal terzo in poi), -2 (fino al secondo)'],
    ['-c LISTA', 'seleziona caratteri per posizione invece dei campi'],
    ['-s', 'salta le righe senza separatore'],
  ],
  examples: [
    ['cut -d ":" -f 1 /etc/passwd', 'solo i nomi utente'],
    ['cut -d ":" -f 1,3,7 /etc/passwd', 'nome, UID e shell: tre colonne'],
    ['cut -d "," -f 1,4 windows/security.csv | head -n 3', 'ora e utente da un CSV'],
    ['cut -c 1-15 caso/auth.log | head -n 3', 'i primi quindici caratteri di ogni riga (la data e l\'ora)'],
    ['cut -d " " -f 4- caso/auth.log | head -n 2', 'dal quarto campo fino alla fine'],
  ],
  see: ['awk', 'sort', 'tr'],
});

doc('tr', {
  cat: TXT,
  short: 'sostituisce o cancella caratteri',
  synopsis: 'tr [-d] [-s] INSIEME1 [INSIEME2]  (legge da una pipe)',
  description: [
    '"translate": sostituisce, cancella o comprime singoli caratteri. Non legge file: riceve il testo da una pipe. Gli insiemi possono essere intervalli (a-z) o classi ([:upper:], [:digit:], [:space:]).',
  ],
  options: [
    ['SET1 SET2', 'sostituisce ogni carattere di SET1 con il corrispondente di SET2'],
    ['-d', '"delete": cancella i caratteri di SET1'],
    ['-s', '"squeeze": comprime le ripetizioni consecutive in una sola'],
  ],
  examples: [
    ['echo "Night City" | tr a-z A-Z', 'tutto maiuscolo'],
    ['echo "ip: 10.0.0.1" | tr -d "0-9."', 'cancella cifre e punti'],
    ['echo "a    b     c" | tr -s " "', 'comprime gli spazi multipli'],
    ['echo "uno,due,tre" | tr "," "\\n"', 'trasforma le virgole in a capo: una voce per riga'],
    ['echo "Uryyb" | tr "A-Za-z" "N-ZA-Mn-za-m"', 'cifrario ROT13: lo stesso comando cifra e decifra'],
  ],
  see: ['sed', 'cut', 'base64'],
});

doc('tee', {
  cat: TXT,
  short: 'scrive l\'output sia sullo schermo sia in un file',
  synopsis: 'comando | tee [-a] FILE',
  description: ['Come un raccordo a T: lascia passare l\'output (lo vedi e continua nella pipe) e ne salva una copia in un file. Perfetto per conservare i risultati di un\'analisi mentre li guardi.'],
  options: [['-a', '"append": aggiunge in fondo al file invece di sovrascrivere']],
  examples: [
    ['grep Failed caso/auth.log | tee falliti.txt | wc -l', 'salva i tentativi in un file e ne conta il numero'],
    ['echo "nota" | tee -a laboratorio/bozza.txt', 'aggiunge una riga a un file esistente e la mostra'],
  ],
  see: ['echo', 'cat'],
});

doc('xargs', {
  cat: TXT,
  short: 'trasforma l\'output di un comando in argomenti di un altro',
  synopsis: 'comando1 | xargs [-n N] [-I {}] comando2',
  description: [
    'Prende ciò che riceve da una pipe e lo passa come ARGOMENTI a un altro comando. È il ponte tra "trovo delle cose" e "faccio qualcosa con ciascuna": find ... | xargs ...',
    'Con -I {} puoi decidere dove inserire ogni elemento nel comando.',
  ],
  options: [
    ['-n N', 'passa al massimo N argomenti per esecuzione'],
    ['-I {}', 'esegue il comando una volta per elemento, sostituendo {} con l\'elemento'],
  ],
  examples: [
    ['find missioni -name "*.txt" | xargs wc -l', 'conta le righe di ogni file trovato'],
    ['echo "uno due tre" | xargs -n 1 echo', 'un elemento per esecuzione: tre righe'],
    ['find siem/allegati -type f | xargs sha256sum', 'l\'impronta di tutti i file in una cartella'],
    ['echo "caso web" | xargs -I {} ls {}', 'esegue ls su ciascun elemento'],
  ],
  see: ['find', 'for', 'tee'],
});

doc('diff', {
  cat: TXT,
  short: 'confronta due file riga per riga',
  synopsis: 'diff [-u] FILE1 FILE2',
  description: [
    'Mostra le differenze tra due file. Nel formato normale: "<" = riga solo nel primo file, ">" = riga solo nel secondo; le sigle (3c3, 5d4, 7a8) indicano le righe cambiate (c), cancellate (d) o aggiunte (a).',
    'Si usa per scoprire cosa è stato modificato in un file di configurazione, per confrontare un file con il suo backup, per vedere cosa ha cambiato un attaccante.',
  ],
  options: [
    ['-u', 'formato "unificato" (quello dei repository Git): - tolto, + aggiunto'],
    ['-q', 'dice solo se i file sono diversi'],
  ],
  examples: [
    ['cp README.txt prova.txt && echo "riga nuova" >> prova.txt && diff README.txt prova.txt', 'cosa è stato aggiunto'],
    ['diff -u audit/scantinato/turni.txt missioni/lista_spesa.txt', 'due file completamente diversi, in formato unificato'],
    ['diff -q README.txt README.txt', 'nessun output: i file sono identici'],
  ],
  notes: ['Per sapere SE due file sono identici basta confrontare gli hash (sha256sum); diff serve a capire COSA è cambiato.'],
  see: ['sha256sum', 'cp', 'cat'],
});

doc('awk', {
  cat: TXT,
  short: 'elabora testo a colonne con un mini linguaggio',
  synopsis: "awk [-F SEP] 'CONDIZIONE { AZIONE }' [FILE...]",
  description: [
    'Legge il testo riga per riga, divide ogni riga in campi ($1, $2... e $0 è la riga intera) ed esegue le azioni che descrivi. A differenza di cut, tratta più spazi come un solo separatore e sa fare conti, confronti e statistiche.',
    'Un programma è fatto di regole "condizione { azione }". Se manca la condizione l\'azione vale per tutte le righe; se manca l\'azione la riga viene stampata. BEGIN { } si esegue prima di leggere, END { } alla fine.',
    'Variabili utili: NR numero della riga, NF numero di campi, $NF ultimo campo. Le variabili si creano scrivendole; i vettori ("array") si indicano con le quadre: conta[$1]++.',
    'Il programma va SEMPRE tra apici singoli, così la shell non interpreta il $.',
  ],
  options: [
    ['-F SEP', 'separatore dei campi (es. -F: per i due punti, -F, per le virgole)'],
    ['-v var=val', 'assegna un valore a una variabile prima di partire'],
  ],
  examples: [
    [`awk '{print $1}' caso/processi.txt`, 'la prima colonna di ogni riga'],
    [`awk -F: '{print $1, $3}' /etc/passwd`, 'nome utente e UID, separatore due punti'],
    [`awk '/Failed/ {n++} END {print n}' caso/auth.log`, 'conta le righe con Failed (il risultato di una "statistica")'],
    [`awk '$9 == 404 {print $1}' web/access.log`, 'gli IP delle richieste con codice 404 (condizione sul campo 9)'],
    [`awk '{c[$1]++} END {for (k in c) print k, c[k]}' web/access.log`, 'quante richieste per IP: un vettore che conta'],
    [`awk -F, '$2 == 4625 {print $4}' windows/security.csv | sort | uniq -c`, 'chi ha accessi falliti, da un CSV'],
    [`awk 'NR >= 2 && NR <= 4 {print NR ": " $0}' caso/auth.log`, 'righe da 2 a 4, numerate'],
    [`awk '{s += $2} END {print "totale:", s}' windows/ad_gruppi.txt`, 'una somma di colonna'],
  ],
  notes: [
    'In quasi tutti i casi in cui scrivi "cut | sort | uniq -c" puoi fare lo stesso con un solo awk: impara questa abitudine con calma, partendo da {print $N}.',
    'Questo awk è un sottoinsieme: supporta print/printf, if/else, for, while, array, e le funzioni length, substr, tolower, toupper, index, split, int, sqrt.',
  ],
  see: ['cut', 'sed', 'grep', 'sort'],
});

doc('sed', {
  cat: TXT,
  short: 'modifica il testo scorrendolo (editor a flusso)',
  synopsis: "sed [-n] [-i] 'COMANDO' [FILE...]",
  description: [
    'Legge il testo riga per riga e applica comandi di modifica. Il più usato è la sostituzione s/vecchio/nuovo/. Non modifica il file originale: stampa il risultato (a meno di -i).',
    'Un comando può avere un indirizzo che dice a quali righe si applica: un numero (3), un intervallo (2,5), l\'ultima riga ($), o un\'espressione (/errore/).',
    'In questo deck le espressioni regolari seguono la sintassi estesa (come grep -E).',
  ],
  options: [
    ['-n', 'non stampa automaticamente: si vede solo ciò che chiedi con p'],
    ['-i', '"in place": modifica DAVVERO il file (fai prima una copia!)'],
    ['-e SCRIPT', 'aggiunge un comando; si può ripetere'],
    ['s/A/B/', 'sostituisce la prima A di ogni riga con B'],
    ['s/A/B/g', 'sostituisce TUTTE le A di ogni riga (g = global)'],
    ['s/A/B/N', 'sostituisce solo la N-esima occorrenza'],
    ['s/A/B/i', 'ignora maiuscole e minuscole'],
    ['Np / N,Mp', 'stampa la riga N / le righe da N a M (di solito con -n)'],
    ['d', 'cancella le righe selezionate dall\'output'],
    ['y/abc/xyz/', 'sostituisce un carattere con un altro, uno a uno'],
    ['&  e  \\1', 'nel testo nuovo: &, tutto ciò che corrisponde; \\1, il primo gruppo tra parentesi'],
  ],
  examples: [
    [`sed 's/Failed/FALLITO/' caso/auth.log | head -n 3`, 'sostituisce la prima occorrenza in ogni riga'],
    [`sed -n '5,7p' caso/auth.log`, 'solo le righe da 5 a 7'],
    [`sed '/Accepted/d' caso/auth.log | head -n 3`, 'toglie le righe che contengono Accepted'],
    [`sed '1d' windows/security.csv | head -n 2`, 'toglie la prima riga (l\'intestazione)'],
    [`echo "ip: 10.0.0.5" | sed 's/[0-9]*\\.[0-9]*\\.[0-9]*\\.[0-9]*/IP-OSCURATO/'`, 'oscura un indirizzo: utile prima di condividere un log'],
    [`echo "Rossi Mario" | sed -E 's/(.*) (.*)/\\2 \\1/'`, 'scambia due parole usando i gruppi \\1 e \\2'],
    [`sed -n '/Accepted/p' caso/auth.log | wc -l`, 'tiene solo le righe con Accepted e le conta'],
  ],
  notes: [
    'Per anonimizzare i log prima di condividerli (GDPR!) sed s/…/…/g è lo strumento perfetto.',
    'Con -i modifichi il file senza possibilità di annullare: fai una copia prima (cp file file.bak).',
  ],
  see: ['awk', 'grep', 'tr', 'cut'],
});

doc('find', {
  cat: TXT,
  short: 'cerca file e cartelle',
  synopsis: 'find [PERCORSO...] [CONDIZIONI] [AZIONE]',
  description: [
    'Percorre una cartella e tutte le sue sottocartelle e mostra ciò che soddisfa le condizioni che indichi. Le condizioni si possono combinare (tutte devono essere vere).',
    'A differenza di ls, find non salta mai i file nascosti. Su un sistema vero è la base di un audit: file senza proprietario, file modificabili da tutti, file SUID, file grandi, file recenti.',
    'Aggiungi 2>/dev/null per nascondere i "Permission denied" delle cartelle che non puoi leggere.',
  ],
  options: [
    ['-name "MOD"', 'per nome, con * e ? (metti il modello tra virgolette)'],
    ['-iname "MOD"', 'come -name ma ignorando le maiuscole'],
    ['-type f|d', 'solo file (f) o solo cartelle (d)'],
    ['-user U / -group G', 'di proprietà dell\'utente U / del gruppo G'],
    ['-perm MODO', 'per permessi: 644 (esatti), -644 (almeno questi), -4000 (SUID)'],
    ['-size N', 'per dimensione: +1k (più di 1 KB), -10k (meno di 10 KB), 500c (byte)'],
    ['-empty', 'file o cartelle vuoti'],
    ['-maxdepth N / -mindepth N', 'limita la profondità della ricerca'],
    ['-not / !', 'nega la condizione successiva'],
    ['-exec CMD {} \\;', 'esegue un comando su ogni risultato ({} è il nome trovato)'],
    ['-delete', 'cancella i risultati (prima prova senza!)'],
  ],
  examples: [
    ['find . -name "*.txt" -type f | head -n 5', 'tutti i file di testo sotto la cartella attuale'],
    ['find / -name "*.conf" 2>/dev/null | head -n 5', 'file di configurazione in tutto il sistema, senza errori'],
    ['find . -maxdepth 1 -type d', 'solo le cartelle del primo livello'],
    ['find . -type f -size +2k', 'file più grandi di 2 KB'],
    ['find . -type f -not -name "*.txt" | head -n 5', 'file che NON sono .txt'],
    ['find /bin /usr/bin -perm -4000 2>/dev/null', 'programmi SUID: un controllo classico di sicurezza'],
    ['find . -name "*.log" -exec wc -l {} \\;', 'conta le righe di ogni .log trovato'],
    ['find . -type f -name ".*"', 'tutti i file nascosti'],
    ['find audit -perm 666', 'file leggibili e scrivibili da tutti: un classico errore di configurazione'],
  ],
  notes: [
    'Combinare find con xargs o -exec permette di agire su centinaia di file con un solo comando.',
    '-delete e rm -rf sono irreversibili: lancia SEMPRE prima la ricerca senza l\'azione, controlla l\'elenco, poi aggiungi -delete.',
  ],
  see: ['ls', 'grep', 'xargs', 'tree'],
});

doc('base64', {
  cat: TXT,
  description: [
    'Codifica o decodifica in Base64: un modo di scrivere qualsiasi dato usando solo lettere, numeri, + e /. Si riconosce da lettere e numeri mescolati, a volte con uno o due "=" finali.',
    'NON è cifratura: non c\'è chiave né segreto, chiunque può decodificarlo. Si usa per trasportare dati binari in testo (email, token web, configurazioni) e gli attaccanti lo usano per nascondere comandi (PowerShell -enc).',
  ],
  options: [['-d', 'decodifica (senza questa opzione codifica)']],
  examples: [
    ['echo "Night City" | base64', 'codifica un testo'],
    ['echo Tmlnb25lIGNpdHkK | base64 -d', 'decodifica una stringa'],
    ['base64 -d cripto/messaggio.txt | head -n 1', 'decodifica un file e mostra la prima riga'],
  ],
  notes: ['Una password "protetta" con Base64 non è protetta: è solo travestita. Le password vanno salvate come hash lenti (bcrypt, Argon2).'],
  see: ['tr', 'sha256sum', 'file'],
});

doc('sha256sum', {
  cat: TXT,
  description: [
    'Calcola l\'impronta SHA-256 di un file (o di un testo da una pipe): 64 caratteri esadecimali. Stesso contenuto, stessa impronta; cambia un solo carattere e l\'impronta è completamente diversa.',
    'Si usa per verificare l\'integrità (il file non è stato modificato né corrotto), per riconoscere un malware conosciuto (gli IOC sono spesso hash), e per documentare le prove digitali.',
  ],
  options: [['-c LISTA', 'verifica i file elencati in una lista di impronte (formato "hash  nome")']],
  examples: [
    ['sha256sum README.txt', 'l\'impronta di un file'],
    ['echo "ciao" | sha256sum', 'l\'impronta di un testo che arriva da una pipe'],
    ['sha256sum siem/allegati/* | sort', 'le impronte di tutti i file di una cartella'],
    ['sha256sum cripto/firmware/* > /tmp/impronte.txt && sha256sum -c /tmp/impronte.txt', 'crea la lista e la verifica subito: tutto OK'],
  ],
  notes: [
    'MD5 e SHA-1 sono considerati rotti (esistono collisioni): per la sicurezza usa SHA-256 o superiori.',
    'L\'impronta di un file va sempre confrontata con un valore preso da una fonte AFFIDABILE: se la lista delle impronte arriva dallo stesso posto del file, un attaccante può cambiare entrambi.',
  ],
  see: ['diff', 'file', 'base64'],
});

doc('seq', {
  cat: TXT,
  description: ['Stampa una sequenza di numeri, uno per riga. Utile nei cicli for e per generare dati di prova.'],
  examples: [
    ['seq 5', 'da 1 a 5'],
    ['seq 10 15', 'da 10 a 15'],
    ['for i in $(seq 1 3); do echo "prova $i"; done', 'dentro un ciclo for'],
  ],
  see: ['for', 'awk'],
});

// ---------------------------------------------------------------- permessi e utenti

doc('id', {
  cat: PERM,
  description: [
    'Mostra la tua identità completa: UID (numero utente), GID (gruppo principale) e tutti i gruppi a cui appartieni.',
    'Linux ragiona con i numeri: l\'UID 0 è SEMPRE root, qualunque nome abbia. Un utente con uid=0 che non si chiama root è un classico segno di compromissione.',
  ],
  examples: [
    ['id', 'la tua identità'],
    ['grep root: /etc/passwd | cut -d ":" -f 3', 'l\'UID di root, letto dal file degli utenti'],
  ],
  see: ['whoami', 'groups', 'sudo'],
});

doc('groups', {
  cat: PERM,
  description: ['Elenca i gruppi dell\'utente. I gruppi servono a dare gli stessi permessi a più persone: "sudo" permette di diventare amministratore, "adm" di leggere i log di sistema.'],
  examples: [['groups', 'i tuoi gruppi'], ['cat /etc/group | cut -d ":" -f 1', 'tutti i gruppi del sistema']],
  see: ['id', 'chmod'],
});

doc('chmod', {
  cat: PERM,
  short: 'cambia i permessi di un file',
  synopsis: 'chmod MODO FILE...',
  description: [
    '"change mode": modifica chi può leggere (r), scrivere (w) ed eseguire (x) un file o una cartella. Solo il proprietario (o root) può farlo.',
    'I permessi sono tre gruppi di tre: proprietario, gruppo, altri. Si possono esprimere in forma NUMERICA (r=4, w=2, x=1, sommati per ogni gruppo) o SIMBOLICA.',
    'Per le cartelle: r permette di elencarne il contenuto, w di creare e cancellare file al suo interno, x di entrarci con cd.',
  ],
  options: [
    ['755', 'rwxr-xr-x: tutti eseguono, solo il proprietario modifica (programmi, cartelle)'],
    ['644', 'rw-r--r--: il proprietario scrive, tutti leggono (documenti)'],
    ['600', 'rw-------: solo il proprietario (chiavi, password, configurazioni segrete)'],
    ['700', 'rwx------: solo il proprietario, anche in esecuzione'],
    ['640', 'rw-r-----: proprietario scrive, gruppo legge (tipico dei log)'],
    ['u+x', 'simbolico: aggiunge (+) l\'esecuzione (x) al proprietario (u)'],
    ['go-w', 'toglie (-) la scrittura a gruppo (g) e altri (o)'],
    ['a=r', 'imposta (=) esattamente solo lettura per tutti (a)'],
    ['u+x,g-w', 'più modifiche separate da virgola'],
  ],
  examples: [
    ['chmod 600 audit/scantinato/turni.txt', 'solo il proprietario legge e scrive'],
    ['chmod +x laboratorio/bozza.txt', 'rende eseguibile (utile per gli script)'],
    ['chmod go-rwx audit/scantinato/menu.txt', 'toglie ogni permesso a gruppo e altri'],
    ['chmod u+x,go-w audit/scantinato/backup.sh', 'due modifiche insieme'],
    ['chmod 644 README.txt && ls -l README.txt', 'applica e verifica'],
  ],
  notes: [
    '777 (rwxrwxrwx) = tutti possono fare tutto: quasi sempre un errore, e un classico problema di sicurezza.',
    'Uno script eseguito da root ma modificabile da tutti permette a chiunque di far eseguire comandi come amministratore.',
    'Il permesso "s" al posto della "x" (SUID) fa eseguire il programma con i permessi del proprietario: va controllato con find -perm -4000.',
  ],
  see: ['ls', 'chown', 'find', 'id'],
});

doc('chown', {
  cat: PERM,
  short: 'cambia il proprietario di un file',
  synopsis: 'chown UTENTE[:GRUPPO] FILE...',
  description: [
    '"change owner": cambia il proprietario (e, dopo i due punti, il gruppo) di un file. Solo root può farlo: se un utente normale potesse regalare i propri file ad altri, aggirerebbe le quote e i controlli.',
    'È fondamentale nell\'hardening: i file di un servizio devono appartenere all\'utente del servizio, non a root e non a un utente qualsiasi.',
  ],
  examples: [
    ['chown root README.txt', 'da utente normale: "Operation not permitted" (è il comportamento giusto!)'],
  ],
  notes: ['Dopo un\'installazione "fatta in fretta" controlla sempre con ls -l: un file di configurazione con password che appartiene a un utente sbagliato è una vulnerabilità.'],
  see: ['chmod', 'ls', 'id'],
});

doc('sudo', {
  cat: PERM,
  description: [
    '"superuser do": esegue un comando con i privilegi di root. Funziona solo se il tuo utente è autorizzato nel file /etc/sudoers, e di solito chiede la tua password. Ogni uso viene registrato nei log (auth.log): lascia una traccia, a differenza di un accesso diretto come root.',
    'In questo deck sudo è consentito solo per ufw, e "sudo -l" mostra le regole del tuo utente: la prima cosa da controllare in un audit dei privilegi.',
  ],
  options: [
    ['-l', 'elenca i comandi che il tuo utente può eseguire con sudo'],
    ['!!', '"sudo !!" ripete l\'ultimo comando come amministratore'],
  ],
  examples: [
    ['sudo -l', 'cosa posso fare come amministratore?'],
    ['sudo ufw status', 'mostra lo stato del firewall'],
  ],
  notes: [
    'NOPASSWD in /etc/sudoers significa niente password: se l\'account viene violato, l\'attaccante è subito root.',
    'Concedere via sudo programmi "potenti" (editor, find, less, interpreti) equivale a dare root: GTFOBins ne elenca decine.',
    'Principio del minimo privilegio: sudo per UN comando preciso, non per "tutto".',
  ],
  see: ['id', 'chmod', 'ufw', 'find'],
});

doc('ufw', {
  cat: PERM,
  description: [
    '"Uncomplicated FireWall": un modo semplice di gestire il firewall di Linux. Un firewall decide quale traffico può entrare e uscire: bloccare l\'indirizzo di un attaccante è una tipica azione di contenimento.',
    'Richiede privilegi di amministratore (sudo).',
  ],
  options: [
    ['status', 'mostra le regole attive'],
    ['deny from IP', 'blocca tutto il traffico da quell\'indirizzo'],
    ['allow from IP', 'consente il traffico da quell\'indirizzo'],
  ],
  examples: [['sudo ufw status', 'stato del firewall'], ['sudo ufw deny from 203.0.113.99', 'blocca un indirizzo']],
  notes: ['Bloccare un IP è un contenimento temporaneo: l\'attaccante può cambiare indirizzo in un attimo. Il vero rimedio è chiudere la falla.'],
  see: ['sudo', 'ss', 'nmap'],
});
