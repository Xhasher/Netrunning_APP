// Dati pubblici simulati per la ricognizione passiva (OSINT): DNS, whois,
// certificate transparency e un piccolo database di vulnerabilità.
// Tutti i domini, le aziende e le CVE "2077" sono inventati.

export interface DnsZone {
  A?: string[];
  MX?: string[];
  TXT?: string[];
  NS?: string[];
}

export interface WhoisRecord {
  registrar: string;
  created: string;
  expires: string;
  registrant: string;
  techEmail: string;
  nameServers: string[];
}

export interface CveEntry {
  id: string;
  product: string;
  /** versioni vulnerabili, descritte a parole */
  affects: string;
  /** controlla se una versione è colpita */
  test: (version: string) => boolean;
  cvss: number;
  summary: string;
}

const cmp = (a: string, b: string) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
};
export const versionBelow = (max: string) => (v: string) => cmp(v, max) < 0;

export const DNS: Record<string, DnsZone> = {};
export const WHOIS: Record<string, WhoisRecord> = {};
/** certificati pubblicati nei log di certificate transparency, per dominio */
export const CT: Record<string, { logged: string; name: string }[]> = {};

export const CVES: CveEntry[] = [
  {
    id: 'CVE-2077-0142',
    product: 'apache',
    affects: 'Apache httpd < 2.4.58',
    test: versionBelow('2.4.58'),
    cvss: 7.5,
    summary: 'Una richiesta costruita ad arte può bloccare il server (negazione del servizio).',
  },
  {
    id: 'CVE-2077-0311',
    product: 'openssh',
    affects: 'OpenSSH < 8.5',
    test: versionBelow('8.5'),
    cvss: 5.3,
    summary: 'Permette di capire se un nome utente esiste (enumerazione degli utenti).',
  },
  {
    id: 'CVE-2077-0777',
    product: 'wordpress',
    affects: 'WordPress < 6.4',
    test: versionBelow('6.4'),
    cvss: 9.8,
    summary: 'Un plugin del pacchetto base permette di eseguire codice sul server senza autenticazione.',
  },
  {
    id: 'CVE-2077-0520',
    product: 'nginx',
    affects: 'nginx < 1.20',
    test: versionBelow('1.20'),
    cvss: 6.1,
    summary: 'Gestione errata di alcune intestazioni: possibile lettura di dati di altre richieste.',
  },
  {
    id: 'CVE-2077-0901',
    product: 'roundcube',
    affects: 'Roundcube < 1.6',
    test: versionBelow('1.6'),
    cvss: 8.8,
    summary: 'Un messaggio email preparato ad arte esegue codice nel browser di chi lo apre (XSS memorizzato).',
  },
  {
    id: 'CVE-2077-1010',
    product: 'fortivpn',
    affects: 'FortiVPN < 7.2',
    test: versionBelow('7.2'),
    cvss: 9.6,
    summary: 'Lettura di file arbitrari dal portale VPN, comprese le sessioni degli utenti collegati.',
  },
];

export function addDomain(domain: string, zone: DnsZone, whois?: WhoisRecord, ct?: { logged: string; name: string }[]): void {
  DNS[domain] = zone;
  if (whois) WHOIS[domain] = whois;
  if (ct) CT[domain] = ct;
}

// ---------------------------------------------------------------- Neon Ottica (capitolo 10)

addDomain(
  'neonottica.nc',
  {
    A: ['198.51.100.40'],
    MX: ['10 mail.neonottica.nc.'],
    NS: ['ns1.nc-hosting.nc.', 'ns2.nc-hosting.nc.'],
    TXT: ['"v=spf1 include:_spf.nc-mail.nc -all"', '"google-site-verification=Xk2b9..."'],
  },
  {
    registrar: 'NC Domini S.p.A.',
    created: '2071-03-14',
    expires: '2078-03-14',
    registrant: 'Neon Ottica S.r.l.',
    techEmail: 'it@neonottica.nc',
    nameServers: ['ns1.nc-hosting.nc', 'ns2.nc-hosting.nc'],
  },
  [
    { logged: '2077-10-02', name: 'neonottica.nc' },
    { logged: '2077-10-02', name: 'www.neonottica.nc' },
    { logged: '2077-09-15', name: 'mail.neonottica.nc' },
    { logged: '2077-08-01', name: 'vpn.neonottica.nc' },
    { logged: '2074-05-20', name: 'dev-old.neonottica.nc' },
    { logged: '2077-10-02', name: 'shop.neonottica.nc' },
  ],
);
addDomain('www.neonottica.nc', { A: ['198.51.100.40'] });
addDomain('mail.neonottica.nc', { A: ['198.51.100.41'] });
addDomain('vpn.neonottica.nc', { A: ['198.51.100.42'] });
addDomain('shop.neonottica.nc', { A: ['198.51.100.40'] });
addDomain('dev-old.neonottica.nc', { A: ['198.51.100.77'] });
