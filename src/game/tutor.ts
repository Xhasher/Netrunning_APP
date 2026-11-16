// Il mentore del percorso: un tutor a regole (niente intelligenza artificiale, niente chiavi
// nel codice). Legge il percorso scelto, il capitolo raggiunto e i dati del motore, e dice
// cosa fare oggi, quali lacune contano per quel lavoro e cosa arriva nei prossimi capitoli.
// Non propone mai esercizi su cose non ancora insegnate.

import { dueSkills, isFragile, levelFor, recurringErrors, ERROR_ADVICE, DIFFICULTY_NAMES, type Learn } from './engine';
import { TRACKS, type Track, type TrackId } from './orientation';

/** Capitoli che ogni percorso approfondisce (gli altri restano la base comune). */
export const FOCUS: Record<TrackId, string[]> = {
  dfir: ['ch04', 'ch06', 'ch08', 'chSOC', 'ch12', 'chDF'],
  pentest: ['ch02', 'ch07', 'ch09', 'ch10', 'ch11', 'chPT'],
  soc: ['ch04', 'ch08', 'chSOC', 'ch09', 'ch12', 'chSJ'],
  eng: ['chAM', 'ch05', 'ch09', 'ch11', 'ch12', 'ch13'],
  malware: ['ch06', 'chPY', 'ch08', 'ch12', 'chDF'],
};

/** Argomenti del percorso e dove li tratta il corso (null = non ancora nel corso). */
export const TOPICS: Record<TrackId, [string, string | null][]> = {
  dfir: [
    ['Hash e integrità delle prove', 'ch06'],
    ['Catena di custodia', 'chDF'],
    ['File system, date dei file, file mascherati', 'chDF'],
    ['Log ed eventi di sistema, timeline', 'ch04'],
    ['Processi e servizi', 'ch03'],
    ['Eventi di Windows', 'ch12'],
    ['Incident response completa', 'ch08'],
    ['Analisi della memoria RAM', null],
    ['Recupero di dati cancellati', null],
  ],
  pentest: [
    ['Ricognizione ed enumerazione', 'chPT'],
    ['Scansione con nmap', 'ch02'],
    ['Sicurezza web e OWASP Top 10', 'ch07'],
    ['SQL injection e XSS', 'ch07'],
    ['Fonti aperte (OSINT)', 'ch10'],
    ['Privilege escalation', 'ch11'],
    ['Windows e Active Directory', 'ch12'],
    ['Report e riverifica', 'chPT'],
  ],
  soc: [
    ['Log e triage', 'ch04'],
    ['SIEM e regole di rilevamento', 'ch08'],
    ['Falsi positivi ed escalation', 'chSOC'],
    ['Traffico di rete', 'ch09'],
    ['Eventi di Windows', 'ch12'],
    ['Threat intelligence e MITRE ATT&CK', 'ch08'],
    ['Incident response', 'ch08'],
  ],
  eng: [
    ['Amministrazione Linux', 'chAM'],
    ['Permessi e minimo privilegio', 'ch03'],
    ['Automazione con Bash', 'ch05'],
    ['Firewall e reti', 'ch09'],
    ['Hardening', 'ch11'],
    ['Windows, identità e Active Directory', 'ch12'],
    ['Cloud', 'ch13'],
    ['Backup e ripristino', 'chAM'],
  ],
  malware: [
    ['Impronte e codifiche', 'ch06'],
    ['Programmazione con Python', 'chPY'],
    ['Processi e persistenza', 'ch08'],
    ['Indicatori di compromissione', 'ch08'],
    ['Eventi di Windows e Sysmon', 'ch12'],
    ['File mascherati e metadati', 'chDF'],
    ['Analisi statica e dinamica in sandbox', null],
    ['File eseguibili (formato PE/ELF)', null],
  ],
};

export const MENTOR_NAMES: Record<TrackId, string> = {
  dfir: 'DFIR Mentor',
  pentest: 'Ethical Hacking Mentor',
  soc: 'SOC Mentor',
  eng: 'Security Engineering Mentor',
  malware: 'Malware Analysis Mentor',
};

