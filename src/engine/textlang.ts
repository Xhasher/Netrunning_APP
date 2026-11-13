// awk e sed: i due linguaggi "da una riga" più usati per analizzare i log.
// Sono sottoinsiemi: bastano per i casi d'uso quotidiani di un analista.

import { COMMANDS, readText, splitLines, type Ctx } from './shell';
import { parseOpts } from './coreutils';

// =============================================================== AWK

type Tok = { t: 'num' | 'str' | 're' | 'id' | 'op'; v: string };

function tokenizeAwk(src: string): Tok[] {
  const out: Tok[] = [];
  const ops = ['+=', '-=', '*=', '/=', '%=', '==', '!=', '<=', '>=', '&&', '||', '!~', '++', '--'];
  let i = 0;
  const prevAllowsDivision = () => {
    const p = out[out.length - 1];
    return !!p && (p.t === 'num' || p.t === 'str' || p.t === 'id' || (p.t === 'op' && (p.v === ')' || p.v === ']')));
  };
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      i++;
    } else if (ch === '\n') {
      out.push({ t: 'op', v: ';' });
      i++;
    } else if (ch === '#') {
      while (i < src.length && src[i] !== '\n') i++;
    } else if (ch === '"') {
      let s = '';
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\' && i + 1 < src.length) {
          const n = src[++i];
          s += n === 'n' ? '\n' : n === 't' ? '\t' : n;
        } else s += src[i];
        i++;
      }
      i++;
      out.push({ t: 'str', v: s });
    } else if (ch === '/' && !prevAllowsDivision()) {
      let s = '';
      i++;
      while (i < src.length && src[i] !== '/') {
        if (src[i] === '\\' && src[i + 1] === '/') {
          s += '/';
          i += 2;
        } else s += src[i++];
      }
      i++;
      out.push({ t: 're', v: s });
    } else if (/\d/.test(ch) || (ch === '.' && /\d/.test(src[i + 1] ?? ''))) {
      const m = src.slice(i).match(/^\d*\.?\d+/)!;
      out.push({ t: 'num', v: m[0] });
      i += m[0].length;
    } else if (/[A-Za-z_]/.test(ch)) {
      const m = src.slice(i).match(/^[A-Za-z_]\w*/)!;
      out.push({ t: 'id', v: m[0] });
      i += m[0].length;
    } else {
      const two = src.slice(i, i + 2);
      if (ops.includes(two)) {
        out.push({ t: 'op', v: two });
        i += 2;
      } else {
        out.push({ t: 'op', v: ch });
        i++;
      }
    }
  }
  return out;
}

type Node =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 're'; v: string }
  | { k: 'var'; n: string }
  | { k: 'idx'; n: string; i: Node }
  | { k: 'field'; e: Node }
  | { k: 'asg'; op: string; l: Node; r: Node }
  | { k: 'bin'; op: string; a: Node; b: Node }
  | { k: 'un'; op: string; e: Node }
  | { k: 'cond'; c: Node; a: Node; b: Node }
  | { k: 'call'; n: string; args: Node[] }
  | { k: 'incdec'; op: '++' | '--'; pre: boolean; l: Node }
  | { k: 'cat'; a: Node; b: Node }
  | { k: 'match'; neg: boolean; a: Node; b: Node }
  | { k: 'in'; key: Node; arr: string };

type Stmt =
  | { k: 'print'; args: Node[] }
  | { k: 'printf'; args: Node[] }
  | { k: 'expr'; e: Node }
  | { k: 'if'; c: Node; a: Stmt; b: Stmt | null }
  | { k: 'forin'; v: string; arr: string; body: Stmt }
  | { k: 'for'; init: Stmt | null; c: Node | null; step: Stmt | null; body: Stmt }
  | { k: 'while'; c: Node; body: Stmt }
  | { k: 'block'; body: Stmt[] }
  | { k: 'next' }
  | { k: 'exit' };

interface Rule {
  kind: 'begin' | 'end' | 'main';
  pattern: Node | null;
  body: Stmt | null;
}

