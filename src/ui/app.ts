import { CAREER, CHAPTERS, PLANNED, allMissions, findMission } from '../content';
import { GAMES } from '../content/games';
import { GENERATORS, LEVELS, generateSession, normalizeDrillAnswer, type Drill, type Level } from '../content/drills';
import { TIPS, randomTip } from '../content/tips';
import { OPERATIONS, matchFinding, type Operation } from '../content/operations';
import { buildWorld } from '../content/world';
import type { Shell } from '../engine/shell';
import type { Vfs } from '../engine/vfs';
import type { ShellEvent } from '../engine/types';
import { evaluate, stateOk } from '../game/logic';
import {
  makeBackup,
  parseBackup,
  clearDeck,
  clearSave,
  loadDeck,
  saveDeck,
  isUnlocked,
  loadSave,
  nextMissionId,
  rankFor,
  validHandle,
  writeSave,
  type SaveData,
} from '../game/state';
import type { Chapter, Mission, QuizStep, Step } from '../game/types';
import { MANPAGES } from '../engine/manpages';
import { PROSE_SKIP, cmdName, commandsInLine, commandsInMarkup, taughtBefore } from '../game/commands';
import { analyze, type Analysis, type LogEntry } from '../game/coach';
import { EXAMS } from '../game/exam';
import { today } from '../game/cards';
import { recordExam, renderExamsHome } from './exam';
import { SyncError, describe as describeSave, loadCloud, saveCloud, syncOnce, type CloudConfig } from '../game/sync';
import { annotateGlossary, bindGlossarySearch, glossaryHtml, installGlossary } from './glossary';
import { openManual } from './manual';
import { dueCount, renderMemoryHome } from './memory';
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
  /** termini del glossario già evidenziati, per passo */
  glByStep: Map<number, Set<string>>;
}

const html = String.raw;

function el<T extends HTMLElement = HTMLElement>(markup: string): T {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild as T;
}

/** Trasforma l'ultimo comando eseguito in una riga del diario (per il coach). */
function entryOf(sh: Shell, step: number, outcome: string | null, events: ShellEvent[]): LogEntry | null {
  const last = sh.lastRun;
  if (!last) return null;
  const e: LogEntry = { l: last.line, d: last.cwd, s: step };
  if (last.err) e.e = last.err.slice(0, 120);
  if (last.out) e.o = last.out;
  if (outcome === 'pass') e.k = 'p';
  else if (outcome === 'wrong-answer') e.k = 'w';
  else if (events.some((x) => x.type === 'scan' && x.outOfScope)) e.k = 'x';
  else if (/^hint\b/.test(last.line)) e.k = 'h';
  return e;
}

const finePointer = () => window.matchMedia?.('(pointer: fine)').matches ?? false;

export class App {
  private save: SaveData = loadSave();
  private shell: Shell | null = null;
  private pristine: Vfs | null = null;
  private pristineFor: string | null = null;
  private term: TerminalView | null = null;
  private run: MissionRun | null = null;
  private sim: {
    drills: Drill[];
    idx: number;
    level: Level;
    chapters: string[];
    results: ('ok' | 'skip')[];
    hinted: boolean[];
    hintLevel: number;
    term: TerminalView;
    shell: Shell;
    minimized: boolean;
    solvedNow: boolean;
    log: LogEntry[];
    /** prova pratica a tempo */
    exam: { started: number; deadline: number } | null;
  } | null = null;
  /** timer da fermare quando si cambia schermata */
  private timers: number[] = [];
  /** rango prima dell'ultima missione completata (per festeggiare la promozione) */
  private rankBefore = '';
  /** ultimo passo mostrato: l'animazione parte solo quando si cambia passo */
  private lastStepKey = '';
  private op: {
    op: Operation;
    found: Set<string>;
    hints: Record<string, number>;
    term: TerminalView;
    minimized: boolean;
    log: LogEntry[];
  } | null = null;
  private screen = 'title';

  constructor(private root: HTMLElement) {
    this.applyFont();
    installGlossary();
  }

