// Capitolo SO: un turno vero da analista SOC di primo livello. Non tecniche nuove,
// ma il mestiere: smistare una coda di allarmi, distinguere i falsi positivi,
// sapere quando e come passare la palla (escalation), lasciare consegne utili.

import type { Shell } from '../engine/shell';
import type { ShellEvent } from '../engine/types';
import type { Chapter } from '../game/types';

const readOf = (rel: string) => (ev: ShellEvent, sh: { home: string }) => ev.type === 'read' && ev.path === `${sh.home}/${rel}`;

export const DOCM_HASH = '9f2c4be81a7d3e05c6b1f4a29d8e7c3051ab6f92e4d07c18b35a9e6f0d2c47b1';

const fileHas = (sh: Shell, rel: string, words: string[]) => {
  const f = sh.fs.get(`${sh.home}/${rel}`);
  if (!f || f.type !== 'file') return false;
  const t = f.content.toLowerCase();
  return words.every((w) => t.includes(w.toLowerCase()));
};

export function addSocFiles(sh: Shell): void {
  const mine = { owner: sh.user, group: sh.user };
  const w = (rel: string, lines: string[]) => sh.localFs.writeFile(`${sh.home}/soc/${rel}`, lines.join('\n') + '\n', mine);
  w('LEGGIMI.txt', [
    '=== ARASAKA LOGISTICS · SOC · TURNO DEL MATTINO (13/11/2077) ===',
    '',
    'Benvenuto nel turno. Sei L1 (primo livello): smisti gli allarmi,',
    'chiudi quelli che non sono un problema, passi al L2 quelli seri.',
    '',
    'File del turno:',
    '  coda.csv           gli allarmi arrivati dal SIEM stamattina',
    '  asset.txt          quanto è critica ogni macchina',
    '  vpn.log            accessi alla VPN aziendale',
    '  trasferte.txt      chi è in viaggio questa settimana',
    '  manutenzioni.txt   lavori programmati dall\'IT (change)',
    '  edr-PC-AMM-07.txt  cosa ha visto l\'EDR sul PC dell\'amministrazione',
    '  playbook-malware.txt   la procedura per un sospetto malware',
    '',
    'Il L2 di turno è Hanako (interno 4410). Le consegne vanno in consegne.txt.',
  ]);
  w('coda.csv', [
    'id,ora,regola,severita,host,utente,dettaglio',
    'A01,08:02,Accesso fallito ripetuto,media,SRV-WEB-01,root,35 tentativi da 45.155.205.33',
    'A02,08:15,Login da paese insolito,alta,VPN-GW,k.tanaka,accesso da 203.0.113.140 (Germania)',
    'A03,08:31,Antivirus: file rilevato,media,PC-REC-02,a.berg,EICAR-Test-File in Download',
    'A04,08:47,Accesso fallito ripetuto,media,SRV-WEB-01,admin,12 tentativi da 45.155.205.33',
    'A05,09:03,PowerShell codificato,alta,PC-AMM-07,r.costa,powershell.exe -enc JABjAD0ATgBlAHcA',
    'A06,09:05,Connessione a dominio malevolo,critica,PC-AMM-07,r.costa,cdn-upd4te.nc:8443 bloccata dal proxy',
    'A07,09:10,Scansione di porte interna,alta,10.0.3.5,it.scanner,1200 porte su 40 host',
    'A08,09:12,Accesso fallito ripetuto,media,SRV-WEB-01,oracle,6 tentativi da 45.155.205.33',
    'A09,09:20,Nuovo utente amministratore,critica,DC-01,adm.temp,creato da m.rossi (eventi 4720 e 4728)',
    'A10,09:31,Login fuori orario,bassa,PC-REC-02,a.berg,primo accesso alle 06:58',
    'A11,09:40,Accesso fallito ripetuto,media,SRV-WEB-01,test,9 tentativi da 45.155.205.33',
    'A12,09:44,Antivirus: file rilevato,bassa,LAB-TEST-03,lab,EICAR-Test-File in /tmp',
    'A13,09:52,Scansione di porte interna,alta,10.0.3.5,it.scanner,800 porte su 25 host',
    'A14,10:05,Accesso fallito ripetuto,media,SRV-WEB-01,git,4 tentativi da 45.155.205.33',
  ]);
  w('asset.txt', [
    '# criticità degli asset (decisa con la direzione)',
    'DC-01         CRITICO   domain controller: tutte le identità dell\'azienda',
    'PC-AMM-07     ALTO      amministrazione: pagamenti ai fornitori',
    'SRV-WEB-01    ALTO      sito pubblico e ordini dei clienti',
    'VPN-GW        ALTO      accesso remoto dei dipendenti',
    'PC-REC-02     MEDIO     reception',
    'LAB-TEST-03   BASSO     laboratorio, nessun dato reale',
  ]);
  w('vpn.log', [
    '2077-11-13 07:55:10 VPN-GW utente=a.berg     ip=10.0.3.12     esito=ok  paese=IT',
    '2077-11-13 08:14:51 VPN-GW utente=k.tanaka   ip=203.0.113.140 esito=ok  paese=DE  mfa=ok  dispositivo=PORT-KT-01',
    '2077-11-13 08:40:02 VPN-GW utente=l.moreau   ip=10.0.3.33     esito=ok  paese=IT',
  ]);
  w('trasferte.txt', ['# trasferte della settimana', 'k.tanaka    Francoforte (DE)   11-14 novembre   fiera della logistica', 'p.ivanova   Milano (IT)        13 novembre      cliente']);
  w('manutenzioni.txt', [
    '# change approvati',
    'CHG-2231  13/11 09:00-11:00  scansione vulnerabilità (Nessus) da 10.0.3.5, utente it.scanner   resp: IT Ops',
    'CHG-2235  14/11 22:00-23:00  aggiornamento firewall perimetrale                            resp: Rete',
  ]);
  w('edr-PC-AMM-07.txt', [
    'EDR · PC-AMM-07 · utente r.costa · 13/11/2077',
    '',
    '09:01:47  OUTLOOK.EXE     apre allegato "fattura_novembre.docm"',
    `09:01:47  file            fattura_novembre.docm  sha256=${DOCM_HASH}`,
    '09:02:55  WINWORD.EXE     macro attivata dall\'utente ("Abilita contenuto")',
    '09:03:01  WINWORD.EXE  -> powershell.exe -nop -w hidden -enc JABjAD0ATgBlAHcA...',
    '09:03:02  powershell.exe  connessione a cdn-upd4te.nc:8443  (BLOCCATA dal proxy)',
    '09:03:05  powershell.exe  crea attività pianificata "OneDriveSync" ogni 5 minuti',
    '',
    'Stato: processo ancora attivo. Host NON isolato.',
  ]);
  w('playbook-malware.txt', [
    '=== PLAYBOOK: SOSPETTO MALWARE SU UNA POSTAZIONE ===',
    '1. Conferma: c\'è un processo o una connessione anomala? (EDR, proxy)',
    '2. Raccogli: host, utente, ora, file e hash, domini e IP contattati.',
    '3. NON spegnere il PC e NON cancellare file: si perdono le prove.',
    '4. NON contattare l\'utente per email (potrebbe leggerla anche l\'attaccante).',
    '5. Escalation al L2 di turno con la nota di escalation (modello sotto).',
    '6. L\'isolamento dell\'host dall\'EDR lo decide e lo esegue il L2.',
    '',
    'Modello di nota di escalation:',
    '  ALLARMI: ...   HOST: ...   UTENTE: ...   ORA: ...',
    '  COSA È SUCCESSO: ...',
    '  IOC: file, hash, domini, IP',
    '  FATTO FINORA: ...',
    '  RICHIESTA: ...',
  ]);
}