class AwkParser {
  pos = 0;
  constructor(private toks: Tok[]) {}
  peek(o = 0) {
    return this.toks[this.pos + o];
  }
  isOp(v: string, o = 0) {
    const t = this.peek(o);
    return !!t && t.t === 'op' && t.v === v;
  }
  isId(v: string, o = 0) {
    const t = this.peek(o);
    return !!t && t.t === 'id' && t.v === v;
  }
  expect(v: string) {
    if (!this.isOp(v)) throw new Error(`atteso '${v}'`);
    this.pos++;
  }
  skipSemis() {
    while (this.isOp(';')) this.pos++;
  }
  program(): Rule[] {
    const rules: Rule[] = [];
    this.skipSemis();
    while (this.pos < this.toks.length) {
      if (this.isId('BEGIN') || this.isId('END')) {
        const kind = this.toks[this.pos++].v === 'BEGIN' ? 'begin' : 'end';
        rules.push({ kind, pattern: null, body: this.block() });
      } else if (this.isOp('{')) rules.push({ kind: 'main', pattern: null, body: this.block() });
      else {
        const pattern = this.expr();
        rules.push({ kind: 'main', pattern, body: this.isOp('{') ? this.block() : null });
      }
      this.skipSemis();
    }
    return rules;
  }
  block(): Stmt {
    this.expect('{');
    const body: Stmt[] = [];
    this.skipSemis();
    while (!this.isOp('}')) {
      if (this.pos >= this.toks.length) throw new Error("manca '}'");
      body.push(this.stmt());
      this.skipSemis();
    }
    this.expect('}');
    return { k: 'block', body };
  }
  stmt(): Stmt {
    if (this.isOp('{')) return this.block();
    if (this.isId('print') || this.isId('printf')) {
      const k = this.toks[this.pos++].v as 'print' | 'printf';
      const args: Node[] = [];
      const paren = this.isOp('(');
      if (paren) this.pos++;
      while (!this.isOp(';') && !this.isOp('}') && this.pos < this.toks.length && !(paren && this.isOp(')'))) {
        args.push(this.expr());
        if (this.isOp(',')) this.pos++;
        else break;
      }
      if (paren) this.expect(')');
      return { k, args };
    }
    if (this.isId('if')) {
      this.pos++;
      this.expect('(');
      const c = this.expr();
      this.expect(')');
      this.skipSemis();
      const a = this.stmt();
      let b: Stmt | null = null;
      const save = this.pos;
      this.skipSemis();
      if (this.isId('else')) {
        this.pos++;
        this.skipSemis();
        b = this.stmt();
      } else this.pos = save;
      return { k: 'if', c, a, b };
    }
    if (this.isId('for')) {
      this.pos++;
      this.expect('(');
      if (this.peek()?.t === 'id' && this.isId('in', 1)) {
        const v = this.toks[this.pos++].v;
        this.pos++;
        const arr = this.toks[this.pos++].v;
        this.expect(')');
        this.skipSemis();
        return { k: 'forin', v, arr, body: this.stmt() };
      }
      const init = this.isOp(';') ? null : this.stmt();
      this.expect(';');
      const c = this.isOp(';') ? null : this.expr();
      this.expect(';');
      const step = this.isOp(')') ? null : this.stmt();
      this.expect(')');
      this.skipSemis();
      return { k: 'for', init, c, step, body: this.stmt() };
    }
    if (this.isId('while')) {
      this.pos++;
      this.expect('(');
      const c = this.expr();
      this.expect(')');
      this.skipSemis();
      return { k: 'while', c, body: this.stmt() };
    }
    if (this.isId('next')) {
      this.pos++;
      return { k: 'next' };
    }
    if (this.isId('exit')) {
      this.pos++;
      return { k: 'exit' };
    }
    return { k: 'expr', e: this.expr() };
  }
  expr(): Node {
    return this.assign();
  }
  assign(): Node {
    const left = this.ternary();
    const t = this.peek();
    if (t && t.t === 'op' && ['=', '+=', '-=', '*=', '/=', '%='].includes(t.v) && (left.k === 'var' || left.k === 'idx' || left.k === 'field')) {
      this.pos++;
      return { k: 'asg', op: t.v, l: left, r: this.assign() };
    }
    return left;
  }
  ternary(): Node {
    const c = this.or();
    if (this.isOp('?')) {
      this.pos++;
      const a = this.assign();
      this.expect(':');
      return { k: 'cond', c, a, b: this.assign() };
    }
    return c;
  }
  or(): Node {
    let a = this.and();
    while (this.isOp('||')) {
      this.pos++;
      a = { k: 'bin', op: '||', a, b: this.and() };
    }
    return a;
  }
  and(): Node {
    let a = this.inop();
    while (this.isOp('&&')) {
      this.pos++;
      a = { k: 'bin', op: '&&', a, b: this.inop() };
    }
    return a;
  }
  inop(): Node {
    const a = this.match();
    if (this.isId('in') && this.peek(1)?.t === 'id') {
      this.pos++;
      return { k: 'in', key: a, arr: this.toks[this.pos++].v };
    }
    return a;
  }
  match(): Node {
    let a = this.compare();
    while (this.isOp('~') || this.isOp('!~')) {
      const neg = this.toks[this.pos++].v === '!~';
      a = { k: 'match', neg, a, b: this.compare() };
    }
    return a;
  }
  compare(): Node {
    const a = this.concat();
    const t = this.peek();
    if (t && t.t === 'op' && ['<', '<=', '>', '>=', '==', '!='].includes(t.v)) {
      this.pos++;
      return { k: 'bin', op: t.v, a, b: this.concat() };
    }
    return a;
  }
  startsPrimary(): boolean {
    const t = this.peek();
    if (!t) return false;
    if (t.t === 'num' || t.t === 'str') return true;
    if (t.t === 'id') return !['in', 'else'].includes(t.v);
    return t.t === 'op' && (t.v === '$' || t.v === '(' || t.v === '!');
  }
  concat(): Node {
    let a = this.add();
    while (this.startsPrimary() && !this.isId('in')) a = { k: 'cat', a, b: this.add() };
    return a;
  }
  add(): Node {
    let a = this.mul();
    while (this.isOp('+') || this.isOp('-')) {
      const op = this.toks[this.pos++].v;
      a = { k: 'bin', op, a, b: this.mul() };
    }
    return a;
  }
  mul(): Node {
    let a = this.unary();
    while (this.isOp('*') || this.isOp('/') || this.isOp('%')) {
      const op = this.toks[this.pos++].v;
      a = { k: 'bin', op, a, b: this.unary() };
    }
    return a;
  }
  unary(): Node {
    if (this.isOp('!') || this.isOp('-') || this.isOp('+')) {
      const op = this.toks[this.pos++].v;
      return { k: 'un', op, e: this.unary() };
    }
    if (this.isOp('++') || this.isOp('--')) {
      const op = this.toks[this.pos++].v as '++' | '--';
      return { k: 'incdec', op, pre: true, l: this.postfix() };
    }
    return this.postfix();
  }
  postfix(): Node {
    const p = this.primary();
    if ((this.isOp('++') || this.isOp('--')) && (p.k === 'var' || p.k === 'idx' || p.k === 'field')) {
      const op = this.toks[this.pos++].v as '++' | '--';
      return { k: 'incdec', op, pre: false, l: p };
    }
    return p;
  }
  primary(): Node {
    const t = this.peek();
    if (!t) throw new Error('espressione incompleta');
    this.pos++;
    if (t.t === 'num') return { k: 'num', v: Number(t.v) };
    if (t.t === 'str') return { k: 'str', v: t.v };
    if (t.t === 're') return { k: 're', v: t.v };
    if (t.t === 'op' && t.v === '$') return { k: 'field', e: this.primaryForField() };
    if (t.t === 'op' && t.v === '(') {
      const e = this.expr();
      this.expect(')');
      return e;
    }
    if (t.t === 'id') {
      if (this.isOp('(')) {
        this.pos++;
        const args: Node[] = [];
        while (!this.isOp(')')) {
          args.push(this.expr());
          if (this.isOp(',')) this.pos++;
          else break;
        }
        this.expect(')');
        return { k: 'call', n: t.v, args };
      }
      if (this.isOp('[')) {
        this.pos++;
        const i = this.expr();
        this.expect(']');
        return { k: 'idx', n: t.v, i };
      }
      return { k: 'var', n: t.v };
    }
    throw new Error(`simbolo inatteso '${t.v}'`);
  }
  primaryForField(): Node {
    if (this.isOp('++') || this.isOp('--') || this.isOp('-')) return this.unary();
    return this.primary();
  }
}

