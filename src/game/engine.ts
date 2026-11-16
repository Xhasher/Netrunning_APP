// Motore di apprendimento: un solo registro per tutta l'app.
//
// Ogni attività (passo di missione, esercizio della Palestra, sfida, carta di Memoria,
// domanda di quiz o d'esame) consegna qui il suo esito con `recordAttempt`. Il motore tiene,
// per ogni competenza, risposte giuste e sbagliate, aiuti, tempi, errori ricorrenti, prove a
// distanza di giorni e i tipi di attività in cui è stata usata da sola. Da questi dati ricava:
//
//   - sei misure separate: conoscenza, memoria, precisione, autonomia, trasferimento, ragionamento
//   - lo stato della competenza (vedi skills.ts, a cui aggiunge "applicata autonomamente")
//   - il livello consigliato per il prossimo esercizio (guidato, intermedio, avanzato)
//   - quando ripassarla (ripetizione dilazionata) e se è fragile
//
// I giochi non hanno una logica di progressione propria: chiedono al motore cosa è stato
// insegnato (`introduced` in skills.ts) e quale livello proporre.

/** Tipo di attività da cui viene una prova. */
export type ActivityKind =
  | 'missione'
  | 'palestra'
  | 'simulazione'
  | 'operazione'
  | 'indagine'
  | 'memoria'
  | 'quiz'
  | 'ragionamento'
  | 'esame';

/** Livello di un esercizio: guidato, intermedio, avanzato. */
export type Difficulty = 1 | 2 | 3;
export const DIFFICULTY_NAMES: Record<Difficulty, string> = { 1: 'guidato', 2: 'intermedio', 3: 'avanzato' };

/**
 * Carta d'identità di un'attività: ogni esercizio nuovo la dichiara. I prerequisiti
 * (`requires`) devono essere tutti già insegnati perché l'attività venga proposta,
 * a meno che `explore` dichiari che è un'introduzione a un argomento nuovo.
 */
export interface ActivityMeta {
  id: string;
  chapter: string;
  topics: string[];
  /** competenze allenate */
  skills: string[];
  /** competenze che devono essere già state insegnate */
  requires: string[];
  level: Difficulty;
  kind: ActivityKind;
  /** obiettivo didattico, in una frase */
  goal: string;
  /** come si valuta */
  criteria: string;
  explore?: boolean;
}

/** Dati raccolti su una competenza. Nomi brevi: finiscono nel salvataggio. */
export interface SkillStats {
  /** tentativi riusciti / sbagliati */
  ok: number;
  ko: number;
  /** riusciti con un aiuto */
  hint: number;
  /** tempo totale dei tentativi cronometrati, in secondi, e quanti sono */
  sec: number;
  timed: number;
  /** ultimo giorno di esercizio */
  last: number;
  /** riusciti di fila (per gli intervalli di ripasso) */
  run: number;
  /** errori ricorrenti: categoria -> quante volte */
  errs: Record<string, number>;
  /** prove a distanza (almeno 3 giorni dopo l'ultima volta): [giuste, totali] */
  late: [number, number];
  /** domande di teoria: [giuste, totali] */
  know: [number, number];
  /** domande sul perché: [giuste, totali] */
  why: [number, number];
  /** tipi di attività in cui è stata usata con successo senza aiuti */
  kinds: ActivityKind[];
}

export type Learn = Record<string, SkillStats>;

export interface Attempt {
  skills: readonly string[];
  ok: boolean;
  kind: ActivityKind;
  /** l'esito è arrivato con suggerimenti o con la soluzione mostrata */
  helped?: boolean;
  /** secondi impiegati, se misurati */
  sec?: number;
  /** categoria dell'errore (vedi errorKind) */
  error?: string;
  day: number;
}

/** Quanti giorni devono passare perché una prova conti come "a distanza". */
export const LATE_AFTER = 3;
/** Intervalli di ripasso in giorni, in base ai successi di fila. */
export const INTERVALS = [1, 2, 4, 7, 14, 30, 60];

function blank(): SkillStats {
  return { ok: 0, ko: 0, hint: 0, sec: 0, timed: 0, last: 0, run: 0, errs: {}, late: [0, 0], know: [0, 0], why: [0, 0], kinds: [] };
}

/** Completa un record letto da un salvataggio vecchio o incompleto. */
export function normalizeStats(s: Partial<SkillStats> | undefined): SkillStats {
  const b = blank();
  if (!s) return b;
  return {
    ...b,
    ...s,
    errs: { ...(s.errs ?? {}) },
    late: [...(s.late ?? b.late)] as [number, number],
    know: [...(s.know ?? b.know)] as [number, number],
    why: [...(s.why ?? b.why)] as [number, number],
    kinds: [...(s.kinds ?? [])],
  };
}

