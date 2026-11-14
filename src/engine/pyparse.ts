// Mini Python: tokenizzatore e parser. Copre il sottoinsieme che serve per gli script
// di sicurezza: variabili, funzioni, cicli, liste, dizionari, comprehension, f-string,
// try/except, with open(...). Niente classi, generatori o async.

export class PySyntaxError extends Error {
  constructor(
    public type: 'SyntaxError' | 'IndentationError',
    message: string,
    public line: number,
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------- token

export type TokKind = 'name' | 'num' | 'str' | 'op' | 'nl' | 'indent' | 'dedent' | 'eof';

export interface Tok {
  k: TokKind;
  v: string;
  line: number;
  /** solo stringhe: prefisso (f, r, b) */
  pre?: string;
}

const OPS = [
  '**=', '//=', '>>=', '<<=', '...',
  '**', '//', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '->', '<<', '>>', ':=',
  '+', '-', '*', '/', '%', '<', '>', '=', '(', ')', '[', ']', '{', '}', ',', ':', '.', ';', '@', '&', '|', '^', '~',
];

function unescape(s: string, line: number): string {
  return s.replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|[\s\S])/g, (m, c: string) => {
    if (c[0] === 'x' || c[0] === 'u') return String.fromCharCode(parseInt(c.slice(1), 16));
    switch (c) {
      case 'n':
        return '\n';
      case 't':
        return '\t';
      case 'r':
        return '\r';
      case '0':
        return '\0';
      case '\\':
        return '\\';
      case "'":
        return "'";
      case '"':
        return '"';
      case '\n':
        return '';
      default:
        void line;
        return m;
    }
  });
}

