import type { Shell } from '../engine/shell';
import type { ShellEvent } from '../engine/types';

/**
 * Formato dei testi delle lezioni (mini-markdown):
 * - riga vuota = nuovo paragrafo
 * - "- " = elenco puntato
 * - ``` ... ``` = blocco di codice/terminale
 * - `codice` e **grassetto** dentro il testo
 * - "@nyx: testo" = battuta di un personaggio (nyx, rook)
 * - "!! testo" = riquadro di attenzione
 * - "?? testo" = riquadro "lo sapevi?"
 */
export type Markup = string;

export interface LessonStep {
  kind: 'lesson';
  title: string;
  body: Markup;
}

export interface TaskStep {
  kind: 'task';
  title: string;
  body: Markup;
  /** cosa fare, in una riga */
  objective: string;
  /** suggerimenti progressivi: il primo è vago, l'ultimo dà la soluzione */
  hints: string[];
  /** controllo sugli eventi della shell */
  check?: (ev: ShellEvent, sh: Shell) => boolean;
  /** in alternativa: risposte accettate con il comando flag (maiuscole ignorate) */
  answer?: string[];
  /** spiegazione mostrata quando l'obiettivo è raggiunto */
  success: Markup;
}

export interface QuizStep {
  kind: 'quiz';
  title: string;
  question: Markup;
  options: string[];
  correct: number;
  explain: Markup;
}

export type Step = LessonStep | TaskStep | QuizStep;

export interface Mission {
  id: string;
  title: string;
  tagline: string;
  xp: number;
  steps: Step[];
  /** riepilogo finale: comando/concetto → spiegazione */
  recap: [string, string][];
}

export interface Chapter {
  id: string;
  code: string; // es. "01"
  title: string;
  subtitle: string;
  missions: Mission[];
}

/** Capitolo futuro, mostrato nella mappa come "in arrivo". */
export interface PlannedChapter {
  code: string;
  title: string;
  subtitle: string;
  topics: string[];
}
