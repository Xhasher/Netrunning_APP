import type { ShellEvent } from '../engine/types';
import type { Chapter } from '../game/types';

// Python per la sicurezza: dal primo print a strumenti veri per l'analisi.

type PyEv = Extract<ShellEvent, { type: 'python' }>;
const pyRun = (test: (ev: PyEv) => boolean) => (ev: ShellEvent) => ev.type === 'python' && ev.ok && test(ev);
const ends = (ev: PyEv, name: string) => ev.path.endsWith(name);

export const CHPY: Chapter = {
  id: 'chPY',
  code: 'PY',
  title: 'Python per la sicurezza',
  subtitle: 'Il linguaggio degli analisti: script, liste, dizionari, file, log, impronte e JSON',
  missions: [
    // ------------------------------------------------------------------ PY.1
    {
      id: 'chPY-m1',
      title: 'Il serpente',
      tagline: 'Cos\'è Python, la prima riga, le variabili, il primo script e come si legge un errore.',
      xp: 200,
      steps: [
        {
          kind: 'lesson',
          title: 'Perché Python',
          body: `@nyx: Con bash hai imparato a incollare comandi. Funziona finché il lavoro è semplice. Quando devi contare, confrontare, ricordare, decidere su migliaia di righe, ti serve un linguaggio vero. Per chi fa sicurezza quel linguaggio è **Python**.

Perché proprio Python:
- si legge quasi come l'inglese: è il più facile da imparare tra i linguaggi "seri"
- ha una **libreria standard** enorme: file, espressioni regolari, impronte, JSON, rete, tutto già pronto
- moltissimi strumenti di sicurezza sono scritti in Python o si comandano da Python
- negli annunci per analista SOC e pentester junior compare quasi sempre ("scripting in Python o Bash")

Si usa in due modi:
- \`python3 -c "codice"\` esegue una riga al volo
- \`python3 nome.py\` esegue uno **script**: un file di testo con il programma, scritto con un editor

!! Il Python di questo deck è un interprete ridotto ma vero: quello che scrivi qui funziona anche sul tuo computer. Mancano solo le classi e i moduli di rete.`,
        },
        {
          kind: 'task',
          title: 'La prima riga',
          body: `In Python, \`print(...)\` mostra qualcosa sullo schermo. Il testo va tra virgolette (semplici o doppie), i numeri no. Più valori separati da virgole vengono stampati con uno spazio in mezzo.

Esempio (diverso da quello che ti chiedo):

\`\`\`
python3 -c "print('Porte aperte:', 3)"
\`\`\`

Ora tocca a te: fai stampare a Python la frase \`Jack-in completato\`.`,
          objective: 'Stampa una frase con print usando python3 -c.',
          hints: ['Le virgolette esterne sono per la shell, quelle interne per Python: usa tipi diversi.', 'python3 -c "print(\'Jack-in completato\')"'],
          check: pyRun((ev) => ev.src.includes('print') && ev.out.some((l) => /jack-in completato/i.test(l))),
          success: `La tua prima riga di Python. Nota le **due coppie di virgolette**: le doppie esterne dicono alla shell "questo è un unico argomento", le semplici interne dicono a Python "questo è un testo". Se usassi le doppie anche dentro, la shell taglierebbe la riga a metà.`,
        },
        {
          kind: 'lesson',
          title: 'Valori e variabili',
          body: `Ogni valore in Python ha un **tipo**:
- \`int\`: numeri interi, \`22\`, \`-3\`
- \`float\`: numeri con la virgola (che si scrive col **punto**), \`9.8\`
- \`str\`: testo, \`"10.0.0.7"\`, \`'root'\`
- \`bool\`: vero o falso, \`True\` e \`False\` (maiuscola obbligatoria)
- \`None\`: "nessun valore"

Una **variabile** è un nome che si riferisce a un valore. Si crea assegnando con \`=\`:

\`\`\`
ip = "203.0.113.5"
tentativi = 12
soglia = 10
print(ip, tentativi > soglia)
\`\`\`

stampa \`203.0.113.5 True\`. I nomi si scrivono in minuscolo, con \`_\` al posto degli spazi: \`login_falliti\`.

Gli operatori: \`+ - * /\` come in matematica, \`//\` divisione intera, \`%\` resto, \`**\` potenza. Attenzione: \`/\` dà sempre un float (\`10 / 2\` è \`5.0\`).

Le **f-string** sono il modo comodo di comporre un testo con dei valori dentro: una \`f\` prima delle virgolette e i valori tra graffe.

\`\`\`
print(f"{ip} ha fallito {tentativi} volte")
print(f"percentuale: {tentativi / 40 * 100:.1f}%")
\`\`\`

Dopo i due punti dentro le graffe c'è il **formato**: \`.1f\` = una cifra decimale, \`>8\` = allinea a destra su 8 caratteri.`,
        },
        {
          kind: 'task',
          title: 'Il calcolo',
          body: `Un cliente ha un log con 86.400 righe al giorno e lo conserva per 90 giorni. Quante righe deve tenere in totale? Fai fare il conto a Python e invia il risultato con \`flag\` (senza punti).`,
          objective: 'Calcola 86400 × 90 con Python e invia il risultato.',
          hints: ['L\'operatore della moltiplicazione è *.', 'python3 -c "print(86400 * 90)" e poi flag 7776000'],
          answer: ['7776000', '7.776.000'],
          success: `**7.776.000** righe. Ora immagina di doverle leggere a mano: è per questo che si scrivono gli script.`,
        },
        {
          kind: 'task',
          title: 'Il primo script',
          body: `Uno script è un file. Crealo con l'editor:

\`\`\`
nano py/saluto.py
\`\`\`

Dentro scrivi due righe: una **variabile** con il tuo nome di battaglia, e un \`print\` con una **f-string** che la usa. Per esempio:

\`\`\`
nome = "V"
print(f"Benvenuto nel deck, {nome}")
\`\`\`

Salva, poi eseguilo:

\`\`\`
python3 py/saluto.py
\`\`\``,
          objective: 'Scrivi ed esegui py/saluto.py con una variabile e una f-string.',
          hints: ['nano py/saluto.py, scrivi le due righe, premi Salva.', 'python3 py/saluto.py'],
          check: pyRun((ev) => ends(ev, 'py/saluto.py') && /\bf["']/.test(ev.src) && /^\s*\w+\s*=/m.test(ev.src) && ev.out.length > 0),
          success: `Hai scritto ed eseguito il tuo primo programma. Python legge il file dall'alto in basso, una riga alla volta, esattamente come hai fatto tu.

?? Sul tuo computer, per eseguirlo direttamente con \`./saluto.py\`, si aggiunge in cima la riga \`#!/usr/bin/env python3\` e si rende eseguibile con \`chmod +x\`: è lo stesso shebang degli script bash.`,
        },
        {
          kind: 'lesson',
          title: 'Leggere un errore',
          body: `Prima o poi ogni script si ferma con un errore. Python stampa un **traceback**: va letto **dal basso**.

\`\`\`
Traceback (most recent call last):
  File "conta.py", line 4, in <module>
    print(totale + " righe")
TypeError: unsupported operand type(s) for +: 'int' and 'str'
\`\`\`

- **ultima riga**: il tipo di errore e il motivo. Qui: non si può sommare un numero e un testo
- **sopra**: la riga di codice colpevole, e il suo numero (riga 4)

La cura in questo caso: convertire il numero in testo con \`str(totale)\`, o meglio usare una f-string.

Gli errori che incontrerai di più:
- **SyntaxError**: hai scritto qualcosa che Python non capisce (manca \`:\`, una parentesi, una virgoletta)
- **IndentationError**: i rientri a inizio riga non tornano
- **NameError**: usi un nome che non esiste (spesso un errore di battitura: Python a volte ti suggerisce quello giusto)
- **TypeError**: operazione tra tipi incompatibili
- **FileNotFoundError**: il file non c'è (percorso sbagliato)`,
        },
        {
          kind: 'task',
          title: 'Ripara lo script',
          body: `Un collega ti ha lasciato \`py/rotto.py\`, che dovrebbe contare le parole di una frase. Eseguilo:

\`\`\`
python3 py/rotto.py
\`\`\`

Leggi il traceback, apri il file con \`nano\`, correggi e rieseguilo finché funziona. Gli errori sono **due**: quando correggi il primo, Python ti mostrerà il secondo.`,
          objective: 'Correggi py/rotto.py finché gira senza errori.',
          hints: [
            'Primo errore: alla riga dell\'if manca qualcosa alla fine.',
            'Secondo errore: un nome di variabile scritto male. Python ti suggerisce quello giusto ("Did you mean...").',
            'La riga dell\'if deve finire con ":" e l\'ultima riga deve usare len(parole).',
          ],
          check: pyRun((ev) => ends(ev, 'py/rotto.py') && ev.out.some((l) => l.includes('7'))),
          success: `Due errori classici: i **due punti** dopo \`if\` (ogni riga che apre un blocco, come \`if\`, \`for\`, \`def\`, finisce con \`:\`) e un **nome sbagliato** (\`parola\` invece di \`parole\`). Hai fatto il ciclo che farai ogni giorno: esegui, leggi l'errore dal basso, correggi, riesegui.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Uno script termina con `NameError: name \'totale\' is not defined. Did you mean: \'totali\'?`. Qual è la causa più probabile?',
          options: [
            'Il file non esiste',
            'Hai scritto il nome della variabile in modo diverso da come l\'hai creata',
            'Manca un import',
            'Python non è installato',
          ],
          correct: 1,
          explain: `NameError significa "questo nome non esiste". Python ha anche trovato un nome simile, \`totali\`: quasi certamente un errore di battitura.`,
        },
      ],
      recap: [
        ['python3 -c "..."', 'esegue una riga di Python'],
        ['python3 file.py', 'esegue uno script'],
        ['print(a, b)', 'stampa valori separati da spazio'],
        ['int float str bool None', 'i tipi di base'],
        ['f"{x} e {y:.2f}"', 'f-string: valori dentro il testo, con formato'],
        ['traceback', 'si legge dal basso: tipo di errore, motivo, riga colpevole'],
      ],
    },

    // ------------------------------------------------------------------ PY.2
    {
      id: 'chPY-m2',
      title: 'Decidere e ripetere',
      tagline: 'if, liste, cicli for, dizionari e funzioni, applicati a porte e vulnerabilità.',
      xp: 250,
      steps: [
        {
          kind: 'lesson',
          title: 'if, elif, else',
          body: `Per far decidere il programma si usa \`if\`. La condizione finisce con \`:\` e le righe che dipendono da lei sono **rientrate** di 4 spazi. Il rientro **è** la sintassi: è così che Python sa dove finisce il blocco.

\`\`\`
tentativi = 37
if tentativi >= 50:
    print("blocca l'IP")
elif tentativi >= 10:
    print("tieni d'occhio")
else:
    print("normale")
print("controllo finito")
\`\`\`

L'ultima riga non è rientrata: viene eseguita sempre.

I confronti: \`==\` uguale (due segni: uno solo è l'assegnazione), \`!=\` diverso, \`< > <= >=\`, \`in\` "è contenuto in" (\`"admin" in utente\`). Si combinano con \`and\`, \`or\`, \`not\`.`,
        },
        {
          kind: 'lesson',
          title: 'Liste e cicli',
          body: `Una **lista** contiene più valori in ordine, tra quadre:

\`\`\`
utenti = ["root", "mama", "www-data"]
print(utenti[0])     # il primo: si conta da 0
print(utenti[-1])    # l'ultimo
print(len(utenti))   # quanti sono
utenti.append("backup")  # aggiunge in fondo
\`\`\`

Il ciclo \`for\` ripete un blocco **per ogni elemento**:

\`\`\`
for u in utenti:
    if u == "root":
        print("attenzione:", u)
\`\`\`

\`range(n)\` produce i numeri da 0 a n-1: \`for i in range(3)\` gira con 0, 1, 2. Dentro un ciclo, \`break\` esce subito e \`continue\` salta al giro successivo.

Un **dizionario** associa una **chiave** a un valore, tra graffe:

\`\`\`
servizi = {22: "SSH", 80: "HTTP"}
print(servizi[22])           # SSH
print(servizi.get(25, "?"))  # "?" se la chiave manca, senza errore
servizi[443] = "HTTPS"       # aggiunge
if 80 in servizi:            # controlla le chiavi
    print("c'è il web")
for porta, nome in servizi.items():
    print(porta, nome)
\`\`\``,
        },
        {
          kind: 'task',
          title: 'Porte da chiudere',
          body: `In \`py/porte.py\` c'è l'inizio di uno script: una lista di porte aperte trovate da \`nmap\` e un dizionario delle porte rischiose. Manca la parte che fa il lavoro. Aprilo:

\`\`\`
nano py/porte.py
\`\`\`

Completa lo script: per ogni porta aperta, **se** è tra le rischiose, stampa una riga così:

\`\`\`
ATTENZIONE: porta 21 (FTP)
\`\`\`

Poi eseguilo con \`python3 py/porte.py\`.`,
          objective: 'Fai stampare a py/porte.py solo le porte aperte rischiose.',
          hints: [
            'Ti servono un for sulla lista aperte e un if con "in" sul dizionario rischiose.',
            'for p in aperte:\n    if p in rischiose:\n        print(f"ATTENZIONE: porta {p} ({rischiose[p]})")',
          ],
          check: pyRun((ev) => {
            if (!ends(ev, 'py/porte.py')) return false;
            const ports = ev.out.map((l) => /porta (\d+)/.exec(l)?.[1]).filter(Boolean).sort();
            return ports.join(',') === ['21', '23', '3389'].sort().join(',') && ev.out.some((l) => /\(Telnet\)/.test(l));
          }),
          success: `Tre porte: **21** (FTP, credenziali in chiaro), **23** (Telnet, tutto in chiaro) e **3389** (RDP, il desktop remoto di Windows, tra i bersagli preferiti dei ransomware). Il tuo script ha fatto in un istante quello che faresti confrontando a occhio due elenchi, e lo rifarà identico su mille server.`,
        },
        {
          kind: 'lesson',
          title: 'Le funzioni',
          body: `Una **funzione** è un pezzo di codice con un nome, che si può riusare. Si definisce con \`def\`, riceve dei **parametri** e con \`return\` restituisce un risultato:

\`\`\`
def e_privato(ip):
    return ip.startswith("10.") or ip.startswith("192.168.")

for ip in ["10.0.0.7", "8.8.8.8"]:
    print(ip, e_privato(ip))
\`\`\`

Stampa \`10.0.0.7 True\` e \`8.8.8.8 False\`. Una funzione rende il codice più leggibile e permette di correggere un errore in un punto solo.

I parametri possono avere un valore **predefinito**: \`def allarme(n, soglia=10):\` si può chiamare come \`allarme(12)\` o \`allarme(12, soglia=5)\`.

!! \`return\` fa uscire subito dalla funzione. Una funzione senza \`return\` restituisce \`None\`.`,
        },
        {
          kind: 'task',
          title: 'La gravità',
          body: `In \`py/cvss.py\` la funzione \`gravita\` restituisce sempre \`"?"\`. Completala secondo la scala ufficiale CVSS:
- da 9.0 a 10 → \`"critica"\`
- da 7.0 a 8.9 → \`"alta"\`
- da 4.0 a 6.9 → \`"media"\`
- da 0.1 a 3.9 → \`"bassa"\`
- 0.0 → \`"nessuna"\`

Poi esegui \`python3 py/cvss.py\`: ogni riga deve mostrare il punteggio e la gravità giusta.`,
          objective: 'Completa la funzione gravita in py/cvss.py.',
          hints: [
            'Una catena if / elif / else, dal valore più alto al più basso, con return in ogni ramo.',
            'if punteggio >= 9.0:\n    return "critica"\nelif punteggio >= 7.0:\n    return "alta"\n... e alla fine: elif punteggio > 0: return "bassa" / else: return "nessuna"',
          ],
          check: pyRun((ev) => ends(ev, 'py/cvss.py') && ev.out.join('|') === '9.8 critica|7.5 alta|5.3 media|2.1 bassa|0.0 nessuna|9.0 critica|7.0 alta|4.0 media'),
          success: `Nota l'ordine dei controlli: dal più alto al più basso, così ogni \`elif\` può limitarsi a "maggiore o uguale". I casi di confine (9.0, 7.0, 4.0) sono quelli dove si sbaglia più spesso: per questo li ho messi in fondo alla lista.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Cosa stampa questo codice?\n```\nporte = [22, 80, 443]\nfor p in porte:\n    if p == 80:\n        continue\n    print(p)\n```',
          options: ['22 80 443', '22 e 443, su due righe', 'solo 80', 'niente'],
          correct: 1,
          explain: `\`continue\` salta il resto del giro: quando \`p\` vale 80 il \`print\` non viene eseguito. Restano 22 e 443, uno per riga.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Il dizionario `d = {"admin": 3}`. Cosa succede con `d["root"]`?',
          options: ['Restituisce 0', 'Restituisce None', 'Errore KeyError: \'root\'', 'Crea la chiave root'],
          correct: 2,
          explain: `Una chiave che non esiste con le quadre dà **KeyError**. Per avere un valore di riserva senza errore si usa \`d.get("root", 0)\`.`,
        },
      ],
      recap: [
        ['if / elif / else', 'decidere; la riga finisce con : e il blocco è rientrato'],
        ['== != < > in and or not', 'confronti e logica'],
        ['[a, b] · lista[0] · append', 'liste: in ordine, si conta da 0'],
        ['for x in lista:', 'ripete per ogni elemento; break e continue'],
        ['{chiave: valore} · get · items()', 'dizionari'],
        ['def nome(param): return', 'funzioni riutilizzabili'],
      ],
    },

    // ------------------------------------------------------------------ PY.3
    {
      id: 'chPY-m3',
      title: 'Python contro i log',
      tagline: 'Leggere file, spezzare righe, contare con Counter, cercare con le espressioni regolari, sys.argv.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Aprire un file',
          body: `@rook: Ricordi il caso del bar di Mama, nel capitolo 4? L'hai risolto con una catena di grep, cut, sort e uniq. Ora lo rifai in Python: è il modo in cui si costruiscono strumenti che poi usa tutto il team.

Il modo giusto di leggere un file:

\`\`\`
with open("siem/dns.log") as f:
    for riga in f:
        riga = riga.strip()
        if "nightcity" in riga:
            print(riga)
\`\`\`

- \`open(percorso)\` apre il file in lettura
- \`with ... as f:\` lo **chiude da solo** alla fine del blocco, anche in caso di errore
- \`for riga in f\` legge una riga alla volta: funziona anche con file enormi
- ogni riga finisce con un a capo: \`strip()\` toglie spazi e a capo ai bordi

Per **scrivere** un file: \`open("risultato.txt", "w")\` (sovrascrive) o \`"a"\` (aggiunge in fondo), poi \`f.write("testo\\n")\`.

Per spezzare una riga: \`riga.split()\` la divide sugli spazi e restituisce una lista. \`riga.split(",")\` la divide sulle virgole.

\`\`\`
"Nov 12 02:02:10 server sshd[1202]: Failed".split()
# ['Nov', '12', '02:02:10', 'server', 'sshd[1202]:', 'Failed']
\`\`\``,
        },
        {
          kind: 'task',
          title: 'Quanti tentativi?',
          body: `Scrivi uno script \`py/falliti.py\` che legge \`caso/auth.log\` e conta le righe che contengono \`Failed password\`, poi stampa il totale.

Ti serve una variabile che parte da 0 e cresce di 1 (\`conta += 1\`) a ogni riga trovata.`,
          objective: 'Conta in Python i login falliti di caso/auth.log.',
          hints: [
            'conta = 0, poi with open(...) as f: e un for su ogni riga con un if.',
            'conta = 0\nwith open("caso/auth.log") as f:\n    for riga in f:\n        if "Failed password" in riga:\n            conta += 1\nprint(conta)',
          ],
          check: pyRun((ev) => ends(ev, 'py/falliti.py') && ev.src.includes('open') && ev.out.some((l) => /\b40\b/.test(l))),
          success: `**40**, lo stesso numero che avevi ottenuto con \`grep | wc -l\`. Più lungo da scrivere, certo. Ma ora puoi aggiungere quello che grep non sa fare: ricordare, confrontare, decidere.`,
        },
        {
          kind: 'lesson',
          title: 'Contare con Counter',
          body: `Contare "quante volte compare ogni cosa" è il lavoro più comune dell'analista. Python ha uno strumento apposta, \`Counter\`, nel modulo \`collections\`. Un modulo si carica con \`import\`:

\`\`\`
from collections import Counter

utenti = Counter()
with open("caso/auth.log") as f:
    for riga in f:
        if "Accepted" in riga:
            parti = riga.split()
            utente = parti[parti.index("for") + 1]
            utenti[utente] += 1

for nome, n in utenti.most_common(3):
    print(f"{nome:<10} {n}")
\`\`\`

- \`Counter()\` è un dizionario in cui le chiavi mancanti valgono 0: \`utenti[x] += 1\` funziona sempre
- \`parti.index("for")\` trova la posizione di una parola: la parola dopo è l'utente. È più robusto di contare i campi a mano, perché non dipende da quante parole ci sono prima
- \`most_common(3)\` restituisce le 3 voci più frequenti, come \`sort | uniq -c | sort -rn | head -n 3\`
- \`{nome:<10}\` allinea a sinistra su 10 caratteri: una tabella leggibile`,
        },
        {
          kind: 'task',
          title: 'Chi bussa più forte?',
          body: `Scrivi \`py/top_ip.py\`: conta i login falliti di \`caso/auth.log\` **per indirizzo IP** con un \`Counter\` e stampa i primi tre.

L'IP sta subito dopo la parola \`from\`. Eseguilo e invia con \`flag\` l'IP più attivo.`,
          objective: 'Trova con Python l\'IP con più login falliti e invialo.',
          hints: [
            'Come l\'esempio con Counter, ma con "Failed password" e la parola dopo "from".',
            'ip = parti[parti.index("from") + 1] e alla fine for ip, n in conta.most_common(3): print(ip, n). Poi flag 203.0.113.77',
          ],
          answer: ['203.0.113.77'],
          success: `**203.0.113.77**, lo stesso attaccante del capitolo 4. Ora però hai uno strumento: cambia il nome del file e funziona su qualsiasi log SSH.`,
        },
        {
          kind: 'lesson',
          title: 'Espressioni regolari e argomenti',
          body: `Quando il dato non sta sempre nella stessa posizione, si cerca per **forma** con le espressioni regolari, modulo \`re\` (le stesse regole che hai usato con grep):

\`\`\`
import re
riga = "Connessione da 10.0.0.7 verso 8.8.8.8 porta 53"
print(re.findall(r"\\d+\\.\\d+\\.\\d+\\.\\d+", riga))
# ['10.0.0.7', '8.8.8.8']
\`\`\`

- \`r"..."\` è una stringa "grezza": le barre \`\\\` restano barre, comodo per le regex
- \`\\d+\` = una o più cifre, \`\\.\` = un punto vero
- \`re.findall\` restituisce **tutte** le corrispondenze in una lista; \`re.search\` solo la prima (o \`None\`)

Un **insieme** (\`set\`) è come una lista ma senza doppioni: \`set(["a", "b", "a"])\` contiene due elementi. Perfetto per contare i valori **distinti**.

Per rendere uno script riutilizzabile, il nome del file non si scrive dentro ma si passa da fuori: \`python3 script.py web/access.log\`. Dentro lo script lo leggi da \`sys.argv\`, la lista degli argomenti: \`sys.argv[0]\` è il nome dello script, \`sys.argv[1]\` il primo argomento.

\`\`\`
import sys
if len(sys.argv) < 2:
    print("uso: python3 conta.py FILE")
    sys.exit(1)
nome = sys.argv[1]
\`\`\``,
        },
        {
          kind: 'task',
          title: 'Uno strumento vero',
          body: `Scrivi \`py/ip_unici.py\`: prende il nome di un file come **argomento**, estrae con \`re.findall\` tutti gli indirizzi IP che contiene, e stampa quanti IP **distinti** ci sono.

Provalo sul log del negozio di Judy:

\`\`\`
python3 py/ip_unici.py web/negozio.log
\`\`\``,
          objective: 'Scrivi py/ip_unici.py e usalo su web/negozio.log.',
          hints: [
            'import re e sys; leggi tutto il file con f.read(); re.findall con la regex degli IP; len(set(...)).',
            'import re, sys\nwith open(sys.argv[1]) as f:\n    testo = f.read()\nips = set(re.findall(r"\\d+\\.\\d+\\.\\d+\\.\\d+", testo))\nprint(len(ips))',
          ],
          check: pyRun((ev) => ends(ev, 'py/ip_unici.py') && ev.src.includes('sys.argv') && ev.args.some((a) => a.endsWith('negozio.log')) && ev.out.some((l) => /\b(6|5)\b/.test(l))),
          success: `Nel log ci sono 5 IP di visitatori, più \`169.254.169.254\`, che compare nel testo di una richiesta: la regex lo trova perché cerca la **forma**, ovunque sia. Se ti è venuto 6, è giusto così; se ti è venuto 5, hai cercato solo nel primo campo. Saper spiegare la differenza è esattamente ciò che si chiede a un analista.

Ora hai uno strumento che funziona su **qualsiasi** file: prova \`python3 py/ip_unici.py ir/web.log\`.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Perché si apre un file con `with open(...) as f:` invece di `f = open(...)`?',
          options: [
            'Perché è più veloce',
            'Perché il file viene chiuso automaticamente alla fine del blocco, anche in caso di errore',
            'Perché permette di leggere file più grandi',
            'Perché senza with non si può leggere riga per riga',
          ],
          correct: 1,
          explain: `\`with\` garantisce la chiusura del file in ogni caso. Con \`open\` da solo, se lo script si ferma per un errore, il file resta aperto (e quello che stavi scrivendo può andare perso).`,
        },
      ],
      recap: [
        ['with open(p) as f: / for riga in f', 'leggere un file riga per riga, chiuso in automatico'],
        ['strip() · split()', 'pulire e spezzare una riga'],
        ['Counter() · most_common(n)', 'contare e classificare'],
        ['re.findall(r"...", testo)', 'tutte le corrispondenze di una regex'],
        ['set(...)', 'valori distinti'],
        ['sys.argv[1]', 'il primo argomento passato allo script'],
      ],
    },

    // ------------------------------------------------------------------ PY.4
    {
      id: 'chPY-m4',
      title: 'Gli attrezzi del difensore',
      tagline: 'Impronte con hashlib, cartelle con os, JSON delle configurazioni cloud e errori gestiti con try/except.',
      xp: 300,
      steps: [
        {
          kind: 'lesson',
          title: 'Impronte e cartelle',
          body: `@nyx: Tre attrezzi che userai per sempre. Il primo: verificare l'integrità di tanti file in un colpo.

\`hashlib\` calcola le impronte. Lavora sui **byte**, non sul testo: per questo il file si apre in modalità \`"rb"\` (*read binary*), oppure un testo si converte con \`.encode()\`.

\`\`\`
import hashlib
print(hashlib.sha256("ciao".encode()).hexdigest())

with open("missioni/benvenuto.txt", "rb") as f:
    print(hashlib.sha256(f.read()).hexdigest())
\`\`\`

Il risultato coincide con \`sha256sum\`. Il modulo \`os\` lavora con le cartelle:

\`\`\`
import os
for nome in os.listdir("forense/estratti"):
    percorso = os.path.join("forense/estratti", nome)
    print(nome, os.path.isfile(percorso))
\`\`\`

- \`os.listdir(cartella)\` elenca i nomi contenuti
- \`os.path.join(a, b)\` unisce pezzi di percorso con la \`/\` giusta
- \`os.path.exists\`, \`isfile\`, \`isdir\` controllano cosa c'è`,
        },
        {
          kind: 'task',
          title: 'Il firmware manomesso',
          body: `Un fornitore ha consegnato tre aggiornamenti firmware in \`py/aggiornamenti/\`, con l'elenco delle impronte ufficiali in \`py/manifesto.txt\` (formato: impronta, due spazi, nome).

Scrivi \`py/verifica.py\` che, per ogni riga del manifesto, calcola l'impronta del file e stampa \`OK\` oppure \`MANOMESSO\` accanto al nome.`,
          objective: 'Scrivi py/verifica.py e trova il firmware manomesso.',
          hints: [
            'Per ogni riga del manifesto: atteso, nome = riga.split(); poi apri py/aggiornamenti/nome in "rb" e confronta hexdigest() con atteso.',
            'import hashlib\nwith open("py/manifesto.txt") as m:\n    for riga in m:\n        atteso, nome = riga.split()\n        with open("py/aggiornamenti/" + nome, "rb") as f:\n            vero = hashlib.sha256(f.read()).hexdigest()\n        print(nome, "OK" if vero == atteso else "MANOMESSO")',
          ],
          check: pyRun((ev) => ends(ev, 'py/verifica.py') && ev.src.includes('hashlib') && ev.out.some((l) => /camera\.bin/.test(l) && /MANOMESSO/i.test(l)) && !ev.out.some((l) => /router\.bin/.test(l) && /MANOMESSO/i.test(l))),
          success: `**camera.bin** non coincide: quel file non è quello pubblicato dal fornitore. Non si installa, si avvisa il fornitore e si conserva come prova.

Nota la forma \`"OK" if vero == atteso else "MANOMESSO"\`: un **if in una riga**, che sceglie tra due valori. Lo stesso controllo di \`sha256sum -c\`, ma ora puoi aggiungerci quello che vuoi: un report, un'email, un controllo su mille file.`,
        },
        {
          kind: 'lesson',
          title: 'JSON',
          body: `**JSON** è il formato in cui parlano quasi tutti i servizi moderni: API, configurazioni cloud, log dei SIEM. Somiglia moltissimo a liste e dizionari di Python, e il modulo \`json\` li converte:

\`\`\`
import json
testo = '{"utente": "mama", "ruoli": ["admin", "cassa"], "mfa": false}'
dati = json.loads(testo)        # da testo JSON a dizionario
print(dati["utente"], dati["mfa"], len(dati["ruoli"]))
print(json.dumps(dati, indent=2))  # da dizionario a testo JSON leggibile
\`\`\`

Da un file: \`json.load(f)\` (senza la s) legge direttamente da un file aperto. Nota le differenze: in JSON \`true\`, \`false\`, \`null\`; in Python \`True\`, \`False\`, \`None\`.`,
        },
        {
          kind: 'task',
          title: 'Gli storage aperti',
          body: `Neon Ottica ti ha esportato le regole di **tutti** i suoi storage cloud in \`py/storage.json\`: una lista di oggetti con \`"nome"\` e \`"lettori"\`. Uno storage è pubblico se tra i lettori c'è \`"*"\` (chiunque).

Scrivi \`py/pubblici.py\` che stampa il nome di **ogni** storage pubblico.`,
          objective: 'Elenca con Python gli storage leggibili da chiunque.',
          hints: [
            'json.load(f) ti dà una lista: un for su ogni elemento, e un if "*" in s["lettori"].',
            'import json\nwith open("py/storage.json") as f:\n    elenco = json.load(f)\nfor s in elenco:\n    if "*" in s["lettori"]:\n        print(s["nome"])',
          ],
          check: pyRun((ev) => ends(ev, 'py/pubblici.py') && ev.src.includes('json') && ev.out.some((l) => l.includes('neon-promo-2077')) && ev.out.some((l) => l.includes('neon-backup-clienti')) && !ev.out.some((l) => l.includes('neon-fatture'))),
          success: `Due storage pubblici. Il primo, le immagini promozionali, è pubblico **apposta**: va bene. Il secondo, il **backup dei clienti**, è un incidente in attesa di accadere. Un controllo così, lanciato ogni notte su tutte le configurazioni, è il cuore degli strumenti di *Cloud Security Posture Management*.`,
        },
        {
          kind: 'lesson',
          title: 'Quando qualcosa va storto',
          body: `Uno script che gira su cento file non deve fermarsi al primo file mancante. Gli errori previsti si **gestiscono** con \`try\` / \`except\`:

\`\`\`
for nome in ["a.log", "manca.log", "/etc/shadow"]:
    try:
        with open(nome) as f:
            print(nome, len(f.readlines()), "righe")
    except FileNotFoundError:
        print(nome, "non trovato")
    except PermissionError:
        print(nome, "permesso negato")
\`\`\`

- il codice nel \`try\` viene eseguito normalmente
- se si verifica un errore del tipo indicato, Python salta all'\`except\` corrispondente invece di fermarsi
- \`except Exception as e:\` cattura qualsiasi errore e ne mette la descrizione in \`e\`

!! Non nascondere gli errori con un \`except\` vuoto: uno script che "non dà errori" ma non fa il suo lavoro è peggio di uno che si ferma. Gestisci solo gli errori che sai come trattare, e **scrivi** cosa è successo.`,
        },
        {
          kind: 'task',
          title: 'Lo script che non cade',
          body: `In \`py/da_controllare.txt\` c'è un elenco di file, uno per riga. Alcuni non esistono, uno non è leggibile.

Scrivi \`py/controlla.py\` che, per ogni percorso dell'elenco, stampa il numero di righe del file oppure il motivo per cui non si può leggere, **senza mai fermarsi**.`,
          objective: 'Scrivi py/controlla.py con try/except, che arriva in fondo all\'elenco.',
          hints: [
            'Leggi l\'elenco, poi per ogni percorso (con strip()) un try con open e un except per FileNotFoundError e uno per PermissionError.',
            'with open("py/da_controllare.txt") as e:\n    for p in e:\n        p = p.strip()\n        try:\n            with open(p) as f:\n                print(p, len(f.readlines()))\n        except FileNotFoundError:\n            print(p, "non trovato")\n        except PermissionError:\n            print(p, "permesso negato")',
          ],
          check: pyRun((ev) => ends(ev, 'py/controlla.py') && /except/.test(ev.src) && ev.out.length >= 5 && ev.out.some((l) => l.includes('shadow'))),
          success: `Lo script arriva in fondo: due file letti, due mancanti, uno protetto. Ogni caso è **detto**, non nascosto. È la differenza tra uno script fatto per sé e uno strumento che si può dare a un collega.`,
        },
        {
          kind: 'lesson',
          title: 'E adesso?',
          body: `@nyx: Con questo capitolo hai le basi che si chiedono a un junior: leggere e scrivere script, lavorare su file e log, contare, cercare, verificare.

Come continuare, fuori dal deck:
- installa Python sul tuo computer (python.org, o già presente su Linux e macOS) e rifai questi esercizi su file veri
- impara a usare **pip** e gli ambienti virtuali (\`python3 -m venv\`): ti servono per installare librerie
- librerie da conoscere per nome: **requests** (parlare con API web), **scapy** (pacchetti di rete), **paramiko** (SSH), **pandas** (tabelle di dati)
- un esercizio che vale un colloquio: uno script che legge un log di autenticazione e produce un report con gli IP da bloccare, e lo pubblichi su GitHub

?? Nei colloqui per analista spesso chiedono di leggere uno script e dire cosa fa. Leggere codice altrui è un'abilità a parte: allenala aprendo script di strumenti open source e chiedendoti, riga per riga, cosa succede.`,
        },
        {
          kind: 'quiz',
          title: 'Verifica',
          question: 'Perché per calcolare lo SHA-256 di un file lo si apre con `open(nome, "rb")`?',
          options: [
            'Perché "rb" è più veloce',
            'Perché hashlib lavora sui byte, e "rb" legge il file come byte grezzi',
            'Perché altrimenti il file viene modificato',
            'Perché "r" funziona solo con i file piccoli',
          ],
          correct: 1,
          explain: `Le impronte si calcolano sui **byte**. "rb" restituisce i byte così come sono sul disco; un testo letto con "r" andrebbe prima convertito con \`.encode()\`.`,
        },
      ],
      recap: [
        ['hashlib.sha256(b).hexdigest()', 'impronta di byte; file aperti con "rb"'],
        ['os.listdir · os.path.join', 'cartelle e percorsi'],
        ['json.load / json.loads', 'da JSON a liste e dizionari'],
        ['"A" if cond else "B"', 'scelta in una riga'],
        ['try / except Tipo:', 'gestire gli errori previsti senza fermarsi'],
        ['pip, venv, requests, scapy', 'cosa imparare dopo, sul tuo computer'],
      ],
    },
  ],
};
