// Il terminale a schermo: output, riga di input, cronologia, TAB e tasti rapidi.

import type { Shell } from '../engine/shell';
import type { Line, ShellEvent } from '../engine/types';

const QUICK_KEYS: { label: string; insert?: string; action?: 'tab' | 'up' | 'down' | 'enter'; wide?: boolean }[] = [
  { label: 'TAB', action: 'tab', wide: true },
  { label: '↑', action: 'up' },
  { label: '↓', action: 'down' },
  { label: '/', insert: '/' },
  { label: '-', insert: '-' },
  { label: '.', insert: '.' },
  { label: '~', insert: '~' },
  { label: '|', insert: '|' },
  { label: '"', insert: '"' },
  { label: '{', insert: '{' },
  { label: '}', insert: '}' },
  { label: '⏎', action: 'enter', wide: true },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class TerminalView {
  readonly el: HTMLElement;
  private out: HTMLElement;
  private inputLine: HTMLElement;
  private promptEl: HTMLElement;
  private input: HTMLInputElement;
  private histIdx = -1;
  private draft = '';
  private busy = false;

  constructor(
    private shell: Shell,
    private onEvents: (events: ShellEvent[]) => void,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'terminal';
    this.el.innerHTML = `
      <div class="term-scroll" role="log" aria-live="polite">
        <div class="term-out"></div>
        <label class="term-line">
          <span class="prompt"></span>
          <input class="term-in" type="text" inputmode="text" autocomplete="off" autocorrect="off"
            autocapitalize="off" spellcheck="false" enterkeyhint="send" aria-label="Comando" />
        </label>
      </div>
      <div class="quickkeys"></div>`;
    this.out = this.el.querySelector('.term-out')!;
    this.inputLine = this.el.querySelector('.term-line')!;
    this.promptEl = this.el.querySelector('.prompt')!;
    this.input = this.el.querySelector('.term-in')!;
    this.updatePrompt();

    const qk = this.el.querySelector('.quickkeys')!;
    for (const k of QUICK_KEYS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = k.label;
      if (k.wide) b.classList.add('wide');
      // pointerdown + preventDefault: il campo non perde il focus e la tastiera resta aperta
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (k.insert) this.insertText(k.insert);
        else if (k.action === 'tab') this.tab();
        else if (k.action === 'up') this.historyMove(-1);
        else if (k.action === 'down') this.historyMove(1);
        else if (k.action === 'enter') void this.submit();
      });
      qk.appendChild(b);
    }

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void this.submit();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.tab();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.historyMove(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.historyMove(1);
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        this.out.innerHTML = '';
      } else if (e.key === 'c' && e.ctrlKey && this.input.selectionStart === this.input.selectionEnd) {
        // Ctrl+C senza selezione: annulla la riga, come in bash
        e.preventDefault();
        this.echo(this.input.value + '^C');
        this.input.value = '';
      }
    });

    this.el.querySelector('.term-scroll')!.addEventListener('click', () => {
      if (!window.getSelection()?.toString()) this.focus();
    });
  }

  focus(): void {
    this.input.focus({ preventScroll: true });
  }

  updatePrompt(): void {
    const sh = this.shell;
    this.promptEl.innerHTML = '';
    const parts: [string, string][] = [
      [`${sh.user}@${sh.host}`, 'p-user'],
      [':', 'p-sep'],
      [sh.promptPath(), 'p-path'],
      ['$', 'p-sep'],
    ];
    for (const [t, c] of parts) {
      const s = document.createElement('span');
      s.className = c;
      s.textContent = t;
      this.promptEl.appendChild(s);
    }
  }

  private scrollToEnd(): void {
    const sc = this.el.querySelector('.term-scroll')!;
    sc.scrollTop = sc.scrollHeight;
  }

  private addLine(text: string, cls = 'out'): HTMLElement {
    const div = document.createElement('div');
    div.className = `tl ${cls}`;
    div.textContent = text === '' ? ' ' : text;
    this.out.appendChild(div);
    return div;
  }

  /** Mostra la riga digitata, con il prompt, nell'output. */
  private echo(cmd: string): void {
    const div = document.createElement('div');
    div.className = 'tl cmd';
    div.appendChild(this.promptEl.cloneNode(true));
    div.appendChild(document.createTextNode(' ' + cmd));
    this.out.appendChild(div);
  }

  async print(lines: Line[]): Promise<void> {
    for (const l of lines) {
      if (l.delay) {
        this.scrollToEnd();
        await sleep(l.delay);
      }
      this.addLine(l.text, l.cls);
    }
    this.scrollToEnd();
  }

  /** Messaggio del gioco (non del finto Linux). */
  system(text: string, cls: 'ok' | 'err' | 'info' | 'banner' = 'info'): void {
    this.addLine(text, `sys ${cls}`);
    this.scrollToEnd();
  }

  clear(): void {
    this.out.innerHTML = '';
  }

  private insertText(t: string): void {
    const i = this.input;
    const start = i.selectionStart ?? i.value.length;
    const end = i.selectionEnd ?? i.value.length;
    i.value = i.value.slice(0, start) + t + i.value.slice(end);
    i.setSelectionRange(start + t.length, start + t.length);
    this.focus();
  }

  private tab(): void {
    const { line, options } = this.shell.complete(this.input.value);
    if (options.length > 1) {
      this.echo(this.input.value);
      this.addLine(options.join('   '), 'dim');
      this.scrollToEnd();
    }
    this.input.value = line;
    this.input.setSelectionRange(line.length, line.length);
    this.focus();
  }

  private historyMove(dir: -1 | 1): void {
    const h = this.shell.history;
    if (!h.length) return;
    if (this.histIdx === -1) {
      if (dir === 1) return;
      this.draft = this.input.value;
      this.histIdx = h.length - 1;
    } else {
      this.histIdx += dir;
    }
    if (this.histIdx >= h.length) {
      this.histIdx = -1;
      this.input.value = this.draft;
    } else {
      this.histIdx = Math.max(0, this.histIdx);
      this.input.value = h[this.histIdx];
    }
    const n = this.input.value.length;
    this.input.setSelectionRange(n, n);
    this.focus();
  }

  async submit(): Promise<void> {
    if (this.busy) return;
    const cmd = this.input.value;
    this.input.value = '';
    this.histIdx = -1;
    this.echo(cmd);
    this.busy = true;
    this.inputLine.classList.add('busy');
    try {
      const res = this.shell.run(cmd);
      if (res.clear) this.clear();
      await this.print(res.lines);
      this.updatePrompt();
      this.onEvents(res.events);
    } finally {
      this.busy = false;
      this.inputLine.classList.remove('busy');
      this.scrollToEnd();
    }
  }

  /** Usato dai test automatici e dai pulsanti "prova questo comando". */
  async type(cmd: string): Promise<void> {
    this.input.value = cmd;
    await this.submit();
  }
}
