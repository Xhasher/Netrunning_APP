// Manuale, parte C: sistema, rete, strumenti di sicurezza, script e shell.

import { doc } from './manpages';

const SYS = 'Processi e sistema';
const NET = 'Rete';
const SEC = 'Sicurezza e analisi';
const SH = 'Script e shell';

// ---------------------------------------------------------------- processi e sistema

doc('ps', {
  cat: SYS,
  description: [
    '"process status": mostra i processi, cioè i programmi in esecuzione, ognuno con un numero identificativo (PID) e un utente proprietario. Da solo mostra solo i tuoi processi del terminale; "ps aux" mostra tutto il sistema.',
    'Colonne di "ps aux": USER chi lo esegue, PID il numero, %CPU e %MEM quanta potenza e memoria usa, START quando è partito, COMMAND il comando completo.',
  ],
  options: [['aux', 'tutti i processi di tutti gli utenti, con dettagli (a = tutti, u = formato utente, x = anche senza terminale)']],
  examples: [
    ['ps aux', 'tutti i processi del sistema'],
    ['ps aux | grep sshd', 'cerca un processo per nome'],
    ['ps aux | grep -v root', 'tutti i processi che NON appartengono a root'],
    ['ps aux | awk \'{print $1}\' | sort | uniq -c', 'quanti processi per utente'],
  ],
  notes: [
    'Segnali sospetti: un processo che usa quasi il 100% della CPU, che parte da /tmp o da cartelle nascoste, con un nome che imita un processo di sistema (kworker, kthreadd) ma ha un utente normale.',
    'Nel vero Linux si fermano i processi con "kill PID" (SIGTERM) o "kill -9 PID" (SIGKILL, forzato). In un incidente si conservano le prove prima di fermarli.',
  ],
  see: ['ss', 'systemctl', 'grep'],
});

doc('uname', {
  cat: SYS,
  short: 'informazioni sul sistema e sul kernel',
  description: ['Mostra informazioni sul sistema: nome del sistema operativo, nome host, versione del kernel, architettura. Con -a le mostra tutte.'],
  options: [['-a', 'tutte le informazioni'], ['-r', 'versione del kernel'], ['-s', 'nome del kernel'], ['-n', 'nome dell\'host'], ['-m', 'architettura']],
  examples: [['uname -a', 'riga completa'], ['uname -r', 'solo la versione del kernel']],
  notes: ['La versione del kernel serve a capire se mancano aggiornamenti di sicurezza: confrontala con le CVE note.'],
  see: ['lsb_release', 'hostname', 'cve'],
});

doc('uptime', {
  cat: SYS,
  short: 'da quanto è acceso il sistema e quanto è carico',
  description: ['Mostra da quanto tempo il sistema è acceso, quanti utenti sono collegati e il carico medio negli ultimi 1, 5 e 15 minuti. Un carico molto più alto del normale può indicare un problema (o un cryptominer).'],
  examples: [['uptime', 'stato in una riga']],
  see: ['free', 'ps', 'who'],
});

doc('df', {
  cat: SYS,
  short: 'spazio libero sui dischi',
  description: ['"disk free": mostra quanto spazio è usato e libero su ogni disco/partizione. Un disco pieno blocca i log e i servizi: molti incidenti banali nascono da qui.'],
  examples: [['df -h', 'dimensioni leggibili (G, M)']],
  see: ['du', 'free'],
});

doc('du', {
  cat: SYS,
  short: 'spazio usato da file e cartelle',
  description: ['"disk usage": mostra quanto spazio occupano file e cartelle. Per scoprire cosa riempie un disco: du -sh *.'],
  options: [['-s', 'solo il totale di ogni argomento'], ['-h', 'dimensioni leggibili'], ['-a', 'mostra anche i singoli file']],
  examples: [['du -sh caso web siem', 'totale per tre cartelle'], ['du -h contratti', 'dimensione di ogni sottocartella']],
  see: ['df', 'ls', 'find'],
});

doc('free', {
  cat: SYS,
  short: 'memoria disponibile',
  description: ['Mostra l\'uso della memoria RAM e dello swap. Una RAM esaurita rallenta tutto; un uso anomalo può indicare un processo fuori controllo.'],
  options: [['-h', 'dimensioni leggibili (Gi, Mi)']],
  examples: [['free -h', 'memoria in unità leggibili']],
  see: ['uptime', 'ps', 'df'],
});

doc('who', {
  cat: SYS,
  short: 'chi è collegato adesso',
  description: ['Elenca gli utenti attualmente collegati al sistema, da quale terminale e da quale indirizzo. In un\'indagine serve a vedere subito se c\'è qualcuno che non dovrebbe esserci.'],
  examples: [['who', 'sessioni attive']],
  see: ['last', 'lastb', 'whoami'],
});

doc('last', {
  cat: SYS,
  short: 'storico dei login riusciti',
  description: ['Mostra gli accessi riusciti passati (legge /var/log/wtmp): utente, terminale, indirizzo di provenienza, data e durata. Un login da un indirizzo esterno insolito, a un\'ora strana, è un segnale da approfondire.'],
  examples: [['last', 'ultimi accessi e riavvii']],
  see: ['lastb', 'who', 'journalctl'],
});

doc('lastb', {
  cat: SYS,
  short: 'storico dei login FALLITI (serve root)',
  description: ['Come last, ma elenca i tentativi di accesso falliti (file /var/log/btmp). Richiede root. È tra i primi comandi quando si sospetta un brute force.'],
  examples: [['lastb', 'da utente normale: Permission denied (come deve essere)']],
  see: ['last', 'grep'],
});

