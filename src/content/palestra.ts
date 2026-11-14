// Palestra dei comandi: esercizi brevi, generati a caso, su un comando alla volta.
// Ogni esercizio ha un livello (1 = la forma base, 2 = un'opzione in più, 3 = in
// combinazione con altro) e dati sempre diversi, così la risposta non si impara a
// memoria: si impara il comando.

import { WORDS, NAMES, makeRng, pathAnswers, pubIp, time, write, type Ctx, type Drill, type Level, type Rng } from './drills';
import { base64Encode, sha256 } from '../engine/sha256';
import type { Shell } from '../engine/shell';

export interface PalEx {
  id: string;
  /** competenza allenata (nome canonico, come nella pagina Competenze) */
  skill: string;
  lv: Level;
  make: (c: Ctx) => Omit<Drill, 'chapter' | 'gid'>;
}

const FILES = ['rapporto', 'turno', 'inventario', 'note', 'accessi', 'backup', 'clienti', 'ordini', 'firewall', 'utenti'];
const EXT = ['txt', 'log', 'cfg', 'csv', 'bak'];
const CODE = (r: Rng) => `${r.pick(['ALFA', 'NEON', 'KILO', 'ZETA', 'ORSO', 'LUPO'])}-${r.int(100, 999)}`;
const uniqName = (r: Rng, n: number, pool = WORDS) => r.shuffle(pool).slice(0, n);
const abs = (c: Ctx, rel = '') => `${c.sh.home}/${c.dir}${rel ? '/' + rel : ''}`;
const mkdir = (c: Ctx, rel = '') => c.sh.fs.mkdirp(abs(c, rel), { owner: c.sh.user, group: c.sh.user });
const isFile = (sh: Shell, p: string) => sh.fs.get(p)?.type === 'file';
const isDir = (sh: Shell, p: string) => sh.fs.get(p)?.type === 'dir';
const content = (sh: Shell, p: string) => {
  const n = sh.fs.get(p);
  return n && n.type === 'file' ? n.content : null;
};

/** Righe di un log di accessi SSH, con un certo numero di fallimenti da un IP. */
function authLog(r: Rng, opts: { fails: number; ip: string; others: number; user?: string }): string[] {
  const lines: string[] = [];
  let t = r.int(3000, 40000);
  const user = opts.user ?? r.pick(NAMES);
  const ev = (s: string) => lines.push(`Nov 12 ${time((t += r.int(2, 90)))} deck sshd[${r.int(1000, 9999)}]: ${s}`);
  const mix = r.shuffle([...Array(opts.fails).fill('f'), ...Array(opts.others).fill('o')]);
  for (const k of mix) {
    if (k === 'f') ev(`Failed password for ${user} from ${opts.ip} port ${r.int(30000, 60000)} ssh2`);
    else ev(r.next() < 0.6 ? `Accepted password for ${r.pick(NAMES)} from ${pubIp(r)} port ${r.int(30000, 60000)} ssh2` : `Failed password for ${r.pick(NAMES)} from ${pubIp(r)} port ${r.int(30000, 60000)} ssh2`);
  }
  return lines;
}

// ---------------------------------------------------------------- navigare

const NAV: PalEx[] = [
  {
    id: 'cd-entra',
    skill: 'cd',
    lv: 1,
    make: (c) => {
      const [a, b] = uniqName(c.r, 2);
      mkdir(c, a);
      mkdir(c, b);
      const target = abs(c, a);
      return {
        title: 'Entra nella cartella',
        prompt: `Spostati **dentro** la cartella \`${c.dir}/${a}\`. Poi controlla dove sei.`,
        hints: ['cd seguito dal percorso della cartella.', `cd ${c.dir}/${a}`],
        state: (sh) => sh.cwd === target,
        solve: [`cd ${c.dir}/${a}`],
      };
    },
  },
  {
    id: 'cd-profondo',
    skill: 'cd',
    lv: 2,
    make: (c) => {
      const [a, b, d] = uniqName(c.r, 3);
      mkdir(c, `${a}/${b}/${d}`);
      mkdir(c, `${b}/${a}`);
      const target = abs(c, `${a}/${b}/${d}`);
      return {
        title: 'Tre livelli sotto',
        prompt: `Arriva nella cartella \`${d}\`, che si trova dentro \`${c.dir}/${a}/${b}\`, con **un solo** comando cd.`,
        hints: ['Un percorso può attraversare più cartelle, separate da /.', `cd ${c.dir}/${a}/${b}/${d}`],
        state: (sh) => sh.cwd === target,
        solve: [`cd ${c.dir}/${a}/${b}/${d}`],
      };
    },
  },
  {
    id: 'cd-su',
    skill: 'cd',
    lv: 3,
    make: (c) => {
      const [a, b, d] = uniqName(c.r, 3);
      mkdir(c, `${a}/${b}/${d}`);
      const target = abs(c, a);
      return {
        title: 'Torna su di due',
        prompt: `Entra in \`${c.dir}/${a}/${b}/${d}\`, poi risali di **due** livelli con un solo comando, usando \`..\`. Devi finire in \`${a}\`.`,
        hints: ['.. è la cartella genitore; ../.. è il genitore del genitore.', `cd ${c.dir}/${a}/${b}/${d} e poi cd ../..`],
        state: (sh) => sh.cwd === target,
        solve: [`cd ${c.dir}/${a}/${b}/${d}`, 'cd ../..'],
      };
    },
  },
  {
    id: 'pwd-dove',
    skill: 'pwd',
    lv: 1,
    make: (c) => {
      const [a, b] = uniqName(c.r, 2);
      mkdir(c, `${a}/${b}`);
      return {
        title: 'Il percorso completo',
        prompt: `Entra in \`${c.dir}/${a}/${b}\` e invia con \`flag\` il **percorso assoluto** di quella cartella (quello che inizia con /).`,
        hints: ['pwd stampa il percorso assoluto della cartella in cui sei.', `cd ${c.dir}/${a}/${b} e poi pwd`],
        answer: [abs(c, `${a}/${b}`)],
        solve: [`cd ${c.dir}/${a}/${b}`, 'pwd'],
      };
    },
  },
  {
    id: 'ls-conta',
    skill: 'ls',
    lv: 1,
    make: (c) => {
      const n = c.r.int(3, 7);
      for (const w of uniqName(c.r, n)) write(c, `${w}.${c.r.pick(EXT)}`, 'x\n');
      return {
        title: 'Quanti file?',
        prompt: `Quanti elementi ci sono nella cartella \`${c.dir}\`? Contali con ls e invia il numero con \`flag\`.`,
        hints: ['ls seguito dal nome della cartella mostra cosa contiene.', `ls ${c.dir}`],
        answer: [String(n)],
        solve: [`ls ${c.dir}`, `ls ${c.dir} | wc -l`],
      };
    },
  },
  {
    id: 'ls-a',
    skill: 'ls',
    lv: 2,
    make: (c) => {
      for (const w of uniqName(c.r, c.r.int(3, 5))) write(c, `${w}.txt`, 'niente\n');
      const hidden = `.${c.r.pick(WORDS)}_${c.r.int(10, 99)}`;
      write(c, hidden, 'trovato\n');
      return {
        title: 'Il file nascosto',
        prompt: `In \`${c.dir}\` c'è un file **nascosto**. Invia il suo nome (con il punto iniziale) con \`flag\`.`,
        hints: ['I file nascosti iniziano con un punto e ls da solo non li mostra.', `ls -a ${c.dir}`],
        answer: [hidden],
        solve: [`ls -a ${c.dir}`],
      };
    },
  },
  {
    id: 'ls-l',
    skill: 'ls',
    lv: 3,
    make: (c) => {
      const names = uniqName(c.r, 4);
      const big = c.r.pick(names);
      for (const w of names) write(c, `${w}.log`, w === big ? 'riga di log\n'.repeat(c.r.int(40, 80)) : 'riga\n'.repeat(c.r.int(1, 6)));
      return {
        title: 'Il più pesante',
        prompt: `Tra i file di \`${c.dir}\`, qual è il **più grande**? Invia il suo nome con \`flag\`.`,
        hints: ['ls -l mostra anche la dimensione in byte (la colonna prima della data).', `ls -lS ${c.dir} li ordina dal più grande`],
        answer: [`${big}.log`, big],
        solve: [`ls -lS ${c.dir}`],
      };
    },
  },
  {
    id: 'cat-leggi',
    skill: 'cat',
    lv: 1,
    make: (c) => {
      const code = CODE(c.r);
      const f = `${c.r.pick(FILES)}.txt`;
      write(c, f, `Messaggio per il turno di notte.\nCodice di oggi: ${code}\nNon condividerlo.\n`);
      return {
        title: 'Leggi il messaggio',
        prompt: `Nel file \`${c.dir}/${f}\` c'è il codice di oggi. Leggilo e invialo con \`flag\`.`,
        hints: ['cat mostra il contenuto di un file.', `cat ${c.dir}/${f}`],
        answer: [code],
        solve: [`cat ${c.dir}/${f}`],
      };
    },
  },
  {
    id: 'cat-spazi',
    skill: 'cat',
    lv: 2,
    make: (c) => {
      const code = CODE(c.r);
      const f = `nota ${c.r.pick(WORDS)}.txt`;
      write(c, f, `${code}\n`);
      return {
        title: 'Un nome con lo spazio',
        prompt: `Leggi il file \`${c.dir}/${f}\` (il nome contiene uno **spazio**) e invia il codice con \`flag\`.`,
        hints: ['Lo spazio separa gli argomenti: metti il percorso tra virgolette.', `cat "${c.dir}/${f}"`],
        answer: [code],
        solve: [`cat "${c.dir}/${f}"`],
      };
    },
  },
  {
    id: 'cat-n',
    skill: 'cat',
    lv: 3,
    make: (c) => {
      const lines = Array.from({ length: c.r.int(8, 14) }, () => `${c.r.pick(WORDS)} ${c.r.pick(WORDS)}`);
      const at = c.r.int(3, lines.length);
      lines[at - 1] = 'ATTENZIONE: porta 23 aperta';
      write(c, 'verifica.txt', lines.join('\n') + '\n');
      return {
        title: 'A che riga?',
        prompt: `In \`${c.dir}/verifica.txt\` c'è una riga che inizia con ATTENZIONE. A che **numero di riga** si trova? Invia il numero con \`flag\`.`,
        hints: ['cat -n numera le righe.', `cat -n ${c.dir}/verifica.txt (oppure grep -n ATTENZIONE)`],
        answer: [String(at)],
        solve: [`cat -n ${c.dir}/verifica.txt`],
      };
    },
  },
];