type Val = string | number;
class Next extends Error {}
class Exit extends Error {}

const num = (v: Val): number => (typeof v === 'number' ? v : parseFloat(v) || 0);
const str = (v: Val): string => (typeof v === 'number' ? (Number.isInteger(v) ? String(v) : String(+v.toFixed(6))) : v);
const isNumLike = (v: Val) => typeof v === 'number' || /^\s*[-+]?(\d+\.?\d*|\.\d+)\s*$/.test(v);

function formatPrintf(fmt: string, args: Val[]): string {
  let i = 0;
  return fmt.replace(/%(-?)(\d*)(?:\.(\d+))?([sdifc%])/g, (_m, left: string, w: string, prec: string, ty: string) => {
    if (ty === '%') return '%';
    const a = args[i++] ?? '';
    let s: string;
    if (ty === 'd' || ty === 'i') s = String(Math.trunc(num(a)));
    else if (ty === 'f') s = num(a).toFixed(prec !== undefined ? Number(prec) : 6);
    else if (ty === 'c') s = typeof a === 'number' ? String.fromCharCode(a) : str(a)[0] ?? '';
    else s = prec !== undefined ? str(a).slice(0, Number(prec)) : str(a);
    const width = Number(w || 0);
    return left ? s.padEnd(width) : s.padStart(width);
  });
}