doc('systemctl', {
  cat: SYS,
  short: 'gestisce i servizi (systemd)',
  synopsis: 'systemctl AZIONE [SERVIZIO]',
  description: [
    'Controlla i servizi, cioè i programmi che girano in background (demoni): ssh, cron, nginx, ufw. Mostra se sono attivi e permette di avviarli, fermarli o riavviarli (con privilegi di amministratore).',
  ],
  options: [
    ['status SERVIZIO', 'stato, da quando è attivo, processo principale'],
    ['is-active SERVIZIO', 'risponde solo "active" o "inactive"'],
    ['list-units', 'elenco dei servizi caricati'],
    ['start / stop / restart', 'avvia / ferma / riavvia (serve root)'],
    ['enable / disable', 'avvio automatico all\'accensione sì / no (serve root)'],
  ],
  examples: [
    ['systemctl status ssh', 'stato del servizio SSH'],
    ['systemctl list-units', 'tutti i servizi attivi'],
    ['systemctl is-active cron', 'cron è in esecuzione?'],
  ],
  notes: ['Nell\'hardening si spegne e si disabilita ogni servizio non necessario. Gli attaccanti usano nuovi servizi come persistenza (Windows: evento 7045).'],
  see: ['journalctl', 'ss', 'ps'],
});

doc('journalctl', {
  cat: SYS,
  short: 'legge il giornale di sistema (systemd)',
  synopsis: 'journalctl [-u SERVIZIO] [-n N]',
  description: ['Il "giornale" centralizzato di systemd: raccoglie i messaggi di kernel, servizi e programmi. Sostituisce (o affianca) la lettura dei singoli file in /var/log.'],
  options: [['-u SERVIZIO', 'solo i messaggi di un servizio'], ['-n N', 'solo le ultime N righe'], ['-f', 'segue in tempo reale (non disponibile nel deck)']],
  examples: [['journalctl -n 5', 'le ultime cinque righe'], ['journalctl -u ssh', 'tutto ciò che ha scritto il servizio SSH']],
  see: ['tail', 'grep', 'systemctl'],
});

doc('crontab', {
  cat: SYS,
  short: 'lavori programmati dell\'utente',
  description: [
    'cron esegue comandi a orari prestabiliti. Ogni riga ha 5 campi di tempo (minuto, ora, giorno del mese, mese, giorno della settimana) e poi il comando: "*/5 * * * * comando" significa ogni 5 minuti.',
    'crontab -l elenca i lavori dell\'utente. I lavori di sistema stanno in /etc/crontab e /etc/cron.d.',
  ],
  options: [['-l', 'elenca i lavori programmati']],
  examples: [['cat /etc/crontab', 'i lavori programmati di sistema'], ['crontab -l', 'quelli del tuo utente']],
  notes: ['È il luogo preferito dagli attaccanti per la persistenza (ATT&CK T1053): in un audit si controllano sempre crontab, /etc/cron.d e le directory /etc/cron.*.'],
  see: ['systemctl', 'find'],
});

doc('apt', {
  cat: SYS,
  description: ['Il gestore dei pacchetti di Debian e Ubuntu. Con "list --upgradable" elenca gli aggiornamenti disponibili; quelli dal canale "-security" correggono vulnerabilità. Per installarli serve root (sudo apt upgrade).'],
  options: [['list --upgradable', 'aggiornamenti disponibili']],
  examples: [['apt list --upgradable', 'cosa manca da aggiornare']],
  notes: ['Applica sempre le patch di sicurezza con regolarità: gran parte degli attacchi sfrutta vulnerabilità per cui esiste già l\'aggiornamento. Si può automatizzare con unattended-upgrades.'],
  see: ['cve', 'systemctl'],
});

doc('lsb_release', {
  cat: SYS,
  short: 'distribuzione Linux e versione',
  description: ['Mostra la distribuzione Linux e la sua versione. Serve a sapere quali aggiornamenti e quali vulnerabilità valgono per quel sistema.'],
  examples: [['lsb_release -a', 'nome e versione'], ['cat /etc/os-release', 'le stesse informazioni dal file']],
  see: ['uname'],
});

// ---------------------------------------------------------------- rete

doc('ip', {
  cat: NET,
  description: [
    'Mostra e configura la rete del computer. È il comando moderno che sostituisce ifconfig, route e arp.',
    '"ip a" mostra le interfacce di rete e i loro indirizzi: lo (loopback, 127.0.0.1) e eth0 (la scheda vera: cerca la riga "inet"). "ip route" la tabella di instradamento. "ip neigh" i dispositivi vicini con il loro indirizzo MAC (tabella ARP).',
  ],
  options: [['a', 'indirizzi di tutte le interfacce'], ['route', 'tabella di instradamento (default = il gateway)'], ['neigh', 'vicini noti: IP e indirizzo MAC']],
  examples: [
    ['ip a', 'il mio indirizzo IP e la maschera'],
    ['ip route', 'da dove esco verso Internet?'],
    ['ip neigh', 'quali dispositivi ho contattato di recente?'],
  ],
  see: ['ping', 'arp', 'ss', 'ipcalc'],
});

doc('ifconfig', {
  cat: NET,
  description: ['Il vecchio comando per vedere la configurazione di rete, ancora presente su molti sistemi. Equivale a "ip a".'],
  examples: [['ifconfig', 'configurazione delle interfacce']],
  see: ['ip'],
});

doc('arp', {
  cat: NET,
  description: ['Mostra la tabella ARP: la corrispondenza tra indirizzi IP e indirizzi MAC dei dispositivi della rete locale. Un MAC sconosciuto è un dispositivo non in inventario.'],
  examples: [['arp -a', 'i dispositivi noti']],
  see: ['ip'],
});

