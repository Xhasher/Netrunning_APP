// Mini Python: interprete. Esegue gli script nel filesystem simulato del deck.
// Messaggi di errore e traceback imitano quelli del vero Python 3, così si impara a leggerli.

import { PySyntaxError, parse, type Expr, type FPart, type Param, type Stmt } from './pyparse';
import { sha256Bytes } from './sha256';

// ---------------------------------------------------------------- valori

export class PyFloat {
  constructor(public v: number) {}
}
export class PyList {
  view?: string;
  constructor(public items: PyVal[]) {}
}
export class PyTuple {
  constructor(public items: PyVal[]) {}
}
export class PyDict {
  map = new Map<string, [PyVal, PyVal]>();
  kind: 'dict' | 'Counter' | 'defaultdict' = 'dict';
  factory: PyVal = null;
}
export class PySet {
  map = new Map<string, PyVal>();
}
export class PyBytes {
  /** un carattere per byte (0-255) */
  constructor(public s: string) {}
}
export class PyFunc {
  constructor(
    public name: string,
    public params: Param[],
    public body: Stmt[] | Expr,
    public closure: Scope,
    public defaults: PyVal[],
  ) {}
}
export class PyBuiltin {
  constructor(
    public name: string,
    public fn: (args: PyVal[], kw: Record<string, PyVal>) => PyVal,
    /** è un tipo (int, str...): serve a isinstance e a type() */
    public isType = false,
  ) {}
}
export class PyModule {
  constructor(
    public name: string,
    public attrs: Record<string, PyVal>,
  ) {}
}
export class PyRange {
  constructor(
    public start: number,
    public stop: number,
    public step: number,
  ) {}
}
export class PyObj {
  constructor(
    public type: string,
    public attrs: Record<string, unknown>,
  ) {}
}

export type PyVal =
  | null
  | boolean
  | number
  | string
  | PyFloat
  | PyList
  | PyTuple
  | PyDict
  | PySet
  | PyBytes
  | PyFunc
  | PyBuiltin
  | PyModule
  | PyRange
  | PyObj;

export class PyExc extends Error {
  frames: { name: string; line: number }[] | null = null;
  value: PyObj;
  constructor(
    public type: string,
    public msg: string,
  ) {
    super(msg);
    this.value = new PyObj('exception', { type, msg });
  }
}

class BreakSig {}
class ContinueSig {}
class ReturnSig {
  constructor(public v: PyVal) {}
}
class ExitSig {
  constructor(public code: number) {}
}

export class Scope {
  vars = new Map<string, PyVal>();
  globalsDecl = new Set<string>();
  constructor(public parent: Scope | null) {}
}

// ---------------------------------------------------------------- utilità sui valori

const isNum = (v: PyVal): v is number | boolean | PyFloat => typeof v === 'number' || typeof v === 'boolean' || v instanceof PyFloat;
const numOf = (v: number | boolean | PyFloat): number => (v instanceof PyFloat ? v.v : Number(v));
const isFloat = (v: PyVal) => v instanceof PyFloat;
const mk = (n: number, float: boolean): PyVal => (float ? new PyFloat(n) : n);
const isSeq = (v: PyVal): v is PyList | PyTuple => v instanceof PyList || v instanceof PyTuple;

export function typeName(v: PyVal): string {
  if (v === null) return 'NoneType';
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'number') return 'int';
  if (typeof v === 'string') return 'str';
  if (v instanceof PyFloat) return 'float';
  if (v instanceof PyList) return 'list';
  if (v instanceof PyTuple) return 'tuple';
  if (v instanceof PyDict) return v.kind;
  if (v instanceof PySet) return 'set';
  if (v instanceof PyBytes) return 'bytes';
  if (v instanceof PyFunc) return 'function';
  if (v instanceof PyBuiltin) return v.isType ? 'type' : 'builtin_function_or_method';
  if (v instanceof PyModule) return 'module';
  if (v instanceof PyRange) return 'range';
  if (v instanceof PyObj) return v.type === 'exception' ? String(v.attrs.type) : v.type;
  return 'object';
}

export function truthy(v: PyVal): boolean {
  if (v === null || v === false || v === 0 || v === '') return false;
  if (v instanceof PyFloat) return v.v !== 0;
  if (v instanceof PyList || v instanceof PyTuple) return v.items.length > 0;
  if (v instanceof PyDict || v instanceof PySet) return v.map.size > 0;
  if (v instanceof PyBytes) return v.s.length > 0;
  if (v instanceof PyRange) return rangeLen(v) > 0;
  return true;
}

function rangeLen(r: PyRange): number {
  const n = Math.ceil((r.stop - r.start) / r.step);
  return Math.max(0, n);
}

function floatRepr(v: number): string {
  if (Number.isNaN(v)) return 'nan';
  if (!Number.isFinite(v)) return v > 0 ? 'inf' : '-inf';
  if (Number.isInteger(v) && Math.abs(v) < 1e16) return `${v}.0`;
  const s = String(v);
  return s.replace(/e\+?(-?)(\d)$/, 'e$10$2').replace('e+', 'e+');
}

function strRepr(s: string): string {
  const q = s.includes("'") && !s.includes('"') ? '"' : "'";
  let out = '';
  for (const ch of s) {
    if (ch === '\\') out += '\\\\';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\t') out += '\\t';
    else if (ch === '\r') out += '\\r';
    else if (ch === q) out += '\\' + q;
    else if (ch.charCodeAt(0) < 32) out += '\\x' + ch.charCodeAt(0).toString(16).padStart(2, '0');
    else out += ch;
  }
  return q + out + q;
}

function bytesRepr(b: PyBytes): string {
  let out = '';
  for (const ch of b.s) {
    const c = ch.charCodeAt(0);
    if (ch === '\\') out += '\\\\';
    else if (ch === "'") out += "\\'";
    else if (ch === '\n') out += '\\n';
    else if (ch === '\t') out += '\\t';
    else if (ch === '\r') out += '\\r';
    else if (c < 32 || c > 126) out += '\\x' + c.toString(16).padStart(2, '0');
    else out += ch;
  }
  return `b'${out}'`;
}

export function repr(v: PyVal): string {
  if (v === null) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return strRepr(v);
  if (v instanceof PyFloat) return floatRepr(v.v);
  if (v instanceof PyList) {
    const inner = `[${v.items.map(repr).join(', ')}]`;
    return v.view ? `${v.view}(${inner})` : inner;
  }
  if (v instanceof PyTuple) return v.items.length === 1 ? `(${repr(v.items[0])},)` : `(${v.items.map(repr).join(', ')})`;
  if (v instanceof PyDict) {
    const inner = `{${[...v.map.values()].map(([k, x]) => `${repr(k)}: ${repr(x)}`).join(', ')}}`;
    if (v.kind === 'Counter') return `Counter(${v.map.size ? inner : ''})`;
    if (v.kind === 'defaultdict') return `defaultdict(${repr(v.factory)}, ${inner})`;
    return inner;
  }
  if (v instanceof PySet) return v.map.size ? `{${[...v.map.values()].map(repr).join(', ')}}` : 'set()';
  if (v instanceof PyBytes) return bytesRepr(v);
  if (v instanceof PyFunc) return v.name === '<lambda>' ? '<function <lambda> at 0x7f3a2c1e0d30>' : `<function ${v.name} at 0x7f3a2c1e0d30>`;
  if (v instanceof PyBuiltin) return v.isType ? `<class '${v.name}'>` : `<built-in function ${v.name}>`;
  if (v instanceof PyModule) return `<module '${v.name}'>`;
  if (v instanceof PyRange) return v.step === 1 ? `range(${v.start}, ${v.stop})` : `range(${v.start}, ${v.stop}, ${v.step})`;
  if (v instanceof PyObj) {
    if (v.type === 'exception') return `${v.attrs.type}(${strRepr(String(v.attrs.msg))})`;
    if (v.type === 're.Match') {
      const m = v.attrs.m as RegExpExecArray;
      return `<re.Match object; span=(${m.index}, ${m.index + m[0].length}), match=${strRepr(m[0])}>`;
    }
    if (v.type === 'file') return `<_io.TextIOWrapper name=${strRepr(String(v.attrs.name))} mode=${strRepr(String(v.attrs.mode))}>`;
    return `<${v.type} object>`;
  }
  return '?';
}

export function str(v: PyVal): string {
  if (typeof v === 'string') return v;
  if (v instanceof PyObj && v.type === 'exception') return String(v.attrs.msg);
  return repr(v);
}

function hashKey(v: PyVal): string {
  if (v === null) return 'N';
  if (isNum(v)) return 'n:' + numOf(v);
  if (typeof v === 'string') return 's:' + v;
  if (v instanceof PyTuple) return 't:(' + v.items.map(hashKey).join(',') + ')';
  if (v instanceof PyBytes) return 'b:' + v.s;
  if (v instanceof PyList || v instanceof PyDict || v instanceof PySet) throw new PyExc('TypeError', `unhashable type: '${typeName(v)}'`);
  return 'o:' + repr(v);
}

export function eq(a: PyVal, b: PyVal): boolean {
  if (isNum(a) && isNum(b)) return numOf(a) === numOf(b);
  if (typeof a === 'string' || typeof b === 'string') return a === b;
  if (a === null || b === null) return a === b;
  if (isSeq(a) && isSeq(b)) return a.constructor === b.constructor && a.items.length === b.items.length && a.items.every((x, i) => eq(x, b.items[i]));
  if (a instanceof PyDict && b instanceof PyDict) return a.map.size === b.map.size && [...a.map].every(([k, [, v]]) => b.map.has(k) && eq(v, b.map.get(k)![1]));
  if (a instanceof PySet && b instanceof PySet) return a.map.size === b.map.size && [...a.map.keys()].every((k) => b.map.has(k));
  if (a instanceof PyBytes && b instanceof PyBytes) return a.s === b.s;
  return a === b;
}

function cmpVals(a: PyVal, b: PyVal, op: string): number {
  if (isNum(a) && isNum(b)) return numOf(a) - numOf(b);
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
  if (isSeq(a) && isSeq(b) && a.constructor === b.constructor) {
    for (let i = 0; i < Math.min(a.items.length, b.items.length); i++) {
      if (!eq(a.items[i], b.items[i])) return cmpVals(a.items[i], b.items[i], op);
    }
    return a.items.length - b.items.length;
  }
  if (a instanceof PyBytes && b instanceof PyBytes) return a.s < b.s ? -1 : a.s > b.s ? 1 : 0;
  throw new PyExc('TypeError', `'${op}' not supported between instances of '${typeName(a)}' and '${typeName(b)}'`);
}

// byte <-> testo
export function utf8Bytes(s: string): PyBytes {
  let out = '';
  for (const b of new TextEncoder().encode(s)) out += String.fromCharCode(b);
  return new PyBytes(out);
}
function bytesArr(b: PyBytes): Uint8Array {
  return Uint8Array.from(b.s, (c) => c.charCodeAt(0));
}
function decodeBytes(b: PyBytes): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytesArr(b));
  } catch {
    throw new PyExc('UnicodeDecodeError', "'utf-8' codec can't decode bytes: invalid start byte");
  }
}

function newDict(pairs: [PyVal, PyVal][] = []): PyDict {
  const d = new PyDict();
  for (const [k, v] of pairs) d.map.set(hashKey(k), [k, v]);
  return d;
}
function newSet(items: PyVal[]): PySet {
  const s = new PySet();
  for (const v of items) s.map.set(hashKey(v), v);
  return s;
}

// ---------------------------------------------------------------- formattazione

