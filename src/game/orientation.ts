// Orientamento professionale: quale settore della sicurezza fa per te?
//
// Tre fonti, tenute SEPARATE e mostrate separate:
//   1. interessi dichiarati: un test di situazioni, adatto a chi non sa niente di tecnico
//   2. esperienza: brevi assaggi guidati di ogni lavoro, con la domanda "ti è piaciuto?"
//   3. capacità dimostrate: i dati del motore di apprendimento sulle competenze tipiche
//      di ogni percorso, e i risultati delle attività che gli somigliano
//
// Il profilo non è una diagnosi né un test validato: è un aiuto a scegliere, e la scelta
// finale resta di chi gioca.

import { dimensionsOf, type Learn } from './engine';

export type TrackId = 'dfir' | 'pentest' | 'soc' | 'eng' | 'malware';

export interface Track {
  id: TrackId;
  name: string;
  short: string;
  /** una giornata tipo */
  day: string[];
  /** cosa piace di solito a chi lo fa */
  likes: string;
  /** cosa può pesare */
  hard: string;
  /** competenze del corso tipiche del percorso (nomi del motore) */
  skills: string[];
  /** attività del gioco che gli somigliano */
  practice: { label: string; act: 'scene' | 'game-soc' | 'game-phishing' | 'sim' | 'palestra' | 'ops'; after: string }[];
}

export const TRACKS: Track[] = [
  {
    id: 'dfir',
    name: 'Digital Forensics & Incident Response',
    short: 'Indagare dopo un attacco: raccogliere prove, ricostruire cosa è successo, rimettere in piedi.',
    day: ['copiare un disco senza alterarlo e calcolarne l\'impronta', 'ricostruire una timeline da log, file e cronologie', 'scrivere un rapporto che regga anche davanti a un giudice'],
    likes: 'Chi ama i gialli, la pazienza dei dettagli, il "come è andata davvero".',
    hard: 'Lavoro sotto pressione durante gli incidenti; molta documentazione precisa.',
    skills: ['find', 'ls', 'cat', 'grep', 'sha256sum', 'file', 'stat', 'tar', 'journalctl', 'last', 'indagine'],
    practice: [{ label: 'Scena del crimine SC-01', act: 'scene', after: 'ch01-m5' }, { label: 'Operazioni di incident response', act: 'ops', after: 'ch04-m3' }],
  },
  {
    id: 'pentest',
    name: 'Junior Penetration Tester',
    short: 'Attaccare con un contratto: trovare le falle prima dei criminali e spiegare come chiuderle.',
    day: ['ricognizione e scansione dentro un perimetro autorizzato', 'verificare una vulnerabilità senza fare danni', 'scrivere il report con gravità e soluzioni'],
    likes: 'Chi ama i rompicapo, provare strade diverse, capire come si rompe una cosa.',
    hard: 'Regole e perimetri rigidi; molta scrittura di report; tanto studio continuo.',
    skills: ['nmap', 'nc', 'curl', 'whois', 'dig', 'ssh', 'ip', 'ping'],
    practice: [{ label: 'Simulazioni di rete (nmap)', act: 'sim', after: 'ch02-m3' }, { label: 'Operazioni di audit', act: 'ops', after: 'ch03-m3' }],
  },
  {
    id: 'soc',
    name: 'SOC Analyst / Blue Team',
    short: 'Sorvegliare: guardare gli allarmi, separare i falsi dai veri, dare l\'allarme in tempo.',
    day: ['smistare decine di allarmi (triage)', 'cercare nei log cosa è successo davvero', 'passare il caso al livello successivo con una nota chiara'],
    likes: 'Chi ama riconoscere schemi, decidere in fretta, il lavoro di squadra a turni.',
    hard: 'Turni, anche di notte; molti falsi allarmi; serve restare attenti a lungo.',
    skills: ['grep', 'cut', 'sort', 'uniq', 'wc', 'tail', 'head', 'awk', 'journalctl', 'triage', 'phishing'],
    practice: [
      { label: 'Gioco: Phishing o no?', act: 'game-phishing', after: 'chF-m3' },
      { label: 'Gioco: Turno al SOC', act: 'game-soc', after: 'ch04-m3' },
    ],
  },
  {
    id: 'eng',
    name: 'Security Engineer / System Administrator',
    short: 'Costruire e tenere in piedi sistemi sicuri: permessi, servizi, firewall, aggiornamenti, backup.',
    day: ['configurare un server e chiudere quello che non serve', 'far ripartire un servizio guasto', 'automatizzare controlli e backup'],
    likes: 'Chi ama costruire, sistemare, vedere una cosa funzionare bene e a lungo.',
    hard: 'Quando si rompe qualcosa chiamano te; molta manutenzione ripetitiva da automatizzare.',
    skills: ['chmod', 'chown', 'sudo', 'systemctl', 'ufw', 'df', 'du', 'apt', 'crontab', 'nginx', 'variabili', 'for', 'if'],
    practice: [{ label: 'Palestra: permessi e servizi', act: 'palestra', after: 'ch03-m2' }, { label: 'Operazioni di audit', act: 'ops', after: 'ch03-m3' }],
  },
  {
    id: 'malware',
    name: 'Malware Analysis',
    short: 'Smontare i programmi malevoli: capire cosa fanno, come si nascondono, come riconoscerli.',
    day: ['esaminare un file sospetto in un ambiente isolato', 'estrarre impronte, indirizzi e nomi da condividere (indicatori)', 'descrivere il comportamento del programma'],
    likes: 'Chi ama capire come funzionano le cose dentro, la programmazione, la precisione.',
    hard: 'Curva di studio lunga (programmazione, sistemi); ruoli junior più rari.',
    skills: ['file', 'strings', 'sha256sum', 'xxd', 'base64', 'ps', 'python3'],
    practice: [{ label: 'Scena del crimine: il programma sconosciuto', act: 'scene', after: 'ch06-m2' }],
  },
];

