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
    examples: [['ip a', 'mostra tutte le interfacce e i loro IP']],
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
  suggerimento: 'hint',
};
