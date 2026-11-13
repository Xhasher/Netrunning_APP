import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/content';
import { cmdName, commandsInLine, commandsInMarkup, taughtBefore } from '../src/game/commands';
import { inline } from '../src/ui/markup';

describe('riconoscimento dei comandi e nascondimento', () => {
  it('riconosce i comandi in una riga di shell', () => {
    expect(commandsInLine('cat /etc/passwd | grep bash | wc -l')).toEqual(['cat', 'grep', 'wc']);
    expect(commandsInLine('cd /tmp && ls -la')).toEqual(['cd', 'ls']);
    expect(commandsInLine('for f in a b; do echo $f; done')).toEqual(['for', 'echo']);
    expect(commandsInLine('sudo ufw status')).toEqual(['sudo', 'ufw']);
    expect(commandsInLine('N=$(wc -l x)')).toEqual(['assign']);
    expect(commandsInLine('./script.sh')).toEqual(['script']);
    expect(commandsInLine('Get-Content file.txt')).toEqual(['cat']);
  });

  it('i comandi del gioco e le parole comuni non sono comandi da nascondere', () => {
    expect(cmdName('flag')).toBeNull();
    expect(cmdName('ciao')).toBeNull();
    expect(cmdName('ls')).toBe('ls');
  });

  it('estrae i comandi dalle lezioni (blocchi e codice in linea)', () => {
    expect(commandsInMarkup('Usa `rm file` e poi:\n```\nls -la\n```').sort()).toEqual(['ls', 'rm']);
  });

  it('un comando spiegato in una lezione è "noto" nei passi successivi, ma non prima', () => {
    const m = CHAPTERS[0].missions.find((x) => x.id === 'ch01-m6')!;
    const lessonIdx = m.steps.findIndex((s) => s.kind === 'lesson' && /rm/.test(s.body));
    const taskIdx = m.steps.findIndex((s, i) => i > lessonIdx && s.kind === 'task' && /vecchio_log/.test(s.body));
    expect(taughtBefore('ch01-m6', taskIdx).has('rm')).toBe(true);
    expect(taughtBefore('ch01-m6', 0).has('rm')).toBe(false);
  });

  it('il corsivo *così* funziona fuori dal codice e non rovina i caratteri jolly', () => {
    expect(inline('si usa *move* davvero')).toContain('<em>move</em>');
    expect(inline('usa `ls *.txt` e `cat *.log`')).not.toContain('<em>');
    expect(inline('2 * 3 = 6')).not.toContain('<em>');
  });
});