doc('ping', {
  cat: NET,
  description: [
    'Invia piccoli pacchetti ICMP "echo request" a un altro computer e aspetta le risposte "echo reply", come il sonar di un sottomarino. Per ogni risposta mostra il tempo impiegato (ms) e il TTL.',
    'Il TTL iniziale dipende dal sistema operativo: 64 di solito Linux, 128 Windows, 255 apparati di rete. Alla fine riassume i pacchetti persi.',
    'Il silenzio NON vuol dire spento: molti firewall ignorano l\'ICMP.',
  ],
  options: [['-c N', '"count": invia solo N pacchetti']],
  examples: [
    ['ping -c 2 192.168.1.1', 'controlla se il router risponde'],
    ['ping -c 3 jukebox.lan', 'usa un nome: prima il DNS lo traduce in IP'],
    ['ping -c 1 cassa.lan', 'nessuna risposta: filtrato dal firewall, non spento'],
  ],
  see: ['nmap', 'traceroute', 'nc'],
});

doc('nmap', {
  cat: NET,
  description: [
    '"Network Mapper": lo strumento di ricognizione più famoso. Scopre quali computer sono accesi in una rete e quali porte hanno aperte, e (con -sV) quale software e quale versione risponde su ciascuna.',
    'ATTENZIONE LEGALE: scansionare sistemi senza autorizzazione può essere reato (art. 615-ter c.p.). Usalo solo su sistemi tuoi o dentro lo scope di un contratto: nel deck le scansioni fuori scope vengono bloccate.',
  ],
  options: [
    ['-sn', 'solo scoperta degli host accesi, senza scansionare le porte'],
    ['-sV', 'rileva software e versione di ogni servizio'],
    ['-p PORTE', 'solo le porte indicate: -p 22,80 oppure -p 1-1000'],
    ['-Pn', 'non fa il controllo "è acceso?": scansiona comunque (utile con firewall che bloccano il ping)'],
  ],
  examples: [
    ['nmap -sn 192.168.1.0/24', 'chi è acceso nella rete'],
    ['nmap 192.168.1.20', 'le 1000 porte più comuni di un host'],
    ['nmap -sV -p 22,80 192.168.1.20', 'versioni dei soli servizi SSH e web'],
    ['nmap -p 443 cassa.lan', 'una porta sola su un host che non risponde al ping'],
  ],
  notes: [
    'Stati delle porte: open (c\'è un servizio), closed (nessun servizio), filtered (un firewall non fa capire).',
    'Su un server tuo, esegui nmap per vedere cosa vede un attaccante: ogni porta aperta che non ti serve va chiusa.',
  ],
  see: ['nc', 'curl', 'ss', 'cve'],
});

doc('nc', {
  cat: NET,
  short: 'verifica se una porta è aperta (netcat)',
  synopsis: 'nc -zv HOST PORTA',
  description: ['Netcat è il "coltellino svizzero" della rete: apre connessioni TCP/UDP verso qualsiasi porta. Nel deck serve a verificare rapidamente se una porta è raggiungibile.'],
  options: [['-z', 'solo controllo: non invia dati'], ['-v', 'verboso: dice cosa è successo']],
  examples: [['nc -zv 192.168.1.20 22', 'la porta SSH del jukebox è aperta?'], ['nc -zv jukebox.lan 3306', 'una porta chiusa: Connection refused']],
  see: ['nmap', 'ss', 'curl'],
});

doc('curl', {
  cat: NET,
  description: ['Fa una richiesta HTTP a un server e mostra la risposta. È un "browser da terminale": ottimo per testare siti e API, leggere gli header, controllare i codici di stato.'],
  options: [['-I', 'solo gli header della risposta'], ['-i', 'header e contenuto insieme']],
  examples: [
    ['curl -I http://jukebox.lan/', 'gli header: che server è? che versione?'],
    ['curl http://jukebox.lan/robots.txt', 'un file specifico del sito'],
    ['curl -i http://jukebox.lan/pagina-inesistente', 'una pagina che non c\'è: 404 Not Found'],
  ],
  notes: ['Gli header "Server" e "X-Powered-By" rivelano software e versioni (information disclosure): vanno nascosti.'],
  see: ['nmap', 'dig'],
});

doc('ss', {
  cat: NET,
  description: ['"socket statistics": mostra le porte su cui il sistema è in ascolto e quale programma le usa. Ogni servizio in ascolto è una porta aperta verso la rete: quelli che non servono vanno spenti.'],
  options: [['-tlnp', 't = TCP, l = in ascolto, n = numeri (senza risolvere i nomi), p = processo']],
  examples: [['ss -tlnp', 'servizi TCP in ascolto']],
  notes: ['0.0.0.0 = ascolta su tutte le interfacce (raggiungibile dalla rete); 127.0.0.1 = solo il computer stesso. Un database usato solo in locale non dovrebbe ascoltare su 0.0.0.0.'],
  see: ['netstat', 'nmap', 'ps'],
});

doc('netstat', {
  cat: NET,
  short: 'porte e connessioni (vecchio comando)',
  description: ['Il vecchio comando per vedere porte e connessioni, sostituito da ss. Lo trovi ancora in molti manuali e sistemi.'],
  examples: [['netstat -tlnp', 'servizi in ascolto']],
  see: ['ss'],
});

doc('traceroute', {
  cat: NET,
  short: 'la strada dei pacchetti verso una destinazione',
  description: ['Mostra la strada che fanno i pacchetti per arrivare a una destinazione, router dopo router ("salti" o hop). Gli asterischi * indicano router che non rispondono (spesso un firewall).'],
  examples: [['traceroute jukebox.lan', 'un salto solo: è nella stessa rete'], ['traceroute 203.0.113.66', 'una destinazione esterna: più salti']],
  see: ['ping', 'ip'],
});

