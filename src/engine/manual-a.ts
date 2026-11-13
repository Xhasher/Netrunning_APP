// Manuale, parte A: orientarsi nel sistema, gestire file e cartelle, leggere file.

import { doc } from './manpages';

const NAV = 'Navigazione e file';

doc('whoami', {
  cat: NAV,
  short: 'mostra con quale utente sei collegato',
  description: [
    'Stampa il nome dell\'utente con cui stai usando il sistema (in realtà l\'utente "effettivo" del processo).',
    'In un\'indagine o in un test autorizzato è il primo comando da lanciare quando ottieni un accesso: l\'utente determina tutto ciò che potrai leggere e fare. Su un server, "www-data" o "nobody" indicano un servizio con pochi poteri; "root" indica il controllo totale.',
  ],
  examples: [
    ['whoami', 'stampa il tuo nome utente'],
    ['echo "Sono $(whoami)"', 'lo usa dentro un testo, con la sostituzione di comando'],
    ['id', 'versione completa: numero utente (UID), gruppi e altro'],
  ],
  notes: ['Non confonderlo con "who", che elenca TUTTI gli utenti collegati, e con "id", che mostra anche UID e gruppi.'],
  see: ['id', 'who', 'groups'],
});

doc('hostname', {
  cat: NAV,
  description: [
    'Stampa il nome del computer (host). Ogni macchina in rete ha un nome, e nel prompt compare dopo la @.',
    'Quando lavori su più server (ssh) conviene controllare sempre il nome prima di eseguire comandi delicati: lanciare "rm" sul server sbagliato è uno degli errori più costosi.',
  ],
  examples: [
    ['hostname', 'il nome di questo computer'],
    ['cat /etc/hostname', 'lo stesso nome, letto dal file di configurazione'],
  ],
  see: ['uname', 'whoami'],
});

doc('pwd', {
  cat: NAV,
  description: [
    '"print working directory": stampa il percorso assoluto della cartella in cui ti trovi. Il percorso parte sempre dalla radice "/" e le cartelle sono separate da "/".',
    'Il prompt mostra una versione abbreviata (~ al posto della tua home): pwd ti dà quella completa, utile da copiare in uno script o in un report.',
  ],
  examples: [
    ['pwd', 'dove sono adesso?'],
    ['cd /var/log && pwd', 'cambia cartella e verifica, in un solo comando'],
    ['echo "Lavoro in: $PWD"', 'la variabile PWD contiene la stessa informazione'],
  ],
  see: ['cd', 'ls'],
});

doc('ls', {
  cat: NAV,
  short: 'elenca file e cartelle',
  synopsis: 'ls [OPZIONI] [PERCORSO...]',
  description: [
    '"list": mostra il contenuto di una o più cartelle. Senza argomenti elenca la cartella in cui ti trovi. Le cartelle sono mostrate in blu con una "/" finale.',
    'Le opzioni si possono unire dopo un solo trattino: "ls -lah" equivale a "ls -l -a -h". È il comando che userai più di ogni altro: la prima cosa da fare in una cartella nuova è sempre "ls -la".',
    'Nel formato lungo (-l) ogni riga contiene: tipo (- file, d cartella), permessi, numero di collegamenti, proprietario, gruppo, dimensione in byte, data di modifica e nome.',
  ],
  options: [
    ['-a', '"all": mostra anche i file nascosti (il cui nome inizia con un punto), compresi "." e ".."'],
    ['-l', '"long": formato lungo con permessi, proprietario, gruppo, dimensione e data'],
    ['-h', '"human": con -l mostra le dimensioni leggibili (1.2K, 3.4M) invece dei byte'],
    ['-R', '"recursive": elenca anche tutte le sottocartelle, una dopo l\'altra'],
    ['-r', '"reverse": inverte l\'ordine dell\'elenco'],
    ['-S', 'ordina per dimensione, dal più grande al più piccolo'],
    ['-t', 'ordina per data di modifica, dal più recente'],
    ['-d', 'mostra la cartella stessa e non il suo contenuto (utile con -l per vederne i permessi)'],
    ['-1', 'una voce per riga'],
  ],
  examples: [
    ['ls -la contratti/rook', 'tutto il contenuto di una cartella, nascosti e permessi compresi'],
    ['ls -lhS /bin', 'file di /bin in formato lungo, dimensioni leggibili, dal più grande'],
    ['ls -R contratti', 'l\'intero albero sotto contratti, sottocartelle incluse'],
    ['ls -ld /tmp', 'i permessi della cartella /tmp stessa (e non di ciò che contiene)'],
    ['ls -a missioni | wc -l', 'quante voci ha una cartella, nascoste incluse'],
    ['ls /etc /var/log', 'più cartelle insieme: ognuna con la sua intestazione'],
  ],
  notes: [
    'Un nome che inizia con il punto NON è protetto, è solo nascosto: ls -a lo mostra a chiunque. In un\'indagine, "ls -la" va lanciato in ogni cartella interessante.',
    'Permission denied su una cartella significa che non hai il permesso "x" (o "r") su di essa: ls -ld ti mostra perché.',
    'Nel vero Linux "ls -l" mostra anche "total": è la somma dei blocchi occupati, di solito si ignora.',
  ],
  see: ['find', 'tree', 'stat', 'chmod'],
});

