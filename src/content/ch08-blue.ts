import type { Chapter } from '../game/types';

export const CH08: Chapter = {
  id: 'ch08',
  code: '08',
  title: 'Blue Team avanzato',
  subtitle: 'SIEM, regole di rilevamento, MITRE ATT&CK e threat hunting',
  missions: [
    // ------------------------------------------------------------------ 8.1
    {
      id: 'ch08-m1',
      title: 'Il cervello del SOC',
      tagline: 'Come funziona un SIEM, cos\'è una regola di rilevamento e il password spraying.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Un nuovo lavoro',
          body: `@nyx: Hai fatto un buon nome in giro, choom. Una piccola azienda di Night City ti ha assunto come **analista SOC** per un mese. Niente più log copiati a mano: qui c'è un **SIEM**.

Un **SIEM** (*Security Information and Event Management*) fa quattro cose:
- **raccoglie** i log da tutti i sistemi: server, VPN, posta, firewall, PC, cloud
- li **normalizza**: li trasforma in un formato comune, così un login fallito ha lo stesso aspetto che arrivi dalla VPN o dalla posta
- li **correla**: collega eventi di sistemi diversi
- applica **regole di rilevamento** e genera **allarmi**

Strumenti reali: Splunk, Elastic (ELK), Microsoft Sentinel, Wazuh (gratuito e open source).

Nella cartella \`siem\` trovi un'esportazione degli eventi di login di stanotte, già normalizzati.`,
        },
        {
          kind: 'task',
          title: 'Guarda i dati',
          body: `Prima di cercare qualsiasi cosa, guarda **com'è fatto** un dato. Leggi le prime righe:

\`\`\`
head -n 5 siem/eventi.log
\`\`\`

Ogni riga ha 5 campi separati da spazi: **ora**, **sistema**, **evento** (\`LOGIN_OK\` o \`LOGIN_FAIL\`), **utente** e **sorgente** (l'IP di provenienza).`,
          objective: 'Guarda le prime righe di siem/eventi.log.',
          hints: ['Scrivi: head -n 5 siem/eventi.log'],
          check: (ev) => ev.type === 'read' && ev.path.endsWith('/siem/eventi.log'),
          success: `Il formato è sempre uguale, qualunque sistema abbia generato l'evento: questo è il vantaggio della **normalizzazione**. Ora possiamo fare domande a tutti i sistemi insieme.`,
        },
        {
          kind: 'lesson',
          title: 'Brute force e password spraying',
          body: `Conosci già il **brute force**: tante password provate su **un** account. È rumoroso, e si difende facilmente bloccando l'account dopo N errori (*account lockout*).

Gli attaccanti lo sanno, e usano spesso la tecnica opposta: il **password spraying** ("spruzzare"). Prendono **una** password molto comune (\`Estate2077!\`, \`Benvenuto1\`...) e la provano su **tanti** account diversi, una volta sola per ciascuno.

\`\`\`
brute force:      1 utente  × 1000 password
password spraying: 1000 utenti × 1 password
\`\`\`

Con un solo errore per account, nessun utente viene bloccato, e una regola del tipo "5 errori sullo stesso utente" **non scatta mai**. Ma basta che **una** persona su cento usi quella password...

La chiave per rilevarlo è cambiare prospettiva: non contare gli errori **per utente**, ma per **sorgente**.`,
        },
        {
          kind: 'task',
          title: 'Errori per sorgente',
          body: `Conta i login falliti per IP di provenienza:

\`\`\`
grep LOGIN_FAIL siem/eventi.log | cut -d " " -f 5 | sort | uniq -c
\`\`\`

Due sorgenti hanno molti errori. Quale IP **esterno** (non \`10.x.x.x\`) è sospetto? Invialo con \`flag\`, solo l'indirizzo.`,
          objective: 'Trova l\'IP esterno con molti login falliti.',
          hints: ['grep LOGIN_FAIL siem/eventi.log | cut -d " " -f 5 | sort | uniq -c', 'flag 192.0.2.44'],
          answer: ['192.0.2.44', 'src=192.0.2.44'],
          success: `\`192.0.2.44\` ha 15 errori. Anche \`10.0.0.15\` ne ha 6, ma è un indirizzo interno: vediamo se il comportamento è diverso.`,
        },
        {
          kind: 'task',
          title: 'Quanti bersagli?',
          body: `Ecco la differenza decisiva tra un utente distratto e uno spraying: **quanti utenti diversi** ha provato ogni sorgente?

\`\`\`
grep 192.0.2.44 siem/eventi.log | grep LOGIN_FAIL | cut -d " " -f 4 | sort | uniq | wc -l
\`\`\`

Invia il numero di utenti diversi presi di mira con \`flag\`. (Prova anche con \`10.0.0.15\` per confronto.)`,
          objective: 'Conta gli utenti diversi attaccati da 192.0.2.44.',
          hints: ['Copia la catena dell\'esempio: l\'ultimo comando wc -l conta gli utenti unici.', 'flag 15'],
          answer: ['15'],
          success: `**15 utenti diversi**, un tentativo ciascuno: è password spraying da manuale. \`10.0.0.15\` invece ha sbagliato 6 volte **sempre su luca** e poi è entrato: Luca che non ricorda la password.

Una regola di rilevamento giusta per lo spraying, scritta in parole:

\`\`\`
SE una stessa sorgente ha login falliti
   su PIÙ DI 10 utenti diversi
   in meno di 30 minuti
ALLORA allarme "Possibile password spraying"
\`\`\``,
        },
        {
          kind: 'task',
          title: 'Ha funzionato?',
          body: `La domanda di sempre: tra tutti quei tentativi, **ne è riuscito uno**?

\`\`\`
grep 192.0.2.44 siem/eventi.log | grep LOGIN_OK
\`\`\`

Invia con \`flag\` il nome dell'utente compromesso.`,
          objective: 'Trova l\'account violato dallo spraying.',
          hints: ['grep 192.0.2.44 siem/eventi.log | grep LOGIN_OK', 'flag sara'],
          answer: ['sara', 'user=sara'],
          success: `**sara** usava la password comune: l'attaccante è entrato nella VPN con il suo account. Azioni immediate: disattivare la sessione, reimpostare la password, controllare cosa ha fatto quell'account dalla VPN.

E la lezione per tutta l'azienda: con l'**MFA** sulla VPN, la password indovinata da sola non sarebbe bastata.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Una regola dice "allarme se un utente ha 5 login falliti in 10 minuti". Perché non rileva il password spraying?',
          options: [
            'Perché lo spraying usa password lunghe',
            'Perché lo spraying fa un solo tentativo per utente: nessun utente arriva a 5 errori',
            'Perché lo spraying non lascia log',
            'La regola lo rileva benissimo',
          ],
          correct: 1,
          explain: `Le regole vanno pensate **contro la tecnica**, non contro un singolo account. Lo spraying è progettato apposta per restare sotto le soglie per utente: si scopre solo raggruppando per sorgente e contando gli utenti diversi.`,
        },
      ],
      recap: [
        ['SIEM', 'raccoglie, normalizza, correla i log e genera allarmi'],
        ['normalizzazione', 'stesso formato per eventi di sistemi diversi'],
        ['regola di rilevamento', 'condizione + soglia + finestra di tempo → allarme'],
        ['password spraying', 'una password comune provata su tanti utenti'],
        ['account lockout', 'blocco dopo N errori: ferma il brute force, non lo spraying'],
        ['uniq | wc -l', 'conta i valori diversi'],
        ['Wazuh / Splunk / Sentinel', 'esempi di SIEM reali'],
      ],
    },

    // ------------------------------------------------------------------ 8.2
    {
      id: 'ch08-m2',
      title: 'La mappa del nemico',
      tagline: 'Cyber Kill Chain e MITRE ATT&CK: dare un nome a ogni mossa dell\'attaccante.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Gli attacchi hanno una struttura',
          body: `@nyx: Hai visto tanti attacchi diversi: scansioni, brute force, cryptominer, firmware avvelenati. Ti sembrano tutti diversi? Guardali meglio: seguono quasi sempre **le stesse fasi**.

La **Cyber Kill Chain** (Lockheed Martin) descrive un attacco in 7 fasi:

\`\`\`
1. Ricognizione       → studiare il bersaglio
2. Armamento          → preparare lo strumento d'attacco
3. Consegna           → farlo arrivare (email, sito, USB...)
4. Sfruttamento       → farlo eseguire / sfruttare una falla
5. Installazione      → mettere radici (persistenza)
6. Comando e controllo → mantenere un canale con l'attaccante
7. Azioni sull'obiettivo → rubare dati, cifrare, minare...
\`\`\`

L'idea per chi difende: **basta interrompere un anello** per fermare tutta la catena. E prima lo fai, meno danni ci sono.`,
        },
        {
          kind: 'lesson',
          title: 'MITRE ATT&CK',
          body: `**MITRE ATT&CK** è il "vocabolario comune" della sicurezza: un enorme catalogo pubblico e gratuito di come operano gli attaccanti reali, organizzato in:
- **tattiche**: il *perché*, l'obiettivo di una fase (es. *Persistence*, mantenere l'accesso)
- **tecniche**: il *come* (es. *Scheduled Task/Job*, usare cron), ognuna con un codice come **T1053**

Alcune tattiche che hai già incontrato:
- **Reconnaissance / Discovery** → le scansioni con nmap
- **Credential Access** → brute force, password spraying
- **Initial Access** → il login con la password indovinata, il phishing
- **Privilege Escalation** → script di root modificabile da tutti
- **Persistence** → utente con UID 0, job di cron nascosto
- **Command and Control** → il beacon che chiama un server esterno
- **Impact** → il cryptominer che consuma le risorse

?? I SOC usano ATT&CK per sapere **cosa riescono a rilevare e cosa no**: per ogni tecnica, esiste una regola? È il modo in cui si misura la copertura di una difesa.`,
        },
        {
          kind: 'quiz',
          title: 'Classifica',
          question: 'L\'intruso della clinica (OP-02) ha creato `/etc/cron.d/.sync-check`, che riavvia il suo programma ogni minuto. Quale tattica ATT&CK è?',
          options: ['Reconnaissance', 'Persistence', 'Exfiltration', 'Initial Access'],
          correct: 1,
          explain: `**Persistence**: lo scopo è sopravvivere a riavvii e pulizie. La tecnica specifica è *Scheduled Task/Job: Cron* (T1053.003).`,
        },
        {
          kind: 'quiz',
          title: 'Classifica',
          question: 'Il programma `/var/tmp/.cache/updater` contatta ogni minuto un server esterno per ricevere ordini. Quale tattica?',
          options: ['Command and Control', 'Discovery', 'Credential Access', 'Defense Evasion'],
          correct: 0,
          explain: `**Command and Control** (C2): il canale con cui l'attaccante governa la macchina compromessa. Spesso si rileva dai **log DNS** o di rete: una macchina che contatta a intervalli regolari un dominio sconosciuto. Lo farai nella prossima missione.`,
        },
        {
          kind: 'quiz',
          title: 'Classifica',
          question: 'Lo spraying della missione precedente, una password comune provata su 15 utenti, è quale tattica?',
          options: ['Impact', 'Lateral Movement', 'Credential Access', 'Collection'],
          correct: 2,
          explain: `**Credential Access**: ottenere credenziali valide. La tecnica è *Brute Force: Password Spraying* (T1110.003). Il login riuscito di sara che segue è invece **Initial Access** tramite *Valid Accounts* (T1078).`,
        },
        {
          kind: 'quiz',
          title: 'Dove fermarlo?',
          question: 'Nella catena del firmware avvelenato (capitolo 06), quale controllo ha interrotto l\'attacco prima dello sfruttamento?',
          options: [
            'Il firewall',
            'La verifica delle impronte SHA-256 dell\'aggiornamento',
            'L\'antivirus',
            'Il backup',
          ],
          correct: 1,
          explain: `La verifica dell'integrità ha fermato l'attacco alla fase di **Consegna**: lo script manomesso non è mai stato eseguito. È il principio della kill chain: prima interrompi, meno danni.`,
        },
      ],
      recap: [
        ['Cyber Kill Chain', '7 fasi: ricognizione → azioni sull\'obiettivo'],
        ['MITRE ATT&CK', 'catalogo pubblico di tattiche (perché) e tecniche (come)'],
        ['tattica / tecnica', 'es. Persistence / Scheduled Task (T1053)'],
        ['Credential Access', 'ottenere credenziali: brute force, spraying'],
        ['Persistence', 'mantenere l\'accesso: account, cron, servizi'],
        ['Command and Control', 'canale tra macchina compromessa e attaccante'],
        ['copertura', 'quali tecniche il SOC sa rilevare'],
      ],
    },

    // ------------------------------------------------------------------ 8.3
    {
      id: 'ch08-m3',
      title: 'Caccia alle minacce',
      tagline: 'IOC, threat intelligence e threat hunting nei log DNS e nei file.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Non aspettare l\'allarme',
          body: `Le regole del SIEM rilevano quello che **sai già** cercare. Ma un attaccante bravo può passare sotto tutte le soglie. Per questo i SOC maturi fanno **threat hunting**: invece di aspettare un allarme, vanno a **cercare attivamente** le tracce di un attacco, partendo da un'ipotesi.

Una fonte di ipotesi è la **threat intelligence**: informazioni condivise su campagne di attacco in corso. Contengono gli **IOC** (*Indicators of Compromise*), cioè le "impronte" lasciate da un attacco:
- **hash** di file malevoli
- **domini** e **IP** dei server di comando e controllo
- nomi di file, percorsi, chiavi di registro

In Italia bollettini di questo tipo li pubblica per esempio l'**ACN** (Agenzia per la Cybersicurezza Nazionale) con il CSIRT Italia.`,
        },
        {
          kind: 'task',
          title: 'Il bollettino',
          body: `È arrivato un bollettino di threat intelligence. Leggilo:

\`\`\`
cat intel/bollettino.txt
\`\`\``,
          objective: 'Leggi il bollettino di threat intelligence.',
          hints: ['Scrivi: cat intel/bollettino.txt'],
          check: (ev, sh) => ev.type === 'read' && ev.path === `${sh.home}/intel/bollettino.txt`,
          success: `Una campagna di finte fatture, con tre IOC: un **hash** dell'allegato, un **dominio** e un **IP** di comando e controllo. Ipotesi di caccia: "qualcuno da noi ha ricevuto quella fattura?"`,
        },
        {
          kind: 'task',
          title: 'Caccia nel DNS',
          body: `Ogni volta che un computer contatta un dominio, prima chiede il suo IP al **DNS**. Per questo i log DNS sono una miniera per i cacciatori: rivelano chi ha parlato con chi.

Cerca il dominio del bollettino:

\`\`\`
grep update-checker.top siem/dns.log
\`\`\`

Quale computer lo ha contattato? Invia il suo nome con \`flag\`.`,
          objective: 'Trova il PC che ha contattato il dominio C2.',
          hints: ['grep update-checker.top siem/dns.log', 'Il secondo campo è il nome del computer: flag pc-reception'],
          answer: ['pc-reception'],
          success: `**pc-reception** ha contattato il dominio C2 **tre volte**, a intervalli regolari: il tipico "battito" di un **beacon**. Il computer della reception è probabilmente infetto.

Contare quante volte è successo è facile:

\`\`\`
grep -c update-checker.top siem/dns.log
\`\`\``,
        },
        {
          kind: 'task',
          title: 'L\'allegato',
          body: `Ora confermiamo da dove è arrivata l'infezione. Nella cartella \`siem/allegati\` ci sono gli allegati email ricevuti dalla reception. Confronta le loro impronte con l'hash del bollettino:

\`\`\`
sha256sum siem/allegati/*
\`\`\`

Quale file corrisponde all'IOC? Invia il nome con \`flag\`.

?? Puoi anche filtrare direttamente: copia l'inizio dell'hash dal bollettino e usa \`sha256sum siem/allegati/* | grep INIZIO_HASH\`.`,
          objective: 'Trova l\'allegato con l\'hash dell\'IOC.',
          hints: [
            'Confronta i primi caratteri di ogni hash con quello del bollettino.',
            'Il file ha una doppia estensione: .pdf.js. flag fattura_2077_118.pdf.js',
          ],
          answer: ['fattura_2077_118.pdf.js', 'siem/allegati/fattura_2077_118.pdf.js'],
          success: `\`fattura_2077_118.pdf.js\`: la **doppia estensione** è un trucco classico. Su molti sistemi si vede solo "fattura_2077_118.pdf", ma in realtà è uno **script** (\`.js\`) che, aperto con un doppio clic, installa il malware.

Hai ricostruito la catena: **email** con finta fattura (Consegna) → **script** eseguito (Sfruttamento) → **beacon** verso update-checker.top (Comando e controllo).`,
        },
        {
          kind: 'lesson',
          title: 'Cosa succede ora',
          body: `Hai trovato una compromissione che **nessuna regola** aveva segnalato. Il seguito è l'incident response che conosci:

1. **isolare** pc-reception dalla rete (ma senza spegnerlo: la memoria contiene prove)
2. **bloccare** dominio e IP C2 sul firewall e sul DNS aziendale
3. **cercare** lo stesso allegato nelle caselle di tutti: altri l'hanno ricevuto?
4. **trasformare la caccia in una regola**: "allarme se un computer interroga un dominio presente nella lista IOC". La prossima volta il SIEM lo troverà da solo

Il punto 4 è il valore vero del threat hunting: ogni caccia riuscita rende la difesa **automaticamente** più forte.

?? Gli **IDS** come **Suricata** e **Snort** fanno qualcosa di simile in tempo reale sul traffico di rete: confrontano i pacchetti con migliaia di regole, comprese quelle costruite dagli IOC, e generano allarmi.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica finale',
          question: 'Perché un dominio contattato "ogni 10 minuti, sempre allo stesso modo" è sospetto?',
          options: [
            'Perché i domini non vanno mai contattati due volte',
            'Perché un intervallo regolare e automatico è tipico di un beacon C2, mentre le persone navigano in modo irregolare',
            'Perché il DNS è vietato',
            'Non è sospetto',
          ],
          correct: 1,
          explain: `Le persone generano traffico irregolare. Un programma che "chiama casa" a intervalli fissi produce uno schema regolare, chiamato **beaconing**, che si può rilevare anche senza conoscere il dominio in anticipo. Attenzione però: anche molti software legittimi (aggiornamenti, sincronizzazioni) lo fanno, quindi va sempre verificato il contesto.`,
        },
      ],
      recap: [
        ['threat hunting', 'cercare attivamente un attacco partendo da un\'ipotesi'],
        ['threat intelligence', 'informazioni condivise sulle campagne in corso'],
        ['IOC', 'indicatori: hash, domini, IP, nomi di file'],
        ['log DNS', 'rivelano quali domini contatta ogni computer'],
        ['beaconing', 'contatti a intervalli regolari verso un C2'],
        ['doppia estensione', 'fattura.pdf.js: sembra un PDF, è uno script'],
        ['grep -c', 'conta le righe che corrispondono'],
        ['IDS (Suricata, Snort)', 'regole applicate in tempo reale al traffico'],
      ],
    },
  ],
};