export function tokenize(src: string, baseLine = 1): Tok[] {
  const out: Tok[] = [];
  const indents = [0];
  let i = 0;
  let line = baseLine;
  let depth = 0;
  let atStart = true;
  const n = src.length;
  const push = (k: TokKind, v: string, pre?: string) => out.push({ k, v, line, pre });

  while (i < n) {
    if (atStart && depth === 0) {
      // misura l'indentazione della riga logica
      let col = 0;
      let j = i;
      while (j < n && (src[j] === ' ' || src[j] === '\t')) {
        col += src[j] === '\t' ? 4 : 1;
        j++;
      }
      if (j >= n) break;
      if (src[j] === '\n' || src[j] === '#' || src[j] === '\r') {
        // riga vuota o di solo commento
        while (j < n && src[j] !== '\n') j++;
        i = j + 1;
        line++;
        continue;
      }
      i = j;
      atStart = false;
      const top = indents[indents.length - 1];
      if (col > top) {
        indents.push(col);
        push('indent', '');
      } else if (col < top) {
        while (indents.length > 1 && col < indents[indents.length - 1]) {
          indents.pop();
          push('dedent', '');
        }
        if (col !== indents[indents.length - 1]) throw new PySyntaxError('IndentationError', 'unindent does not match any outer indentation level', line);
      }
    }
    const ch = src[i];
    if (ch === '\n') {
      if (depth === 0) {
        push('nl', '');
        atStart = true;
      }
      line++;
      i++;
      continue;
    }
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      i++;
      continue;
    }
    if (ch === '#') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (ch === '\\' && src[i + 1] === '\n') {
      i += 2;
      line++;
      continue;
    }
    // stringhe, con eventuale prefisso
    const pm = /^([rRbBfFuU]{0,2})(['"])/.exec(src.slice(i, i + 3));
    if (pm && (pm[1] === '' || /^[rbfu]{1,2}$/i.test(pm[1]))) {
      const pre = pm[1].toLowerCase();
      const q = pm[2];
      let j = i + pm[1].length;
      const triple = src.startsWith(q.repeat(3), j);
      const delim = triple ? q.repeat(3) : q;
      j += delim.length;
      const startLine = line;
      let body = '';
      for (;;) {
        if (j >= n) throw new PySyntaxError('SyntaxError', triple ? 'unterminated triple-quoted string literal' : 'unterminated string literal', startLine);
        if (src[j] === '\\') {
          body += src[j] + (src[j + 1] ?? '');
          if (src[j + 1] === '\n') line++;
          j += 2;
          continue;
        }
        if (src.startsWith(delim, j)) {
          j += delim.length;
          break;
        }
        if (src[j] === '\n') {
          if (!triple) throw new PySyntaxError('SyntaxError', 'unterminated string literal', startLine);
          line++;
        }
        body += src[j++];
      }
      const raw = pre.includes('r');
      const value = pre.includes('f') ? body : raw ? body : unescape(body, startLine);
      out.push({ k: 'str', v: value, line: startLine, pre: pre.replace('u', '') });
      i = j;
      continue;
    }
    const num = /^(0[xX][0-9a-fA-F_]+|0[bB][01_]+|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?)/.exec(src.slice(i, i + 40));
    if (num && /[\d.]/.test(ch) && !(ch === '.' && !/\d/.test(src[i + 1] ?? ''))) {
      push('num', num[1].replace(/_/g, ''));
      i += num[1].length;
      continue;
    }
    const id = /^[A-Za-z_À-ɏ][\wÀ-ɏ]*/.exec(src.slice(i, i + 80));
    if (id) {
      push('name', id[0]);
      i += id[0].length;
      continue;
    }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (op) {
      if ('([{'.includes(op)) depth++;
      if (')]}'.includes(op)) depth = Math.max(0, depth - 1);
      push('op', op);
      i += op.length;
      continue;
    }
    throw new PySyntaxError('SyntaxError', `invalid character '${ch}' (U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`, line);
  }
  if (out.length && out[out.length - 1].k !== 'nl') push('nl', '');
  while (indents.length > 1) {
    indents.pop();
    push('dedent', '');
  }
  push('eof', '');
  return out;
}

// ---------------------------------------------------------------- albero sintattico

export type FPart = string | { e: Expr; conv?: string; spec?: FPart[] };

export type Expr =
  | { k: 'num'; v: number; float: boolean }
  | { k: 'str'; v: string }
  | { k: 'bytes'; v: string }
  | { k: 'fstr'; parts: FPart[] }
  | { k: 'name'; id: string }
  | { k: 'const'; v: null | boolean }
  | { k: 'list' | 'tuple' | 'set'; items: Expr[] }
  | { k: 'dict'; pairs: [Expr, Expr][] }
  | { k: 'comp'; kind: 'list' | 'set' | 'gen' | 'dict'; elt: Expr; val?: Expr; gens: { target: Expr; iter: Expr; ifs: Expr[] }[] }
  | { k: 'bin'; op: string; l: Expr; r: Expr }
  | { k: 'un'; op: string; e: Expr }
  | { k: 'bool'; op: 'and' | 'or'; l: Expr; r: Expr }
  | { k: 'not'; e: Expr }
  | { k: 'cmp'; first: Expr; ops: [string, Expr][] }
  | { k: 'ifexp'; c: Expr; a: Expr; b: Expr }
  | { k: 'call'; f: Expr; args: Expr[]; kw: [string, Expr][]; star: boolean[] }
  | { k: 'attr'; e: Expr; name: string }
  | { k: 'sub'; e: Expr; idx: Expr }
  | { k: 'slice'; lo: Expr | null; hi: Expr | null; step: Expr | null }
  | { k: 'lambda'; params: Param[]; body: Expr }
  | { k: 'star'; e: Expr };

export interface Param {
  name: string;
  def: Expr | null;
}

type S<T> = T & { line: number };

export type Stmt =
  | S<{ k: 'expr'; e: Expr }>
  | S<{ k: 'assign'; targets: Expr[]; value: Expr }>
  | S<{ k: 'aug'; target: Expr; op: string; value: Expr }>
  | S<{ k: 'if'; tests: [Expr, Stmt[]][]; orelse: Stmt[] }>
  | S<{ k: 'while'; c: Expr; body: Stmt[]; orelse: Stmt[] }>
  | S<{ k: 'for'; target: Expr; iter: Expr; body: Stmt[]; orelse: Stmt[] }>
  | S<{ k: 'def'; name: string; params: Param[]; body: Stmt[] }>
  | S<{ k: 'return'; e: Expr | null }>
  | S<{ k: 'break' | 'continue' | 'pass' }>
  | S<{ k: 'import'; names: [string, string | null][] }>
  | S<{ k: 'from'; mod: string; names: [string, string | null][] }>
  | S<{ k: 'try'; body: Stmt[]; handlers: { types: string[] | null; name: string | null; body: Stmt[] }[]; orelse: Stmt[]; final: Stmt[] }>
  | S<{ k: 'with'; e: Expr; name: Expr | null; body: Stmt[] }>
  | S<{ k: 'raise'; e: Expr | null }>
  | S<{ k: 'global'; names: string[] }>
  | S<{ k: 'del'; targets: Expr[] }>
  | S<{ k: 'assert'; c: Expr; msg: Expr | null }>;

const KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
  'return', 'try', 'while', 'with', 'yield',
]);

