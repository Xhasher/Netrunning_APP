// Mazzi di "codici" da sapere a memoria: porte, codici HTTP, Event ID, permessi, sottoreti...
// Ogni voce diventa una carta dell'Allenamento quotidiano, sbloccata dalla missione indicata.

export interface FactDeck {
  id: string;
  title: string;
  /** missione che sblocca il mazzo */
  unlock: string;
  /** come si formula la domanda (q = la voce) */
  ask: (q: string) => string;
  /** come si formula la domanda inversa, se ha senso (a = la risposta) */
  askReverse?: (a: string) => string;
  /** la risposta diretta è abbastanza breve da poterla scrivere a mano */
  typeFwd?: boolean;
  items: { q: string; a: string; accept?: string[]; note?: string }[];
}

export const FACT_DECKS: FactDeck[] = [
  {
    id: 'porte',
    typeFwd: true,
    title: 'Porte e servizi',
    unlock: 'ch02-m3',
    ask: (q) => `Quale servizio usa di solito la porta ${q}?`,
    askReverse: (a) => `Su quale porta lavora di solito ${a}?`,
    items: [
      { q: '21', a: 'FTP', note: 'trasferimento file, NON cifrato' },
      { q: '22', a: 'SSH', note: 'accesso remoto cifrato' },
      { q: '23', a: 'Telnet', note: 'accesso remoto in chiaro: da spegnere' },
      { q: '25', a: 'SMTP', note: 'invio della posta tra server' },
      { q: '53', a: 'DNS', note: 'traduce i nomi in indirizzi' },
      { q: '80', a: 'HTTP', note: 'web non cifrato' },
      { q: '110', a: 'POP3', note: 'ricezione posta (vecchio)' },
      { q: '143', a: 'IMAP', note: 'ricezione posta' },
      { q: '443', a: 'HTTPS', note: 'web cifrato con TLS' },
      { q: '445', a: 'SMB', note: 'condivisione file Windows: mai esposta a Internet' },
      { q: '3306', a: 'MySQL', note: 'database' },
      { q: '3389', a: 'RDP', note: 'desktop remoto di Windows: bersaglio frequente' },
      { q: '5432', a: 'PostgreSQL', note: 'database' },
      { q: '8080', a: 'HTTP alternativo', accept: ['http-proxy', 'http alternativo', 'http'], note: 'spesso pannelli e proxy' },
    ],
  },
  {
    id: 'http',
    title: 'Codici di stato HTTP',
    unlock: 'ch07-m1',
    ask: (q) => `Cosa significa il codice HTTP ${q}?`,
    askReverse: (a) => `Quale codice HTTP significa "${a}"?`,
    items: [
      { q: '200', a: 'OK' },
      { q: '301', a: 'spostato in modo permanente' },
      { q: '302', a: 'redirezione temporanea' },
      { q: '400', a: 'richiesta non valida' },
      { q: '401', a: 'serve autenticarsi' },
      { q: '403', a: 'vietato' },
      { q: '404', a: 'non trovato' },
      { q: '500', a: 'errore interno del server' },
      { q: '503', a: 'servizio non disponibile' },
    ],
  },
  {
    id: 'eventi',
    title: 'Event ID di Windows',
    unlock: 'ch12-m3',
    ask: (q) => `Cosa registra l'Event ID ${q}?`,
    askReverse: (a) => `Quale Event ID registra: ${a}?`,
    items: [
      { q: '4624', a: 'accesso riuscito' },
      { q: '4625', a: 'accesso fallito' },
      { q: '4672', a: 'accesso con privilegi speciali' },
      { q: '4688', a: 'nuovo processo creato' },
      { q: '4720', a: 'account utente creato' },
      { q: '4728', a: 'aggiunto a un gruppo globale privilegiato' },
      { q: '4732', a: 'aggiunto a un gruppo locale (es. Administrators)' },
      { q: '7045', a: 'nuovo servizio installato' },
      { q: '1102', a: 'registro di controllo cancellato' },
    ],
  },
  {
    id: 'permessi',
    typeFwd: true,
    title: 'Permessi in numeri',
    unlock: 'ch03-m2',
    ask: (q) => `Che permessi corrispondono a ${q}?`,
    askReverse: (a) => `Come si scrive ${a} in forma numerica?`,
    items: [
      { q: '755', a: 'rwxr-xr-x' },
      { q: '644', a: 'rw-r--r--' },
      { q: '600', a: 'rw-------' },
      { q: '700', a: 'rwx------' },
      { q: '640', a: 'rw-r-----' },
      { q: '777', a: 'rwxrwxrwx' },
      { q: '750', a: 'rwxr-x---' },
      { q: '444', a: 'r--r--r--' },
    ],
  },
  {
    id: 'cidr',
    typeFwd: true,
    title: 'Sottoreti',
    unlock: 'ch09-m2',
    ask: (q) => `Quanti host utilizzabili ha una rete ${q}?`,
    askReverse: (a) => `Quale prefisso CIDR dà ${a} host utilizzabili?`,
    items: [
      { q: '/24', a: '254' },
      { q: '/25', a: '126' },
      { q: '/26', a: '62' },
      { q: '/27', a: '30' },
      { q: '/28', a: '14' },
      { q: '/29', a: '6' },
      { q: '/30', a: '2' },
      { q: '/23', a: '510' },
      { q: '/22', a: '1022' },
    ],
  },
  {
    id: 'log',
    typeFwd: true,
    title: 'Dove stanno i log',
    unlock: 'ch04-m1',
    ask: (q) => `In quale file Linux trovi ${q}?`,
    items: [
      { q: 'i login riusciti e falliti e l\'uso di sudo (Debian/Ubuntu)', a: '/var/log/auth.log' },
      { q: 'gli accessi su Red Hat / CentOS', a: '/var/log/secure' },
      { q: 'i messaggi generali del sistema', a: '/var/log/syslog' },
      { q: 'le richieste al server web nginx', a: '/var/log/nginx/access.log' },
      { q: 'l\'elenco degli utenti', a: '/etc/passwd' },
      { q: 'gli hash delle password', a: '/etc/shadow' },
      { q: 'i gruppi e i loro membri', a: '/etc/group' },
      { q: 'i lavori programmati di sistema', a: '/etc/crontab' },
      { q: 'la configurazione del server SSH', a: '/etc/ssh/sshd_config' },
      { q: 'le chiavi SSH autorizzate per un utente', a: '~/.ssh/authorized_keys' },
    ],
  },
  {
    id: 'attck',
    typeFwd: true,
    title: 'Tattiche MITRE ATT&CK',
    unlock: 'ch08-m2',
    ask: (q) => `A quale tattica ATT&CK appartiene: ${q}?`,
    items: [
      { q: 'scansione delle porte con nmap', a: 'Discovery', accept: ['discovery', 'reconnaissance'] },
      { q: 'password spraying', a: 'Credential Access' },
      { q: 'login con credenziali valide rubate', a: 'Initial Access' },
      { q: 'un job di cron che riavvia il malware', a: 'Persistence' },
      { q: 'un beacon verso un server esterno', a: 'Command and Control' },
      { q: 'cancellazione dei log', a: 'Defense Evasion' },
      { q: 'invio di 2 GB a un IP esterno', a: 'Exfiltration' },
      { q: 'script di root modificabile usato per diventare root', a: 'Privilege Escalation' },
      { q: 'un cryptominer che consuma le risorse', a: 'Impact' },
      { q: 'accesso a un altro server con la stessa password', a: 'Lateral Movement' },
    ],
  },
  {
    id: 'cvss',
    typeFwd: true,
    title: 'Gravità CVSS',
    unlock: 'ch10-m4',
    ask: (q) => `Che gravità ha un punteggio CVSS di ${q}?`,
    items: [
      { q: '9.8', a: 'critica' },
      { q: '7.5', a: 'alta' },
      { q: '5.3', a: 'media' },
      { q: '2.1', a: 'bassa' },
      { q: '9.0', a: 'critica' },
      { q: '6.9', a: 'media' },
      { q: '7.0', a: 'alta' },
    ],
  },
];
