// Dati del capitolo "Amministrare Linux": un server web con un servizio guasto,
// il diario di sistema (journal), un disco quasi pieno e la causa nel cron.
// Tutto è collegato: il backup notturno fallisce perché /var è pieno, /var è pieno
// perché un lavoro pianificato scrive un log di debug ogni 5 minuti.

import type { Shell } from '../engine/shell';
import { DISKS_FILE, JOURNAL_FILE, SVC_FILE, encodeUnits } from '../engine/sysinfo';

/** Percorsi di sistema che il giocatore può modificare e che vanno salvati con il deck. */
export const SYS_ROOTS = ['/etc/nginx', '/etc/crontab', '/var/lib/nightos', '/var/log/journal'];

const HOST = 'deck';
const pad = (n: number) => String(n).padStart(2, '0');

export function buildJournal(user: string): string {
  const rows: [number, number, number, number, string][] = [];
  const at = (prio: number, h: number, m: number, s: number, msg: string) => rows.push([prio, h, m, s, msg]);
  at(6, 0, 0, 1, 'systemd[1]: Starting Rotate log files...');
  at(6, 0, 0, 2, 'systemd[1]: logrotate.service: Succeeded.');
  at(6, 0, 17, 1, 'CRON[1101]: (root) CMD (cd / && run-parts --report /etc/cron.hourly)');
  at(6, 1, 15, 0, 'CRON[1201]: (root) CMD (/usr/local/bin/backup.sh)');
  at(6, 1, 15, 1, 'backup.sh[1202]: avvio backup di /var/www verso /var/backups/web.tar');
  at(3, 1, 15, 4, 'backup.sh[1202]: rsync: write failed on "/var/backups/web.tar": No space left on device (28)');
  at(3, 1, 15, 4, 'backup.sh[1202]: backup NON completato');
  at(6, 1, 17, 1, 'CRON[1230]: (root) CMD (cd / && run-parts --report /etc/cron.hourly)');
  at(4, 2, 0, 0, 'monitor[1300]: ATTENZIONE: il filesystem /var è al 96%');
  at(6, 2, 17, 1, 'CRON[1330]: (root) CMD (cd / && run-parts --report /etc/cron.hourly)');
  const users = ['oracle', 'test', 'admin', 'ubuntu', 'postgres', 'git'];
  users.forEach((u, i) => at(6, 3, 10, 22 + i * 3, `sshd[${2001 + i}]: Failed password for invalid user ${u} from 45.155.205.33 port ${51000 + i} ssh2`));
  at(6, 3, 10, 41, 'sshd[2007]: Connection closed by invalid user git 45.155.205.33 port 51005 [preauth]');
  at(6, 3, 17, 1, 'CRON[2030]: (root) CMD (cd / && run-parts --report /etc/cron.hourly)');
  at(6, 4, 17, 1, 'CRON[2101]: (root) CMD (cd / && run-parts --report /etc/cron.hourly)');
  at(6, 5, 17, 1, 'CRON[2150]: (root) CMD (cd / && run-parts --report /etc/cron.hourly)');
  at(5, 6, 9, 40, 'sudo[2190]:     luca : TTY=pts/1 ; PWD=/home/luca ; USER=root ; COMMAND=/usr/bin/nano /etc/nginx/sites-enabled/negozio');
  at(5, 6, 12, 0, 'sudo[2205]:     luca : TTY=pts/1 ; PWD=/home/luca ; USER=root ; COMMAND=/usr/bin/systemctl restart nginx');
  at(6, 6, 12, 1, 'systemd[1]: Stopping nginx.service - A high performance web server and a reverse proxy server...');
  at(6, 6, 12, 2, 'systemd[1]: nginx.service: Succeeded.');
  at(6, 6, 12, 2, 'systemd[1]: Stopped nginx.service - A high performance web server and a reverse proxy server.');
  at(6, 6, 12, 2, 'systemd[1]: Starting nginx.service - A high performance web server and a reverse proxy server...');
  at(2, 6, 12, 3, 'nginx[2210]: nginx: [emerg] unknown directive "server_nmae" in /etc/nginx/sites-enabled/negozio:3');
  at(3, 6, 12, 3, 'nginx[2210]: nginx: configuration file /etc/nginx/nginx.conf test failed');
  at(3, 6, 12, 3, 'systemd[1]: nginx.service: Control process exited, code=exited, status=1/FAILURE');
  at(4, 6, 12, 3, "systemd[1]: nginx.service: Failed with result 'exit-code'.");
  at(3, 6, 12, 3, 'systemd[1]: Failed to start nginx.service - A high performance web server and a reverse proxy server.');
  at(6, 6, 17, 1, 'CRON[2230]: (root) CMD (cd / && run-parts --report /etc/cron.hourly)');
  at(6, 6, 25, 1, 'CRON[2240]: (root) CMD (test -x /usr/sbin/anacron || run-parts --report /etc/cron.daily)');
  at(6, 9, 2, 11, `sshd[3001]: Accepted publickey for ${user} from 192.168.1.50 port 50122 ssh2`);
  at(6, 9, 2, 11, `sshd[3001]: pam_unix(sshd:session): session opened for user ${user}(uid=1000) by (uid=0)`);
  at(4, 10, 0, 0, 'monitor[3100]: ATTENZIONE: il filesystem /var è al 96%');
  at(6, 13, 15, 0, 'CRON[3301]: (root) CMD (/usr/local/bin/backup.sh)');
  at(6, 13, 15, 1, 'backup.sh[3302]: avvio backup di /var/www verso /var/backups/web.tar');
  at(3, 13, 15, 5, 'backup.sh[3302]: rsync: write failed on "/var/backups/web.tar": No space left on device (28)');
  at(3, 13, 15, 5, 'backup.sh[3302]: backup NON completato');
  at(6, 20, 17, 1, 'CRON[4101]: (root) CMD (cd / && run-parts --report /etc/cron.hourly)');
  return rows.map(([prio, h, m, s, msg]) => `${prio}|Nov 12 ${pad(h)}:${pad(m)}:${pad(s)} ${HOST} ${msg}\n`).join('');
}