const AUG = new Set(['+=', '-=', '*=', '/=', '//=', '%=', '**=', '&=', '|=', '^=']);

export class Parser {
  private p = 0;
  constructor(private t: Tok[]) {}

  private get cur(): Tok {
    return this.t[this.p];
  }
  private tokKind(): TokKind {
    return this.t[this.p].k;
  }
  private peek(o = 1): Tok {
    return this.t[Math.min(this.p + o, this.t.length - 1)];
  }
  private is(v: string, k: TokKind = 'op'): boolean {
    const c = this.cur;
    return c.k === k && c.v === v;
  }
  private isKw(v: string): boolean {
    return this.tokKind() === 'name' && this.cur.v === v;
  }
  private eat(v: string, k: TokKind = 'op'): boolean {
    if (this.is(v, k)) {
      this.p++;
      return true;
    }
    return false;
  }
  private fail(msg = 'invalid syntax', line = this.cur.line): never {
    throw new PySyntaxError('SyntaxError', msg, line);
  }
  private expect(v: string, k: TokKind = 'op', msg?: string): Tok {
    if (!this.is(v, k)) this.fail(msg ?? (v === ':' ? "expected ':'" : 'invalid syntax'));
    return this.t[this.p++];
  }
  private name(): string {
    const c = this.cur;
    if (c.k !== 'name' || KEYWORDS.has(c.v)) this.fail();
    this.p++;
    return c.v;
  }

  // ---------------------------------------------------------- istruzioni

  parseModule(): Stmt[] {
    const body: Stmt[] = [];
    while (this.tokKind() !== 'eof') {
      if (this.tokKind() === 'nl') {
        this.p++;
        continue;
      }
      if (this.tokKind() === 'indent') throw new PySyntaxError('IndentationError', 'unexpected indent', this.cur.line);
      body.push(...this.statement());
    }
    return body;
  }

  private block(after: string, line: number): Stmt[] {
    this.expect(':');
    if (this.tokKind() !== 'nl') return this.simpleLine();
    this.p++;
    if (this.tokKind() !== 'indent') throw new PySyntaxError('IndentationError', `expected an indented block after '${after}' statement on line ${line}`, this.cur.line);
    this.p++;
    const body: Stmt[] = [];
    while (this.tokKind() !== 'dedent' && this.tokKind() !== 'eof') {
      if (this.tokKind() === 'nl') {
        this.p++;
        continue;
      }
      if (this.tokKind() === 'indent') throw new PySyntaxError('IndentationError', 'unexpected indent', this.cur.line);
      body.push(...this.statement());
    }
    this.eat('', 'dedent');
    return body;
  }

