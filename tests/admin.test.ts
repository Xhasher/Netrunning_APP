import { describe, expect, it } from 'vitest';
import { buildWorld } from '../src/content/world';
import { SYS_ROOTS } from '../src/content/world-admin';

const out = (sh: ReturnType<typeof buildWorld>, cmd: string) => sh.run(cmd).lines.map((l) => l.text).join('\n');

describe('amministrazione del deck', () => {
  it('journalctl filtra per priorità, servizio e orario', () => {
    const sh = buildWorld('edge');
    const err = out(sh, 'journalctl -p err');
    expect(err).toContain('backup.sh');
    expect(err).not.toContain('CRON');
    expect(out(sh, 'journalctl -u nginx')).not.toContain('sshd');
    const night = out(sh, 'journalctl --since 03:00 --until 04:00');
    expect(night).toContain('45.155.205.33');
    expect(night).not.toContain('06:12');
    expect(out(sh, 'journalctl -n 2 -r').split('\n')[1]).toContain('20:17');
    expect(out(sh, 'cat /var/log/journal/system.journal')).toContain('Permission denied');
  });

  it('un servizio guasto si ripara solo correggendo la causa', () => {
    const sh = buildWorld('edge');
    expect(out(sh, 'systemctl is-active nginx')).toBe('failed');
    expect(sh.run('sudo systemctl restart nginx').events.some((e) => e.type === 'command' && e.name === 'systemctl-restart' && !e.ok)).toBe(true);
    const f = sh.fs.get('/etc/nginx/sites-enabled/negozio');
    expect(sh.writeText('/etc/nginx/sites-enabled/negozio', 'x', false)).toBe('Permission denied');
    expect(sh.writeText('/etc/nginx/sites-enabled/negozio', (f as { content: string }).content.replace('server_nmae', 'server_name'), false, true)).toBeNull();
    expect(out(sh, 'sudo nginx -t')).toContain('successful');
    out(sh, 'sudo systemctl restart nginx');
    expect(out(sh, 'systemctl is-active nginx')).toBe('active');
    expect(out(sh, 'journalctl -u nginx -n 1')).toContain('Started');
  });

  it('sudo: servizi sì, il resto no; nano solo su /etc', () => {
    const sh = buildWorld('edge');
    expect(out(sh, 'sudo cat /etc/shadow')).toContain('sudoers');
    expect(out(sh, 'sudo nano caso/auth.log')).toContain('/etc');
    expect(sh.run('sudo nano /etc/crontab').events.some((e) => e.type === 'edit' && e.root)).toBe(true);
    expect(sh.user).toBe('edge');
  });

  it('df, du e sort -h', () => {
    const sh = buildWorld('edge');
    expect(out(sh, 'df -h /var')).toMatch(/96% \/var/);
    expect(out(sh, 'df -h /var')).not.toContain('/dev/sda1');
    expect(out(sh, 'du -sh /var/log/* | sort -h').trim().split('\n').pop()).toContain('/var/log/app');
    expect(out(sh, 'echo "2M a\n512 b\n4K c" > t.txt; sort -h t.txt')).toBe('512 b\n4K c\n2M a');
  });

  it('le modifiche di sistema si possono salvare e ripristinare', () => {
    const sh = buildWorld('edge');
    const clean = buildWorld('edge').localFs;
    sh.writeText('/etc/crontab', 'nuovo\n', false, true);
    const d = sh.localFs.diffFrom(clean, '/etc/crontab');
    expect(SYS_ROOTS).toContain('/etc/crontab');
    const again = buildWorld('edge');
    again.localFs.overlay('/etc/crontab', d.tree);
    expect(out(again, 'cat /etc/crontab')).toBe('nuovo');
  });
});