function formatSpec(v: PyVal, spec: string): string {
  if (!spec) return str(v);
  const m = /^(?:(.)?([<>^=]))?([+\- ])?(0)?(\d+)?([,_])?(?:\.(\d+))?([bcdeEfFgGnosxX%])?$/.exec(spec);
  if (!m) throw new PyExc('ValueError', `Invalid format specifier '${spec}' for object of type '${typeName(v)}'`);
  const [, fillCh, alignCh, sign, zero, widthS, group, precS, type] = m;
  let s: string;
  const prec = precS !== undefined ? Number(precS) : undefined;
  const numeric = isNum(v);
  if (type && 'dbxXo'.includes(type)) {
    if (!numeric || isFloat(v)) throw new PyExc('ValueError', `Unknown format code '${type}' for object of type '${typeName(v)}'`);
    const n = numOf(v as number);
    s = type === 'd' ? String(Math.abs(n)) : type === 'b' ? Math.abs(n).toString(2) : type === 'o' ? Math.abs(n).toString(8) : Math.abs(n).toString(16);
    if (type === 'X') s = s.toUpperCase();
    if (group) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, group);
    if (n < 0) s = '-' + s;
    else if (sign === '+') s = '+' + s;
  } else if (type && 'fFeE%g'.includes(type)) {
    if (!numeric) throw new PyExc('ValueError', `Unknown format code '${type}' for object of type '${typeName(v)}'`);
    let n = numOf(v as number);
    const p = prec ?? 6;
    if (type === '%') n *= 100;
    s = type === 'e' || type === 'E' ? n.toExponential(p) : type === 'g' ? String(Number(n.toPrecision(p || 1))) : n.toFixed(p);
    if (type === 'E') s = s.toUpperCase();
    if (group) {
      const [ip, fp] = s.split('.');
      s = ip.replace(/\B(?=(\d{3})+(?!\d))/g, group) + (fp !== undefined ? '.' + fp : '');
    }
    if (type === '%') s += '%';
    if (sign === '+' && n >= 0) s = '+' + s;
  } else if (numeric && !type) {
    if (prec !== undefined && isFloat(v)) s = numOf(v as PyFloat).toFixed(prec);
    else s = str(v);
    if (group) s = s.replace(/^(-?\d+)/, (x) => x.replace(/\B(?=(\d{3})+(?!\d))/g, group));
    if (sign === '+' && numOf(v as number) >= 0) s = '+' + s;
  } else {
    s = str(v);
    if (prec !== undefined) s = s.slice(0, prec);
  }
  const width = widthS ? Number(widthS) : 0;
  if (s.length >= width) return s;
  const fill = fillCh ?? (zero && numeric ? '0' : ' ');
  const align = alignCh ?? (zero && numeric ? '=' : numeric ? '>' : '<');
  const pad = width - s.length;
  if (align === '<') return s + fill.repeat(pad);
  if (align === '>') return fill.repeat(pad) + s;
  if (align === '^') return fill.repeat(Math.floor(pad / 2)) + s + fill.repeat(Math.ceil(pad / 2));
  const neg = /^[+-]/.test(s) ? s[0] : '';
  return neg + fill.repeat(pad) + s.slice(neg.length);
}

function percentFormat(fmt: string, arg: PyVal): string {
  const args = arg instanceof PyTuple ? [...arg.items] : [arg];
  let i = 0;
  const out = fmt.replace(/%([-+ 0]*)(\d+)?(?:\.(\d+))?([sdirfxX%])/g, (_m, flags: string, w: string, p: string, t: string) => {
    if (t === '%') return '%';
    if (i >= args.length) throw new PyExc('TypeError', 'not enough arguments for format string');
    const v = args[i++];
    let s: string;
    if (t === 's') s = str(v);
    else if (t === 'r') s = repr(v);
    else if (t === 'f') s = numOf(toNum(v, '%f')).toFixed(p ? Number(p) : 6);
    else if (t === 'x' || t === 'X') s = Math.trunc(numOf(toNum(v, '%x'))).toString(16)[t === 'X' ? 'toUpperCase' : 'toLowerCase']();
    else s = String(Math.trunc(numOf(toNum(v, '%d'))));
    const width = w ? Number(w) : 0;
    if (s.length < width) s = flags.includes('-') ? s.padEnd(width) : s.padStart(width, flags.includes('0') ? '0' : ' ');
    return s;
  });
  if (i < args.length) throw new PyExc('TypeError', 'not all arguments converted during string formatting');
  return out;
}

function toNum(v: PyVal, what: string): number | boolean | PyFloat {
  if (!isNum(v)) throw new PyExc('TypeError', `${what} format: a real number is required, not ${typeName(v)}`);
  return v;
}

// ---------------------------------------------------------------- regex Python -> JS