  private statement(): Stmt[] {
    const c = this.cur;
    const line = c.line;
    if (c.k === 'name') {
      switch (c.v) {
        case 'if': {
          this.p++;
          const tests: [Expr, Stmt[]][] = [[this.test(), this.block('if', line)]];
          let orelse: Stmt[] = [];
          while (this.isKw('elif')) {
            const l2 = this.cur.line;
            this.p++;
            tests.push([this.test(), this.block('elif', l2)]);
          }
          if (this.isKw('else')) {
            const l2 = this.cur.line;
            this.p++;
            orelse = this.block('else', l2);
          }
          return [{ k: 'if', tests, orelse, line }];
        }
        case 'while': {
          this.p++;
          const cnd = this.test();
          const body = this.block('while', line);
          let orelse: Stmt[] = [];
          if (this.isKw('else')) {
            this.p++;
            orelse = this.block('else', line);
          }
          return [{ k: 'while', c: cnd, body, orelse, line }];
        }
        case 'for': {
          this.p++;
          const target = this.targetList();
          if (!this.isKw('in')) this.fail();
          this.p++;
          const iter = this.testList();
          const body = this.block('for', line);
          let orelse: Stmt[] = [];
          if (this.isKw('else')) {
            this.p++;
            orelse = this.block('else', line);
          }
          return [{ k: 'for', target, iter, body, orelse, line }];
        }
        case 'def': {
          this.p++;
          const name = this.name();
          this.expect('(');
          const params = this.params(')');
          this.expect(')');
          if (this.eat('->')) this.test();
          return [{ k: 'def', name, params, body: this.block('def', line), line }];
        }
        case 'try': {
          this.p++;
          const body = this.block('try', line);
          const handlers: { types: string[] | null; name: string | null; body: Stmt[] }[] = [];
          let orelse: Stmt[] = [];
          let final: Stmt[] = [];
          while (this.isKw('except')) {
            const l2 = this.cur.line;
            this.p++;
            let types: string[] | null = null;
            let name: string | null = null;
            if (!this.is(':')) {
              types = [];
              if (this.eat('(')) {
                do types.push(this.dotted());
                while (this.eat(',') && !this.is(')'));
                this.expect(')');
              } else types.push(this.dotted());
              if (this.isKw('as')) {
                this.p++;
                name = this.name();
              }
            }
            handlers.push({ types, name, body: this.block('except', l2) });
          }
          if (this.isKw('else')) {
            this.p++;
            orelse = this.block('else', line);
          }
          if (this.isKw('finally')) {
            this.p++;
            final = this.block('finally', line);
          }
          if (!handlers.length && !final.length) this.fail("expected 'except' or 'finally' block");
          return [{ k: 'try', body, handlers, orelse, final, line }];
        }
        case 'with': {
          this.p++;
          const e = this.test();
          let name: Expr | null = null;
          if (this.isKw('as')) {
            this.p++;
            name = this.targetList();
          }
          return [{ k: 'with', e, name, body: this.block('with', line), line }];
        }
        case 'class':
          this.fail('le classi non sono supportate nel Python del deck');
        // eslint-disable-next-line no-fallthrough
        case 'yield':
        case 'async':
        case 'await':
          this.fail(`'${c.v}' non è supportato nel Python del deck`);
      }
    }
    return this.simpleLine();
  }

  private dotted(): string {
    let s = this.name();
    while (this.eat('.')) s += '.' + this.name();
    return s;
  }

  private simpleLine(): Stmt[] {
    const out: Stmt[] = [this.simple()];
    while (this.eat(';')) {
      if (this.tokKind() === 'nl') break;
      out.push(this.simple());
    }
    if (this.tokKind() !== 'nl' && this.tokKind() !== 'eof') this.fail();
    if (this.tokKind() === 'nl') this.p++;
    return out;
  }

