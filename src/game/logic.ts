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

/** Valuta gli eventi prodotti da un comando rispetto al passo attuale della missione. */
export function evaluate(step: Step | undefined, events: ShellEvent[], sh: Shell): StepOutcome {
  let outcome: StepOutcome = null;
  for (const ev of events) {
    if (ev.type === 'answer') {
      if (!step || step.kind !== 'task' || !step.answer) {
        outcome = outcome ?? 'no-question';
        continue;
      }
      const given = normalizeAnswer(ev.value);
      if (step.answer.some((a) => normalizeAnswer(a) === given)) return 'pass';
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
