import type { Chapter } from '../game/types';

export const CH12: Chapter = {
  id: 'ch12',
  code: '12',
  title: 'Windows e Active Directory',
  subtitle: 'Il mondo aziendale: PowerShell, dominio, Registro eventi',
  missions: [
    // ------------------------------------------------------------------ 12.1
    {
      id: 'ch12-m1',
      title: 'L\'altra metà del mondo',
      tagline: 'Com\'è fatto Windows, e PowerShell per chi conosce già Linux.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Perché Windows',
          body: `@nyx: I server di Internet sono quasi tutti Linux, ma dentro gli **uffici** quasi tutti i computer sono Windows. E le aziende li gestiscono con un sistema centrale, **Active Directory**. Se vuoi lavorare in un SOC, metà degli allarmi che vedrai arriveranno da lì.

Le differenze principali rispetto a Linux:
- i dischi hanno una lettera: \`C:\\\`, e i percorsi usano la barra rovesciata \`\\\`
- le cartelle importanti: \`C:\\Windows\` (sistema), \`C:\\Users\\nome\` (la home), \`C:\\Program Files\` (programmi), \`C:\\Users\\Public\` (scrivibile da tutti: occhio!)
- l'amministratore si chiama **Administrator**, e l'account più potente in assoluto è **SYSTEM**
- molte impostazioni stanno nel **Registro di sistema** (*Registry*), un grande database di configurazione
- i programmi che girano in background sono i **servizi** (come i demoni di Linux)`,
        },
        {
          kind: 'lesson',
          title: 'PowerShell',
          body: `Il terminale moderno di Windows è **PowerShell**. I suoi comandi (*cmdlet*) hanno nomi lunghi nel formato **Verbo-Nome**, ma molti hanno alias familiari:

\`\`\`
PowerShell          alias     in Linux
Get-ChildItem       ls, dir   ls
Get-Content         cat, gc   cat
Set-Location        cd        cd
Get-Process         ps        ps
Select-String       sls       grep
Get-Help            help      man
Get-FileHash                  sha256sum
\`\`\`

A differenza di Linux, PowerShell **non distingue** maiuscole e minuscole, e le pipe passano **oggetti** invece che testo, il che lo rende molto potente.

!! PowerShell è amatissimo anche dagli attaccanti, perché è già installato su ogni Windows. Un segnale classico negli allarmi: \`powershell.exe -enc ...\`, cioè un comando **codificato in Base64** per nasconderlo. Ricordi il capitolo 06? Base64 non nasconde niente a chi sa leggerlo.`,
        },
        {
          kind: 'task',
          title: 'Prova PowerShell',
          body: `Il deck capisce i principali comandi di PowerShell. Leggi l'esportazione dei gruppi di Active Directory usando il cmdlet di Windows:

\`\`\`
Get-Content windows/ad_gruppi.txt
\`\`\``,
          objective: 'Leggi windows/ad_gruppi.txt con Get-Content.',
          hints: ['Scrivi: Get-Content windows/ad_gruppi.txt'],
          check: (ev, sh) => ev.type === 'read' && ev.path === `${sh.home}/windows/ad_gruppi.txt`,
          success: `Stesso risultato di \`cat\`. Se in futuro ti trovi davanti a una finestra PowerShell, sai già da dove partire. Ora, cosa contiene quel file?`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'In un allarme vedi un processo avviato da `C:\\Users\\Public\\upd.exe`. Perché è sospetto?',
          options: [
            'Perché i programmi non possono stare in C:',
            'Perché C:\\Users\\Public è scrivibile da tutti: i programmi legittimi stanno in Program Files o Windows',
            'Perché il nome è troppo corto',
            'Non è sospetto',
          ],
          correct: 1,
          explain: `È l'equivalente Windows di \`/tmp\`: una cartella dove chiunque può scrivere, e quindi un posto comodo per il malware. I programmi installati correttamente stanno in \`Program Files\`, dove un utente normale non può scrivere.`,
        },
      ],
      recap: [
        ['C:\\Users\\Public', 'cartella scrivibile da tutti: come /tmp'],
        ['SYSTEM / Administrator', 'gli account più potenti di Windows'],
        ['Registro di sistema', 'il database di configurazione di Windows'],
        ['servizi', 'programmi in background (come i demoni Linux)'],
        ['PowerShell', 'terminale di Windows, cmdlet Verbo-Nome'],
        ['Get-Content / Get-ChildItem / Select-String', 'cat / ls / grep'],
        ['powershell -enc', 'comando codificato in Base64: segnale sospetto'],
      ],
    },

    // ------------------------------------------------------------------ 12.2
    {
      id: 'ch12-m2',
      title: 'Il dominio',
      tagline: 'Active Directory: domain controller, utenti, gruppi, GPO e Kerberos.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Cos\'è Active Directory',
          body: `In un'azienda con cento computer non si creano gli utenti su ognuno. Si usa un **dominio**: un sistema centrale che conosce tutti gli utenti, i computer e le regole. In Windows si chiama **Active Directory** (AD).

- il **Domain Controller** (DC) è il server che gestisce il dominio: verifica le password, distribuisce le regole
- gli **utenti** e i **computer** sono oggetti del dominio, organizzati in cartelle chiamate **OU** (*Organizational Unit*)
- i **gruppi** danno i permessi: chi è nel gruppo "Contabilità" vede la cartella della contabilità
- le **GPO** (*Group Policy Object*) sono regole applicate automaticamente a tanti computer: password minime, aggiornamenti, blocco dello schermo...

Con lo stesso account (\`m.ferri\`) entri in qualsiasi PC dell'ufficio, perché è il dominio a riconoscerti.`,
        },
        {
          kind: 'lesson',
          title: 'Le chiavi del regno',
          body: `Alcuni gruppi del dominio sono **potentissimi**:
- **Domain Admins**: amministratori di **tutti** i computer e server del dominio
- **Enterprise Admins**: ancora più in alto, su più domini
- gruppi come **Backup Operators** che, per fare il loro lavoro, possono leggere quasi tutto

Chi controlla un account Domain Admin controlla l'intera azienda. Per questo l'obiettivo finale di quasi ogni attacco a un'azienda è proprio quello, e per questo le buone pratiche dicono:
- pochissimi membri, e con account **separati** (\`s.neri\` per la posta, \`s.neri.adm\` solo per amministrare)
- gli account amministrativi si usano **solo** su macchine dedicate e protette, mai sul PC con cui si legge la posta (modello a **livelli**, *tiering*)
- **ogni** modifica ai gruppi privilegiati deve generare un allarme`,
        },
        {
          kind: 'task',
          title: 'Chi non dovrebbe esserci?',
          body: `Rileggi l'esportazione dei gruppi:

\`\`\`
Get-Content windows/ad_gruppi.txt
\`\`\`

In fondo c'è una modifica recente a un gruppo privilegiato. Quale account è stato aggiunto ai **Domain Admins** senza alcun motivo plausibile? Invialo con \`flag\`.`,
          objective: 'Trova l\'account aggiunto ai Domain Admins.',
          hints: ['Guarda la sezione "modifiche recenti".', 'flag stagista'],
          answer: ['stagista'],
          success: `Lo **stagista** tra gli amministratori dell'intero dominio. Anche se l'ha fatto un amministratore vero (\`m.ferri.adm\`), magari "per comodità", è una violazione del minimo privilegio: se l'account dello stagista viene violato (password debole, phishing), l'attaccante diventa padrone di tutto.

E l'esportazione mostra un altro problema: \`stagista\` **non compare** nella lista dei Domain Admins in alto. Un'esportazione non aggiornata, o qualcuno ha già tolto l'utente? In un caso vero andrebbe verificato subito sul domain controller.`,
        },
        {
          kind: 'lesson',
          title: 'Kerberos e NTLM',
          body: `Per autenticare gli utenti, Active Directory usa soprattutto **Kerberos**: invece di mandare la password ogni volta, l'utente riceve dal DC dei **ticket** a tempo, come i biglietti di un concerto, che mostra ai servizi a cui vuole accedere.

Esiste anche il vecchio protocollo **NTLM**, ancora presente per compatibilità, che è più debole.

Molti attacchi ad Active Directory abusano di questi meccanismi, per esempio rubando ticket o hash di password dalla memoria di un computer già compromesso e riusandoli su altri (movimento laterale). Non serve conoscerne i dettagli tecnici per difendersi; le contromisure principali sono:
- **minimo privilegio** e tiering degli account amministrativi
- **LAPS** per password locali tutte diverse
- disattivare NTLM dove possibile
- proteggere il **DC** come il bene più prezioso dell'azienda
- registrare e sorvegliare gli eventi di autenticazione (la prossima missione)`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un amministratore usa il suo account Domain Admin anche per leggere la posta e navigare. Perché è pericoloso?',
          options: [
            'Perché la posta diventa più lenta',
            'Perché se il PC viene compromesso da un phishing, l\'attaccante ottiene subito le credenziali più potenti del dominio',
            'Perché i Domain Admin non possono avere la posta',
            'Non è pericoloso',
          ],
          correct: 1,
          explain: `Il PC con cui si legge la posta e si naviga è il più esposto agli attacchi. Se lì sopra è collegato un Domain Admin, un singolo clic sbagliato consegna l'intera azienda. Per questo si usano **account separati** e **postazioni dedicate** all'amministrazione.`,
        },
      ],
      recap: [
        ['Active Directory', 'il sistema centrale di utenti, computer e regole'],
        ['Domain Controller', 'il server che gestisce il dominio: il bene più prezioso'],
        ['OU / gruppi / GPO', 'cartelle, permessi, regole automatiche'],
        ['Domain Admins', 'controllano tutto il dominio: pochissimi membri'],
        ['account separati / tiering', 'account amministrativi usati solo dove serve'],
        ['Kerberos / NTLM', 'protocolli di autenticazione: ticket / vecchio e più debole'],
      ],
    },

    // ------------------------------------------------------------------ 12.3
    {
      id: 'ch12-m3',
      title: 'Il Registro eventi',
      tagline: 'Gli Event ID che ogni analista conosce, e un attacco ricostruito dai log di Windows.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Gli Event ID',
          body: `Windows registra tutto nel **Registro eventi** (*Event Log*), che si consulta con il Visualizzatore eventi o con PowerShell (\`Get-WinEvent\`). Ogni tipo di evento ha un numero, l'**Event ID**. Quelli da sapere a memoria per il registro di sicurezza:

\`\`\`
4624  accesso riuscito
4625  accesso NON riuscito
4672  privilegi speciali assegnati (accesso da amministratore)
4688  nuovo processo creato
4720  creato un account utente
4728  aggiunto membro a un gruppo globale privilegiato
4732  aggiunto membro a un gruppo locale (es. Administrators)
7045  installato un nuovo servizio (registro di sistema)
1102  il registro di controllo è stato CANCELLATO
\`\`\`

Nei SOC questi eventi vengono inviati al **SIEM**, spesso arricchiti da **Sysmon**, uno strumento gratuito di Microsoft che registra in dettaglio processi, connessioni di rete e modifiche ai file.`,
        },
        {
          kind: 'task',
          title: 'I tentativi falliti',
          body: `In \`windows/security.csv\` c'è un'esportazione del registro di sicurezza del dominio di Neon Ottica, ieri sera. Il formato è CSV: campi separati da **virgole**.

\`\`\`
ora,EventID,computer,utente,dettaglio
\`\`\`

Quanti accessi **non riusciti** (4625) ci sono? Invia il numero con \`flag\`.

\`\`\`
grep -c ",4625," windows/security.csv
\`\`\``,
          objective: 'Conta gli eventi 4625 e invia il numero.',
          hints: ['grep -c ",4625," windows/security.csv', 'flag 8'],
          answer: ['8'],
          success: `8 tentativi falliti, quasi tutti su **utenti diversi** e tutti dallo stesso indirizzo \`10.0.5.66\`, in pochi minuti. Riconosci lo schema? È lo **spraying** del capitolo 08, stavolta visto nel linguaggio di Windows.`,
        },
        {
          kind: 'task',
          title: 'Chi è caduto?',
          body: `Ora cerca gli accessi riusciti (4624) e guarda quale arriva dallo stesso indirizzo dei tentativi:

\`\`\`
grep ",4624," windows/security.csv
\`\`\`

Invia con \`flag\` l'account compromesso.`,
          objective: 'Trova l\'account con accesso riuscito da 10.0.5.66.',
          hints: ['grep ",4624," windows/security.csv', 'La riga con "da 10.0.5.66": flag a.bassi'],
          answer: ['a.bassi'],
          success: `**a.bassi**: due tentativi falliti, poi un accesso riuscito via rete (*tipo 3*) da \`10.0.5.66\`. Subito dopo compare un **4672**: quell'account ha privilegi speciali. Sfortuna doppia: l'account violato era anche amministratore.`,
        },
        {
          kind: 'task',
          title: 'Cosa ha fatto',
          body: `Guarda tutto quello che è successo con l'account compromesso dopo l'accesso:

\`\`\`
grep a.bassi windows/security.csv
\`\`\`

L'attaccante ha creato un nuovo utente (4720) e lo ha messo tra gli amministratori del dominio (4728). Come si chiama il nuovo account? Invialo con \`flag\`.`,
          objective: 'Trova l\'account creato dall\'attaccante.',
          hints: ['Cerca la riga con 4720.', 'flag helpdesk2'],
          answer: ['helpdesk2'],
          success: `**helpdesk2**, aggiunto subito ai **Domain Admins**: un account di **persistenza** con un nome credibile, come \`sysupdate\` nella clinica. Ma non è finita: guarda le ultime righe dell'esportazione.`,
        },
        {
          kind: 'lesson',
          title: 'Le ultime righe',
          body: `Le ultime tre righe raccontano il resto:

\`\`\`
4688  PC-BASSI  powershell.exe -enc SQBFAFgA...
7045  PC-BASSI  installato servizio "WinUpdater" C:\\Users\\Public\\upd.exe
1102  PC-BASSI  il registro di controllo è stato cancellato
\`\`\`

- **4688**: un PowerShell con comando **codificato**: per nascondere cosa faceva
- **7045**: un nuovo **servizio** dal nome rassicurante che avvia un programma da \`C:\\Users\\Public\`: altra **persistenza**
- **1102**: l'attaccante ha **cancellato il registro** del PC per coprire le tracce

Ma noi lo stiamo leggendo lo stesso. Perché? Perché gli eventi erano già stati **inviati al SIEM** prima della cancellazione. È la dimostrazione pratica del perché i log vanno centralizzati: sul PC sono spariti, nel SIEM no. E un evento **1102** è, di per sé, uno degli allarmi più gravi che esistano: nessuno cancella i log per caso.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica finale',
          question: 'Quale di questi Event ID dovrebbe far scattare SEMPRE un allarme ad alta priorità?',
          options: ['4624, accesso riuscito', '1102, registro di controllo cancellato', '4688, nuovo processo', '4625, singolo accesso fallito'],
          correct: 1,
          explain: `Un 4624 o un singolo 4625 succedono migliaia di volte al giorno. Ma la cancellazione del registro di sicurezza (1102) quasi sempre significa che qualcuno sta coprendo le proprie tracce. Allo stesso modo vanno sempre segnalati i 4728/4732 sui gruppi privilegiati.`,
        },
      ],
      recap: [
        ['4624 / 4625', 'accesso riuscito / fallito'],
        ['4672', 'accesso con privilegi speciali'],
        ['4720 / 4728 / 4732', 'utente creato / aggiunto a gruppo privilegiato'],
        ['4688 / 7045', 'nuovo processo / nuovo servizio'],
        ['1102', 'registro cancellato: allarme grave'],
        ['Sysmon', 'registrazione dettagliata di processi e connessioni (Microsoft, gratuito)'],
        ['log centralizzati', 'sopravvivono alla cancellazione sul singolo PC'],
      ],
    },
  ],
};