  private simple(): Stmt {
    const c = this.cur;
    const line = c.line;
    if (c.k === 'name') {
      switch (c.v) {
        case 'pass':
        case 'break':
        case 'continue':
          this.p++;
          return { k: c.v, line };
        case 'return':
          this.p++;
          return { k: 'return', e: this.atEnd() ? null : this.testList(), line };
        case 'raise':
          this.p++;
          return { k: 'raise', e: this.atEnd() ? null : this.test(), line };
        case 'global':
        case 'nonlocal': {
          this.p++;
          const names = [this.name()];
          while (this.eat(',')) names.push(this.name());
          return { k: 'global', names, line };
        }
        case 'del': {
          this.p++;
          const targets = [this.expr()];
          while (this.eat(',')) targets.push(this.expr());
          return { k: 'del', targets, line };
        }
        case 'assert': {
          this.p++;
          const cnd = this.test();
          return { k: 'assert', c: cnd, msg: this.eat(',') ? this.test() : null, line };
        }
        case 'import': {
          this.p++;
          const names: [string, string | null][] = [];
          do {
            const m = this.dotted();
            let as: string | null = null;
            if (this.isKw('as')) {
              this.p++;
              as = this.name();
            }
            names.push([m, as]);
          } while (this.eat(','));
          return { k: 'import', names, line };
        }
        case 'from': {
          this.p++;
          const mod = this.dotted();
          if (!this.isKw('import')) this.fail();
          this.p++;
          const names: [string, string | null][] = [];
          const paren = this.eat('(');
          if (this.eat('*')) names.push(['*', null]);
          else
            do {
              if (paren && this.is(')')) break;
              const nm = this.name();
              let as: string | null = null;
              if (this.isKw('as')) {
                this.p++;
                as = this.name();
              }
              names.push([nm, as]);
            } while (this.eat(','));
          if (paren) this.expect(')');
          return { k: 'from', mod, names, line };
        }
      }
    }
    const first = this.testList(true);
    if (this.tokKind() === 'op' && AUG.has(this.cur.v)) {
      const op = this.cur.v.slice(0, -1);
      this.p++;
      this.checkTarget(first, line);
      if (first.k === 'tuple') this.fail("'tuple' is an illegal expression for augmented assignment", line);
      return { k: 'aug', target: first, op, value: this.testList(), line };
    }
    if (this.is('=')) {
      const targets = [first];
      let value: Expr = first;
      while (this.eat('=')) {
        value = this.testList(true);
        targets.push(value);
      }
      targets.pop();
      for (const t of targets) this.checkTarget(t, line);
      return { k: 'assign', targets, value, line };
    }
    if (this.is(':') && first.k === 'name') {
      // annotazione di tipo: x: int = 3
      this.p++;
      this.test();
      if (this.eat('=')) return { k: 'assign', targets: [first], value: this.testList(), line };
      return { k: 'pass', line };
    }
    return { k: 'expr', e: first, line };
  }

  private atEnd(): boolean {
    return this.tokKind() === 'nl' || this.tokKind() === 'eof' || this.is(';');
  }

  private checkTarget(e: Expr, line: number): void {
    if (e.k === 'name') {
      if (KEYWORDS.has(e.id)) this.fail('cannot assign to keyword', line);
      return;
    }
    if (e.k === 'attr' || e.k === 'sub') return;
    if (e.k === 'tuple' || e.k === 'list') {
      for (const x of e.items) this.checkTarget(x.k === 'star' ? x.e : x, line);
      return;
    }
    const what: Record<string, string> = { call: 'function call', num: 'literal', str: 'literal', const: 'literal', bin: 'expression', cmp: 'comparison' };
    this.fail(`cannot assign to ${what[e.k] ?? 'expression'} here. Maybe you meant '==' instead of '='?`, line);
  }

  private targetList(): Expr {
    const items = [this.targetAtom()];
    if (!this.is(',')) return items[0];
    while (this.eat(',')) {
      if (this.isKw('in') || this.is('=') || this.isKw('as')) break;
      items.push(this.targetAtom());
    }
    return { k: 'tuple', items };
  }

  private targetAtom(): Expr {
    if (this.eat('(')) {
      const t = this.targetList();
      this.expect(')');
      return t;
    }
    return this.expr();
  }

  private params(close: string): Param[] {
    const ps: Param[] = [];
    while (!this.is(close)) {
      const name = this.name();
      if (close !== ':' && this.eat(':')) this.test();
      ps.push({ name, def: this.eat('=') ? this.test() : null });
      if (!this.eat(',')) break;
    }
    return ps;
  }

  // ---------------------------------------------------------- espressioni

