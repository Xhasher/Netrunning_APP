export type LineClass =
  | 'out' // output normale
  | 'err' // errore
  | 'dim' // testo secondario
  | 'info' // spiegazione del gioco (non fa parte del vero Linux)
  | 'ok' // successo
  | 'warn' // avviso
  | 'dir' // nome di cartella (come i colori di ls)
  | 'cmd'; // riga di comando digitata

export interface Line {
  text: string;
  cls?: LineClass;
  /** millisecondi di attesa prima di mostrare la riga (effetto "tempo reale") */
  delay?: number;
}

/** Eventi emessi dalla shell: le missioni li osservano per capire se un obiettivo è raggiunto. */
export type ShellEvent =
  | { type: 'command'; name: string; args: string[]; ok: boolean }
  | { type: 'cd'; path: string }
  | { type: 'ls'; path: string; flags: string[] }
  | { type: 'read'; path: string }
  | { type: 'answer'; value: string }
  | { type: 'man'; topic: string }
  | { type: 'ping'; target: string; ip: string | null; replies: number }
  | { type: 'scan'; target: string; ip: string | null; flags: string[]; outOfScope: boolean }
  | { type: 'netinfo' }
  | { type: 'chmod'; path: string; perms: string }
  | { type: 'firewall'; action: 'deny' | 'allow'; ip: string };

export interface RunResult {
  lines: Line[];
  events: ShellEvent[];
  clear?: boolean;
}
