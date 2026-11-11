// Il "deck": il computer virtuale del giocatore, con tutti i file usati dalle missioni.

import { createNetwork } from '../engine/network';
import { Shell } from '../engine/shell';
import { Vfs } from '../engine/vfs';

export const HOSTNAME = 'deck';

export function buildWorld(user: string, hint?: () => string | null): Shell {
  const fs = new Vfs();
  const home = `/home/${user}`;
  const mine = { owner: user, group: user };

  // --- struttura di sistema (semplificata, ma con i nomi veri di Linux)
  for (const d of ['/bin', '/usr/bin', '/usr/share', '/var/log', '/tmp', '/opt', '/dev', '/proc'])
    fs.mkdirp(d);
  fs.mkdirp('/tmp', { perms: 'rwxrwxrwt' });
  fs.mkdirp('/root', { perms: 'rwx------', locked: true });
  fs.writeFile('/root/segreti.txt', 'Non dovresti essere qui.', { perms: 'rw-------', locked: true });

  for (const b of ['bash', 'cat', 'ls', 'pwd', 'echo', 'grep', 'ping', 'ip'])
    fs.writeFile(`/bin/${b}`, '\u007fELF (programma binario: non leggibile come testo)', { perms: 'rwxr-xr-x' });
  fs.writeFile('/usr/bin/nmap', '\u007fELF (programma binario: non leggibile come testo)', { perms: 'rwxr-xr-x' });

  fs.writeFile('/etc/hostname', `${HOSTNAME}\n`);
  fs.writeFile(
    '/etc/os-release',
    [
      'PRETTY_NAME="NightOS 2077 (basato su Debian GNU/Linux)"',
      'NAME="NightOS"',
      'VERSION_ID="2077"',
      'ID=nightos',
      'ID_LIKE=debian',
    ].join('\n'),
  );
  fs.writeFile(
    '/etc/passwd',
    [
      'root:x:0:0:root:/root:/bin/bash',
      'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
      'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
      `${user}:x:1000:1000:Edgerunner:/home/${user}:/bin/bash`,
    ].join('\n'),
  );
  fs.writeFile(
    '/etc/hosts',
    ['127.0.0.1\tlocalhost', '192.168.1.50\tdeck.lan deck', '192.168.1.1\tgateway.lan gateway'].join('\n'),
  );
  fs.writeFile(
    '/etc/motd',
    'Benvenuto su NightOS. Ricorda: entra solo dove sei autorizzato.\n',
  );
  fs.writeFile(
    '/var/log/syslog',
    [
      'Nov 11 21:00:01 deck systemd[1]: Started Daily apt download activities.',
      'Nov 11 21:02:13 deck kernel: eth0: link up, 1000Mbps, full-duplex',
      `Nov 11 21:04:00 deck login[402]: session opened for user ${user}`,
    ].join('\n'),
  );

  // --- la home del giocatore
  fs.mkdirp(home, mine);
  fs.writeFile(
    `${home}/README.txt`,
    [
      `Ciao ${user}.`,
      '',
      'Questo è il tuo deck: il tuo computer personale.',
      'Tutto quello che c\'è qui dentro è un addestramento simulato:',
      'nessun comando tocca sistemi reali.',
      '',
      'Le tue missioni sono nella cartella "missioni".',
      '                                         -- Nyx',
    ].join('\n'),
    mine,
  );
  fs.writeFile(
    `${home}/.bash_history`,
    '# qui la shell salva la cronologia dei comandi\n',
    { ...mine, perms: 'rw-------' },
  );
  fs.writeFile(`${home}/.profile`, '# impostazioni personali della shell\nexport EDITOR=nano\n', mine);

  // Capitolo 01 — missione "Leggere i file"
  fs.mkdirp(`${home}/missioni`, mine);
  fs.writeFile(
    `${home}/missioni/benvenuto.txt`,
    [
      '===============================',
      '  NIGHT CITY // MESSAGGIO CRIPTATO DECIFRATO',
      '===============================',
      '',
      'Se stai leggendo questo, hai imparato a usare cat.',
      'Ottimo inizio, choom.',
      '',
      'Regola numero uno dei runner: non tutto quello che conta',
      'è in bella vista. In questa stessa cartella c\'è un file',
      'che "ls" da solo non ti mostra...',
      '',
      '                                         -- Nyx',
    ].join('\n'),
    mine,
  );
  fs.writeFile(
    `${home}/missioni/.nota_segreta`,
    [
      'Bravo. I file che iniziano con un punto sono "nascosti".',
      'Non è sicurezza: è solo ordine. Chiunque usi ls -a li vede.',
      '',
      'Ecco la tua prima flag:',
      '',
      '    NC{v3d0_l_1nv1s1b1l3}',
      '',
      'Inviala con il comando:  flag NC{v3d0_l_1nv1s1b1l3}',
    ].join('\n'),
    mine,
  );
  fs.writeFile(`${home}/missioni/lista_spesa.txt`, 'synth-caffè\nnoodles\nbatterie per il cyberdeck\n', mine);

  // Capitolo 01 — missione finale "Il primo contratto"
  const rook = `${home}/contratti/rook`;
  fs.writeFile(
    `${rook}/brief.txt`,
    [
      'Da: Rook (fixer)',
      'Oggetto: lavoretto facile',
      '',
      'Ho fatto arrivare tre consegne nel tuo deck: consegna_a, consegna_b, consegna_c.',
      'Una sola contiene il codice d\'accesso per il prossimo lavoro.',
      'Le altre sono esche.',
      '',
      'Un consiglio: chi nasconde le cose a Night City usa il doppio fondo.',
      'Trova il codice e mandamelo con "flag".',
      '',
      '-- R.',
    ].join('\n'),
    mine,
  );
  fs.writeFile(`${rook}/consegna_a/pacco.txt`, 'Dentro ci sono solo trucioli di polistirolo.\nNiente da vedere.\n', mine);
  fs.writeFile(`${rook}/consegna_a/ricevuta.txt`, 'Ricevuta n. 2077-A. Pagato in eurodollari.\n', mine);
  fs.writeFile(`${rook}/consegna_b/pacco.txt`, 'Un vecchio chip rotto. Sembra inutile...\nMa il pacco è stranamente pesante.\n', mine);
  fs.writeFile(
    `${rook}/consegna_b/.doppiofondo/codice.txt`,
    'CODICE D\'ACCESSO: NC{d0pp10_f0nd0}\n',
    mine,
  );
  fs.writeFile(`${rook}/consegna_c/pacco.txt`, 'Un biglietto: "Ti hanno fregato, choom."\n', mine);
  fs.writeFile(`${rook}/consegna_c/.vuota`, '', mine);

  // Capitolo 02 — reti
  fs.writeFile(
    `${home}/rete/scope.txt`,
    [
      '=== CONTRATTO DI PENETRATION TEST ===',
      'Cliente:       Bar "Lo Scantinato", Watson, Night City',
      'Committente:   Mama Reyes (proprietaria)',
      'Esecutore:     ' + user,
      '',
      'PERIMETRO AUTORIZZATO (scope):',
      '  - rete 192.168.1.0/24 (rete interna del bar)',
      '',
      'FUORI SCOPE (vietato toccare):',
      '  - qualsiasi indirizzo fuori da 192.168.1.0/24',
      '  - helix.corp e ogni sistema di terze parti',
      '',
      'Attività permesse: ricognizione, scansione delle porte.',
      'Attività NON permesse: attacchi che interrompano il servizio.',
      '',
      'Firmato: M. Reyes        Data: 11/11/2077',
    ].join('\n'),
    mine,
  );

  return new Shell({ user, host: HOSTNAME, fs, net: createNetwork(), hint });
}