doc('nslookup', {
  cat: NET,
  short: 'chiede al DNS l\'indirizzo di un nome',
  description: ['Chiede al DNS l\'indirizzo IP di un nome. Versione più semplice di dig.'],
  examples: [['nslookup jukebox.lan', 'l\'IP del jukebox'], ['nslookup neonottica.nc', 'un nome pubblico']],
  see: ['dig', 'whois'],
});

doc('dig', {
  cat: NET,
  description: ['Interroga il DNS e mostra i record di un dominio. Strumento principale per la ricognizione passiva e per diagnosticare problemi di posta (MX, SPF).'],
  options: [['A', 'indirizzo IP'], ['MX', 'server di posta'], ['TXT', 'testi: SPF, verifiche di servizi'], ['NS', 'server DNS autorevoli']],
  examples: [['dig neonottica.nc A', 'l\'IP del dominio'], ['dig neonottica.nc MX', 'chi riceve la posta'], ['dig neonottica.nc TXT', 'record SPF e verifiche']],
  see: ['nslookup', 'whois', 'crtsh'],
});

doc('whois', {
  cat: NET,
  description: ['Interroga i registri pubblici dei domini: registrar, date di creazione e scadenza, proprietario, contatti tecnici, name server. Con il GDPR molti dati personali sono oscurati; quelli aziendali spesso no.'],
  examples: [['whois neonottica.nc', 'chi ha registrato il dominio']],
  see: ['dig', 'crtsh'],
});

doc('tcpdump', {
  cat: NET,
  description: ['Cattura e mostra i pacchetti di rete. Dal vivo richiede root; qui si leggono catture già salvate con -r. Wireshark è la versione grafica dello stesso lavoro.'],
  options: [['-r FILE', 'legge una cattura salvata']],
  examples: [['tcpdump -r rete/cattura.txt | head -n 5', 'le prime righe di una cattura'], ['tcpdump -r rete/cattura.txt | grep "Flags \\[S\\]," | wc -l', 'quanti pacchetti SYN (inizio connessione)']],
  see: ['grep', 'awk', 'ss'],
});

doc('ipcalc', {
  cat: NET,
  description: ['Calcola rete, maschera, broadcast, primo e ultimo host e numero di host di una rete in notazione CIDR. Indispensabile per leggere uno scope e per progettare sottoreti.'],
  examples: [['ipcalc 10.10.10.0/27', 'una rete da 30 host'], ['ipcalc 172.16.5.9/20', 'dall\'indirizzo risale alla rete']],
  see: ['ip', 'nmap'],
});

doc('ssh', {
  cat: NET,
  description: ['"Secure Shell": apre un terminale su un altro computer attraverso una connessione cifrata. Il prompt cambia e mostra il nome del server; con "exit" chiudi la connessione.'],
  examples: [['ssh audit@market.lan', 'collegati come utente audit (nelle Operazioni)']],
  notes: ['Preferisci SEMPRE le chiavi alle password, e disattiva il login diretto di root (PermitRootLogin no).'],
  see: ['ssh-keygen', 'exit'],
});

doc('ssh-keygen', {
  cat: NET,
  description: ['Crea la tua coppia di chiavi: privata (~/.ssh/id_ed25519, mai da condividere, permessi 600) e pubblica (.pub, da copiare sui server in ~/.ssh/authorized_keys).'],
  examples: [['ssh-keygen', 'genera la coppia di chiavi']],
  see: ['ssh', 'chmod'],
});

// ---------------------------------------------------------------- sicurezza e analisi

doc('exiftool', {
  cat: SEC,
  description: ['Legge i metadati nascosti nei file: autore, software, date, percorsi interni, a volte coordinate GPS. Prima di pubblicare un documento i metadati vanno ripuliti.'],
  examples: [['exiftool osint/catalogo_2077.pdf', 'cosa rivela un catalogo pubblico']],
  see: ['file', 'strings'],
});

doc('crtsh', {
  cat: SEC,
  description: ['Cerca i certificati HTTPS rilasciati per un dominio nei log pubblici (certificate transparency), come fa il sito crt.sh. Rivela sottodomini, anche dimenticati.'],
  examples: [['crtsh neonottica.nc', 'tutti i nomi con un certificato']],
  see: ['dig', 'whois'],
});

doc('cve', {
  cat: SEC,
  description: ['Cerca nel database (simulato) delle vulnerabilità note: identificativo CVE, punteggio di gravità CVSS (0-10) e descrizione.'],
  examples: [['cve apache 2.4.29', 'vulnerabilità note per quella versione'], ['cve roundcube 1.6.2', 'versione aggiornata: nessuna voce']],
  see: ['nmap', 'apt'],
});

doc('md5sum', { cat: SEC, short: 'impronta MD5 (sconsigliata)', description: ['MD5 è considerato rotto per la sicurezza (collisioni note): per integrità e prove usa sha256sum.'], see: ['sha256sum'] });
doc('sha1sum', { cat: SEC, short: 'impronta SHA-1 (sconsigliata)', description: ['SHA-1 è considerato rotto per la sicurezza: usa sha256sum.'], see: ['sha256sum'] });

// ---------------------------------------------------------------- script e shell

doc('man', {
  cat: SH,
  description: ['Mostra la pagina di manuale di un comando: a cosa serve, sintassi, opzioni, esempi. È lo strumento più importante per imparare: un professionista non ricorda tutto, sa dove cercare. Nel vero Linux il manuale è in inglese.'],
  examples: [['man grep', 'tutte le opzioni di grep'], ['man pipe', 'anche i concetti della shell hanno una pagina']],
  see: ['help', 'cheat'],
});

