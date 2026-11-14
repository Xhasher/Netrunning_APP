// Il coach: rilegge i comandi scritti durante una missione e il modo in cui ti sei mosso
// nel filesystem, e propone consigli concreti per lavorare meglio, più in fretta e con
// più sicurezza. Ogni consiglio mostra, quando può, la TUA riga e una versione migliore.

import '../engine/manual';
import { ALIASES, MANPAGES } from '../engine/manpages';

/** Una riga del diario di missione. */
export interface LogEntry {
  /** riga scritta (vuota per le voci speciali) */
  l: string;
  /** cartella in cui ti trovavi */
  d: string;
  /** primo messaggio di errore, se c'è stato */
  e?: string;
  /** righe di output */
  o?: number;
  /** passo della missione */
  s: number;
  /** 'p' = ha completato l'obiettivo, 'w' = risposta sbagliata, 'h' = suggerimento chiesto, 'x' = scansione fuori perimetro */
  k?: 'p' | 'w' | 'h' | 'x';
}

export interface Tip {
  id: string;
  /** importanza: più alto = mostrato prima */
  weight: number;
  title: string;
  /** spiegazione (mini-markdown in linea) */
  text: string;
  /** la tua riga e la versione consigliata */
  yours?: string;
  better?: string;
  /** quante volte è successo */
  count: number;
}

export interface Strength {
  id: string;
  text: string;
}

export interface Stats {
  commands: number;
  errors: number;
  hints: number;
  wrong: number;
  objectives: number;
  /** comandi più usati, con il numero di volte */
  top: [string, number][];
  /** cartelle diverse visitate */
  dirs: number;
}

export interface Analysis {
  stats: Stats;
  tips: Tip[];
  strengths: Strength[];
}

// ---------------------------------------------------------------- utilità

const known = () => Object.keys(MANPAGES).filter((k) => !MANPAGES[k].game || ['flag', 'hint'].includes(k));

/** Distanza di modifica tra due parole (quanti tasti sbagliati). */
export function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
    }
  return dp[a.length][b.length];
}

/** Il comando che probabilmente volevi scrivere. */
export function closest(word: string): string | null {
  const w = word.toLowerCase();
  if (MANPAGES[w] || ALIASES[w]) return ALIASES[w] ?? w;
  let best: string | null = null;
  let bd = 3;
  for (const k of known()) {
    const d = distance(w, k);
    if (d < bd && d <= Math.max(1, Math.floor(k.length / 3))) {
      bd = d;
      best = k;
    }
  }
  return best;
}

const first = (line: string) => line.trim().split(/\s+/)[0] ?? '';
const segments = (line: string) => line.split('|').map((x) => x.trim());
const cmdOf = (seg: string) => {
  const w = seg.split(/\s+/);
  return w[0] === 'sudo' ? w[1] ?? '' : w[0];
};

/** Riscritture automatiche di catene inutilmente lunghe. */
export function improve(line: string): { better: string; why: string; id: string } | null {
  const seg = segments(line);
  if (seg.length >= 2) {
    // cat FILE | grep ... → grep ... FILE
    const cat = seg[0].match(/^cat\s+(\S+)$/);
    if (cat && /^grep\s/.test(seg[1])) {
      const rest = [`${seg[1]} ${cat[1]}`, ...seg.slice(2)].join(' | ');
      return { id: 'useless-cat', better: improve(rest)?.better ?? rest, why: '`grep` sa leggere il file da solo: il `cat` davanti è un passaggio in più.' };
    }
    if (cat && /^(head|tail|wc|sort|uniq|cut|awk|sed)\b/.test(seg[1])) {
      const rest = [`${seg[1]} ${cat[1]}`, ...seg.slice(2)].join(' | ');
      return { id: 'useless-cat', better: rest, why: `\`${cmdOf(seg[1])}\` accetta il nome del file: non serve passarlo con \`cat\`.` };
    }
    // grep ... | wc -l → grep -c ...
    for (let i = 0; i < seg.length - 1; i++)
      if (/^grep\s/.test(seg[i]) && /^wc\s+-l$/.test(seg[i + 1]) && !/\s-[a-zA-Z]*[clo]/.test(seg[i]) && i === seg.length - 2) {
        const g = seg[i].replace(/^grep\s+/, 'grep -c ');
        return { id: 'grep-c', better: [...seg.slice(0, i), g].join(' | '), why: '`grep -c` conta le righe trovate da solo, senza bisogno di `wc -l`.' };
      }
    // sort | uniq → sort -u
    for (let i = 0; i < seg.length - 1; i++)
      if (/^sort(\s|$)/.test(seg[i]) && /^uniq$/.test(seg[i + 1])) {
        const s = seg[i] === 'sort' ? 'sort -u' : seg[i].replace(/^sort\s+/, 'sort -u ');
        return { id: 'sort-u', better: [...seg.slice(0, i), s, ...seg.slice(i + 2)].join(' | '), why: '`sort -u` ordina ed elimina i doppioni in un solo passaggio.' };
      }
    // grep A | grep -v B va bene; grep X | head -n 1 → grep -m 1
    for (let i = 0; i < seg.length - 1; i++)
      if (/^grep\s/.test(seg[i]) && /^head\s+(-n\s*1|-1)$/.test(seg[i + 1]) && i === seg.length - 2)
        return { id: 'grep-m', better: [...seg.slice(0, i), seg[i].replace(/^grep\s+/, 'grep -m 1 ')].join(' | '), why: '`grep -m 1` si ferma al primo risultato: su un log enorme è molto più veloce.' };
  }
  return null;
}

