// Il comando python3 del deck: esegue script e righe di codice con il mini interprete.

import { COMMANDS, type Ctx } from './shell';
import { runPython, type PyHost } from './python';
import { ALIASES, doc } from './manpages';

function host(c: Ctx, argv: string[]): PyHost {
  const sh = c.sh;
  return {
    argv,
    stdin: c.stdin,
    cwd: sh.cwd,
    read(path) {
      const abs = sh.abs(path);
      const n = sh.fs.get(abs);
      if (!n) return 'enoent';
      if (sh.blocked(abs) || n.locked) return 'eacces';
      if (n.type === 'dir') return 'eisdir';
      c.emit({ type: 'read', path: abs });
      // come gli altri comandi del deck: un file di testo finisce sempre con un a capo
      return n.content === '' || n.content.endsWith('\n') ? n.content : n.content + '\n';
    },
    write(path, text, append) {
      return sh.writeText(sh.abs(path), text, append);
    },
    listdir(path) {
      const abs = sh.abs(path);
      const n = sh.fs.get(abs);
      if (!n || n.type !== 'dir' || sh.blocked(abs) || n.locked) return null;
      return [...n.children.keys()].sort();
    },
    kind(path) {
      const n = sh.fs.get(sh.abs(path));
      return n ? n.type : null;
    },
  };
}

function python3(c: Ctx): number {
  const a = c.args;
  if (a[0] === '--version' || a[0] === '-V') {
    c.out('Python 3.12.3');
    return 0;
  }
  let src: string;
  let file: string;
  let argv: string[];
  let path = '';
  if (a[0] === '-c') {
    if (a[1] === undefined) {
      c.err('Argument expected for the -c option');
      return 2;
    }
    src = a[1];
    file = '<string>';
    argv = ['-c', ...a.slice(2)];
  } else if (a[0] === '-h' || a[0] === '--help') {
    c.out('usage: python3 [-c cmd | file] [arg] ...');
    c.info('💡 Esempi: python3 -c "print(2 + 2)" · python3 script.py · man python3');
    return 0;
  } else if (a.length && !a[0].startsWith('-')) {
    path = c.sh.abs(a[0]);
    const n = c.sh.fs.get(path);
    if (!n || n.type !== 'file' || c.sh.blocked(path) || n.locked) {
      c.err(`python3: can't open file '${path}': [Errno ${!n ? 2 : 13}] ${!n ? 'No such file or directory' : n.type === 'dir' ? 'Is a directory' : 'Permission denied'}`);
      return 2;
    }
    src = n.content;
    file = a[0];
    argv = [...a];
  } else {
    c.out('Python 3.12.3 (deck simulato) on linux');
    c.info('💡 Nel deck la modalità interattiva (>>>) non c\'è: scrivi uno script con nano e lancialo con "python3 nome.py", oppure prova una riga con: python3 -c "print(2 + 2)"');
    return 0;
  }
  const r = runPython(src, file, host(c, argv));
  for (const l of r.out) c.out(l);
  for (const l of r.err) c.err(l);
  if (r.missingModule && ['socket', 'requests', 'subprocess', 'scapy', 'paramiko', 'urllib', 'http', 'nmap'].includes(r.missingModule.split('.')[0]))
    c.info(`💡 Nel deck il modulo "${r.missingModule}" non è simulato: le connessioni di rete si fanno con i comandi del terminale. Sul tuo computer, in un laboratorio, funzionerà.`);
  else if (!r.ok && r.err.some((l) => l.startsWith('IndentationError'))) c.info('💡 In Python l\'indentazione è parte della sintassi: i blocchi dopo ":" vanno rientrati tutti dello stesso numero di spazi (di solito 4).');
  c.emit({ type: 'python', path, ok: r.ok, out: r.out, src, args: argv.slice(1) });
  return r.ok ? 0 : 1;
}

Object.assign(COMMANDS, { python3, python: python3 });
ALIASES.python = 'python3';

doc('python3', {
  cat: 'Script e shell',
  short: 'esegue programmi Python',
  synopsis: 'python3 SCRIPT.py [ARGOMENTI...]  ·  python3 -c "CODICE"',
  description: [
    'Python è il linguaggio più usato nella sicurezza informatica: per automatizzare analisi di log, controllare impronte, estrarre indicatori, parlare con le API dei servizi. È leggibile, ha una libreria standard enorme e quasi ogni strumento di sicurezza si può comandare da Python.',
    'Uno script Python è un file di testo (di solito con estensione .py) che si scrive con un editor (nano) e si esegue con "python3 nome.py". Gli argomenti dopo il nome finiscono nella lista sys.argv.',
    'Con -c esegui al volo una riga di codice, utile per calcoli e prove veloci.',
    'Il Python del deck è un interprete ridotto ma vero: variabili, if, for, while, funzioni, liste, dizionari, comprehension, f-string, try/except, file con open(), e i moduli sys, os, re, hashlib (sha256), base64, json, collections (Counter, defaultdict), math, random, string. Non ci sono classi né moduli di rete.',
  ],
  options: [
    ['-c "CODICE"', 'esegue il codice scritto tra virgolette'],
    ['--version', 'mostra la versione'],
  ],
  examples: [
    ['python3 -c "print(2 ** 10)"', 'una riga al volo: 2 alla decima'],
    ['python3 -c "print(len(\'Night City\'))"', 'quanti caratteri ha un testo'],
    ['python3 -c "import hashlib; print(hashlib.sha256(b\'ciao\').hexdigest())"', 'impronta SHA-256 di un testo'],
    ['python3 --version', 'quale Python è installato'],
  ],
  notes: [
    'L\'indentazione (gli spazi a inizio riga) in Python fa parte della sintassi: i blocchi dopo "if", "for", "def" vanno rientrati, di solito di 4 spazi.',
    'Quando uno script si ferma con un errore, leggi il traceback dal BASSO: l\'ultima riga dice il tipo di errore e il motivo, quella sopra la riga di codice che l\'ha causato.',
    'Nel mondo reale: python3 -m venv crea un ambiente isolato per le librerie, pip install le installa. Nel deck non servono.',
  ],
  see: ['nano', 'bash', 'grep'],
});
