// Il lavoro in Italia, per percorso. Dati raccolti da fonti pubbliche il 16 novembre 2026.
//
// Regole: ogni cifra ha la sua fonte; si distingue tra dati generali, stime e annunci; niente
// offerte inventate. Le cifre sono RAL (retribuzione annua lorda) e vanno ricontrollate a ogni
// versione: il mercato cambia in fretta. Nessuna certificazione garantisce un'assunzione.

import type { TrackId } from '../game/orientation';

export const JOBS_CHECKED = '16 novembre 2026';

export interface Source {
  label: string;
  url: string;
}

export interface JobInfo {
  roles: string[];
  /** fascia RAL junior, come la riportano le fonti (null = nessun dato affidabile trovato) */
  junior: string | null;
  /** fasce oltre il livello junior, dove le fonti le danno */
  later?: string;
  /** tipo di dato: 'stima' (siti di benchmark e aggregatori), 'dati generali', 'annunci' */
  kind: string;
  noDegree: string;
  certs: string[];
  remote: string;
  sources: Source[];
}

export const JOBS: Record<TrackId, JobInfo> = {
  soc: {
    roles: ['SOC Analyst L1 (junior)', 'Cyber Security Analyst', 'poi: SOC L2, Threat Hunter, Incident Responder'],
    junior: '25.000–35.000 € (mediane tra 27.000 e 28.700 €)',
    later: 'livello intermedio: mediana circa 32.500–37.500 € (EgoValeo)',
    kind: 'stima da siti di benchmark e aggregatori; i campioni di Glassdoor e Jooble sono piccoli (9 e 18 stipendi)',
    noDegree: 'Il SOC è descritto come l\'ingresso più accessibile anche senza laurea. Molti posti junior li offrono i fornitori di servizi di sicurezza gestiti (MSSP), che coprono turni 24 ore su 24.',
    certs: ['CompTIA Security+ (base)', 'CompTIA CySA+ o Blue Team Level 1 (per distinguersi)'],
    remote: 'Esistono annunci da remoto (per esempio un Junior SOC Analyst da remoto con sede a Torino), ma i turni restano.',
    sources: [
      { label: 'EgoValeo, benchmark SOC Analyst 2026', url: 'https://it.egovaleo.com/ats-ev/salary-benchmark/soc-analyst-25/' },
      { label: 'TechCompenso, Cybersecurity Analyst in Italia', url: 'https://techcompenso.com/blog/cybersecurity-analyst-in-italia-cosa-fa-quanto-guadagna-e-come-iniziare-la-carriera' },
      { label: 'Glassdoor, Junior SOC Analyst', url: 'https://www.glassdoor.it/Stipendi/junior-soc-analyst-stipendio-SRCH_KO0,18.htm' },
    ],
  },
  pentest: {
    roles: ['Junior Penetration Tester', 'Vulnerability Assessment Analyst', 'Junior Offensive Security Engineer'],
    junior: '28.000–38.000 € (TechCompenso: 32.000–38.000 € fino a due anni; mediana 30.000 € sotto l\'anno, dato poco affidabile)',
    kind: 'stima da siti di benchmark; nessun osservatorio ufficiale trovato. Un annuncio reale visto (Satispay, ibrido): 35.000–50.000 €',
    noDegree: 'Nel pentesting la laurea pesa meno: contano le prove pratiche (laboratori, CTF, resoconti scritti delle macchine risolte).',
    certs: ['eJPT (pratica, d\'ingresso)', 'poi OSCP'],
    remote: 'Spesso ibrido; i test interni richiedono a volte la presenza dal cliente.',
    sources: [
      { label: 'TechCompenso, Penetration Tester in Italia', url: 'https://techcompenso.com/blog/penetration-tester-in-italia-chi-cosa-fa-e-quanto-guadagna-lhacker-etico' },
      { label: 'Jobiri, Penetration Tester guida 2025', url: 'https://www.jobiri.com/carriera/penetration-tester/' },
      { label: 'Annuncio Junior Offensive Security Engineer (aggregatore)', url: 'https://www.jobleads.com/it/job/junior-offensive-security-engineer--italy--e73247af865dc18660b78e6540cfc5c57' },
    ],
  },
  dfir: {
    roles: ['Junior Digital Forensics Analyst', 'Incident Response Analyst', 'spesso si entra dal SOC'],
    junior: '27.000–33.000 € (Masterin); annunci di cybersecurity junior visti tra 22.000 e 31.000 €',
    later: 'intermedio 35.000–46.000 €, senior 50.000–65.000 € (Masterin)',
    kind: 'stima da una guida professioni; pochi dati specifici per la forensics in Italia',
    noDegree: 'Ruoli forensi puri sono meno numerosi: un percorso comune è SOC → incident response → forensics.',
    certs: ['Security+ come base', 'certificazioni forensi (per esempio GCFE/GCFA) più avanti: costose, utili dopo i primi anni'],
    remote: 'Le analisi si fanno spesso da remoto; la raccolta delle prove a volte sul posto.',
    sources: [{ label: 'Masterin, Ricercatore di evidenze digitali', url: 'https://www.masterin.it/professioni/ricercatore-di-evidenze-digitali-188' }],
  },
  eng: {
    roles: ['Junior Security Engineer', 'Sistemista con competenze di sicurezza', 'IT Security Consultant'],
    junior: 'circa 28.000–35.000 € nella maggior parte dei casi (fonti eterogenee)',
    later: 'inizio carriera circa 33.000 €, senior circa 69.000 € (Jobmentis, stima)',
    kind: 'stima da aggregatori; nessun dato TechCompenso specifico per il ruolo junior',
    noDegree: 'Senza laurea il percorso tipico parte da sistemista o helpdesk e si specializza sulla sicurezza.',
    certs: ['Security+', 'certificazioni Linux o cloud (per esempio quelle dei grandi fornitori cloud)'],
    remote: 'Spesso ibrido.',
    sources: [
      { label: 'Jobmentis, Security Engineer in Italia', url: 'https://www.jobmentis.com/en/salaries/security-engineer/italy' },
      { label: 'Calcolo stipendio cybersecurity 2026', url: 'https://calcolostipendionettoonline.it/stipendio-cybersecurity/' },
    ],
  },
  malware: {
    roles: ['Malware Analyst', 'Threat Intelligence Analyst', 'di solito dopo esperienza in SOC o DFIR'],
    junior: null,
    kind: 'nessun dato affidabile trovato per il livello junior in Italia: i ruoli d\'ingresso sono rari',
    noDegree: 'È il percorso più lungo: servono programmazione, sistemi operativi e anni di esperienza difensiva.',
    certs: ['nessuna d\'ingresso specifica: si parte da quelle SOC/DFIR'],
    remote: 'Ruoli spesso in centri specializzati o grandi aziende.',
    sources: [],
  },
};