  /** Una o più espressioni separate da virgole (diventano una tupla). */
  testList(allowStar = false): Expr {
    const first = allowStar && this.is('*') ? this.starred() : this.test();
    if (!this.is(',')) return first;
    const items = [first];
    while (this.eat(',')) {
      if (this.atEnd() || this.is('=') || this.is(')') || this.is(':') || (this.tokKind() === 'op' && AUG.has(this.cur.v))) break;
      items.push(allowStar && this.is('*') ? this.starred() : this.test());
    }
    return { k: 'tuple', items };
  }

  private starred(): Expr {
    this.expect('*');
    return { k: 'star', e: this.expr() };
  }

  test(): Expr {
    if (this.isKw('lambda')) {
      this.p++;
      const params = this.params(':');
      this.expect(':');
      return { k: 'lambda', params, body: this.test() };
    }
    const a = this.orTest();
    if (this.isKw('if')) {
      const save = this.p;
      this.p++;
      const c = this.orTest();
      if (!this.isKw('else')) {
        this.p = save;
        return a;
      }
      this.p++;
      return { k: 'ifexp', c, a, b: this.test() };
    }
    return a;
  }

  private orTest(): Expr {
    let l = this.andTest();
    while (this.isKw('or')) {
      this.p++;
      l = { k: 'bool', op: 'or', l, r: this.andTest() };
    }
    return l;
  }

  private andTest(): Expr {
    let l = this.notTest();
    while (this.isKw('and')) {
      this.p++;
      l = { k: 'bool', op: 'and', l, r: this.notTest() };
    }
    return l;
  }

  private notTest(): Expr {
    if (this.isKw('not')) {
      this.p++;
      return { k: 'not', e: this.notTest() };
    }
    return this.comparison();
  }

  private comparison(): Expr {
    const first = this.expr();
    const ops: [string, Expr][] = [];
    for (;;) {
      const c = this.cur;
      let op: string | null = null;
      if (c.k === 'op' && ['<', '>', '==', '>=', '<=', '!='].includes(c.v)) {
        op = c.v;
        this.p++;
      } else if (this.isKw('in')) {
        op = 'in';
        this.p++;
      } else if (this.isKw('not') && this.peek().k === 'name' && this.peek().v === 'in') {
        op = 'not in';
        this.p += 2;
      } else if (this.isKw('is')) {
        this.p++;
        op = 'is';
        if (this.isKw('not')) {
          this.p++;
          op = 'is not';
        }
      }
      if (!op) break;
      ops.push([op, this.expr()]);
    }
    return ops.length ? { k: 'cmp', first, ops } : first;
  }

  private binLevel(ops: string[], next: () => Expr): Expr {
    let l = next();
    while (this.tokKind() === 'op' && ops.includes(this.cur.v)) {
      const op = this.cur.v;
      this.p++;
      l = { k: 'bin', op, l, r: next() };
    }
    return l;
  }

  expr(): Expr {
    return this.binLevel(['|'], () => this.binLevel(['^'], () => this.binLevel(['&'], () => this.binLevel(['<<', '>>'], () => this.arith()))));
  }

  private arith(): Expr {
    return this.binLevel(['+', '-'], () => this.term());
  }

  private term(): Expr {
    return this.binLevel(['*', '/', '//', '%', '@'], () => this.factor());
  }

  private factor(): Expr {
    if (this.tokKind() === 'op' && ['-', '+', '~'].includes(this.cur.v)) {
      const op = this.cur.v;
      this.p++;
      return { k: 'un', op, e: this.factor() };
    }
    return this.power();
  }

  private power(): Expr {
    const base = this.primary();
    if (this.eat('**')) return { k: 'bin', op: '**', l: base, r: this.factor() };
    return base;
  }

