// Filesystem virtuale: una piccola imitazione dell'albero di cartelle di Linux.

export interface BaseNode {
  owner: string;
  group: string;
  perms: string; // es. "rw-r--r--" (senza il carattere del tipo)
  mtime: string; // data mostrata da ls -l
  locked?: boolean; // true = "Permission denied" per l'utente normale
}

export interface FileNode extends BaseNode {
  type: 'file';
  content: string;
}

export interface DirNode extends BaseNode {
  type: 'dir';
  children: Map<string, VNode>;
}

export type VNode = FileNode | DirNode;

const DEFAULT_DATE = 'Nov 11 21:04';

/** Trasforma un percorso assoluto in forma canonica (gestisce ., .., // ). */
export function normalize(path: string): string {
  const parts: string[] = [];
  for (const seg of path.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return '/' + parts.join('/');
}

export function basename(path: string): string {
  const n = normalize(path);
  return n === '/' ? '/' : n.slice(n.lastIndexOf('/') + 1);
}

export function dirname(path: string): string {
  const n = normalize(path);
  const i = n.lastIndexOf('/');
  return i <= 0 ? '/' : n.slice(0, i);
}

export interface NodeOpts {
  owner?: string;
  group?: string;
  perms?: string;
  mtime?: string;
  locked?: boolean;
}

export class Vfs {
  root: DirNode;

  constructor() {
    this.root = this.makeDir({ owner: 'root', group: 'root' });
  }

  private makeDir(o: NodeOpts = {}): DirNode {
    return {
      type: 'dir',
      children: new Map(),
      owner: o.owner ?? 'root',
      group: o.group ?? o.owner ?? 'root',
      perms: o.perms ?? 'rwxr-xr-x',
      mtime: o.mtime ?? DEFAULT_DATE,
      locked: o.locked,
    };
  }

  /** Risolve un percorso (relativo, assoluto o con ~) in un percorso assoluto. */
  resolve(cwd: string, home: string, p: string): string {
    if (p === '~' || p.startsWith('~/')) return normalize(home + p.slice(1));
    if (p.startsWith('/')) return normalize(p);
    return normalize(cwd + '/' + p);
  }

  get(abs: string): VNode | undefined {
    let node: VNode = this.root;
    for (const seg of normalize(abs).split('/').filter(Boolean)) {
      if (node.type !== 'dir') return undefined;
      const next: VNode | undefined = node.children.get(seg);
      if (!next) return undefined;
      node = next;
    }
    return node;
  }

  mkdirp(abs: string, o: NodeOpts = {}): DirNode {
    let node: DirNode = this.root;
    for (const seg of normalize(abs).split('/').filter(Boolean)) {
      let next = node.children.get(seg);
      if (!next) {
        // le cartelle intermedie ricevono solo proprietario e gruppo, non permessi speciali
        next = this.makeDir({ owner: o.owner, group: o.group, mtime: o.mtime });
        node.children.set(seg, next);
      }
      if (next.type !== 'dir') throw new Error(`${abs}: non è una cartella`);
      node = next;
    }
    // le opzioni esplicite si applicano alla cartella finale
    if (o.perms) node.perms = o.perms;
    if (o.locked !== undefined) node.locked = o.locked;
    if (o.owner) node.owner = o.owner;
    if (o.group) node.group = o.group;
    return node;
  }

  writeFile(abs: string, content: string, o: NodeOpts = {}): FileNode {
    const parent = this.mkdirp(dirname(abs), { owner: o.owner, group: o.group });
    const file: FileNode = {
      type: 'file',
      content,
      owner: o.owner ?? 'root',
      group: o.group ?? o.owner ?? 'root',
      perms: o.perms ?? 'rw-r--r--',
      mtime: o.mtime ?? DEFAULT_DATE,
      locked: o.locked,
    };
    parent.children.set(basename(abs), file);
    return file;
  }

  /** Dimensione "finta" usata da ls -l. */
  size(node: VNode): number {
    return node.type === 'file' ? new TextEncoder().encode(node.content).length : 4096;
  }

  /** Esporta un sottoalbero come oggetto JSON (per salvarlo). */
  serialize(abs: string): unknown {
    const enc = (n: VNode): unknown =>
      n.type === 'file'
        ? { t: 'f', c: n.content, o: n.owner, g: n.group, p: n.perms, m: n.mtime, l: n.locked ? 1 : 0 }
        : { t: 'd', o: n.owner, g: n.group, p: n.perms, m: n.mtime, l: n.locked ? 1 : 0, k: Object.fromEntries([...n.children].map(([k, v]) => [k, enc(v)])) };
    const node = this.get(abs);
    return node ? enc(node) : null;
  }

  /** Sovrappone un sottoalbero salvato: i file salvati vincono su quelli attuali. */
  overlay(abs: string, data: unknown): void {
    type Enc = { t: 'f' | 'd'; c?: string; o: string; g: string; p: string; m: string; l: number; k?: Record<string, Enc> };
    const apply = (path: string, e: Enc) => {
      const opts = { owner: e.o, group: e.g, perms: e.p, mtime: e.m, locked: !!e.l };
      if (e.t === 'f') {
        this.writeFile(path, e.c ?? '', opts);
        return;
      }
      const existing = this.get(path);
      if (existing && existing.type !== 'dir') return;
      const dir = this.mkdirp(path, opts);
      dir.mtime = e.m;
      for (const [k, v] of Object.entries(e.k ?? {})) apply(`${path === '/' ? '' : path}/${k}`, v);
    };
    if (data && typeof data === 'object') apply(normalize(abs), data as Enc);
  }
}
