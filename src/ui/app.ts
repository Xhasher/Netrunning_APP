import { CAREER, CHAPTERS, PLANNED, allMissions, findMission } from '../content';
import { GAMES } from '../content/games';
import { OPERATIONS, matchFinding, type Operation } from '../content/operations';
import { buildWorld } from '../content/world';
import type { Shell } from '../engine/shell';
import type { ShellEvent } from '../engine/types';
import { evaluate } from '../game/logic';
import {
  clearSave,
  isUnlocked,
  loadSave,
  nextMissionId,
  rankFor,
  validHandle,
  writeSave,
  type SaveData,
} from '../game/state';
import type { Chapter, Mission, QuizStep, Step } from '../game/types';
import { inline, renderMarkup } from './markup';
import { TerminalView } from './terminal';

interface MissionRun {
  chapter: Chapter;
  mission: Mission;
  index: number; // posizione della missione nel capitolo
  step: number; // passo mostrato
  reached: number; // passo più avanzato raggiunto
  done: boolean; // il passo mostrato è completato?
  hintLevel: number;
  quizPicked: number | null;
  minimized: boolean;
}

const html = String.raw;

function el<T extends HTMLElement = HTMLElement>(markup: string): T {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild as T;
}

const finePointer = () => window.matchMedia?.('(pointer: fine)').matches ?? false;

export class App {
  private save: SaveData = loadSave();
  private shell: Shell | null = null;
  private term: TerminalView | null = null;
  private run: MissionRun | null = null;
  private op: {
    op: Operation;
    found: Set<string>;
    hints: Record<string, number>;
    term: TerminalView;
    minimized: boolean;
  } | null = null;
  private screen = 'title';

  constructor(private root: HTMLElement) {
    this.applyFont();
  }

  start(): void {
    this.showTitle();
  }

  /** Tasto "indietro" di Android. */
  back(): boolean {
    switch (this.screen) {
      case 'title':
        return false;
      case 'map':
      case 'handle':
        this.showTitle();
        return true;
      case 'operation':
      case 'op-done':
        this.showOps();
        return true;
      case 'train':
      case 'game':
        this.showGames();
        return true;
      default:
        this.showMap();
        return true;
    }
  }

  // ------------------------------------------------------------- util

  private persist(): void {
    writeSave(this.save);
  }

  private applyFont(): void {
    document.documentElement.style.setProperty('--scale', String(this.save.fontScale));
  }

  private mount(screen: string, node: HTMLElement): void {
    this.screen = screen;
    this.root.replaceChildren(node);
    this.root.scrollTop = 0;
  }

  private ensureShell(): Shell {
    if (!this.shell) {
      this.shell = buildWorld(this.save.handle!, () => this.nextHint());
      this.term = new TerminalView(this.shell, (ev) => this.onShellEvents(ev));
      this.term.system('NightOS 2077 · deck di addestramento', 'banner');
      this.term.system('Tutto ciò che accade qui è simulato. Scrivi "help" per i comandi.', 'info');
    }
    return this.shell;
  }

  // ------------------------------------------------------------- title

