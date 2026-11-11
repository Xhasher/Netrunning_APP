import type { Chapter, Mission, PlannedChapter } from '../game/types';
import { CH01 } from './ch01-terminale';
import { CH02 } from './ch02-reti';

export const CHAPTERS: Chapter[] = [CH01, CH02];

/** Il resto del corso: capitoli pianificati, mostrati nella mappa come "in arrivo". */
export const PLANNED: PlannedChapter[] = [
  {
    code: '03',
    title: 'Linux in profondità',
    subtitle: 'Il sistema come lo vede un amministratore',
    topics: [
      'utenti, gruppi, /etc/passwd e /etc/shadow',
      'permessi: chmod, chown, SUID',
      'processi: ps, top, kill',
      'cercare: find, grep, pipe e redirezioni',
      'editor di testo: nano e vim',
      'pacchetti e servizi: apt, systemctl',
    ],
  },
  {
    code: '04',
    title: 'Scripting',
    subtitle: 'Automatizzare con Bash e Python',
    topics: ['variabili, cicli e condizioni in Bash', 'basi di Python', 'scrivere un piccolo port scanner', 'leggere e modificare exploit pubblici'],
  },
  {
    code: '05',
    title: 'Reti avanzate',
    subtitle: 'Il modello OSI e il traffico vero',
    topics: ['modello OSI e TCP/IP', 'subnetting', 'HTTP in dettaglio', 'catturare il traffico con Wireshark e tcpdump', 'SSH, chiavi e tunnel'],
  },
  {
    code: '06',
    title: 'Crittografia e password',
    subtitle: 'Hash, cifratura e attacchi alle credenziali',
    topics: ['codifica vs cifratura vs hash', 'cifratura simmetrica e asimmetrica, TLS', 'cracking di hash con John e Hashcat', 'brute force e password spraying', 'difese: password manager, MFA'],
  },
  {
    code: '07',
    title: 'Ricognizione e OSINT',
    subtitle: 'Raccogliere informazioni prima di agire',
    topics: ['OSINT: fonti pubbliche', 'enumerazione DNS e sottodomini', 'nmap avanzato e script NSE', 'cercare vulnerabilità note (CVE, Exploit-DB)'],
  },
  {
    code: '08',
    title: 'Web hacking',
    subtitle: 'OWASP Top 10, passo per passo',
    topics: ['come funziona un\'applicazione web', 'Burp Suite', 'SQL injection', 'XSS', 'autenticazione e controllo accessi difettosi', 'SSRF, upload di file, path traversal'],
  },
  {
    code: '09',
    title: 'Exploitation',
    subtitle: 'Dall\'accesso iniziale al controllo',
    topics: ['Metasploit', 'reverse shell e bind shell', 'privilege escalation su Linux', 'privilege escalation su Windows', 'movimento laterale'],
  },
  {
    code: '10',
    title: 'Windows e Active Directory',
    subtitle: 'Dove vive il mondo aziendale',
    topics: ['basi di Windows e PowerShell', 'Active Directory', 'Kerberos e NTLM', 'attacchi AD e come difendersi'],
  },
  {
    code: '11',
    title: 'Blue Team',
    subtitle: 'Difendere e rilevare',
    topics: ['hardening di Linux e Windows', 'firewall e segmentazione', 'log: syslog, auth.log, Windows Event Log', 'SIEM e regole di rilevamento', 'IDS: Suricata e Snort', 'MITRE ATT&CK'],
  },
  {
    code: '12',
    title: 'Incident Response e Forensics',
    subtitle: 'Rintracciare l\'intruso',
    topics: ['il ciclo dell\'incident response', 'analisi dei log e timeline', 'forensics di disco e memoria', 'analisi di base del malware', 'threat hunting e indicatori di compromissione'],
  },
  {
    code: '13',
    title: 'Cloud e carriera',
    subtitle: 'L\'ultimo tratto',
    topics: ['sicurezza cloud (AWS, Azure)', 'scrivere un report professionale', 'certificazioni e colloqui', 'portfolio e CTF'],
  },
];

export function allMissions(): Mission[] {
  return CHAPTERS.flatMap((c) => c.missions);
}

export function findMission(id: string): { chapter: Chapter; mission: Mission; index: number } | null {
  for (const chapter of CHAPTERS) {
    const index = chapter.missions.findIndex((m) => m.id === id);
    if (index >= 0) return { chapter, mission: chapter.missions[index], index };
  }
  return null;
}

/** Percorso consigliato fuori dal gioco: laboratori legali gratuiti e certificazioni. */
export const CAREER = {
  intro: `Questo gioco ti dà le basi e il metodo. Per diventare un professionista servono anche **ore di pratica su sistemi veri**, in laboratori legali costruiti apposta per essere attaccati. Ecco un percorso realistico, con risorse **gratuite** o quasi.`,
  phases: [
    {
      title: 'Fase 1 · Fondamenta (0-6 mesi)',
      items: [
        ['OverTheWire: Bandit', 'gratis · il miglior allenamento di Linux da terminale, livello per livello'],
        ['TryHackMe (stanze gratuite)', 'gratis per molte stanze · percorsi "Pre Security" e "Intro to Cyber"'],
        ['Professor Messer: Network+ e Security+', 'gratis · video corsi completi su reti e sicurezza'],
        ['Installa Linux', 'gratis · usa Ubuntu o Kali in una macchina virtuale (VirtualBox)'],
      ],
    },
    {
      title: 'Fase 2 · Attacco e difesa (6-12 mesi)',
      items: [
        ['PortSwigger Web Security Academy', 'gratis · il miglior corso di web hacking esistente'],
        ['picoCTF', 'gratis · CTF per principianti, sempre disponibile'],
        ['HackTheBox (macchine gratuite)', 'gratis per le macchine attive · Starting Point per iniziare'],
        ['Blue Team Labs Online / LetsDefend / CyberDefenders', 'livelli gratuiti · analisi di log e incidenti'],
        ['VulnHub', 'gratis · macchine vulnerabili da scaricare e attaccare in locale'],
      ],
    },
    {
      title: 'Fase 3 · Certificazioni (12-24 mesi)',
      items: [
        ['CompTIA Security+', 'la più richiesta per entrare nel settore, molto utile per i ruoli SOC'],
        ['eJPT (INE)', 'certificazione pratica di penetration testing per junior'],
        ['BTL1 (Security Blue Team)', 'certificazione pratica per il ruolo di analista SOC'],
        ['OSCP (OffSec)', 'più avanti: lo standard per i pentester'],
      ],
    },
  ] as { title: string; items: [string, string][] }[],
  roles: [
    ['Analista SOC (Blue Team)', 'monitora gli allarmi e rileva le intrusioni. È il punto di ingresso più comune nel settore.'],
    ['Penetration Tester (Red Team)', 'attacca i sistemi dei clienti, su autorizzazione, e scrive report.'],
    ['Incident Responder', 'interviene durante un attacco, contiene i danni e ricostruisce cosa è successo.'],
    ['Security Engineer', 'progetta e configura le difese.'],
  ] as [string, string][],
  advice: `Consiglio da Nyx: il primo lavoro in sicurezza spesso è da **analista SOC** o in un ruolo IT (helpdesk, sistemista) che poi si sposta verso la sicurezza. Tieni un **portfolio**: scrivi brevi report delle macchine e delle CTF che risolvi, su GitHub o su un blog. Ai colloqui conta tantissimo far vedere che sai spiegare quello che hai fatto.`,
};