doc('help', { cat: SH, description: ['Elenca i comandi disponibili nel deck con una riga di spiegazione. Per i dettagli usa man.'], see: ['man', 'cheat'] });

doc('unalias', { cat: SH, short: 'rimuove un alias', description: ['Rimuove un alias creato con alias.'], see: ['alias'] });

doc('alias', {
  cat: SH,
  description: ['Crea scorciatoie per comandi lunghi. Nel vero Linux si salvano in ~/.bashrc per renderli permanenti. Senza argomenti elenca gli alias; unalias NOME ne rimuove uno.'],
  examples: [[`alias ll='ls -la'`, 'ora "ll" fa "ls -la"'], [`alias falliti='grep "Failed password"'`, 'una scorciatoia da analista']],
  see: ['history', 'cheat'],
});

doc('cheat', { cat: SH, description: ['Promemoria rapidi dei comandi per argomento. Esempio: cheat soc.'], see: ['man', 'help'] });

doc('env', {
  cat: SH,
  description: ['Mostra le variabili d\'ambiente: nomi con un valore (HOME, USER, PATH...). Si leggono con $NOME. A volte contengono segreti (chiavi di accesso): in un\'indagine vanno sempre controllate.'],
  examples: [['env', 'tutte le variabili'], ['echo "$HOME e $USER"', 'leggerne due']],
  see: ['echo', 'variabili'],
});

doc('date', { cat: SH, description: ['Mostra data e ora del sistema. Avere l\'ora giusta (e uguale ovunque) è fondamentale per confrontare i log di macchine diverse.'], examples: [['date', 'data e ora attuali']], see: ['uptime'] });

doc('bash', {
  cat: SH,
  description: ['bash è la shell stessa. Dandogli un file, esegue i comandi scritti dentro: uno script. Con ./script.sh lo script si avvia direttamente, ma il file deve avere il permesso di esecuzione (chmod +x). Dentro lo script, $1, $2... sono gli argomenti.'],
  examples: [['echo "echo Ciao" > /tmp/s.sh && bash /tmp/s.sh', 'crea ed esegue un piccolo script']],
  see: ['chmod', 'nano', 'for'],
});

doc('nano', {
  cat: SH,
  description: ['Editor di testo semplice. Nel vero nano si salva con Ctrl+O e si esce con Ctrl+X; qui usi i pulsanti Salva ed Esci. Se il file non esiste, viene creato al salvataggio.'],
  see: ['cat', 'echo'],
});

doc('test', {
  cat: SH,
  description: ['Verifica una condizione e termina con successo (0) se è vera. Si usa dentro if; "[ ... ]" è lo stesso comando scritto con le parentesi: servono gli SPAZI dopo [ e prima di ].'],
  options: [['-f F', 'F è un file'], ['-d D', 'D è una cartella'], ['-e P', 'P esiste'], ['A = B / A != B', 'testi uguali / diversi'], ['N -gt M', 'maggiore (-lt minore, -eq uguale, -ge, -le, -ne)']],
  examples: [['[ -f README.txt ] && echo "esiste"', 'stampa solo se il file c\'è'], ['[ 5 -gt 3 ] && echo "5 è maggiore di 3"', 'confronto numerico']],
  see: ['if', 'for', 'bash'],
});

doc('exit', { cat: SH, description: ['Chiude la sessione attuale: se sei collegato a un server con ssh, torni al tuo deck.'], see: ['ssh'] });

// ---------------------------------------------------------------- concetti della shell (man pipe, man redirezioni...)

doc('pipe', {
  cat: SH,
  short: 'concetto: collegare i comandi con |',
  synopsis: 'comando1 | comando2 | comando3',
  description: [
    'La pipe | prende l\'OUTPUT del comando a sinistra e lo usa come INPUT di quello a destra. È l\'idea più potente di Linux: ogni comando fa una cosa sola, e li si combina come mattoncini.',
    'Si legge da sinistra a destra. Per costruire una catena lunga, aggiungi un pezzo alla volta e guarda cosa esce a ogni passo.',
  ],
  examples: [
    ['cat /etc/passwd | grep bash | wc -l', 'quanti utenti hanno bash come shell'],
    ['ls /bin | sort -r | head -n 3', 'gli ultimi tre programmi in ordine alfabetico'],
    ['grep Failed caso/auth.log | cut -d " " -f 11 | sort | uniq -c | sort -n -r', 'la classifica dei tentativi per IP'],
  ],
  see: ['grep', 'sort', 'uniq', 'redirezioni'],
});

doc('redirezioni', {
  cat: SH,
  short: 'concetto: > >> < 2> per input e output',
  synopsis: 'comando > file · comando >> file · comando 2> errori.txt',
  description: [
    'Normalmente l\'output di un comando va sullo schermo. Con le redirezioni lo mandi altrove.',
    '> scrive nel file e lo SOVRASCRIVE; >> aggiunge in fondo; 2> manda i messaggi di errore (stderr, canale 2) in un file; 2>/dev/null li butta via; &> o 2>&1 uniscono i due canali.',
    '/dev/null è un "buco nero": tutto ciò che ci scrivi sparisce. Si usa spessissimo per nascondere gli errori inutili.',
  ],
  examples: [
    ['ls /root 2>/dev/null', 'nasconde l\'errore Permission denied'],
    ['grep Failed caso/auth.log > /tmp/falliti.txt && wc -l /tmp/falliti.txt', 'salva i risultati in un file e li conta'],
    ['echo "prima" > /tmp/r.txt && echo "seconda" >> /tmp/r.txt && cat /tmp/r.txt', 'prima scrive, poi aggiunge'],
  ],
  notes: ['Un ">" al posto di ">>" ha distrutto più file importanti di qualsiasi virus. Controlla quanti ne hai scritti prima di premere Invio.'],
  see: ['pipe', 'tee', 'echo'],
});

