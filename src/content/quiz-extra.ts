// Domande di verifica aggiunte (1.16) alle missioni che ne avevano poche.
// Vanno dopo l'ultima verifica della missione; alimentano anche la verifica di fine
// capitolo, il ripasso lampo, l'Allenamento e gli esami. La risposta giusta è scritta
// per prima: le opzioni vengono mescolate al caricamento del corso.

import type { Chapter, QuizStep } from '../game/types';

export const QUIZ_VER = 16;

type Q = [question: string, right: string, wrong: [string, string, string], explain: string];

const X: Record<string, Q[]> = {
  'ch01-m1': [
    ['Che differenza c\'è tra il **terminale** e la **shell**?', 'Il terminale è la finestra in cui scrivi; la shell (bash) è il programma che esegue i comandi', ['Sono due nomi della stessa cosa', 'La shell è la finestra, il terminale è il programma', 'Il terminale serve solo agli amministratori'], 'Il terminale mostra testo e raccoglie quello che scrivi; la shell lo interpreta ed esegue. Su Linux la shell più comune è **bash**.'],
    ['Quale comando ti dice con quale utente stai lavorando?', '`whoami`', ['`hostname`', '`help`', '`pwd`'], '`whoami` ("chi sono io") stampa il nome utente; `hostname` il nome del computer; `pwd` la cartella in cui sei.'],
    ['Perché chi lavora in sicurezza deve conoscere Linux?', 'Perché gira sulla maggior parte dei server e degli strumenti di sicurezza', ['Perché Windows non ha un terminale', 'Perché è l\'unico sistema senza virus', 'Perché è obbligatorio per legge'], 'I server di Internet, i dispositivi di rete e quasi tutti gli strumenti del mestiere girano su Linux: lo incontrerai sia da difendere sia da usare.'],
  ],
  'ch05-m1': [
    ['Quale riga crea correttamente una variabile?', '`IP=10.0.0.5`', ['`IP = 10.0.0.5`', '`$IP=10.0.0.5`', '`set IP 10.0.0.5`'], 'Niente spazi attorno a `=` e niente `$` quando la crei: il `$` serve solo per **leggerla** (`echo $IP`).'],
    ['Cosa fa `2>/dev/null` alla fine di un comando?', 'Butta via i messaggi di errore, lasciando l\'output normale', ['Salva l\'output in un file chiamato null', 'Esegue il comando due volte', 'Cancella il file di input'], '`2>` reindirizza lo **stderr** (i messaggi di errore); `/dev/null` è il "buco nero" di Linux. Utile con find, per non vedere i "Permission denied".'],
    ['Cosa stampa `echo "Oggi è $(date)"`?', 'La frase con dentro l\'output del comando date', ['Letteralmente $(date)', 'Un errore: date non è una variabile', 'Solo la data, senza la frase'], '`$(comando)` è la **sostituzione di comando**: la shell esegue il comando e mette il suo output in quel punto.'],
  ],
  'ch05-m2': [
    ['A cosa serve la prima riga `#!/bin/bash` di uno script?', 'Dice al sistema quale programma deve eseguire lo script', ['È un commento senza effetto', 'Rende lo script eseguibile', 'Cancella lo schermo prima di partire'], 'Si chiama **shebang**. Senza, il sistema non sa se il file è bash, Python o altro. Per renderlo eseguibile serve comunque `chmod +x`.'],
    ['Lanci `./controlla.sh 10.0.0.5 22`. Dentro lo script, cosa contiene `$2`?', '22', ['10.0.0.5', 'controlla.sh', '2'], '`$1` è il primo argomento, `$2` il secondo, `$#` quanti sono. `$0` è il nome dello script.'],
  ],
  'ch05-m3': [
    ['Cosa fa `for f in caso/*; do wc -l $f; done`?', 'Conta le righe di ogni file della cartella caso, uno alla volta', ['Conta i file della cartella caso', 'Cancella i file della cartella caso', 'Stampa solo il primo file'], 'Il ciclo ripete i comandi tra `do` e `done` per ogni elemento della lista; `caso/*` è l\'elenco dei file della cartella.'],
    ['In una condizione, cosa verifica `[ -f rapporto.txt ]`?', 'Che rapporto.txt esista e sia un file', ['Che rapporto.txt sia vuoto', 'Che rapporto.txt sia una cartella', 'Che rapporto.txt sia eseguibile'], '`-f` = esiste ed è un file; `-d` = esiste ed è una cartella. Per i numeri: `-gt` maggiore, `-lt` minore, `-eq` uguale.'],
  ],
  'ch06-m1': [
    ['Quale affermazione sulla cifratura **asimmetrica** è corretta?', 'Usa due chiavi: quella pubblica si può dare a tutti, quella privata resta segreta', ['Usa una sola chiave condivisa tra le due parti', 'Non ha bisogno di chiavi', 'È più veloce di quella simmetrica'], 'Ciò che si cifra con la chiave pubblica si apre solo con la privata. È più lenta della simmetrica: per questo TLS la usa solo per accordarsi su una chiave simmetrica.'],
    ['Il lucchetto nel browser (HTTPS) cosa garantisce?', 'Che la connessione con quel sito è cifrata', ['Che il sito è onesto e sicuro', 'Che il sito non contiene virus', 'Che i tuoi dati non verranno salvati'], 'Anche un sito di phishing può avere il lucchetto. HTTPS protegge il **viaggio** dei dati, non dice nulla sulle intenzioni di chi li riceve.'],
    ['Qual è la differenza tra codifica e cifratura?', 'La codifica cambia solo il formato e chiunque la inverte; la cifratura richiede una chiave segreta', ['Sono sinonimi', 'La codifica è più sicura della cifratura', 'La cifratura non si può invertire'], 'Base64 è una codifica: nessun segreto. AES è cifratura: senza chiave, niente testo. L\'hash invece non si inverte affatto.'],
  ],
  'ch06-m2': [
    ['Cambi una sola lettera in un file. Cosa succede al suo SHA-256?', 'Cambia completamente: è l\'effetto valanga', ['Cambia solo l\'ultimo carattere', 'Resta uguale se il file ha la stessa dimensione', 'Diventa più lungo'], 'Una modifica minima produce un\'impronta del tutto diversa. Per questo l\'hash rivela qualsiasi alterazione di un file.'],
    ['Perché MD5 non va più usato per verificare l\'integrità?', 'Perché si possono creare due file diversi con la stessa impronta (collisioni)', ['Perché è troppo lento', 'Perché produce impronte troppo lunghe', 'Perché funziona solo su Windows'], 'MD5 e SHA-1 sono "rotti": un attaccante può costruire un file malevolo con la stessa impronta di uno buono. Si usa SHA-256.'],
  ],
  'chPY-m1': [
    ['Come si legge un traceback di Python?', 'Dal basso: l\'ultima riga dice il tipo di errore, quelle sopra dove è successo', ['Dall\'alto: la prima riga è l\'errore', 'Non si legge: si rilancia lo script', 'Conta solo il numero di riga'], 'L\'ultima riga contiene tipo e motivo (`NameError: ...`); appena sopra c\'è il file e il numero di riga colpevole.'],
    ['Cosa stampa `print(f"Porta {p}")` se `p = 22`?', 'Porta 22', ['Porta {p}', 'Porta p', 'Un errore'], 'La `f` davanti alle virgolette crea una **f-string**: quello tra graffe viene sostituito con il valore.'],
  ],
  'chPY-m3': [
    ['Cosa restituisce `"root 203.0.113.7 fallito".split()`?', 'Una lista di tre parole: ["root", "203.0.113.7", "fallito"]', ['La stringa senza spazi', 'Il numero 3', 'Solo la prima parola'], '`split()` spezza una stringa agli spazi e restituisce una lista: `parti[1]` sarebbe l\'IP.'],
    ['A cosa serve `Counter` in uno script che analizza un log?', 'A contare quante volte compare ogni valore, e a fare la classifica con most_common', ['A numerare le righe del file', 'A misurare il tempo di esecuzione', 'A contare i file di una cartella'], 'È l\'equivalente Python di `sort | uniq -c | sort -rn`: `Counter(lista).most_common(3)` dà i tre valori più frequenti.'],
  ],
  'chPY-m4': [
    ['A cosa serve `try: ... except FileNotFoundError:`?', 'A gestire un errore previsto senza far fermare lo script', ['A cercare un file in tutto il disco', 'A creare il file se non esiste', 'A nascondere tutti gli errori'], 'Se il file manca, invece di interrompersi lo script esegue il blocco `except` (per esempio stampa "non trovato") e continua.'],
    ['Cosa fa `json.load(f)`?', 'Trasforma il contenuto JSON di un file in liste e dizionari Python', ['Salva un dizionario in un file', 'Controlla che il file non sia vuoto', 'Scarica un file da Internet'], 'Le configurazioni cloud e moltissimi log sono in JSON: con `json.load` diventano strutture su cui fare cicli e controlli.'],
  ],
  'ch07-m1': [
    ['Nell\'URL `http://jukebox.lan/playlist.php?id=3` quale parte è scelta dall\'utente e va trattata con sospetto?', '`id=3`, il parametro dopo il punto interrogativo', ['`http://`', '`jukebox.lan`', '`playlist.php`'], 'I parametri sono dati che arrivano dall\'esterno: è lì che un attaccante prova a infilare valori inattesi.'],
    ['Un server risponde `500`. Cosa significa?', 'Il server è andato in errore mentre elaborava la richiesta', ['La pagina non esiste', 'Non hai il permesso', 'Tutto bene'], '2xx = ok, 3xx = reindirizzamento, 4xx = errore di chi chiede (404 non trovato, 403 vietato), 5xx = errore del server.'],
    ['Perché l\'intestazione `Server: Apache/2.4.29` è un problema?', 'Rivela software e versione: un attaccante cerca subito le vulnerabilità note', ['Rallenta il sito', 'Impedisce l\'uso di HTTPS', 'Non è un problema: è obbligatoria'], 'Si chiama *information disclosure*. Non è una falla da sola, ma regala all\'attaccante la prima informazione che cerca.'],
  ],
  'ch07-m2': [
    ['Cosa contiene `robots.txt`?', 'Indicazioni per i motori di ricerca, leggibili da chiunque', ['Le password del sito', 'L\'elenco degli utenti', 'Il codice sorgente'], 'Dice ai motori di ricerca cosa non indicizzare. Non protegge niente: anzi, elenca proprio i percorsi "da nascondere".'],
    ['Un commento `<!-- password di test: admin123 -->` nell\'HTML di una pagina è...', 'Visibile a chiunque guardi il codice della pagina', ['Invisibile: i commenti non lasciano il server', 'Visibile solo agli amministratori', 'Cifrato dal browser'], 'Il browser non mostra i commenti, ma li riceve: basta "Visualizza sorgente" o `curl`.'],
  ],
  'ch07-m3': [
    ['In `access.log` vedi decine di richieste in pochi secondi a `/admin`, `/backup.zip`, `/.git/` con risposta 404, dallo stesso IP. Cos\'è?', 'Uno scanner automatico che cerca percorsi noti', ['Un utente che ha sbagliato indirizzo', 'Un guasto del server', 'Il motore di ricerca che indicizza il sito'], 'Tanti 404 su percorsi "classici" in poco tempo sono la firma di uno scanner.'],
    ['Cosa prova a fare una richiesta a `/foto?file=../../etc/passwd`?', 'Uscire dalla cartella prevista per leggere un file di sistema (path traversal)', ['Caricare una foto molto grande', 'Cancellare il file passwd', 'Cambiare la password di un utente'], '`../` risale di una cartella. La difesa: accettare solo nomi da una lista, mai percorsi costruiti con i dati dell\'utente.'],
    ['Qual è la difesa principale contro l\'XSS?', 'Trasformare i caratteri speciali quando si mostrano dati dell\'utente (output encoding)', ['Usare password più lunghe', 'Cifrare il database', 'Bloccare tutti gli indirizzi stranieri'], 'Con l\'output encoding `<script>` viene mostrato come testo invece di essere eseguito. Una CSP aggiunge un secondo strato.'],
  ],
  'ch07-m5': [
    ['Cambiando `ordine.php?id=1038` in `id=1037` vedi l\'ordine di un altro cliente. Come si chiama?', 'IDOR: manca il controllo che l\'ordine appartenga a chi lo chiede', ['SQL injection', 'XSS', 'Phishing'], 'È un caso di *Broken Access Control* (A01 nella OWASP Top 10): il server si fida del numero invece di verificare il proprietario.'],
    ['Quale elenco descrive bene una segnalazione in un report?', 'Titolo, gravità, descrizione, impatto, raccomandazione', ['Solo il comando usato', 'Nome del cliente e data', 'Un giudizio sugli sviluppatori'], 'Chi legge deve capire cosa c\'è, quanto è grave, cosa rischia e come si corregge. Nessun giudizio sulle persone.'],
  ],
  'ch08-m1': [
    ['Cosa fa un SIEM?', 'Raccoglie i log di tutti i sistemi, li mette nello stesso formato, li collega e genera allarmi', ['Blocca i virus sui computer', 'Fa i backup dei server', 'Sostituisce il firewall'], 'SIEM = raccolta + normalizzazione + correlazione + allarmi. È lo strumento centrale di un SOC.'],
    ['Di cosa è fatta una regola di rilevamento?', 'Una condizione, una soglia e una finestra di tempo', ['Un elenco di password vietate', 'Un indirizzo IP da bloccare', 'Un antivirus aggiornato'], 'Esempio: "più di 10 accessi falliti (condizione e soglia) in 5 minuti (finestra)" → allarme.'],
  ],
  'ch08-m3': [
    ['Cos\'è un IOC?', 'Una traccia riconoscibile di un attacco: un hash, un dominio, un IP, un nome di file', ['Un tipo di firewall', 'Un programma antivirus', 'Un livello del SOC'], '*Indicator of Compromise*. Gli IOC si condividono (threat intelligence) perché altri possano cercarli nei propri sistemi.'],
    ['Qual è la differenza tra threat hunting e gestione degli allarmi?', 'Nel threat hunting cerchi attivamente un attacco partendo da un\'ipotesi, senza aspettare un allarme', ['Sono la stessa cosa', 'Il threat hunting si fa solo dopo un incidente', 'Gli allarmi li gestisce il L3, il threat hunting il L1'], 'Le regole vedono solo ciò che è stato previsto. La caccia serve a trovare ciò che è sfuggito (i falsi negativi).'],
  ],
  'ch09-m1': [
    ['Cosa fa il protocollo ARP?', 'Trova l\'indirizzo MAC che corrisponde a un indirizzo IP nella rete locale', ['Traduce i nomi dei siti in IP', 'Cifra il traffico', 'Assegna gli indirizzi IP ai dispositivi'], 'Per parlare con un dispositivo della stessa rete serve il suo MAC. ARP lo chiede a tutti: e non verifica chi risponde, da cui l\'ARP spoofing.'],
    ['Cosa vuol dire "incapsulamento"?', 'Ogni livello avvolge i dati del livello superiore: HTTP dentro TCP, dentro IP, dentro Ethernet', ['Cifrare i dati con più chiavi', 'Dividere un file in pacchetti uguali', 'Nascondere un file in un altro'], 'Come buste una dentro l\'altra: ogni livello aggiunge le sue informazioni (porte, indirizzi IP, indirizzi MAC).'],
  ],
  'ch09-m2': [
    ['Quanti indirizzi utilizzabili ci sono in una rete `/24`?', '254', ['256', '24', '1024'], '32 − 24 = 8 bit per gli host: 2⁸ = 256 indirizzi, meno 2 (la rete e il broadcast) = 254.'],
    ['In `192.168.1.0/24`, a cosa serve l\'indirizzo `192.168.1.255`?', 'È il broadcast: un messaggio lì arriva a tutti i dispositivi della rete', ['È il gateway', 'È il primo indirizzo assegnabile', 'È riservato al server DNS'], 'Il primo indirizzo identifica la rete, l\'ultimo è il broadcast: nessuno dei due si assegna a un dispositivo.'],
  ],
  'ch09-m3': [
    ['In una cattura, cosa indicano in sequenza `[S]`, `[S.]`, `[.]`?', 'L\'apertura di una connessione TCP: SYN, SYN-ACK, ACK', ['La chiusura di una connessione', 'Un pacchetto perso e ritrasmesso', 'Un attacco in corso'], 'È la "stretta di mano a tre vie" (*three-way handshake*) con cui inizia ogni connessione TCP.'],
    ['Perché telnet e FTP sono pericolosi su una rete condivisa?', 'Trasmettono tutto in chiaro, password comprese: chi intercetta legge', ['Sono lenti', 'Usano troppe porte', 'Non funzionano con il Wi-Fi'], 'Sono protocolli nati senza cifratura. Si sostituiscono con SSH e SFTP.'],
  ],
  'ch09-m4': [
    ['Delle due chiavi SSH, quale si copia sul server?', 'La pubblica (.pub), nel file authorized_keys', ['La privata', 'Entrambe', 'Nessuna: il server le genera da solo'], 'La privata non lascia mai il tuo computer (permessi 600). La pubblica si può dare a chiunque.'],
    ['Cosa contiene il file `known_hosts`?', 'Le impronte dei server a cui ti sei già collegato', ['Le tue password', 'Gli utenti ammessi sul server', 'L\'elenco delle porte aperte'], 'Se l\'impronta di un server cambia, SSH ti avvisa: potrebbe esserci qualcuno in mezzo (*man in the middle*).'],
  ],
  'ch10-m1': [
    ['Cosa distingue la ricognizione **passiva** da quella attiva?', 'La passiva usa solo fonti pubbliche, senza toccare i sistemi del bersaglio', ['La passiva si fa di notte', 'La passiva non richiede autorizzazione scritta in nessun caso', 'Non c\'è differenza'], 'Whois, DNS pubblico, motori di ricerca: passiva. Una scansione con nmap: attiva, e richiede sempre autorizzazione.'],
    ['Cosa ti dice `whois dominio`?', 'Chi ha registrato il dominio, quando, con quale registrar e quando scade', ['Le password del sito', 'Le porte aperte del server', 'Gli utenti collegati'], 'Un dominio registrato da pochi giorni e simile a uno famoso è un classico indizio di phishing.'],
  ],
  'ch10-m2': [
    ['A cosa serve un record **MX** nel DNS?', 'Indica quali server ricevono la posta di quel dominio', ['Indica l\'indirizzo IP del sito', 'Contiene le password', 'Elenca i sottodomini'], 'A = indirizzo IP, MX = posta, TXT = testo (per esempio SPF), NS = i server DNS del dominio.'],
    ['Perché i log di certificate transparency interessano a chi fa ricognizione?', 'Elencano pubblicamente tutti i certificati emessi, rivelando sottodomini dimenticati', ['Contengono le chiavi private dei siti', 'Mostrano chi visita un sito', 'Permettono di spegnere un sito'], 'Ogni certificato HTTPS finisce in registri pubblici: `dev-old.azienda.it` salta fuori anche se nessuno lo ricorda (shadow IT).'],
  ],
  'ch10-m3': [
    ['Quali informazioni possono nascondersi nei metadati di un documento pubblicato?', 'Autore, programma usato, date, percorsi di rete, a volte la posizione GPS', ['Solo il numero di pagine', 'La password del file', 'Niente: i metadati non lasciano il computer'], 'Si leggono con `exiftool`. Un nome utente o un percorso interno aiutano chi prepara un attacco.'],
    ['Cos\'è l\'"effetto mosaico"?', 'Tante informazioni innocue che, messe insieme, diventano pericolose', ['Un tipo di cifratura', 'Un errore di stampa nei PDF', 'Una tecnica di backup'], 'Un nome qui, un formato email là, una foto dell\'ufficio: nessun pezzo è grave, il quadro completo sì.'],
  ],
  'ch10-m4': [
    ['Cos\'è una CVE?', 'L\'identificativo pubblico e unico di una vulnerabilità nota', ['Un programma antivirus', 'Un tipo di attacco', 'Una certificazione'], 'Forma: CVE-ANNO-NUMERO. Permette a tutti di parlare della stessa vulnerabilità senza ambiguità.'],
    ['Cosa aggiunge il catalogo KEV al punteggio CVSS?', 'Dice quali vulnerabilità vengono sfruttate davvero, adesso', ['Dice quanto costa correggerle', 'Elenca solo quelle di Windows', 'Sostituisce il CVSS'], 'CVSS misura la gravità teorica; KEV (*Known Exploited Vulnerabilities*) l\'uso reale da parte degli attaccanti.'],
  ],
  'ch11-m2': [
    ['Cosa mostra `sudo -l`?', 'I comandi che il tuo utente può eseguire come amministratore', ['L\'elenco di tutti gli utenti', 'Gli ultimi accessi', 'I file di log di sudo'], 'È il primo controllo in un audit dei privilegi: una regola troppo larga equivale a dare root.'],
    ['Perché un programma con il bit SUID di proprietà di root va controllato?', 'Chiunque lo esegue lo fa con i permessi di root', ['Perché occupa più spazio', 'Perché non si può cancellare', 'Perché rallenta il sistema'], 'SUID = il programma gira con i permessi del proprietario. Se quel programma permette di aprire una shell o leggere file, è una porta verso root.'],
  ],
  'ch11-m3': [
    ['Un servizio è in ascolto su `127.0.0.1:5432`. Chi può raggiungerlo?', 'Solo i programmi sullo stesso server', ['Chiunque su Internet', 'Tutta la rete locale', 'Nessuno'], '`127.0.0.1` è "questa macchina". `0.0.0.0` invece vuol dire tutte le schede di rete.'],
    ['Qual è il primo principio dell\'hardening?', 'Togliere o spegnere tutto ciò che non serve', ['Installare più antivirus', 'Cambiare le password ogni settimana', 'Nascondere il server'], 'Ogni servizio acceso è superficie d\'attacco. Quello che resta si configura bene e si tiene aggiornato.'],
  ],
  'ch11-m4': [
    ['Cos\'è il movimento laterale?', 'Usare una macchina già violata per raggiungerne altre nella stessa rete', ['Spostare un server in un\'altra stanza', 'Cambiare IP durante un attacco', 'Copiare i file su una chiavetta'], 'Il primo PC violato è raramente l\'obiettivo: da lì l\'attaccante cerca credenziali e sistemi più importanti.'],
    ['Cosa dice la regola del backup 3-2-1?', 'Tre copie, su due supporti diversi, una fuori sede', ['Tre backup al giorno', 'Un backup ogni tre settimane', 'Tre password per due utenti'], 'E almeno una copia scollegata dalla rete: un ransomware cifra anche i backup che riesce a raggiungere.'],
  ],
  'chPT-m2': [
    ['Cos\'è il "directory listing"?', 'Il server mostra l\'elenco dei file di una cartella a chiunque', ['Un comando di Linux', 'Un tipo di backup', 'L\'indice di un sito'], 'È una configurazione sbagliata: rivela file che nessuno doveva vedere, come copie di backup con password.'],
    ['Perché durante un pentest si tiene un diario con gli orari?', 'Per dimostrare cosa hai fatto e quando, e distinguerlo da un attacco vero', ['Per calcolare la paga', 'Perché lo chiede nmap', 'Per ricordare le password'], 'Se nello stesso periodo succede qualcosa di strano, il cliente deve poter capire cosa eri tu e cosa no.'],
  ],
  'chPT-m3': [
    ['Cosa vuol dire "prova minima" in un pentest?', 'Dimostrare che la vulnerabilità esiste con il minimo impatto, e poi fermarsi', ['Fare il minor numero di scansioni', 'Lavorare solo un\'ora', 'Usare un solo strumento'], 'Si prova l\'esistenza del problema, non quanto danno si può fare. Niente dati letti senza necessità, niente servizi bloccati.'],
    ['Trovi una password in un vecchio file e funziona anche su SSH. Qual è il problema di fondo?', 'Il riuso delle password: una fuga diventa un accesso', ['SSH è insicuro', 'Il file era troppo vecchio', 'La password era troppo lunga'], 'Password diverse per ogni servizio (con un password manager) e MFA spezzano questa catena.'],
  ],
  'chPT-m4': [
    ['A chi è rivolto l\'executive summary di un report?', 'Alla direzione: una pagina senza gergo, con rischi e azioni', ['Agli sviluppatori', 'Agli altri pentester', 'Agli attaccanti'], 'Chi decide il budget deve capire in due minuti quanto è grave e cosa fare.'],
    ['Cos\'è un retest?', 'Ripetere le stesse prove dopo le correzioni per verificare che abbiano funzionato', ['Un secondo pentest su un altro cliente', 'Un esame per pentester', 'Un backup del report'], 'Ogni problema viene segnato come risolto, parzialmente risolto o ancora aperto.'],
  ],
  'ch12-m1': [
    ['Su Windows, cos\'è il Registro di sistema?', 'Il database che contiene la configurazione di Windows e dei programmi', ['L\'elenco dei file cancellati', 'Il diario degli accessi', 'La cartella dei documenti'], 'Molti malware vi scrivono per ripartire a ogni accensione: è uno dei posti dove si cerca la persistenza.'],
    ['Qual è l\'equivalente PowerShell di `cat file`?', '`Get-Content file`', ['`Get-ChildItem file`', '`Select-String file`', '`Get-Process file`'], 'Get-Content = cat, Get-ChildItem = ls, Select-String = grep.'],
  ],
  'ch12-m2': [
    ['Perché il Domain Controller è il server più prezioso di un\'azienda Windows?', 'Gestisce tutti gli utenti, i computer e le regole del dominio', ['Contiene il sito web', 'È il più veloce', 'Fa i backup'], 'Chi controlla il Domain Controller controlla ogni account e ogni PC dell\'azienda.'],
    ['Cos\'è una GPO?', 'Una regola applicata automaticamente a gruppi di utenti o computer del dominio', ['Un tipo di password', 'Un programma antivirus', 'Un registro degli eventi'], '*Group Policy Object*: con una GPO si impone a tutti i PC, per esempio, la lunghezza minima delle password.'],
  ],
  'ch12-m3': [
    ['Quale Event ID indica un accesso **fallito**?', '4625', ['4624', '4720', '1102'], '4624 = riuscito, 4625 = fallito, 4720 = account creato, 1102 = registro cancellato.'],
    ['Perché i log vanno copiati su un server centrale?', 'Perché un attaccante che cancella il registro sul PC non può cancellare la copia', ['Per risparmiare spazio', 'Perché Windows non li conserva', 'Per leggerli più velocemente'], 'L\'evento 1102 (registro cancellato) è grave proprio perché qualcuno sta provando a nascondere le tracce.'],
  ],
  'chDF-m2': [
    ['Cosa sono i "magic bytes"?', 'I primi byte di un file, che ne rivelano il vero tipo qualunque sia l\'estensione', ['Una password nascosta', 'Byte cifrati', 'Un errore del disco'], 'Il comando `file` li legge: un `.pdf` che inizia con `MZ` è un programma di Windows travestito.'],
    ['A cosa serve `strings` su un file sospetto?', 'A estrarre i testi leggibili: indirizzi, domini, messaggi, senza eseguirlo', ['A cifrarlo', 'A cancellarlo in modo sicuro', 'A cambiargli estensione'], 'È analisi **statica**: si guarda dentro il file senza farlo partire.'],
  ],
  'chDF-m3': [
    ['Quale comando mostra le date di un file (modifica, cambio)?', '`stat`', ['`date`', '`wc`', '`file`'], '`stat` mostra dimensione, permessi e le date: la base per costruire una linea del tempo.'],
    ['Cos\'è il timestomping?', 'Falsificare le date di un file per nascondere quando è stato creato o modificato', ['Cancellare la cronologia dei comandi', 'Sincronizzare l\'orologio del server', 'Comprimere i log vecchi'], 'La data *Changed* è difficile da falsificare: se non torna con le altre, è un indizio.'],
  ],
  'chSJ-m1': [
    ['Cos\'è il processo joiner-mover-leaver?', 'La gestione degli accessi di chi entra, cambia ruolo o lascia l\'azienda', ['Un tipo di attacco', 'Un turno del SOC', 'Un metodo di backup'], 'Chi entra riceve gli accessi giusti, chi cambia ruolo perde quelli vecchi, chi esce li perde tutti il giorno stesso.'],
    ['Perché un account di servizio non si protegge con la MFA?', 'Perché lo usa un programma, che non può confermare un secondo fattore', ['Perché non ha password', 'Perché è meno importante', 'Perché è sempre disabilitato'], 'Si protegge con password lunghe gestite da un vault, privilegi minimi e accesso solo dalle macchine necessarie.'],
    ['Durante una revisione degli accessi, quale caso è il più urgente?', 'Un ex dipendente con l\'account ancora attivo', ['Un utente che non ha cambiato la foto', 'Un account con un nome lungo', 'Un utente attivo con la MFA'], 'È un accesso valido in mano a qualcuno che non lavora più lì, o a chi ne conosce la password.'],
  ],
  'chSJ-m2': [
    ['Che differenza c\'è tra un vulnerability assessment e un penetration test?', 'L\'assessment trova e ordina le vulnerabilità; il pentest prova anche a sfruttarle', ['Sono la stessa cosa', 'L\'assessment si fa senza autorizzazione', 'Il pentest usa solo strumenti automatici'], 'Entrambi richiedono autorizzazione. L\'assessment è più largo e meno profondo.'],
  ],
  'chSJ-m3': [
    ['Un account entra con successo subito dopo una serie di accessi falliti dallo stesso IP. Cosa concludi?', 'Con buona probabilità l\'account è stato violato', ['L\'utente ha ricordato la password', 'È un falso positivo sicuro', 'Il server è guasto'], 'Fallimenti su molti account e poi un successo dallo stesso indirizzo: lo schema di un attacco riuscito.'],
  ],
  'chSJ-m4': [
    ['Perché in una configurazione SSH sicura si mette `PasswordAuthentication no`?', 'Così si entra solo con le chiavi: niente password da indovinare', ['Per velocizzare il collegamento', 'Per permettere l\'accesso a root', 'Per disattivare SSH'], 'Uno scanner può provare milioni di password; non può indovinare una chiave privata.'],
  ],
  'ch13-m1': [
    ['Cosa significa IaaS?', 'Il fornitore dà le macchine virtuali; sistema operativo e programmi li gestisci tu', ['Un software già pronto da usare', 'Un tipo di firewall', 'Un servizio di posta'], 'IaaS = infrastruttura, PaaS = piattaforma già pronta per il tuo codice, SaaS = programma finito (posta, CRM).'],
    ['Cosa regola lo IAM in un ambiente cloud?', 'Chi può fare cosa su quale risorsa', ['La velocità della rete', 'Il costo mensile', 'Il colore dell\'interfaccia'], '*Identity and Access Management*. `"Principal": "*"` in una regola vuol dire "chiunque": quasi sempre un errore.'],
  ],
  'ch13-m2': [
    ['A cosa serve Wireshark?', 'Ad analizzare il traffico di rete in modo grafico', ['A scansionare le porte', 'A scrivere report', 'A cifrare i dischi'], 'È il fratello grafico di tcpdump: stessi pacchetti, con filtri e colori.'],
    ['A cosa serve Burp Suite?', 'A intercettare e modificare le richieste tra browser e sito, per analizzare le applicazioni web', ['A leggere i log di Windows', 'A fare backup', 'A calcolare gli hash'], 'È un proxy: si mette in mezzo e ti fa vedere (e cambiare) ogni richiesta. Lo strumento principale del web pentest.'],
    ['Hai un file sospetto e vuoi sapere se è già noto come malware. Cosa usi?', 'VirusTotal, cercando il suo hash', ['nmap', 'Wireshark', 'tcpdump'], 'Cercare l\'**hash** non rivela il file a nessuno; caricare il file sì. In azienda si cerca prima l\'hash.'],
  ],
  'ch13-m4': [
    ['Cos\'è il metodo STAR per i colloqui?', 'Raccontare un\'esperienza in quattro passi: Situazione, Compito, Azione, Risultato', ['Una certificazione', 'Un tipo di report', 'Un livello del SOC'], 'Serve a rispondere a domande come "raccontami di un problema che hai risolto" in modo chiaro e completo.'],
    ['Qual è il punto d\'ingresso più comune nel settore?', 'Analista SOC di primo livello (L1)', ['Responsabile della sicurezza', 'Pentester senior', 'Analista forense'], 'Dal SOC L1 (o da un ruolo IT come helpdesk o sistemista) ci si sposta poi verso le specializzazioni.'],
  ],
};