export function addAdmin(sh: Shell): void {
  const fs = sh.localFs;
  const root = { owner: 'root', group: 'root' };

  fs.mkdirp('/var/lib/nightos', root);
  fs.writeFile(
    SVC_FILE,
    encodeUnits([
      { name: 'ssh', desc: 'OpenBSD Secure Shell server', state: 'active', enabled: true, pid: 455, mem: '5.4M', since: 'Mon 2077-11-09 16:52:11 CET; 3 days ago' },
      { name: 'cron', desc: 'Regular background program processing daemon', state: 'active', enabled: true, pid: 402, mem: '1.2M', since: 'Mon 2077-11-09 16:52:11 CET; 3 days ago' },
      { name: 'rsyslog', desc: 'System Logging Service', state: 'active', enabled: true, pid: 470, mem: '2.8M', since: 'Mon 2077-11-09 16:52:11 CET; 3 days ago' },
      { name: 'ufw', desc: 'Uncomplicated firewall', state: 'active', enabled: true, pid: 0, mem: '0B', since: 'Mon 2077-11-09 16:52:10 CET; 3 days ago' },
      { name: 'nginx', desc: 'A high performance web server and a reverse proxy server', state: 'failed', enabled: true, pid: 0, mem: '0B', since: 'Thu 2077-11-12 06:12:03 CET; 14h ago' },
      { name: 'cups', desc: 'CUPS Scheduler (stampa)', state: 'inactive', enabled: false, pid: 0, mem: '0B', since: 'Mon 2077-11-09 16:52:11 CET; 3 days ago' },
    ]),
    { ...root, perms: 'rw-r--r--' },
  );
  fs.writeFile(
    DISKS_FILE,
    ['/dev/sda1        40G   14G   24G  37% /', 'tmpfs           2.0G     0  2.0G   0% /dev/shm', '/dev/sda2       100G   96G  4.0G  96% /var'].join('\n') + '\n',
    { ...root, perms: 'rw-r--r--' },
  );

  // il diario di sistema: si legge con journalctl, non con cat (è un file binario nel vero Linux)
  fs.mkdirp('/var/log/journal', { ...root, perms: 'rwxr-sr-x' });
  fs.writeFile(JOURNAL_FILE, buildJournal(sh.user), { ...root, perms: 'rw-r-----', locked: true });

  // nginx con un errore di battitura nella configurazione del sito
  fs.mkdirp('/etc/nginx/sites-enabled', root);
  fs.writeFile(
    '/etc/nginx/nginx.conf',
    ['user www-data;', 'worker_processes auto;', '', 'http {', '    include /etc/nginx/mime.types;', '    access_log /var/log/nginx/access.log;', '    include /etc/nginx/sites-enabled/*;', '}'].join('\n') + '\n',
    { ...root, perms: 'rw-r--r--' },
  );
  fs.writeFile(
    '/etc/nginx/sites-enabled/negozio',
    ['server {', '    listen 80;', '    server_nmae negozio.lan;', '    root /var/www/negozio;', '    index index.html;', '', '    location / {', '        try_files $uri $uri/ =404;', '    }', '}'].join('\n') + '\n',
    { ...root, perms: 'rw-r--r--' },
  );

  // /var quasi pieno: il colpevole è un log di debug che cresce senza sosta
  const mkLog = (lines: number, f: (i: number) => string) => Array.from({ length: lines }, (_, i) => f(i)).join('\n') + '\n';
  fs.mkdirp('/var/log/app', root);
  fs.writeFile(
    '/var/log/app/debug.log',
    mkLog(2400, (i) => `2077-11-12 ${pad(Math.floor(i / 100) % 24)}:${pad((i * 5) % 60)}:00 DEBUG esporta: riga ${i} letta, ${i % 7} campi, buffer=${(i * 131) % 4096} byte, stato=OK`),
    { ...root, perms: 'rw-r--r--' },
  );
  fs.writeFile('/var/log/app/app.log', mkLog(40, (i) => `2077-11-12 ${pad(i % 24)}:00:00 INFO esportazione completata (${100 + i} righe)`), { ...root, perms: 'rw-r--r--' });
  fs.mkdirp('/var/log/nginx', root);
  fs.writeFile('/var/log/nginx/access.log', mkLog(60, (i) => `10.0.3.${i % 50} - - [11/Nov/2077:${pad(i % 24)}:00:00 +0100] "GET / HTTP/1.1" 200 512`), { ...root, perms: 'rw-r--r--' });
  fs.writeFile('/var/log/nginx/error.log', '', { ...root, perms: 'rw-r--r--' });
  fs.mkdirp('/var/backups', root);
  fs.writeFile('/var/backups/web.tar.parziale', 'backup interrotto: No space left on device\n', { ...root, perms: 'rw-r--r--' });
  fs.mkdirp('/opt/app', root);
  fs.writeFile('/opt/app/esporta.sh', '#!/bin/bash\n# esporta gli ordini verso il gestionale\n# --debug scrive ogni passo su stdout\n', { ...root, perms: 'rwxr-xr-x' });
  fs.mkdirp('/usr/local/bin', root);
  fs.writeFile('/usr/local/bin/backup.sh', '#!/bin/bash\n# backup notturno del sito\nrsync -a /var/www/ /var/backups/web.tar\n', { ...root, perms: 'rwxr-xr-x' });

  fs.writeFile(
    '/etc/crontab',
    [
      '# /etc/crontab: lavori programmati di sistema',
      '# m h dom mon dow user  command',
      '17 *  * * *  root  cd / && run-parts --report /etc/cron.hourly',
      '25 6  * * *  root  test -x /usr/sbin/anacron || run-parts --report /etc/cron.daily',
      '15 1,13 * * *  root  /usr/local/bin/backup.sh',
      '*/5 * * * *  root  /opt/app/esporta.sh --debug >> /var/log/app/debug.log',
    ].join('\n') + '\n',
    { ...root, perms: 'rw-r--r--' },
  );
}