  private primary(): Expr {
    let e = this.atom();
    for (;;) {
      if (this.eat('(')) {
        const args: Expr[] = [];
        const kw: [string, Expr][] = [];
        const star: boolean[] = [];
        while (!this.is(')')) {
          if (this.tokKind() === 'name' && this.peek().k === 'op' && this.peek().v === '=') {
            const nm = this.name();
            this.p++;
            kw.push([nm, this.test()]);
          } else if (this.eat('**')) {
            this.fail("'**' negli argomenti non è supportato nel Python del deck");
          } else if (this.eat('*')) {
            args.push(this.test());
            star.push(true);
          } else {
            const a = this.test();
            if (this.isKw('for')) {
              args.push(this.comp('gen', a));
              star.push(false);
              break;
            }
            args.push(a);
            star.push(false);
          }
          if (!this.eat(',')) break;
        }
        this.expect(')', 'op', "'(' was never closed");
        e = { k: 'call', f: e, args, kw, star };
      } else if (this.eat('[')) {
        e = { k: 'sub', e, idx: this.subscript() };
        this.expect(']', 'op', "'[' was never closed");
      } else if (this.eat('.')) {
        e = { k: 'attr', e, name: this.name() };
      } else break;
    }
    return e;
  }

  private subscript(): Expr {
    let lo: Expr | null = null;
    if (!this.is(':')) {
      lo = this.test();
      if (!this.is(':')) {
        if (this.is(',')) {
          const items = [lo];
          while (this.eat(',') && !this.is(']')) items.push(this.test());
          return { k: 'tuple', items };
        }
        return lo;
      }
    }
    this.expect(':');
    const hi = this.is(']') || this.is(':') ? null : this.test();
    let step: Expr | null = null;
    if (this.eat(':') && !this.is(']')) step = this.test();
    return { k: 'slice', lo, hi, step };
  }

  private comp(kind: 'list' | 'set' | 'gen' | 'dict', elt: Expr, val?: Expr): Expr {
    const gens: { target: Expr; iter: Expr; ifs: Expr[] }[] = [];
    while (this.isKw('for')) {
      this.p++;
      const target = this.targetList();
      if (!this.isKw('in')) this.fail();
      this.p++;
      const iter = this.orTest();
      const ifs: Expr[] = [];
      while (this.isKw('if')) {
        this.p++;
        ifs.push(this.orTest());
      }
      gens.push({ target, iter, ifs });
    }
    return { k: 'comp', kind, elt, val, gens };
  }

  private atom(): Expr {
    const c = this.cur;
    if (c.k === 'num') {
      this.p++;
      const v = c.v;
      if (/^0[xX]/.test(v)) return { k: 'num', v: parseInt(v.slice(2), 16), float: false };
      if (/^0[bB]/.test(v)) return { k: 'num', v: parseInt(v.slice(2), 2), float: false };
      const float = /[.eE]/.test(v);
      return { k: 'num', v: Number(v), float };
    }
    if (c.k === 'str') {
      const parts: FPart[] = [];
      let bytes: string | null = null;
      let isF = false;
      while (this.tokKind() === 'str') {
        const t = this.cur;
        this.p++;
        if (t.pre?.includes('b')) bytes = (bytes ?? '') + t.v;
        else if (t.pre?.includes('f')) {
          isF = true;
          parts.push(...parseFString(t.v, t.line, !t.pre.includes('r')));
        } else parts.push(t.v);
      }
      if (bytes !== null) return { k: 'bytes', v: bytes };
      if (!isF) return { k: 'str', v: parts.join('') };
      return { k: 'fstr', parts };
    }
    if (c.k === 'name') {
      if (c.v === 'True' || c.v === 'False' || c.v === 'None') {
        this.p++;
        return { k: 'const', v: c.v === 'None' ? null : c.v === 'True' };
      }
      return { k: 'name', id: this.name() };
    }
    if (this.eat('(')) {
      if (this.eat(')')) return { k: 'tuple', items: [] };
      const first = this.is('*') ? this.starred() : this.test();
      if (this.isKw('for')) {
        const g = this.comp('gen', first);
        this.expect(')');
        return g;
      }
      if (this.eat(')')) return first;
      const items = [first];
      while (this.eat(',') && !this.is(')')) items.push(this.is('*') ? this.starred() : this.test());
      this.expect(')', 'op', "'(' was never closed");
      return { k: 'tuple', items };
    }
    if (this.eat('[')) {
      if (this.eat(']')) return { k: 'list', items: [] };
      const first = this.is('*') ? this.starred() : this.test();
      if (this.isKw('for')) {
        const g = this.comp('list', first);
        this.expect(']');
        return g;
      }
      const items = [first];
      while (this.eat(',') && !this.is(']')) items.push(this.is('*') ? this.starred() : this.test());
      this.expect(']', 'op', "'[' was never closed");
      return { k: 'list', items };
    }
    if (this.eat('{')) {
      if (this.eat('}')) return { k: 'dict', pairs: [] };
      const first = this.test();
      if (this.eat(':')) {
        const v = this.test();
        if (this.isKw('for')) {
          const g = this.comp('dict', first, v);
          this.expect('}');
          return g;
        }
        const pairs: [Expr, Expr][] = [[first, v]];
        while (this.eat(',') && !this.is('}')) {
          const k = this.test();
          this.expect(':');
          pairs.push([k, this.test()]);
        }
        this.expect('}', 'op', "'{' was never closed");
        return { k: 'dict', pairs };
      }
      if (this.isKw('for')) {
        const g = this.comp('set', first);
        this.expect('}');
        return g;
      }
      const items = [first];
      while (this.eat(',') && !this.is('}')) items.push(this.test());
      this.expect('}', 'op', "'{' was never closed");
      return { k: 'set', items };
    }
    if (c.k === 'nl' || c.k === 'eof') this.fail('invalid syntax');
    if (c.k === 'indent' || c.k === 'dedent') throw new PySyntaxError('IndentationError', 'unexpected indent', c.line);
    this.fail();
  }
}