// ---------------------------------------------------------------- file e cartelle

const FILEOPS: PalEx[] = [
  {
    id: 'mkdir-una',
    skill: 'mkdir',
    lv: 1,
    make: (c) => {
      mkdir(c);
      const d = `${c.r.pick(['prove', 'casi', 'report', 'turni'])}_${c.r.int(10, 99)}`;
      return {
        title: 'Una cartella nuova',
        prompt: `Crea la cartella \`${c.dir}/${d}\`.`,
        hints: ['mkdir crea una cartella.', `mkdir ${c.dir}/${d}`],
        state: (sh) => isDir(sh, abs(c, d)),
        solve: [`mkdir ${c.dir}/${d}`],
      };
    },
  },
  {
    id: 'mkdir-p',
    skill: 'mkdir',
    lv: 2,
    make: (c) => {
      mkdir(c);
      const p = `caso_${c.r.int(100, 999)}/${c.r.pick(['prove', 'log', 'immagini'])}/${c.r.pick(['originali', 'copie'])}`;
      return {
        title: 'Tutta la struttura in un colpo',
        prompt: `Crea il percorso \`${c.dir}/${p}\` con **un solo** comando: nessuna di queste cartelle esiste ancora.`,
        hints: ['mkdir da solo si ferma se manca la cartella genitore. Esiste un\'opzione che crea anche quelle intermedie.', `mkdir -p ${c.dir}/${p}`],
        state: (sh) => isDir(sh, abs(c, p)),
        solve: [`mkdir -p ${c.dir}/${p}`],
      };
    },
  },
  {
    id: 'mkdir-tante',
    skill: 'mkdir',
    lv: 3,
    make: (c) => {
      mkdir(c);
      const ds = uniqName(c.r, 3, ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi']);
      return {
        title: 'Tre cartelle, un comando',
        prompt: `Dentro \`${c.dir}\` crea le cartelle ${ds.map((d) => `\`${d}\``).join(', ')} con **un solo** comando.`,
        hints: ['mkdir accetta più nomi, separati da spazi.', `cd ${c.dir} e poi mkdir ${ds.join(' ')}`],
        state: (sh) => ds.every((d) => isDir(sh, abs(c, d))),
        solve: [`mkdir ${ds.map((d) => `${c.dir}/${d}`).join(' ')}`],
      };
    },
  },
  {
    id: 'touch-vuoto',
    skill: 'touch',
    lv: 1,
    make: (c) => {
      mkdir(c);
      const f = `${c.r.pick(FILES)}.log`;
      return {
        title: 'Un file vuoto',
        prompt: `Crea il file vuoto \`${c.dir}/${f}\`.`,
        hints: ['touch crea un file vuoto (o aggiorna la data di uno esistente).', `touch ${c.dir}/${f}`],
        state: (sh) => isFile(sh, abs(c, f)),
        solve: [`touch ${c.dir}/${f}`],
      };
    },
  },
  {
    id: 'cp-copia',
    skill: 'cp',
    lv: 1,
    make: (c) => {
      const f = `${c.r.pick(FILES)}.cfg`;
      const body = `porta=${c.r.int(1000, 9000)}\nutente=${c.r.pick(NAMES)}\n`;
      write(c, f, body);
      return {
        title: 'Copia di sicurezza',
        prompt: `Prima di toccare una configurazione si fa una copia. Copia \`${c.dir}/${f}\` in \`${c.dir}/${f}.bak\`.`,
        hints: ['cp ORIGINE DESTINAZIONE.', `cp ${c.dir}/${f} ${c.dir}/${f}.bak`],
        state: (sh) => content(sh, abs(c, `${f}.bak`)) === body && content(sh, abs(c, f)) === body,
        solve: [`cp ${c.dir}/${f} ${c.dir}/${f}.bak`],
      };
    },
  },
  {
    id: 'cp-in-cartella',
    skill: 'cp',
    lv: 2,
    make: (c) => {
      const fs = uniqName(c.r, 2, FILES).map((x) => `${x}.txt`);
      for (const f of fs) write(c, f, `${f}\n`);
      mkdir(c, 'archivio');
      return {
        title: 'Due file nell\'archivio',
        prompt: `Copia **entrambi** i file ${fs.map((f) => `\`${c.dir}/${f}\``).join(' e ')} dentro la cartella \`${c.dir}/archivio\`, con un solo comando.`,
        hints: ['Se l\'ultimo argomento di cp è una cartella, i file prima vengono copiati lì dentro.', `cp ${fs.map((f) => `${c.dir}/${f}`).join(' ')} ${c.dir}/archivio`],
        state: (sh) => fs.every((f) => isFile(sh, abs(c, `archivio/${f}`)) && isFile(sh, abs(c, f))),
        solve: [`cp ${fs.map((f) => `${c.dir}/${f}`).join(' ')} ${c.dir}/archivio`],
      };
    },
  },
  {
    id: 'cp-r',
    skill: 'cp',
    lv: 3,
    make: (c) => {
      const d = c.r.pick(['prove', 'evidenze', 'raccolta']);
      const fs = uniqName(c.r, 3, FILES);
      for (const f of fs) write(c, `${d}/${f}.log`, 'dato\n');
      return {
        title: 'Copia tutta la cartella',
        prompt: `Copia la cartella \`${c.dir}/${d}\` **con tutto il contenuto** in \`${c.dir}/${d}_copia\`.`,
        hints: ['Per le cartelle cp ha bisogno di un\'opzione: "ricorsivo".', `cp -r ${c.dir}/${d} ${c.dir}/${d}_copia`],
        state: (sh) => fs.every((f) => isFile(sh, abs(c, `${d}_copia/${f}.log`))),
        solve: [`cp -r ${c.dir}/${d} ${c.dir}/${d}_copia`],
      };
    },
  },
  {
    id: 'mv-rinomina',
    skill: 'mv',
    lv: 1,
    make: (c) => {
      const from = `bozza_${c.r.int(1, 9)}.txt`;
      const to = `${c.r.pick(FILES)}_finale.txt`;
      write(c, from, 'testo\n');
      return {
        title: 'Rinomina',
        prompt: `Rinomina \`${c.dir}/${from}\` in \`${c.dir}/${to}\`.`,
        hints: ['In Linux rinominare è spostare: mv VECCHIO NUOVO.', `mv ${c.dir}/${from} ${c.dir}/${to}`],
        state: (sh) => isFile(sh, abs(c, to)) && !sh.fs.get(abs(c, from)),
        solve: [`mv ${c.dir}/${from} ${c.dir}/${to}`],
      };
    },
  },
  {
    id: 'mv-sposta',
    skill: 'mv',
    lv: 2,
    make: (c) => {
      const logs = uniqName(c.r, c.r.int(2, 4)).map((w) => `${w}.log`);
      const others = uniqName(c.r, 2, FILES).map((w) => `${w}.txt`);
      for (const f of [...logs, ...others]) write(c, f, 'x\n');
      mkdir(c, 'log');
      return {
        title: 'Metti in ordine',
        prompt: `Sposta **tutti i file .log** di \`${c.dir}\` nella cartella \`${c.dir}/log\`. I file .txt restano dove sono.`,
        hints: ['Il jolly * sta per "qualsiasi testo": *.log sono tutti i file che finiscono in .log.', `mv ${c.dir}/*.log ${c.dir}/log`],
        state: (sh) => logs.every((f) => isFile(sh, abs(c, `log/${f}`)) && !sh.fs.get(abs(c, f))) && others.every((f) => isFile(sh, abs(c, f))),
        solve: [`mv ${c.dir}/*.log ${c.dir}/log`],
      };
    },
  },
  {
    id: 'rm-file',
    skill: 'rm',
    lv: 1,
    make: (c) => {
      const f = `vecchio_${c.r.pick(FILES)}.tmp`;
      const keep = `${c.r.pick(FILES)}.txt`;
      write(c, f, 'da buttare\n');
      write(c, keep, 'da tenere\n');
      return {
        title: 'Butta via',
        prompt: `Cancella \`${c.dir}/${f}\`. L'altro file deve restare. Attenzione: rm non chiede conferma e non c'è un cestino.`,
        hints: ['rm FILE.', `rm ${c.dir}/${f}`],
        state: (sh) => !sh.fs.get(abs(c, f)) && isFile(sh, abs(c, keep)),
        solve: [`rm ${c.dir}/${f}`],
      };
    },
  },
  {
    id: 'rm-jolly',
    skill: 'jolly',
    lv: 2,
    make: (c) => {
      const tmps = uniqName(c.r, c.r.int(3, 5)).map((w) => `${w}.tmp`);
      const keep = uniqName(c.r, 2, FILES).map((w) => `${w}.${c.r.pick(['txt', 'log'])}`);
      for (const f of [...tmps, ...keep]) write(c, f, 'x\n');
      return {
        title: 'Pulizia dei temporanei',
        prompt: `Cancella **solo** i file \`.tmp\` di \`${c.dir}\` con un solo comando. Gli altri devono restare.`,
        hints: ['Un jolly seleziona più file insieme. Prima controlla con ls cosa seleziona.', `ls ${c.dir}/*.tmp e poi rm ${c.dir}/*.tmp`],
        state: (sh) => tmps.every((f) => !sh.fs.get(abs(c, f))) && keep.every((f) => isFile(sh, abs(c, f))),
        solve: [`rm ${c.dir}/*.tmp`],
      };
    },
  },
  {
    id: 'rm-r',
    skill: 'rm',
    lv: 3,
    make: (c) => {
      const d = `vecchio_${c.r.int(10, 99)}`;
      for (const f of uniqName(c.r, 3, FILES)) write(c, `${d}/${f}.log`, 'x\n');
      write(c, 'tieni.txt', 'resta\n');
      return {
        title: 'Via tutta la cartella',
        prompt: `Cancella la cartella \`${c.dir}/${d}\` **con tutto quello che contiene**.`,
        hints: ['rmdir funziona solo sulle cartelle vuote; rm ha un\'opzione "ricorsiva".', `rm -r ${c.dir}/${d}`],
        state: (sh) => !sh.fs.get(abs(c, d)) && isFile(sh, abs(c, 'tieni.txt')),
        solve: [`rm -r ${c.dir}/${d}`],
      };
    },
  },
  {
    id: 'echo-scrivi',
    skill: 'redirezioni',
    lv: 1,
    make: (c) => {
      mkdir(c);
      const text = `turno di ${c.r.pick(NAMES)}: nessun allarme`;
      return {
        title: 'Scrivi in un file',
        prompt: `Crea \`${c.dir}/diario.txt\` con dentro esattamente la riga: \`${text}\``,
        hints: ['echo stampa un testo; > manda l\'output in un file invece che a schermo.', `echo "${text}" > ${c.dir}/diario.txt`],
        state: (sh) => (content(sh, abs(c, 'diario.txt')) ?? '').trim() === text,
        solve: [`echo "${text}" > ${c.dir}/diario.txt`],
      };
    },
  },
  {
    id: 'echo-accoda',
    skill: 'redirezioni',
    lv: 2,
    make: (c) => {
      const first = `${time(c.r.int(0, 80000))} inizio turno`;
      write(c, 'diario.txt', first + '\n');
      const add = `${time(c.r.int(0, 80000))} controllo ${c.r.pick(['firewall', 'backup', 'log'])} ok`;
      return {
        title: 'Aggiungi in fondo',
        prompt: `Aggiungi la riga \`${add}\` in fondo a \`${c.dir}/diario.txt\`, **senza cancellare** la riga che c'è già.`,
        hints: ['> sovrascrive il file; >> aggiunge in fondo.', `echo "${add}" >> ${c.dir}/diario.txt`],
        state: (sh) => {
          const t = (content(sh, abs(c, 'diario.txt')) ?? '').trim().split('\n');
          return t[0] === first && t[t.length - 1] === add;
        },
        solve: [`echo "${add}" >> ${c.dir}/diario.txt`],
      };
    },
  },
  {
    id: 'redir-output',
    skill: 'redirezioni',
    lv: 3,
    make: (c) => {
      const names = uniqName(c.r, c.r.int(3, 5));
      for (const w of names) write(c, `dati/${w}.csv`, 'a,b\n');
      return {
        title: 'Salva l\'elenco',
        prompt: `Salva l'elenco dei file della cartella \`${c.dir}/dati\` nel file \`${c.dir}/elenco.txt\` (l'output di ls, non a schermo ma nel file).`,
        hints: ['Qualsiasi comando può mandare il suo output in un file con >.', `ls ${c.dir}/dati > ${c.dir}/elenco.txt`],
        state: (sh) => {
          const t = content(sh, abs(c, 'elenco.txt')) ?? '';
          return names.every((w) => t.includes(`${w}.csv`));
        },
        solve: [`ls ${c.dir}/dati > ${c.dir}/elenco.txt`],
      };
    },
  },
  {
    id: 'chmod-x',
    skill: 'chmod',
    lv: 1,
    make: (c) => {
      const f = `${c.r.pick(['controlla', 'backup', 'pulizia'])}.sh`;
      write(c, f, '#!/bin/bash\necho ok\n', 'rw-r--r--');
      return {
        title: 'Rendilo eseguibile',
        prompt: `Lo script \`${c.dir}/${f}\` non parte perché manca il permesso di esecuzione. Aggiungilo.`,
        hints: ['chmod cambia i permessi; +x aggiunge l\'esecuzione.', `chmod +x ${c.dir}/${f}`],
        state: (sh) => (sh.fs.get(abs(c, f))?.perms ?? '')[2] === 'x',
        solve: [`chmod +x ${c.dir}/${f}`],
      };
    },
  },
  {
    id: 'chmod-600',
    skill: 'chmod',
    lv: 2,
    make: (c) => {
      const f = `${c.r.pick(['chiave', 'password', 'token'])}_${c.r.int(1, 9)}.txt`;
      write(c, f, 'segreto\n', 'rw-r--r--');
      return {
        title: 'Solo per te',
        prompt: `\`${c.dir}/${f}\` contiene un segreto ma lo possono leggere tutti. Fai in modo che solo il proprietario possa **leggerlo e scriverlo**, e nessun altro possa fare nulla (rw-------).`,
        hints: ['In forma numerica: r=4, w=2, x=1; una cifra per proprietario, gruppo, altri.', `chmod 600 ${c.dir}/${f}`],
        state: (sh) => sh.fs.get(abs(c, f))?.perms === 'rw-------',
        solve: [`chmod 600 ${c.dir}/${f}`],
      };
    },
  },
  {
    id: 'chmod-640',
    skill: 'chmod',
    lv: 3,
    make: (c) => {
      const f = `${c.r.pick(FILES)}.log`;
      write(c, f, 'eventi\n', 'rw-rw-rw-');
      return {
        title: 'Il gruppo legge, gli altri no',
        prompt: `Imposta i permessi di \`${c.dir}/${f}\` così: il proprietario legge e scrive, il gruppo **solo legge**, gli altri niente (rw-r-----).`,
        hints: ['Proprietario rw = 6, gruppo r = 4, altri nulla = 0.', `chmod 640 ${c.dir}/${f}`],
        state: (sh) => sh.fs.get(abs(c, f))?.perms === 'rw-r-----',
        solve: [`chmod 640 ${c.dir}/${f}`],
      };
    },
  },
];

