// Competenze: ogni comando (o concetto, come la pipe) è una competenza con cinque stati,
// calcolati da ciò che il giocatore fa davvero, mai da un'autovalutazione.
//
//   introdotto  → l'ha visto in una lezione o in una scheda
//   compreso    → ha interpretato un output, corretto un errore, o la carta di Memoria è salita
//   esercitato  → l'ha usato in un esercizio riuscito, anche con suggerimenti
//   acquisito   → l'ha usato senza suggerimenti in almeno due situazioni diverse
//   consolidato → l'ha usato di nuovo senza aiuti almeno 7 giorni dopo l'acquisizione

import { CHAPTERS } from '../content';
import '../engine/manual';
import { ALIASES, MANPAGES } from '../engine/manpages';
import { commandsInLine, commandsInMarkup } from './cmdparse';
import type { LogEntry } from './coach';

export interface SkillEvidence {
  /** esercizi riusciti (con o senza aiuti) */
  ex: number;
  /** situazioni diverse risolte senza aiuti (missione, sfida, esercizio della Palestra) */
  solo: string[];
  /** giorno in cui è diventata "acquisita" */
  acq?: number;
  /** consolidata */
  cons?: boolean;
  /** compresa con un esercizio di interpretazione o di correzione */
  comp?: boolean;
}

export type Skills = Record<string, SkillEvidence>;

export const STATES = ['non ancora vista', 'introdotta', 'compresa', 'esercitata', 'acquisita', 'consolidata'] as const;
export type StateIndex = 0 | 1 | 2 | 3 | 4 | 5;

/** Moduli della nuova architettura e competenze che contengono. */
export const MODULES: { id: string; name: string; core: boolean; skills: string[] }[] = [
  { id: 'M0', name: 'Primo contatto', core: true, skills: ['whoami', 'hostname', 'pwd', 'ls', 'cd', 'cat', 'man', 'help', 'history', 'clear', 'echo'] },
  { id: 'M1', name: 'File e testo', core: true, skills: ['mkdir', 'touch', 'cp', 'mv', 'rm', 'rmdir', 'tree', 'redirezioni', 'find', 'grep', 'pipe', 'head', 'tail', 'wc', 'sort', 'uniq', 'cut', 'diff', 'tee', 'tar', 'file', 'stat', 'which', 'jolly'] },
  { id: 'M2', name: 'Amministrare Linux', core: true, skills: ['id', 'groups', 'chmod', 'chown', 'sudo', 'ps', 'systemctl', 'journalctl', 'nginx', 'apt', 'df', 'du', 'free', 'crontab', 'uptime', 'uname', 'who', 'last', 'lastb', 'env'] },
  { id: 'M3', name: 'Reti operative', core: true, skills: ['ip', 'ping', 'traceroute', 'dig', 'nslookup', 'ss', 'netstat', 'curl', 'ssh', 'ssh-keygen', 'ipcalc', 'arp', 'ifconfig'] },
  { id: 'M5', name: 'Bash e Python', core: true, skills: ['variabili', 'for', 'if', 'test', 'bash', 'nano', 'seq', 'sed', 'awk', 'tr', 'xargs', 'regex', 'python3'] },
  { id: 'M6', name: 'Crittografia e identità', core: true, skills: ['base64', 'sha256sum', 'md5sum', 'sha1sum', 'xxd', 'strings'] },
  { id: 'M8', name: 'SOC: sorvegliare e rispondere', core: true, skills: ['ufw', 'tcpdump', 'pwsh'] },
  { id: 'M9', name: 'Strumenti di rete', core: false, skills: ['nmap', 'nc'] },
  { id: 'M10', name: 'Vulnerability assessment e hardening', core: false, skills: ['whois', 'crtsh', 'exiftool', 'cve'] },
  { id: 'M5b', name: 'Shell e produttività', core: false, skills: ['alias', 'unalias', 'cheat', 'exit', 'date', 'lsb_release'] },
];

const SKILL_SET = new Set(MODULES.flatMap((m) => m.skills));

/** Nome canonico di una competenza (o null se non è una competenza tracciata). */
export function skillOf(word: string): string | null {
  const n = ALIASES[word] ?? word;
  return SKILL_SET.has(n) ? n : null;
}