doc('cd', {
  cat: NAV,
  description: [
    '"change directory": ti sposta in un\'altra cartella. È un comando interno della shell (non un programma), per questo non ha una pagina di manuale propria nel vero Linux.',
    'I percorsi possono essere assoluti (iniziano con /) oppure relativi alla cartella in cui ti trovi. Senza argomenti o con ~ torni nella tua home; con - torni alla cartella in cui eri prima.',
    'Se il nome contiene spazi serve usare le virgolette: cd "Documenti importanti".',
  ],
  options: [
    ['..', 'la cartella genitore (un livello sopra); si possono concatenare: cd ../..'],
    ['.', 'la cartella attuale (utile nei percorsi relativi: ./script.sh)'],
    ['~', 'la tua cartella home (scorciatoia per /home/utente)'],
    ['-', 'torna alla cartella precedente (e la stampa)'],
    ['/', 'la radice del filesystem'],
  ],
  examples: [
    ['cd /var/log', 'percorso assoluto: funziona da qualsiasi posto'],
    ['cd /var/log && cd ../../etc && pwd', 'percorso relativo: sale di due livelli (da /var/log a /) ed entra in etc'],
    ['cd ~/siem/allegati', 'parti dalla home con la tilde'],
    ['cd /etc && cd - && pwd', 'vai in /etc, torna indietro con - e verifica'],
  ],
  notes: [
    'Premi TAB per completare i nomi: eviti errori e vedi subito se la cartella esiste.',
    '"No such file or directory" = nome sbagliato (attenzione a maiuscole/minuscole: Linux le distingue). "Not a directory" = hai indicato un file. "Permission denied" = non hai il permesso x.',
  ],
  see: ['pwd', 'ls'],
});

doc('cat', {
  cat: NAV,
  description: [
    'Da "concatenate": legge uno o più file e li stampa uno dopo l\'altro. Con un solo file è il modo più rapido per leggerlo. Senza argomenti legge l\'input che arriva da una pipe e lo ristampa.',
    'Va bene per file piccoli. Per file lunghi (log!) è meglio head, tail, grep o less: stampare un milione di righe a schermo non serve a nessuno.',
  ],
  options: [
    ['-n', 'numera tutte le righe (comodo per citare "riga 42" in un report)'],
    ['-b', 'numera solo le righe non vuote'],
    ['-s', 'comprime più righe vuote consecutive in una sola'],
    ['-A', 'mostra i caratteri nascosti: la fine riga come $ (utile per trovare spazi finali invisibili)'],
  ],
  examples: [
    ['cat -n caso/LEGGIMI.txt', 'legge il file numerando le righe'],
    ['cat missioni/lista_spesa.txt intel/bollettino.txt', 'due file di seguito, come un file solo'],
    ['cat /etc/passwd | grep bash', 'cat alimenta una pipe: filtra solo gli utenti con shell bash'],
    ['cat -A osint/servizi.txt | head -n 3', 'vede anche i caratteri invisibili a fine riga'],
  ],
  notes: [
    '"Useless use of cat": scrivere "cat file | grep x" è comune, ma "grep x file" fa lo stesso senza il passaggio in più. Per leggere da una pipe, però, va benissimo.',
    'Per leggere dal fondo di un log, usa tail; per scorrere un file lungo, less (qui less è un alias di cat).',
  ],
  see: ['head', 'tail', 'grep', 'tee'],
});