// ---------------------------------------------------------------- leggere e filtrare testo

const TEXT: PalEx[] = [
  {
    id: 'head-prima',
    skill: 'head',
    lv: 1,
    make: (c) => {
      const code = CODE(c.r);
      write(c, 'report.txt', [`Oggetto: ${code}`, ...Array.from({ length: 30 }, () => `${c.r.pick(WORDS)} ${c.r.pick(WORDS)} ${c.r.pick(WORDS)}`)].join('\n') + '\n');
      return {
        title: 'Solo l\'inizio',
        prompt: `\`${c.dir}/report.txt\` è lungo, ma ti serve solo l'oggetto, nella **prima riga**. Invia il codice dell'oggetto con \`flag\`.`,
        hints: ['head mostra l\'inizio di un file (10 righe se non dici altro).', `head -n 1 ${c.dir}/report.txt`],
        answer: [code],
        solve: [`head -n 1 ${c.dir}/report.txt`],
      };
    },
  },
  {
    id: 'head-tail-n',
    skill: 'head',
    lv: 3,
    make: (c) => {
      const n = c.r.int(4, 9);
      const lines = Array.from({ length: 15 }, (_, i) => `${i + 1} ${c.r.pick(NAMES)}`);
      write(c, 'coda.txt', lines.join('\n') + '\n');
      const who = lines[n - 1].split(' ')[1];
      return {
        title: 'Esattamente la riga N',
        prompt: `Chi c'è alla **riga ${n}** di \`${c.dir}/coda.txt\`? Usa head e tail insieme, con una pipe, per mostrare solo quella riga. Invia il nome con \`flag\`.`,
        hints: [`head -n ${n} prende le prime ${n} righe; di queste, tail -n 1 tiene l'ultima.`, `head -n ${n} ${c.dir}/coda.txt | tail -n 1`],
        answer: [who],
        solve: [`head -n ${n} ${c.dir}/coda.txt | tail -n 1`],
      };
    },
  },
  {
    id: 'tail-ultima',
    skill: 'tail',
    lv: 1,
    make: (c) => {
      const log = authLog(c.r, { fails: 2, ip: pubIp(c.r), others: 25 });
      const ip = pubIp(c.r);
      log.push(`Nov 12 23:59:59 deck sshd[4242]: Accepted password for root from ${ip} port 50000 ssh2`);
      write(c, 'auth.log', log.join('\n') + '\n');
      return {
        title: 'L\'ultimo evento',
        prompt: `Da quale IP arriva l'**ultimo** accesso registrato in \`${c.dir}/auth.log\`? Invia l'IP con \`flag\`.`,
        hints: ['Nei log gli eventi nuovi sono in fondo; tail mostra la fine di un file.', `tail -n 1 ${c.dir}/auth.log`],
        answer: [ip],
        solve: [`tail -n 1 ${c.dir}/auth.log`],
      };
    },
  },
  {
    id: 'tail-n',
    skill: 'tail',
    lv: 2,
    make: (c) => {
      const lines = Array.from({ length: 20 }, () => `${time(c.r.int(0, 86000))} ${c.r.pick(['OK', 'OK', 'OK', 'ERRORE'])} ${c.r.pick(WORDS)}`);
      const k = c.r.int(3, 6);
      const n = lines.slice(-k).filter((l) => l.includes('ERRORE')).length;
      write(c, 'servizio.log', lines.join('\n') + '\n');
      return {
        title: 'Le ultime righe',
        prompt: `Quanti ERRORE ci sono nelle **ultime ${k} righe** di \`${c.dir}/servizio.log\`? Invia il numero con \`flag\`.`,
        hints: [`tail -n ${k} mostra le ultime ${k} righe.`, `tail -n ${k} ${c.dir}/servizio.log (e conta, oppure aggiungi | grep -c ERRORE)`],
        answer: [String(n)],
        solve: [`tail -n ${k} ${c.dir}/servizio.log`, `tail -n ${k} ${c.dir}/servizio.log | grep -c ERRORE`],
      };
    },
  },
  {
    id: 'wc-l',
    skill: 'wc',
    lv: 1,
    make: (c) => {
      const n = c.r.int(12, 60);
      write(c, 'utenti.txt', Array.from({ length: n }, (_, i) => `${c.r.pick(NAMES)}${i}`).join('\n') + '\n');
      return {
        title: 'Quante righe?',
        prompt: `\`${c.dir}/utenti.txt\` ha un utente per riga. Quanti utenti ci sono? Invia il numero con \`flag\`.`,
        hints: ['wc conta righe, parole e caratteri; -l solo le righe.', `wc -l ${c.dir}/utenti.txt`],
        answer: [String(n)],
        solve: [`wc -l ${c.dir}/utenti.txt`],
      };
    },
  },
  {
    id: 'wc-w',
    skill: 'wc',
    lv: 2,
    make: (c) => {
      const words = Array.from({ length: c.r.int(15, 40) }, () => c.r.pick(WORDS));
      const lines: string[] = [];
      for (let i = 0; i < words.length; i += c.r.int(3, 6)) lines.push(words.slice(i, i + 5).join(' '));
      const n = lines.join(' ').split(' ').filter(Boolean).length;
      write(c, 'messaggio.txt', lines.join('\n') + '\n');
      return {
        title: 'Quante parole?',
        prompt: `Quante **parole** contiene \`${c.dir}/messaggio.txt\`? Invia il numero con \`flag\`.`,
        hints: ['wc ha un\'opzione per le parole (word).', `wc -w ${c.dir}/messaggio.txt`],
        answer: [String(n)],
        solve: [`wc -w ${c.dir}/messaggio.txt`],
      };
    },
  },
  {
    id: 'ls-wc',
    skill: 'pipe',
    lv: 2,
    make: (c) => {
      const n = c.r.int(9, 25);
      for (let i = 0; i < n; i++) write(c, `cattura/img_${String(i).padStart(3, '0')}.jpg`, 'jpg\n');
      return {
        title: 'Conta senza contare',
        prompt: `Nella cartella \`${c.dir}/cattura\` ci sono tante immagini. Fai contare al terminale quante sono, collegando due comandi con una pipe. Invia il numero con \`flag\`.`,
        hints: ['ls elenca un file per riga; wc -l conta le righe. La pipe | passa l\'output del primo al secondo.', `ls ${c.dir}/cattura | wc -l`],
        answer: [String(n)],
        solve: [`ls ${c.dir}/cattura | wc -l`],
      };
    },
  },
  {
    id: 'grep-base',
    skill: 'grep',
    lv: 1,
    make: (c) => {
      const who = c.r.pick(NAMES);
      const ip = pubIp(c.r);
      const others = NAMES.filter((n) => n !== who);
      const lines = Array.from({ length: 25 }, () => `${c.r.pick(others)} ${pubIp(c.r)}`);
      lines.splice(c.r.int(0, lines.length), 0, `${who} ${ip}`);
      write(c, 'connessioni.txt', lines.join('\n') + '\n');
      return {
        title: 'Trova la riga',
        prompt: `In \`${c.dir}/connessioni.txt\` ogni riga è "utente IP". Da quale IP si è collegato **${who}**? Invia l'IP con \`flag\`.`,
        hints: ['grep mostra solo le righe che contengono un testo.', `grep ${who} ${c.dir}/connessioni.txt`],
        answer: [ip],
        solve: [`grep ${who} ${c.dir}/connessioni.txt`],
      };
    },
  },
  {
    id: 'grep-c',
    skill: 'grep',
    lv: 1,
    make: (c) => {
      const ip = pubIp(c.r);
      const n = c.r.int(5, 30);
      write(c, 'auth.log', authLog(c.r, { fails: n, ip, others: c.r.int(10, 30), user: 'root' }).join('\n') + '\n');
      const total = (content(c.sh, abs(c, 'auth.log')) ?? '').split('\n').filter((l) => l.includes('Failed password')).length;
      return {
        title: 'Quanti fallimenti?',
        prompt: `Quante righe di \`${c.dir}/auth.log\` contengono \`Failed password\`? Invia il numero con \`flag\`.`,
        hints: ['grep -c conta le righe trovate invece di mostrarle.', `grep -c "Failed password" ${c.dir}/auth.log`],
        answer: [String(total)],
        solve: [`grep -c "Failed password" ${c.dir}/auth.log`],
      };
    },
  },
  {
    id: 'grep-i',
    skill: 'grep',
    lv: 2,
    make: (c) => {
      const forms = ['errore', 'ERRORE', 'Errore'];
      const lines: string[] = [];
      let n = 0;
      for (let i = 0; i < c.r.int(15, 30); i++) {
        if (c.r.next() < 0.4) {
          lines.push(`${time(c.r.int(0, 86000))} ${c.r.pick(forms)} su ${c.r.pick(WORDS)}`);
          n++;
        } else lines.push(`${time(c.r.int(0, 86000))} ok ${c.r.pick(WORDS)}`);
      }
      write(c, 'app.log', lines.join('\n') + '\n');
      return {
        title: 'Maiuscole o minuscole',
        prompt: `In \`${c.dir}/app.log\` la parola "errore" è scritta in modi diversi (errore, ERRORE, Errore). Quante righe la contengono, **in qualsiasi forma**? Invia il numero con \`flag\`.`,
        hints: ['grep distingue maiuscole e minuscole, a meno di usare -i.', `grep -ic errore ${c.dir}/app.log`],
        answer: [String(n)],
        solve: [`grep -ic errore ${c.dir}/app.log`],
      };
    },
  },
  {
    id: 'grep-v',
    skill: 'grep',
    lv: 2,
    make: (c) => {
      const users = uniqName(c.r, c.r.int(6, 10), NAMES);
      const human = users.filter(() => c.r.next() < 0.5);
      if (!human.length) human.push(users[0]);
      const lines = users.map((u, i) => `${u}:x:${1000 + i}:${1000 + i}::/home/${u}:${human.includes(u) ? '/bin/bash' : '/usr/sbin/nologin'}`);
      write(c, 'passwd', lines.join('\n') + '\n');
      return {
        title: 'Tutto tranne...',
        prompt: `In \`${c.dir}/passwd\` alcuni account hanno la shell \`nologin\` (non possono entrare). Quanti account **non** hanno nologin? Invia il numero con \`flag\`.`,
        hints: ['grep -v inverte la ricerca: mostra le righe che NON contengono il testo.', `grep -vc nologin ${c.dir}/passwd`],
        answer: [String(human.length)],
        solve: [`grep -vc nologin ${c.dir}/passwd`],
      };
    },
  },
  {
    id: 'grep-n',
    skill: 'grep',
    lv: 2,
    make: (c) => {
      const lines = Array.from({ length: c.r.int(20, 40) }, () => `${c.r.pick(['allow', 'allow', 'allow', 'deny'])} ${c.r.int(1, 65000)}/tcp`);
      const at = c.r.int(5, lines.length);
      lines[at - 1] = 'allow 23/tcp';
      for (let i = 0; i < lines.length; i++) if (i !== at - 1 && lines[i] === 'allow 23/tcp') lines[i] = 'allow 24/tcp';
      write(c, 'regole.txt', lines.join('\n') + '\n');
      return {
        title: 'Dov\'è la regola?',
        prompt: `In \`${c.dir}/regole.txt\` c'è una regola che apre telnet: \`allow 23/tcp\`. A che **numero di riga**? Invia il numero con \`flag\`.`,
        hints: ['grep -n mostra il numero di riga davanti a ogni risultato.', `grep -n "allow 23/tcp" ${c.dir}/regole.txt`],
        answer: [String(at)],
        solve: [`grep -n "allow 23/tcp" ${c.dir}/regole.txt`],
      };
    },
  },
  {
    id: 'grep-r',
    skill: 'grep',
    lv: 3,
    make: (c) => {
      const dirs = uniqName(c.r, 3, ['web', 'db', 'mail', 'vpn', 'backup']);
      const files: string[] = [];
      for (const d of dirs) for (const f of uniqName(c.r, 2, FILES)) files.push(`${d}/${f}.cfg`);
      const hit = c.r.pick(files);
      for (const f of files) write(c, `conf/${f}`, f === hit ? `host=${c.r.pick(WORDS)}\npassword=${c.r.pick(WORDS)}${c.r.int(10, 99)}\n` : `host=${c.r.pick(WORDS)}\nporta=${c.r.int(1000, 9000)}\n`);
      return {
        title: 'La password dimenticata',
        prompt: `In uno dei file sotto \`${c.dir}/conf\` (ci sono sottocartelle) qualcuno ha lasciato una riga \`password=\`. In **quale file**? Invia il percorso (es. \`web/x.cfg\`) con \`flag\`.`,
        hints: ['grep -r cerca in tutti i file di una cartella e delle sottocartelle; -l mostra solo i nomi.', `grep -rl "password=" ${c.dir}/conf`],
        answer: pathAnswers(c, `conf/${hit}`).concat(hit),
        solve: [`grep -rl "password=" ${c.dir}/conf`],
      };
    },
  },
  {
    id: 'grep-wc',
    skill: 'pipe',
    lv: 3,
    make: (c) => {
      const ip = pubIp(c.r);
      write(c, 'auth.log', authLog(c.r, { fails: c.r.int(4, 20), ip, others: c.r.int(20, 40) }).join('\n') + '\n');
      const n = (content(c.sh, abs(c, 'auth.log')) ?? '').split('\n').filter((l) => l.includes('Failed password') && l.includes(ip)).length;
      return {
        title: 'Due filtri di fila',
        prompt: `Quanti tentativi **falliti** sono arrivati dall'IP \`${ip}\` in \`${c.dir}/auth.log\`? Servono due condizioni insieme: collega due grep con una pipe. Invia il numero con \`flag\`.`,
        hints: ['Il primo grep tiene le righe "Failed password", il secondo tra queste tiene quelle con l\'IP.', `grep "Failed password" ${c.dir}/auth.log | grep -c ${ip}`],
        answer: [String(n)],
        solve: [`grep "Failed password" ${c.dir}/auth.log | grep -c ${ip}`],
      };
    },
  },
  {
    id: 'find-name',
    skill: 'find',
    lv: 1,
    make: (c) => {
      const dirs = uniqName(c.r, 4);
      for (const d of dirs) for (const f of uniqName(c.r, 2, FILES)) write(c, `${d}/${f}.txt`, 'x\n');
      const where = `${c.r.pick(dirs)}/${c.r.pick(dirs)}`;
      write(c, `${where}/promemoria.txt`, 'trovato\n');
      return {
        title: 'Dov\'è finito?',
        prompt: `Da qualche parte sotto \`${c.dir}\` c'è il file \`promemoria.txt\`. Trova il suo percorso e invialo con \`flag\`.`,
        hints: ['find PERCORSO -name NOME cerca in tutte le sottocartelle.', `find ${c.dir} -name promemoria.txt`],
        answer: pathAnswers(c, `${where}/promemoria.txt`).filter((a) => a !== 'promemoria.txt'),
        solve: [`find ${c.dir} -name promemoria.txt`],
      };
    },
  },
  {
    id: 'find-jolly',
    skill: 'find',
    lv: 2,
    make: (c) => {
      const dirs = uniqName(c.r, 3);
      let n = 0;
      for (const d of dirs)
        for (let i = 0; i < c.r.int(2, 5); i++) {
          const e = c.r.pick(['conf', 'txt', 'conf', 'log']);
          if (e === 'conf') n++;
          write(c, `${d}/${c.r.pick(FILES)}_${i}.${e}`, 'x\n');
        }
      if (!n) {
        write(c, `${dirs[0]}/extra.conf`, 'x\n');
        n = 1;
      }
      return {
        title: 'Tutte le configurazioni',
        prompt: `Quanti file \`.conf\` ci sono sotto \`${c.dir}\`, sottocartelle comprese? Invia il numero con \`flag\`.`,
        hints: ['Con find il jolly va tra virgolette: -name "*.conf". Per contare, una pipe verso wc -l.', `find ${c.dir} -name "*.conf" | wc -l`],
        answer: [String(n)],
        solve: [`find ${c.dir} -name "*.conf" | wc -l`],
      };
    },
  },
  {
    id: 'find-type',
    skill: 'find',
    lv: 3,
    make: (c) => {
      const all = uniqName(c.r, c.r.int(4, 7));
      const empty = all.filter(() => c.r.next() < 0.5);
      if (!empty.length) empty.push(all[0]);
      for (const d of all) {
        if (empty.includes(d)) mkdir(c, `casi/${d}`);
        else write(c, `casi/${d}/nota.txt`, 'x\n');
      }
      return {
        title: 'Cartelle vuote',
        prompt: `Quante **cartelle vuote** ci sono dentro \`${c.dir}/casi\`? Invia il numero con \`flag\`.`,
        hints: ['find ha -type d (solo cartelle) e -empty (solo vuoti).', `find ${c.dir}/casi -type d -empty | wc -l`],
        answer: [String(empty.length)],
        solve: [`find ${c.dir}/casi -type d -empty | wc -l`],
      };
    },
  },
  {
    id: 'sort-alfa',
    skill: 'sort',
    lv: 1,
    make: (c) => {
      const names = uniqName(c.r, 8, NAMES);
      write(c, 'squadra.txt', names.join('\n') + '\n');
      return {
        title: 'In ordine alfabetico',
        prompt: `Metti in ordine alfabetico i nomi di \`${c.dir}/squadra.txt\`: chi viene **per primo**? Invia il nome con \`flag\`.`,
        hints: ['sort ordina le righe.', `sort ${c.dir}/squadra.txt`],
        answer: [[...names].sort()[0]],
        solve: [`sort ${c.dir}/squadra.txt`],
      };
    },
  },
  {
    id: 'sort-n',
    skill: 'sort',
    lv: 2,
    make: (c) => {
      const vals = Array.from({ length: 10 }, () => c.r.int(1, 999));
      const rows = vals.map((v, i) => `${v} ${NAMES[i]}`);
      write(c, 'tentativi.txt', rows.join('\n') + '\n');
      const max = Math.max(...vals);
      const who = rows.find((r) => r.startsWith(`${max} `))!.split(' ')[1];
      return {
        title: 'Il numero più alto',
        prompt: `Ogni riga di \`${c.dir}/tentativi.txt\` è "numero nome". Chi ha il numero **più alto**? Attento: in ordine alfabetico "9" viene dopo "100". Invia il nome con \`flag\`.`,
        hints: ['sort -n ordina come numeri; -r inverte (dal più grande).', `sort -rn ${c.dir}/tentativi.txt | head -n 1`],
        answer: [who],
        solve: [`sort -rn ${c.dir}/tentativi.txt | head -n 1`],
      };
    },
  },
  {
    id: 'uniq-c',
    skill: 'uniq',
    lv: 3,
    make: (c) => {
      const ips = Array.from({ length: 5 }, () => pubIp(c.r));
      const counts = c.r.shuffle([c.r.int(15, 25), ...Array.from({ length: 4 }, () => c.r.int(1, 12))]);
      const lines = c.r.shuffle(ips.flatMap((ip, i) => Array(counts[i]).fill(ip)));
      write(c, 'ip.txt', lines.join('\n') + '\n');
      const top = ips[counts.indexOf(Math.max(...counts))];
      return {
        title: 'Il più insistente',
        prompt: `\`${c.dir}/ip.txt\` contiene un IP per ogni tentativo bloccato. Quale IP compare **più volte**? Invia l'IP con \`flag\`.`,
        hints: ['uniq -c conta le righe uguali, ma solo se sono vicine: prima ordina. Poi ordina i conteggi.', `sort ${c.dir}/ip.txt | uniq -c | sort -rn | head -n 1`],
        answer: [top],
        solve: [`sort ${c.dir}/ip.txt | uniq -c | sort -rn | head -n 1`],
      };
    },
  },
  {
    id: 'cut-campo',
    skill: 'cut',
    lv: 2,
    make: (c) => {
      const users = uniqName(c.r, 8, NAMES);
      const id = c.r.int(0, users.length - 1);
      const roles = users.map(() => c.r.pick(['analista', 'admin', 'stagista', 'tecnico']));
      write(c, 'staff.csv', ['id,nome,ruolo', ...users.map((u, i) => `${100 + i},${u},${roles[i]}`)].join('\n') + '\n');
      return {
        title: 'Una colonna sola',
        prompt: `\`${c.dir}/staff.csv\` ha le colonne id,nome,ruolo separate da virgole. Mostra **solo la colonna dei nomi** e invia con \`flag\` il nome della persona con id ${100 + id}.`,
        hints: ['cut -d, -f2 tiene solo il secondo campo, usando la virgola come separatore.', `cut -d, -f2 ${c.dir}/staff.csv (oppure grep ${100 + id} ${c.dir}/staff.csv | cut -d, -f2)`],
        answer: [users[id]],
        solve: [`grep ${100 + id} ${c.dir}/staff.csv | cut -d, -f2`],
      };
    },
  },
  {
    id: 'cut-distinti',
    skill: 'cut',
    lv: 3,
    make: (c) => {
      const pool = uniqName(c.r, c.r.int(3, 6), ['analista', 'admin', 'stagista', 'tecnico', 'manager', 'auditor']);
      const users = uniqName(c.r, 12, NAMES);
      const roles = users.map((_, i) => pool[i % pool.length]);
      write(c, 'staff.csv', c.r.shuffle(users.map((u, i) => `${u},${roles[i]}`)).join('\n') + '\n');
      return {
        title: 'Quanti ruoli diversi?',
        prompt: `In \`${c.dir}/staff.csv\` (nome,ruolo) quanti **ruoli diversi** ci sono? Invia il numero con \`flag\`.`,
        hints: ['Prendi la seconda colonna, ordina, togli i doppioni, conta.', `cut -d, -f2 ${c.dir}/staff.csv | sort | uniq | wc -l`],
        answer: [String(pool.length)],
        solve: [`cut -d, -f2 ${c.dir}/staff.csv | sort | uniq | wc -l`],
      };
    },
  },
  {
    id: 'awk-colonna',
    skill: 'awk',
    lv: 2,
    make: (c) => {
      const rows = Array.from({ length: 8 }, () => `${time(c.r.int(0, 86000))} ${pubIp(c.r)} ${c.r.pick(['GET', 'POST'])} /${c.r.pick(WORDS)}`);
      const k = c.r.int(1, rows.length);
      write(c, 'accessi.log', rows.join('\n') + '\n');
      return {
        title: 'La seconda colonna',
        prompt: `In \`${c.dir}/accessi.log\` le colonne sono separate da spazi: ora, IP, metodo, pagina. Mostra **solo gli IP** con awk e invia con \`flag\` quello della riga ${k}.`,
        hints: ['awk \'{print $2}\' stampa il secondo campo di ogni riga.', `awk '{print $2}' ${c.dir}/accessi.log`],
        answer: [rows[k - 1].split(' ')[1]],
        solve: [`awk '{print $2}' ${c.dir}/accessi.log`],
      };
    },
  },
  {
    id: 'awk-somma',
    skill: 'awk',
    lv: 3,
    make: (c) => {
      const rows = Array.from({ length: c.r.int(5, 9) }, () => [c.r.pick(NAMES), c.r.int(1, 500)] as const);
      write(c, 'traffico.txt', rows.map(([n, v]) => `${n} ${v}`).join('\n') + '\n');
      const sum = rows.reduce((s, [, v]) => s + v, 0);
      return {
        title: 'Somma una colonna',
        prompt: `\`${c.dir}/traffico.txt\` ha "utente megabyte" su ogni riga. Quanti megabyte in **totale**? Fai la somma con awk e invia il numero con \`flag\`.`,
        hints: ['awk può tenere una variabile: la somma si aggiorna a ogni riga e si stampa alla fine (END).', `awk '{s+=$2} END {print s}' ${c.dir}/traffico.txt`],
        answer: [String(sum)],
        solve: [`awk '{s+=$2} END {print s}' ${c.dir}/traffico.txt`],
      };
    },
  },
  {
    id: 'sed-sostituisci',
    skill: 'sed',
    lv: 2,
    make: (c) => {
      const old = c.r.pick(['10.0.0.5', '10.0.0.7', '10.0.0.9']);
      const nu = `10.0.1.${c.r.int(10, 99)}`;
      const lines = [`server=${old}`, `backup=${old}`, `porta=${c.r.int(1000, 9000)}`];
      write(c, 'app.conf', lines.join('\n') + '\n');
      return {
        title: 'Cambia l\'indirizzo',
        prompt: `Il server ha cambiato indirizzo: da \`${old}\` a \`${nu}\`. Crea \`${c.dir}/app.nuova.conf\` uguale a \`${c.dir}/app.conf\` ma con **tutti** i \`${old}\` sostituiti.`,
        hints: ['sed "s/VECCHIO/NUOVO/g" sostituisce in ogni riga (g = tutte le volte). Manda l\'output nel file nuovo con >.', `sed "s/${old}/${nu}/g" ${c.dir}/app.conf > ${c.dir}/app.nuova.conf`],
        state: (sh) => {
          const t = content(sh, abs(c, 'app.nuova.conf')) ?? '';
          return t.includes(`server=${nu}`) && t.includes(`backup=${nu}`) && !t.includes(old);
        },
        solve: [`sed "s/${old}/${nu}/g" ${c.dir}/app.conf > ${c.dir}/app.nuova.conf`],
      };
    },
  },
  {
    id: 'tr-maiuscole',
    skill: 'tr',
    lv: 1,
    make: (c) => {
      const w = `${c.r.pick(WORDS)}${c.r.int(10, 99)}`;
      return {
        title: 'Tutto maiuscolo',
        prompt: `Trasforma la parola \`${w}\` in maiuscolo con tr (con echo e una pipe) e invia il risultato con \`flag\`.`,
        hints: ['tr a-z A-Z sostituisce ogni minuscola con la maiuscola; tr legge da una pipe.', `echo ${w} | tr a-z A-Z`],
        answer: [w.toUpperCase()],
        solve: [`echo ${w} | tr a-z A-Z`],
      };
    },
  },
  {
    id: 'diff-cambio',
    skill: 'diff',
    lv: 2,
    make: (c) => {
      const lines = Array.from({ length: 10 }, () => `${c.r.pick(['allow', 'deny'])} ${c.r.int(1, 9000)}/tcp`);
      const k = c.r.int(0, lines.length - 1);
      const changed = [...lines];
      const added = `allow ${c.r.int(9001, 9999)}/tcp`;
      changed[k] = added;
      write(c, 'ieri.rules', lines.join('\n') + '\n');
      write(c, 'oggi.rules', changed.join('\n') + '\n');
      return {
        title: 'Cosa è cambiato?',
        prompt: `Tra \`${c.dir}/ieri.rules\` e \`${c.dir}/oggi.rules\` è cambiata una regola. Qual è la regola **nuova**, quella di oggi? Invia la riga con \`flag\`.`,
        hints: ['diff confronta due file: < sono le righe del primo, > quelle del secondo.', `diff ${c.dir}/ieri.rules ${c.dir}/oggi.rules`],
        answer: [added],
        solve: [`diff ${c.dir}/ieri.rules ${c.dir}/oggi.rules`],
      };
    },
  },
];