  start(): void {
    this.showTitle();
    // su PC, Esc fa da tasto "indietro" (ma non mentre scrivi nel terminale o in un campo)
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const t = e.target as HTMLElement;
      const sheet = document.querySelector<HTMLElement>('.manual-sheet [data-m="close"]');
      if (sheet) return sheet.click();
      if (t.closest('input, textarea, select, .editor, .gl-pop') || document.querySelector('.gl-pop, .editor')) return;
      this.back();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void this.syncNow();
    });
    if (loadCloud()) void this.syncNow(true);
  }

  // ------------------------------------------------------------- salvataggio nel cloud

  private syncTimer = 0;
  private syncing = false;

  private scheduleSync(): void {
    const cfg = loadCloud();
    if (!cfg || cfg.lastError === 'auth') return;
    window.clearTimeout(this.syncTimer);
    this.syncTimer = window.setTimeout(() => void this.syncNow(), 8000);
  }

  /** Legge il cloud, unisce, scrive. All'avvio applica anche i file del deck se nel cloud sono più recenti. */
  private async syncNow(startup = false, cfgOverride?: CloudConfig): Promise<string> {
    const cfg = cfgOverride ?? loadCloud();
    if (!cfg || this.syncing || (!cfgOverride && cfg.lastError === 'auth')) return '';
    this.syncing = true;
    window.clearTimeout(this.syncTimer);
    const before = { xp: this.save.xp, done: this.save.completed.length };
    try {
      this.persistDeck();
      const localDeck = this.deckData() ?? loadDeck();
      const r = await syncOnce(cfg, { v: 1, save: this.save, deck: localDeck });
      Object.assign(this.save, r.save);
      writeSave(this.save);
      const deckApplied = !!r.remoteDeck && (startup || !localDeck) && !this.shell;
      if (deckApplied && typeof r.remoteDeck === 'object') saveDeck(r.remoteDeck);
      saveCloud(r.cfg);
      const changed = this.save.xp !== before.xp || this.save.completed.length !== before.done;
      if (changed && ['title', 'map'].includes(this.screen)) (this.screen === 'map' ? this.showMap() : this.showTitle());
      return r.created ? 'Salvataggio creato nel tuo GitHub.' : changed ? `Progressi uniti: ${describeSave(this.save)}.` : 'Tutto sincronizzato.';
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore sconosciuto.';
      saveCloud({ ...cfg, lastError: e instanceof SyncError && e.auth ? 'auth' : msg });
      return `Sincronizzazione non riuscita: ${msg}`;
    } finally {
      this.syncing = false;
    }
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
      case 'sim-setup':
      case 'sim-done':
        this.showGames();
        return true;
      case 'sim':
        this.showSimSetup();
        return true;
      case 'memory-run':
        this.showMemory();
        return true;
      case 'exam-run':
        if (confirm('Uscire dall\'esame? Le risposte date finora andranno perse.')) this.showExams();
        return true;
      case 'exams':
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
    this.scheduleSync();
  }

  private applyFont(): void {
    document.documentElement.style.setProperty('--scale', String(this.save.fontScale));
    this.applyFx();
  }

  /** Effetti visivi: attivi se l'opzione è accesa e il sistema non chiede animazioni ridotte. */
  private applyFx(): void {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    document.documentElement.classList.toggle('fx', this.save.effects !== false && !reduced);
  }

  private fxOn(): boolean {
    return document.documentElement.classList.contains('fx');
  }

  /** Fa salire un numero da 0 al valore finale (solo con gli effetti attivi). */
  private countUp(el: Element | null, to: number, prefix = '', suffix = ''): void {
    if (!el) return;
    if (!this.fxOn() || to <= 0) {
      el.textContent = `${prefix}${to}${suffix}`;
      return;
    }
    const start = performance.now();
    const dur = 700;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - (1 - k) ** 3;
      el.textContent = `${prefix}${Math.round(to * eased)}${suffix}`;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  private mount(screen: string, node: HTMLElement): void {
    for (const t of this.timers) window.clearInterval(t);
    this.timers = [];
    this.screen = screen;
    if (this.fxOn()) node.classList.add('fx-enter');
    this.root.replaceChildren(node);
    this.root.scrollTop = 0;
  }

  private ensureShell(): Shell {
    if (!this.shell) {
      this.shell = buildWorld(this.save.handle!, () => this.nextHint());
      // ripristina i file e gli alias della sessione precedente
      const saved = loadDeck();
      if (saved?.home) this.shell.fs.overlay(this.shell.home, saved.home);
      if (saved?.deleted?.length) this.shell.fs.removePaths(saved.deleted);
      if (saved?.aliases) this.shell.userAliases = { ...saved.aliases };
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
    const tip = randomTip();
    const due = dueCount(s);

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
          <button data-act="memory" class="${due ? 'has-due' : ''}">Memoria${due ? `<b class="badge">${due}</b>` : ''}</button>
          <button data-act="ops">Operazioni</button>
          <button data-act="manual">Manuale</button>
          <button data-act="sandbox">Terminale</button>
          <button data-act="games">Giochi</button>
          <button data-act="exams">Esami</button>
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
        <div class="tip" data-act="tip">
          <span class="tip-k">TRUCCO DEL MESTIERE · ${tip.area.toUpperCase()}</span>
          <span class="tip-t">${inline(tip.text)}</span>
        </div>
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
          ${doneCount === ch.missions.length ? `<button class="ch-debrief" data-debrief="${ch.id}">Debriefing del capitolo ▸</button>` : ''}
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
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act],[data-mission],[data-debrief]');
      if (!t) return;
      if (t.dataset.debrief) this.showDebrief(t.dataset.debrief);
      else if (t.dataset.mission) this.showMission(t.dataset.mission);
      else if (t.dataset.act === 'codex') this.showCodex();
      else if (t.dataset.act === 'train') this.showTraining();
      else if (t.dataset.act === 'sandbox') this.showSandbox();
      else if (t.dataset.act === 'ops') this.showOps();
      else if (t.dataset.act === 'manual') openManual();
      else if (t.dataset.act === 'games') this.showGames();
      else if (t.dataset.act === 'memory') this.showMemory();
      else if (t.dataset.act === 'exams') this.showExams();
      else if (t.dataset.act === 'career') this.showCareer();
      else if (t.dataset.act === 'settings') this.showSettings();
      else if (t.dataset.act === 'title') this.showTitle();
      else if (t.dataset.act === 'tip') {
        const n = randomTip();
        t.querySelector('.tip-k')!.textContent = `TRUCCO DEL MESTIERE · ${n.area.toUpperCase()}`;
        t.querySelector('.tip-t')!.innerHTML = inline(n.text);
      }
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
    this.op = { op, found: new Set(), hints: {}, term, minimized: false, log: [] };
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
    this.addManualButton(node);
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
        o.log.push({ l: '', d: o.term.shell.cwd, s: o.found.size, k: 'h' });
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
    let outcome: string | null = null;
    for (const ev of events)
      if (ev.type === 'report') {
        const f = matchFinding(o.op, ev.value);
        outcome = f && !o.found.has(f.id) ? 'pass' : f ? outcome : 'wrong-answer';
      }
    const entry = entryOf(o.term.shell, o.found.size, outcome, events);
    if (entry) o.log.push(entry);
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
    const coach = o.log.some((e) => e.l) ? analyze(o.log, o.op.findings.length, 12) : null;
    const node = el(html`
      <div class="screen complete">
        <div class="panel">
          <div class="kicker">// ${o.op.code} · rapporto consegnato</div>
          <h2>${o.op.title}</h2>
          ${first ? `<div class="xp-gain">+${o.op.xp} XP</div>` : '<div class="xp-gain replay">operazione ripetuta</div>'}
          <div class="rank-now">Rango: <b>${rank.name}</b> · ${this.save.xp} XP</div>
          <div class="step-body">${renderMarkup(o.op.debrief)}</div>
          ${coach ? `<h3>Il parere di Rook sul tuo lavoro</h3>${this.statsHtml(coach)}<div class="coach">${this.coachHtml(coach, 4)}</div>` : ''}
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
    this.fillCoachCode(node);
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
    this.addManualButton(node);
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
      glByStep: new Map(),
    };

    // il diario dei comandi riparte quando la missione ricomincia da capo
    if (step === 0 || !this.save.logs[id]) this.save.logs[id] = [];

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
    this.addManualButton(node);
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
      const refs = commandsInMarkup(step.body).filter((c) => MANPAGES[c]?.description?.length && c !== 'assign' && c !== 'script');
      if (refs.length) body += `<div class="refs">📖 Schede complete:${refs.map((c) => `<button class="chip" data-ref="${c}">${c}</button>`).join('')}</div>`;
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
    panel.classList.toggle('step-new', this.lastStepKey !== `${r.mission.id}:${r.step}`);
    this.lastStepKey = `${r.mission.id}:${r.step}`;
    if (step.kind === 'task' && !done) this.hideTaskCommands(panel.querySelector('.step-body')!, r.mission.id, r.step);
    {
      // glossario: ogni termine evidenziato solo la prima volta che compare nella missione
      const before = new Set<string>();
      for (const [k, set] of r.glByStep) if (k < r.step) set.forEach((t) => before.add(t));
      const seen = new Set(before);
      annotateGlossary(panel.querySelector<HTMLElement>('.step-body')!, seen);
      r.glByStep.set(r.step, new Set([...seen].filter((t) => !before.has(t))));
    }

    panel.onclick = (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act],[data-opt],[data-ref]');
      if (!t) return;
      if (t.dataset.ref) return openManual(t.dataset.ref);
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
    // se il lavoro richiesto risulta già fatto (anche prima di arrivare qui), l'obiettivo è completato
    if (step.kind === 'task' && !done && this.shell && stateOk(step, this.shell))
      queueMicrotask(() => {
        if (this.run !== r || r.step !== this.run.mission.steps.indexOf(step) || this.stepIsDone()) return;
        this.term?.system('✔ OBIETTIVO GIÀ COMPLETATO', 'ok');
        this.markDone();
      });
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
    this.pushLog(r.mission.id, { l: '', d: this.shell?.cwd ?? '', s: r.step, k: 'h' });
    this.renderStep(true);
  }

  /**
   * Nei compiti sfoca i comandi che il giocatore ha già visto in una lezione o usato
   * con successo: blocchi di codice, codice nel testo e parole-comando negli obiettivi.
   * Si aprono con un tocco, così deve sforzarsi di ricordarli.
   */
  private hideTaskCommands(container: HTMLElement, missionId: string, stepIdx: number): void {
    if (!this.save.hideKnown) return;
    const hideable = new Set([...this.save.known, ...taughtBefore(missionId, stepIdx)]);
    const ok = (cmds: string[]) => cmds.length > 0 && cmds.every((c) => hideable.has(c));
    const makeReveal = (el: HTMLElement) =>
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        el.classList.add('revealed');
      });

    // 1) blocchi di codice
    container.querySelectorAll<HTMLElement>(':scope > pre.code').forEach((pre) => {
      const cmds = pre.textContent!.split('\n').flatMap((l) => commandsInLine(l.replace(/^[$#]\s*/, '')));
      if (!ok(cmds)) return;
      const wrap = document.createElement('div');
      wrap.className = 'spoiler';
      wrap.innerHTML = '<span class="spoiler-label">🔒 Comando già visto: prova a ricordarlo<br><small>tocca per vederlo</small></span>';
      pre.replaceWith(wrap);
      wrap.prepend(pre);
      makeReveal(wrap);
    });

    // 2) codice nel testo (es. "controlla con `ls` che ci sia")
    container.querySelectorAll<HTMLElement>('code').forEach((code) => {
      if (code.closest('pre, .spoiler, .hints, .ispoiler')) return;
      if (!ok(commandsInLine(code.textContent ?? ''))) return;
      code.classList.add('ispoiler');
      makeReveal(code);
    });

    // 3) parole-comando negli obiettivi ("Leggi il file con cat")
    container.querySelectorAll<HTMLElement>('.objective .o-text').forEach((box) => {
      const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
      for (const node of nodes) {
        if (node.parentElement?.closest('.ispoiler')) continue;
        const parts = node.data.split(/(\b[a-z][a-z0-9_-]*\b)/);
        if (parts.length < 2 || !parts.some((w) => w && w === w.toLowerCase() && !PROSE_SKIP.has(w) && cmdName(w) && hideable.has(cmdName(w)!))) continue;
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          const c = cmdName(part);
          if (part && /^[a-z]/.test(part) && c && !PROSE_SKIP.has(part) && hideable.has(c)) {
            const sp = document.createElement('span');
            sp.className = 'ispoiler';
            sp.textContent = part;
            makeReveal(sp);
            frag.appendChild(sp);
          } else frag.appendChild(document.createTextNode(part));
        }
        node.replaceWith(frag);
      }
    });
  }

  /** Registra i comandi usati con successo, per sapere quali nascondere. */
  private learnCommands(events: ShellEvent[]): void {
    let changed = false;
    const known = new Set(this.save.known);
    for (const ev of events) {
      if (ev.type !== 'command' || !ev.ok) continue;
      const name = ev.name === 'assign' ? 'assign' : ev.name;
      if (!known.has(name)) {
        known.add(name);
        changed = true;
      }
    }
    if (events.some((e) => e.type === 'script' && e.ok) && !known.has('script')) {
      known.add('script');
      changed = true;
    }
    if (changed) {
      this.save.known = [...known];
      this.persist();
    }
  }

  /** La home "pulita", per sapere cosa ha modificato il giocatore. */
  private pristineHome(): Vfs {
    if (!this.pristine || this.pristineFor !== this.save.handle) {
      this.pristine = buildWorld(this.save.handle!).localFs;
      this.pristineFor = this.save.handle;
    }
    return this.pristine;
  }

  private deckData(): { home: unknown; deleted: string[]; aliases: Record<string, string> } | null {
    const sh = this.shell;
    if (!sh) return null;
    const diff = sh.localFs.diffFrom(this.pristineHome(), `/home/${this.save.handle}`);
    return { home: diff.tree, deleted: diff.deleted, aliases: sh.userAliases };
  }

  /** Aggiunge alla barra in alto il pulsante che apre il Manuale. */
  private addManualButton(node: HTMLElement): void {
    const bar = node.querySelector('.topbar');
    if (!bar) return;
    const b = document.createElement('button');
    b.className = 'iconbtn';
    b.setAttribute('aria-label', 'Apri il manuale');
    b.textContent = '📖';
    b.addEventListener('click', () => openManual());
    bar.appendChild(b);
  }

  private persistDeck(): void {
    const d = this.deckData();
    if (d) saveDeck(d);
  }

  private onShellEvents(events: ShellEvent[]): void {
    const r = this.run;
    const term = this.term!;
    this.persistDeck();
    this.learnCommands(events);
    if (!r) {
      if (events.some((e) => e.type === 'answer'))
        term.system('Sei nel terminale libero: le flag si inviano durante le missioni.', 'info');
      return;
    }
    const step = this.currentStep();
    const done = this.stepIsDone();
    const outcome = evaluate(done ? undefined : step, events, this.shell!);
    this.logCommand(outcome, events);
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

  /** Annota nel diario della missione il comando appena eseguito (per l'analisi finale). */
  private logCommand(outcome: string | null, events: ShellEvent[]): void {
    const r = this.run;
    const e = this.shell ? entryOf(this.shell, r?.step ?? 0, outcome, events) : null;
    if (r && e) this.pushLog(r.mission.id, e);
  }

  private pushLog(id: string, e: LogEntry): void {
    const log = (this.save.logs[id] ??= []);
    log.push(e);
    if (log.length > 400) log.splice(0, log.length - 400);
    this.persist();
  }

  private missionAnalysis(ids: string[]): Analysis | null {
    const log = ids.flatMap((id) => this.save.logs[id] ?? []);
    if (!log.some((e) => e.l)) return null;
    const objectives = ids.reduce((n, id) => n + (findMission(id)?.mission.steps.filter((st) => st.kind === 'task').length ?? 0), 0);
    return analyze(log, objectives);
  }

  /** Il riquadro con i consigli: stessi elementi per la missione e per il capitolo. */
  private coachHtml(a: Analysis, maxTips: number): string {
    const tips = a.tips.slice(0, maxTips);
    const code = (k: string, v: string) => `<div class="cc-row"><span class="cc-k">${k}</span><pre class="cc-code"></pre><template>${v.replace(/</g, '&lt;')}</template></div>`;
    return html`
      ${a.strengths.length ? `<ul class="coach-good">${a.strengths.slice(0, 3).map((x) => `<li>${inline(x.text)}</li>`).join('')}</ul>` : ''}
      ${tips.length
        ? tips
            .map(
              (t) => html`
                <div class="coach-tip">
                  <div class="ct-title">${t.title}${t.count > 1 ? ` <span class="ct-n">×${t.count}</span>` : ''}</div>
                  <p>${inline(t.text)}</p>
                  ${t.yours ? code('TU', t.yours) : ''}${t.better ? code('MEGLIO', t.better) : ''}
                </div>`,
            )
            .join('')
        : '<p class="coach-none">Niente da correggere: hai lavorato in modo pulito.</p>'}`;
  }

  /** Riempie i blocchi di codice dei consigli come testo (mai come HTML). */
  private fillCoachCode(node: HTMLElement): void {
    node.querySelectorAll<HTMLElement>('.cc-row').forEach((row) => {
      const tpl = row.querySelector('template')!;
      row.querySelector('pre')!.textContent = tpl.innerHTML.replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&gt;/g, '>');
      tpl.remove();
    });
  }

  private statsHtml(a: Analysis): string {
    const st = a.stats;
    const acc = st.commands ? Math.round(((st.commands - st.errors) / st.commands) * 100) : 100;
    return html`
      <div class="coach-stats">
        <div><b>${st.commands}</b><span>comandi</span></div>
        <div><b>${acc}%</b><span>senza errori</span></div>
        <div><b>${st.hints}</b><span>suggerimenti</span></div>
        <div><b>${st.wrong}</b><span>risposte sbagliate</span></div>
      </div>
      ${st.top.length ? `<p class="coach-top">I tuoi comandi più usati: ${st.top.map(([c, n]) => `<code>${c}</code> ${n}`).join(' · ')}</p>` : ''}`;
  }

  private showDebrief(chId: string): void {
    const ch = CHAPTERS.find((c) => c.id === chId);
    if (!ch) return;
    const a = this.missionAnalysis(ch.missions.map((m) => m.id));
    const perMission = ch.missions
      .map((m, i) => {
        const ma = this.missionAnalysis([m.id]);
        if (!ma) return '';
        const acc = ma.stats.commands ? Math.round(((ma.stats.commands - ma.stats.errors) / ma.stats.commands) * 100) : 100;
        return `<li><span>${ch.code}.${i + 1} ${inline(m.title)}</span><span class="dm-n">${ma.stats.commands} cmd · ${acc}% · ${ma.stats.hints} sugg.</span></li>`;
      })
      .join('');
    const body = a
      ? html`
          <div class="prose coach-intro">${renderMarkup(`@nyx: Ho riletto tutto quello che hai scritto in questo capitolo, comando per comando. Non ti giudico per il risultato, quello l'hai portato a casa. Ti dico **come** ci sei arrivato, e cosa ti farebbe lavorare meglio.`)}</div>
          ${this.statsHtml(a)}
          <h3 class="coach-h">Cosa fai bene e cosa migliorare</h3>
          ${this.coachHtml(a, 6)}
          ${perMission ? `<h3 class="coach-h">Missione per missione</h3><ul class="debrief-missions">${perMission}</ul>` : ''}
          <p class="coach-foot">L'analisi si basa sull'ultima volta che hai giocato ogni missione. Rigiocane una per migliorare il tuo debriefing.</p>`
      : '<p class="empty">Non ci sono ancora comandi registrati per questo capitolo: il debriefing si basa su ciò che scrivi nelle missioni da questa versione in poi. Rigioca una missione per vederlo.</p>';
    const node = this.page('debrief', `Debriefing · ${ch.title}`, `// capitolo ${ch.code}`, body);
    this.fillCoachCode(node);
  }

  private finishMission(): void {
    const r = this.run!;
    const first = !this.save.completed.includes(r.mission.id);
    this.rankBefore = rankFor(this.save.xp).name;
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
    const coach = this.missionAnalysis([m.id]);
    const node = el(html`
      <div class="screen complete">
        <div class="panel">
          <div class="kicker">${lastOfChapter ? `// capitolo ${ch.code} completato` : '// missione completata'}</div>
          <h2>${m.title}</h2>
          ${first ? `<div class="xp-gain">+${m.xp} XP</div>` : '<div class="xp-gain replay">ripasso completato</div>'}
          ${first && this.rankBefore && this.rankBefore !== rank.name ? `<div class="rank-up"><span>NUOVO RANGO</span><b>${rank.name}</b></div>` : ''}
          <div class="rank-now">Rango: <b>${rank.name}</b> · ${this.save.xp} XP</div>
          <h3>Cosa hai imparato</h3>
          <dl class="recap">
            ${m.recap.map(([k, v]) => `<div><dt>${inline(k)}</dt><dd>${inline(v)}</dd></div>`).join('')}
          </dl>
          ${coach ? `<h3>Il parere di Nyx sul tuo lavoro</h3><div class="coach">${this.coachHtml(coach, 3)}</div>` : ''}
          ${lastOfChapter ? `<button class="continue debrief-go" data-act="debrief"><span class="c-kicker">FINE CAPITOLO ${ch.code}</span><span class="c-title">Debriefing del capitolo ▸</span><span class="c-tag">L'analisi completa di come hai lavorato: statistiche, abitudini da tenere e da correggere.</span></button>` : ''}
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
      if (t?.dataset.act === 'debrief') this.showDebrief(ch.id);
    });
    this.fillCoachCode(node);
    this.mount('complete', node);
    if (first) this.countUp(node.querySelector('.xp-gain'), m.xp, '+', ' XP');
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
      <button class="opcard sim-card" data-g="sim">
        <span class="op-top"><span class="op-code">SEMPRE DIVERSE</span></span>
        <span class="op-title">Simulazioni</span>
        <span class="op-client">Sfide pratiche generate a caso sui capitoli che scegli, con tre livelli di difficoltà. Ogni partita ha dati nuovi.</span>
      </button>
      <button class="opcard sim-card" data-g="exams">
        <span class="op-top"><span class="op-code">A TEMPO · STILE CERTIFICAZIONE</span></span>
        <span class="op-title">Esami simulati</span>
        <span class="op-client">Teorico sui capitoli completati, finale su tutto il corso, prova pratica nel terminale. Punteggio, soglia di superamento e analisi degli errori.</span>
      </button>
      <button class="opcard" data-g="memory">
        <span class="op-top"><span class="op-code">OGNI GIORNO · 5 MINUTI</span></span>
        <span class="op-title">Memoria</span>
        <span class="op-client">Esercizi brevi per fissare comandi, opzioni e codici: scegli, ricomponi, scrivi. Le carte tornano poco prima che tu le dimentichi.</span>
      </button>
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
      if (id === 'exams') this.showExams();
      else if (id === 'memory') this.showMemory();
      else if (id === 'train') this.showTraining();
      else if (id === 'sim') this.showSimSetup();
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

  // ------------------------------------------------------------- esami simulati

  private showExams(): void {
    const node = this.page('exams', 'Esami simulati', '// metti alla prova ciò che sai', '<div class="train exams"></div>');
    renderExamsHome(node.querySelector<HTMLElement>('.exams')!, {
      save: this.save,
      persist: () => this.persist(),
      home: () => this.showExams(),
      map: () => this.showMap(),
      startPractical: () => {
        const chapters = CHAPTERS.filter((ch) => GENERATORS[ch.id]?.length && ch.missions.some((m) => this.save.completed.includes(m.id))).map((c) => c.id);
        if (chapters.length) this.startSim(chapters, 3, true);
      },
      timer: (id) => this.timers.push(id),
      enter: () => {
        this.screen = 'exam-run';
        this.root.scrollTop = 0;
      },
    });
  }

  // ------------------------------------------------------------- palestra della memoria

  private showMemory(): void {
    const node = this.page('memory', 'Memoria', '// allenamento quotidiano', '<div class="train memory"></div>');
    renderMemoryHome(node.querySelector<HTMLElement>('.memory')!, {
      save: this.save,
      persist: () => this.persist(),
      home: () => this.showMemory(),
      enter: () => {
        this.screen = 'memory-run';
        this.root.scrollTop = 0;
      },
    });
  }

  // ------------------------------------------------------------- simulazioni

  private showSimSetup(): void {
    this.sim = null;
    const avail = CHAPTERS.filter((ch) => GENERATORS[ch.id]?.length && ch.missions.some((m) => this.save.completed.includes(m.id)));
    if (!avail.length) {
      this.page('sim-setup', 'Simulazioni', '// sfide sempre diverse', '<p class="empty">Le simulazioni ripassano i capitoli che hai iniziato. Completa la prima missione e torna qui.</p>');
      return;
    }
    const prefs = this.save.sim;
    let chosen = new Set(prefs.chapters.filter((c) => avail.some((a) => a.id === c)));
    if (!chosen.size) chosen = new Set(avail.map((a) => a.id));
    let level: Level = prefs.level;
    const node = this.page(
      'sim-setup',
      'Simulazioni',
      '// sfide sempre diverse',
      html`
        <div class="prose"><p>Scegli cosa ripassare e la difficoltà. Il gioco genera sfide nuove ogni volta: indirizzi, nomi, file e risposte cambiano a ogni partita. Si risponde con <code>flag</code>, oppure facendo davvero il lavoro richiesto.</p></div>
        <h3>Capitoli</h3>
        <div class="chips">
          <button class="chip all" data-all="1">Tutti</button>
          ${avail.map((ch) => `<button class="chip" data-ch="${ch.id}"><b>${ch.code}</b> ${ch.title}</button>`).join('')}
        </div>
        <h3>Difficoltà</h3>
        <div class="levels">
          ${([1, 2, 3] as Level[])
            .map((lv) => {
              const L = LEVELS[lv];
              const desc = lv === 1 ? 'pochi dati, suggerimenti liberi' : lv === 2 ? 'più rumore, i suggerimenti dimezzano i punti' : 'tanti dati, nessun suggerimento';
              const best = this.save.best[`sim-${lv}`];
              return `<button class="level" data-lv="${lv}"><b>${L.name}</b><span>${L.count} sfide · ${desc}</span>${best !== undefined ? `<span class="rec">record: ${best}/${L.count}</span>` : ''}</button>`;
            })
            .join('')}
        </div>
        <div class="step-actions"><button class="next" data-go="1">Inizia ▸</button></div>`,
    );
    const sync = () => {
      node.querySelectorAll<HTMLElement>('[data-ch]').forEach((b) => b.classList.toggle('on', chosen.has(b.dataset.ch!)));
      node.querySelectorAll<HTMLElement>('[data-lv]').forEach((b) => b.classList.toggle('on', Number(b.dataset.lv) === level));
      node.querySelector<HTMLButtonElement>('[data-go]')!.disabled = chosen.size === 0;
    };
    node.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-ch],[data-lv],[data-all],[data-go]');
      if (!t) return;
      if (t.dataset.ch) {
        if (chosen.has(t.dataset.ch)) chosen.delete(t.dataset.ch);
        else chosen.add(t.dataset.ch);
      } else if (t.dataset.all) {
        chosen = chosen.size === avail.length ? new Set() : new Set(avail.map((a) => a.id));
      } else if (t.dataset.lv) level = Number(t.dataset.lv) as Level;
      else if (t.dataset.go && chosen.size) {
        this.save.sim = { chapters: [...chosen], level };
        this.persist();
        return this.startSim([...chosen], level);
      }
      sync();
    });
    sync();
  }

  private startSim(chapters: string[], level: Level, exam = false): void {
    const shell = buildWorld(this.save.handle!, () => this.simHint(true));
    const seed = (Date.now() ^ Math.floor(Math.random() * 2 ** 31)) >>> 0;
    const drills = generateSession(shell, chapters, level, seed);
    const term = new TerminalView(shell, (ev) => this.onSimEvents(ev));
    this.sim = { drills, idx: 0, level, chapters, results: [], hinted: drills.map(() => false), hintLevel: 0, term, shell, minimized: false, solvedNow: false, log: [], exam: exam ? { started: Date.now(), deadline: Date.now() + EXAMS.pratico.minutes * 60_000 } : null };
    term.system(exam ? `── ESAME · PROVA PRATICA · ${drills.length} sfide ──` : `── SIMULAZIONE · ${LEVELS[level].name.toUpperCase()} · ${drills.length} sfide ──`, 'banner');
    term.system('I file delle sfide sono nella cartella sim/. Le risposte si inviano con "flag".', 'info');
    const node = el(html`
      <div class="screen mission mode-task operation sim">
        <header class="topbar">
          <button class="iconbtn" data-act="back" aria-label="Esci dalla simulazione">◂</button>
          <div class="tb-title">
            <div class="tb-kicker">${exam ? 'ESAME · PROVA PRATICA' : `SIMULAZIONE · ${LEVELS[level].name.toUpperCase()}`}</div>
            <div class="tb-name">${exam ? `${EXAMS.pratico.count} sfide, ${EXAMS.pratico.minutes} minuti` : 'Sfide sempre diverse'}</div>
          </div>
          <div class="tb-xp sim-score"></div>
        </header>
        <div class="stepbar"><span></span></div>
        <section class="lesson"></section>
        <section class="term-area"></section>
      </div>`);
    node.querySelector('.term-area')!.appendChild(term.el);
    node.querySelector('[data-act="back"]')!.addEventListener('click', () => {
      if (confirm('Uscire dalla simulazione? I progressi di questa partita andranno persi.')) this.showSimSetup();
    });
    this.addManualButton(node);
    this.mount('sim', node);
    this.renderSim();
    if (exam) {
      term.system(`⏱ Prova d'esame: ${EXAMS.pratico.minutes} minuti, nessun suggerimento. Puoi saltare una sfida e andare avanti.`, 'info');
      this.timers.push(
        window.setInterval(() => {
          const st = this.sim;
          if (!st?.exam) return;
          this.updateSimScore();
          if (Date.now() >= st.exam.deadline) {
            st.term.system('⏱ Tempo scaduto.', 'err');
            while (st.results.length < st.drills.length) st.results.push('skip');
            this.finishSim();
          }
        }, 1000),
      );
    }
  }

  private renderSim(): void {
    const s = this.sim;
    const screen = this.root.querySelector<HTMLElement>('.screen.sim');
    if (!s || !screen) return;
    const d = s.drills[s.idx];
    const total = s.drills.length;
    const ok = s.results.filter((x) => x === 'ok').length;
    screen.querySelector<HTMLElement>('.stepbar span')!.style.width = `${(s.results.length / total) * 100}%`;
    void ok;
    this.updateSimScore();
    screen.classList.toggle('minimized', s.minimized);
    const chapter = CHAPTERS.find((c) => c.id === d.chapter);
    const rule = LEVELS[s.level].hints;
    const shown = d.hints.slice(0, s.hintLevel);
    const panel = screen.querySelector<HTMLElement>('.lesson')!;
    panel.innerHTML = html`
      <div class="step-head">
        <span class="step-kind k-task">SFIDA ${s.idx + 1}/${total}</span>
        <span class="step-num">cap ${chapter?.code ?? ''} · ${chapter?.title ?? ''}</span>
        <button class="iconbtn small" data-act="minimize" aria-label="Riduci pannello">${s.minimized ? '▾' : '▴'}</button>
      </div>
      <h2 class="step-title">${d.title}</h2>
      <div class="step-body">
        ${d.story ? `<div class="prose sim-story">${renderMarkup(d.story)}</div>` : ''}
        <div class="objective ${s.solvedNow ? 'complete' : ''}">
          <span class="o-label">${s.solvedNow ? '✔ RISOLTA' : '▶ OBIETTIVO'}</span>
          <span class="o-text">${renderMarkup(d.prompt)}</span>
        </div>
        ${shown.length ? `<ol class="hints">${shown.map((h) => `<li>${inline(h)}</li>`).join('')}</ol>` : ''}
      </div>
      <div class="step-actions">
        ${
          s.solvedNow
            ? ''
            : html`${rule !== 'none'
                ? `<button class="ghost" data-act="hint" ${s.hintLevel >= d.hints.length ? 'disabled' : ''}>Suggerimento${rule === 'cost' ? ' (−50%)' : ''}</button>`
                : ''}
              <button class="ghost" data-act="skip">Salta</button>
              <button class="ghost" data-act="terminal">Terminale ⌨</button>`
        }
      </div>`;
    annotateGlossary(panel.querySelector<HTMLElement>('.step-body')!, new Set());
    panel.onclick = (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act === 'hint') {
        this.simHint(false);
        this.renderSim();
      } else if (act === 'skip') {
        s.term.system(`↷ Sfida saltata. La soluzione sarà nel riepilogo finale.`, 'info');
        this.nextDrill('skip');
      } else if (act === 'terminal') {
        s.minimized = true;
        this.renderSim();
        s.term.focus();
      } else if (act === 'minimize') {
        s.minimized = !s.minimized;
        this.renderSim();
      }
    };
    if (!s.solvedNow && finePointer()) s.term.focus();
  }

  private updateSimScore(): void {
    const s = this.sim;
    const el = this.root.querySelector<HTMLElement>('.screen.sim .sim-score');
    if (!s || !el) return;
    const ok = s.results.filter((x) => x === 'ok').length;
    if (!s.exam) {
      el.textContent = `${ok}/${s.drills.length}`;
      return;
    }
    const left = Math.max(0, Math.round((s.exam.deadline - Date.now()) / 1000));
    el.textContent = `⏱ ${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
    el.classList.toggle('low', left <= 300);
  }

  private simHint(fromShell: boolean): string | null {
    const s = this.sim;
    if (!s || s.solvedNow) return null;
    const d = s.drills[s.idx];
    if (LEVELS[s.level].hints === 'none') return 'In modalità Difficile non ci sono suggerimenti. Puoi sempre usare "man" e "cheat".';
    const h = d.hints[Math.min(s.hintLevel, d.hints.length - 1)];
    if (s.hintLevel < d.hints.length) s.hintLevel++;
    s.hinted[s.idx] = true;
    if (!fromShell) s.log.push({ l: '', d: s.shell.cwd, s: s.idx, k: 'h' });
    if (fromShell) queueMicrotask(() => this.renderSim());
    return h;
  }

  private onSimEvents(events: ShellEvent[]): void {
    const s = this.sim;
    if (!s || s.solvedNow) return;
    const d = s.drills[s.idx];
    let solved = false;
    for (const ev of events) {
      if (ev.type === 'answer') {
        if (!d.answer) {
          s.term.system('Questa sfida non chiede una risposta: va fatto il lavoro richiesto.', 'info');
          continue;
        }
        const v = normalizeDrillAnswer(ev.value);
        if (d.answer.some((a) => normalizeDrillAnswer(a) === v)) solved = true;
        else s.term.system('✘ Risposta non corretta, riprova.', 'err');
      } else if (d.check?.(ev, s.shell)) solved = true;
    }
    if (!solved && d.state && events.length) {
      try {
        solved = d.state(s.shell);
      } catch {
        solved = false;
      }
    }
    const wrong = !solved && events.some((ev) => ev.type === 'answer') && !!d.answer;
    const entry = entryOf(s.shell, s.idx, solved ? 'pass' : wrong ? 'wrong-answer' : null, events);
    if (entry) s.log.push(entry);
    if (!solved) return;
    s.solvedNow = true;
    s.term.system(`✔ SFIDA RISOLTA (${s.idx + 1}/${s.drills.length})`, 'ok');
    this.renderSim();
    setTimeout(() => this.nextDrill('ok'), 1100);
  }

  private nextDrill(result: 'ok' | 'skip'): void {
    const s = this.sim;
    if (!s) return;
    s.results.push(result);
    s.idx++;
    s.hintLevel = 0;
    s.solvedNow = false;
    s.minimized = false;
    if (s.idx >= s.drills.length) return this.finishSim();
    s.term.system(`── SFIDA ${s.idx + 1}/${s.drills.length}: ${s.drills[s.idx].title.toUpperCase()} ──`, 'banner');
    this.renderSim();
  }

  private finishSim(): void {
    const s = this.sim!;
    const L = LEVELS[s.level];
    const ok = s.results.filter((r) => r === 'ok').length;
    let xp = 0;
    s.results.forEach((r, i) => {
      if (r === 'ok') xp += L.hints === 'cost' && s.hinted[i] ? L.xp / 2 : L.xp;
    });
    xp = Math.round(xp);
    const key = `sim-${s.level}`;
    const record = ok > 0 && (this.save.best[key] === undefined || ok > this.save.best[key]);
    if (record && !s.exam) this.save.best[key] = ok;
    const ex = s.exam;
    const pct = Math.round((ok / s.drills.length) * 100);
    const passed = pct >= EXAMS.pratico.pass;
    if (ex) {
      const secs = Math.min(EXAMS.pratico.minutes * 60, Math.round((Date.now() - ex.started) / 1000));
      recordExam(this.save, { kind: 'pratico', day: today(), score: ok, total: s.drills.length, pct, passed, secs });
      if (passed) xp += 50;
    }
    this.save.xp += xp;
    this.persist();
    const rows = s.drills
      .map((d, i) => {
        const res = s.results[i];
        return html`
          <li class="finding ${res === 'ok' ? 'ok' : ''}">
            <span class="f-mark">${res === 'ok' ? '✔' : '✘'}</span>
            <div class="f-body">
              <div class="f-title">${d.title}</div>
              ${res !== 'ok'
                ? `<div class="f-explain"><p>Una soluzione possibile:</p><pre class="code">${d.solve.map((c) => c.replace(/[&<>]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[x]!)).join('\n')}</pre>${d.answer ? `<p>Risposta: <code>${inline(d.answer[0]).replace(/<\/?code>/g, '')}</code></p>` : ''}</div>`
                : ''}
            </div>
          </li>`;
      })
      .join('');
    const coach = s.log.some((e) => e.l) ? analyze(s.log, s.drills.length, 7) : null;
    const node = el(html`
      <div class="screen complete">
        <div class="panel">
          <div class="kicker">${ex ? '// esame · prova pratica' : `// simulazione · ${L.name}`}</div>
          ${ex ? `<div class="ex-verdict ${passed ? 'ok' : 'ko'}">${passed ? 'SUPERATA' : 'NON SUPERATA'}</div>` : ''}
          <h2>${ok}/${s.drills.length} sfide risolte${ex ? ` · ${pct}%` : ''}</h2>
          <div class="xp-gain">+${xp} XP</div>
          <div class="rank-now">${ex ? `Soglia ${EXAMS.pratico.pass}%. Le sfide non risolte hanno la soluzione qui sotto: provale di nuovo nelle Simulazioni.` : record ? 'Nuovo record personale per questo livello!' : this.save.best[key] !== undefined ? `Record: ${this.save.best[key]}/${s.drills.length}` : 'Riprova: ogni partita è diversa.'}</div>
          <ol class="findings">${rows}</ol>
          ${coach ? `<h3>Il parere di Nyx sul tuo lavoro</h3>${this.statsHtml(coach)}<div class="coach">${this.coachHtml(coach, 4)}</div>` : ''}
          <div class="step-actions">
            <button class="ghost" data-act="setup">${ex ? 'Esami' : 'Impostazioni'}</button>
            <button class="next" data-act="again">${ex ? 'Un\'altra prova ▸' : 'Nuova partita ▸'}</button>
          </div>
        </div>
      </div>`);
    const chapters = s.chapters;
    const level = s.level;
    this.sim = null;
    node.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act === 'setup') (ex ? this.showExams() : this.showSimSetup());
      if (act === 'again') this.startSim(chapters, level, !!ex);
    });
    this.fillCoachCode(node);
    this.mount('sim-done', node);
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

  private showCodex(tab: 'glossario' | 'riepiloghi' = 'glossario'): void {
    const done = allMissions().filter((m) => this.save.completed.includes(m.id));
    const recaps = done.length
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
      : `<p class="empty">Qui trovi il riepilogo di ogni missione completata: comandi e concetti. Completa la prima missione per sbloccare le prime voci.</p>`;
    const content = html`
      <div class="codex-tabs">
        <button class="${tab === 'glossario' ? 'on' : ''}" data-tab="glossario">Glossario</button>
        <button class="${tab === 'riepiloghi' ? 'on' : ''}" data-tab="riepiloghi">Riepiloghi delle missioni</button>
      </div>
      ${tab === 'glossario'
        ? `<p class="codex-note">Tutti i termini tecnici del corso, spiegati in parole semplici. Nelle lezioni i termini <span class="gl">sottolineati così</span> si possono toccare per leggere la spiegazione al volo.</p>${glossaryHtml()}`
        : recaps}`;
    const node = this.page('codex', 'Codex', '// glossario e comandi', content);
    bindGlossarySearch(node);
    node.querySelector('.codex-tabs')!.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]')?.dataset.tab as 'glossario' | 'riepiloghi' | undefined;
      if (t && t !== tab) this.showCodex(t);
    });
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
      <div class="prose">${renderMarkup(CAREER.advice)}</div>
      <h3 id="trucchi">Trucchi del mestiere</h3>
      ${['Terminale', 'Metodo', 'Studio', 'Lavoro', 'Sicurezza personale']
        .map(
          (a) => html`
            <section class="phase">
              <h3 class="sub">${a}</h3>
              <ul class="res">${TIPS.filter((t) => t.area === a)
                .map((t) => `<li><span class="tip-li">${inline(t.text)}</span></li>`)
                .join('')}</ul>
            </section>`,
        )
        .join('')}`;
    this.page('career', 'Carriera', '// dal gioco al lavoro', content);
  }

  private cloudHtml(): string {
    const cfg = loadCloud();
    const web = 'https://xhasher.github.io/Netrunning_APP/';
    if (cfg) {
      const when = cfg.lastSync ? new Date(cfg.lastSync).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : 'mai';
      const err = cfg.lastError ? `<p class="small cloud-err">${cfg.lastError === 'auth' ? 'Il token non è più valido: scollega e collega di nuovo con un token nuovo.' : inline(cfg.lastError)}</p>` : '';
      return html`
        <p>Collegato a GitHub come <b>${cfg.login ?? '...'}</b>. Ultima sincronizzazione: ${when}.</p>
        ${err}
        <p class="small">I progressi si sincronizzano da soli all'avvio, qualche secondo dopo ogni salvataggio e quando chiudi l'app. Versione da browser: <a href="${web}" target="_blank" rel="noopener">${web}</a></p>
        <div class="step-actions">
          <button class="ghost" data-act="cloud-sync">Sincronizza ora</button>
          <button class="ghost" data-act="cloud-off">Scollega</button>
        </div>`;
    }
    return html`
      <p class="small">Puoi giocare anche dal PC, nel browser, all'indirizzo <a href="${web}" target="_blank" rel="noopener">${web}</a>. Per avere gli stessi progressi su telefono e PC, collega su entrambi lo stesso account GitHub (gratuito): il gioco salva i progressi in un tuo <b>Gist privato</b>, un piccolo file nel tuo account. Nessun altro server, nessun dato altrove.</p>
      <details class="mem-how">
        <summary>Come ottenere il token (una volta sola, 2 minuti)</summary>
        <div class="prose">
          <ol>
            <li>Su github.com, accedi e apri <b>Settings</b> (dal menu della tua foto) → <b>Developer settings</b> → <b>Personal access tokens</b> → <b>Tokens (classic)</b>.</li>
            <li>Tocca <b>Generate new token (classic)</b>. Nome: <code>Netrunning</code>. Scadenza: quella che preferisci.</li>
            <li>Spunta <b>solo</b> la casella <b>gist</b>. Nient'altro: così il token può toccare solo i Gist, non i tuoi repository.</li>
            <li>Tocca <b>Generate token</b> e copia il codice (inizia con <code>ghp_</code>). GitHub te lo mostra una volta sola.</li>
            <li>Incollalo qui sotto, su <b>ogni</b> dispositivo (telefono e PC). Puoi usare lo stesso token.</li>
          </ol>
          <p>Il token resta salvato solo sul dispositivo. Trattalo come una password: non condividerlo. Se lo perdi o temi che qualcuno l'abbia visto, cancellalo da GitHub e creane uno nuovo.</p>
        </div>
      </details>
      <input class="mem-input code cloud-token" type="password" placeholder="ghp_..." autocapitalize="off" autocomplete="off" spellcheck="false" />
      <div class="step-actions"><button class="next" data-act="cloud-connect">Collega e sincronizza</button></div>
      <p class="small">Se su GitHub ci sono già progressi (da un altro dispositivo), vengono <b>uniti</b> a quelli di qui: missioni, XP, Memoria ed esami si sommano, niente va perso.</p>`;
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
        <h3>Allenare la memoria</h3>
        <label class="toggle">
          <input type="checkbox" data-act="hideknown" ${this.save.hideKnown ? 'checked' : ''} />
          <span>Nei compiti, nascondi i comandi che hai già usato (si vedono toccandoli)</span>
        </label>
        <p class="small">Comandi che conosci: ${this.save.known.filter((k) => MANPAGES[k]).length}</p>
      </section>
      <section class="setting">
        <h3>Effetti visivi</h3>
        <label class="toggle">
          <input type="checkbox" data-act="effects" ${this.save.effects !== false ? 'checked' : ''} />
          <span>Transizioni e animazioni (si spengono da sole se il telefono è impostato per ridurre il movimento)</span>
        </label>
      </section>
      <section class="setting cloud">
        <h3>Gioca su più dispositivi</h3>
        ${this.cloudHtml()}
        <div class="cloud-msg small" aria-live="polite"></div>
      </section>
      <section class="setting">
        <h3>Backup dei progressi</h3>
        <p class="small">Il codice contiene i tuoi progressi e i file del deck. Copialo e conservalo (un messaggio a te stesso, un file di note): se dovrai reinstallare l'app, lo incolli qui e riparti da dove eri.</p>
        <div class="step-actions">
          <button class="ghost" data-act="backup-show">Mostra codice</button>
          <button class="ghost" data-act="backup-restore">Ripristina da codice</button>
        </div>
        <textarea class="backup-box" rows="5" placeholder="Il codice appare qui. Per ripristinare, incollalo qui e tocca «Ripristina da codice»." spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
        <div class="backup-msg small" aria-live="polite"></div>
      </section>
      <section class="setting">
        <h3>Recupera progressi</h3>
        <p class="small">Hai cambiato versione dell'app e riparti da zero? Segna come già svolti i capitoli che hai completato prima. Ricevi gli XP corrispondenti e le Operazioni collegate si sbloccano.</p>
        <div class="font-row">
          <select class="skip-select" aria-label="Capitoli già completati">
            ${CHAPTERS.map((ch) => `<option value="${ch.id}">Fino al capitolo ${ch.code} · ${ch.title}</option>`).join('')}
          </select>
          <button class="ghost" data-act="skip-to">Segna</button>
        </div>
      </section>
      <section class="setting">
        <h3>Profilo</h3>
        <p>Handle: <b>${this.save.handle}</b> · ${this.save.xp} XP · ${this.save.completed.length} missioni completate</p>
        <button class="danger" data-act="reset">Cancella tutti i progressi</button>
      </section>
      <section class="setting">
        <h3>Informazioni</h3>
        <p class="small">Night City Netrunning v${__APP_VERSION__} · corso di ethical hacking in italiano. Tutti i sistemi, le reti e i personaggi del gioco sono simulati o inventati. Le conoscenze di sicurezza vanno usate solo su sistemi propri o con autorizzazione scritta.</p>
      </section>`;
    const node = this.page('settings', 'Opzioni', '// impostazioni', content);
    node.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act === 'hideknown') {
        this.save.hideKnown = (e.target as HTMLInputElement).checked;
        this.persist();
        return;
      }
      if (act === 'cloud-connect' || act === 'cloud-sync') {
        const msgEl = node.querySelector<HTMLElement>('.cloud-msg')!;
        let cfg = loadCloud();
        if (act === 'cloud-connect') {
          const token = node.querySelector<HTMLInputElement>('.cloud-token')!.value.trim();
          if (!/^(ghp_|github_pat_)\w{20,}/.test(token)) {
            msgEl.textContent = 'Il token non sembra valido: deve iniziare con ghp_ (classico) o github_pat_ (a grana fine).';
            return;
          }
          cfg = { token };
        }
        if (!cfg) return;
        msgEl.textContent = 'Sincronizzazione in corso...';
        void this.syncNow(false, { ...cfg, lastError: undefined }).then((m) => {
          if (this.screen !== 'settings') return;
          this.showSettings();
          const el2 = this.root.querySelector<HTMLElement>('.cloud-msg');
          if (el2) el2.textContent = m;
          this.root.querySelector('.cloud')?.scrollIntoView({ block: 'start' });
        });
        return;
      }
      if (act === 'cloud-off') {
        if (!confirm('Scollegare questo dispositivo dal salvataggio nel cloud? I progressi restano sia qui sia su GitHub.')) return;
        saveCloud(null);
        this.showSettings();
        return;
      }
      if (act === 'effects') {
        this.save.effects = (e.target as HTMLInputElement).checked;
        this.persist();
        this.applyFx();
        return;
      }
      const box = node.querySelector<HTMLTextAreaElement>('.backup-box')!;
      const msg = node.querySelector<HTMLElement>('.backup-msg')!;
      if (act === 'backup-show') {
        this.persistDeck();
        const code = makeBackup(this.save, this.deckData() ?? loadDeck());
        box.value = code;
        box.select();
        let copied = false;
        try {
          void navigator.clipboard?.writeText(code);
          copied = !!navigator.clipboard;
        } catch {
          copied = false;
        }
        msg.textContent = copied ? 'Codice copiato negli appunti. Incollalo in un posto sicuro.' : 'Seleziona tutto il testo e copialo in un posto sicuro.';
        return;
      }
      if (act === 'backup-restore') {
        const parsed = parseBackup(box.value);
        if (!parsed) {
          msg.textContent = 'Codice non valido: incollalo per intero, deve iniziare con NCB1:';
          return;
        }
        if (!confirm(`Ripristinare il backup di «${parsed.save.handle ?? '?'}» (${parsed.save.xp} XP, ${parsed.save.completed.length} missioni)? I progressi attuali verranno sostituiti.`)) return;
        this.save = parsed.save;
        this.persist();
        if (parsed.deck && typeof parsed.deck === 'object') saveDeck(parsed.deck);
        this.shell = null;
        this.term = null;
        this.applyFont();
        this.showMap();
        return;
      }
      if (act === 'skip-to') {
        const upTo = node.querySelector<HTMLSelectElement>('.skip-select')!.value;
        const idx = CHAPTERS.findIndex((c) => c.id === upTo);
        const missions = CHAPTERS.slice(0, idx + 1).flatMap((c) => c.missions).filter((m) => !this.save.completed.includes(m.id));
        if (!missions.length) {
          msg.textContent = 'Quei capitoli risultano già completati.';
          return;
        }
        if (!confirm(`Segnare come completate ${missions.length} missioni? Riceverai ${missions.reduce((a, m) => a + m.xp, 0)} XP.`)) return;
        for (const m of missions) {
          this.save.completed.push(m.id);
          this.save.xp += m.xp;
          delete this.save.progress[m.id];
        }
        this.persist();
        this.showMap();
        return;
      }
      if (act === 'font+' || act === 'font-') {
        const v = Math.round((this.save.fontScale + (act === 'font+' ? 0.1 : -0.1)) * 10) / 10;
        this.save.fontScale = Math.min(1.6, Math.max(0.8, v));
        this.persist();
        this.applyFont();
        node.querySelector('.font-val')!.textContent = `${Math.round(this.save.fontScale * 100)}%`;
      } else if (act === 'reset') {
        const cloudOn = !!loadCloud();
        if (confirm(`Vuoi davvero cancellare tutti i progressi? Non si può annullare.${cloudOn ? '\n\nQuesto dispositivo verrà anche scollegato dal salvataggio nel cloud (che resta su GitHub): se lo ricolleghi, i progressi del cloud torneranno.' : ''}`)) {
          if (cloudOn) saveCloud(null);
          clearSave();
          clearDeck();
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
