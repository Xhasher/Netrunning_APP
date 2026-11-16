// Architetto di rete: progettare una rete, non solo leggerla.
//
// Tre livelli, ognuno aperto da un capitolo:
//   1. indirizzi (dopo la 02.4): dare a ogni dispositivo un indirizzo valido e il gateway giusto
//   2. sottoreti (dopo la 09.2): separare ospiti e staff, e scegliere la maschera più piccola che basta
//   3. firewall (dopo la 09.5): scegliere le regole perché passi solo il traffico che serve
// I dati cambiano a ogni partita; la correzione spiega ogni errore.

export interface Rnd {
  int(a: number, b: number): number;
  pick<T>(a: readonly T[]): T;
  shuffle<T>(a: readonly T[]): T[];
}

export const ARCH_LEVELS = [
  { level: 1, after: 'ch02-m4', title: 'Indirizzi e gateway', what: 'Ogni dispositivo ha bisogno di un indirizzo nella rete giusta, unico, e di sapere qual è la porta d\'uscita (il gateway).' },
  { level: 2, after: 'ch09-m2', title: 'Sottoreti', what: 'Gli ospiti non devono stare nella stessa rete della cassa. Due sottoreti, ognuna grande quanto basta.' },
  { level: 3, after: 'ch09-m5', title: 'Regole del firewall', what: 'Il firewall blocca tutto, tranne quello che permetti. Permetti solo il traffico che serve, niente di più.' },
] as const;

const ipParts = (ip: string): number[] | null => {
  const m = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const p = m.slice(1).map(Number);
  return p.every((x) => x >= 0 && x <= 255) ? p : null;
};

// ---------------------------------------------------------------- livello 1

export interface L1 {
  prefix: string; // es. "192.168.40."
  router: string;
  devices: string[];
}

export function makeL1(r: Rnd): L1 {
  const prefix = r.pick([`192.168.${r.int(2, 250)}.`, `10.${r.int(1, 250)}.${r.int(0, 250)}.`]);
  const devices = r.shuffle(['cassa', 'stampante', 'jukebox', 'portatile di Mama', 'telecamera', 'tablet del bar']).slice(0, r.int(3, 5));
  return { prefix, router: `${prefix}1`, devices };
}

/** answers: per ogni dispositivo [indirizzo, gateway]. */
export function checkL1(p: L1, answers: [string, string][]): string[] {
  const errs: string[] = [];
  const seen = new Map<string, string>();
  p.devices.forEach((d, i) => {
    const [ip, gw] = answers[i] ?? ['', ''];
    const parts = ipParts(ip);
    if (!parts) return void errs.push(`${d}: "${ip || '(vuoto)'}" non è un indirizzo IPv4 (quattro numeri da 0 a 255, separati da punti).`);
    if (!ip.trim().startsWith(p.prefix)) errs.push(`${d}: ${ip} non è nella rete ${p.prefix}0/24: i primi tre numeri devono essere ${p.prefix.slice(0, -1)}.`);
    else if (parts[3] === 0 || parts[3] === 255) errs.push(`${d}: ${ip} è riservato (.0 è la rete stessa, .255 il broadcast).`);
    else if (ip.trim() === p.router) errs.push(`${d}: ${ip} è già del router.`);
    const other = seen.get(ip.trim());
    if (other) errs.push(`${d} e ${other} hanno lo stesso indirizzo ${ip}: due dispositivi con lo stesso indirizzo si rubano i pacchetti a vicenda.`);
    seen.set(ip.trim(), d);
    if (gw.trim() !== p.router) errs.push(`${d}: il gateway deve essere il router, ${p.router}. Con "${gw || '(vuoto)'}" il dispositivo parla con la rete locale, ma non esce verso Internet.`);
  });
  return errs;
}

// ---------------------------------------------------------------- livello 2

export const MASKS = [24, 25, 26, 27, 28, 29] as const;
export const usable = (bits: number) => 2 ** (32 - bits) - 2;

export interface L2 {
  guests: string; // rete ospiti, es. 10.0.10.0
  staff: string;
  guestCount: number;
  staffCount: number;
  devices: { name: string; role: 'ospiti' | 'staff' }[];
}

export function makeL2(r: Rnd): L2 {
  const a = r.int(1, 200);
  const devices = r.shuffle([
    { name: 'telefono di un cliente', role: 'ospiti' as const },
    { name: 'portatile di un cliente', role: 'ospiti' as const },
    { name: 'cassa', role: 'staff' as const },
    { name: 'stampante delle comande', role: 'staff' as const },
    { name: 'PC dell\'ufficio', role: 'staff' as const },
    { name: 'tablet di un cliente', role: 'ospiti' as const },
  ]).slice(0, 5);
  return { guests: `10.${a}.10.0`, staff: `10.${a}.20.0`, guestCount: r.pick([20, 40, 50, 100, 120]), staffCount: r.pick([5, 8, 12, 20, 25]), devices };
}

/** La maschera più piccola che contiene n dispositivi. */
export function smallestMask(n: number): number {
  return [...MASKS].reverse().find((b) => usable(b) >= n) ?? 24;
}

