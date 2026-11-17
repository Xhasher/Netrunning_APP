import type { Shell } from '../engine/shell';
import type { ShellEvent } from '../engine/types';
import type { Step } from './types';

export type StepOutcome = 'pass' | 'wrong-answer' | 'no-question' | null;

export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

const NUMBER_WORDS = ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'undici', 'dodici'];

/** Le forme in cui una persona può scrivere la stessa risposta: "la cassa", "3.", "evento 3", "tre". */
function answerVariants(s: string): string[] {
  const out = new Set<string>();
  let v = normalizeAnswer(s);
  out.add(v);
  v = v.replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, '').trim();
  out.add(v);
  v = v.replace(/[.,;:!]+$/, '').trim();
  out.add(v);
  // articoli e parole di contorno davanti alla risposta
  for (let i = 0; i < 3; i++) {
    const w = v.replace(/^(il|lo|la|i|gli|le|un|una|uno|e|numero|n\.|evento|riga|punto|segnalazione|porta|utente|file|allarme)\s+|^l'\s*/, '');
    if (w === v || !w) break;
    v = w;
    out.add(v);
  }
  const n = NUMBER_WORDS.indexOf(v);
  if (n >= 0) out.add(String(n));
  return [...out].filter(Boolean);
}

/** Confronto tollerante tra la risposta data e quelle accettate: prima esatto, poi nelle forme equivalenti. */
export function answerMatches(given: string, accepted: string[]): boolean {
  const ok = new Set(accepted.map(normalizeAnswer));
  return answerVariants(given).some((v) => ok.has(v));
}

/** Valuta gli eventi prodotti da un comando rispetto al passo attuale della missione. */
export function evaluate(step: Step | undefined, events: ShellEvent[], sh: Shell): StepOutcome {
  let outcome: StepOutcome = null;
  for (const ev of events) {
    if (ev.type === 'answer') {
      if (!step || step.kind !== 'task' || !step.answer) {
        outcome = outcome ?? 'no-question';
        continue;
      }
      if (answerMatches(ev.value, step.answer)) return 'pass';
      outcome = 'wrong-answer';
      continue;
    }
    if (step?.kind === 'task' && step.check?.(ev, sh)) return 'pass';
  }
  // obiettivi basati sullo stato: dopo qualsiasi comando, controlla se il lavoro risulta fatto
  if (outcome === null && step?.kind === 'task' && step.state && events.length && stateOk(step, sh)) return 'pass';
  return outcome;
}

export function stateOk(step: Step | undefined, sh: Shell): boolean {
  if (step?.kind !== 'task' || !step.state) return false;
  try {
    return step.state(sh);
  } catch {
    return false;
  }
}