doc('echo', {
  cat: NAV,
  description: [
    'Stampa sullo schermo il testo che gli passi. Sembra inutile, ma serve ovunque: mostrare messaggi negli script, leggere variabili ($HOME), scrivere dentro file con > e >>, alimentare altri comandi con una pipe.',
    'Le virgolette doppie permettono di espandere le variabili ("Ciao $USER"); le virgolette singole stampano il testo esattamente come è scritto (\'Ciao $USER\').',
  ],
  options: [['-n', 'non aggiunge la riga vuota finale']],
  examples: [
    ['echo "Utente: $USER, home: $HOME"', 'espande le variabili: virgolette doppie'],
    [`echo 'costo: $5'`, 'virgolette singole: il $ resta un normale carattere'],
    ['echo "uno due tre" | wc -w', 'alimenta una pipe: conta 3 parole'],
    ['echo aGVsbG8K | base64 -d', 'decodifica un testo Base64 passato da echo'],
  ],
  notes: ['Un solo ">" SOVRASCRIVE il file, ">>" aggiunge in fondo: scambiarli è uno degli errori più dolorosi (vedi la scheda su rm).'],
  see: ['cat', 'tee', 'base64'],
});

doc('clear', {
  cat: NAV,
  description: ['Pulisce lo schermo del terminale. Non cancella né i file né la cronologia dei comandi: solo la parte visibile. Nel vero bash la scorciatoia è Ctrl+L.'],
  see: ['history'],
});

doc('history', {
  cat: NAV,
  description: [
    'Elenca i comandi digitati in precedenza, numerati. Puoi richiamarli con la freccia ↑, ripeterli con !! (l\'ultimo) o !N (il numero N), oppure cercarli con history | grep parola.',
    'La cronologia è un\'ottima fonte per gli investigatori: dice cosa ha fatto un utente (o un intruso) sul sistema. Nel vero Linux viene salvata in ~/.bash_history alla chiusura della sessione.',
  ],
  examples: [
    ['history | tail -n 5', 'gli ultimi cinque comandi'],
    ['history | grep ssh', 'ritrova un comando vecchio cercando una parola'],
    ['!!', 'ripete l\'ultimo comando (con sudo !! lo ripeti come amministratore)'],
  ],
  notes: [
    'Mai scrivere password nei comandi: finiscono nella cronologia, leggibile dal tuo account (e da root).',
    'Un attaccante esperto cancella la cronologia ("history -c") o la disattiva: se è vuota o troncata, è un indizio.',
  ],
  see: ['alias', 'cat'],
});

doc('mkdir', {
  cat: NAV,
  description: [
    '"make directory": crea una o più cartelle nuove. Se la cartella esiste già, dà errore (a meno di -p).',
    'Con più nomi crea più cartelle in un colpo solo: mkdir a b c.',
  ],
  options: [['-p', '"parents": crea anche tutte le cartelle intermedie mancanti, e non dà errore se esistono già']],
  examples: [
    ['mkdir -p prove/rete/scansioni', 'crea tutta la catena in un colpo solo'],
    ['mkdir prove2 prove3', 'più cartelle insieme'],
  ],
  notes: ['"No such file or directory" nella creazione di una sottocartella: manca il livello intermedio, usa -p.'],
  see: ['touch', 'rmdir', 'rm'],
});

doc('touch', {
  cat: NAV,
  description: [
    'Crea un file vuoto. Se il file esiste già, non ne cambia il contenuto: aggiorna solo la data di modifica.',
    'Serve a creare in fretta file da riempire, o a "segnare" qualcosa. Anche gli attaccanti lo usano per falsificare le date dei file (timestomping): per questo il contenuto e gli hash contano più delle date.',
  ],
  examples: [
    ['touch appunti.txt log_vuoto.txt', 'due file vuoti in un colpo solo'],
    ['touch laboratorio/bozza.txt && ls -l laboratorio', 'aggiorna la data di un file esistente e controlla'],
  ],
  see: ['mkdir', 'stat', 'echo'],
});

doc('rm', {
  cat: NAV,
  description: [
    '"remove": cancella file. ATTENZIONE: su Linux non esiste il cestino. Un file cancellato con rm è perso, senza conferma.',
    'Per le cartelle serve -r ("ricorsivo": la cartella e tutto il suo contenuto). La combinazione "rm -rf" non chiede nulla e non si lamenta di niente: va usata con estrema attenzione.',
    'Regola d\'oro: prima di un rm con caratteri jolly, lancia lo stesso comando con ls al posto di rm e controlla cosa verrebbe colpito.',
  ],
  options: [
    ['-r', '"recursive": cancella cartelle con tutto il contenuto'],
    ['-f', '"force": nessun errore se il file non esiste, nessuna domanda'],
  ],
  examples: [
    ['rm laboratorio/vecchio_log.txt', 'cancella un file (non reversibile)'],
    ['ls laboratorio/*.txt', 'PRIMA vedi cosa colpirebbe il modello...'],
    ['mkdir prove && rm -r prove', 'crea e cancella una cartella con tutto il contenuto'],
    ['rm -f file_inesistente.txt', 'con -f non dà errore se il file non c\'è'],
  ],
  notes: [
    'Mai copiare "rm -rf" da Internet senza capirlo: c\'è chi ha cancellato server interi per un percorso sbagliato (rm -rf / home/utente: lo spazio fa tutta la differenza).',
    'In un incidente, NON cancellare nulla prima di aver conservato le prove. Chi attacca spesso usa rm per cancellare le proprie tracce: per questo i log vanno inviati a un SIEM.',
  ],
  see: ['rmdir', 'ls', 'cp', 'mv'],
});