// ---------------------------------------------------------------- test degli interessi

export interface InterestQ {
  id: string;
  question: string;
  options: { text: string; w: Partial<Record<TrackId, number>> }[];
}

/** Situazioni quotidiane: niente tecnicismi, nessuna risposta giusta. */
export const INTEREST: InterestQ[] = [
  {
    id: 'giallo',
    question: 'In un libro giallo, la parte che ti piace di più è...',
    options: [
      { text: 'mettere insieme gli indizi e scoprire come è andata', w: { dfir: 3, soc: 1 } },
      { text: 'il piano del colpo: come entrano, cosa sfruttano', w: { pentest: 3 } },
      { text: 'la guardia che si accorge che qualcosa non torna', w: { soc: 3 } },
      { text: 'come hanno costruito la cassaforte, e perché ha retto', w: { eng: 3 } },
    ],
  },
  {
    id: 'rotto',
    question: 'Un elettrodomestico smette di funzionare. Tu...',
    options: [
      { text: 'lo apro per capire come è fatto dentro', w: { malware: 3, eng: 1 } },
      { text: 'cerco il pezzo guasto e lo sistemo', w: { eng: 3 } },
      { text: 'ricostruisco cosa è successo prima che si rompesse', w: { dfir: 2, soc: 1 } },
      { text: 'provo a usarlo in modi strani per vedere dove cede', w: { pentest: 3 } },
    ],
  },
  {
    id: 'ritmo',
    question: 'Che ritmo di lavoro preferisci?',
    options: [
      { text: 'tante decisioni rapide, una dopo l\'altra', w: { soc: 3 } },
      { text: 'un problema lungo, da sviscerare con calma', w: { malware: 2, dfir: 2 } },
      { text: 'progetti con un inizio e una fine, ognuno diverso', w: { pentest: 3 } },
      { text: 'costruire qualcosa e poi farlo funzionare a lungo', w: { eng: 3 } },
    ],
  },
  {
    id: 'squadra',
    question: 'Lavori meglio...',
    options: [
      { text: 'in squadra, a turni, passandoci i casi', w: { soc: 3 } },
      { text: 'da solo, concentrato, con le cuffie', w: { malware: 2, pentest: 1 } },
      { text: 'a metà: da solo, ma spiegando poi agli altri cosa ho trovato', w: { dfir: 2, pentest: 2 } },
      { text: 'con chi usa i sistemi che curo, per capire cosa serve', w: { eng: 3 } },
    ],
  },
  {
    id: 'scrivere',
    question: 'Scrivere un rapporto chiaro su quello che hai fatto ti sembra...',
    options: [
      { text: 'una parte importante: se non lo spiego, non serve', w: { dfir: 2, pentest: 2 } },
      { text: 'un male necessario, meglio se breve', w: { soc: 1, eng: 1 } },
      { text: 'qualcosa che preferisco fare con schemi e diagrammi', w: { eng: 2, malware: 1 } },
    ],
  },
  {
    id: 'notte',
    question: 'Alle tre di notte un sistema viene attaccato. Dove vorresti essere?',
    options: [
      { text: 'davanti agli allarmi, a capire subito cosa sta succedendo', w: { soc: 3 } },
      { text: 'domattina, a ricostruire con calma tutto quello che è successo', w: { dfir: 3 } },
      { text: 'a dormire: il mio lavoro era renderlo più difficile prima', w: { eng: 2, pentest: 1 } },
      { text: 'a smontare il programma che hanno usato', w: { malware: 3 } },
    ],
  },
  {
    id: 'regole',
    question: 'Regole precise e procedure scritte ti...',
    options: [
      { text: 'rassicurano: so cosa fare e come', w: { soc: 2, eng: 2 } },
      { text: 'vanno bene, se lasciano spazio alla creatività', w: { pentest: 2, malware: 1 } },
      { text: 'servono, soprattutto quando le prove devono reggere', w: { dfir: 3 } },
    ],
  },
  {
    id: 'programmare',
    question: 'L\'idea di imparare a programmare...',
    options: [
      { text: 'mi attira molto', w: { malware: 3, eng: 1 } },
      { text: 'mi va bene, per automatizzare quello che faccio', w: { eng: 2, soc: 1 } },
      { text: 'preferirei usare strumenti già pronti', w: { soc: 2, dfir: 1, pentest: 1 } },
    ],
  },
  {
    id: 'soddisfazione',
    question: 'Cosa ti darebbe più soddisfazione?',
    options: [
      { text: 'trovare una falla che nessuno aveva visto', w: { pentest: 3 } },
      { text: 'fermare un attacco mentre succede', w: { soc: 3 } },
      { text: 'dimostrare con le prove chi è stato e come', w: { dfir: 3 } },
      { text: 'un sistema che non cade mai', w: { eng: 3 } },
      { text: 'capire fino in fondo un programma che nessuno capiva', w: { malware: 3 } },
    ],
  },
];