doc('variabili', {
  cat: SH,
  short: 'concetto: NOME=valore e $NOME',
  synopsis: 'NOME=valore · echo $NOME · VAR=$(comando)',
  description: [
    'Una variabile è un nome a cui è associato un valore. Si crea con NOME=valore (SENZA spazi attorno all\'uguale) e si legge con $NOME.',
    'Tra virgolette doppie le variabili vengono espanse ("Ciao $USER"), tra virgolette singole no (\'$USER\'). $(comando) esegue il comando e ne usa l\'output come testo.',
    'Variabili speciali: $HOME la tua cartella, $USER il tuo nome, $PWD dove sei, $? il codice di uscita dell\'ultimo comando (0 = successo), $1 $2... gli argomenti di uno script.',
  ],
  examples: [
    ['IP=192.168.1.20 && echo "Bersaglio: $IP"', 'crea e usa una variabile'],
    ['N=$(grep -c Failed caso/auth.log) && echo "Falliti: $N"', 'salva il risultato di un comando'],
    ['ls /non-esiste 2>/dev/null; echo "codice: $?"', 'il codice di uscita: diverso da 0 = errore'],
  ],
  see: ['env', 'echo', 'bash'],
});

doc('for', {
  cat: SH,
  short: 'concetto: ripetere comandi con un ciclo',
  synopsis: 'for NOME in LISTA; do COMANDI; done',
  description: [
    'Esegue i comandi una volta per ogni elemento della lista; a ogni giro la variabile prende il valore successivo. La lista può essere scritta a mano, generata da seq, o ottenuta da find / dal jolly *.',
    'Nel terminale puoi scrivere tutto su una riga separando con ";".',
  ],
  examples: [
    ['for n in uno due tre; do echo "numero $n"; done', 'una lista scritta a mano'],
    ['for f in missioni/*.txt; do echo "== $f"; wc -l $f; done', 'tutti i file di testo di una cartella'],
    ['for i in $(seq 1 3); do echo "giro $i"; done', 'una sequenza di numeri'],
    ['for f in $(find siem -type f); do sha256sum $f; done', 'un\'azione per ogni file trovato'],
  ],
  see: ['if', 'seq', 'find', 'xargs'],
});

doc('if', {
  cat: SH,
  short: 'concetto: decidere con una condizione',
  synopsis: 'if CONDIZIONE; then COMANDI; else COMANDI; fi',
  description: [
    'Esegue un blocco solo se la condizione è vera. La condizione è un comando: se termina con successo (codice 0) è vera. I test più comuni si scrivono con [ ... ] (con gli spazi!).',
    '&& esegue il comando successivo solo se il precedente è riuscito; || solo se è fallito. Sono if abbreviati.',
  ],
  examples: [
    ['if [ -f README.txt ]; then echo "c\'è"; else echo "manca"; fi', 'il file esiste?'],
    ['grep -q root /etc/passwd && echo "trovato" || echo "assente"', 'con && e ||: grep -q non stampa, restituisce solo il codice'],
    ['N=7; if [ $N -gt 5 ]; then echo "alto"; else echo "basso"; fi', 'confronto numerico'],
  ],
  see: ['test', 'for', 'grep'],
});

doc('regex', {
  cat: SH,
  short: 'concetto: espressioni regolari',
  synopsis: 'grep -E "modello" · sed -E · awk /modello/',
  description: [
    'Un\'espressione regolare descrive un MODELLO di testo, invece di un testo preciso. È la competenza più trasversale del mestiere: grep, sed, awk, SIEM, IDS e firewall applicativi le usano tutti.',
    'Simboli base: . un carattere qualsiasi · * zero o più ripetizioni · + una o più · ? zero o una · ^ inizio riga · $ fine riga · [abc] uno tra a, b, c · [0-9] una cifra · (a|b) a oppure b · \\. un punto vero.',
  ],
  examples: [
    ['grep -E "^root" /etc/passwd', 'righe che INIZIANO con root'],
    ['grep -E "bash$" /etc/passwd', 'righe che FINISCONO con bash'],
    ['grep -oE "[0-9]{1,3}(\\.[0-9]{1,3}){3}" caso/auth.log | sort -u', 'estrae gli indirizzi IP (un modello classico)'],
    ['grep -E "(4624|4625),DC01" windows/security.csv', 'due alternative con (a|b)'],
  ],
  notes: ['Costruiscile un pezzo alla volta e provale su un campione; esistono siti come regex101 per vedere cosa corrisponde.'],
  see: ['grep', 'sed', 'awk'],
});

doc('jolly', {
  cat: SH,
  short: 'concetto: * e ? nei nomi dei file',
  synopsis: '*.txt · file?.log',
  description: [
    'I caratteri jolly (glob) vengono espansi dalla SHELL prima di eseguire il comando: * sostituisce qualsiasi sequenza di caratteri, ? un carattere solo. "ls *.txt" diventa "ls a.txt b.txt c.txt".',
    'Attenzione: non sono espressioni regolari. E con rm sono pericolosi: lancia prima ls con lo stesso modello.',
  ],
  examples: [['ls missioni/*.txt', 'tutti i .txt di una cartella'], ['wc -l caso/* ', 'conta le righe di ogni file di una cartella']],
  see: ['ls', 'find', 'rm'],
});

// ---------------------------------------------------------------- gioco