function add(map: Map<string, Tip>, t: Omit<Tip, 'count'>): void {
  const cur = map.get(t.id);
  if (cur) {
    cur.count++;
    return;
  }
  map.set(t.id, { ...t, count: 1 });
}

// ---------------------------------------------------------------- analisi

/**
 * Analizza il diario di una o più missioni.
 * @param objectives quanti obiettivi pratici c'erano (serve per misurare l'efficienza)
 */
export function analyze(log: readonly LogEntry[], objectives: number, perObjective = 5): Analysis {
  const tips = new Map<string, Tip>();
  const strengths: Strength[] = [];
  const cmds = log.filter((e) => e.l);
  const freq = new Map<string, number>();
  const dirs = new Set<string>();
  let errors = 0;
  let notFound = 0;
  let noFile = 0;
  let denied = 0;
  let repeatedErr = 0;
  const typos: { line: string; typed: string; want: string }[] = [];

  cmds.forEach((e, i) => {
    dirs.add(e.d);
    if (!/command not found/.test(e.e ?? ''))
      for (const seg of segments(e.l)) {
      const c = cmdOf(seg);
      if (c) freq.set(c, (freq.get(c) ?? 0) + 1);
    }
    if (!e.e) return;
    if (e.k === 'p') return; // l'errore era proprio l'obiettivo (es. provare un comando sbagliato apposta)
    errors++;
    const prev = cmds[i - 1];
    if (prev && prev.l === e.l && prev.e) repeatedErr++;
    if (/command not found/.test(e.e)) {
      notFound++;
      const typed = first(e.l);
      const want = closest(typed);
      if (want && want !== typed) typos.push({ line: e.l, typed, want });
    } else if (/No such file or directory/.test(e.e)) noFile++;
    else if (/Permission denied/.test(e.e)) denied++;
  });

  if (typos.length) {
    const pairs = [...new Map(typos.map((t) => [t.typed, t])).values()];
    const caseOnly = pairs.some((t) => t.typed.toLowerCase() === t.want);
    add(tips, {
      id: 'typo',
      weight: 6,
      title: pairs.length > 1 ? 'Errori di battitura nei nomi dei comandi' : 'Errore di battitura nel nome del comando',
      text: `${pairs.map((t) => `\`${t.typed}\` invece di \`${t.want}\``).join(', ')}. ${caseOnly ? 'Ricorda che Linux distingue maiuscole e minuscole. ' : ''}La shell non indovina: scrivi le prime lettere e premi **TAB**, completa lei il nome giusto e gli errori di battitura spariscono.`,
      yours: pairs[0].line,
      better: pairs[0].line.replace(pairs[0].typed, pairs[0].want),
    });
    tips.get('typo')!.count = typos.length;
  }
  if (noFile >= 2)
    add(tips, {
      id: 'nofile',
      weight: 7,
      title: 'Percorsi sbagliati',
      text: `${noFile} volte la shell ha risposto "No such file or directory". Tre abitudini che lo evitano: guarda dove sei con \`pwd\` e cosa c'è con \`ls\`; scrivi l'inizio del nome e premi **TAB** (se non completa, il file non è lì); ricorda che un percorso senza \`/\` iniziale parte dalla cartella in cui ti trovi.`,
    });
  if (notFound >= 3 && !typos.length)
    add(tips, { id: 'notfound', weight: 5, title: 'Comandi inesistenti', text: `${notFound} comandi non sono stati riconosciuti. Se non ricordi un nome, \`help\` li elenca tutti e il Manuale (📖) li spiega per argomento.` });
  if (denied >= 2)
    add(tips, {
      id: 'denied',
      weight: 5,
      title: 'Permessi negati',
      text: `${denied} volte hai ricevuto "Permission denied". Non è un muro da sfondare a tentativi: leggi il perché con \`ls -l\` (chi è il proprietario, quali permessi ha) e, se il compito lo prevede, controlla cosa ti è concesso con \`sudo -l\`.`,
    });
  if (repeatedErr >= 1)
    add(tips, {
      id: 'reread',
      weight: 8,
      title: 'Leggi l\'errore prima di riprovare',
      text: `Per ${repeatedErr === 1 ? 'una volta' : `${repeatedErr} volte`} hai rilanciato identico un comando appena fallito. Il messaggio di errore dice quasi sempre cosa non va: nome sbagliato, file inesistente, permesso mancante. Leggerlo con calma è metà del mestiere.`,
    });

  // riscritture di catene
  for (const e of cmds) {
    if (e.e) continue;
    const imp = improve(e.l);
    if (imp) add(tips, { id: imp.id, weight: 4, title: 'Si può scrivere più corto', text: imp.why, yours: e.l, better: imp.better });
  }

  // file enormi letti tutti con cat
  const bigCat = cmds.find((e) => /^cat\s+\S+$/.test(e.l) && (e.o ?? 0) > 60);
  if (bigCat)
    add(tips, {
      id: 'bigcat',
      weight: 5,
      title: 'Non leggere tutto un file enorme',
      text: `\`${bigCat.l}\` ha stampato ${bigCat.o} righe. Sui log veri sono milioni: prima misuralo con \`wc -l\`, poi guarda l'inizio con \`head\`, la fine con \`tail\`, o cerca solo ciò che ti serve con \`grep\`.`,
      yours: bigCat.l,
      better: `grep "PAROLA" ${bigCat.l.split(/\s+/)[1]}`,
    });

  // spostamenti: cd uno alla volta, entrare per leggere un solo file, tornare a casa a fatica
  let chain = 0;
  let chainStart = -1;
  let maxChain: string[] = [];
  let enterReadLeave = 0;
  let longHome = 0;
  cmds.forEach((e, i) => {
    const isCd = /^cd\s+[^/~.\s-][^\s]*$/.test(e.l) && !e.e && !e.l.includes('/');
    if (isCd) {
      if (chain === 0) chainStart = i;
      chain++;
      if (chain >= 3) maxChain = cmds.slice(chainStart, i + 1).map((x) => x.l.slice(3));
    } else chain = 0;
    const a = cmds[i - 2];
    if (a && /^cd\s+\S+$/.test(a.l) && !a.e && !/^cd\s+\.\./.test(a.l) && /^(cat|head|tail|less|ls|wc)\b/.test(cmds[i - 1].l) && /^cd(\s+\.\.|\s*$|\s+-$|\s+~$)/.test(e.l)) enterReadLeave++;
    if (/^cd\s+(\.\.\/){2,}/.test(e.l) || /^cd\s+\.\.\/\.\.$/.test(e.l)) longHome++;
  });
  if (maxChain.length >= 3)
    add(tips, {
      id: 'cd-chain',
      weight: 4,
      title: 'Un percorso intero in un solo cd',
      text: `Sei sceso una cartella alla volta. \`cd\` accetta un percorso completo: si arriva in un colpo solo, e con **TAB** completi ogni pezzo.`,
      yours: maxChain.map((d) => `cd ${d}`).join(' ; '),
      better: `cd ${maxChain.join('/')}`,
    });
  if (enterReadLeave >= 2)
    add(tips, {
      id: 'enter-read-leave',
      weight: 5,
      title: 'Non serve entrare per leggere',
      text: `${enterReadLeave} volte sei entrato in una cartella, hai letto un file e sei uscito. I comandi accettano il percorso: \`cat cartella/file\` fa lo stesso lavoro senza muoverti, e resti dove eri.`,
    });
  if (longHome >= 1)
    add(tips, { id: 'cd-home', weight: 3, title: 'Tornare a casa', text: 'Invece di risalire con `cd ../..` basta `cd` da solo (ti porta nella home). E `cd -` ti riporta nella cartella in cui eri un attimo prima.' });

  // ls continui per orientarsi
  const lsCount = freq.get('ls') ?? 0;
  if (lsCount >= 8 && lsCount / Math.max(1, cmds.length) > 0.35)
    add(tips, {
      id: 'ls-heavy',
      weight: 3,
      title: 'Orientarsi con meno passi',
      text: `Quasi un comando su due è stato un \`ls\`. Puoi guardare dentro una cartella senza entrarci (\`ls cartella\`), vedere tutto l'albero in una volta (\`ls -R\` o \`tree\`) o cercare direttamente un nome con \`find . -name "nome"\`.`,
    });

  // stesso comando lungo riscritto più volte
  const rewritten = new Map<string, number>();
  for (const e of cmds) if (e.l.length >= 18 && !e.e) rewritten.set(e.l, (rewritten.get(e.l) ?? 0) + 1);
  const again = [...rewritten].find(([, n]) => n >= 3);
  if (again && !(freq.get('history') || cmds.some((e) => e.l.includes('!!'))))
    add(tips, {
      id: 'history',
      weight: 3,
      title: 'Non riscrivere: richiama',
      text: `Hai scritto ${again[1]} volte la stessa riga lunga. La freccia **↑** richiama i comandi precedenti, \`!!\` ripete l'ultimo, \`history\` li elenca tutti. Per una riga che usi spesso, crea un \`alias\`.`,
      yours: again[0],
    });

  // sicurezza
  const rmr = cmds.find((e) => /^(sudo\s+)?rm\s+(-\w*r\w*|-\w*f\w*)\s/.test(e.l));
  if (rmr) {
    const i = cmds.indexOf(rmr);
    const looked = cmds.slice(Math.max(0, i - 3), i).some((x) => /^(ls|tree|find)\b/.test(x.l));
    if (!looked)
      add(tips, {
        id: 'rm-safe',
        weight: 6,
        title: 'Guarda prima di cancellare',
        text: '`rm -r` non chiede conferma e non c\'è un cestino. Prima di lanciarlo, guarda cosa stai per cancellare con `ls` (o `ls -R`), oppure usa `rm -ri` che chiede conferma file per file.',
        yours: rmr.l,
      });
  }
  const c777 = cmds.find((e) => /chmod\s+(-R\s+)?(777|666|o\+w|a\+w)\b/.test(e.l));
  if (c777)
    add(tips, {
      id: 'chmod777',
      weight: 7,
      title: 'Permessi troppo larghi',
      text: '`777` dà a chiunque sul sistema il diritto di modificare (e per gli script, di eseguire) il file. Il principio è il **minimo privilegio**: di solito bastano `600` per i file privati, `644` per quelli da leggere, `700` o `755` per gli script.',
      yours: c777.l,
    });
  const needlessSudo = cmds.filter((e) => /^sudo\s+(ls|cat|cd|grep|head|tail|wc|echo|pwd|whoami)\b/.test(e.l) && !e.e);
  if (needlessSudo.length >= 2)
    add(tips, {
      id: 'sudo',
      weight: 4,
      title: 'sudo solo quando serve',
      text: 'Hai usato `sudo` per comandi che funzionano anche senza. Lavorare da amministratore "per sicurezza" è un\'abitudine pericolosa: un errore di battitura fatto da root può distruggere il sistema. Prima prova senza; se serve, il sistema te lo dirà.',
      yours: needlessSudo[0].l,
    });
  const outScope = log.filter((e) => e.k === 'x').length;
  if (outScope)
    add(tips, {
      id: 'scope',
      weight: 10,
      title: 'Fuori dal perimetro',
      text: `Hai lanciato ${outScope === 1 ? 'una scansione' : `${outScope} scansioni`} verso un indirizzo non autorizzato. Nel mondo reale è il singolo errore che può costarti il lavoro e una denuncia: prima di ogni scansione si controlla il contratto.`,
    });

  // metodo
  const hints = log.filter((e) => e.k === 'h').length;
  const wrong = log.filter((e) => e.k === 'w').length;
  if (hints >= 3)
    add(tips, {
      id: 'hints',
      weight: 4,
      title: 'Prima il Manuale, poi il suggerimento',
      text: `Hai chiesto ${hints} suggerimenti. Non è un male, ma prova prima a cercare da solo: \`man comando\` o il 📖 Manuale. Sul lavoro nessuno ti dà la soluzione: saper cercare è la competenza più importante di tutte.`,
    });
  if (wrong >= 2)
    add(tips, {
      id: 'wrong',
      weight: 5,
      title: 'Verifica prima di rispondere',
      text: `${wrong} risposte sbagliate. Prima di inviare una risposta (\`flag\`) o una segnalazione (\`report\`), rileggi la domanda e ricontrolla il dato nell'output (o rifai il comando in un altro modo per conferma). In un report vero una conclusione sbagliata fa più danni di una lenta.`,
    });
  const work = cmds.filter((e) => !['flag', 'hint', 'clear', 'help'].includes(first(e.l)));
  if (objectives >= 3 && work.length > objectives * perObjective)
    add(tips, {
      id: 'efficiency',
      weight: 2,
      title: 'Meno tentativi, più ragionamento',
      text: `Hai usato in media ${Math.round(work.length / objectives)} comandi per obiettivo. Prima di scrivere, chiediti: "quale informazione mi serve, e quale comando me la dà?". Un'idea chiara vale dieci tentativi.`,
    });

  // punti di forza: solo se gli obiettivi sono stati davvero raggiunti
  const passed = log.filter((e) => e.k === 'p').length;
  const achieved = passed >= Math.ceil(objectives * 0.75);
  if (achieved && cmds.length >= 4 && errors === 0) strengths.push({ id: 'clean', text: 'Nessun errore: hai scritto ogni comando correttamente al primo colpo.' });
  else if (cmds.length >= 8 && errors / cmds.length < 0.1) strengths.push({ id: 'precise', text: 'Pochissimi errori: scrivi con precisione.' });
  if (achieved && objectives >= 2 && hints === 0) strengths.push({ id: 'nohint', text: 'Nessun suggerimento chiesto: hai trovato la strada da solo.' });
  if ((freq.get('man') ?? 0) > 0) strengths.push({ id: 'man', text: 'Hai consultato `man`: è esattamente ciò che fa un professionista quando ha un dubbio.' });
  if (cmds.some((e) => /\|/.test(e.l) && !e.e && !improve(e.l))) strengths.push({ id: 'pipe', text: 'Hai collegato i comandi con le pipe in modo pulito.' });
  if (cmds.some((e) => /^ls\s+-\w*a/.test(e.l))) strengths.push({ id: 'hidden', text: 'Hai guardato anche i file nascosti con `ls -a`: un analista non si fida delle cartelle "vuote".' });
  if (cmds.some((e) => /(^|\s)(grep -c|grep -[a-z]*c|sort -u|cd -|!!)(\s|$)/.test(e.l))) strengths.push({ id: 'shortcut', text: 'Hai usato le scorciatoie giuste (`grep -c`, `sort -u`, `!!`, `cd -`...).' });
  if (achieved && work.length && objectives && work.length <= objectives * Math.max(2, perObjective - 3) && objectives >= 2) strengths.push({ id: 'fast', text: 'Sei andato dritto all\'obiettivo, con pochissimi comandi in più del necessario.' });

  const top = [...freq].filter(([c]) => !['flag', 'hint', 'clear'].includes(c)).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return {
    stats: { commands: cmds.length, errors, hints, wrong, objectives, top, dirs: dirs.size },
    tips: [...tips.values()].sort((a, b) => b.weight * Math.min(b.count, 3) - a.weight * Math.min(a.count, 3)),
    strengths,
  };
}
