// Manuale in italiano dei comandi disponibili nel deck.
// Il vero `man` di Linux è in inglese: qui spieghiamo le stesse cose in modo semplice.

export interface ManPage {
  name: string;
  short: string; // descrizione di una riga (usata da help)
  synopsis: string;
  description: string[];
  options?: [string, string][];
  examples?: [string, string][];
  game?: boolean; // comando del gioco, non esiste nel vero Linux
}

export const MANPAGES: Record<string, ManPage> = {
  help: {
    name: 'help',
    short: 'mostra i comandi disponibili',
    synopsis: 'help',
    description: [
      'Elenca tutti i comandi che puoi usare in questo deck, con una riga di spiegazione ciascuno.',
      'Nel vero Linux "help" esiste ma mostra solo i comandi interni della shell bash: per tutto il resto si usa "man".',
    ],
  },
  man: {
    name: 'man',
    short: 'apre il manuale di un comando',
    synopsis: 'man COMANDO',
    description: [
      '"man" sta per "manual". Mostra la pagina di manuale di un comando: a cosa serve, come si scrive e quali opzioni accetta.',
      'È lo strumento più importante per imparare: un professionista non ricorda tutto a memoria, sa dove cercare.',
      'Nel vero Linux il manuale è in inglese e si chiude premendo q.',
    ],
    examples: [
      ['man ls', 'spiega il comando ls'],
      ['man man', 'spiega il manuale stesso'],
    ],
  },
  whoami: {
    name: 'whoami',
    short: 'mostra con quale utente sei collegato',
    synopsis: 'whoami',
    description: [
      'Letteralmente "who am I?", "chi sono io?". Stampa il nome dell\'utente con cui stai usando il sistema.',
      'Durante un penetration test è il primo comando che si lancia dopo essere entrati in una macchina: sapere CHI sei ti dice COSA puoi fare.',
    ],
  },
  hostname: {
    name: 'hostname',
    short: 'mostra il nome di questo computer',
    synopsis: 'hostname',
    description: ['Stampa il nome del computer (host) su cui stai lavorando. Ogni macchina in rete ha un nome.'],
  },
  pwd: {
    name: 'pwd',
    short: 'mostra in quale cartella ti trovi',
    synopsis: 'pwd',
    description: [
      '"print working directory": stampa il percorso completo della cartella in cui ti trovi adesso.',
      'Il percorso parte sempre da "/", la radice di tutto il filesystem.',
    ],
  },
  ls: {
    name: 'ls',
    short: 'elenca file e cartelle',
    synopsis: 'ls [OPZIONI] [PERCORSO]',
    description: [
      '"list": mostra il contenuto di una cartella. Senza percorso mostra la cartella in cui ti trovi.',
      'Le cartelle sono mostrate in blu con una "/" finale.',
    ],
    options: [
      ['-a', '"all": mostra anche i file nascosti (quelli il cui nome inizia con un punto)'],
      ['-l', '"long": formato lungo, con permessi, proprietario, dimensione e data'],
      ['-la', 'le due opzioni insieme: si possono unire dopo un solo trattino'],
    ],
    examples: [
      ['ls', 'contenuto della cartella attuale'],
      ['ls /etc', 'contenuto della cartella /etc'],
      ['ls -la ~', 'tutto il contenuto della tua home, in formato lungo'],
    ],
  },
  cd: {
    name: 'cd',
    short: 'cambia cartella',
    synopsis: 'cd [PERCORSO]',
    description: [
      '"change directory": ti sposta in un\'altra cartella.',
      'Senza argomenti (o con ~) ti riporta nella tua cartella home.',
    ],
    options: [
      ['..', 'la cartella "genitore", cioè quella che contiene la cartella attuale'],
      ['.', 'la cartella attuale'],
      ['~', 'la tua cartella home'],
      ['/', 'la radice del filesystem'],
    ],
    examples: [
      ['cd missioni', 'entra nella cartella "missioni" (percorso relativo)'],
      ['cd ..', 'sali di un livello'],
      ['cd /etc', 'vai in /etc (percorso assoluto)'],
      ['cd', 'torna a casa'],
    ],
  },
  cat: {
    name: 'cat',
    short: 'mostra il contenuto di un file',
    synopsis: 'cat FILE...',
    description: [
      'Da "concatenate": legge uno o più file e ne stampa il contenuto sullo schermo, uno dopo l\'altro.',
      'È il modo più rapido per leggere un file di testo.',
    ],
    examples: [
      ['cat note.txt', 'mostra il file note.txt'],
      ['cat /etc/hostname', 'mostra un file indicando il percorso completo'],
      ['cat a.txt b.txt', 'mostra due file di seguito'],
    ],
  },
  echo: {
    name: 'echo',
    short: 'ripete il testo che scrivi',
    synopsis: 'echo [TESTO]',
    description: [
      'Stampa sullo schermo il testo che gli passi. Sembra inutile, ma negli script serve a mostrare messaggi e a scrivere dentro i file.',
      'Se il testo contiene spazi o simboli speciali è meglio metterlo tra virgolette.',
    ],
    examples: [['echo "Ciao Night City"', 'stampa Ciao Night City']],
  },
  clear: {
    name: 'clear',
    short: 'pulisce lo schermo',
    synopsis: 'clear',
    description: ['Cancella tutto il testo dal terminale. Non cancella file né la cronologia.'],
  },
  history: {
    name: 'history',
    short: 'mostra i comandi che hai già scritto',
    synopsis: 'history',
    description: [
      'Elenca i comandi digitati in precedenza, numerati.',
      'Puoi anche richiamarli con la freccia ↑. Attenzione: anche un difensore può leggere la cronologia per capire cosa ha fatto un intruso!',
    ],
  },
  grep: {
    name: 'grep',
    short: 'cerca righe che contengono un testo',
    synopsis: 'grep [OPZIONI] TESTO [FILE...]',
    description: [
      'Mostra solo le righe che contengono il testo cercato. Funziona su file o sull\'output di un altro comando (con la pipe |).',
    ],
    options: [
      ['-i', 'ignora maiuscole/minuscole'],
      ['-v', 'inverti: mostra le righe che NON contengono il testo'],
      ['-n', 'mostra il numero di riga'],
      ['-c', 'stampa solo quante righe corrispondono'],
    ],
    examples: [
      ['grep errore log.txt', 'righe di log.txt che contengono "errore"'],
      ['cat log.txt | grep -i fail', 'stessa cosa usando una pipe, ignorando le maiuscole'],
    ],
  },
  head: {
    name: 'head',
    short: 'mostra le prime righe',
    synopsis: 'head [-n N] [FILE]',
    description: ['Mostra le prime 10 righe di un file (o N righe con -n N).'],
  },
  tail: {
    name: 'tail',
    short: 'mostra le ultime righe',
    synopsis: 'tail [-n N] [FILE]',
    description: ['Mostra le ultime 10 righe di un file (o N righe con -n N). Utilissimo per i log, dove le cose recenti sono in fondo.'],
  },
  wc: {
    name: 'wc',
    short: 'conta righe, parole e caratteri',
    synopsis: 'wc [-l] [FILE]',
    description: ['"word count". Con -l conta solo le righe.'],
  },
  ip: {
    name: 'ip',
    short: 'mostra la configurazione di rete',
    synopsis: 'ip a   (oppure: ip addr)',
    description: [
      'Mostra le schede di rete del computer e i loro indirizzi.',
      '"lo" è l\'interfaccia di loopback (il computer che parla con se stesso, sempre 127.0.0.1). "eth0" è la scheda di rete vera: cerca la riga "inet" per trovare il tuo indirizzo IP.',
      'Su sistemi più vecchi si usa "ifconfig", che mostra le stesse informazioni.',
    ],
    examples: [
      ['ip a', 'mostra tutte le interfacce e i loro IP'],
      ['ip route', 'la tabella di instradamento: dove mandare i pacchetti'],
      ['ip neigh', 'i vicini conosciuti: IP e indirizzo MAC (tabella ARP)'],
    ],
  },
  ifconfig: {
    name: 'ifconfig',
    short: 'vecchio comando per la configurazione di rete',
    synopsis: 'ifconfig',
    description: ['Versione storica di "ip a". Esiste ancora su molti sistemi.'],
  },
  ping: {
    name: 'ping',
    short: 'verifica se un computer risponde in rete',
    synopsis: 'ping [-c N] DESTINAZIONE',
    description: [
      'Invia piccoli pacchetti "ICMP echo request" a un altro computer e aspetta una risposta "echo reply", come il sonar di un sottomarino.',
      'Per ogni risposta mostra il tempo impiegato (in millisecondi). Alla fine fa un riepilogo dei pacchetti persi.',
      'Nel vero Linux ping continua all\'infinito finché non premi Ctrl+C: qui ne invia 4, salvo che tu indichi -c.',
    ],
    options: [['-c N', '"count": invia solo N pacchetti']],
    examples: [
      ['ping 192.168.1.1', 'controlla se il router risponde'],
      ['ping -c 2 jukebox.lan', 'due ping, usando un nome invece dell\'IP'],
    ],
  },
  nmap: {
    name: 'nmap',
    short: 'scansiona host e porte (solo su bersagli autorizzati!)',
    synopsis: 'nmap [OPZIONI] BERSAGLIO',
    description: [
      '"Network Mapper": lo strumento di ricognizione più famoso al mondo. Scopre quali computer sono accesi in una rete e quali "porte" (servizi) hanno aperte.',
      'ATTENZIONE: scansionare sistemi senza autorizzazione può essere reato. Usalo solo su sistemi tuoi o elencati nello scope di un contratto.',
    ],
    options: [
      ['-sn', 'solo scoperta degli host accesi, senza scansionare le porte'],
      ['-sV', 'prova a scoprire il software e la versione di ogni servizio'],
      ['-p PORTE', 'scansiona solo le porte indicate, es. -p 22,80'],
    ],
    examples: [
      ['nmap -sn 192.168.1.0/24', 'chi è acceso nella rete 192.168.1.x?'],
      ['nmap jukebox.lan', 'quali porte ha aperte il jukebox?'],
      ['nmap -sV 192.168.1.20', 'quali programmi e versioni girano su quelle porte?'],
    ],
  },
  sudo: {
    name: 'sudo',
    short: 'esegue un comando come amministratore',
    synopsis: 'sudo COMANDO',
    description: [
      '"superuser do": esegue un comando con i privilegi di root (l\'amministratore). Funziona solo se il tuo utente è autorizzato nel file /etc/sudoers.',
      'Ottenere i privilegi di root su una macchina si chiama "privilege escalation": lo studieremo più avanti.',
      '"sudo -l" mostra quali comandi il tuo utente può eseguire come root: è la prima cosa da controllare in un audit dei privilegi.',
    ],
  },
  id: {
    name: 'id',
    short: 'mostra il tuo utente e i tuoi gruppi, con i numeri',
    synopsis: 'id',
    description: [
      'Mostra l\'identità completa dell\'utente: uid (numero utente), gid (gruppo principale) e tutti i gruppi di cui fa parte.',
      'Linux ragiona con i numeri: l\'uid 0 è sempre root, qualunque nome abbia.',
    ],
  },
  groups: {
    name: 'groups',
    short: 'mostra i gruppi di cui fai parte',
    synopsis: 'groups',
    description: ['Elenca i gruppi dell\'utente. I gruppi servono a dare gli stessi permessi a più persone insieme.'],
  },
  chmod: {
    name: 'chmod',
    short: 'cambia i permessi di un file',
    synopsis: 'chmod PERMESSI FILE...',
    description: [
      '"change mode": modifica chi può leggere (r), scrivere (w) ed eseguire (x) un file. Solo il proprietario o root possono farlo.',
      'Forma numerica: tre cifre per proprietario, gruppo e altri. Ogni cifra è la somma di r=4, w=2, x=1.',
      'Forma simbolica: u (proprietario), g (gruppo), o (altri), a (tutti), seguiti da + (aggiungi), - (togli) o = (imposta).',
    ],
    examples: [
      ['chmod 600 segreto.txt', 'solo il proprietario legge e scrive (rw-------)'],
      ['chmod 755 script.sh', 'tutti leggono ed eseguono, solo il proprietario scrive (rwxr-xr-x)'],
      ['chmod o-r note.txt', 'toglie la lettura agli "altri"'],
    ],
  },
  find: {
    name: 'find',
    short: 'cerca file e cartelle',
    synopsis: 'find [PERCORSO] [-name MODELLO] [-type f|d] [-user UTENTE]',
    description: [
      'Cerca dentro una cartella e in tutte le sue sottocartelle. Senza percorso parte dalla cartella attuale.',
      'Nel modello del nome, * significa "qualsiasi testo" e ? "un carattere qualsiasi". Metti il modello tra virgolette.',
    ],
    options: [
      ['-name', 'cerca per nome (es. "*.txt"); -iname ignora maiuscole/minuscole'],
      ['-type f', 'solo file; -type d solo cartelle'],
      ['-user U', 'solo file di proprietà dell\'utente U'],
      ['-perm -4000', 'solo i file SUID (eseguiti con i permessi del proprietario)'],
    ],
    examples: [
      ['find ~ -name "*.bak"', 'tutti i file di backup nella tua home'],
      ['find / -type d -name log', 'tutte le cartelle chiamate log nel sistema'],
    ],
  },
  ps: {
    name: 'ps',
    short: 'mostra i processi (programmi in esecuzione)',
    synopsis: 'ps [aux]',
    description: [
      '"process status". Ogni programma in esecuzione è un processo, con un numero identificativo (PID) e un utente che lo esegue.',
      'Da solo mostra i tuoi processi nel terminale; "ps aux" mostra tutti i processi del sistema con utente, uso di CPU e memoria, e comando.',
    ],
    examples: [['ps aux', 'tutti i processi del sistema']],
  },
  sort: {
    name: 'sort',
    short: 'ordina le righe',
    synopsis: 'sort [-n] [-r] [FILE]',
    description: ['Ordina le righe in ordine alfabetico. Si usa spessissimo dopo una pipe.'],
    options: [
      ['-n', 'ordine numerico (10 dopo 9, non dopo 1)'],
      ['-r', 'ordine inverso (dal più grande)'],
    ],
  },
  uniq: {
    name: 'uniq',
    short: 'elimina le righe ripetute consecutive',
    synopsis: 'uniq [-c] [FILE]',
    description: [
      'Unisce le righe uguali che si trovano una dopo l\'altra. Per questo si usa quasi sempre dopo sort.',
      'Con -c scrive davanti a ogni riga quante volte compariva: perfetto per fare statistiche.',
    ],
    examples: [['sort lista.txt | uniq -c', 'conta quante volte compare ogni riga']],
  },
  cut: {
    name: 'cut',
    short: 'estrae colonne da un testo',
    synopsis: 'cut -d SEPARATORE -f N [FILE]',
    description: [
      'Divide ogni riga in colonne usando un separatore e tiene solo quelle richieste.',
      'Le colonne si contano da 1. Più colonne si indicano con la virgola: -f 1,3.',
    ],
    examples: [
      ['cut -d ":" -f 1 /etc/passwd', 'i nomi di tutti gli utenti'],
      ['cut -d " " -f 3 log.txt', 'la terza parola di ogni riga'],
    ],
  },
  ufw: {
    name: 'ufw',
    short: 'gestisce il firewall (serve sudo)',
    synopsis: 'sudo ufw status | sudo ufw deny from IP',
    description: [
      '"Uncomplicated FireWall": un modo semplice per configurare il firewall di Linux.',
      'Un firewall decide quale traffico può entrare o uscire. Bloccare l\'IP di un attaccante è una tipica azione di contenimento.',
    ],
    examples: [
      ['sudo ufw status', 'mostra le regole attive'],
      ['sudo ufw deny from 203.0.113.77', 'blocca tutto il traffico da quell\'indirizzo'],
    ],
  },
  mkdir: {
    name: 'mkdir',
    short: 'crea una cartella',
    synopsis: 'mkdir [-p] CARTELLA...',
    description: ['"make directory": crea una o più cartelle nuove.'],
    options: [['-p', 'crea anche le cartelle intermedie, e non dà errore se esistono già']],
    examples: [
      ['mkdir appunti', 'crea la cartella appunti'],
      ['mkdir -p progetti/2077/rete', 'crea tutta la catena di cartelle'],
    ],
  },
  touch: {
    name: 'touch',
    short: 'crea un file vuoto',
    synopsis: 'touch FILE...',
    description: ['Crea un file vuoto. Se il file esiste già, aggiorna solo la sua data di modifica.'],
  },
  rm: {
    name: 'rm',
    short: 'cancella file (per sempre!)',
    synopsis: 'rm [-r] [-f] FILE...',
    description: [
      '"remove": cancella file. ATTENZIONE: su Linux non c\'è il cestino. Un file cancellato con rm è perso.',
      'Per le cartelle serve -r ("ricorsivo": la cartella e tutto quello che contiene).',
      '"rm -rf" su un percorso sbagliato è uno degli errori più famosi (e disastrosi) della storia dell\'informatica: controlla sempre due volte.',
    ],
    options: [
      ['-r', 'cancella cartelle con tutto il contenuto'],
      ['-f', '"force": non dà errore se il file non esiste'],
    ],
  },
  rmdir: {
    name: 'rmdir',
    short: 'cancella una cartella vuota',
    synopsis: 'rmdir CARTELLA',
    description: ['Cancella una cartella solo se è vuota: è la versione prudente di rm -r.'],
  },
  cp: {
    name: 'cp',
    short: 'copia file e cartelle',
    synopsis: 'cp [-r] ORIGINE DESTINAZIONE',
    description: [
      '"copy": copia un file. Se la destinazione è una cartella, la copia finisce lì dentro con lo stesso nome.',
      'Per copiare una cartella intera serve -r. Attenzione: se il file di destinazione esiste già, viene sovrascritto senza chiedere.',
    ],
    examples: [
      ['cp note.txt note.bak', 'crea una copia di backup'],
      ['cp note.txt appunti/', 'copia note.txt dentro la cartella appunti'],
    ],
  },
  mv: {
    name: 'mv',
    short: 'sposta o rinomina',
    synopsis: 'mv ORIGINE DESTINAZIONE',
    description: [
      '"move": sposta un file o una cartella. Su Linux rinominare è la stessa cosa che spostare: mv vecchio.txt nuovo.txt.',
    ],
    examples: [
      ['mv bozza.txt finale.txt', 'rinomina il file'],
      ['mv finale.txt archivio/', 'sposta il file nella cartella archivio'],
    ],
  },
  nano: {
    name: 'nano',
    short: 'editor di testo semplice',
    synopsis: 'nano FILE',
    description: [
      'Apre un file per modificarlo. Se il file non esiste, lo crea quando salvi.',
      'Nel vero nano si salva con Ctrl+O e si esce con Ctrl+X. In questo deck usa i pulsanti Salva ed Esci.',
    ],
  },
  base64: {
    name: 'base64',
    short: 'codifica o decodifica in Base64',
    synopsis: 'base64 [-d] [FILE]',
    description: [
      'Base64 trasforma qualsiasi dato in lettere e numeri "sicuri" da trasmettere. NON è cifratura: chiunque può decodificarlo, non c\'è nessuna chiave.',
    ],
    options: [['-d', 'decodifica']],
    examples: [
      ['echo ciao | base64', 'codifica: Y2lhbwo='],
      ['echo Y2lhbwo= | base64 -d', 'decodifica: ciao'],
    ],
  },
  sha256sum: {
    name: 'sha256sum',
    short: 'calcola l\'impronta (hash) SHA-256 di un file',
    synopsis: 'sha256sum FILE...',
    description: [
      'Calcola l\'hash SHA-256: un\'impronta di 64 caratteri esadecimali. Se cambia anche un solo carattere del file, l\'impronta cambia completamente.',
      'Si usa per verificare che un file non sia stato modificato (integrità) o che un download sia autentico.',
    ],
  },
  seq: {
    name: 'seq',
    short: 'stampa una sequenza di numeri',
    synopsis: 'seq [INIZIO] FINE',
    description: ['Stampa i numeri da INIZIO a FINE, uno per riga. Utile nei cicli for.'],
    examples: [['seq 1 5', '1 2 3 4 5, uno per riga']],
  },
  test: {
    name: 'test',
    short: 'verifica una condizione (usato con if)',
    synopsis: 'test ESPRESSIONE   oppure   [ ESPRESSIONE ]',
    description: [
      'Non stampa nulla: termina con successo (codice 0) se la condizione è vera, con errore se è falsa. Si usa con if.',
      'Le parentesi quadre vogliono uno spazio dopo [ e prima di ].',
    ],
    options: [
      ['-f F', 'F esiste ed è un file'],
      ['-d D', 'D esiste ed è una cartella'],
      ['A = B', 'i due testi sono uguali (!= diversi)'],
      ['N -gt M', 'N maggiore di M (-lt minore, -eq uguale, -ge, -le, -ne)'],
    ],
    examples: [['[ -f note.txt ] && echo "esiste"', 'stampa "esiste" se il file c\'è']],
  },
  bash: {
    name: 'bash',
    short: 'esegue uno script',
    synopsis: 'bash SCRIPT [ARGOMENTI]   oppure   ./SCRIPT',
    description: [
      'bash è la shell stessa. Dandogli un file, esegue i comandi scritti dentro, uno dopo l\'altro: questo è uno script.',
      'Con ./script.sh lo script si avvia direttamente, ma il file deve essere eseguibile (chmod +x script.sh).',
      'Dentro lo script, $1, $2... sono gli argomenti ricevuti.',
    ],
  },
  env: {
    name: 'env',
    short: 'mostra le variabili d\'ambiente',
    synopsis: 'env',
    description: [
      'Mostra le variabili: nomi a cui è associato un valore, come HOME o USER. Si leggono con $NOME (es. echo $HOME).',
      'Puoi crearne di nuove con NOME=valore (senza spazi attorno all\'uguale).',
    ],
  },
  date: {
    name: 'date',
    short: 'mostra data e ora',
    synopsis: 'date',
    description: ['Mostra data e ora del sistema. Avere l\'ora giusta è fondamentale per confrontare i log di macchine diverse.'],
  },
  tree: {
    name: 'tree',
    short: 'mostra le cartelle ad albero',
    synopsis: 'tree [CARTELLA]',
    description: ['Disegna il contenuto di una cartella e delle sottocartelle come un albero.'],
  },
  curl: {
    name: 'curl',
    short: 'scarica una pagina web',
    synopsis: 'curl [-I] [-i] URL',
    description: [
      'Fa una richiesta HTTP a un server e mostra la risposta: è come un browser, ma senza grafica. Usatissimo per testare siti e API.',
    ],
    options: [
      ['-I', 'mostra solo gli header della risposta'],
      ['-i', 'mostra header e contenuto'],
    ],
    examples: [
      ['curl http://jukebox.lan/', 'il codice HTML della pagina'],
      ['curl -I http://jukebox.lan/', 'solo gli header'],
    ],
  },
  ssh: {
    name: 'ssh',
    short: 'collegati a un altro computer',
    synopsis: 'ssh [UTENTE@]HOST',
    description: [
      '"Secure Shell": apre un terminale su un computer remoto, attraverso una connessione cifrata. È il modo standard di amministrare i server Linux.',
      'Il prompt cambia e mostra il nome del server: da quel momento i comandi girano lì. Con "exit" chiudi la connessione e torni indietro.',
      'Nelle Operazioni il cliente ha installato la tua chiave SSH sui server dello scope: per questo non ti chiede la password.',
    ],
    examples: [['ssh audit@market.lan', 'collegati a market.lan come utente audit']],
  },
  report: {
    name: 'report',
    short: 'segnala un problema trovato (Operazioni)',
    synopsis: 'report ELEMENTO',
    description: [
      'Comando del gioco: nelle Operazioni registra un problema nel rapporto per il cliente.',
      'Indica l\'elemento più preciso possibile: il percorso di un file, il nome di un utente, un indirizzo IP, il nome di un\'impostazione.',
    ],
    examples: [
      ['report /var/www/html/backup/db.sql', 'segnala un file esposto'],
      ['report 203.0.113.9', 'segnala l\'IP di un attaccante'],
    ],
    game: true,
  },
  exit: {
    name: 'exit',
    short: 'chiude la connessione ssh',
    synopsis: 'exit',
    description: ['Chiude la sessione attuale: se sei collegato a un server con ssh, torni al tuo deck.'],
  },
  ipcalc: {
    name: 'ipcalc',
    short: 'calcolatrice per reti e sottoreti',
    synopsis: 'ipcalc INDIRIZZO/PREFISSO',
    description: [
      'Dato un indirizzo con il suo prefisso CIDR, calcola maschera, indirizzo di rete, broadcast, primo e ultimo host e quanti host può contenere la rete.',
    ],
    examples: [
      ['ipcalc 192.168.1.50/24', 'la rete del bar'],
      ['ipcalc 10.0.0.0/26', 'una sottorete da 62 host'],
    ],
  },
  arp: {
    name: 'arp',
    short: 'mostra la tabella ARP (IP → MAC)',
    synopsis: 'arp -a',
    description: ['Versione storica di "ip neigh": mostra gli indirizzi MAC dei dispositivi della rete locale che il computer conosce.'],
  },
  tcpdump: {
    name: 'tcpdump',
    short: 'cattura o legge il traffico di rete',
    synopsis: 'tcpdump -r FILE',
    description: [
      'Mostra i pacchetti che passano sulla rete: chi parla con chi, su quale porta, con quali flag TCP, e (con -A) il contenuto.',
      'Catturare dal vivo richiede root; qui si leggono catture già salvate con -r. Wireshark è la versione grafica dello stesso lavoro.',
    ],
    examples: [['tcpdump -r rete/cattura.txt', 'legge una cattura salvata']],
  },
  'ssh-keygen': {
    name: 'ssh-keygen',
    short: 'crea una coppia di chiavi SSH',
    synopsis: 'ssh-keygen',
    description: [
      'Crea una coppia di chiavi: la privata (~/.ssh/id_ed25519) resta sul tuo computer e non va mai condivisa; la pubblica (.pub) si copia sui server.',
      'Il server conserva le chiavi pubbliche autorizzate in ~/.ssh/authorized_keys.',
    ],
  },
  whois: {
    name: 'whois',
    short: 'chi ha registrato un dominio',
    synopsis: 'whois DOMINIO',
    description: [
      'Interroga i registri pubblici dei domini: registrar, date di creazione e scadenza, proprietario, contatti e name server.',
      'Molti dati personali oggi sono oscurati per privacy (GDPR), ma quelli delle aziende spesso no.',
    ],
  },
  dig: {
    name: 'dig',
    short: 'interroga il DNS',
    synopsis: 'dig DOMINIO [A|MX|TXT|NS]',
    description: ['Chiede al DNS i record di un dominio.'],
    options: [
      ['A', 'l\'indirizzo IP'],
      ['MX', 'i server di posta'],
      ['TXT', 'testi liberi: SPF, verifiche di servizi...'],
      ['NS', 'i server DNS autorevoli'],
    ],
    examples: [['dig neonottica.nc MX', 'chi riceve la posta di neonottica.nc']],
  },
  crtsh: {
    name: 'crtsh',
    short: 'cerca i certificati HTTPS di un dominio (come crt.sh)',
    synopsis: 'crtsh DOMINIO',
    description: [
      'Ogni certificato HTTPS rilasciato viene registrato in log pubblici (certificate transparency). Cercarli rivela i sottodomini di un\'azienda, anche quelli dimenticati.',
      'Simula la ricerca sul sito pubblico crt.sh.',
    ],
    game: true,
  },
  exiftool: {
    name: 'exiftool',
    short: 'legge i metadati di un file',
    synopsis: 'exiftool FILE',
    description: [
      'Mostra i metadati nascosti dentro documenti, foto e PDF: autore, software usato, date, a volte percorsi interni o coordinate GPS.',
      'Prima di pubblicare un file, i metadati andrebbero ripuliti.',
    ],
  },
  cve: {
    name: 'cve',
    short: 'cerca vulnerabilità note (database simulato)',
    synopsis: 'cve PRODOTTO [VERSIONE]',
    description: [
      'Cerca in un database simulato di vulnerabilità note, come il National Vulnerability Database (NVD). Mostra l\'identificativo CVE, il punteggio CVSS da 0 a 10 e una descrizione.',
      'Le CVE con anno 2077 sono inventate per il gioco.',
    ],
    examples: [['cve apache 2.4.29', 'vulnerabilità note per quella versione di Apache']],
    game: true,
  },
  ss: {
    name: 'ss',
    short: 'mostra i servizi in ascolto',
    synopsis: 'ss -tlnp',
    description: [
      '"socket statistics": elenca le porte su cui il sistema è in ascolto e quale programma le usa. È la versione moderna di netstat.',
      'Ogni servizio in ascolto è una porta aperta verso il mondo: quelli che non servono vanno spenti.',
    ],
    options: [['-tlnp', 't = TCP, l = in ascolto, n = numeri, p = processo']],
  },
  apt: {
    name: 'apt',
    short: 'gestisce i pacchetti software (Debian/Ubuntu)',
    synopsis: 'apt list --upgradable',
    description: [
      'Il gestore dei pacchetti di Debian e Ubuntu. "apt list --upgradable" elenca gli aggiornamenti disponibili; quelli dal canale "-security" correggono vulnerabilità.',
      'Per installarli serve root: sudo apt upgrade.',
    ],
  },
  flag: {
    name: 'flag',
    short: 'invia una risposta o una flag trovata',
    synopsis: 'flag RISPOSTA',
    description: [
      'Comando del gioco. Nelle gare CTF ("Capture The Flag") si cercano codici segreti chiamati flag, nel formato NC{...}.',
      'Quando una missione ti chiede una risposta, scrivila con questo comando. Va bene anche "risposta".',
    ],
    examples: [['flag NC{esempio}', 'invia la flag NC{esempio}']],
    game: true,
  },
  hint: {
    name: 'hint',
    short: 'chiede un suggerimento per l\'obiettivo attuale',
    synopsis: 'hint',
    description: ['Comando del gioco: mostra un suggerimento per l\'obiettivo in corso. Va bene anche "suggerimento".'],
    game: true,
  },
};

/** Alias di comandi del gioco in italiano. */
export const ALIASES: Record<string, string> = {
  risposta: 'flag',
  aiuto: 'help',
  less: 'cat',
  more: 'cat',
  sh: 'bash',
  vi: 'nano',
  vim: 'nano',
  export: 'env',
  suggerimento: 'hint',
};