doc('rmdir', {
  cat: NAV,
  description: ['Cancella una cartella solo se è VUOTA: è la versione prudente di "rm -r", perché non può portarsi via nulla per sbaglio.'],
  examples: [['mkdir temp && rmdir temp', 'crea e poi cancella una cartella vuota']],
  see: ['rm', 'mkdir'],
});

doc('cp', {
  cat: NAV,
  description: [
    '"copy": copia un file. Se la destinazione è una cartella, la copia finisce lì dentro con lo stesso nome; altrimenti la destinazione è il nuovo nome del file.',
    'ATTENZIONE: se il file di destinazione esiste già, viene sovrascritto senza avvisare. La copia appartiene a chi la crea (cambiano proprietario e data).',
    'Prima di modificare un file di configurazione importante fai sempre una copia di backup: cp file file.bak.',
  ],
  options: [['-r', '"recursive": copia anche le cartelle, con tutto il contenuto']],
  examples: [
    ['cp README.txt laboratorio/', 'copia dentro una cartella, mantenendo il nome'],
    ['cp README.txt README.bak', 'copia di backup con un altro nome'],
    ['cp -r missioni backup_missioni', 'copia un\'intera cartella'],
    ['cp /etc/hosts laboratorio/hosts.copia', 'copia un file di sistema (in sola lettura per te)'],
  ],
  notes: ['Per le prove digitali la copia va fatta con attenzione: i metadati (date, proprietari) cambiano. Nei lavori forensi si lavora su copie e si verifica che l\'hash resti uguale (sha256sum).'],
  see: ['mv', 'sha256sum', 'tar'],
});

doc('mv', {
  cat: NAV,
  description: [
    '"move": sposta un file o una cartella. Su Linux rinominare è la stessa cosa che spostare nella stessa cartella: mv vecchio nuovo.',
    'Come cp, sovrascrive la destinazione senza chiedere se esiste già. Non è una copia: l\'originale sparisce.',
  ],
  examples: [
    ['mv laboratorio/bozza.txt laboratorio/definitivo.txt', 'rinomina un file'],
    ['mv laboratorio/bozza.txt missioni/', 'sposta un file in un\'altra cartella'],
    ['mkdir archivio && mv missioni/lista_spesa.txt archivio/', 'crea una cartella e ci sposta un file'],
  ],
  see: ['cp', 'rm'],
});

doc('tree', {
  cat: NAV,
  description: ['Disegna il contenuto di una cartella e delle sue sottocartelle come un albero, ignorando i file nascosti. Ottimo per avere il quadro d\'insieme di un progetto o di una cartella di prove.'],
  examples: [
    ['tree contratti', 'l\'albero della cartella contratti'],
    ['tree siem', 'a colpo d\'occhio cosa contiene la cartella siem'],
  ],
  see: ['ls', 'find'],
});

doc('stat', {
  cat: NAV,
  short: 'mostra tutti i dettagli di un file',
  synopsis: 'stat FILE...',
  description: [
    'Mostra le informazioni complete su un file: dimensione, tipo, permessi (anche in forma ottale), proprietario, gruppo e date.',
    'Nelle indagini le date sono importanti: modifica (contenuto cambiato) e cambio (metadati cambiati, per esempio permessi). Un file di sistema con una data di modifica recente e inspiegabile è un indizio.',
  ],
  examples: [
    ['stat audit/scantinato/config.bak', 'dettagli e permessi in forma ottale (0666 = rw-rw-rw-)'],
    ['stat /etc/passwd /etc/shadow', 'confronta due file di sistema'],
  ],
  notes: ['Le date si possono falsificare (timestomping): non fidarti solo di quelle, confronta il contenuto con sha256sum.'],
  see: ['ls', 'file', 'sha256sum'],
});