/** Registra l'esito di un'attività su tutte le competenze coinvolte. */
export function recordAttempt(learn: Learn, a: Attempt): void {
  for (const skill of new Set(a.skills)) {
    const s = (learn[skill] = normalizeStats(learn[skill]));
    // una prova arrivata dopo qualche giorno misura la memoria, non solo l'esercizio
    if (s.last > 0 && a.day - s.last >= LATE_AFTER) {
      s.late[1]++;
      if (a.ok && !a.helped) s.late[0]++;
    }
    if (a.kind === 'quiz' || a.kind === 'esame' || a.kind === 'memoria') {
      s.know[1]++;
      if (a.ok) s.know[0]++;
    }
    if (a.kind === 'ragionamento') {
      s.why[1]++;
      if (a.ok) s.why[0]++;
    }
    if (a.ok) {
      s.ok++;
      if (a.helped) s.hint++;
      s.run = a.helped ? Math.max(0, s.run - 1) : s.run + 1;
      if (!a.helped && !s.kinds.includes(a.kind)) s.kinds.push(a.kind);
    } else {
      s.ko++;
      s.run = 0;
      if (a.error) s.errs[a.error] = (s.errs[a.error] ?? 0) + 1;
    }
    if (a.sec !== undefined && a.sec > 0 && a.sec < 3600) {
      s.sec += a.sec;
      s.timed++;
    }
    s.last = Math.max(s.last, a.day);
  }
}

/** Unisce i registri di due dispositivi tenendo, per ogni competenza, il più ricco. */
export function mergeLearn(a: Learn, b: Learn): Learn {
  const out: Learn = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = normalizeStats(a[k]);
    const y = normalizeStats(b[k]);
    const base = x.ok + x.ko >= y.ok + y.ko ? x : y;
    out[k] = { ...base, last: Math.max(x.last, y.last), kinds: [...new Set([...x.kinds, ...y.kinds])] };
  }
  return out;
}

// ---------------------------------------------------------------- le misure

const ratio = ([g, t]: [number, number]): number | null => (t ? g / t : null);

export interface Dimensions {
  /** risposte giuste alle domande di teoria */
  conoscenza: number | null;
  /** prove riuscite senza aiuti a distanza di giorni */
  memoria: number | null;
  /** tentativi riusciti sul totale */
  precisione: number | null;
  /** riusciti senza aiuti sul totale dei riusciti */
  autonomia: number | null;
  /** in quanti tipi di attività diversi è stata usata da sola (3 = pieno) */
  trasferimento: number | null;
  /** domande sul perché */
  ragionamento: number | null;
}

export const DIMENSION_NAMES: Record<keyof Dimensions, string> = {
  conoscenza: 'Conoscenza',
  memoria: 'Memoria',
  precisione: 'Precisione',
  autonomia: 'Autonomia',
  trasferimento: 'Trasferimento',
  ragionamento: 'Ragionamento',
};

export function dimensionsOf(s: SkillStats | undefined): Dimensions {
  const x = normalizeStats(s);
  const tries = x.ok + x.ko;
  return {
    conoscenza: ratio(x.know),
    memoria: ratio(x.late),
    precisione: tries ? x.ok / tries : null,
    autonomia: x.ok ? (x.ok - x.hint) / x.ok : null,
    trasferimento: tries ? Math.min(1, x.kinds.length / 3) : null,
    ragionamento: ratio(x.why),
  };
}

/** Media pesata delle misure su più competenze (ognuna pesa per quanti dati ha). */
export function overallDimensions(learn: Learn, skills?: readonly string[]): Dimensions {
  const keys = (skills ?? Object.keys(learn)).filter((k) => learn[k]);
  const out = {} as Dimensions;
  for (const d of Object.keys(DIMENSION_NAMES) as (keyof Dimensions)[]) {
    let sum = 0;
    let w = 0;
    for (const k of keys) {
      const v = dimensionsOf(learn[k])[d];
      if (v === null) continue;
      const s = learn[k];
      const weight = 1 + Math.log2(1 + s.ok + s.ko);
      sum += v * weight;
      w += weight;
    }
    out[d] = w ? sum / w : null;
  }
  return out;
}

// ---------------------------------------------------------------- decidere

/** Usata da sola in almeno tre tipi di attività diversi, con memoria a distanza: applicata autonomamente. */
export function appliedAutonomously(s: SkillStats | undefined): boolean {
  if (!s) return false;
  const x = normalizeStats(s);
  return x.kinds.length >= 3 && x.late[0] >= 1;
}

/** È fragile: sbagliata spesso, o dimenticata. */
export function isFragile(s: SkillStats | undefined): boolean {
  if (!s) return false;
  const x = normalizeStats(s);
  const tries = x.ok + x.ko;
  if (tries >= 3 && x.ok / tries < 0.6) return true;
  if (x.late[1] >= 2 && x.late[0] / x.late[1] < 0.5) return true;
  return false;
}

/**
 * Livello del prossimo esercizio su una competenza. `state` è lo stato di skills.ts (0-5).
 * Mai sopra il guidato se la competenza è solo introdotta; avanzato solo con buona
 * precisione e autonomia. Il livello avanzato chiede di più, ma sempre su cose già insegnate.
 */
