// Missione PT.5: nmap fino in fondo. Due macchine di laboratorio, nel perimetro del
// contratto di Kang Tao, per salire dai livelli base di nmap a quelli avanzati:
// tutte le porte, versioni, sistema operativo, script NSE, -A e salvataggio del risultato.

import type { Shell } from '../engine/shell';
import type { Mission } from '../game/types';

export function addReconLab(sh: Shell): void {
  sh.net.hosts.push(
    {
      ip: '10.20.0.130',
      names: ['deposito.lan', 'deposito'],
      mac: '',
      pingable: true,
      latency: 2.4,
      ttl: 64,
      os: 'Linux 5.4 - 5.15',
      inScope: true,
      ports: [
        { port: 21, service: 'ftp', version: 'vsftpd 3.0.3', anon: ['backup_inventario.sql', 'LEGGIMI.txt'] },
        { port: 22, service: 'ssh', version: 'OpenSSH 8.2p1 Ubuntu 4ubuntu0.9' },
        { port: 80, service: 'http', version: 'nginx 1.18.0 (Ubuntu)', title: 'Deposito Kang Tao - Inventario' },
        { port: 27017, service: 'mongodb', version: 'MongoDB 4.0.3' },
      ],
    },
    {
      ip: '10.20.0.131',
      names: ['contab.lan', 'contab'],
      mac: '',
      pingable: false,
      latency: 3.1,
      ttl: 128,
      os: 'Microsoft Windows Server 2019',
      inScope: true,
      ports: [
        { port: 135, service: 'msrpc', version: 'Microsoft Windows RPC' },
        { port: 139, service: 'netbios-ssn', version: 'Microsoft Windows netbios-ssn' },
        { port: 445, service: 'microsoft-ds', version: 'Microsoft Windows Server 2019 microsoft-ds' },
        { port: 3389, service: 'ms-wbt-server', version: 'Microsoft Terminal Services' },
      ],
    },
  );
}


