import type { Chapter, Mission, PlannedChapter } from '../game/types';
import { CH01 } from './ch01-terminale';
import { CH02 } from './ch02-reti';
import { CH03 } from './ch03-linux';
import { CH04 } from './ch04-soc';
import { CH05 } from './ch05-script';
import { CH06 } from './ch06-cripto';
import { CH07 } from './ch07-web';
import { CH08 } from './ch08-blue';
import { CH09 } from './ch09-reti';
import { CH10 } from './ch10-osint';
import { CH11 } from './ch11-hardening';
import { CH12 } from './ch12-windows';
import { CH13 } from './ch13-carriera';
import { CHF } from './chF-fondamenti';
import { OWASP_MISSIONS, PHISHING_MISSION } from './ch07-owasp';
import { CHDF, IR_MISSION } from './ch-ir-forense';
import { CHPY } from './chPY-python';
import { CHPT } from './chPT-pentest';
import { addSchede } from './schede';

export const CHAPTERS: Chapter[] = [CH01, CHF, CH02, CH03, CH04, CH05, CH06, CHPY, CH07, CH08, CH09, CH10, CH11, CHPT, CH12, CHDF, CH13];

CH07.missions.push(...OWASP_MISSIONS);
CH08.missions.push(PHISHING_MISSION, IR_MISSION);

addSchede(CHAPTERS);

/** Il resto del corso: capitoli pianificati, mostrati nella mappa come "in arrivo". */
/** Capitoli futuri, mostrati nella mappa come "in arrivo" (al momento il corso è completo). */
export const PLANNED: PlannedChapter[] = [];

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
