import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildWorld } from '../src/content/world';

const text = (r: { lines: { text: string }[] }) => r.lines.map((l) => l.text).join('\n');

describe('shell: variabili, redirezioni, script', () => {
  it('variabili e sostituzione di comando', () => {
    const sh = buildWorld('edge');
    expect(text(sh.run('echo $HOME'))).toBe('/home/edge');
    expect(text(sh.run("echo '$HOME'"))).toBe('$HOME');
    sh.run('NOME="Night City"');
    expect(text(sh.run('echo "Ciao $NOME"'))).toBe('Ciao Night City');
    expect(text(sh.run('N=$(cat /etc/passwd | wc -l); echo "utenti: $N"'))).toBe('utenti: 7');
  });

  it('redirezione > e >>, 2>/dev/null', () => {
    const sh = buildWorld('edge');
    sh.run('echo uno > a.txt');
    sh.run('echo due >> a.txt');
    expect(text(sh.run('cat a.txt'))).toBe('uno\ndue');
    expect(text(sh.run('echo x > /etc/prova'))).toContain('Permission denied');
    expect(text(sh.run('find / -name passwd 2>/dev/null'))).toBe('/etc/passwd');
  });

  it('&&, ||, ; e glob', () => {
    const sh = buildWorld('edge');
    expect(text(sh.run('cat nulla && echo ok || echo ko'))).toContain('ko');
    expect(text(sh.run('cd missioni; ls *.txt'))).toBe('benvenuto.txt\nlista_spesa.txt');
  });

  it('for, if e test', () => {
    const sh = buildWorld('edge');
    expect(text(sh.run('for i in $(seq 1 3); do echo "n$i"; done'))).toBe('n1\nn2\nn3');
    expect(text(sh.run('if [ -f README.txt ]; then echo si; else echo no; fi'))).toBe('si');
    expect(text(sh.run('if [ 5 -gt 9 ]; then echo si; else echo no; fi'))).toBe('no');
    expect(text(sh.run('for x in a b; do'))).toContain('manca "done"');
  });

  it('script con argomenti, chmod +x ed esecuzione', () => {
    const sh = buildWorld('edge');
    sh.fs.writeFile('/home/edge/s.sh', '#!/bin/bash\n# saluto\nfor n in $1 $2; do\n  echo "ciao $n"\ndone\n', { owner: 'edge' });
    expect(text(sh.run('./s.sh'))).toContain('Permission denied');
    expect(text(sh.run('bash s.sh Nyx Rook'))).toBe('ciao Nyx\nciao Rook');
    sh.run('chmod +x s.sh');
    const r = sh.run('./s.sh V | grep V');
    expect(text(r)).toBe('ciao V');
    expect(r.events).toContainEqual(expect.objectContaining({ type: 'script', ok: true }));
    sh.fs.writeFile('/home/edge/loop.sh', 'bash loop.sh', { owner: 'edge' });
    expect(text(sh.run('bash loop.sh'))).toContain('troppi');
  });

  it('mkdir, touch, cp, mv, rm', () => {
    const sh = buildWorld('edge');
    sh.run('mkdir -p prova/sotto');
    sh.run('touch prova/vuoto.txt');
    sh.run('cp README.txt prova/');
    sh.run('mv prova/README.txt prova/leggimi.txt');
    expect(text(sh.run('ls prova'))).toBe('leggimi.txt\nsotto/\nvuoto.txt');
    expect(text(sh.run('rm prova'))).toContain('Is a directory');
    sh.run('rm -r prova');
    expect(sh.fs.get('/home/edge/prova')).toBeUndefined();
    expect(text(sh.run('rm -rf ~'))).toContain('dangerous');
    expect(text(sh.run('rm /etc/passwd'))).toContain('Permission denied');
  });

  it('base64, sha256sum, curl', () => {
    const sh = buildWorld('edge');
    expect(text(sh.run('echo ciao | base64'))).toBe('Y2lhbwo=');
    expect(text(sh.run('echo Y2lhbwo= | base64 -d'))).toBe('ciao');
    const expected = createHash('sha256').update('ciao\n').digest('hex');
    expect(text(sh.run('echo ciao | sha256sum'))).toBe(`${expected}  -`);
    expect(text(sh.run('curl -I http://jukebox.lan/'))).toContain('Server: Apache/2.4.29');
    expect(text(sh.run('curl http://jukebox.lan/robots.txt'))).toContain('Disallow: /pannello/');
    expect(text(sh.run('curl http://helix.corp/'))).toContain('NON è nello scope');
  });
});