/** Competenze esercitate da una riga di comando: i comandi, più pipe, redirezioni, variabili, cicli. */
export function skillsInLine(line: string): string[] {
  const out = new Set<string>();
  for (const c of commandsInLine(line)) {
    const s = skillOf(c === 'assign' ? 'variabili' : c === 'script' ? 'bash' : c);
    if (s) out.add(s);
  }
  if (/[^|]\|[^|]/.test(line)) out.add('pipe');
  if (/(^|\s)\d?>>?\s*\S/.test(line)) out.add('redirezioni');
  if (/^\s*for\s/.test(line) || /;\s*for\s/.test(line)) out.add('for');
  if (/^\s*if\s/.test(line) || /;\s*if\s/.test(line)) out.add('if');
  if (/\$\w|\$\{/.test(line) && !/\$_/.test(line)) out.add('variabili');
  // un cmdlet di PowerShell (Verbo-Nome) vale come pratica di pwsh
  if (/(^|[|\s"])(get|set|select|where|sort|group|measure|format|stop|disable|enter|exit)-[a-z]+/i.test(line)) out.add('pwsh');
  if (/(^|\s)[^\s"'|]*[*?][^\s"'|]*/.test(line.replace(/grep.*|find.*/, ''))) out.add('jolly');
  return [...out];
}

function ev(skills: Skills, s: string): SkillEvidence {
  return (skills[s] ??= { ex: 0, solo: [] });
}

/** Registra un esercizio riuscito. ctx = la situazione (missione, sfida...), per contare quelle diverse. */
export function recordSuccess(skills: Skills, list: readonly string[], ctx: string, helped: boolean, day: number): string[] {
  const promoted: string[] = [];
  for (const s of new Set(list)) {
    const e = ev(skills, s);
    e.ex++;
    if (helped) continue;
    const wasAcq = e.acq !== undefined;
    if (!e.solo.includes(ctx)) {
      e.solo.push(ctx);
      if (e.solo.length > 8) e.solo.shift();
    }
    if (!wasAcq && e.solo.length >= 2) {
      e.acq = day;
      promoted.push(s);
    } else if (wasAcq && !e.cons && day - (e.acq ?? day) >= 7) {
      e.cons = true;
      promoted.push(s);
    }
  }
  return promoted;
}

/** Registra un esercizio di interpretazione o di correzione superato. */
export function recordUnderstood(skills: Skills, list: readonly string[]): void {
  for (const s of new Set(list)) ev(skills, s).comp = true;
}

// ---------------------------------------------------------------- introdotto

let lessonIdx: Map<string, { step: number; cmds: string[] }[]> | null = null;

function lessons(): Map<string, { step: number; cmds: string[] }[]> {
  if (!lessonIdx) {
    lessonIdx = new Map();
    for (const ch of CHAPTERS)
      for (const m of ch.missions)
        lessonIdx.set(
          m.id,
          m.steps.flatMap((s, i) => (s.kind === 'lesson' ? [{ step: i, cmds: commandsInMarkup(s.body).map((c) => skillOf(c)).filter((c): c is string => !!c) }] : [])),
        );
  }
  return lessonIdx;
}

/** Competenze viste nelle lezioni delle missioni completate o già raggiunte. */
export function introduced(completed: readonly string[], progress: Record<string, number>): Set<string> {
  const out = new Set<string>();
  for (const [id, list] of lessons()) {
    const reached = completed.includes(id) ? Infinity : progress[id] ?? -1;
    for (const l of list) if (l.step <= reached) l.cmds.forEach((c) => out.add(c));
  }
  return out;
}

// ---------------------------------------------------------------- stato

export interface SkillContext {
  skills: Skills;
  intro: Set<string>;
  /** carte di Memoria: [scatola, scadenza] per id */
  srs: Record<string, [number, number]>;
}

/** La Memoria conta come "compreso" quando una carta sul comando è salita almeno alla seconda scatola. */
function memoryUnderstood(srs: Record<string, [number, number]>, skill: string): boolean {
  for (const [id, [box]] of Object.entries(srs)) {
    if (box < 2) continue;
    const parts = id.split(':');
    if ((parts[0] === 'c' || parts[0] === 'o' || parts[0] === 'x') && parts[1] === skill) return true;
  }
  return false;
}

export function stateOf(ctx: SkillContext, skill: string): StateIndex {
  const e = ctx.skills[skill];
  if (e?.cons) return 5;
  if (e?.acq !== undefined) return 4;
  if (e && e.ex > 0) return 3;
  if (e?.comp || memoryUnderstood(ctx.srs, skill)) return 2;
  if (ctx.intro.has(skill) || e) return 1;
  return 0;
}

/** Cosa manca per salire di stato, in parole semplici. */
export function nextStep(ctx: SkillContext, skill: string): string {
  const e = ctx.skills[skill];
  switch (stateOf(ctx, skill)) {
    case 0:
      return 'La incontrerai più avanti nel corso.';
    case 1:
      return 'Usala in un esercizio, o allenala nella Palestra.';
    case 2:
      return 'Usala in un esercizio riuscito.';
    case 3:
      return e && e.solo.length === 1 ? 'Ancora una situazione diversa senza suggerimenti.' : 'Usala senza suggerimenti in due situazioni diverse.';
    case 4:
      return 'Riusala senza aiuti tra qualche giorno: Palestra, Simulazioni o esami.';
    default:
      return 'Consolidata. Continua a usarla per non perderla.';
  }
}

// ---------------------------------------------------------------- dal diario esistente

/**
 * Ricostruisce le prove dalle missioni già giocate: ogni passo superato conta come esercizio,
 * senza aiuti se in quel passo non era stato chiesto un suggerimento.
 */
export function backfill(skills: Skills, logs: Record<string, LogEntry[]>, day: number): void {
  for (const [mission, log] of Object.entries(logs)) {
    const steps = new Map<number, LogEntry[]>();
    for (const e of log) {
      const l = steps.get(e.s) ?? [];
      l.push(e);
      steps.set(e.s, l);
    }
    for (const entries of steps.values()) {
      if (!entries.some((e) => e.k === 'p')) continue;
      const helped = entries.some((e) => e.k === 'h');
      const used = entries.filter((e) => e.l && !e.e).flatMap((e) => skillsInLine(e.l));
      if (used.length) recordSuccess(skills, used, mission, helped, day);
    }
  }
}

/** Riassunto per modulo: quante competenze per stato. */
export function moduleSummary(ctx: SkillContext): { id: string; name: string; core: boolean; counts: number[]; skills: { id: string; state: StateIndex }[] }[] {
  return MODULES.map((m) => {
    const skills = m.skills.filter((s) => MANPAGES[s]).map((s) => ({ id: s, state: stateOf(ctx, s) }));
    const counts = [0, 0, 0, 0, 0, 0];
    for (const s of skills) counts[s.state]++;
    return { id: m.id, name: m.name, core: m.core, counts, skills };
  });
}
