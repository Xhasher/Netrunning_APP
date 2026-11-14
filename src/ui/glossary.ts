// Glossario attivo: nelle lezioni la prima occorrenza di ogni termine tecnico diventa
// toccabile e mostra la definizione in una finestrella in basso.

import { GLOSSARY, type GlossaryEntry } from '../content/glossary';

const byForm = new Map<string, GlossaryEntry>();
for (const e of GLOSSARY) for (const f of [e.term, ...(e.aliases ?? [])]) byForm.set(f.toLowerCase(), e);

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const FORMS = [...byForm.keys()].sort((a, b) => b.length - a.length);
const RE = new RegExp(`(?<![\\p{L}\\p{N}_&/.-])(${FORMS.map(escRe).join('|')})(?![\\p{L}\\p{N}_/-])`, 'giu');

const SKIP = new Set(['CODE', 'PRE', 'BUTTON', 'A', 'H1', 'H2', 'H3', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'DT']);

function matches(text: string, entry: GlossaryEntry): boolean {
  if (!entry.exact) return true;
  return [entry.term, ...(entry.aliases ?? [])].includes(text);
}

/**
 * Rende toccabili i termini del glossario dentro root.
 * seen: termini già evidenziati (per non ripeterli nella stessa missione).
 */
export function annotateGlossary(root: HTMLElement, seen: Set<string>): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      for (let p = n.parentElement; p && p !== root; p = p.parentElement) if (SKIP.has(p.tagName) || p.classList.contains('gl') || p.classList.contains('ispoiler') || p.classList.contains('spoiler') || p.classList.contains('objective')) return NodeFilter.FILTER_REJECT;
      return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (let node of nodes) {
    let text = node.nodeValue ?? '';
    RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = RE.exec(text))) {
      const entry = byForm.get(m[1].toLowerCase());
      if (!entry || seen.has(entry.term) || !matches(m[1], entry)) continue;
      seen.add(entry.term);
      const after = node.splitText(m.index);
      const rest = after.splitText(m[1].length);
      const span = document.createElement('span');
      span.className = 'gl';
      span.setAttribute('role', 'button');
      span.tabIndex = 0;
      span.dataset.gl = entry.term;
      span.textContent = after.nodeValue;
      after.replaceWith(span);
      node = rest;
      text = rest.nodeValue ?? '';
      RE.lastIndex = 0;
    }
  }
}

let pop: HTMLElement | null = null;

function closePop(): void {
  pop?.remove();
  pop = null;
}

export function showDefinition(term: string): void {
  const e = GLOSSARY.find((x) => x.term === term);
  if (!e) return;
  closePop();
  pop = document.createElement('div');
  pop.className = 'gl-pop';
  pop.setAttribute('role', 'dialog');
  const t = document.createElement('div');
  t.className = 'gl-term';
  t.textContent = e.term;
  const d = document.createElement('p');
  d.textContent = e.def;
  const x = document.createElement('button');
  x.className = 'gl-x';
  x.setAttribute('aria-label', 'Chiudi');
  x.textContent = '✕';
  x.onclick = closePop;
  pop.append(x, t, d);
  document.body.appendChild(pop);
}

let installed = false;
/** Un solo gestore per tutta l'app: tocco su un termine = definizione; tocco altrove = chiude. */
export function installGlossary(): void {
  if (installed) return;
  installed = true;
  document.addEventListener(
    'click',
    (ev) => {
      const t = (ev.target as HTMLElement).closest<HTMLElement>('.gl');
      if (t?.dataset.gl) {
        ev.stopPropagation();
        showDefinition(t.dataset.gl);
        return;
      }
      if (pop && !(ev.target as HTMLElement).closest('.gl-pop')) closePop();
    },
    true,
  );
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement;
    if ((ev.key === 'Enter' || ev.key === ' ') && t.classList?.contains('gl') && t.dataset.gl) {
      ev.preventDefault();
      showDefinition(t.dataset.gl);
    }
    if (ev.key === 'Escape') closePop();
  });
}

/** Pagina del glossario completo, con ricerca. */
export function glossaryHtml(): string {
  const list = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term, 'it', { sensitivity: 'base' }));
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  return `<input class="mem-input gl-search" type="search" placeholder="Cerca un termine..." autocapitalize="off" autocomplete="off" spellcheck="false" />
    <dl class="recap gl-list">${list.map((e) => `<div data-q="${esc((e.term + ' ' + (e.aliases ?? []).join(' ') + ' ' + e.def).toLowerCase())}"><dt>${esc(e.term)}</dt><dd>${esc(e.def)}</dd></div>`).join('')}</dl>`;
}

export function bindGlossarySearch(root: HTMLElement): void {
  const input = root.querySelector<HTMLInputElement>('.gl-search');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    root.querySelectorAll<HTMLElement>('.gl-list > div').forEach((d) => {
      d.style.display = q && !d.dataset.q!.includes(q) ? 'none' : '';
    });
  });
}
