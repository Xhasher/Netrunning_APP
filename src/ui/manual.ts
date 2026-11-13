// Il Manuale in app: elenco per categoria con ricerca, e scheda dettagliata di ogni comando.

import '../engine/manual';
import { MANPAGES, type ManPage } from '../engine/manpages';
import { inline } from './markup';

const ORDER = ['Navigazione e file', 'Testo e log', 'Permessi e utenti', 'Processi e sistema', 'Rete', 'Sicurezza e analisi', 'Script e shell', 'Gioco'];

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function listHtml(query: string): string {
  const q = query.trim().toLowerCase();
  const pages = Object.values(MANPAGES).filter((p) => p.description?.length && (!q || p.name.includes(q) || p.short.toLowerCase().includes(q) || (p.cat ?? '').toLowerCase().includes(q)));
  if (!pages.length) return '<p class="empty">Nessun comando corrisponde. Prova con un\'altra parola.</p>';
  const cats = [...new Set([...ORDER, ...pages.map((p) => p.cat ?? 'Altro')])];
  return cats
    .map((cat) => {
      const items = pages.filter((p) => (p.cat ?? 'Altro') === cat).sort((a, b) => a.name.localeCompare(b.name));
      if (!items.length) return '';
      return `<section class="man-cat"><h3>${esc(cat)}</h3>${items
        .map((p) => `<button class="man-item" data-cmd="${esc(p.name)}"><b>${esc(p.name)}</b><span>${esc(p.short)}</span></button>`)
        .join('')}</section>`;
    })
    .join('');
}

function pageHtml(p: ManPage): string {
  const parts: string[] = [];
  parts.push(`<h2 class="man-title">${esc(p.name)}</h2><p class="man-short">${esc(p.short)}</p>`);
  parts.push(`<pre class="code">${esc(p.synopsis)}</pre>`);
  parts.push('<h3>Come funziona</h3>' + p.description.map((d) => `<p>${inline(d)}</p>`).join(''));
  if (p.options?.length) parts.push('<h3>Opzioni</h3><dl class="man-opts">' + p.options.map(([o, d]) => `<div><dt><code>${esc(o)}</code></dt><dd>${inline(d)}</dd></div>`).join('') + '</dl>');
  if (p.examples?.length)
    parts.push(
      '<h3>Esempi <small>(toccali per copiarli, provali nel Terminale libero)</small></h3><ul class="man-ex">' +
        p.examples.map(([c, d]) => `<li><button class="man-cmd" data-copy="${esc(c)}"><code>${esc(c)}</code></button><span>${inline(d)}</span></li>`).join('') +
        '</ul>',
    );
  if (p.notes?.length) parts.push('<h3>Da sapere</h3><ul class="man-notes">' + p.notes.map((n) => `<li>${inline(n)}</li>`).join('') + '</ul>');
  if (p.see?.length) parts.push('<h3>Vedi anche</h3><div class="chips">' + p.see.filter((s) => MANPAGES[s]).map((s) => `<button class="chip" data-cmd="${esc(s)}">${esc(s)}</button>`).join('') + '</div>');
  return parts.join('');
}

/** Apre il Manuale a tutto schermo, sopra qualsiasi schermata (non perde lo stato della missione). */
export function openManual(start?: string): void {
  document.querySelector('.manual-sheet')?.remove();
  const ov = document.createElement('div');
  ov.className = 'manual-sheet';
  ov.innerHTML = `
    <header class="topbar">
      <button class="iconbtn" data-m="back" aria-label="Indietro">◂</button>
      <div class="tb-title"><div class="tb-kicker">// consulta</div><div class="tb-name man-head">Manuale</div></div>
      <button class="iconbtn" data-m="close" aria-label="Chiudi il manuale">✕</button>
    </header>
    <div class="man-search"><input type="search" placeholder="Cerca un comando o un argomento…" autocapitalize="off" autocomplete="off" spellcheck="false" aria-label="Cerca nel manuale" /></div>
    <div class="man-body"></div>`;
  const body = ov.querySelector<HTMLElement>('.man-body')!;
  const head = ov.querySelector<HTMLElement>('.man-head')!;
  const search = ov.querySelector<HTMLInputElement>('.man-search')!;
  const input = search.querySelector('input')!;
  const history: string[] = [];
  let current: string | null = null;

  const showList = () => {
    current = null;
    head.textContent = 'Manuale';
    search.style.display = '';
    body.innerHTML = listHtml(input.value);
    body.scrollTop = 0;
  };
  const showPage = (name: string, push = true) => {
    const p = MANPAGES[name];
    if (!p) return;
    if (push && current) history.push(current);
    current = name;
    head.textContent = name;
    search.style.display = 'none';
    body.innerHTML = pageHtml(p);
    body.scrollTop = 0;
  };

  input.addEventListener('input', () => {
    if (!current) body.innerHTML = listHtml(input.value);
  });
  ov.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const copy = t.closest<HTMLElement>('[data-copy]');
    if (copy) {
      const text = copy.dataset.copy!;
      try {
        void navigator.clipboard?.writeText(text);
      } catch {
        /* ignora */
      }
      copy.classList.add('copied');
      setTimeout(() => copy.classList.remove('copied'), 900);
      return;
    }
    const cmd = t.closest<HTMLElement>('[data-cmd]');
    if (cmd) return showPage(cmd.dataset.cmd!);
    const m = t.closest<HTMLElement>('[data-m]')?.dataset.m;
    if (m === 'close') ov.remove();
    else if (m === 'back') {
      if (current && history.length) showPage(history.pop()!, false);
      else if (current) showList();
      else ov.remove();
    }
  });
  document.body.appendChild(ov);
  if (start && MANPAGES[start]) showPage(start);
  else showList();
}
