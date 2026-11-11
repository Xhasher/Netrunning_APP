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