export const RECON_MISSION: Mission = {
  id: 'chPT-m5',
  title: 'nmap fino in fondo',
  tagline: 'Tutte le porte, il sistema operativo, gli script NSE, -A e un risultato salvato.',
  xp: 350,
  steps: [
    {
      kind: 'lesson',
      title: 'Gli otto livelli di nmap',
      body: `@nyx: Kang Tao ha esteso il contratto: nel perimetro ci sono anche due macchine del magazzino, \`deposito.lan\` e \`contab.lan\`. Le regole d'ingaggio sono le stesse: solo questi bersagli, solo in orario concordato.

@nyx: Fin qui hai usato nmap a metà. Ecco la scala completa:
1. \`-sn\` → chi è acceso (nessuna porta)
2. \`nmap HOST\` → le **1000 porte più comuni**
3. \`-p 22,80\` → solo le porte che dici tu
4. \`-sV\` → software e versione di ogni servizio
5. \`-p-\` → **tutte** le 65535 porte
6. \`-O\` → il **sistema operativo** (serve root)
7. \`-sC\` / \`--script\` → gli **script NSE**: controlli automatici su ogni servizio
8. \`-A\` → tutto insieme (-sV -sC -O), e \`-oN\` per salvare il risultato

!! Più sali, più la scansione è lunga e **rumorosa**: i sistemi di rilevamento la vedono. Ogni livello in più va usato su bersagli autorizzati, e annotato nel registro delle attività.`,
    },
    {
      kind: 'task',
      title: 'Livello 2: le porte comuni',
      body: `\`\`\`
nmap deposito.lan
\`\`\``,
      objective: 'Quante porte aperte mostra la scansione predefinita? Invia il numero con flag.',
      hints: ['Conta le righe con "open".', 'nmap deposito.lan e poi: flag 3'],
      answer: ['3'],
      success: 'FTP, SSH e HTTP. Sembra una macchina semplice. Ma nmap, senza indicazioni, ha controllato solo **1000 porte su 65535**: le più usate.',
    },
    {
      kind: 'task',
      title: 'Livello 5: tutte le porte',
      body: `\`-p-\` vuol dire "dalla 1 alla 65535":

\`\`\`
nmap -p- deposito.lan
\`\`\`

Ci mette molto di più (su una rete vera, minuti invece di secondi).`,
      objective: 'Quale porta era nascosta alla scansione predefinita? Invia il numero con flag.',
      hints: ['Confronta con la scansione di prima: c\'è una porta in più, con un numero alto.', 'nmap -p- deposito.lan e poi: flag 27017'],
      answer: ['27017'],
      success: 'La **27017**. I servizi su porte insolite sfuggono a chi si ferma alla scansione predefinita, e a volte sono proprio quelli dimenticati, senza protezioni.',
    },
    {
      kind: 'task',
      title: 'Livello 4: cos\'è?',
      body: `Chiedi la versione solo di quella porta:

\`\`\`
nmap -sV -p 27017 deposito.lan
\`\`\``,
      objective: 'Che servizio gira sulla porta 27017? Invia il nome (colonna SERVICE) con flag.',
      hints: ['-sV aggiunge la colonna VERSION; il nome del servizio è nella colonna SERVICE.', 'flag mongodb'],
      answer: ['mongodb', 'MongoDB'],
      success: '**MongoDB 4.0.3**, un database. Un database raggiungibile dalla rete è già una segnalazione; vedremo tra poco quanto è grave.',
    },
    {
      kind: 'lesson',
      title: 'Livello 6: il sistema operativo',
      body: `\`-O\` (la lettera O, da *OS*) indovina il sistema operativo da come la macchina risponde: il **TTL** dei pacchetti (64 Linux, 128 Windows, 255 apparati di rete), le opzioni TCP, l'ordine delle risposte. Per farlo nmap costruisce pacchetti "a mano", e questo richiede i privilegi di **root**:

\`\`\`
sudo nmap -O contab.lan
\`\`\`

Il risultato è una **stima**: nmap dice quanto ne è sicuro. Si conferma con altri indizi (i servizi aperti, i banner).`,
    },
    {
      kind: 'task',
      title: 'Che macchina è contab?',
      body: `Prova prima senza sudo, per vedere il messaggio, poi con sudo:

\`\`\`
nmap -O contab.lan
sudo nmap -O contab.lan
\`\`\``,
      objective: 'Quale famiglia di sistemi operativi gira su contab.lan? Inviala con flag (una parola).',
      hints: ['La riga "Running".', 'sudo nmap -O contab.lan e poi: flag windows'],
      answer: ['windows', 'microsoft windows', 'windows server', 'windows server 2019'],
      success: `**Windows Server 2019**. Era già intuibile dalle porte: 135, 139, 445 (condivisione file di Windows, SMB) e 3389 (desktop remoto, RDP). Nota anche che contab non risponde al ping: senza \`-Pn\` una scansione "veloce" avrebbe potuto darla per spenta.

!! SMB (445) e RDP (3389) esposti sono tra i bersagli preferiti dei ransomware: in un report vanno sempre evidenziati.`,
    },
    {
      kind: 'lesson',
      title: 'Livello 7: gli script NSE',
      body: `Il **Nmap Scripting Engine** (NSE) esegue piccoli programmi su ogni servizio trovato. Sono divisi in categorie:
- **default** (\`-sC\`): sicuri e utili, per esempio il titolo di una pagina web (\`http-title\`), le chiavi di un server SSH (\`ssh-hostkey\`), se un FTP accetta l'utente anonimo (\`ftp-anon\`)
- **vuln**: cercano vulnerabilità note confrontando le versioni (\`--script vuln\`)
- **intrusive**, **brute**...: provano davvero ad attaccare. Solo con un'autorizzazione esplicita.

\`\`\`
nmap -sC -p 21,80 deposito.lan
nmap --script vuln -sV deposito.lan
\`\`\`

L'output degli script compare sotto ogni porta, con le righe che iniziano con \`|\`.`,
    },
    {
      kind: 'task',
      title: 'Gli script predefiniti',
      body: `\`\`\`
nmap -sC -p 21,80 deposito.lan
\`\`\`

Leggi cosa ha trovato lo script \`ftp-anon\` sotto la porta 21.`,
      objective: 'Quale file con estensione .sql è visibile via FTP anonimo? Invia il nome con flag.',
      hints: ['Sotto 21/tcp, le righe di ftp-anon.', 'flag backup_inventario.sql'],
      answer: ['backup_inventario.sql'],
      success: `Il server FTP accetta **chiunque** senza password, e mostra un **backup del database**. È una vulnerabilità grave anche senza nessuna CVE: un errore di configurazione. Il titolo della pagina web (\`http-title\`) conferma invece che sul sito c'è il gestionale dell'inventario.

?? In un pentest ci si ferma qui: si annota che il file è leggibile, senza scaricarlo, a meno che le regole d'ingaggio non lo permettano.`,
    },
    {
      kind: 'task',
      title: 'Gli script di vulnerabilità',
      body: `\`\`\`
nmap --script vuln -sV deposito.lan
\`\`\`

Gli script di categoria vuln confrontano le versioni trovate con un elenco di vulnerabilità note.`,
      objective: 'Quale CVE riguarda il database? Invia l\'identificativo con flag.',
      hints: ['Cerca VULNERABLE sotto la porta 27017.', 'nmap --script vuln -sV -p- deposito.lan e poi: flag CVE-2077-2702'],
      answer: ['CVE-2077-2702'],
      success: `CVSS 9.1: il database accetta connessioni **senza autenticazione**. Con l'FTP anonimo, è la seconda segnalazione critica.

!! Ti sei accorto? Senza \`-p-\` lo script vuln non avrebbe nemmeno visto la porta 27017, e la vulnerabilità più grave sarebbe sfuggita. I livelli di nmap si combinano.`,
    },
    {
      kind: 'task',
      title: 'Livello 8: tutto, e salvato',
      body: `\`-A\` (*aggressive*) unisce -sV, -sC e -O. \`-oN FILE\` salva il risultato in un file di testo: in un pentest **ogni** scansione si salva, con data e comando, per il report e per dimostrare cosa hai fatto (e cosa no).

\`\`\`
sudo nmap -A -p- -oN ~/deposito_nmap.txt deposito.lan
\`\`\``,
      objective: 'Esegui una scansione completa di deposito.lan e salvala in ~/deposito_nmap.txt.',
      hints: ['-A richiede root (contiene -O). -oN e il nome del file.', 'sudo nmap -A -p- -oN ~/deposito_nmap.txt deposito.lan'],
      state: (sh) => {
        const f = sh.fs.get(`${sh.home}/deposito_nmap.txt`);
        return !!f && f.type === 'file' && f.content.includes('OS details') && f.content.includes('27017');
      },
      success: 'Il file contiene il comando, l\'ora, tutte le porte, le versioni, gli script e il sistema operativo. È la prima pagina degli allegati di un report di penetration test.',
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      skills: ['nmap'],
      question: 'Perché non si usa sempre `-p- -A` su tutto?',
      options: [
        'È lenta e rumorosa: su molte macchine impiega ore e fa scattare gli allarmi; si usa dove serve, dopo una prima scansione',
        'Perché -A non funziona sulle porte alte',
        'Perché è illegale anche con l\'autorizzazione',
        'Perché nasconde le porte comuni',
      ],
      correct: 0,
      explain: 'Il metodo tipico: -sn per gli host, scansione predefinita su tutti, poi -p- e -A solo sulle macchine interessanti. Il tempo del contratto è limitato.',
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      ex: 'interpreta',
      skills: ['nmap'],
      question: `Cosa ti dicono queste righe?

\`\`\`
21/tcp open  ftp
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_-rw-r--r--    1 0   0   4096 Nov 10 03:00 backup_inventario.sql
\`\`\``,
      options: [
        'Chiunque può entrare nell\'FTP senza password e vedere un backup del database',
        'L\'FTP è protetto da password',
        'Il file è stato cancellato',
        'Lo script ha attaccato il server',
      ],
      correct: 0,
      explain: 'Le righe con `|` sono l\'output dello script ftp-anon. "|_" segna l\'ultima riga del risultato. Lo script si è limitato a provare l\'accesso anonimo, come farebbe chiunque.',
    },
  ],
  recap: [
    ['nmap -p-', 'tutte le 65535 porte'],
    ['nmap -p 1-1000', 'un intervallo di porte'],
    ['sudo nmap -O', 'stima del sistema operativo (serve root)'],
    ['nmap -sC', 'script NSE predefiniti (sicuri)'],
    ['nmap --script vuln', 'cerca vulnerabilità note dalle versioni'],
    ['nmap -A', '-sV + -sC + -O (+ traceroute)'],
    ['nmap -oN FILE', 'salva il risultato in un file di testo'],
    ['TTL', '64 Linux, 128 Windows, 255 apparati di rete'],
    ['NSE', 'Nmap Scripting Engine: categorie default, vuln, intrusive, brute'],
  ],
};
