import { describe, expect, it } from 'vitest';
import { OPERATIONS, matchFinding } from '../src/content/operations';
import { buildWorld } from '../src/content/world';

const text = (r: { lines: { text: string }[] }) => r.lines.map((l) => l.text).join('\n');

// comandi che un giocatore userebbe per trovare ogni problema, e cosa segnalerebbe
const PLAY: Record<string, { cmds: string[]; reports: string[] }> = {
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
      expect([...found].sort()).toEqual(op.findings.map((f) => f.id).sort());
      // anche gli indizi finali (l'ultimo suggerimento) devono funzionare
      for (const f of op.findings) {
        const last = f.hints[f.hints.length - 1];
        expect(last.startsWith('report ')).toBe(true);
        expect(matchFinding(op, last.slice(7))?.id).toBe(f.id);
      }
    });
  }

  it('ssh: sessioni, permessi ed exit', () => {
    const sh = buildWorld('edge');
    OPERATIONS[0].setup(sh);
    expect(text(sh.run('ssh root@market.lan'))).toContain('Permission denied');
    sh.run('ssh audit@market.lan');
    expect(sh.promptText()).toBe('audit@market:~$');
    expect(text(sh.run('hostname'))).toBe('market');
    expect(text(sh.run('cat /home/vendor/x'))).toContain('Permission denied');
    sh.run('exit');
    expect(sh.promptText()).toBe('edge@deck:~$');
    expect(matchFinding(OPERATIONS[0], 'boh')).toBeNull();
  });
});
