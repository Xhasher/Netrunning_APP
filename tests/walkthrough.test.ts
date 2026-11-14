import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/content';
import { buildWorld } from '../src/content/world';
import { evaluate } from '../src/game/logic';
import { DOCM_HASH } from '../src/content/chSOC-turno';

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
  'ch02-m4': [['ip route', 'flag 192.168.1.1'], ['ping -c 2 192.168.1.1'], ['nslookup cassa.lan', 'flag 192.168.1.30'], ['ping -c 2 cassa.lan'], ['nc -zv cassa.lan 443'], ['curl -I http://jukebox.lan', 'flag 200'], ['traceroute 8.8.8.8', 'flag 4'], ['ss -tlnp', 'flag 22']],
  'ch05-m4': [
    ["awk '{print $1}' web/access.log"],
    ["awk '{print $1}' web/access.log | sort | uniq -c | sort -rn | head -n 3", 'flag 203.0.113.50'],
    ["awk '$9 == 404' web/access.log | wc -l", 'flag 12'],
    ["awk -F: '$3 >= 1000 {print $1}' /etc/passwd", 'flag 2'],
    ["sed -E 's/192\\.168\\.1\\.[0-9]+/IP-INTERNO/g' web/access.log > web/access_anon.log"],
    ["ps aux | tr -s ' ' | cut -d ' ' -f 1 | sort | uniq -c", 'flag 3'],
    ["grep ' 404 ' web/access.log | tee ~/errori404.txt | wc -l"],
    ['find ~/caso ~/web -name "*.log" | xargs wc -l', 'flag 89'],
    ['diff testo/sshd_config.ieri testo/sshd_config.oggi', 'flag PermitRootLogin yes'],
  ],
  'chSOC-m1': [
    ['cat soc/LEGGIMI.txt'],
    ['grep -cE "^A[0-9]" soc/coda.csv', 'flag 14'],
    ['cut -d, -f3 soc/coda.csv | sort | uniq -c | sort -rn', 'flag Accesso fallito ripetuto'],
    ['grep "Accesso fallito" soc/coda.csv', 'flag 45.155.205.33'],
    ['grep critica soc/coda.csv', 'cat soc/asset.txt', 'flag A09'],
  ],
  'chSOC-m2': [
    ['grep k.tanaka soc/vpn.log', 'grep k.tanaka soc/trasferte.txt', 'flag falso positivo'],
    ['grep 10.0.3.5 soc/manutenzioni.txt', 'flag benigno'],
    ['cat soc/edr-PC-AMM-07.txt', 'flag fattura_novembre.docm'],
    ['grep r.costa rete/difese/proxy.log', 'flag 5'],
  ],
  'chSOC-m3': [
    ['cat soc/playbook-malware.txt', 'flag L2'],
    ['grep sha256 soc/edr-PC-AMM-07.txt > soc/escalation-A05.txt'],
    ['echo "ALLARMI: A05 A06  HOST: PC-AMM-07  UTENTE: r.costa  ORA: 09:01" >> soc/escalation-A05.txt', 'echo "IOC: fattura_novembre.docm cdn-upd4te.nc  RICHIESTA: isolare PC-AMM-07" >> soc/escalation-A05.txt'],
    ['grep adm.temp soc/manutenzioni.txt', 'flag no'],
  ],
  'chSOC-m4': [
    ['@nano soc/consegne.txt|APERTI\n A05+A06 PC-AMM-07 (L2)\n A09 DC-01 (L2)\nCHIUSI\n A02 FP\nDA SORVEGLIARE\n 45.155.205.33\n'],
    ['cat soc/consegne.txt'],
  ],
  'chPT-m5': [
    ['nmap deposito.lan', 'flag 3'],
    ['nmap -p- deposito.lan', 'flag 27017'],
    ['nmap -sV -p 27017 deposito.lan', 'flag mongodb'],
    ['sudo nmap -O contab.lan', 'flag windows'],
    ['nmap -sC -p 21,80 deposito.lan', 'flag backup_inventario.sql'],
    ['nmap --script vuln -sV -p- deposito.lan', 'flag CVE-2077-2702'],
    ['sudo nmap -A -p- -oN ~/deposito_nmap.txt deposito.lan'],
  ],
  'ch12-m4': [
    ['pwsh'],
    ['Get-ChildItem windows'],
    ['Get-ChildItem -Recurse -Filter *.log | Sort-Object Length -Descending | Select-Object -First 1', 'flag auth.log'],
    ['Get-Content windows/security.csv | Select-String 4625 | Measure-Object', 'flag 8'],
    ['Get-Process | Sort-Object WS -Descending | Select-Object -First 3', 'flag pwsh'],
  ],
  'ch12-m5': [
    ['pwsh', 'Enter-PSSession -ComputerName PC-AMM-07'],
    ['Get-Process | Sort-Object CPU -Descending | Select-Object -First 5', 'flag powershell'],
    ['Get-Process -Name powershell | Format-List *', 'flag WINWORD'],
    ['Get-NetTCPConnection -State Established', 'flag 198.51.100.200'],
    ["Get-ScheduledTask | Where-Object { $_.Author -ne 'Microsoft Corporation' }", 'flag OneDriveSync'],
    ['Get-ScheduledTask -TaskName OneDriveSync | Format-List', 'Get-Content C:\\Users\\r.costa\\AppData\\Roaming\\Microsoft\\sync.ps1', 'flag 300'],
    ['Get-LocalGroupMember -Group Administrators', 'flag supporto'],
    ["Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4720}", 'flag 09:04'],
    ['Get-FileHash C:\\Users\\r.costa\\Downloads\\fattura_novembre.docm', '@hash'],
    ['Disable-ScheduledTask -TaskName OneDriveSync'],
    ['Stop-Process -Id 4588'],
    ['Disable-LocalUser -Name supporto'],
  ],
  'chSJ-m1': [
    ["awk -F, '$4 == \"cessato\" && $5 == \"attivo\"' settimana/utenti.csv", 'flag 2'],
    ["awk -F, '$6 == \"admin\" && $7 == \"no\" && $5 == \"attivo\"' settimana/utenti.csv", 'flag p.ivanova'],
    ['grep servizio settimana/utenti.csv', 'flag svc.backup'],
    ['echo "g.bianchi t.moretti: disattivare" >> settimana/accessi.txt', 'echo "p.ivanova: MFA; svc.backup: verificare" >> settimana/accessi.txt'],
  ],
  'chSJ-m2': [
    ['nmap --script vuln -sV -oN settimana/range.txt range.lan'],
    ['grep CVSS settimana/range.txt', 'flag CVE-2077-1188'],
    ['cat settimana/esposizione.txt', 'flag si'],
    ['cve jenkins 2.440', 'flag no'],
  ],
  'chSJ-m3': [
    ['grep 4625 settimana/eventi.csv | cut -d, -f4 | sort -u | wc -l', 'flag 7'],
    ['grep 4624 settimana/eventi.csv | grep 10.0.7.12', 'flag f.romano'],
    ['grep 5140 settimana/eventi.csv', 'flag 2'],
    ['grep 10.0.7.12 settimana/dhcp.log', 'flag MAG-PC-03'],
  ],
  'chSJ-m4': [
    ["sed -e 's/PermitRootLogin yes/PermitRootLogin no/' -e 's/PasswordAuthentication yes/PasswordAuthentication no/' -e 's/MaxAuthTries 10/MaxAuthTries 3/' -e 's/X11Forwarding yes/X11Forwarding no/' settimana/sshd_config > settimana/sshd_config.nuovo"],
    ['diff settimana/sshd_config settimana/sshd_config.nuovo'],
    ['chmod 600 settimana/id_backup'],
  ],
  'chSJ-m5': [
    ['@nano settimana/report.md|# Weekly report\n## Summary\nPassword spraying compromised f.romano.\n## Findings\n- g.bianchi, t.moretti active; p.ivanova no MFA\n- CVE-2077-1188 on range.lan\n- PermitRootLogin yes on SRV-WEB-01\n## Recommendations\n- MFA for admins\n'],
  ],
  'chAM-m1': [['uname -r', 'flag 6.8.0-nightos'], ['uptime', 'flag 3'], ['free -h', 'flag 2.5Gi'], ['df -h', 'flag /var'], ['which nmap', 'flag /usr/bin/nmap']],
  'chAM-m2': [
    ['systemctl --failed', 'flag nginx'],
    ['systemctl status nginx'],
    ['journalctl -u nginx', 'flag server_nmae'],
    ['journalctl -g negozio', 'flag luca'],
    ['@sudonano /etc/nginx/sites-enabled/negozio|server {\n    listen 80;\n    server_name negozio.lan;\n    root /var/www/negozio;\n    index index.html;\n\n    location / {\n        try_files $uri $uri/ =404;\n    }\n}\n'],
    ['sudo nginx -t'],
    ['sudo systemctl restart nginx', 'systemctl is-active nginx'],
  ],
  'chAM-m3': [['journalctl -p err', 'flag backup.sh'], ['journalctl -p warning', 'flag /var'], ['journalctl --since 03:00 --until 04:00', 'flag 45.155.205.33'], ['last', 'flag 192.168.1.50'], ['sudo lastb', 'flag 6']],
  'chAM-m4': [
    ['df -h /var', 'flag 96%'],
    ['du -sh /var/log/* | sort -h', 'flag app'],
    ['ls -lhS /var/log/app', 'flag debug.log'],
    ['grep debug.log /etc/crontab', 'flag /opt/app/esporta.sh'],
    ['tar -czf ~/debug-20771112.tgz /var/log/app/debug.log'],
    ['tar -tzf ~/debug-20771112.tgz'],
    ['@sudonano /etc/crontab|# /etc/crontab\n17 *  * * *  root  cd / && run-parts --report /etc/cron.hourly\n15 1,13 * * *  root  /usr/local/bin/backup.sh\n*/5 * * * *  root  /opt/app/esporta.sh >> /var/log/app/debug.log\n'],
  ],
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
        // i passi aggiunti dopo (since) portano con sé la loro soluzione
        expect(tasks.filter((t) => !t.since).length).toBe(solutions.length);
        let k = 0;
        const sol = tasks.map((t) => (t.since ? (t.solve ?? []) : solutions[k++]));

        tasks.forEach((step, i) => {
          let passed = false;
          for (const cmd of sol[i]) {
            // "@nano FILE|contenuto" simula l'editor: scrive il file ed emette l'evento "saved"
            let events;
            if (cmd.startsWith('@nano ') || cmd.startsWith('@sudonano ')) {
              const root = cmd.startsWith('@sudonano ');
              const rest = cmd.slice(root ? 10 : 6);
              const file = rest.slice(0, rest.indexOf('|'));
              const content = rest.slice(rest.indexOf('|') + 1);
              const path = sh.abs(file);
              expect(sh.writeText(path, content.replace(/\\n/g, '\n'), false, root)).toBeNull();
              events = [{ type: 'saved' as const, path }];
            } else {
              const res = sh.run(cmd === '@hash' ? `flag ${DOCM_HASH.slice(0, 8)}` : cmd);
              events = res.events;
              const errs = res.lines.filter((l) => l.cls === 'err').map((l) => l.text);
              expect(errs, `"${cmd}" ha prodotto errori inattesi`).toEqual(errs.filter((e) => /Permission denied|command not found|not in the sudoers|need to be root/.test(e) || ['cat /etc/shadow', 'cd /root', 'Whoami', 'sha256sum -c SHA256SUMS', 'find / -name passwd 2>/dev/null', 'nmap helix.corp', 'python3 py/rotto.py'].includes(cmd)));
            }
            const out = evaluate(step, events, sh);
            expect(out, `"${cmd}" non dovrebbe dare risposta errata (${step.title})`).not.toBe('wrong-answer');
            if (out === 'pass') passed = true;
          }
          expect(passed, `passo "${step.title}" non superato con: ${sol[i].join(' ; ')}`).toBe(true);
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