  private showTitle(): void {
    const node = el(html`
      <div class="screen title">
        <video class="bg" autoplay muted loop playsinline preload="auto" src="nightcity-bg.webm"></video>
        <div class="bg-shade"></div>
        <div class="title-inner">
          <div class="kicker">// corso di ethical hacking</div>
          <h1 class="logo" aria-label="Night City Netrunning">
            <span class="l1" data-text="NIGHT CITY">NIGHT CITY</span>
            <span class="l2">NETRUNNING</span>
          </h1>
          <p class="tagline">Impara il penetration testing e la cyber defense partendo da zero, un comando alla volta.</p>
          <button class="cta" type="button">${this.save.handle ? 'CONTINUA' : 'JACK IN'}</button>
          ${this.save.handle ? `<div class="whoami">collegato come <b>${this.save.handle}</b></div>` : ''}
          <p class="disclaimer">Ogni sistema nel gioco è simulato. Usa ciò che impari solo dove hai un'autorizzazione esplicita.</p>
        </div>
      </div>`);
    node.querySelector('.cta')!.addEventListener('click', () => (this.save.handle ? this.showMap() : this.showHandle()));
    const video = node.querySelector('video')!;
    video.addEventListener('error', () => video.remove());
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) video.removeAttribute('autoplay');
    this.mount('title', node);
  }

  private showHandle(): void {
    const node = el(html`
      <div class="screen handle">
        <div class="panel">
          <div class="kicker">// registrazione runner</div>
          <h2>Scegli il tuo nome in codice</h2>
          <p>Ogni runner di Night City ha un <b>handle</b>, un soprannome. Sarà anche il tuo <b>nome utente</b> nel computer Linux del gioco.</p>
          <p class="small">Linux ha regole precise per i nomi utente: solo lettere <b>minuscole</b>, numeri, <code>-</code> e <code>_</code>, deve iniziare con una lettera, da 2 a 16 caratteri.</p>
          <form class="handle-form" autocomplete="off">
            <input name="h" maxlength="16" placeholder="es. edge" autocapitalize="off" autocorrect="off" spellcheck="false" />
            <div class="err" aria-live="polite"></div>
            <button class="cta" type="submit">CONFERMA</button>
          </form>
        </div>
      </div>`);
    const form = node.querySelector('form')!;
    const input = form.querySelector('input')!;
    const err = form.querySelector('.err')!;
    input.addEventListener('input', () => (err.textContent = ''));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      const h = raw.toLowerCase();
      if (!validHandle(h)) {
        err.textContent = 'Nome non valido: usa 2-16 caratteri tra a-z, 0-9, - e _, iniziando con una lettera.';
        return;
      }
      this.save.handle = h;
      this.persist();
      this.showMap();
    });
    this.mount('handle', node);
    setTimeout(() => input.focus(), 50);
  }

  // ------------------------------------------------------------- mappa

  private showMap(): void {
    this.run = null;
    const s = this.save;
    const rank = rankFor(s.xp);
    const pct = rank.next ? Math.round(((s.xp - rank.floor) / (rank.next - rank.floor)) * 100) : 100;
    const next = nextMissionId(s);
    const nextInfo = next ? findMission(next) : null;
    const total = allMissions().length;

    const node = el(html`
      <div class="screen map">
        <header class="maphead">
          <button class="iconbtn" data-act="title" aria-label="Schermata iniziale">◂</button>
          <div class="who">
            <div class="handle-name">${s.handle}</div>
            <div class="rank">${rank.name} · ${s.xp} XP</div>
            <div class="xpbar"><span style="width:${pct}%"></span></div>
          </div>
        </header>
        <nav class="mapnav">
          <button data-act="ops">Operazioni</button>
          <button data-act="sandbox">Terminale</button>
          <button data-act="games">Giochi</button>
          <button data-act="codex">Codex</button>
          <button data-act="career">Carriera</button>
          <button data-act="settings">Opzioni</button>
        </nav>
        ${nextInfo
          ? `<button class="continue" data-mission="${nextInfo.mission.id}">
              <span class="c-kicker">${s.completed.length ? 'CONTINUA' : 'INIZIA'} · CAP ${nextInfo.chapter.code}</span>
              <span class="c-title">${nextInfo.mission.title}</span>
              <span class="c-tag">${inline(nextInfo.mission.tagline)}</span>
            </button>`
          : `<div class="continue done"><span class="c-kicker">${s.completed.length}/${total} MISSIONI</span>
              <span class="c-title">Hai completato tutte le missioni disponibili!</span>
              <span class="c-tag">Nuovi capitoli sono in arrivo. Intanto prova i laboratori nella sezione Carriera.</span></div>`}
        <div class="chapters"></div>
      </div>`);

    const list = node.querySelector('.chapters')!;
    for (const ch of CHAPTERS) {
      const doneCount = ch.missions.filter((m) => s.completed.includes(m.id)).length;
      const art = el(html`
        <article class="chapter">
          <div class="ch-head">
            <span class="ch-code">${ch.code}</span>
            <div>
              <h2>${ch.title}</h2>
              <p>${ch.subtitle}</p>
            </div>
            <span class="ch-count">${doneCount}/${ch.missions.length}</span>
          </div>
          <ol class="missions"></ol>
        </article>`);
      const ol = art.querySelector('ol')!;
      ch.missions.forEach((m, i) => {
        const done = s.completed.includes(m.id);
        const open = isUnlocked(s, m.id);
        const state = done ? 'done' : open ? 'open' : 'locked';
        const icon = done ? '✔' : open ? '▶' : '🔒';
        const li = el(html`
          <li>
            <button class="mbtn ${state}" ${open ? '' : 'disabled'} data-mission="${m.id}">
              <span class="m-icon">${icon}</span>
              <span class="m-body">
                <span class="m-title">${ch.code}.${i + 1} ${m.title}</span>
                <span class="m-tag">${inline(m.tagline)}</span>
              </span>
              <span class="m-xp">${m.xp} XP</span>
            </button>
          </li>`);
        ol.appendChild(li);
      });
      list.appendChild(art);
    }
    for (const p of PLANNED) {
      list.appendChild(
        el(html`
          <article class="chapter planned">
            <div class="ch-head">
              <span class="ch-code">${p.code}</span>
              <div>
                <h2>${p.title}</h2>
                <p>${p.subtitle}</p>
              </div>
              <span class="ch-soon">IN ARRIVO</span>
            </div>
            <details>
              <summary>Argomenti</summary>
              <ul>${p.topics.map((t) => `<li>${inline(t)}</li>`).join('')}</ul>
            </details>
          </article>`),
      );
    }

    node.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act],[data-mission]');
      if (!t) return;
      if (t.dataset.mission) this.showMission(t.dataset.mission);
      else if (t.dataset.act === 'codex') this.showCodex();
      else if (t.dataset.act === 'train') this.showTraining();
      else if (t.dataset.act === 'sandbox') this.showSandbox();
      else if (t.dataset.act === 'ops') this.showOps();
      else if (t.dataset.act === 'games') this.showGames();
      else if (t.dataset.act === 'career') this.showCareer();
      else if (t.dataset.act === 'settings') this.showSettings();
      else if (t.dataset.act === 'title') this.showTitle();
    });
    this.mount('map', node);
  }

  // ------------------------------------------------------------- missione

  // ------------------------------------------------------------- operazioni

  private showOps(): void {
    this.op = null;
    const cards = OPERATIONS.map((op) => {
      const done = this.save.ops.includes(op.id);
      const open = this.save.completed.includes(op.requires);
      const req = findMission(op.requires);
      const state = done ? 'done' : open ? 'open' : 'locked';
      return html`
        <button class="opcard ${state}" data-op="${op.id}" ${open ? '' : 'disabled'}>
          <span class="op-top">
            <span class="op-code">${op.code}</span>
            <span class="op-kind ${op.kind}">${op.kind === 'audit' ? 'AUDIT' : 'INCIDENT RESPONSE'}</span>
            <span class="op-xp">${done ? '✔ completata' : `${op.xp} XP`}</span>
          </span>
          <span class="op-title">${op.title}</span>
          <span class="op-client">Cliente: ${op.client}</span>
          ${open ? '' : `<span class="op-lock">🔒 Completa la missione ${req ? `${req.chapter.code}.${req.index + 1} "${req.mission.title}"` : ''} per sbloccarla</span>`}
        </button>`;
    }).join('');
    const node = this.page(
      'ops',
      'Operazioni',
      '// contratti sul campo',
      html`
        <div class="prose"><p>Contratti veri, senza guida passo passo. Ti colleghi ai server del cliente con <code>ssh</code>, indaghi con i comandi che conosci e segnali ogni problema con <code>report</code>. Altri contratti si sbloccano man mano che completi i capitoli.</p></div>
        <div class="oplist">${cards}</div>`,
    );
    node.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).closest<HTMLElement>('[data-op]')?.dataset.op;
      if (id) this.showOperation(id);
    });
  }

  private showOperation(id: string): void {
    const op = OPERATIONS.find((o) => o.id === id);
    if (!op || !this.save.completed.includes(op.requires)) return;
    this.run = null;
    const shell = buildWorld(this.save.handle!, () => this.opHint(true));
    op.setup(shell);
    const term = new TerminalView(shell, (ev) => this.onOpEvents(ev));
    this.op = { op, found: new Set(), hints: {}, term, minimized: false };
    term.system(`── ${op.code} · ${op.title.toUpperCase()} ──`, 'banner');
    term.system(`Cliente: ${op.client}. Ricorda: solo dentro lo scope.`, 'info');
    const node = el(html`
      <div class="screen mission mode-task operation">
        <header class="topbar">
          <button class="iconbtn" data-act="back" aria-label="Torna alle operazioni">◂</button>
          <div class="tb-title">
            <div class="tb-kicker">${op.code} · ${op.kind === 'audit' ? 'AUDIT' : 'INCIDENT RESPONSE'}</div>
            <div class="tb-name">${op.title}</div>
          </div>
          <div class="tb-xp">${this.save.ops.includes(op.id) ? 'REPLAY' : `+${op.xp} XP`}</div>
        </header>
        <div class="stepbar"><span></span></div>
        <section class="lesson"></section>
        <section class="term-area"></section>
      </div>`);
    node.querySelector('.term-area')!.appendChild(term.el);
    node.querySelector('[data-act="back"]')!.addEventListener('click', () => this.showOps());
    this.mount('operation', node);
    this.renderOp();
  }

  private renderOp(scrollToEnd = false): void {
    const o = this.op;
    const screen = this.root.querySelector<HTMLElement>('.screen.operation');
    if (!o || !screen) return;
    const total = o.op.findings.length;
    screen.querySelector<HTMLElement>('.stepbar span')!.style.width = `${(o.found.size / total) * 100}%`;
    screen.classList.toggle('minimized', o.minimized);
    const panel = screen.querySelector<HTMLElement>('.lesson')!;
    const items = o.op.findings
      .map((f, i) => {
        const ok = o.found.has(f.id);
        const shown = f.hints.slice(0, o.hints[f.id] ?? 0);
        return html`
          <li class="finding ${ok ? 'ok' : ''}">
            <span class="f-mark">${ok ? '✔' : i + 1}</span>
            <div class="f-body">
              <div class="f-title">${inline(f.title)}</div>
              ${ok ? `<div class="f-explain">${renderMarkup(f.explain)}</div>` : ''}
              ${!ok && shown.length ? `<ol class="hints">${shown.map((h) => `<li>${inline(h)}</li>`).join('')}</ol>` : ''}
            </div>
          </li>`;
      })
      .join('');
    panel.innerHTML = html`
      <div class="step-head">
        <span class="step-kind k-task">CONTRATTO</span>
        <span class="step-num">${o.found.size}/${total} problemi</span>
        <button class="iconbtn small" data-act="minimize" aria-label="Riduci pannello">${o.minimized ? '▾' : '▴'}</button>
      </div>
      <div class="op-brief">
        ${renderMarkup(o.op.brief)}
        <div class="objective">
          <span class="o-label">SCOPE AUTORIZZATO</span>
          ${o.op.scope.map((sc) => `<span class="o-text">${inline(sc)}</span>`).join('')}
        </div>
      </div>
      <h3 class="op-h">Da segnalare con <code>report</code></h3>
      <ol class="findings">${items}</ol>
      <div class="step-actions">
        <button class="ghost" data-act="hint">Suggerimento</button>
        <button class="ghost" data-act="terminal">Vai al terminale ⌨</button>
      </div>`;
    panel.onclick = (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act === 'hint') {
        this.opHint(false);
        this.renderOp(true);
      } else if (act === 'terminal') {
        o.minimized = true;
        this.renderOp();
        o.term.focus();
      } else if (act === 'minimize') {
        o.minimized = !o.minimized;
        this.renderOp();
      }
    };
    if (scrollToEnd) panel.scrollTo({ top: panel.scrollHeight, behavior: 'smooth' });
  }

  /** Il prossimo suggerimento per il primo problema non ancora trovato. */
  private opHint(fromShell: boolean): string | null {
    const o = this.op;
    if (!o) return null;
    const f = o.op.findings.find((x) => !o.found.has(x.id));
    if (!f) return null;
    const lvl = o.hints[f.id] ?? 0;
    const h = f.hints[Math.min(lvl, f.hints.length - 1)];
    if (lvl < f.hints.length) o.hints[f.id] = lvl + 1;
    if (fromShell) queueMicrotask(() => this.renderOp());
    return `${f.title}: ${h}`;
  }

  private onOpEvents(events: ShellEvent[]): void {
    const o = this.op;
    if (!o) return;
    for (const ev of events) {
      if (ev.type === 'answer') o.term.system('Nelle operazioni i problemi si segnalano con "report", non con "flag".', 'info');
      if (ev.type !== 'report') continue;
      const f = matchFinding(o.op, ev.value);
      if (!f) {
        o.term.system('✘ Questo non risulta tra i problemi del contratto. Ricontrolla le prove, o sii più preciso (percorso completo, nome utente, IP).', 'err');
      } else if (o.found.has(f.id)) {
        o.term.system(`Già segnalato: ${f.title}.`, 'info');
      } else {
        o.found.add(f.id);
        o.term.system(`✔ PROBLEMA CONFERMATO (${o.found.size}/${o.op.findings.length}): ${f.title}`, 'ok');
        o.minimized = false;
        this.renderOp(true);
        if (o.found.size === o.op.findings.length) setTimeout(() => this.finishOp(), 900);
      }
    }
  }

  private finishOp(): void {
    const o = this.op;
    if (!o) return;
    const first = !this.save.ops.includes(o.op.id);
    if (first) {
      this.save.ops.push(o.op.id);
      this.save.xp += o.op.xp;
      this.persist();
    }
    const rank = rankFor(this.save.xp);
    const node = el(html`
      <div class="screen complete">
        <div class="panel">
          <div class="kicker">// ${o.op.code} · rapporto consegnato</div>
          <h2>${o.op.title}</h2>
          ${first ? `<div class="xp-gain">+${o.op.xp} XP</div>` : '<div class="xp-gain replay">operazione ripetuta</div>'}
          <div class="rank-now">Rango: <b>${rank.name}</b> · ${this.save.xp} XP</div>
          <div class="step-body">${renderMarkup(o.op.debrief)}</div>
          <div class="step-actions">
            <button class="ghost" data-act="map">Mappa</button>
            <button class="next" data-act="ops">Operazioni ▸</button>
          </div>
        </div>
      </div>`);
    node.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act === 'map') this.showMap();
      if (act === 'ops') this.showOps();
    });
    this.op = null;
    this.mount('op-done', node);
  }

  // ------------------------------------------------------------- terminale libero

  private showSandbox(): void {
    this.run = null;
    const shell = this.ensureShell();
    const term = this.term!;
    term.updatePrompt();
    term.system('── TERMINALE LIBERO · nessuna missione attiva ──', 'banner');
    term.system('Sperimenta quello che vuoi. Idee: cat palestra/LEGGIMI.txt · help · man COMANDO', 'info');
    const node = el(html`
      <div class="screen mission sandbox">
        <header class="topbar">
          <button class="iconbtn" data-act="map" aria-label="Torna alla mappa">◂</button>
          <div class="tb-title">
            <div class="tb-kicker">DECK · ${shell.user}@${shell.host}</div>
            <div class="tb-name">Terminale libero</div>
          </div>
        </header>
        <section class="term-area"></section>
      </div>`);
    node.querySelector('.term-area')!.appendChild(term.el);
    node.querySelector('[data-act="map"]')!.addEventListener('click', () => this.showMap());
    this.mount('sandbox', node);
    if (finePointer()) term.focus();
  }

  private showMission(id: string): void {
    const found = findMission(id);
    if (!found || !isUnlocked(this.save, id)) return;
    const shell = this.ensureShell();
    const term = this.term!;
    const replay = this.save.completed.includes(id);
    const saved = replay ? 0 : this.save.progress[id] ?? 0;
    const step = Math.min(saved, found.mission.steps.length - 1);
    this.run = {
      chapter: found.chapter,
      mission: found.mission,
      index: found.index,
      step,
      reached: replay ? found.mission.steps.length : step,
      done: false,
      hintLevel: 0,
      quizPicked: null,
      minimized: false,
    };

    // ogni missione parte dalla home
    shell.cwd = shell.home;
    term.updatePrompt();
    term.system(`── MISSIONE ${found.chapter.code}.${found.index + 1} · ${found.mission.title.toUpperCase()} ──`, 'banner');

    const node = el(html`
      <div class="screen mission">
        <header class="topbar">
          <button class="iconbtn" data-act="map" aria-label="Torna alla mappa">◂</button>
          <div class="tb-title">
            <div class="tb-kicker">CAP ${found.chapter.code} · MISSIONE ${found.index + 1}</div>
            <div class="tb-name">${found.mission.title}</div>
          </div>
          <div class="tb-xp">${replay ? 'REPLAY' : `+${found.mission.xp} XP`}</div>
        </header>
        <div class="stepbar"><span></span></div>
        <section class="lesson" aria-live="polite"></section>
        <section class="term-area"></section>
      </div>`);
    node.querySelector('.term-area')!.appendChild(term.el);
    node.querySelector('[data-act="map"]')!.addEventListener('click', () => this.showMap());
    this.mount('mission', node);
    this.renderStep();
  }

  private currentStep(): Step | undefined {
    return this.run ? this.run.mission.steps[this.run.step] : undefined;
  }

  private stepIsDone(): boolean {
    const r = this.run!;
    return r.mission.steps[r.step].kind === 'lesson' || r.done || r.step < r.reached;
  }

  private renderStep(scrollToEnd = false): void {
    const r = this.run;
    if (!r) return;
    const screen = this.root.querySelector<HTMLElement>('.screen.mission');
    if (!screen) return;
    const step = r.mission.steps[r.step];
    const total = r.mission.steps.length;
    const done = this.stepIsDone();
    const panel = screen.querySelector<HTMLElement>('.lesson')!;
    screen.querySelector<HTMLElement>('.stepbar span')!.style.width = `${((r.step + (done ? 1 : 0)) / total) * 100}%`;
    screen.classList.toggle('mode-task', step.kind === 'task');
    screen.classList.toggle('mode-read', step.kind !== 'task');
    screen.classList.toggle('minimized', r.minimized && step.kind === 'task' && !done);

    const kindLabel = step.kind === 'lesson' ? 'LEZIONE' : step.kind === 'quiz' ? 'QUIZ' : 'OBIETTIVO';
    let body = '';
    let actions = '';

    if (step.kind === 'lesson') {
      body = renderMarkup(step.body);
      actions = `<button class="next" data-act="next">Avanti ▸</button>`;
    } else if (step.kind === 'task') {
      const hints = step.hints.slice(0, r.hintLevel);
      body = html`
        ${renderMarkup(step.body)}
        <div class="objective ${done ? 'complete' : ''}">
          <span class="o-label">${done ? '✔ COMPLETATO' : '▶ OBIETTIVO'}</span>
          <span class="o-text">${inline(step.objective)}</span>
        </div>
        ${hints.length && !done
          ? `<ol class="hints">${hints.map((h) => `<li>${inline(h)}</li>`).join('')}</ol>`
          : ''}
        ${done ? `<div class="success">${renderMarkup(step.success)}</div>` : ''}`;
      actions = done
        ? `<button class="next" data-act="next">Avanti ▸</button>`
        : `<button class="ghost" data-act="hint" ${r.hintLevel >= step.hints.length ? 'disabled' : ''}>
             Suggerimento ${Math.min(r.hintLevel + 1, step.hints.length)}/${step.hints.length}</button>
           <button class="ghost" data-act="terminal">Vai al terminale ⌨</button>`;
    } else {
      const picked = done && r.quizPicked === null ? step.correct : r.quizPicked;
      const answered = picked === step.correct;
      body = html`
        <div class="question">${renderMarkup(step.question)}</div>
        <div class="options">
          ${step.options
            .map((o, i) => {
              const cls = picked === i ? (i === step.correct ? 'right' : 'wrong') : '';
              return `<button class="opt ${cls}" data-opt="${i}" ${answered ? 'disabled' : ''}>
                <span class="opt-key">${'ABCD'[i]}</span><span>${inline(o)}</span></button>`;
            })
            .join('')}
        </div>
        ${picked !== null && !answered ? `<div class="feedback wrong">Non è questa. Rileggi con calma e riprova.</div>` : ''}
        ${answered ? `<div class="success">${renderMarkup(step.explain)}</div>` : ''}`;
      actions = answered ? `<button class="next" data-act="next">Avanti ▸</button>` : '';
    }

    panel.innerHTML = html`
      <div class="step-head">
        <span class="step-kind k-${step.kind}">${kindLabel}</span>
        <span class="step-num">${r.step + 1}/${total}</span>
        ${step.kind === 'task' && !done
          ? `<button class="iconbtn small" data-act="minimize" aria-label="Riduci pannello">${r.minimized ? '▾' : '▴'}</button>`
          : ''}
      </div>
      <h2 class="step-title">${step.title}</h2>
      <div class="step-body">${body}</div>
      <div class="step-actions">
        ${r.step > 0 ? `<button class="ghost" data-act="prev">◂</button>` : ''}
        ${actions}
      </div>`;

    panel.onclick = (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act],[data-opt]');
      if (!t) return;
      if (t.dataset.opt !== undefined) return this.pickOption(Number(t.dataset.opt));
      switch (t.dataset.act) {
        case 'next':
          return this.advance();
        case 'prev':
          return this.goTo(r.step - 1);
        case 'hint':
          return this.showHint();
        case 'terminal':
          r.minimized = true;
          this.renderStep();
          this.term?.focus();
          return;
        case 'minimize':
          r.minimized = !r.minimized;
          return this.renderStep();
      }
    };

    if (scrollToEnd) panel.scrollTo({ top: panel.scrollHeight, behavior: 'smooth' });
    else panel.scrollTop = 0;
    if (step.kind === 'task' && !done && finePointer()) this.term?.focus();
  }

  private goTo(i: number): void {
    const r = this.run!;
    r.step = Math.max(0, Math.min(i, r.mission.steps.length - 1));
    r.done = false;
    r.hintLevel = 0;
    r.quizPicked = null;
    r.minimized = false;
    this.renderStep();
  }

  private advance(): void {
    const r = this.run!;
    if (!this.stepIsDone()) return;
    if (r.step + 1 >= r.mission.steps.length) return this.finishMission();
    const next = r.step + 1;
    if (next > r.reached) r.reached = next;
    if (!this.save.completed.includes(r.mission.id)) {
      this.save.progress[r.mission.id] = r.reached;
      this.persist();
    }
    this.goTo(next);
  }

  private markDone(): void {
    const r = this.run!;
    r.done = true;
    if (r.reached <= r.step) r.reached = r.step + 1;
    r.minimized = false;
    this.renderStep(true);
  }

  private pickOption(i: number): void {
    const r = this.run!;
    const step = this.currentStep();
    if (step?.kind !== 'quiz') return;
    r.quizPicked = i;
    if (i === step.correct) this.markDone();
    else this.renderStep(true);
  }

  private nextHint(): string | null {
    const r = this.run;
    const step = this.currentStep();
    if (!r || step?.kind !== 'task' || this.stepIsDone()) return null;
    const h = step.hints[Math.min(r.hintLevel, step.hints.length - 1)];
    if (r.hintLevel < step.hints.length) {
      r.hintLevel++;
      // aggiorna il pannello senza far perdere il focus al terminale
      queueMicrotask(() => this.renderStep(true));
    }
    return h;
  }

  private showHint(): void {
    const r = this.run!;
    const step = this.currentStep();
    if (step?.kind !== 'task') return;
    r.hintLevel = Math.min(r.hintLevel + 1, step.hints.length);
    this.renderStep(true);
  }

  private onShellEvents(events: ShellEvent[]): void {
    const r = this.run;
    const term = this.term!;
    if (!r) {
      if (events.some((e) => e.type === 'answer'))
        term.system('Sei nel terminale libero: le flag si inviano durante le missioni.', 'info');
      return;
    }
    const step = this.currentStep();
    const done = this.stepIsDone();
    const outcome = evaluate(done ? undefined : step, events, this.shell!);
    if (outcome === 'pass') {
      term.system('✔ OBIETTIVO COMPLETATO', 'ok');
      this.markDone();
    } else if (outcome === 'wrong-answer') {
      term.system('✘ Risposta non corretta. Riprova, oppure scrivi "hint" per un suggerimento.', 'err');
    } else if (outcome === 'no-question') {
      term.system(
        done ? 'Obiettivo già completato: premi "Avanti" nel pannello.' : 'Nessuna domanda aperta: per ora non serve inviare risposte.',
        'info',
      );
    }
  }

  private finishMission(): void {
    const r = this.run!;
    const first = !this.save.completed.includes(r.mission.id);
    if (first) {
      this.save.completed.push(r.mission.id);
      this.save.xp += r.mission.xp;
      delete this.save.progress[r.mission.id];
      this.persist();
    }
    this.showComplete(r.chapter, r.mission, r.index, first);
  }

  private showComplete(ch: Chapter, m: Mission, index: number, first: boolean): void {
    this.run = null;
    const lastOfChapter = index === ch.missions.length - 1;
    const next = nextMissionId(this.save);
    const nextInfo = next ? findMission(next) : null;
    const rank = rankFor(this.save.xp);
    const node = el(html`
      <div class="screen complete">
        <div class="panel">
          <div class="kicker">${lastOfChapter ? `// capitolo ${ch.code} completato` : '// missione completata'}</div>
          <h2>${m.title}</h2>
          ${first ? `<div class="xp-gain">+${m.xp} XP</div>` : '<div class="xp-gain replay">ripasso completato</div>'}
          <div class="rank-now">Rango: <b>${rank.name}</b> · ${this.save.xp} XP</div>
          <h3>Cosa hai imparato</h3>
          <dl class="recap">
            ${m.recap.map(([k, v]) => `<div><dt>${inline(k)}</dt><dd>${inline(v)}</dd></div>`).join('')}
          </dl>
          <div class="step-actions">
            <button class="ghost" data-act="map">Mappa</button>
            ${nextInfo ? `<button class="next" data-act="next">Prossima: ${nextInfo.mission.title} ▸</button>` : ''}
          </div>
        </div>
      </div>`);
    node.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
      if (t?.dataset.act === 'map') this.showMap();
      if (t?.dataset.act === 'next' && nextInfo) this.showMission(nextInfo.mission.id);
    });
    this.mount('complete', node);
  }

  // ------------------------------------------------------------- pagine

  private page(screen: string, title: string, kicker: string, content: string): HTMLElement {
    const node = el(html`
      <div class="screen page">
        <header class="topbar">
          <button class="iconbtn" data-act="map" aria-label="Torna alla mappa">◂</button>
          <div class="tb-title"><div class="tb-kicker">${kicker}</div><div class="tb-name">${title}</div></div>
        </header>
        <div class="page-body">${content}</div>
      </div>`);
    node.querySelector('[data-act="map"]')!.addEventListener('click', () => this.showMap());
    this.mount(screen, node);
    return node;
  }

  // ------------------------------------------------------------- giochi

  private showGames(): void {
    const best = (id: string, total: number) =>
      this.save.best[id] !== undefined ? `<span class="op-xp">record: ${this.save.best[id]}/${total}</span>` : '';
    const cards = html`
      <button class="opcard" data-g="train">
        <span class="op-top"><span class="op-code">RIPASSO</span></span>
        <span class="op-title">Allenamento</span>
        <span class="op-client">10 domande a caso dalle missioni che hai completato.</span>
      </button>
      ${GAMES.map(
        (g) => html`
          <button class="opcard" data-g="${g.id}">
            <span class="op-top"><span class="op-code">GIOCO</span>${best(g.id, g.cards.length)}</span>
            <span class="op-title">${g.title}</span>
            <span class="op-client">${inline(g.tagline)}</span>
          </button>`,
      ).join('')}`;
    const node = this.page('games', 'Giochi', '// allenarsi giocando', `<div class="oplist">${cards}</div>`);
    node.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).closest<HTMLElement>('[data-g]')?.dataset.g;
      if (id === 'train') this.showTraining();
      else if (id) this.showGame(id);
    });
  }

  private showGame(id: string): void {
    const game = GAMES.find((g) => g.id === id);
    if (!game) return;
    const deck = [...game.cards].sort(() => Math.random() - 0.5);
    let idx = -1; // -1 = introduzione
    let score = 0;
    let answered = false;
    const node = this.page('game', game.title, '// gioco', '<div class="train game"></div>');
    const box = node.querySelector<HTMLElement>('.game')!;
    const render = () => {
      if (idx < 0) {
        box.innerHTML = html`
          <div class="prose">${renderMarkup(game.intro)}</div>
          <div class="step-actions"><button class="next" data-t="next">Inizia ▸</button></div>`;
        return;
      }
      if (idx >= deck.length) {
        const prev = this.save.best[game.id];
        const record = prev === undefined || score > prev;
        if (record) {
          this.save.best[game.id] = score;
          this.persist();
        }
        box.innerHTML = html`
          <div class="train-end">
            <div class="xp-gain">${score}/${deck.length}</div>
            <p>${record ? 'Nuovo record personale!' : `Il tuo record è ${prev}/${deck.length}.`}</p>
            <div class="step-actions">
              <button class="ghost" data-t="back">Giochi</button>
              <button class="next" data-t="again">Rigioca ▸</button>
            </div>
          </div>`;
        return;
      }
      const c = deck[idx];
      answered = false;
      box.innerHTML = html`
        <div class="train-head"><span>${idx + 1}/${deck.length}</span><span>Punti: ${score}</span></div>
        <div class="gcard">
          <div class="gcard-type">${c.title}</div>
          <dl class="gmeta">${c.meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${inline(v)}</dd></div>`).join('')}</dl>
          <div class="gbody"></div>
        </div>
        <div class="gchoices">
          <button class="opt" data-c="0">${game.choices[0]}</button>
          <button class="opt" data-c="1">${game.choices[1]}</button>
        </div>
        <div class="train-explain"></div>`;
      box.querySelector('.gbody')!.textContent = c.body;
    };
    box.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const act = t.closest<HTMLElement>('[data-t]')?.dataset.t;
      if (act === 'back') return this.showGames();
      if (act === 'again') return this.showGame(id);
      if (act === 'next') {
        idx++;
        render();
        this.root.scrollTop = 0;
        return;
      }
      const btn = t.closest<HTMLElement>('[data-c]');
      if (!btn || answered || idx < 0 || idx >= deck.length) return;
      answered = true;
      const c = deck[idx];
      const chosen = Number(btn.dataset.c);
      const right = chosen === c.answer;
      if (right) score++;
      box.querySelectorAll<HTMLButtonElement>('[data-c]').forEach((b) => {
        const v = Number(b.dataset.c);
        if (v === c.answer) b.classList.add('right');
        else if (v === chosen) b.classList.add('wrong');
        b.disabled = true;
      });
      box.querySelector('.train-explain')!.innerHTML = html`
        <div class="${right ? 'success' : 'feedback wrong'}">${right ? '' : '<p>Sbagliato.</p>'}${renderMarkup(c.explain)}</div>
        <div class="step-actions"><button class="next" data-t="next">${idx + 1 < deck.length ? 'Prossimo ▸' : 'Risultato ▸'}</button></div>`;
    });
    render();
  }

  // ------------------------------------------------------------- allenamento

  private showTraining(): void {
    const pool: { q: QuizStep; mission: string }[] = [];
    for (const m of allMissions())
      if (this.save.completed.includes(m.id))
        for (const st of m.steps) if (st.kind === 'quiz') pool.push({ q: st, mission: m.title });
    if (pool.length === 0) {
      this.page(
        'train',
        'Allenamento',
        '// ripasso',
        '<p class="empty">L\'allenamento ripropone a caso le domande delle missioni che hai completato, per fissare i concetti nella memoria. Completa la prima missione per iniziare.</p>',
      );
      return;
    }
    // mescola e prendi fino a 10 domande; anche le risposte vengono mescolate
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    const rounds = shuffled.map(({ q, mission }) => {
      const order = q.options.map((_, i) => i).sort(() => Math.random() - 0.5);
      return { q, mission, order };
    });
    let idx = 0;
    let score = 0;
    let answered = false;
    const node = this.page('train', 'Allenamento', '// ripasso', '<div class="train"></div>');
    const box = node.querySelector<HTMLElement>('.train')!;
    const render = () => {
      if (idx >= rounds.length) {
        const pct = Math.round((score / rounds.length) * 100);
        const msg =
          pct === 100 ? 'Perfetto. Nyx sarebbe fiera di te.' : pct >= 70 ? 'Ottimo lavoro, choom.' : 'Ripassa il Codex e riprova: la ripetizione è il segreto.';
        box.innerHTML = html`
          <div class="train-end">
            <div class="xp-gain">${score}/${rounds.length}</div>
            <p>${msg}</p>
            <div class="step-actions">
              <button class="ghost" data-t="map">Giochi</button>
              <button class="next" data-t="again">Ancora ▸</button>
            </div>
          </div>`;
        return;
      }
      const r = rounds[idx];
      answered = false;
      box.innerHTML = html`
        <div class="train-head"><span>Domanda ${idx + 1}/${rounds.length}</span><span>Punti: ${score}</span></div>
        <div class="train-src">da: ${inline(r.mission)}</div>
        <div class="question">${renderMarkup(r.q.question)}</div>
        <div class="options">
          ${r.order
            .map((oi, k) => `<button class="opt" data-o="${oi}"><span class="opt-key">${'ABCD'[k]}</span><span>${inline(r.q.options[oi])}</span></button>`)
            .join('')}
        </div>
        <div class="train-explain"></div>`;
    };
    box.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const act = t.closest<HTMLElement>('[data-t]')?.dataset.t;
      if (act === 'map') return this.showGames();
      if (act === 'again') return this.showTraining();
      if (act === 'next') {
        idx++;
        render();
        box.scrollIntoView({ block: 'start' });
        return;
      }
      const opt = t.closest<HTMLElement>('[data-o]');
      if (!opt || answered) return;
      answered = true;
      const r = rounds[idx];
      const chosen = Number(opt.dataset.o);
      const right = chosen === r.q.correct;
      if (right) score++;
      box.querySelectorAll<HTMLButtonElement>('.opt').forEach((b) => {
        const o = Number(b.dataset.o);
        if (o === r.q.correct) b.classList.add('right');
        else if (o === chosen) b.classList.add('wrong');
        b.disabled = true;
      });
      box.querySelector('.train-explain')!.innerHTML = html`
        <div class="${right ? 'success' : 'feedback wrong'}">${right ? '' : '<p>Non era questa.</p>'}${renderMarkup(r.q.explain)}</div>
        <div class="step-actions"><button class="next" data-t="next">${idx + 1 < rounds.length ? 'Prossima ▸' : 'Risultato ▸'}</button></div>`;
    });
    render();
  }

  private showCodex(): void {
    const done = allMissions().filter((m) => this.save.completed.includes(m.id));
    const content = done.length
      ? done
          .map(
            (m) => html`
              <section class="codex-group">
                <h3>${m.title}</h3>
                <dl class="recap">
                  ${m.recap.map(([k, v]) => `<div><dt>${inline(k)}</dt><dd>${inline(v)}</dd></div>`).join('')}
                </dl>
              </section>`,
          )
          .join('')
      : `<p class="empty">Il Codex raccoglie tutti i comandi e i concetti che impari. Completa la prima missione per sbloccare le prime voci.</p>`;
    this.page('codex', 'Codex', '// glossario e comandi', content);
  }

  private showCareer(): void {
    const content = html`
      <div class="prose">${renderMarkup(CAREER.intro)}</div>
      ${CAREER.phases
        .map(
          (p) => html`
            <section class="phase">
              <h3>${p.title}</h3>
              <ul class="res">
                ${p.items.map(([n, d]) => `<li><b>${inline(n)}</b><span>${inline(d)}</span></li>`).join('')}
              </ul>
            </section>`,
        )
        .join('')}
      <section class="phase">
        <h3>I ruoli</h3>
        <ul class="res">${CAREER.roles.map(([n, d]) => `<li><b>${n}</b><span>${inline(d)}</span></li>`).join('')}</ul>
      </section>
      <div class="prose">${renderMarkup(CAREER.advice)}</div>`;
    this.page('career', 'Carriera', '// dal gioco al lavoro', content);
  }

  private showSettings(): void {
    const content = html`
      <section class="setting">
        <h3>Dimensione del testo</h3>
        <div class="font-row">
          <button class="ghost" data-act="font-" aria-label="Testo più piccolo">A−</button>
          <span class="font-val">${Math.round(this.save.fontScale * 100)}%</span>
          <button class="ghost" data-act="font+" aria-label="Testo più grande">A+</button>
        </div>
        <p class="sample">Esempio: <code>ls -la ~/missioni</code></p>
      </section>
      <section class="setting">
        <h3>Profilo</h3>
        <p>Handle: <b>${this.save.handle}</b> · ${this.save.xp} XP · ${this.save.completed.length} missioni completate</p>
        <button class="danger" data-act="reset">Cancella tutti i progressi</button>
      </section>
      <section class="setting">
        <h3>Informazioni</h3>
        <p class="small">Night City Netrunning v0.4 · corso di ethical hacking in italiano. Tutti i sistemi, le reti e i personaggi del gioco sono simulati o inventati. Le conoscenze di sicurezza vanno usate solo su sistemi propri o con autorizzazione scritta.</p>
      </section>`;
    const node = this.page('settings', 'Opzioni', '// impostazioni', content);
    node.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act === 'font+' || act === 'font-') {
        const v = Math.round((this.save.fontScale + (act === 'font+' ? 0.1 : -0.1)) * 10) / 10;
        this.save.fontScale = Math.min(1.6, Math.max(0.8, v));
        this.persist();
        this.applyFont();
        node.querySelector('.font-val')!.textContent = `${Math.round(this.save.fontScale * 100)}%`;
      } else if (act === 'reset') {
        if (confirm('Vuoi davvero cancellare tutti i progressi? Non si può annullare.')) {
          clearSave();
          this.save = loadSave();
          this.shell = null;
          this.term = null;
          this.applyFont();
          this.showTitle();
        }
      }
    });
  }
}