export function extraQuizCount(): number {
  return Object.values(X).reduce((n, l) => n + l.length, 0);
}

/** Aggiunge le domande dopo l'ultima verifica di ogni missione (o in fondo, se non ce ne sono). */
export function addExtraQuizzes(chapters: Chapter[]): void {
  for (const ch of chapters)
    for (const m of ch.missions) {
      const list = X[m.id];
      if (!list) continue;
      const steps: QuizStep[] = list.map(([question, right, wrong, explain]) => ({ kind: 'quiz', since: QUIZ_VER, title: 'Verifica', question, options: [right, ...wrong], correct: 0, explain }));
      const lastQuiz = m.steps.map((s) => s.kind).lastIndexOf('quiz');
      const lastTask = m.steps.map((s) => s.kind).lastIndexOf('task');
      const at = lastQuiz >= 0 ? lastQuiz + 1 : lastTask >= 0 ? lastTask + 1 : m.steps.length;
      m.steps.splice(at, 0, ...steps);
    }
}

/** Mescola le opzioni di ogni domanda in modo stabile (stesso ordine a ogni avvio). */
export function shuffleQuizOptions(chapters: Chapter[]): void {
  for (const ch of chapters)
    for (const m of ch.missions)
      for (const s of m.steps) {
        if (s.kind !== 'quiz') continue;
        let h = 2166136261;
        for (const c of m.id + s.question) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
        const rnd = () => {
          h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
          return h / 4294967296;
        };
        const order = s.options.map((_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(rnd() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
        s.correct = order.indexOf(s.correct);
        s.options = order.map((i) => s.options[i]);
      }
}