// ---------------------------------------------------------------- impronte e codifiche

const CRYPTO: PalEx[] = [
  {
    id: 'base64-d',
    skill: 'base64',
    lv: 1,
    make: (c) => {
      const plain = `${c.r.pick(WORDS)}-${c.r.int(1000, 9999)}`;
      const enc = base64Encode(plain);
      return {
        title: 'Decodifica',
        prompt: `In un log hai trovato la stringa \`${enc}\`. È Base64: decodificala e invia il testo con \`flag\`.`,
        hints: ['base64 -d decodifica; il testo arriva con echo e una pipe.', `echo ${enc} | base64 -d`],
        answer: [plain],
        solve: [`echo ${enc} | base64 -d`],
      };
    },
  },
  {
    id: 'sha256-quale',
    skill: 'sha256sum',
    lv: 2,
    make: (c) => {
      const names = uniqName(c.r, 4, FILES).map((f) => `${f}.bin`);
      const bodies = names.map((f) => `${f} ${c.r.hex(16)}\n`);
      names.forEach((f, i) => write(c, `file/${f}`, bodies[i]));
      const ti = c.r.int(0, names.length - 1);
      const target = names[ti];
      const h = sha256(bodies[ti]);
      return {
        title: 'Quale file è questo?',
        prompt: `Ti hanno passato l'impronta SHA-256 di un file sospetto: \`${h.slice(0, 16)}…\` (iniziano così). Quale dei file in \`${c.dir}/file\` è? Invia il nome con \`flag\`.`,
        hints: ['sha256sum calcola l\'impronta; accetta più file insieme, anche con un jolly.', `sha256sum ${c.dir}/file/*`],
        answer: [target],
        solve: [`sha256sum ${c.dir}/file/*`],
      };
    },
  },
];

