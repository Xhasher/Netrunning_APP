import type { Chapter } from '../game/types';

export const CH13: Chapter = {
  id: 'ch13',
  code: '13',
  title: 'Cloud e carriera',
  subtitle: 'Il cloud, gli strumenti veri, il laboratorio di casa, il report e il lavoro',
  missions: [
    // ------------------------------------------------------------------ 13.1
    {
      id: 'ch13-m1',
      title: 'La nuvola',
      tagline: 'Responsabilità condivisa, IAM e gli errori più comuni nel cloud.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Il computer di qualcun altro',
          body: `Sempre più aziende non hanno server propri: usano il **cloud** (AWS di Amazon, Azure di Microsoft, Google Cloud...). Si affittano risorse e si pagano a consumo:
- **IaaS**: macchine virtuali, reti, dischi. Gestisci tu il sistema operativo
- **PaaS**: piattaforme pronte (database, hosting di applicazioni). Gestisci solo l'applicazione
- **SaaS**: software già pronto (posta, CRM, Office 365). Gestisci solo utenti e dati

Il principio da capire è il **modello di responsabilità condivisa**: il fornitore protegge **il cloud** (data center, hardware, rete di base), il cliente protegge ciò che mette **nel cloud** (configurazioni, accessi, dati). La stragrande maggioranza degli incidenti cloud non nasce da falle del fornitore, ma da **errori di configurazione del cliente**.`,
        },
        {
          kind: 'lesson',
          title: 'IAM: chi può fare cosa',
          body: `Nel cloud tutto passa dall'**IAM** (*Identity and Access Management*): utenti, ruoli e **policy**, cioè regole scritte (spesso in JSON) che dicono chi può fare cosa su quale risorsa.

Gli errori classici:
- **storage pubblico**: un "bucket" (un contenitore di file) leggibile da chiunque su Internet
- **chiavi di accesso** finite nel codice e pubblicate su GitHub: dei programmi automatici le cercano di continuo, e le usano entro minuti
- utenti e ruoli con **troppi permessi** (\`AdministratorAccess\` dato "per comodità")
- account principale (**root**) senza MFA
- **log disattivati** (in AWS: CloudTrail): niente prove in caso di incidente

Ti suonano familiari? Sono gli stessi principi di sempre (minimo privilegio, segreti protetti, MFA, log), applicati a un'infrastruttura diversa.`,
        },
        {
          kind: 'task',
          title: 'Il bucket',
          body: `Neon Ottica ti ha passato un'esportazione della sua configurazione cloud nella cartella \`cloud\`. Leggi la policy del suo storage:

\`\`\`
cat cloud/bucket-policy.json
\`\`\`

\`"Principal": "*"\` vuol dire "**chiunque**", anche senza account. Come si chiama il bucket esposto? Invialo con \`flag\`.`,
          objective: 'Trova il bucket leggibile da chiunque.',
          hints: ['cat cloud/bucket-policy.json', 'flag neonottica-scontrini-2077'],
          answer: ['neonottica-scontrini-2077'],
          success: `Gli **scontrini** dei clienti (nomi, acquisti, magari dati delle ricette mediche) leggibili da chiunque conosca o indovini il nome del bucket. È uno dei data breach più comuni in assoluto, e uno dei più facili da evitare: lo storage deve essere **privato per impostazione predefinita**, e i provider offrono un blocco globale dell'accesso pubblico.`,
        },
        {
          kind: 'task',
          title: 'La chiave nel codice',
          body: `Nella cartella \`cloud/repo\` c'è il codice del sito. Le chiavi di accesso AWS iniziano sempre con \`AKIA\`. Cerca se ce n'è una, ricordandoti dei file nascosti:

\`\`\`
ls -a cloud/repo
grep AKIA cloud/repo/.env
\`\`\`

In quale file è finita la chiave? Invia il nome del file con \`flag\`.`,
          objective: 'Trova il file con la chiave di accesso cloud.',
          hints: ['ls -a cloud/repo: c\'è un file nascosto.', 'flag .env'],
          answer: ['.env', 'cloud/repo/.env'],
          success: `Il file \`.env\` con chiave e segreto, dentro il repository del codice. Se questo repository viene pubblicato (anche solo per un minuto, anche se poi si cancella il file: resta nella **cronologia** di Git), la chiave va considerata compromessa.

Le difese:
- un file \`.gitignore\` che impedisca di includere \`.env\`
- strumenti di **secret scanning** (GitHub lo fa in automatico; esistono anche gitleaks e trufflehog) che bloccano i segreti prima della pubblicazione
- nel cloud, preferire **ruoli** temporanei alle chiavi permanenti
- se una chiave esce: **revocarla subito**, poi indagare nei log su cosa è stato fatto con quella chiave`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Secondo il modello di responsabilità condivisa, chi è responsabile se un bucket di Neon Ottica è pubblico per errore?',
          options: [
            'Amazon, perché il bucket è sui suoi server',
            'Neon Ottica, perché la configurazione degli accessi è responsabilità del cliente',
            'Nessuno',
            'Il visitatore che lo trova',
          ],
          correct: 1,
          explain: `Il fornitore garantisce che lo storage funzioni e sia protetto fisicamente; **chi può leggerlo** lo decide il cliente con le sue policy. Per questo la sicurezza cloud è soprattutto sicurezza delle **configurazioni**.`,
        },
      ],
      recap: [
        ['IaaS / PaaS / SaaS', 'macchine / piattaforme / software pronti'],
        ['responsabilità condivisa', 'il fornitore protegge il cloud, il cliente ciò che ci mette dentro'],
        ['IAM e policy', 'chi può fare cosa su quale risorsa'],
        ['"Principal": "*"', 'accessibile a chiunque'],
        ['AKIA...', 'formato delle chiavi di accesso AWS'],
        ['secret scanning', 'trovare i segreti nel codice prima che escano'],
        ['CloudTrail', 'il registro delle azioni in AWS: va sempre attivo'],
      ],
    },

    // ------------------------------------------------------------------ 13.2
    {
      id: 'ch13-m2',
      title: 'La cassetta degli attrezzi',
      tagline: 'Gli strumenti veri del mestiere, cosa fanno e quando si usano, e come lavorare più veloce.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Rete e web',
          body: `In questo gioco hai usato versioni semplificate di strumenti veri. Ecco quelli che troverai nel lavoro, per categoria.

**Rete**
- **nmap**: la ricognizione di rete che conosci, con centinaia di opzioni e script (NSE)
- **Wireshark**: l'analisi grafica del traffico, il "tcpdump con gli occhiali". Filtri come \`http\`, \`dns\`, \`ip.addr == 10.0.0.5\`
- **tcpdump**: la cattura da terminale, perfetta sui server

**Web**
- **Burp Suite** (Community gratuita) e **OWASP ZAP** (gratuito): proxy che si mettono tra il browser e il sito e permettono di vedere, modificare e ripetere ogni richiesta HTTP. Lo strumento numero uno per chi testa applicazioni web
- **gli strumenti per sviluppatori del browser** (F12): già potentissimi per capire come funziona una pagina

?? Il percorso gratuito **PortSwigger Web Security Academy** (degli autori di Burp) insegna a usare Burp con laboratori legali.`,
        },
        {
          kind: 'lesson',
          title: 'Difesa e analisi',
          body: `**SIEM e monitoraggio**
- **Wazuh**: SIEM e rilevamento open source e gratuito. Ottimo per il laboratorio di casa
- **Splunk** (versione gratuita limitata) e **Microsoft Sentinel**: molto diffusi nelle aziende
- **Security Onion**: una distribuzione Linux che mette insieme SIEM, IDS e analisi del traffico

**Endpoint**
- **Sysmon**: registrazione dettagliata su Windows (l'hai visto nel capitolo 12)
- **Velociraptor**: raccogliere prove da tanti computer insieme durante un incidente

**Forense e malware**
- **Autopsy**: analisi forense dei dischi
- **Volatility**: analisi della memoria RAM
- **CyberChef**: decodificare e trasformare dati (Base64, esadecimale...)
- **VirusTotal**: controllare hash, file e domini sospetti

**Password e audit**
- **John the Ripper** e **Hashcat**: verificano la robustezza delle password indovinandole dagli hash. Nelle aziende si usano, con autorizzazione, per scoprire le password deboli **prima** degli attaccanti`,
        },
        {
          kind: 'lesson',
          title: 'Lavorare più veloce',
          body: `@nyx: Gli analisti bravi non sono quelli che scrivono più veloce: sono quelli che **non scrivono due volte la stessa cosa**.

Abitudini che fanno la differenza:
- **TAB** per completare, **↑** e \`!!\` per ripetere, \`history | grep\` per ritrovare
- **alias** per le catene che usi sempre
- **script** per le procedure che ripeti (l'hai fatto nel capitolo 05)
- un **quaderno di appunti** con i comandi che funzionano, organizzato per argomento
- **cheat sheet** a portata di mano: nel deck c'è \`cheat\`, nel mondo reale \`tldr\` e \`cheat.sh\`

Nella mappa trovi ogni volta un **trucco del mestiere**, e la raccolta completa è nella sezione Carriera.`,
        },
        {
          kind: 'task',
          title: 'Il tuo primo alias',
          body: `Crea una scorciatoia per la catena dell'analista che hai usato tante volte. Per esempio:

\`\`\`
alias falliti='grep "Failed password" caso/auth.log'
\`\`\`

Poi provala, anche in una pipe:

\`\`\`
falliti | wc -l
\`\`\``,
          objective: 'Crea un alias con alias NOME=\'COMANDO\'.',
          hints: ["Scrivi: alias falliti='grep \"Failed password\" caso/auth.log'", 'Niente spazi attorno all\'uguale, e il comando tra apici singoli.'],
          state: (sh) => Object.keys(sh.userAliases).length > 0,
          check: (ev) => ev.type === 'command' && ev.name === 'alias-set',
          success: `Da ora quella catena si scrive con una parola. Nel vero Linux salvi gli alias in \`~/.bashrc\` e li ritrovi ogni volta che apri il terminale.`,
        },
        {
          kind: 'task',
          title: 'Promemoria',
          body: `Prova il promemoria rapido del deck:

\`\`\`
cheat soc
\`\`\`

Ci sono anche \`cheat file\`, \`cheat testo\`, \`cheat rete\` e \`cheat shell\`.`,
          objective: 'Apri un promemoria con cheat.',
          hints: ['Scrivi: cheat soc'],
          check: (ev) => ev.type === 'command' && ev.name === 'cheat' && ev.ok && ev.args.length > 0,
          success: `Tienilo a mente per le Operazioni e per il terminale libero. E nel mondo reale costruisci il **tuo** promemoria: quello scritto da te lo ricorderai molto meglio.`,
        },
      ],
      recap: [
        ['Wireshark', 'analisi grafica del traffico'],
        ['Burp Suite / OWASP ZAP', 'proxy per analizzare le applicazioni web'],
        ['Wazuh / Splunk / Sentinel', 'SIEM'],
        ['Sysmon / Velociraptor', 'registrazione e raccolta prove sugli endpoint'],
        ['Autopsy / Volatility', 'forense di disco / di memoria'],
        ['CyberChef / VirusTotal', 'decodificare dati / controllare file e domini'],
        ['alias / cheat', 'scorciatoie e promemoria'],
      ],
    },

    // ------------------------------------------------------------------ 13.3
    {
      id: 'ch13-m3',
      title: 'Il tuo laboratorio',
      tagline: 'Come montare a casa, gratis e legalmente, un laboratorio per allenarti sul serio.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Perché un laboratorio',
          body: `@nyx: Il deck ti ha dato le basi e il metodo. Ora ti serve un posto dove usare gli **strumenti veri** su **sistemi veri**, senza rischi legali. Te lo costruisci a casa, gratis.

L'idea: sul tuo computer installi un programma di **virtualizzazione**, che crea computer virtuali dentro il tuo. Ci metti una macchina da cui attaccare e difendere, e delle macchine **vulnerabili apposta**, tutte collegate a una **rete privata** che non tocca Internet né la rete di casa.

Ti serve un PC (non il telefono) con almeno 8 GB di RAM, meglio 16.`,
        },
        {
          kind: 'lesson',
          title: 'Passo per passo',
          body: `**1. Il virtualizzatore**
Installa **VirtualBox** (gratuito) o VMware Workstation Player.

**2. La tua postazione**
Scarica **Kali Linux** (piena di strumenti di sicurezza) oppure **Ubuntu** (più semplice per imparare Linux). Esistono immagini già pronte per VirtualBox.

**3. Le macchine bersaglio**
- **Metasploitable 2**: un Linux pieno di servizi vulnerabili, fatto per esercitarsi
- **DVWA** (*Damn Vulnerable Web Application*): un sito con le vulnerabilità OWASP, con livelli di difficoltà
- le macchine di **VulnHub**, scaricabili gratis

**4. La rete**
Nelle impostazioni di rete di ogni macchina scegli **Rete solo host** (*host-only*) o **Rete interna**. Così le macchine vulnerabili parlano tra loro, ma **non** sono raggiungibili da Internet né dagli altri dispositivi di casa.

**5. Il lato difesa**
Aggiungi una macchina con **Wazuh** o **Security Onion** e manda lì i log delle altre. Così ogni attacco che provi, lo **vedi anche dal lato del SOC**: è l'allenamento più completo che esista.

**6. Le istantanee**
Prima di ogni esercizio, fai uno **snapshot**: se rompi qualcosa, torni indietro in un clic.`,
        },
        {
          kind: 'lesson',
          title: 'E poi?',
          body: `Con il laboratorio pronto, un percorso consigliato:
1. rifai sui sistemi veri gli esercizi di questo gioco: ping, nmap, ssh, log, permessi
2. **OverTheWire Bandit** per diventare velocissimo con Linux
3. **TryHackMe** (stanze gratuite) e **picoCTF** per le prime sfide guidate
4. **PortSwigger Academy** con Burp contro **DVWA**
5. **Blue Team Labs Online**, **LetsDefend** e **CyberDefenders** per allenarti come analista SOC
6. **HackTheBox** quando ti senti pronto

!! Le regole non cambiano mai: si attacca solo ciò che è tuo o per cui hai un'autorizzazione esplicita. Le macchine vulnerabili non vanno mai collegate a Internet.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Che tipo di rete devi dare a Metasploitable nel tuo laboratorio?',
          options: [
            'Bridge, così è raggiungibile da tutti i dispositivi di casa',
            'Solo host / rete interna: isolata da Internet e dalla rete di casa',
            'NAT con porte inoltrate dal router, così ci lavori da fuori',
            'Non importa',
          ],
          correct: 1,
          explain: `Una macchina vulnerabile apposta, raggiungibile dalla rete di casa o da Internet, verrebbe compromessa da chiunque, e potrebbe diventare un trampolino verso i tuoi dispositivi veri. Rete isolata, sempre.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Perché conviene aggiungere un SIEM (come Wazuh) al laboratorio?',
          options: [
            'Perché rende gli attacchi più veloci',
            'Perché così ogni attacco che provi lo vedi anche dal lato del difensore: impari entrambi i ruoli',
            'Perché è obbligatorio per legge',
            'Non serve',
          ],
          correct: 1,
          explain: `Vedere nel SIEM le tracce della scansione che hai appena fatto, o del brute force che hai provato, collega le due metà del mestiere. È esattamente il tipo di esperienza che si racconta bene a un colloquio da analista SOC.`,
        },
      ],
      recap: [
        ['VirtualBox', 'virtualizzatore gratuito'],
        ['Kali / Ubuntu', 'la tua postazione di lavoro'],
        ['Metasploitable / DVWA / VulnHub', 'bersagli vulnerabili apposta'],
        ['rete solo host', 'isola il laboratorio da Internet e da casa'],
        ['Wazuh / Security Onion', 'il lato difesa del laboratorio'],
        ['snapshot', 'torni indietro se rompi qualcosa'],
      ],
    },

    // ------------------------------------------------------------------ 13.4
    {
      id: 'ch13-m4',
      title: 'Il rapporto e il lavoro',
      tagline: 'Scrivere un report professionale, e i passi concreti verso il primo lavoro.',
      xp: 350,
      steps: [
        {
          kind: 'lesson',
          title: 'Il report',
          body: `Che tu faccia un penetration test, un audit o un incident response, il prodotto finale è sempre un **documento**. Un lavoro tecnico eccellente con un report confuso vale poco. La struttura tipica:

1. **Sintesi per la direzione** (*executive summary*): mezza pagina, senza gergo. Cosa è stato fatto, il rischio complessivo, le 3-5 azioni più importanti
2. **Perimetro e metodologia**: cosa era nello scope, quando, con quali tecniche e limiti
3. **Risultati**: per ogni problema
   - titolo e **gravità** (critica, alta, media, bassa)
   - **dove** (sistema, percorso, URL)
   - **descrizione** e **impatto** in parole semplici
   - **prova** (comando, output, screenshot)
   - **raccomandazione** concreta
4. **Raccomandazioni generali** e priorità
5. **Appendici**: dettagli tecnici, timeline, IOC

?? Scrivi la sintesi **per ultima**, e immagina che la legga Mama: deve capire cosa rischia e cosa fare, senza sapere cos'è un SUID.`,
        },
        {
          kind: 'task',
          title: 'Scrivi la sintesi',
          body: `Scrivi la **sintesi per la direzione** di uno dei lavori che hai fatto per Mama (per esempio l'operazione sul server della cassa, o l'audit dell'impronta pubblica). Apri l'editor:

\`\`\`
nano report.md
\`\`\`

Usa almeno queste sezioni, con un titolo per ciascuna:

\`\`\`
# Sintesi
(cosa hai fatto e qual è il rischio, in parole semplici)

# Risultati principali
(i problemi più gravi, uno per riga)

# Raccomandazioni
(cosa fare, in ordine di priorità)
\`\`\`

Scrivi almeno 8 righe, poi salva.`,
          objective: 'Scrivi report.md con Sintesi, Risultati e Raccomandazioni.',
          hints: [
            'nano report.md, scrivi i tre titoli e sotto ognuno almeno due righe.',
            'Esempio di riga per le raccomandazioni: "1. Spegnere la vecchia webmail old.scantinato.nc".',
          ],
          check: (ev, sh) => {
            if (ev.type !== 'saved' || !ev.path.endsWith('.md')) return false;
            const n = sh.fs.get(ev.path);
            if (!n || n.type !== 'file') return false;
            const c = n.content.toLowerCase();
            return c.includes('sintesi') && c.includes('risultat') && c.includes('raccomandazion') && n.content.trim().split('\n').length >= 8;
          },
          success: `Hai scritto il tuo primo report. Rileggilo come se fossi Mama: si capisce cosa rischia? Si capisce cosa fare per primo?

?? Tieni da parte i report e i writeup che scrivi nel laboratorio e nelle CTF: ripuliti dai dati sensibili, sono il cuore del tuo **portfolio**.`,
        },
        {
          kind: 'lesson',
          title: 'La strada verso il lavoro',
          body: `@nyx: Un anno o due di studio costante possono davvero cambiarti il lavoro. Ecco un percorso concreto.

**Il primo ruolo**
Il punto d'ingresso più comune è l'**analista SOC di primo livello** (*SOC L1*): sorvegli gli allarmi, fai il triage, scali gli incidenti. Spesso si fanno turni, ed è una scuola straordinaria. In alternativa: un ruolo IT (helpdesk, sistemista) per poi spostarsi verso la sicurezza.

**Le certificazioni, in ordine**
- **CompTIA Security+**: la base più richiesta negli annunci
- **BTL1** (Security Blue Team) o **CompTIA CySA+**: pratiche, orientate al SOC
- **eJPT**: prima certificazione pratica di penetration testing
- più avanti **OSCP** (pentest) o certificazioni SANS/GIAC

**Il portfolio**
Un profilo GitHub con i tuoi script, i writeup delle macchine risolte, il tuo laboratorio documentato. Mostra che sai **fare**, non solo studiare.

**I colloqui**
- spiega i concetti in modo semplice: "cos'è un brute force e come lo rilevi?"
- racconta casi concreti con il metodo **STAR** (Situazione, Compito, Azione, Risultato): l'OP-02 della clinica è un ottimo esempio da raccontare
- ammetti quando non sai una cosa, e spiega come la cercheresti

**Le comunità**
Le sezioni italiane di **OWASP**, eventi come **HackInBo** o **No Hat**, i gruppi di CTF: conoscere persone del settore apre più porte di cento CV.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica finale',
          question: 'In un report di audit, qual è il modo migliore di presentare un problema trovato?',
          options: [
            'Solo il nome tecnico, tanto il cliente capirà',
            'Gravità, dove si trova, cosa comporta in parole semplici, la prova, e come risolverlo',
            'Una lunga spiegazione di come sfruttarlo',
            'Basta elencarlo nella sintesi',
          ],
          correct: 1,
          explain: `Un report serve a far **correggere** i problemi. Ogni voce deve permettere a chi la legge di capire quanto è grave, verificarla e sapere cosa fare. È il prodotto finale di tutto il lavoro: lo stesso schema che hai visto nei debriefing di ogni Operazione.`,
        },
        {
          kind: 'lesson',
          title: 'Fine del corso, inizio del lavoro',
          body: `@nyx: Ti ricordi il primo giorno? Non sapevi cosa fosse \`cat\`. Ora sai leggere un log, ricostruire un'intrusione, mettere in sicurezza un server e scrivere un report che una persona non tecnica può capire.

@nyx: Il deck finisce qui, ma il mestiere no. Laboratorio, CTF, notizie, una cosa nuova ogni giorno. E ricordati sempre perché lo fai: per **proteggere** chi viene attaccato.

@rook: Benvenuto nel giro, edgerunner. Mama dice che stasera offre lei.

!! Il gioco resta a tua disposizione: le **Operazioni** e i **Giochi** si possono rigiocare, l'**Allenamento** serve proprio per ripassare, e nel **Terminale libero** puoi fare tutte le prove che vuoi.`,
        },
      ],
      recap: [
        ['report', 'sintesi, perimetro, risultati, raccomandazioni, appendici'],
        ['sintesi per la direzione', 'mezza pagina senza gergo: rischio e azioni'],
        ['ogni problema', 'gravità, dove, impatto, prova, raccomandazione'],
        ['SOC L1', 'il punto d\'ingresso più comune nel settore'],
        ['Security+ → BTL1/CySA+ → eJPT → OSCP', 'un percorso di certificazioni possibile'],
        ['portfolio', 'script, writeup e laboratorio documentato su GitHub'],
        ['STAR', 'Situazione, Compito, Azione, Risultato: per i colloqui'],
      ],
    },
  ],
};