export function interestScores(answers: Record<string, number>): Record<TrackId, number> {
  const out = { dfir: 0, pentest: 0, soc: 0, eng: 0, malware: 0 } as Record<TrackId, number>;
  const max = { ...out };
  for (const q of INTEREST) {
    for (const t of Object.keys(out) as TrackId[]) max[t] += Math.max(0, ...q.options.map((o) => o.w[t] ?? 0));
    const a = answers[q.id];
    if (a === undefined || !q.options[a]) continue;
    for (const [t, w] of Object.entries(q.options[a].w)) out[t as TrackId] += w ?? 0;
  }
  for (const t of Object.keys(out) as TrackId[]) out[t] = max[t] ? out[t] / max[t] : 0;
  return out;
}

// ---------------------------------------------------------------- assaggi guidati

export interface TasteStep {
  text: string;
  options: string[];
  correct: number;
  explain: string;
}

/** Brevi assaggi di ogni lavoro. Sono un'ESPLORAZIONE dichiarata: non serve sapere niente. */
export const TASTES: Record<TrackId, { title: string; intro: string; steps: TasteStep[] }> = {
  dfir: {
    title: 'Il computer del ristorante',
    intro: 'Un ristorante ha trovato un file cancellato e uno nuovo che nessuno conosce. Ti chiamano per capire cosa è successo.',
    steps: [
      { text: 'Prima cosa da fare, appena arrivi?', options: ['Fare una copia del disco e lavorare sulla copia', 'Aprire subito i file sospetti sul computer originale', 'Spegnere tutto e reinstallare'], correct: 0, explain: 'Sull\'originale non si lavora: ogni file aperto cambia qualcosa (per esempio la data di ultimo accesso). Si fa una copia e se ne calcola l\'impronta.' },
      { text: 'Il file nuovo è stato creato alle 02:14. Il ristorante chiude alle 23. Cosa ne pensi?', options: ['Un indizio: qualcuno era lì di notte', 'Niente: gli orari dei file non contano', 'È stato sicuramente il proprietario'], correct: 0, explain: 'Le date dei file sono una delle fonti della timeline. Da sole non dicono chi, ma dicono quando: e di notte non c\'era nessuno.' },
      { text: 'Nel rapporto scrivi...', options: ['solo ciò che le prove dimostrano', 'chi pensi sia stato, anche senza prove', 'che il computer va buttato e ricomprato'], correct: 0, explain: 'Un rapporto forense afferma solo ciò che si può dimostrare. Le ipotesi si scrivono come ipotesi.' },
    ],
  },
  pentest: {
    title: 'Il sito della palestra',
    intro: 'Una palestra ti ha ingaggiato, con un contratto firmato, per verificare il suo sito prima dell\'apertura.',
    steps: [
      { text: 'Il contratto copre il sito della palestra. Noti che il server ospita anche il sito di un negozio vicino. Cosa fai?', options: ['Resto sulla palestra e lo segnalo', 'Controllo anche il negozio, già che ci sono', 'Chiedo al negozio, a voce, se posso'], correct: 0, explain: 'Il perimetro non si discute: quello che non è nel contratto è vietato, anche se è "lì accanto".' },
      { text: 'Il sito mostra un messaggio d\'errore con la versione esatta del programma che usa. È un problema?', options: ['Sì, piccolo: aiuta chi attacca', 'No, è un\'informazione innocua', 'Sì, grave: il sito è già bucato'], correct: 0, explain: 'Si chiama "information disclosure": non apre la porta, ma dice a chi attacca quale chiave cercare. Gravità bassa, ma va segnalato.' },
      { text: 'Hai trovato una falla vera. Il passo successivo?', options: ['Dimostrarla in modo minimo e scrivere come correggerla', 'Sfruttarla fino in fondo per vedere quanti dati escono', 'Pubblicarla per avvisare gli utenti'], correct: 0, explain: 'Il pentester dimostra senza fare danni e consegna la soluzione. Il valore del lavoro è il report.' },
    ],
  },
  soc: {
    title: 'Tre allarmi in dieci minuti',
    intro: 'Sei al tuo primo turno in un SOC. Arrivano tre allarmi, uno dopo l\'altro.',
    steps: [
      { text: 'Allarme 1: un dipendente sbaglia la password 3 volte alle 9:05, poi entra. Dall\'ufficio.', options: ['Falso allarme: lo annoto', 'Escalation immediata al L2', 'Blocco subito l\'account'], correct: 0, explain: 'Pochi errori, orario d\'ufficio, rete interna, poi successo: qualcuno ha sbagliato a scrivere. Il triage serve a non perdere tempo qui.' },
      { text: 'Allarme 2: 400 tentativi in 2 minuti su "admin" da un indirizzo estero. Nessun accesso riuscito.', options: ['Annoto e verifico gli accessi riusciti', 'Escalation al livello 2, subito', 'Ignoro: tanto non è entrato'], correct: 0, explain: 'È un brute force automatico, rumore di fondo di Internet. Va annotato e tenuto d\'occhio: diventa urgente se compare un accesso riuscito.' },
      { text: 'Allarme 3: un accesso riuscito alle 3:12 da un paese mai visto, con l\'account del direttore, senza MFA.', options: ['Escalation subito, con una nota chiara', 'Aspetto domattina per chiedere al direttore', 'Falso allarme: sarà in vacanza'], correct: 0, explain: 'Accesso riuscito, orario strano, paese nuovo, account importante e niente secondo fattore: si scala, subito, scrivendo cosa hai visto.' },
    ],
  },
  eng: {
    title: 'Il server del dentista',
    intro: 'Uno studio dentistico ti chiede di sistemare il suo server prima che arrivi il nuovo gestionale.',
    steps: [
      { text: 'Il file con le password del gestionale è leggibile da tutti gli utenti. Cosa fai?', options: ['Permessi 600 e password nuova', 'Lo sposto in un\'altra cartella', 'Lo lascio: lo usano solo loro'], correct: 0, explain: 'Permessi giusti e, visto che è stata esposta, password nuova. È il minimo privilegio in pratica.' },
      { text: 'Sul server gira un servizio di condivisione file che nessuno usa più. Cosa fai?', options: ['Lo spengo e lo disattivo all\'avvio', 'Lo lascio acceso, non dà fastidio', 'Lo aggiorno e lo lascio acceso'], correct: 0, explain: 'Ogni servizio acceso è una porta in più. Quello che non serve si spegne: si chiama ridurre la superficie d\'attacco.' },
      { text: 'Prima di modificare la configurazione del server web...', options: ['Copia, modifica, controllo, riavvio', 'Modifico e riavvio subito il servizio', 'Modifico e riavvio l\'intero server'], correct: 0, explain: 'Copia, modifica, controllo, riavvio, verifica. È la sequenza che evita di spegnere un sito per una virgola.' },
    ],
  },
  malware: {
    title: 'L\'allegato della fattura',
    intro: 'Un collega ha ricevuto una "fattura" in allegato e non l\'ha aperta. Ti chiedono di capire cos\'è.',
    steps: [
      { text: 'Dove lo esamini?', options: ['In un computer isolato', 'Sul mio portatile di lavoro', 'Sul computer del collega'], correct: 0, explain: 'Un programma sospetto si studia in un ambiente isolato (una "sandbox"): se è malevolo, non deve poter raggiungere niente.' },
      { text: 'Il file si chiama fattura.pdf.exe. Cosa ti dice?', options: ['È un programma travestito', 'È un PDF con un nome lungo', 'È un documento danneggiato'], correct: 0, explain: 'L\'estensione vera è l\'ultima: .exe, un programma. Il ".pdf" in mezzo serve a ingannare chi guarda di fretta.' },
      { text: 'Calcoli la sua impronta (hash) e la cerchi in un elenco di programmi malevoli noti. Perché?', options: ['Se è noto, so già cosa fa', 'Per cambiargli il nome', 'Per renderlo innocuo'], correct: 0, explain: 'Le impronte dei malware noti sono condivise tra aziende: riconoscerne uno in un secondo risparmia ore di analisi.' },
    ],
  },
};