/** Divide il contenuto di una f-string in testo e {espressioni}. */
export function parseFString(s: string, line: number, cook: boolean): FPart[] {
  const parts: FPart[] = [];
  let buf = '';
  let i = 0;
  const flush = () => {
    if (buf) parts.push(cook ? unescape(buf, line) : buf);
    buf = '';
  };
  while (i < s.length) {
    const ch = s[i];
    if (ch === '{' && s[i + 1] === '{') {
      buf += '{';
      i += 2;
      continue;
    }
    if (ch === '}' && s[i + 1] === '}') {
      buf += '}';
      i += 2;
      continue;
    }
    if (ch === '}') throw new PySyntaxError('SyntaxError', "f-string: single '}' is not allowed", line);
    if (ch !== '{') {
      buf += ch;
      i++;
      continue;
    }
    flush();
    // trova la graffa di chiusura, tenendo conto di parentesi e stringhe
    let j = i + 1;
    let depth = 0;
    let quote: string | null = null;
    let exprEnd = -1;
    let conv: string | undefined;
    let specStart = -1;
    for (; j < s.length; j++) {
      const c = s[j];
      if (quote) {
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'") quote = c;
      else if ('([{'.includes(c)) depth++;
      else if (')]'.includes(c)) depth--;
      else if (c === '}' && depth > 0) depth--;
      else if (c === '}' && depth === 0) break;
      else if (depth === 0 && exprEnd < 0 && c === '!' && s[j + 1] !== '=') {
        exprEnd = j;
        conv = s[j + 1];
        j++;
      } else if (depth === 0 && specStart < 0 && c === ':') {
        if (exprEnd < 0) exprEnd = j;
        specStart = j + 1;
        // la specifica può contenere {campi annidati}
        let d2 = 0;
        for (j = j + 1; j < s.length; j++) {
          if (s[j] === '{') d2++;
          else if (s[j] === '}') {
            if (d2 === 0) break;
            d2--;
          }
        }
        break;
      }
    }
    if (j >= s.length) throw new PySyntaxError('SyntaxError', "f-string: expecting '}'", line);
    const exprSrc = s.slice(i + 1, exprEnd >= 0 ? exprEnd : j).trim();
    if (!exprSrc) throw new PySyntaxError('SyntaxError', 'f-string: valid expression required before \'}\'', line);
    const p = new Parser(tokenize(exprSrc, line));
    const e = p.testList();
    const spec = specStart >= 0 ? parseFString(s.slice(specStart, j), line, false) : undefined;
    parts.push({ e, conv, spec });
    i = j + 1;
  }
  flush();
  return parts;
}

export function parse(src: string): Stmt[] {
  return new Parser(tokenize(src)).parseModule();
}
