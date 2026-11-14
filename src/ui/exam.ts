// Esami simulati: elenco, esame teorico a tempo, risultati.

import { allMissions } from '../content';
import { today } from '../game/cards';
import { EXAMS, buildExam, chapterName, examPool, grade, type ExamKind, type ExamRecord } from '../game/exam';
import type { SaveData } from '../game/state';
import { inline, renderMarkup } from './markup';

export interface ExamHost {
  save: SaveData;
  persist(): void;
  home(): void;
  map(): void;
  startPractical(): void;
  /** registra un timer da fermare quando si cambia schermata */
  timer(id: number): void;
  enter(): void;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const mmss = (secs: number) => `${String(Math.floor(Math.max(0, secs) / 60)).padStart(2, '0')}:${String(Math.max(0, secs) % 60).padStart(2, '0')}`;

export function recordExam(save: SaveData, r: ExamRecord): void {
  save.exams.push(r);
  if (save.exams.length > 30) save.exams.splice(0, save.exams.length - 30);
}

function historyHtml(save: SaveData, kind: ExamKind): string {
  const list = save.exams.filter((e) => e.kind === kind);
  if (!list.length) return '<span class="ex-none">mai tentato</span>';
  const best = Math.max(...list.map((e) => e.pct));
  const last = list.slice(-5);
  return `<span class="ex-best">record ${best}%</span>${last.map((e) => `<span class="ex-chip ${e.passed ? 'ok' : 'ko'}">${e.pct}%</span>`).join('')}`;
}

export function renderExamsHome(box: HTMLElement, host: ExamHost): void {
  const { save } = host;
  const done = save.completed.length;
  const total = allMissions().length;
  const pool = examPool(save.completed, save.known, true).length;
  const finals = save.exams.filter((e) => e.kind === 'finale').slice(-3);
  const ready = finals.length === 3 && finals.every((e) => e.passed);
  const card = (k: ExamKind, enabled: boolean, note: string) => {
    const e = EXAMS[k];
    return `
      <button class="opcard exam-card ${enabled ? '' : 'locked'}" data-exam="${k}" ${enabled ? '' : 'disabled'}>
        <span class="op-top"><span class="op-code">${k === 'pratico' ? `${e.count} SFIDE` : `${e.count} DOMANDE`} · ${e.minutes} MIN · SOGLIA ${e.pass}%</span></span>
        <span class="op-title">${e.title}</span>
        <span class="op-client">${e.blurb}${note ? ` <em>${note}</em>` : ''}</span>
        <span class="ex-hist">${historyHtml(save, k)}</span>
      </button>`;
  };
  box.innerHTML = `
    <div class="prose exam-intro">${renderMarkup(`@rook: I clienti non ti chiedono quanto hai studiato. Ti chiedono se sai fare il lavoro, sotto pressione e con l'orologio che corre. Gli esami servono a scoprirlo prima di loro.`)}</div>
    ${ready ? '<div class="success exam-ready"><p><strong>Hai superato gli ultimi tre esami finali.</strong> Le basi teoriche per un colloquio da junior ci sono: è il momento di allenarti su laboratori veri e di preparare una certificazione d\'ingresso (sezione Carriera).</p></div>' : ''}
    <div class="oplist">
      ${card('parziale', pool >= 20, pool >= 20 ? '' : 'Completa qualche missione in più per sbloccarlo.')}
      ${card('pratico', save.completed.some((m) => m.startsWith('ch01')), '')}
      ${card('finale', true, done < total ? `Hai completato ${done} missioni su ${total}: ci saranno argomenti che non hai ancora studiato.` : '')}
    </div>
    <details class="mem-how">
      <summary>Come funzionano</summary>
      <div class="prose">
        <p>Le domande arrivano dai quiz delle missioni, da una banca di scenari in stile certificazione e dalle carte di Memoria, bilanciate tra i capitoli. Ogni esame è diverso.</p>
        <p>Durante l'esame <strong>non vedi se la risposta è giusta</strong>: puoi tornare indietro, cambiare idea e segnare le domande da rivedere. Alla consegna (o allo scadere del tempo) vedi il punteggio, il dettaglio per capitolo e la spiegazione di ogni errore.</p>
        <p>Una regola delle certificazioni vere: se non sai una risposta, segnala e vai avanti. Il tempo perso su una domanda difficile manca a tre facili.</p>
      </div>
    </details>`;
  box.onclick = (e) => {
    const k = (e.target as HTMLElement).closest<HTMLElement>('[data-exam]')?.dataset.exam as ExamKind | undefined;
    if (!k) return;
    if (k === 'pratico') host.startPractical();
    else runTheory(box, host, k);
  };
}

function runTheory(box: HTMLElement, host: ExamHost, kind: ExamKind): void {
  const { save } = host;
  const spec = EXAMS[kind];
  const qs = buildExam(examPool(save.completed, save.known, kind === 'parziale'), spec.count);
  const answers: (number | null)[] = qs.map(() => null);
  const flagged = new Set<number>();
  let cur = 0;
  const started = Date.now();
  const deadline = started + spec.minutes * 60_000;
  let over = false;
  host.enter();

  const left = () => Math.round((deadline - Date.now()) / 1000);
  const tick = () => {
    const el = box.querySelector<HTMLElement>('.ex-timer');
    const s = left();
    if (el) {
      el.textContent = `⏱ ${mmss(s)}`;
      el.classList.toggle('low', s <= 300);
    }
    if (s <= 0 && !over) finish(true);
  };
  const timer = window.setInterval(tick, 1000);
  host.timer(timer);

  const render = () => {
    const q = qs[cur];
    const answered = answers.filter((a) => a !== null).length;
    box.innerHTML = `
      <div class="ex-bar">
        <span class="ex-timer">⏱ ${mmss(left())}</span>
        <span>${answered}/${qs.length} risposte</span>
        <button class="ghost ex-submit" data-x="submit">Consegna</button>
      </div>
      <div class="ex-grid">${qs.map((_, i) => `<button class="ex-n ${i === cur ? 'cur' : ''} ${answers[i] !== null ? 'done' : ''} ${flagged.has(i) ? 'flag' : ''}" data-go="${i}">${i + 1}</button>`).join('')}</div>
      <div class="train-head"><span>Domanda ${cur + 1}/${qs.length}</span><span>${esc(chapterName(q.chapter))}</span></div>
      <div class="question">${renderMarkup(q.question)}</div>
      <div class="options">
        ${q.options.map((o, i) => `<button class="opt ${answers[cur] === i ? 'picked' : ''}" data-o="${i}"><span class="opt-key">${'ABCDEFG'[i]}</span><span>${q.code ? `<code>${esc(o)}</code>` : inline(o)}</span></button>`).join('')}
      </div>
      <div class="step-actions ex-nav">
        <button class="ghost" data-x="prev" ${cur === 0 ? 'disabled' : ''}>◂</button>
        <button class="ghost ${flagged.has(cur) ? 'on' : ''}" data-x="flag">${flagged.has(cur) ? '★ Segnata' : '☆ Rivedi dopo'}</button>
        ${cur < qs.length - 1 ? '<button class="next" data-x="next">Avanti ▸</button>' : '<button class="next" data-x="submit">Consegna ▸</button>'}
      </div>`;
    box.scrollIntoView({ block: 'start' });
  };

  const finish = (timeUp: boolean) => {
    over = true;
    window.clearInterval(timer);
    const r = grade(qs, answers, spec.pass);
    const secs = Math.min(spec.minutes * 60, Math.round((Date.now() - started) / 1000));
    recordExam(save, { kind, day: today(), score: r.score, total: r.total, pct: r.pct, passed: r.passed, secs });
    const xp = r.passed ? (kind === 'finale' ? 120 : 60) : 0;
    save.xp += xp;
    host.persist();
    const weak = r.byChapter.filter(([, ok, tot]) => tot >= 2 && ok / tot < 0.7);
    const wrong = qs.map((q, i) => ({ q, i })).filter(({ q, i }) => answers[i] !== q.correct);
    box.onclick = null;
    box.innerHTML = `
      <div class="train-end exam-end">
        <div class="kicker">${timeUp ? '// tempo scaduto' : '// esame consegnato'}</div>
        <div class="ex-verdict ${r.passed ? 'ok' : 'ko'}">${r.passed ? 'SUPERATO' : 'NON SUPERATO'}</div>
        <div class="xp-gain">${r.pct}%</div>
        <p>${r.score}/${r.total} giuste · soglia ${spec.pass}% · tempo ${mmss(secs)} su ${spec.minutes}:00 · +${xp} XP</p>
      </div>
      <h3 class="coach-h">Per capitolo</h3>
      <ul class="mem-decks ex-areas">
        ${r.byChapter
          .map(([ch, ok, tot]) => `<li class="${tot >= 2 && ok / tot < 0.7 ? 'weak' : ''}"><span class="md-name">${esc(chapterName(ch))}</span><span class="md-n">${ok}/${tot}</span><span class="md-bar"><i style="width:${(ok / tot) * 100}%"></i></span></li>`)
          .join('')}
      </ul>
      ${weak.length ? `<div class="coach-tip"><div class="ct-title">Da ripassare</div><p>${weak.map(([ch]) => esc(chapterName(ch))).join(', ')}. Rileggi le lezioni di questi capitoli e fai qualche sessione di Memoria: le carte su questi argomenti torneranno più spesso se sbagli.</p></div>` : ''}
      ${wrong.length ? `<h3 class="coach-h">Le risposte sbagliate (${wrong.length})</h3>` : ''}
      <div class="ex-review">
        ${wrong
          .map(({ q, i }) => {
            const a = answers[i];
            const fmt = (o: string) => (q.code ? `<code>${esc(o)}</code>` : inline(o));
            return `<details class="ex-wrong"><summary>${i + 1}. ${inline(q.question.split('\n')[0]).slice(0, 400)}</summary>
              <div class="prose">${renderMarkup(q.question)}</div>
              <p class="ex-a ko">La tua: ${a === null ? '<em>nessuna risposta</em>' : fmt(q.options[a])}</p>
              <p class="ex-a ok">Corretta: ${fmt(q.options[q.correct])}</p>
              <div class="prose">${renderMarkup(q.explain)}</div></details>`;
          })
          .join('')}
      </div>
      <div class="step-actions">
        <button class="ghost" data-x="home">Esami</button>
        <button class="next" data-x="again">Un altro ▸</button>
      </div>`;
    box.onclick = (e) => {
      const x = (e.target as HTMLElement).closest<HTMLElement>('[data-x]')?.dataset.x;
      if (x === 'home') host.home();
      if (x === 'again') runTheory(box, host, kind);
    };
    box.scrollIntoView({ block: 'start' });
  };

  box.onclick = (e) => {
    if (over) return;
    const t = e.target as HTMLElement;
    const o = t.closest<HTMLElement>('[data-o]');
    if (o) {
      answers[cur] = Number(o.dataset.o);
      box.querySelectorAll('.opt').forEach((b) => b.classList.toggle('picked', b === o));
      box.querySelector(`.ex-n[data-go="${cur}"]`)?.classList.add('done');
      const cnt = box.querySelector('.ex-bar span:nth-child(2)');
      if (cnt) cnt.textContent = `${answers.filter((a) => a !== null).length}/${qs.length} risposte`;
      return;
    }
    const go = t.closest<HTMLElement>('[data-go]');
    if (go) {
      cur = Number(go.dataset.go);
      return render();
    }
    const x = t.closest<HTMLElement>('[data-x]')?.dataset.x;
    if (x === 'prev' && cur > 0) {
      cur--;
      render();
    } else if (x === 'next' && cur < qs.length - 1) {
      cur++;
      render();
    } else if (x === 'flag') {
      if (flagged.has(cur)) flagged.delete(cur);
      else flagged.add(cur);
      render();
    } else if (x === 'submit') {
      const missing = answers.filter((a) => a === null).length;
      const msg = missing ? `Ci sono ${missing} domande senza risposta${flagged.size ? ` e ${flagged.size} segnate da rivedere` : ''}. Consegnare comunque?` : flagged.size ? `Hai ${flagged.size} domande segnate da rivedere. Consegnare comunque?` : 'Consegnare l\'esame?';
      if (confirm(msg)) finish(false);
    }
  };
  render();
}