// ---------------------------------------------------------------- capacità e profilo

export interface Ability {
  /** 0-1, o null se i dati non bastano per dire qualcosa */
  value: number | null;
  /** quanti tentativi registrati sulle competenze del percorso */
  tries: number;
  strong: string[];
  weak: string[];
}

/** Capacità dimostrate su un percorso, dai dati del motore. Servono almeno 6 tentativi. */
export function abilityFor(track: Track, learn: Learn, extra: number | null = null): Ability {
  let sum = 0;
  let w = 0;
  let tries = 0;
  const strong: string[] = [];
  const weak: string[] = [];
  for (const k of track.skills) {
    const s = learn[k];
    if (!s) continue;
    const n = s.ok + s.ko;
    if (!n) continue;
    tries += n;
    const d = dimensionsOf(s);
    const v = (d.precisione ?? 0) * 0.6 + (d.autonomia ?? 0) * 0.4;
    sum += v * Math.min(n, 10);
    w += Math.min(n, 10);
    if (n >= 3 && v >= 0.75) strong.push(k);
    if (n >= 3 && v < 0.5) weak.push(k);
  }
  let value = tries >= 6 && w ? sum / w : null;
  // i risultati delle attività che somigliano al lavoro contano quanto un quarto
  if (extra !== null) value = value === null ? (tries >= 3 ? extra : null) : value * 0.75 + extra * 0.25;
  return { value, tries, strong, weak };
}

