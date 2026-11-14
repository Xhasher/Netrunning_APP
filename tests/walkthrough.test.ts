import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/content';
import { buildWorld } from '../src/content/world';
import { evaluate } from '../src/game/logic';

// Soluzione di ogni passo "task", in ordine, per ogni missione.
const SOLUTIONS: Record<string, string[][]> = {
  'ch01-m1': [['whoami'], ['hostname'], ['Whoami'], ['help']],
  'chF-m1': [['cat fondamenti/incidenti.txt', 'flag Disponibilità'], ['flag integrita'], ['flag riservatezza']],
  'chF-m2': [['cat fondamenti/rischi.txt', 'flag r2']],
  'chF-m3': [],
  'chF-m4': [['cat fondamenti/accessi.txt', 'flag svc.backup']],
  'chF-m5': [['cat fondamenti/ingaggio.txt', 'flag 10.20.0.50']],
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
  'ch07-m4': [],
  'ch07-m5': [
    ['cat web/negozio-contratto.txt', 'curl "http://negozio.lan/ordine.php?id=1041"'],
    ['curl "http://negozio.lan/ordine.php?id=1042"'],
    ['flag a01'],
    ['curl -I http://negozio.lan/', 'flag 5.6.40'],
    ['curl http://negozio.lan/config.php.bak', 'flag shop_admin'],
    ['grep "url=" web/negozio.log', 'flag 169.254.169.254'],
    ['grep "login.php" web/negozio.log', 'flag judy'],
  ],
  'ch08-m4': [
    ['cat posta/segnalazione.txt', 'cat posta/fattura.eml'],
    ['grep "Received" posta/fattura.eml', 'flag 203.0.113.88'],
    ['grep -i "authentication-results" -A 2 posta/fattura.eml', 'flag fail'],
    ['grep -i "reply-to" posta/fattura.eml', 'flag recupero.crediti77@mailbox.nc'],
    ['grep "href" posta/fattura.eml', 'flag pagamenti-sicuri.nc'],
    ['grep -c "fattura scaduta" posta/consegne.log', 'flag 6'],
    ['grep pagamenti-sicuri.nc posta/proxy.log', 'flag t.okafor'],
  ],
  'chPY-m1': [
    ['python3 -c "print(\'Jack-in completato\')"'],
    ['python3 -c "print(86400 * 90)"', 'flag 7776000'],
    ['@nano py/saluto.py|nome = "V"\nprint(f"Benvenuto nel deck, {nome}")\n', 'python3 py/saluto.py'],
    ['python3 py/rotto.py', '@nano py/rotto.py|frase = "chi controlla i computer controlla la citta"\nparole = frase.split()\nif len(parole) > 5:\n    print("Frase lunga")\nprint("Parole:", len(parole))\n', 'python3 py/rotto.py'],
  ],
  'chPY-m2': [
    ['@nano py/porte.py|aperte = [22, 80, 443, 21, 3389, 23, 8080]\nrischiose = {21: "FTP", 23: "Telnet", 445: "SMB", 3389: "RDP"}\nfor p in aperte:\n    if p in rischiose:\n        print(f"ATTENZIONE: porta {p} ({rischiose[p]})")\n', 'python3 py/porte.py'],
    ['@nano py/cvss.py|def gravita(punteggio):\n    if punteggio >= 9.0:\n        return "critica"\n    elif punteggio >= 7.0:\n        return "alta"\n    elif punteggio >= 4.0:\n        return "media"\n    elif punteggio > 0:\n        return "bassa"\n    return "nessuna"\n\nfor p in [9.8, 7.5, 5.3, 2.1, 0.0, 9.0, 7.0, 4.0]:\n    print(p, gravita(p))\n', 'python3 py/cvss.py'],
  ],
  'chPY-m3': [
    ['@nano py/falliti.py|conta = 0\nwith open("caso/auth.log") as f:\n    for riga in f:\n        if "Failed password" in riga:\n            conta += 1\nprint(conta)\n', 'python3 py/falliti.py'],
    ['@nano py/top_ip.py|from collections import Counter\nconta = Counter()\nwith open("caso/auth.log") as f:\n    for riga in f:\n        if "Failed password" in riga:\n            parti = riga.split()\n            conta[parti[parti.index("from") + 1]] += 1\nfor ip, n in conta.most_common(3):\n    print(ip, n)\n', 'python3 py/top_ip.py', 'flag 203.0.113.77'],
    ['@nano py/ip_unici.py|import re, sys\nwith open(sys.argv[1]) as f:\n    testo = f.read()\nprint(len(set(re.findall(r"\\d+\\.\\d+\\.\\d+\\.\\d+", testo))))\n', 'python3 py/ip_unici.py web/negozio.log'],
  ],
  'chPY-m4': [
    ['@nano py/verifica.py|import hashlib\nwith open("py/manifesto.txt") as m:\n    for riga in m:\n        atteso, nome = riga.split()\n        with open("py/aggiornamenti/" + nome, "rb") as f:\n            vero = hashlib.sha256(f.read()).hexdigest()\n        print(nome, "OK" if vero == atteso else "MANOMESSO")\n', 'python3 py/verifica.py'],
    ['@nano py/pubblici.py|import json\nwith open("py/storage.json") as f:\n    elenco = json.load(f)\nfor s in elenco:\n    if "*" in s["lettori"]:\n        print(s["nome"])\n', 'python3 py/pubblici.py'],
    ['@nano py/controlla.py|with open("py/da_controllare.txt") as e:\n    for p in e:\n        p = p.strip()\n        try:\n            with open(p) as f:\n                print(p, len(f.readlines()))\n        except FileNotFoundError:\n            print(p, "non trovato")\n        except PermissionError:\n            print(p, "permesso negato")\n', 'python3 py/controlla.py'],
  ],
  'chPT-m1': [['cat pentest/regole.txt', 'flag 10.20.0.122']],
  'chPT-m2': [['nmap -sV range.lan', 'flag 4'], ['curl http://range.lan/robots.txt', 'flag /old/'], ['curl http://range.lan/old/', 'curl http://range.lan/old/config.php.save', 'flag webapp']],
  'chPT-m3': [
    ['cve jenkins 2.150', 'flag CVE-2077-1188'],
    ['ssh webapp@range.lan'],
    ['sudo -l', 'flag /usr/bin/vim'],
    ['cat /etc/crontab', 'ls -l /opt/backup/backup.sh', 'flag /opt/backup/backup.sh', 'exit'],
  ],
  'chPT-m4': [
    ['@nano pentest/report.md|# Report\n## Problemi\n- Jenkins esposto (CVE-2077-1188): critica\n- password in /old/config.php.save riusata per SSH: alta\n- sudo vim per webapp: alta\n## Raccomandazioni\n'],
    ['nmap -sV range2.lan', 'curl http://range2.lan/old/', 'flag 3306'],
    ['ssh verifica@range2.lan', 'cat /etc/sudoers.d/webapp', 'ls -l /opt/backup/backup.sh', 'flag /opt/backup/backup.sh', 'exit'],
  ],
  'ch09-m5': [
    ['grep BLOCK rete/difese/proxy.log | grep malware', 'flag 10.0.3.44'],
    ['grep -c "Priority: 1" rete/difese/ids.log', 'flag 3'],
    ['cat rete/difese/locale.rules', 'flag 8443'],
  ],
  'ch08-m5': [
    ['cat ir/allarme.txt'],
    ['cat ir/*.log | sort | grep 198.51.100.23', 'flag 02:09:41'],
    ['grep 198.51.100.23 ir/web.log', 'flag /uploads/avatar.php'],
    ['grep -i cron ir/processi.log', 'flag /etc/cron.d/php-sess'],
    ['@nano ir/report.md|# Report\n## Causa\nIl modulo di upload della foto profilo accettava file PHP.\n'],
  ],
  'chDF-m1': [['cat forense/custodia.txt'], ['sha256sum forense/copie/*.img', 'flag copia-b.img']],
  'chDF-m2': [
    ['file forense/estratti/*', 'flag sfondo_mare.jpg'],
    ['strings forense/estratti/sfondo_mare.jpg', 'flag sync.kiroshi-cdn.nc'],
    ['sha256sum forense/estratti/sfondo_mare.jpg', 'flag NightCrawler'],
  ],
  'chDF-m3': [
    ['sort forense/timeline.csv | grep www-data', 'flag /tmp/.x/kworker'],
    ['grep php-sess forense/timeline.csv', 'flag 2077'],
    ['cat forense/www-data/.bash_history', 'flag files.pastebox.nc'],
  ],
  'ch08-m1': [
    ['head -n 5 siem/eventi.log'],
    ['grep LOGIN_FAIL siem/eventi.log | cut -d " " -f 5 | sort | uniq -c', 'flag 192.0.2.44'],
    ['grep 192.0.2.44 siem/eventi.log | grep LOGIN_FAIL | cut -d " " -f 4 | sort | uniq | wc -l', 'flag 15'],
    ['grep 192.0.2.44 siem/eventi.log | grep LOGIN_OK', 'flag sara'],
  ],
  'ch08-m2': [],
  'ch08-m3': [
    ['cat intel/bollettino.txt'],
    ['grep update-checker.top siem/dns.log', 'grep -c update-checker.top siem/dns.log', 'flag pc-reception'],
    ['sha256sum siem/allegati/*', 'flag fattura_2077_118.pdf.js'],
  ],
  'ch09-m1': [['ip neigh', 'flag 02:4e:43:00:00:01'], ['ip route']],
  'ch09-m2': [['ipcalc 192.168.1.50/24', 'ipcalc 10.0.0.0/26', 'flag 62'], ['ipcalc 192.168.1.128/25', 'flag no']],
  'ch09-m3': [
    ['tcpdump -r rete/cattura.txt'],
    ['grep -i password rete/cattura.txt', 'flag http'],
    ['grep "Flags [S]," rete/cattura.txt | cut -d " " -f 3 | sort | uniq -c', 'flag 192.168.1.66'],
  ],
  'ch09-m4': [['ssh-keygen', 'ls -l ~/.ssh', 'flag 600']],
  'ch10-m1': [['whois neonottica.nc', 'flag it@neonottica.nc']],
  'ch10-m2': [['dig neonottica.nc MX', 'dig neonottica.nc TXT'], ['crtsh neonottica.nc', 'dig dev-old.neonottica.nc A', 'flag dev-old.neonottica.nc']],
  'ch10-m3': [['exiftool osint/catalogo_2077.pdf', 'flag srv-file01']],
  'ch10-m4': [
    ['cat osint/servizi.txt', 'cve apache 2.4.57', 'cve roundcube 1.6.2', 'cve fortivpn 7.0.1', 'cve wordpress 5.2.4'],
    ['flag dev-old.neonottica.nc'],
  ],
  'ch11-m1': [],
  'ch11-m2': [
    ['ssh studente@lab.lan', 'cat LEGGIMI.txt'],
    ['sudo -l', 'flag find'],
    ['find / -perm -4000 2>/dev/null', 'flag /usr/local/bin/backup-tool'],
    ['find /opt -name "*.ini"', 'cat /opt/app/config.ini', 'flag Labirinto!42'],
  ],
  'ch11-m3': [
    ['ssh studente@lab.lan', 'ss -tlnp', 'flag telnet'],
    ['apt list --upgradable | grep -c security', 'flag 3'],
    ['@nano sshd_config.proposta|Port 22\nPermitRootLogin no\nPasswordAuthentication no\nX11Forwarding no\n'],
  ],
  'ch11-m4': [['ssh studente@lab.lan', 'grep Labirinto /opt/app/config.ini /opt/report/report.ini', 'flag /opt/report/report.ini']],
  'ch12-m1': [['Get-Content windows/ad_gruppi.txt']],
  'ch12-m2': [['Get-Content windows/ad_gruppi.txt', 'flag stagista']],
  'ch12-m3': [
    ['grep -c ",4625," windows/security.csv', 'flag 8'],
    ['grep ",4624," windows/security.csv', 'flag a.bassi'],
    ['Select-String a.bassi windows/security.csv', 'flag helpdesk2'],
  ],
  'ch13-m1': [['cat cloud/bucket-policy.json', 'flag neonottica-scontrini-2077'], ['ls -a cloud/repo', 'grep AKIA cloud/repo/.env', 'flag .env']],
  'ch13-m2': [["alias falliti='grep \"Failed password\" caso/auth.log'", 'falliti | wc -l'], ['cheat soc']],
  'ch13-m3': [],
  'ch13-m4': [['@nano report.md|# Sintesi\nAudit della cassa.\nRischio alto.\n# Risultati principali\n- sudo less\n- FTP aperto\n# Raccomandazioni\n1. togliere la regola sudo\n2. spegnere FTP\n']],
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
              expect(errs, `"${cmd}" ha prodotto errori inattesi`).toEqual(errs.filter((e) => /Permission denied|command not found|not in the sudoers|need to be root/.test(e) || ['cat /etc/shadow', 'cd /root', 'Whoami', 'sha256sum -c SHA256SUMS', 'find / -name passwd 2>/dev/null', 'nmap helix.corp', 'python3 py/rotto.py'].includes(cmd)));
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