function jsRegex(p: string, flags: number, extra = ''): RegExp {
  let src = p.replace(/\(\?P<(\w+)>/g, '(?<$1>').replace(/\(\?P=(\w+)\)/g, '\\k<$1>').replace(/\\Z/g, '$').replace(/\\A/g, '^');
  let f = 'u' + extra;
  if (flags & 2) f += 'i';
  if (flags & 8) f += 'm';
  if (flags & 16) f += 's';
  const inline = /^\(\?([aiLmsux]+)\)/.exec(src);
  if (inline) {
    src = src.slice(inline[0].length);
    for (const c of inline[1]) if ('ims'.includes(c) && !f.includes(c)) f += c;
  }
  try {
    return new RegExp(src, f);
  } catch (e) {
    try {
      return new RegExp(src, f.replace('u', ''));
    } catch {
      throw new PyExc('re.error', `espressione regolare non valida: ${(e as Error).message}`);
    }
  }
}

function matchObj(m: RegExpExecArray): PyObj {
  return new PyObj('re.Match', { m });
}

// ---------------------------------------------------------------- host (il deck)

export interface PyHost {
  argv: string[];
  stdin: string | null;
  /** contenuto del file, o il tipo di errore */
  read(path: string): string | 'enoent' | 'eacces' | 'eisdir';
  write(path: string, text: string, append: boolean): string | null;
  listdir(path: string): string[] | null;
  kind(path: string): 'file' | 'dir' | null;
  cwd: string;
}

export interface PyResult {
  out: string[];
  err: string[];
  ok: boolean;
  /** nome del modulo non simulato richiesto, se c'è */
  missingModule?: string;
}

const MAX_OPS = 400_000;

// ---------------------------------------------------------------- interprete

export class Interp {
  out: string[] = [];
  private pending = '';
  private ops = 0;
  private frames: { name: string; line: number }[] = [{ name: '<module>', line: 0 }];
  private builtins: Record<string, PyVal>;
  private modules: Record<string, PyModule> = {};
  private openFiles: PyObj[] = [];
  globals = new Scope(null);
  missingModule?: string;

  constructor(
    private host: PyHost,
    readonly filename: string,
  ) {
    this.builtins = this.makeBuiltins();
  }

  // ---------------------------------------------------------- output

  write(text: string): void {
    const parts = (this.pending + text).split('\n');
    this.pending = parts.pop()!;
    this.out.push(...parts);
    if (this.out.length > 5000) throw new PyExc('RuntimeError', 'troppo output: lo script è stato interrotto');
  }
  flush(): void {
    if (this.pending) this.out.push(this.pending);
    this.pending = '';
    for (const f of this.openFiles) this.closeFile(f);
  }

  private tick(): void {
    if (++this.ops > MAX_OPS) throw new PyExc('TimeoutError', 'script interrotto dopo troppe operazioni (forse un ciclo infinito?)');
  }

  // ---------------------------------------------------------- esecuzione

  run(src: string): void {
    const body = parse(src);
    this.execBlock(body, this.globals);
  }

  private execBlock(body: Stmt[], sc: Scope): void {
    for (const s of body) this.exec(s, sc);
  }

  private exec(s: Stmt, sc: Scope): void {
    this.tick();
    this.frames[this.frames.length - 1].line = s.line;
    switch (s.k) {
      case 'expr':
        this.eval(s.e, sc);
        return;
      case 'assign': {
        const v = this.eval(s.value, sc);
        for (const t of s.targets) this.assign(t, v, sc);
        return;
      }
      case 'aug': {
        const t = s.target;
        if (t.k === 'sub') {
          const obj = this.eval(t.e, sc);
          const key = this.eval(t.idx, sc);
          const cur = this.getItem(obj, key);
          this.setItem(obj, key, this.binop(s.op, cur, this.eval(s.value, sc), true));
        } else if (t.k === 'name') {
          const cur = this.lookup(t.id, sc);
          this.assign(t, this.binop(s.op, cur, this.eval(s.value, sc), true), sc);
        } else this.assign(t, this.binop(s.op, this.eval(t, sc), this.eval(s.value, sc), true), sc);
        return;
      }
      case 'if':
        for (const [c, body] of s.tests)
          if (truthy(this.eval(c, sc))) {
            this.execBlock(body, sc);
            return;
          }
        this.execBlock(s.orelse, sc);
        return;
      case 'while': {
        let broke = false;
        while (truthy(this.eval(s.c, sc))) {
          this.tick();
          try {
            this.execBlock(s.body, sc);
          } catch (e) {
            if (e instanceof BreakSig) {
              broke = true;
              break;
            }
            if (!(e instanceof ContinueSig)) throw e;
          }
        }
        if (!broke) this.execBlock(s.orelse, sc);
        return;
      }
      case 'for': {
        const items = this.iterate(this.eval(s.iter, sc));
        let broke = false;
        for (const it of items) {
          this.tick();
          this.assign(s.target, it, sc);
          try {
            this.execBlock(s.body, sc);
          } catch (e) {
            if (e instanceof BreakSig) {
              broke = true;
              break;
            }
            if (!(e instanceof ContinueSig)) throw e;
          }
        }
        if (!broke) this.execBlock(s.orelse, sc);
        return;
      }
      case 'def':
        this.assign({ k: 'name', id: s.name }, new PyFunc(s.name, s.params, s.body, sc, s.params.map((p) => (p.def ? this.eval(p.def, sc) : null))), sc);
        return;
      case 'return':
        throw new ReturnSig(s.e ? this.eval(s.e, sc) : null);
      case 'break':
        throw new BreakSig();
      case 'continue':
        throw new ContinueSig();
      case 'pass':
        return;
      case 'global':
        for (const n of s.names) sc.globalsDecl.add(n);
        return;
      case 'import':
        for (const [m, as] of s.names) {
          const mod = this.importModule(m);
          if (as) this.assign({ k: 'name', id: as }, mod, sc);
          else {
            const top = m.split('.')[0];
            this.assign({ k: 'name', id: top }, this.importModule(top), sc);
          }
        }
        return;
      case 'from': {
        const mod = this.importModule(s.mod);
        for (const [n, as] of s.names) {
          if (n === '*') {
            for (const [k, v] of Object.entries(mod.attrs)) this.assign({ k: 'name', id: k }, v, sc);
            continue;
          }
          if (!(n in mod.attrs)) throw new PyExc('ImportError', `cannot import name '${n}' from '${s.mod}'`);
          this.assign({ k: 'name', id: as ?? n }, mod.attrs[n], sc);
        }
        return;
      }
      case 'try':
        this.execTry(s, sc);
        return;
      case 'with': {
        const ctx = this.eval(s.e, sc);
        if (s.name) this.assign(s.name, ctx, sc);
        try {
          this.execBlock(s.body, sc);
        } finally {
          if (ctx instanceof PyObj && ctx.type === 'file') this.closeFile(ctx);
        }
        return;
      }
      case 'raise': {
        if (!s.e) throw new PyExc('RuntimeError', 'No active exception to reraise');
        let v = this.eval(s.e, sc);
        if (v instanceof PyBuiltin && v.isType) v = this.call(v, [], {});
        if (v instanceof PyObj && v.type === 'exception') {
          const e = new PyExc(String(v.attrs.type), String(v.attrs.msg));
          e.value = v;
          throw e;
        }
        throw new PyExc('TypeError', 'exceptions must derive from BaseException');
      }
      case 'del':
        for (const t of s.targets) {
          if (t.k === 'sub') {
            const obj = this.eval(t.e, sc);
            const key = this.eval(t.idx, sc);
            if (obj instanceof PyDict) {
              if (!obj.map.delete(hashKey(key))) throw new PyExc('KeyError', repr(key));
            } else if (obj instanceof PyList) {
              const i = this.index(obj.items.length, key);
              obj.items.splice(i, 1);
            } else throw new PyExc('TypeError', `'${typeName(obj)}' object doesn't support item deletion`);
          } else if (t.k === 'name') {
            if (!sc.vars.delete(t.id)) throw new PyExc('NameError', `name '${t.id}' is not defined`);
          }
        }
        return;
      case 'assert':
        if (!truthy(this.eval(s.c, sc))) throw new PyExc('AssertionError', s.msg ? str(this.eval(s.msg, sc)) : '');
        return;
    }
  }

  private execTry(s: Extract<Stmt, { k: 'try' }>, sc: Scope): void {
    try {
      try {
        this.execBlock(s.body, sc);
      } catch (e) {
        if (!(e instanceof PyExc)) throw e;
        if (e.type === 'TimeoutError' && e.msg.startsWith('script interrotto')) throw e;
        const h = s.handlers.find((x) => !x.types || x.types.some((t) => excMatches(e.type, t)));
        if (!h) throw e;
        if (h.name) this.assign({ k: 'name', id: h.name }, e.value, sc);
        this.execBlock(h.body, sc);
        return;
      }
      this.execBlock(s.orelse, sc);
    } finally {
      if (s.final.length) this.execBlock(s.final, sc);
    }
  }

  // ---------------------------------------------------------- nomi e assegnazioni

  private lookup(id: string, sc: Scope): PyVal {
    let s: Scope | null = sc;
    while (s) {
      if (s.globalsDecl.has(id)) {
        s = this.globals;
        continue;
      }
      if (s.vars.has(id)) return s.vars.get(id)!;
      s = s.parent;
    }
    if (id in this.builtins) return this.builtins[id];
    throw new PyExc('NameError', `name '${id}' is not defined${suggestName(id, sc, this.builtins)}`);
  }

  private assign(t: Expr, v: PyVal, sc: Scope): void {
    switch (t.k) {
      case 'name':
        (sc.globalsDecl.has(t.id) ? this.globals : sc).vars.set(t.id, v);
        return;
      case 'tuple':
      case 'list': {
        const items = this.iterate(v);
        const starAt = t.items.findIndex((x) => x.k === 'star');
        if (starAt < 0) {
          if (items.length > t.items.length) throw new PyExc('ValueError', `too many values to unpack (expected ${t.items.length})`);
          if (items.length < t.items.length) throw new PyExc('ValueError', `not enough values to unpack (expected ${t.items.length}, got ${items.length})`);
          t.items.forEach((x, i) => this.assign(x, items[i], sc));
        } else {
          const after = t.items.length - starAt - 1;
          if (items.length < t.items.length - 1) throw new PyExc('ValueError', `not enough values to unpack (expected at least ${t.items.length - 1}, got ${items.length})`);
          t.items.slice(0, starAt).forEach((x, i) => this.assign(x, items[i], sc));
          this.assign((t.items[starAt] as { e: Expr }).e, new PyList(items.slice(starAt, items.length - after)), sc);
          t.items.slice(starAt + 1).forEach((x, i) => this.assign(x, items[items.length - after + i], sc));
        }
        return;
      }
      case 'sub':
        this.setItem(this.eval(t.e, sc), this.eval(t.idx, sc), v);
        return;
      case 'attr':
        throw new PyExc('AttributeError', `'${typeName(this.eval(t.e, sc))}' object attribute '${t.name}' is read-only`);
      default:
        throw new PyExc('SyntaxError', 'cannot assign to expression');
    }
  }

  // ---------------------------------------------------------- espressioni

  eval(e: Expr, sc: Scope): PyVal {
    switch (e.k) {
      case 'num':
        return mk(e.v, e.float);
      case 'str':
        return e.v;
      case 'bytes':
        return new PyBytes(e.v);
      case 'const':
        return e.v;
      case 'fstr':
        return this.fstr(e.parts, sc);
      case 'name':
        return this.lookup(e.id, sc);
      case 'list':
        return new PyList(this.evalItems(e.items, sc));
      case 'tuple':
        return new PyTuple(this.evalItems(e.items, sc));
      case 'set':
        return newSet(this.evalItems(e.items, sc));
      case 'dict':
        return newDict(e.pairs.map(([k, v]) => [this.eval(k, sc), this.eval(v, sc)]));
      case 'comp':
        return this.comprehension(e, sc);
      case 'bin':
        return this.binop(e.op, this.eval(e.l, sc), this.eval(e.r, sc));
      case 'un': {
        const v = this.eval(e.e, sc);
        if (!isNum(v)) throw new PyExc('TypeError', `bad operand type for unary ${e.op}: '${typeName(v)}'`);
        if (e.op === '-') return mk(-numOf(v), isFloat(v));
        if (e.op === '~') return ~numOf(v);
        return mk(numOf(v), isFloat(v));
      }
      case 'bool': {
        const l = this.eval(e.l, sc);
        if (e.op === 'and') return truthy(l) ? this.eval(e.r, sc) : l;
        return truthy(l) ? l : this.eval(e.r, sc);
      }
      case 'not':
        return !truthy(this.eval(e.e, sc));
      case 'cmp': {
        let l = this.eval(e.first, sc);
        for (const [op, re] of e.ops) {
          const r = this.eval(re, sc);
          if (!this.compare(op, l, r)) return false;
          l = r;
        }
        return true;
      }
      case 'ifexp':
        return truthy(this.eval(e.c, sc)) ? this.eval(e.a, sc) : this.eval(e.b, sc);
      case 'call': {
        if (e.f.k === 'attr') {
          const obj = this.eval(e.f.e, sc);
          const args = this.callArgs(e, sc);
          return this.callMethod(obj, e.f.name, args, this.kwArgs(e, sc));
        }
        const f = this.eval(e.f, sc);
        return this.call(f, this.callArgs(e, sc), this.kwArgs(e, sc));
      }
      case 'attr':
        return this.getAttr(this.eval(e.e, sc), e.name);
      case 'sub': {
        const obj = this.eval(e.e, sc);
        if (e.idx.k === 'slice') return this.slice(obj, e.idx, sc);
        return this.getItem(obj, this.eval(e.idx, sc));
      }
      case 'slice':
        throw new PyExc('SyntaxError', 'invalid syntax');
      case 'lambda':
        return new PyFunc('<lambda>', e.params, e.body, sc, e.params.map((p) => (p.def ? this.eval(p.def, sc) : null)));
      case 'star':
        throw new PyExc('SyntaxError', "can't use starred expression here");
    }
  }

  private evalItems(items: Expr[], sc: Scope): PyVal[] {
    const out: PyVal[] = [];
    for (const it of items) {
      if (it.k === 'star') out.push(...this.iterate(this.eval(it.e, sc)));
      else out.push(this.eval(it, sc));
    }
    return out;
  }

  private callArgs(e: Extract<Expr, { k: 'call' }>, sc: Scope): PyVal[] {
    const out: PyVal[] = [];
    e.args.forEach((a, i) => {
      if (e.star[i]) out.push(...this.iterate(this.eval(a, sc)));
      else out.push(this.eval(a, sc));
    });
    return out;
  }

  private kwArgs(e: Extract<Expr, { k: 'call' }>, sc: Scope): Record<string, PyVal> {
    const kw: Record<string, PyVal> = {};
    for (const [k, v] of e.kw) kw[k] = this.eval(v, sc);
    return kw;
  }

  private fstr(parts: FPart[], sc: Scope): string {
    let out = '';
    for (const p of parts) {
      if (typeof p === 'string') {
        out += p;
        continue;
      }
      let v = this.eval(p.e, sc);
      if (p.conv === 'r') v = repr(v);
      else if (p.conv === 's') v = str(v);
      const spec = p.spec ? this.fstr(p.spec, sc) : '';
      out += formatSpec(v, spec);
    }
    return out;
  }

  private comprehension(e: Extract<Expr, { k: 'comp' }>, sc: Scope): PyVal {
    const inner = new Scope(sc);
    const results: PyVal[] = [];
    const pairs: [PyVal, PyVal][] = [];
    const loop = (gi: number) => {
      if (gi === e.gens.length) {
        if (e.kind === 'dict') pairs.push([this.eval(e.elt, inner), this.eval(e.val!, inner)]);
        else results.push(this.eval(e.elt, inner));
        return;
      }
      const g = e.gens[gi];
      for (const it of this.iterate(this.eval(g.iter, gi === 0 ? sc : inner))) {
        this.tick();
        this.assign(g.target, it, inner);
        if (g.ifs.every((c) => truthy(this.eval(c, inner)))) loop(gi + 1);
      }
    };
    loop(0);
    if (e.kind === 'dict') return newDict(pairs);
    if (e.kind === 'set') return newSet(results);
    return new PyList(results);
  }

  // ---------------------------------------------------------- operatori

  binop(op: string, a: PyVal, b: PyVal, aug = false): PyVal {
    if (isNum(a) && isNum(b)) {
      const x = numOf(a);
      const y = numOf(b);
      const fl = isFloat(a) || isFloat(b);
      switch (op) {
        case '+':
          return mk(x + y, fl);
        case '-':
          return mk(x - y, fl);
        case '*':
          return mk(x * y, fl);
        case '/':
          if (y === 0) throw new PyExc('ZeroDivisionError', 'division by zero');
          return new PyFloat(x / y);
        case '//':
          if (y === 0) throw new PyExc('ZeroDivisionError', 'integer division or modulo by zero');
          return mk(Math.floor(x / y), fl);
        case '%':
          if (y === 0) throw new PyExc('ZeroDivisionError', 'integer modulo by zero');
          return mk(x - y * Math.floor(x / y), fl);
        case '**':
          return mk(x ** y, fl || y < 0);
        case '&':
          return x & y;
        case '|':
          return x | y;
        case '^':
          return x ^ y;
        case '<<':
          return x << y;
        case '>>':
          return x >> y;
      }
    }
    if (op === '+') {
      if (typeof a === 'string' && typeof b === 'string') return a + b;
      if (a instanceof PyList && b instanceof PyList) {
        if (aug) {
          a.items.push(...b.items);
          return a;
        }
        return new PyList([...a.items, ...b.items]);
      }
      if (a instanceof PyTuple && b instanceof PyTuple) return new PyTuple([...a.items, ...b.items]);
      if (a instanceof PyBytes && b instanceof PyBytes) return new PyBytes(a.s + b.s);
      if (a instanceof PyList && aug) {
        a.items.push(...this.iterate(b));
        return a;
      }
      if (typeof a === 'string') throw new PyExc('TypeError', `can only concatenate str (not "${typeName(b)}") to str`);
      if (a instanceof PyList) throw new PyExc('TypeError', `can only concatenate list (not "${typeName(b)}") to list`);
    }
    if (op === '*') {
      const rep = (s: PyVal, n: PyVal): PyVal | undefined => {
        if (typeof n !== 'number' && typeof n !== 'boolean') return undefined;
        const k = Math.max(0, Number(n));
        if (typeof s === 'string') return s.repeat(k);
        if (s instanceof PyList) return new PyList(Array.from({ length: k }, () => s.items).flat());
        if (s instanceof PyTuple) return new PyTuple(Array.from({ length: k }, () => s.items).flat());
        if (s instanceof PyBytes) return new PyBytes(s.s.repeat(k));
        return undefined;
      };
      const r = rep(a, b) ?? rep(b, a);
      if (r !== undefined) return r;
    }
    if (op === '%' && typeof a === 'string') return percentFormat(a, b);
    if (a instanceof PySet && b instanceof PySet) {
      const s = new PySet();
      if (op === '|') for (const [k, v] of [...a.map, ...b.map]) s.map.set(k, v);
      else if (op === '&') for (const [k, v] of a.map) b.map.has(k) && s.map.set(k, v);
      else if (op === '-') for (const [k, v] of a.map) !b.map.has(k) && s.map.set(k, v);
      else if (op === '^') for (const [k, v] of [...a.map, ...b.map]) (a.map.has(k) !== b.map.has(k)) && s.map.set(k, v);
      else throw new PyExc('TypeError', `unsupported operand type(s) for ${op}: 'set' and 'set'`);
      return s;
    }
    if (a instanceof PyDict && b instanceof PyDict && op === '|') {
      const d = newDict([...a.map.values(), ...b.map.values()]);
      return d;
    }
    throw new PyExc('TypeError', `unsupported operand type(s) for ${op}: '${typeName(a)}' and '${typeName(b)}'`);
  }

  private compare(op: string, a: PyVal, b: PyVal): boolean {
    switch (op) {
      case '==':
        return eq(a, b);
      case '!=':
        return !eq(a, b);
      case '<':
        return cmpVals(a, b, op) < 0;
      case '>':
        return cmpVals(a, b, op) > 0;
      case '<=':
        return cmpVals(a, b, op) <= 0;
      case '>=':
        return cmpVals(a, b, op) >= 0;
      case 'in':
        return this.contains(b, a);
      case 'not in':
        return !this.contains(b, a);
      case 'is':
        return a === b || (a === null && b === null);
      case 'is not':
        return !(a === b);
    }
    return false;
  }

  private contains(container: PyVal, v: PyVal): boolean {
    if (typeof container === 'string') {
      if (typeof v !== 'string') throw new PyExc('TypeError', `'in <string>' requires string as left operand, not ${typeName(v)}`);
      return container.includes(v);
    }
    if (container instanceof PyBytes) return v instanceof PyBytes ? container.s.includes(v.s) : container.s.includes(String.fromCharCode(Number(v)));
    if (container instanceof PyDict || container instanceof PySet) return container.map.has(hashKey(v));
    if (container instanceof PyList || container instanceof PyTuple) return container.items.some((x) => eq(x, v));
    if (container instanceof PyRange) return this.iterate(container).some((x) => eq(x, v));
    if (container instanceof PyObj && container.type === 'file') return this.iterate(container).some((x) => eq(x, v));
    throw new PyExc('TypeError', `argument of type '${typeName(container)}' is not iterable`);
  }

  // ---------------------------------------------------------- iterazione e indici

  iterate(v: PyVal): PyVal[] {
    if (v instanceof PyList || v instanceof PyTuple) return [...v.items];
    if (typeof v === 'string') return [...v];
    if (v instanceof PyDict) return [...v.map.values()].map(([k]) => k);
    if (v instanceof PySet) return [...v.map.values()];
    if (v instanceof PyBytes) return [...v.s].map((c) => c.charCodeAt(0));
    if (v instanceof PyRange) {
      const n = rangeLen(v);
      if (n > 1_000_000) throw new PyExc('MemoryError', 'range troppo grande per il deck');
      return Array.from({ length: n }, (_, i) => v.start + i * v.step);
    }
    if (v instanceof PyObj && v.type === 'file') {
      const lines = this.fileLines(v);
      v.attrs.pos = (v.attrs.text as string).length;
      return lines;
    }
    throw new PyExc('TypeError', `'${typeName(v)}' object is not iterable`);
  }

  private index(len: number, key: PyVal, what = 'list'): number {
    if (typeof key !== 'number' && typeof key !== 'boolean') throw new PyExc('TypeError', `${what} indices must be integers or slices, not ${typeName(key)}`);
    let i = Number(key);
    if (i < 0) i += len;
    if (i < 0 || i >= len) throw new PyExc('IndexError', `${what} index out of range`);
    return i;
  }

  getItem(obj: PyVal, key: PyVal): PyVal {
    if (obj instanceof PyList) return obj.items[this.index(obj.items.length, key)];
    if (obj instanceof PyTuple) return obj.items[this.index(obj.items.length, key, 'tuple')];
    if (typeof obj === 'string') return obj[this.index(obj.length, key, 'string')];
    if (obj instanceof PyBytes) return obj.s.charCodeAt(this.index(obj.s.length, key, 'index'));
    if (obj instanceof PyRange) return this.iterate(obj)[this.index(rangeLen(obj), key, 'range object')];
    if (obj instanceof PyDict) {
      const k = hashKey(key);
      const hit = obj.map.get(k);
      if (hit) return hit[1];
      if (obj.kind === 'Counter') return 0;
      if (obj.kind === 'defaultdict' && obj.factory) {
        const v = this.call(obj.factory, [], {});
        obj.map.set(k, [key, v]);
        return v;
      }
      throw new PyExc('KeyError', repr(key));
    }
    if (obj instanceof PyObj && obj.type === 're.Match') return this.matchGroup(obj, key);
    throw new PyExc('TypeError', `'${typeName(obj)}' object is not subscriptable`);
  }

  setItem(obj: PyVal, key: PyVal, v: PyVal): void {
    if (obj instanceof PyList) {
      obj.items[this.index(obj.items.length, key, 'list assignment')] = v;
      return;
    }
    if (obj instanceof PyDict) {
      obj.map.set(hashKey(key), [key, v]);
      return;
    }
    throw new PyExc('TypeError', `'${typeName(obj)}' object does not support item assignment`);
  }

  private slice(obj: PyVal, s: Extract<Expr, { k: 'slice' }>, sc: Scope): PyVal {
    const len = obj instanceof PyList || obj instanceof PyTuple ? obj.items.length : typeof obj === 'string' ? obj.length : obj instanceof PyBytes ? obj.s.length : -1;
    if (len < 0) throw new PyExc('TypeError', `'${typeName(obj)}' object is not subscriptable`);
    const num = (e: Expr | null): number | null => {
      if (!e) return null;
      const v = this.eval(e, sc);
      if (v === null) return null;
      if (typeof v !== 'number' && typeof v !== 'boolean') throw new PyExc('TypeError', 'slice indices must be integers or None');
      return Number(v);
    };
    const step = num(s.step) ?? 1;
    if (step === 0) throw new PyExc('ValueError', 'slice step cannot be zero');
    const norm = (x: number | null, def: number) => {
      if (x === null) return def;
      if (x < 0) x += len;
      return step > 0 ? Math.min(Math.max(x, 0), len) : Math.min(Math.max(x, -1), len - 1);
    };
    const lo = norm(num(s.lo), step > 0 ? 0 : len - 1);
    const hi = norm(num(s.hi), step > 0 ? len : -1);
    const idx: number[] = [];
    for (let i = lo; step > 0 ? i < hi : i > hi; i += step) idx.push(i);
    if (typeof obj === 'string') return idx.map((i) => obj[i]).join('');
    if (obj instanceof PyBytes) return new PyBytes(idx.map((i) => obj.s[i]).join(''));
    const items = idx.map((i) => (obj as PyList).items[i]);
    return obj instanceof PyTuple ? new PyTuple(items) : new PyList(items);
  }

  // ---------------------------------------------------------- chiamate

  call(f: PyVal, args: PyVal[], kw: Record<string, PyVal>): PyVal {
    this.tick();
    if (f instanceof PyBuiltin) return f.fn(args, kw);
    if (f instanceof PyFunc) {
      if (this.frames.length > 200) throw new PyExc('RecursionError', 'maximum recursion depth exceeded');
      const sc = new Scope(f.closure);
      const ps = f.params;
      if (args.length > ps.length) throw new PyExc('TypeError', `${f.name}() takes ${ps.length} positional argument${ps.length === 1 ? '' : 's'} but ${args.length} ${args.length === 1 ? 'was' : 'were'} given`);
      ps.forEach((p, i) => {
        if (i < args.length) {
          if (p.name in kw) throw new PyExc('TypeError', `${f.name}() got multiple values for argument '${p.name}'`);
          sc.vars.set(p.name, args[i]);
        } else if (p.name in kw) sc.vars.set(p.name, kw[p.name]);
        else if (p.def) sc.vars.set(p.name, f.defaults[i]);
      });
      for (const k of Object.keys(kw)) if (!ps.some((p) => p.name === k)) throw new PyExc('TypeError', `${f.name}() got an unexpected keyword argument '${k}'`);
      const missing = ps.filter((p) => !sc.vars.has(p.name)).map((p) => `'${p.name}'`);
      if (missing.length) throw new PyExc('TypeError', `${f.name}() missing ${missing.length} required positional argument${missing.length > 1 ? 's' : ''}: ${missing.join(' and ')}`);
      if (!Array.isArray(f.body)) return this.eval(f.body, sc);
      this.frames.push({ name: f.name, line: 0 });
      try {
        this.execBlock(f.body, sc);
        return null;
      } catch (e) {
        if (e instanceof ReturnSig) return e.v;
        if (e instanceof PyExc && !e.frames) e.frames = this.frames.map((x) => ({ ...x }));
        throw e;
      } finally {
        this.frames.pop();
      }
    }
    throw new PyExc('TypeError', `'${typeName(f)}' object is not callable`);
  }

  private keyFn(kw: Record<string, PyVal>): ((v: PyVal) => PyVal) | null {
    const k = kw.key;
    if (k === undefined || k === null) return null;
    return (v) => this.call(k, [v], {});
  }

  sortItems(items: PyVal[], kw: Record<string, PyVal>): PyVal[] {
    const kf = this.keyFn(kw);
    const keyed = items.map((v, i) => ({ v, k: kf ? kf(v) : v, i }));
    const rev = truthy(kw.reverse ?? false);
    keyed.sort((a, b) => {
      const c = cmpVals(a.k, b.k, '<');
      return c !== 0 ? (rev ? -c : c) : a.i - b.i;
    });
    return keyed.map((x) => x.v);
  }

  // ---------------------------------------------------------- attributi e metodi

  getAttr(obj: PyVal, name: string): PyVal {
    if (obj instanceof PyModule) {
      if (name in obj.attrs) return obj.attrs[name];
      throw new PyExc('AttributeError', `module '${obj.name}' has no attribute '${name}'`);
    }
    if (obj instanceof PyObj && obj.type === 'exception' && name === 'args') return new PyTuple([String(obj.attrs.msg)]);
    if (obj instanceof PyObj && obj.type === 'file' && (name === 'name' || name === 'mode' || name === 'closed')) return obj.attrs[name] as PyVal;
    // metodo "legato": diventa una funzione da chiamare dopo
    return new PyBuiltin(name, (args, kw) => this.callMethod(obj, name, args, kw));
  }

  private noAttr(obj: PyVal, name: string): never {
    throw new PyExc('AttributeError', `'${typeName(obj)}' object has no attribute '${name}'`);
  }

  callMethod(obj: PyVal, name: string, args: PyVal[], kw: Record<string, PyVal>): PyVal {
    if (obj instanceof PyModule) return this.call(this.getAttr(obj, name), args, kw);
    if (typeof obj === 'string') return this.strMethod(obj, name, args, kw);
    if (obj instanceof PyList) return this.listMethod(obj, name, args, kw);
    if (obj instanceof PyDict) return this.dictMethod(obj, name, args, kw);
    if (obj instanceof PySet) return this.setMethod(obj, name, args);
    if (obj instanceof PyTuple) {
      if (name === 'count') return obj.items.filter((x) => eq(x, args[0])).length;
      if (name === 'index') {
        const i = obj.items.findIndex((x) => eq(x, args[0]));
        if (i < 0) throw new PyExc('ValueError', 'tuple.index(x): x not in tuple');
        return i;
      }
    }
    if (obj instanceof PyBytes) {
      if (name === 'decode') return decodeBytes(obj);
      if (name === 'hex') return [...obj.s].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      if (name === 'startswith' && args[0] instanceof PyBytes) return obj.s.startsWith(args[0].s);
      if (name === 'strip') return new PyBytes(obj.s.trim());
    }
    if (obj instanceof PyFloat && name === 'is_integer') return Number.isInteger(obj.v);
    if (obj instanceof PyObj) return this.objMethod(obj, name, args, kw);
    this.noAttr(obj, name);
  }

  private strMethod(s: string, name: string, args: PyVal[], kw: Record<string, PyVal>): PyVal {
    const a0 = args[0];
    const needStr = (v: PyVal, what: string): string => {
      if (typeof v !== 'string') throw new PyExc('TypeError', `${what} arg must be None or str`);
      return v;
    };
    const stripChars = (v: PyVal) => (v === undefined || v === null ? null : needStr(v, name));
    const esc = (c: string) => c.replace(/[\\^$.*+?()[\]{}|-]/g, '\\$&');
    switch (name) {
      case 'lower':
        return s.toLowerCase();
      case 'upper':
        return s.toUpperCase();
      case 'title':
        return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
      case 'capitalize':
        return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
      case 'swapcase':
        return [...s].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('');
      case 'strip':
      case 'lstrip':
      case 'rstrip': {
        const cs = stripChars(a0);
        const set = cs === null ? '\\s' : esc(cs);
        let out = s;
        if (name !== 'rstrip') out = out.replace(new RegExp(`^[${set}]+`), '');
        if (name !== 'lstrip') out = out.replace(new RegExp(`[${set}]+$`), '');
        return out;
      }
      case 'split':
      case 'rsplit': {
        const sep = a0 ?? kw.sep ?? null;
        const max = Number(args[1] ?? kw.maxsplit ?? -1);
        let parts: string[];
        if (sep === null) {
          parts = s.trim() === '' ? [] : s.trim().split(/\s+/);
          if (max >= 0 && parts.length > max + 1) {
            if (name === 'split') {
              const re = /\S+/g;
              const out: string[] = [];
              let m: RegExpExecArray | null;
              while ((m = re.exec(s)) && out.length < max) out.push(m[0]);
              parts = [...out, s.slice(re.lastIndex).trimStart()];
            } else parts = [parts.slice(0, parts.length - max).join(' '), ...parts.slice(parts.length - max)];
          }
        } else {
          const sp = needStr(sep, name);
          if (sp === '') throw new PyExc('ValueError', 'empty separator');
          parts = s.split(sp);
          if (max >= 0 && parts.length > max + 1)
            parts = name === 'split' ? [...parts.slice(0, max), parts.slice(max).join(sp)] : [parts.slice(0, parts.length - max).join(sp), ...parts.slice(parts.length - max)];
        }
        return new PyList(parts);
      }
      case 'splitlines':
        return new PyList(s.split(/\r?\n/).filter((x, i, arr) => !(i === arr.length - 1 && x === '')));
      case 'join': {
        const items = this.iterate(a0);
        items.forEach((x, i) => {
          if (typeof x !== 'string') throw new PyExc('TypeError', `sequence item ${i}: expected str instance, ${typeName(x)} found`);
        });
        return items.join(s);
      }
      case 'replace': {
        const from = needStr(a0, 'replace');
        const to = needStr(args[1], 'replace');
        const count = args[2] === undefined ? -1 : Number(args[2]);
        if (count < 0) return s.split(from).join(to);
        let out = s;
        let pos = 0;
        for (let i = 0; i < count; i++) {
          const j = out.indexOf(from, pos);
          if (j < 0) break;
          out = out.slice(0, j) + to + out.slice(j + from.length);
          pos = j + to.length;
        }
        return out;
      }
      case 'startswith':
      case 'endswith': {
        const opts = a0 instanceof PyTuple ? a0.items : [a0];
        return opts.some((o) => (name === 'startswith' ? s.startsWith(needStr(o, name)) : s.endsWith(needStr(o, name))));
      }
      case 'find':
        return s.indexOf(needStr(a0, 'find'), args[1] === undefined ? 0 : Number(args[1]));
      case 'rfind':
        return s.lastIndexOf(needStr(a0, 'rfind'));
      case 'index': {
        const i = s.indexOf(needStr(a0, 'index'));
        if (i < 0) throw new PyExc('ValueError', 'substring not found');
        return i;
      }
      case 'count': {
        const sub = needStr(a0, 'count');
        if (!sub) return s.length + 1;
        return s.split(sub).length - 1;
      }
      case 'isdigit':
      case 'isnumeric':
      case 'isdecimal':
        return /^\d+$/.test(s);
      case 'isalpha':
        return /^\p{L}+$/u.test(s);
      case 'isalnum':
        return /^[\p{L}\d]+$/u.test(s);
      case 'isspace':
        return /^\s+$/.test(s);
      case 'isupper':
        return /\p{L}/u.test(s) && s === s.toUpperCase();
      case 'islower':
        return /\p{L}/u.test(s) && s === s.toLowerCase();
      case 'encode':
        return utf8Bytes(s);
      case 'zfill': {
        const w = Number(a0);
        const neg = s.startsWith('-') || s.startsWith('+');
        return neg ? s[0] + s.slice(1).padStart(w - 1, '0') : s.padStart(w, '0');
      }
      case 'ljust':
        return s.padEnd(Number(a0), typeof args[1] === 'string' ? args[1] : ' ');
      case 'rjust':
        return s.padStart(Number(a0), typeof args[1] === 'string' ? args[1] : ' ');
      case 'center': {
        const w = Number(a0);
        const pad = Math.max(0, w - s.length);
        const f = typeof args[1] === 'string' ? args[1] : ' ';
        return f.repeat(Math.floor(pad / 2)) + s + f.repeat(Math.ceil(pad / 2));
      }
      case 'partition':
      case 'rpartition': {
        const sep = needStr(a0, name);
        const i = name === 'partition' ? s.indexOf(sep) : s.lastIndexOf(sep);
        if (i < 0) return name === 'partition' ? new PyTuple([s, '', '']) : new PyTuple(['', '', s]);
        return new PyTuple([s.slice(0, i), sep, s.slice(i + sep.length)]);
      }
      case 'format': {
        let auto = 0;
        return s.replace(/\{\{|\}\}|\{([^{}]*)\}/g, (m, field: string | undefined) => {
          if (m === '{{') return '{';
          if (m === '}}') return '}';
          const [ref, spec = ''] = (field ?? '').split(':');
          const v = ref === '' ? args[auto++] : /^\d+$/.test(ref) ? args[Number(ref)] : kw[ref];
          if (v === undefined) throw new PyExc(ref === '' || /^\d+$/.test(ref) ? 'IndexError' : 'KeyError', ref === '' || /^\d+$/.test(ref) ? 'Replacement index out of range for positional args tuple' : `'${ref}'`);
          return formatSpec(v, spec);
        });
      }
    }
    this.noAttr(s, name);
  }

  private listMethod(l: PyList, name: string, args: PyVal[], kw: Record<string, PyVal>): PyVal {
    switch (name) {
      case 'append':
        l.items.push(args[0]);
        return null;
      case 'extend':
        l.items.push(...this.iterate(args[0]));
        return null;
      case 'insert': {
        let i = Number(args[0]);
        if (i < 0) i = Math.max(0, l.items.length + i);
        l.items.splice(Math.min(i, l.items.length), 0, args[1]);
        return null;
      }
      case 'pop': {
        if (!l.items.length) throw new PyExc('IndexError', 'pop from empty list');
        const i = args.length ? this.index(l.items.length, args[0], 'pop') : l.items.length - 1;
        return l.items.splice(i, 1)[0];
      }
      case 'remove': {
        const i = l.items.findIndex((x) => eq(x, args[0]));
        if (i < 0) throw new PyExc('ValueError', 'list.remove(x): x not in list');
        l.items.splice(i, 1);
        return null;
      }
      case 'index': {
        const i = l.items.findIndex((x) => eq(x, args[0]));
        if (i < 0) throw new PyExc('ValueError', `${repr(args[0])} is not in list`);
        return i;
      }
      case 'count':
        return l.items.filter((x) => eq(x, args[0])).length;
      case 'sort':
        l.items = this.sortItems(l.items, kw);
        return null;
      case 'reverse':
        l.items.reverse();
        return null;
      case 'copy':
        return new PyList([...l.items]);
      case 'clear':
        l.items = [];
        return null;
    }
    this.noAttr(l, name);
  }

  private dictMethod(d: PyDict, name: string, args: PyVal[], kw: Record<string, PyVal>): PyVal {
    switch (name) {
      case 'get': {
        const hit = d.map.get(hashKey(args[0]));
        return hit ? hit[1] : args[1] ?? null;
      }
      case 'keys': {
        const l = new PyList([...d.map.values()].map(([k]) => k));
        l.view = 'dict_keys';
        return l;
      }
      case 'values': {
        const l = new PyList([...d.map.values()].map(([, v]) => v));
        l.view = 'dict_values';
        return l;
      }
      case 'items': {
        const l = new PyList([...d.map.values()].map(([k, v]) => new PyTuple([k, v])));
        l.view = 'dict_items';
        return l;
      }
      case 'pop': {
        const k = hashKey(args[0]);
        const hit = d.map.get(k);
        if (!hit) {
          if (args.length > 1) return args[1];
          throw new PyExc('KeyError', repr(args[0]));
        }
        d.map.delete(k);
        return hit[1];
      }
      case 'setdefault': {
        const k = hashKey(args[0]);
        if (!d.map.has(k)) d.map.set(k, [args[0], args[1] ?? null]);
        return d.map.get(k)![1];
      }
      case 'update': {
        if (d.kind === 'Counter' && args[0] !== undefined && !(args[0] instanceof PyDict)) {
          for (const v of this.iterate(args[0])) this.counterAdd(d, v, 1);
          return null;
        }
        if (args[0] instanceof PyDict) for (const [k, v] of args[0].map) d.kind === 'Counter' ? this.counterAdd(d, v[0], numOf(v[1] as number)) : d.map.set(k, v);
        else if (args[0] !== undefined) for (const p of this.iterate(args[0])) {
          const [k, v] = this.iterate(p);
          d.map.set(hashKey(k), [k, v]);
        }
        for (const [k, v] of Object.entries(kw)) d.map.set(hashKey(k), [k, v]);
        return null;
      }
      case 'copy': {
        const c = newDict([...d.map.values()]);
        c.kind = d.kind;
        c.factory = d.factory;
        return c;
      }
      case 'clear':
        d.map.clear();
        return null;
      case 'most_common': {
        if (d.kind !== 'Counter') break;
        const all = [...d.map.values()];
        const sorted = all.map((p, i) => ({ p, i })).sort((a, b) => numOf(b.p[1] as number) - numOf(a.p[1] as number) || a.i - b.i);
        const n = args[0] === undefined || args[0] === null ? sorted.length : Number(args[0]);
        return new PyList(sorted.slice(0, n).map(({ p }) => new PyTuple([p[0], p[1]])));
      }
      case 'total':
        if (d.kind === 'Counter') return [...d.map.values()].reduce((s, [, v]) => s + numOf(v as number), 0);
        break;
    }
    this.noAttr(d, name);
  }

  private counterAdd(d: PyDict, k: PyVal, n: number): void {
    const key = hashKey(k);
    const cur = d.map.get(key);
    d.map.set(key, [k, (cur ? numOf(cur[1] as number) : 0) + n]);
  }

  private setMethod(s: PySet, name: string, args: PyVal[]): PyVal {
    switch (name) {
      case 'add':
        s.map.set(hashKey(args[0]), args[0]);
        return null;
      case 'remove':
        if (!s.map.delete(hashKey(args[0]))) throw new PyExc('KeyError', repr(args[0]));
        return null;
      case 'discard':
        s.map.delete(hashKey(args[0]));
        return null;
      case 'update':
        for (const v of this.iterate(args[0])) s.map.set(hashKey(v), v);
        return null;
      case 'union':
        return this.binop('|', s, newSet(this.iterate(args[0])));
      case 'intersection':
        return this.binop('&', s, newSet(this.iterate(args[0])));
      case 'difference':
        return this.binop('-', s, newSet(this.iterate(args[0])));
      case 'issubset':
        return [...s.map.keys()].every((k) => newSet(this.iterate(args[0])).map.has(k));
      case 'pop': {
        const first = s.map.keys().next();
        if (first.done) throw new PyExc('KeyError', "'pop from an empty set'");
        const v = s.map.get(first.value)!;
        s.map.delete(first.value);
        return v;
      }
    }
    this.noAttr(s, name);
  }

  // ---------------------------------------------------------- file

  private fileLines(f: PyObj): string[] {
    const text = (f.attrs.text as string).slice(f.attrs.pos as number);
    return text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  }

  private closeFile(f: PyObj): void {
    if (f.attrs.closed) return;
    f.attrs.closed = true;
    const mode = String(f.attrs.mode);
    if (mode.includes('w') || mode.includes('a')) {
      const err = this.host.write(String(f.attrs.path), String(f.attrs.buf), !mode.includes('w') || !!f.attrs.flushed);
      if (err) throw new PyExc('PermissionError', `[Errno 13] Permission denied: ${strRepr(String(f.attrs.name))}`);
      f.attrs.buf = '';
      f.attrs.flushed = true;
    }
  }

  private objMethod(o: PyObj, name: string, args: PyVal[], kw: Record<string, PyVal>): PyVal {
    if (o.type === 'file') {
      const binary = String(o.attrs.mode).includes('b');
      const wrap = (s: string) => (binary ? utf8Bytes(s) : s);
      if (o.attrs.closed && name !== 'close') throw new PyExc('ValueError', 'I/O operation on closed file.');
      switch (name) {
        case 'read': {
          if (!String(o.attrs.mode).includes('r')) throw new PyExc('io.UnsupportedOperation', 'not readable');
          const t = (o.attrs.text as string).slice(o.attrs.pos as number);
          o.attrs.pos = (o.attrs.text as string).length;
          return wrap(t);
        }
        case 'readline': {
          const ls = this.fileLines(o);
          const l = ls[0] ?? '';
          o.attrs.pos = (o.attrs.pos as number) + l.length;
          return wrap(l);
        }
        case 'readlines':
          return new PyList(this.iterate(o).map((l) => wrap(String(l))));
        case 'write': {
          if (!/[wa]/.test(String(o.attrs.mode))) throw new PyExc('io.UnsupportedOperation', 'not writable');
          const v = args[0];
          const t = v instanceof PyBytes ? v.s : v;
          if (typeof t !== 'string') throw new PyExc('TypeError', `write() argument must be str, not ${typeName(v)}`);
          o.attrs.buf = String(o.attrs.buf) + t;
          return t.length;
        }
        case 'writelines':
          for (const l of this.iterate(args[0])) o.attrs.buf = String(o.attrs.buf) + str(l);
          return null;
        case 'close':
          this.closeFile(o);
          return null;
        case '__enter__':
          return o;
      }
    }
    if (o.type === 're.Match') {
      const m = o.attrs.m as RegExpExecArray;
      switch (name) {
        case 'group':
          if (args.length > 1) return new PyTuple(args.map((a) => this.matchGroup(o, a)));
          return this.matchGroup(o, args[0] ?? 0);
        case 'groups':
          return new PyTuple(m.slice(1).map((x) => x ?? (kw.default ?? null)));
        case 'groupdict':
          return newDict(Object.entries(m.groups ?? {}).map(([k, v]) => [k, v ?? null]));
        case 'start':
          return m.index;
        case 'end':
          return m.index + m[0].length;
        case 'span':
          return new PyTuple([m.index, m.index + m[0].length]);
      }
    }
    if (o.type === 're.Pattern') {
      const mod = this.importModule('re');
      return this.call(mod.attrs[name] ?? this.noAttr(o, name), [o.attrs.pattern as string, ...args], { flags: o.attrs.flags as number, ...kw });
    }
    if (o.type === 'hash') {
      switch (name) {
        case 'update': {
          const b = args[0];
          if (!(b instanceof PyBytes)) throw new PyExc('TypeError', b !== undefined && typeof b === 'string' ? 'Strings must be encoded before hashing' : 'object supporting the buffer API required');
          o.attrs.data = String(o.attrs.data) + b.s;
          return null;
        }
        case 'hexdigest':
          return sha256Bytes(bytesArr(new PyBytes(String(o.attrs.data))));
      }
    }
    if (o.type === 'exception' && name === 'with_traceback') return o;
    this.noAttr(o, name);
  }

  private matchGroup(o: PyObj, key: PyVal): PyVal {
    const m = o.attrs.m as RegExpExecArray;
    if (typeof key === 'string') {
      if (!m.groups || !(key in m.groups)) throw new PyExc('IndexError', 'no such group');
      return m.groups[key] ?? null;
    }
    const i = Number(key);
    if (i < 0 || i >= m.length) throw new PyExc('IndexError', 'no such group');
    return m[i] ?? null;
  }

  openFile(path: PyVal, mode: PyVal): PyObj {
    if (typeof path !== 'string') throw new PyExc('TypeError', `expected str, bytes or os.PathLike object, not ${typeName(path)}`);
    const m = typeof mode === 'string' ? mode : 'r';
    if (!/^[rwa]b?\+?$|^[rwa]\+?b?$/.test(m) && !/^[rwatb+]+$/.test(m)) throw new PyExc('ValueError', `invalid mode: '${m}'`);
    const name = path;
    if (m.includes('r')) {
      const r = this.host.read(path);
      if (r === 'enoent') throw new PyExc('FileNotFoundError', `[Errno 2] No such file or directory: ${strRepr(name)}`);
      if (r === 'eacces') throw new PyExc('PermissionError', `[Errno 13] Permission denied: ${strRepr(name)}`);
      if (r === 'eisdir') throw new PyExc('IsADirectoryError', `[Errno 21] Is a directory: ${strRepr(name)}`);
      return new PyObj('file', { path, name, mode: m, text: r, pos: 0, closed: false, buf: '' });
    }
    if (this.host.kind(path) === 'dir') throw new PyExc('IsADirectoryError', `[Errno 21] Is a directory: ${strRepr(name)}`);
    const err = this.host.write(path, '', m.includes('a'));
    if (err) {
      if (/No such/.test(err)) throw new PyExc('FileNotFoundError', `[Errno 2] No such file or directory: ${strRepr(name)}`);
      throw new PyExc('PermissionError', `[Errno 13] Permission denied: ${strRepr(name)}`);
    }
    const f = new PyObj('file', { path, name, mode: m, text: '', pos: 0, closed: false, buf: '', flushed: true });
    this.openFiles.push(f);
    return f;
  }

  // ---------------------------------------------------------- built-in

  private makeBuiltins(): Record<string, PyVal> {
    const B = (name: string, fn: (a: PyVal[], kw: Record<string, PyVal>) => PyVal, isType = false) => new PyBuiltin(name, fn, isType);
    const one = (name: string, a: PyVal[]) => {
      if (a.length !== 1) throw new PyExc('TypeError', `${name}() takes exactly one argument (${a.length} given)`);
      return a[0];
    };
    const toInt = (v: PyVal, base?: PyVal): PyVal => {
      if (v === undefined) return 0;
      if (typeof v === 'string' || v instanceof PyBytes) {
        const s = (v instanceof PyBytes ? v.s : v).trim().replace(/_/g, '');
        const b = base === undefined ? 10 : Number(base);
        const ok = b === 16 ? /^[-+]?(0x)?[0-9a-f]+$/i : b === 2 ? /^[-+]?(0b)?[01]+$/i : b === 8 ? /^[-+]?(0o)?[0-7]+$/i : /^[-+]?\d+$/;
        if (!ok.test(s)) throw new PyExc('ValueError', `invalid literal for int() with base ${b}: ${repr(v)}`);
        return parseInt(s.replace(/^([-+]?)0[xbo]/i, '$1'), b);
      }
      if (isNum(v)) return Math.trunc(numOf(v));
      throw new PyExc('TypeError', `int() argument must be a string, a bytes-like object or a real number, not '${typeName(v)}'`);
    };
    const toFloat = (v: PyVal): PyVal => {
      if (v === undefined) return new PyFloat(0);
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (s === 'inf' || s === '+inf') return new PyFloat(Infinity);
        if (s === '-inf') return new PyFloat(-Infinity);
        if (s === 'nan') return new PyFloat(NaN);
        if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/.test(s)) throw new PyExc('ValueError', `could not convert string to float: ${repr(v)}`);
        return new PyFloat(Number(s));
      }
      if (isNum(v)) return new PyFloat(numOf(v));
      throw new PyExc('TypeError', `float() argument must be a string or a real number, not '${typeName(v)}'`);
    };
    const minmax = (name: string, a: PyVal[], kw: Record<string, PyVal>, sign: number) => {
      const items = a.length === 1 ? this.iterate(a[0]) : a;
      if (!items.length) {
        if (kw.default !== undefined) return kw.default;
        throw new PyExc('ValueError', `${name}() arg is an empty sequence`);
      }
      const kf = this.keyFn(kw);
      let best = items[0];
      let bk = kf ? kf(best) : best;
      for (const v of items.slice(1)) {
        const k = kf ? kf(v) : v;
        if (cmpVals(k, bk, '<') * sign > 0) {
          best = v;
          bk = k;
        }
      }
      return best;
    };
    const exc = (name: string) => B(name, (a) => new PyObj('exception', { type: name, msg: a.length ? str(a[0]) : '' }), true);
    const b: Record<string, PyVal> = {
      print: B('print', (a, kw) => {
        const sep = kw.sep === undefined || kw.sep === null ? ' ' : str(kw.sep);
        const end = kw.end === undefined || kw.end === null ? '\n' : str(kw.end);
        const text = a.map(str).join(sep) + end;
        if (kw.file instanceof PyObj && kw.file.type === 'file') kw.file.attrs.buf = String(kw.file.attrs.buf) + text;
        else this.write(text);
        return null;
      }),
      input: B('input', (a) => {
        if (a.length) this.write(str(a[0]));
        const lines = (this.host.stdin ?? '').split('\n');
        if (!this.host.stdin || this.stdinPos >= lines.length - (this.host.stdin.endsWith('\n') ? 1 : 0)) throw new PyExc('EOFError', 'EOF when reading a line');
        const l = lines[this.stdinPos++];
        this.write('\n');
        return l;
      }),
      len: B('len', (a) => {
        const v = one('len', a);
        if (typeof v === 'string') return [...v].length;
        if (v instanceof PyList || v instanceof PyTuple) return v.items.length;
        if (v instanceof PyDict || v instanceof PySet) return v.map.size;
        if (v instanceof PyBytes) return v.s.length;
        if (v instanceof PyRange) return rangeLen(v);
        throw new PyExc('TypeError', `object of type '${typeName(v)}' has no len()`);
      }),
      range: B('range', (a) => {
        if (!a.length) throw new PyExc('TypeError', 'range expected at least 1 argument, got 0');
        for (const x of a) if (typeof x !== 'number' && typeof x !== 'boolean') throw new PyExc('TypeError', `'${typeName(x)}' object cannot be interpreted as an integer`);
        const n = a.map(Number);
        if (n[2] === 0) throw new PyExc('ValueError', 'range() arg 3 must not be zero');
        return a.length === 1 ? new PyRange(0, n[0], 1) : new PyRange(n[0], n[1], n[2] ?? 1);
      }, true),
      int: B('int', (a) => toInt(a[0], a[1]), true),
      float: B('float', (a) => toFloat(a[0]), true),
      str: B('str', (a) => (a.length ? (a[0] instanceof PyBytes && a[1] !== undefined ? decodeBytes(a[0]) : str(a[0])) : ''), true),
      bool: B('bool', (a) => (a.length ? truthy(a[0]) : false), true),
      list: B('list', (a) => new PyList(a.length ? this.iterate(a[0]) : []), true),
      tuple: B('tuple', (a) => new PyTuple(a.length ? this.iterate(a[0]) : []), true),
      set: B('set', (a) => newSet(a.length ? this.iterate(a[0]) : []), true),
      dict: B('dict', (a, kw) => {
        const d = new PyDict();
        if (a[0] instanceof PyDict) for (const [k, v] of a[0].map) d.map.set(k, v);
        else if (a.length)
          for (const p of this.iterate(a[0])) {
            const kv = this.iterate(p);
            if (kv.length !== 2) throw new PyExc('ValueError', `dictionary update sequence element has length ${kv.length}; 2 is required`);
            d.map.set(hashKey(kv[0]), [kv[0], kv[1]]);
          }
        for (const [k, v] of Object.entries(kw)) d.map.set(hashKey(k), [k, v]);
        return d;
      }, true),
      bytes: B('bytes', (a) => {
        if (!a.length) return new PyBytes('');
        if (typeof a[0] === 'string') return utf8Bytes(a[0]);
        if (typeof a[0] === 'number') return new PyBytes('\0'.repeat(a[0]));
        return new PyBytes(this.iterate(a[0]).map((x) => String.fromCharCode(Number(x))).join(''));
      }, true),
      type: B('type', (a) => {
        const t = typeName(one('type', a));
        return (b[t] as PyVal) ?? B(t, () => null, true);
      }, true),
      isinstance: B('isinstance', (a) => {
        const [v, t] = a;
        const ts = t instanceof PyTuple ? t.items : [t];
        const tn = typeName(v);
        return ts.some((x) => x instanceof PyBuiltin && (x.name === tn || (x.name === 'int' && tn === 'bool') || (x.name === 'dict' && (tn === 'Counter' || tn === 'defaultdict')) || (x.name === 'Exception' && v instanceof PyObj && v.type === 'exception')));
      }),
      sorted: B('sorted', (a, kw) => new PyList(this.sortItems(this.iterate(a[0]), kw))),
      reversed: B('reversed', (a) => new PyList(this.iterate(a[0]).reverse())),
      sum: B('sum', (a) => this.iterate(a[0]).reduce<PyVal>((s, v) => this.binop('+', s, v), a[1] ?? 0)),
      min: B('min', (a, kw) => minmax('min', a, kw, -1)),
      max: B('max', (a, kw) => minmax('max', a, kw, 1)),
      abs: B('abs', (a) => {
        const v = one('abs', a);
        if (!isNum(v)) throw new PyExc('TypeError', `bad operand type for abs(): '${typeName(v)}'`);
        return mk(Math.abs(numOf(v)), isFloat(v));
      }),
      round: B('round', (a) => {
        const v = a[0];
        if (!isNum(v)) throw new PyExc('TypeError', `type ${typeName(v)} doesn't define __round__ method`);
        const n = a[1] === undefined || a[1] === null ? 0 : Number(a[1]);
        const f = 10 ** n;
        const x = numOf(v) * f;
        const r = Math.abs(x % 1) === 0.5 ? 2 * Math.round(x / 2) : Math.round(x);
        return a[1] === undefined || a[1] === null ? r / f : mk(r / f, isFloat(v));
      }),
      divmod: B('divmod', (a) => new PyTuple([this.binop('//', a[0], a[1]), this.binop('%', a[0], a[1])])),
      pow: B('pow', (a) => this.binop('**', a[0], a[1])),
      enumerate: B('enumerate', (a, kw) => {
        const start = Number(a[1] ?? kw.start ?? 0);
        return new PyList(this.iterate(a[0]).map((v, i) => new PyTuple([start + i, v])));
      }),
      zip: B('zip', (a) => {
        const lists = a.map((x) => this.iterate(x));
        const n = lists.length ? Math.min(...lists.map((l) => l.length)) : 0;
        return new PyList(Array.from({ length: n }, (_, i) => new PyTuple(lists.map((l) => l[i]))));
      }),
      map: B('map', (a) => {
        const [f, ...its] = a;
        const lists = its.map((x) => this.iterate(x));
        const n = Math.min(...lists.map((l) => l.length));
        return new PyList(Array.from({ length: n }, (_, i) => this.call(f, lists.map((l) => l[i]), {})));
      }),
      filter: B('filter', (a) => new PyList(this.iterate(a[1]).filter((v) => truthy(a[0] === null ? v : this.call(a[0], [v], {}))))),
      any: B('any', (a) => this.iterate(a[0]).some(truthy)),
      all: B('all', (a) => this.iterate(a[0]).every(truthy)),
      ord: B('ord', (a) => {
        const v = one('ord', a);
        if (typeof v !== 'string' || [...v].length !== 1) throw new PyExc('TypeError', `ord() expected a character, but string of length ${typeof v === 'string' ? v.length : 0} found`);
        return v.codePointAt(0)!;
      }),
      chr: B('chr', (a) => String.fromCodePoint(Number(one('chr', a)))),
      hex: B('hex', (a) => {
        const n = Number(one('hex', a));
        return (n < 0 ? '-0x' : '0x') + Math.abs(n).toString(16);
      }),
      bin: B('bin', (a) => {
        const n = Number(one('bin', a));
        return (n < 0 ? '-0b' : '0b') + Math.abs(n).toString(2);
      }),
      repr: B('repr', (a) => repr(one('repr', a))),
      open: B('open', (a, kw) => this.openFile(a[0], a[1] ?? kw.mode ?? 'r')),
      exit: B('exit', (a) => {
        throw new ExitSig(a.length ? Number(a[0]) || 0 : 0);
      }),
      quit: B('quit', () => {
        throw new ExitSig(0);
      }),
      help: B('help', () => {
        this.write('Nel deck usa il Manuale (📖) o "man python3".\n');
        return null;
      }),
      id: B('id', () => 140234567890000 + Math.floor(Math.random() * 1000) * 16),
      hash: B('hash', (a) => {
        const k = hashKey(one('hash', a));
        let h = 0;
        for (const c of k) h = (h * 31 + c.charCodeAt(0)) | 0;
        return h;
      }),
      callable: B('callable', (a) => a[0] instanceof PyFunc || a[0] instanceof PyBuiltin),
      iter: B('iter', (a) => new PyList(this.iterate(a[0]))),
      next: B('next', (a) => {
        const l = a[0];
        if (l instanceof PyList) {
          if (!l.items.length) {
            if (a.length > 1) return a[1];
            throw new PyExc('StopIteration', '');
          }
          return l.items.shift()!;
        }
        if (l instanceof PyObj && l.type === 'file') return this.objMethod(l, 'readline', [], {});
        throw new PyExc('TypeError', `'${typeName(l)}' object is not an iterator`);
      }),
    };
    for (const e of ['Exception', 'ValueError', 'TypeError', 'KeyError', 'IndexError', 'NameError', 'ZeroDivisionError', 'FileNotFoundError', 'PermissionError', 'OSError', 'RuntimeError', 'AttributeError', 'StopIteration', 'NotImplementedError', 'KeyboardInterrupt', 'ImportError', 'ModuleNotFoundError', 'UnicodeDecodeError', 'AssertionError', 'LookupError', 'ArithmeticError', 'IsADirectoryError', 'EOFError', 'TimeoutError', 'ConnectionError'])
      b[e] = exc(e);
    return b;
  }

  private stdinPos = 0;

  // ---------------------------------------------------------- moduli

  importModule(name: string): PyModule {
    if (this.modules[name]) return this.modules[name];
    const B = (n: string, fn: (a: PyVal[], kw: Record<string, PyVal>) => PyVal, isType = false) => new PyBuiltin(n, fn, isType);
    const host = this.host;
    const join = (...p: string[]) => p.reduce((acc, x) => (x.startsWith('/') ? x : acc ? acc.replace(/\/$/, '') + '/' + x : x), '');
    let m: PyModule | null = null;
    switch (name) {
      case 'sys':
        m = new PyModule('sys', {
          argv: new PyList([...host.argv]),
          version: '3.12.3 (deck simulato)',
          platform: 'linux',
          exit: B('exit', (a) => {
            const v = a[0];
            if (typeof v === 'string') {
              this.flushErr = v;
              throw new ExitSig(1);
            }
            throw new ExitSig(v === undefined || v === null ? 0 : Number(v));
          }),
          stdin: new PyObj('file', { path: '<stdin>', name: '<stdin>', mode: 'r', text: host.stdin ?? '', pos: 0, closed: false, buf: '' }),
          maxsize: 9223372036854775807,
        });
        break;
      case 'os.path':
      case 'os': {
        const path = new PyModule('os.path', {
          exists: B('exists', (a) => host.kind(String(a[0])) !== null),
          isfile: B('isfile', (a) => host.kind(String(a[0])) === 'file'),
          isdir: B('isdir', (a) => host.kind(String(a[0])) === 'dir'),
          join: B('join', (a) => join(...a.map((x) => String(x)))),
          basename: B('basename', (a) => String(a[0]).split('/').pop() ?? ''),
          dirname: B('dirname', (a) => String(a[0]).replace(/\/?[^/]*$/, '')),
          getsize: B('getsize', (a) => {
            const r = host.read(String(a[0]));
            if (typeof r !== 'string' || ['enoent', 'eacces', 'eisdir'].includes(r)) throw new PyExc('FileNotFoundError', `[Errno 2] No such file or directory: ${strRepr(String(a[0]))}`);
            return new TextEncoder().encode(r).length;
          }),
          splitext: B('splitext', (a) => {
            const s = String(a[0]);
            const i = s.lastIndexOf('.');
            return i > s.lastIndexOf('/') + 1 ? new PyTuple([s.slice(0, i), s.slice(i)]) : new PyTuple([s, '']);
          }),
          abspath: B('abspath', (a) => (String(a[0]).startsWith('/') ? String(a[0]) : join(host.cwd, String(a[0])))),
        });
        if (name === 'os.path') {
          m = path;
          break;
        }
        m = new PyModule('os', {
          path,
          listdir: B('listdir', (a) => {
            const p = a.length ? String(a[0]) : '.';
            const l = host.listdir(p);
            if (!l) throw new PyExc('FileNotFoundError', `[Errno 2] No such file or directory: ${strRepr(p)}`);
            return new PyList(l);
          }),
          getcwd: B('getcwd', () => host.cwd),
          sep: '/',
          name: 'posix',
          getenv: B('getenv', (a) => ({ USER: host.argv.length ? 'deck' : 'deck', HOME: '/home' })[String(a[0])] ?? a[1] ?? null),
          system: B('system', () => {
            throw new PyExc('PermissionError', "os.system non è disponibile nel Python del deck: usa direttamente il terminale");
          }),
          walk: B('walk', (a) => {
            const out: PyVal[] = [];
            const visit = (dir: string) => {
              const names = host.listdir(dir) ?? [];
              const dirs = names.filter((n) => host.kind(join(dir, n)) === 'dir');
              const files = names.filter((n) => host.kind(join(dir, n)) === 'file');
              out.push(new PyTuple([dir, new PyList(dirs), new PyList(files)]));
              for (const d of dirs) visit(join(dir, d));
            };
            visit(String(a[0]));
            return new PyList(out);
          }),
        });
        break;
      }
      case 'hashlib': {
        const mkHash = (algo: string) =>
          B(algo, (a) => {
            if (algo !== 'sha256') throw new PyExc('ValueError', `nel deck è disponibile solo hashlib.sha256 (${algo} è comunque sconsigliato per la sicurezza)`);
            const o = new PyObj('hash', { data: '' });
            if (a.length) this.objMethod(o, 'update', [a[0]], {});
            return o;
          });
        m = new PyModule('hashlib', { sha256: mkHash('sha256'), md5: mkHash('md5'), sha1: mkHash('sha1') });
        break;
      }
      case 'base64':
        m = new PyModule('base64', {
          b64encode: B('b64encode', (a) => {
            const v = a[0];
            if (!(v instanceof PyBytes)) throw new PyExc('TypeError', `a bytes-like object is required, not '${typeName(v)}'`);
            return new PyBytes(btoa(v.s));
          }),
          b64decode: B('b64decode', (a) => {
            const v = a[0];
            const s = v instanceof PyBytes ? v.s : typeof v === 'string' ? v : null;
            if (s === null) throw new PyExc('TypeError', `argument should be a bytes-like object or ASCII string, not '${typeName(v)}'`);
            try {
              return new PyBytes(atob(s.replace(/\s+/g, '')));
            } catch {
              throw new PyExc('binascii.Error', 'Incorrect padding');
            }
          }),
        });
        break;
      case 're': {
        const flagsOf = (a: PyVal[], kw: Record<string, PyVal>, i: number) => Number(a[i] ?? kw.flags ?? 0);
        const needStr = (v: PyVal) => {
          if (typeof v !== 'string') throw new PyExc('TypeError', `expected string or bytes-like object, got '${typeName(v)}'`);
          return v;
        };
        m = new PyModule('re', {
          I: 2,
          IGNORECASE: 2,
          M: 8,
          MULTILINE: 8,
          S: 16,
          DOTALL: 16,
          search: B('search', (a, kw) => {
            const r = jsRegex(needStr(a[0]), flagsOf(a, kw, 2));
            const x = r.exec(needStr(a[1]));
            return x ? matchObj(x) : null;
          }),
          match: B('match', (a, kw) => {
            const r = jsRegex(needStr(a[0]), flagsOf(a, kw, 2), 'y');
            const x = r.exec(needStr(a[1]));
            return x ? matchObj(x) : null;
          }),
          fullmatch: B('fullmatch', (a, kw) => {
            const r = jsRegex(`(?:${needStr(a[0])})$`, flagsOf(a, kw, 2), 'y');
            const x = r.exec(needStr(a[1]));
            return x ? matchObj(x) : null;
          }),
          findall: B('findall', (a, kw) => {
            const r = jsRegex(needStr(a[0]), flagsOf(a, kw, 2), 'g');
            const out: PyVal[] = [];
            for (const x of needStr(a[1]).matchAll(r)) {
              this.tick();
              if (x.length === 1) out.push(x[0]);
              else if (x.length === 2) out.push(x[1] ?? '');
              else out.push(new PyTuple(x.slice(1).map((g) => g ?? '')));
            }
            return new PyList(out);
          }),
          finditer: B('finditer', (a, kw) => {
            const r = jsRegex(needStr(a[0]), flagsOf(a, kw, 2), 'g');
            return new PyList([...needStr(a[1]).matchAll(r)].map((x) => matchObj(x as RegExpExecArray)));
          }),
          sub: B('sub', (a, kw) => {
            const count = Number(a[3] ?? kw.count ?? 0);
            const r = jsRegex(needStr(a[0]), flagsOf(a, kw, 4), 'g');
            let n = 0;
            const repl = a[1];
            return needStr(a[2]).replace(r, (...g: unknown[]) => {
              if (count && n >= count) return g[0] as string;
              n++;
              if (typeof repl === 'string') return repl.replace(/\\(\d)|\\g<(\w+)>/g, (_m, d: string, nm: string) => String((d ? g[Number(d)] : (g[g.length - 1] as Record<string, string>)?.[nm]) ?? ''));
              const groups = g.slice(0, -2).filter((x) => typeof x !== 'object' || x === undefined) as string[];
              const fake = Object.assign([...groups], { index: g[g.length - 3] as number, input: '' }) as unknown as RegExpExecArray;
              return str(this.call(repl, [matchObj(fake)], {}));
            });
          }),
          split: B('split', (a, kw) => {
            const r = jsRegex(needStr(a[0]), flagsOf(a, kw, 3), 'g');
            return new PyList(needStr(a[1]).split(r).map((x) => x ?? null));
          }),
          compile: B('compile', (a, kw) => {
            jsRegex(needStr(a[0]), flagsOf(a, kw, 1));
            return new PyObj('re.Pattern', { pattern: a[0], flags: flagsOf(a, kw, 1) });
          }),
          escape: B('escape', (a) => needStr(a[0]).replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&')),
        });
        break;
      }
      case 'collections':
        m = new PyModule('collections', {
          Counter: B(
            'Counter',
            (a) => {
              const d = new PyDict();
              d.kind = 'Counter';
              if (a[0] instanceof PyDict) for (const [k, v] of a[0].map) d.map.set(k, v);
              else if (a.length) for (const v of this.iterate(a[0])) this.counterAdd(d, v, 1);
              return d;
            },
            true,
          ),
          defaultdict: B(
            'defaultdict',
            (a) => {
              const d = new PyDict();
              d.kind = 'defaultdict';
              d.factory = a[0] ?? null;
              return d;
            },
            true,
          ),
          OrderedDict: this.builtins.dict,
        });
        break;
      case 'json': {
        const toPy = (x: unknown): PyVal => {
          if (x === null) return null;
          if (typeof x === 'boolean' || typeof x === 'string') return x;
          if (typeof x === 'number') return Number.isInteger(x) ? x : new PyFloat(x);
          if (Array.isArray(x)) return new PyList(x.map(toPy));
          return newDict(Object.entries(x as object).map(([k, v]) => [k, toPy(v)]));
        };
        const toJs = (v: PyVal): unknown => {
          if (v === null || typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string') return v;
          if (v instanceof PyFloat) return v.v;
          if (v instanceof PyList || v instanceof PyTuple) return v.items.map(toJs);
          if (v instanceof PyDict) return Object.fromEntries([...v.map.values()].map(([k, x]) => [str(k), toJs(x)]));
          throw new PyExc('TypeError', `Object of type ${typeName(v)} is not JSON serializable`);
        };
        const loads = (s: string) => {
          try {
            return toPy(JSON.parse(s));
          } catch (e) {
            throw new PyExc('json.decoder.JSONDecodeError', (e as Error).message);
          }
        };
        const dumps = (v: PyVal, kw: Record<string, PyVal>) => {
          const ind = kw.indent;
          const js = toJs(v);
          if (ind !== undefined && ind !== null) return JSON.stringify(js, null, Number(ind));
          return JSON.stringify(js).replace(/("(?:[^"\\]|\\.)*")|([,:])/g, (_m, q: string, p: string) => q ?? (p === ',' ? ', ' : ': '));
        };
        m = new PyModule('json', {
          loads: B('loads', (a) => loads(str(a[0]))),
          load: B('load', (a) => loads(str(this.objMethod(a[0] as PyObj, 'read', [], {})))),
          dumps: B('dumps', (a, kw) => dumps(a[0], kw)),
          dump: B('dump', (a, kw) => {
            this.objMethod(a[1] as PyObj, 'write', [dumps(a[0], kw)], {});
            return null;
          }),
        });
        break;
      }
      case 'math':
        m = new PyModule('math', {
          pi: new PyFloat(Math.PI),
          e: new PyFloat(Math.E),
          sqrt: B('sqrt', (a) => new PyFloat(Math.sqrt(numOf(a[0] as number)))),
          floor: B('floor', (a) => Math.floor(numOf(a[0] as number))),
          ceil: B('ceil', (a) => Math.ceil(numOf(a[0] as number))),
          log2: B('log2', (a) => new PyFloat(Math.log2(numOf(a[0] as number)))),
          log: B('log', (a) => new PyFloat(a[1] === undefined ? Math.log(numOf(a[0] as number)) : Math.log(numOf(a[0] as number)) / Math.log(numOf(a[1] as number)))),
          pow: B('pow', (a) => new PyFloat(numOf(a[0] as number) ** numOf(a[1] as number))),
        });
        break;
      case 'random':
        m = new PyModule('random', {
          randint: B('randint', (a) => Number(a[0]) + Math.floor(Math.random() * (Number(a[1]) - Number(a[0]) + 1))),
          random: B('random', () => new PyFloat(Math.random())),
          choice: B('choice', (a) => {
            const l = this.iterate(a[0]);
            if (!l.length) throw new PyExc('IndexError', 'Cannot choose from an empty sequence');
            return l[Math.floor(Math.random() * l.length)];
          }),
          shuffle: B('shuffle', (a) => {
            const l = a[0] as PyList;
            for (let i = l.items.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [l.items[i], l.items[j]] = [l.items[j], l.items[i]];
            }
            return null;
          }),
        });
        break;
      case 'secrets':
        m = new PyModule('secrets', {
          token_hex: B('token_hex', (a) => Array.from({ length: Number(a[0] ?? 32) }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('')),
          choice: B('choice', (a) => {
            const l = this.iterate(a[0]);
            return l[Math.floor(Math.random() * l.length)];
          }),
        });
        break;
      case 'string':
        m = new PyModule('string', {
          ascii_lowercase: 'abcdefghijklmnopqrstuvwxyz',
          ascii_uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          ascii_letters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
          digits: '0123456789',
          hexdigits: '0123456789abcdefABCDEF',
          punctuation: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
        });
        break;
      case 'time':
        m = new PyModule('time', {
          sleep: B('sleep', () => null),
          time: B('time', () => new PyFloat(3404678400 + this.ops / 1000)),
        });
        break;
      case 'ipaddress':
        m = new PyModule('ipaddress', {
          ip_address: B('ip_address', (a) => {
            const s = String(a[0]);
            if (!/^(\d{1,3})(\.\d{1,3}){3}$/.test(s) || s.split('.').some((x) => Number(x) > 255)) throw new PyExc('ValueError', `${repr(a[0])} does not appear to be an IPv4 or IPv6 address`);
            return s;
          }),
          ip_network: B('ip_network', (a) => String(a[0])),
        });
        break;
    }
    if (!m) {
      this.missingModule = name;
      const msg = ['socket', 'requests', 'subprocess', 'scapy', 'paramiko', 'urllib', 'http'].includes(name.split('.')[0])
        ? `No module named '${name}'`
        : `No module named '${name}'`;
      throw new PyExc('ModuleNotFoundError', msg);
    }
    this.modules[name] = m;
    return m;
  }

  flushErr: string | null = null;
}

const HIERARCHY: Record<string, string[]> = {
  OSError: ['FileNotFoundError', 'PermissionError', 'IsADirectoryError', 'ConnectionError', 'TimeoutError'],
  LookupError: ['KeyError', 'IndexError'],
  ArithmeticError: ['ZeroDivisionError'],
  ValueError: ['UnicodeDecodeError', 'json.decoder.JSONDecodeError'],
  ImportError: ['ModuleNotFoundError'],
  IOError: ['FileNotFoundError', 'PermissionError', 'IsADirectoryError'],
};

function excMatches(type: string, handler: string): boolean {
  if (handler === 'Exception' || handler === 'BaseException' || handler === type) return true;
  if (handler === 'json.JSONDecodeError' && type === 'json.decoder.JSONDecodeError') return true;
  return (HIERARCHY[handler] ?? []).includes(type);
}

function suggestName(id: string, sc: Scope, builtins: Record<string, PyVal>): string {
  const names = new Set<string>(Object.keys(builtins));
  for (let s: Scope | null = sc; s; s = s.parent) for (const k of s.vars.keys()) names.add(k);
  let best = '';
  let bd = 3;
  for (const n of names) {
    if (Math.abs(n.length - id.length) > 2) continue;
    const d = lev(n, id);
    if (d < bd && d <= Math.max(1, Math.floor(n.length / 3))) {
      bd = d;
      best = n;
    }
  }
  return best ? `. Did you mean: '${best}'?` : '';
}

function lev(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** Esegue un programma e restituisce output, errori (traceback) ed esito. */
export function runPython(src: string, filename: string, host: PyHost): PyResult {
  const it = new Interp(host, filename);
  const lines = src.split('\n');
  const err: string[] = [];
  let ok = true;
  try {
    it.run(src);
    it.flush();
  } catch (e) {
    try {
      it.flush();
    } catch {
      /* il file era comunque da chiudere */
    }
    if (e instanceof ExitSig) {
      ok = e.code === 0;
      if (it.flushErr) err.push(it.flushErr);
    } else if (e instanceof PySyntaxError) {
      ok = false;
      err.push(`  File "${filename}", line ${e.line}`);
      const l = lines[e.line - 1];
      if (l !== undefined) err.push('    ' + l.trim());
      err.push(`${e.type}: ${e.message}`);
    } else if (e instanceof PyExc) {
      ok = false;
      const frames = e.frames ?? (it as unknown as { frames: { name: string; line: number }[] }).frames.map((x) => ({ ...x }));
      err.push('Traceback (most recent call last):');
      for (const f of frames) {
        err.push(`  File "${filename}", line ${f.line}, in ${f.name}`);
        const l = lines[f.line - 1];
        if (l !== undefined && l.trim()) err.push('    ' + l.trim());
      }
      err.push(e.msg ? `${e.type}: ${e.msg}` : e.type);
    } else if (e instanceof BreakSig || e instanceof ContinueSig) {
      ok = false;
      err.push(`SyntaxError: '${e instanceof BreakSig ? 'break' : 'continue'}' outside loop`);
    } else if (e instanceof ReturnSig) {
      ok = false;
      err.push("SyntaxError: 'return' outside function");
    } else throw e;
  }
  return { out: it.out, err, ok, missingModule: it.missingModule };
}