export interface OrientationSave {
  /** risposte al test degli interessi: id domanda -> indice risposta */
  answers: Record<string, number>;
  /** assaggi: id percorso -> [risposte giuste, gradimento 1-3] */
  tastes: Partial<Record<TrackId, [number, number]>>;
  /** percorso scelto da chi gioca */
  choice?: TrackId;
  /** percorso compatibile, scelto o suggerito */
  second?: TrackId;
}

export interface ProfileRow {
  track: Track;
  interest: number;
  /** gradimento dell'assaggio, 0-1, o null se non fatto */
  liked: number | null;
  ability: Ability;
  /** punteggio complessivo, solo per ordinare */
  score: number;
}

/** Combina le tre fonti. L'interesse pesa di più; capacità e gradimento solo se misurati. */
export function buildProfile(o: OrientationSave, learn: Learn, extras: Partial<Record<TrackId, number | null>> = {}): ProfileRow[] {
  const interest = interestScores(o.answers);
  return TRACKS.map((track) => {
    const taste = o.tastes[track.id];
    const liked = taste ? (taste[1] - 1) / 2 : null;
    const ability = abilityFor(track, learn, extras[track.id] ?? null);
    let score = interest[track.id] * 0.5;
    let wt = 0.5;
    if (liked !== null) {
      score += liked * 0.25;
      wt += 0.25;
    }
    if (ability.value !== null) {
      score += ability.value * 0.25;
      wt += 0.25;
    }
    return { track, interest: interest[track.id], liked, ability, score: score / wt };
  }).sort((a, b) => b.score - a.score);
}

/** Spiega in parole semplici perché un percorso è in cima (o no), senza confondere interesse e capacità. */
export function explainRow(r: ProfileRow): string {
  const parts: string[] = [];
  parts.push(r.interest >= 0.6 ? 'le tue risposte mostrano un **interesse forte**' : r.interest >= 0.35 ? 'un **interesse medio** nelle tue risposte' : 'un **interesse basso** nelle tue risposte');
  if (r.liked !== null) parts.push(r.liked >= 0.75 ? 'l\'assaggio ti è **piaciuto**' : r.liked <= 0.25 ? 'l\'assaggio **non** ti è piaciuto' : 'l\'assaggio ti ha lasciato **tiepido**');
  else parts.push('l\'assaggio non l\'hai ancora fatto');
  if (r.ability.value === null) parts.push('le capacità **non sono ancora misurabili** (servono più esercizi sulle sue competenze)');
  else parts.push(r.ability.value >= 0.75 ? 'nelle competenze tipiche vai **bene**' : r.ability.value >= 0.5 ? 'nelle competenze tipiche vai **abbastanza bene**' : 'le competenze tipiche sono **ancora fragili**');
  const text = parts.join('; ') + '.';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
