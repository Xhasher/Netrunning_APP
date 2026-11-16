import { describe, expect, it } from 'vitest';
import { OPERATIONS, matchFinding } from '../src/content/operations';
import { buildWorld } from '../src/content/world';

const text = (r: { lines: { text: string }[] }) => r.lines.map((l) => l.text).join('\n');

// comandi che un giocatore userebbe per trovare ogni problema, e cosa segnalerebbe
const PLAY: Record<string, { cmds: string[]; reports: string[] }> = {
  sc01: {
    cmds: [
      'ls -la scena/sc01/home/jackie/Documenti',
      'cat scena/sc01/home/jackie/Documenti/fornitori.txt',
      'cat scena/sc01/etc/passwd',
      'ls -l scena/sc01/home/jackie/Documenti/fornitori.txt',
      'grep tecnico scena/sc01/root/raccolta/processi.txt',
      'grep Accepted scena/sc01/var/log/auth.log',
      'ls -la scena/sc01/home/tecnico',
      'sha256sum scena/sc01/home/tecnico/.local/sync',
      'cat scena/indicatori.txt',
      'prova scena/sc01/home/jackie/Documenti/fornitori.txt',
    ],
    reports: ['.fornitori.txt.bak', 'NC99 6666 0101 2077 1313', 'tecnico', 'rw-rw-rw-', '/home/tecnico/.local/sync', '203.0.113.140', '/home/tecnico/.bash_history', 'NightTunnel'],
  },
  op01: {
    cmds: [
      'ssh audit@market.lan',
      'find / -name "*.sql" 2>/dev/null',
      'cat /etc/crontab',
      'ls -l /opt/market/sync.sh',
      'grep sudo /etc/group',
      'grep -i root /etc/ssh/sshd_config',
    ],
    reports: ['/var/www/html/backup/db.sql', '/opt/market/sync.sh', 'test', 'PermitRootLogin'],
  },
  op02: {
    cmds: [
      'ssh root@clinica.lan',
      'grep "Failed password" /var/log/auth.log | cut -d " " -f 11 | sort | uniq -c',
      'grep Accepted /var/log/auth.log',
      'grep sudo /var/log/auth.log',
      'ls -la /etc/cron.d',
      'cat /etc/cron.d/.sync-check',
    ],
    reports: ['198.51.100.66', 'marco', 'sysupdate', '/etc/cron.d/.sync-check', '/var/tmp/.cache/updater'],
  },
  op04: {
    cmds: [
      'ssh analista@porto.lan',
      'grep 192.0.2.200 /var/log/nginx/access.log',
      'for f in $(find /tmp /var/tmp -type f 2>/dev/null); do sha256sum $f; done',
      'ls /etc/cron.d',
      'cat /etc/cron.d/fontcache',
      'find /home -name authorized_keys 2>/dev/null',
      'grep void /home/deploy/.ssh/authorized_keys',
    ],
    reports: ['/var/www/html/upload/shell.php', '/var/tmp/.fonts/kdevtmp', '/etc/cron.d/fontcache', '/home/deploy/.ssh/authorized_keys'],
  },
  op05: {
    cmds: [
      'ssh analista@tram.lan',
      'cat catture/inventario.txt',
      'cat catture/arp.txt',
      'grep -i pass catture/cattura.txt',
      'grep -c exfil-cdn.top catture/dns.txt',
      'sort -n -r catture/flussi.txt | head -n 3',
    ],
    reports: ['10.30.0.99', 'telnet', 'exfil-cdn.top', '203.0.113.250'],
  },
  op06: {
    cmds: ['whois scantinato.nc', 'dig scantinato.nc TXT', 'crtsh scantinato.nc', 'cat scantinato/servizi.txt', 'cve roundcube 1.4.1', 'exiftool scantinato/menu_autunno.pdf'],
    reports: ['spf', 'old.scantinato.nc', 'CVE-2077-0901', 'menu_autunno.pdf'],
  },
  op07: {
    cmds: ['ssh auditor@cassa-nuova.lan', 'sudo -l', 'find / -perm -4000 2>/dev/null', 'ls -l /etc/pos', 'cat /etc/pos/db.conf', 'ss -tlnp', 'apt list --upgradable | grep security'],
    reports: ['less', '/opt/pos/pos-update', '/etc/pos/db.conf', 'ftp', 'openssl'],
  },
  op08: {
    cmds: [
      'ssh analista@siem.lan',
      'grep WINWORD /var/log/windows/sysmon_ws12.csv',
      'grep ",3," /var/log/windows/sysmon_ws12.csv',
      'grep 7045 /var/log/windows/system_ws12.csv',
      'grep ",4720," /var/log/windows/security_dc01.csv',
      'grep ",1102," /var/log/windows/security_dc01.csv',
    ],
    reports: ['WS-12', 'docs-share.top', 'PrintSpoolerHelper', 'backup_adm', 'DC01'],
  },
  op09: {
    cmds: ['grep -i principal nuvola/storage.json', 'cat nuvola/iam.txt', 'cat nuvola/security_groups.txt', 'cat nuvola/logging.txt'],
    reports: ['scantinato-backup', 'jukebox-bot', 'root', '0.0.0.0/0', 'cloudtrail'],
  },
  op03: {
    cmds: ['curl -I http://radio.lan/', 'curl http://radio.lan/robots.txt', 'curl http://radio.lan/.env', 'curl http://radio.lan/staff/ | grep "<!--"'],
    reports: ['nginx/1.14.0', '/.env', '/staff/'],
  },
};

