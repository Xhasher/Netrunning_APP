import { describe, expect, it } from 'vitest';
import { buildWorld } from '../src/content/world';

const sh0 = () => buildWorld('edge');
function py(src: string, args = ''): { out: string; err: string } {
  const sh = sh0();
  sh.fs.writeFile('/home/edge/t.py', src, { owner: 'edge', group: 'edge' });
  const r = sh.run(`python3 t.py ${args}`);
  return {
    out: r.lines.filter((l) => l.cls !== 'err' && l.cls !== 'info').map((l) => l.text).join('\n'),
    err: r.lines.filter((l) => l.cls === 'err').map((l) => l.text).join('\n'),
  };
}
const out = (src: string, args = '') => {
  const r = py(src, args);
  expect(r.err).toBe('');
  return r.out;
};

describe('python: basi', () => {
  it('print, aritmetica, tipi', () => {
    expect(out('print("ciao", 42)\nprint(7 / 2, 7 // 2, 7 % 3, 2 ** 10)\nprint(1.0, 0.1 + 0.2, -7 // 2)')).toBe('ciao 42\n3.5 3 1 1024\n1.0 0.30000000000000004 -4');
    expect(out('x = 3\nx += 2\nprint(x, type(x), type(1.5), type("a"))')).toBe("5 <class 'int'> <class 'float'> <class 'str'>");
    expect(out('print(True and False, not None, 3 > 2 > 1, 1 < 2 > 5)')).toBe('False True True False');
    expect(out('print(10, end="")\nprint("|", sep="-")\nprint("a", "b", sep="-")')).toBe('10|\na-b');
  });

  it('stringhe e f-string', () => {
    expect(out('s = "  Night City  "\nprint(s.strip().upper(), len(s), s.split())')).toBe("NIGHT CITY 14 ['Night', 'City']");
    expect(out('ip = "10.0.0.7"\nn = 3\nprint(f"{ip} ha fatto {n} tentativi, {n*2:>5} {3.14159:.2f} {n:03d}")')).toBe('10.0.0.7 ha fatto 3 tentativi,     6 3.14 003');
    expect(out('print("a,b,,c".split(","), "-".join(["x", "y"]), "abc"[::-1], "abc"[1:])')).toBe("['a', 'b', '', 'c'] x-y cba bc");
    expect(out('print("{} e {}".format(1, "due"), "%s:%d" % ("porta", 22), repr("it\'s"))')).toBe('1 e due porta:22 "it\'s"');
    expect(out('print("Failed" in "Failed password", "x".join("abc"), "a b c".split(" ", 1))')).toBe("True axbxc ['a', 'b c']");
  });

  it('liste, dizionari, insiemi, comprehension', () => {
    expect(out('l = [3, 1, 2]\nl.append(5)\nl.sort(reverse=True)\nprint(l, l[0], l[-1], sum(l), max(l), sorted(l))')).toBe('[5, 3, 2, 1] 5 1 11 5 [1, 2, 3, 5]');
    expect(out('d = {"a": 1}\nd["b"] = 2\nfor k, v in d.items():\n    print(k, v)\nprint(d, d.get("z", 0), list(d.keys()), "a" in d)')).toBe("a 1\nb 2\n{'a': 1, 'b': 2} 0 ['a', 'b'] True");
    expect(out('print([x * x for x in range(5) if x % 2 == 0], {x: len(x) for x in ["ab", "c"]}, sorted({3, 1, 3}))')).toBe("[0, 4, 16] {'ab': 2, 'c': 1} [1, 3]");
    expect(out('a, b = "user:pass".split(":")\nprint(a, b)\nfirst, *rest = [1, 2, 3]\nprint(first, rest)')).toBe('user pass\n1 [2, 3]');
    expect(out('t = (1, "a")\nprint(t, len(t), (5,), list(enumerate("ab")), list(zip([1, 2], "xy")))')).toBe("(1, 'a') 2 (5,) [(0, 'a'), (1, 'b')] [(1, 'x'), (2, 'y')]");
  });

  it('controllo di flusso e funzioni', () => {
    const src = `def classifica(n, soglia=5):
    if n >= soglia * 2:
        return "critico"
    elif n >= soglia:
        return "alto"
    else:
        return "basso"

for n in [1, 5, 12]:
    print(n, classifica(n))
print(classifica(3, soglia=2))
i = 0
while True:
    i += 1
    if i == 2:
        continue
    if i > 3:
        break
    print("giro", i)
quadrato = lambda x: x * x
print(quadrato(4), sorted(["bb", "a", "ccc"], key=len))
`;
    expect(out(src)).toBe('1 basso\n5 alto\n12 critico\nalto\ngiro 1\ngiro 3\n16 [\'a\', \'bb\', \'ccc\']');
  });

  it('eccezioni e try/except', () => {
    expect(out('try:\n    int("abc")\nexcept ValueError as e:\n    print("errore:", e)\nfinally:\n    print("fine")')).toBe("errore: invalid literal for int() with base 10: 'abc'\nfine");
    expect(out('try:\n    open("nonc_e.txt")\nexcept FileNotFoundError:\n    print("manca")')).toBe('manca');
    expect(out('try:\n    {}["x"]\nexcept Exception as e:\n    print(type(e), repr(e))')).toBe("<class 'KeyError'> KeyError(\"'x'\")");
  });
});

