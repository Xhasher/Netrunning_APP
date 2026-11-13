// Rete simulata. Nessun pacchetto lascia davvero il telefono: è tutto finto.

export interface Port {
  port: number;
  service: string;
  version: string;
}

export interface Host {
  ip: string;
  names: string[];
  mac: string;
  /** risponde al ping (ICMP)? */
  pingable: boolean;
  /** latenza in ms */
  latency: number;
  ttl: number;
  ports: Port[];
  /** fa parte del perimetro autorizzato del contratto? */
  inScope: boolean;
}

export interface Network {
  myIp: string;
  myMac: string;
  gateway: string;
  cidr: number;
  hosts: Host[];
  /** prefissi delle reti autorizzate dal contratto (es. "192.168.1.") */
  scopes: string[];
}

export function createNetwork(): Network {
  return {
    myIp: '192.168.1.50',
    myMac: '02:4e:43:00:00:50',
    gateway: '192.168.1.1',
    cidr: 24,
    scopes: ['192.168.1.'],
    hosts: [
      {
        ip: '192.168.1.1',
        names: ['gateway.lan', 'gateway'],
        mac: '02:4e:43:00:00:01',
        pingable: true,
        latency: 1.2,
        ttl: 64,
        ports: [
          { port: 53, service: 'domain', version: 'dnsmasq 2.90' },
          { port: 80, service: 'http', version: 'lighttpd 1.4.76' },
        ],
        inScope: true,
      },
      {
        ip: '192.168.1.20',
        names: ['jukebox.lan', 'jukebox'],
        mac: '02:4e:43:00:00:20',
        pingable: true,
        latency: 2.1,
        ttl: 64,
        ports: [
          { port: 22, service: 'ssh', version: 'OpenSSH 7.4 (protocol 2.0)' },
          { port: 23, service: 'telnet', version: 'BusyBox telnetd' },
          { port: 80, service: 'http', version: 'Apache httpd 2.4.29' },
        ],
        inScope: true,
      },
      {
        ip: '192.168.1.30',
        names: ['cassa.lan', 'cassa'],
        mac: '02:4e:43:00:00:30',
        pingable: false, // firewall: ignora il ping
        latency: 3.0,
        ttl: 128,
        ports: [{ port: 443, service: 'https', version: 'nginx 1.26.2' }],
        inScope: true,
      },
      {
        ip: '192.168.1.50',
        names: ['deck.lan', 'deck', 'localhost'],
        mac: '02:4e:43:00:00:50',
        pingable: true,
        latency: 0.04,
        ttl: 64,
        ports: [],
        inScope: true,
      },
      {
        // 203.0.113.0/24 è un intervallo riservato alla documentazione: non esiste davvero.
        ip: '203.0.113.66',
        names: ['helix.corp', 'www.helix.corp'],
        mac: '',
        pingable: true,
        latency: 38.5,
        ttl: 52,
        ports: [
          { port: 80, service: 'http', version: 'nginx' },
          { port: 443, service: 'https', version: 'nginx' },
        ],
        inScope: false,
      },
    ],
  };
}

export function isIp(s: string): boolean {
  const m = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  return !!m && m.slice(1).every((n) => Number(n) <= 255);
}

/** Risolve un nome (DNS finto) o un IP. Restituisce null se il nome non esiste. */
export function lookup(net: Network, target: string): { ip: string; host?: Host } | null {
  const t = target.toLowerCase();
  if (isIp(t)) return { ip: t, host: net.hosts.find((h) => h.ip === t) };
  const host = net.hosts.find((h) => h.names.includes(t));
  return host ? { ip: host.ip, host } : null;
}

export function displayName(host: Host | undefined, ip: string): string {
  return host && host.names.length ? `${host.names[0]} (${ip})` : ip;
}

/** Tutti gli host nella rete locale indicata in notazione CIDR (supporta solo /24). */
export function hostsInRange(net: Network, range: string): Host[] | null {
  const m = range.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}\/24$/);
  if (!m) return null;
  return net.hosts.filter((h) => h.ip.startsWith(m[1] + '.'));
}