function runAwk(c: Ctx, rules: Rule[], fs: string, vars: Record<string, string>, texts: string[]): number {
  const globals = new Map<string, Val>(Object.entries(vars));
  const arrays = new Map<string, Map<string, Val>>();
  let fields: string[] = [];
  let record = '';
  let NR = 0;
  let steps = 0;
  let buf = '';
  const getArr = (n: string) => {
    let a = arrays.get(n);
    if (!a) arrays.set(n, (a = new Map()));
    return a;
  };
  const split = (line: string, sep: string): string[] => {
    if (sep === ' ') return line.trim() === '' ? [] : line.trim().split(/\s+/);
    if (sep.length === 1) return line.split(sep);
    return line.split(new RegExp(sep));
  };
  const setRecord = (line: string) => {
    record = line;
    fields = split(line, fs);
  };
  const getField = (n: number): string => (n === 0 ? record : fields[n - 1] ?? '');
  const reOf = (n: Node, ev: (x: Node) => Val): RegExp => new RegExp(n.k === 're' ? n.v : str(ev(n)));

  const ev = (n: Node): Val => {
    switch (n.k) {
      case 'num':
        return n.v;
      case 'str':
        return n.v;
      case 're':
        return new RegExp(n.v).test(record) ? 1 : 0;
      case 'var':
        if (n.n === 'NR') return NR;
        if (n.n === 'NF') return fields.length;
        if (n.n === 'FS') return fs;
        return globals.get(n.n) ?? '';
      case 'idx':
        return getArr(n.n).get(str(ev(n.i))) ?? '';
      case 'field':
        return getField(Math.trunc(num(ev(n.e))));
      case 'asg': {
        const r = ev(n.r);
        const cur = n.op === '=' ? 0 : num(ev(n.l));
        const v: Val = n.op === '=' ? r : n.op === '+=' ? cur + num(r) : n.op === '-=' ? cur - num(r) : n.op === '*=' ? cur * num(r) : n.op === '/=' ? cur / (num(r) || NaN) : cur % num(r);
        assign(n.l, v);
        return v;
      }
      case 'incdec': {
        const old = num(ev(n.l));
        const nv = n.op === '++' ? old + 1 : old - 1;
        assign(n.l, nv);
        return n.pre ? nv : old;
      }
      case 'bin': {
        if (n.op === '&&') return num(ev(n.a)) && num(ev(n.b)) ? 1 : 0;
        if (n.op === '||') return num(ev(n.a)) || num(ev(n.b)) ? 1 : 0;
        const a = ev(n.a);
        const b = ev(n.b);
        switch (n.op) {
          case '+':
            return num(a) + num(b);
          case '-':
            return num(a) - num(b);
          case '*':
            return num(a) * num(b);
          case '/':
            if (num(b) === 0) throw new Error('divisione per zero');
            return num(a) / num(b);
          case '%':
            return num(a) % num(b);
        }
        const numeric = isNumLike(a) && isNumLike(b);
        const x: Val = numeric ? num(a) : str(a);
        const y: Val = numeric ? num(b) : str(b);
        const r = n.op === '<' ? x < y : n.op === '<=' ? x <= y : n.op === '>' ? x > y : n.op === '>=' ? x >= y : n.op === '==' ? x === y : x !== y;
        return r ? 1 : 0;
      }
      case 'un': {
        const v = ev(n.e);
        return n.op === '!' ? (num(v) || (typeof v === 'string' && v !== '') ? 0 : 1) : n.op === '-' ? -num(v) : num(v);
      }
      case 'cond':
        return num(ev(n.c)) ? ev(n.a) : ev(n.b);
      case 'cat':
        return str(ev(n.a)) + str(ev(n.b));
      case 'match': {
        const r = reOf(n.b, ev).test(str(ev(n.a)));
        return r !== n.neg ? 1 : 0;
      }
      case 'in':
        return getArr(n.arr).has(str(ev(n.key))) ? 1 : 0;
      case 'call': {
        const a = n.args.map((x) => ev(x));
        switch (n.n) {
          case 'length':
            return n.args.length ? str(a[0]).length : record.length;
          case 'tolower':
            return str(a[0]).toLowerCase();
          case 'toupper':
            return str(a[0]).toUpperCase();
          case 'substr': {
            const s = str(a[0]);
            const from = Math.max(1, Math.trunc(num(a[1])));
            return a.length > 2 ? s.substr(from - 1, Math.trunc(num(a[2]))) : s.slice(from - 1);
          }
          case 'index':
            return str(a[0]).indexOf(str(a[1])) + 1;
          case 'int':
            return Math.trunc(num(a[0]));
          case 'sqrt':
            return Math.sqrt(num(a[0]));
          case 'split': {
            const arrNode = n.args[1];
            const parts = split(str(a[0]), a.length > 2 ? str(a[2]) : fs);
            if (arrNode?.k === 'var') {
              const arr = getArr(arrNode.n);
              arr.clear();
              parts.forEach((p, i) => arr.set(String(i + 1), p));
            }
            return parts.length;
          }
          case 'sprintf':
            return formatPrintf(str(a[0]), a.slice(1));
          default:
            throw new Error(`funzione non supportata: ${n.n}`);
        }
      }
    }
  };
  const assign = (l: Node, v: Val) => {
    if (l.k === 'var') globals.set(l.n, v);
    else if (l.k === 'idx') getArr(l.n).set(str(ev(l.i)), v);
    else if (l.k === 'field') {
      const idx = Math.trunc(num(ev(l.e)));
      if (idx === 0) setRecord(str(v));
      else {
        while (fields.length < idx) fields.push('');
        fields[idx - 1] = str(v);
        record = fields.join(' ');
      }
    }
  };
  const tick = () => {
    if (++steps > 300000) throw new Error('programma troppo lungo (ciclo infinito?)');
  };
  const run = (s: Stmt): void => {
    tick();
    switch (s.k) {
      case 'block':
        for (const x of s.body) run(x);
        return;
      case 'print':
        buf += (s.args.length ? s.args.map((a) => str(ev(a))).join(' ') : record) + '\n';
        return;
      case 'printf':
        buf += formatPrintf(str(ev(s.args[0])), s.args.slice(1).map((a) => ev(a)));
        return;
      case 'expr':
        ev(s.e);
        return;
      case 'if':
        if (num(ev(s.c)) || (typeof ev(s.c) === 'string' && ev(s.c) !== '' && !isNumLike(ev(s.c)))) run(s.a);
        else if (s.b) run(s.b);
        return;
      case 'forin':
        for (const k of [...getArr(s.arr).keys()]) {
          globals.set(s.v, k);
          run(s.body);
        }
        return;
      case 'for':
        if (s.init) run(s.init);
        while (!s.c || num(ev(s.c))) {
          tick();
          run(s.body);
          if (s.step) run(s.step);
        }
        return;
      case 'while':
        while (num(ev(s.c))) {
          tick();
          run(s.body);
        }
        return;
      case 'next':
        throw new Next();
      case 'exit':
        throw new Exit();
    }
  };
  try {
    try {
      for (const r of rules.filter((x) => x.kind === 'begin')) if (r.body) run(r.body);
      outer: for (const text of texts) {
        for (const line of splitLines(text)) {
          NR++;
          setRecord(line);
          try {
            for (const r of rules.filter((x) => x.kind === 'main')) {
              const ok = !r.pattern || (r.pattern.k === 're' ? new RegExp(r.pattern.v).test(record) : num(ev(r.pattern)) !== 0 || (() => { const v = ev(r.pattern!); return typeof v === 'string' && v !== '' && !isNumLike(v); })());
              if (!ok) continue;
              if (r.body) run(r.body);
              else buf += record + '\n';
            }
          } catch (e) {
            if (!(e instanceof Next)) throw e;
          }
          if (steps > 300000) break outer;
        }
      }
    } catch (e) {
      if (!(e instanceof Exit)) throw e;
    }
    for (const r of rules.filter((x) => x.kind === 'end')) if (r.body) run(r.body);
  } catch (e) {
    if (!(e instanceof Exit)) {
      c.err(`awk: ${(e as Error).message}`);
      return 2;
    }
  }
  for (const l of splitLines(buf)) c.out(l);
  return 0;
}