export function checkL2(p: L2, a: { guestMask: number; staffMask: number; place: ('ospiti' | 'staff')[] }): string[] {
  const errs: string[] = [];
  const g = smallestMask(p.guestCount);
  const s = smallestMask(p.staffCount);
  if (a.guestMask !== g)
    errs.push(usable(a.guestMask) < p.guestCount ? `Ospiti: /${a.guestMask} contiene solo ${usable(a.guestMask)} indirizzi, ne servono ${p.guestCount}.` : `Ospiti: /${a.guestMask} funziona, ma è più grande del necessario: /${g} (${usable(g)} indirizzi) basta. Reti più piccole, meno spazio per chi entra.`);
  if (a.staffMask !== s)
    errs.push(usable(a.staffMask) < p.staffCount ? `Staff: /${a.staffMask} contiene solo ${usable(a.staffMask)} indirizzi, ne servono ${p.staffCount}.` : `Staff: /${a.staffMask} è più grande del necessario: /${s} (${usable(s)} indirizzi) basta.`);
  p.devices.forEach((d, i) => {
    if (a.place[i] !== d.role)
      errs.push(d.role === 'staff' ? `${d.name}: va nella rete dello staff. Nella rete ospiti chiunque sia collegato al wifi potrebbe raggiungerlo.` : `${d.name}: è di un ospite, va nella rete ospiti. Un dispositivo sconosciuto nella rete dello staff è proprio quello che la separazione deve impedire.`);
  });
  return errs;
}

// ---------------------------------------------------------------- livello 3

export type Zone = 'Internet' | 'Ospiti' | 'Staff' | 'DMZ' | 'Database';

export interface Rule {
  from: Zone;
  to: Zone;
  port: number | '*';
  label: string;
}

export interface Flow {
  from: Zone;
  to: Zone;
  port: number;
  why: string;
}

export interface L3 {
  web: number; // porta del sito
  db: number;
  admin: number;
  rules: Rule[];
  required: Flow[];
  forbidden: Flow[];
}

export function makeL3(r: Rnd): L3 {
  const web = r.pick([443, 443, 80]);
  const db = r.pick([3306, 5432]);
  const admin = 22;
  const required: Flow[] = [
    { from: 'Internet', to: 'DMZ', port: web, why: 'i clienti devono vedere il sito' },
    { from: 'DMZ', to: 'Database', port: db, why: 'il sito legge i prodotti dal database' },
    { from: 'Staff', to: 'DMZ', port: admin, why: 'lo staff amministra il server del sito con SSH' },
  ];
  const forbidden: Flow[] = [
    { from: 'Internet', to: 'Database', port: db, why: 'il database non deve mai essere raggiungibile da Internet' },
    { from: 'Ospiti', to: 'Staff', port: 445, why: 'gli ospiti non devono raggiungere i PC dello staff' },
    { from: 'Internet', to: 'DMZ', port: admin, why: 'l\'amministrazione del server non va esposta a Internet' },
    { from: 'Ospiti', to: 'Database', port: db, why: 'gli ospiti non devono toccare il database' },
    { from: 'DMZ', to: 'Staff', port: 445, why: 'se il sito viene bucato, non deve poter raggiungere lo staff' },
  ];
  const rules: Rule[] = r.shuffle([
    { from: 'Internet', to: 'DMZ', port: web, label: `Internet → DMZ, porta ${web} (sito)` },
    { from: 'DMZ', to: 'Database', port: db, label: `DMZ → Database, porta ${db}` },
    { from: 'Staff', to: 'DMZ', port: admin, label: 'Staff → DMZ, porta 22 (SSH)' },
    { from: 'Internet', to: 'DMZ', port: '*', label: 'Internet → DMZ, tutte le porte' },
    { from: 'Internet', to: 'Database', port: db, label: `Internet → Database, porta ${db}` },
    { from: 'Ospiti', to: 'Staff', port: '*', label: 'Ospiti → Staff, tutte le porte' },
    { from: 'DMZ', to: 'Staff', port: '*', label: 'DMZ → Staff, tutte le porte' },
    { from: 'Staff', to: 'Database', port: '*', label: 'Staff → Database, tutte le porte' },
  ] as Rule[]);
  return { web, db, admin, rules, required, forbidden };
}

const allows = (rules: readonly Rule[], f: Flow) => rules.some((x) => x.from === f.from && x.to === f.to && (x.port === '*' || x.port === f.port));

export function checkL3(p: L3, chosen: number[]): string[] {
  const active = chosen.map((i) => p.rules[i]).filter(Boolean);
  const errs: string[] = [];
  for (const f of p.required) if (!allows(active, f)) errs.push(`Manca qualcosa: ${f.from} → ${f.to} sulla porta ${f.port} è bloccato, ma ${f.why}.`);
  for (const f of p.forbidden) if (allows(active, f)) errs.push(`Troppo aperto: ${f.from} → ${f.to} sulla porta ${f.port} passa, ma ${f.why}.`);
  // regole in più: permesse ma inutili (minimo privilegio)
  for (const x of active)
    if (x.port === '*' && !p.forbidden.some((f) => x.from === f.from && x.to === f.to))
      errs.push(`"${x.label}" apre tutte le porte quando ne serve una sola: minimo privilegio anche nel firewall.`);
  return [...new Set(errs)];
}
