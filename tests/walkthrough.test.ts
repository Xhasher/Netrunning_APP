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
  'ch01-m6': [
    ['cd laboratorio', 'mkdir appunti'],
    ['echo "ls elenca i file" > appunti/comandi.txt', 'echo "cd cambia cartella" >> appunti/comandi.txt'],
    ['cp appunti/comandi.txt appunti/comandi.bak'],
    ['mv bozza.txt idee.txt'],
    ['rm vecchio_log.txt'],
    ['cd', 'tree laboratorio'],
  ],
  'ch05-m1': [
    ['echo $HOME'],
    ['BERSAGLIO="jukebox.lan"', 'echo "Scansiono $BERSAGLIO"'],
    ['FALLITI=$(grep "Failed password" caso/auth.log | wc -l)', 'echo "Tentativi falliti: $FALLITI"'],
    ['find / -name passwd 2>/dev/null'],
  ],
  'ch05-m2': [
    ['cd script', '@nano ciao.sh|#!/bin/bash\n# il mio primo script\necho "Ciao da $USER"\ndate\n'],
    ['bash ciao.sh'],
    ['chmod +x ciao.sh', './ciao.sh'],
    ['@nano conta.sh|#!/bin/bash\nN=$(grep "$2" "$1" | wc -l)\necho "$2 compare in $N righe di $1"\n', 'chmod +x conta.sh', './conta.sh ~/caso/auth.log Accepted'],
  ],
  'ch05-m3': [
    ['for f in caso/*; do echo "== $f"; wc -l $f; done'],
    ['if [ -f caso/auth.log ]; then echo "Log presente"; else echo "Log mancante!"; fi'],
    [
      '@nano allarme.sh|#!/bin/bash\nLOG=$1\nSOGLIA=10\nN=$(grep "Failed password" $LOG | wc -l)\nif [ $N -gt $SOGLIA ]; then\n  echo "ALLARME: $N login falliti in $LOG"\n  for ip in $(grep "Failed password" $LOG | cut -d " " -f 11 | sort | uniq); do\n    echo "IP sospetto: $ip"\n  done\nelse\n  echo "Tutto tranquillo ($N login falliti)"\nfi\n',
      'chmod +x allarme.sh',
      './allarme.sh caso/auth.log',
    ],
  ],
  'ch06-m1': [['cat cripto/messaggio.txt', 'base64 -d cripto/messaggio.txt', 'flag NC{b4s364_n0n_e_c1fr4tur4}']],
  'ch06-m2': [['echo ciao | sha256sum', 'echo Ciao | sha256sum'], ['cd cripto/firmware', 'sha256sum -c SHA256SUMS', 'flag update.sh']],
  'ch06-m3': [],
  'ch07-m1': [['curl http://jukebox.lan/'], ['curl -I http://jukebox.lan/', 'flag 2.4.29']],
  'ch07-m2': [['curl http://jukebox.lan/ | grep "<!--"', 'flag /pannello/'], ['curl http://jukebox.lan/robots.txt']],
  'ch07-m3': [
    ['grep " 404 " web/access.log | cut -d " " -f 1 | sort | uniq -c', 'flag 203.0.113.50'],
    ['grep -i "union" web/access.log', 'flag 203.0.113.77'],
    ['grep 203.0.113.77 web/access.log', 'flag 500'],
  ],
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
            // "@nano FILE|contenuto" simula l'editor: scrive il file ed emette l'evento "saved"
            let events;
            if (cmd.startsWith('@nano ')) {
              const rest = cmd.slice(6);
              const file = rest.slice(0, rest.indexOf('|'));
              const content = rest.slice(rest.indexOf('|') + 1);
              const path = sh.abs(file);
              expect(sh.writeText(path, content.replace(/\\n/g, '\n'), false)).toBeNull();
              events = [{ type: 'saved' as const, path }];
            } else {
              const res = sh.run(cmd);
              events = res.events;
              const errs = res.lines.filter((l) => l.cls === 'err').map((l) => l.text);
              expect(errs, `"${cmd}" ha prodotto errori inattesi`).toEqual(errs.filter((e) => /Permission denied|command not found|not in the sudoers|need to be root/.test(e) || ['cat /etc/shadow', 'cd /root', 'Whoami', 'sha256sum -c SHA256SUMS', 'find / -name passwd 2>/dev/null', 'nmap helix.corp'].includes(cmd)));
            }
            const out = evaluate(step, events, sh);
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