function awk(c: Ctx): number {
  const p = parseOpts(c.args, '', 'Fv');
  if (p.err) {
    c.err(`awk: ${p.err}`);
    return 2;
  }
  const prog = p.rest.shift();
  if (prog === undefined) {
    c.err("Usage: awk [-F sep] 'programma' [file...]");
    c.info("💡 Esempio: awk '{print $1}' file.log · awk -F: '{print $1}' /etc/passwd");
    return 2;
  }
  let rules: Rule[];
  try {
    rules = new AwkParser(tokenizeAwk(prog)).program();
  } catch (e) {
    c.err(`awk: errore di sintassi nel programma: ${(e as Error).message}`);
    c.info("💡 Il programma va tra apici singoli: '{print $1}'. Struttura: 'condizione { azione }'.");
    return 2;
  }
  const vars: Record<string, string> = {};
  const vv = p.v.v;
  if (vv && vv.includes('=')) vars[vv.slice(0, vv.indexOf('='))] = vv.slice(vv.indexOf('=') + 1);
  const fsep = p.v.F === undefined ? ' ' : p.v.F === '\\t' || p.v.F === 't' ? '\t' : p.v.F;
  const texts: string[] = [];
  if (p.rest.length === 0) {
    if (rules.every((r) => r.kind === 'begin')) {
      /* solo BEGIN: nessun input necessario */
    } else {
      const t = readText(c, [], 'awk');
      if (t === null) return 2;
      texts.push(t);
    }
  } else
    for (const f of p.rest) {
      const t = readText(c, [f], 'awk');
      if (t === null) return 2;
      texts.push(t);
    }
  return runAwk(c, rules, fsep, vars, texts);
}

