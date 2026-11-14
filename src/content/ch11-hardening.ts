import type { Chapter } from '../game/types';

export const CH11: Chapter = {
  id: 'ch11',
  code: '11',
  title: 'Rinforzare i sistemi',
  subtitle: 'Privilegi, servizi, aggiornamenti e difesa in profondità',
  missions: [
    // ------------------------------------------------------------------ 11.1
    {
      id: 'ch11-m1',
      title: 'Dopo la porta d\'ingresso',
      tagline: 'Cosa fa un attaccante una volta dentro, e perché il difensore deve saperlo.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Entrare non basta',
          body: `@nyx: In tutti i casi che hai risolto, l'attaccante è entrato da una porta "piccola": un account normale, un utente del server web. Da lì, però, ha sempre cercato di **allargarsi**. Capire come lo fa è il modo migliore per impedirglielo.

Dopo l'accesso iniziale, un attaccante di solito cerca di:
- **Privilege Escalation** (ottenere più privilegi): da utente normale a root
- **Persistence** (persistenza): restare anche dopo un riavvio o un cambio di password
- **Lateral Movement** (movimento laterale): passare ad altre macchine della rete
- **Collection / Exfiltration**: raccogliere e portare fuori i dati

Sono le tattiche di ATT&CK che hai già visto nel capitolo 08.`,
        },
        {
          kind: 'lesson',
          title: 'Le cause più comuni',
          body: `La buona notizia per chi difende: l'escalation di privilegi, nella grande maggioranza dei casi, **non** richiede attacchi geniali. Sfrutta **errori di configurazione** che si possono trovare e correggere:

- **software non aggiornato**, con vulnerabilità note (capitolo 10)
- **permessi sbagliati**: script eseguiti da root ma modificabili da tutti (capitolo 03)
- **regole sudo troppo larghe**: un utente può eseguire come root programmi che permettono di fare molto più del previsto
- **file SUID** non necessari: programmi che girano sempre con i permessi del proprietario (spesso root)
- **credenziali dimenticate** in file leggibili: configurazioni, script, cronologie
- **password riutilizzate** tra account e macchine diverse

!! Questo capitolo ti insegna a **trovare** questi errori, come fa un auditor o un amministratore attento, e a correggerli. Non entra nei dettagli di come sfruttarli: per quello, se vorrai specializzarti in penetration testing, esistono laboratori legali dedicati (vedi la sezione Carriera).`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Lo script `/opt/market/sync.sh` dell\'operazione OP-01 era eseguito da root ogni 5 minuti e aveva permessi 777. A quale categoria appartiene?',
          options: [
            'Software non aggiornato',
            'Permessi sbagliati: chiunque può modificare comandi che verranno eseguiti come root',
            'Password riutilizzate',
            'Non è un problema',
          ],
          correct: 1,
          explain: `È un errore di **permessi**: qualunque utente del sistema poteva modificarlo, e root lo avrebbe eseguito. Correzione: proprietario root, permessi \`700\` o \`755\`.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Perché un attaccante che ha l\'accesso come `www-data` cerca subito di diventare root?',
          options: [
            'Per poter navigare su Internet',
            'Perché con root può leggere tutto, nascondersi meglio, installare persistenza e usare la macchina per muoversi verso le altre',
            'Perché www-data non può usare il terminale',
            'Non gli interessa',
          ],
          correct: 1,
          explain: `\`www-data\` vede solo i file del sito. Root controlla tutto: i log (che può cancellare), le password degli altri utenti, i servizi. Per questo il **minimo privilegio** è così importante: limita i danni del primo accesso.`,
        },
      ],
      recap: [
        ['Privilege Escalation', 'da utente normale ad amministratore'],
        ['Lateral Movement', 'passare da una macchina all\'altra'],
        ['cause comuni', 'aggiornamenti mancanti, permessi, sudo, SUID, credenziali in chiaro, riuso'],
        ['errori di configurazione', 'la causa più frequente, e la più facile da correggere'],
      ],
    },

    // ------------------------------------------------------------------ 11.2
    {
      id: 'ch11-m2',
      title: 'Audit dei privilegi',
      tagline: 'sudo -l, file SUID e credenziali dimenticate sul server di laboratorio.',
      xp: 250,
      steps: [
        {
          kind: 'task',
          title: 'Entra nel laboratorio',
          body: `C'è un server di **laboratorio**, configurato male apposta, su cui esercitarti. Collegati:

\`\`\`
ssh studente@lab.lan
\`\`\`

Leggi il file di benvenuto nella tua home sul server.`,
          objective: 'Collegati a lab.lan come studente.',
          hints: ['Scrivi: ssh studente@lab.lan'],
          check: (ev) => ev.type === 'ssh' && ev.host === 'lab',
          success: `Sei dentro come utente normale. Ora guarda il sistema con gli occhi di un auditor: cosa potrebbe fare un attaccante che si trovasse qui al tuo posto?`,
        },
        {
          kind: 'lesson',
          title: 'sudo e le sue regole',
          body: `Le regole di \`sudo\` (nel file \`/etc/sudoers\`) dicono quali utenti possono eseguire quali comandi **come root**. Il comando \`sudo -l\` mostra le regole del tuo utente.

Cosa guardare:
- \`(ALL) ALL\` → l'utente può fare tutto come root. Va bene solo per gli amministratori veri
- \`NOPASSWD\` → non serve nemmeno la password: se l'account viene violato, l'attaccante ha subito i poteri di root
- comandi "potenti" concessi come root: molti programmi comuni (editor, \`find\`, \`less\`, linguaggi di scripting...) hanno funzioni per **eseguire altri comandi** o aprire una shell. Concederli via sudo equivale, di fatto, a concedere root

?? Esiste un catalogo pubblico, **GTFOBins**, che elenca quali programmi possono essere usati per uscire dai limiti previsti. Gli amministratori lo usano per verificare le proprie regole sudo.`,
        },
        {
          kind: 'task',
          title: 'Le regole di sudo',
          body: `Controlla cosa può fare il tuo utente sul laboratorio:

\`\`\`
sudo -l
\`\`\`

Una delle due regole è pericolosa: concede **senza password** un programma che può eseguire altri comandi. Quale programma? Invia il suo nome con \`flag\`.`,
          objective: 'Trova la regola sudo pericolosa e invia il programma.',
          hints: ['sudo -l (sul server lab, non sul tuo deck!)', 'La regola con NOPASSWD riguarda /usr/bin/find: flag find'],
          answer: ['find', '/usr/bin/find'],
          success: `\`(root) NOPASSWD: /usr/bin/find\`. Probabilmente qualcuno voleva permettere di cercare file di sistema, ma \`find\` ha un'opzione per **eseguire comandi** sui file trovati: eseguito come root, quei comandi girano come root. In pratica, quella regola equivale a dare root a \`studente\`.

L'altra regola, \`systemctl restart nginx\`, è invece un buon esempio: concede **un'azione precisa** e nient'altro. Correzione: togliere la regola su find, e scrivere regole strette come quella di nginx.`,
        },
        {
          kind: 'lesson',
          title: 'I file SUID',
          body: `Normalmente un programma gira con i permessi di **chi lo lancia**. Un file con il bit **SUID** (*Set User ID*) gira invece con i permessi del suo **proprietario**. Nei permessi si vede una \`s\` al posto della \`x\`:

\`\`\`
-rwsr-xr-x 1 root root ... /usr/bin/passwd
\`\`\`

\`passwd\` deve essere SUID: un utente normale deve poter cambiare la propria password, che sta in \`/etc/shadow\`, un file che solo root può scrivere.

Ma ogni file SUID di root è un **rischio**: se ha un difetto, o se permette di eseguire altri comandi, diventa una scorciatoia verso root. Per questo un audit elenca tutti i file SUID e verifica che siano **solo quelli standard** del sistema.

\`\`\`
find /usr -perm -4000 2>/dev/null
\`\`\`

(Con \`/\` al posto di \`/usr\` la ricerca parte dalla radice, cioè da tutto il sistema.)`,
        },
        {
          kind: 'task',
          title: 'Caccia ai SUID',
          body: `Elenca tutti i file SUID del laboratorio:

\`\`\`
find / -perm -4000 2>/dev/null
\`\`\`

Quelli in \`/usr/bin\` (passwd, sudo, su, mount) sono standard. Uno invece è **personalizzato** e fuori posto. Invia il suo percorso completo con \`flag\`.`,
          objective: 'Trova il file SUID non standard.',
          hints: ['find / -perm -4000 2>/dev/null', 'Quello in /usr/local/bin non fa parte del sistema: flag /usr/local/bin/backup-tool'],
          answer: ['/usr/local/bin/backup-tool', 'backup-tool'],
          success: `\`/usr/local/bin/backup-tool\`: un programma installato a mano, di proprietà di root e con il bit SUID. Nessuno sa come sia stato scritto: se ha un difetto qualsiasi, chiunque sul sistema può sfruttarlo per diventare root.

Correzione: togliere il bit SUID (\`chmod u-s\`) e, se il backup ha bisogno di root, farlo girare da **cron come root** in modo controllato, oppure con una regola sudo stretta.`,
        },
        {
          kind: 'task',
          title: 'Credenziali nei file',
          body: `Un'altra miniera per gli attaccanti: **password scritte nei file** di configurazione, leggibili da tutti. Cerca nella cartella \`/opt\`:

\`\`\`
find /opt -name "*.ini"
cat /opt/app/config.ini
\`\`\`

Quale password del database è scritta in chiaro? Inviala con \`flag\`.`,
          objective: 'Trova la password in chiaro in /opt e inviala.',
          hints: ['find /opt -name "*.ini" e poi cat su ciascun file', 'flag Labirinto!42'],
          answer: ['Labirinto!42'],
          success: `\`Labirinto!42\`, in un file con permessi \`rw-r--r--\`: qualunque utente del server la può leggere.

Le applicazioni hanno bisogno delle loro password, ma ci sono modi migliori:
- file di configurazione leggibili **solo** dall'utente dell'applicazione (\`600\`)
- **variabili d'ambiente** o, meglio, un **gestore di segreti** (*secrets manager*, come Vault)
- account del database con i **soli** permessi necessari all'applicazione

Tieni a mente questa password: la ritroverai.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Quale di queste regole sudo è la più sicura per un utente che deve solo riavviare il server web?',
          options: [
            '(ALL) NOPASSWD: ALL',
            '(root) NOPASSWD: /usr/bin/vim',
            '(root) /usr/bin/systemctl restart nginx',
            '(root) /bin/bash',
          ],
          correct: 2,
          explain: `Concede **solo** l'azione necessaria, con un comando preciso e i suoi argomenti, e chiede la password. Le altre, in un modo o nell'altro, equivalgono a dare pieni poteri: \`vim\` e \`bash\` permettono di eseguire qualsiasi comando come root.`,
        },
      ],
      recap: [
        ['sudo -l', 'le regole sudo del tuo utente'],
        ['NOPASSWD', 'sudo senza password: rischioso se l\'account viene violato'],
        ['programmi potenti via sudo', 'editor, find, shell... equivalgono a dare root'],
        ['GTFOBins', 'catalogo dei programmi che permettono di uscire dai limiti'],
        ['SUID', 'il file gira con i permessi del proprietario (s al posto di x)'],
        ['find / -perm -4000', 'elenca i file SUID'],
        ['segreti in chiaro', 'meglio permessi 600, variabili d\'ambiente o secrets manager'],
      ],
    },

    // ------------------------------------------------------------------ 11.3
    {
      id: 'ch11-m3',
      title: 'Hardening',
      tagline: 'Spegnere il superfluo, aggiornare, configurare SSH: rendere un server più duro.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Ridurre la superficie',
          body: `**Hardening** significa "indurire" un sistema: togliere tutto ciò che non serve e configurare bene il resto. I principi:

- **ridurre la superficie d'attacco**: ogni servizio, account o programma in più è una porta in più
- **aggiornare** con regolarità, soprattutto gli aggiornamenti di sicurezza
- **configurazioni sicure** invece di quelle predefinite
- **minimo privilegio** ovunque
- **registrare** (log) ciò che succede, e mandarlo a un SIEM

Esistono guide pubbliche molto dettagliate: i **CIS Benchmarks** descrivono, sistema per sistema, centinaia di impostazioni consigliate.`,
        },
        {
          kind: 'task',
          title: 'Cosa ascolta il server?',
          body: `Sul laboratorio (se sei uscito, ricollegati con \`ssh studente@lab.lan\`) guarda i servizi in ascolto:

\`\`\`
ss -tlnp
\`\`\`

Uno di questi servizi non dovrebbe esistere su un server moderno: trasmette tutto in chiaro e ha un sostituto sicuro. Invia il nome del servizio con \`flag\`.`,
          objective: 'Trova il servizio da spegnere e invialo.',
          hints: ['ss -tlnp sul server lab', 'Porta 23: flag telnet'],
          answer: ['telnet', 'in.telnetd', 'telnetd', '23'],
          success: `**telnet** sulla porta 23: va spento, SSH fa la stessa cosa in modo cifrato.

Nota anche **MySQL sulla 3306 in ascolto su \`0.0.0.0\`**, cioè su tutte le interfacce: il database è raggiungibile dalla rete, ma lo usa solo l'applicazione sullo stesso server. Andrebbe messo in ascolto solo su \`127.0.0.1\` (localhost). Stesso servizio, molta meno esposizione.`,
        },
        {
          kind: 'task',
          title: 'Aggiornamenti',
          body: `Controlla gli aggiornamenti disponibili:

\`\`\`
apt list --upgradable
\`\`\`

Quelli dal canale **-security** correggono vulnerabilità. Quanti sono? Invia il numero con \`flag\`.`,
          objective: 'Conta gli aggiornamenti di sicurezza disponibili.',
          hints: ['apt list --upgradable', 'Puoi contarli con: apt list --upgradable | grep -c security. flag 3'],
          answer: ['3'],
          success: `**3 aggiornamenti di sicurezza**: OpenSSH, il kernel Linux e sudo. Sono esattamente i componenti più delicati: il servizio esposto a Internet, il cuore del sistema e lo strumento che dà i privilegi di root.

Sui server si configurano di solito gli **aggiornamenti automatici di sicurezza** (su Ubuntu, \`unattended-upgrades\`), più una finestra di manutenzione per quelli che richiedono un riavvio.`,
        },
        {
          kind: 'task',
          title: 'Una configurazione SSH robusta',
          body: `Prepara una **proposta di configurazione** SSH per l'amministratore. Apri il file nella tua home sul laboratorio:

\`\`\`
nano sshd_config.proposta
\`\`\`

Cambia queste due righe:

\`\`\`
PermitRootLogin no
PasswordAuthentication no
\`\`\`

e salva. (Puoi anche disattivare \`X11Forwarding\`, che non serve su un server.)`,
          objective: 'Correggi PermitRootLogin e PasswordAuthentication nella proposta.',
          hints: [
            'Sul server lab: nano sshd_config.proposta',
            'Cambia "yes" in "no" su PermitRootLogin e PasswordAuthentication, poi premi Salva.',
          ],
          check: (ev, sh) => {
            if (ev.type !== 'saved' || !ev.path.endsWith('sshd_config.proposta')) return false;
            const n = sh.fs.get(ev.path);
            if (!n || n.type !== 'file') return false;
            const c = n.content;
            return /^\s*PermitRootLogin\s+no\b/m.test(c) && /^\s*PasswordAuthentication\s+no\b/m.test(c);
          },
          success: `Con questa configurazione:
- **nessuno** può entrare direttamente come root: si entra con il proprio utente e poi si usa sudo (che lascia una traccia nei log)
- **solo chiavi SSH**: il brute force e lo spraying su SSH diventano inutili

Sono le due impostazioni che avrebbero impedito gli attacchi del capitolo 04 e dell'operazione OP-02.

!! Su un server vero, prima di disattivare le password, verifica **due volte** che la tua chiave funzioni, da una seconda sessione ancora aperta. Altrimenti rischi di chiuderti fuori.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un database usato solo da un\'applicazione sullo stesso server è in ascolto su 0.0.0.0:3306. Qual è la correzione migliore?',
          options: [
            'Cambiare la porta in 3307',
            'Metterlo in ascolto solo su 127.0.0.1, così non è raggiungibile dalla rete',
            'Spegnere il server',
            'Non serve correggere nulla',
          ],
          correct: 1,
          explain: `Se nessuno da fuori deve usarlo, non deve essere raggiungibile da fuori. Cambiare porta è solo *security through obscurity*: una scansione la trova in un secondo. Meglio ancora: ascolto su localhost **e** firewall che blocca la 3306.`,
        },
      ],
      recap: [
        ['hardening', 'togliere il superfluo, configurare bene il resto'],
        ['CIS Benchmarks', 'guide pubbliche di configurazione sicura'],
        ['ss -tlnp', 'servizi in ascolto e processi'],
        ['0.0.0.0 vs 127.0.0.1', 'tutte le interfacce vs solo il server stesso'],
        ['apt list --upgradable', 'aggiornamenti disponibili; -security = correzioni di sicurezza'],
        ['unattended-upgrades', 'aggiornamenti di sicurezza automatici'],
        ['PermitRootLogin no / PasswordAuthentication no', 'la configurazione SSH di base'],
      ],
    },

    // ------------------------------------------------------------------ 11.4
    {
      id: 'ch11-m4',
      title: 'Difesa in profondità',
      tagline: 'Movimento laterale, riuso delle credenziali, zero trust e strati di difesa.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Il movimento laterale',
          body: `Una volta conquistata una macchina, l'attaccante raramente si ferma: la usa come trampolino verso le altre. Il **movimento laterale** sfrutta soprattutto:
- **credenziali riutilizzate**: la stessa password su più account o server
- **credenziali salvate** sulla macchina conquistata: chiavi SSH, file di configurazione, password memorizzate
- **reti piatte**, senza segmentazione: dalla prima macchina si raggiungono tutte le altre
- **account con troppi privilegi** su molte macchine, come un amministratore che usa lo stesso account ovunque

Se hai giocato l'Operazione "Il tram fantasma", ne hai visto un esempio completo. E ricordi il dispositivo sconosciuto nella rete del bar? Sono esempi di attaccanti che cercano di allargarsi.`,
        },
        {
          kind: 'task',
          title: 'Il riuso',
          body: `Sul laboratorio, la password \`Labirinto!42\` che hai trovato in \`/opt/app/config.ini\` compare anche in un **altro** file, di un'altra applicazione. Trovalo:

\`\`\`
grep Labirinto /opt/app/config.ini /opt/report/report.ini
\`\`\`

Invia il percorso del secondo file con \`flag\`.`,
          objective: 'Trova il secondo file con la stessa password.',
          hints: ['Sul server lab: grep Labirinto /opt/app/config.ini /opt/report/report.ini', 'flag /opt/report/report.ini'],
          answer: ['/opt/report/report.ini', 'report.ini'],
          success: `Due applicazioni diverse, due utenti del database diversi, **la stessa password**. Chi ne scopre una le ha tutte e due. Moltiplicalo per decine di server e capisci perché il riuso delle credenziali è il carburante del movimento laterale.

Le soluzioni: password **uniche** e generate (un gestore di segreti lo fa in automatico) e, per gli account amministrativi su Windows, strumenti come **LAPS** che assegnano una password diversa a ogni macchina.`,
        },
        {
          kind: 'lesson',
          title: 'Difesa in profondità',
          body: `Nessuna difesa è perfetta. La **difesa in profondità** mette **più strati**, così che se uno cede, il successivo ferma o rallenta l'attaccante, e intanto il SOC se ne accorge:

\`\`\`
persone      formazione, phishing simulati
perimetro    firewall, VPN con MFA, servizi esposti al minimo
rete         segmentazione, VLAN, IDS
sistemi      hardening, aggiornamenti, minimo privilegio, EDR
applicazioni codice sicuro, query parametrizzate, WAF
dati         cifratura, backup, controllo accessi
rilevamento  log centralizzati, SIEM, threat hunting
risposta     piano di incident response, backup testati
\`\`\`

L'**EDR** (*Endpoint Detection and Response*) è un "antivirus evoluto" che osserva il comportamento dei processi su ogni computer e permette di isolarli a distanza.

E i **backup**: la regola **3-2-1** dice 3 copie dei dati, su 2 supporti diversi, di cui 1 fuori sede (e almeno una **offline**, che un ransomware non può raggiungere). Un backup che non hai mai provato a ripristinare non è un backup.`,
        },
        {
          kind: 'lesson',
          title: 'Zero trust',
          body: `Il modello tradizionale era a "castello": fuori i cattivi, dentro tutti fidati. Ma tutti gli incidenti che hai visto dimostrano che **l'attaccante finisce dentro**.

Il modello **zero trust** parte da qui: **"non fidarti mai, verifica sempre"**.
- ogni accesso viene verificato (identità, dispositivo, contesto), anche dalla rete interna
- ogni utente e servizio accede **solo** a ciò che gli serve
- si assume che una violazione sia già avvenuta, e si limita quanto lontano può arrivare

Non è un prodotto da comprare: è un modo di progettare la sicurezza.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica finale',
          question: 'Un attaccante ha violato il PC della reception. Quale combinazione di difese limita di più quanto lontano può arrivare?',
          options: [
            'Un antivirus aggiornato sul PC della reception',
            'Segmentazione della rete, password uniche per ogni sistema, MFA, minimo privilegio e un SOC che sorveglia i log',
            'Un firewall perimetrale molto costoso',
            'Cambiare il nome di dominio',
          ],
          correct: 1,
          explain: `Il firewall perimetrale non vede quello che succede **dentro**. Per limitare il movimento laterale servono più strati: la rete divisa (segmentazione), credenziali che non funzionano altrove (password uniche, MFA), account con pochi poteri e qualcuno che se ne accorge in fretta. È la difesa in profondità.`,
        },
      ],
      recap: [
        ['movimento laterale', 'usare una macchina conquistata per raggiungere le altre'],
        ['riuso delle credenziali', 'stessa password in più posti: il carburante del movimento laterale'],
        ['LAPS', 'password di amministratore locale diversa per ogni PC Windows'],
        ['difesa in profondità', 'più strati: se uno cede, il prossimo ferma'],
        ['EDR', 'sorveglianza dei processi su ogni computer'],
        ['backup 3-2-1', '3 copie, 2 supporti, 1 fuori sede (e offline)'],
        ['zero trust', 'non fidarti mai, verifica sempre'],
      ],
    },
  ],
};
