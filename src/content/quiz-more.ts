// Domande aggiunte nella 1.28 alle missioni che ne avevano due o meno.
// Regole: chiedono solo ciò che la missione ha spiegato; le quattro opzioni hanno lunghezza
// simile (un test lo controlla); molte chiedono di ragionare (perché, cosa succede se) e non
// solo di ricordare. La risposta giusta è scritta per prima: l'ordine viene mescolato.

import type { Chapter, QuizStep } from '../game/types';

export const MORE_VER = 20;

type Q = [question: string, right: string, wrong: [string, string, string], explain: string];

const M: Record<string, Q[]> = {
  'ch01-m3': [
    ['Scrivi `cat ben` e premi TAB. Cosa succede?', 'Il nome si completa, se c\'è un solo file che inizia così', ['Il comando parte subito senza aspettare Invio', 'Il file ben viene creato vuoto', 'Compare l\'elenco di tutti i comandi'], 'TAB completa nomi di file e comandi. Se le possibilità sono più di una, un secondo TAB le elenca. Meno battute, meno errori di battitura.'],
    ['Un file nascosto (che inizia con un punto) è protetto da chi lo vuole leggere?', 'No: è solo meno visibile, chiunque può leggerlo', ['Sì: solo il proprietario può aprirlo', 'Sì: serve una password per vederlo', 'No: ma è cifrato e quindi illeggibile'], 'Il punto nasconde il file a un `ls` normale, ma non cambia i permessi: `ls -a` lo mostra e `cat` lo legge. Nascosto non vuol dire protetto.'],
  ],
  'ch01-m6': [
    ['Vuoi rinominare `bozza.txt` in `finale.txt`. Quale comando?', '`mv bozza.txt finale.txt`', ['`cp bozza.txt finale.txt`', '`rm bozza.txt finale.txt`', '`mkdir bozza.txt finale.txt`'], '`mv` sposta, e spostare un file con un nome nuovo nella stessa cartella vuol dire rinominarlo. `cp` lascerebbe anche l\'originale.'],
    ['Perché prima di modificare un file importante si fa una copia con `cp`?', 'Per poter tornare indietro se sbagli', ['Perché il file originale si blocca', 'Perché cp rende il file più leggero', 'Perché senza copia il file non si apre'], 'Su Linux non c\'è un tasto "annulla", e `rm` e `>` non chiedono conferma. Una copia è la tua rete di sicurezza.'],
  ],
  'ch01-m5': [
    ['Entri in un sistema che non conosci. Qual è il metodo giusto?', 'Leggi, esplori con ordine, guardi anche i nascosti', ['Cancelli i file inutili per fare spazio', 'Provi comandi a caso per vedere cosa fanno', 'Apri solo i file con il nome più strano'], 'Prima si guarda, poi si agisce. Cartella per cartella, con `ls -a`, leggendo le istruzioni: è lo stesso metodo di un\'indagine vera.'],
    ['Devi leggere `missioni/contratti/a/b/nota.txt`. Devi entrare in ogni cartella con `cd`?', 'No: puoi scrivere il percorso intero a cat', ['Sì: cat legge solo nella cartella attuale', 'Sì: altrimenti il file risulta nascosto', 'No: ma devi prima copiarlo nella home'], 'Un percorso indica la strada per arrivare al file: `cat missioni/contratti/a/b/nota.txt` funziona da dove sei, senza spostarti.'],
  ],
  'chF-m1': [
    ['Un sito di prenotazioni va giù per un attacco e per un giorno nessuno può prenotare. Quale proprietà è colpita?', 'Disponibilità', ['Riservatezza', 'Integrità', 'Non ripudio'], 'Il servizio non c\'è quando serve: è la disponibilità. Nessun dato è stato letto o cambiato.'],
    ['Perché un account "admin" condiviso da tutto l\'ufficio è un problema anche con una password robusta?', 'Nel log non si sa chi ha fatto cosa', ['La password si consuma se la usano in tanti', 'Gli account condivisi non possono avere MFA', 'Il sistema lo blocca dopo dieci utenti'], 'Il tracciamento registra "admin", non una persona: nessuno può essere chiamato a rispondere. Si perde il non ripudio.'],
  ],
  'chF-m4': [
    ['Un collega usa un\'app che genera codici, ma solo insieme alla password. Quanti fattori, e di che tipo?', 'Due: qualcosa che sa e qualcosa che ha', ['Uno solo: entrambi sono cose che sa', 'Due: qualcosa che sa e qualcosa che è', 'Tre: password, app e telefono'], 'La password è qualcosa che sai; il telefono con l\'app è qualcosa che hai. Due tipi diversi: è MFA.'],
    ['Un dipendente lascia l\'azienda venerdì. Quando va disattivato il suo account?', 'Il giorno stesso in cui se ne va', ['Dopo un mese, se nessuno lo usa', 'Solo se ha lasciato in modo conflittuale', 'Mai: potrebbe tornare a lavorare lì'], 'Un account di chi è uscito diventa un account orfano: nessuno lo sorveglia, ed è una porta perfetta.'],
  ],
  'ch02-m2': [
    ['`ping` verso un server risponde con `ttl=128`. Che indizio ti dà?', 'Probabilmente dall\'altra parte c\'è Windows', ['Il server è a 128 chilometri di distanza', 'La risposta ha impiegato 128 millisecondi', 'Ci sono 128 router lungo la strada'], 'Il TTL parte da un valore che dipende dal sistema: 64 di solito Linux, 128 Windows. Cala di uno a ogni router attraversato.'],
    ['Scrivi `ping jukebox.lan`. Chi traduce il nome in un indirizzo?', 'Il DNS', ['Il firewall', 'Il protocollo ICMP', 'La scheda di rete'], 'Il DNS è la rubrica: trasforma i nomi in indirizzi. Solo dopo, ping manda i suoi pacchetti ICMP all\'indirizzo trovato.'],
  ],
  'ch02-m3': [
    ['Una porta risulta `filtered`. Cosa significa?', 'Un firewall impedisce di sapere se è aperta', ['C\'è un servizio che risponde normalmente', 'Non c\'è nessun servizio in ascolto', 'Il servizio è stato spento da poco'], '`open` = risponde, `closed` = nessuno in ascolto, `filtered` = qualcosa (un firewall) blocca la domanda.'],
    ['Perché il report è considerato il vero prodotto di un pentest?', 'Il cliente paga per sapere cosa correggere', ['Perché la legge vieta di fare scansioni senza', 'Perché nmap non salva i risultati da solo', 'Perché gli attaccanti non scrivono report'], 'Trovare i problemi serve solo se il cliente li capisce e li corregge: problema, gravità e soluzione, scritti in modo chiaro.'],
  ],
  'ch02-m4': [
    ['`ip route` mostra `default via 192.168.1.1`. Cosa ti dice?', 'Che il gateway è 192.168.1.1', ['Che il tuo indirizzo è 192.168.1.1', 'Che il DNS è 192.168.1.1', 'Che 192.168.1.1 è spento'], 'La riga "default via" indica dove vanno i pacchetti diretti fuori dalla rete locale: il gateway predefinito.'],
    ['`traceroute` mostra `* * *` al terzo salto ma arriva a destinazione. È un guasto?', 'No: quel router non risponde alle sonde', ['Sì: il terzo router è spento', 'Sì: i pacchetti si sono persi lì', 'No: è la destinazione a non rispondere'], 'Alcuni router non rispondono ai pacchetti di prova ma lasciano passare il traffico. Se si arriva a destinazione, la strada funziona.'],
  ],
  'ch03-m3': [
    ['Un processo con il nome di un processo di sistema parte da `/tmp/.x/`. Perché insospettisce?', 'I programmi di sistema non stanno in /tmp', ['In /tmp i programmi non possono partire', 'I nomi con il punto sono vietati', 'Tutti i processi in /tmp sono lenti'], '/tmp è scrivibile da tutti e una cartella nascosta lì dentro è un nascondiglio classico. Un nome "di sistema" è un travestimento.'],
    ['Cosa fa `find ~ -name "*.bak"` che `ls` da solo non fa?', 'Cerca anche nelle sottocartelle', ['Cancella i file .bak trovati', 'Mostra solo i file più recenti', 'Funziona anche senza permessi'], '`find` scende in tutte le sottocartelle (anche nascoste) partendo da dove gli dici. `ls` guarda una cartella alla volta.'],
  ],
  'ch04-m1': [
    ['Vuoi vedere solo le 10 righe più recenti di un log. Quale comando?', '`tail -n 10 file.log`', ['`head -n 10 file.log`', '`cat -n 10 file.log`', '`wc -l 10 file.log`'], 'I log si scrivono in fondo: le righe più recenti sono le ultime. `tail` le mostra; `head` mostra le prime.'],
    ['Perché le aziende copiano i log su un altro sistema (il SIEM) in tempo reale?', 'Chi entra nel server non può cancellare la copia', ['Così i log occupano meno spazio', 'Perché i server non sanno leggere i log', 'Perché la legge vieta i log sui server'], 'Un attaccante esperto cancella le tracce dal server. La copia già spedita altrove resta, e racconta cosa è successo.'],
  ],
  'ch04-m2': [
    ['In un log vedi tre "Failed password" alle 2 di notte da un IP estero, nessun accesso riuscito. Come lo classifichi?', 'Rumore di fondo da annotare e sorvegliare', ['Intrusione confermata da contenere subito', 'Un guasto del servizio SSH da riparare', 'Un errore di battitura di un collega'], 'Pochi tentativi automatici capitano ogni giorno a ogni server esposto. Diventa grave se insiste o se compare un accesso riuscito.'],
    ['Perché nella catena `cut | sort | uniq -c` serve `sort` prima di `uniq`?', 'uniq raggruppa solo le righe uguali vicine', ['sort toglie le righe vuote prima di contare', 'uniq funziona solo su numeri ordinati', 'sort trasforma il testo in numeri'], '`uniq -c` conta le righe uguali consecutive. Senza ordinare, lo stesso IP sparso nel log verrebbe contato in tanti pezzi.'],
  ],
  'ch04-m3': [
    ['Cos\'è la persistenza, in un\'intrusione?', 'Ciò che l\'intruso lascia per poter tornare', ['Il tempo che resta collegato al server', 'La sua insistenza nel provare password', 'Il numero di file che riesce a copiare'], 'Un account in più, un lavoro programmato, una chiave SSH: modi per rientrare anche dopo che la porta iniziale è chiusa.'],
    ['Hai bloccato l\'IP dell\'attaccante. Perché non basta?', 'Può cambiare indirizzo, e ha ancora la password', ['Il firewall si spegne dopo un\'ora', 'Il blocco vale solo per la porta 22', 'Gli IP si possono bloccare una volta sola'], 'Il contenimento vero è anche cambiare la password violata, chiudere la sessione e cercare la persistenza.'],
  ],
  'chAM-m1': [
    ['`free -h` mostra free 200Mi e available 2,5Gi. La memoria sta finendo?', 'No: conta available, il resto è cache', ['Sì: restano solo 200 MB liberi', 'Sì: va riavviato subito il server', 'Non si può dire senza la swap'], 'Linux usa la RAM libera come cache dei file e la restituisce quando serve: la colonna da guardare è available.'],
    ['`which ls` risponde `/tmp/ls`. Cosa significa?', 'Qualcuno ha messo un falso ls', ['ls è stato aggiornato di recente', 'Il sistema si è appena riavviato', 'È normale su molti sistemi Linux'], 'Il vero `ls` sta in `/usr/bin`. Un programma con quel nome in /tmp, trovato prima, è un trucco per nascondere file.'],
  ],
  'chAM-m2': [
    ['Un servizio è `enabled` ma `failed`. Cosa vuol dire?', 'Doveva partire all\'avvio, ma è andato in errore', ['È stato spento apposta dall\'amministratore', 'È acceso e funziona, ma è lento', 'Non è installato su questo sistema'], 'enabled/disabled dice se parte all\'accensione; active/inactive/failed dice com\'è adesso. Le due informazioni sono separate.'],
    ['Perché si lancia `nginx -t` prima di `systemctl restart nginx`?', 'Per non spegnere il sito con un errore', ['Per velocizzare il riavvio del servizio', 'Perché restart funziona solo dopo -t', 'Per salvare una copia della configurazione'], 'Il test legge la configurazione senza toccare il servizio. Un riavvio con un errore dentro spegne il sito.'],
  ],
  'chAM-m3': [
    ['`journalctl -p warning` mostra anche gli errori?', 'Sì: mostra quella priorità e le più gravi', ['No: mostra solo gli avvisi', 'No: gli errori hanno un comando a parte', 'Sì, ma solo quelli di oggi'], '`-p` prende una priorità e tutte quelle più gravi: warning include err, crit, alert ed emerg.'],
    ['Diario e `lastb` mostrano gli stessi sei tentativi falliti. Perché è utile?', 'È una conferma incrociata da due fonti', ['Vuol dire che un registro è sbagliato', 'Così si può cancellarne uno dei due', 'Indica che l\'attacco è riuscito'], 'Due fonti indipendenti che raccontano la stessa cosa rendono la conclusione più solida.'],
  ],
  'chAM-m4': [
    ['Prima di svuotare un log enorme, cosa fa un professionista?', 'Ne conserva una copia compressa', ['Lo cancella con rm per fare prima', 'Riavvia il server per liberarlo', 'Lo rinomina e lo lascia lì'], 'Il log potrebbe servire a un\'indagine o a chi sviluppa: prima si archivia (tar -czf), poi si toglie la causa, poi si pulisce.'],
    ['Cosa vuol dire `*/5 * * * *` in un crontab?', 'Ogni 5 minuti, sempre', ['Alle 5 di ogni giorno', 'Il giorno 5 di ogni mese', 'Ogni 5 ore, di notte'], 'Il primo campo sono i minuti: `*/5` vuol dire ogni 5. Gli altri asterischi: ogni ora, ogni giorno, ogni mese, ogni giorno della settimana.'],
  ],
  'ch05-m4': [
    ['`diff vecchio.conf nuovo.conf` mostra `< PermitRootLogin no` e `> PermitRootLogin yes`. Cosa è cambiato?', 'Root ora può entrare: prima no', ['Root ora non può più entrare', 'Il file vecchio è stato cancellato', 'Le due righe sono identiche'], '`<` sono righe del primo file, `>` del secondo. Il nuovo permette l\'accesso a root: una modifica da verificare subito.'],
    ['Perché si anonimizza un log prima di mandarlo a un fornitore esterno?', 'Contiene dati personali come gli indirizzi', ['Per renderlo più corto da leggere', 'Perché i fornitori non leggono gli IP', 'Per non doverlo comprimere con tar'], 'Gli indirizzi IP dei clienti sono dati personali: si sostituiscono prima di condividere, e l\'originale resta a te.'],
  ],
  'ch06-m3': [
    ['Due utenti hanno la stessa password. Con il sale, i loro hash sono...', 'Diversi', ['Identici', 'Vuoti', 'Più corti'], 'Il sale è un valore casuale diverso per ogni utente: password uguali danno impronte diverse, e le tabelle precalcolate non servono.'],
    ['Perché per le password si usano hash volutamente lenti come bcrypt?', 'Per rallentare chi prova milioni di password', ['Per risparmiare memoria sul server', 'Perché quelli veloci si possono invertire', 'Per far durare di più il login'], 'Per l\'utente un decimo di secondo non pesa; per chi prova miliardi di combinazioni, sì.'],
  ],
  'chPY-m2': [
    ['Cosa stampa `print(porte[0])` se `porte = [22, 80, 443]`?', '22', ['80', '443', '0'], 'Le liste si contano da 0: il primo elemento è `porte[0]`.'],
    ['A cosa serve `def` in Python?', 'A definire una funzione riutilizzabile', ['A cancellare una variabile', 'A dichiarare una lista vuota', 'A importare un modulo esterno'], 'Con `def nome(parametri):` scrivi un blocco di codice una volta e lo richiami quando serve, con `return` per restituire il risultato.'],
  ],
  'ch08-m4': [
    ['Il link mostra `banca.nc` ma porta a `banca.nc.login-sicuro.top/accesso`. Qual è il dominio vero?', '`login-sicuro.top`', ['`banca.nc`', '`accesso`', '`nc.login`'], 'Il dominio si legge da destra a sinistra fino al primo `/`: qui comanda `login-sicuro.top`. "banca.nc" è solo un pezzo del nome.'],
    ['From e Reply-To di un\'email sono diversi. Perché è un campanello d\'allarme?', 'Le risposte andrebbero a qualcun altro', ['Il messaggio non può essere letto', 'L\'email è stata cifrata due volte', 'Vuol dire che SPF è sicuramente valido'], 'Chi falsifica il mittente vuole comunque ricevere le risposte: le dirotta con Reply-To verso un indirizzo suo.'],
  ],
  'ch08-m5': [
    ['Qual è la differenza tra un allarme e un incidente?', 'L\'incidente è una violazione confermata', ['L\'allarme è più grave dell\'incidente', 'Nessuna: sono due nomi della stessa cosa', 'L\'incidente riguarda solo i server'], 'Un evento si osserva, un allarme è un sospetto, un incidente è una violazione reale. Il triage serve a capire quale dei tre è.'],
    ['Perché le "lezioni apprese" si fanno senza cercare colpevoli?', 'Per far emergere le cause, non nasconderle', ['Perché la legge vieta di indicare nomi', 'Perché i colpevoli sono sempre esterni', 'Per chiudere l\'incidente più in fretta'], 'Se chi ha sbagliato teme punizioni, nasconde gli errori. Senza colpevoli si capisce cosa cambiare davvero.'],
  ],
  'chSOC-m1': [
    ['Severità e priorità di un allarme: che differenza c\'è?', 'La priorità considera anche asset e urgenza', ['Nessuna: sono la stessa misura', 'La severità la decide l\'analista', 'La priorità conta solo l\'orario'], 'La severità viene dalla regola; la priorità la decide l\'analista pesando quanto è importante il sistema e se l\'attacco è in corso.'],
    ['Cos\'è l\'alert fatigue?', 'La stanchezza da troppi allarmi', ['Un attacco che spegne gli allarmi', 'Un guasto del SIEM sotto carico', 'Il turno di notte degli analisti'], 'Sommersi da falsi positivi, gli analisti rischiano di non vedere l\'allarme vero. Per questo le regole si migliorano (tuning).'],
  ],
  'chSOC-m2': [
    ['Outlook avvia Word, che avvia PowerShell. Perché è sospetto?', 'Word non dovrebbe lanciare PowerShell', ['Outlook non può aprire allegati Word', 'PowerShell è vietato in ogni azienda', 'È normale: Word usa sempre PowerShell'], 'La catena dei processi rivela una macro malevola: un documento che esegue comandi. È il percorso tipico di un allegato .docm.'],
    ['Cosa vuol dire fare tuning di una regola?', 'Migliorarla per avere meno falsi positivi', ['Disattivarla perché suona troppo spesso', 'Aumentarne la severità a "critica"', 'Copiarla su un altro SIEM'], 'Si aggiungono eccezioni motivate o si affinano le soglie, senza perdere gli attacchi veri.'],
  ],
  'chSOC-m3': [
    ['Un amministratore viene creato senza nessun change registrato. Come lo tratti?', 'Come sospetto, finché non si chiarisce', ['Come normale: gli admin si creano spesso', 'Lo cancelli subito senza chiedere', 'Lo ignori: non riguarda il SOC'], 'Le modifiche autorizzate hanno un change. Se manca, è un possibile segno di intrusione: si verifica e, se serve, si scala.'],
    ['L\'allarme è urgente. Come fai l\'escalation?', 'Prima a voce, poi per iscritto', ['Solo per email, così resta traccia', 'Aspetti il passaggio di consegne', 'Solo a voce, senza scrivere nulla'], 'La voce è immediata, lo scritto lascia traccia: servono entrambi, in quest\'ordine.'],
  ],
  'chSOC-m4': [
    ['Nel passaggio di consegne, cosa va sotto "DA SORVEGLIARE"?', 'Cose non ancora incidenti che potrebbero diventarlo', ['I ticket già chiusi come falsi positivi', 'Gli incidenti già passati al livello 2', 'Le ferie dei colleghi del turno dopo'], 'Il collega deve sapere cosa tenere d\'occhio: un IP che insiste, un account strano, un servizio instabile.'],
    ['Cosa misura l\'MTTR?', 'Il tempo medio per rispondere e ripristinare', ['Il tempo medio per accorgersi di un attacco', 'Il numero medio di allarmi in un turno', 'La durata media di un passaggio di consegne'], 'MTTD misura quanto ci vuole ad accorgersi; MTTR quanto ci vuole a rispondere. Più bassi sono, meglio lavora il SOC.'],
  ],
  'ch11-m1': [
    ['Qual è la causa più frequente di privilege escalation?', 'Errori di configurazione', ['Falle sconosciute del kernel', 'Attacchi fisici al server', 'Password troppo lunghe'], 'Permessi sbagliati, sudo troppo largo, credenziali in chiaro: sono i problemi più comuni, e i più facili da correggere.'],
    ['Entrato come `www-data`, un attaccante lancia subito `sudo -l` e cerca i file SUID. Cosa cerca?', 'Un modo per diventare amministratore', ['Un modo per uscire dal server', 'Le password degli altri siti', 'Lo spazio libero sul disco'], 'È la ricerca di una **privilege escalation**: sudo troppo largo e programmi SUID sono due delle strade più comuni per diventare root.'],
  ],
  'chPT-m1': [
    ['In un pentest "black box", cosa ti dà il cliente?', 'Quasi nessuna informazione sul sistema', ['Le password e il codice sorgente', 'Un account normale per entrare', 'L\'elenco di tutte le vulnerabilità'], 'Black box: parti come un attaccante esterno. Grey box: alcune informazioni (un account). White box: tutto, codice compreso.'],
    ['Cosa contengono le regole d\'ingaggio?', 'Perimetro, esclusioni, orari, divieti, contatti', ['Solo il prezzo e la data di consegna', 'L\'elenco delle vulnerabilità da trovare', 'Le password degli amministratori'], 'Dicono cosa puoi toccare, quando, con quali tecniche, e chi chiamare se qualcosa va storto.'],
  ],
  'chPT-m5': [
    ['Cosa fa `nmap -A`?', 'Versioni, script, sistema operativo e percorso', ['Scansiona tutte le 65535 porte', 'Attacca le vulnerabilità trovate', 'Salva il risultato in un file'], '`-A` unisce -sV, -sC, -O e traceroute. Per tutte le porte serve `-p-`; per salvare, `-oN`.'],
    ['Perché si usa `-oN` durante un pentest?', 'Per conservare il risultato come prova', ['Per rendere la scansione invisibile', 'Per scansionare solo le porte note', 'Per evitare di chiedere i permessi'], 'Il file salvato documenta cosa hai visto e quando: serve per il report e per dimostrare di essere rimasto nel perimetro.'],
  ],
  'ch12-m4': [
    ['Perché PowerShell si dice che lavora con "oggetti, non testo"?', 'Ogni risultato ha proprietà da filtrare', ['Perché non stampa mai niente a schermo', 'Perché funziona solo con file binari', 'Perché ogni comando è un programma'], 'Invece di tagliare colonne di testo, scegli proprietà per nome: `Where-Object { $_.Length -gt 1MB }`.'],
    ['Quale cmdlet è il "grep" di PowerShell?', '`Select-String`', ['`Select-Object`', '`Where-Object`', '`Get-Content`'], '`Select-String` cerca un testo nelle righe; `Select-Object` sceglie proprietà; `Where-Object` filtra oggetti.'],
  ],
  'ch12-m5': [
    ['Perché sul PC compromesso si usa `Disable-ScheduledTask` e non la si cancella?', 'Resta come prova, senza fare danni', ['Cancellarla avvisa l\'attaccante', 'Disattivare è molto più veloce', 'Le attività non si possono cancellare'], 'Contenere senza distruggere le prove: disattivata, l\'attività non agisce ma resta da analizzare.'],
    ['Cosa ti dice `Get-LocalGroupMember Administrators`?', 'Chi è amministratore di quel PC', ['Chi è collegato in questo momento', 'Quali password sono scadute', 'Quali programmi girano come admin'], 'Un amministratore che nessuno conosce è un segno classico di persistenza.'],
  ],
  'chDF-m1': [
    ['A cosa serve un write blocker?', 'A non scrivere niente sul disco originale', ['A copiare il disco più velocemente', 'A cifrare il disco durante la copia', 'A recuperare i file cancellati'], 'Anche collegare un disco può modificarlo. Il write blocker lascia solo leggere: la prova resta intatta.'],
    ['Secondo l\'ordine di volatilità, cosa raccogli per primo?', 'La memoria RAM e le connessioni di rete', ['Gli archivi e i backup più vecchi', 'Il disco, perché è il più grande', 'I documenti stampati in ufficio'], 'Prima ciò che sparisce più in fretta: la RAM si perde allo spegnimento, il disco resta.'],
  ],
  'chSJ-m2': [
    ['Che differenza c\'è tra vulnerability assessment e pentest?', 'L\'assessment non sfrutta le vulnerabilità', ['L\'assessment si fa senza autorizzazione', 'Il pentest non produce un report finale', 'Sono la stessa attività con nomi diversi'], 'L\'assessment trova e ordina le vulnerabilità; il pentest prova anche a sfruttarle, con il permesso del cliente.'],
    ['Per decidere cosa correggere prima, cosa conta oltre al CVSS?', 'Esposizione, KEV e importanza del server', ['Solo il CVSS, dal più alto al più basso', 'L\'ordine alfabetico dei nomi dei server', 'La data in cui è uscita la vulnerabilità'], 'Una falla media su un server esposto e già sfruttata (KEV) è più urgente di una critica su un server spento.'],
  ],
  'chSJ-m3': [
    ['Cosa indica l\'Event ID 4625 di Windows?', 'Un accesso fallito', ['Un accesso riuscito', 'Il registro cancellato', 'Un nuovo servizio'], '4625 accesso fallito, 4624 riuscito, 1102 registro cancellato, 7045 servizio installato.'],
    ['Dal log del DHCP, cosa scopri?', 'Quale PC aveva un IP a una certa ora', ['Quali password sono state usate', 'Quali siti ha visitato un utente', 'Quali file sono stati cancellati'], 'Gli indirizzi cambiano: per sapere chi era 10.0.5.23 alle 03:12 serve il registro di chi l\'aveva in quel momento.'],
  ],
  'chSJ-m4': [
    ['Cos\'è un CIS Benchmark?', 'Una raccolta di configurazioni sicure', ['Una certificazione per pentester', 'Un elenco di vulnerabilità note', 'Un programma che cerca virus'], 'Documenti pubblici con le impostazioni consigliate per ogni sistema: una base pronta per l\'hardening.'],
    ['Che permessi deve avere una chiave privata SSH?', '600: solo il proprietario', ['644: tutti la leggono', '755: tutti la eseguono', '777: tutti la modificano'], 'Se altri possono leggerla, SSH la rifiuta: la chiave privata è come una password.'],
  ],
  'ch13-m3': [
    ['Perché il laboratorio si mette su una rete "solo host"?', 'Per isolarlo da Internet e dalla rete di casa', ['Per renderlo più veloce durante gli attacchi', 'Perché le macchine virtuali non usano Internet', 'Per poter attaccare anche siti esterni'], 'Le macchine vulnerabili apposta non devono essere raggiungibili da fuori, e i tuoi attacchi non devono uscire.'],
    ['A cosa serve uno snapshot di una macchina virtuale?', 'A tornare indietro se rompi qualcosa', ['A fare una foto dello schermo', 'A copiare la macchina su un\'altra rete', 'A cifrare il disco della macchina'], 'Prima di un esperimento rischioso si salva lo stato: se va male, si ripristina in un attimo.'],
  ],
};

export function addMoreQuizzes(chapters: Chapter[]): void {
  for (const ch of chapters)
    for (const m of ch.missions) {
      const list = M[m.id];
      if (!list) continue;
      const steps: QuizStep[] = list.map(([question, right, wrong, explain]) => ({ kind: 'quiz', since: MORE_VER, title: 'Verifica', question, options: [right, ...wrong], correct: 0, explain }));
      const lastQuiz = m.steps.map((s) => s.kind).lastIndexOf('quiz');
      const at = lastQuiz >= 0 ? lastQuiz + 1 : m.steps.length;
      m.steps.splice(at, 0, ...steps);
    }
}

export const MORE_COUNT = Object.values(M).reduce((a, l) => a + l.length, 0);
