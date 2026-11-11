import { describe, expect, it } from 'vitest';
import { buildWorld } from '../src/content/world';

const text = (r: { lines: { text: string }[] }) => r.lines.map((l) => l.text).join('\n');

describe('shell', () => {
  it('whoami, pwd e prompt', () => {
    const sh = buildWorld('edge');
    expect(text(sh.run('whoami'))).toBe('edge');
    expect(text(sh.run('pwd'))).toBe('/home/edge');
    expect(sh.promptText()).toBe('edge@deck:~$');
  });

  it('cd con percorsi relativi, assoluti, .. e -', () => {
    const sh = buildWorld('edge');
    sh.run('cd missioni');
    expect(sh.cwd).toBe('/home/edge/missioni');
    expect(sh.promptText()).toBe('edge@deck:~/missioni$');
    sh.run('cd ../../..');
    expect(sh.cwd).toBe('/');
    sh.run('cd -');
    expect(sh.cwd).toBe('/home/edge/missioni');
    sh.run('cd ~');
    expect(sh.cwd).toBe('/home/edge');
    expect(text(sh.run('cd nulla'))).toContain('No such file or directory');
    expect(text(sh.run('cd README.txt'))).toContain('Not a directory');
    expect(text(sh.run('cd /root'))).toContain('Permission denied');
  });

  it('ls nasconde i file con il punto, tranne con -a', () => {
    const sh = buildWorld('edge');
    expect(text(sh.run('ls missioni'))).not.toContain('.nota_segreta');
    expect(text(sh.run('ls -a missioni'))).toContain('.nota_segreta');
    expect(text(sh.run('ls -la'))).toMatch(/^-rw-r--r--.*README\.txt$/m);
  });

  it('errori di comando con suggerimenti', () => {
    const sh = buildWorld('edge');
    expect(text(sh.run('Whoami'))).toContain('MAIUSCOLE');
    expect(text(sh.run('pign 1.1.1.1'))).toContain('ping');
    expect(text(sh.run('qwertyuiop'))).toContain('help');
  });

  it('virgolette e pipe', () => {
    const sh = buildWorld('edge');
    expect(text(sh.run('echo "ciao   mondo"'))).toBe('ciao   mondo');
    expect(text(sh.run('cat /etc/passwd | grep edge'))).toContain('edge:x:1000');
    expect(text(sh.run('cat /etc/passwd | wc -l'))).toBe('4');
    expect(text(sh.run('echo "aperta'))).toContain('unexpected EOF');
  });

  it('autocompletamento', () => {
    const sh = buildWorld('edge');
    expect(sh.complete('who').line).toBe('whoami ');
    expect(sh.complete('cat miss').line).toBe('cat missioni/');
    expect(sh.complete('cat missioni/ben').line).toBe('cat missioni/benvenuto.txt ');
    expect(sh.complete('cat missioni/.n').line).toBe('cat missioni/.nota_segreta ');
    expect(sh.complete('h').options).toEqual(expect.arrayContaining(['head', 'help', 'hint', 'history', 'hostname']));
  });

  it('rete: ping e nmap', () => {
    const sh = buildWorld('edge');
    expect(text(sh.run('ping -c 2 jukebox.lan'))).toContain('2 packets transmitted, 2 received, 0% packet loss');
    expect(text(sh.run('ping cassa.lan'))).toContain('100% packet loss');
    expect(text(sh.run('ping nessuno.lan'))).toContain('Name or service not known');
    expect(text(sh.run('ping 192.168.1.99'))).toContain('Destination Host Unreachable');
    expect(text(sh.run('nmap -sn 192.168.1.0/24'))).toContain('(4 hosts up)');
    const scan = text(sh.run('nmap -sV jukebox.lan'));
    expect(scan).toMatch(/23\/tcp\s+open\s+telnet\s+BusyBox telnetd/);
    expect(text(sh.run('nmap -p 22,443 jukebox.lan'))).toMatch(/443\/tcp\s+closed\s+https/);
    const blocked = sh.run('nmap helix.corp');
    expect(text(blocked)).toContain('615-ter');
    expect(blocked.events).toContainEqual(expect.objectContaining({ type: 'scan', outOfScope: true }));
    expect(text(sh.run('nmap 8.8.8.8'))).toContain('NON è nello scope');
  });

  it('man e help', () => {
    const sh = buildWorld('edge');
    expect(text(sh.run('man ls'))).toContain('OPZIONI');
    expect(text(sh.run('man boh'))).toBe('No manual entry for boh');
    expect(text(sh.run('aiuto'))).toContain('Comandi disponibili');
  });
});
