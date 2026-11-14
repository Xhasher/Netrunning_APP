// Palestra della memoria: schermata riassuntiva e sessione di esercizi.

import {
  LEARNED_BOX,
  buildCards,
  buildSession,
  bumpStreak,
  checkTyped,
  exerciseFor,
  liveStreak,
  review,
  stats,
  today,
  type Card,
  type Exercise,
  type SessionItem,
} from '../game/cards';
import type { SaveData } from '../game/state';
import { openManual } from './manual';
import { inline } from './markup';

export interface MemoryHost {
  save: SaveData;
  persist(): void;
  /** torna alla schermata riassuntiva */
  home(): void;
  /** entra nella sessione (serve al tasto indietro) */
  enter(): void;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const days = (n: number) => (n === 1 ? '1 giorno' : `${n} giorni`);

const STAGE = ['Riconosci', 'Riconosci', 'Ricomponi', 'Scrivi', 'Scrivi', 'Scrivi', 'Scrivi'];

export function dueCount(save: SaveData): number {
  return stats(buildCards(save.completed, save.known), save.srs, today()).due;
}

/** Schermata riassuntiva: serie, carte in scadenza, progressi per argomento. */
export function renderMemoryHome(box: HTMLElement, host: MemoryHost): void {
  const { save } = host;
  const day = today();
  const cards = buildCards(save.completed, save.known);
  if (cards.length === 0) {
    box.innerHTML = `<p class="empty">Qui alleni la memoria con esercizi brevi: scegliere l'opzione giusta, ricomporre un comando, scriverlo senza aiuti. Le carte arrivano man mano che avanzi nel corso: completa la prima missione per sbloccare le prime.</p>`;
    return;
  }
  const st = stats(cards, save.srs, day);
  const streak = liveStreak(save.streak, day);
  const doneToday = save.streak.day === day;
  const plan = buildSession(cards, save.srs, day);
  const early = plan.length > 0 && plan.every((i) => i.early);

  const byDeck = new Map<string, { total: number; learned: number; seen: number }>();
  for (const c of cards) {
    const d = byDeck.get(c.deck) ?? { total: 0, learned: 0, seen: 0 };
    d.total++;
    const s = save.srs[c.id];
    if (s) d.seen++;
    if (s && s[0] >= LEARNED_BOX) d.learned++;
    byDeck.set(c.deck, d);
  }

  box.innerHTML = `
    <div class="mem-top">
      <div class="mem-streak ${doneToday ? 'on' : ''}">
        <span class="mem-num">${streak}</span>
        <span class="mem-lab">${streak === 1 ? 'giorno di fila' : 'giorni di fila'}</span>
        <span class="mem-sub">${doneToday ? 'allenamento di oggi fatto' : streak > 0 ? 'allenati oggi per non perdere la serie' : 'inizia oggi la tua serie'} · record ${save.streak.best}</span>
      </div>
      <div class="mem-stats">
        <div><b>${st.due}</b><span>da ripassare</span></div>
        <div><b>${st.fresh}</b><span>nuove</span></div>
        <div><b>${st.learned}</b><span>imparate</span></div>
      </div>
    </div>
    <button class="continue mem-go" data-m="start">
      <span class="c-kicker">${early ? 'RIPASSO ANTICIPATO' : doneToday ? 'UN\'ALTRA SESSIONE' : 'ALLENAMENTO DI OGGI'} · ${plan.length} ESERCIZI · 3-5 MINUTI</span>
      <span class="c-title">${early ? 'Nessuna carta in scadenza: ripassa le più deboli' : 'Inizia ▸'}</span>
      <span class="c-tag">${early ? 'Le carte torneranno da sole nel giorno giusto. Un ripasso in più non fa male.' : 'Prima le carte che stai per dimenticare, poi qualche carta nuova.'}</span>
    </button>
    <h3 class="mem-h">Argomenti</h3>
    <ul class="mem-decks">
      ${[...byDeck]
        .map(
          ([name, d]) => `<li>
            <span class="md-name">${esc(name)}</span>
            <span class="md-n">${d.learned}/${d.total}</span>
            <span class="md-bar"><i class="seen" style="width:${(d.seen / d.total) * 100}%"></i><i style="width:${(d.learned / d.total) * 100}%"></i></span>
          </li>`,
        )
        .join('')}
    </ul>
    <details class="mem-how">
      <summary>Come funziona (e perché funziona)</summary>
      <div class="prose">
        <p><strong>Ricordare è un esercizio, non una lettura.</strong> Rileggere dà l'illusione di sapere; sforzarsi di tirare fuori la risposta dalla testa è ciò che la fissa davvero.</p>
        <p><strong>Ripetizione spaziata.</strong> Ogni carta torna poco prima che tu la dimentichi: dopo 1 giorno, poi 3, 7, 16, 35, 80. Se sbagli torna subito e riparte da più vicino. Così studi solo quello che serve.</p>
        <p><strong>Difficoltà che cresce.</strong> La stessa carta prima ti chiede di <em>riconoscere</em> la risposta tra alcune scelte, poi di <em>ricomporre</em> il comando con i pezzi, infine di <em>scriverlo</em> a mano senza aiuti.</p>
        <p><strong>Poco, ma ogni giorno.</strong> Cinque minuti al giorno valgono più di un'ora la domenica. La serie di giorni serve a questo.</p>
        <p>Una carta è "imparata" quando l'hai ricordata abbastanza volte da non rivederla per almeno una settimana.</p>
      </div>
    </details>`;

  box.onclick = (e) => {
    if ((e.target as HTMLElement).closest('[data-m="start"]')) runSession(box, host, cards, plan);
  };
}

function runSession(box: HTMLElement, host: MemoryHost, cards: Card[], plan: SessionItem[]): void {
  const { save } = host;
  const day = today();
  host.enter();
  const queue: { item: SessionItem; retry: number }[] = plan.map((item) => ({ item, retry: 0 }));
  const total = plan.length;
  let pos = 0;
  let firstTry = 0;
  let xp = 0;
  let ex: Exercise | null = null;
  let answered = false;
  let built: number[] = [];

  const finish = () => {
    const before = save.streak;
    save.streak = bumpStreak(save.streak, day);
    const bonus = before.day === day ? 5 : 15;
    xp += bonus;
    save.xp += bonus;
    host.persist();
    const st = stats(cards, save.srs, day);
    const tomorrow = cards.filter((c) => save.srs[c.id] && save.srs[c.id][1] === day + 1).length;
    box.onclick = null;
    box.innerHTML = `
      <div class="train-end">
        <div class="xp-gain">+${xp} XP</div>
        <p><strong>${firstTry}/${total}</strong> al primo colpo${firstTry === total ? '. Perfetto.' : '. Le carte sbagliate torneranno presto.'}</p>
        <p class="mem-endline">Serie: <strong>${days(save.streak.count)}</strong> · imparate: <strong>${st.learned}</strong> · domani ne tornano <strong>${tomorrow}</strong></p>
        <div class="step-actions">
          <button class="ghost" data-m="home">Fine</button>
          <button class="next" data-m="again">Ancora ▸</button>
        </div>
      </div>`;
    box.onclick = (e) => {
      const m = (e.target as HTMLElement).closest<HTMLElement>('[data-m]')?.dataset.m;
      if (m === 'home') host.home();
      if (m === 'again') {
        const next = buildSession(buildCards(save.completed, save.known), save.srs, today());
        if (next.length) runSession(box, host, cards, next);
        else host.home();
      }
    };
  };

  const render = () => {
    if (pos >= queue.length) return finish();
    const { item, retry } = queue[pos];
    // al secondo tentativo si torna a un esercizio più facile
    ex = exerciseFor(item.card, retry ? Math.min(item.box, 1) : item.box);
    answered = false;
    built = [];
    const head = `
      <div class="mem-prog"><i style="width:${(Math.min(pos, total) / total) * 100}%"></i></div>
      <div class="train-head"><span>${esc(item.card.deck)}</span><span>${retry ? 'RIPROVA' : item.isNew ? 'NUOVA' : STAGE[item.box].toUpperCase()}</span></div>
      <div class="question mem-q"><p>${inline(ex.prompt)}</p></div>`;
    let body = '';
    if (ex.type === 'choice') {
      const code = ex.optionsCode;
      body = `${ex.code ? `<pre class="mem-code">${esc(ex.code)}</pre>` : ''}
        <div class="options ${code ? 'mem-grid' : ''}">
          ${ex.options.map((o, i) => `<button class="opt ${code ? 'mem-codeopt' : ''}" data-o="${i}"><span>${code ? `<code>${esc(o)}</code>` : esc(o)}</span></button>`).join('')}
        </div>`;
    } else if (ex.type === 'build') {
      body = `<div class="mem-line" data-m="line"></div>
        <div class="mem-bank">${ex.tokens.map((t, i) => `<button class="chip" data-k="${i}">${esc(t)}</button>`).join('')}</div>
        <div class="step-actions"><button class="next" data-m="check" disabled>Verifica</button></div>`;
    } else {
      body = `<input class="mem-input ${ex.code ? 'code' : ''}" type="text" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="${ex.code ? 'scrivi qui' : 'la tua risposta'}" />
        <div class="step-actions"><button class="ghost" data-m="dunno">Non lo ricordo</button><button class="next" data-m="check">Verifica</button></div>`;
    }
    box.innerHTML = `${head}${body}<div class="train-explain"></div>`;
    const input = box.querySelector<HTMLInputElement>('.mem-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitTyped();
      });
      if (window.matchMedia?.('(pointer: fine)').matches) input.focus();
    }
    box.scrollIntoView({ block: 'start' });
  };

  const drawLine = () => {
    if (ex?.type !== 'build') return;
    const tokens = ex.tokens;
    const line = box.querySelector<HTMLElement>('[data-m="line"]')!;
    line.innerHTML = built.map((k) => `<button class="chip on" data-u="${k}">${esc(tokens[k])}</button>`).join('');
    box.querySelectorAll<HTMLButtonElement>('.mem-bank .chip').forEach((b) => b.classList.toggle('used', built.includes(Number(b.dataset.k))));
    box.querySelector<HTMLButtonElement>('[data-m="check"]')!.disabled = built.length === 0;
  };

  /** Registra l'esito e mostra la spiegazione. */
  const settle = (ok: boolean, given?: string) => {
    const cur = queue[pos];
    const card = cur.item.card;
    answered = true;
    if (cur.retry === 0) {
      review(save.srs, card.id, ok, day, cur.item.early);
      if (ok) {
        firstTry++;
        xp += 2;
        save.xp += 2;
      }
      host.persist();
    }
    if (!ok && cur.retry < 2) queue.push({ item: cur.item, retry: cur.retry + 1 });
    box.querySelectorAll<HTMLButtonElement>('.opt, .chip, [data-m="check"], [data-m="dunno"]').forEach((b) => (b.disabled = true));
    const input = box.querySelector<HTMLInputElement>('.mem-input');
    if (input) input.disabled = true;
    const sol = card.code ? `<pre class="mem-code">${esc(card.answer)}</pre>` : `<p class="mem-sol">${esc(card.answer)}</p>`;
    const note = card.note ? `<p>${inline(card.note)}</p>` : '';
    const man = card.cmd ?? (card.kind === 'cmd' ? card.answer : null);
    box.querySelector('.train-explain')!.innerHTML = `
      <div class="${ok ? 'success' : 'feedback wrong'}">
        <p>${ok ? 'Giusto.' : 'Non ancora.'}${!ok && given ? ` Hai scritto: <code>${esc(given)}</code>` : ''}</p>
        ${ok && ex?.type === 'choice' && !card.note ? '' : `${ok ? '' : '<p>Risposta corretta:</p>'}${ok && ex?.type !== 'type' ? '' : sol}${note}`}
        ${card.kind === 'opt' && card.desc ? `<p><code>${esc(card.cmd!)} ${esc(card.answer)}</code>: ${inline(card.desc)}</p>` : ''}
      </div>
      <div class="step-actions">
        ${man ? `<button class="ghost" data-m="man" data-cmd="${esc(man)}">Manuale: ${esc(man)}</button>` : ''}
        <button class="next" data-m="next">${pos + 1 < queue.length ? 'Avanti ▸' : 'Risultato ▸'}</button>
      </div>`;
    box.querySelector('.train-explain')!.scrollIntoView({ block: 'nearest' });
  };

  /** Risposta scritta diversa da quella attesa ma forse equivalente: decide il giocatore. */
  const selfGrade = (given: string) => {
    answered = true;
    const card = queue[pos].item.card;
    box.querySelectorAll<HTMLButtonElement>('[data-m="check"], [data-m="dunno"]').forEach((b) => (b.disabled = true));
    box.querySelector<HTMLInputElement>('.mem-input')!.disabled = true;
    box.querySelector('.train-explain')!.innerHTML = `
      <div class="feedback mem-self">
        <p>Non coincide con la soluzione attesa. Un comando si può scrivere in più modi: confronta e giudica tu, con onestà.</p>
        <p class="mem-k">LA TUA</p><pre class="mem-code">${esc(given)}</pre>
        <p class="mem-k">ATTESA</p><pre class="mem-code">${esc(card.answer)}</pre>
      </div>
      <div class="step-actions">
        <button class="ghost" data-m="self-no">Era sbagliata</button>
        <button class="next" data-m="self-ok">Era equivalente</button>
      </div>`;
    box.querySelector('.train-explain')!.scrollIntoView({ block: 'nearest' });
  };

  const submitTyped = () => {
    if (answered || ex?.type !== 'type') return;
    const given = box.querySelector<HTMLInputElement>('.mem-input')!.value.trim();
    if (!given) return;
    if (checkTyped(ex, given)) settle(true);
    else if (ex.lenient) selfGrade(given);
    else settle(false, given);
  };

  box.onclick = (e) => {
    const t = e.target as HTMLElement;
    const m = t.closest<HTMLElement>('[data-m]')?.dataset.m;
    if (m === 'man') return openManual(t.closest<HTMLElement>('[data-cmd]')!.dataset.cmd);
    if (m === 'next') {
      pos++;
      return render();
    }
    if (m === 'self-ok') return settle(true);
    if (m === 'self-no') return settle(false);
    if (answered || !ex) return;
    if (ex.type === 'choice') {
      const o = t.closest<HTMLElement>('[data-o]');
      if (!o) return;
      const chosen = Number(o.dataset.o);
      const correct = ex.correct;
      box.querySelectorAll<HTMLButtonElement>('.opt').forEach((b) => {
        const v = Number(b.dataset.o);
        if (v === correct) b.classList.add('right');
        else if (v === chosen) b.classList.add('wrong');
      });
      return settle(chosen === correct);
    }
    if (ex.type === 'build') {
      const add = t.closest<HTMLElement>('[data-k]');
      const del = t.closest<HTMLElement>('[data-u]');
      if (add && !built.includes(Number(add.dataset.k))) built.push(Number(add.dataset.k));
      else if (del) built = built.filter((k) => k !== Number(del.dataset.u));
      else if (m === 'check') {
        const tokens = ex.tokens;
        const given = built.map((k) => tokens[k]).join(' ');
        return settle(given === ex.answer.join(' '), given);
      }
      return drawLine();
    }
    if (m === 'check') return submitTyped();
    if (m === 'dunno') return settle(false);
  };

  render();
}
