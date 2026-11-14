// Aiuti che diminuiscono: all'inizio i suggerimenti sono sempre a portata di mano,
// poi si sbloccano solo dopo un tentativo, infine si chiedono consapevolmente.
// Lo scopo è arrivare al lavoro vero, dove nessuno ti suggerisce il comando.

export type HintPolicy = 'libero' | 'dopo-tentativo' | 'su-richiesta';

const FREE = new Set(['ch01', 'chF', 'ch02', 'ch03']);
const AFTER_TRY = new Set(['ch04', 'ch05', 'ch06', 'chPY', 'ch07']);

export function hintPolicy(chapterId: string): HintPolicy {
  return FREE.has(chapterId) ? 'libero' : AFTER_TRY.has(chapterId) ? 'dopo-tentativo' : 'su-richiesta';
}

/** Tentativi dopo cui un esercizio "senza suggerimenti" li concede comunque, per non restare bloccati. */
export const NO_HINTS_UNLOCK = 4;

export interface HintGate {
  /** il suggerimento si può vedere adesso */
  ok: boolean;
  /** serve una conferma (fase "su richiesta", primo suggerimento del passo) */
  confirm: boolean;
  /** perché non si può, in parole semplici */
  reason?: string;
}

export function hintGate(policy: HintPolicy, o: { tries: number; level: number; armed: boolean; noHints?: boolean }): HintGate {
  if (o.level > 0) return { ok: true, confirm: false };
  if (o.noHints && o.tries < NO_HINTS_UNLOCK)
    return { ok: false, confirm: false, reason: `Esercizio senza suggerimenti: prova da solo. Se dopo ${NO_HINTS_UNLOCK} tentativi sei ancora fermo, si sbloccano (ancora ${NO_HINTS_UNLOCK - o.tries}).` };
  if (policy === 'dopo-tentativo' && o.tries < 1)
    return { ok: false, confirm: false, reason: 'Prima prova un comando, anche se non sei sicuro: il suggerimento si sblocca dopo il primo tentativo. Sbagliare qui non costa nulla.' };
  if (policy === 'su-richiesta' && !o.armed) return { ok: true, confirm: true };
  return { ok: true, confirm: false };
}

export const POLICY_NOTE: Record<HintPolicy, string> = {
  libero: '',
  'dopo-tentativo': 'Da questo capitolo il suggerimento si sblocca dopo il primo tentativo.',
  'su-richiesta': 'Da questo capitolo i suggerimenti si chiedono solo se servono davvero: un passo risolto da solo vale per la competenza "acquisita".',
};

export const CONFIRM_TEXT = 'Sicuro? Rileggi l\'obiettivo e prova ancora: un passo risolto senza suggerimenti conta per rendere la competenza "acquisita". Tocca di nuovo per vedere il suggerimento.';