describe('operazioni', () => {
  for (const op of OPERATIONS) {
    it(`${op.code} ${op.title} è completabile`, () => {
      const sh = buildWorld('edge');
      op.setup(sh);
      const play = PLAY[op.id];
      expect(play).toBeDefined();
      for (const c of play.cmds) {
        const r = sh.run(c);
        const errs = r.lines.filter((l) => l.cls === 'err');
        expect(errs, `${c}: ${text(r)}`).toEqual([]);
      }
      const found = new Set(play.reports.map((v) => matchFinding(op, v)?.id));
      // gli indizi della scena che si trovano repertando un file (comando "prova") non passano da report
      for (const f of op.findings) if (f.evidence) found.add(f.id);
      expect([...found].sort()).toEqual(op.findings.map((f) => f.id).sort());
      // anche gli indizi finali (l'ultimo suggerimento) devono funzionare
      for (const f of op.findings) {
        if (f.evidence) {
          const ev = sh.run(f.hints[f.hints.length - 1]).events.find((e) => e.type === 'evidence');
          expect(ev && ev.type === 'evidence' && ev.path).toBe(`${sh.home}/${f.evidence}`);
          continue;
        }
        const last = f.hints[f.hints.length - 1];
        expect(last.startsWith('report ')).toBe(true);
        expect(matchFinding(op, last.slice(7))?.id).toBe(f.id);
      }
    });
  }

  it('ssh: sessioni, permessi ed exit', () => {
    const sh = buildWorld('edge');
    OPERATIONS.find((o) => o.id === 'op01')!.setup(sh);
    expect(text(sh.run('ssh root@market.lan'))).toContain('Permission denied');
    sh.run('ssh audit@market.lan');
    expect(sh.promptText()).toBe('audit@market:~$');
    expect(text(sh.run('hostname'))).toBe('market');
    expect(text(sh.run('cat /home/vendor/x'))).toContain('Permission denied');
    sh.run('exit');
    expect(sh.promptText()).toBe('edge@deck:~$');
    expect(matchFinding(OPERATIONS.find((o) => o.id === 'op01')!, 'boh')).toBeNull();
  });
});

describe('scena del crimine', () => {
  it('ogni indizio ha una missione di sblocco, e i suggerimenti usano solo comandi già insegnati a quel punto', async () => {
    const { allMissions } = await import('../src/content');
    const { introduced, skillsInLine } = await import('../src/game/skills');
    const order = allMissions().map((m) => m.id);
    const sc = OPERATIONS.find((o) => o.id === 'sc01')!;
    for (const f of sc.findings) {
      expect(order, f.id).toContain(f.after);
      const taught = introduced(order.slice(0, order.indexOf(f.after!) + 1), {});
      taught.add('report');
      for (const h of f.hints) {
        const code = [...h.matchAll(/(?:^|: )((?:ls|cat|grep|sha256sum|prova|report)\b[^,:?]*)/g)].map((m) => m[1]);
        for (const line of code) for (const k of skillsInLine(line)) expect(taught.has(k), `${f.id}: ${line} usa ${k}`).toBe(true);
      }
    }
    // la scena si apre presto: almeno due indizi subito, e una conclusione corretta per ogni livello
    expect(sc.findings.filter((f) => f.after === sc.requires).length).toBeGreaterThanOrEqual(2);
    expect(sc.scene!.conclusions.some((c) => c.after === sc.requires)).toBe(true);
  });
});