export const CHSOC: Chapter = {
  id: 'chSOC',
  code: 'SO',
  title: 'Il turno al SOC',
  subtitle: 'Coda degli allarmi, falsi positivi, escalation e consegne: il lavoro vero di un analista L1',
  missions: [
    // ------------------------------------------------------------------ SO.1
    {
      id: 'chSOC-m1',
      title: 'La coda degli allarmi',
      tagline: 'Quattordici allarmi, un analista: raggruppare, dare priorità, non affogare.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Primo giorno da L1',
          body: `@rook: Arasaka Logistics ti ha preso in prova nel suo SOC. Turno del mattino, livello 1. Niente eroismi: devi far scorrere la coda.

@nyx: Un SOC è organizzato a livelli:
- **L1** (primo livello): guarda ogni allarme, chiude quelli innocui, documenta, passa al L2 quelli seri. È qui che si entra.
- **L2**: indaga a fondo e decide le azioni di contenimento (isolare un PC, bloccare un account).
- **L3** / **incident response**: gli incidenti gravi, l'analisi forense, la caccia alle minacce.

@nyx: Il nemico principale di un L1 non è l'hacker: è l'**alert fatigue**, la stanchezza da allarmi. Centinaia al giorno, quasi tutti innocui. Chi li guarda uno per uno senza metodo, dopo una settimana non vede più quello vero.`,
        },
        {
          kind: 'task',
          title: 'Le istruzioni del turno',
          body: `Leggi le istruzioni:

\`\`\`
cat soc/LEGGIMI.txt
\`\`\``,
          objective: 'Leggi soc/LEGGIMI.txt.',
          hints: ['cat e il percorso del file.', 'cat soc/LEGGIMI.txt'],
          check: readOf('soc/LEGGIMI.txt'),
          success: 'Coda, asset, log di supporto, playbook, il nome del L2. È la cassetta degli attrezzi di ogni turno: in un SOC vero sono schermate di un SIEM e di un sistema di ticket, ma le informazioni sono le stesse.',
        },
        {
          kind: 'task',
          title: 'Quanti sono?',
          body: `\`soc/coda.csv\` è un **CSV**: una tabella in testo, con i campi separati da virgole. La prima riga è l'intestazione (i nomi delle colonne), le altre sono gli allarmi, uno per riga, con un id che inizia con A.

\`\`\`
head -n 3 soc/coda.csv
\`\`\`

Contali senza contare l'intestazione.`,
          objective: 'Quanti allarmi ci sono in coda? Invia il numero con flag.',
          hints: ['wc -l conta tutte le righe, intestazione compresa: togline una. Oppure fai contare a grep le righe che iniziano con A e una cifra.', 'wc -l soc/coda.csv (15 righe, meno l\'intestazione) oppure grep -cE "^A[0-9]" soc/coda.csv, e poi: flag 14'],
          answer: ['14'],
          success: '14 allarmi in due ore. In un SOC grande sono migliaia al giorno: per questo si raggruppa e si dà una priorità.',
        },
        {
          kind: 'task',
          title: 'La regola più rumorosa',
          body: `La terza colonna è la **regola** del SIEM che ha generato l'allarme. Fai la classifica:

\`\`\`
cut -d, -f3 soc/coda.csv | sort | uniq -c | sort -rn
\`\`\``,
          objective: 'Quale regola ha generato più allarmi? Inviane il nome con flag.',
          hints: ['La prima riga della classifica.', 'flag Accesso fallito ripetuto'],
          answer: ['Accesso fallito ripetuto'],
          success: 'Cinque allarmi su quattordici dalla stessa regola. Prima di aprirli uno per uno, guarda se sono **lo stesso evento**.',
        },
        {
          kind: 'task',
          title: 'Cinque allarmi, un evento',
          body: `\`\`\`
grep "Accesso fallito" soc/coda.csv
\`\`\`

Guarda il dettaglio di ciascuno: host e origine.`,
          objective: 'Da quale IP arrivano tutti questi tentativi? Invialo con flag.',
          hints: ['L\'IP alla fine di ogni riga.', 'flag 45.155.205.33'],
          answer: ['45.155.205.33'],
          success: `Sempre lo stesso IP, sempre lo stesso server, con nomi utente da dizionario (root, admin, oracle, test, git): lo **scanner** che hai già visto sul tuo deck.

Questo è il **raggruppamento** (o *correlazione*): cinque allarmi diventano **un ticket solo**, con dentro i cinque id. Si gestisce una volta, si risponde una volta (per esempio bloccando l'IP), e la coda si accorcia.`,
        },
        {
          kind: 'lesson',
          title: 'Severità e priorità',
          body: `Ogni allarme arriva con una **severità** (bassa, media, alta, critica) decisa dalla regola. Ma la **priorità** con cui lo apri dipende anche da:
- **l'asset**: un allarme medio sul domain controller pesa più di un allarme alto su una macchina di laboratorio
- **se è già contenuto**: una connessione **bloccata** dal proxy è meno urgente di una che è passata
- **se sta succedendo adesso** o è finito

Un modo semplice per ragionare: **priorità = impatto × urgenza**. L'impatto dipende dall'asset (lo dice \`soc/asset.txt\`), l'urgenza dal fatto che l'attacco sia in corso e non contenuto.

!! La severità la decide una macchina, la priorità la decidi tu. Ed è la decisione per cui ti pagano.`,
        },
        {
          kind: 'task',
          title: 'Chi apri per primo?',
          body: `Due allarmi sono **critici**: A06 e A09. Leggi i loro dettagli e la criticità degli asset coinvolti:

\`\`\`
grep critica soc/coda.csv
cat soc/asset.txt
\`\`\`

A06: la connessione è stata **bloccata** dal proxy. A09: un utente amministratore nuovo, creato sul **domain controller**, la macchina che custodisce tutte le identità dell'azienda.`,
          objective: 'Quale allarme apri per primo? Invia l\'id con flag.',
          hints: ['Impatto: quale asset è CRITICO? Urgenza: quale dei due non è stato bloccato?', 'flag A09'],
          answer: ['A09'],
          success: `A09. Un amministratore nuovo sul domain controller può voler dire che qualcuno si sta preparando a restare (persistenza) con i privilegi più alti. E niente lo ha bloccato.

A06 resta alto in lista: il blocco del proxy è una buona notizia, ma un PC che prova a contattare un dominio malevolo ha **già** qualcosa che non va. Lo vedrai nella prossima missione.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          skills: ['cut', 'sort', 'uniq'],
          question: 'Perché si raggruppano gli allarmi uguali in un solo ticket?',
          options: [
            'Perché descrivono un solo evento: si analizza e si risponde una volta, e la coda resta gestibile',
            'Per nascondere al responsabile quanti allarmi ci sono',
            'Perché il SIEM non può mostrare più di un allarme per regola',
            'Per chiuderli tutti insieme come falsi positivi',
          ],
          correct: 0,
          explain: 'Raggruppare non vuol dire ignorare: il ticket conserva tutti gli id. Vuol dire lavorare sull\'evento, non sulle notifiche.',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Un allarme "alta" su LAB-TEST-03 (laboratorio, nessun dato reale) e un allarme "media" su DC-01 (domain controller) arrivano insieme. Quale guardi prima, a parità di altre informazioni?',
          options: ['Quello su DC-01: l\'impatto possibile è molto più grande', 'Quello su LAB-TEST-03: ha severità più alta', 'Quello arrivato per primo', 'Nessuno dei due: aspetti che si ripetano'],
          correct: 0,
          explain: 'La severità della regola è solo un ingrediente. La criticità dell\'asset cambia l\'impatto: il domain controller è il cuore delle identità aziendali.',
        },
      ],
      recap: [
        ['L1 / L2 / L3', 'smistamento / indagine e contenimento / incidenti gravi e forense'],
        ['alert fatigue', 'la stanchezza da troppi allarmi: il rischio è non vedere quello vero'],
        ['CSV', 'tabella in testo, campi separati da virgole'],
        ['raggruppare (correlare)', 'più allarmi dello stesso evento in un solo ticket'],
        ['severità', 'quanto è grave secondo la regola'],
        ['priorità', 'impatto (asset) × urgenza (in corso? contenuto?)'],
      ],
    },

    // ------------------------------------------------------------------ SO.2
    {
      id: 'chSOC-m2',
      title: 'Vero o falso?',
      tagline: 'Falsi positivi, veri positivi, eventi attesi: chiudere un allarme con le prove.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Quattro esiti possibili',
          body: `Ogni allarme, dopo l'analisi, finisce in una di queste caselle:

- **vero positivo** → l'allarme è scattato e c'è davvero un problema. Escalation o risposta.
- **falso positivo** → l'allarme è scattato ma non c'è nessun problema: la regola ha scambiato una cosa normale per un attacco. Si chiude, e si valuta se migliorare la regola.
- **vero positivo benigno** (o *atteso*) → è successo davvero quello che la regola cerca, ma era autorizzato (una scansione dell'IT, un test). Si chiude citando l'autorizzazione.
- **falso negativo** → l'attacco c'è stato e **nessun** allarme è scattato. Non lo vedi nella coda: lo scopri dopo, ed è il più pericoloso.

!! Un allarme non si chiude mai "a sensazione". Si chiude con una **prova** scritta nel ticket: "chiuso come falso positivo perché...".`,
        },
        {
          kind: 'task',
          title: 'A02: la Germania',
          body: `A02: \`k.tanaka\` si è collegato alla VPN dalla Germania. Prima di allarmarti, raccogli il contesto:

\`\`\`
grep k.tanaka soc/vpn.log
grep k.tanaka soc/trasferte.txt
\`\`\`

Controlla: c'era l'autenticazione a più fattori (MFA)? Il dispositivo è aziendale? La persona è davvero in viaggio?`,
          objective: 'A02 è un vero positivo o un falso positivo? Invia la risposta con flag.',
          hints: ['MFA superata, dispositivo aziendale, trasferta registrata in quella città e in quei giorni.', 'flag falso positivo'],
          answer: ['falso positivo', 'fp', 'falso-positivo'],
          success: `Falso positivo: k.tanaka è a una fiera a Francoforte, ha superato l'MFA dal suo portatile aziendale. Nel ticket scriverai proprio questo, con i riferimenti.

?? Miglioramento della regola: il SIEM potrebbe leggere l'elenco delle trasferte e abbassare la severità quando il paese coincide. Si chiama **tuning**, e un L1 attento lo propone.`,
        },
        {
          kind: 'task',
          title: 'A07 e A13: la scansione',
          body: `A07 e A13: \`10.0.3.5\` ha scansionato centinaia di porte su decine di macchine interne. Sembra un attaccante che si muove nella rete. Ma prima:

\`\`\`
grep 10.0.3.5 soc/manutenzioni.txt
\`\`\``,
          objective: 'Come chiudi A07 e A13? Invia con flag: vero positivo, falso positivo o benigno.',
          hints: ['La scansione è successa davvero, ma c\'è un change approvato con quell\'IP e quell\'orario.', 'flag benigno'],
          answer: ['benigno', 'vero positivo benigno', 'atteso', 'vp benigno'],
          success: `Vero positivo **benigno**: la scansione c'è stata davvero (la regola ha funzionato), ma era autorizzata dal change **CHG-2231**, dalle 9 alle 11. Nel ticket si cita il numero del change.

!! Se la stessa scansione arrivasse alle 15:00, fuori dalla finestra autorizzata, non sarebbe più benigna: o il change è stato sforato, o qualcuno usa quella macchina.`,
        },
        {
          kind: 'task',
          title: 'A05 e A06: il PC dell\'amministrazione',
          body: `A05 (PowerShell codificato) e A06 (dominio malevolo) riguardano lo stesso PC e lo stesso utente, a due minuti di distanza. Leggi cosa ha visto l'**EDR** (il software che sorveglia ogni processo sul PC):

\`\`\`
cat soc/edr-PC-AMM-07.txt
\`\`\`

Segui la **catena dei processi**: chi ha avviato chi.`,
          objective: 'Quale file ha dato inizio a tutto? Invia il nome con flag.',
          hints: ['Il primo evento: un allegato aperto da Outlook.', 'flag fattura_novembre.docm'],
          answer: ['fattura_novembre.docm'],
          success: `Outlook → Word apre \`fattura_novembre.docm\` (\`.docm\` = documento **con macro**) → l'utente clicca "Abilita contenuto" → la macro lancia PowerShell nascosto e codificato → PowerShell prova a contattare il server dell'attaccante e crea un'attività pianificata per ripartire ogni 5 minuti.

È la catena di un **phishing con macro**, uno dei modi più comuni di entrare in un'azienda.`,
        },
        {
          kind: 'task',
          title: 'Il battito',
          body: `Il proxy aziendale ha registrato i tentativi di quel PC (10.0.3.44). Guardali:

\`\`\`
grep r.costa rete/difese/proxy.log
\`\`\`

Un malware che chiama "casa" a intervalli regolari fa **beaconing**: come un battito cardiaco. È uno dei segnali più affidabili, anche quando il traffico è cifrato.`,
          objective: 'Ogni quanti minuti il PC prova a contattare cdn-upd4te.nc? Invia il numero con flag.',
          hints: ['Guarda gli orari delle righe: 09:03, 09:08...', 'flag 5'],
          answer: ['5', '5 minuti'],
          success: 'Ogni 5 minuti esatti, come l\'attività pianificata che l\'EDR ha visto creare. Due fonti indipendenti (EDR e proxy) raccontano la stessa storia: **vero positivo**, senza dubbi.',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          ex: 'interpreta',
          question: 'A03: l\'antivirus ha trovato `EICAR-Test-File` nella cartella Download della reception. Cos\'è?',
          options: [
            'Un file di prova innocuo, creato apposta per verificare che l\'antivirus funzioni',
            'Un ransomware molto diffuso',
            'Un errore dell\'antivirus',
            'Un virus che si nasconde nei PDF',
          ],
          correct: 0,
          explain: 'EICAR è una stringa standard che tutti gli antivirus riconoscono come "virus di prova". Di solito si chiude come benigno; ma vale la pena chiedere chi lo ha scaricato e perché, su un PC che non è un laboratorio.',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Qual è il più pericoloso dei quattro esiti per un SOC?',
          options: ['Il falso negativo: l\'attacco c\'è e nessun allarme lo segnala', 'Il falso positivo', 'Il vero positivo', 'Il vero positivo benigno'],
          correct: 0,
          explain: 'I falsi positivi costano tempo; i falsi negativi costano incidenti. Per questo esiste il **threat hunting**: cercare attivamente quello che le regole non hanno visto.',
        },
      ],
      recap: [
        ['vero positivo', 'allarme giusto: c\'è un problema'],
        ['falso positivo', 'allarme sbagliato: comportamento normale'],
        ['vero positivo benigno', 'successo davvero, ma autorizzato (change, test)'],
        ['falso negativo', 'attacco senza allarme: il più pericoloso'],
        ['tuning', 'migliorare una regola per ridurre i falsi positivi'],
        ['EDR', 'sorveglia processi, file e connessioni su ogni PC'],
        ['catena dei processi', 'chi ha avviato chi: Outlook → Word → PowerShell'],
        ['beaconing', 'contatti regolari verso il server dell\'attaccante'],
        ['.docm', 'documento Word con macro: allegato ad alto rischio'],
      ],
    },

    // ------------------------------------------------------------------ SO.3
    {
      id: 'chSOC-m3',
      title: 'Escalation',
      tagline: 'Quando passare la palla, a chi, e cosa scrivere perché il L2 possa agire subito.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Passare la palla non è arrendersi',
          body: `**Escalation** vuol dire passare un caso al livello superiore. Non è una sconfitta: è il lavoro del L1. Si fa escalation quando:
- c'è un **vero positivo** su un asset importante
- serve un'azione che un L1 non può o non deve fare (isolare un PC, bloccare un account)
- il caso è fuori dalle procedure che conosci
- **nel dubbio**: un'escalation in più costa dieci minuti a un collega; una in meno può costare l'azienda

Le azioni le guida un **playbook**: una procedura scritta, passo per passo, per ogni tipo di incidente. Serve a non improvvisare sotto pressione, e a far fare a tutti le stesse cose giuste.`,
        },
        {
          kind: 'task',
          title: 'Il playbook',
          body: `\`\`\`
cat soc/playbook-malware.txt
\`\`\``,
          objective: 'Chi decide l\'isolamento del PC? Invia il ruolo con flag.',
          hints: ['Il passo 6.', 'flag L2'],
          answer: ['L2', 'il L2', 'L2 di turno'],
          success: 'Il L2. Tu raccogli, documenti e passi il caso: il punto 2 del playbook è proprio il lavoro di questa missione.',
        },
        {
          kind: 'task',
          title: 'Raccogli gli indicatori',
          body: `Gli **IOC** (*indicatori di compromissione*) sono le tracce che permettono di riconoscere l'attacco altrove: hash dei file, domini, IP. Il L2 li userà per cercare altri PC colpiti.

Inizia la nota di escalation copiando la riga con l'hash dall'EDR, senza riscriverlo a mano (un carattere sbagliato e la ricerca non trova niente):

\`\`\`
grep sha256 soc/edr-PC-AMM-07.txt > soc/escalation-A05.txt
\`\`\``,
          objective: 'Crea soc/escalation-A05.txt con dentro la riga dell\'hash del documento.',
          hints: ['grep sulla parola sha256 e > per scrivere nel file.', 'grep sha256 soc/edr-PC-AMM-07.txt > soc/escalation-A05.txt'],
          state: (sh) => fileHas(sh, 'soc/escalation-A05.txt', [DOCM_HASH]),
          success: 'L\'hash è nella nota, copiato dalla fonte. Ora il resto.',
        },
        {
          kind: 'task',
          title: 'La nota di escalation',
          body: `Completa \`soc/escalation-A05.txt\` seguendo il modello del playbook. Puoi usare \`nano soc/escalation-A05.txt\`, oppure aggiungere righe con \`echo "..." >> soc/escalation-A05.txt\`.

Deve contenere almeno:
- gli **allarmi**: A05, A06
- **host** e **utente**: PC-AMM-07, r.costa
- **ora** di inizio: 09:01 (apertura dell'allegato)
- gli **IOC**: il file \`fattura_novembre.docm\` e il dominio \`cdn-upd4te.nc\`
- una **richiesta** chiara: isolare l'host

Scrivi fatti, non opinioni: "l'utente ha aperto l'allegato alle 09:01", non "l'utente ha fatto un disastro".`,
          objective: 'Scrivi la nota con allarmi, host, utente, ora, IOC e la richiesta di isolamento.',
          hints: [
            'Una riga per voce, come nel modello del playbook.',
            'nano soc/escalation-A05.txt e aggiungi: ALLARMI: A05 A06 · HOST: PC-AMM-07 · UTENTE: r.costa · ORA: 09:01 · IOC: fattura_novembre.docm, cdn-upd4te.nc · RICHIESTA: isolare l\'host',
          ],
          state: (sh) => fileHas(sh, 'soc/escalation-A05.txt', ['A05', 'A06', 'PC-AMM-07', 'r.costa', '09:01', 'fattura_novembre.docm', 'cdn-upd4te.nc', 'isola']),
          success: `Una nota così il L2 la legge in trenta secondi e può agire. Ecco come la scriverebbe un analista esperto:

\`\`\`
ALLARMI: A05, A06       HOST: PC-AMM-07     UTENTE: r.costa
ORA: 13/11 09:01 (apertura allegato) - in corso
COSA È SUCCESSO: phishing con macro. Outlook -> fattura_novembre.docm
  -> macro -> powershell -enc -> beacon verso cdn-upd4te.nc:8443
  ogni 5 min (bloccato dal proxy) + attività pianificata "OneDriveSync".
IOC: fattura_novembre.docm  sha256=9f2c4b...  cdn-upd4te.nc  10.0.3.44
FATTO FINORA: verificati EDR e proxy. Nessuna azione sull'host.
RICHIESTA: isolamento di PC-AMM-07; ricerca della mail e dell'hash
  sugli altri PC.
\`\`\``,
        },
        {
          kind: 'task',
          title: 'A09: c\'è un change?',
          body: `Torna all'allarme più critico: A09, l'amministratore nuovo \`adm.temp\` creato sul domain controller. Se è un lavoro autorizzato, c'è un change:

\`\`\`
grep adm.temp soc/manutenzioni.txt
\`\`\`

grep risponde con il **silenzio** se non trova niente.`,
          objective: 'Esiste un change per adm.temp? Rispondi con flag si o no.',
          hints: ['Se grep non stampa nulla, non c\'è nessuna riga con quel nome.', 'flag no'],
          answer: ['no'],
          success: `Nessun change. Un amministratore di dominio creato fuori procedura, mentre è in corso un phishing nella stessa azienda: **escalation immediata**, al telefono (interno 4410), non solo per ticket. Le cose urgenti si dicono a voce e poi si scrivono.

?? L'account \`m.rossi\` che lo ha creato potrebbe essere stato compromesso: è la prima cosa che il L2 verificherà.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Il PC di r.costa ha un malware attivo. Cosa NON deve fare un L1?',
          options: [
            'Spegnere il PC e cancellare l\'allegato per "pulire"',
            'Raccogliere host, utente, ora e IOC',
            'Fare escalation al L2 con una nota chiara',
            'Seguire il playbook',
          ],
          correct: 0,
          explain: 'Spegnere cancella la memoria (prove preziose), cancellare il file distrugge l\'IOC e non ferma il malware già avviato. Il contenimento giusto è l\'isolamento di rete, deciso dal L2.',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          ex: 'interpreta',
          question: 'Quale di queste righe è scritta bene in una nota di escalation?',
          options: [
            '09:01 r.costa apre fattura_novembre.docm da Outlook; 09:03 powershell -enc contatta cdn-upd4te.nc (bloccato)',
            'L\'utente ha fatto un casino con una mail, penso sia un virus',
            'Malware!!! Urgente!!!',
            'Vedi allarmi di stamattina',
          ],
          correct: 0,
          explain: 'Ora, chi, cosa, dove: fatti verificabili. Le altre costringono il L2 a rifare tutto il tuo lavoro.',
        },
      ],
      recap: [
        ['escalation', 'passare il caso al livello superiore, con una nota completa'],
        ['playbook', 'procedura scritta passo per passo per un tipo di incidente'],
        ['IOC', 'tracce riconoscibili: hash, domini, IP, nomi di file'],
        ['nota di escalation', 'allarmi, host, utente, ora, cosa, IOC, fatto finora, richiesta'],
        ['change', 'modifica autorizzata e registrata: se manca, è sospetto'],
        ['urgente', 'prima a voce, poi per iscritto'],
      ],
    },

    // ------------------------------------------------------------------ SO.4
    {
      id: 'chSOC-m4',
      title: 'Il passaggio di consegne',
      tagline: 'Fine turno: lasciare al collega tutto quello che serve, in due minuti di lettura.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'Il SOC non dorme, tu sì',
          body: `Un SOC lavora 24 ore su 24 a turni. Alla fine del tuo, il collega che arriva deve sapere **in due minuti**:
- cosa è ancora **aperto** e in mano a chi
- cosa hai **chiuso** e perché (così non lo riapre)
- cosa tenere **d'occhio** (un IP che insiste, un'azione che aspetta una risposta)

Si chiama **passaggio di consegne** (*shift handover*). Una consegna fatta male è uno dei modi più comuni in cui un incidente "si perde": tutti pensavano che se ne stesse occupando qualcun altro.

Regole d'oro: id dei ticket, orari, nomi; frasi corte; niente "vedi sopra".`,
        },
        {
          kind: 'task',
          title: 'Scrivi le consegne',
          body: `Crea \`soc/consegne.txt\` (con \`nano\` o con \`echo ... >>\`) con tre sezioni: **APERTI**, **CHIUSI**, **DA SORVEGLIARE**. Ricapitolando il tuo turno:

- aperti: A05/A06 (malware su PC-AMM-07, in mano al L2) e A09 (amministratore senza change, in mano al L2)
- chiusi: A02 (falso positivo, trasferta), A07/A13 (benigni, CHG-2231), A03/A12 (EICAR)
- da sorvegliare: lo scanner 45.155.205.33 su SRV-WEB-01 (A01, A04, A08, A11, A14)`,
          objective: 'Scrivi soc/consegne.txt con le sezioni APERTI, CHIUSI e DA SORVEGLIARE.',
          hints: [
            'Le tre parole come titoli, e sotto gli id degli allarmi con una riga di spiegazione.',
            'nano soc/consegne.txt · APERTI: A05/A06 malware PC-AMM-07 (L2), A09 admin senza change (L2) · CHIUSI: A02 falso positivo, A07/A13 benigni CHG-2231, A03/A12 EICAR · DA SORVEGLIARE: 45.155.205.33',
          ],
          state: (sh) => fileHas(sh, 'soc/consegne.txt', ['APERTI', 'CHIUSI', 'SORVEGLIARE', 'A05', 'A09', 'A02', '45.155.205.33']),
          success: `Chi arriva sa subito dove mettere le mani. Una versione da manuale:

\`\`\`
CONSEGNE 13/11 turno mattino -> pomeriggio
APERTI
  A05+A06  PC-AMM-07 r.costa: phishing con macro, beacon ogni 5 min.
           In mano a Hanako (L2). Attesa isolamento.
  A09      DC-01: admin adm.temp creato da m.rossi senza change.
           Escalation a voce alle 10:12. In mano a Hanako.
CHIUSI
  A02      FP: k.tanaka in trasferta (trasferte.txt), MFA ok.
  A07 A13  benigni: scansione IT, CHG-2231 (09-11).
  A03 A12  EICAR, file di prova.
DA SORVEGLIARE
  45.155.205.33 scanner SSH su SRV-WEB-01 (A01 A04 A08 A11 A14).
  Proposto blocco sul firewall perimetrale.
\`\`\``,
        },
        {
          kind: 'task',
          title: 'Rileggi',
          body: `Prima di chiudere il turno, rileggi le consegne come le leggerà il collega:

\`\`\`
cat soc/consegne.txt
\`\`\``,
          objective: 'Rileggi soc/consegne.txt.',
          hints: ['cat e il file.', 'cat soc/consegne.txt'],
          check: readOf('soc/consegne.txt'),
          success: 'Una rilettura di trenta secondi trova quasi sempre un id mancante o una frase ambigua. Fa parte del lavoro.',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          ex: 'interpreta',
          question: 'Quale riga di consegna è più utile al collega?',
          options: [
            'A09 DC-01: admin adm.temp senza change, escalation a voce alle 10:12, in mano a Hanako (L2)',
            'C\'è una cosa strana sul server, ci stanno guardando',
            'A09 gestito',
            'Vedi i ticket di stamattina',
          ],
          correct: 0,
          explain: 'Id, macchina, cosa, cosa è stato fatto, chi ce l\'ha in mano. "Gestito" non dice se è chiuso o aperto, né da chi.',
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Cosa misura l\'MTTD (Mean Time To Detect) di un SOC?',
          options: [
            'Il tempo medio tra l\'inizio di un attacco e il momento in cui il SOC se ne accorge',
            'Il tempo medio per chiudere un ticket',
            'Quanti allarmi arrivano in un giorno',
            'Quanto dura un turno',
          ],
          correct: 0,
          explain: 'MTTD = tempo per accorgersene; MTTR (Mean Time To Respond/Recover) = tempo per rispondere o ripristinare. Sono i numeri con cui si misura un SOC: oggi l\'MTTD per A05 è stato di 2 minuti (09:01 → 09:03).',
        },
        {
          kind: 'lesson',
          title: 'Fine turno',
          body: `@rook: Hanako ha isolato il PC dell'amministrazione e bloccato l'account di m.rossi. Dice che la tua nota è la prima che non ha dovuto rifare. Ti vogliono anche domani.

@nyx: Ecco il lavoro di un analista L1, senza effetti speciali: leggere, raggruppare, dare priorità, chiudere con le prove, passare la palla con una nota chiara, lasciare consegne pulite. Gli strumenti cambiano da azienda a azienda (Splunk, Elastic, Sentinel, QRadar, TheHive, ServiceNow...); il metodo è questo.

@nyx: Ai colloqui per ruoli SOC ti chiederanno proprio queste cose: "che differenza c'è tra un falso positivo e un falso negativo?", "come decidi la priorità?", "quando fai escalation?". Adesso le sai, e le hai fatte.`,
        },
      ],
      recap: [
        ['passaggio di consegne', 'aperti, chiusi, da sorvegliare: al collega del turno dopo'],
        ['APERTI', 'cosa, stato, in mano a chi'],
        ['CHIUSI', 'cosa e perché, con la prova'],
        ['DA SORVEGLIARE', 'cose non ancora incidenti che potrebbero diventarlo'],
        ['MTTD', 'tempo medio per accorgersi di un attacco'],
        ['MTTR', 'tempo medio per rispondere / ripristinare'],
      ],
    },
  ],
};