export const PALESTRA: PalEx[] = [...NAV, ...FILEOPS, ...TEXT, ...CRYPTO];

/** Comandi con almeno un esercizio, in ordine di corso. */
export const PALESTRA_SKILLS: string[] = [...new Set(PALESTRA.map((e) => e.skill))];

export function exercisesFor(skill: string): PalEx[] {
  return PALESTRA.filter((e) => e.skill === skill).sort((a, b) => a.lv - b.lv);
}

/**
 * Una serie di esercizi. Con una competenza: dal livello 1 al 3 (5 esercizi).
 * Senza: allenamento misto sulle competenze indicate, prima le più deboli.
 */
export function generatePalestra(sh: Shell, opts: { skill?: string; pool?: { skill: string; weight: number }[]; count?: number; seed: number }): Drill[] {
  const r = makeRng(opts.seed);
  let chosen: PalEx[] = [];
  if (opts.skill) {
    const ex = exercisesFor(opts.skill);
    if (!ex.length) return [];
    const count = opts.count ?? 5;
    // sale di livello: prima i livelli bassi, poi quelli alti
    const byLv = [1, 2, 3].map((lv) => ex.filter((e) => e.lv === lv)).filter((l) => l.length);
    for (let i = 0; i < count; i++) chosen.push(r.pick(byLv[Math.min(byLv.length - 1, Math.floor((i * byLv.length) / count))]));
  } else {
    const pool = (opts.pool ?? []).filter((p) => exercisesFor(p.skill).length);
    if (!pool.length) return [];
    const count = opts.count ?? 6;
    const total = pool.reduce((s, p) => s + p.weight, 0);
    let last = '';
    for (let i = 0; i < count; i++) {
      let pick = pool[0];
      for (let tries = 0; tries < 5; tries++) {
        let x = r.next() * total;
        pick = pool.find((p) => (x -= p.weight) < 0) ?? pool[pool.length - 1];
        if (pick.skill !== last || pool.length === 1) break;
      }
      last = pick.skill;
      chosen.push(r.pick(exercisesFor(pick.skill)));
    }
  }
  chosen = chosen.slice(0, 12);
  return chosen.map((e, i) => {
    const ctx: Ctx = { sh, r, lv: e.lv, dir: `pal/${i + 1}-${e.id}` };
    return { chapter: 'pal', gid: `pal:${e.id}`, skill: e.skill, lv: e.lv, ...e.make(ctx) };
  });
}
