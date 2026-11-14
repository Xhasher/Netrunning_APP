import { describe, expect, it } from 'vitest';
import { analyze, closest, improve, type LogEntry } from '../src/game/coach';

const H = '/home/edge';
const L = (l: string, extra: Partial<LogEntry> = {}): LogEntry => ({ l, d: H, s: 1, ...extra });
const ids = (log: LogEntry[], n = 3) => analyze(log, n).tips.map((t) => t.id);

describe('coach', () => {
  it('riconosce il comando che volevi scrivere', () => {
    expect(closest('sl')).toBe('ls');
    expect(closest('grpe')).toBe('grep');
    expect(closest('Whoami')).toBe('whoami');
    expect(closest('zzzzzz')).toBeNull();
  });

  it('riscrive le catene inutilmente lunghe', () => {
    expect(improve('cat caso/auth.log | grep Failed')?.better).toBe('grep Failed caso/auth.log');
    expect(improve('cat caso/auth.log | grep Failed | wc -l')?.better).toBe('grep -c Failed caso/auth.log');
    expect(improve('grep -i x f | wc -l')?.better).toBe('grep -c -i x f');
    expect(improve('cut -d " " -f 1 f | sort | uniq')?.better).toBe('cut -d " " -f 1 f | sort -u');
    expect(improve('grep -c x f')).toBeNull();
    expect(improve('sort | uniq -c')).toBeNull();
  });

  it('segnala errori di battitura con la versione corretta', () => {
    const a = analyze([L('sl -la', { e: 'bash: sl: command not found' }), L('ls -la')], 1);
    const t = a.tips.find((x) => x.id === 'typo')!;
    expect(t.better).toBe('ls -la');
  });

  it('non considera errore un comando sbagliato richiesto dall\'esercizio', () => {
    const a = analyze([L('Whoami', { e: 'bash: Whoami: command not found', k: 'p' })], 1);
    expect(a.tips).toEqual([]);
    expect(a.stats.errors).toBe(0);
  });

  it('nota gli spostamenti inutili', () => {
    const log = [L('cd contratti'), L('cd rook'), L('cd archivio'), L('cat x'), L('cd'), L('cd missioni'), L('cat a'), L('cd ..'), L('cd rete'), L('ls'), L('cd ..')];
    const t = ids(log);
    expect(t).toContain('cd-chain');
    expect(t).toContain('enter-read-leave');
    expect(analyze(log, 3).tips.find((x) => x.id === 'cd-chain')!.better).toBe('cd contratti/rook/archivio');
  });

  it('richiami di sicurezza: rm -r alla cieca, chmod 777, fuori perimetro', () => {
    const t = ids([L('rm -rf vecchi'), L('chmod 777 script.sh'), L('nmap 8.8.8.8', { k: 'x' })]);
    expect(t[0]).toBe('scope');
    expect(t).toContain('rm-safe');
    expect(t).toContain('chmod777');
    expect(ids([L('ls -R vecchi'), L('rm -r vecchi')])).not.toContain('rm-safe');
  });

  it('metodo: errori ripetuti, suggerimenti, risposte sbagliate', () => {
    const log = [
      L('cat note.txt', { e: 'cat: note.txt: No such file or directory' }),
      L('cat note.txt', { e: 'cat: note.txt: No such file or directory' }),
      L('', { k: 'h' }),
      L('', { k: 'h' }),
      L('hint', { k: 'h' }),
      L('flag 12', { k: 'w' }),
      L('flag 13', { k: 'w' }),
    ];
    const t = ids(log);
    expect(t).toEqual(expect.arrayContaining(['reread', 'nofile', 'hints', 'wrong']));
  });

  it('riconosce anche ciò che fai bene', () => {
    const log = [L('ls -la missioni'), L('man grep'), L('grep -c Failed caso/auth.log', { k: 'p' }), L('flag 42', { k: 'p' })];
    const a = analyze(log, 2);
    const s = a.strengths.map((x) => x.id);
    expect(s).toEqual(expect.arrayContaining(['clean', 'nohint', 'man', 'hidden', 'shortcut', 'fast']));
    expect(a.tips).toEqual([]);
    expect(a.stats.top[0][0]).toBeDefined();
  });

  it('nessun complimento se gli obiettivi non sono stati raggiunti', () => {
    const s = analyze([L('ls'), L('pwd'), L('ls -l'), L('cd /tmp')], 4).strengths.map((x) => x.id);
    expect(s).not.toContain('nohint');
    expect(s).not.toContain('fast');
    expect(s).not.toContain('clean');
  });
});