// =============================================================== SED

interface SedCmd {
  from: ((n: number, line: string, last: boolean) => boolean) | null;
  to: ((n: number, line: string, last: boolean) => boolean) | null;
  neg: boolean;
  op: string;
  re?: RegExp;
  repl?: string;
  flagsG?: boolean;
  flagsP?: boolean;
  nth?: number;
  map?: [string, string];
}

function parseSed(script: string): SedCmd[] | string {
  const cmds: SedCmd[] = [];
  let i = 0;
  const addr = (): ((n: number, line: string, last: boolean) => boolean) | null => {
    const m = script.slice(i).match(/^(\d+|\$)/);
    if (m) {
      i += m[0].length;
      return m[0] === '$' ? (_n, _l, last) => last : (n) => n === Number(m[0]);
    }
    if (script[i] === '/') {
      let j = i + 1;
      let s = '';
      while (j < script.length && script[j] !== '/') {
        if (script[j] === '\\' && script[j + 1] === '/') {
          s += '/';
          j += 2;
        } else s += script[j++];
      }
      i = j + 1;
      let re: RegExp;
      try {
        re = new RegExp(s);
      } catch {
        return () => false;
      }
      return (_n, line) => re.test(line);
    }
    return null;
  };
  while (i < script.length) {
    while (i < script.length && /[\s;]/.test(script[i])) i++;
    if (i >= script.length) break;
    const from = addr();
    let to = null;
    if (from && script[i] === ',') {
      i++;
      to = addr();
      if (!to) return 'indirizzo non valido dopo la virgola';
    }
    while (script[i] === ' ') i++;
    let neg = false;
    if (script[i] === '!') {
      neg = true;
      i++;
    }
    const op = script[i++];
    if (!op) return 'comando mancante';
    if (op === 's') {
      const d = script[i++];
      if (!d) return 'comando s incompleto';
      const readPart = () => {
        let s = '';
        while (i < script.length && script[i] !== d) {
          if (script[i] === '\\' && i + 1 < script.length) {
            s += script[i + 1] === d ? d : script[i] + script[i + 1];
            i += 2;
          } else s += script[i++];
        }
        i++;
        return s;
      };
      const pat = readPart();
      const repl = readPart();
      let flags = '';
      while (i < script.length && /[gpiI0-9]/.test(script[i])) flags += script[i++];
      let re: RegExp;
      try {
        re = new RegExp(pat, flags.includes('i') || flags.includes('I') ? 'i' : '');
      } catch {
        return `espressione regolare non valida: ${pat}`;
      }
      const nth = flags.match(/\d+/);
      cmds.push({ from, to, neg, op: 's', re, repl, flagsG: flags.includes('g'), flagsP: flags.includes('p'), nth: nth ? Number(nth[0]) : undefined });
    } else if (op === 'y') {
      const d = script[i++];
      const a = script.slice(i, script.indexOf(d, i));
      i += a.length + 1;
      const b = script.slice(i, script.indexOf(d, i));
      i += b.length + 1;
      if (a.length !== b.length) return 'le due liste di y devono avere la stessa lunghezza';
      cmds.push({ from, to, neg, op: 'y', map: [a, b] });
    } else if (['d', 'p', 'q', '='].includes(op)) cmds.push({ from, to, neg, op });
    else return `comando non supportato: ${op}`;
  }
  return cmds;
}

