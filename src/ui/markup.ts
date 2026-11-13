// Trasforma il mini-markdown delle lezioni in HTML (vedi game/types.ts).

const SPEAKERS: Record<string, { name: string; cls: string }> = {
  nyx: { name: 'NYX', cls: 'nyx' },
  rook: { name: 'ROOK', cls: 'rook' },
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function inline(s: string): string {
  const html = escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // *corsivo*: solo fuori dal codice e solo se gli asterischi sono attaccati alle parole
  return html
    .split(/(<code>.*?<\/code>)/)
    .map((part) => (part.startsWith('<code>') ? part : part.replace(/(^|[\s(])\*([^\s*](?:[^*\n]*[^\s*])?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')))
    .join('');
}

export function renderMarkup(src: string): string {
  const lines = src.split('\n');
  const html: string[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) html.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list.length) html.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`);
    list = [];
  };
  const flush = () => {
    flushPara();
    flushList();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flush();
      const code: string[] = [];
      while (++i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i]);
      html.push(`<pre class="code">${escapeHtml(code.join('\n'))}</pre>`);
      continue;
    }
    if (trimmed === '') {
      flush();
      continue;
    }
    const speaker = trimmed.match(/^@(\w+):\s*(.*)$/);
    if (speaker && SPEAKERS[speaker[1]]) {
      flush();
      const sp = SPEAKERS[speaker[1]];
      html.push(
        `<div class="speech ${sp.cls}"><span class="who">${sp.name}</span><span class="said">${inline(speaker[2])}</span></div>`,
      );
      continue;
    }
    if (trimmed.startsWith('!! ')) {
      flush();
      html.push(`<div class="callout warn"><span class="ico">⚠</span><div>${inline(trimmed.slice(3))}</div></div>`);
      continue;
    }
    if (trimmed.startsWith('?? ')) {
      flush();
      html.push(`<div class="callout tip"><span class="ico">◆</span><div>${inline(trimmed.slice(3))}</div></div>`);
      continue;
    }
    if (trimmed.startsWith('- ')) {
      flushPara();
      list.push(trimmed.slice(2));
      continue;
    }
    flushList();
    para.push(trimmed);
  }
  flush();
  return html.join('\n');
}
