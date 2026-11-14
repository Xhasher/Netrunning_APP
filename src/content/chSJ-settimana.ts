// Capitolo SJ: una settimana da junior. Cinque giorni, cinque lavori diversi, come in
// un'azienda vera: revisione degli account, vulnerability assessment, un'indagine su
// Windows, hardening, e il venerdì il report settimanale in inglese.
// Niente di nuovo da imparare: tutto da mettere insieme, con pochi aiuti.

import type { Shell } from '../engine/shell';
import type { Chapter } from '../game/types';

const fileHas = (sh: Shell, rel: string, words: string[]) => {
  const f = sh.fs.get(`${sh.home}/${rel}`);
  if (!f || f.type !== 'file') return false;
  const t = f.content.toLowerCase();
  return words.every((w) => t.includes(w.toLowerCase()));
};

export function addWeekFiles(sh: Shell): void {
  const mine = { owner: sh.user, group: sh.user };
  const w = (rel: string, lines: string[], perms?: string) => sh.localFs.writeFile(`${sh.home}/settimana/${rel}`, lines.join('\n') + '\n', { ...mine, perms });
  w('LEGGIMI.txt', [
    '=== ARASAKA LOGISTICS · SECURITY TEAM · LA TUA PRIMA SETTIMANA ===',
    '',
    'Lunedì     revisione degli account (utenti.csv)',
    'Martedì    vulnerability assessment del laboratorio (range.lan, range2.lan)',
    'Mercoledì  allarme su un server Windows (eventi.csv)',
    'Giovedì    hardening di un server Linux (sshd_config, chiavi)',
    'Venerdì    report settimanale per il responsabile, in inglese (report.md)',
    '',
    'Responsabile: Sasha Ivanova (non parla italiano).',
  ]);
  w('utenti.csv', [
    'account,nome,reparto,stato_hr,stato_account,ruolo,mfa',
    'r.costa,Rita Costa,amministrazione,attivo,attivo,utente,si',
    'k.tanaka,Kenji Tanaka,commerciale,attivo,attivo,utente,si',
    'g.bianchi,Giulia Bianchi,logistica,cessato,attivo,utente,si',
    'l.moreau,Luc Moreau,IT,attivo,attivo,admin,si',
    'p.ivanova,Polina Ivanova,IT,attivo,attivo,admin,no',
    'a.berg,Anna Berg,reception,attivo,attivo,utente,si',
    't.moretti,Tommaso Moretti,commerciale,cessato,attivo,utente,no',
    'm.rossi,Marco Rossi,IT,attivo,disabilitato,admin,si',
    'h.yorinobu,Hanako Yorinobu,SOC,attivo,attivo,admin,si',
    's.neri,Sara Neri,amministrazione,cessato,disabilitato,utente,si',
    'svc.backup,(servizio),IT,-,attivo,servizio,no',
    'f.romano,Fabio Romano,magazzino,attivo,attivo,utente,si',
  ]);
  w('esposizione.txt', [
    '# esposizione degli host del laboratorio',
    'range.lan    10.20.0.120   raggiungibile da INTERNET (porta 8080 pubblicata dal firewall)',
    'range2.lan   10.20.0.121   solo rete interna',
  ]);
  w('eventi.csv', [
    'ora,EventID,computer,utente,dettaglio',
    '2077-11-15 02:10,4625,SRV-FILE-02,administrator,password errata da 10.0.7.12',
    '2077-11-15 02:10,4625,SRV-FILE-02,backup,password errata da 10.0.7.12',
    '2077-11-15 02:11,4625,SRV-FILE-02,f.romano,password errata da 10.0.7.12',
    '2077-11-15 02:11,4625,SRV-FILE-02,a.berg,password errata da 10.0.7.12',
    '2077-11-15 02:11,4625,SRV-FILE-02,k.tanaka,password errata da 10.0.7.12',
    '2077-11-15 02:12,4625,SRV-FILE-02,r.costa,password errata da 10.0.7.12',
    '2077-11-15 02:12,4625,SRV-FILE-02,l.moreau,password errata da 10.0.7.12',
    '2077-11-15 02:12,4624,SRV-FILE-02,f.romano,accesso riuscito tipo 3 da 10.0.7.12',
    '2077-11-15 02:13,5140,SRV-FILE-02,f.romano,accesso alla condivisione \\\\SRV-FILE-02\\Contabilita',
    '2077-11-15 02:15,5140,SRV-FILE-02,f.romano,accesso alla condivisione \\\\SRV-FILE-02\\HR',
    '2077-11-15 08:02,4624,SRV-FILE-02,f.romano,accesso riuscito tipo 2 (interattivo)',
  ]);
  w('dhcp.log', ['2077-11-15 01:58 DHCPACK 10.0.7.12 a 4e:61:72:63:68:31 (MAG-PC-03, magazzino)', '2077-11-15 07:55 DHCPACK 10.0.3.44 a 02:4e:43:00:03:44 (PC-AMM-07)']);
  w(
    'sshd_config',
    ['# server SSH di SRV-WEB-01', 'Port 22', 'PermitRootLogin yes', 'PasswordAuthentication yes', 'PubkeyAuthentication yes', 'MaxAuthTries 10', 'X11Forwarding yes', 'PermitEmptyPasswords no'],
  );
  w('id_backup', ['-----BEGIN OPENSSH PRIVATE KEY-----', 'b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQ (chiave privata di esempio)', '-----END OPENSSH PRIVATE KEY-----'], 'rw-r--r--');
}