function sed(c: Ctx): number {
  const scripts: string[] = [];
  const args: string[] = [];
  let quiet = false;
  let inPlace = false;
  for (let i = 0; i < c.args.length; i++) {
    const a = c.args[i];
    if (a === '-e') scripts.push(c.args[++i] ?? '');
    else if (a === '-n') quiet = true;
    else if (a === '-i') inPlace = true;
    else if (a === '-E' || a === '-r') continue;
    else if (/^-[nEri]+$/.test(a)) {
      if (a.includes('n')) quiet = true;
      if (a.includes('i')) inPlace = true;
    } else args.push(a);
  }
  if (!scripts.length) {
    const s = args.shift();
    if (s === undefined) {
      c.err("Usage: sed [-n] [-i] 'comando' [file...]");
      c.info("💡 Esempi: sed 's/vecchio/nuovo/g' file · sed -n '2,4p' file · sed '/errore/d' file");
      return 1;
    }
    scripts.push(s);
  }
  const cmds = parseSed(scripts.join('\n'));
  if (typeof cmds === 'string') {
    c.err(`sed: errore nello script: ${cmds}`);
    return 1;
  }
  const process = (text: string): string[] => {
    const lines = splitLines(text);
    const res: string[] = [];
    const active = new Map<SedCmd, boolean>();
    outer: for (let idx = 0; idx < lines.length; idx++) {
      let line = lines[idx];
      const n = idx + 1;
      const last = n === lines.length;
      let deleted = false;
      for (const cmd of cmds) {
        let sel = true;
        if (cmd.from) {
          if (cmd.to) {
            if (active.get(cmd)) {
              sel = true;
              if (cmd.to(n, line, last)) active.set(cmd, false);
            } else if (cmd.from(n, line, last)) {
              sel = true;
              if (!cmd.to(n, line, last) || n === 1) active.set(cmd, !cmd.to(n, line, last));
            } else sel = false;
          } else sel = cmd.from(n, line, last);
        }
        if (cmd.neg) sel = !sel;
        if (!sel) continue;
        if (cmd.op === 'd') {
          deleted = true;
          break;
        }
        if (cmd.op === 'p') res.push(line);
        else if (cmd.op === '=') res.push(String(n));
        else if (cmd.op === 'q') {
          if (!quiet) res.push(line);
          break outer;
        } else if (cmd.op === 'y' && cmd.map) line = [...line].map((ch) => (cmd.map![0].includes(ch) ? cmd.map![1][cmd.map![0].indexOf(ch)] : ch)).join('');
        else if (cmd.op === 's' && cmd.re) {
          let count = 0;
          const re = new RegExp(cmd.re.source, cmd.re.flags + 'g');
          const next = line.replace(re, (m: string, ...g: unknown[]) => {
            count++;
            if (!cmd.flagsG && !cmd.nth && count > 1) return m;
            if (cmd.nth && count !== cmd.nth && !cmd.flagsG) return m;
            if (cmd.nth && cmd.flagsG && count < cmd.nth) return m;
            const groups = g.slice(0, g.findIndex((x) => typeof x === 'number'));
            return (cmd.repl ?? '').replace(/\\(\d)|&|\\n|\\&/g, (t, d: string) => (t === '&' ? m : t === '\\n' ? '\n' : t === '\\&' ? '&' : String(groups[Number(d) - 1] ?? '')));
          });
          if (next !== line && cmd.flagsP) res.push(next);
          line = next;
        }
      }
      if (!deleted && !quiet) res.push(line);
    }
    return res;
  };
  if (!args.length) {
    const t = readText(c, [], 'sed');
    if (t === null) return 1;
    for (const l of process(t)) for (const part of l.split('\n')) c.out(part);
    return 0;
  }
  for (const f of args) {
    const t = readText(c, [f], 'sed');
    if (t === null) return 1;
    const res = process(t);
    if (inPlace) {
      const e = c.sh.writeText(c.sh.abs(f), res.join('\n') + (res.length ? '\n' : ''), false);
      if (e) {
        c.err(`sed: ${f}: ${e}`);
        return 1;
      }
      c.emit({ type: 'write', path: c.sh.abs(f) });
    } else for (const l of res) for (const part of l.split('\n')) c.out(part);
  }
  return 0;
}

Object.assign(COMMANDS, { awk, sed });
