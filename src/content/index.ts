import type { Chapter, Mission, PlannedChapter } from '../game/types';
import { CH01 } from './ch01-terminale';
import { CH02 } from './ch02-reti';
import { CH03 } from './ch03-linux';
import { CH04 } from './ch04-soc';
import { CH05 } from './ch05-script';
import { CH06 } from './ch06-cripto';
import { CH07 } from './ch07-web';
import { CH08 } from './ch08-blue';

export const CHAPTERS: Chapter[] = [CH01, CH02, CH03, CH04, CH05, CH06, CH07, CH08];

/** Il resto del corso: capitoli pianificati, mostrati nella mappa come "in arrivo". */
export const PLANNED: PlannedChapter[] = [
  {
    code: '09',
    title: 'Reti avanzate',
    subtitle: 'Il modello OSI e il traffico vero',
    topics: ['modello OSI e TCP/IP', 'subnetting', 'analizzare il traffico con Wireshark e tcpdump', 'SSH, chiavi e tunnel', 'VPN e segmentazione'],
  },
  {
    code: '10',
    title: 'Ricognizione e OSINT',
    subtitle: 'Raccogliere informazioni prima di agire',
    topics: ['OSINT: fonti pubbliche', 'DNS e sottodomini', 'nmap avanzato', 'vulnerabilità note: CVE e CVSS', 'come proteggere la propria impronta pubblica'],
  },
  {
    code: '11',
    title: 'Dall\'accesso al controllo',
    subtitle: 'Come avanza un attaccante, e come fermarlo',
    topics: ['la kill chain e MITRE ATT&CK', 'privilege escalation: le cause comuni', 'movimento laterale', 'hardening di Linux'],
  },
  {
    code: '12',
    title: 'Windows e Active Directory',
    subtitle: 'Dove vive il mondo aziendale',
    topics: ['basi di Windows e PowerShell', 'Active Directory', 'Windows Event Log', 'proteggere un dominio'],
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