export const CHSJ: Chapter = {
  id: 'chSJ',
  code: 'SJ',
  title: 'Una settimana da junior',
  subtitle: 'Cinque giorni di lavoro vero: account, vulnerabilità, Windows, hardening e un report in inglese',
  missions: [
    // ------------------------------------------------------------------ lunedì
    {
      id: 'chSJ-m1',
      title: 'Lunedì · Gli account',
      tagline: 'Revisione degli accessi: chi se n\'è andato ma può ancora entrare, chi è admin senza MFA.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Benvenuto ad Arasaka Logistics',
          body: `@rook: Dopo il turno di prova al SOC, Arasaka Logistics ti ha assunto come **junior security analyst**. La tua responsabile, Sasha Ivanova, ti ha lasciato un programma per la settimana in \`settimana/LEGGIMI.txt\`.

@nyx: Questa settimana non c'è niente di nuovo da imparare: c'è da mettere insieme tutto quello che sai, con pochi aiuti, come al lavoro. Ogni giorno un tipo di attività diverso, tutte comuni nei primi mesi di un junior.

@nyx: Lunedì: **revisione degli accessi** (*access review*). Si confronta l'elenco degli account con quello del personale. È noioso, è richiesto da ogni standard (ISO 27001, NIST) e trova problemi veri quasi ogni volta.`,
        },
        {
          kind: 'task',
          title: 'Chi se n\'è andato',
          body: `\`settimana/utenti.csv\` unisce i dati delle risorse umane (\`stato_hr\`) e quelli degli account (\`stato_account\`). Il caso pericoloso: persona **cessata**, account ancora **attivo**.

Le colonne sono separate da virgole: \`stato_hr\` è la quarta, \`stato_account\` la quinta.`,
          objective: 'Quanti ex dipendenti hanno ancora l\'account attivo? Invia il numero con flag.',
          hints: ['awk con -F, e una condizione su due colonne, unite da &&.', "awk -F, '$4 == \"cessato\" && $5 == \"attivo\"' settimana/utenti.csv e poi: flag 2"],
          answer: ['2'],
          success: '`g.bianchi` e `t.moretti`: hanno lasciato l\'azienda, ma potrebbero ancora entrare (o qualcuno con le loro password). È il controllo **leaver** del processo *joiner-mover-leaver*: chi esce deve perdere gli accessi il giorno stesso.',
        },
        {
          kind: 'task',
          title: 'Admin senza MFA',
          body: `Ora gli account più pericolosi da perdere: gli **amministratori**. Devono avere tutti l'autenticazione a più fattori (MFA).`,
          objective: 'Quale amministratore attivo non ha la MFA? Invia il nome dell\'account con flag.',
          hints: ['Tre condizioni: ruolo admin, MFA no, account attivo.', "awk -F, '$6 == \"admin\" && $7 == \"no\" && $5 == \"attivo\"' settimana/utenti.csv e poi: flag p.ivanova"],
          answer: ['p.ivanova'],
          success: 'Un amministratore IT senza MFA: se la sua password finisce in un phishing, l\'attaccante ha le chiavi. Priorità alta.',
        },
        {
          kind: 'task',
          title: 'L\'account che non è una persona',
          body: `Nell'elenco c'è anche un account **di servizio**: non lo usa una persona, ma un programma (backup, integrazioni). Spesso ha privilegi alti, una password che non scade mai e nessuna MFA.`,
          objective: 'Qual è l\'account di servizio? Invialo con flag.',
          hints: ['Cerca la riga con ruolo "servizio".', 'grep servizio settimana/utenti.csv e poi: flag svc.backup'],
          answer: ['svc.backup'],
          success: 'Gli account di servizio non si possono proteggere con la MFA: si proteggono con password lunghissime gestite da un vault, permessi minimi e accesso consentito solo dalle macchine che ne hanno bisogno. Nel report va segnalato come "da verificare", non come "errore".',
        },
        {
          kind: 'task',
          title: 'Il verbale',
          body: `Annota i risultati in \`settimana/accessi.txt\`: i due account da disattivare, l'admin senza MFA, l'account di servizio da verificare. Una riga per problema, con l'azione richiesta.`,
          objective: 'Scrivi settimana/accessi.txt con g.bianchi, t.moretti, p.ivanova e svc.backup.',
          noHints: true,
          hints: ['Una riga per account: nome, problema, azione.', 'echo "g.bianchi: cessato, account attivo -> disattivare" >> settimana/accessi.txt (e così via)'],
          state: (sh) => fileHas(sh, 'settimana/accessi.txt', ['g.bianchi', 't.moretti', 'p.ivanova', 'svc.backup']),
          success: 'Lunedì chiuso. Una revisione degli accessi trova quasi sempre qualcosa: per questo si ripete ogni trimestre.',
        },
      ],
      recap: [
        ['access review', 'confronto periodico tra account e persone'],
        ['joiner-mover-leaver', 'chi entra, cambia ruolo, esce: gli accessi seguono'],
        ['account di servizio', 'usato da un programma: password gestita, privilegi minimi'],
      ],
    },

    // ------------------------------------------------------------------ martedì
    {
      id: 'chSJ-m2',
      title: 'Martedì · Le vulnerabilità',
      tagline: 'Scansione autorizzata, CVE, priorità con l\'esposizione: cosa si corregge per primo.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Vulnerability assessment',
          body: `@nyx: Martedì: **vulnerability assessment** dei due server del laboratorio (\`range.lan\` e \`range2.lan\`, nel perimetro autorizzato). Non è un pentest: non si sfrutta niente. Si trovano le vulnerabilità note e si mette in ordine cosa correggere.

La priorità non è solo il punteggio **CVSS**. Contano anche:
- l'**esposizione**: il servizio è raggiungibile da Internet o solo dall'interno?
- se la vulnerabilità è **sfruttata attivamente** (catalogo KEV)
- l'importanza del server

Una CVSS 9.8 su un servizio esposto a Internet e presente nel KEV si corregge **oggi**.`,
        },
        {
          kind: 'task',
          title: 'La scansione',
          body: `Scansiona \`range.lan\` con il rilevamento delle versioni e gli script di vulnerabilità. Salva il risultato in \`settimana/range.txt\`: è una prova del lavoro fatto.`,
          objective: 'Scansiona range.lan con -sV e gli script vuln, salvando in settimana/range.txt.',
          hints: ['nmap --script vuln -sV, con -oN per il file.', 'nmap --script vuln -sV -oN settimana/range.txt range.lan'],
          state: (sh) => fileHas(sh, 'settimana/range.txt', ['range.lan', 'CVE-2077-1188']),
          success: 'Quattro servizi, ognuno con almeno una vulnerabilità nota. Ora bisogna decidere da dove partire.',
        },
        {
          kind: 'task',
          title: 'La più grave',
          body: `Nel risultato cerca la vulnerabilità con il CVSS più alto. Per i dettagli puoi usare \`cve PRODOTTO VERSIONE\`.`,
          objective: 'Quale CVE ha il punteggio più alto? Invia l\'identificativo con flag.',
          hints: ['Cerca le righe con CVSS nel file salvato.', 'grep CVSS settimana/range.txt e poi: flag CVE-2077-1188'],
          answer: ['CVE-2077-1188'],
          success: 'CVSS 9.8 su Jenkins: esecuzione di comandi senza autenticazione, e nel catalogo **KEV** (sfruttata attivamente).',
        },
        {
          kind: 'task',
          title: 'È esposta?',
          body: `Ora l'esposizione: leggi \`settimana/esposizione.txt\`. Jenkins su \`range.lan\` è sulla porta 8080.`,
          objective: 'Il Jenkins vulnerabile è raggiungibile da Internet? Rispondi con flag si o no.',
          hints: ['La riga di range.lan parla della porta 8080.', 'flag si'],
          answer: ['si', 'sì'],
          success: 'Sì: CVSS 9.8 + KEV + esposto a Internet = **critica, da correggere oggi**. Anche `range2.lan` ha un Jenkins, ma aggiornato e solo interno.',
        },
        {
          kind: 'task',
          title: 'Confronto',
          body: `Per completezza, controlla anche \`range2.lan\` con lo stesso metodo (senza salvare). Il Jenkins lì è la versione 2.440.`,
          objective: 'range2.lan è colpito da CVE-2077-1188? Rispondi con flag si o no.',
          hints: ['cve jenkins 2.440, oppure la scansione vuln di range2.lan.', 'flag no'],
          answer: ['no'],
          success: 'No: la 2.440 è già corretta (la vulnerabilità riguarda le versioni sotto la 2.400). Nel report: "range2.lan è il riferimento: aggiornare range.lan alla stessa versione".',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          skills: ['nmap', 'cve'],
          question: 'Due vulnerabilità: CVSS 9.1 su un server interno di test, CVSS 7.5 su un server esposto a Internet e presente nel KEV. Quale correggi per prima?',
          options: [
            'La 7.5: esposta a Internet e già sfruttata dagli attaccanti',
            'La 9.1: ha il punteggio più alto',
            'Nessuna delle due finché non c\'è un attacco',
            'Quella più facile da correggere',
          ],
          correct: 0,
          explain: 'Il CVSS misura la gravità tecnica, non il rischio per la tua azienda. Esposizione e sfruttamento reale (KEV) spostano la priorità.',
        },
      ],
      recap: [
        ['vulnerability assessment', 'trovare e ordinare le vulnerabilità, senza sfruttarle'],
        ['priorità', 'CVSS + esposizione + KEV + importanza del server'],
        ['nmap --script vuln -sV -oN', 'scansione delle vulnerabilità note, salvata'],
      ],
    },

    // ------------------------------------------------------------------ mercoledì
    {
      id: 'chSJ-m3',
      title: 'Mercoledì · L\'allarme notturno',
      tagline: 'Password spraying su un file server: chi, da dove, cosa ha toccato.',
      xp: 350,
      steps: [
        {
          kind: 'lesson',
          title: 'Il SIEM ha suonato',
          body: `@nyx: Stanotte il SIEM ha segnalato molti accessi falliti su \`SRV-FILE-02\`, il file server. Sasha ti ha esportato gli eventi in \`settimana/eventi.csv\`.

Il metodo lo conosci: **chi**, **da dove**, **quanto**, **cosa è successo dopo**. Puoi usare bash o PowerShell, come preferisci.`,
        },
        {
          kind: 'task',
          title: 'Quanti utenti presi di mira?',
          body: 'Conta gli **utenti diversi** con almeno un accesso fallito (Event ID 4625).',
          objective: 'Quanti account diversi hanno avuto un accesso fallito? Invia il numero con flag.',
          hints: ['Filtra 4625, prendi la colonna utente, togli i doppioni, conta.', "grep 4625 settimana/eventi.csv | cut -d, -f4 | sort -u | wc -l e poi: flag 7"],
          answer: ['7'],
          success: 'Sette account diversi, un tentativo ciascuno, in pochi minuti: non è qualcuno che ha dimenticato la password. È **password spraying**: una password comune provata su tanti utenti, per non far scattare il blocco dopo troppi errori sullo stesso account.',
        },
        {
          kind: 'task',
          title: 'Ha funzionato?',
          body: 'Dopo i fallimenti, cerca un accesso **riuscito** (4624) dallo stesso IP.',
          objective: 'Quale account è stato violato? Invia il nome con flag.',
          hints: ['grep sull\'IP e su 4624.', 'grep 4624 settimana/eventi.csv | grep 10.0.7.12 e poi: flag f.romano'],
          answer: ['f.romano'],
          success: 'Alle 02:12 `f.romano` è entrato dall\'IP dell\'attacco. La sua password era tra quelle provate: probabilmente debole o riusata.',
        },
        {
          kind: 'task',
          title: 'Cosa ha aperto?',
          body: 'L\'evento **5140** registra l\'accesso a una cartella condivisa. Guarda cosa ha visitato l\'account violato dopo l\'accesso.',
          objective: 'Quante cartelle condivise ha aperto f.romano di notte? Invia il numero con flag.',
          hints: ['grep 5140.', 'grep 5140 settimana/eventi.csv e poi: flag 2'],
          answer: ['2'],
          success: '**Contabilita** e **HR**: dati finanziari e personali di un magazziniere che di notte non avrebbe motivo di guardarli. Questo è un **incidente**, con possibile violazione di dati personali (GDPR: notifica al Garante entro 72 ore, se confermata).',
        },
        {
          kind: 'task',
          title: 'Da quale macchina?',
          body: 'L\'IP \`10.0.7.12\` è interno. Il server **DHCP** assegna gli IP ai PC: il suo log dice a chi era assegnato a quell\'ora.',
          objective: 'Quale PC aveva l\'IP 10.0.7.12? Invia il nome con flag.',
          hints: ['Cerca l\'IP in settimana/dhcp.log.', 'grep 10.0.7.12 settimana/dhcp.log e poi: flag MAG-PC-03'],
          answer: ['MAG-PC-03'],
          success: 'Un PC del magazzino, alle 2 di notte: è probabilmente compromesso, ed è da lì che parte l\'attacco. Escalation immediata al L2 con tutto quello che hai: account violato, cartelle aperte, PC sorgente, orari.',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Cosa distingue il password spraying dal brute force classico?',
          options: [
            'Poche password provate su molti account, per evitare il blocco dopo troppi errori',
            'Molte password provate su un solo account',
            'Usa solo password lunghe',
            'Funziona solo su Linux',
          ],
          correct: 0,
          explain: 'Brute force: un account, tante password (scatta il blocco). Spraying: tanti account, una o due password comuni ("Estate2077!"). Le difese: MFA, password non banali, regole del SIEM che contano gli utenti diversi per IP.',
        },
      ],
      recap: [
        ['password spraying', 'poche password comuni su molti account'],
        ['4625 / 4624', 'accesso fallito / riuscito'],
        ['5140', 'accesso a una cartella condivisa'],
        ['DHCP log', 'quale PC aveva un certo IP a una certa ora'],
        ['72 ore', 'termine GDPR per notificare una violazione di dati personali'],
      ],
    },

    // ------------------------------------------------------------------ giovedì
    {
      id: 'chSJ-m4',
      title: 'Giovedì · Hardening',
      tagline: 'Una configurazione SSH da rendere sicura, una chiave lasciata leggibile a tutti.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Rinforzare SRV-WEB-01',
          body: `@nyx: Giovedì: **hardening**. Dopo lo scanner che bussava su SSH tutta la settimana, Sasha ti chiede di preparare una configurazione SSH sicura per \`SRV-WEB-01\`, partendo da \`settimana/sshd_config\`.

Le regole del benchmark CIS per SSH che ti servono:
- \`PermitRootLogin no\` → root non entra direttamente
- \`PasswordAuthentication no\` → solo chiavi, niente password da indovinare
- \`MaxAuthTries 3\` → pochi tentativi per connessione
- \`X11Forwarding no\` → niente funzioni grafiche inutili su un server

Non si modifica l'originale: si prepara una versione nuova, si confronta, e solo dopo la revisione la si installa.`,
        },
        {
          kind: 'task',
          title: 'La nuova configurazione',
          body: `Crea \`settimana/sshd_config.nuovo\` applicando le quattro regole. Puoi usare \`sed\` con più sostituzioni (\`-e\` ripetuto, oppure separate da \`;\`), oppure copiare il file e modificarlo con \`nano\`.`,
          objective: 'Crea settimana/sshd_config.nuovo con le quattro impostazioni sicure.',
          noHints: true,
          hints: [
            'Ogni regola è una sostituzione: s/PermitRootLogin yes/PermitRootLogin no/ e così via.',
            "sed -e 's/PermitRootLogin yes/PermitRootLogin no/' -e 's/PasswordAuthentication yes/PasswordAuthentication no/' -e 's/MaxAuthTries 10/MaxAuthTries 3/' -e 's/X11Forwarding yes/X11Forwarding no/' settimana/sshd_config > settimana/sshd_config.nuovo",
          ],
          state: (sh) => {
            const f = sh.fs.get(`${sh.home}/settimana/sshd_config.nuovo`);
            if (!f || f.type !== 'file') return false;
            const t = f.content;
            return /^PermitRootLogin no$/m.test(t) && /^PasswordAuthentication no$/m.test(t) && /^MaxAuthTries 3$/m.test(t) && /^X11Forwarding no$/m.test(t) && /^PubkeyAuthentication yes$/m.test(t);
          },
          success: 'Configurazione pronta. Nota che `PubkeyAuthentication yes` è rimasto: se togli le password e anche le chiavi, nessuno entra più, nemmeno tu.',
        },
        {
          kind: 'task',
          title: 'Il confronto',
          body: 'Prima di consegnarla, mostra le differenze con l\'originale: chi la rivede guarda solo quelle.',
          objective: 'Confronta settimana/sshd_config con settimana/sshd_config.nuovo.',
          hints: ['diff VECCHIO NUOVO.', 'diff settimana/sshd_config settimana/sshd_config.nuovo'],
          check: (ev) => ev.type === 'command' && ev.name === 'diff' && ev.args.some((a) => a.endsWith('sshd_config.nuovo')),
          success: 'Quattro righe cambiate, nient\'altro. Una modifica piccola e leggibile passa la revisione in cinque minuti.',
        },
        {
          kind: 'task',
          title: 'La chiave',
          body: `In \`settimana\` c'è anche \`id_backup\`, una **chiave privata SSH**. Controlla i suoi permessi con \`ls -l\`: una chiave privata deve essere leggibile **solo** dal proprietario (SSH rifiuta perfino di usarla, altrimenti).`,
          objective: 'Sistema i permessi di settimana/id_backup.',
          noHints: true,
          hints: ['Solo il proprietario legge e scrive.', 'chmod 600 settimana/id_backup'],
          state: (sh) => sh.fs.get(`${sh.home}/settimana/id_backup`)?.perms === 'rw-------',
          success: '`rw-------`. Una chiave privata leggibile da tutti è come una chiave di casa lasciata sullo zerbino.',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          ex: 'interpreta',
          skills: ['diff'],
          question: `Cosa ti dice questa parte del diff?

\`\`\`
3c3
< PermitRootLogin yes
---
> PermitRootLogin no
\`\`\``,
          options: [
            'La riga 3 è cambiata: prima root poteva entrare via SSH, nella nuova versione no',
            'La riga 3 è stata cancellata',
            'Il file nuovo ha tre righe',
            'root non esiste più',
          ],
          correct: 0,
          explain: '`3c3` = la riga 3 del primo file è cambiata nella riga 3 del secondo; `<` è la versione vecchia, `>` quella nuova.',
        },
      ],
      recap: [
        ['hardening', 'ridurre la superficie d\'attacco con configurazioni sicure'],
        ['CIS Benchmark', 'raccolta di configurazioni consigliate per ogni sistema'],
        ['PermitRootLogin no', 'root non entra direttamente via SSH'],
        ['PasswordAuthentication no', 'solo chiavi'],
        ['chiave privata', 'permessi 600, mai condivisa'],
      ],
    },

    // ------------------------------------------------------------------ venerdì
    {
      id: 'chSJ-m5',
      title: 'Venerdì · Il report in inglese',
      tagline: 'Il lessico del mestiere e un report settimanale che una responsabile straniera può leggere.',
      xp: 400,
      steps: [
        {
          kind: 'lesson',
          title: 'La lingua del mestiere',
          body: `@nyx: La sicurezza informatica si fa in inglese: documentazione, CVE, avvisi, strumenti, colloqui nelle aziende internazionali. Non serve un inglese perfetto: serve il **lessico giusto** e frasi semplici.

Le parole che userai ogni giorno:
- **finding** → un problema trovato (una "segnalazione")
- **severity** → gravità (low, medium, high, critical)
- **affected asset** → la macchina o il servizio colpito
- **evidence** → le prove (log, screenshot, output)
- **impact** → cosa può succedere
- **remediation** / **recommendation** → la correzione / il consiglio
- **root cause** → la causa vera
- **timeline** → la cronologia
- **containment**, **eradication**, **recovery** → contenimento, eliminazione, ripristino
- **false positive** → falso positivo; **escalate** → passare al livello superiore

Frasi utili:
- *"We identified..."* → abbiamo individuato
- *"We recommend upgrading X to version Y or later."* → raccomandiamo di aggiornare
- *"No evidence of data exfiltration was found."* → nessuna prova di furto di dati
- *"The account was disabled at 10:15 UTC."* → l'account è stato disattivato alle...

!! Negli orari dei report internazionali si indica il fuso orario, di solito **UTC**.`,
        },
        {
          kind: 'quiz',
          title: 'Il lessico',
          question: 'Come si dice in inglese "la causa vera di un incidente"?',
          options: ['root cause', 'main reason finding', 'true source', 'base error'],
          correct: 0,
          explain: '*Root cause analysis* (RCA) è l\'analisi che cerca la causa profonda, non solo il sintomo.',
        },
        {
          kind: 'quiz',
          title: 'Il lessico',
          question: 'Cosa vuol dire "remediation" in un report di vulnerabilità?',
          options: ['La correzione da applicare', 'La gravità', 'Le prove raccolte', 'Il server colpito'],
          correct: 0,
          explain: 'Ogni finding ha: description, severity, affected asset, evidence, impact, remediation.',
        },
        {
          kind: 'quiz',
          title: 'Il lessico',
          ex: 'correggi',
          question: 'Quale frase va bene in un report?',
          options: [
            'We recommend upgrading Jenkins on range.lan to version 2.400 or later.',
            'Jenkins is very very bad and must be fixed now!!!',
            'Maybe Jenkins has some problem, I think.',
            'Upgrade the thing on the server.',
          ],
          correct: 0,
          explain: 'Precisa (cosa, dove, a quale versione), neutra, verificabile. Niente opinioni, niente punti esclamativi, niente "the thing".',
        },
        {
          kind: 'quiz',
          title: 'Il lessico',
          question: 'In un incidente, "containment" viene prima di...',
          options: ['eradication e recovery', 'detection', 'preparation', 'identification'],
          correct: 0,
          explain: 'Le fasi del NIST SP 800-61: preparation, detection & analysis, containment, eradication, recovery, post-incident activity (lessons learned).',
        },
        {
          kind: 'lesson',
          title: 'Il report settimanale',
          body: `Un report settimanale per una responsabile ha una struttura fissa, ed è breve:

\`\`\`
# Weekly security report - week 46

## Summary
Two-line overview: what happened, what is urgent.

## Findings
1. [High] Two former employees still have active accounts
   (g.bianchi, t.moretti). Remediation: disable today.
2. [Critical] range.lan: Jenkins 2.150 exposed to the Internet,
   CVE-2077-1188 (CVSS 9.8, KEV). Remediation: upgrade to 2.400+.
...

## Recommendations
- Enforce MFA for all admin accounts.
\`\`\`

\`#\` e \`##\` sono titoli in **Markdown**, il formato di testo usato per la documentazione tecnica (GitHub, wiki, ticket). Si legge bene anche come testo semplice.`,
        },
        {
          kind: 'task',
          title: 'Scrivi il report',
          body: `Scrivi \`settimana/report.md\` in inglese, con le sezioni **Summary**, **Findings** e **Recommendations**. Nei findings ci devono essere i quattro lavori della settimana:
- gli account (g.bianchi, t.moretti, p.ivanova senza MFA)
- la vulnerabilità di range.lan (CVE-2077-1188)
- il **password spraying** su SRV-FILE-02 con l'account violato f.romano
- l'hardening SSH (**PermitRootLogin**)

Usa \`nano settimana/report.md\`. Frasi semplici vanno benissimo.`,
          objective: 'Scrivi settimana/report.md in inglese con Summary, Findings, Recommendations e i quattro argomenti della settimana.',
          noHints: true,
          hints: [
            'Parti dal modello della lezione: tre titoli, poi un finding numerato per ogni giorno.',
            'Summary: password spraying compromised f.romano... Findings: g.bianchi, t.moretti, p.ivanova (no MFA), CVE-2077-1188 on range.lan, PermitRootLogin yes on SRV-WEB-01. Recommendations: ...',
          ],
          state: (sh) =>
            fileHas(sh, 'settimana/report.md', ['summary', 'findings', 'recommendation', 'g.bianchi', 'p.ivanova', 'CVE-2077-1188', 'password spraying', 'f.romano', 'PermitRootLogin']),
          success: `Report consegnato. Ecco una versione di riferimento, da confrontare con la tua:

\`\`\`
# Weekly security report - week 46

## Summary
A password spraying attack from MAG-PC-03 compromised the account
f.romano on SRV-FILE-02 (Contabilita and HR shares accessed).
Escalated to L2 on Wednesday. One critical vulnerability is exposed
to the Internet and must be fixed today.

## Findings
1. [Critical] range.lan - Jenkins 2.150 exposed to the Internet,
   CVE-2077-1188 (CVSS 9.8, in KEV). Upgrade to 2.400 or later.
2. [High] Password spraying on SRV-FILE-02, 7 accounts targeted,
   f.romano compromised at 02:12. Possible personal data breach:
   DPO informed (GDPR, 72 hours).
3. [High] Former employees with active accounts: g.bianchi,
   t.moretti. Admin without MFA: p.ivanova.
4. [Medium] SRV-WEB-01 SSH allows root login and passwords.
   Hardened config ready for review (PermitRootLogin no).

## Recommendations
- Enforce MFA for every admin and remote access.
- Automate account removal when HR marks an employee as leaver.
- Patch internet-facing systems within 48 hours for KEV entries.
\`\`\``,
        },
        {
          kind: 'lesson',
          title: 'Fine della settimana',
          body: `@rook: Sasha ha letto il report e ha risposto con una riga: *"Great week. Let's talk about your next steps on Monday."* Da queste parti è un complimento enorme.

@nyx: In una settimana hai fatto una revisione degli accessi, un vulnerability assessment con le priorità giuste, un'indagine su un attacco reale fino all'escalation, un hardening con revisione, e un report in inglese. È, quasi parola per parola, l'elenco delle mansioni negli annunci per **junior SOC analyst**, **IT security specialist** e **vulnerability analyst**.

@nyx: L'ultimo capitolo parla di come trasformare tutto questo in un lavoro vero: laboratori, certificazioni, portfolio, colloqui.`,
        },
      ],
      recap: [
        ['finding / severity', 'segnalazione / gravità'],
        ['evidence / impact', 'prove / conseguenze possibili'],
        ['remediation / recommendation', 'correzione / consiglio'],
        ['root cause', 'la causa vera'],
        ['containment, eradication, recovery', 'contenimento, eliminazione, ripristino'],
        ['UTC', 'il fuso orario dei report internazionali'],
        ['Markdown', '# titoli, ## sottotitoli: il formato della documentazione tecnica'],
      ],
    },
  ],
};
