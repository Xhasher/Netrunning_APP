import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/content';
import { buildWorld } from '../src/content/world';
import { evaluate } from '../src/game/logic';

// Soluzione di ogni passo "task", in ordine, per ogni missione.
const SOLUTIONS: Record<string, string[][]> = {
  'ch01-m1': [['whoami'], ['hostname'], ['Whoami'], ['help']],
  'ch01-m2': [['pwd'], ['ls'], ['cd missioni'], ['cd ..'], ['cd /etc', 'ls'], ['cd /root'], ['cd']],
  'ch01-m3': [
    ['cat missioni/benvenuto.txt'],
    ['ls -a missioni'],
    ['cat missioni/.nota_segreta', 'flag NC{v3d0_l_1nv1s1b1l3}'],
  ],
  'ch01-m4': [['man ls'], ['ls -l'], ['echo "Ciao Night City"'], ['history'], ['clear']],
  'ch01-m5': [
    [
      'cd contratti/rook',
      'cat brief.txt',
      'ls -a consegna_b',
      'cd consegna_b/.doppiofondo',
      'cat codice.txt',
      'flag NC{d0pp10_f0nd0}',
    ],
  ],
  'ch02-m1': [['ip a'], ['flag 192.168.1.50']],
  'ch02-m2': [['ping 192.168.1.1'], ['ping jukebox.lan'], ['ping cassa.lan']],
  'ch02-m3': [
    ['cat rete/scope.txt'],
    ['nmap -sn 192.168.1.0/24'],
    ['flag 4'],
    ['nmap jukebox.lan'],
    ['flag telnet'],
    ['nmap -sV 192.168.1.20'],
    ['nmap helix.corp', 'flag no'],
  ],
  'ch03-m1': [['id'], ['cat /etc/passwd', 'flag 1001'], ['cut -d ":" -f 1 /etc/passwd'], ['cat /etc/shadow']],
  'ch03-m2': [
    ['cat audit/LEGGIMI.txt'],
    ['ls -la audit/scantinato'],
    ['cat audit/scantinato/config.bak', 'flag config.bak'],
    ['chmod 600 audit/scantinato/config.bak'],
    ['chmod 755 audit/scantinato/backup.sh'],
  ],
  'ch03-m3': [['find ~ -name "*.bak"'], ['flag 2'], ['cat /etc/passwd | grep bash | wc -l', 'flag 3'], ['ps aux']],
  'ch04-m1': [['cat caso/LEGGIMI.txt'], ['wc -l caso/auth.log', 'flag 46'], ['tail -n 5 caso/auth.log']],
  'ch04-m2': [
    ['grep "Failed password" caso/auth.log | wc -l', 'flag 40'],
    ['grep "Failed password" caso/auth.log | cut -d " " -f 11 | sort | uniq -c', 'flag 203.0.113.77'],
    ['grep Accepted caso/auth.log', 'flag mama'],
  ],
  'ch04-m3': [['cat caso/processi.txt', 'flag 6631'], ['sudo ufw deny from 203.0.113.77'], ['sudo ufw status']],
};

describe('ogni missione è completabile', () => {
  for (const chapter of CHAPTERS) {
    for (const mission of chapter.missions) {
      it(`${mission.id} ${mission.title}`, () => {
        const sh = buildWorld('edge');
        const solutions = SOLUTIONS[mission.id];
        expect(solutions, `manca la soluzione per ${mission.id}`).toBeDefined();
        const tasks = mission.steps.filter((s) => s.kind === 'task');
        expect(tasks.length).toBe(solutions.length);

        tasks.forEach((step, i) => {
          let passed = false;
          for (const cmd of solutions[i]) {
            const res = sh.run(cmd);
            const out = evaluate(step, res.events, sh);
            expect(out, `"${cmd}" non dovrebbe dare risposta errata (${step.title})`).not.toBe('wrong-answer');
            if (out === 'pass') passed = true;
          }
          expect(passed, `passo "${step.title}" non superato con: ${solutions[i].join(' ; ')}`).toBe(true);
        });
      });
    }
  }

  it('i quiz hanno una risposta corretta valida', () => {
    for (const ch of CHAPTERS)
      for (const m of ch.missions)
        for (const s of m.steps)
          if (s.kind === 'quiz') expect(s.correct).toBeLessThan(s.options.length);
  });

  it('gli id delle missioni sono unici', () => {
    const ids = CHAPTERS.flatMap((c) => c.missions.map((m) => m.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