export interface Advice {
  text: string;
  /** azione proposta: allenare una competenza, aprire una missione, un'attività */
  act?: { kind: 'skill'; skill: string } | { kind: 'mission'; id: string } | { kind: 'practice'; act: Track['practice'][number]['act'] } | { kind: 'chtest'; chapter: string };
}

export interface TutorInput {
  track: TrackId;
  learn: Learn;
  taught: ReadonlySet<string>;
  /** stato 0-6 di una competenza (skills.ts) */
  state: (skill: string) => number;
  completed: ReadonlySet<string>;
  day: number;
  /** prossima missione da fare (id, titolo, capitolo) */
  next: { id: string; title: string; chapter: string; chapterTitle: string } | null;
  /** capitoli completati senza verifica di fine capitolo superata */
  pendingTests: string[];
  chapterTitle: (id: string) => string;
  chapterDone: (id: string) => boolean;
}

export interface TutorOutput {
  name: string;
  track: Track;
  today: Advice[];
  gaps: string[];
  strong: string[];
  upcoming: string[];
}

export function tutor(i: TutorInput): TutorOutput {
  const track = TRACKS.find((t) => t.id === i.track)!;
  const mine = new Set(track.skills);
  const today: Advice[] = [];
  // 1. ripasso: le competenze del percorso in scadenza, prima delle altre
  const due = dueSkills(i.learn, i.taught, i.day).filter((k) => mine.has(k));
  for (const k of due.slice(0, 2)) today.push({ text: `Ripassa \`${k}\`: è il momento giusto per non dimenticarla (livello ${DIFFICULTY_NAMES[levelFor(i.learn[k], i.state(k))]}).`, act: { kind: 'skill', skill: k } });
  // 2. lacune: competenze del percorso fragili
  const fragile = track.skills.filter((k) => i.taught.has(k) && isFragile(i.learn[k]));
  for (const k of fragile.filter((k) => !due.includes(k)).slice(0, 1)) today.push({ text: `\`${k}\` è fragile, e nel tuo lavoro la userai spesso: un giro guidato nella Palestra.`, act: { kind: 'skill', skill: k } });
  // 3. errori ricorrenti
  const err = recurringErrors(i.learn)[0];
  if (err) today.push({ text: `Un errore che ritorna (${err.kind}, ${err.n} volte): ${ERROR_ADVICE[err.kind] ?? ''}` });
  // 4. il corso: la prossima missione, sottolineando se è un capitolo del percorso
  if (i.next) {
    const focus = FOCUS[i.track].includes(i.next.chapter);
    today.push({ text: `Prosegui con "${i.next.title}" (${i.next.chapterTitle})${focus ? ': è un capitolo centrale per il tuo percorso' : ': fa parte della base comune, che serve a tutti'}.`, act: { kind: 'mission', id: i.next.id } });
  }
  // 5. una verifica di fine capitolo lasciata indietro, se è del percorso
  const test = i.pendingTests.find((c) => FOCUS[i.track].includes(c));
  if (test) today.push({ text: `La verifica di fine capitolo "${i.chapterTitle(test)}" non è ancora superata: fissa quello che hai fatto.`, act: { kind: 'chtest', chapter: test } });
  // 6. un'attività che somiglia al lavoro
  const prac = track.practice.find((p) => i.completed.has(p.after));
  if (prac) today.push({ text: `Una prova sul campo: ${prac.label}${/[.?!]$/.test(prac.label) ? '' : '.'}`, act: { kind: 'practice', act: prac.act } });

  const gaps = track.skills.filter((k) => i.taught.has(k) && (isFragile(i.learn[k]) || i.state(k) <= 2));
  const strong = track.skills.filter((k) => i.state(k) >= 4);
  const upcoming = FOCUS[i.track].filter((c) => !i.chapterDone(c)).slice(0, 3).map(i.chapterTitle);
  return { name: MENTOR_NAMES[i.track], track, today: today.slice(0, 5), gaps, strong, upcoming };
}