/** Il quadro generale, valido per tutti i percorsi. */
export const MARKET = {
  shortage:
    'L\'Agenzia per la Cybersicurezza Nazionale (ACN) parla di circa 100mila esperti mancanti in Italia; lo stesso direttore ha precisato che è una stima, non un calcolo preciso.',
  north: 'Diverse fonti indicano stipendi mediamente più alti al Nord, nella media al Centro, un po\' più bassi al Sud.',
  referrals: 'Molti posti junior si coprono con contatti e segnalazioni, non solo con annunci: un profilo LinkedIn curato e la partecipazione a eventi e CTF contano.',
  torino:
    'Annunci visti a Torino e in Piemonte il 16 novembre 2026 su aggregatori (Indeed, Glassdoor): analisti SOC junior (anche da remoto), consulenti di sicurezza con SIEM, ruoli di governance in banca, esperti di cybersecurity nell\'industria aerospaziale e della difesa. Alcuni annunci erano vecchi: verifica sempre sul sito dell\'azienda prima di candidarti.',
  sources: [
    { label: 'Il Sole 24 Ore, "Nella cybersecurity mancano circa 100mila persone"', url: 'https://en.ilsole24ore.com/art/nella-cybersecurity-mancano-circa-100mila-persone-ingenuita-e-mancati-aggiornamenti-base-attacchi-AELiT0nC' },
    { label: 'Indeed, annunci Cyber Security Analyst a Torino', url: 'https://it.indeed.com/Torino,-Piemonte-offerte-lavoro-Cyber-Security-Analyst' },
    { label: 'Glassdoor, annunci cybersecurity in Piemonte', url: 'https://www.glassdoor.it/Lavoro/cybersecurity-Piedmont-SRCH_KO0,13_IL.14,22_IS5091.htm' },
  ] as Source[],
  caution: 'Le cifre sono indicative e vengono da siti di benchmark e aggregatori, con campioni a volte piccoli. Nessuna certificazione garantisce un\'assunzione: aiuta a passare la prima selezione, poi contano le prove pratiche e il colloquio.',
};