doc('file', {
  cat: NAV,
  short: 'indovina il tipo di un file dal contenuto',
  synopsis: 'file FILE...',
  description: [
    'Determina che tipo di file è guardando il CONTENUTO (i primi byte, detti "magic number"), non l\'estensione.',
    'È fondamentale in sicurezza: un file chiamato "fattura.pdf" potrebbe essere in realtà un eseguibile o uno script. L\'estensione si cambia in un secondo, il contenuto no.',
  ],
  examples: [
    ['file osint/catalogo_2077.pdf', 'è davvero un PDF?'],
    ['file cripto/messaggio.txt', 'riconosce un testo che sembra Base64'],
    ['file /bin/ls /etc/passwd', 'un eseguibile e un file di testo, a confronto'],
  ],
  see: ['xxd', 'strings', 'exiftool'],
});

doc('xxd', {
  cat: NAV,
  short: 'mostra un file in esadecimale',
  synopsis: 'xxd FILE',
  description: [
    'Mostra il contenuto di un file in esadecimale (hex dump), con l\'offset a sinistra e la versione in caratteri a destra. Serve per ispezionare file binari o per vedere esattamente quali byte contiene un file.',
    'Nelle analisi si guardano i primi byte per riconoscere il formato: "MZ" (eseguibile Windows), "\\x7fELF" (eseguibile Linux), "%PDF", "PK" (zip).',
  ],
  examples: [
    ['xxd missioni/lista_spesa.txt', 'ogni byte del file, in esadecimale'],
    ['xxd /bin/ls | head -n 2', 'i primi byte di un eseguibile: inizia con 7f45 4c46 ("ELF")'],
  ],
  see: ['file', 'strings', 'base64'],
});

doc('strings', {
  cat: NAV,
  short: 'estrae il testo leggibile da un file binario',
  description: [
    'Estrae da un file (anche binario) tutte le sequenze di caratteri stampabili lunghe almeno 4. Nell\'analisi dei malware è uno dei primi passi: URL, indirizzi IP, percorsi, comandi e password incorporati spesso sono leggibili anche dentro un programma.',
  ],
  examples: [['strings /bin/cat', 'le parole leggibili dentro un programma']],
  see: ['file', 'xxd', 'grep'],
});

doc('which', {
  cat: NAV,
  short: 'dove si trova un comando',
  description: ['Mostra il percorso del programma che verrebbe eseguito scrivendo un comando. Utile per sapere QUALE versione stai usando, o per scoprire se un programma è installato (nessun output = non trovato).'],
  examples: [
    ['which grep', 'dove si trova grep'],
    ['which nmap curl ssh', 'più comandi insieme'],
  ],
  notes: ['Un attaccante può mettere un programma falso in una cartella che viene cercata PRIMA di quella vera: which ti dice quale viene davvero eseguito.'],
  see: ['man', 'file'],
});

doc('tar', {
  cat: NAV,
  short: 'crea ed estrae archivi',
  synopsis: 'tar -czf ARCHIVIO CARTELLA · tar -tzf ARCHIVIO · tar -xzf ARCHIVIO [-C DEST]',
  description: [
    'Riunisce più file e cartelle in un unico archivio (e con "z" lo comprime). È lo strumento standard per backup, per consegnare un insieme di prove e per scambiare file tra sistemi Linux.',
    'Le opzioni si scrivono unite: c = crea (create), x = estrae (extract), t = elenca (list), z = compressione gzip, v = elenca i file mentre lavora (verbose), f = il nome dell\'archivio segue (file). "f" va quasi sempre messa per ultima nel gruppo.',
  ],
  options: [
    ['-c', 'crea un nuovo archivio'],
    ['-x', 'estrae il contenuto di un archivio'],
    ['-t', 'elenca il contenuto senza estrarlo'],
    ['-z', 'usa la compressione gzip (estensione .tar.gz o .tgz)'],
    ['-v', 'mostra i file elaborati'],
    ['-f ARCH', 'nome dell\'archivio da creare o leggere'],
    ['-C DIR', 'estrae nella cartella DIR'],
  ],
  examples: [
    ['tar -czf prove.tar.gz caso web', 'archivia due cartelle in un solo file compresso'],
    ['tar -czf prove.tar.gz caso && tar -tzf prove.tar.gz', 'crea l\'archivio e ne elenca il contenuto'],
    ['mkdir estratto && tar -czf a.tar.gz caso && tar -xzf a.tar.gz -C estratto', 'crea, poi estrae in un\'altra cartella'],
  ],
  notes: [
    'In un\'indagine l\'archivio delle prove si accompagna sempre a un hash: sha256sum prove.tar.gz, scritto nel registro delle prove (catena di custodia).',
    'Dopo aver scaricato un archivio sconosciuto, controllane il contenuto con -t prima di estrarlo: potrebbe sovrascrivere file importanti.',
  ],
  see: ['cp', 'sha256sum', 'file'],
});