doc('flag', { cat: 'Gioco', description: ['Comando del gioco: nelle gare CTF ("Capture The Flag") si cercano codici segreti nel formato NC{...}. Con flag RISPOSTA invii la risposta a una domanda della missione.'], game: true });
doc('hint', { cat: 'Gioco', description: ['Comando del gioco: mostra il suggerimento successivo per l\'obiettivo in corso (e nelle Simulazioni dimezza i punti).'], game: true });
doc('report', { cat: 'Gioco', description: ['Comando del gioco: nelle Operazioni registra un problema trovato. Sii preciso: percorso completo, nome utente, indirizzo IP o impostazione.'], game: true });

// ---------------------------------------------------------------- approfondimenti (schede di studio)

doc('ssh', {
  synopsis: 'ssh [-p PORTA] [-i CHIAVE] [UTENTE@]HOST',
  description: [
    '"Secure Shell": apre un terminale su un altro computer attraverso una connessione cifrata. È il modo in cui si amministrano quasi tutti i server del mondo: non ci si siede davanti al server, ci si collega con ssh.',
    'Dopo il collegamento il prompt cambia e mostra utente e nome del server: da quel momento ogni comando viene eseguito LÀ, non sul tuo computer. Con "exit" chiudi la connessione e torni al tuo deck.',
    'Se non indichi l\'utente, ssh usa il tuo nome utente locale. Il server ascolta di solito sulla porta 22.',
    'Ci si autentica in due modi: con la password dell\'utente sul server, oppure con una coppia di chiavi (vedi ssh-keygen). Le chiavi sono più sicure: non si possono indovinare a tentativi e la parte privata non viaggia mai in rete.',
    'Al primo collegamento ssh mostra l\'impronta (fingerprint) del server e chiede conferma: la salva in ~/.ssh/known_hosts. Se un giorno l\'impronta cambia, ssh avvisa con un messaggio allarmante: o il server è stato reinstallato, o qualcuno si è messo in mezzo. Non va mai ignorato.',
  ],
  options: [
    ['-p PORTA', 'collegati a una porta diversa dalla 22'],
    ['-i CHIAVE', 'usa questo file di chiave privata invece di quella predefinita'],
    ['-l UTENTE', 'l\'utente con cui entrare (equivale a scrivere UTENTE@HOST)'],
    ['-v', '"verbose": mostra i passaggi del collegamento, utile per capire perché fallisce'],
  ],
  examples: [
    ['ssh audit@market.lan', 'collegati come utente audit (nelle Operazioni)'],
    ['ssh -p 22 studente@lab.lan', 'lo stesso, indicando la porta in modo esplicito'],
    ['ssh -l studente lab.lan', 'l\'utente indicato con -l invece che con la @'],
  ],
  notes: [
    'Preferisci SEMPRE le chiavi alle password, e disattiva il login diretto di root (PermitRootLogin no) nel file /etc/ssh/sshd_config.',
    '"Connection refused" = sul server nessuno ascolta su quella porta. "Permission denied" = il server c\'è, ma utente, password o chiave sono sbagliati. "Connection timed out" = un firewall scarta i pacchetti o l\'host è spento.',
    'Collegarsi a un sistema senza autorizzazione è reato (art. 615-ter c.p.), anche se la password era banale o scritta su un foglietto.',
  ],
  see: ['ssh-keygen', 'exit', 'nmap'],
});

doc('ssh-keygen', {
  synopsis: 'ssh-keygen [-t TIPO] [-C COMMENTO]',
  description: [
    'Crea una coppia di chiavi per entrare nei server senza password. Le due chiavi sono legate matematicamente: ciò che viene verificato con la pubblica può essere prodotto solo da chi possiede la privata.',
    'La chiave PRIVATA (~/.ssh/id_ed25519) resta sul tuo computer, non si copia e non si invia a nessuno: chi la ottiene entra al posto tuo. Deve avere permessi 600 (rw-------), altrimenti ssh si rifiuta di usarla.',
    'La chiave PUBBLICA (~/.ssh/id_ed25519.pub) si può dare a chiunque: va aggiunta sul server nel file ~/.ssh/authorized_keys dell\'utente con cui vuoi entrare.',
    'Nel vero Linux il comando chiede anche una "passphrase": una password che protegge il file della chiave privata, nel caso ti rubino il computer.',
  ],
  options: [
    ['-t TIPO', 'algoritmo della chiave: ed25519 (consigliato, moderno) oppure rsa'],
    ['-C COMMENTO', 'un\'etichetta per riconoscere la chiave, di solito nome e computer'],
    ['-b BIT', 'lunghezza della chiave (per rsa almeno 3072)'],
  ],
  examples: [['ssh-keygen', 'genera la coppia di chiavi'], ['ssh-keygen -t ed25519 -C "deck di lavoro"', 'sceglie l\'algoritmo e aggiunge un\'etichetta']],
  notes: [
    'In un\'indagine, una riga sconosciuta in authorized_keys è una persistenza: qualcuno si è lasciato una porta per rientrare anche dopo il cambio delle password.',
    'Non riusare la stessa chiave privata su più computer: se uno viene compromesso, li revochi uno per uno.',
  ],
  see: ['ssh', 'chmod'],
});