export function levelFor(s: SkillStats | undefined, state: number): Difficulty {
  if (state <= 2) return 1;
  const d = dimensionsOf(s);
  const tries = s ? s.ok + s.ko : 0;
  if (tries >= 3 && (d.precisione ?? 1) < 0.6) return 1;
  if (state >= 4 && (d.precisione ?? 0) >= 0.8 && (d.autonomia ?? 0) >= 0.7) return 3;
  return 2;
}

/** Giorni di attesa prima del prossimo ripasso. */
export function intervalOf(s: SkillStats | undefined): number {
  const x = normalizeStats(s);
  if (isFragile(x)) return 1;
  return INTERVALS[Math.min(INTERVALS.length - 1, x.run)];
}

/** Competenze da ripassare oggi, prima le più "scadute" e le fragili. */
export function dueSkills(learn: Learn, taught: ReadonlySet<string>, day: number): string[] {
  const due: { k: string; late: number }[] = [];
  for (const k of taught) {
    const s = learn[k];
    if (!s || s.last === 0) continue;
    const late = day - s.last - intervalOf(s);
    if (late >= 0) due.push({ k, late: late + (isFragile(s) ? 100 : 0) });
  }
  return due.sort((a, b) => b.late - a.late).map((x) => x.k);
}

/** Peso di una competenza in un allenamento misto: le scadute e le fragili tornano più spesso. */
export function reviewWeight(s: SkillStats | undefined, state: number, day: number): number {
  let w = Math.max(1, 6 - state);
  if (!s) return w;
  if (isFragile(s)) w += 4;
  if (day - s.last >= intervalOf(s)) w += 3;
  return w;
}

/** Un'attività si può proporre solo se tutto ciò che richiede è già stato insegnato. */
export function eligible(meta: Pick<ActivityMeta, 'requires' | 'explore'>, taught: ReadonlySet<string>): boolean {
  return !!meta.explore || meta.requires.every((r) => taught.has(r));
}

// ---------------------------------------------------------------- errori

/** Categoria di un messaggio d'errore della shell, per riconoscere gli errori ricorrenti. */
export function errorKind(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('permission denied') || m.includes('operation not permitted') || m.includes('not in the sudoers')) return 'permessi';
  if (m.includes('no such file') || m.includes('not a directory') || m.includes('is a directory') || m.includes('cannot access')) return 'percorso';
  if (m.includes('command not found')) return 'nome del comando';
  if (m.includes('invalid option') || m.includes('unrecognized option') || m.includes('unknown option') || m.includes('usage')) return 'opzione';
  if (m.includes('missing operand') || m.includes('missing') || m.includes('expected')) return 'argomento mancante';
  if (m.includes('syntax')) return 'sintassi';
  return 'altro';
}

export const ERROR_ADVICE: Record<string, string> = {
  permessi: 'Prima di un comando, chiediti di chi è il file e cosa ti permettono i suoi permessi (`ls -l`).',
  percorso: 'Controlla dove sei (`pwd`) e cosa c\'è (`ls`) prima di scrivere un percorso. Il tasto TAB completa i nomi per te.',
  'nome del comando': 'Un nome scritto male. Il tasto TAB completa anche i comandi.',
  opzione: 'Un\'opzione che il comando non conosce. Le opzioni giuste sono nella sua scheda del Manuale.',
  'argomento mancante': 'Al comando manca qualcosa su cui lavorare: un file, un indirizzo, un valore.',
  sintassi: 'Spazi, virgolette o parentesi fuori posto. Rileggi la riga un pezzo alla volta.',
  risposta: 'Hai inviato una risposta sbagliata: rileggi l\'output prima di rispondere, non andare a memoria.',
  saltato: 'Esercizi saltati: torna su queste competenze nella Palestra, al livello guidato.',
  altro: 'Leggi il messaggio d\'errore per intero: quasi sempre dice cosa non va.',
};

/** Gli errori più frequenti su tutte le competenze. */
export function recurringErrors(learn: Learn, min = 2): { kind: string; n: number; skills: string[] }[] {
  const by = new Map<string, { n: number; skills: Map<string, number> }>();
  for (const [k, s] of Object.entries(learn)) {
    for (const [e, n] of Object.entries(normalizeStats(s).errs)) {
      const x = by.get(e) ?? { n: 0, skills: new Map() };
      x.n += n;
      x.skills.set(k, (x.skills.get(k) ?? 0) + n);
      by.set(e, x);
    }
  }
  return [...by.entries()]
    .filter(([, x]) => x.n >= min)
    .sort((a, b) => b[1].n - a[1].n)
    .map(([kind, x]) => ({ kind, n: x.n, skills: [...x.skills.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k) }));
}

// ---------------------------------------------------------------- andamento

/** Un punto dell'andamento nel tempo: giorno, competenze applicate, precisione. */
export type Snapshot = [day: number, solid: number, precision: number];

/** Aggiorna (al più uno per giorno) l'andamento; ne tiene gli ultimi 90. */
export function snapshot(history: Snapshot[], day: number, solid: number, precision: number | null): Snapshot[] {
  const p = precision === null ? 0 : Math.round(precision * 100) / 100;
  const out = history.filter((h) => h[0] !== day);
  out.push([day, solid, p]);
  return out.sort((a, b) => a[0] - b[0]).slice(-90);
}