describe('python: errori come nel vero Python', () => {
  it('traceback con riga e tipo', () => {
    const r = py('x = 1\nprint(y)\n');
    expect(r.err).toBe("Traceback (most recent call last):\n  File \"t.py\", line 2, in <module>\n    print(y)\nNameError: name 'y' is not defined. Did you mean: 'x'?");
  });
  it('errori dentro le funzioni mostrano tutte le chiamate', () => {
    const r = py('def f(a):\n    return a + 1\n\nprint(f("x"))\n');
    expect(r.err).toContain('line 4, in <module>');
    expect(r.err).toContain('line 2, in f');
    expect(r.err).toContain('TypeError: can only concatenate str (not "int") to str');
  });
  it('sintassi e indentazione', () => {
    expect(py('if True\n    print(1)\n').err).toContain("SyntaxError: expected ':'");
    expect(py('if True:\nprint(1)\n').err).toContain("IndentationError: expected an indented block after 'if' statement on line 1");
    expect(py('x = (1, 2\n').err).toContain('SyntaxError');
    expect(py('print("ciao)\n').err).toContain('unterminated string literal');
  });
  it('indici, chiavi, divisioni', () => {
    expect(py('print([1][3])').err).toContain('IndexError: list index out of range');
    expect(py('print({"a": 1}["b"])').err).toContain("KeyError: 'b'");
    expect(py('print(1 / 0)').err).toContain('ZeroDivisionError: division by zero');
    expect(py('a, b = [1, 2, 3]').err).toContain('ValueError: too many values to unpack (expected 2)');
  });
  it('ciclo infinito interrotto', () => {
    expect(py('while True:\n    pass\n').err).toContain('TimeoutError');
  });
  it('moduli di rete non simulati', () => {
    const sh = sh0();
    const r = sh.run('python3 -c "import socket"');
    expect(r.lines.map((l) => l.text).join('\n')).toContain("ModuleNotFoundError: No module named 'socket'");
    expect(r.lines.some((l) => l.cls === 'info')).toBe(true);
  });
});

describe('python: file e moduli', () => {
  it('legge i log del deck e conta con Counter', () => {
    const src = `from collections import Counter
conta = Counter()
with open("caso/auth.log") as f:
    for riga in f:
        if "Failed password" in riga:
            parti = riga.split()
            conta[parti[parti.index("from") + 1]] += 1
for ip, n in conta.most_common(1):
    print(ip, n)
`;
    const sh = sh0();
    const res = out(src);
    expect(res).toMatch(/^\d+\.\d+\.\d+\.\d+ \d+$/);
    const [ip, n] = res.split(' ');
    expect(sh.run(`grep "Failed password" caso/auth.log | grep -c "from ${ip} "`).lines[0].text).toBe(n);
  });

  it('sys.argv, scrittura di file, os', () => {
    const sh = sh0();
    sh.fs.writeFile('/home/edge/w.py', 'import sys, os\nnome = sys.argv[1]\nwith open(nome, "w") as f:\n    f.write("riga 1\\n")\n    print("riga 2", file=f)\nprint(os.path.exists(nome), len(sys.argv))\n', { owner: 'edge', group: 'edge' });
    const r = sh.run('python3 w.py uscita.txt');
    expect(r.lines.map((l) => l.text).join('\n')).toBe('True 2');
    expect(sh.run('cat uscita.txt').lines.map((l) => l.text)).toEqual(['riga 1', 'riga 2']);
  });

  it('hashlib coincide con sha256sum, base64, re, json', () => {
    const sh = sh0();
    const shell = sh.run('sha256sum missioni/benvenuto.txt').lines[0].text.split(' ')[0];
    sh.fs.writeFile('/home/edge/h.py', 'import hashlib\nwith open("missioni/benvenuto.txt", "rb") as f:\n    print(hashlib.sha256(f.read()).hexdigest())\n', { owner: 'edge', group: 'edge' });
    expect(sh.run('python3 h.py').lines[0].text).toBe(shell);
    expect(out('import base64\nprint(base64.b64decode("Y2lhbw==").decode(), base64.b64encode("ciao".encode()))')).toBe("ciao b'Y2lhbw=='");
    expect(out('import re\nt = "da 10.0.0.1 e 192.168.1.20"\nprint(re.findall(r"\\d+\\.\\d+\\.\\d+\\.\\d+", t))\nm = re.search(r"(?P<a>\\d+)\\.(\\d+)", t)\nprint(m.group(0), m.group("a"), m.groups())')).toBe("['10.0.0.1', '192.168.1.20']\n10.0 10 ('10', '0')");
    expect(out('import json\nd = json.loads(\'{"a": [1, 2.5, true, null]}\')\nprint(d, json.dumps(d))')).toBe("{'a': [1, 2.5, True, None]} {\"a\": [1, 2.5, true, null]}");
  });

  it('python3 -c e pipe da stdin', () => {
    const sh = sh0();
    expect(sh.run('python3 -c "print(sum(range(101)))"').lines[0].text).toBe('5050');
    expect(sh.run('echo "uno due tre" | python3 -c "import sys; print(len(sys.stdin.read().split()))"').lines[0].text).toBe('3');
  });
});
