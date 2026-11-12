// "Trucchi del mestiere": consigli pratici per essere più veloci, metodici ed efficaci.

export interface Tip {
  area: 'Terminale' | 'Metodo' | 'Studio' | 'Lavoro' | 'Sicurezza personale';
  text: string;
}

export const TIPS: Tip[] = [
  // terminale
  { area: 'Terminale', text: 'Premi **TAB** sempre: completa i nomi e ti dice subito se un file non esiste. Meno errori di battitura, più velocità.' },
  { area: 'Terminale', text: '`!!` ripete l\'ultimo comando. Classico: hai dimenticato sudo? Scrivi `sudo !!`.' },
  { area: 'Terminale', text: 'Nel vero bash, **Ctrl+R** cerca all\'indietro nella cronologia: scrivi un pezzo di comando e lo ritrovi. Qui usa `history | grep parola`.' },
  { area: 'Terminale', text: 'Crea alias per i comandi che ripeti: `alias ll=\'ls -la\'`. Nel vero Linux mettili in `~/.bashrc` e restano per sempre.' },
  { area: 'Terminale', text: 'Nel vero bash: **Ctrl+A** va a inizio riga, **Ctrl+E** a fine riga, **Ctrl+U** cancella la riga, **Ctrl+L** pulisce lo schermo.' },
  { area: 'Terminale', text: 'La catena `sort | uniq -c | sort -n -r | head` trasforma qualsiasi log in una classifica: chi, cosa, quante volte. Impara a scriverla a occhi chiusi.' },
  { area: 'Terminale', text: 'Aggiungi `2>/dev/null` ai comandi che scorrono tutto il disco (come find /): spariscono i Permission denied e resta solo quello che conta.' },
  { area: 'Terminale', text: 'Prima di un comando distruttivo (`rm -r`, `>`), lancia prima la versione "innocua": `ls` sullo stesso percorso. Vedi cosa colpiresti.' },
  { area: 'Terminale', text: 'Strumenti reali che fanno risparmiare ore: **tmux** (più terminali in una finestra, sessioni che sopravvivono), **jq** (JSON), **ripgrep** (grep velocissimo).' },
  // metodo
  { area: 'Metodo', text: 'Prima di toccare qualsiasi cosa: **leggi lo scope**. Poi leggi le istruzioni. Poi guarda i dati. Solo dopo, agisci.' },
  { area: 'Metodo', text: 'Guarda sempre com\'è fatta una riga di log (`head -n 3`) prima di costruire la catena di comandi: risparmi tentativi.' },
  { area: 'Metodo', text: 'Lavora a **ipotesi**: "se è un brute force, vedrò molti Failed dallo stesso IP". Poi verifica. È più veloce che guardare tutto a caso.' },
  { area: 'Metodo', text: 'Costruisci la **timeline** mentre indaghi, non alla fine: ora, sistema, evento, prova. È il cuore di ogni report d\'incidente.' },
  { area: 'Metodo', text: 'Non fermarti al primo indizio: quando trovi una persistenza, chiediti "ce n\'è un\'altra?". Gli attaccanti ne lasciano spesso più di una.' },
  { area: 'Metodo', text: 'Un "falso positivo" chiuso in fretta è peggio di un allarme in più. Prima di archiviare, guarda il contesto: chi, da dove, quando, è normale?' },
  { area: 'Metodo', text: 'Conserva le prove **prima** di correggere: copia log, file e liste dei processi. Dopo la pulizia non si torna indietro.' },
  // studio
  { area: 'Studio', text: 'Tieni un **quaderno di appunti** tecnico (Obsidian, CherryTree, Joplin): ogni comando nuovo, ogni macchina risolta. Diventa il tuo manuale personale.' },
  { area: 'Studio', text: 'Ripetizione distanziata: fai l\'**Allenamento** qualche minuto al giorno invece di un\'ora una volta a settimana. La memoria funziona così.' },
  { area: 'Studio', text: 'Quando risolvi una macchina o una CTF, scrivi un **writeup**: cosa hai fatto, perché, cosa hai imparato. Spiegare è il modo migliore per capire.' },
  { area: 'Studio', text: 'Abituati all\'inglese tecnico: leggi i `man` veri, la documentazione, i report. È la lingua di tutto il settore.' },
  { area: 'Studio', text: 'Segui le notizie ogni giorno, 10 minuti: CSIRT Italia, BleepingComputer, The Hacker News. Gli attacchi di oggi sono le domande dei colloqui di domani.' },
  { area: 'Studio', text: '**CyberChef** (gratuito, nel browser) decodifica Base64, URL encoding, esadecimale e decine di altri formati: è il coltellino svizzero dell\'analista.' },
  { area: 'Studio', text: 'Quando sei bloccato da più di 30 minuti, chiedi un indizio. Bloccarsi è normale; restare bloccati per ore non insegna molto.' },
  // lavoro
  { area: 'Lavoro', text: 'In un report, la **sintesi per la direzione** è la parte più letta: scrivila per chi non è tecnico. Rischio, impatto, cosa fare.' },
  { area: 'Lavoro', text: 'Ogni problema segnalato deve avere: cosa, dove, gravità, **prova** e **come risolverlo**. Un problema senza soluzione è solo una lamentela.' },
  { area: 'Lavoro', text: 'Automatizza ciò che fai tre volte: la terza volta, scrivi uno script. È così che i bravi analisti diventano velocissimi.' },
  { area: 'Lavoro', text: 'Ai colloqui racconta i tuoi progetti con il metodo **STAR**: Situazione, Compito, Azione, Risultato.' },
  { area: 'Lavoro', text: 'Un portfolio su GitHub (script, writeup, il tuo laboratorio documentato) vale spesso quanto una certificazione, per il primo lavoro.' },
  // sicurezza personale
  { area: 'Sicurezza personale', text: 'Applica a te ciò che insegni: password manager, MFA ovunque, aggiornamenti automatici. Un professionista della sicurezza violato perde credibilità.' },
  { area: 'Sicurezza personale', text: 'Il tuo laboratorio con macchine vulnerabili va tenuto su una **rete isolata** (host-only), mai esposto a Internet.' },
  { area: 'Sicurezza personale', text: 'Mai provare tecniche su sistemi di altri "per vedere se funziona", nemmeno di amici. Senza autorizzazione scritta è illegale, punto.' },
];

export function randomTip(): Tip {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}