doc('whois', {
  synopsis: 'whois DOMINIO',
  description: [
    'Interroga i registri pubblici dei domini. Ogni dominio viene registrato presso un "registrar", e alcune informazioni sulla registrazione sono consultabili da chiunque.',
    'Cosa leggere nella risposta: Registrar (presso chi è registrato), Creation Date (un dominio creato pochi giorni fa che imita una banca è quasi sempre phishing), Expiry Date (un dominio scaduto può essere ricomprato da altri), Name Server (chi gestisce il DNS), e i contatti Registrant / Admin / Tech.',
    'Con il GDPR i dati delle persone sono quasi sempre oscurati ("REDACTED"); quelli delle aziende spesso no, e rivelano nomi, email e formati degli indirizzi.',
    'È ricognizione PASSIVA: interroghi un registro pubblico, non i sistemi del bersaglio, che non può accorgersene.',
  ],
  examples: [['whois neonottica.nc', 'chi ha registrato il dominio'], ['whois neonottica.nc | grep -i email', 'solo le righe con gli indirizzi email']],
  notes: ['Difesa: usa un indirizzo di ruolo (es. dominio@azienda) e non quello personale di un dipendente, e attiva il rinnovo automatico del dominio.'],
  see: ['dig', 'crtsh'],
});

doc('exiftool', {
  synopsis: 'exiftool FILE',
  description: [
    'Legge i metadati di un file: informazioni che non vedi aprendo il documento ma che viaggiano insieme a lui.',
    'Nei documenti (PDF, Word) trovi autore, nome utente, software e versione usati, date di creazione e modifica, a volte percorsi interni di rete. Nelle foto trovi modello della fotocamera, data e spesso le coordinate GPS dello scatto.',
    'Per chi difende sono informazioni da non regalare: il nome utente rivela il formato degli account, la versione del software dice quali vulnerabilità cercare, un percorso come \\\\server\\cartella rivela nomi di macchine interne.',
    'Nelle indagini servono al contrario: date e autore aiutano a ricostruire chi ha prodotto un file e quando (ma si possono falsificare, quindi sono un indizio e non una prova).',
  ],
  examples: [['exiftool osint/catalogo_2077.pdf', 'cosa rivela un catalogo pubblico'], ['exiftool osint/catalogo_2077.pdf | grep -i author', 'solo l\'autore']],
  notes: ['Prima di pubblicare un documento i metadati vanno rimossi. Nel vero exiftool: exiftool -all= FILE li cancella tutti.'],
  see: ['file', 'strings'],
});

doc('crtsh', {
  synopsis: 'crtsh DOMINIO',
  description: [
    'Cerca i certificati HTTPS rilasciati per un dominio, come fa il sito crt.sh.',
    'Perché esiste: ogni volta che un\'autorità emette un certificato deve scriverlo in registri pubblici e non modificabili, la "Certificate Transparency". Serve a scoprire certificati emessi per errore o con l\'inganno.',
    'Effetto collaterale: chiunque può leggere l\'elenco di tutti i nomi per cui un\'azienda ha chiesto un certificato, compresi sottodomini di test, vecchi o dimenticati (dev, staging, old, vpn...). Sono spesso i meno aggiornati e quindi i più deboli.',
    'È ricognizione passiva: non tocchi i sistemi dell\'azienda. Guarda le date: un certificato vecchio e mai rinnovato indica un servizio abbandonato.',
  ],
  examples: [['crtsh neonottica.nc', 'tutti i nomi con un certificato'], ['crtsh neonottica.nc | grep -i old', 'cerca i nomi che sanno di dimenticato']],
  notes: ['Difesa: fai tu per primo questa ricerca sul tuo dominio, e spegni ciò che non serve più.'],
  see: ['dig', 'whois'],
});

doc('cve', {
  synopsis: 'cve PRODOTTO VERSIONE',
  description: [
    'Cerca nel database (simulato) delle vulnerabilità note.',
    'CVE sta per "Common Vulnerabilities and Exposures": ogni vulnerabilità pubblica riceve un identificativo unico, nella forma CVE-ANNO-NUMERO, così tutti parlano della stessa cosa.',
    'Il punteggio CVSS misura la gravità da 0 a 10: 0.1-3.9 bassa, 4.0-6.9 media, 7.0-8.9 alta, 9.0-10 critica. Conta anche il contesto: una vulnerabilità critica su un server esposto a Internet viene prima della stessa vulnerabilità su una macchina isolata.',
    'Il metodo è sempre lo stesso: scopri prodotto e versione (banner, nmap -sV, intestazioni HTTP), poi cerchi se quella versione ha vulnerabilità note. Nel mondo reale si usano nvd.nist.gov e gli avvisi del produttore.',
  ],
  notes: ['Difesa: la cura quasi sempre è aggiornare. Un inventario di cosa hai installato e in quale versione vale più di qualsiasi scanner.'],
  see: ['nmap', 'apt'],
});

doc('nano', {
  synopsis: 'nano FILE',
  description: [
    'Editor di testo semplice, presente su quasi tutti i Linux: serve a modificare un file senza uscire dal terminale. È il modo normale di cambiare una configurazione su un server.',
    'Nel vero nano i comandi sono elencati in basso: ^ significa il tasto Ctrl. Ctrl+O salva ("write Out"), Ctrl+X esce, Ctrl+W cerca una parola, Ctrl+K taglia la riga. In questo deck usi i pulsanti Salva ed Esci.',
    'Se il file non esiste viene creato al salvataggio. Se non hai il permesso di scrittura, il salvataggio fallisce: per i file di sistema serve sudo.',
    'Dopo aver modificato la configurazione di un servizio, la modifica vale solo quando il servizio viene riavviato o ricaricato (systemctl restart NOME).',
  ],
  notes: [
    'Prima di toccare un file di configurazione fanne una copia (cp file file.bak): se sbagli, torni indietro in un secondo.',
    'L\'altro editor che troverai ovunque è vi/vim. Se ci finisci dentro per sbaglio: premi Esc, scrivi :q! e Invio per uscire senza salvare.',
  ],
  see: ['cat', 'echo', 'cp'],
});
